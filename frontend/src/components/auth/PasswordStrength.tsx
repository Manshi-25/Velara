import zxcvbn from "zxcvbn"

type Props={

password:string

}

export default function PasswordStrength({
password
}:Props){

if(!password)return null

const result=
zxcvbn(password)

const levels=[

"Weak",
"Fair",
"Good",
"Strong",
"Excellent"

]

return(

<p className="text-xs mt-1">

Strength:
{levels[result.score]}

</p>

)

}