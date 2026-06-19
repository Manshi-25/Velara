export type DreamType =
  | "lucid"
  | "nightmare"
  | "prophetic"
  | "recurring"
  | "flying"
  | "magical";

export type Mood =
  | "scared"
  | "happy"
  | "confused"
  | "excited"
  | "sad"
  | "anxious"
  | "nostalgic";

export interface Dream {
  id: string;
  author: string;
  avatar: string;
  location?: string;
  timeAgo: string;
  title: string;
  body: string;
  type: DreamType;
  mood: Mood;
  views: number;
  reactions: number;
  comments: number;
  similar: number;
  cover?: string;
}

const covers = [
  "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=900&q=70&auto=format",
];

export const dreams: Dream[] = [
  {
    id: "1",

    author: "DreamSeed",

    avatar: "DS",

    location: "Velara",

    timeAgo: "Just now",

    title: "The Endless Purple Sky",

    body:
      "I walked beneath a glowing purple sky where stars floated like lanterns.",

    type: "lucid",

    mood: "excited",

    views: 0,

    reactions: 0,

    comments: 0,

    similar: 0,

    cover: covers[0]
  }
];

export const trending = [
  {
    tag: "Flying",
    count: 1,
    tone: "lucid" as const
  }
];

export const dreamTypeMeta: Record<
DreamType,
{
label:string;
tone:
"lucid"
|
"nightmare"
|
"prophetic"
|
"neutral";
}
>={

lucid:{
label:"Lucid",
tone:"lucid"
},

nightmare:{
label:"Nightmare",
tone:"nightmare"
},

prophetic:{
label:"Prophetic",
tone:"prophetic"
},

recurring:{
label:"Recurring",
tone:"neutral"
},

flying:{
label:"Flying",
tone:"lucid"
},

magical:{
label:"Magical",
tone:"prophetic"
}

};