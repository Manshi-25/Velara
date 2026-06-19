import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function createDream(data:any){

const {
data:{user}
}=await supabase.auth.getUser();

if(!user){

toast.error("Login required");

return false;
}

const {error}=await supabase
.from("dreams")
.insert({

user_id:user.id,

title:data.title,

body:data.body,

mood:data.mood,

dream_types:data.types,

dream_time:data.time

});

if(error){

console.log(error);

toast.error("Unable to post");

return false;
}

await supabase
.from("profiles")
.update({

posts_count:data.posts+1

})
.eq("id",user.id);

toast.success("Dream posted");

return true;

}