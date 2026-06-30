import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { DreamCard, type HomeDream } from "@/components/DreamCard";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Loader2 } from "lucide-react";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "Trending dreams — Velara" },
      {
        name: "description",
        content: "The most liked dreams on Velara this week.",
      },
      { property: "og:title", content: "Trending dreams — Velara" },
    ],
  }),
  component: Trending,
});

function Trending() {
  const [dreams, setDreams] = useState<HomeDream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from("dreams")
          .select(`
            id, title, body, cover, type,
            views_count, likes_count, comments_count, created_at,
            author:profiles!dreams_user_id_profiles_fkey(
              id, anonymous_name, avatar_gradient, avatar_url, dream_vibe
            )
          `)
          .neq("archived", true)
          .gte("created_at", since)
          .order("likes_count", { ascending: false })
          .limit(30);

        if (error) {
          console.error("trending load error:", error);
          return;
        }
        if (!cancelled) setDreams((data || []) as HomeDream[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <BackButton />

      <div className="flex items-center gap-2 mb-5">
        <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
          <Flame className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl">Trending dreams</h1>
          <p className="text-xs text-muted-foreground">Most liked dreams from the last 7 days</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading trending dreams…
        </div>
      ) : dreams.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-display">Nothing trending yet.</p>
          <p className="text-sm mt-1">Check back once dreamers start liking dreams this week.</p>
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl">
          {dreams.map((d) => (
            <DreamCard key={d.id} dream={d} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}