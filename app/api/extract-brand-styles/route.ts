import { NextRequest, NextResponse } from "next/server";

const CRAWL4AI_BASE = process.env.CRAWL4AI_SERVICE_URL ?? "http://crawl4ai-service:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    console.log("[extract-brand-styles] Scraping brand content for:", url);

    const response = await fetch(
      `${CRAWL4AI_BASE}/scrape?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Crawl4AI failed to scrape the URL. The site may be heavily protected.");
    }

    const { markdown } = await response.json() as { markdown: string };

    if (!markdown) {
      throw new Error("Crawl4AI failed to scrape the URL. The site may be heavily protected.");
    }

    console.log("[extract-brand-styles] Successfully scraped brand content");

    return NextResponse.json({
      success: true,
      url,
      styleName: url,
      guidelines: { content: markdown },
    });
  } catch (error) {
    console.error("[extract-brand-styles] Error occurred:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract brand styles",
      },
      { status: 500 }
    );
  }
}
