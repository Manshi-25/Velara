import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getOutgoingRequests, subscribeOutgoingRequests } from "@/lib/chat";
import { useRealtimeSubscription } from "./useRealtime";

/**
 * Pending requests I've SENT to others, still waiting on a response.
 * Split out from useChat() so it can be reused anywhere (e.g. the
 * "Sent" section of the Requests tab) without pulling in the full
 * conversations list too.
 */
export function useOutgoingRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-requests", "outgoing"],
    queryFn: getOutgoingRequests,
    enabled: !!user,
  });

  
  return {
    outgoingRequests: query.data ?? [],
    isLoading: query.isLoading,
  };
}
