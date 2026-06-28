
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
  Archive,
} from "lucide-react";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

type Item = {
  label: string;
  desc?: string;
  to?: string;
  id?: string;
  keywords?: string[];
};

type Section = {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  items: Item[];
  danger?: boolean;
};

const sections: Section[] = [
  {
    icon: User,
    title: "Account",
    desc: "Profile, identity & security",
    color: "text-amber-400",
    items: [
      { label: "Profile & Identity", desc: "Name, bio, vibe, avatar", to: "/settings/account/profile", keywords: ["name", "bio", "vibe", "avatar", "gradient"] },
      { label: "Security", desc: "Change email or password", to: "/settings/account/security", keywords: ["email", "password", "security"] },
      { label: "Dream Stats", desc: "XP, streaks, achievements", to: "/settings/account/stats", keywords: ["xp", "level", "streak", "achievement"] },
      { label: "Data & Export", desc: "Download your dream journal", to: "/settings/account/data", keywords: ["export", "download", "json", "backup"] },
    ],
  },

  {
    icon: Heart,
    title: "Activity",
    desc: "Likes, comments, reactions, saved",
    color: "text-rose-400",
    items: [
      { label: "Liked dreams", desc: "Dreams you've hearted", to: "/settings/likes", keywords: ["heart", "like", "favorite"] },
      { label: "My comments", desc: "Your comment history", to: "/settings/comments", keywords: ["comment", "reply"] },
      { label: "Reactions received", desc: "How dreamers responded", to: "/settings/reactions", keywords: ["reaction", "emoji", "response"] },
      { label: "Saved dreams", desc: "Your dream collection", to: "/settings/saved", keywords: ["save", "bookmark", "collection"] },
    ],
  },

  {
    icon: Palette,
    title: "Appearance",
    desc: "Theme, font, accent color",
    color: "text-violet-400",
    items: [
      { label: "Theme & Colors", desc: "Dark, light, or cosmic", to: "/settings/appearance", keywords: ["accent", "color", "theme", "dark", "light", "font", "size", "glow", "motion", "compact"] },
    ],
  },

  {
    icon: Lock,
    title: "Privacy",
    desc: "Anonymity & visibility",
    color: "text-emerald-400",
    items: [
      { label: "Privacy & Visibility", desc: "Who can see your dreams", to: "/settings/privacy", keywords: ["visibility", "search", "location", "blur", "sensitive", "dms"] },
    ],
  },

  {
    icon: Bell,
    title: "Notifications",
    desc: "Alerts and digests",
    color: "text-sky-400",
    items: [
      { label: "Notification Preferences", desc: "Matches, comments, digests", to: "/settings/notifications", keywords: ["match", "comment", "digest", "reminder", "quiet", "hours"] },
    ],
  },

  {
    icon: Archive,
    title: "Archive",
    desc: "Archived dreams and drafts",
    color: "text-yellow-400",
    items: [
      { label: "View Archive", desc: "Your hidden dreams & drafts", to: "/settings/archive", keywords: ["hidden", "restore", "delete"] },
    ],
  },

  {
    icon: Trash2,
    title: "Danger Zone",
    danger: true,
    desc: "Permanent & irreversible actions",
    color: "text-red-400",
    items: [
      { label: "Delete & Account", desc: "Remove dreams or account", to: "/settings/danger", keywords: ["delete", "remove", "permanent", "account"] },
    ],
  },
];

// Flatten all items for search with keywords
const allSearchItems = sections.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    sectionTitle: section.title,
    sectionIcon: section.icon,
    sectionColor: section.color,
    keywords: item.keywords || [],
  }))
);

function SettingsPage() {
  const [q, setQ] = useState("");

  // Search: filter sections AND items
  const lq = q.toLowerCase();
  const filteredSections = q
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.label.toLowerCase().includes(lq) ||
              (item.desc ?? "").toLowerCase().includes(lq) ||
              section.title.toLowerCase().includes(lq) ||
              section.desc.toLowerCase().includes(lq) ||
              (item.keywords?.some(k => k.toLowerCase().includes(lq)) ?? false)
          ),
        }))
        .filter((s) => s.items.length > 0)
    : sections;

  // Flat search results
  const searchResults = q
    ? allSearchItems.filter(
        (item) =>
          item.label.toLowerCase().includes(lq) ||
          (item.desc ?? "").toLowerCase().includes(lq) ||
          item.sectionTitle.toLowerCase().includes(lq) ||
          (item.keywords?.some(k => k.toLowerCase().includes(lq)) ?? false)
      )
    : [];

  return (
    <div className="max-w-5xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="text-center font-display text-2xl sm:text-3xl mb-6">Settings</h2>

      {/* Search */}
      <div className="relative mb-6 max-w-xl mx-auto">
        <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search settings… (try 'accent', 'theme', 'color', 'email')"
          className="pl-11 h-11 rounded-full"
        />
      </div>

      {/* Search Results */}
      {q && (
        <div className="mb-6 max-w-xl mx-auto">
          {searchResults.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No settings found for "{q}"
            </p>
          ) : (
            <div className="bg-card border rounded-2xl overflow-hidden divide-y divide-border/60">
              {searchResults.map((item) => {
                const Icon = item.sectionIcon;
                return (
                  <Link
                    key={item.label}
                    to={item.to ?? "/settings"}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-background/40 transition"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <Icon className={`h-4 w-4 ${item.sectionColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sectionTitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cards Grid */}
      {!q && (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.title}
                className={`bg-card border rounded-2xl p-5 ${section.danger ? "border-red-500/30" : ""}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
                    <Icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg leading-tight">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.desc}</p>
                  </div>
                </div>

                <ul className="divide-y divide-border/60">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to ?? "/settings"}
                        className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-background/40 transition group"
                      >
                        <div>
                          <p className="text-sm">{item.label}</p>
                          {item.desc && (
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}