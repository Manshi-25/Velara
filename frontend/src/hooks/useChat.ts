import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  getConversations,
  getIncomingRequests,
  sendChatRequest,
  acceptRequest,
  rejectRequest,
  subscribeConversations,
  subscribeConversationUpdates,
  subscribeRequests,
  subscribeOutgoingRequests,
} from "@/lib/chat";
import { useRealtimeSubscription } from "./useRealtime";

export function useChat() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    enabled: !!user && !loading,
  });

  const requestsQuery = useQuery({
    queryKey: ["chat-requests", "incoming"],
    queryFn: getIncomingRequests,
    enabled: !!user && !loading,
  });

  // Refresh conversations whenever conversation membership changes
  useRealtimeSubscription(
    (onChange) => {
      if (!user) return null;
      return subscribeConversations(user.id, onChange);
    },
    () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
    [user?.id]
  );

  // Refresh conversation list whenever last_message changes
  useRealtimeSubscription(
    (onChange) => {
      if (!user) return null;
      return subscribeConversationUpdates(onChange);
    },
    () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
    [user?.id]
  );

  // Incoming requests
  useRealtimeSubscription(
    (onChange) => {
      if (!user) return null;
      return subscribeRequests(user.id, onChange);
    },
    () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "incoming"],
      });
    },
    [user?.id]
  );

  // Outgoing requests (accepted/rejected)
  useRealtimeSubscription(
    (onChange) => {
      if (!user) return null;
      return subscribeOutgoingRequests(user.id, onChange);
    },
    () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "incoming"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "outgoing"],
      });

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-relationship"],
      });
    },
    [user?.id]
  );

  const sendRequestMutation = useMutation({
    mutationFn: ({
      receiverId,
      message,
    }: {
      receiverId: string;
      message: string;
    }) => sendChatRequest(receiverId, message),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "outgoing"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-relationship"],
      });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => acceptRequest(requestId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "incoming"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "outgoing"],
      });

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-relationship"],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectRequest(requestId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "incoming"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-requests", "outgoing"],
      });

      queryClient.invalidateQueries({
        queryKey: ["chat-relationship"],
      });
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    requests: requestsQuery.data ?? [],
    isLoading:
      loading ||
      conversationsQuery.isLoading ||
      requestsQuery.isLoading,
    error: conversationsQuery.error ?? requestsQuery.error,

    sendRequest: sendRequestMutation.mutateAsync,
    isSendingRequest: sendRequestMutation.isPending,

    accept: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,

    reject: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  };
}