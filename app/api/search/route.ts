import { NextRequest, NextResponse } from "next/server";

// NOTE: Crawl4AI is a scraper, not a web search engine.
// The Firecrawl /search endpoint (which queried a search index) has no direct
// equivalent in Crawl4AI. This route returns an empty result set so the rest
// of the app continues to function. To restore search, integrate a dedicated
// search API such as SerpAPI, Brave Search, or Tavily and call it here.

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.warn(
      "[search] Web search is not supported by the Crawl4AI backend. " +
        "Returning empty results. Integrate a search API (SerpAPI, Brave, Tavily) to enable this feature."
    );

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
