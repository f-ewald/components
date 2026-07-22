# `<icon-button>`

A borderless button wrapping a passed-in icon, with a rounded
hover-highlight background. Use for a low-emphasis affordance next to
content it acts on (e.g. an "Edit" pencil at the end of a table row)
where a bordered `ui-button` would be too heavy.

## Install

```js
import "@f-ewald/components/icon-button.js";
```

## Usage

```html
<icon-button label="Edit"></icon-button>
<script type="module">
  import { iconPencil } from "@f-ewald/components/icons.js";
  const btn = document.querySelector("icon-button");
  btn.icon = iconPencil(16);
  btn.addEventListener("click", () => console.log("edit clicked"));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `icon` | _(JS property only)_ | `TemplateResult | null` | `null` | Pre-rendered icon template, e.g. `iconPencil(18)` from this package's icon set. |
| `label` | `label` | `string` | `""` | Required accessible label, applied as `aria-label`/`title`. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the button and dims it. |

## Events

| Event | Description |
| --- | --- |
| `click` | Native click, bubbling as usual — listen on the element itself. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
