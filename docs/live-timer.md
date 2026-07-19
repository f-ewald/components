# `<live-timer>`

Per-second ticking count-up timer, e.g. a live "running for 12s" or
"Sleeping for 3 seconds" indicator. Renders nothing while `since` is unset
or unparseable.

## Install

```js
import "@f-ewald/components/live-timer.js";
```

## Usage

```html
<live-timer since="2026-07-19T12:00:00Z" prefix="Sleeping for "></live-timer>
<live-timer since="2026-07-19T12:00:00Z" format="compact" prefix="running for "></live-timer>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `since` | `since` | `string | null` | `null` | ISO-8601 start instant; elapsed time is measured from here. |
| `format` | `format` | `DurationFormat` | `"seconds"` | `"seconds"` -> "1 second", "12 seconds"; `"compact"` -> "12s", "3m 12s", "1h 03m 12s". |
| `prefix` | `prefix` | `string` | `""` | Text rendered before the formatted value. |
| `suffix` | `suffix` | `string` | `""` | Text rendered after the formatted value. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
