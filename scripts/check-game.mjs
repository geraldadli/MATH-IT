import assert from "node:assert/strict";
import {
  createBoard,
  isCaseUnlocked,
  isSolved,
  moveToken,
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
assert.equal(isCaseUnlocked(3, [1, 2]), false);
console.log(
  "Game checks passed: division, reusable 12, undo snapshots, validation, and locking.",
);
