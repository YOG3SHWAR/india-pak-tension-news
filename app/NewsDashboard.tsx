"use client";

import { useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import dynamic from "next/dynamic";

// RSS item type
export type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  enclosure?: { url: string };
  contentSnippet?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const AdUnit = dynamic(() => import("@/components/AdUnit"), { ssr: false });

function NewsItemCard({ item, idx }: { item: RssItem; idx: number }) {
  const [imgError, setImgError] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const domain = item.link
    ? new URL(item.link).hostname.replace(/^www\./, "")
    : "";

  const hasValidImage =
    typeof item.enclosure?.url === "string" &&
    (item.enclosure.url.startsWith("http://") ||
      item.enclosure.url.startsWith("https://"));

  // If no feed image or it errors, fetch top image from Google API
  useEffect(() => {
    if (!hasValidImage || imgError) {
      const query = encodeURIComponent(item.title);
      fetch(`/api/image-search?query=${query}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.url) setFallbackUrl(data.url);
        })
        .catch((_) => {
          setFallbackUrl(null);
        });
    }
  }, [hasValidImage, imgError, item.title]);

  return (
    <article className="bg-white bg-opacity-80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl border-4 border-dashed border-yellow-200 flex flex-col h-full">
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="font-serif text-2xl text-green-800 hover:text-green-600 transition-colors"
      >
        {item.title}
      </a>

      <p className="text-xs text-gray-600 mt-1 italic">
        {new Date(item.pubDate).toLocaleDateString(undefined, {
          day: 'numeric', month: 'short', year: 'numeric'
        })}
      </p>

      {/* Image container: feed image > fallback search image > placeholder */}
      {hasValidImage && !imgError ? (
        <img
          src={item.enclosure!.url}
          alt={item.title}
          className="w-full h-56 object-cover rounded-2xl mt-4 border-2 border-green-100"
          onError={() => setImgError(true)}
        />
      ) : fallbackUrl ? (
        <img
          src={fallbackUrl}
          alt={item.title}
          className="w-full h-56 object-cover rounded-2xl mt-4 border-2 border-green-100"
        />
      ) : (
        <div className="w-full h-56 bg-green-50 rounded-2xl mt-4 flex items-center justify-center">
          <span className="text-green-300">No image available</span>
        </div>
      )}

      <p className="mt-4 text-gray-700 flex-1 font-serif">
        {item.contentSnippet}
      </p>

      <button
        onClick={() =>
          window.open(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              item.title
            )}`,
            "_blank"
          )
        }
        className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-600 text-white font-semibold py-3 rounded-full shadow-lg transform transition-transform duration-200 hover:-translate-y-1"
      >
        Check on YouTube
      </button>

      {idx > 0 && idx % 5 === 0 && (
        <div className="my-6">
          <AdUnit slot="9758479058" />
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">Source: {domain}</p>
    </article>
  );
}

export default function NewsDashboard() {
  const [activeTab, setActiveTab] = useState<"top" | "latest">("top");
  const endpoint = activeTab === "top" ? "/api/rss/top" : "/api/rss/latest";

  const getKey = (pageIndex: number, prev: any) =>
    prev && !prev.hasMore ? null : `${endpoint}?page=${pageIndex + 1}&limit=10`;

  const { data, size, setSize } = useSWRInfinite(getKey, fetcher);

  useEffect(() => {
    setSize(1);
  }, [endpoint, setSize]);

  const pages = data || [];
  const items = pages.flatMap((p) => p.items as RssItem[]);
  const hasMore = !!data && data[data.length - 1].hasMore;
  const isLoadingMore =
    !data || (size > 0 && typeof data[size - 1] === "undefined");

  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 100 &&
        hasMore &&
        !isLoadingMore
      ) {
        setSize(size + 1);
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingMore, size, setSize]);

  return (
    <main className="relative min-h-screen p-8 bg-[url('/images/ghibli-bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-green-100/70 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <header className="mb-8 text-center">
          <h1 className="font-serif text-5xl text-emerald-800 drop-shadow-lg">
            📰 India–Pakistan Tension News
          </h1>
          <p className="text-lg text-emerald-700 italic mt-2">
            Everything you need to know!!
          </p>
        </header>

        <div className="sticky top-0 bg-green-100/80 backdrop-blur backdrop-saturate-150 z-10 flex justify-center space-x-4 py-4 rounded-full shadow-md">
          {(["top", "latest"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full transition-all duration-200 font-medium ${
                tab === activeTab
                  ? "bg-yellow-300 text-emerald-900 shadow-lg ring-2 ring-yellow-200"
                  : "bg-green-200 text-green-700 hover:bg-green-300"
              }
            `}
            >
              <span>{tab === "top" ? "🌟 Trending" : "🆕 Latest"}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10">
          {items.map((item, idx) => (
            <NewsItemCard key={item.link || idx} item={item} idx={idx} />
          ))}
        </div>

        <footer className="mt-12 text-center text-sm text-green-600 font-serif">
          Powered by your Studio Ghibli–inspired RSS feed
        </footer>
      </div>
    </main>
  );
}
