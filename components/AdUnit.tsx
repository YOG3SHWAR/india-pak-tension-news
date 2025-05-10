// components/AdUnit.tsx
"use client";

import { useEffect } from "react";

interface AdUnitProps {
  slot: string; // your Ad Slot ID, e.g. "1234567890"
  format?: string; // e.g. "auto"
  responsive?: boolean;
}

export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
}: AdUnitProps) {
  useEffect(() => {
    // push a new ad slot to the global adsbygoogle queue
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [slot]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
