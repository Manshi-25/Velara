import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  /** Whether to show the small "Seen" label under this bubble (only the LAST bubble I sent should show it). */
  showSeenLabel?: boolean;
}

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * A single chat message bubble — right-aligned + primary color for my
 * own messages, left-aligned + surface color for the other person's,
 * matching the bubble shapes and "Seen" receipts from the reference
 * screenshot (Image 2).
 */
export function ChatBubble({ message, isMine, showSeenLabel }: ChatBubbleProps) {
  if (message.deleted) {
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="max-w-[80%] text-sm italic text-muted-foreground px-3 py-2">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] text-sm px-3.5 py-2.5 rounded-2xl break-words",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-surface text-foreground rounded-bl-md border border-border/50"
        )}
      >
        {message.message}
      </div>
      <div className="flex items-center gap-1.5 mt-1 px-1">
        <span className="text-[10px] text-muted-foreground">
          {formatBubbleTime(message.created_at)}
          {message.edited && " · edited"}
        </span>
        {isMine && showSeenLabel && (
          <span className="text-[10px] text-accent">
            {message.seen_at ? "Seen" : "Delivered"}
          </span>
        )}
      </div>
    </div>
  );
}
