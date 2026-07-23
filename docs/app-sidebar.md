# `<app-sidebar>`

Collapsible navigation sidebar for the `app-shell` sidebar slot. It is
deliberately presentational and router-agnostic: the consumer supplies the
nav items as plain `<a>`/`<button>` elements (each an icon followed by a
label), optional `<p>` group headings, and marks the active item with
`aria-current="page"`. The sidebar styles them, tracks hover/active/focus,
and — in collapsed "rail" mode — centers the icons and hides the labels.

Rail mode is driven by the `collapsed` attribute (the parent `app-shell`
toggles it). Labels are hidden by the inherited `--app-sidebar-label` custom
property, so each label element should read it, e.g.
`<span style="display: var(--app-sidebar-label, inline)">Reports</span>`;
keep an `aria-label` on the item so its accessible name survives collapse.
The sidebar fills the width and height of its container — `app-shell` owns
the actual rail/expanded width.

## Install

```js
import "@f-ewald/components/app-sidebar.js";
```

## Usage

```html
<app-sidebar>
  <a href="/dashboard" aria-current="page" aria-label="Dashboard">
    <!-- icon --><span style="display: var(--app-sidebar-label, inline)">Dashboard</span>
  </a>
  <a href="/members" aria-label="Members">
    <!-- icon --><span style="display: var(--app-sidebar-label, inline)">Members</span>
  </a>
</app-sidebar>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `collapsed` | `collapsed` | `boolean` | `false` | Collapses the sidebar to an icon rail (centers icons, hides labels). |

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
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
