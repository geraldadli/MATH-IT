import assert from "node:assert/strict";
import {
  caseLevels,
  getCase,
  getNextCase,
  createBoard,
  isCaseUnlocked,
  isSolved,
  moveToken,
  normaliseCompletedCases,
} from "../src/gameLogic.ts";

let board = createBoard(1);
assert.equal(isSolved(1, board), false);
assert.equal(moveToken(board, 99, "tray", "a", 1), board);
assert.equal(moveToken(board, 1, "b", "a", 1), board);
const original = board;
for (let token = 1; token <= 12; token++)
  board = moveToken(
    board,
    token,
    "tray",
    token <= 4 ? "a" : token <= 8 ? "b" : "c",
    1,
  );
assert.equal(original.tray.length, 12, "Moves must preserve undo snapshots");
assert.equal(isSolved(1, board), true);
assert.equal(isSolved(1, { ...board, a: [1, 1, 3, 4] }), false);

board = createBoard(2);
board = moveToken(board, 12, "tray", "c", 2);
assert.equal(board.tray.includes(12), true);
const mistaken = board;
board = moveToken(board, 12, "c", "tray", 2);
assert.equal(
  board.c.includes(12),
  false,
  "Wrong copies can return to an already populated tray",
);
assert.equal(board.tray.filter((token) => token === 12).length, 1);
assert.equal(
  mistaken.c.includes(12),
  true,
  "Undo snapshot keeps the wrong-zone copy",
);
board = moveToken(board, 12, "tray", "a", 2);
assert.equal(
  moveToken(board, 12, "tray", "a", 2),
  board,
  "No duplicate within one zone",
);
board = moveToken(board, 12, "tray", "c", 2);
assert.equal(
  board.tray.includes(12),
  false,
  "Hide the source after two copies are placed, including wrong groups",
);
assert.equal(
  moveToken(board, 12, "tray", "b", 2),
  board,
  "At most two placed copies",
);
const twoCopies = board;
board = moveToken(board, 12, "c", "tray", 2);
assert.equal(
  board.tray.includes(12),
  true,
  "Returning any copy restores a usable source",
);
assert.equal(
  twoCopies.tray.includes(12),
  false,
  "Undo preserves the hidden-source snapshot",
);
board = moveToken(board, 12, "tray", "c", 2);
board = moveToken(board, 12, "c", "b", 2);
assert.equal(board.tray.includes(12), false);
board = moveToken(board, 12, "a", "tray", 2);
assert.equal(
  board.tray.includes(12),
  true,
  "A missing correct copy becomes available again",
);
board = moveToken(board, 12, "tray", "a", 2);
for (const [token, zone] of [
  [8, "b"],
  [9, "a"],
  [15, "a"],
  [16, "b"],
  [7, "c"],
])
  board = moveToken(board, token, "tray", zone, 2);
assert.equal(isSolved(2, board), true);
assert.equal(isSolved(2, { ...board, a: [9, 15], c: [7, 12] }), false);
assert.equal(isSolved(2, { ...board, b: [8, 12, 16, 20] }), false);
assert.equal(isCaseUnlocked(1, []), true);
assert.equal(isCaseUnlocked(2, []), false);
assert.equal(isCaseUnlocked(2, [2]), false);
assert.equal(isCaseUnlocked(2, [1]), true);
assert.equal(isCaseUnlocked(3, [1, 2]), true);
assert.equal(isCaseUnlocked(13, [1, 2]), false);

