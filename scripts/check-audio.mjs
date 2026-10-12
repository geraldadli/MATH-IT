import assert from "node:assert/strict";
import { MUSIC_STEP_SECONDS, playEffect, playMusicStep } from "../src/audio.ts";

// Record Web Audio scheduling without a browser or speakers.
function recordingContext() {
  const voices = [];
  const parameter = (events) => Object.fromEntries(
    ["setValueAtTime", "linearRampToValueAtTime", "exponentialRampToValueAtTime"].map(method => [method, (value, time) => {
      assert.ok(Number.isFinite(value) && value >= 0);
      assert.ok(Number.isFinite(time) && time >= 0);
      events.push({ method, value, time });
    }]),
  );
  return {
    currentTime: 0, destination: {}, voices,
    createOscillator() {
      const voice = { pitches: [], levels: [], disconnected: false };
      voices.push(voice);
      return {
        frequency: parameter(voice.pitches),
        connect(gain) { voice.levels = gain.events; },
        start(time) { voice.start = time; },
        stop(time) { voice.end = time; this.onended(); },
        disconnect() { voice.disconnected = true; },
      };
    },
    createGain() {
      const events = [];
      return { events, gain: parameter(events), connect() {}, disconnect() {} };
    },
  };
}

const effects = {};
for (const sound of ["click", "drag", "drop", "correct", "hint", "levelUp"]) {
  const context = recordingContext();
  playEffect(context, sound);
  effects[sound] = context.voices;
  assert.ok(context.voices.length > 0 && context.voices.length <= 4);
  for (const voice of context.voices) {
    assert.ok(voice.end > voice.start && voice.end < 1, "Effects stay short");
    assert.ok(voice.disconnected, "Finished oscillators are released");
    assert.equal(voice.levels[0].value, 0, "Start silently to avoid clicks");
    assert.ok(voice.levels.at(-1).value < 0.001, "Fade out gently");
    assert.ok(voice.levels.every(event => event.value <= 0.08), "Bound effect volume");
    if (sound !== "correct" && sound !== "levelUp") assert.ok(voice.pitches.length >= 3, "Bubble sounds need a pitch glide");
  }
}
assert.notDeepEqual(effects.drag, effects.drop, "Pickup and placement must sound distinct");
assert.ok(effects.levelUp.at(-1).end > effects.correct.at(-1).end, "A level-up fanfare rings longer than a solve");
const music = recordingContext();
for (let step = 0; step < 128; step++) playMusicStep(music, step, step * MUSIC_STEP_SECONDS);
assert.ok(music.voices.length > 100, "Two full melodic loops are scheduled");
const half = music.voices.length / 2;
assert.deepEqual(music.voices.slice(0, half).map(v => v.pitches[0].value), music.voices.slice(half).map(v => v.pitches[0].value), "Melody repeats cleanly");
assert.ok(music.voices.every(v => v.levels.every(event => event.value < 0.03)), "Music remains quieter than effects");
console.log("Audio checks passed: distinct bubbly effects, bounded volume, note envelopes, cleanup, and repeating background music.");
