import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "blue" | "green" | "orange" | "purple";
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone === "default" && "bg-bg-hover text-foreground-secondary",
        tone === "blue" && "bg-accent-blue/15 text-accent-blue",
        tone === "green" && "bg-accent-green/15 text-accent-green",
        tone === "orange" && "bg-accent-orange/15 text-accent-orange",
        tone === "purple" && "bg-accent-purple/15 text-accent-purple",
        className
      )}
      {...props}
    />
  );
}
