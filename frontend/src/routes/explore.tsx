
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Heart, Eye } from "lucide-react";
import { useExploreDreams, type ExploreDream } from "@/hooks/useExploreDreams";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore dreams — Velara" },
      {
        name: "description",
        content: "Wander a mosaic of dreams from anonymous dreamers around the world.",
      },
      {
        property: "og:title",
        content: "Explore dreams — Velara",
      },
    ],
  }),
  component: Explore,
});

const spans = [
  "row-span-2",
  "",
  "row-span-2",
  "",
  "",
  "row-span-2",
  "",
  "",
  "",
];

const exploreTypes = [
  "All",
  "Lucid",
  "Nightmare",
  "Past Memory",
  "Flying",
  "Magical",
  "Recurring",
  "Others",
] as const;

function normalizeType(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

const explicitTypeSet = new Set(
  exploreTypes
    .filter((type) => type !== "All" && type !== "Others")
    .map((type) => normalizeType(type))
);

function Explore() {
  const { dreams, loading } = useExploreDreams();
  const [selectedType, setSelectedType] = useState<(typeof exploreTypes)[number]>("All");

  const filteredDreams = useMemo(() => {
    if (selectedType === "All") return dreams;
    if (selectedType === "Others") {
      return dreams.filter((dream) => !explicitTypeSet.has(normalizeType(dream.type)));
    }
    const filterValue = normalizeType(selectedType);
    return dreams.filter((dream) => normalizeType(dream.type) === filterValue);
  }, [dreams, selectedType]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading dreams...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BackButton />
      <div className="mb-5 flex gap-2 text-xs overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0">
        {exploreTypes.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap ${
              selectedType === t
                ? "bg-primary/15 border-primary/40"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredDreams.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {selectedType === "All"
            ? "No dreams found."
            : `No ${selectedType.toLowerCase()} dreams found.`}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[120px] sm:auto-rows-[140px] gap-3 sm:gap-4">
          {filteredDreams.map((dream, index) => (
            <ExploreTile key={dream.id} d={dream} idx={index} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

// Follow button completely removed — only title + views + likes shown
function ExploreTile({ d, idx }: { d: ExploreDream; idx: number }) {
  return (
    <Link
      to="/dream/$id"
      params={{ id: d.id }}
      className={`relative rounded-2xl overflow-hidden border border-border/60 group cursor-pointer ${
        spans[idx % spans.length]
      }`}
    >
      <img
        src={d.cover ?? "https://picsum.photos/600/800"}
        alt={d.title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
      />

      <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/30 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-medium line-clamp-1">{d.title}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {d.views_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {d.likes_count}
          </span>
        </div>
      </div>
    </Link>
  );
}