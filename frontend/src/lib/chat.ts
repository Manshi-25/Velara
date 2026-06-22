import { supabase } from "@/integrations/supabase/client";
import type {
  Conversation,
  Message,
  ChatRequest,
  ChatRelationship,
} from "@/types/chat";

/** Profile columns we consistently select wherever a sender/other-user is joined in. */
const PROFILE_FIELDS = `
  id,
  anonymous_name,
  avatar_url,
  dream_level,
  dream_vibe,
  bio,
  dream_xp,
  state
`;

/* ------------------------- REQUESTS ------------------------- */

/** Fetch a single profile by id — used by the "send first message" page to show who you're requesting to chat with. */
export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Requests OTHERS have sent TO me that I haven't responded to yet.
 * This is what populates the "Requests" tab. Each request now carries
 * its own conversation_id (created up-front by send_chat_request), so
 * we fetch that conversation's first message as a preview.
 */
export async function getIncomingRequests() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_requests")
    .select(`
      *,
      sender:profiles!chat_requests_sender_id_fkey(${PROFILE_FIELDS})
    `)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachFirstMessages((data ?? []) as ChatRequest[]);
}

/**
 * Requests I've sent TO others that are still pending — useful for
 * showing "Requested" state on a profile instead of letting someone
 * send a duplicate request.
 */
export async function getOutgoingRequests() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_requests")
    .select(`
      *,
      receiver:profiles!chat_requests_receiver_id_fkey(${PROFILE_FIELDS})
    `)
    .eq("sender_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachFirstMessages((data ?? []) as ChatRequest[]);
}

/**
 * Given a list of chat_requests, fetches the first message of each
 * linked conversation in a single query and attaches it as
 * `firstMessage` (rather than N+1 queries, one per request).
 */
async function attachFirstMessages(requests: ChatRequest[]): Promise<ChatRequest[]> {
  const conversationIds = requests
    .map((r) => r.conversation_id)
    .filter((id): id is string => !!id);

  if (conversationIds.length === 0) return requests;

  const { data: messages, error } = await supabase
    .from("messages")
    .select("conversation_id, message, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // First message per conversation = first row we see, since we
  // ordered ascending by created_at.
  const firstMessageByConversation = new Map<string, string>();
  for (const m of messages ?? []) {
    if (!firstMessageByConversation.has(m.conversation_id)) {
      firstMessageByConversation.set(m.conversation_id, m.message ?? "");
    }
  }

  return requests.map((r) => ({
    ...r,
    firstMessage: firstMessageByConversation.get(r.conversation_id),
  }));
}

/**
 * Figures out the current relationship between me and another user —
 * drives the Chat / Requested / Message button on profiles and posts.
 * Checked in this order: accepted conversation > pending request
 * (either direction) > nothing yet.
 */
export async function getRelationshipWithUser(
  otherUserId: string
): Promise<ChatRelationship> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { status: "none" };

  const { data: requests, error } = await supabase
    .from("chat_requests")
    .select("id, sender_id, receiver_id, status, conversation_id")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!requests) return { status: "none" };

  if (requests.status === "accepted") {
    // conversation_id is nullable in the DB column type, but an
    // 'accepted' row can only exist because accept_chat_request()
    // flipped a row that already had one set — so this should never
    // actually be null. Guard anyway rather than asserting it away.
    if (!requests.conversation_id) return { status: "none" };
    return { status: "accepted", conversationId: requests.conversation_id };
  }

  if (requests.status === "pending") {
    return requests.sender_id === user.id
      ? { status: "pending_outgoing", requestId: requests.id }
      : { status: "pending_incoming", requestId: requests.id };
  }

  // rejected / blocked -> treat as if nothing exists, so they can try again
  return { status: "none" };
}

export async function sendChatRequest(receiver: string, message: string) {
  const { data, error } = await supabase.rpc("send_chat_request", {
    receiver,
    message,
  });

  if (error) throw error;

  return data as string; // new chat_requests id
}

export async function acceptRequest(request: string) {
  const { data, error } = await supabase.rpc(
    "accept_chat_request",
    {
      request,
    }
  );

  if (error) throw error;

  return data;
}

export async function rejectRequest(request: string) {
  const { error } = await supabase.rpc(
    "reject_chat_request",
    {
      request,
    }
  );

  if (error) throw error;
}

