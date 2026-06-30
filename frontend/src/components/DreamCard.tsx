

import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Eye, Bookmark, Share2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const toneClass: Record<string, string> = {
  lucid:     "bg-lucid/15 text-lucid border-lucid/30",
  nightmare: "bg-nightmare/15 text-nightmare border-nightmare/30",
  prophetic: "bg-prophetic/15 text-prophetic border-prophetic/30",
  recurring: "bg-primary/15 text-primary border-primary/30",
  flying:    "bg-accent/15 text-accent border-accent/30",
  magical:   "bg-accent/15 text-accent border-accent/30",
  neutral:   "bg-accent/15 text-accent border-accent/30",
};

const typeLabel: Record<string, string> = {
  lucid:     "Lucid",
  nightmare: "Nightmare",
  prophetic: "Prophetic",
  recurring: "Recurring",
  flying:    "Flying",
  magical:   "Magical",
};

export type HomeDream = {
  id: string;
  title: string;
  body: string;
  cover: string | null;
  type: string | null;
  views_count: number | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
  author: {
    id: string;
    anonymous_name: string | null;
    avatar_gradient: string | null;
    avatar_url: string | null;
    dream_vibe: string | null;
  } | null;
};

export function DreamCard({ dream }: { dream: HomeDream }) {
  const navigate = useNavigate();
  const dreamType = dream.type || "lucid";
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const [liked, setLiked]     = useState(false);
  const [saved, setSaved]     = useState(false);
  const [likeCount, setLikeCount] = useState(dream.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; comment: string; user_id: string }[]>([]);
  const [comment, setComment]   = useState("");
  const [commentCount, setCommentCount] = useState(dream.comments_count || 0);
  const [userId, setUserId]     = useState<string | null>(null);

  useEffect(() => {
    initUser();
  }, [dream.id]);

  async function initUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Check if already liked
    const { data: likeRow } = await supabase
      .from("likes")
      .select("id")
      .eq("dream_id", dream.id)
      .eq("user_id", user.id)
      .maybeSingle();
    setLiked(!!likeRow);

    // Check if already saved
    const { data: saveRow } = await supabase
      .from("saved_dreams")
      .select("id")
      .eq("dream_id", dream.id)
      .eq("user_id", user.id)
      .maybeSingle();
    setSaved(!!saveRow);
  }

  async function handleLike(e: React.MouseEvent) {
    stop(e);
    if (!userId) { toast.error("Sign in to like dreams"); return; }
    if (liked) {
      await supabase.from("likes").delete()
        .eq("dream_id", dream.id).eq("user_id", userId);
      setLiked(false);
      setLikeCount((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("likes").insert({ dream_id: dream.id, user_id: userId });
      setLiked(true);
      setLikeCount((n) => n + 1);
    }
  }

  async function handleSave(e: React.MouseEvent) {
    stop(e);
    if (!userId) { toast.error("Sign in to save dreams"); return; }
    if (saved) {
      await supabase.from("saved_dreams").delete()
        .eq("dream_id", dream.id).eq("user_id", userId);
      setSaved(false);
    } else {
      await supabase.from("saved_dreams").insert({ dream_id: dream.id, user_id: userId });
      setSaved(true);
    }
  }

  async function loadComments(e: React.MouseEvent) {
    stop(e);
    setShowComments((s) => !s);
    if (comments.length === 0) {
      const { data } = await supabase
        .from("comments")
        .select("id, comment, user_id")
        .eq("dream_id", dream.id)
        .eq("hidden", false)
        .order("created_at", { ascending: true })
        .limit(10);
      setComments((data || []).map((c) => ({ id: c.id, comment: c.comment ?? '', user_id: c.user_id ?? '' })));
    }
  }

  async function postComment() {
    if (!userId || !comment.trim()) return;
    const { data, error } = await supabase
      .from("comments")
      .insert({ dream_id: dream.id, user_id: userId, comment: comment.trim() })
      .select("id, comment, user_id")
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, { id: data.id, comment: data.comment ?? '', user_id: data.user_id ?? '' }]);
      setCommentCount((n) => n + 1);
      setComment("");
    }
  }

  function handleShare(e: React.MouseEvent) {
    stop(e);
    navigator.clipboard.writeText(`${window.location.origin}/dream/${dream.id}`);
    toast.success("Link copied!");
  }

  function goToProfile(e: React.MouseEvent) {
    stop(e);
    if (dream.author?.id) {
      navigate({ to: "/profile/$id", params: { id: dream.author.id } });
    }
  }

  const timeAgo = dream.created_at
    ? (() => {
        const diff = Date.now() - new Date(dream.created_at).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : "";

  return (
    <Link
      to="/dream/$id"
      params={{ id: dream.id }}
      className="block bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-accent/50 hover:shadow-[0_0_40px_-10px_oklch(0.65_0.16_50/0.4)] transition group"
    >
      <article className="p-4 sm:p-5">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button onClick={goToProfile} className="shrink-0">
            <UserAvatar
              avatarGradient={dream.author?.avatar_gradient}
              avatarUrl={dream.author?.avatar_url}
              name={dream.author?.anonymous_name || "?"}
              size="sm"
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              <button onClick={goToProfile} className="hover:text-accent transition">
                {dream.author?.anonymous_name || "Anonymous"}
              </button>
              <span className="text-muted-foreground"> · {timeAgo}</span>
            </p>
            <p className="text-xs text-muted-foreground">anonymous dreamer</p>
          </div>
          <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full border ${toneClass[dreamType] ?? toneClass.neutral} inline-flex items-center gap-1 shrink-0`}>
            <Sparkles className="h-3 w-3" /> {typeLabel[dreamType] ?? dreamType}
          </span>
        </header>

        {/* Title & Body */}
        <h3 className="mt-4 font-display text-lg sm:text-xl group-hover:text-accent transition">
          {dream.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {dream.body}
        </p>

        {/* Cover image */}
        {dream.cover && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border/60 aspect-[16/9]">
            <img
              src={dream.cover}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"
            />
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />{(dream.views_count || 0).toLocaleString()}
            </span>
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 transition ${liked ? "text-nightmare" : "hover:text-nightmare"}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={loadComments}
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />{commentCount}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className={saved ? "text-accent" : "hover:text-foreground"}>
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
            <button onClick={handleShare} className="hover:text-foreground">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Inline comments */}
        {showComments && (
          <div onClick={stop} className="mt-3 border-t border-border/60 pt-3 space-y-2">
            {comments.map((c) => (
              <p key={c.id} className="text-sm bg-background/60 rounded-lg px-3 py-2">
                {c.comment ?? ''}
              </p>
            ))}
            {userId && (
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") postComment(); }}
                  placeholder="Add a whisper…"
                  className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent/60"
                />
                <Button size="sm" onClick={postComment}>Post</Button>
              </div>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}