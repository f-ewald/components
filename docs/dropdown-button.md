# `<dropdown-button>`

A button that opens an anchored menu of actions — essentially `form-select`
minus "current value" semantics: a menu, not a select. Use for a set of
mutually exclusive next-step actions (e.g. a failed task's Retry / Close /
Backlog, or a table row's overflow actions).

Three trigger presentations share one base: `text` (the default — a
primary-filled button with a label and a rotating chevron), `text-icon`
(the same, with `icon` ahead of the label), and `icon` (a borderless,
square, low-emphasis icon target in the style of `icon-button` — the
classic "three-dot"/overflow menu, where `label` becomes the accessible
name rather than visible text).

## Install

```js
import "@f-ewald/components/dropdown-button.js";
```

## Usage

```html
<dropdown-button label="Resolve…"></dropdown-button>
<dropdown-button variant="icon" label="Row actions"></dropdown-button>
<script type="module">
  import { iconEllipsisVertical } from "@f-ewald/components/icons.js";

  const dropdown = document.querySelector("dropdown-button");
  dropdown.options = [
    { value: "retry", label: "Retry" },
    { value: "close", label: "Close" },
    { value: "delete", label: "Delete", danger: true },
  ];
  dropdown.addEventListener("select", (e) => console.log(e.detail.value));

  // Icon-only overflow ("three dot") menu — label becomes the accessible name.
  const kebab = document.querySelector('dropdown-button[variant="icon"]');
  kebab.icon = iconEllipsisVertical(16);
  kebab.options = [{ value: "delete", label: "Delete", danger: true }];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | The trigger button's label. In the `icon` variant it is the accessible name instead of visible text. |
| `options` | _(JS property only)_ | `DropdownOption[]` | `[]` | The menu's actions. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the trigger, preventing the menu from opening. |
| `variant` | `variant` | `DropdownButtonVariant` | `"text"` | Trigger presentation: label only, icon only, or icon + label. |
| `icon` | _(JS property only)_ | `TemplateResult | null` | `null` | Icon template rendered by the `icon` and `text-icon` variants. |

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
| `--ui-danger` |
| `--ui-danger-hover` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
