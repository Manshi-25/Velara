import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {

  try {

    const { email } = await req.json();

    const supabase = createClient(

      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    );

    const { data } =
      await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    return new Response(

      JSON.stringify({

        exists: !!data

      }),

      {
        headers: {
          "Content-Type":
          "application/json"
        }
      }

    );

  }

  catch(error){

    return new Response(

      JSON.stringify({

        exists:false,

        error:error.message

      }),

      {
        status:500
      }

    );

  }

});