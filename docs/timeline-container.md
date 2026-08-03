# `<timeline-container>`

Vertical timeline: a connecting line runs down the entries and each slotted
`timeline-entry` places a dot on it. This is a thin layout and semantics
wrapper — the entries draw the line segments and dots themselves, so the
container adds no gap between them (a gap would break the line). Exposed to
assistive technology as a list of events.

`layout` chooses where the line runs. `left` (the default) puts it down the
left edge with each entry's label inline beside its headline. `alternating`
centers it and gives each entry three columns — label, line, body — with the
two sides swapping on every second entry, for a presentation timeline rather
than an event log.

The layout is pushed onto each entry rather than read from here, because a
shadow-DOM child cannot style itself against an ancestor portably —
`:host-context()` is Chromium-only.

## Install

```js
import "@f-ewald/components/timeline-container.js";
```

## Usage

```html
<timeline-container>
  <timeline-entry datetime="2026-07-23T09:00:00Z">
    <span slot="headline">Deployment started</span>
    Release v1.4.0 is rolling out.
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:45:00Z" color="success">
    <span slot="headline">Review approved</span>
    <status-pill label="In Review" color="info"></status-pill>
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:30:00Z">
    <!-- chat-message's own timestamp is left unset: timeline-entry already shows one -->
    <chat-message role="user" author="Freddy">Ship it.</chat-message>
  </timeline-entry>
</timeline-container>

<!-- A presentation timeline: centered line, label and body swapping sides. -->
<timeline-container layout="alternating">
  <timeline-entry label="1987">
    <span slot="headline">Where it started</span>
    A first stop, with the label on the left.
  </timeline-entry>
  <timeline-entry label="2004">
    <span slot="headline">The question</span>
    The second entry mirrors the first.
  </timeline-entry>
</timeline-container>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `layout` | `layout` | `TimelineLayout` | `"left"` | Arrangement of the entries: a left-edge line, or a centered alternating one. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
