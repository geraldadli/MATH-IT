import { useCallback, useEffect, useRef } from "react";

type Sound = "drag" | "drop" | "correct" | "hint";

function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume = 0.025,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function useAudio(enabled: boolean) {
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || !window.AudioContext) return;
    const context = new AudioContext();
    audio.current = context;
    const resume = () => {
      void context.resume().catch(() => {});
    };
    const melody = () => {
      if (context.state !== "running" || document.hidden) return;
      [261.63, 329.63, 392, 329.63].forEach((note, index) => {
        tone(context, note, context.currentTime + index * 0.7, 0.8, 0.009);
      });
    };
    resume();
    melody();
    const loop = window.setInterval(melody, 3200);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => {
      window.clearInterval(loop);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      audio.current = null;
      void context.close().catch(() => {});
    };
  }, [enabled]);

  return useCallback((sound: Sound) => {
    const context = audio.current;
    if (!context) return;
    void context.resume().catch(() => {});
    const notes: Record<Sound, number[]> = {
      drag: [440],
      drop: [330, 440],
      correct: [523.25, 659.25, 783.99],
      hint: [392, 523.25],
    };
    notes[sound].forEach((note, index) =>
      tone(context, note, context.currentTime + index * 0.11, 0.2),
    );
  }, []);
}
