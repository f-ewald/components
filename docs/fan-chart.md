# `<fan-chart>`

Multi-series time-series fan chart: observed history as a solid line, and a
projection as percentile bands around a dashed median — e.g. Monte Carlo
savings forecasts. A "today" divider separates the past from the projection,
and each fan starts at its series' last observed value. Optional extras: a
`goal` line (the tooltip shows each projection's `goalProbability`), labelled
`events` markers, and per-series `samples` (individual runs as thin lines).

The legend shows each series' final value under its name and toggles
series: a click shows only that series (clicking it again shows all);
Ctrl/Cmd-click — or a long press on touch screens — adds or removes one.
The y axis rescales to the visible series. Hover, tap, or drag across the
plot — or focus it and use ←/→/Home/End — to inspect values; Escape (or a
tap outside) clears.

Values default to compact currency in `currency` and `locale` (USD, en-US);
dates follow `locale`. `valueFormat` overrides value formatting entirely.

Totals: percentiles do not add across series, so build a total series from
the run-by-run sum of the accounts' simulated paths (`sumPaths()`), not by
adding their percentiles.

Live data: `series` is a reactive property, so binding it from a parent Lit
template (`.series=${this.data}`) or assigning a new array redraws in place.
Updates must be immutable (a new array); after mutating in place, call
`refresh()`. Alternatively set `loader` to a function returning the series
(sync or async): it runs on connect, on `refresh()`, and every
`refresh-interval` seconds while the tab is visible. A newer load aborts the
older one, and a failed load keeps the last good data.

Series colors default to the theme's primary, warning, danger, info, and
success tokens, so the chart follows light/dark themes; some themes share
the last two with the first, so set `color` when showing more than three.

## Install

```js
import "@f-ewald/components/fan-chart.js";
```

## Usage

```html
<fan-chart locale="en-US" currency="USD"></fan-chart>
<script type="module">
  import { summarizePaths, samplePaths, sumPaths } from "@f-ewald/components";

  const chart = document.querySelector("fan-chart");
  chart.goal = { value: 250000, label: "Goal" };
  chart.events = [{ date: "2032-06-01", label: "Retirement" }];
  // projection values align with the chart's percentiles (default 10, 25, 50, 75, 90).
  // From raw simulation runs: summarizePaths(dates, runs, undefined, { goal: 250000 }),
  // samples: samplePaths(runs, 5); for a total, summarize sumPaths(runsA, runsB).
  chart.series = [
    {
      id: "brokerage",
      label: "Brokerage",
      actual: [
        { date: "2024-01-01", value: 40000 },
        { date: "2025-01-01", value: 52000 },
      ],
      projection: [
        { date: "2030-01-01", values: [70000, 90000, 110000, 135000, 170000] },
        { date: "2035-01-01", values: [95000, 140000, 190000, 250000, 340000] },
      ],
    },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `series` | _(JS property only)_ | `FanChartSeries[]` | `[]` | Series to draw. Assign a new array (or bind `.series` from Lit state) to redraw. |
| `percentiles` | _(JS property only)_ | `number[]` | `[10, 25, 50, 75, 90]` | Percentiles (0–100) that each projection point's `values` are aligned to. Paired outside-in into bands (first with last, …); an unpaired middle value is drawn as the median line. |
| `log` | `log` | `boolean` | `false` | Logarithmic y axis. Off by default; values ≤ 0 are drawn at the axis floor. |
| `visible` | _(JS property only)_ | `string[] | null` | `null` | IDs of the series to show; `null` (default) shows all. Updated by the legend. |
| `goal` | _(JS property only)_ | `FanChartGoal | null` | `null` | Optional horizontal goal line; always kept within the y axis. |
| `events` | _(JS property only)_ | `FanChartEvent[]` | `[]` | Optional labelled vertical markers, e.g. retirement. |
| `now` | `now` | `string | null` | `null` | Position of the "today" divider as an ISO date. Defaults to the latest observed date. |
| `nowLabel` | `now-label` | `string` | `"Today"` | Label drawn on the "today" divider. |
| `height` | `height` | `number` | `320` | Plot height in CSS pixels, excluding the legend. |
| `locale` | `locale` | `string` | `"en-US"` | BCP 47 locale for numbers and dates. |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency code for the default value format. |
| `valueFormat` | _(JS property only)_ | `((value: number) => string) | null` | `null` | Formats axis, legend, and tooltip values. Defaults to compact `currency` in `locale` (`$1.2M`). |
| `loader` | _(JS property only)_ | `FanChartLoader | null` | `null` | Optional data source; its result replaces `series`. See the class docs. |
| `refreshInterval` | `refresh-interval` | `number` | `0` | Re-run `loader` every N seconds while the tab is visible; 0 (default) disables polling. |

## Events

| Event | Description |
| --- | --- |
| `fan-chart-load` | `loader` resolved and the chart redrew. `detail: { series: FanChartSeries[] }`. |
| `fan-chart-error` | `loader` threw or rejected; the last good data stays drawn. `detail: { error: unknown }`. |
| `series-visibility-change` | Legend changed the visible series. `detail: { visible: string[] | null }` (null = all). |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-label-transform` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-radius-circle` |
| `--ui-radius-pill` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tooltip` |
| `--ui-tooltip-text` |
