import { useCallback, useEffect, useRef } from "react";
import { MUSIC_STEP_SECONDS, playEffect, playMusicStep, type Sound } from "./audio";

export function useAudio(enabled: boolean) {
  const audio = useRef<AudioContext | null>(null);
  const playSound = useCallback((sound: Sound) => {
    const context = audio.current;
    if (!context || document.hidden) return;
    void context.resume().then(() => {
      if (audio.current === context && context.state === "running" && !document.hidden) playEffect(context, sound);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled || !window.AudioContext) return;
    const context = new AudioContext();
    audio.current = context;
    let step = 0;
    let nextNoteAt = context.currentTime + 0.05;
    const music = () => {
      if (context.state !== "running" || document.hidden) return;
      // Skip missed time after a busy frame instead of playing a burst of notes.
      nextNoteAt = Math.max(nextNoteAt, context.currentTime);
      while (nextNoteAt < context.currentTime + 0.2) {
        playMusicStep(context, step++, nextNoteAt);
        nextNoteAt += MUSIC_STEP_SECONDS;
      }
    };
    const resume = () => {
      if (!document.hidden) void context.resume().then(music).catch(() => {});
    };
    const visibility = () => {
      if (document.hidden) void context.suspend().catch(() => {});
      else resume();
    };
    const click = (event: MouseEvent) => {
      const control = event.target instanceof Element ? event.target.closest('button, input[type="radio"]') : null;
      // Gameplay controls supply their own pickup, drop, hint, or success sound.
      if (control && !control.matches(':disabled, [data-sound]')) playSound("click");
    };
    const loop = window.setInterval(music, 100);
    window.addEventListener("pointerdown", resume, true);
    window.addEventListener("keydown", resume, true);
    document.addEventListener("click", click, true);
    document.addEventListener("visibilitychange", visibility);
    // Enabling sound via the toggle is already a user gesture.
    if (navigator.userActivation?.hasBeenActive) resume();
    return () => {
      window.clearInterval(loop);
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("keydown", resume, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("visibilitychange", visibility);
      audio.current = null;
      void context.close().catch(() => {});
    };
  }, [enabled, playSound]);

  return playSound;
}
