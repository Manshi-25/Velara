import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

interface GifPickerPlaceholderProps {
  onSelect: (gifUrl: string) => void | Promise<void>;
  onClose: () => void;
}

type GiphyImage = {
  url?: string;
  webp?: string;
};

type GiphyItem = {
  id: string;
  title: string;
  images?: {
    fixed_width?: GiphyImage;
    fixed_width_small?: GiphyImage;
    downsized_medium?: GiphyImage;
    original?: GiphyImage;
    preview_gif?: GiphyImage;
  };
};

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY ?? import.meta.env.VITE_GIPHY_KEY ?? "";
const MAX_RESULTS = 18;

function resolveGifUrl(item: GiphyItem) {
  return (
    item.images?.fixed_width?.url ||
    item.images?.downsized_medium?.url ||
    item.images?.original?.url ||
    item.images?.preview_gif?.url ||
    ""
  );
}

function resolvePreviewUrl(item: GiphyItem) {
  return (
    item.images?.fixed_width_small?.webp ||
    item.images?.fixed_width?.webp ||
    item.images?.downsized_medium?.webp ||
    item.images?.original?.url ||
    item.images?.preview_gif?.url ||
    ""
  );
}

function buildEndpoint(query: string) {
  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    limit: String(MAX_RESULTS),
    rating: "pg-13",
  });

  if (query.trim()) {
    params.set("q", query.trim());
    return `https://api.giphy.com/v1/gifs/search?${params.toString()}`;
  }

  return `https://api.giphy.com/v1/gifs/trending?${params.toString()}`;
}

export function GifPickerPlaceholder({ onSelect, onClose }: GifPickerPlaceholderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const title = useMemo(
    () => (query.trim() ? `Search results for "${query.trim()}"` : "Trending GIFs"),
    [query]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });

    if (!GIPHY_API_KEY) {
      setLoading(false);
      setSearching(false);
      setError("Add VITE_GIPHY_API_KEY to your env to load GIFs.");
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const delay = window.setTimeout(async () => {
      const isSearching = query.trim().length > 0;
      setLoading(!isSearching);
      setSearching(isSearching);
      setError(null);

      try {
        const response = await fetch(buildEndpoint(query), { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Giphy request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const nextItems = Array.isArray(payload?.data) ? (payload.data as GiphyItem[]) : [];
        setItems(nextItems);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError("Could not load GIFs right now.");
        setItems([]);
      } finally {
        setLoading(false);
        setSearching(false);
      }
    }, query.trim() ? 300 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(delay);
    };
  }, [query]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-80 rounded-2xl bg-card border border-border/60 shadow-xl p-3 z-30"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium">GIF picker</p>
          <p className="text-xs text-muted-foreground">Powered by Giphy</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close GIF picker"
          className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-surface"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search GIFs"
          className="h-10 w-full rounded-full border border-border/60 bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{title}</p>
        {searching && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Searching
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border/60 bg-surface px-3 py-4 text-center">
          <p className="text-sm font-medium">GIFs unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface px-3 py-4 text-center">
          <p className="text-sm font-medium">No GIFs found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const gifUrl = resolveGifUrl(item);
            const previewUrl = resolvePreviewUrl(item);

            if (!gifUrl) return null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  await onSelect(gifUrl);
                  onClose();
                }}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-surface text-left transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <img
                  src={previewUrl || gifUrl}
                  alt={item.title || "GIF"}
                  loading="lazy"
                  className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/80 to-transparent px-2 py-1">
                  <p className="truncate text-[10px] text-primary-foreground/90">
                    {item.title || "GIF"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
