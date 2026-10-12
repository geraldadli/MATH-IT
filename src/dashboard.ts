import type { DashboardSettings, DashboardSpec, DashboardTool, Localized } from "./types.ts";

export interface DashboardRow {
  key: string;
  label: Localized;
  value: number;
}

export type AnswerState = "missing" | "wrong" | "right";

export interface DashboardReview {
  // Tools whose setting does not fit the question. Only the tool is named, never its answer.
  tools: DashboardTool[];
  answer: AnswerState;
}

// The filter always narrows the dimension the bars are not showing.
export function filterDimension(groupBy: 0 | 1): 0 | 1 {
  return groupBy === 0 ? 1 : 0;
}

export function dashboardRows(spec: DashboardSpec, settings: DashboardSettings): DashboardRow[] {
  const bars = spec.dimensions[settings.groupBy];
  const other = spec.dimensions[filterDimension(settings.groupBy)];
  const rows = bars.categories.map((category, index) => ({
    key: category.key,
    label: category.label,
    value: other.categories.reduce((sum, otherCategory, otherIndex) => {
      if (settings.filter !== "all" && settings.filter !== otherCategory.key) return sum;
      return sum + (settings.groupBy === 0 ? spec.values[index][otherIndex] : spec.values[otherIndex][index]);
    }, 0),
  }));
  if (settings.sort === "none") return rows;
  // Sorting is stable, so equal bars keep their natural order.
  return [...rows].sort((a, b) => (settings.sort === "desc" ? b.value - a.value : a.value - b.value));
}

export function pickRow(rows: DashboardRow[], pick: "most" | "fewest"): DashboardRow {
  return rows.reduce((best, row) => ((pick === "most" ? row.value > best.value : row.value < best.value) ? row : best));
}

export function dashboardAnswer(spec: DashboardSpec): string {
  const { groupBy, filter, pick } = spec.goal;
  return pickRow(dashboardRows(spec, { ...spec.start, groupBy, filter, sort: "none" }), pick).key;
}

export function reviewDashboard(spec: DashboardSpec, settings: DashboardSettings, answer: string | null): DashboardReview {
  const tools: DashboardTool[] = [];
  const barsRight = settings.groupBy === spec.goal.groupBy;
  if (!barsRight) tools.push("groupBy");
  // A filter belongs to the other dimension, so it can only be judged once the bars are right.
  else if (settings.filter !== spec.goal.filter) tools.push("filter");
  if (spec.goal.sort && settings.sort !== spec.goal.sort) tools.push("sort");
  return {
    tools,
    answer: answer === null ? "missing" : barsRight && answer === dashboardAnswer(spec) ? "right" : "wrong",
  };
}

export function isDashboardSolved(spec: DashboardSpec, settings: DashboardSettings, answer: string | null): boolean {
  const review = reviewDashboard(spec, settings, answer);
  return review.tools.length === 0 && review.answer === "right";
}

// A scale of at most six steps that ends on a gridline at or above the largest value.
export function niceScale(largest: number): { max: number; step: number } {
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((candidate) => Math.ceil(largest / candidate) <= 6) ?? 100;
  return { max: Math.max(step, Math.ceil(largest / step) * step), step };
}
