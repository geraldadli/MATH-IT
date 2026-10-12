import type { Localized } from "./types.ts";

export const XP_PER_CASE = 100;

export interface DetectiveLevel {
  level: number;
  minXp: number;
  title: Localized;
}

// Early ranks arrive quickly; later ones need a few more cases each.
// The last rank needs every case, so it marks a finished casebook.
export const detectiveLevels: DetectiveLevel[] = [
  { level: 1, minXp: 0, title: { en: "Rookie", id: "Detektif Pemula" } },
  { level: 2, minXp: 100, title: { en: "Clue Spotter", id: "Pencari Petunjuk" } },
  { level: 3, minXp: 300, title: { en: "Junior Detective", id: "Detektif Junior" } },
  { level: 4, minXp: 500, title: { en: "Puzzle Solver", id: "Pemecah Teka-teki" } },
  { level: 5, minXp: 800, title: { en: "Detective", id: "Detektif" } },
  { level: 6, minXp: 1100, title: { en: "Senior Detective", id: "Detektif Senior" } },
  { level: 7, minXp: 1500, title: { en: "Inspector", id: "Inspektur" } },
  { level: 8, minXp: 1900, title: { en: "Chief Inspector", id: "Kepala Inspektur" } },
  { level: 9, minXp: 2400, title: { en: "Master Detective", id: "Detektif Ulung" } },
];

export interface LevelProgress {
  current: DetectiveLevel;
  next?: DetectiveLevel;
  // XP earned since reaching the current level, and the XP that level spans.
  xpIntoLevel: number;
  xpForLevel: number;
}

export function xpForCases(completedCases: number): number {
  return completedCases * XP_PER_CASE;
}

export function getLevel(xp: number): DetectiveLevel {
  const safeXp = Number.isFinite(xp) ? xp : 0;
  return detectiveLevels.findLast((level) => safeXp >= level.minXp) ?? detectiveLevels[0];
}

export function getLevelProgress(xp: number): LevelProgress {
  const current = getLevel(xp);
  const next = detectiveLevels.find((level) => level.level === current.level + 1);
  if (!next) return { current, xpIntoLevel: 0, xpForLevel: 0 };
  return {
    current,
    next,
    xpIntoLevel: Math.max(0, xp - current.minXp),
    xpForLevel: next.minXp - current.minXp,
  };
}
