import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { MessageCircle, Check, X, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Messages — Velara" },
      { name: "description", content: "Your private dream conversations." },
      { property: "og:title", content: "Messages — Velara" },
    ],
  }),
  component: ChatList,
});

export const conversations = [
  { id: "1", name: "Nightcloud", preview: "Did you also see the glass ocean?", time: "2m", unread: 2, status: "pending" as const },
  { id: "2", name: "Moonpetal", preview: "I want to compare the recurring city dream.", time: "1h", unread: 0, status: "accepted" as const },
  { id: "3", name: "Velvetfox", preview: "Hi! I had the exact same exam nightmare.", time: "3h", unread: 1, status: "pending" as const },
  { id: "4", name: "Solstice", preview: "Thank you for sharing that.", time: "1d", unread: 0, status: "accepted" as const },
  { id: "5", name: "Tideborne", preview: "Comet dream club ✨", time: "2d", unread: 0, status: "accepted" as const },
];

type LocalStatus = "pending" | "accepted" | "rejected";

function ChatList() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, LocalStatus>>(
    Object.fromEntries(conversations.map((c) => [c.id, c.status])) as Record<string, LocalStatus>
  );

  const setStatus = (id: string, s: LocalStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: s }));
    setOpenId(null);
  };

  return (
    <AppLayout>
      <BackButton />
      <header className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl gradient-violet items-center justify-center glow-primary mb-3">
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl">Messages</h2>
      </header>

      <div className="max-w-2xl mx-auto space-y-3">
        {conversations.map((c) => {
          const st = statuses[c.id];
          const isOpen = openId === c.id;
          return (
            <div
              key={c.id}
              className={`bg-card border rounded-2xl overflow-hidden transition ${isOpen ? "border-accent/60 shadow-[0_0_30px_-8px_oklch(0.65_0.16_50/0.4)]" : "border-border/60 hover:border-accent/40"}`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : c.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface transition"
              >
                <div className="h-11 w-11 rounded-full gradient-violet grid place-items-center text-sm font-display text-primary-foreground shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{c.name}</p>
                    {st === "pending" && (
                      <span className="text-[10px] uppercase tracking-wider bg-prophetic/20 text-prophetic px-2 py-0.5 rounded-full">Request</span>
                    )}
                    {st === "rejected" && (
                      <span className="text-[10px] uppercase tracking-wider bg-nightmare/20 text-nightmare px-2 py-0.5 rounded-full">Declined</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.preview}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">{c.time}</p>
                  {c.unread > 0 && (
                    <span className="inline-block mt-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5">{c.unread}</span>
                  )}
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-90" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t border-border/60 p-4 bg-surface/40 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  {st === "pending" ? (
                    <>
                      <p className="text-sm text-muted-foreground">Accept this dream request?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatus(c.id, "accepted")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-lucid/20 text-lucid border border-lucid/40 text-xs hover:bg-lucid/30"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => setStatus(c.id, "rejected")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-nightmare/15 text-nightmare border border-nightmare/40 text-xs hover:bg-nightmare/25"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {st === "accepted" ? "Connected — open the conversation." : "You declined this request."}
                      </p>
                      {st === "accepted" && (
                        <Link
                          to="/chat/$id"
                          params={{ id: c.id }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full gradient-violet text-primary-foreground text-xs"
                        >
                          Open chat <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {conversations.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No conversations yet.</p>
        </div>
      )}
    </AppLayout>
  );
}
