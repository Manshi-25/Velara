import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/settings/comments")({
  component: CommentsPage,
});

function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        comment,
        created_at,
        dream_id,

        dreams (
          id,
          title,
          cover,
          profiles (
            anonymous_name
          )
        ),

        profiles (
          anonymous_name
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setComments(data || []);
    setLoading(false);
  }

  function getTimeAgo(dateString: string) {
    const created = new Date(dateString);
    const now = new Date();

    const diff = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton className="mb-4" />

      <h1 className="flex items-center justify-center gap-2 text-3xl font-display mb-8">
        <MessageCircle className="h-7 w-7 text-accent" />
        My Comments
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : comments.length === 0 ? (
        <p className="italic text-muted-foreground">
          You haven't commented on any dream yet.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((item) => (
            <Link
              key={item.id}
              to="/dream/$id"
              params={{ id: item.dream_id }}
              className="block rounded-2xl border border-border bg-card hover:border-accent/40 transition overflow-hidden"
            >
              <div className="p-4 flex gap-4">
                {/* LEFT */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#cc8443] text-black font-bold flex items-center justify-center text-xs shrink-0">
                      {item.dreams?.profiles?.anonymous_name?.[0]?.toUpperCase() || "D"}
                    </div>

                    <h3 className="font-semibold text-lg truncate">
                      {item.dreams?.title}
                    </h3>
                  </div>

                  {/* Comment */}
                  <div className="mt-4 ml-12 flex items-start gap-3">

                    {/* Comment Text */}
                    <div className="flex-1 rounded-xl bg-background border border-border/50 p-3">
                      <p className="text-sm leading-relaxed break-words">
                        {item.comment}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    {getTimeAgo(item.created_at)}
                  </p>
                </div>

                {/* Dream Thumbnail */}
                <div className="w-24 h-24 shrink-0">
                  {item.dreams?.cover ? (
                    <img
                      src={item.dreams.cover}
                      alt={item.dreams.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}