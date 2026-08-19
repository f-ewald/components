# `<loading-dots>`

Three dots that bounce one after another as a lightweight, indeterminate
"working" / "typing" indicator. Purely presentational and property-driven —
show it while a short operation is pending and remove it when done.

Exposes an accessible `role="status"` with `label` as its name, so assistive
technology announces the loading state; the dots themselves are decorative.
Under `prefers-reduced-motion` the bounce is removed and the dots rest.

## Install

```js
import "@f-ewald/components/loading-dots.js";
```

## Usage

```html
<loading-dots></loading-dots>
<loading-dots size="sm"></loading-dots>
<loading-dots size="lg" label="Sending message"></loading-dots>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | `size` | `"sm" | "md" | "lg"` | `"md"` | Dot-size step — `sm`, `md` (default), or `lg`. |
| `label` | `label` | `string` | `"Loading"` | Accessible name announced by the `role="status"` live region. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-line-height-glyph` |
| `--ui-primary` |
| `--ui-radius-pill` |
