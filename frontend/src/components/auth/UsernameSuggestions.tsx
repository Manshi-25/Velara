import { Button } from "@/components/ui/button"

type Props={

suggestions:string[]

setDisplayName:
(value:string)=>void

}

export default function UsernameSuggestions({

suggestions,
setDisplayName

}:Props){

return(

<div className="flex gap-2 flex-wrap mt-3">

{suggestions.map((name)=>(

<Button
key={name}
type="button"
variant="outline"
onClick={()=>
setDisplayName(name)
}
>

{name}

</Button>

))}

</div>

)

}