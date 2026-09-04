# `<breadcrumb-nav>`

A breadcrumb trail: a `<nav aria-label="Breadcrumb">` wrapping an ordered
list, with chevron separators and the current page rendered as plain,
non-interactive text. Designed to drop into `page-header`'s `breadcrumb`
slot, but usable on its own anywhere a trail is needed.

The last `items` entry is always treated as the current page: it renders as
text with `aria-current="page"` even if it carries an `href`. Middle entries
without an `href` render as plain text too; only middle entries with an
`href` are real anchors.

When `max-visible` is greater than zero and the trail is longer than that,
the middle collapses behind an overflow button that always keeps the first
and current crumbs visible; activating it toggles `expanded` to reveal the
hidden crumbs in place.

## Install

```js
import "@f-ewald/components/breadcrumb-nav.js";
```

## Usage

```html
<breadcrumb-nav></breadcrumb-nav>
<script type="module">
  const trail = document.querySelector("breadcrumb-nav");
  trail.items = [
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Members" },
  ];
  trail.addEventListener("breadcrumb-navigate", (e) => console.log(e.detail.item.label, e.detail.index));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | `items` | `BreadcrumbItem[]` | `[]` | The crumbs, root first. The last entry is the current page and is rendered as non-interactive text with `aria-current="page"`. |
| `maxVisible` | `max-visible` | `number` | `0` | When greater than zero and the trail has more items than this, collapse the middle of the trail behind an overflow button (the first and current crumbs always stay visible). `0` (the default) never collapses.  A collapsed trail always occupies three positions — first crumb, overflow button, current page — so values below `3` are raised to `3`. Collapsing a shorter trail would spend a button to hide one crumb, or none at all. |
| `expanded` | `expanded` | `boolean` | `false` | Whether a collapsed trail is currently expanded to show its hidden crumbs. |

## Events

| Event | Description |
| --- | --- |
| `breadcrumb-navigate` | A crumb link was activated; `detail` is `{ item: BreadcrumbItem; index: number }`. This is an additional notification hook only — the anchor's native navigation is never prevented, so crumbs stay real, middle-clickable, right-clickable links. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-regular` |
| `--ui-line-height-glyph` |
| `--ui-line-height-tight` |
| `--ui-radius-sm` |
| `--ui-text` |
| `--ui-text-muted` |
