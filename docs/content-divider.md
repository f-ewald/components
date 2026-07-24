# `<content-divider>`

A horizontal divider: a thin rule that visually separates two pieces of
content that are not otherwise contained in a box or frame and would bleed
into each other. With a `label` it renders the common "───  OR  ───"
pattern — text centered between two line segments; without one it is a
single full-width rule. Exposed to assistive technology as a horizontal
separator, so it renders correctly with zero external CSS.

The vertical spacing above and below is tunable per instance via
`--component-divider-spacing` (default `1rem`), and both the plain and
labeled forms reserve the same height, so toggling the label never shifts
surrounding layout.

## Install

```js
import "@f-ewald/components/content-divider.js";
```

## Usage

```html
<content-divider></content-divider>

<content-divider label="OR"></content-divider>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Optional centered label; empty renders a plain full-width rule. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-text-muted` |
