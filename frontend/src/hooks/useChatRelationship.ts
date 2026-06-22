import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getRelationshipWithUser, subscribeOutgoingRequests, subscribeRequests } from "@/lib/chat";
import { useRealtimeSubscription } from "./useRealtime";

/**
 * Figures out whether to show "Chat", "Requested", or "Message" for a
 * given other user — used on profile pages and post detail pages.
 * Stays live: if the other person accepts/rejects while this is on
 * screen, the button updates without a refresh.
 */
export function useChatRelationship(otherUserId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-relationship", otherUserId],
    queryFn: () => getRelationshipWithUser(otherUserId as string),
    enabled: !!user && !!otherUserId && user.id !== otherUserId,
  });

  // If I'm the one who sent a request and they respond, my own
  // outgoing-request subscription catches it.
  /*useRealtimeSubscription(
    (onChange) => subscribeOutgoingRequests(user!.id, onChange),
    () => queryClient.invalidateQueries({ queryKey: ["chat-relationship", otherUserId] }),
    [user?.id, otherUserId],
    { enabled: !!user }
  );*/

  // If THEY sent me a request (pending_incoming case) and I respond to
  // it elsewhere (e.g. from the Requests tab in another tab), keep this
  // in sync too.
  /*useRealtimeSubscription(
    (onChange) => subscribeRequests(user!.id, onChange),
    () => queryClient.invalidateQueries({ queryKey: ["chat-relationship", otherUserId] }),
    [user?.id, otherUserId],
    { enabled: !!user }
  );
*/
  return {
    relationship: query.data ?? { status: "none" as const },
    isLoading: query.isLoading,
  };
}