/* ------------------------- CONVERSATIONS ------------------------- */

/**
 * Fetches every ACCEPTED conversation the current user belongs to, in a
 * small fixed number of round trips (not one per conversation),
 * including all members so we can figure out who "the other person" is,
 * plus a real unread count per conversation.
 *
 * Conversations now get created the moment a chat request is SENT (not
 * just when accepted), so we must filter out conversations whose linked
 * chat_requests row is still 'pending' or was 'rejected' — those belong
 * in the Requests tab, not here.
 */
export async function getConversations(): Promise<Conversation[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  // Step 1: every conversation_members row the current user is part of,
  // joined straight to its parent conversation.
  const { data: myMemberships, error } = await supabase
    .from("conversation_members")
    .select(
      `
      conversation_id,
      last_read_message,
      conversation:conversations(
        id,
        created_at,
        last_message,
        last_message_at
      )
    `
    )
    .eq("user_id", user.id);

  if (error) throw error;
  if (!myMemberships || myMemberships.length === 0) return [];

  const allConversationIds = myMemberships.map((m) => m.conversation_id);

  // Step 1b: only keep the ones whose chat_requests row is 'accepted'.
  // (Every conversation has exactly one chat_requests row pointing at
  // it, created atomically by send_chat_request().)
  const { data: acceptedRequests, error: requestsError } = await supabase
    .from("chat_requests")
    .select("conversation_id")
    .in("conversation_id", allConversationIds)
    .eq("status", "accepted");

  if (requestsError) throw requestsError;

  const acceptedConversationIds = new Set(
    (acceptedRequests ?? []).map((r) => r.conversation_id)
  );

  const conversationIds = allConversationIds.filter((id) =>
    acceptedConversationIds.has(id)
  );

  if (conversationIds.length === 0) return [];

  const { data: latestMessages, error: latestMessagesError } = await supabase
    .from("messages")
    .select("conversation_id, sender_id, message, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (latestMessagesError) throw latestMessagesError;

  const lastMessageByConversation = new Map<string, { sender_id: string | null; message: string | null }>();
  for (const message of latestMessages ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, {
        sender_id: message.sender_id,
        message: message.message,
      });
    }
  }

  // Step 2: every member row (any user) for those conversations, so we
  // can find "the other person" in each one. One query for all of them.
  const { data: allMembers, error: membersError } = await supabase
    .from("conversation_members")
    .select(
      `
      conversation_id,
      user:profiles(${PROFILE_FIELDS})
    `
    )
    .in("conversation_id", conversationIds);

  if (membersError) throw membersError;

  // Step 3: unread counts (messages not sent by me, with no seen_at).
  const unreadCounts = await getUnreadCounts(conversationIds, user.id);

  const conversations: Conversation[] = myMemberships
    .filter((m: any) => acceptedConversationIds.has(m.conversation_id))
    .map((m: any) => {
      const conversation = m.conversation;
      if (!conversation) return null;

      const membersOfThisConvo = (allMembers as any[]).filter(
        (row) => row.conversation_id === conversation.id
      );

      const otherUser = membersOfThisConvo
        .map((row) => row.user)
        .find((u: any) => u && u.id !== user.id);

      if (!otherUser) {
        console.error(
          `getConversations(): conversation ${conversation.id} has ${membersOfThisConvo.length} visible member row(s) but no "other user" — check the conversation_members SELECT policy.`
        );
        return null;
      }

      return {
        id: conversation.id,
        created_at: conversation.created_at ?? new Date().toISOString(),
        last_message: conversation.last_message,
        last_message_sender_id: lastMessageByConversation.get(conversation.id)?.sender_id ?? null,
        last_message_at: conversation.last_message_at,
        otherUser,
        unreadCount: unreadCounts[conversation.id] ?? 0,
      } as Conversation;
    })
    .filter((c): c is Conversation => c !== null);

  conversations.sort((a, b) => {
    return (
      new Date(b.last_message_at ?? 0).getTime() -
      new Date(a.last_message_at ?? 0).getTime()
    );
  });

  return conversations;
}

/**
 * Returns { [conversationId]: unreadCount } for the given conversations.
 * A message counts as unread if it wasn't sent by me and has no seen_at.
 */
