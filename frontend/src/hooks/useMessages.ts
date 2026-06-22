import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  getMessages,
  getConversation,
  sendMessage,
  markSeen,
  subscribeMessages,
} from "@/lib/chat";
import { useRealtimeSubscription } from "./useRealtime";
import type { MessageType } from "@/types/chat";

/**
 * Drives a single conversation thread: the message history, the other
 * person's profile (for the header), sending new messages, and marking
 * everything as seen the moment the thread is open.
 *
 * Usage:
 *   const { messages, conversation, send, isSending } = useMessages(conversationId);
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

  // Live updates: new messages, edits, deletes, seen-receipts — anything
  // that changes in this conversation's messages row set.
  useRealtimeSubscription(
    (onChange) => subscribeMessages(conversationId as string, onChange),
    () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      // A new message also changes the parent conversation's last_message,
      // which the chat list depends on.
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    [conversationId],
    { enabled: !!conversationId }
  );

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
    mutationFn: ({ body, kind }: { body: string; kind?: MessageType }) =>
      sendMessage(conversationId as string, body, kind),
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

    send: (body: string, kind: MessageType = "text") =>
      sendMutation.mutateAsync({ body, kind }),
    isSending: sendMutation.isPending,

    currentUserId: user?.id ?? null,
  };
}
