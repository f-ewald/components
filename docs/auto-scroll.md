# `<auto-scroll>`

Wraps arbitrary slotted content (e.g. `timeline-container`) and keeps it
scrolled to the bottom as new children are appended — but only while the
user is already scrolled near the bottom ("stick to bottom", a chat/log-
viewer convention). If the user has scrolled up to read earlier content,
new content does not yank the scroll position back down.

New content is detected via a `MutationObserver`, so no cooperation from
whatever is slotted in is required. The host itself is the scrollable
region (`overflow-y: auto`) and needs a consumer-supplied bounded height to
have anything to scroll, e.g. `auto-scroll { height: 24rem; }`.

## Install

```js
import "@f-ewald/components/auto-scroll.js";
```

## Usage

```html
<auto-scroll style="height: 24rem">
  <timeline-container>
    <timeline-entry datetime="2026-07-23T09:00:00Z">
      <span slot="headline">Deployment started</span>
      Release v1.4.0 is rolling out.
    </timeline-entry>
  </timeline-container>
</auto-scroll>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `threshold` | `threshold` | `number` | `24` | Pixels of tolerance from the bottom edge counted as "still at the bottom". |
| `pinned` | _(JS property only)_ | `boolean` | `—` | Whether the view is currently stuck to the bottom. Read-only; see `scrollToBottom()`. _(read-only)_ |

## Events

| Event | Description |
| --- | --- |
| `pinned-change` | The stick-to-bottom state toggled; detail: `{ pinned }`. |

## Slots

_None._

## CSS custom properties

_None._
