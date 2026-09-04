# `<modal-dialog>`

Generic centered modal-dialog shell: overlay + card with header chrome, a
close button, and an arbitrary slotted body — the modal sibling to
`slide-panel` (fixed-edge) and `popover-panel` (anchored). Unlike
`confirm-dialog`, it has no baked-in actions; the consumer supplies the
body content (a form, a read-only viewer, a table) and any footer buttons
itself. Instant `display:none` → `display:flex` toggle, no transition.
Traps focus, closes on Escape, and restores focus to the trigger on
close, stacking correctly against other open `confirm-dialog`/
`slide-panel`/`popover-panel`/`modal-dialog` layers.

## Install

```js
import "@f-ewald/components/modal-dialog.js";
```

## Usage

```html
<modal-dialog open heading="Changelog" dismissible>
  Dialog body content goes here.
</modal-dialog>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the dialog is visible. |
| `heading` | `heading` | `string` | `""` | Title text shown in the dialog header (overridable via slot="title"). |
| `size` | `size` | `ModalDialogSize` | `"default"` | `"lg"` widens the dialog to 60rem for content like tables; `"default"` is 25rem; `"fullscreen"` covers the entire viewport edge-to-edge with no border-radius or overlay padding. |
| `dismissible` | `dismissible` | `boolean` | `false` | When true, clicking the backdrop also closes the dialog (off by default — safe for forms with unsaved input). |

## Events

| Event | Description |
| --- | --- |
| `panel-close` | User clicked the close (✕) button, pressed Escape, or (when `dismissible`) clicked the backdrop. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Dialog body content. |
| `title` | Overrides the header title text (falls back to the `heading` property). |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-lg` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-tight` |
| `--ui-overlay` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
