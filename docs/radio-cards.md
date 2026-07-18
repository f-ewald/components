# `<radio-cards>`

Single-select group of full-width cards, each with a label and optional
description — for a handful of meaningfully different choices where the
description matters. For many short, same-shaped options (a color swatch,
a basemap style), use `radio-pills` instead. Wraps native radio inputs for
keyboard/a11y and fires `change` rather than relying on form submission.

## Install

```js
import "@f-ewald/components/radio-cards.js";
```

## Usage

```html
<radio-cards></radio-cards>
<script type="module">
  const el = document.querySelector("radio-cards");
  el.options = [
    { value: "simple", label: "Simple", description: "Quick-ranking view" },
    { value: "detailed", label: "Detailed", description: "Every section and layer" },
  ];
  el.value = "simple";
  el.addEventListener("change", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | _(JS property only)_ | `RadioCardOption[]` | `[]` | Options to render, one card each. |
| `value` | `value` | `string` | `""` | Currently selected value. |

## Events

| Event | Description |
| --- | --- |
| `change` | A card was selected; detail: { value }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
