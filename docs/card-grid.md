# `<card-grid>`

A responsive auto-filling grid shell for `link-card` (or any card-shaped
content) — each slotted child becomes a grid item, wrapping to a new row
once the container is too narrow for another `15rem` column.

## Install

```js
import "@f-ewald/components/card-grid.js";
```

## Usage

```html
<card-grid>
  <link-card
    heading="Grafana"
    description="Metrics dashboards."
    href="https://grafana.example.com"
    logo="/logos/grafana.svg"
    status="up"
  ></link-card>
  <link-card heading="Plex" description="Media server." href="https://plex.example.com" status="up"></link-card>
</card-grid>
```

## Attributes / properties

_None._

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | `link-card` elements (or other card-shaped content). |

## CSS custom properties

_None._
