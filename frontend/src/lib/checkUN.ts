import { supabase }
from "@/integrations/supabase/client";

export async function checkUsername(
name:string
){

const {data}
=
await supabase
.from("profiles")
.select("anonymous_name")
.eq(
"anonymous_name",
name
)

return data?.length===0

}