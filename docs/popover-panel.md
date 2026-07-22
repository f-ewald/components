# `<popover-panel>`

Generic anchored popover shell: a floating card positioned relative to its
nearest `position: relative` ancestor (place it next to its trigger button
inside such a wrapper), as opposed to `slide-panel`'s fixed screen-edge
drawer. Closes on outside click or Escape. Header chrome and close button
match `slide-panel`'s API (`heading`, `panel-close`) so either can be
swapped in for the other with no consumer-side changes beyond the wrapper.

Set `centered` to render as a screen-centered modal with a translucent
backdrop instead of the default anchored placement.

## Install

```js
import "@f-ewald/components/popover-panel.js";
```

## Usage

```html
<div style="position: relative; display: inline-block;">
  <button id="new-task-btn">New task</button>
  <popover-panel heading="New task">
    Popover body content goes here.
  </popover-panel>
</div>
<script type="module">
  const popover = document.querySelector("popover-panel");
  document.querySelector("#new-task-btn").addEventListener("click", () => (popover.open = true));
  popover.addEventListener("panel-close", () => (popover.open = false));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the popover is currently visible. |
| `heading` | `heading` | `string` | `""` | Title text shown in the popover header. |
| `centered` | `centered` | `boolean` | `false` | Render as a screen-centered modal with a backdrop instead of anchored placement. |

## Events

| Event | Description |
| --- | --- |
| `panel-close` | User clicked the close (✕) button, pressed Escape, or clicked outside/the backdrop. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Popover body content. |
| `title` | Overrides the plain `heading` text with custom markup. |
| `actions` | Extra header controls (e.g. an icon+label link) rendered between the title and the close button. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-overlay` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
