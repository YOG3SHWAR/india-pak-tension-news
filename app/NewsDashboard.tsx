// components/NewsDashboard.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import dynamic from "next/dynamic";

// RSS item type
type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  enclosure?: { url: string };
  contentSnippet?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const AdUnit = dynamic(() => import("@/components/AdUnit"), { ssr: false });

interface NewsItemCardProps {
  item: RssItem;
  idx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function NewsItemCard({ item, idx }: NewsItemCardProps) {
  const domain = item.link
    ? new URL(item.link).hostname.replace(/^www\./, "")
    : "";
  const imageSrc = item.enclosure?.url || null;

  // format publication time: hours ago if <24h, else full date/time
  const pubDateObj = new Date(item.pubDate);
  const now = Date.now();
  const diffMs = now - pubDateObj.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const displayTime =
    diffHours < 24
      ? `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
      : pubDateObj.toLocaleString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        });

  const params = useSearchParams();
  const tab = params.get("tab") || "top";
  const page = params.get("page") || "1";
  const base = window.location.origin + window.location.pathname;
  const anchor = `card-${encodeURIComponent(item.link)}`;
  const shareUrl = `${base}?tab=${tab}&page=${page}#${anchor}`;

  return (
    <article
      id={anchor}
      className="bg-white bg-opacity-80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border-2 border-yellow-200 flex flex-col h-full font-serif"
    >
      <h2 className="text-2xl text-green-800 mb-2">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {item.title}
        </a>
      </h2>
      <p className="text-xs text-gray-600 italic mb-4">{displayTime}</p>

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={item.title}
          className="w-full h-56 object-cover rounded-xl mt-1 border-2 border-green-100 shadow-md"
        />
      ) : (
        <div className="w-full h-56 bg-green-50 rounded-xl mt-1 flex items-center justify-center shadow-inner">
          <span className="text-green-300">No image available</span>
        </div>
      )}

      <p className="mt-4 text-gray-700 flex-1">{item.contentSnippet}</p>

      <div className="mt-5 flex items-center space-x-3">
        <button
          onClick={() =>
            window.open(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(
                item.title
              )}`,
              "_blank"
            )
          }
          className="w-3/4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-600 text-white font-semibold py-3 rounded-full shadow-lg transition duration-200 hover:-translate-y-1"
        >
          Check on YouTube
        </button>
        <button
          onClick={() => {
            if (navigator.canShare?.({ text: item.title + " " + shareUrl })) {
              navigator.share({
                title: item.title,
                text: item.title + " " + shareUrl,
              });
            } else {
              window.open(
                `https://wa.me/?text=${encodeURIComponent(
                  item.title + " " + shareUrl
                )}`,
                "_blank"
              );
            }
          }}
          className="w-1/4 inline-flex items-center justify-center bg-gradient-to-r from-green-300 to-green-500 hover:from-green-400 hover:to-green-600 text-white p-3 rounded-full shadow-lg transition duration-200 hover:-translate-y-1"
        >
          <img src="/images/share.svg" alt="Share" className="w-6 h-6" />
        </button>
      </div>

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
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab") === "latest" ? "latest" : "top";
  const pageParam = Math.max(1, parseInt(params.get("page") || "1"));
  const [activeTab, setActiveTab] = useState<"top" | "latest">(initialTab);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const cardRefs = useRef<
    Record<string, React.RefObject<HTMLDivElement | null>>
  >({});

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#card-")) {
      const link = decodeURIComponent(hash.replace("#card-", ""));
      setSelectedLink(link);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    url.searchParams.set("page", pageParam.toString());
    router.replace(url.toString());
  }, [activeTab, pageParam, router]);

  const endpoint = activeTab === "top" ? "/api/rss/top" : "/api/rss/latest";
  const getKey = (pageIndex: number, prev: any) =>
    prev && !prev.hasMore ? null : `${endpoint}?page=${pageIndex + 1}&limit=10`;

  const { data, size, setSize } = useSWRInfinite(getKey, fetcher);
  const pages = data || [];
  const items = pages.flatMap((p) => p.items as RssItem[]);
  const hasMore = !!data && data[data.length - 1].hasMore;
  const isLoadingMore =
    !data || (size > 0 && typeof data[size - 1] === "undefined");

  useEffect(() => {
    setSize(pageParam);
  }, [endpoint, pageParam, setSize]);

  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 100 &&
        hasMore &&
        !isLoadingMore
      ) {
        setSize((s) => s + 1);
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingMore, setSize]);

  if (selectedLink) {
    const article = items.find((item) => item.link === selectedLink);
    return article ? (
      <main className="relative min-h-screen p-8 bg-[url('/images/ghibli-bg.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-green-100/70 backdrop-blur-sm" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <button
            onClick={() => {
              setSelectedLink(null);
              window.history.pushState({}, "", window.location.pathname);
            }}
            className="mb-4 text-blue-500 hover:underline"
          >
            ← Back to list
          </button>
          <NewsItemCard
            item={article}
            idx={0}
            containerRef={cardRefs.current[article.link]!}
          />
        </div>
      </main>
    ) : (
      <p className="p-6">Loading article…</p>
    );
  }

  return (
    <main className="relative min-h-screen p-8 bg-[url('/images/ghibli-bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-green-100/70 backdrop-blur-sm" />
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
              className={`px-6 py-2 rounded-full transition-all duration-200 font-serif ${
                tab === activeTab
                  ? "bg-yellow-300 text-emerald-900 shadow-lg ring-2 ring-yellow-200"
                  : "bg-green-200 text-green-800 hover:bg-green-300"
              }`}
            >
              <span>{tab === "top" ? "🌟 Trending" : "🆕 Latest"}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10">
          {items.map((item, idx) => (
            <NewsItemCard
              key={item.link || idx}
              item={item}
              idx={idx}
              containerRef={cardRefs.current[item.link]!}
            />
          ))}
        </div>
        {isLoadingMore && (
          <div className="w-full text-center py-6 text-gray-700 font-semibold">
            Loading more...
          </div>
        )}
        <footer className="mt-12 text-center text-sm text-green-600 font-serif">
          Made with ❤️ and Studio Ghibli magic
        </footer>
      </div>
    </main>
  );
}
