# `<ui-tooltip>`

Hover and focus tooltip for its default-slot trigger. The `content` slot
holds the tooltip body — plain text or rich markup such as a list. It
appears after `show-delay` on hover and at once on keyboard focus, stays
open while the pointer is over the tooltip itself, and closes on Escape,
blur, or when the pointer leaves. It renders in the top layer, so
scrolling or `overflow: hidden` ancestors never clip it.

The trigger is described by the content (`aria-describedby`). A trigger
with nothing focusable inside (e.g. plain text) makes the tooltip host
focusable so keyboard users can reach the description too. ARIA references
can't cross shadow roots, so when the trigger is a custom element whose
focusable control lives in its own shadow root, screen readers won't
announce the description on focus; prefer a native trigger such as
`<button>` when that matters.

## Install

```js
import "@f-ewald/components/ui-tooltip.js";
```

## Usage

```html
<ui-tooltip>
  <button type="button">Copy link</button>
  <span slot="content">Copies a shareable link to this view</span>
</ui-tooltip>
<!-- Plain-text trigger: the tooltip becomes focusable; rich content is fine -->
<ui-tooltip placement="bottom" show-delay="0">
  <span>Partial snapshot</span>
  <div slot="content">3 work items pending: <ul><li>mp:lap-service</li></ul></div>
</ui-tooltip>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `placement` | `placement` | `UiTooltipPlacement` | `"top"` | Preferred side of the trigger; flips to the other side when this one lacks room. |
| `showDelay` | `show-delay` | `number` | `300` | Hover delay in milliseconds before the tooltip appears; keyboard focus shows it at once. |
| `disabled` | `disabled` | `boolean` | `false` | Suppresses the tooltip and closes it if open. |
| `open` | _(JS property only)_ | `boolean` | `—` | Whether the tooltip is currently showing. _(read-only)_ |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | The trigger the tooltip describes. |
| `content` | The tooltip body: plain text or rich markup such as a list. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-regular` |
| `--ui-line-height-tight` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-tooltip` |
| `--ui-tooltip-text` |
