# `<toast-notification>`

Fixed-position stack of dismissible notifications, anchored top-right
(top-full-width on mobile). Not wired to any app state yet — callers add
toasts imperatively via the `show()` method on a live element reference,
e.g. `document.querySelector('toast-notification')?.show('Offline', { variant: 'error' })`,
or via the `notifySuccess`/`notifyError`/`notifyInfo` module-level helpers
exported from this file. Each toast auto-dismisses after `duration` ms and
can also be dismissed via its ✕ button. Appears/disappears instantly — no
slide/fade transitions.

## Install

```js
import "@f-ewald/components/toast-notification.js";
```

## Usage

```html
<toast-notification></toast-notification>
<script type="module">
  import { notifySuccess } from "@f-ewald/components/toast-notification.js";
  notifySuccess("Saved!");
</script>
```

## Attributes / properties

_None._

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-hover-overlay` |
| `--ui-info` |
| `--ui-line-height-glyph` |
| `--ui-line-height-normal` |
| `--ui-on-accent` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-success` |
| `--ui-text` |
