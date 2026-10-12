export type Sound = "click" | "drag" | "drop" | "correct" | "hint" | "levelUp";

export const MUSIC_STEP_SECONDS = 0.36;
const melody = [
  72, 0, 76, 79, 0, 76, 74, 0,
  72, 76, 0, 81, 79, 0, 76, 0,
  69, 0, 72, 76, 0, 74, 72, 0,
  69, 72, 0, 76, 74, 0, 72, 0,
  65, 0, 69, 72, 0, 76, 74, 0,
  72, 69, 0, 72, 76, 0, 79, 0,
  67, 0, 71, 74, 0, 79, 76, 0,
  74, 71, 0, 74, 72, 0, 0, 0,
];
const bass = [48, 48, 45, 45, 41, 41, 43, 43];
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function tone(context: BaseAudioContext, pitch: number, at: number, duration: number, volume: number, bubble = false) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(bubble ? pitch * 0.55 : pitch, at);
  if (bubble) {
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 1.18, at + 0.035);
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.85, at + duration);
  }
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

export function playEffect(context: BaseAudioContext, sound: Sound) {
  const notes: Record<Sound, number[]> = {
    click: [660], drag: [520, 780], drop: [880, 590],
    correct: [523.25, 659.25, 783.99, 1046.5], hint: [659.25, 880],
    levelUp: [659.25, 783.99, 1046.5, 1318.51],
  };
  // Rewards ring as clear chimes; everyday actions stay bubbly.
  const chime = sound === "correct" || sound === "levelUp";
  const spacing = sound === "levelUp" ? 0.12 : 0.09;
  notes[sound].forEach((note, index) => {
    tone(context, note, context.currentTime + index * spacing, sound === "levelUp" ? 0.42 : chime ? 0.32 : 0.16, 0.065, !chime);
  });
}

export function playMusicStep(context: BaseAudioContext, step: number, at: number) {
  const index = step % melody.length;
  const note = melody[index];
  if (note) {
    tone(context, frequency(note), at, 0.48, 0.023);
    tone(context, frequency(note) * 2, at, 0.18, 0.004);
  }
  if (index % 4 === 0) tone(context, frequency(bass[Math.floor(index / 8)]), at, 1.1, 0.018);
}
