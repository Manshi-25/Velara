
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DreamCard, type HomeDream } from "@/components/DreamCard";
import { TrendingPanel } from "@/components/TrendingPanel";
import { Button } from "@/components/ui/button";
import { Sparkles, PenSquare, Loader2, Lock, Flame, Compass, Bookmark, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velara — Share your dreams, find your tribe" },
      { name: "description", content: "Velara is a soft, anonymous space to share dreams — lucid, prophetic or strange — and discover dreamers who saw what you saw." },
      { property: "og:title", content: "Velara — A gentle place for dreams" },
      { property: "og:description", content: "Anonymous dream journaling, AI matching, and a quiet community of nightly travellers." },
    ],
  }),
  component: Index,
});

const FILTERS = ["For you", "Lucid", "Nightmare", "Prophetic", "Recurring", "Flying", "Magical"] as const;
type Filter = typeof FILTERS[number];

const filterToType: Record<Filter, string | null> = {
  "For you":   null,
  "Lucid":     "lucid",
  "Nightmare": "nightmare",
  "Prophetic": "prophetic",
  "Recurring": "recurring",
  "Flying":    "flying",
  "Magical":   "magical",
};

// How many dreams guests can see before the lock wall
const GUEST_PREVIEW_COUNT = 3;

function Index() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [activeFilter, setActiveFilter] = useState<Filter>("For you");
  const [dreams, setDreams]     = useState<HomeDream[]>([]);
  const [loading, setLoading]   = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId]     = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!authLoading) loadDreams();
  }, [activeFilter, userId, authLoading]);

  async function loadDreams() {
    setLoading(true);
    try {
      let query = supabase
        .from("dreams")
        .select(`
          id, title, body, cover, type,
          views_count, likes_count, comments_count, created_at,
          author:profiles!dreams_user_id_profiles_fkey(
            id, anonymous_name, avatar_gradient, avatar_url, dream_vibe
          )
        `)
        .neq("archived", true)
        .order("created_at", { ascending: false })
        .limit(20);

      const typeFilter = filterToType[activeFilter];
      if (typeFilter) query = query.eq("type", typeFilter);

      const { data, error } = await query;
      if (error) { console.error("loadDreams error:", error); return; }

      let result = (data || []) as HomeDream[];

      // "For you": sort followed users' dreams first
      if (activeFilter === "For you" && userId) {
        const { data: followedRows } = await supabase
          .from("followers")
          .select("following_id")
          .eq("follower_id", userId);
        const followedIds = new Set((followedRows || []).map((r) => r.following_id));
        result = [
          ...result.filter((d) => d.author?.id && followedIds.has(d.author.id)),
          ...result.filter((d) => !d.author?.id || !followedIds.has(d.author.id)),
        ];
      }

      setDreams(result);
    } finally {
      setLoading(false);
    }
  }

  const isGuest = !authLoading && !userId;

  // For guests: first 3 are clickable previews, rest are locked
  const visibleDreams  = isGuest ? dreams.slice(0, GUEST_PREVIEW_COUNT) : dreams;
  const showLockWall   = isGuest && dreams.length > 0;

  return (
    <AppLayout>
      {/* Hero banner — only for guests */}
      {isGuest && <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-5 sm:mb-8 border border-border/40 bg-gradient-to-br from-card/80 via-card/40 to-background/60 p-5 sm:p-8 lg:p-12 shadow-[0_0_60px_-15px_oklch(0.65_0.16_50/0.35)]">
        <div className="absolute inset-0 -z-10 opacity-70 gradient-cosmic" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-accent">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Tonight on Velara
          </span>
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl mt-3 sm:mt-4 leading-tight">
            Share the dream you can't forget.
            <span className="block text-accent">Find who else dreamt it.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-muted-foreground max-w-lg">
            Velara is an anonymous home for the strange, beautiful and unsettling. Post a dream and our AI quietly threads you to dreamers across the world who saw the same.
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
            <Button asChild size="sm" className="gradient-violet text-primary-foreground glow-primary border-0">
              <Link to="/post" search={{ draftId: "" }}><PenSquare className="h-4 w-4 mr-1" />Log tonight's dream</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border/60 bg-background/40 backdrop-blur">
              <Link to="/explore" search={{}}>Explore dreamscape</Link>
            </Button>
          </div>
        </div>
      </section>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-5 min-w-0">

          {/* Quick-link buttons — logged-in users only */}
          {!isGuest && (
            <div className="flex flex-wrap gap-2">
              <Link
                to="/trending"
                search={{}}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition active:scale-95 active:bg-accent/20 active:border-accent/40 active:text-accent ${
                  path === "/trending"
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <Flame className="h-4 w-4" /> Trending
              </Link>
              <Link
                to="/explore"
                search={{}}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition"
              >
                <Compass className="h-4 w-4" /> Explore
              </Link>
              <Link
                to="/settings/saved"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition"
              >
                <Bookmark className="h-4 w-4" /> Saved
              </Link>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition"
              >
                <Search className="h-4 w-4" /> Search
              </Link>
            </div>
          )}

          {/* Dream feed */}
          {loading || authLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading dreams…
            </div>
          ) : dreams.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-display">No dreams here yet.</p>
              <p className="text-sm mt-1">Be the first to share one.</p>
              {userId && (
                <Button asChild size="sm" className="mt-4 gradient-violet border-0 text-primary-foreground">
                  <Link to="/post" search={{ draftId: "" }}>Log a dream</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Visible dreams — non-clickable for guests */}
              {visibleDreams.map((d) =>
                isGuest ? (
                  // Guest: render card but block navigation
                  <div key={d.id} className="pointer-events-none select-none">
                    <DreamCard dream={d} />
                  </div>
                ) : (
                  <DreamCard key={d.id} dream={d} />
                )
              )}

              {/* Lock wall for guests */}
              {showLockWall && (
                <div className="relative mt-2">
                  {/* Blurred ghost of the next dream */}
                  <div className="blur-sm opacity-40 pointer-events-none select-none">
                    {dreams[GUEST_PREVIEW_COUNT] && (
                      <DreamCard dream={dreams[GUEST_PREVIEW_COUNT]} />
                    )}
                  </div>

                  {/* Overlay CTA */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm rounded-2xl px-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center mb-3">
                      <Lock className="h-5 w-5 text-accent" />
                    </div>
                    <p className="font-display text-lg">There's more in the dreamscape</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
                      Sign up free to read every dream, follow dreamers, and share your own.
                    </p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Button asChild size="sm" className="gradient-violet border-0 text-primary-foreground">
                        <Link to="/auth" search={{}}>Create account</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-border/60">
                        <Link to="/auth" search={{}}>Sign in</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar — always shown, different content based on auth */}
        <TrendingPanel loggedIn={!isGuest} />
      </div>
    </AppLayout>
  );
}