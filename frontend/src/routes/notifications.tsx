
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, UserPlus, Sparkles, Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

type Notif = {
  id: string;
  type: "like" | "comment" | "follow" | "reply" | "comment_like" | "reply_like";
  actor_id: string;
  actor_name: string;
  actor_gradient: string | null;
  actor_avatar_url: string | null;
  dream_id?: string;
  dream_title?: string;
  comment_text?: string;
  created_at: string;
  read: boolean;
};

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifs();

    // Realtime: refresh when new notifications arrive for current user
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      }, () => {
        loadNotifs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadNotifs() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);

    // Fetch from notifications table
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id, type, actor_id, dream_id, dream_title, comment_text, created_at, read,
        actor:profiles!notifications_actor_id_fkey ( anonymous_name, avatar_gradient, avatar_url )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifs(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        actor_id: n.actor_id,
        actor_name: n.actor?.anonymous_name || "Someone",
        actor_gradient: n.actor?.avatar_gradient || null,
        actor_avatar_url: n.actor?.avatar_url || null,
        dream_id: n.dream_id,
        dream_title: n.dream_title,
        comment_text: n.comment_text,
        created_at: n.created_at,
        read: n.read,
      })));
    }
    setLoading(false);
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All marked as read");
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function deleteNotif(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  async function clearAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifs([]);
    toast.success("All notifications cleared");
  }

  function getNotifContent(n: Notif) {
    switch (n.type) {
      case "like": return { icon: Heart, color: "text-red-400", bg: "bg-red-500/15", text: `liked your dream${n.dream_title ? ` "${n.dream_title}"` : ""}` };
      case "comment": return { icon: MessageCircle, color: "text-accent", bg: "bg-accent/15", text: `commented on your dream${n.dream_title ? ` "${n.dream_title}"` : ""}${n.comment_text ? `: "${n.comment_text.slice(0, 60)}…"` : ""}` };
      case "follow": return { icon: UserPlus, color: "text-violet-400", bg: "bg-violet-500/15", text: "started following you" };
      case "reply": return { icon: MessageCircle, color: "text-orange-400", bg: "bg-orange-500/15", text: `replied to your comment${n.comment_text ? `: "${n.comment_text.slice(0, 60)}…"` : ""}` };
      case "comment_like": return { icon: Heart, color: "text-pink-400", bg: "bg-pink-500/15", text: `liked your comment${n.comment_text ? `: "${n.comment_text.slice(0, 60)}…"` : ""}` };
      case "reply_like": return { icon: Heart, color: "text-rose-400", bg: "bg-rose-500/15", text: `liked your reply${n.comment_text ? `: "${n.comment_text.slice(0, 60)}…"` : ""}` };
      default: return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted/20", text: "sent you a notification" };
    }
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 rounded-2xl gradient-violet items-center justify-center glow-primary">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl">Notifications</h2>
              {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
            </div>
          </div>
          {notifs.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
                  <Check className="h-3 w-3" /> Mark all read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-red-400 hover:text-red-500">
                <Trash2 className="h-3 w-3" /> Clear all
              </Button>
            </div>
          )}
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No notifications yet</p>
            <p className="text-sm mt-1">When someone likes, comments, or follows you — it'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => {
              const { icon: Icon, color, bg, text } = getNotifContent(n);
              return (
                <div
                  key={n.id}
                  className={`relative flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer ${
                    n.read ? "bg-card border-border/60" : "bg-card border-primary/30 shadow-[0_0_12px_rgba(0,0,0,0.15)]"
                  }`}
                  onClick={() => {
                    markRead(n.id);
                    if (n.dream_id) navigate({ to: "/dream/$id", params: { id: n.dream_id } });
                    else if (n.type === "follow") navigate({ to: "/profile/$id", params: { id: n.actor_id } });
                  }}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                  )}

                  {/* Actor avatar */}
                  <UserAvatar
                    avatarGradient={n.actor_gradient}
                    avatarUrl={n.actor_avatar_url}
                    name={n.actor_name}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />

                  {/* Icon */}
                  <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{n.actor_name}</span>{" "}
                      <span className="text-muted-foreground">{text}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                    className="text-muted-foreground hover:text-red-400 shrink-0 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}