import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { DreamCard } from "@/components/DreamCard";
import { TrendingPanel } from "@/components/TrendingPanel";
import { dreams } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Sparkles, PenSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velara — Share your dreams, find your tribe" },
      { name: "description", content: "Velara is a soft, anonymous space to share dreams — lucid, prophetic or strange — and discover dreamers who saw what you saw." },
      { property: "og:title", content: "Velara — A gentle place for dreams" },
      { property: "og:description", content: "Anonymous dream journaling, AI matching, and a quiet community of nightly travellers." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-5 sm:mb-8 border border-border/40 bg-gradient-to-br from-card/80 via-card/40 to-background/60 p-5 sm:p-8 lg:p-12 shadow-[0_0_60px_-15px_oklch(0.65_0.16_50/0.35)]">
        <div className="absolute inset-0 -z-10 opacity-70 gradient-cosmic" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-accent">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Tonight on Velara
          </span>
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl mt-3 sm:mt-4 leading-tight">
            Share the dream you can't forget.
            <span className="block text-accent">Find who else dreamt it.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-muted-foreground max-w-lg">
            Velara is an anonymous home for the strange, beautiful and unsettling. Post a dream and our AI quietly threads you to dreamers across the world who saw the same.
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
            <Button asChild size="sm" className="gradient-violet text-primary-foreground glow-primary border-0">
              <Link to="/post"><PenSquare className="h-4 w-4 mr-1" />Log tonight's dream</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border/60 bg-background/40 backdrop-blur">
              <Link to="/explore">Explore dreamscape</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-5 min-w-0">
          <div className="flex items-center gap-2 text-sm overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0">
            {["For you", "Lucid", "Nightmare", "Prophetic", "Recurring"].map((t, i) => (
              <button key={t} className={`px-3.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${i === 0 ? "bg-primary/15 border-primary/40 text-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>{t}</button>
            ))}
          </div>
          {dreams.map((d) => <DreamCard key={d.id} dream={d} />)}
        </div>
        <TrendingPanel />
      </div>
    </AppLayout>
  );
}
