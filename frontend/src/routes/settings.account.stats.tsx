import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Flame, Star, Trophy, Moon, Eye, Heart, MessageCircle } from "lucide-react";
 
export const Route = createFileRoute("/settings/account/stats")({
  component: StatsPage,
});
 
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border rounded-2xl p-4 flex flex-col gap-2">
      <div className={`h-9 w-9 rounded-xl bg-primary/10 grid place-items-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[11px] text-accent">{sub}</p>}
    </div>
  );
}
 
// EXACT SAME DREAM_LEVELS as dashboard
const DREAM_LEVELS = [
  { level: 1, name: "Dreamer", xpRequired: 0 },
  { level: 2, name: "Moon Wanderer", xpRequired: 100 },
  { level: 3, name: "Astral Traveler", xpRequired: 300 },
  { level: 4, name: "Dream Weaver", xpRequired: 500 },
  { level: 5, name: "Oneiromancer", xpRequired: 800 },
  { level: 6, name: "Dream Sovereign", xpRequired: 1200 },
  { level: 7, name: "Cosmic Dreamer", xpRequired: 1800 },
  { level: 8, name: "Eternal Dreamer", xpRequired: 2500 },
  { level: 9, name: "Mythic Dreamer", xpRequired: 3500 },
  { level: 10, name: "Dream God", xpRequired: 5000 },
];
 
// EXACT SAME getLevelProgress as dashboard
function getLevelProgress(xp: number): { currentLevel: number; nextLevelXp: number; progress: number } {
  let currentLevel = 1;
  let nextLevelXp = DREAM_LEVELS[1]?.xpRequired || 100;
 
  for (let i = 0; i < DREAM_LEVELS.length - 1; i++) {
    if (xp >= DREAM_LEVELS[i + 1].xpRequired) {
      currentLevel = DREAM_LEVELS[i + 1].level;
      nextLevelXp = DREAM_LEVELS[i + 2]?.xpRequired || DREAM_LEVELS[i + 1].xpRequired + 100;
    } else {
      nextLevelXp = DREAM_LEVELS[i + 1].xpRequired;
      break;
    }
  }
 
  const currentLevelXp = DREAM_LEVELS[currentLevel - 1].xpRequired;
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress = Math.min((xpInLevel / xpNeeded) * 100, 100);
 
  return { currentLevel, nextLevelXp, progress };
}
 
const ACHIEVEMENTS = [
  { id: "first_dream",   label: "First Dream",      desc: "Posted your first dream",  emoji: "🌱", threshold: 1,   field: "posts_count" },
  { id: "ten_dreams",    label: "Dream Weaver",     desc: "Posted 10 dreams",          emoji: "🌙", threshold: 10,  field: "posts_count" },
  { id: "fifty_dreams",  label: "Oneiromancer",     desc: "Posted 50 dreams",          emoji: "🔮", threshold: 50,  field: "posts_count" },
  { id: "streak_7",      label: "Week of Visions",  desc: "7-day streak",              emoji: "🔥", threshold: 7,   field: "streak" },
  { id: "streak_30",     label: "Dream Sovereign",  desc: "30-day streak",             emoji: "👑", threshold: 30,  field: "streak" },
  { id: "followers_10",  label: "Echo Starter",     desc: "10 Echoers",                emoji: "💫", threshold: 10,  field: "followers_count" },
  { id: "followers_100", label: "Dream Echo",       desc: "100 Echoers",               emoji: "🌊", threshold: 100, field: "followers_count" },
  { id: "likes_50",      label: "Beloved Dreamer",  desc: "50 total likes received",   emoji: "❤️", threshold: 50,  field: "total_likes" },
  { id: "comments_25",   label: "Conversation Starter", desc: "25 comments received", emoji: "💬", threshold: 25, field: "total_comments" },
];
 
function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    views: 0,
    reactions: 0,
    comments: 0,
    followers: 0,
    following: 0,
    posts_count: 0,
    streak: 0,
    dream_xp: 0,
    dream_level: 1,
    created_at: "",
  });
 
  useEffect(() => {
    loadStats();
 
    // Realtime: re-fetch XP and level whenever profiles row changes
    let userId: string;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;
      const channel = supabase
        .channel("stats-xp-realtime")
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        }, (payload) => {
          setStats((prev) => ({
            ...prev,
            dream_xp: payload.new.dream_xp ?? prev.dream_xp,
            dream_level: payload.new.dream_level ?? prev.dream_level,
          }));
        })
        .subscribe();
 
      return () => { supabase.removeChannel(channel); };
    });
  }, []);
 
  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      // PROFILE DATA
      //-------------------------------------
      const { data: profile } = await supabase
        .from("profiles")
        .select("posts_count, followers_count, following_count, dream_xp, dream_level, created_at")
        .eq("id", user.id)
        .single();
 
      //-------------------------------------
      // TOTAL VIEWS
      //-------------------------------------
      const totalViews = dreams?.reduce((sum, dream) => sum + (dream.views_count || 0), 0) || 0;
 
      //-------------------------------------
      // FOLLOWERS
      //-------------------------------------
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);
 
      //-------------------------------------
      // COMMENTS ON USER'S DREAMS
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
            .select("*", { count: "exact", head: true })
            .in("comment_id", commentIds);
          repliesCount = count || 0;
        }
 
        commentsCount = visibleCommentsCount + repliesCount;
      }
 
      //-------------------------------------
      // REACTIONS / LIKES ON USER'S DREAMS
      //-------------------------------------
      let likesCount = 0;
      if (dreamIds.length) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("dream_id", dreamIds);
        likesCount = count || 0;
      }
 
      //-------------------------------------
      // STREAK (using same logic as dashboard)
      //-------------------------------------
      const uniqueDates = [
        ...new Set(dreams?.map(dream => dream.created_at?.split("T")[0]) || []),
      ];
      uniqueDates.sort().reverse();
 
      let currentStreak = 0;
      let currentDate = new Date();
 
      for (;;) {
        const day = currentDate.toISOString().split("T")[0];
        if (uniqueDates.includes(day)) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
 
      setStats({
        views: totalViews,
        reactions: likesCount,
        comments: commentsCount,
        followers: followersCount || 0,
        following: profile?.following_count || 0,
        posts_count: profile?.posts_count || 0,
        streak: currentStreak,
        dream_xp: profile?.dream_xp || 0,
        dream_level: profile?.dream_level || 1,
        created_at: profile?.created_at || "",
      });
 
      setLoading(false);
    } catch (err) {
      console.error("Error loading stats:", err);
      setLoading(false);
    }
  }
 
  const memberSince = stats.created_at
    ? new Date(stats.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";
 
  // EXACT SAME calculation as dashboard
  const { currentLevel, nextLevelXp, progress } = getLevelProgress(stats.dream_xp);
  const xpToNext = nextLevelXp - stats.dream_xp;
  
  // Get the level name
  const levelData = DREAM_LEVELS.find(l => l.level === currentLevel);
 
  const earnedAchievements = ACHIEVEMENTS.filter((a) => {
    let val = 0;
    switch (a.field) {
      case "total_likes":
        val = stats.reactions || 0;
        break;
      case "total_comments":
        val = stats.comments || 0;
        break;
      case "streak":
        val = stats.streak || 0;
        break;
      default:
        val = (stats as any)[a.field] || 0;
        break;
    }
    return val >= a.threshold;
  });
 
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <BackButton className="mb-4" />
        <p className="text-muted-foreground">Loading stats…</p>
      </div>
    );
  }
 
  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />
 
      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-amber-400" />
        Dream Stats
      </h2>
      <p className="text-muted-foreground text-sm mb-8">Dreamer since {memberSince}</p>
 
      {/* XP & Level - EXACT SAME as dashboard */}
      <div className="bg-card border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <span className="font-semibold">Level {currentLevel}</span>
            <span className="text-xs text-muted-foreground">
              {levelData?.name || "Dreamer"}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">{stats.dream_xp} XP total</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {xpToNext > 0 ? `${xpToNext} XP to Level ${currentLevel + 1}` : "✨ Max level reached!"}
        </p>
      </div>
 
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <StatCard icon={Moon}  label="Dreams Posted"  value={stats.posts_count}    color="text-violet-400" />
        <StatCard icon={Flame} label="Day Streak"     value={stats.streak}         color="text-orange-400" sub={stats.streak >= 7 ? "🔥 On fire!" : undefined} />
        <StatCard icon={Star}  label="Echoers"        value={stats.followers}      color="text-amber-400" />
        <StatCard icon={Eye}   label="Total Views"    value={stats.views}          color="text-sky-400" />
        <StatCard icon={Heart} label="Likes Received" value={stats.reactions}      color="text-rose-400" />
        <StatCard icon={MessageCircle} label="Comments Received" value={stats.comments} color="text-emerald-400" />
      </div>
 
      {/* Achievements */}
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          Achievements
          <span className="ml-auto text-xs text-muted-foreground">
            {earnedAchievements.length}/{ACHIEVEMENTS.length} earned
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((achievement) => {
            let val = 0;
            switch (achievement.field) {
              case "total_likes":
                val = stats.reactions || 0;
                break;
              case "total_comments":
                val = stats.comments || 0;
                break;
              case "streak":
                val = stats.streak || 0;
                break;
              default:
                val = (stats as any)[achievement.field] || 0;
                break;
            }
            const earned = val >= achievement.threshold;
 
            return (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                  earned ? "border-primary/40 bg-primary/5" : "border-border/40 opacity-50 grayscale"
                }`}
              >
                <span className="text-2xl">{achievement.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{achievement.label}</p>
                  <p className="text-[11px] text-muted-foreground">{achievement.desc}</p>
                  {!earned && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {val}/{achievement.threshold}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

