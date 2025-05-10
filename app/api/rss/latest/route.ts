// app/api/rss/latest/route.ts
import Parser from "rss-parser";
import { NextResponse } from "next/server";

const parser = new Parser();
const FEEDS = [
  // — your five Indian outlets —
  "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  "https://www.hindustantimes.com/feeds/rss/top-news/rssfeed.xml",
  "https://www.thehindu.com/feeder/default.rss",
  "https://indianexpress.com/section/india/feed/",
  "https://feeds.feedburner.com/ndtvnews-top-stories",

  // + ABC News International
  "http://feeds.abcnews.com/abcnews/internationalheadlines",
  // :contentReference[oaicite:0]{index=0}

  // + Reuters via Google News RSS (only India–Pakistan stories, site:reuters.com)
  "https://news.google.com/news?hl=en-IN&gl=IN&ceid=IN:en&q=India%20Pakistan%20site:reuters.com&output=rss",
  // :contentReference[oaicite:1]{index=1}

  // + Al Jazeera “All News”
  "https://www.aljazeera.com/xml/rss/all.xml",
  // :contentReference[oaicite:2]{index=2}
];

export async function GET() {
  // 1) fetch & flatten
  const allItems = (
    await Promise.all(
      FEEDS.map((url) => parser.parseURL(url).then((f) => f.items))
    )
  ).flat();

  // 2) dedupe
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  // 3) sort & slice
  deduped.sort(
    (a, b) =>
      new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
  );

  const filtered = deduped.filter((item) => {
    const txt = (
      (item.title || "") +
      " " +
      (item.contentSnippet || item.content || "")
    ).toLowerCase();
    return txt.includes("india") && txt.includes("pakistan");
  });

  const latest100 = filtered.slice(0, 100);

  // 4) return with 5-min cache
  return NextResponse.json(latest100, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
    },
  });
}
