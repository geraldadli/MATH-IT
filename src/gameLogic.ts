import { caseLevels, getCase } from "./cases.ts";
import type { BoardState, CaseId, CaseLevel, ZoneId } from "./types.ts";

export { caseLevels, getCase } from "./cases.ts";

export function createBoard(caseId: CaseId): BoardState {
  return { tray: [...getCase(caseId).tokens], a: [], b: [], c: [] };
}

export function moveToken(
  board: BoardState,
  token: number,
  from: ZoneId,
  to: ZoneId,
  caseId: CaseId,
): BoardState {
  const level = caseLevels.find((candidate) => candidate.id === caseId);
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

export function isSolved(caseId: CaseId, board: BoardState): boolean {
  const level = caseLevels.find((candidate) => candidate.id === caseId);
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

  return level.dropZones.every(({ id, condition }) => {
    const tokens = board[id];
    if (new Set(tokens).size !== tokens.length) return false;
    if (condition.kind === "count") return tokens.length === condition.count;
    if (condition.kind === "multiple")
      return tokens.every((token) => token % condition.divisor === 0);
    if (condition.kind === "values")
      return tokens.every((token) => condition.values.includes(token));
    return tokens.every((token) =>
      condition.divisors.every((divisor) => token % divisor !== 0),
    );
  });
}

export function isCaseUnlocked(
  caseId: CaseId,
  completedCases: number[],
): boolean {
  return caseLevels.some((level) => level.id === caseId) &&
    caseLevels.every((level) => level.id >= caseId || completedCases.includes(level.id));
}

export function normaliseCompletedCases(saved: unknown): CaseId[] {
  if (!Array.isArray(saved)) return [];
  const completed: CaseId[] = [];
  for (const level of caseLevels) {
    if (!saved.includes(level.id)) break;
    completed.push(level.id);
  }
  return completed;
}

export function getNextCase(completedCases: number[]): CaseLevel | undefined {
  return caseLevels[normaliseCompletedCases(completedCases).length];
}
