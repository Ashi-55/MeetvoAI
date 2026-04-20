import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-bg-hover/80 animate-pulse rounded-md [background-size:200%_100%]",
        className
      )}
    />
  );
}
