import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, Shield, Users, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/privacy")({
  component: PrivacyPage,
});

// Strongly typed so .update() never gets a dynamic [key] — no red lines
type PrivacyPatch = {
  blur_sensitive?:         boolean;
  show_location?:          boolean;
  allow_search_discovery?: boolean;
  show_activity_status?:   boolean;
  anonymous_reactions?:    boolean;
  allow_dms?:              boolean;
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

function PrivacyPage() {
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState<keyof PrivacyPatch | null>(null);

  const [blurSensitive,       setBlurSensitive]       = useState(false);
  const [showLocation,        setShowLocation]         = useState(false);
  const [allowSearch,         setAllowSearch]          = useState(true);
  const [showActivityStatus,  setShowActivityStatus]   = useState(true);
  const [anonymousReactions,  setAnonymousReactions]   = useState(false);
  const [allowDMs,            setAllowDMs]             = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("blur_sensitive, show_location, allow_search_discovery, show_activity_status, anonymous_reactions, allow_dms")
      .eq("id", user.id)
      .single();

    if (data) {
      setBlurSensitive(data.blur_sensitive         ?? false);
      setShowLocation(data.show_location           ?? false);
      setAllowSearch(data.allow_search_discovery   ?? true);
      setShowActivityStatus(data.show_activity_status ?? true);
      setAnonymousReactions(data.anonymous_reactions  ?? false);
      setAllowDMs(data.allow_dms                   ?? true);
    }
    setLoading(false);
  }

  async function toggle(
    field: keyof PrivacyPatch,
    value: boolean,
    setter: (v: boolean) => void,
    label: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(field);
    setter(value);

    const patch: PrivacyPatch = { [field]: value };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);

    if (error) { setter(!value); toast.error("Failed to update."); }
    else        { toast.success(`${label} ${value ? "enabled" : "disabled"}`); }

    setSaving(null);
  }

  const groups = [
    {
      title: "Visibility",
      icon: Eye,
      color: "text-emerald-400",
      items: [
        {
          field: "allow_search_discovery" as keyof PrivacyPatch,
          label: "Appear in Search",
          desc:  "Let other dreamers find your profile",
          value: allowSearch,
          setter: setAllowSearch,
        },
        {
          field: "show_activity_status" as keyof PrivacyPatch,
          label: "Show Activity Status",
          desc:  "Let others see when you were last active",
          value: showActivityStatus,
          setter: setShowActivityStatus,
        },
      ],
    },
    {
      title: "Content & Safety",
      icon: Shield,
      color: "text-sky-400",
      items: [
        {
          field: "blur_sensitive" as keyof PrivacyPatch,
          label: "Blur Sensitive Words",
          desc:  "Filter potentially triggering content in your feed",
          value: blurSensitive,
          setter: setBlurSensitive,
        },
        
      ],
    },
    {
      title: "Interactions",
      icon: Users,
      color: "text-violet-400",
      items: [
        {
          field: "allow_dms" as keyof PrivacyPatch,
          label: "Allow Dream Messages",
          desc:  "Let others send you chat requests",
          value: allowDMs,
          setter: setAllowDMs,
        },
      ],
    },
    {
      title: "Location",
      icon: MapPin,
      color: "text-amber-400",
      items: [
        {
          field: "show_location" as keyof PrivacyPatch,
          label: "Show Location",
          desc:  showLocation ? "Your state is visible on your dreams" : "Your location is hidden",
          value: showLocation,
          setter: setShowLocation,
        },
      ],
    },
  ];

  if (loading) return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Lock className="h-6 w-6 text-emerald-400" /> Privacy
      </h2>
      

      <div className="space-y-4">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${group.color}`} /> {group.title}
              </h3>
              <div className="divide-y divide-border/60">
                {group.items.map((item) => (
                  <div key={item.field} className="flex items-center justify-between py-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={item.value}
                      onCheckedChange={(v) => toggle(item.field, v, item.setter, item.label)}
                      disabled={saving === item.field}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Velara is a public platform — all posted dreams are visible to logged-in users.
          </p>
        </div>
      </div>
    </div>
  );
}