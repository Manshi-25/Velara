import { useSyncExternalStore } from "react";

export type MyComment = { dreamId: string; text: string; time: number };

type State = {
  following: Set<string>; // author names
  liked: Set<string>; // dream ids
  saved: Set<string>; // dream ids
  comments: MyComment[]; // comments authored by current user
};

const state: State = {
  following: new Set(),
  liked: new Set(),
  saved: new Set(),
  comments: [],
};

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = () => {
  // create new collection refs so memoized selectors recompute
  state.liked = new Set(state.liked);
  state.saved = new Set(state.saved);
  state.following = new Set(state.following);
  state.comments = [...state.comments];
  listeners.forEach((l) => l());
};

export function toggleFollow(author: string) {
  if (state.following.has(author)) state.following.delete(author);
  else state.following.add(author);
  emit();
}
export function toggleLike(id: string) {
  if (state.liked.has(id)) state.liked.delete(id);
  else state.liked.add(id);
  emit();
}
export function toggleSave(id: string) {
  if (state.saved.has(id)) state.saved.delete(id);
  else state.saved.add(id);
  emit();
}
export function addComment(dreamId: string, text: string) {
  const t = text.trim();
  if (!t) return;
  state.comments.push({ dreamId, text: t, time: Date.now() });
  emit();
}

export function useFollowing(author: string) {
  return useSyncExternalStore(
    subscribe,
    () => state.following.has(author),
    () => false,
  );
}
export function useLiked(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => state.liked.has(id),
    () => false,
  );
}
export function useSaved(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => state.saved.has(id),
    () => false,
  );
}
export function useLikedIds() {
  return useSyncExternalStore(
    subscribe,
    () => state.liked,
    () => state.liked,
  );
}
export function useSavedIds() {
  return useSyncExternalStore(
    subscribe,
    () => state.saved,
    () => state.saved,
  );
}
export function useMyComments() {
  return useSyncExternalStore(
    subscribe,
    () => state.comments,
    () => state.comments,
  );
}
const filterCache = new Map<string, { source: MyComment[]; result: MyComment[] }>();
function getFilteredComments(dreamId: string) {
  const cached = filterCache.get(dreamId);
  if (cached && cached.source === state.comments) return cached.result;
  const result = state.comments.filter((c) => c.dreamId === dreamId);
  filterCache.set(dreamId, { source: state.comments, result });
  return result;
}
export function useCommentsFor(dreamId: string) {
  return useSyncExternalStore(
    subscribe,
    () => getFilteredComments(dreamId),
    () => [],
  );
}
