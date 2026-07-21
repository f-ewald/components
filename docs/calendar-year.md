# `<calendar-year>`

A full year of `calendar-month` blocks, generated from declarative
`calendar-entry` children. Each entry is re-projected into the
`calendar-month` blocks it overlaps as a freshly-created `calendar-entry`
element — the original elements stay slotted here and are never moved,
since a DOM node can only have one parent. Read-only.

## Install

```js
import "@f-ewald/components/calendar-year.js";
```

## Usage

```html
<calendar-year year="2026">
  <calendar-entry start="2026-01-28" end="2026-02-03" label="Offsite" color="primary" href="#offsite">
    <span slot="detail">New York</span>
    <span slot="detail">Team workshops</span>
    <span slot="footer">Closing dinner Friday</span>
  </calendar-entry>
  <calendar-entry start="2026-03-05" end="2026-03-18" label="Product launch" color="success" href="#launch">
    <span slot="detail">Coordinate the release across engineering, design, support, and marketing.</span>
    <span slot="detail">Monitor adoption and production health throughout the rollout.</span>
    <span slot="footer">Public launch · March 18 at 9 AM</span>
  </calendar-entry>
  <calendar-entry start="2026-07-10" end="2026-07-18" label="Vacation" color="success"></calendar-entry>
</calendar-year>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `year` | `year` | `number` | `—` | Calendar year to render all 12 months for, e.g. `2026`. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `calendar-entry` elements spanning the displayed year, re-projected into each month. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
