import assert from "node:assert/strict";
import {
  caseLevels,
  caseNumber,
  getCase,
  getNextCase,
  getUnit,
  units,
  createBoard,
  isCaseUnlocked,
  isSolved,
  getReviewZones,
  moveToken,
  normaliseCompletedCases,
} from "../src/gameLogic.ts";
import { dashboardAnswer, dashboardRows, filterDimension, isDashboardSolved, niceScale, pickRow, reviewDashboard } from "../src/dashboard.ts";
import { XP_PER_CASE, detectiveLevels, getLevel, getLevelProgress, xpForCases } from "../src/levels.ts";

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
assert.equal(isCaseUnlocked(25, [1, 2]), false);
assert.equal(isCaseUnlocked(24, [20, 21, 22]), false);
assert.equal(isCaseUnlocked(10, []), true, "Every unit opens with its first case");
assert.equal(isCaseUnlocked(20, []), true, "Every unit opens with its first case");
assert.equal(isCaseUnlocked(11, [10]), true, "Units progress independently");
assert.equal(isCaseUnlocked(16, [1, 2, 3, 4, 5, 6, 7, 8, 9]), true, "Unit 1 skips cases from other units");
assert.equal(isCaseUnlocked(12, []), true, "Every unit opens with its first case");
assert.equal(isCaseUnlocked(19, [12, 14, 15]), false);
assert.equal(isCaseUnlocked(13, [10]), false);

assert.equal(caseLevels.length, 27);
assert.deepEqual(units.map((unit) => unit.id), [1, 2, 3, 4]);
assert.ok(units.every((unit) => unit.cases.length >= 3 && unit.cases.length <= 10), "Units stay roughly balanced");
assert.deepEqual(
  units.flatMap((unit) => unit.cases).sort((a, b) => a - b),
  caseLevels.map((level) => level.id),
  "Every case belongs to exactly one unit",
);
for (const unit of units) {
  assert.ok(unit.title.en && unit.title.id, `Unit ${unit.id} needs a bilingual title`);
  assert.deepEqual([...unit.cases].sort((a, b) => a - b), unit.cases, `Unit ${unit.id} adds new cases at its end`);
}
// The goal view, with any sort the question asks for.
const goalSettings = (spec, overrides = {}) => ({
  ...spec.start, groupBy: spec.goal.groupBy, filter: spec.goal.filter, sort: spec.goal.sort ?? spec.start.sort, ...overrides,
});
const filterOptions = (spec, groupBy) => ["all", ...spec.dimensions[filterDimension(groupBy)].categories.map((category) => category.key)];