async function getUnreadCounts(
  conversationIds: string[],
  userId: string
): Promise<Record<string, number>> {
  if (conversationIds.length === 0) return {};

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("seen_at", null);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.conversation_id] = (counts[row.conversation_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Fetch a single conversation (with the other member's profile) — used
 * by the chat thread header so it doesn't need the whole list loaded.
 * Only returns ACCEPTED conversations — a pending one isn't a real
 * thread yet (it's a request preview, shown via getIncomingRequests /
 * getOutgoingRequests instead), so this deliberately returns null for it
 * even though the user is technically a member.
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const { data: request, error: requestError } = await supabase
    .from("chat_requests")
    .select("status")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (requestError) throw requestError;
  if (!request || request.status !== "accepted") return null;

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, created_at, last_message, last_message_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw error;
  if (!conversation) return null;

  const { data: members, error: membersError } = await supabase
    .from("conversation_members")
    .select(`user_id, user:profiles(${PROFILE_FIELDS})`)
    .eq("conversation_id", conversationId);

  if (membersError) throw membersError;

  const otherUser = (members as any[])
    ?.map((m) => m.user)
    .find((u: any) => u && u.id !== user.id);

  if (!otherUser) {
    // If this fires even though the conversation IS accepted, it's
    // almost always an RLS problem on conversation_members SELECT (it's
    // only returning your own row, not the other member's) rather than
    // the conversation genuinely missing a second member.
    console.error(
      `getConversation(${conversationId}): found ${members?.length ?? 0} member row(s) but no "other user" — check the conversation_members SELECT policy.`
    );
    return null;
  }

  return {
    id: conversation.id,
    created_at: conversation.created_at ?? new Date().toISOString(),
    last_message: conversation.last_message,
    last_message_at: conversation.last_message_at,
    otherUser,
    unreadCount: 0,
  };
}

/* ------------------------- MESSAGES ------------------------- */

export async function getMessages(
  conversation: string
) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(${PROFILE_FIELDS})
    `)
    .eq("conversation_id", conversation)
    .order("created_at");

  if (error) throw error;

  return data as Message[];
}

export async function sendMessage(
  conversation: string,
  body: string,
  kind = "text",
  replyTo?: string | null
) {
  const { data, error } = await supabase.rpc(
    "send_message",
    {
      conversation,
      body,
      kind,
      p_reply_to: replyTo ?? null,   // matches renamed SQL parameter
    }
  );

  if (error) throw error;

  return data;
}

export async function markSeen(
  conversation: string
) {
  const { error } = await supabase.rpc(
    "mark_messages_seen",
    {
      conversation,
    }
  );

  if (error) throw error;
}

/* ------------------------- REALTIME ------------------------- */

export function subscribeMessages(
  conversation: string,
  callback: () => void
) {
  return supabase
    .channel(`messages-${conversation}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversation}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Watches chat_requests rows where I'm the RECEIVER (someone sent me a
 * request, or I responded to one) — drives the Requests tab.
 */
export function subscribeRequests(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel(`requests-received-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_requests",
        filter: `receiver_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Watches chat_requests rows where I'm the SENDER — so if I requested
 * to chat with someone, the moment THEY accept/reject, my own UI (e.g.
 * a "Requested" button flipping to "Message", or my outgoing-requests
 * list) updates live without a refresh.
 */
export function subscribeOutgoingRequests(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel(`requests-sent-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_requests",
        filter: `sender_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeConversations(
  userId: string,
  callback: () => void
) {
  // A conversation_members row is now created the moment a chat
  // request is SENT (not just on accept), so this fires earlier than
  // before — that's fine, the callback just invalidates the
  // conversations query, and getConversations() itself filters down to
  // accepted-only. Watching conversations directly wouldn't tell us
  // *we* were just added to one, so we watch our own membership rows.
  return supabase
    .channel(`conversation-members-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversation_members",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Watches the conversations table itself for last_message / last_message_at
 * updates, so the chat list re-sorts/re-renders previews live as messages
 * come in across ALL of the user's conversations (not just the open one).
 */
export function subscribeConversationUpdates(callback: () => void) {
  return supabase
    .channel("conversations-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      },
      callback
    )
    .subscribe();
}