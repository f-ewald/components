# `<app-shell>`

The dashboard page shell: a slot-based CSS-grid backbone that arranges a
full-height sidebar, a top bar, the main content, an optional right-hand
detail column, and an optional footer. It owns the responsive behavior so
consumers don't re-implement it — above the shared 48rem breakpoint the
sidebar collapses to an icon rail and the detail region is an inline column;
at or below it the sidebar becomes an off-canvas drawer and the detail region
an overlay, both dismissed by a scrim or Escape.

Widths are tunable per instance via `--component-sidebar-width` (16rem),
`--component-sidebar-rail-width` (3.5rem), and `--component-topbar-height`
(3rem); the detail column reuses the 20rem/25rem panel widths. The main
content area is white by default — override it with
`--component-main-background`. Give the shell a height (e.g. `height: 100vh`)
so the sidebar and main can size and scroll.

The built-in top-bar button toggles the sidebar, and so does pressing `[`
anywhere on the page (ignored while typing in a text field or with a
modifier held). Hovering or keyboard-focusing the toggle reveals a tooltip
naming the action and its `[` shortcut — the shortcut is not shown as
permanent chrome.

## Install

```js
import "@f-ewald/components/app-shell.js";
```

## Usage

```html
<app-shell detail-open style="height: 100vh">
  <app-sidebar slot="sidebar">
    <a href="/dashboard" aria-current="page" aria-label="Dashboard">
      <!-- icon --><span style="display: var(--app-sidebar-label, inline)">Dashboard</span>
    </a>
  </app-sidebar>
  <page-header slot="topbar" heading="Members"></page-header>
  <action-bar>
    <autocomplete-input slot="start" placeholder="Search…"></autocomplete-input>
    <ui-button slot="end" variant="primary">Create</ui-button>
  </action-bar>
  <data-table></data-table>
  <div slot="detail">Selected record…</div>
  <pagination-nav slot="footer" total-pages="5"></pagination-nav>
</app-shell>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `sidebarCollapsed` | `sidebar-collapsed` | `boolean` | `false` | Collapses the sidebar to an icon rail on desktop. |
| `detailOpen` | `detail-open` | `boolean` | `false` | Shows the right-hand detail region (inline column, or overlay on mobile). |
| `detailWidth` | `detail-width` | `"compact" | "comfortable"` | `"compact"` | Detail width: `compact` (20rem) or `comfortable` (25rem). |

## Events

| Event | Description |
| --- | --- |
| `sidebar-toggle` | The built-in toggle changed the sidebar state. |
| `detail-close` | The scrim or Escape dismissed the mobile detail overlay. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font-size-sm` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-overlay` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text-muted` |
| `--ui-tooltip` |
