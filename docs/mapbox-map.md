# `<mapbox-map>`

A thin, generic wrapper around a `mapboxgl.Map` — construction, access
token, style loading/switching, and container resizing only. It carries no
domain logic: no layer registry, no click-handler system, no markers or
popups. A consumer registers its own sources/layers/handlers against the
`mapboxgl.Map` instance handed back on `map-ready`, the same instance
`mapbox-map` continues to own (this component never calls `map.remove()`
except on disconnect, so a consumer's own registrations survive style
reloads exactly as they would using `mapboxgl.Map` directly).

Deliberately does not construct the map until `styleUrl` is a non-empty
string — if a consumer knows the desired style only after an async
lookup (e.g. a saved user preference), delay setting `styleUrl` rather
than setting a default and swapping it later, which would visibly flash
the wrong basemap before the real one loads.

## Install

```js
import "@f-ewald/components/mapbox-map.js";
```

## Usage

```html
<mapbox-map
  access-token="pk.your-token"
  style-url="mapbox://styles/mapbox/light-v11"
></mapbox-map>
<script type="module">
  document.querySelector("mapbox-map").addEventListener("map-ready", (e) => {
    const map = e.detail.map; // the underlying mapboxgl.Map
    map.addSource("mine", { type: "geojson", data: "/mine.geojson" });
    map.addLayer({ id: "mine", type: "circle", source: "mine", paint: { "circle-color": "#4f46e5" } });
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `accessToken` | `access-token` | `string` | `""` | Mapbox access token. Required before the map can be constructed. |
| `styleUrl` | `style-url` | `string` | `""` | Style URL (e.g. `mapbox://styles/mapbox/light-v11`). The map is not constructed until this is a non-empty string — see the class doc. |
| `center` | _(JS property only)_ | `[number, number]` | `[0, 0]` | Initial center as `[lng, lat]`. Only read at construction time. |
| `zoom` | `zoom` | `number` | `0` | Initial zoom level. Only read at construction time. |

## Events

| Event | Description |
| --- | --- |
| `map-style-reloaded` | A subsequent `styleUrl` change finished loading its new style (sources/layers registered by a consumer via the `map-ready` instance do not survive a style change and must be re-registered — same behavior as calling `map.setStyle()` directly); detail: `{ map: mapboxgl.Map }`. |
| `map-ready` | The map (and, if `styleUrl` changed before the initial load finished, its final requested style) has finished loading; detail: `{ map: mapboxgl.Map }`. |

## Slots

_None._

## CSS custom properties

_None._
