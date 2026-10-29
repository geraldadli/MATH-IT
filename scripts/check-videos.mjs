import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { units } from "../src/gameLogic.ts";
import { accessibleRoute, canAccessCase, firstUnitRoute, readRoute, routeHash } from "../src/navigation.ts";
import {
  createViewingSession,
  formatVideoTime,
  mergeUnitVideos,
  mergeVideoProgress,
  nextUnwatchedPosition,
  normaliseUnitVideos,
  normaliseVideoProgress,
  recordViewingSample,
  resetViewingAnchor,
  unitVideos,
  watchedSeconds,
} from "../src/videoProgress.ts";

const duration = unitVideos[1].duration;
const empty = () => normaliseVideoProgress(undefined, duration);
const blankPlayer = () => ({ completedCases: [], unitVideos: {} });
const sample = (session, position, now, overrides = {}) => recordViewingSample(session, {
  position, now, playing: true, seeking: false, rate: 1, ...overrides,
});

// Feed deterministic samples with matching media time and elapsed wall time.
// Resetting the anchor models seeking or remounting the real video element.
function watch(session, start, end, now = 0, rate = 1) {
  resetViewingAnchor(session);
  sample(session, start, now, { rate });
  let position = start;
  while (position < end) {
    const next = Math.min(end, position + 0.5);
    now += (next - position) / rate * 1000;
    position = next;
    sample(session, position, now, { rate });
  }
  return now;
}

assert.deepEqual(Object.keys(unitVideos), ["1", "2", "3", "4"]);
assert.equal(new Set(Object.values(unitVideos).map((video) => video.src)).size, 4, "Each unit needs its own video");
for (const unit of units) {
  const video = unitVideos[unit.id];
  assert.match(video.src, new RegExp(`/unit-${unit.id}-intro\\.mp4$`));
  assert.equal(video.duration, 120, "Duration must match the supplied two-minute files");
  assert.ok(existsSync(new URL(`../public${video.src}`, import.meta.url)), "Assigned video must ship with the app");
  assert.ok(existsSync(new URL(`../public${video.poster}`, import.meta.url)), "Assigned poster must exist");
  for (const track of video.captions ?? []) {
    assert.match(readFileSync(new URL(`../public${track.src}`, import.meta.url), "utf8"), /^WEBVTT/, "Caption tracks must be valid WebVTT sources");
  }
  const player = blankPlayer();
  const first = { kind: "case", unitId: unit.id, caseId: unit.cases[0] };
  const later = { kind: "case", unitId: unit.id, caseId: unit.cases[1] };
  const intro = { kind: "video", unitId: unit.id };
  assert.equal(canAccessCase(first.caseId, player), false, "The first case also requires the introduction");
  assert.deepEqual(accessibleRoute(first, player), intro, "A direct case link must show the correct unit video");
  assert.deepEqual(accessibleRoute(later, player), intro, "A direct link to a later case must also show the unit video");
  assert.deepEqual(accessibleRoute({ kind: "unit", unitId: unit.id }, player), intro, "Selecting an unwatched unit opens its introduction");
  const viewing = createViewingSession(undefined, video.duration);
  watch(viewing, 0, video.duration);
  player.unitVideos[unit.id] = viewing.progress;
  assert.equal(viewing.progress.completed, true);
  assert.equal(canAccessCase(first.caseId, player), true, "Video completion unlocks the first case of that unit");
  assert.deepEqual(accessibleRoute(first, player), first);
  assert.equal(canAccessCase(later.caseId, player), false, "Watching must not bypass sequential case progress");
  assert.deepEqual(accessibleRoute(later, player), { kind: "unit", unitId: unit.id });
  player.completedCases.push(first.caseId);
  assert.equal(canAccessCase(later.caseId, player), true);
  assert.deepEqual(accessibleRoute(later, player), later);
  assert.deepEqual(accessibleRoute(intro, player), intro, "Review remains available after completing the video");
  for (const other of units.filter((candidate) => candidate.id !== unit.id)) {
    assert.equal(canAccessCase(other.cases[0], player), false, "Unit video progress must be independent");
  }
  for (const route of [first, later, intro, { kind: "unit", unitId: unit.id }]) {
    assert.deepEqual(readRoute(routeHash(route), 1), route, "Valid direct links must round-trip");
    assert.deepEqual(readRoute(`${routeHash(route)}/`, 1), route, "A trailing slash must be harmless");
  }
}

for (const hash of ["", "#", "#/units/0", "#/units/5", "#/units/1/quiz/1", "#/units/1/cases/no", "#/units/1/video/extra", "#/units/1?video=true"]) {
  assert.deepEqual(readRoute(hash, 3), { kind: "unit", unitId: 3 }, "Malformed routes use a valid fallback unit");
}
assert.deepEqual(readRoute("#/units/1/cases/20", 3), { kind: "unit", unitId: 1 }, "A case cannot be assigned to the wrong unit by editing its URL");
assert.deepEqual(readRoute("#/units/4/cases/99999", 3), { kind: "unit", unitId: 4 });
assert.deepEqual(firstUnitRoute([]), { kind: "unit", unitId: 1 });
assert.deepEqual(firstUnitRoute(units[0].cases), { kind: "unit", unitId: 2 }, "Default navigation follows the existing case order");

