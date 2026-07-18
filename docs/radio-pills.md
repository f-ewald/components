# `<radio-pills>`

Single-select group of compact pill-shaped options — for many short,
same-shaped choices (a basemap style, a unit toggle). For a handful of
choices where a description matters, use `radio-cards` instead. Wraps
native radio inputs for keyboard/a11y and fires `change` rather than
relying on form submission.

## Install

```js
import "@f-ewald/components/radio-pills.js";
```

## Usage

```html
<radio-pills></radio-pills>
<script type="module">
  const el = document.querySelector("radio-pills");
  el.options = [
    { value: "light", label: "Light" },
    { value: "streets", label: "Streets" },
  ];
  el.value = "light";
  el.addEventListener("change", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | _(JS property only)_ | `RadioPillOption[]` | `[]` | Options to render, one pill each. |
| `value` | `value` | `string` | `""` | Currently selected value. |

## Events

| Event | Description |
| --- | --- |
| `change` | A pill was selected; detail: { value }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-primary` |
| `--ui-surface-muted` |
| `--ui-text` |
