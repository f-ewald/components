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
| `headingLevel` | `heading-level` | `number` | `2` | Heading rank the `heading` is exposed as, 1-6. An `empty-state` fills a page, a panel, or a sidebar, so no single rank is right everywhere; set this to whatever the surrounding outline needs. Applied via `aria-level` on the rendered `h2`, which overrides the element's native rank for assistive technology. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `icon` | Optional leading glyph. The consumer supplies it (e.g. an inline SVG icon). |
| `(default)` | Optional rich body content, an alternative to `description`. |
| `actions` | Optional call to action, e.g. a `ui-button`. |

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
