// app/page.tsx
import { Suspense } from "react";
import NewsDashboard from "@/app/NewsDashboard";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading news…</div>}>
      <NewsDashboard />
    </Suspense>
  );
}

// Optional: page-level metadata
export const metadata = {
  title: "India–Pakistan Tension News",
  description: "Latest & top India–Pakistan tension headlines from RSS feeds",
};
