import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const TYPING_TIMEOUT_MS = 3000;

/**
 * Lightweight "X is typing…" indicator for a conversation thread.
 *
 * This intentionally does NOT touch the database — typing state changes
 * far too often to write to Postgres every keystroke. Instead it uses a
 * Supabase Realtime "broadcast" channel, which is just an ephemeral
 * pub/sub message that never gets persisted anywhere.
 *
 * Usage:
 *   const { otherUserTyping, notifyTyping } = useTyping(conversationId);
 *   // call notifyTyping() on every keystroke in the input
 *   // read otherUserTyping to show/hide "Nightcloud is typing…"
 */
export function useTyping(conversationId: string | undefined) {
  const { user } = useAuth();
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === user.id) return; // ignore our own broadcast

        setOtherUserTyping(true);

        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, TYPING_TIMEOUT_MS);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, user]);

  const notifyTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  }, [user]);

  return { otherUserTyping, notifyTyping };
}
