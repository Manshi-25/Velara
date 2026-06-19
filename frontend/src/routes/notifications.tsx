import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Heart, MessageCircle, UserPlus, Sparkles, Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Velara" },
      { name: "description", content: "Match alerts, reactions and replies." },
      { property: "og:title", content: "Notifications — Velara" },
    ],
  }),
  component: Notifications,
});

const items = [
  { icon: Sparkles, tone: "text-prophetic", bg: "bg-prophetic/15", ring: "ring-prophetic/30", text: "3 dreamers had a dream similar to yours: 'Glass hallway'", time: "2m", group: "Today" },
  { icon: Heart, tone: "text-nightmare", bg: "bg-nightmare/15", ring: "ring-nightmare/30", text: "Moonpetal reacted to your dream 'Riding the comet'", time: "1h", group: "Today" },
  { icon: MessageCircle, tone: "text-accent", bg: "bg-accent/15", ring: "ring-accent/30", text: "Velvetfox commented: 'I had this exact dream last week!'", time: "3h", group: "Today" },
  { icon: UserPlus, tone: "text-lucid", bg: "bg-lucid/15", ring: "ring-lucid/30", text: "Solstice started following you", time: "1d", group: "Earlier" },
  { icon: Bell, tone: "text-prophetic", bg: "bg-prophetic/15", ring: "ring-prophetic/30", text: "Your weekly dream digest is ready", time: "2d", group: "Earlier" },
];

function Notifications() {
  const groups = Array.from(new Set(items.map((i) => i.group)));
  return (
    <AppLayout>
      <BackButton />
      <header className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl gradient-violet items-center justify-center glow-primary mb-3">
          <Bell className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl">Notifications</h2>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        {groups.map((g) => (
          <section key={g}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1">{g}</p>
            <div className="space-y-3">
              {items.filter((i) => i.group === g).map((n, i) => {
                const Icon = n.icon;
                return (
                  <div
                    key={i}
                    className="group relative flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:border-accent/50 hover:bg-surface transition shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)]"
                  >
                    <div className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ring-1 ${n.bg} ${n.tone} ${n.ring}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{n.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time} ago</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-accent mt-2 opacity-70 group-hover:opacity-100" />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
