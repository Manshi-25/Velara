import { cn } from "@/lib/utils";

interface OnlineBadgeProps {
  /** "online" shows green, anything else (or undefined) shows muted gray. */
  state?: string | null;
  className?: string;
}

/**
 * Small status dot meant to sit on the bottom-right corner of an avatar,
 * matching the green/gray dots in the reference screenshots.
 */
export function OnlineBadge({ state, className }: OnlineBadgeProps) {
  const isOnline = state === "online";

  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
        isOnline ? "bg-lucid" : "bg-muted-foreground/50",
        className
      )}
      aria-label={isOnline ? "Online" : "Offline"}
    />
  );
}
