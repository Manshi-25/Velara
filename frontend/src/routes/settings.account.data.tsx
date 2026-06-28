import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, Shield, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/account/data")({
  component: DataPage,
});

function DataPage() {
  const [exporting, setExporting] = useState(false);

  async function exportDreamJournal() {
    setExporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setExporting(false); return; }

    const { data: dreams } = await supabase
      .from("dreams")
      .select("id, title, body, tags, created_at, views_count, cover")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: profile } = await supabase
      .from("profiles")
      .select("anonymous_name, bio, dream_vibe, post_count, followers_count, following_count, xp, streak, created_at")
      .eq("id", user.id)
      .single();

    const exportData = {
      exported_at: new Date().toISOString(),
      profile,
      dreams: dreams || [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `velara-dreams-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${dreams?.length || 0} dreams ✨`);
    setExporting(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Download className="h-6 w-6 text-sky-400" />
        Data & Export
      </h2>
      <p className="text-muted-foreground text-sm mb-8">Your dreams belong to you.</p>

      <div className="space-y-4">
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
              <FileText className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold">Dream Journal Export</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Download all your dreams, profile, and metadata as a JSON file.
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {[
              { icon: FileText, text: "All dream titles and full text" },
              { icon: Clock, text: "Timestamps and view counts" },
              { icon: Shield, text: "Profile info and stats" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-3.5 w-3.5 text-accent shrink-0" />
                {item.text}
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={exportDreamJournal}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Preparing export…" : "Download My Dreams"}
          </Button>
        </div>

        <div className="flex gap-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4">
          <Shield className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your data is exported locally and never sent to any third party.
          </p>
        </div>
      </div>
    </div>
  );
}