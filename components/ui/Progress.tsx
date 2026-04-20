import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-bg-hover",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-accent-blue transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
