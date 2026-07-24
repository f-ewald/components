# `<text-area>`

Plain multi-line text field — a thin, tokenized wrapper around a native
`<textarea>`, styled to match the other value-entry form fields
(autocomplete-input, form-select, ...). Not a rich editor; use `readonly`
to display pre-formatted text (e.g. an error message) that the user can
still select and copy, typically paired with `<copy-link-button>`.

## Install

```js
import "@f-ewald/components/text-area.js";
```

## Usage

```html
<text-area placeholder="Describe the issue…" rows="4"></text-area>
<text-area readonly value="Error code: 429 - No deployments available for selected model."></text-area>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Current text content. |
| `rows` | `rows` | `number` | `4` | Visible row count (native `<textarea rows>`). |
| `placeholder` | `placeholder` | `string` | `""` | Placeholder text shown when empty. |
| `readonly` | `readonly` | `boolean` | `false` | When true, the value can be selected/copied but not edited. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the field entirely (no interaction, dimmed). |

## Events

| Event | Description |
| --- | --- |
| `input` | Fires on every keystroke; detail: { value: string }. |
| `change` | Native change semantics (on blur, if the value changed); detail: { value: string }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-line-height-normal` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
