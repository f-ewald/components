# `<countdown-timer>`

Per-second ticking count-down timer, e.g. a live "Retrying in 3 seconds"
indicator while waiting to retry a failed request. Renders nothing while
`until` is unset or unparseable. Remaining time is clamped to zero — it
never goes negative once the target instant has passed.

## Install

```js
import "@f-ewald/components/countdown-timer.js";
```

## Usage

```html
<countdown-timer until="2026-07-19T12:00:10Z" prefix="Retrying in "></countdown-timer>
<countdown-timer until="2026-07-19T12:00:10Z" format="compact" prefix="retrying in "></countdown-timer>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `until` | `until` | `string | null` | `null` | ISO-8601 target instant; remaining time is measured until here. |
| `format` | `format` | `DurationFormat` | `"seconds"` | `"seconds"` -> "1 second", "12 seconds"; `"compact"` -> "12s", "3m 12s", "1h 03m 12s". |
| `prefix` | `prefix` | `string` | `""` | Text rendered before the formatted value. |
| `suffix` | `suffix` | `string` | `""` | Text rendered after the formatted value. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
