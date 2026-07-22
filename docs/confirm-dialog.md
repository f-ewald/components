# `<confirm-dialog>`

Reusable confirmation dialog: overlay + centered card with a slotted body,
an optional error line, and Cancel/Confirm actions. Instant `display:none`
→ `display:flex` toggle (no transitions). Fires `confirm`/`cancel`
(bubbling, composed) instead of owning any deletion logic itself —
callers stay in charge of the request.

## Install

```js
import "@f-ewald/components/confirm-dialog.js";
```

## Usage

```html
<confirm-dialog open confirm-label="Delete" cancel-label="Cancel">
  Are you sure you want to delete this item?
</confirm-dialog>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the dialog is visible. |
| `confirmLabel` | `confirm-label` | `string` | `"Delete"` | Label for the confirm button. |
| `cancelLabel` | `cancel-label` | `string` | `"Cancel"` | Label for the cancel button. |
| `danger` | `danger` | `boolean` | `true` | Danger (red) vs. primary (indigo) styling for the confirm button. |
| `busy` | `busy` | `boolean` | `false` | Shows a spinner and disables both buttons while a request is in flight. |
| `error` | `error` | `string | null` | `null` | Inline error line shown below the body, or null for none. |

## Events

| Event | Description |
| --- | --- |
| `confirm` | User clicked the confirm button. |
| `cancel` | User clicked the cancel button. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Dialog body content. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-danger-hover` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-on-accent` |
| `--ui-overlay` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
