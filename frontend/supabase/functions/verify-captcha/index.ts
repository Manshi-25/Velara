const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders
      }
    )
  }

  try {

    const { token } =
      await req.json()

    if (!token) {

      return new Response(
        JSON.stringify({
          success:false,
          error:"Missing token"
        }),
        {
          status:400,
          headers:{
            ...corsHeaders,
            "Content-Type":
            "application/json"
          }
        }
      )

    }

    const secret =
      Deno.env.get(
        "TURNSTILE_SECRET_KEY"
      )

    if (!secret) {

      return new Response(
        JSON.stringify({
          success:false,
          error:"Missing secret key"
        }),
        {
          status:500,
          headers:{
            ...corsHeaders,
            "Content-Type":
            "application/json"
          }
        }
      )

    }

    const formData =
      new FormData()

    formData.append(
      "secret",
      secret
    )

    formData.append(
      "response",
      token
    )

    const verifyResponse =
      await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method:"POST",
          body:formData
        }
      )

    const data =
      await verifyResponse.json()

    return new Response(
      JSON.stringify(data),
      {
        status:200,
        headers:{
          ...corsHeaders,
          "Content-Type":
          "application/json"
        }
      }
    )

  }

  catch(error){

    return new Response(
      JSON.stringify({
        success:false,
        error:
        error instanceof Error
        ? error.message
        : "Unknown error"
      }),
      {
        status:500,
        headers:{
          ...corsHeaders,
          "Content-Type":
          "application/json"
        }
      }
    )

  }

})