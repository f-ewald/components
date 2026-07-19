# `<gallery-item-variant>`

Responsive image source metadata for a parent `gallery-item`.

## Install

```js
import "@f-ewald/components/gallery-item-variant.js";
```

## Usage

```html
<gallery-item-variant
  media="(max-width: 640px)"
  srcset="/photos/coast-portrait.jpg"
></gallery-item-variant>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `media` | `media` | `string | undefined` | `—` | Optional media query that controls when this source is selected. |
| `srcset` | `srcset` | `string` | `""` | Responsive image candidate string passed to a generated `<source>`. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
