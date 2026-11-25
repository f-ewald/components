import { quantileSorted } from "d3-array";
import type { FanX } from "./fan-data.js";

/** One projected point in a `fan-chart` series: values aligned index-for-index with the chart's `percentiles`. */
export interface FanChartProjectionPoint {
  /** X position: a date by default, or a number on a numeric axis (see `FanX`). */
  date: FanX;
  /** Value at each of the chart's `percentiles`, in the same order. */
  values: number[];
  /** Share of simulated runs (0–1) at or above the chart's `goal` on this date; shown in the tooltip. */
  goalProbability?: number;
}

/** Options for {@link summarizePaths}. */
export interface SummarizePathsOptions {
  /** Goal value; when set, each point gets the share of runs at or above it as `goalProbability`. */
  goal?: number;
}

function assertAligned(paths: number[][], length: number): void {
  for (const path of paths) {
    if (path.length !== length) throw new RangeError(`Every path needs ${length} values, got ${path.length}.`);
  }
}

/**
 * Summarizes raw simulation paths into `fan-chart` projection points.
 *
 * @param dates - One x position per step: dates, or numbers for a numeric axis.
 * @param paths - Simulated runs; each is one value per date, so `paths[run][step]`.
 * @param percentiles - Percentiles (0–100) to compute at every step.
 * @param options - `goal` adds each step's share of runs at or above it.
 * @returns One projection point per date, with `values` aligned to `percentiles`.
 * @throws RangeError when a path's length differs from `dates.length`.
 */
export function summarizePaths(
  dates: FanX[],
  paths: number[][],
  percentiles: number[] = [10, 25, 50, 75, 90],
  options: SummarizePathsOptions = {},
): FanChartProjectionPoint[] {
  assertAligned(paths, dates.length);
  const { goal } = options;
  return dates.map((date, step) => {
    const column = paths.map((path) => path[step]).sort((a, b) => a - b);
    const point: FanChartProjectionPoint = {
      date,
      values: percentiles.map((p) => quantileSorted(column, p / 100) ?? Number.NaN),
    };
    if (goal !== undefined && column.length > 0) {
      point.goalProbability = column.filter((v) => v >= goal).length / column.length;
    }
    return point;
  });
}

/**
 * Picks representative runs to draw as a series' `samples`: the runs whose
 * final values sit at evenly spaced ranks (e.g. 10th, 30th, 50th, 70th, and
 * 90th percentile for five).
 *
 * @param paths - Simulated runs, `paths[run][step]`.
 * @param count - Number of runs to pick.
 * @returns Up to `count` of the given runs, ordered from lowest to highest final value.
 */
export function samplePaths(paths: number[][], count = 5): number[][] {
  if (paths.length === 0 || count <= 0) return [];
  const ranked = [...paths].sort((a, b) => (a[a.length - 1] ?? 0) - (b[b.length - 1] ?? 0));
  const picks = Math.min(count, ranked.length);
  return Array.from({ length: picks }, (_, i) => ranked[Math.floor(((i + 0.5) / picks) * ranked.length)]);
}

/**
 * Adds simulated runs of several accounts run-by-run, giving the runs of
 * their total. Percentiles do not add — the 10th percentile of a total is not
 * the sum of each account's 10th percentile — so summarize a total series from
 * these summed runs rather than by adding summarized values.
 *
 * @param pathSets - One `paths[run][step]` array per account, from the same simulated scenarios.
 * @returns The per-run, per-step sums.
 * @throws RangeError when the sets differ in run count or path length.
 */
export function sumPaths(...pathSets: number[][][]): number[][] {
  const [first, ...rest] = pathSets;
  if (!first) return [];
  const steps = first[0]?.length ?? 0;
  for (const set of pathSets) {
    if (set.length !== first.length) {
      throw new RangeError(`Every set needs ${first.length} runs, got ${set.length}.`);
    }
    assertAligned(set, steps);
  }
  return first.map((path, run) => path.map((value, step) => rest.reduce((sum, set) => sum + set[run][step], value)));
}
