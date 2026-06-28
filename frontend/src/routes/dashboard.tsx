
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Eye, Heart, MessageCircle, Users, Bell, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {DREAM_LEVELS,getLevelProgress,} from "@/lib/dreamXP";
export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});



function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    views: 0,
    reactions: 0,
    comments: 0,
    followers: 0,
  });

  const [recent, setRecent] = useState<any[]>([]);
  const [moods, setMoods] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [dreamXP, setDreamXP] = useState(0);
  const [dreamLevel, setDreamLevel] = useState(1);
  useEffect(() => {
    loadDashboard();
    loadUserXP();

    // Realtime: update XP/level instantly when triggers fire
    let channel: ReturnType<typeof supabase.channel>;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel("dashboard-xp-realtime")
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          if (payload.new.dream_xp !== undefined) setDreamXP(payload.new.dream_xp);
          if (payload.new.dream_level !== undefined) setDreamLevel(payload.new.dream_level);
        })
        .subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const progressData =
    getLevelProgress(dreamXP);

  const currentLevelData =
    DREAM_LEVELS.find(
      (l) => l.level === dreamLevel
    );

  function formatDate(date: string | null) {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function loadUserXP() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("dream_xp, dream_level")
      .eq("id", user.id)
      .single();

    if (error || !data) return;

    setDreamXP(data.dream_xp || 0);
    setDreamLevel(data.dream_level || 1);
  }

  async function loadDashboard() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      //-------------------------------------
      // USER DREAMS
      //-------------------------------------
      const { data: dreams } = await supabase
        .from("dreams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const dreamIds = dreams?.map((d) => d.id) || [];

      //-------------------------------------
      // TOTAL VIEWS
      //-------------------------------------
      const totalViews =
        dreams?.reduce(
          (sum, dream) => sum + (dream.views_count || 0),
          0
        ) || 0;

      //-------------------------------------
      // FOLLOWERS
      //-------------------------------------
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      //-------------------------------------
      // COMMENTS
      //-------------------------------------
      let commentsCount = 0;

      if (dreamIds.length) {

        const { data: comments } = await supabase
          .from("comments")
          .select("id")
          .in("dream_id", dreamIds)
          .eq("hidden", false);

        const commentIds = comments?.map(c => c.id) || [];

        const visibleCommentsCount = comments?.length || 0;

        let repliesCount = 0;

        if (commentIds.length) {
          const { count } = await supabase
            .from("comment_replies")
            .select("*", {
              count: "exact",
              head: true,
            })
            .in("comment_id", commentIds);

          repliesCount = count || 0;
        }

        commentsCount =
          visibleCommentsCount +
          repliesCount;
      }
      

      //-------------------------------------
      // REACTIONS / LIKES
      //-------------------------------------
      let likesCount = 0;

      if (dreamIds.length) {
        const { count } = await supabase
          .from("likes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .in("dream_id", dreamIds);

        likesCount = count || 0;
      }

      //-------------------------------------
      // RECENT ACTIVITY
      //-------------------------------------
      const recentData =
        dreams?.slice(0, 10).map((dream) => ({
          id: dream.id,
          dream: dream.title,
          views: dream.views_count || 0,
          reactions: 0,
          comments: 0,
          time: formatDate(dream.created_at),
        })) || [];

      //-------------------------------------
      // Add likes/comments counts per dream
      //-------------------------------------
      for (let item of recentData) {
        const { count: likes } = await supabase
          .from("likes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("dream_id", item.id);

        const { data: dreamComments } = await supabase
          .from("comments")
          .select("id")
          .eq("dream_id", item.id)
          .eq("hidden", false);

        const commentIds =
          dreamComments?.map(c => c.id) || [];

        let replyCount = 0;

        if (commentIds.length) {
          const { count } = await supabase
            .from("comment_replies")
            .select("*", {
              count: "exact",
              head: true,
            })
            .in("comment_id", commentIds);

          replyCount = count || 0;
        }

        item.comments =
          (dreamComments?.length || 0)
          +
          replyCount;

        item.reactions = likes || 0;
       
      }

      setRecent(recentData);

      //-------------------------------------
      // STREAK
      //-------------------------------------
      const uniqueDates = [
        ...new Set(
          dreams?.map(
            dream => dream.created_at?.split("T")[0]
          ) || []
        ),
      ];

      uniqueDates.sort().reverse();

      let currentStreak = 0;
      let currentDate = new Date();

      for (;;) {
        const day = currentDate
          .toISOString()
          .split("T")[0];

        if (uniqueDates.includes(day)) {
          currentStreak++;
          currentDate.setDate(
            currentDate.getDate() - 1
          );
        } else {
          break;
        }
      }

      setStreak(currentStreak);

      //-------------------------------------
      // MOODS
      //-------------------------------------
      const moodMap: Record<string, number> = {};

      dreams?.forEach((dream) => {
        if (!dream.mood) return;

        moodMap[dream.mood] =
          (moodMap[dream.mood] || 0) + 1;
      });

      const totalMoods = Object.values(moodMap).reduce(
        (a, b) => a + b,
        0
      );

      const moodStats = Object.entries(moodMap)
        .map(([mood, count]) => ({
          mood,
          pct: Math.round(
            (count / totalMoods) * 100
          ),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);

      setMoods(moodStats);

      //-------------------------------------
      // STATS
      //-------------------------------------
      setStats({
        views: totalViews,
        reactions: likesCount,
        comments: commentsCount,
        followers: followersCount || 0,
      });

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">Loading Dashboard...</div>
      </AppLayout>
    );
  }

  const week = Array.from(
    { length: 7 },
    (_, i) => i < streak
  );

  return (
    <AppLayout>
      <BackButton />

      <h2 className="font-display text-2xl sm:text-3xl mb-6">
        Dashboard
      </h2>

      <div className="rounded-3xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs text-muted-foreground">
              Dream Level
            </p>

            <h3 className="text-xl font-bold text-orange-400">
              Lv. {dreamLevel}
            </h3>

            <p className="text-sm">
              {currentLevelData?.title}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              XP
            </p>

            <h3 className="text-lg font-semibold">
              {dreamXP}
            </h3>
          </div>

        </div>

        <div className="mt-3">
          <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
            <div
              className="h-full bg-orange-400"
              style={{
                width: `${progressData.progress}%`,
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {dreamXP} / {progressData.requiredXP} XP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={Eye}
          label="Total views"
          value={stats.views}
        />

        <StatCard
          icon={Heart}
          label="Total reactions"
          value={stats.reactions}
        />

        <StatCard
          icon={MessageCircle}
          label="Comments"
          value={stats.comments}
        />

        <StatCard
          icon={Users}
          label="Followers"
          value={stats.followers}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h3 className="font-display text-lg mb-4">
            Recent activity
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left py-2">
                    Dream
                  </th>
                  <th className="text-right py-2">
                    Views
                  </th>
                  <th className="text-right py-2">
                    Reactions
                  </th>
                  <th className="text-right py-2">
                    Comments
                  </th>
                </tr>
              </thead>

              <tbody>
                {recent.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border/60"
                  >
                    <td className="py-3">
                      <p className="font-medium">
                        {r.dream}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.time}
                      </p>
                    </td>

                    <td className="text-right">
                      {r.views}
                    </td>

                    <td className="text-right">
                      {r.reactions}
                    </td>

                    <td className="text-right">
                      {r.comments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border/60 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Dream streak
            </p>

            <p className="font-display text-4xl mt-2 text-prophetic">
              {streak}
              <span className="text-base text-muted-foreground">
                {" "}days
              </span>
            </p>

            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {week.map((on, i) => (
                <div
                  key={i}
                  className={`h-7 rounded ${
                    on
                      ? "bg-primary"
                      : "bg-muted/60"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Top moods
            </p>

            <div className="mt-3 space-y-3">
              {moods.map((m) => (
                <div key={m.mood}>
                  <div className="flex justify-between text-xs">
                    <span>{m.mood}</span>
                    <span>{m.pct}%</span>
                  </div>

                  <div className="h-2 mt-1 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${m.pct}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: any) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <p className="font-display text-2xl sm:text-3xl mt-2">
        {value}
      </p>
    </div>
  );
}