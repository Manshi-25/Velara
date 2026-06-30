
import { useState, useEffect } from "react";
import { TrendingUp, Flame, Layers, Moon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const typeTone: Record<string, string> = {
  lucid:     "bg-lucid/15 text-lucid",
  nightmare: "bg-nightmare/15 text-nightmare",
  prophetic: "bg-prophetic/15 text-prophetic",
  recurring: "bg-primary/15 text-primary",
  flying:    "bg-accent/15 text-accent",
  magical:   "bg-accent/15 text-accent",
};

const tone: Record<string, string> = {
  lucid:     "text-lucid",
  nightmare: "text-nightmare",
  prophetic: "text-prophetic",
  recurring: "text-primary",
  flying:    "text-accent",
  magical:   "text-accent",
};

type TrendingTag = { tag: string; count: number; type: string };
type TypeCount   = { type: string; count: number };

// loggedIn=true  → show bottom panels (trending + type dist + streak), hide hero
// loggedIn=false → show hero join CTA, hide bottom panels
export function TrendingPanel({ loggedIn }: { loggedIn: boolean }) {
  const [trending, setTrending]     = useState<TrendingTag[]>([]);
  const [typeCounts, setTypeCounts] = useState<TypeCount[]>([]);
  const [streak, setStreak]         = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    loadPanel();
  }, [loggedIn]);

  async function loadPanel() {
    try {
      // Trending: most-liked dreams in last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: trendingDreams } = await supabase
        .from("dreams")
        .select("title, type, likes_count")
        .neq("archived", true)
        .gte("created_at", since)
        .order("likes_count", { ascending: false })
        .limit(5);

      if (trendingDreams) {
        setTrending(
          trendingDreams.map((d) => ({
            tag:   d.title.split(" ").slice(0, 2).join(""),
            count: d.likes_count || 0,
            type:  d.type || "lucid",
          }))
        );
      }

      // Type distribution
      const { data: allDreams } = await supabase
        .from("dreams")
        .select("type")
        .neq("archived", true);

      if (allDreams) {
        const counts: Record<string, number> = {};
        allDreams.forEach((d) => {
          const t = d.type || "lucid";
          counts[t] = (counts[t] || 0) + 1;
        });
        setTypeCounts(
          Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({ type, count }))
        );
      }

      // Streak (only needed when logged in)
      if (loggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userDreams } = await supabase
            .from("dreams")
            .select("created_at")
            .eq("user_id", user.id)
            .neq("archived", true)
            .order("created_at", { ascending: false });

          if (userDreams && userDreams.length > 0) {
            let s = 0;
            const check = new Date();
            check.setHours(0, 0, 0, 0);
            const daySet = new Set(
              userDreams.map((d) => {
                const date = new Date(d.created_at!);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
              })
            );
            while (daySet.has(check.getTime())) {
              s++;
              check.setDate(check.getDate() - 1);
            }
            setStreak(s);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <aside className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border/60 rounded-2xl p-5 animate-pulse h-36" />
        ))}
      </aside>
    );
  }

  // ── LOGGED OUT: join CTA panel only ───────────────────────────────
  /*if (!loggedIn) {
    return (
      <aside className="space-y-4">
        <div className="rounded-2xl p-6 border border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-accent">Join Velara</p>
          <p className="font-display text-xl leading-snug">
            See what the dreamscape is whispering tonight.
          </p>
          <p className="text-xs text-muted-foreground">
            Create a free account to explore all dreams, follow dreamers, and log your own.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Link
              to="/auth"
              search={{}}
              className="w-full rounded-xl py-2 text-sm font-medium bg-accent text-background hover:bg-accent/90 transition"
            >
              Sign up free
            </Link>
            <Link
              to="/auth"
              search={{}}
              className="w-full rounded-xl py-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </aside>
    );
  }*/

  // ── LOGGED IN: link to trending page + type dist ───────────────────
  /*return (
    <aside className="space-y-4">
      // Trending dreams — now its own page, linked from the top button 
      <Link
        to="/trending"
        search={{}}
        className="block bg-card border border-border/60 rounded-2xl p-5 hover:border-accent/50 transition group"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h3 className="font-display text-lg">Trending dreams</h3>
          </div>
          <Flame className="h-4 w-4 text-prophetic opacity-0 group-hover:opacity-100 transition" />
        </div>
        {trending.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trending dreams yet this week.</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Top dream this week: <span className={tone[trending[0].type] ?? "text-foreground"}>#{trending[0].tag}</span> · see all →
          </p>
        )}
      </Link>
    </aside>
  );*/
}