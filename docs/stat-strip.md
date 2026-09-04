# `<stat-strip>`

A headless, presentational strip of headline stats — one large figure plus
one muted caption per `items` entry, wrapping across lines on narrow
viewports. Unlike `stat-meter`, this component does not compute percentages
or render a fill bar: callers pass preformatted figure strings as-is and
`stat-strip` only lays them out for marketing, benchmark, or dashboard
summary rows.

## Install

```js
import "@f-ewald/components/stat-strip.js";
```

## Usage

```html
<stat-strip></stat-strip>
<script type="module">
  document.querySelector("stat-strip").items = [
    { value: "54%", label: "less code" },
    { value: "22%", label: "fewer tokens" },
    { value: "100%", label: "safety kept" },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | `items` | `StatStripItem[]` | `[]` | Stats rendered in display order; each item is shown as a large figure with a caption beneath it. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-bold` |
| `--ui-font-weight-medium` |
| `--ui-label-transform` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
