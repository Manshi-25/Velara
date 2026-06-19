import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Check, X } from "lucide-react";
import { conversations } from "./chat";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Conversation — Velara" },
      { name: "description", content: "A private dream conversation." },
    ],
  }),
  component: ChatThread,
});

function ChatThread() {
  const { id } = Route.useParams();
  const conv = conversations.find((c) => c.id === id) ?? conversations[0];
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(conv.status);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "them", text: conv.preview },
    { from: "them", text: "If you're open to chatting, I'd love to compare notes." },
  ]);

  const send = () => {
    if (!input.trim() || status !== "accepted") return;
    setMessages((m) => [...m, { from: "me", text: input.trim() }]);
    setInput("");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)]">
        <header className="flex items-center gap-3 pb-4 border-b border-border/60">
          <Link to="/chat" className="p-2 rounded-lg hover:bg-surface"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="h-10 w-10 rounded-full gradient-violet grid place-items-center text-sm font-display text-primary-foreground">{conv.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{conv.name}</p>
            <p className="text-xs text-muted-foreground">{status === "accepted" ? "Connected" : status === "pending" ? "New request" : "Declined"}</p>
          </div>
        </header>

        {status === "pending" && (
          <div className="my-4 p-4 rounded-xl border border-border/60 bg-card text-center">
            <p className="text-sm mb-3">{conv.name} wants to share dreams with you.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setStatus("accepted")} className="gradient-violet text-primary-foreground border-0">
                <Check className="h-4 w-4 mr-1" /> Accept
              </Button>
              <Button onClick={() => setStatus("rejected")} variant="outline" className="border-nightmare/50 text-nightmare hover:bg-nightmare/10">
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] text-sm rounded-2xl px-3 py-2 ${m.from === "me" ? "ml-auto bg-primary text-primary-foreground" : "bg-surface"}`}>
              {m.text}
            </div>
          ))}
          {status === "rejected" && <p className="text-center text-xs text-muted-foreground py-4">You declined this request.</p>}
        </div>

        <div className="pt-3 border-t border-border/60 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={status !== "accepted"}
            placeholder={status === "accepted" ? "Write a reply…" : "Accept the request to reply"}
            className="bg-surface border-border/60"
          />
          <Button onClick={send} disabled={status !== "accepted"} className="gradient-violet text-primary-foreground border-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
