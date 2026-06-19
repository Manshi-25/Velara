import { createFileRoute,useNavigate  } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { ProfileLayout } from "@/components/ProfileLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/profile/$id")({
  component: UserProfile,
});

function UserProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] =useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    getProfile();

    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      }
    }

    getCurrentUser();
  }, [id]);

  async function getProfile() {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();


    
    if (error) {
      console.log(error);
      return;
    }

    setProfile(profileData);

    const { data: postsData } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", id)
      .eq("archived", false)
      .order("created_at", {
        ascending: false,
      });

    setPosts(postsData || []);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {setCurrentUserId(user.id);setIsOwnProfile(user.id === id);}

    if (user) {
      const { data: followData } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .maybeSingle();

      setIsFollowing(!!followData);
    }
  }

  async function toggleFollowUser(targetUserId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const alreadyFollowing =
      followingMap[targetUserId];

    if (alreadyFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      setFollowingMap((prev) => ({
        ...prev,
        [targetUserId]: false,
      }));

      if (targetUserId === id) {
        setIsFollowing(false);
      }
    } else {
      await supabase
        .from("followers")
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      setFollowingMap((prev) => ({
        ...prev,
        [targetUserId]: true,
      }));

      if (targetUserId === id) {
        setIsFollowing(true);
      }
    }

    getProfile();
  }

  async function loadFollowers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("followers")
      .select(`
        follower:profiles!followers_follower_id_fkey(
          id,
          anonymous_name,
          dream_vibe
        )
      `)
      .eq("following_id", id);

    setFollowers(data || []);

    if (!user || !data) return;

    const ids = data.map(
      (x: any) => x.follower.id
    );

    const { data: currentFollowing } =
      await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", ids);

    const map: Record<string, boolean> = {};

    currentFollowing?.forEach((x: any) => {
      map[x.following_id] = true;
    });

    setFollowingMap(map);
  }

  async function loadFollowing() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("followers")
      .select(`
        following:profiles!followers_following_id_fkey(
          id,
          anonymous_name,
          dream_vibe
        )
      `)
      .eq("follower_id", id);

    setFollowing(data || []);

    if (!user || !data) return;

    const ids = data.map(
      (x: any) => x.following.id
    );

    const { data: currentFollowing } =
      await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", ids);

    const map: Record<string, boolean> = {};

    currentFollowing?.forEach((x: any) => {
      map[x.following_id] = true;
    });

    setFollowingMap(map);
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="p-8">
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
  <AppLayout>
    <BackButton />

    <ProfileLayout
      profile={profile}
      posts={posts}
      isOwnProfile={isOwnProfile}
      onChat={() =>
        navigate({
          to: "/chat/$id",
          params: {id: profile.id,},}
        )}
      isFollowing={isFollowing}
      onFollow={() => toggleFollowUser(profile.id)}
      onFollowersClick={() => {
        setOpenFollowers(true);
        loadFollowers();
      }}
      onFollowingClick={() => {
        setOpenFollowing(true);
        loadFollowing();
      }}
    />

    {/* Followers Dialog */}

    <Dialog
      open={openFollowers}
      onOpenChange={setOpenFollowers}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Echoers ({followers.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {followers.map((item: any) => (
            <div
              key={item.follower.id}
              className="flex items-center justify-between"
            >
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  setOpenFollowers(false);
                  navigate({
                    to: "/profile/$id",
                    params: {
                      id: item.follower.id,
                    },
                  });
                }
                }
              >
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  {item.follower.anonymous_name?.[0]}
                </div>

                <div>
                  {item.follower.anonymous_name}
                </div>
              </div>

              {item.follower.id !== currentUserId &&
                item.follower.id !== profile.id && (
                  <Button
                    size="sm"
                    variant={
                      followingMap[item.follower.id]
                        ? "secondary"
                        : "default"
                    }
                    onClick={() =>
                      toggleFollowUser(item.follower.id)
                    }
                  >
                    {followingMap[item.follower.id]
                      ? "Echoing"
                      : "Echo"}
                  </Button>
                )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>

    {/* Following Dialog */}

    <Dialog
      open={openFollowing}
      onOpenChange={setOpenFollowing}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Echoing ({following.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {following.map((item: any) => (
            <div
              key={item.following.id}
              className="flex items-center justify-between"
            >
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  setOpenFollowing(false);
                  navigate({
                    to: "/profile/$id",
                    params: {
                      id: item.following.id,
                    },
                  })
                }}
              >
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  {item.following.anonymous_name?.[0]}
                </div>

                <div>
                  {item.following.anonymous_name}
                </div>
              </div>

              {item.following.id !== currentUserId &&
                item.following.id !== profile.id && (
                  <Button
                    size="sm"
                    variant={
                      followingMap[item.following.id]
                        ? "secondary"
                        : "default"
                    }
                    onClick={() =>
                      toggleFollowUser(item.following.id)
                    }
                  >
                    {followingMap[item.following.id]
                      ? "Echoing"
                      : "Echo"}
                  </Button>
                )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  </AppLayout>
);
}