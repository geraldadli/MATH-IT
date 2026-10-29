import { caseLevels, getNextCase, getUnit, isCaseUnlocked, units } from "./gameLogic.ts";
import type { CaseId, UnitId, UserState } from "./types.ts";

export type AppRoute = { kind: "unit" | "video"; unitId: UnitId } | { kind: "case"; unitId: UnitId; caseId: CaseId };

export function readRoute(hash: string, fallback: UnitId): AppRoute {
  const match = /^#\/units\/([1-4])(?:\/(video|cases\/([0-9]+)))?\/?$/.exec(hash);
  if (!match) return { kind: "unit", unitId: fallback };
  const unitId = Number(match[1]) as UnitId;
  if (match[2] === "video") return { kind: "video", unitId };
  if (match[3]) {
    const level = caseLevels.find((candidate) => candidate.id === Number(match[3]));
    if (level && getUnit(level.id).id === unitId) return { kind: "case", unitId, caseId: level.id };
  }
  return { kind: "unit", unitId };
}

export function routeHash(route: AppRoute): string {
  return `#/units/${route.unitId}${route.kind === "video" ? "/video" : route.kind === "case" ? `/cases/${route.caseId}` : ""}`;
}

export function canAccessCase(caseId: CaseId, player: Pick<UserState, "completedCases" | "unitVideos">): boolean {
  return player.unitVideos[getUnit(caseId).id]?.completed === true && isCaseUnlocked(caseId, player.completedCases);
}

// Resolve before rendering, so direct links can never flash a case behind the gate.
export function accessibleRoute(route: AppRoute, player: Pick<UserState, "completedCases" | "unitVideos">): AppRoute {
  if (route.kind === "video") return route;
  if (!player.unitVideos[route.unitId]?.completed) return { kind: "video", unitId: route.unitId };
  if (route.kind === "case" && !canAccessCase(route.caseId, player)) return { kind: "unit", unitId: route.unitId };
  return route;
}

export function firstUnitRoute(completedCases: CaseId[]): AppRoute {
  return { kind: "unit", unitId: getUnit(getNextCase(completedCases)?.id ?? units[0].cases[0]).id };
}
