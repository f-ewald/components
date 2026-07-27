# `<ui-checkbox>`

A form-associated boolean checkbox, usable standalone or inside a native
`<form>`. Submits `name=on` when checked (matching native
`<input type="checkbox">` semantics) and participates fully in form
`reset()`, ancestor `<fieldset disabled>`, and `required` validity.

Renders a native `<input type="checkbox">` wrapped in a `<label>`, styled
via `:has()` on the wrapping label (matching `radio-pills`/`radio-cards`)
rather than styling the native input directly; the checkbox itself renders
at `1rem`, matching the existing radio-input convention.

## Install

```js
import "@f-ewald/components/ui-checkbox.js";
```

## Usage

```html
<ui-checkbox label="Subscribe to updates"></ui-checkbox>
<ui-checkbox name="terms" label="I agree to the terms" required></ui-checkbox>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `checked` | `checked` | `boolean` | `false` | Whether the box is checked. |
| `indeterminate` | `indeterminate` | `boolean` | `false` | Visual "partial selection" state; cleared on the next user interaction. |
| `disabled` | `disabled` | `boolean` | `false` | Disables interaction; merged with an ancestor `<fieldset disabled>`. |
| `required` | `required` | `boolean` | `false` | Marks the control invalid via `ElementInternals` while unchecked. |
| `name` | `name` | `string` | `""` | Form field name; submitted as `name=on` only while checked. |
| `label` | `label` | `string` | `""` | Visible label text rendered next to the box. |

## Events

| Event | Description |
| --- | --- |
| `change` | The checkbox was toggled by the user, in either direction; detail: `{ checked }`. Programmatic `checked` assignments do not fire it. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-text` |
