import { useState } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "ai"; text: string };

const seedReplies = [
  "That dream sounds vivid. Was there a recurring symbol?",
  "Many dreamers report similar themes when life feels in flux.",
  "Try journaling it the moment you wake — details fade fast.",
  "I can help you find dreamers who saw something similar. Want me to search?",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi, I'm Lull — your dream companion. Tell me what you saw tonight." },
  ]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    const reply = seedReplies[Math.floor(Math.random() * seedReplies.length)];
    setMessages((m) => [...m, { role: "user", text: t }, { role: "ai", text: reply }]);
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-32 right-4 sm:bottom-36 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full gradient-violet glow-primary grid place-items-center text-primary-foreground shadow-xl hover:scale-105 transition"
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-32 right-3 sm:bottom-36 sm:right-6 z-50 w-[min(360px,calc(100vw-1.5rem))] h-[70vh] max-h-[480px] flex flex-col rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
          <header className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-surface">
            <div className="h-8 w-8 rounded-full gradient-violet grid place-items-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-display">Lull · Dream AI</p>
              <p className="text-[10px] text-muted-foreground">always listening, never judging</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] text-sm rounded-2xl px-3 py-2 ${m.role === "ai" ? "bg-surface text-foreground rounded-tl-sm" : "ml-auto bg-primary text-primary-foreground rounded-tr-sm"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-border/60 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your dream…"
              className="bg-surface border-border/60"
            />
            <Button size="icon" onClick={send} className="gradient-violet text-primary-foreground border-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
