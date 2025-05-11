// lib/feeds.ts

/**
 * An array of RSS feed URLs.
 * Used by both /api/rss/latest and /api/rss/top.
 * Includes only Indian and international sources.
 */
export const FEEDS: string[] = [
  // International news sources
  "https://feeds.bbci.co.uk/news/world/rss.xml", // BBC World
  "https://feeds.bbci.co.uk/news/world/asia/rss.xml", // BBC Asia
  "https://www.aljazeera.com/xml/rss/all.xml", // Al Jazeera All News
  "https://rss.cnn.com/rss/edition_world.rss", // CNN World
  "https://www.theguardian.com/world/rss", // The Guardian World
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", // New York Times World

  // Indian news sources
  "https://feeds.feedburner.com/ndtvnews-world-news", // NDTV World News
  "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", // Times of India Top Stories
  "https://feeds.hindustantimes.com/HT-HomePage-TopStories", // Hindustan Times Top Stories
  "https://indianexpress.com/section/world/feed/", // Indian Express World
  "https://www.thehindu.com/feeder/default.rss", // The Hindu (all)
];
