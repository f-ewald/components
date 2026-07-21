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
>
  <span slot="title">Vacation</span>
  <span slot="detail">Out of office</span>
  <span slot="detail">Road trip along the California coast with several scenic stops</span>
  <span slot="footer">Return July 19 at 6 PM</span>
</calendar-entry>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `start` | `start` | `string` | `""` | Inclusive start date, `"YYYY-MM-DD"`. |
| `end` | `end` | `string` | `""` | Inclusive end date, `"YYYY-MM-DD"`. Falls back to `start` when unset (single-day entry). |
| `label` | `label` | `string` | `""` | Fallback title used when no `title` slot is provided. |
| `color` | `color` | `StatusPillColor` | `"neutral"` | Color variant, reusing `status-pill`'s palette. |
| `href` | `href` | `string | undefined` | `—` | Optional link target; the parent renders the entry as an `<a>` when set. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `title` | Plain-text title shown instead of the `label` fallback. |
| `detail` | Repeatable plain-text details rendered inside the shared body spanning all remaining days. |
| `footer` | Plain-text ending note pinned to the bottom of the shared body. |

## CSS custom properties

_None._
