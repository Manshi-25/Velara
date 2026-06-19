import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Eye, Heart } from "lucide-react";
import { dreams } from "@/lib/mock-data";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search dreams — Velara" },
      { name: "description", content: "Search dreams by symbol, mood, type and time." },
      { property: "og:title", content: "Search dreams — Velara" },
    ],
  }),
  component: SearchPage,
});

const types = ["all", "lucid", "nightmare", "prophetic", "recurring", "flying", "magical"];
const moods = ["any", "scared", "happy", "confused", "excited", "sad", "anxious", "nostalgic"];
const ranges = ["any time", "today", "this week", "this month"];

function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [mood, setMood] = useState("any");
  const [range, setRange] = useState("any time");

  const results = dreams.filter((d) => {
    if (type !== "all" && d.type !== type) return false;
    if (mood !== "any" && d.mood !== mood) return false;
    if (q && !`${d.title} ${d.body}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="relative mb-6 max-w-2xl mx-auto">
        <SearchIcon className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dreams…" className="pl-11 h-12 rounded-full bg-card border-border/60" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6 max-w-3xl mx-auto">
        <Filter label="Type" value={type} onChange={setType} options={types} />
        <Filter label="Mood" value={mood} onChange={setMood} options={moods} />
        <Filter label="Range" value={range} onChange={setRange} options={ranges} />
      </div>

      <p className="text-xs text-muted-foreground mb-3">{results.length} result{results.length === 1 ? "" : "s"}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((d) => (
          <article key={d.id} className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-primary/40 transition">
            {d.cover && <img src={d.cover} alt={d.title} loading="lazy" className="w-full h-32 object-cover" />}
            <div className="p-4">
              <p className="font-medium line-clamp-1">{d.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{d.body}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{d.views}</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{d.reactions}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-card border border-border/60 rounded-lg px-3 py-2 text-sm capitalize">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
