import type { UnitId, UnitVideoProgress } from "./types.ts";

interface UnitVideo {
  src: string;
  poster: string;
  duration: number;
  captions?: { src: string; label: string; language: string }[];
}

// Files are requested only by the currently open introduction player.
export const unitVideos: Record<UnitId, UnitVideo> = {
  1: { src: "/videos/unit-1-intro.mp4", poster: "/videos/unit-1-poster.jpg", duration: 120,
    captions: [{ src: "/videos/unit-1-en.vtt", label: "English", language: "en" }] },
  2: { src: "/videos/unit-2-intro.mp4", poster: "/videos/unit-2-poster.jpg", duration: 120,
    captions: [{ src: "/videos/unit-2-en.vtt", label: "English", language: "en" }] },
  3: { src: "/videos/unit-3-intro.mp4", poster: "/videos/unit-3-poster.jpg", duration: 120,
    captions: [{ src: "/videos/unit-3-en.vtt", label: "English", language: "en" }] },
  4: { src: "/videos/unit-4-intro.mp4", poster: "/videos/unit-4-poster.jpg", duration: 120,
    captions: [{ src: "/videos/unit-4-en.vtt", label: "English", language: "en" }] },
};

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp = (value: number, duration: number) => Math.max(0, Math.min(value, duration));

function mergeRanges(value: unknown, duration: number): [number, number][] {
  if (!Array.isArray(value)) return [];
  const ranges: [number, number][] = value.flatMap((range) =>
    Array.isArray(range) && finite(range[0]) && finite(range[1]) && range[1] > range[0]
      ? [[clamp(range[0], duration), clamp(range[1], duration)] as [number, number]] : [],
  ).filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged.at(-1);
    // Only join adjacent samples; watching the end must never fill a skipped section.
    if (last && start <= last[1] + 0.05) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

function hasFullCoverage(ranges: [number, number][], duration: number): boolean {
  // Allow only the fractional frames around play/ended, never whole skipped seconds.
  return duration > 0 && ranges.length === 1 && ranges[0][0] <= 0.25 &&
    ranges[0][1] >= duration - 0.05 && ranges[0][1] - ranges[0][0] >= duration - 0.3;
}

export function normaliseVideoProgress(value: unknown, duration: number): UnitVideoProgress {
  const data = value && typeof value === "object" ? value as Partial<UnitVideoProgress> : {};
  const ranges = mergeRanges(data.ranges, duration);
  return {
    position: finite(data.position) ? clamp(data.position, duration) : 0,
    ranges,
    completed: data.completed === true || hasFullCoverage(ranges, duration),
  };
}

export function normaliseUnitVideos(value: unknown): Partial<Record<UnitId, UnitVideoProgress>> {
  if (!value || typeof value !== "object") return {};
  const data = value as Record<string, unknown>;
  return Object.fromEntries(([1, 2, 3, 4] as const).filter((id) => data[id] !== undefined)
    .map((id) => [id, normaliseVideoProgress(data[id], unitVideos[id].duration)]));
}

// A review, stale callback, or second tab cannot revoke already earned coverage.
export function mergeVideoProgress(current: UnitVideoProgress | undefined, incoming: UnitVideoProgress, duration: number): UnitVideoProgress {
  return normaliseVideoProgress({
    position: incoming.position,
    ranges: [...(current?.ranges ?? []), ...incoming.ranges],
    completed: current?.completed === true || incoming.completed,
  }, duration);
}

export function mergeUnitVideos(current: UserVideoRecords, saved: UserVideoRecords): UserVideoRecords {
  return Object.fromEntries(([1, 2, 3, 4] as const).filter((id) => current[id] || saved[id])
    .map((id) => [id, mergeVideoProgress(current[id], saved[id] ?? current[id]!, unitVideos[id].duration)]));
}

type UserVideoRecords = Partial<Record<UnitId, UnitVideoProgress>>;

export interface ViewingSample {
  position: number;
  now: number;
  playing: boolean;
  seeking: boolean;
  rate: number;
}

export interface ViewingSession {
  progress: UnitVideoProgress;
  duration: number;
  anchor: ViewingSample | null;
}

export function createViewingSession(progress: UnitVideoProgress | undefined, duration: number): ViewingSession {
  return { progress: normaliseVideoProgress(progress, duration), duration, anchor: null };
}

export function resetViewingAnchor(session: ViewingSession) {
  session.anchor = null;
}

export function recordViewingSample(session: ViewingSession, sample: ViewingSample): UnitVideoProgress {
  if (!finite(sample.position) || !finite(sample.now)) return session.progress;
  const position = clamp(sample.position, session.duration);
  const previous = session.anchor;
  let ranges = session.progress.ranges;
  if (previous && previous.playing && !previous.seeking && !sample.seeking) {
    const elapsed = (sample.now - previous.now) / 1000;
    const distance = position - previous.position;
    // Credit forward playback backed by elapsed real time. Seek events reset the
    // anchor; this second check also rejects jumps if an event was missed.
    if (elapsed > 0 && elapsed <= 3 && distance > 0 && previous.rate === sample.rate &&
      sample.rate > 0 && sample.rate <= 4 && distance <= elapsed * sample.rate + 0.15) {
      ranges = mergeRanges([...ranges, [previous.position, position]], session.duration);
    }
  }
  session.anchor = { ...sample, position };
  session.progress = { position, ranges, completed: session.progress.completed || hasFullCoverage(ranges, session.duration) };
  return session.progress;
}

export function watchedSeconds(progress: UnitVideoProgress): number {
  return progress.ranges.reduce((sum, [start, end]) => sum + end - start, 0);
}

export function nextUnwatchedPosition(progress: UnitVideoProgress, duration: number): number {
  let position = 0;
  for (const [start, end] of progress.ranges) {
    if (start > position + 0.05) return Math.max(0, position - 0.25);
    position = Math.max(position, end);
  }
  return Math.max(0, Math.min(position - 0.25, duration - 0.5));
}

export function formatVideoTime(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
