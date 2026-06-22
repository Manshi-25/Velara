import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useFollowing() {
  const { user } = useAuth();

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFollowingIds(new Set());
      setLoading(false);
      return;
    }

    loadFollowing();
  }, [user]);

  async function loadFollowing() {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", user.id);

    if (data) {
      setFollowingIds(
        new Set(data.map((x) => x.following_id))
      );
    }

    setLoading(false);
  }

  async function toggleFollow(targetUserId: string) {
    if (!user) return;
    if (targetUserId === user.id) return;

    const alreadyFollowing =
      followingIds.has(targetUserId);

    if (alreadyFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    } else {
      await supabase
        .from("followers")
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.add(targetUserId);
        return next;
      });
    }
  }

  return {
    followingIds,
    toggleFollow,
    loading,
  };
}