import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, FileText, ChevronRight } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ArrowLeft } from "lucide-react";
export const Route = createFileRoute("/settings/archive/")({
  component: ArchivePage,
});

function ArchivePage() {
  const items = [
    {
      title: "Archived Dreams",
      desc: "View all hidden or archived dream entries",
      icon: Archive,
      to: "/settings/archive/dreams" as const,
    },
    {
      title: "Archived Drafts",
      desc: "View all hidden or unfinished draft ideas",
      icon: FileText,
      to: "/settings/archive/drafts" as const,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <BackButton fallback="/settings" />

      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Manage your safely hidden memory logs and unfinished writing pieces.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.to}
              className="flex items-center justify-between p-5 rounded-2xl border bg-card border-border/60 hover:border-accent/40 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                  <Icon className="h-5 w-5 text-accent" />
                </div>

                <div>
                  <h2 className="font-semibold text-lg leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}