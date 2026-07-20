# `<dropdown-button>`

A primary-styled button with a label and chevron that opens an anchored
menu of actions — essentially `form-select` minus "current value"
semantics: a menu, not a select. Use for a set of mutually exclusive
next-step actions (e.g. a failed task's Retry / Close / Backlog).

## Install

```js
import "@f-ewald/components/dropdown-button.js";
```

## Usage

```html
<dropdown-button label="Resolve…"></dropdown-button>
<script type="module">
  const dropdown = document.querySelector("dropdown-button");
  dropdown.options = [
    { value: "retry", label: "Retry" },
    { value: "close", label: "Close" },
    { value: "backlog", label: "Backlog" },
  ];
  dropdown.addEventListener("select", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | The trigger button's label. |
| `options` | _(JS property only)_ | `DropdownOption[]` | `[]` | The menu's actions. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the trigger, preventing the menu from opening. |

## Events

| Event | Description |
| --- | --- |
| `select` | Fired with `{ value: string }` when a menu item is picked. |

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
| `--ui-primary-hover` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
