
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL;

const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if(!url || !key){
    throw new Error(
      "Supabase environment variables missing"
    )
}

export const supabase = createClient<Database>(
    url,
    key,
    {
        auth:{
            persistSession:true,
            autoRefreshToken:true,
            detectSessionInUrl: true
        }
    }
)