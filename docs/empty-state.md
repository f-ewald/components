# `<empty-state>`

A centered placeholder for an empty list, an empty panel, or a zero-result
search: an optional leading glyph, a heading, a supporting line (or richer
slotted body), and an optional call-to-action row. Purely presentational —
it carries no interactive state of its own and no ARIA `role`; it is a
region of content, not a live status. Every optional part collapses
completely when absent, reserving no layout space.

## Install

```js
import "@f-ewald/components/empty-state.js";
```

## Usage

```html
<empty-state heading="No results found" description="Try adjusting your search or filters.">
  <span slot="icon">...</span>
  <ui-button slot="actions" variant="primary">Clear filters</ui-button>
</empty-state>
<empty-state size="sm" heading="No pinned items"></empty-state>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The primary line. |
| `description` | `description` | `string` | `""` | The supporting line under the heading. Omitted entirely when empty. |
| `size` | `size` | `"sm" | "md"` | `"md"` | `sm` for a small panel/sidebar, `md` (default) for a full page region. `md` matches the pre-`size` look exactly. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-text` |
| `--ui-text-muted` |
