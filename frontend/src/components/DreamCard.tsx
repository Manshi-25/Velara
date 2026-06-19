import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Eye, Bookmark, Share2, Sparkles, UserPlus, UserCheck, Languages } from "lucide-react";
import { type Dream, dreamTypeMeta } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useFollowing, useLiked, useSaved, toggleFollow, toggleLike, toggleSave, addComment, useCommentsFor } from "@/lib/dream-state";

const toneClass: Record<string, string> = {
  lucid: "bg-lucid/15 text-lucid border-lucid/30",
  nightmare: "bg-nightmare/15 text-nightmare border-nightmare/30",
  prophetic: "bg-prophetic/15 text-prophetic border-prophetic/30",
  neutral: "bg-accent/15 text-accent border-accent/30",
};

const languages = ["Original", "Spanish", "French", "Hindi", "Japanese", "Arabic"];

export function DreamCard({ dream }: { dream: Dream }) {
  const meta = dreamTypeMeta[dream.type];
  const following = useFollowing(dream.author);
  const liked = useLiked(dream.id);
  const saved = useSaved(dream.id);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const comments = useCommentsFor(dream.id);
  const [lang, setLang] = useState("Original");
  const [showLang, setShowLang] = useState(false);

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
  const reactions = dream.reactions + (liked ? 1 : 0);

  return (
    <Link
      to="/dream/$id"
      params={{ id: dream.id }}
      className="block bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-accent/50 hover:shadow-[0_0_40px_-10px_oklch(0.65_0.16_50/0.4)] transition group"
    >
      <article className="p-4 sm:p-5">
        <header className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            to="/user/$username"
            params={{ username: dream.author }}
            onClick={stop}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full gradient-violet grid place-items-center text-sm font-semibold text-primary-foreground shrink-0 hover:ring-2 hover:ring-accent/50 transition"
          >
            {dream.avatar}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              <Link
                to="/user/$username"
                params={{ username: dream.author }}
                onClick={stop}
                className="hover:text-accent transition"
              >
                {dream.author}
              </Link>
              <span className="text-muted-foreground"> · {dream.timeAgo}{dream.location ? ` · ${dream.location}` : ""}</span>
            </p>
            <p className="text-xs text-muted-foreground">anonymous dreamer</p>
          </div>
          <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full border ${toneClass[meta.tone]} inline-flex items-center gap-1 shrink-0`}>
            <Sparkles className="h-3 w-3" /> {meta.label}
          </span>
          <button
            onClick={(e) => { stop(e); toggleFollow(dream.author); }}
            className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border inline-flex items-center gap-1 transition shrink-0 ${following ? "bg-accent/15 text-accent border-accent/40" : "bg-primary/15 text-primary border-primary/40 hover:bg-primary/25"}`}
          >
            {following ? <><UserCheck className="h-3 w-3" /> Following</> : <><UserPlus className="h-3 w-3" /> Follow</>}
          </button>
        </header>

        <h3 className="mt-4 font-display text-lg sm:text-xl group-hover:text-accent transition">{dream.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {lang === "Original" ? dream.body : `[${lang}] ${dream.body}`}
        </p>

        {dream.cover && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border/60 aspect-[16/9]">
            <img src={dream.cover} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700" />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" />{dream.views.toLocaleString()}</span>
            <button
              onClick={(e) => { stop(e); toggleLike(dream.id); }}
              className={`inline-flex items-center gap-1.5 transition ${liked ? "text-nightmare" : "hover:text-nightmare"}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />{reactions}
            </button>
            <button
              onClick={(e) => { stop(e); setShowComments((s) => !s); }}
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />{dream.comments + comments.length}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-accent">{dream.similar} similar</span>
            <button onClick={(e) => { stop(e); toggleSave(dream.id); }} className={saved ? "text-accent" : "hover:text-foreground"}>
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
            <button onClick={stop} className="hover:text-foreground"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Translate */}
        <div className="mt-3 relative">
          <button
            onClick={(e) => { stop(e); setShowLang((s) => !s); }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "Original" ? "Translate" : `Translated · ${lang}`}
          </button>
          {showLang && (
            <div onClick={stop} className="absolute z-10 mt-2 bg-popover border border-border/60 rounded-lg shadow-lg p-1 flex flex-wrap gap-1 max-w-xs">
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={(e) => { stop(e); setLang(l); setShowLang(false); }}
                  className={`text-xs px-2 py-1 rounded-md ${lang === l ? "bg-primary/20 text-foreground" : "hover:bg-accent/10 text-muted-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {showComments && (
          <div onClick={stop} className="mt-3 border-t border-border/60 pt-3 space-y-2">
            {comments.map((c, i) => (
              <p key={i} className="text-sm bg-background/60 rounded-lg px-3 py-2">{c.text}</p>
            ))}
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && comment.trim()) {
                    addComment(dream.id, comment);
                    setComment("");
                  }
                }}
                placeholder="Add a comment…"
                className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent/60"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (comment.trim()) {
                    addComment(dream.id, comment);
                    setComment("");
                  }
                }}
              >
                Post
              </Button>
            </div>
          </div>
        )}

      </article>
    </Link>
  );
}
