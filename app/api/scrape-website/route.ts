import { NextRequest, NextResponse } from "next/server";

const CRAWL4AI_BASE = process.env.CRAWL4AI_SERVICE_URL ?? "http://crawl4ai-service:8000";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      data: {
        title: "",
        content: markdown,
        description: "",
        markdown,
        html: "",
        metadata: { sourceURL: url, statusCode: 200 },
        screenshot: null,
        links: [],
      },
    });
  } catch (error) {
    console.error("Error scraping website:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape website",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
