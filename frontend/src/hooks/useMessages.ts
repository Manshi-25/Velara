import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getMessages,
  getConversation,
  sendMessage,
  markSeen,
  subscribeMessages,
} from "@/lib/chat";
import type { Message, MessageType } from "@/types/chat";

/**
 * Drives a single conversation thread: the message history, the other
 * person's profile (for the header), sending new messages (optionally
 * as a reply to an earlier one), and marking everything as seen the
 * moment the thread is open.
 *
 * Usage:
 *   const { messages, conversation, send, isSending, getRepliedMessage } = useMessages(conversationId);
 *   send("hello", "text", repliedMessage?.id)
 */
export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId as string),
    enabled: !!conversationId,
  });

  const conversationQuery = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId as string),
    enabled: !!conversationId,
  });

  // Quick id -> message lookup for rendering "replying to: ..." previews
  // without a second network round trip — a reply almost always targets
  // a message that's already loaded in this same thread.
  const messagesById = useMemo(() => {
    const map = new Map<string, Message>();
    for (const m of messagesQuery.data ?? []) map.set(m.id, m);
    return map;
  }, [messagesQuery.data]);

  // Live updates: new messages, edits, deletes, seen-receipts — anything
  // that changes in this conversation's messages row set.
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const eventType = payload.eventType;
          const newMessage = payload.new as Message | null;
          const oldMessage = payload.old as Message | null;

          queryClient.setQueryData<Message[]>(["messages", conversationId], (current = []) => {
            if (eventType === "INSERT" && newMessage) {
              if (current.some((message) => message.id === newMessage.id)) {
                return current;
              }

              return [...current, newMessage].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }

            if (eventType === "UPDATE" && newMessage) {
              return current
                .map((message) => (message.id === newMessage.id ? newMessage : message))
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }

            if (eventType === "DELETE") {
              return current.filter((message) => message.id !== oldMessage?.id);
            }

            return current;
          });

          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, queryClient]);

  // Mark everything in this conversation as seen as soon as we open it
  // (and again whenever new messages arrive while it's open) — but only
  // once we've confirmed this is a real, ACCEPTED conversation. A
  // pending request's message shouldn't be silently marked "seen"
  // before the receiver has actually decided to accept it.
  useEffect(() => {
    if (!conversationId || !user || !conversationQuery.data) return;
    markSeen(conversationId).catch((err) =>
      console.error("Failed to mark messages seen:", err)
    );
  }, [conversationId, user, conversationQuery.data, messagesQuery.data?.length]);

  const sendMutation = useMutation({
    mutationFn: ({ body, kind, replyTo }: { body: string; kind?: MessageType; replyTo?: string | null }) =>
      sendMessage(conversationId as string, body, kind, replyTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    conversation: conversationQuery.data ?? null,
    isLoading: messagesQuery.isLoading || conversationQuery.isLoading,
    error: messagesQuery.error ?? conversationQuery.error,

    send: (body: string, kind: MessageType = "text", replyTo?: string | null) =>
      sendMutation.mutateAsync({ body, kind, replyTo }),
    isSending: sendMutation.isPending,

    /** Look up a message by id from what's already loaded — used to render reply previews. */
    getMessageById: (id: string | null | undefined) => (id ? messagesById.get(id) : undefined),

    currentUserId: user?.id ?? null,
  };
}