function checkDashboard({ id, dashboard: spec }) {
  const [rowDimension, columnDimension] = spec.dimensions;
  assert.equal(spec.values.length, rowDimension.categories.length, `Case ${id}: one row of values per category`);
  assert.ok(spec.values.every((row) => row.length === columnDimension.categories.length && row.every((value) => Number.isInteger(value) && value >= 0)), `Case ${id}: a whole, non-negative value in every cell`);
  const keys = spec.dimensions.flatMap((dimension) => dimension.categories.map((category) => category.key));
  assert.equal(new Set(keys).size, keys.length, `Case ${id}: category keys are unique across both dimensions`);
  assert.ok(!keys.includes("all"), `Case ${id}: "all" is reserved for the unfiltered view`);
  for (const language of ["en", "id"]) {
    assert.ok(spec.title[language] && spec.measure[language], `Case ${id}: bilingual title and measure`);
    assert.ok(spec.dimensions.every((dimension) => dimension.label[language] && dimension.categories.every((category) => category.label[language])), `Case ${id}: bilingual labels`);
  }

  // Every setting the question needs must be reachable with the tools on offer.
  assert.equal(new Set(spec.tools).size, spec.tools.length);
  assert.equal(spec.start.filter, "all", `Case ${id}: start unfiltered`);
  assert.equal(spec.start.view, "chart", `Case ${id}: start on the chart`);
  if (spec.goal.groupBy !== spec.start.groupBy) assert.ok(spec.tools.includes("groupBy"), `Case ${id}: changing the bars needs the group tool`);
  if (spec.goal.filter !== "all") assert.ok(spec.tools.includes("filter"), `Case ${id}: the question needs the filter tool`);
  if (spec.goal.sort && spec.goal.sort !== spec.start.sort) assert.ok(spec.tools.includes("sort"), `Case ${id}: the question needs the sort tool`);
  assert.ok(filterOptions(spec, spec.goal.groupBy).includes(spec.goal.filter), `Case ${id}: the goal filter exists`);

  // One clear answer, and only the right combination of tools reveals it.
  const answer = dashboardAnswer(spec);
  const goalRows = dashboardRows(spec, goalSettings(spec, { sort: "none" }));
  const answerValue = goalRows.find((row) => row.key === answer).value;
  assert.equal(goalRows.filter((row) => row.value === answerValue).length, 1, `Case ${id}: the answer bar has no tie`);
  for (const filter of filterOptions(spec, spec.goal.groupBy).filter((option) => option !== spec.goal.filter)) {
    const rows = dashboardRows(spec, goalSettings(spec, { filter, sort: "none" }));
    assert.notEqual(pickRow(rows, spec.goal.pick).key, answer, `Case ${id}: filtering by ${filter} must point to a different bar`);
  }

  // Sorting orders bars by value and keeps ties in their natural order.
  const natural = spec.dimensions[spec.goal.groupBy].categories.map((category) => category.key);
  assert.deepEqual(dashboardRows(spec, goalSettings(spec, { sort: "none" })).map((row) => row.key), natural);
  const ascending = dashboardRows(spec, goalSettings(spec, { sort: "asc" })).map((row) => row.value);
  const descending = dashboardRows(spec, goalSettings(spec, { sort: "desc" })).map((row) => row.value);
  assert.ok(ascending.every((value, index) => index === 0 || ascending[index - 1] <= value), `Case ${id}: fewest first ascends`);
  assert.ok(descending.every((value, index) => index === 0 || descending[index - 1] >= value), `Case ${id}: most first descends`);
  if (spec.goal.sort) assert.equal(dashboardRows(spec, goalSettings(spec))[0].key, answer, `Case ${id}: after the asked-for sort, the answer is the first bar`);

  // Solving needs the right tools and the right bar; the view never matters.
  const goal = goalSettings(spec);
  assert.equal(isDashboardSolved(spec, goal, answer), true, `Case ${id} must be solvable through its tools`);
  assert.equal(isDashboardSolved(spec, { ...goal, view: "table" }, answer), true, `Case ${id}: the table view answers too`);
  assert.equal(isDashboardSolved(spec, spec.start, null), false);
  assert.deepEqual(reviewDashboard(spec, goal, null), { tools: [], answer: "missing" });
  assert.deepEqual(reviewDashboard(spec, goal, goalRows.find((row) => row.key !== answer).key), { tools: [], answer: "wrong" }, `Case ${id}: a wrong bar flags no tool`);
  if (spec.goal.filter !== "all") {
    assert.deepEqual(reviewDashboard(spec, { ...goal, filter: "all" }, answer).tools, ["filter"], `Case ${id}: a missing filter is flagged`);
    assert.equal(isDashboardSolved(spec, { ...goal, filter: "all" }, answer), false, `Case ${id}: the right bar is not enough without the filter`);
  }
  if (spec.goal.sort) {
    const wrongSort = spec.goal.sort === "asc" ? "desc" : "asc";
    assert.deepEqual(reviewDashboard(spec, { ...goal, sort: wrongSort }, answer).tools, ["sort"], `Case ${id}: a wrong sort is flagged`);
  }
  if (spec.tools.includes("groupBy")) {
    const otherBars = { ...goal, groupBy: spec.goal.groupBy === 0 ? 1 : 0, filter: "all" };
    const review = reviewDashboard(spec, otherBars, answer);
    assert.ok(review.tools.includes("groupBy") && !review.tools.includes("filter"), `Case ${id}: wrong bars are flagged before the filter`);
    assert.equal(review.answer, "wrong");
  }

  // Every reachable view fits a scale of at most six steps that ends on a gridline.
  for (const groupBy of spec.tools.includes("groupBy") ? [0, 1] : [spec.start.groupBy]) {
    for (const filter of filterOptions(spec, groupBy)) {
      const largest = Math.max(...dashboardRows(spec, { ...spec.start, groupBy, filter }).map((row) => row.value));
      const scale = niceScale(largest);
      assert.ok(scale.max >= largest && scale.max % scale.step === 0 && scale.max / scale.step <= 6, `Case ${id}: ${filter} fits its scale`);
    }
  }
  assert.throws(() => createBoard(id), /dashboard/, `Case ${id} has no clue board`);
  assert.deepEqual(getReviewZones(id, createBoard(1)), []);
  assert.equal(isSolved(id, createBoard(1)), false);
}

