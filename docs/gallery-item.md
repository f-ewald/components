# `<gallery-item>`

Declarative image metadata consumed by a parent `photo-gallery`.

## Install

```js
import "@f-ewald/components/gallery-item.js";
```

## Usage

```html
<gallery-item
  src="/photos/coast.jpg"
  alt="Rocky California coastline"
  caption="California coast"
>
  <gallery-item-variant
    media="(max-width: 640px)"
    srcset="/photos/coast-portrait.jpg"
  ></gallery-item-variant>
</gallery-item>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `src` | `src` | `string` | `""` | URL of the fallback image. |
| `alt` | `alt` | `string` | `""` | Required alternative text for the image. |
| `caption` | `caption` | `string | undefined` | `—` | Optional visible caption rendered below the image. |
| `variants` | _(JS property only)_ | `GalleryItemVariant[]` | `—` | Responsive source variants declared inside this item. _(read-only)_ |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Optional `gallery-item-variant` responsive image sources. |

## CSS custom properties

_None._
