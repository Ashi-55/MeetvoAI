import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({
  src,
  alt,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const dim = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-bg-hover ring-1 ring-border",
        className
      )}
      style={{ width: dim, height: dim }}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-medium text-foreground-secondary">
          {alt.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
