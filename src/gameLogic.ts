import { caseLevels, getCase, units } from "./cases.ts";
import type { BoardCase, BoardState, CaseId, CaseLevel, CaseUnit, DashboardCase, DropZone, DropZoneId, UnitId, ZoneId } from "./types.ts";

export { caseLevels, getCase, units } from "./cases.ts";

export function getUnit(caseId: CaseId): CaseUnit {
  const unit = units.find((candidate) => candidate.cases.includes(caseId));
  if (!unit) throw new Error(`Unknown case: ${caseId}`);
  return unit;
}

// Cases are numbered within their unit, starting at 1.
export function caseNumber(caseId: CaseId): number {
  return getUnit(caseId).cases.indexOf(caseId) + 1;
}

// Clue boards exist only for clue cases; dashboard cases have their own tools.
export function getBoardCase(caseId: CaseId): BoardCase {
  const level = getCase(caseId);
  if (level.kind === "dashboard") throw new Error(`Case ${caseId} is a dashboard, not a clue board`);
  return level;
}

export function getDashboardCase(caseId: CaseId): DashboardCase {
  const level = getCase(caseId);
  if (level.kind !== "dashboard") throw new Error(`Case ${caseId} is a clue board, not a dashboard`);
  return level;
}

function findBoardCase(caseId: CaseId): BoardCase | undefined {
  const level = caseLevels.find((candidate) => candidate.id === caseId);
  return level?.kind === "dashboard" ? undefined : level;
}

export function createBoard(caseId: CaseId): BoardState {
  return { tray: [...getBoardCase(caseId).tokens], a: [], b: [], c: [] };
}

export function moveToken(
  board: BoardState,
  token: number,
  from: ZoneId,
  to: ZoneId,
  caseId: CaseId,
): BoardState {
  const level = findBoardCase(caseId);
  if (
    !level ||
    !level.tokens.includes(token) ||
    from === to ||
    !board[from]?.includes(token) ||
    !board[to]
  )
    return board;

  const copies = level.copies?.[token] ?? 1;
  const reusable = copies > 1;
  // Reusable tokens remain in the tray only while another copy can be placed.
  const placedCopies = [board.a, board.b, board.c].filter((zone) =>
    zone.includes(token),
  ).length;
  if (board[to].includes(token) && !(reusable && to === "tray")) return board;
  if (from === "tray" && placedCopies >= copies) return board;

  const next = {
    ...board,
    [from]: board[from].filter((value) => value !== token),
  };
  if (!next[to].includes(token)) next[to] = [...next[to], token];

  if (reusable) {
    next.tray = next.tray.filter((value) => value !== token);
    if ([next.a, next.b, next.c].filter((zone) => zone.includes(token)).length < copies)
      next.tray = [...next.tray, token];
  }
  return next;
}

function matchesGroup({ condition }: DropZone, tokens: number[]): boolean {
  if (new Set(tokens).size !== tokens.length) return false;
  if (condition.kind === "count") return tokens.length === condition.count;
  if (condition.kind === "multiple")
    return tokens.every((token) => token % condition.divisor === 0);
  if (condition.kind === "values")
    return tokens.every((token) => condition.values.includes(token));
  return tokens.every((token) =>
    condition.divisors.every((divisor) => token % divisor !== 0),
  );
}

export function getReviewZones(caseId: CaseId, board: BoardState): DropZoneId[] {
  const level = findBoardCase(caseId);
  if (!level) return [];
  return level.dropZones.filter((zone) => {
    // While sharing, only an overfilled group needs correction; others may be unfinished.
    if (zone.condition.kind === "count" && board.tray.length > 0 &&
      board[zone.id].length <= zone.condition.count) return false;
    return !matchesGroup(zone, board[zone.id]) ||
      board[zone.id].some((token) => !level.tokens.includes(token));
  }).map((zone) => zone.id);
}

export function isSolved(caseId: CaseId, board: BoardState): boolean {
  const level = findBoardCase(caseId);
  if (!level || board.tray.length !== 0) return false;
  const placed = [...board.a, ...board.b, ...board.c];
  if (placed.some((token) => !level.tokens.includes(token))) return false;
  if (
    !level.tokens.every(
      (token) =>
        placed.filter((value) => value === token).length ===
        (level.copies?.[token] ?? 1),
    )
  )
    return false;

  return level.dropZones.every((zone) => matchesGroup(zone, board[zone.id]));
}

export function isCaseUnlocked(
  caseId: CaseId,
  completedCases: number[],
): boolean {
  const unit = units.find((candidate) => candidate.cases.includes(caseId));
  return !!unit && unit.cases.slice(0, unit.cases.indexOf(caseId))
    .every((id) => completedCases.includes(id));
}

export function normaliseCompletedCases(saved: unknown): CaseId[] {
  if (!Array.isArray(saved)) return [];
  // Keep each unit's uninterrupted run of solved cases.
  const completed = new Set<CaseId>();
  for (const unit of units) {
    for (const id of unit.cases) {
      if (!saved.includes(id)) break;
      completed.add(id);
    }
  }
  return caseLevels.map((level) => level.id).filter((id) => completed.has(id));
}

export function getNextCase(completedCases: number[], unitId?: UnitId): CaseLevel | undefined {
  const completed = normaliseCompletedCases(completedCases);
  const next = units
    .filter((unit) => unitId === undefined || unit.id === unitId)
    .flatMap((unit) => unit.cases)
    .find((id) => !completed.includes(id));
  return next === undefined ? undefined : getCase(next);
}
