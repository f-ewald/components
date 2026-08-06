# `<app-shell>`

The dashboard page shell: a slot-based CSS-grid backbone that arranges a
top bar, the main content, an optional right-hand detail column, an
optional footer, and a sidebar. The top bar always spans the shell's full
width, in every sidebar state.

The sidebar's visibility, width, and layout mode are three independent
properties:
- `sidebar-open` (default closed) — whether it's shown at all.
- `sidebar-width`: `"full"` (16rem, icons + labels, the default) or
  `"icon"` (3.5rem rail, icons only — drives the slotted `app-sidebar`'s
  own `collapsed` attribute).
- `sidebar-mode`: `"overlay"` (the default) floats the sidebar above the
  shell's own content with a higher z-index, covering part of the top
  bar's corner and whatever content sits beneath it, without ever
  resizing or reflowing `main`/`footer`. `"push"` instead reserves a real
  grid column beside `main`/`footer` (which resize to make room) — the
  top bar still spans full width above it either way.

Below the shared 48rem breakpoint the sidebar always behaves as a
full-width, modal, scrim/Escape-dismissible drawer regardless of
`sidebar-mode`/`sidebar-width` — those two properties only affect the
desktop presentation. Above 48rem, an `overlay`-mode sidebar is a
non-modal panel (no dimming scrim, no Escape-dismiss, since it reads as
an ordinary always-interactive panel rather than a blocking dialog); a
`push`-mode sidebar is even more clearly non-modal, since it never
covers anything.

The right-hand detail column is unaffected by any of the above: it still
reserves an inline grid column on desktop and becomes a dismissible
overlay (scrim/Escape) on mobile.

Widths are tunable per instance via `--component-sidebar-width` (16rem),
`--component-sidebar-rail-width` (3.5rem), and `--component-topbar-height`
(3rem); the detail column reuses the 20rem/25rem panel widths. The main
content area is white by default — override it with
`--component-main-background`. Give the shell a height (e.g. `height:
100vh`) so the sidebar and main can size and scroll.

Hovering or keyboard-focusing the toggle reveals a tooltip naming the
action and its `[` shortcut — the shortcut is not shown as permanent
chrome.

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
| `sidebarOpen` | `sidebar-open` | `boolean` | `false` | Whether the sidebar is open. Closed by default at every breakpoint. |
| `sidebarMode` | `sidebar-mode` | `"overlay" | "push"` | `"overlay"` | `"overlay"` (default) floats the sidebar above content; `"push"` reserves a grid column instead. |
| `sidebarWidth` | `sidebar-width` | `"full" | "icon"` | `"full"` | Sidebar width when open: `"full"` (16rem, icons + labels) or `"icon"` (3.5rem rail, icons only). |
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
