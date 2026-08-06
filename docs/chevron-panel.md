# `<chevron-panel>`

A generic disclosure: a clickable header that expands/collapses a body,
with a chevron that rotates to reflect state. Headline and body are both
slotted, so any markup can go in either — unlike `chat-message`'s
built-in collapsible mode, which only slots the body and builds its
header from discrete properties (author/timestamp/summary).

## Install

```js
import "@f-ewald/components/chevron-panel.js";
```

## Usage

```html
<chevron-panel>
  <strong slot="headline">Why these scores?</strong>
  <p>Each category blends several weighted inputs.</p>
</chevron-panel>
<script type="module">
  document.querySelector("chevron-panel").addEventListener("toggle", (e) => {
    console.log(e.detail.open);
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the body is currently expanded. |

## Events

| Event | Description |
| --- | --- |
| `toggle` | Fired with `{ open: boolean }` when the header is clicked. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Body content, shown only while `open`. |
| `headline` | Header content, always visible, clickable to toggle. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-radius-sm` |
| `--ui-text` |
| `--ui-text-muted` |
