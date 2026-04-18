import { NextRequest, NextResponse } from "next/server";

const CRAWL4AI_BASE = process.env.CRAWL4AI_SERVICE_URL ?? "http://crawl4ai-service:8000";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(
      `${CRAWL4AI_BASE}/screenshot?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Crawl4AI failed to screenshot the URL. The site may be heavily protected.");
    }

    const { screenshot } = await response.json() as { screenshot: string };

    if (!screenshot) {
      throw new Error("Crawl4AI failed to screenshot the URL. The site may be heavily protected.");
    }

    return NextResponse.json({ success: true, screenshot, metadata: {} });
  } catch (error: unknown) {
    console.error("[scrape-screenshot] Screenshot capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
