# `<dag-graph-3d>`

Experimental three-dimensional view of a directed graph, rendered with three.js: the graph is laid out like a
street network on a ground plane. The default `street` view stands behind the current node, with the nodes it
leads to further away toward the horizon; `overview` shows the whole graph from 45° and `top` from straight
above, both with the flow running left to right. Requests, drawn as dots, set out from the root nodes at `rate` per second and
flow along the edges at a pace set by `speed`, choosing each outgoing edge in proportion to its `weight`.

Takes the same `nodes`, `edges`, and `kinds` as `dag-graph`. Clicking a node or its label selects it, and in
the street view travels there; Back and Home in the toolbar return to the previous node and the first root. Drag
to pan; right-drag or Shift + drag to rotate and tilt; pinch or Ctrl/⌘ + wheel to zoom (a plain wheel scrolls the
page). With the view focused, arrow keys pan, Shift + arrows rotate and tilt, `+`/`-` zoom, and `0` resets the
view. The toolbar offers the `controls` you enable; set `static` to fix the camera, e.g. for a presentation. Heavier edges are drawn as wider roads and highlighted
nodes and edges use the highlight color. Under reduced motion the view shows a still picture without requests and
moves between nodes without a flight. Set `hide-pins` to draw nodes as flat disks without the pin standing up
from each.

Colors can be changed with `--dag-edge-color`, `--dag-selected-color`, `--dag-highlight-color`, and
`--dag-request-color`; `--dag-graph-3d-height` sets the height (default `24rem`).

## Install

```js
import "@f-ewald/components/dag-graph-3d.js";
```

## Usage

```html
<dag-graph-3d rate="6"></dag-graph-3d>
<script type="module">
  import { iconCube, iconServer } from "@f-ewald/components/icons.js";
  const view = document.querySelector("dag-graph-3d");
  view.kinds = {
    service: { icon: iconServer, color: "#4269d0" },
    store: { icon: iconCube, color: "#3ca951" },
  };
  view.nodes = [
    { id: "gateway", label: "gateway", kind: "service" },
    { id: "search", label: "search", kind: "service" },
    { id: "index", label: "index", kind: "store" },
  ];
  view.edges = [
    { source: "gateway", target: "search", weight: 40 },
    { source: "search", target: "index", weight: 40 },
  ];
  view.addEventListener("node-select", (e) => console.log(e.detail.id));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `nodes` | `nodes` | `DagNode[]` | `[]` | The graph's nodes. |
| `edges` | `edges` | `DagEdge[]` | `[]` | The graph's edges; edges whose endpoints aren't both in `nodes` are ignored. |
| `kinds` | _(JS property only)_ | `Record<string, DagNodeKind>` | `{}` | Presentation of each node kind, keyed by `DagNode.kind`; only `color` and `icon` are used. |
| `selected` | `selected` | `string | null` | `null` | Id of the selected node, where the street view stands; defaults to the first root. |
| `label` | `label` | `string` | `"Directed graph"` | Accessible name of the view. |
| `rate` | `rate` | `number` | `4` | New requests per second, spread across the root nodes. |
| `speed` | `speed` | `number` | `1` | How fast requests travel, as a multiple of the default pace; `0` stops them where they are. |
| `hidePins` | `hide-pins` | `boolean` | `false` | Draws each node as just its ground disk, without the pin standing up from it. |
| `view` | `view` | `DagGraph3dView` | `"street"` | Camera preset; changing it flies there, and `0` returns to it after panning, tilting, or zooming. |
| `controls` | `controls` | `string` | `"back home view zoom pause"` | Space-separated toolbar controls to show: any of `back`, `home`, `view`, `zoom`, and `pause`, in that order. An empty value hides the toolbar. |
| `isStatic` | `static` | `boolean` | `false` | Fixes the camera, e.g. for a presentation: panning, rotating, tilting, and zooming are off, and the `view` and `zoom` controls are hidden. `view` and `selected` still move it, and an `overview` or `top` view stays fitted when resized. Nodes can still be selected. |
| `paused` | `paused` | `boolean` | `false` | Freezes the requests in place and stops new ones. |

## Events

| Event | Description |
| --- | --- |
| `node-select` | A node was selected by clicking it, its label, Back, or Home; `detail` is `{ id }`. |
| `view-change` | The toolbar switched `view`; `detail` is `{ view }`. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-button-highlight` |
| `--ui-button-secondary-background` |
| `--ui-button-secondary-border` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
