# `<calendar-entry>`

Declarative metadata for one calendar event, consumed by a parent
`calendar-month` or `calendar-year`. Read-only/non-interactive; renders
nothing itself.

## Install

```js
import "@f-ewald/components/calendar-entry.js";
```

## Usage

```html
<calendar-entry
  start="2026-07-10"
  end="2026-07-18"
  label="Vacation"
  color="success"
></calendar-entry>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `start` | `start` | `string` | `""` | Inclusive start date, `"YYYY-MM-DD"`. |
| `end` | `end` | `string` | `""` | Inclusive end date, `"YYYY-MM-DD"`. Falls back to `start` when unset (single-day entry). |
| `label` | `label` | `string` | `""` | Text shown on the entry's first visible day within a given month. |
| `color` | `color` | `StatusPillColor` | `"neutral"` | Color variant, reusing `status-pill`'s palette. |
| `href` | `href` | `string | undefined` | `—` | Optional link target; the parent renders the entry as an `<a>` when set. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Reserved for future use; no slotted content is required today. |

## CSS custom properties

_None._
