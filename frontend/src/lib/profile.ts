import { supabase }
from "@/integrations/supabase/client";

export async function getProfile(){

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user) return null;

const {data}
=
await supabase
.from("profiles")
.select("*")
.eq(
"id",
user.id
)
.single();

return data;

}