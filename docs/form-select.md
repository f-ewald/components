# `<form-select>`

A styled dropdown select: a trigger button showing the current option's
label, opening a listbox popover on click. Drop-in generic replacement for
a native `<select>` wherever consistent cross-browser styling and a
`change` event carrying `{ value }` are wanted (e.g. a task's status
picker).

## Install

```js
import "@f-ewald/components/form-select.js";
```

## Usage

```html
<form-select label="Task state"></form-select>
<script type="module">
  const select = document.querySelector("form-select");
  select.options = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "done", label: "Done" },
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
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
