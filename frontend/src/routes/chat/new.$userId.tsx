import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Send, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getProfileById } from "@/lib/chat";
import { useAuth } from "@/lib/auth";
import { useChatRelationship } from "@/hooks/useChatRelationship";
import { useChat } from "@/hooks/useChat";

export const Route = createFileRoute("/chat/new/$userId")({
  head: () => ({
    meta: [{ title: "New message — Velara" }],
  }),
  component: NewChatRequest,
});

const MAX_LENGTH = 1000;

function NewChatRequest() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { sendRequest, isSendingRequest } = useChat();
  const { relationship, isLoading: relationshipLoading } = useChatRelationship(userId);
  const [message, setMessage] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfileById(userId),
    enabled: !!userId,
  });

  const otherUser = profileQuery.data;

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      await sendRequest({ receiverId: userId, message: trimmed });
      toast.success("Chat request sent 🌙");
      navigate({ to: "/chat", search: { tab: "requests" } });
    } catch (err: any) {
      console.error("Failed to send chat request:", err);
      toast.error(err?.message || "Couldn't send your request. Please try again.");
    }
  };

  // Someone trying to message themself via a manually-typed URL.
  if (!authLoading && user && user.id === userId) {
    return (
      <AppLayout>
        <BackButton />
        <div className="text-center py-16 text-muted-foreground">
          <p>You can't start a conversation with yourself.</p>
        </div>
      </AppLayout>
    );
  }

  // Relationship already exists (e.g. they double-navigated here, or
  // refreshed after a request was already sent/accepted elsewhere) —
  // redirect them to the right place instead of letting them double-send.
  if (!relationshipLoading && relationship.status === "accepted") {
    return (
      <AppLayout>
        <BackButton />
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <p>You're already connected with {otherUser?.anonymous_name ?? "this person"}.</p>
          <Button asChild className="rounded-full gradient-violet text-primary-foreground border-0">
            <Link to="/chat/$conversationId" params={{ conversationId: relationship.conversationId }}>
              Go to conversation
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!relationshipLoading && relationship.status === "pending_outgoing") {
    return (
      <AppLayout>
        <BackButton />
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <p>You already sent a chat request to {otherUser?.anonymous_name ?? "this person"} — waiting for them to accept.</p>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/chat" search={{ tab: "requests" }}>View your requests</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!relationshipLoading && relationship.status === "pending_incoming") {
    return (
      <AppLayout>
        <BackButton />
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <p>{otherUser?.anonymous_name ?? "This person"} already sent you a chat request.</p>
          <Button asChild className="rounded-full gradient-violet text-primary-foreground border-0">
            <Link to="/chat" search={{ tab: "requests" }}>Respond to their request</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BackButton />

      <div className="max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl gradient-violet items-center justify-center glow-primary mb-3">
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl">Start a conversation</h2>
        </header>

        {profileQuery.isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-6">Loading profile…</p>
        ) : !otherUser ? (
          <p className="text-center text-sm text-nightmare py-6">Couldn't find this person.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card mb-5">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={otherUser.avatar_url ?? undefined} alt={otherUser.anonymous_name} />
                <AvatarFallback className="gradient-violet text-primary-foreground font-display">
                  {otherUser.anonymous_name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{otherUser.anonymous_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {otherUser.dream_vibe || "Night Wanderer"}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2 px-1">
              They'll see this message as your chat request. They can read it before deciding whether to accept.
            </p>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={`Say hello to ${otherUser.anonymous_name}…`}
              className="min-h-[140px] bg-surface border-border/60 rounded-2xl resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[11px] text-muted-foreground">
                {message.length}/{MAX_LENGTH}
              </span>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isSendingRequest}
                className="rounded-full gradient-violet text-primary-foreground border-0"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSendingRequest ? "Sending…" : "Send request"}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
