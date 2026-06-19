import { supabase } from "@/integrations/supabase/client";
import type {
  Conversation,
  Message,
  ChatRequest,
} from "@/types/chat";

/* ------------------------- REQUESTS ------------------------- */

export async function getRequests() {
  const { data, error } = await supabase
    .from("chat_requests")
    .select(`
      *,
      sender:profiles!chat_requests_sender_id_fkey(
        id,
        anonymous_name,
        avatar_url,
        dream_level,
        dream_vibe
      )
    `)
    //.eq("receiver_id", (await supabase.auth.getUser()).data.user?.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as ChatRequest[];
}

export async function sendChatRequest(receiver: string) {
  const { error } = await supabase.rpc("send_chat_request", {
    receiver,
  });

  if (error) throw error;
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

export async function getConversations() {
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) return [];

  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select(`
      conversation:conversations(
        id,
        created_at,
        last_message,
        last_message_at
      )
    `)
    .eq("user_id", user.id);

  if (error) throw error;

  const conversations: Conversation[] = [];

  for (const member of memberships as any[]) {
    const conversation = member.conversation;

    const { data: members } = await supabase
      .from("conversation_members")
      .select(`
        user:profiles(
          id,
          anonymous_name,
          avatar_url,
          dream_level,
          dream_vibe,
          bio,
          dream_xp,
          state
        )
      `)
      .eq("conversation_id", conversation.id);

    const otherUser = members
      ?.map((m: any) => m.user)
      .find((u: any) => u.id !== user.id);

    conversations.push({
      ...conversation,
      otherUser,
      unreadCount: 0,
    });
  }

  conversations.sort((a, b) => {
    return (
      new Date(b.last_message_at ?? 0).getTime() -
      new Date(a.last_message_at ?? 0).getTime()
    );
  });

  return conversations;
}

/* ------------------------- MESSAGES ------------------------- */

export async function getMessages(
  conversation: string
) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(
        id,
        anonymous_name,
        avatar_url,
        dream_level,
        dream_vibe,
        bio,
        dream_xp,
        state
      )
    `)
    .eq("conversation_id", conversation)
    .order("created_at");

  if (error) throw error;

  return data as Message[];
}

export async function sendMessage(
  conversation: string,
  body: string,
  kind = "text"
) {
  const { data, error } = await supabase.rpc(
    "send_message",
    {
      conversation,
      body,
      kind,
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

export function subscribeRequests(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel(`requests-${userId}`)
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

export function subscribeConversations(
  callback: () => void
) {
  return supabase
    .channel("conversations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
      },
      callback
    )
    .subscribe();
}