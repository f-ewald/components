# `<copy-link-button>`

Small icon button that copies `value` to the clipboard and shows a toast
on success/failure (if a `<toast-notification>` element is present), and
always dispatches a `copy-success`/`copy-error` CustomEvent so consumers
without a toast element can react. Defaults to the current page URL if
`value` is unset.

## Install

```js
import "@f-ewald/components/copy-link-button.js";
```

## Usage

```html
<copy-link-button value="https://example.com/listing/42" label="Copy listing link"></copy-link-button>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Text to copy. Defaults to `window.location.href` at click time. |
| `label` | `label` | `string` | `"Copy link"` | Accessible label / tooltip text. |

## Events

| Event | Description |
| --- | --- |
| `copy-success` | The value was copied to the clipboard. |
| `copy-error` | Copying to the clipboard failed. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
