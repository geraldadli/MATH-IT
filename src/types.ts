export type Language = "en" | "id";
export type CaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;
export type Localized = Record<Language, string>;
export type UnitId = 1 | 2 | 3 | 4;
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
  completedCases: CaseId[];
  xp: number;
  soundEnabled: boolean;
}

export type DropZoneCondition =
  | { kind: "count"; count: number }
  | { kind: "multiple"; divisor: number }
  | { kind: "neither"; divisors: number[] }
  | { kind: "values"; values: number[] };

export interface DropZone {
  id: DropZoneId;
  label: Localized;
  condition: DropZoneCondition;
}

export interface CaseUnit {
  id: UnitId;
  title: Localized;
  cases: CaseId[];
}

interface ChartData {
  title: Localized;
  axis: Localized;
  categories: Localized[];
  values: number[];
}

export type EvidenceChart =
  | ChartData & { kind: "bar" | "line"; max: number; labelStep: number }
  | ChartData & { kind: "pictograph"; icon: "person" | "book"; iconValue: number }
  | ChartData & { kind: "pie" };

export interface CaseLevel {
  id: CaseId;
  kind: "sharing" | "sorting";
  title: Localized;
  skill: Localized;
  mission: Localized;
  tokens: number[];
  tokenLabels?: Record<number, string>;
  tokenWords?: Record<number, Localized>;
  chart?: EvidenceChart;
  cardStyle?: "notebook";
  dropZones: [DropZone, DropZone, DropZone];
  copies?: Record<number, number>;
  hints: { text: Localized; visual: string }[];
  preview: string;
}

export type BoardState = Record<ZoneId, number[]>;
