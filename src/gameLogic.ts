import type { BoardState, CaseId, CaseLevel, ZoneId } from "./types.ts";

export const caseLevels: Record<CaseId, CaseLevel> = {
  1: {
    id: 1,
    tokens: Array.from({ length: 12 }, (_, index) => index + 1),
    dropZones: [
      { id: "a", condition: { kind: "count", count: 4 } },
      { id: "b", condition: { kind: "count", count: 4 } },
      { id: "c", condition: { kind: "count", count: 4 } },
    ],
  },
  2: {
    id: 2,
    tokens: [8, 9, 12, 15, 16, 7],
    dropZones: [
      { id: "a", condition: { kind: "multiple", divisor: 3 } },
      { id: "b", condition: { kind: "multiple", divisor: 4 } },
      { id: "c", condition: { kind: "neither", divisors: [3, 4] } },
    ],
  },
};

export function createBoard(caseId: CaseId): BoardState {
  return { tray: [...caseLevels[caseId].tokens], a: [], b: [], c: [] };
}

export function moveToken(
  board: BoardState,
  token: number,
  from: ZoneId,
  to: ZoneId,
  caseId: CaseId,
): BoardState {
  const level = caseLevels[caseId];
  if (
    !level ||
    !level.tokens.includes(token) ||
    from === to ||
    !board[from]?.includes(token) ||
    !board[to]
  )
    return board;

  const reusable = caseId === 2 && token === 12;
  // The tray's 12 is a reusable source; only two placed copies are allowed.
  const placedCopies = [board.a, board.b, board.c].filter((zone) =>
    zone.includes(12),
  ).length;
  if (board[to].includes(token) && !(reusable && to === "tray")) return board;
  if (reusable && from === "tray" && placedCopies >= 2) return board;

  const next = {
    ...board,
    [from]: board[from].filter((value) => value !== token),
  };
  if (!next[to].includes(token)) next[to] = [...next[to], token];

  if (reusable) {
    next.tray = next.tray.filter((value) => value !== 12);
    if ([next.a, next.b, next.c].filter((zone) => zone.includes(12)).length < 2)
      next.tray = [...next.tray, 12];
  }
  return next;
}

export function isSolved(caseId: CaseId, board: BoardState): boolean {
  const level = caseLevels[caseId];
  if (!level || board.tray.length !== 0) return false;
  const placed = [...board.a, ...board.b, ...board.c];
  if (placed.some((token) => !level.tokens.includes(token))) return false;
  if (
    !level.tokens.every(
      (token) =>
        placed.filter((value) => value === token).length ===
        (caseId === 2 && token === 12 ? 2 : 1),
    )
  )
    return false;

  return level.dropZones.every(({ id, condition }) => {
    const tokens = board[id];
    if (new Set(tokens).size !== tokens.length) return false;
    if (condition.kind === "count") return tokens.length === condition.count;
    if (condition.kind === "multiple")
      return tokens.every((token) => token % condition.divisor === 0);
    return tokens.every((token) =>
      condition.divisors.every((divisor) => token % divisor !== 0),
    );
  });
}

export function isCaseUnlocked(
  caseId: CaseId,
  completedCases: number[],
): boolean {
  return caseId === 1 || (caseId === 2 && completedCases.includes(1));
}
