import {

InputOTP,
InputOTPGroup,
InputOTPSlot

}

from "@/components/ui/input-otp"

import { Button } from "@/components/ui/button"

export default function OtpForm(props:any){

return(

<form
onSubmit={
props.handleVerifyOtp
}
className="space-y-4"
>

<InputOTP
maxLength={6}
value={props.otp}
onChange={props.setOtp}
>

<InputOTPGroup>

{
[0,1,2,3,4,5]
.map(i=>(

<InputOTPSlot
key={i}
index={i}
/>

))
}

</InputOTPGroup>

</InputOTP>

<Button
className="w-full"
>

Verify OTP

</Button>

</form>

)

}