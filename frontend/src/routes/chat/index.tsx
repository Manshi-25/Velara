import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { MessageCircle, Clock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatCard } from "@/components/chat/ChatCard";
import { RequestCard } from "@/components/chat/RequestCard";
import { SearchBar } from "@/components/chat/SearchBar";
import { useChat } from "@/hooks/useChat";
import { useOutgoingRequests } from "@/hooks/useOutgoingRequests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/chat/")({
  validateSearch: (search) => ({
    tab: search.tab === "requests" ? ("requests" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages — Velara" },
      { name: "description", content: "Your private dream conversations." },
      { property: "og:title", content: "Messages — Velara" },
    ],
  }),
  component: ChatList,
});

function ChatList() {
  const { tab: initialTab } = useSearch({ from: "/chat/" });
  const { conversations, requests, isLoading, error, accept, reject } = useChat();
  const { outgoingRequests, isLoading: outgoingLoading } = useOutgoingRequests();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "requests">(initialTab ?? "all");

  // If someone navigates here with ?tab=requests (e.g. from the Chat
  // button elsewhere) after the component already mounted, follow it.
  useEffect(() => setTab(initialTab ?? "all"), [initialTab]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) =>
      c.otherUser.anonymous_name?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const totalRequestCount = requests.length + outgoingRequests.length;

  return (
    <AppLayout>
      <BackButton />

      <header className="mb-6 text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl gradient-violet items-center justify-center glow-primary mb-3">
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl">Messages</h2>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        <SearchBar value={search} onChange={setSearch} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "requests")} className="w-full">
          <TabsList className="grid grid-cols-2 w-full h-11 rounded-full bg-surface p-1">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:gradient-violet data-[state=active]:text-primary-foreground">
              All messages
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-full data-[state=active]:gradient-violet data-[state=active]:text-primary-foreground relative">
              Requests
              {totalRequestCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-nightmare text-white text-[10px] font-semibold">
                  {totalRequestCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading && (
              <p className="text-center text-sm text-muted-foreground py-10">Loading conversations…</p>
            )}

            {error && (
              <p className="text-center text-sm text-nightmare py-10">
                Couldn't load your messages. Please try again.
              </p>
            )}

            {!isLoading && !error && filteredConversations.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>{search ? "No conversations match your search." : "No conversations yet."}</p>
              </div>
            )}

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
              {filteredConversations.map((conversation) => (
                <ChatCard key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-6">
            {/* Incoming — requests sent TO me, need a response */}
            <div className="space-y-2">
              {(requests.length > 0 || isLoading) && (
                <h3 className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wide">
                  Incoming
                </h3>
              )}

              {isLoading && (
                <p className="text-center text-sm text-muted-foreground py-6">Loading requests…</p>
              )}

              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={accept}
                  onReject={reject}
                />
              ))}
            </div>

            {/* Outgoing — requests I sent, waiting on them */}
            {outgoingRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wide">
                  Sent
                </h3>
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/40 bg-card/50"
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage
                        src={request.receiver?.avatar_url ?? undefined}
                        alt={request.receiver?.anonymous_name}
                      />
                      <AvatarFallback className="gradient-violet text-primary-foreground font-display">
                        {request.receiver?.anonymous_name?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{request.receiver?.anonymous_name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {request.firstMessage ?? "Waiting for them to accept…"}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !outgoingLoading && requests.length === 0 && outgoingRequests.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No pending requests.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
