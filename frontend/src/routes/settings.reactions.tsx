import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/settings/reactions")({
  head: () => ({ meta: [{ title: "Reactions — Velara" }, { name: "description", content: "Reactions other dreamers gave you." }] }),
  component: Reactions,
});

const reactions = [
  { from: "Nightcloud", emoji: "✨", on: "Riding the comet", time: "2h" },
  { from: "Moonpetal", emoji: "💜", on: "Flying over the glass ocean", time: "5h" },
  { from: "Solstice", emoji: "🌙", on: "Tea with my grandmother", time: "1d" },
  { from: "Embergrove", emoji: "🔥", on: "The clock that ran backward", time: "2d" },
];

function Reactions() {
  return (
    <AppLayout>
      <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Back to settings</Link>
      <h2 className="font-display text-2xl sm:text-3xl mb-2 flex items-center gap-2"><Sparkles className="h-6 w-6 text-accent" /> Reactions received</h2>
      <p className="text-muted-foreground text-sm mb-6">A gentle log of how dreamers responded.</p>
      <div className="space-y-2 max-w-2xl">
        {reactions.map((r, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-card border border-border/60 rounded-xl">
            <span className="text-2xl">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm"><span className="font-medium">{r.from}</span> reacted to "{r.on}"</p>
              <p className="text-xs text-muted-foreground">{r.time}</p>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
