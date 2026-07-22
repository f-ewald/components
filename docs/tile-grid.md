# `<tile-grid>`

A generic, presentational grid shell: renders one bordered card per entry
in `items`, with each tile's content produced by `renderTile` (default:
stringify). Knows nothing about what an "item" means — callers own the
data shape entirely. Modeled directly on `data-table`'s headless pattern.

Optional `itemHref` makes whole tiles clickable (navigating via
`location.hash`), without hijacking clicks on nested interactive elements
(links/buttons) a tile's rendered content might contain.

Optional `fileIcon` prefixes each tile with a decorative Heroicons
"document" glyph, for grids whose items represent files — the icon never
carries its own accessible name since the rendered tile content (e.g. a
filename) already identifies the item. Off by default, so it consumes no
layout space or markup for grids of non-file items.

## Install

```js
import "@f-ewald/components/tile-grid.js";
```

## Usage

```html
<tile-grid file-icon></tile-grid>
<script type="module">
  const grid = document.querySelector("tile-grid");
  grid.items = [
    { name: "notes.txt" },
    { name: "photo.jpg" },
  ];
  grid.renderTile = (item) => item.name;
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | _(JS property only)_ | `unknown[]` | `[]` | Tile data; opaque to this component beyond what `renderTile` does with it. |
| `itemKey` | _(JS property only)_ | `(item: unknown, index: number) => string | number` | `—` | Stable identity for `items[i]`, used as the repeat-directive key. Defaults to the item's index. |
| `renderTile` | _(JS property only)_ | `(item: unknown) => unknown` | `—` | Produces a tile's rendered content for `item`. Default: stringify. |
| `itemHref` | _(JS property only)_ | `((item: unknown) => string | null) | null` | `null` | When set, clicking a tile (outside any nested link/button) navigates to this hash. |
| `fileIcon` | `file-icon` | `boolean` | `false` | Prefixes each tile with a decorative "document" icon, for grids of file-like items. Off by default. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-radius` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
