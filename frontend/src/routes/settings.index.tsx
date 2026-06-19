import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Palette,
  Lock,
  Bell,
  Trash2,
  Heart,
  Search,
  ChevronRight,
  LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

type Item = {
  label: string;
  to?: string;
  id?: string;
};

type Section = {
  icon: LucideIcon;
  title: string;
  desc: string;
  items: Item[];
  danger?: boolean;
};

const sections: Section[] = [
  {
    icon: User,
    title: "Account",
    desc: "Name, email, password, avatar",
    items: [
      { label: "Display name" },
      { label: "Email address" },
      { label: "Password" },
      { label: "Avatar" },
    ],
  },

  {
    icon: Heart,
    title: "Activity",
    desc: "Likes, comments, reactions, saved",
    items: [
      { label: "Liked dreams", to: "/settings/likes" },
      { label: "My comments", to: "/settings/comments" },
      { label: "Reactions received", to: "/settings/reactions" },
      { label: "Saved dreams", to: "/settings/saved" },
    ],
  },

  {
    icon: Palette,
    title: "Appearance",
    desc: "Theme, font, accent",
    items: [
      { label: "Theme — Dark" },
      { label: "Accent — Violet" },
      { label: "Reduced motion" },
    ],
  },

  {
    icon: Lock,
    title: "Privacy",
    desc: "Anonymity & visibility",
    items: [
      { label: "Show profile to followers only" },
      { label: "Blur sensitive words" },
      {
        label: "Access location",
        id: "location",
      },
    ],
  },

  {
    icon: Bell,
    title: "Notifications",
    desc: "Match alerts and digests",
    items: [
      { label: "Similar-dream matches" },
      { label: "Weekly digest" },
      { label: "Comments on my dreams" },
    ],
  },

  {
    icon: Trash2,
    title: "Delete dreams or account",
    danger: true,
    desc: "Permanent actions",
    items: [
      { label: "Delete a single dream" },
      { label: "Delete all dreams" },
      { label: "Delete account" },
    ],
  },

  {
    icon: Heart,
    title: "Archive",
    desc: "Archived dreams and drafts",
    items: [
      {
        label: "View Archive",
        to: "/settings/archive",
      },
    ],
  },
];

function SettingsPage() {
  const [q, setQ] = useState("");

  const filtered = sections.filter(
    (section) =>
      !q ||
      section.title.toLowerCase().includes(q.toLowerCase()) ||
      section.desc.toLowerCase().includes(q.toLowerCase())
  );
  const [showLocation, setShowLocation] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    loadLocationSetting();
  }, []);
  
  async function loadLocationSetting() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select(`show_location, location_permission_asked`).eq("id", user.id).single();
    setShowLocation(data?.show_location ?? false);
    setPermissionAsked(data?.location_permission_asked ?? false);
  }

  async function askLocationPermission() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await response.json();
          const state = geoData.address?.state || geoData.address?.city || null;
          await supabase.from("profiles").update({ state, show_location: true, location_permission_asked: true }).eq("id", user.id);
          setShowLocation(true);
          setPermissionAsked(true);
        } catch (err) {
          console.error(err);
        }
      },
      async () => {
        await supabase.from("profiles").update({ show_location: false, location_permission_asked: true }).eq("id", user.id);
        setPermissionAsked(true);
      }
    );
  }

  async function toggleLocation() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoadingLocation(true);
    try {
      if (showLocation) {
        await supabase.from("profiles").update({ show_location: false }).eq("id", user.id);
        setShowLocation(false);
      } else {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const geoData = await response.json();
            const state = geoData.address?.state || geoData.address?.city || null;
            await supabase.from("profiles").update({ state, show_location: true }).eq("id", user.id);
            setShowLocation(true);
            setLoadingLocation(false);
          },
          () => {
            alert("Location permission denied.");
            setLoadingLocation(false);
          }
        );
        return;
      }
    } finally {
      setLoadingLocation(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="text-center font-display text-2xl sm:text-3xl mb-6">
        Settings
      </h2>

      <div className="relative mb-6 max-w-xl mx-auto">
        <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search settings..."
          className="pl-11 h-11 rounded-full"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((section) => {
          const Icon = section.icon;

          return (
            <section
              key={section.title}
              className="bg-card border rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
                  <Icon className="h-5 w-5 text-accent" />
                </div>

                <h3 className="font-display text-lg">
                  {section.title}
                </h3>
              </div>

              <ul className="mt-4 divide-y divide-border/60">
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.id === "location" ? (
                      <button
                        onClick={toggleLocation}
                        disabled={loadingLocation}
                        className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-background/40"
                      >
                        <div className="flex flex-col items-start">
                          <span>{item.label}</span>
                          {item.id === "location" && (
                            <span className="text-xs text-muted-foreground">
                              {showLocation ? "Your state is visible on dreams" : "Your location is hidden"}
                            </span>
                          )}
                        </div>

                        <div
                          className={`w-12 h-6 rounded-full transition ${
                            showLocation
                              ? "bg-[#cc8443]"
                              : "bg-gray-500"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full mt-0.5 transition ${
                              showLocation
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </button>
                    ) : (
                      <Link
                        to={item.to ?? "/settings"}
                        className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-background/40"
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}