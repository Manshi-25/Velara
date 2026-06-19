export type MessageType =
  | "text"
  | "image"
  | "voice"
  | "gif"
  | "dream"
  | "system";

export type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "blocked";

export interface Profile {
  id: string;
  anonymous_name: string;
  avatar_url: string | null;
  bio: string | null;
  dream_level: number;
  dream_xp: number;
  dream_vibe: string;
  state: string | null;
}

export interface ChatRequest {
  id: string;

  sender_id: string;
  receiver_id: string;

  status: RequestStatus;

  created_at: string;
  updated_at: string | null;

  sender?: Profile;
  receiver?: Profile;
}

export interface Conversation {

  id: string;

  created_at: string;

  last_message: string | null;

  last_message_at: string | null;

  unreadCount: number;

  otherUser: Profile;
}

export interface ConversationMember {

  id: string;

  conversation_id: string;

  user_id: string;

  joined_at: string;

  last_read_message: string | null;

  is_muted: boolean;
}

export interface Message {

  id: string;

  conversation_id: string;

  sender_id: string;

  message: string;

  message_type: MessageType;

  reply_to: string | null;

  created_at: string;

  edited: boolean;

  deleted: boolean;

  seen_at: string | null;

  sender?: Profile;
}