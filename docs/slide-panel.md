# `<slide-panel>`

Generic sliding panel shell. Handles positioning, open/close animation,
header chrome, and a close button. Body content is provided via the
default slot; the consumer controls its own padding and overflow.

Desktop: fixed right-side panel that slides from the right.
Mobile (≤48rem): bottom-sheet drawer (60vh) — reserved for future use.

## Install

```js
import "@f-ewald/components/slide-panel.js";
```

## Usage

```html
<slide-panel open heading="Property details">
  Panel body content goes here.
</slide-panel>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the panel is currently visible. |
| `heading` | `heading` | `string` | `""` | Title text shown in the panel header (overridable via slot="title"). |

## Events

| Event | Description |
| --- | --- |
| `panel-close` | User clicked the close (✕) button. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Panel body content. |
| `title` | Overrides the header title text (falls back to the `heading` property). |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
