# `<distance-value>`

Inline distance display. Renders miles/feet or km/m, switching units at
sensible thresholds (< 0.25 mi → ft; < 0.5 km → m).

Supply exactly one of `miles` or `km`; the other stays null.
km support is present but reserved for future use.

## Install

```js
import "@f-ewald/components/distance-value.js";
```

## Usage

```html
<distance-value miles="5"></distance-value>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `miles` | `miles` | `number | null` | `null` | Distance in miles (imperial). Switches to feet below 0.25 mi. |
| `km` | `km` | `number | null` | `null` | Distance in kilometers (metric, future). Switches to meters below 0.5 km. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