const progress = [];
for (const level of units.flatMap((unit) => unit.cases.map(getCase))) {
  const id = level.id;
  const unit = getUnit(id);
  const position = unit.cases.indexOf(id);
  assert.equal(getCase(id), level);
  assert.equal(caseNumber(id), position + 1);
  assert.equal(getNextCase(progress), level);
  assert.equal(getNextCase(progress, unit.id), level);
  assert.equal(isCaseUnlocked(id, progress), true);
  if (position > 0) {
    assert.equal(isCaseUnlocked(id, progress.filter((solved) => solved !== unit.cases[0])), false, `Case ${id} requires every earlier case in its unit`);
    assert.equal(isCaseUnlocked(id, [id]), false, `Case ${id} cannot unlock itself`);
  }
  assert.equal(level.hints.length, 3);
  for (const language of ["en", "id"]) {
    assert.ok(level.title[language] && level.skill[language] && level.mission[language]);
    assert.ok(level.mission[language].split(/\s+/).length <= 12, `Case ${id} mission must stay short`);
    assert.ok(level.hints.every((hint) => hint.text[language] && hint.visual));
    for (const hint of level.hints) {
      assert.ok(hint.text[language].split(/\s+/).length <= 12, `Case ${id} hints must stay concise`);
      assert.ok(!/\d\s*=\s*\d/.test(hint.visual), `Case ${id} hints must not show solved numeric equalities`);
    }
  }
  if (level.kind === "dashboard") {
    checkDashboard(level);
    progress.push(id);
    continue;
  }
  assert.deepEqual(level.dropZones.map((zone) => zone.id), ["a", "b", "c"]);
  assert.equal(new Set(level.tokens).size, level.tokens.length);
  for (const language of ["en", "id"]) assert.ok(level.dropZones.every((zone) => zone.label[language]));
  if (id >= 3) assert.ok(level.tokens.every((token) => level.tokenLabels?.[token] || (level.tokenWords?.[token].en && level.tokenWords[token].id)));
  if (level.chart) {
    const { chart } = level;
    assert.equal(chart.categories.length, chart.values.length, `Case ${id}: one value per category`);
    if (chart.kind === "bar" || chart.kind === "line") {
      assert.ok(chart.values.every((value) => value >= 0 && value <= chart.max), `Case ${id}: values fit the scale`);
      assert.equal(chart.max % (chart.labelStep / 2), 0, `Case ${id}: the scale ends on a gridline`);
    }
    if (chart.kind === "pictograph")
      assert.ok(chart.values.every((value) => value % (chart.iconValue / 2) === 0), `Case ${id}: rows need only whole or half icons`);
    if (chart.kind === "pie") {
      const total = chart.values.reduce((sum, value) => sum + value, 0);
      assert.ok(chart.values.length >= 3 && chart.values.length <= 4, `Case ${id}: a pie keeps to the validated colours`);
      assert.ok(chart.values.every((value) => value > 0 && (value * 8) % total === 0), `Case ${id}: slices line up with the eighth guides`);
    }
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
    23: { a: [1, 2], b: [3, 4, 5], c: [6, 7] },
    24: { a: [1, 2], b: [3, 4, 5], c: [6, 7] },
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
for (const unit of units) assert.equal(getNextCase(progress, unit.id), undefined);
assert.equal(getNextCase([1, 3], 4).id, 20, "Each unit has its own next case");
assert.equal(getNextCase([12, 14], 2).id, 15);
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
assert.deepEqual(normaliseCompletedCases([20, 10]), [10, 20], "Keep progress in every unit");
assert.deepEqual(normaliseCompletedCases([11, 21]), [], "Each unit keeps only its uninterrupted run");
assert.deepEqual(
  normaliseCompletedCases([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "Progress from the original twelve cases survives the move to units",
);
assert.deepEqual(normaliseCompletedCases(progress), [...progress].sort((a, b) => a - b));
for (const malformed of [null, undefined, "[1,2]", {}, 12, true]) {
  assert.deepEqual(normaliseCompletedCases(malformed), []);
}
for (const invalidId of [0, 28, -1, NaN]) {
  assert.throws(() => getCase(invalidId), /Unknown case/);
  assert.equal(isSolved(invalidId, createBoard(1)), false);
  assert.equal(isCaseUnlocked(invalidId, progress), false);
}
const maxXp = xpForCases(caseLevels.length);
assert.equal(XP_PER_CASE, 100);
assert.equal(detectiveLevels[0].minXp, 0, "Every new detective starts with a rank");
assert.equal(detectiveLevels.at(-1).minXp, maxXp, "The top rank needs every case");
detectiveLevels.forEach((rank, index) => {
  assert.equal(rank.level, index + 1);
  assert.equal(rank.minXp % XP_PER_CASE, 0, `Level ${rank.level} is reached by whole cases`);
  assert.ok(rank.title.en && rank.title.id, `Level ${rank.level} needs a bilingual title`);
  if (index > 1) {
    const step = rank.minXp - detectiveLevels[index - 1].minXp;
    assert.ok(step >= detectiveLevels[index - 1].minXp - detectiveLevels[index - 2].minXp, "Levels never get easier to reach");
  }
});
assert.equal(getLevel(0).level, 1);
assert.equal(getLevel(XP_PER_CASE).level, 2, "The first solved case earns a level");
assert.equal(getLevel(299).level, 2);
assert.equal(getLevel(300).level, 3);
assert.equal(getLevel(maxXp).level, detectiveLevels.length);
assert.equal(getLevel(maxXp + 500).level, detectiveLevels.length);
assert.equal(getLevel(-50).level, 1);
assert.equal(getLevel(NaN).level, 1);
assert.deepEqual(getLevelProgress(400), { current: detectiveLevels[2], next: detectiveLevels[3], xpIntoLevel: 100, xpForLevel: 200 });
assert.equal(getLevelProgress(maxXp).next, undefined, "The top rank has no next level");
for (let solved = 0; solved < caseLevels.length; solved++) {
  const gain = getLevel(xpForCases(solved + 1)).level - getLevel(xpForCases(solved)).level;
  assert.ok(gain === 0 || gain === 1, "One case never skips a level");
}

console.log(
  `Game checks passed: all ${caseLevels.length} cases in 4 units, dashboard tools and answers, invalid solutions, reusable copies, undo, sequential locking, saved-progress migration, and detective levels.`,
);
