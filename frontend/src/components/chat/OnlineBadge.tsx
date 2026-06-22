import { cn } from "@/lib/utils";

interface OnlineBadgeProps {
  /**
   * Real-time presence — pass the result of useIsUserOnline(userId),
   * NOT profile.state (that column is the user's geocoded location,
   * e.g. "Delhi", not an online/offline flag).
   */
  online: boolean;
  className?: string;
}

/**
 * Small status dot meant to sit on the bottom-right corner of an avatar,
 * matching the green/gray dots in the reference screenshots.
 */
export function OnlineBadge({ online, className }: OnlineBadgeProps) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
        online ? "bg-lucid" : "bg-muted-foreground/50",
        className
      )}
      aria-label={online ? "Online" : "Offline"}
    />
  );
}
