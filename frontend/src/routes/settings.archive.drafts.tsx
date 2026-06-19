import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/settings/archive/drafts")({
  component: ArchivedDrafts,
});

function ArchivedDrafts() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

    async function loadDrafts() {
        try {
            setLoading(true);

            const {
            data: { user },
            error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
            console.error("User fetch error:", userError);
            return;
            }

            if (!user) {
            console.log("No user logged in");
            return;
            }

            console.log("Current user:", user.id);

            const { data, error } = await supabase
            .from("drafts")
            .select("*")
            .eq("user_id", user.id)
            .eq("archived", true)
            .order("updated_at", { ascending: false });

            if (error) {
            console.error("Draft fetch error:", error);
            throw error;
            }

            console.log("Archived drafts:", data);
            setDrafts(data ?? []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load archived drafts");
        } finally {
            setLoading(false);
        }
        }

  async function unarchiveDraft(id: string) {
    const { error } = await supabase
      .from("drafts")
      .update({ archived: false })
      .eq("id", id);

    if (error) {
      toast.error("Failed to restore draft");
      return;
    }

    setDrafts((prev) => prev.filter((item) => item.id !== id));
    toast.success("Draft restored to your workspace 📝");
  }

  async function deleteDraftPermanently(id: string) {
    const { error } = await supabase
      .from("drafts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete permanently");
      return;
    }

    setDrafts((prev) => prev.filter((item) => item.id !== id));
    toast.success("Draft permanently deleted");
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
            Archived Drafts
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
            Manage your hidden or unfinished draft ideas
            </p>
        </div>

        </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">
            Loading archive...
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl border-dashed bg-card/50 space-y-2">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground">
              No archived drafts found.
            </p>
          </div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="space-y-1">
                <h3 className="font-semibold">{draft.title || "Untitled Draft"}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  Type: {draft.type || "Standard"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unarchiveDraft(draft.id)}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restore
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDraftPermanently(draft.id)}
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