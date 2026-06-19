import { supabase }
from "@/integrations/supabase/client";

export async function verifyCaptcha(
  token:string
){

  const {
    data,
    error
  }=
  await supabase.functions.invoke(
    "verify-captcha",
    {
      body:{
        token
      }
    }
  );

  if(error){

    console.log(
      "Captcha verify error:",
      error
    );

    throw error;

  }

  return data;

}