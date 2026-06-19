import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Archive, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/settings/archive/dreams")({
  component: ArchivedDreams,
});

function ArchivedDreams() {
  const [dreams, setDreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, []);

  async function loadDreams() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDreams(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load archived dreams");
    } finally {
      setLoading(false);
    }
  }

  async function unarchiveDream(id: string) {
    const { error } = await supabase
      .from("dreams")
      .update({ archived: false })
      .eq("id", id);

    if (error) {
      toast.error("Failed to restore dream");
      return;
    }

    setDreams((prev) => prev.filter((item) => item.id !== id));
    toast.success("Dream restored to your profile ✨");
  }

  async function deleteDreamPermanently(id: string) {
    const { error } = await supabase
      .from("dreams")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete permanently");
      return;
    }

    setDreams((prev) => prev.filter((item) => item.id !== id));
    toast.success("Dream permanently deleted");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="relative mb-8">

        <BackButton
            fallback="/settings/archive"
            className="absolute left-0 top-0"
        />

        <div className="text-center pt-10">
            <h1 className="text-2xl font-bold tracking-tight">
            Archived Dreams
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
            Manage your hidden or archived dream entries
            </p>
        </div>

        </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">
            Loading archive...
          </div>
        ) : dreams.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl border-dashed bg-card/50 space-y-2">
            <Archive className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground">
              No archived dreams found.
            </p>
          </div>
        ) : (
          dreams.map((dream) => (
            <div
              key={dream.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="space-y-1">
                <h3 className="font-semibold">{dream.title || "Untitled Dream"}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  Mood: {dream.mood || "Neutral"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unarchiveDream(dream.id)}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restore
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDreamPermanently(dream.id)}
                  className="gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}