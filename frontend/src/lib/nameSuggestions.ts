const words=[

"Moon",
"Mystic",
"Shadow",
"Dream",
"Night",
"Silent",
"Echo",
"Spirit",
"Cloud",
"Nova",
"Whisper",
"Raven",
"Cosmic",
"Midnight",
"Hidden",
"Phantom",
"Starlight"

]

const endings=[

"Wolf",
"Soul",
"Walker",
"Dreamer",
"Nova",
"Cloud",
"Spirit",
"Whisper"

]

export function getSuggestions(
input:string
){

const text=
input.trim().toLowerCase()

let filtered=

words.filter(word=>

word.toLowerCase()
.startsWith(text)

)

if(filtered.length===0){

filtered=words
}

const result=[]

for(

let i=0;
i<4;
i++

){

const word=

filtered[
Math.floor(
Math.random()*
filtered.length
)
]

const ending=

endings[
Math.floor(
Math.random()*
endings.length
)
]

result.push(

`${word}${ending}`

)

}

return [...new Set(result)]

}