assert.equal(caseLevels.length, 12);
const progress = [];
for (const level of caseLevels) {
  const id = level.id;
  assert.equal(getCase(id), level);
  assert.equal(getNextCase(progress), level);
  assert.equal(isCaseUnlocked(id, progress), true);
  if (id > 1) {
    assert.equal(isCaseUnlocked(id, progress.slice(1)), false, `Case ${id} requires every earlier case`);
    assert.equal(isCaseUnlocked(id, [id]), false, `Case ${id} cannot unlock itself`);
  }
  assert.deepEqual(level.dropZones.map((zone) => zone.id), ["a", "b", "c"]);
  assert.equal(new Set(level.tokens).size, level.tokens.length);
  assert.equal(level.hints.length, 3);
  for (const language of ["en", "id"]) {
    assert.ok(level.title[language] && level.skill[language] && level.mission[language]);
    assert.ok(level.mission[language].split(/\s+/).length <= 12, `Case ${id} mission must stay short`);
    assert.ok(level.hints.every((hint) => hint.text[language] && hint.visual));
    for (const hint of level.hints) {
      assert.ok(hint.text[language].split(/\s+/).length <= 12, `Case ${id} hints must stay concise`);
      assert.ok(!/\d\s*=\s*\d/.test(hint.visual), `Case ${id} hints must not show solved numeric equalities`);
    }
    assert.ok(level.dropZones.every((zone) => zone.label[language]));
  }
  if (id >= 3) assert.ok(level.tokens.every((token) => level.tokenLabels[token]));

  // These answer groups are independent of the authored validation conditions.
  const solution = id === 1
    ? { a: [1, 2, 3, 4], b: [5, 6, 7, 8], c: [9, 10, 11, 12] }
    : id === 2
      ? { a: [9, 12, 15], b: [8, 12, 16], c: [7] }
      : { a: [1, 4], b: [2, 5], c: [3, 6] };
  let attempt = createBoard(id);
  assert.equal(isSolved(id, attempt), false);
  for (const [zone, tokens] of Object.entries(solution)) {
    for (const token of tokens) attempt = moveToken(attempt, token, "tray", zone, id);
  }
  assert.equal(isSolved(id, attempt), true, `Case ${id} must be solvable through actual moves`);
  assert.equal(attempt.tray.length, 0);
  assert.equal(isSolved(id, moveToken(attempt, attempt.a[0], "a", "b", id)), false, `Case ${id} rejects misplaced clues`);
  assert.equal(isSolved(id, { ...attempt, a: attempt.a.slice(1) }), false, `Case ${id} rejects missing clues`);
  assert.equal(isSolved(id, { ...attempt, c: [...attempt.c, 999] }), false, `Case ${id} rejects unknown clues`);
  assert.equal(isSolved(id, { ...attempt, a: [...attempt.a, attempt.a[0]] }), false, `Case ${id} rejects duplicate clues`);
  assert.equal(isSolved(id, { ...attempt, tray: [attempt.a[0]] }), false, `Case ${id} requires an empty tray`);
  progress.push(id);
}

assert.equal(getNextCase(progress), undefined);
assert.equal(getNextCase([1, 3]).id, 2);
assert.deepEqual(normaliseCompletedCases([1, 2]), [1, 2], "Preserve legacy progress");
assert.deepEqual(normaliseCompletedCases([3, 2, 1, 2, 99]), [1, 2, 3]);
assert.deepEqual(normaliseCompletedCases([1, 2, 4, 5]), [1, 2]);
assert.deepEqual(normaliseCompletedCases([1, "2", 3]), [1]);
assert.deepEqual(normaliseCompletedCases([2, 3]), []);
assert.deepEqual(normaliseCompletedCases(["1", 2]), []);
assert.deepEqual(normaliseCompletedCases(progress), progress);
for (const malformed of [null, undefined, "[1,2]", {}, 12, true]) {
  assert.deepEqual(normaliseCompletedCases(malformed), []);
}
for (const invalidId of [0, 13, -1, NaN]) {
  assert.throws(() => getCase(invalidId), /Unknown case/);
  assert.equal(isSolved(invalidId, createBoard(1)), false);
  assert.equal(isCaseUnlocked(invalidId, progress), false);
}
console.log(
  "Game checks passed: all 12 cases, invalid solutions, reusable copies, undo, sequential locking, and saved-progress migration.",
);
