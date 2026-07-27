# `<form-field>`

Per-field wrapper for a form control: label, slotted control, and an
optional hint or error message, in one consistent unit repeated across a
form. Purely presentational — composes whatever control is slotted
(`form-select`, `multi-select`, `autocomplete-input`, `ui-checkbox`, etc.)
without intercepting its events or value.

The label wraps the default slot for a best-effort visual/click
association only: every existing value-entry control encapsulates its
real `<input>` inside its own shadow DOM, so there is no light-DOM `id` a
`for` attribute could target from outside, and this component cannot set
`aria-describedby`/`aria-invalid` on an arbitrary slotted control's
shadow-encapsulated input for the same reason. The error message uses
`role="alert"` as the practical accessibility mitigation instead of true
`aria-describedby` association.

## Install

```js
import "@f-ewald/components/form-field.js";
```

## Usage

```html
<form-field label="Task state" hint="Only affects your own view">
  <form-select></form-select>
</form-field>
<form-field label="Terms" required error="You must accept to continue">
  <ui-checkbox label="I agree to the terms"></ui-checkbox>
</form-field>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Field label text. |
| `hint` | `hint` | `string` | `""` | Optional helper text shown below the control when there's no `error`. |
| `error` | `error` | `string` | `""` | Optional error text; replaces the `hint` display when non-empty. |
| `required` | `required` | `boolean` | `false` | Shows a required indicator next to the label. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-text` |
| `--ui-text-muted` |