const contiguous = createViewingSession(undefined, duration);
let clock = watch(contiguous, 0, duration - 1);
assert.equal(contiguous.progress.completed, false, "A full second left cannot count as complete");
sample(contiguous, duration, clock + 1000, { playing: false });
assert.equal(contiguous.progress.completed, true, "The ended/paused sample credits the last played interval");
assert.equal(watchedSeconds(contiguous.progress), duration);

const skipped = createViewingSession(undefined, duration);
clock = watch(skipped, 0, 10);
resetViewingAnchor(skipped);
sample(skipped, duration - 1, clock + 100, { seeking: true });
sample(skipped, duration - 1, clock + 200);
sample(skipped, duration, clock + 1200, { playing: false });
assert.equal(skipped.progress.completed, false, "Seeking directly to the end must never unlock a unit");
assert.equal(watchedSeconds(skipped.progress), 11);
assert.ok(nextUnwatchedPosition(skipped.progress, duration) < 10, "The resume helper points to the earliest unwatched gap");
watch(skipped, 10, duration - 1, clock + 2000);
assert.equal(skipped.progress.completed, true, "Watching the skipped middle later completes coverage");

const discontinuous = createViewingSession(undefined, duration);
watch(discontinuous, 0, 55);
watch(discontinuous, 65, duration, 100000);
assert.equal(discontinuous.progress.completed, false, "Watching both ends cannot fill an unwatched middle");
assert.equal(watchedSeconds(discontinuous.progress), duration - 10);
watch(discontinuous, 0, 55, 200000);
assert.equal(watchedSeconds(discontinuous.progress), duration - 10, "Rewatching a section does not inflate coverage");
assert.equal(discontinuous.progress.completed, false);
watch(discontinuous, 55, 65, 300000);
assert.equal(discontinuous.progress.completed, true);

const jump = createViewingSession(undefined, duration);
sample(jump, 0, 0);
sample(jump, duration, 200, { playing: false });
assert.equal(jump.progress.completed, false, "A missed seek event is still rejected by elapsed-time checks");
assert.equal(watchedSeconds(jump.progress), 0);
const longGap = createViewingSession(undefined, duration);
sample(longGap, 0, 0);
sample(longGap, duration, duration * 1000, { playing: false });
assert.equal(watchedSeconds(longGap.progress), 0, "A suspended timer cannot claim an entire movie");
const paused = createViewingSession(undefined, duration);
sample(paused, 0, 0, { playing: false });
sample(paused, duration, duration * 1000, { playing: false });
assert.equal(watchedSeconds(paused.progress), 0, "Time spent paused never counts as viewing");

const interrupted = createViewingSession(undefined, duration);
clock = watch(interrupted, 0, 32);
sample(interrupted, 32.25, clock + 250, { playing: false });
assert.equal(interrupted.progress.position, 32.25);
assert.equal(watchedSeconds(interrupted.progress), 32.25, "Pausing flushes the tail after the last timer sample");
sample(interrupted, 32.25, clock + 60000, { playing: false });
sample(interrupted, 32.25, clock + 61000);
sample(interrupted, 33.25, clock + 62000);
assert.equal(watchedSeconds(interrupted.progress), 33.25, "Resume adds only new playback after the pause");
const saved = JSON.parse(JSON.stringify({ 2: interrupted.progress }));
const restored = normaliseUnitVideos(saved);
assert.equal(restored[2].position, 33.25, "Refresh restores the saved position");
assert.equal(restored[2].completed, false);
const resumed = createViewingSession(restored[2], duration);
watch(resumed, resumed.progress.position, duration);
assert.equal(resumed.progress.completed, true, "An interrupted viewing session can finish after refresh");
assert.equal(watchedSeconds(resumed.progress), duration);

const review = mergeVideoProgress(resumed.progress, { position: 8, ranges: [[0, 8]], completed: false }, duration);
assert.equal(review.completed, true, "Reviewing or a stale callback cannot revoke completion");
assert.equal(review.position, 8, "Review keeps a useful new resume position");
assert.equal(watchedSeconds(review), duration, "Review preserves earned coverage");
const partialMerge = mergeVideoProgress({ position: 20, ranges: [[0, 20]], completed: false }, { position: 40, ranges: [[20, 40]], completed: false }, duration);
assert.deepEqual(partialMerge.ranges, [[0, 40]], "Concurrent/stale saves merge watched intervals without losing progress");

