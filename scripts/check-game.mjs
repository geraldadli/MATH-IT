import assert from "node:assert/strict";
import {
  caseLevels,
  getCase,
  getNextCase,
  createBoard,
  isCaseUnlocked,
  isSolved,
  getReviewZones,
  moveToken,
  normaliseCompletedCases,
} from "../src/gameLogic.ts";

let board = createBoard(1);
assert.deepEqual(getReviewZones(1, board), [], "An untouched board should point to the tray, not blame empty groups");
let overfilled = createBoard(1);
for (let token = 1; token <= 5; token++) overfilled = moveToken(overfilled, token, "tray", "a", 1);
assert.deepEqual(getReviewZones(1, overfilled), ["a"], "An overfilled group can be reviewed before the tray is empty");
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
assert.equal(isCaseUnlocked(23, [1, 2]), false);

assert.equal(caseLevels.length, 22);
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
  if (id >= 3) assert.ok(level.tokens.every((token) => level.tokenLabels?.[token] || (level.tokenWords?.[token].en && level.tokenWords[token].id)));
  if (level.chart) {
    const { chart } = level;
    assert.equal(chart.categories.length, chart.values.length, `Case ${id}: one value per category`);
    assert.ok(chart.values.every((value) => value >= 0 && value <= chart.max), `Case ${id}: values fit the scale`);
    assert.equal(chart.max % (chart.labelStep / 2), 0, `Case ${id}: the scale ends on a gridline`);
  }

  // These answer groups are independent of the authored validation conditions.
  // The square (1) sits in both shape groups, so it is not first in "a".
  const solutions = {
    1: { a: [1, 2, 3, 4], b: [5, 6, 7, 8], c: [9, 10, 11, 12] },
    2: { a: [9, 12, 15], b: [8, 12, 16], c: [7] },
    13: { a: [2, 1], b: [1, 3, 4], c: [5, 6] },
    14: { a: [1, 4, 7], b: [2, 5], c: [3, 6] },
    15: { a: [1, 4], b: [2, 5, 7], c: [3, 6] },
    16: { a: [1, 4], b: [2, 5], c: [3, 6, 7] },
    17: { a: [1, 4], b: [2, 5, 7, 8], c: [3, 6] },
    18: { a: [1, 4], b: [2, 5, 7], c: [3, 6] },
    19: { a: [1, 5], b: [2, 3, 7], c: [4, 6] },
    20: { a: [1, 2], b: [3, 4, 5], c: [6, 7] },
    21: { a: [1, 2], b: [3, 4, 7], c: [5, 6] },
    22: { a: [1, 2], b: [3, 4], c: [5, 6, 7] },
  };
  const solution = solutions[id] ?? { a: [1, 4], b: [2, 5], c: [3, 6] };
  let attempt = createBoard(id);
  assert.equal(isSolved(id, attempt), false);
  for (const [zone, tokens] of Object.entries(solution)) {
    for (const token of tokens) attempt = moveToken(attempt, token, "tray", zone, id);
  }
  assert.equal(isSolved(id, attempt), true, `Case ${id} must be solvable through actual moves`);
  assert.deepEqual(getReviewZones(id, attempt), [], `Case ${id}: correct groups need no review`);
  const misplaced = moveToken(attempt, attempt.a[0], "a", "b", id);
  assert.deepEqual(getReviewZones(id, misplaced), id === 1 ? ["a", "b"] : ["b"], `Case ${id}: flag incorrect groups without revealing the destination`);
  const unfinished = moveToken(attempt, attempt.a[0], "a", "tray", id);
  assert.deepEqual(getReviewZones(id, unfinished), [], `Case ${id}: remaining clues should flag the tray`);
  assert.equal(attempt.tray.length, 0);
  assert.equal(isSolved(id, moveToken(attempt, attempt.a[0], "a", "b", id)), false, `Case ${id} rejects misplaced clues`);
  assert.equal(isSolved(id, { ...attempt, a: attempt.a.slice(1) }), false, `Case ${id} rejects missing clues`);
  assert.equal(isSolved(id, { ...attempt, c: [...attempt.c, 999] }), false, `Case ${id} rejects unknown clues`);
  assert.equal(isSolved(id, { ...attempt, a: [...attempt.a, attempt.a[0]] }), false, `Case ${id} rejects duplicate clues`);
  assert.equal(isSolved(id, { ...attempt, tray: [attempt.a[0]] }), false, `Case ${id} requires an empty tray`);
  progress.push(id);
}

assert.equal(getNextCase(progress), undefined);
const sharedCopy = moveToken(createBoard(2), 12, "tray", "a", 2);
assert.deepEqual(getReviewZones(2, sharedCopy), [], "A valid reusable copy must not be flagged");
assert.deepEqual(getReviewZones(2, moveToken(sharedCopy, 12, "tray", "c", 2)), ["c"], "Flag only the incorrect copy's group");
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
for (const invalidId of [0, 23, -1, NaN]) {
  assert.throws(() => getCase(invalidId), /Unknown case/);
  assert.equal(isSolved(invalidId, createBoard(1)), false);
  assert.equal(isCaseUnlocked(invalidId, progress), false);
}
console.log(
  "Game checks passed: all 22 cases, invalid solutions, reusable copies, undo, sequential locking, and saved-progress migration.",
);
