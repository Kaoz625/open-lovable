# CHANGES.md — Open Lovable: Firecrawl → Crawl4AI Migration

## Overview

This document records every change made to the Open Lovable repository to replace
Firecrawl with [Crawl4AI](https://github.com/unclecode/crawl4ai) as the scraping backend
and wrap the whole stack in Docker for portable local deployment.

---

## Files Changed

### API routes — Firecrawl removed, Crawl4AI wired in

| File | Change |
|------|--------|
| `app/api/scrape-website/route.ts` | Removed `FirecrawlApp` import and SDK call. Now calls `GET http://crawl4ai-service:8000/scrape?url=`. |
| `app/api/scrape-screenshot/route.ts` | Removed `FirecrawlApp` import. Now calls `GET http://crawl4ai-service:8000/screenshot?url=`. |
| `app/api/extract-brand-styles/route.ts` | Removed direct `https://api.firecrawl.dev/v2/scrape` fetch. Now calls Crawl4AI `/scrape`. Note: Firecrawl's `branding` format (colors, fonts) has no equivalent in Crawl4AI — the endpoint returns the scraped markdown content instead. |
| `app/api/scrape-url-enhanced/route.ts` | Removed direct `https://api.firecrawl.dev/v1/scrape` fetch. Now calls Crawl4AI `/scrape` and `/screenshot` in parallel. |
| `app/api/search/route.ts` | Removed Firecrawl `/v1/search` call. **Crawl4AI is a scraper, not a search engine.** The endpoint now returns an empty array with a console warning. To restore search, integrate SerpAPI, Brave Search, or Tavily here. |

### New infrastructure files

| File | Purpose |
|------|---------|
| `crawl4ai-service/main.py` | FastAPI microservice exposing `/health`, `/scrape`, and `/screenshot` with all 4 Cloudflare bypass layers. |
| `crawl4ai-service/requirements.txt` | Python dependencies: crawl4ai, fastapi, uvicorn, playwright, capsolver. |
| `crawl4ai-service/Dockerfile` | Python 3.11-slim image; installs Playwright + Chromium via `playwright install chromium --with-deps`. |
| `docker-compose.yml` | Wires `open-lovable` (port 3000) and `crawl4ai-service` (port 8000) with health-check dependency. |
| `Dockerfile` | Multi-stage Node 18-alpine image for the Next.js app. |
| `.env.example` | Updated: removed `FIRECRAWL_API_KEY`, added `CRAWL4AI_SERVICE_URL`, `RESIDENTIAL_PROXY_URL`, `CAPSOLVER_API_KEY`. |

---

## The Firecrawl → Crawl4AI Swap

**Before:** five Next.js API routes imported `@mendable/firecrawl-js` or called
`https://api.firecrawl.dev/` directly, all requiring a paid `FIRECRAWL_API_KEY`.

**After:** all scraping goes through the `crawl4ai-service` Python microservice, which
runs locally in Docker. No external API key is needed for scraping.

The response contract is kept compatible: routes that previously returned
`{ markdown: string }` still return `{ markdown: string }`. Callers are unchanged.

---

## The Four Cloudflare Bypass Layers

| Layer | What it does | How to activate |
|-------|-------------|-----------------|
| **1 — Stealth driver** | Patches `navigator.webdriver`, TLS fingerprints, and browser headers so the browser looks like a normal user. | Always on. Configured via `BrowserConfig(use_stealth=True, use_undetected=True)`. |
| **2 — Behavioral mimic** | Simulates realistic mouse movements and timing; waits for JS challenges (like `/__cf_chl_rt_tk=`) to resolve before returning HTML. | Always on. Configured via `CrawlerRunConfig(magic=True, delay_before_return_html=3.0)`. |
| **3 — Residential proxy** | Routes traffic through a real residential IP address, bypassing IP-reputation blocks. | Optional. Set `RESIDENTIAL_PROXY_URL=http://user:pass@host:port` in `.env`. |
| **4 — CapSolver CAPTCHA** | Solves Cloudflare Turnstile CAPTCHAs automatically via the CapSolver API. | Optional. Set `CAPSOLVER_API_KEY=your_key` in `.env`. Code is present in `crawl4ai-service/main.py` as a commented-out block, auto-activates when the env var is set. |

---

## How to Add a Residential Proxy (Layer 3)

1. Sign up with a provider: [Bright Data](https://brightdata.com), [Oxylabs](https://oxylabs.io), [Smartproxy](https://smartproxy.com), or [IPRoyal](https://iproyal.com).
2. Obtain a proxy URL in the format `http://user:pass@host:port`.
3. Set it in `.env`:
   ```
   RESIDENTIAL_PROXY_URL=http://user:pass@proxy.example.com:12345
   ```
4. Restart Docker Compose — the `crawl4ai-service` reads it on startup.

---

## How to Enable CapSolver (Layer 4)

1. Create an account at [https://capsolver.com](https://capsolver.com).
2. Copy your API key.
3. Set it in `.env`:
   ```
   CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Uncomment the `_solve_turnstile` block in `crawl4ai-service/main.py` and wire it
   into the scrape/screenshot handlers where Turnstile is detected.
5. Restart Docker Compose.

---

## Running with Docker (recommended)

```bash
# 1. Copy env template
cp .env.example .env
# 2. Fill in your API keys (ANTHROPIC_API_KEY, E2B_API_KEY, etc.)
nano .env

# 3. Build both images
docker compose build

# 4. Start everything
docker compose up

# 5. Verify crawl4ai-service is healthy
curl http://localhost:8000/health
# → {"status":"ok"}

# 6. Test a scrape
curl "http://localhost:8000/scrape?url=https://example.com"
# → {"markdown":"# Example Domain ..."}

# 7. Open the app
open http://localhost:3000
```

---

## Running Locally Without Docker

```bash
# Terminal 1 — start the crawl4ai microservice
cd crawl4ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium --with-deps
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — start the Next.js app
cd ..
cp .env.example .env   # fill in your keys
# Set CRAWL4AI_SERVICE_URL=http://localhost:8000 in .env
npm install
npm run dev
```

---

## Known Limitations

- **Search endpoint (`/api/search`) returns empty results.** Crawl4AI has no search capability. To re-enable search, replace the stub in `app/api/search/route.ts` with a call to SerpAPI, Brave Search API, or Tavily.
- **Brand extraction (`/api/extract-brand-styles`) returns raw markdown** instead of structured color/font data. Firecrawl's proprietary `branding` format had no open-source equivalent. The AI prompt can still infer brand styles from the raw markdown content.
- **Screenshot quality** depends on Playwright's Chromium headless renderer, which may differ slightly from Firecrawl's managed screenshot infrastructure.
- **Crawl speed** — the `delay_before_return_html=3.0` setting adds ~3 s per scrape to let JS challenges resolve. Tune this down for non-Cloudflare sites.
