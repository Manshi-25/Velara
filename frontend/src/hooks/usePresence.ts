import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Real online/offline presence, using Supabase Realtime's Presence
 * feature.
 *
 * THE CRITICAL CONSTRAINT: Supabase throws "cannot add presence
 * callbacks after subscribe()" if you call .on("presence", ...) on
 * a channel object that has already had .subscribe() called on it.
 * This means ALL hooks that read presence state MUST share a SINGLE
 * channel JS object, and ALL .on() listeners MUST be registered
 * BEFORE the single .subscribe() call. You cannot create a new
 * supabase.channel("online-users") object per hook instance.
 *
 * Solution: one module-level singleton — one channel object, created
 * once, used by every caller in this file. usePresenceTracking() owns
 * the lifecycle (creates and destroys it). useOnlineUsers() only
 * attaches/detaches its callback from the already-subscribed channel.
 */

/* ------- Singleton channel + subscriber registry ------- */

let _channel: RealtimeChannel | null = null;
let _subscribed = false;
let _trackUserId: string | null = null;

type PresenceCallback = (ids: Set<string>) => void;
const _listeners = new Set<PresenceCallback>();

function getPresenceIds(): Set<string> {
  if (!_channel) return new Set();
  const state = _channel.presenceState<{ user_id: string }>();
  const ids = new Set<string>();
  for (const presences of Object.values(state)) {
    for (const p of presences) {
      if (p.user_id) ids.add(p.user_id);
    }
  }
  return ids;
}

function notifyListeners() {
  const ids = getPresenceIds();
  for (const cb of _listeners) cb(ids);
}

function ensureChannel() {
  if (_channel) return _channel;

  _channel = supabase.channel("online-users");

  // Register ALL presence listeners BEFORE subscribe() — this is the
  // constraint Supabase enforces. We register a single set of handlers
  // here at channel-creation time that call notifyListeners(), which
  // then fans out to every useOnlineUsers() hook instance.
  _channel
    .on("presence", { event: "sync" }, notifyListeners)
    .on("presence", { event: "join" }, notifyListeners)
    .on("presence", { event: "leave" }, notifyListeners);

  return _channel;
}

function subscribeChannel(userId: string) {
  if (_subscribed) return;
  _subscribed = true;
  _trackUserId = userId;

  const ch = ensureChannel();
  ch.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await ch.track({ user_id: userId, online_at: new Date().toISOString() });
    }
  });
}

function teardownChannel() {
  if (_channel) {
    _channel.unsubscribe();
    _channel = null;
  }
  _subscribed = false;
  _trackUserId = null;
}

/* ------- Hooks ------- */

/**
 * Call ONCE near the root of the app (AppLayout) while a user is
 * logged in. Creates + subscribes the singleton channel and tracks the
 * current user as online. Tears down on logout/unmount.
 */
export function usePresenceTracking() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    subscribeChannel(user.id);

    return () => {
      // Only tear down when this component (AppLayout, i.e. the whole
      // app shell) unmounts — which means the user navigated away from
      // the app entirely or logged out.
      teardownChannel();
    };
  }, [user?.id]);
}

/**
 * Returns the live Set of currently-online user ids.
 * Safe to call from any number of components simultaneously — they all
 * share the one underlying channel via the module-level listener set.
 */
export function useOnlineUsers(): Set<string> {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const cb: PresenceCallback = (ids) => setOnlineUserIds(new Set(ids));
    _listeners.add(cb);

    // Sync immediately with whatever state the channel already has
    // (in case subscribe() already fired before this hook mounted).
    setOnlineUserIds(getPresenceIds());

    return () => {
      _listeners.delete(cb);
    };
    // Only re-run when the logged-in user changes (login/logout).
  }, [user?.id]);

  return onlineUserIds;
}

/** Convenience: is a specific user currently online? */
export function useIsUserOnline(userId: string | undefined): boolean {
  const onlineUserIds = useOnlineUsers();
  return !!userId && onlineUserIds.has(userId);
}