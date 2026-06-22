import { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string) => unknown | Promise<unknown>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Message composer at the bottom of a chat thread — a text field plus a
 * send button, calling onTyping() on every keystroke (for the typing
 * indicator) and onSend() when the user hits Enter or taps Send.
 */
export function ChatInput({ onSend, onTyping, disabled, placeholder = "Write a message…" }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;

    setSending(true);
    setValue("");
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-3 border-t border-border/60 flex gap-2 items-end">
      <Input
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
  );
}
