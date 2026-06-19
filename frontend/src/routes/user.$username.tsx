import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { dreams } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Sparkles } from "lucide-react";
import { useFollowing, toggleFollow } from "@/lib/dream-state";

export const Route = createFileRoute("/user/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} — Velara` },
      { name: "description", content: `Dreams shared by ${params.username} on Velara.` },
    ],
  }),
  component: UserProfile,
  notFoundComponent: () => (
    <AppLayout>
      <BackButton />
      <p className="text-muted-foreground">Dreamer not found.</p>
    </AppLayout>
  ),
});

function UserProfile() {
  const { username } = Route.useParams();
  const userDreams = dreams.filter((d) => d.author === username);
  const following = useFollowing(username);
  if (userDreams.length === 0) throw notFound();
  const avatar = userDreams[0].avatar;
  const totalViews = userDreams.reduce((s, d) => s + d.views, 0);
  const totalReactions = userDreams.reduce((s, d) => s + d.reactions, 0);

  return (
    <AppLayout>
      <BackButton />
      <div className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 lg:p-8 mb-6">
        <div className="flex flex-row flex-wrap items-start gap-4 sm:gap-6">
          <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl gradient-violet grid place-items-center text-xl sm:text-3xl font-display text-primary-foreground glow-primary shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl sm:text-3xl">{username}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
              Anonymous dreamer · sharing dreams from the in-between.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm">
              <div><span className="font-display text-lg sm:text-xl">{userDreams.length}</span><span className="text-muted-foreground ml-1">posts</span></div>
              <div><span className="font-display text-lg sm:text-xl">{totalViews.toLocaleString()}</span><span className="text-muted-foreground ml-1">views</span></div>
              <div><span className="font-display text-lg sm:text-xl">{totalReactions}</span><span className="text-muted-foreground ml-1">reactions</span></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => toggleFollow(username)}
              className={following ? "bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25" : "gradient-violet text-primary-foreground border-0"}
            >
              {following ? <><UserCheck className="h-4 w-4 mr-1" /> Following</> : <><UserPlus className="h-4 w-4 mr-1" /> Follow</>}
            </Button>
          </div>
        </div>
      </div>

      <h3 className="font-display text-lg sm:text-xl mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" /> Dreams by {username}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        {userDreams.map((d) => (
          <Link key={d.id} to="/dream/$id" params={{ id: d.id }} className="rounded-xl sm:rounded-2xl overflow-hidden border border-border/60 group bg-card">
            <div className="aspect-square overflow-hidden">
              <img src={d.cover} alt={d.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            </div>
            <div className="p-2 sm:p-4">
              <p className="font-medium text-xs sm:text-sm line-clamp-1">{d.title}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{d.timeAgo} · {d.views} views</p>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
