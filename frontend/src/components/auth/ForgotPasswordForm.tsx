import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props={

email:string

setEmail:(v:string)=>void

handleForgot:any

}

export default function ForgotPasswordForm({

email,
setEmail,
handleForgot

}:Props){

return(

<form
onSubmit={(e)=>{

e.preventDefault();

handleForgot();

}}
className="space-y-4"
>

<h2 className="text-center text-xl font-semibold">

Reset Password

</h2>

<Input
placeholder="Enter Email"
value={email}
onChange={(e)=>
setEmail(
e.target.value
)
}
/>

<Button
className="w-full"
>

Send Reset Mail

</Button>

</form>

)

}