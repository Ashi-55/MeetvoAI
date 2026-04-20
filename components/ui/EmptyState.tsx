import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-bg-card px-6 py-16 text-center",
        className
      )}
    >
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-foreground-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
