# `<fan-table>`

Tabular companion to `fan-chart`: the same `series`, `percentiles`, `goal`,
and `events`, shown as one row per date and one column per series. Rows are
grouped into observed and projected sections around the "today" date
(`now`, defaulting to the latest observed date). Observed cells show the
value; projected cells show the median, the outer percentile range (e.g.
P10–P90) beneath it, and — when the projection provides `goalProbability`
and a `goal` is set — the share of runs reaching the goal. Events are named
under the date of the row they fall in.

`interval` picks the rows: the last date of each year (default) or month, or
every date. Values use whole `currency` units in `locale` (en-US, USD), or
compact ones with `compact`; `valueFormat` overrides both. Pair it with a
chart by forwarding `fan-chart`'s `series-visibility-change` detail to
`visible`.

With `x-type="linear"` or `"log"`, `date` fields are numbers (as in
`fan-chart`): every point becomes a row, labelled by `xFormat` or a compact
number. `xFormat` also replaces the date labels on a time axis.

The header and date column stay pinned while the table scrolls; cap its
height with `--fan-table-max-height` (default none).

## Install

```js
import "@f-ewald/components/fan-table.js";
```

## Usage

```html
<fan-table caption="Savings forecast" interval="year"></fan-table>
<script type="module">
  const table = document.querySelector("fan-table");
  table.goal = { value: 250000, label: "Goal" };
  table.events = [{ date: "2032-06-01", label: "Retirement" }];
  // Same series format as fan-chart; values align with percentiles (default 10, 25, 50, 75, 90).
  table.series = [
    {
      id: "brokerage",
      label: "Brokerage",
      actual: [{ date: "2025-01-01", value: 52000 }],
      projection: [
        { date: "2030-01-01", values: [70000, 90000, 110000, 135000, 170000], goalProbability: 0.05 },
        { date: "2035-01-01", values: [95000, 140000, 190000, 250000, 340000], goalProbability: 0.48 },
      ],
    },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `series` | _(JS property only)_ | `FanChartSeries[]` | `[]` | Series to show, in `fan-chart`'s format. Assign a new array (or bind `.series` from Lit state) to redraw. |
| `percentiles` | _(JS property only)_ | `number[]` | `[10, 25, 50, 75, 90]` | Percentiles (0–100) that each projection point's `values` are aligned to; the outermost pair is shown. |
| `goal` | _(JS property only)_ | `FanChartGoal | null` | `null` | Optional goal; projected cells show the share of runs reaching it when the data provides `goalProbability`. |
| `events` | _(JS property only)_ | `FanChartEvent[]` | `[]` | Optional labelled dates, named under the row they fall in. |
| `visible` | _(JS property only)_ | `string[] | null` | `null` | IDs of the series to show as columns; `null` (default) shows all. |
| `now` | `now` | `FanX | null` | `null` | Point splitting observed from projected rows (an ISO date, or a number on a numeric axis). Defaults to the latest observed point. |
| `xType` | `x-type` | `FanXType` | `"time"` | How `date` fields are read: dates (default), or numbers for `"linear"`/`"log"` (as in `fan-chart`). |
| `xFormat` | _(JS property only)_ | `((x: number) => string) | null` | `null` | Formats row labels; gets epoch milliseconds on a time axis. Defaults to `locale` dates (or compact numbers). |
| `interval` | `interval` | `FanTableInterval` | `"year"` | Rows: the last date of each year (default) or month, or every date. Numeric axes always show every point. |
| `locale` | `locale` | `string` | `"en-US"` | BCP 47 locale for numbers and dates. |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency code for the default value format. |
| `compact` | `compact` | `boolean` | `false` | Compact values (`$1.2M`) instead of whole units (`$1,234,567`). |
| `valueFormat` | _(JS property only)_ | `((value: number) => string) | null` | `null` | Formats values. Defaults to `currency` in `locale`, whole or `compact`. |
| `caption` | `caption` | `string` | `""` | Visible table caption; when empty, a visually hidden "Forecast" caption names the table. |
| `dateLabel` | `date-label` | `string` | `"Date"` | Header of the date column. |
| `observedLabel` | `observed-label` | `string` | `"Observed"` | Heading of the observed row group. |
| `projectedLabel` | `projected-label` | `string` | `"Projected"` | Heading of the projected row group. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-label-transform` |
| `--ui-line-height-tight` |
| `--ui-radius` |
| `--ui-radius-circle` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
