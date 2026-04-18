import asyncio
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="Crawl4AI Scraping Service")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Helper: build browser + run config with all 4 Cloudflare bypass layers
# ---------------------------------------------------------------------------

def _build_configs():
    from crawl4ai import BrowserConfig, CrawlerRunConfig, CacheMode

    proxy = os.getenv("RESIDENTIAL_PROXY_URL") or None  # Layer 3 (optional)

    # Layer 1 — stealth driver patches (navigator.webdriver, TLS fingerprints)
    browser_kwargs = dict(
        headless=True,
        enable_stealth=True,    # Layer 1: patches navigator.webdriver, browser fingerprints
    )
    if proxy:
        browser_kwargs["proxy"] = proxy  # Layer 3: residential proxy

    browser_config = BrowserConfig(**browser_kwargs)

    # Layer 2 — behavioral mimic (mouse movement, timing, JS challenge wait)
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        magic=True,              # Layer 2: behavioral mimic
        wait_until="networkidle",
        page_timeout=30000,
        delay_before_return_html=3.0,  # Layer 2: wait for JS challenges to resolve
    )

    return browser_config, run_config


# ---------------------------------------------------------------------------
# Layer 4 — CapSolver Turnstile bypass (conditional on CAPSOLVER_API_KEY)
#
# Activate by setting CAPSOLVER_API_KEY in your environment.
# Get a key at https://capsolver.com
#
# When enabled, CapSolver will solve Cloudflare Turnstile CAPTCHAs automatically.
# Uncomment the block below and install: pip install capsolver
#
# import capsolver
#
# async def _solve_turnstile(page_url: str, site_key: str) -> str:
#     capsolver.api_key = os.getenv("CAPSOLVER_API_KEY")
#     solution = capsolver.solve({
#         "type": "AntiCloudflareTask",
#         "websiteURL": page_url,
#         "websiteKey": site_key,
#     })
#     return solution.get("token", "")
#
# To wire it up:
# 1. Detect the Turnstile site key from the page (usually in a <div data-sitekey="...">)
# 2. Call _solve_turnstile(url, site_key) to get the token
# 3. Inject the token into the page via JavaScript before proceeding
# ---------------------------------------------------------------------------

_CAPSOLVER_ENABLED = bool(os.getenv("CAPSOLVER_API_KEY"))


# ---------------------------------------------------------------------------
# Scrape endpoint — returns markdown content
# ---------------------------------------------------------------------------

@app.get("/scrape")
async def scrape(url: str):
    """Scrape a URL and return its markdown content with Cloudflare bypass."""
    if not url:
        raise HTTPException(status_code=400, detail="url parameter is required")

    try:
        from crawl4ai import AsyncWebCrawler

        browser_config, run_config = _build_configs()

        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail="Crawl4AI failed to scrape the URL. The site may be heavily protected.",
            )

        markdown = (result.markdown or "").strip()
        if not markdown:
            raise HTTPException(
                status_code=500,
                detail="Crawl4AI failed to scrape the URL. The site may be heavily protected.",
            )

        return {"markdown": markdown}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Screenshot endpoint — returns base64 PNG data URL
# ---------------------------------------------------------------------------

@app.get("/screenshot")
async def screenshot(url: str):
    """Take a screenshot of a URL and return it as a base64 data URL."""
    if not url:
        raise HTTPException(status_code=400, detail="url parameter is required")

    try:
        from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

        browser_config, _ = _build_configs()

        # Override run config to request a screenshot
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            magic=True,
            wait_until="networkidle",
            page_timeout=30000,
            delay_before_return_html=3.0,
            screenshot=True,
        )

        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail="Crawl4AI failed to screenshot the URL. The site may be heavily protected.",
            )

        shot = result.screenshot
        if not shot:
            raise HTTPException(status_code=500, detail="No screenshot captured.")

        # crawl4ai returns raw base64; wrap in data URL for browser compatibility
        if not shot.startswith("data:"):
            shot = f"data:image/png;base64,{shot}"

        return {"screenshot": shot}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
