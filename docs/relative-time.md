# `<relative-time>`

Inline relative-time display (e.g. "3 hours ago"). Accepts either a
standard ISO 8601 string or a SQLite `datetime('now')` string
("YYYY-MM-DD HH:MM:SS", UTC, no zone marker) via `datetime`. Shows the
full date/time in the viewer's local timezone as a hover tooltip, and
re-renders on an interval so the text stays current while visible.

## Install

```js
import "@f-ewald/components/relative-time.js";
```

## Usage

```html
<relative-time datetime="2026-07-17T07:00:00Z"></relative-time>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `datetime` | `datetime` | `string | null` | `null` | Timestamp to render, relative to now. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
