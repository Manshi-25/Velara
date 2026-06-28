/**
 * UserAvatar
 * ----------
 * Single source of truth for rendering any user's avatar throughout Velara.
 *
 * Priority:
 *  1. avatar_url (uploaded image)
 *  2. avatar_gradient  (Tailwind gradient class like "from-violet-500 to-purple-700")
 *  3. Fallback: default gradient
 *
 * Usage:
 *   <UserAvatar profile={profile} size="lg" />
 *   <UserAvatar avatarUrl={p.avatar_url} avatarGradient={p.avatar_gradient} name={p.anonymous_name} size="sm" />
 */

import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  /** Full profile object (convenience — individual props take precedence) */
  profile?: {
    avatar_url?: string | null;
    avatar_gradient?: string | null;
    anonymous_name?: string | null;
  };
  avatarUrl?: string | null;
  avatarGradient?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
  xl: "h-24 w-24 text-3xl",
};

const DEFAULT_GRADIENT = "from-violet-500 to-purple-700";

export function UserAvatar({
  profile,
  avatarUrl,
  avatarGradient,
  name,
  size = "md",
  className,
}: UserAvatarProps) {
  // Individual props override profile object
  const resolvedUrl = avatarUrl ?? profile?.avatar_url;
  const resolvedGradient = avatarGradient ?? profile?.avatar_gradient ?? DEFAULT_GRADIENT;
  const resolvedName = name ?? profile?.anonymous_name;
  const initial = resolvedName?.[0]?.toUpperCase() ?? "?";

  const sizeClass = SIZE_CLASSES[size];

  if (resolvedUrl) {
    return (
      <div
        className={cn(
          "rounded-full bg-cover bg-center shrink-0 overflow-hidden",
          sizeClass,
          className,
        )}
        style={{ backgroundImage: `url(${resolvedUrl})` }}
        aria-label={resolvedName ?? "Avatar"}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br grid place-items-center text-white font-bold shrink-0",
        resolvedGradient,
        sizeClass,
        className,
      )}
      aria-label={resolvedName ?? "Avatar"}
    >
      {initial}
    </div>
  );
}