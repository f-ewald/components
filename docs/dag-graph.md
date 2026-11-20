# `<dag-graph>`

Interactive layered drawing of a directed graph — dependencies, pipelines, or any node-link data.

Nodes are placed in layers (via dagre) so edges flow left to right (or top to bottom with
`direction="TB"`); cycles are allowed, and the edges closing them are drawn dashed and point backward.
Each node is a compact card sized to its label, with an optional icon, color, and border style from
`kinds`. The whole graph is shown when it fits at a readable zoom; otherwise the selected node is centered at
100%. Drag to pan; pinch or Ctrl/⌘ + wheel to zoom (a plain wheel scrolls the page). With keyboard
focus on the graph, arrow keys pan, `+`/`-` zoom, and `0` fits the graph. Clicking a node, or pressing
Enter/Space on it, selects it. A toolbar in the top-right corner offers the `controls` you enable.

Edges can carry an optional `label`, drawn midway along the edge, and an optional `weight`, which draws the
edge thicker in proportion to the heaviest weight in the graph.

Set `static` to present a fixed picture: the graph is always fitted into view, panning and zooming
are off, and the toolbar is hidden; nodes can still be selected.

Colors can be changed with these custom properties: `--dag-node-background`, `--dag-node-text`,
`--dag-edge-color`, `--dag-selected-color`, and `--dag-highlight-color`; `--dag-graph-height` sets the
height (default `24rem`).

## Install

```js
import "@f-ewald/components/dag-graph.js";
```

## Usage

```html
<dag-graph legend selected="web"></dag-graph>
<script type="module">
  import { iconBookOpen, iconCube, iconServer } from "@f-ewald/components/icons.js";
  const graph = document.querySelector("dag-graph");
  graph.kinds = {
    service: { label: "Service", icon: iconServer, color: "#4269d0" },
    library: { label: "Library", icon: iconBookOpen, color: "#3ca951" },
    package: { label: "External package", icon: iconCube, color: "#9498a0", dashed: true },
  };
  graph.nodes = [
    { id: "web", label: "web", kind: "service" },
    { id: "auth", label: "auth-lib", kind: "library" },
    { id: "requests", label: "requests", kind: "package" },
  ];
  graph.edges = [
    { source: "web", target: "auth", weight: 42 },
    { source: "auth", target: "requests", label: "^2.31", weight: 15 },
  ];
  graph.addEventListener("node-select", (e) => console.log(e.detail.id));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `nodes` | `nodes` | `DagNode[]` | `[]` | Nodes to draw. |
| `edges` | `edges` | `DagEdge[]` | `[]` | Directed edges between `nodes`; edges with an unknown endpoint or to the node itself are ignored. |
| `kinds` | _(JS property only)_ | `Record<string, DagNodeKind>` | `{}` | Presentation per node `kind`: legend label, color, icon, and border style. |
| `selected` | `selected` | `string | null` | `null` | Id of the selected node. Selecting a node updates it; when it changes to a node outside the visible area, the view follows. |
| `direction` | `direction` | `DagDirection` | `"LR"` | Layer direction: `LR` (left to right) or `TB` (top to bottom). |
| `label` | `label` | `string` | `"Directed graph"` | Accessible name of the graph; the node and edge counts are appended. |
| `legend` | `legend` | `boolean` | `false` | Shows a legend of `kinds` below the graph. |
| `controls` | `controls` | `string` | `"zoom fit center"` | Space-separated toolbar controls to show: any of `zoom`, `fit`, `center`, and `direction`, in that order. An empty value hides the toolbar. |
| `isStatic` | `static` | `boolean` | `false` | Presents a static picture: always fitted, with panning, zooming, and the toolbar turned off. |

## Events

| Event | Description |
| --- | --- |
| `direction-change` | The toolbar's direction control flipped `direction`; `detail` is `{ direction }`. |
| `node-select` | A node was clicked or activated with the keyboard; `detail` is `{ id }`. |

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
| `--ui-button-secondary-gloss-end` |
| `--ui-button-secondary-gloss-start` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
