# `<pagination-nav>`

Minimal, controlled pager for list/table views: a previous/next control pair
around a "Page N of M" status. It owns no data — the consumer sets
`current-page` / `total-pages` and moves the page in response to the
`page-change` event (typically alongside its own data fetch), exactly like
`data-table` leaves the row data to the caller.

Previous is disabled on the first page and next on the last; neither fires an
event when there is nowhere to go.

The prev/next buttons are treated as `ui-button`'s `secondary` variant:
they read the same shared `--ui-button-secondary-*`/`--ui-button-highlight`
tokens (and `--ui-button-secondary-surface-muted` for hover, since — like
`button-group`'s unchecked segments — they already paint
`--ui-surface-muted` on hover by default), so a gradient theme applies
consistently here too.

## Install

```js
import "@f-ewald/components/pagination-nav.js";
```

## Usage

```html
<pagination-nav current-page="1" total-pages="5"></pagination-nav>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `currentPage` | `current-page` | `number` | `1` | The 1-based current page. |
| `totalPages` | `total-pages` | `number` | `1` | The total number of pages (minimum 1). |

## Events

| Event | Description |
| --- | --- |
| `page-change` | The user picked a new page (`detail: { page }`). |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-button-highlight` |
| `--ui-button-secondary-` |
| `--ui-button-secondary-background` |
| `--ui-button-secondary-background-active` |
| `--ui-button-secondary-border` |
| `--ui-button-secondary-border-hover` |
| `--ui-button-secondary-surface-muted` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
