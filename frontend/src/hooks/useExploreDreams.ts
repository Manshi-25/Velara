import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ExploreDream {
  id: string;
  title: string;
  cover: string | null;
  type: string | null;

  views_count : number;
  likes_count: number;

  author: {
    id: string;
    anonymous_name: string;
  };
}

export function useExploreDreams() {
  const [dreams, setDreams] = useState<ExploreDream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, []);

  async function loadDreams() {
    setLoading(true);

    const { data, error } = await supabase
      .from("dreams")
      .select(`
        id,
        title,
        cover,
        type,
        views_count,
        likes_count,
        author:profiles!dreams_user_id_profiles_fkey(
          id,
          anonymous_name
        )
      `)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDreams(data as ExploreDream[]);
    }

    setLoading(false);
  }

  return {
    dreams,
    loading,
    refresh: loadDreams,
  };
}