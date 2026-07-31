# `<button-group>`

Single-select segmented control — a strip of buttons joined into one
shared-border shape, for a small, persistent set of mutually exclusive
choices (a view switcher, a theme picker) where the *currently selected*
option should read as visually "pressed," not just checked. For many
short, individually pill-shaped choices, use `radio-pills` instead. Wraps
native radio inputs for keyboard/a11y and fires `change` rather than
relying on form submission. Set `size="sm"` for a compact strip one step
below the default, matching `ui-button`'s `sm` size.

The checked segment reads `--ui-button-background`/`-hover`/`-active`,
same as `ui-button`'s `primary` variant. Unchecked segments are treated as
`ui-button`'s `secondary` variant: they read the shared
`--ui-button-secondary-background`/`-active` (rest/pressed) so a gradient
theme applies consistently, but use the shared `--ui-button-secondary-surface-muted`
(also used by `pagination-nav`) for hover, since — unlike `secondary` — an
unchecked segment already paints `--ui-surface-muted` on hover by default.

## Install

```js
import "@f-ewald/components/button-group.js";
```

## Usage

```html
<button-group></button-group>
<script type="module">
  const el = document.querySelector("button-group");
  el.options = [
    { value: "list", label: "List" },
    { value: "kanban", label: "Kanban" },
  ];
  el.value = "list";
  el.addEventListener("change", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | _(JS property only)_ | `ButtonGroupOption[]` | `[]` | Options to render, one segment each. |
| `value` | `value` | `string` | `""` | Currently selected value. |
| `disabled` | `disabled` | `boolean` | `false` | Disables every native radio in the group. |
| `iconOnly` | `icon-only` | `boolean` | `false` | Hides labels visually (icons only) while keeping them as the accessible name. |
| `size` | `size` | `"sm" | "md"` | `"md"` | Size — `sm` reduces segment height/padding/font-size one step below the default. |

## Events

| Event | Description |
| --- | --- |
| `change` | A segment was selected; detail: { value }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-button-background` |
| `--ui-button-highlight` |
| `--ui-button-secondary-background` |
| `--ui-button-secondary-background-active` |
| `--ui-button-secondary-surface-muted` |
| `--ui-button-text-shadow` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
