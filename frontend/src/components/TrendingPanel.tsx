import { TrendingUp, Flame, Layers } from "lucide-react";
import { trending, dreams } from "@/lib/mock-data";

const tone: Record<string, string> = {
  lucid: "text-lucid",
  nightmare: "text-nightmare",
  prophetic: "text-prophetic",
};

const typeTone: Record<string, string> = {
  lucid: "bg-lucid/15 text-lucid",
  nightmare: "bg-nightmare/15 text-nightmare",
  prophetic: "bg-prophetic/15 text-prophetic",
  recurring: "bg-primary/15 text-primary",
  flying: "bg-accent/15 text-accent",
  magical: "bg-accent/15 text-accent",
};

export function TrendingPanel() {
  const typeCounts = dreams.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="space-y-4">
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h3 className="font-display text-lg">Trending dreams</h3>
        </div>
        <ul className="space-y-3">
          {trending.map((t, i) => (
            <li key={t.tag} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${tone[t.tone]}`}>#{t.tag}</p>
                  <p className="text-xs text-muted-foreground">{t.count.toLocaleString()} dreamers tonight</p>
                </div>
              </div>
              <Flame className="h-4 w-4 text-prophetic opacity-0 group-hover:opacity-100 transition" />
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-accent" />
          <h3 className="font-display text-lg">Same type of dreams</h3>
        </div>
        <ul className="space-y-2">
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <li key={type} className="flex items-center justify-between text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs capitalize ${typeTone[type] || "bg-muted text-muted-foreground"}`}>
                  {type}
                </span>
                <span className="text-muted-foreground">{count} dreamers</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="rounded-2xl p-5 border border-prophetic/30 bg-prophetic/10">
        <p className="text-xs uppercase tracking-wider text-prophetic">Streak</p>
        <p className="font-display text-2xl mt-1">7 nights logged</p>
        <p className="text-xs text-muted-foreground mt-1">Keep your dream journal alive.</p>
      </div>
    </aside>
  );
}
