import { supabase } from "@/integrations/supabase/client";


export async function updateUserStreak(
  userId:string
){
  const today =
  new Date()
  .toISOString()
  .split("T")[0];

  const yesterday =
  new Date(
    Date.now() - 86400000
  )
  .toISOString()
  .split("T")[0];

  const { data } =
  await supabase
  .from("user_streaks")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  if (!data) {

    await supabase
    .from("user_streaks")
    .insert({
      user_id:userId,
      current_streak:1,
      last_post_date:today
    });

    return;
  }

  if (
    data.last_post_date === today
  ) {
    return;
  }

  let streak = 1;
  if (!data?.current_streak) return;


  if (
    data.last_post_date === yesterday
  ) {
    streak =
    data.current_streak + 1;

    
  }

  await supabase
  .from("user_streaks")
  .update({
    current_streak:streak,
    last_post_date:today
  })
  .eq("user_id", userId);
}