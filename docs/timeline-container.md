# `<timeline-container>`

Vertical timeline: a single connecting line runs down the left edge and each
slotted `timeline-entry` places a dot on it. This is a thin layout and
semantics wrapper — the entries draw the line segments and dots themselves,
so the container adds no gap between them (a gap would break the line).
Exposed to assistive technology as a list of events.

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
  <timeline-entry datetime="2026-07-23T08:45:00Z">
    <span slot="headline">Review approved</span>
    <status-pill label="In Review" color="info"></status-pill>
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:30:00Z">
    <!-- chat-message's own timestamp is left unset: timeline-entry already shows one -->
    <chat-message role="user" author="Freddy">Ship it.</chat-message>
  </timeline-entry>
</timeline-container>
```

## Attributes / properties

_None._

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
