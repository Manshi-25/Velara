import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { generateDreamImage } from "@/lib/randomDreamImage";
import { ChatActionButton } from "@/components/chat/ChatActionButton";

type ProfileLayoutProps = {
  profile: any;
  posts: any[];

  isOwnProfile?: boolean;

  onEdit?: () => void;
  onFollow?: () => void;

  isFollowing?: boolean;

  followersCount?: number;
  followingCount?: number;

  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
};

export function ProfileLayout({
  profile,
  posts,

  isOwnProfile = false,

  onEdit,
  onFollow,
  isFollowing = false,

  followersCount,
  followingCount,

  onFollowersClick,
  onFollowingClick,
}: ProfileLayoutProps) {
  if (!profile) return null;

  return (
    <>
      {/* HEADER */}
      <div className="bg-card border rounded-3xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
            {profile.anonymous_name?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold">
              {profile.anonymous_name}
            </h2>

            <p className="text-muted-foreground mt-2">
              {profile.bio || "No bio yet"}
            </p>

            <p className="text-xs mt-2 text-accent">
              🌙 {profile.dream_vibe || "Dream Wanderer"}
            </p>

            <div className="flex gap-5 mt-4 flex-wrap">

              <div>
                {posts.length} Posts
              </div>

              <button
                onClick={onFollowersClick}
                className="hover:text-primary transition"
              >
                {followersCount ?? profile.followers_count ?? 0} Echoers
              </button>

              <button
                onClick={onFollowingClick}
                className="hover:text-primary transition"
              >
                {followingCount ?? profile.following_count ?? 0} Echoing
              </button>

            </div>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="mt-6">
          {isOwnProfile ? (
            <Button onClick={onEdit}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button onClick={onFollow}>
                {isFollowing ? "Echoing" : "Echo"}
              </Button>
              <ChatActionButton userId={profile.id} />
            </div> 
          )}

        </div>
      </div>

      {/* POSTS */}
      <div className="mt-8">

        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No dreams yet 🌙
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

            {posts.map((post) => (
              <Link
                key={post.id}
                to="/dream/$id"
                params={{ id: post.id }}
                className="rounded-3xl overflow-hidden border bg-card"
              >
                <img
                  src={post.cover || generateDreamImage()}
                  className="w-full h-56 object-cover"
                  alt={post.title}
                />

                <div className="p-3">
                  <h3 className="font-semibold truncate">
                    {post.title}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    👁 {post.views_count || 0}
                  </p>
                </div>
              </Link>
            ))}

          </div>
        )}
      </div>
    </>
  );
}