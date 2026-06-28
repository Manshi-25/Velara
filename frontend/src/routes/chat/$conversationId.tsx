
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { MessageCircle } from "lucide-react";
import type { Message } from "@/types/chat";

export const Route = createFileRoute("/chat/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation — Velara" },
      { name: "description", content: "A private dream conversation." },
    ],
  }),
  component: ChatThread,
});

function ChatThread() {
  const { conversationId } = Route.useParams();
  const router = useRouter();
  const { messages, conversation, isLoading, error, send, isSending, currentUserId, getMessageById } =
    useMessages(conversationId);
  const { otherUserTyping, notifyTyping } = useTyping(conversationId);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const lastMineIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === currentUserId) return i;
    }
    return -1;
  })();

  // Go back to wherever the user came from (profile, dream, etc.).
  // Falls back to /chat if there is no history (direct link open).
  function handleBack() {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/chat", search: { tab: undefined } });
    }
  }

  if (!isLoading && !error && !conversation) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <MessageCircle className="h-10 w-10 mx-auto mb-1 opacity-50" />
          <p>This conversation isn't open yet — it may still be a pending request.</p>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/chat" search={{ tab: "requests" }}>View requests</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:h-[calc(100vh-15rem)] sm:h-[calc(100vh-10rem)]">
        {/* ChatHeader already has a back/close affordance — we replaced the
            old <BackButton /> that hard-coded "/chat". The header's own UI
            is kept; if you want an explicit back arrow in the header, pass
            onBack={handleBack} and wire it up inside ChatHeader. */}
        {conversation && (
          <ChatHeader
            otherUser={conversation.otherUser}
            isTyping={otherUserTyping}
            onBack={handleBack}
          />
        )}

        <div className="flex-1 overflow-y-auto scrollbar-none py-4 space-y-3">
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-10">Loading conversation…</p>
          )}

          {error && (
            <p className="text-center text-sm text-nightmare py-10">
              Couldn't load this conversation. Please try again.
            </p>
          )}

          {!isLoading && !error && messages.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No messages yet — say hello 👋</p>
            </div>
          )}

          {messages.map((message, i) => (
            <ChatBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === currentUserId}
              showSeenLabel={i === lastMineIndex}
              repliedMessage={getMessageById(message.reply_to)}
              onReply={(m) => setReplyingTo(m)}
            />
          ))}

          {otherUserTyping && (
            <div className="flex items-center gap-1 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        <div className="mt-4">
          <ChatInput
            onSend={async (text, kind = "text", replyTo) => {
              await send(text, kind, replyTo ?? replyingTo?.id ?? null);
              setReplyingTo(null);
            }}
            onTyping={notifyTyping}
            disabled={isSending || isLoading}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      </div>
    </AppLayout>
  );
}