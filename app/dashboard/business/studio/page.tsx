import { Suspense } from "react";
import { StudioPageClient } from "@/components/studio/StudioPageClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BusinessStudioPage() {
  return (
    <Suspense
      fallback={
        <Skeleton className="flex h-[min(70vh,560px)] w-full rounded-lg" />
      }
    >
      <StudioPageClient />
    </Suspense>
  );
}
