import { NextRequest, NextResponse } from "next/server";

const CRAWL4AI_BASE = process.env.CRAWL4AI_SERVICE_URL ?? "http://crawl4ai-service:8000";

function sanitizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00AB\u00BB]/g, '"')
    .replace(/[\u2039\u203A]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0]/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    console.log("[scrape-url-enhanced] Scraping with Crawl4AI:", url);

    // Fetch markdown and screenshot in parallel
    const [scrapeRes, screenshotRes] = await Promise.allSettled([
      fetch(`${CRAWL4AI_BASE}/scrape?url=${encodeURIComponent(url)}`),
      fetch(`${CRAWL4AI_BASE}/screenshot?url=${encodeURIComponent(url)}`),
    ]);

    if (scrapeRes.status === "rejected" || !scrapeRes.value.ok) {
      const detail =
        scrapeRes.status === "rejected"
          ? scrapeRes.reason?.message
          : await scrapeRes.value.text();
      throw new Error(detail || "Crawl4AI failed to scrape the URL. The site may be heavily protected.");
    }

    const { markdown } = await scrapeRes.value.json() as { markdown: string };

    if (!markdown) {
      throw new Error("Crawl4AI failed to scrape the URL. The site may be heavily protected.");
    }

    let screenshotUrl: string | null = null;
    if (screenshotRes.status === "fulfilled" && screenshotRes.value.ok) {
      const screenshotData = await screenshotRes.value.json() as { screenshot?: string };
      screenshotUrl = screenshotData.screenshot ?? null;
    }

    const sanitizedMarkdown = sanitizeQuotes(markdown);

    const formattedContent = `URL: ${url}\n\nMain Content:\n${sanitizedMarkdown}`.trim();

    return NextResponse.json({
      success: true,
      url,
      content: formattedContent,
      screenshot: screenshotUrl,
      structured: {
        title: "",
        description: "",
        content: sanitizedMarkdown,
        url,
        screenshot: screenshotUrl,
      },
      metadata: {
        scraper: "crawl4ai-enhanced",
        timestamp: new Date().toISOString(),
        contentLength: formattedContent.length,
      },
      message: "URL scraped successfully with Crawl4AI (Cloudflare bypass enabled)",
    });
  } catch (error) {
    console.error("[scrape-url-enhanced] Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
