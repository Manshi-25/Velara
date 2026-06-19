import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const XP_REWARDS = {
  DREAM_POSTED: 10,

  DREAM_LIKE_RECEIVED: 2,

  DREAM_COMMENT_RECEIVED: 5,

  FOLLOWER_GAINED: 10,

  STREAK_DAY: 3,
};

export const DREAM_LEVELS = [
  {
    level: 1,
    title: "Dream Seed",
    xp: 0,
  },

  {
    level: 2,
    title: "Moon Wanderer",
    xp: 100,
  },

  {
    level: 3,
    title: "Star Chaser",
    xp: 300,
  },

  {
    level: 4,
    title: "Lucid Walker",
    xp: 600,
  },

  {
    level: 5,
    title: "Night Weaver",
    xp: 1000,
  },

  {
    level: 6,
    title: "Astral Explorer",
    xp: 1600,
  },

  {
    level: 7,
    title: "Dream Architect",
    xp: 2500,
  },

  {
    level: 8,
    title: "Cosmic Visionary",
    xp: 4000,
  },

  {
    level: 9,
    title: "Realm Keeper",
    xp: 6000,
  },

  {
    level: 10,
    title: "Velara Oracle",
    xp: 10000,
  },
];

export function calculateLevel(xp: number) {
  let currentLevel = DREAM_LEVELS[0];

  for (const level of DREAM_LEVELS) {
    if (xp >= level.xp) {
      currentLevel = level;
    }
  }

  return currentLevel;
}

export function getNextLevel(currentLevel: number) {
  return DREAM_LEVELS.find(
    (level) => level.level === currentLevel + 1
  );
}

export function getLevelProgress(
  xp: number
) {
  const current =
    calculateLevel(xp);

  const next =
    getNextLevel(current.level);

  if (!next) {
    return {
      progress: 100,
      currentXP: xp,
      requiredXP: xp,
    };
  }

  const progress =
    ((xp - current.xp) /
      (next.xp - current.xp)) *
    100;

  return {
    progress,
    currentXP: xp,
    requiredXP: next.xp,
  };
}