import { useEffect, useRef } from "react";
import "emoji-picker-element";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const picker = document.createElement("emoji-picker") as HTMLElement & {
      classList: DOMTokenList;
      shadowRoot: ShadowRoot | null;
    };

    picker.classList.add(document.documentElement.classList.contains("light") ? "light" : "dark");
    picker.setAttribute("locale", "en");
    picker.style.width = "100%";
    picker.style.height = "100%";
    picker.style.display = "block";

    const handleEmojiClick = (event: Event) => {
      const detail = (event as CustomEvent<{ unicode?: string }>).detail;
      if (detail?.unicode) {
        onSelect(detail.unicode);
      }
    };

    picker.addEventListener("emoji-click", handleEmojiClick as EventListener);
    host.replaceChildren(picker);

    const focusTimer = window.setTimeout(() => {
      const searchInput = picker.shadowRoot?.querySelector("input") as HTMLInputElement | null;
      searchInput?.focus({ preventScroll: true });
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      picker.removeEventListener("emoji-click", handleEmojiClick as EventListener);
      host.replaceChildren();
    };
  }, [onSelect]);

  return (
    <div
      ref={ref}
      className="w-full max-w-md h-96 max-h-[60vh] overflow-hidden rounded-2xl bg-card border border-border/60 shadow-xl"
    />
  );
}
