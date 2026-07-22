# `<form-select>`

A styled dropdown select: a trigger button showing the current option's
label, opening a listbox popover on click. Drop-in generic replacement for
a native `<select>` wherever consistent cross-browser styling and a
`change` event carrying `{ value }` are wanted (e.g. a task's status
picker).

The trigger fills its host's width (`justify-content: space-between`
pushes the chevron to the far edge), but the host itself stays
`display: inline-block` — so usages that never size the host (a filter
bar, a status picker) keep shrink-to-fit auto-width unchanged. To make an
instance full-width, size the host itself: `form-select { width: 100%; }`.

Set `searchable` to replace the button trigger with an editable combobox
that filters the predefined options by case-insensitive label infix. Typed
text is only a query: `value` changes exclusively when an actual option is
selected, and an uncommitted query is discarded when the list closes.
Each option may also provide a pre-rendered `icon` and square `iconSize`;
iconless options reserve no leading space.

## Install

```js
import "@f-ewald/components/form-select.js";
```

## Usage

```html
<form-select label="Task state" searchable></form-select>
<script type="module">
  import { iconArrowPath, iconCheckCircle, iconListBullet } from "@f-ewald/components/icons.js";

  const select = document.querySelector("form-select");
  select.options = [
    { value: "backlog", label: "Backlog", icon: iconListBullet(14), iconSize: 14 },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress", icon: iconArrowPath(16), iconSize: 16 },
    { value: "review", label: "Needs review" },
    { value: "done", label: "Done", icon: iconCheckCircle(16), iconSize: 16 },
  ];
  select.value = "open";
  select.addEventListener("change", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | _(JS property only)_ | `SelectOption[]` | `[]` | The full list of selectable options. |
| `value` | `value` | `string` | `""` | Currently selected value; must match one of `options[].value`. |
| `label` | `label` | `string` | `""` | `aria-label` applied to the trigger button. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the trigger, preventing the popover from opening. |
| `searchable` | `searchable` | `boolean` | `false` | Enables editable, case-insensitive infix filtering by option label. Typed text never becomes the selected `value`. |

## Events

| Event | Description |
| --- | --- |
| `change` | Fired with `{ value: string }` when a different option is picked. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
