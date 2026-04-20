import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  count = 5,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${value} of ${count} stars`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(value)
              ? "fill-accent-orange text-accent-orange"
              : "text-foreground-muted"
          )}
        />
      ))}
    </div>
  );
}
