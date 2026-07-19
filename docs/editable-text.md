# `<editable-text>`

Jira/GitHub-style click-to-edit text: a display span that turns into an
`<input>` (or auto-growing `<textarea>` when `multiline`) on click. The
input/textarea inherits the host's font, so a title wrapped in an `<h1>`
edits at title size.

## Install

```js
import "@f-ewald/components/editable-text.js";
```

## Usage

```html
<editable-text value="Write the quarterly report" label="Title"></editable-text>
<editable-text multiline placeholder="Add a description…" label="Description"></editable-text>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Current text. |
| `multiline` | `multiline` | `boolean` | `false` | `false` renders an `<input>`, `true` an auto-growing `<textarea>`. |
| `placeholder` | `placeholder` | `string` | `""` | Muted placeholder text shown when `value` is empty, and as the input's placeholder. |
| `readonly` | `readonly` | `boolean` | `false` | Disables entering edit mode. |
| `label` | `label` | `string` | `""` | `aria-label` applied to the input/textarea. |

## Events

| Event | Description |
| --- | --- |
| `change` | Fired with `{ value: string }` when the committed value differs from the previous one. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text-muted` |
