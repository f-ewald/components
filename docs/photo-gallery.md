# `<photo-gallery>`

Responsive, accessible image carousel composed from declarative
`gallery-item` children.

## Install

```js
import "@f-ewald/components/photo-gallery.js";
```

## Usage

```html
<photo-gallery delay="5000" show-counter show-indicators>
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
  <gallery-item src="/photos/bridge.jpg" alt="Golden Gate Bridge"></gallery-item>
</photo-gallery>
<script type="module">
  document.querySelector("photo-gallery").addEventListener("slide-change", (event) => {
    console.log(event.detail.currentIndex);
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `currentIndex` | `current-index` | `number` | `0` | Zero-based active image index. |
| `delay` | `delay` | `number` | `0` | Autoplay interval in milliseconds. Set to zero to disable autoplay. |
| `showControls` | `show-controls` | `boolean` | `true` | Whether previous and next buttons are shown. |
| `showCounter` | `show-counter` | `boolean` | `false` | Whether a current/total counter is shown. |
| `showIndicators` | `show-indicators` | `boolean` | `false` | Whether clickable slide indicators are shown. |
| `showAutoplayControl` | `show-autoplay-control` | `boolean` | `true` | Whether autoplay includes a built-in pause/play control. |
| `paused` | `paused` | `boolean` | `false` | Whether autoplay is explicitly paused. |
| `aspectRatio` | `aspect-ratio` | `string` | `"16 / 9"` | CSS aspect ratio used by the image viewport. |
| `objectFit` | `object-fit` | `PhotoGalleryObjectFit` | `"cover"` | How images fit within the stable viewport. |

## Events

| Event | Description |
| --- | --- |
| `slide-change` | The active image changed. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `gallery-item` elements rendered as slides. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-overlay` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
