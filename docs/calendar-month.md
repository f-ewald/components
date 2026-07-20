# `<calendar-month>`

One month rendered as a top-to-bottom list of days — weekends and today
highlighted, with declarative `calendar-entry` children shown as colored
bars spanning the days they cover. Overlapping entries stack into
side-by-side lanes rather than being layered/hidden. Read-only.

Lanes are computed independently per instance, from only the entries
overlapping this month — an entry spanning a month boundary may therefore
land in a different lane index in the adjacent month's `calendar-month`.
This is an accepted v1 limitation: cross-month lane continuity would
require a shared parent (`calendar-year`) to assign lanes globally.

A standalone `calendar-month` (used outside `calendar-year`) also won't
re-render if a consumer mutates one of its hand-authored `calendar-entry`
children's attributes in place after the initial render — only slot
insertion/removal is observed. `calendar-year` avoids this by always
replacing (never mutating) the synthetic entries it projects down.

## Install

```js
import "@f-ewald/components/calendar-month.js";
```

## Usage

```html
<calendar-month year="2026" month="7">
  <calendar-entry start="2026-07-10" end="2026-07-18" label="Vacation" color="success"></calendar-entry>
  <calendar-entry start="2026-07-15" end="2026-07-20" label="Conference" color="warning" href="#conf"></calendar-entry>
</calendar-month>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `year` | `year` | `number` | `—` | Calendar year, e.g. `2026`. |
| `month` | `month` | `number` | `1` | Calendar month, 1-12 (January = 1). |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `calendar-entry` elements to render for this month. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
