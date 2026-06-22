import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineBadge } from "./OnlineBadge";
import type { Conversation } from "@/types/chat";

interface ChatCardProps {
  conversation: Conversation;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * A single row in the "All messages" list — avatar + online dot, name,
 * last message preview, timestamp, and an unread-count pill. Mirrors the
 * layout of the reference screenshot (Image 1) but uses the app's own
 * ember/dark theme tokens instead of hardcoded colors.
 */
export function ChatCard({ conversation }: ChatCardProps) {
  const { otherUser, last_message, last_message_at, unreadCount, id } = conversation;
  const isUnread = unreadCount > 0;

  return (
    <Link
      to="/chat/$conversationId"
      params={{ conversationId: id }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface transition border-b border-border/40 last:border-b-0"
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser.avatar_url ?? undefined} alt={otherUser.anonymous_name} />
          <AvatarFallback className="gradient-violet text-primary-foreground font-display">
            {otherUser.anonymous_name?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <OnlineBadge state={otherUser.state} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`truncate ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
          {otherUser.anonymous_name}
        </p>
        <p
          className={`text-sm truncate mt-0.5 ${
            isUnread ? "text-foreground/80" : "text-muted-foreground"
          }`}
        >
          {last_message ?? "Say hello 👋"}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[11px] text-muted-foreground">{formatTime(last_message_at)}</span>
        {isUnread && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}
