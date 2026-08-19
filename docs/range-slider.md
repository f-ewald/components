# `<range-slider>`

A form-associated numeric range slider, usable standalone or inside a
native `<form>`. Wraps a native `<input type="range">` (kept for its free
keyboard, drag, and screen-reader support) restyled to match this
package's track/fill visual language (`stat-meter`, `percent-bar-chart`)
instead of the browser-default appearance. Purely a value control — no
built-in label; wrap in `form-field` for a labeled field, or render a
value readout next to it (see the playground example), matching
`autocomplete-input`/`form-select`.

## Install

```js
import "@f-ewald/components/range-slider.js";
```

## Usage

```html
<range-slider min="100" max="5000" step="50" value="1000"></range-slider>
<script type="module">
  document.querySelector("range-slider").addEventListener("input", (e) => {
    console.log(e.detail.value);
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `min` | `min` | `number` | `0` | Minimum value. |
| `max` | `max` | `number` | `100` | Maximum value. |
| `step` | `step` | `number` | `1` | Step increment. |
| `value` | `value` | `number` | `0` | Current value. |
| `disabled` | `disabled` | `boolean` | `false` | Disables interaction; merged with an ancestor `<fieldset disabled>`. |
| `name` | `name` | `string` | `""` | Form field name. |

## Events

| Event | Description |
| --- | --- |
| `input` | Fires continuously while dragging/typing; detail: `{ value }`. |
| `change` | Fires once the value is committed (drag released, arrow key released); detail: `{ value }`. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-button-accent` |
| `--ui-button-background` |
| `--ui-button-highlight` |
| `--ui-focus-ring` |
| `--ui-primary` |
| `--ui-radius-circle` |
| `--ui-radius-pill` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text-muted` |
