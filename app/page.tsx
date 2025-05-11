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
