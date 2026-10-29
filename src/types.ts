export type Language = "en" | "id";
export type CaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27;
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
  unitVideos: Partial<Record<UnitId, UnitVideoProgress>>;
}

export interface UnitVideoProgress {
  position: number;
  ranges: [number, number][];
  completed: boolean;
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

interface CaseBase {
  id: CaseId;
  title: Localized;
  skill: Localized;
  mission: Localized;
  hints: { text: Localized; visual: string }[];
  preview: string;
}

// Clue cases: drag or tap clues into three groups.
export interface BoardCase extends CaseBase {
  kind: "sharing" | "sorting";
  tokens: number[];
  tokenLabels?: Record<number, string>;
  tokenWords?: Record<number, Localized>;
  chart?: EvidenceChart;
  cardStyle?: "notebook";
  dropZones: [DropZone, DropZone, DropZone];
  copies?: Record<number, number>;
}

export type DashboardTool = "groupBy" | "filter" | "sort" | "view";
export type SortOrder = "none" | "desc" | "asc";

export interface DashboardDimension {
  label: Localized;
  // Short names for the bars, in the data's natural order.
  categories: { key: string; label: Localized }[];
}

export interface DashboardSettings {
  // Which dimension the bars stand for; the filter narrows the other one.
  groupBy: 0 | 1;
  filter: string;
  sort: SortOrder;
  view: "chart" | "table";
}

export interface DashboardSpec {
  title: Localized;
  measure: Localized;
  dimensions: [DashboardDimension, DashboardDimension];
  // values[i][j] belongs to category i of dimension 0 and category j of dimension 1.
  values: number[][];
  tools: DashboardTool[];
  start: DashboardSettings;
  // The view that answers the question, and whether the answer is its tallest or shortest bar.
  goal: { groupBy: 0 | 1; filter: string; sort?: SortOrder; pick: "most" | "fewest" };
}

// Dashboard cases: set up the tools, then tap the bar that answers the question.
export interface DashboardCase extends CaseBase {
  kind: "dashboard";
  dashboard: DashboardSpec;
}

export type CaseLevel = BoardCase | DashboardCase;

export type BoardState = Record<ZoneId, number[]>;
