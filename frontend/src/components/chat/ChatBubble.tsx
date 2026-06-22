import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  /** Whether to show the small "Seen" label under this bubble (only the LAST bubble I sent should show it). */
  showSeenLabel?: boolean;
  /** The message this one is replying to, if any — looked up by the parent via getMessageById(message.reply_to). */
  repliedMessage?: Message;
  /** Called when the user clicks the reply icon on this bubble. */
  onReply?: (message: Message) => void;
}

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * A single chat message bubble — right-aligned + primary color for my
 * own messages, left-aligned + surface color for the other person's,
 * matching the bubble shapes and "Seen" receipts from the reference
 * screenshot (Image 2).
 *
 * Reply UX: hover (desktop) or tap (touch) reveals a small reply icon
 * next to the bubble — click it to start replying. This works
 * identically on mobile and desktop, unlike a true swipe gesture, with
 * far less code and no conflict with normal vertical scrolling.
 */
export function ChatBubble({ message, isMine, showSeenLabel, repliedMessage, onReply }: ChatBubbleProps) {
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
    <div className={cn("group flex flex-col", isMine ? "items-end" : "items-start")}>
      <div className={cn("flex items-end gap-1.5 max-w-[85%]", isMine ? "flex-row-reverse" : "flex-row")}>
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply to this message"
            className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="min-w-0">
          <div
            className={cn(
              "text-sm px-3.5 py-2.5 rounded-2xl wrap-break-word",
              isMine
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-surface text-foreground rounded-bl-md border border-border/50"
            )}
          >
            {repliedMessage && (
              <div
                className={cn(
                  "mb-1.5 pl-2 border-l-2 text-xs rounded-sm py-1 opacity-80 truncate",
                  isMine ? "border-primary-foreground/50" : "border-accent"
                )}
              >
                {repliedMessage.deleted ? "Original message deleted" : repliedMessage.message}
              </div>
            )}
            {message.message_type === "gif" || message.message_type === "image" ? (
              <img
                src={message.message}
                alt={message.message_type === "gif" ? "GIF" : "Image"}
                className="rounded-lg max-w-full max-h-64 object-contain"
                loading="lazy"
              />
            ) : (
              message.message
            )}
          </div>
        </div>
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
