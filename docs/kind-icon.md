# `<kind-icon>`

Inline icon for a named kind (e.g. a service, a library, an external
package), looked up in a shared `kinds` map so tables, lists, and search
results show the same icon and color as a `dag-graph` legend. With
`show-label` the kind's label follows the icon as text; otherwise the
icon alone is exposed as an image named by the label. Renders nothing for
a kind missing from `kinds`.

## Install

```js
import "@f-ewald/components/kind-icon.js";
```

## Usage

```html
<kind-icon kind="service" show-label></kind-icon>
<kind-icon kind="package" size="18"></kind-icon>
<script type="module">
  import { iconCube, iconServer } from "@f-ewald/components/icons.js";

  const kinds = {
    service: { label: "Service", icon: iconServer, color: "#4269d0" },
    package: { label: "External package", icon: iconCube, color: "#9498a0" },
  };
  for (const el of document.querySelectorAll("kind-icon")) el.kinds = kinds;
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `kind` | `kind` | `string` | `""` | Key of the kind to show, looked up in `kinds`. |
| `kinds` | _(JS property only)_ | `Record<string, KindIconStyle>` | `{}` | Presentation per kind: label, color, and icon. Shareable with `dag-graph`'s `kinds`. |
| `size` | `size` | `14 | 18` | `14` | Square icon size in pixels: 14 inline, 18 standalone. |
| `showLabel` | `show-label` | `boolean` | `false` | Shows the kind's label as text after the icon. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-primary` |