// Model an older tab writing after another tab completed a different unit.
// Context reads the saved snapshot before every write and merges these records.
const oldTabVideos = {
  1: { position: 12, ranges: [[0, 12]], completed: false },
  2: { position: 30, ranges: [[0, 30]], completed: false },
  3: { position: 80, ranges: [[0, 80]], completed: false },
};
const newerSavedVideos = {
  1: { position: 6, ranges: [[0, duration]], completed: true },
  2: { position: 45, ranges: [[30, 45]], completed: false },
  4: { position: 15, ranges: [[0, 15]], completed: false },
};
const oldTabBeforeMerge = JSON.stringify(oldTabVideos);
const savedBeforeMerge = JSON.stringify(newerSavedVideos);
const reconciledVideos = mergeUnitVideos(oldTabVideos, newerSavedVideos);
assert.deepEqual(Object.keys(reconciledVideos), ["1", "2", "3", "4"], "Merging retains units present in either tab");
assert.equal(reconciledVideos[1].completed, true, "An older tab cannot overwrite another tab's completed video");
assert.equal(reconciledVideos[1].position, 6, "The most recently stored review position takes precedence, even when it is earlier");
assert.equal(watchedSeconds(reconciledVideos[1]), duration, "Completed coverage survives a stale partial record");
assert.deepEqual(reconciledVideos[2].ranges, [[0, 45]], "Both tabs' independently watched sections are retained");
assert.equal(reconciledVideos[2].position, 45);
assert.equal(reconciledVideos[2].completed, false, "Merging partial unit 2 must not inherit unit 1's completion");
assert.deepEqual(reconciledVideos[3], oldTabVideos[3], "A unit with only local progress is preserved");
assert.deepEqual(reconciledVideos[4], newerSavedVideos[4], "A unit with only stored progress is preserved");
assert.equal(JSON.stringify(oldTabVideos), oldTabBeforeMerge, "Reconciliation does not mutate the old tab snapshot");
assert.equal(JSON.stringify(newerSavedVideos), savedBeforeMerge, "Reconciliation does not mutate the stored snapshot");
const staleSavedAfterCompletion = mergeUnitVideos(newerSavedVideos, oldTabVideos);
assert.equal(staleSavedAfterCompletion[1].completed, true, "Completion remains monotonic when the stored snapshot is older");
assert.equal(watchedSeconds(staleSavedAfterCompletion[1]), duration);
assert.deepEqual(mergeUnitVideos(reconciledVideos, newerSavedVideos), reconciledVideos, "Repeated writes cannot duplicate coverage");
assert.deepEqual(mergeUnitVideos({}, {}), {}, "Legacy empty records stay empty");
assert.deepEqual(mergeUnitVideos({}, newerSavedVideos), newerSavedVideos, "A tab with no video data imports saved progress");
assert.deepEqual(mergeUnitVideos(oldTabVideos, {}), oldTabVideos, "Unavailable or empty storage cannot erase local progress");

const studentOne = { ...blankPlayer(), completedCases: [1, 2], unitVideos: { 1: contiguous.progress, 2: interrupted.progress } };
const studentTwo = blankPlayer();
const before = JSON.stringify(studentOne);
const hydrated = JSON.parse(before);
hydrated.unitVideos = normaliseUnitVideos(hydrated.unitVideos);
assert.deepEqual(hydrated, studentOne, "Saved video data coexists with untouched lesson completion");
assert.equal(canAccessCase(1, studentOne), true);
assert.equal(canAccessCase(1, studentTwo), false, "Separate student state cannot inherit another student's completed video");
assert.equal(studentOne.unitVideos[2].completed, false, "Completing unit 1 does not complete an interrupted unit 2");
assert.deepEqual(studentOne.completedCases, [1, 2], "Review and video helpers must not mutate existing lesson progress");
assert.equal(JSON.stringify(studentOne), before, "Access checks and normalization are immutable");

assert.deepEqual(normaliseUnitVideos(undefined), {}, "Legacy profiles start with no completed introductions");
assert.deepEqual(normaliseUnitVideos(null), {});
assert.deepEqual(normaliseUnitVideos("broken"), {});
assert.deepEqual(normaliseVideoProgress(null, duration), empty());
assert.deepEqual(normaliseVideoProgress({ position: NaN, ranges: "broken", completed: "true" }, duration), empty());
assert.deepEqual(normaliseVideoProgress({ position: Infinity, ranges: [null, [0, NaN], [30, 10], [0, Infinity], [0, 0]], completed: false }, duration), empty());
assert.deepEqual(normaliseVideoProgress({ position: -20, ranges: [[-2, 5], [4, 10], [119, 200]], completed: false }, duration), {
  position: 0, ranges: [[0, 10], [119, duration]], completed: false,
});
assert.equal(normaliseVideoProgress({ position: 500 }, duration).position, duration);
assert.deepEqual(normaliseUnitVideos({ 1: null, 4: { position: 8, ranges: [[0, 8]] }, 5: { completed: true } }), {
  1: empty(), 4: { position: 8, ranges: [[0, 8]], completed: false },
}, "Corrupt unit records are sanitized independently and unknown units are ignored");
assert.equal(formatVideoTime(120), "2:00");
assert.equal(formatVideoTime(9), "0:09");
assert.equal(formatVideoTime(-3), "0:00");

console.log("Video checks passed: all four unit gates, direct links, watched coverage, seek rejection, resume, persistence, independent progress, review, and legacy saves.");
