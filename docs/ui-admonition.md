# `<ui-admonition>`

Bordered, rounded callout card for an inline notice with an optional call
to action — "take the quiz to personalize your weights", "this feature is
in beta", etc. Unlike `status-banner` (a borderless, non-rounded
full-width bar for a persistent app-level condition), this is meant to sit
inline within a page's content column, so it always has a visible border
and radius. Colors follow the same tinted-background + accent-color
scheme as `status-banner`/`status-pill`.

## Install

```js
import "@f-ewald/components/ui-admonition.js";
```

## Usage

```html
<ui-admonition variant="info">
  These are balanced defaults — take the quiz to personalize them.
  <ui-button slot="actions" variant="primary">Take the quiz</ui-button>
</ui-admonition>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `AdmonitionVariant` | `"info"` | Visual style; also selects the accent color for the icon/border/tint. |
| `icon` | _(JS property only)_ | `TemplateResult | null` | `null` | Optional leading icon, pre-rendered by the consumer (e.g. `iconInfo(18)`), matching `status-banner`/`nav-item`/`icon-button` — icons are passed in, not named, so the component never has to know the icon catalog. |

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
| `--ui-info` |
| `--ui-line-height-normal` |
| `--ui-radius` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
