export type Language = "en" | "id";
export type CaseId = 1 | 2;
export type DropZoneId = "a" | "b" | "c";
export type ZoneId = "tray" | DropZoneId;

export interface AvatarConfig {
  animal: "fox" | "cat" | "bear";
  color: "teal" | "yellow" | "coral";
}

export interface UserState {
  name: string;
  avatar: AvatarConfig;
  language: Language;
  completedCases: number[];
  score: number;
  soundEnabled: boolean;
}

export type DropZoneCondition =
  | { kind: "count"; count: number }
  | { kind: "multiple"; divisor: number }
  | { kind: "neither"; divisors: number[] };

export interface DropZone {
  id: DropZoneId;
  condition: DropZoneCondition;
}

export interface CaseLevel {
  id: CaseId;
  tokens: number[];
  dropZones: [DropZone, DropZone, DropZone];
}

export type BoardState = Record<ZoneId, number[]>;
