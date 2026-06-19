import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";

import { Bookmark } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings/saved")({
  component: SavedPage,
});

function SavedPage() {
  const [savedDreams, setSavedDreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedDreams();
  }, []);

  async function loadSavedDreams() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_dreams")
      .select(`
        id,
        dreams (
          id,
          title,
          body,
          cover,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setSavedDreams(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
        <div className="max-w-5xl mx-auto">
          <BackButton className="mb-4" />
          <p className="text-muted-foreground">
            Loading saved dreams...
          </p>
        </div>
      
    );
  }

  return (
    
      <div className="max-w-5xl mx-auto">

        <BackButton className="mb-4" />

        <h2 className="font-display text-2xl sm:text-3xl mb-8 flex items-center justify-center gap-2">
          <Bookmark className="h-6 w-6 text-yellow-400" />
          Saved Dreams
        </h2>


        {savedDreams.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nothing saved yet.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-5 gap-3">

            {savedDreams.map((item) => {
              const dream = item.dreams;

              if (!dream) return null;

              return (
                <Link
                  key={dream.id}
                  to="/dream/$id"
                  params={{ id: dream.id }}
                  className="
                    group
                    rounded-xl
                    overflow-hidden
                    border
                    border-border/50
                    bg-card
                    hover:border-yellow-400/40
                    transition
                  "
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={dream.cover}
                      alt={dream.title}
                      className="
                        w-full
                        h-full
                        object-cover
                        group-hover:scale-105
                        transition-transform
                        duration-500
                      "
                    />
                  </div>

                  <div className="p-2">
                    <p className="text-xs sm:text-sm font-medium line-clamp-2">
                      {dream.title}
                    </p>
                  </div>
                </Link>
              );
            })}

          </div>
        )}
      </div>
    
  );
}