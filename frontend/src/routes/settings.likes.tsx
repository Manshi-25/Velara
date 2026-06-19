import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { BackButton } from "@/components/BackButton";
export const Route = createFileRoute("/settings/likes")({
  component: LikesPage,
});

function LikesPage() {
  const [likedDreams, setLikedDreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikedDreams();
  }, []);

  async function loadLikedDreams() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .select(`
        dream_id,
        dreams (
          id,
          title,
          body,
          cover,
          created_at,
          views_count,
          profiles (
            anonymous_name
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const dreams = data
      ?.map((item: any) => item.dreams)
      .filter(Boolean);

    setLikedDreams(dreams || []);
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto">

      <BackButton className="mb-4" />

      <h1 className="flex items-center justify-center gap-2 text-3xl font-display mb-8">
        <Heart className="h-7 w-7 text-red-400" />
        Liked Dreams
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : likedDreams.length === 0 ? (
        <p className="italic text-muted-foreground">
          No liked dreams yet.
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {likedDreams.map((dream) => (
            <Link
              key={dream.id}
              to="/dream/$id"
              params={{ id: dream.id }}
              className="
                group
                rounded-xl
                overflow-hidden
                border border-border/50
                bg-card
                hover:border-red-400/40
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
          ))}
        </div>
      )}
    </div>
  );
}