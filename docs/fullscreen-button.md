# `<fullscreen-button>`

Toggles fullscreen presentation of the page, or of a given `target` element.

The icon and accessible name track the *actual* fullscreen state rather than
this button's own clicks, because fullscreen can be left without touching it
— Escape, or the browser's own chrome — which would otherwise leave the
button showing the wrong affordance.

The control is styled as a square icon-sized `ui-button` `secondary` variant
(2rem, `--ui-radius-sm` corners, the `--ui-button-secondary-*` background and
border tokens, so a gradient theme carries over) layered over an opaque
`--ui-surface` base and an elevation shadow, since it normally floats above
the content it expands.

## Install

```js
import "@f-ewald/components/fullscreen-button.js";
```

## Usage

```html
<fullscreen-button></fullscreen-button>
<script type="module">
  const button = document.querySelector('fullscreen-button');
  button.target = document.querySelector('#deck'); // omit for the whole page
  button.addEventListener('fullscreen-change', (e) => console.log(e.detail.active));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `target` | _(JS property only)_ | `HTMLElement | null` | `null` | Element to present fullscreen; `null` (default) presents the whole page. |
| `enterLabel` | `enter-label` | `string` | `"Enter full screen"` | Accessible name while not fullscreen. |
| `exitLabel` | `exit-label` | `string` | `"Exit full screen"` | Accessible name while fullscreen. |

## Events

| Event | Description |
| --- | --- |
| `fullscreen-change` | The fullscreen state changed, from this button or otherwise (`detail: { active }`). |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-button-highlight` |
| `--ui-button-secondary-` |
| `--ui-button-secondary-background` |
| `--ui-button-secondary-background-active` |
| `--ui-button-secondary-background-hover` |
| `--ui-button-secondary-border` |
| `--ui-button-secondary-border-hover` |
| `--ui-focus-ring` |
| `--ui-line-height-glyph` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
