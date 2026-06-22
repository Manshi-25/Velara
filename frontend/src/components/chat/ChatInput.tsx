import { useEffect, useRef, useState } from "react";
import { Send, X, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./EmojiPicker";
import { GifPickerPlaceholder } from "./GifPickerPlaceholder";
import type { Message, MessageType } from "@/types/chat";

interface ChatInputProps {
  onSend: (text: string, kind?: MessageType, replyTo?: string | null) => unknown | Promise<unknown>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** The message currently being replied to, if any — shown as a cancelable strip above the input. */
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

/**
 * Message composer at the bottom of a chat thread — emoji/GIF pickers
 * on the left, a text field, and a send button. Calls onTyping() on
 * every keystroke (for the typing indicator) and onSend() when the
 * user hits Enter or taps Send. If replyingTo is set, shows a small
 * cancelable "replying to: ..." strip above the field.
 */
export function ChatInput({
  onSend,
  onTyping,
  disabled,
  placeholder = "Write a message…",
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<"emoji" | "gif" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-focus the text field whenever a reply is started, like every
  // chat app does — saves the person an extra tap.
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;

    setSending(true);
    setValue("");
    setPickerOpen(null);
    try {
      await onSend(trimmed, "text", replyingTo?.id ?? null);
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setValue((v) => v + emoji);
    setPickerOpen(null);
    inputRef.current?.focus();
  };

  const sendGif = async (gifUrl: string) => {
    if (disabled || sending) return;

    setSending(true);
    setPickerOpen(null);
    try {
      await onSend(gifUrl, "gif", replyingTo?.id ?? null);
      setValue("");
    } finally {
      setSending(false);
    }
  };

  const togglePicker = (picker: "emoji" | "gif") => {
    setPickerOpen((current) => (current === picker ? null : picker));
  };

  return (
    <div className="pt-3 border-t border-border/60 space-y-2">
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border/60">
          <div className="w-0.5 self-stretch rounded-full bg-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-accent font-medium">Replying to</p>
            <p className="text-xs text-muted-foreground truncate">{replyingTo.message}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-card"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end relative">
        <div className="relative shrink-0 flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPickerOpen((p) => (p === "emoji" ? null : "emoji"))}
            disabled={disabled}
            aria-label="Emoji"
            className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPickerOpen((p) => (p === "gif" ? null : "gif"))}
            disabled={disabled}
            aria-label="GIF"
            className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground text-[10px] font-bold tracking-tight"
          >
            GIF
          </Button>

          {pickerOpen === "emoji" && (
            <EmojiPicker
              onSelect={(emoji) => insertEmoji(emoji)}
              onClose={() => setPickerOpen(null)}
            />
          )}
          {pickerOpen === "gif" && (
            <GifPickerPlaceholder onSelect={sendGif} onClose={() => setPickerOpen(null)} />
          )}
        </div>

        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
            if (e.key === "Escape" && replyingTo) {
              onCancelReply?.();
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="bg-surface border-border/60 h-11 rounded-full px-4"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || sending || value.trim().length === 0}
          size="icon"
          className="h-11 w-11 rounded-full gradient-violet text-primary-foreground border-0 shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
