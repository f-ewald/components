# `<loading-spinner>`

Indeterminate circular loading spinner: a rotating arc over a faint track,
in the style of a browser page-load indicator. Purely presentational and
property-driven — show it while work is in flight and remove it when done.

Exposes an accessible `role="status"` with `label` as its name, so assistive
technology announces the loading state; the arc itself is decorative. Under
`prefers-reduced-motion` it stops rotating and stays a static ring.

## Install

```js
import "@f-ewald/components/loading-spinner.js";
```

## Usage

```html
<loading-spinner></loading-spinner>
<loading-spinner size="sm"></loading-spinner>
<loading-spinner size="lg" label="Loading results"></loading-spinner>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | `size` | `"sm" | "md" | "lg"` | `"md"` | Diameter step — `sm` ≈ 1rem, `md` ≈ 1.5rem (default), `lg` ≈ 2rem. |
| `label` | `label` | `string` | `"Loading"` | Accessible name announced by the `role="status"` live region. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-line-height-glyph` |
| `--ui-primary` |
