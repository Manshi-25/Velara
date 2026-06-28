
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*, avatar_gradient, avatar_url, dream_vibe")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.log("Profile Error:", error);
      return;
    }

    setProfile(data);
  }

  return profile;
}