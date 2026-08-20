# `<ui-checkbox>`

A form-associated boolean checkbox, usable standalone or inside a native
`<form>`. Submits `name=on` when checked (matching native
`<input type="checkbox">` semantics) and participates fully in form
`reset()`, ancestor `<fieldset disabled>`, and `required` validity.

Renders a native `<input type="checkbox">` wrapped in a `<label>`, styled
via `:has()` on the wrapping label (matching `radio-pills`/`radio-cards`)
rather than styling the native input directly; the checkbox itself renders
at `1rem`, matching the existing radio-input convention. An optional
pre-rendered `icon` (matching `form-select`'s per-option icon convention)
renders between the box and the label, inside the same clickable `<label>`
— for a row that pairs a checkbox with an icon/swatch and needs the whole
row, icon included, to stay one click target.

The label is the default slot, with the `label` property as its fallback.
Slot it instead of setting the property when it needs its own markup or
styling — a link, an emphasized word — since a property renders inside this
component's shadow DOM and cannot be reached from outside. Either way the
label sits inside the native `<label>`, so it stays clickable and still
names the checkbox for assistive technology.

## Install

```js
import "@f-ewald/components/ui-checkbox.js";
```

## Usage

```html
<ui-checkbox label="Subscribe to updates"></ui-checkbox>
<ui-checkbox name="terms" label="I agree to the terms" required></ui-checkbox>
<!-- Slot the label when it needs its own markup; it overrides the property -->
<ui-checkbox name="beta">Enable <strong>beta</strong> features</ui-checkbox>
<!-- .icon is set programmatically (a pre-rendered TemplateResult), not an attribute -->
<ui-checkbox label="Show list view"></ui-checkbox>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `checked` | `checked` | `boolean` | `false` | Whether the box is checked. |
| `indeterminate` | `indeterminate` | `boolean` | `false` | Visual "partial selection" state; cleared on the next user interaction. |
| `disabled` | `disabled` | `boolean` | `false` | Disables interaction; merged with an ancestor `<fieldset disabled>`. |
| `required` | `required` | `boolean` | `false` | Marks the control invalid via `ElementInternals` while unchecked. |
| `name` | `name` | `string` | `""` | Form field name; submitted as `name=on` only while checked. |
| `label` | `label` | `string` | `""` | Visible label text rendered next to the box; overridden by the default slot. |
| `icon` | _(JS property only)_ | `TemplateResult | null` | `null` | Pre-rendered icon template displayed between the box and the label, e.g. `iconPencil(14)` from this package's icon set. |
| `iconSize` | `iconSize` | `number` | `14` | Square icon size in pixels — 14 (inline icon size) by default. |

## Events

| Event | Description |
| --- | --- |
| `change` | The checkbox was toggled by the user, in either direction; detail: `{ checked }`. Programmatic `checked` assignments do not fire it. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | The label, overriding the `label` property; for a label that needs its own markup or styling. |

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
