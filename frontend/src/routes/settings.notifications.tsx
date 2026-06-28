import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Heart, UserPlus, Sparkles, Newspaper, Moon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/notifications")({
  component: NotificationsPage,
});

type NotifUpdate = {
  notif_comments?: boolean;
  notif_likes?: boolean;
  notif_reactions?: boolean;
  notif_followers?: boolean;
  notif_matches?: boolean;
  notif_dms?: boolean;
  notif_digest?: boolean;
  notif_dream_reminder?: boolean;
  notif_quiet_hours?: boolean;
};

function Toggle({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors shrink-0 ${
        checked ? "bg-primary" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [notifComments, setNotifComments] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifReactions, setNotifReactions] = useState(true);
  const [notifFollowers, setNotifFollowers] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifDMs, setNotifDMs] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [notifDreamReminder, setNotifDreamReminder] = useState(false);
  const [quietHours, setQuietHours] = useState(false);

  useEffect(() => { loadNotifSettings(); }, []);

  async function loadNotifSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select(
        "notif_comments, notif_likes, notif_reactions, notif_followers, notif_matches, notif_dms, notif_digest, notif_dream_reminder, notif_quiet_hours"
      )
      .eq("id", user.id)
      .single();

    if (data) {
      setNotifComments(data.notif_comments ?? true);
      setNotifLikes(data.notif_likes ?? true);
      setNotifReactions(data.notif_reactions ?? true);
      setNotifFollowers(data.notif_followers ?? true);
      setNotifMatches(data.notif_matches ?? true);
      setNotifDMs(data.notif_dms ?? true);
      setNotifDigest(data.notif_digest ?? false);
      setNotifDreamReminder(data.notif_dream_reminder ?? false);
      setQuietHours(data.notif_quiet_hours ?? false);
    }
    setLoading(false);
  }

  async function update(
    field: keyof NotifUpdate,
    value: boolean,
    setter: (v: boolean) => void,
    label: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(field);
    setter(value);

    const patch: NotifUpdate = { [field]: value };
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);

    if (error) {
      setter(!value);
      toast.error("Failed to save.");
    } else {
      toast.success(`${label} ${value ? "on" : "off"}`);
    }
    setSaving(null);
  }

  const groups = [
    {
      title: "Engagement",
      icon: Heart,
      color: "text-rose-400",
      items: [
        { field: "notif_comments" as keyof NotifUpdate, label: "Comments on my dreams", desc: "When someone drops a thought on your dream", value: notifComments, setter: setNotifComments },
        { field: "notif_likes" as keyof NotifUpdate, label: "Dream likes", desc: "When someone hearts a dream you posted", value: notifLikes, setter: setNotifLikes },
        { field: "notif_reactions" as keyof NotifUpdate, label: "Reactions", desc: "Emoji reactions to your dreams", value: notifReactions, setter: setNotifReactions },
      ],
    },
    {
      title: "Social",
      icon: UserPlus,
      color: "text-violet-400",
      items: [
        { field: "notif_followers" as keyof NotifUpdate, label: "New Echoers", desc: "When someone starts following you", value: notifFollowers, setter: setNotifFollowers },
        { field: "notif_dms" as keyof NotifUpdate, label: "Dream Messages", desc: "New chat requests and messages", value: notifDMs, setter: setNotifDMs },
      ],
    },
    {
      title: "Discoveries",
      icon: Sparkles,
      color: "text-amber-400",
      items: [
        { field: "notif_matches" as keyof NotifUpdate, label: "Similar-dream matches", desc: "When your dream resonates with another dreamer", value: notifMatches, setter: setNotifMatches },
      ],
    },
    {
      title: "Reminders & Digests",
      icon: Newspaper,
      color: "text-sky-400",
      items: [
        { field: "notif_digest" as keyof NotifUpdate, label: "Weekly Digest", desc: "A roundup of dreams you might love", value: notifDigest, setter: setNotifDigest },
        { field: "notif_dream_reminder" as keyof NotifUpdate, label: "Dream Journal Reminder", desc: "Gentle nudge to log last night's dream", value: notifDreamReminder, setter: setNotifDreamReminder },
      ],
    },
    {
      title: "Do Not Disturb",
      icon: Moon,
      color: "text-indigo-400",
      items: [
        { field: "notif_quiet_hours" as keyof NotifUpdate, label: "Quiet Hours (10pm–8am)", desc: "Silence all notifications during sleep hours", value: quietHours, setter: setQuietHours },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <BackButton className="mb-4" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Bell className="h-6 w-6 text-sky-400" />
        Notifications
      </h2>
      <p className="text-muted-foreground text-sm mb-8">Choose what wakes you from your dreams.</p>

      <div className="space-y-4">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${group.color}`} />
                {group.title}
              </h3>
              <div className="divide-y divide-border/60">
                {group.items.map((item) => (
                  <div key={item.field} className="flex items-center justify-between py-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={item.value}
                      onCheckedChange={(v) => update(item.field, v, item.setter, item.label)}
                      disabled={saving === item.field}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}