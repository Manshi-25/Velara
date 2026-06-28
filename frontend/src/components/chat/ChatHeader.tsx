
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineBadge } from "./OnlineBadge";
import { useIsUserOnline } from "@/hooks/usePresence";
import type { Profile } from "@/types/chat";

interface ChatHeaderProps {
  otherUser: Profile;
  isTyping?: boolean;
  /** Called when the back arrow is pressed. Uses browser history so the user
   *  returns to wherever they came from (profile, dream, etc.) instead of
   *  always going to /chat. */
  onBack: () => void;
}

export function ChatHeader({ otherUser, isTyping, onBack }: ChatHeaderProps) {
  const online = useIsUserOnline(otherUser.id);
  const statusText = isTyping ? "typing…" : online ? "Online" : "Offline";

  return (
    <header className="flex items-center gap-3 pb-4 border-b border-border/60">
      {/* Back — calls the history-aware handler from the parent route */}
      <button
        onClick={onBack}
        className="p-2 -ml-2 rounded-lg hover:bg-surface shrink-0 transition"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatar_url ?? undefined} alt={otherUser.anonymous_name} />
          <AvatarFallback className="gradient-violet text-primary-foreground font-display">
            {otherUser.anonymous_name?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <OnlineBadge online={online} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{otherUser.anonymous_name}</p>
        <p className={`text-xs truncate ${isTyping ? "text-accent" : "text-muted-foreground"}`}>
          {statusText}
        </p>
      </div>
    </header>
  );
}
