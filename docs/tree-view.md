# `<tree-view>`

A generic, presentational tree shell: renders `nodes` recursively, one row
per node, with each row's content produced by `renderNode` (default: plain
label). Modeled on `data-table`'s headless pattern — knows nothing about
what a node's `data` means beyond what `renderNode` does with it.

A node with a `children` array (even empty) is a folder: clicking or
activating its row toggles expand/collapse instead of firing `node-click`.
A node with no `children` is a leaf: clicking or activating its row fires
`node-click`. Folders start collapsed; set `default-expanded` to start
every folder expanded instead. Expansion state is otherwise managed
internally and untouched by later `nodes` updates, so a user's manual
toggles survive a data refresh.

## Install

```js
import "@f-ewald/components/tree-view.js";
```

## Usage

```html
<tree-view></tree-view>
<script type="module">
  const tree = document.querySelector("tree-view");
  tree.nodes = [
    {
      id: "docs",
      label: "docs",
      children: [{ id: "fil_1", label: "notes.txt", data: { id: "fil_1" } }],
    },
    { id: "fil_2", label: "readme.md", data: { id: "fil_2" } },
  ];
  tree.renderNode = (node) => node.label;
  tree.addEventListener("node-click", (e) => console.log(e.detail));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `nodes` | _(JS property only)_ | `TreeNode[]` | `[]` | Tree data; opaque to this component beyond what `renderNode` does with it. |
| `renderNode` | _(JS property only)_ | `(node: TreeNode) => unknown` | `—` | Produces a row's rendered content for `node`. Default: plain label text. |
| `defaultExpanded` | `default-expanded` | `boolean` | `false` | Start every folder expanded instead of the default all-collapsed. |

## Events

| Event | Description |
| --- | --- |
| `node-click` | A leaf row was activated; detail is `{ id, data }`. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
