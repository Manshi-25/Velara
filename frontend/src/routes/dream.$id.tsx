
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import {
  Heart, MessageCircle, Eye, Bookmark, Share2, Send, Moon, Quote,
  UserPlus, Sparkles, Languages, MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatActionButton } from "@/components/chat/ChatActionButton";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/dream/$id")({
  component: DreamDetail,
});

function DreamDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [dream, setDream]                   = useState<any>(null);
  const [dreamProfile, setDreamProfile]     = useState<any>(null); // author's profile
  const [loading, setLoading]               = useState(true);
  const [currentUserId, setCurrentUserId]   = useState<string | null>(null);
  const [myProfile, setMyProfile]           = useState<any>(null);
  const [isFollowing, setIsFollowing]       = useState(false);

  const [liked, setLiked]                   = useState(false);
  const [likesCount, setLikesCount]         = useState(0);
  const [saved, setSaved]                   = useState(false);

  const [comment, setComment]               = useState("");
  const [comments, setComments]             = useState<any[]>([]);
  const [commentLikes, setCommentLikes]     = useState<any[]>([]);
  const [hiddenComments, setHiddenComments] = useState<any[]>([]);
  const [showHiddenComments, setShowHiddenComments] = useState(false);

  const [replies, setReplies]               = useState<any[]>([]);
  const [replyingTo, setReplyingTo]         = useState<string | null>(null);
  const [replyTexts, setReplyTexts]         = useState<Record<string, string>>({});

  const [openMenuId, setOpenMenuId]             = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText]                 = useState("");
  const [openReplyMenuId, setOpenReplyMenuId]   = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId]     = useState<string | null>(null);
  const [editReplyText, setEditReplyText]       = useState("");

  const [showShareModal, setShowShareModal] = useState(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadDream();
    loadComments();
    loadHiddenComments();
    loadReplies();
    loadLikes();
    loadCommentLikes();
    loadSavedStatus();
    const timer = setTimeout(() => { incrementView(); }, 10000);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
      if (data.user?.id) {
        const { data: p } = await supabase
          .from("profiles").select("*").eq("id", data.user.id).single();
        setMyProfile(p);
      }
    }
    getUser();
  }, []);

  // ── loadDream: two-step fetch to avoid FK issue ───────────────────────────
  // dreams.user_id → auth.users (not profiles), so PostgREST can't auto-join
  // profiles. We fetch dream first, then fetch the author's profile separately.
  async function loadDream() {
    setLoading(true);

    // Step 1: fetch dream + comments count
    const { data: dreamData, error } = await supabase
      .from("dreams")
      .select("*, comments(id)")
      .eq("id", id)
      .single() as any;

    if (error || !dreamData) {
      console.error("loadDream error:", error);
      setLoading(false);
      return;
    }

    // Step 2: fetch author profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("anonymous_name, dream_vibe, state, show_location, avatar_gradient, avatar_url, gradient_start, gradient_end")
      .eq("id", dreamData.user_id)
      .single();

    setDreamProfile(profileData || null);
    setDream({ ...dreamData, comments_count: dreamData.comments?.length ?? 0 });

    // Check follow status now that we have user_id
    const { data: { user } } = await supabase.auth.getUser();
    if (user && dreamData.user_id && user.id !== dreamData.user_id) {
      const { data: follow } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", dreamData.user_id)
        .maybeSingle();
      setIsFollowing(!!follow);
    }

    setLoading(false);
  }

  // ── Comments: also two-step for the same FK reason ────────────────────────
  async function loadComments() {
    // comments.user_id → auth.users; comments also has a profiles join
    // Use the hint syntax if FK name exists, otherwise do two-step
    const { data, error } = await supabase
      .from("comments")
      .select("*, comment_likes(id, user_id)")
      .eq("dream_id", id)
      .eq("hidden", false)
      .order("created_at", { ascending: false });

    if (error) { console.error("loadComments error:", error); return; }

    if (!data || data.length === 0) { setComments([]); return; }

    // Batch-fetch all comment author profiles
    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, anonymous_name, avatar_gradient, avatar_url, gradient_start, gradient_end")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const enriched = data.map((c: any) => ({
      ...c,
      profiles: profileMap[c.user_id] || null,
    }));

    setComments(enriched);
  }

  async function loadHiddenComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("dream_id", id)
      .eq("hidden", true)
      .order("created_at", { ascending: false });

    if (error || !data) { setHiddenComments([]); return; }

    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    if (userIds.length === 0) { setHiddenComments([]); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, anonymous_name, avatar_gradient, avatar_url, gradient_start, gradient_end")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    setHiddenComments(data.map((c: any) => ({ ...c, profiles: profileMap[c.user_id] || null })));
  }

  async function loadReplies() {
    const { data, error } = await supabase
      .from("comment_replies")
      .select(`
        *,
        author:profiles!comment_replies_user_id_fkey ( id, anonymous_name ),
        replied_user:profiles!comment_replies_replied_to_user_id_fkey ( anonymous_name ),
        reply_likes(id, user_id),
        comments!inner (dream_id)
      `)
      .eq("comments.dream_id", id)
      .order("created_at", { ascending: true });

    if (error) { console.error("loadReplies error:", error); }
    setReplies(data || []);
  }

  async function loadLikes() {
    const { data: { user } } = await supabase.auth.getUser();
    const { count } = await supabase
      .from("likes").select("*", { count: "exact", head: true }).eq("dream_id", id);
    setLikesCount(count || 0);
    if (!user) { setLiked(false); return; }
    const { data } = await supabase
      .from("likes").select("id").eq("dream_id", id).eq("user_id", user.id).maybeSingle();
    setLiked(!!data);
  }

  async function loadCommentLikes() {
    const { data } = await supabase.from("comment_likes").select("*");
    setCommentLikes(data || []);
  }

  async function loadSavedStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("saved_dreams").select("id").eq("dream_id", id).eq("user_id", user.id).maybeSingle();
    setSaved(!!data);
  }

  async function incrementView() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase
      .from("dream_views").select("id").eq("dream_id", id).eq("user_id", user.id).maybeSingle();
    if (existing) return;
    await supabase.from("dream_views").insert({ dream_id: id, user_id: user.id });
    await supabase.rpc("increment_dream_views", { dream_id_input: id });
  }

  // ── Interactions ───────────────────────────────────────────────────────────
  async function toggleLike() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); return; }
    if (liked) {
      await supabase.from("likes").delete().eq("dream_id", id).eq("user_id", user.id);
      setLiked(false); setLikesCount(p => p - 1);
    } else {
      await supabase.from("likes").insert({ dream_id: id, user_id: user.id });
      setLiked(true); setLikesCount(p => p + 1);
    }
  }

  async function toggleFollow() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Login required"); return; }
    if (user.id === dream.user_id) return;
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", dream.user_id);
      setIsFollowing(false); toast.success("Unfollowed");
    } else {
      await supabase.from("followers").insert({ follower_id: user.id, following_id: dream.user_id });
      setIsFollowing(true); toast.success("Echoing 🌙");
    }
  }

  async function toggleCommentLike(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = commentLikes.find(l => l.comment_id === commentId && l.user_id === user.id);
    if (existing) {
      await supabase.from("comment_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }
    await loadCommentLikes();
    await loadComments();
  }

  async function toggleReplyLike(replyId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const reply = replies.find(r => r.id === replyId);
    const existing = reply?.reply_likes?.find((l: any) => l.user_id === user.id);
    if (existing) {
      await supabase.from("reply_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("reply_likes").insert({ reply_id: replyId, user_id: user.id });
    }
    await loadReplies();
  }

  async function toggleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); return; }
    if (saved) {
      await supabase.from("saved_dreams").delete().eq("dream_id", id).eq("user_id", user.id);
      setSaved(false); toast.success("Dream removed from saved");
    } else {
      await supabase.from("saved_dreams").insert({ dream_id: id, user_id: user.id });
      setSaved(true); toast.success("Dream saved ✨");
    }
  }

  async function postComment() {
    if (!comment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("comments").insert({ dream_id: id, user_id: user.id, comment });
    if (error) { toast.error("Failed to add whisper"); return; }
    setComment("");
    toast.success("Whisper added 🌙");
    await loadComments();
    await loadDream();
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) { toast.error("Failed to delete comment"); return; }
    toast.success("Comment deleted");
    loadComments(); loadDream();
  }

  async function updateComment(commentId: string) {
    if (!editText.trim()) return;
    const { error } = await supabase.from("comments").update({ comment: editText }).eq("id", commentId);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Comment updated");
    setEditingCommentId(null); setEditText("");
    loadComments();
  }

  async function hideComment(commentId: string) {
    await supabase.from("comments").update({ hidden: true }).eq("id", commentId);
    toast.success("Comment hidden");
    await loadComments(); await loadHiddenComments();
  }

  async function unhideComment(commentId: string) {
    await supabase.from("comments").update({ hidden: false }).eq("id", commentId);
    toast.success("Comment restored");
    await loadComments(); await loadHiddenComments();
  }

  async function postReply(commentId: string, repliedToUserId: string) {
    const text = replyTexts[commentId];
    if (!text?.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("comment_replies").insert({
      comment_id: commentId, user_id: user.id, reply: text, replied_to_user_id: repliedToUserId,
    });
    if (error) { toast.error("Failed to reply"); return; }
    toast.success("Reply added");
    setReplyTexts(p => ({ ...p, [commentId]: "" }));
    setReplyingTo(null);
    loadReplies();
  }

  async function deleteReply(replyId: string) {
    const { error } = await supabase.from("comment_replies").delete().eq("id", replyId);
    if (error) { toast.error("Failed to delete reply"); return; }
    toast.success("Reply deleted");
    loadReplies();
  }

  async function updateReply(replyId: string) {
    if (!editReplyText.trim()) return;
    const { error } = await supabase.from("comment_replies").update({ reply: editReplyText }).eq("id", replyId);
    if (error) { toast.error("Failed to update reply"); return; }
    toast.success("Reply updated");
    setEditingReplyId(null); setEditReplyText("");
    loadReplies();
  }

  // ── Share ──────────────────────────────────────────────────────────────────
  const dreamUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/dream/${id}`;

  async function copyLink() {
    await navigator.clipboard.writeText(dreamUrl);
    toast.success("Link copied");
    setShowShareModal(false);
  }
  function shareWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this dream: ${dream.title}\n${dreamUrl}`)}`, "_blank");
    setShowShareModal(false);
  }
  function shareInstagram() {
    navigator.clipboard.writeText(dreamUrl);
    toast.success("Link copied. Paste it in Instagram DM or Story.");
    setShowShareModal(false);
  }

  async function goToUserProfile(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) navigate({ to: "/account" });
    else navigate({ to: "/profile/$id", params: { id: userId } });
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function getTimeAgo(dateString?: string | null) {
    if (!dateString) return "";
    const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);
    if (minutes < 1)  return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24)   return `${hours}h ago`;
    if (days === 1)   return "1d ago";
    if (days < 7)     return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">Loading dream…</div>
      </AppLayout>
    );
  }

  if (!dream) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">Dream not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 text-white">

        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6">
          <BackButton />
          <div className="flex items-center gap-4 text-muted-foreground">
            <button onClick={toggleSave} className={`transition ${saved ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}>
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
            <button onClick={() => setShowShareModal(true)} className="hover:text-white transition">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* TAG */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-300 text-xs mb-5">
          <Sparkles className="h-3 w-3" />{dream.mood}
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light leading-tight tracking-tight">{dream.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-orange-100/70">
          <div className="flex items-center gap-1"><Moon className="h-3.5 w-3.5" /><span>{getTimeAgo(dream.created_at)}</span></div>
          <span>•</span>
          <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /><span>{dream.views_count || 0}</span></div>
          {dreamProfile?.show_location && dreamProfile?.state && (
            <p className="flex items-center gap-1"><span>•</span>📍 {dreamProfile.state}</p>
          )}
        </div>

        {/* AUTHOR CARD */}
        <div className="mt-6 rounded-3xl border border-border/60 bg-card p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 cursor-pointer" onClick={() => goToUserProfile(dream.user_id)}>
            <UserAvatar
              avatarUrl={dreamProfile?.avatar_url}
              avatarGradient={dreamProfile?.avatar_gradient}
              name={dreamProfile?.anonymous_name}
              size="md"
              className="shadow-[0_0_15px_rgba(204,132,67,0.2)] shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{dreamProfile?.anonymous_name}</h3>
              <p className="text-xs text-muted-foreground">{dreamProfile?.dream_vibe || "Night Wanderer"}</p>
            </div>
          </div>
          {currentUserId && currentUserId !== dream.user_id && (
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={toggleFollow}
                className="rounded-full bg-[#cc8443] hover:bg-[#b57337] text-black text-xs sm:text-sm font-medium transition shadow-[0_0_15px_rgba(204,132,67,0.15)]">
                <UserPlus className="h-4 w-4 mr-2" />{isFollowing ? "Echoing" : "Echo"}
              </Button>
              <ChatActionButton userId={dream.user_id} />
            </div>
          )}
        </div>

        {/* COVER IMAGE */}
        {dream.cover && (
          <div className="mt-6 overflow-hidden rounded-3xl border border-border/50 bg-card">
            <img src={dream.cover} alt={dream.title} className="w-full h-[220px] sm:h-[320px] md:h-[380px] object-cover" />
          </div>
        )}

        {/* TAGS */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {dream.type && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">🌌 {dream.type}</span>}
          {dream.dream_time && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">🕒 {dream.dream_time}</span>}
        </div>

        {/* BODY */}
        <article className="mt-6 bg-card border border-border/60 rounded-3xl p-5 sm:p-8 relative overflow-hidden">
          <Quote className="absolute -top-2 -left-2 h-20 w-20 text-white/5 pointer-events-none" />
          <p className="relative text-base sm:text-lg leading-relaxed whitespace-pre-line text-foreground/90 first-letter:font-display first-letter:text-5xl first-letter:sm:text-6xl first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:text-[#cc8443] first-letter:font-bold">
            {dream.body}
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-xs text-muted-foreground hover:text-white transition">
              <Languages className="h-4 w-4" />Translate this dream
            </button>
          </div>
        </article>

        {/* ACTIONS */}
        <div className="mt-5 rounded-3xl border border-border/60 bg-card px-5 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 text-muted-foreground">
            <button onClick={toggleLike}
              className={`flex items-center gap-2 transition text-sm ${liked ? "text-red-400" : "hover:text-red-400"}`}>
              <Heart className={`h-4 w-4 ${liked ? "fill-current text-red-400" : ""}`} />{likesCount}
            </button>
            <div className="text-xs text-orange-300">✨ 0 similar</div>
          </div>
          <div className="flex items-center gap-5 text-muted-foreground">
            <button onClick={toggleSave} className={`transition ${saved ? "text-yellow-400" : "hover:text-yellow-400"}`}>
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
            <button onClick={() => setShowShareModal(true)} className="hover:text-white transition">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* COMMENTS / WHISPERS */}
        <div className="mt-6 rounded-3xl border border-border/60 bg-card p-5 sm:p-7">
          <div className="relative mb-8">
            <h2 className="text-2xl font-light text-center">Whispers</h2>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 text-[#cc8443]" />
              {comments.length + replies.filter(r => comments.some(c => c.id === r.comment_id)).length}
            </div>
          </div>

          {/* Comment input */}
          <div className="flex items-center gap-2 sm:gap-3">
            <UserAvatar profile={myProfile} size="sm" className="shrink-0" />
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && comment.trim()) postComment(); }}
                placeholder="Share a quiet thought…"
                className="flex-1 min-w-0 h-10 sm:h-11 rounded-full bg-background border border-border/60 px-4 sm:px-5 text-sm outline-none focus:border-orange-400/40"
              />
              <button onClick={postComment}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#cc8443] hover:bg-[#b57337] transition text-black flex items-center justify-center shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="mt-8 space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <p className="text-center italic text-muted-foreground">Be the first to whisper back.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl bg-background border border-border/50 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    {/* Author avatar */}
                    <div className="shrink-0 cursor-pointer" onClick={() => goToUserProfile(c.user_id)}>
                      <UserAvatar
                        avatarUrl={c.profiles?.avatar_url}
                        avatarGradient={c.profiles?.avatar_gradient}
                        name={c.profiles?.anonymous_name}
                        size="sm"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm cursor-pointer hover:text-accent"
                            onClick={() => goToUserProfile(c.user_id)}>
                            {c.profiles?.anonymous_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">{getTimeAgo(c.created_at)}</span>
                        </div>
                        {/* Actions menu */}
                        {(currentUserId === c.user_id || currentUserId === dream.user_id) && (
                          <div className="relative shrink-0">
                            <button onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                              className="text-muted-foreground hover:text-white p-1">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenuId === c.id && (
                              <div className="absolute right-0 top-6 w-32 bg-card border border-border rounded-xl shadow-lg z-50">
                                {currentUserId === c.user_id && (
                                  <>
                                    <button onClick={() => { setEditingCommentId(c.id); setEditText(c.comment); setOpenMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Edit</button>
                                    <button onClick={() => { deleteComment(c.id); setOpenMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-sm text-red-400">Delete</button>
                                  </>
                                )}
                                {currentUserId === dream.user_id && currentUserId !== c.user_id && (
                                  <button onClick={() => { hideComment(c.id); setOpenMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-yellow-500/10 text-sm">Hide</button>
                                )}
                                {currentUserId === dream.user_id && currentUserId === c.user_id && (
                                  <button onClick={() => { hideComment(c.id); setOpenMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-yellow-500/10 text-sm">Hide</button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Comment text / edit */}
                      {editingCommentId === c.id ? (
                        <div className="mt-1">
                          <textarea value={editText} onChange={e => setEditText(e.target.value)}
                            className="w-full rounded-xl bg-black/20 border border-border p-2 text-sm" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => updateComment(c.id)}
                              className="px-3 py-1 rounded-lg bg-[#cc8443] hover:bg-[#b57337] text-black text-xs">Save</button>
                            <button onClick={() => { setEditingCommentId(null); setEditText(""); }}
                              className="px-3 py-1 rounded-lg bg-white/10 text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-white/90 leading-relaxed break-words">{c.comment}</p>
                      )}

                      {/* Like + Reply */}
                      <div className="flex items-center gap-5 mt-3">
                        <button onClick={() => toggleCommentLike(c.id)}
                          className={`flex items-center gap-1 text-xs transition ${
                            commentLikes.some(l => l.comment_id === c.id && l.user_id === currentUserId) ? "text-red-400" : "text-muted-foreground hover:text-red-400"
                          }`}>
                          <Heart className={`h-3.5 w-3.5 ${commentLikes.some(l => l.comment_id === c.id && l.user_id === currentUserId) ? "fill-current" : ""}`} />
                          {c.comment_likes?.length || 0}
                        </button>
                        <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-orange-300 transition">
                          Reply ({replies.filter(r => r.comment_id === c.id).length})
                        </button>
                      </div>

                      {/* Reply input */}
                      {replyingTo === c.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={replyTexts[c.id] || ""}
                            onChange={e => setReplyTexts(p => ({ ...p, [c.id]: e.target.value }))}
                            placeholder="Write a reply…"
                            className="flex-1 rounded-xl bg-black/20 border border-border px-3 py-2 text-sm"
                          />
                          <button onClick={() => postReply(c.id, c.user_id)}
                            className="px-4 py-2 rounded-xl bg-[#cc8443] text-black text-sm">Send</button>
                        </div>
                      )}

                      {/* Replies */}
                      <div className="mt-3 ml-6 space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {replies.filter(r => r.comment_id === c.id).map(reply => (
                          <div key={reply.id} className="rounded-xl bg-black/10 border border-border/30 p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-[#cc8443] text-black flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                  onClick={() => goToUserProfile(reply.user_id)}>
                                  {reply.author?.anonymous_name?.[0]}
                                </div>
                                <span className="font-medium text-xs cursor-pointer" onClick={() => goToUserProfile(reply.user_id)}>
                                  {reply.author?.anonymous_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{getTimeAgo(reply.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleReplyLike(reply.id)}
                                  className={`flex items-center gap-1 transition ${reply.reply_likes?.some((l: any) => l.user_id === currentUserId) ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}>
                                  <Heart className={`h-3.5 w-3.5 ${reply.reply_likes?.some((l: any) => l.user_id === currentUserId) ? "fill-current" : ""}`} />
                                  {reply.reply_likes?.length || 0}
                                </button>
                                {currentUserId === reply.user_id && (
                                  <div className="relative">
                                    <button onClick={() => setOpenReplyMenuId(openReplyMenuId === reply.id ? null : reply.id)}>
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                    {openReplyMenuId === reply.id && (
                                      <div className="absolute right-0 top-5 w-28 rounded-xl border border-border bg-card z-50">
                                        <button onClick={() => { setEditingReplyId(reply.id); setEditReplyText(reply.reply); setOpenReplyMenuId(null); }}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Edit</button>
                                        <button onClick={() => { deleteReply(reply.id); setOpenReplyMenuId(null); }}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-400">Delete</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingReplyId === reply.id ? (
                              <div className="mt-2">
                                <textarea value={editReplyText} onChange={e => setEditReplyText(e.target.value)}
                                  className="w-full rounded-xl p-2 bg-black/20 border border-border text-sm" />
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => updateReply(reply.id)}
                                    className="px-4 py-1.5 rounded-xl bg-[#cc8443] hover:bg-[#b57337] text-black text-xs">Save</button>
                                  <button onClick={() => { setEditingReplyId(null); setEditReplyText(""); }}
                                    className="px-4 py-1.5 rounded-xl border border-border text-xs hover:bg-white/5">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-sm">
                                <span className="text-orange-300 font-medium">@{reply.replied_user?.anonymous_name}</span>{" "}
                                {reply.reply}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Hidden comments toggle */}
          <div className="mt-4">
            <button onClick={() => setShowHiddenComments(!showHiddenComments)}
              className="text-sm text-orange-300 hover:text-orange-200">
              {showHiddenComments ? "Hide Hidden Comments" : `Show Hidden Comments (${hiddenComments.length})`}
            </button>
            {showHiddenComments && (
              <div className="mt-4 space-y-3 border-t border-border pt-4 max-h-[200px] overflow-y-auto pr-2">
                {hiddenComments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">No hidden comments</p>
                ) : (
                  hiddenComments.map(c => (
                    <div key={c.id} className="rounded-2xl bg-background border border-border/50 p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          avatarUrl={c.profiles?.avatar_url}
                          name={c.profiles?.anonymous_name}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{c.profiles?.anonymous_name || "Anonymous"}</span>
                              <span className="text-xs text-muted-foreground">{getTimeAgo(c.created_at)}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">Hidden</span>
                            </div>
                            {currentUserId === dream.user_id && (
                              <button onClick={() => unhideComment(c.id)}
                                className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20 hover:bg-green-500/20 transition">
                                Unhide
                              </button>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-white/90 leading-relaxed break-words">{c.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* SIMILAR DREAMS */}
        <div className="mt-10">
          <h2 className="text-2xl sm:text-3xl font-light mb-5">✨ Similar Dreams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(item => (
              <div key={item} className="overflow-hidden rounded-3xl border border-border/60 bg-card hover:scale-[1.02] transition cursor-pointer">
                <img src={`https://picsum.photos/600/80${item}`} className="w-full h-56 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-base">
                    {item === 1 ? "The shifting city" : item === 2 ? "Forgotten exam" : "The glass hallway"}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowShareModal(false)}>
          <div className="bg-card border border-border rounded-3xl p-6 w-[90%] max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Share Dream</h3>
            <div className="space-y-3">
              <button onClick={shareWhatsapp} className="w-full rounded-xl border border-border p-3 text-left hover:bg-white/5">📱 WhatsApp</button>
              <button onClick={shareInstagram} className="w-full rounded-xl border border-border p-3 text-left hover:bg-white/5">📸 Instagram DM</button>
              <button onClick={shareInstagram} className="w-full rounded-xl border border-border p-3 text-left hover:bg-white/5">🌟 Instagram Story</button>
              <button onClick={copyLink} className="w-full rounded-xl border border-border p-3 text-left hover:bg-white/5">🔗 Copy Link</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-4 rounded-xl bg-[#cc8443] text-black py-2">Close</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

