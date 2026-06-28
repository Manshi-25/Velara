
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/settings/reactions")({
  head: () => ({
    meta: [
      { title: "Reactions — Velara" },
      { name: "description", content: "Reactions other dreamers gave you." },
    ],
  }),
  component: Reactions,
});

type Reaction = {
  reaction_id: string;
  emoji: string;
  reacted_at: string;
  dream_id: string;
  dream_title: string;
  reactor_name: string;
  reactor_id: string;
};

function getTimeAgo(dateString: string) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Reactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReactions();
  }, []);

  async function loadReactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Use the helper function we created in the migration
    const { data, error } = await supabase.rpc("get_reactions_for_user", {
      p_user_id: user.id,
    });

    if (error) {
      console.error(error);
      // Fallback: direct query if RPC not available yet
      const { data: fallback } = await supabase
        .from("dream_reactions")
        .select(`
          id,
          emoji,
          created_at,
          dream_id,
          dreams ( id, title ),
          profiles ( id, anonymous_name )
        `)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Only show reactions on the current user's dreams
      if (fallback) {
        const myDreams = await supabase
          .from("dreams")
          .select("id")
          .eq("user_id", user.id);

        const myDreamIds = new Set((myDreams.data || []).map((d) => d.id));

        const mapped: Reaction[] = (fallback as any[])
          .filter((r) => myDreamIds.has(r.dream_id))
          .map((r) => ({
            reaction_id: r.id,
            emoji: r.emoji,
            reacted_at: r.created_at,
            dream_id: r.dream_id,
            dream_title: r.dreams?.title ?? "Unknown Dream",
            reactor_name: r.profiles?.anonymous_name ?? "A dreamer",
            reactor_id: r.profiles?.id ?? "",
          }));

        setReactions(mapped);
      }
    } else {
      setReactions(data || []);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-accent" />
        Reactions Received
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        A gentle log of how dreamers responded to your dreams.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading reactions…</p>
      ) : reactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">✨</p>
          <p className="font-display text-lg mb-1">No reactions yet</p>
          <p className="text-sm text-muted-foreground">
            When dreamers react to your posts, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reactions.map((r) => (
            <Link
              key={r.reaction_id}
              to="/dream/$id"
              params={{ id: r.dream_id }}
              className="flex items-center gap-3 p-4 bg-card border border-border/60 rounded-xl hover:border-accent/40 transition"
            >
              <span className="text-2xl shrink-0">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{r.reactor_name}</span>
                  {" reacted to "}
                  <span className="text-accent">"{r.dream_title}"</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getTimeAgo(r.reacted_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}