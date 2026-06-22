import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Generic helper hook: runs `subscribe(callback)` once on mount, and
 * always cleans up the returned channel when the component unmounts or
 * any dependency changes. This is what useChat / useMessages build on
 * top of so each of them doesn't have to repeat the same
 * subscribe-in-effect-and-unsubscribe boilerplate.
 *
 * `subscribe` MUST be a function that returns a Supabase RealtimeChannel
 * (i.e. the thing `.subscribe()` on a `supabase.channel(...)` call
 * returns) — e.g. one of subscribeMessages / subscribeRequests /
 * subscribeConversations from `src/lib/chat.ts`.
 *
 * Pass `enabled: false` whenever something the subscriber needs (most
 * commonly the current user's id) isn't available yet — e.g. while
 * auth is still loading, or right after logout. This is the ONLY
 * correct way to skip subscribing; do NOT rely on `user!.id` style
 * non-null assertions inside the subscribe callback, since `user` can
 * legitimately be null for a render or two and that throws instead of
 * just skipping.
 *
 * Example:
 *   useRealtimeSubscription(
 *     (cb) => subscribeMessages(conversationId, cb),
 *     () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
 *     [conversationId],
 *     { enabled: !!conversationId }
 *   );
 */
export function useRealtimeSubscription(
  subscribe: (onChange: () => void) => RealtimeChannel | null,
  onChange: () => void,
  deps: React.DependencyList = [],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  // Keep the latest onChange in a ref so we don't need to resubscribe
  // every time the callback identity changes (only when `deps` change).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const channel = subscribe(() => onChangeRef.current());

    return () => {
      channel?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
}
