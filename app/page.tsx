// app/page.tsx
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Optional: page-level metadata
export const metadata = {
  title: "India–Pakistan Tension News",
  description: "Latest & top India–Pakistan tension headlines from RSS feeds",
};

// Dynamically import the client component without SSR
const NewsDashboard = dynamic(() => import("@/app/NewsDashboard"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading news…</div>}>
      <NewsDashboard />
    </Suspense>
  );
}
