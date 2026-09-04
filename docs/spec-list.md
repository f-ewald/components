# `<spec-list>`

A key/value specification sheet — the "spec sheet" block on a product page:
a muted, wide-tracked key column against a value column, separated by
hairline rules (and uppercased under themes that set
`--ui-label-transform`). It describes ONE record's attributes, which is
what sets it apart from `data-table` (many records, many columns, sorting);
`spec-list` is not tabular and renders a real `<dl>`/`<dt>`/`<dd>` structure.

Feed it the `items` array for the plain data path, or slot bare `<dt>`/`<dd>`
pairs when a value needs a link, a `status-pill`, or other markup — slotted
pairs inherit the component's own key/value styling, so no page CSS is
needed. A `<div>` wrapping a pair is also accepted as a full-width grouping
row, but `::slotted()` cannot reach inside it, so those `dt`/`dd` stay the
consumer's to style. Slotted content takes precedence over `items`; with
neither, nothing is rendered.

## Install

```js
import "@f-ewald/components/spec-list.js";
```

## Usage

```html
<spec-list caption="Specifications"></spec-list>
<script type="module">
  document.querySelector("spec-list").items = [
    { label: "Material", value: "Anodized aluminum" },
    { label: "Weight", value: "1.2 kg" },
    { label: "Warranty", value: "2 years" },
  ];
</script>

<!-- Or slot your own pairs when a value needs a link, a status-pill, or other
     markup; slotted `dt`/`dd` pick up the component's own key/value styling.
     `dividers` defaults to true; turn it off via the property, since a
     `dividers="false"` attribute still parses as a truthy boolean. -->
<spec-list layout="stacked" id="sheet">
  <dt>Homepage</dt>
  <dd><a href="https://example.com">example.com</a></dd>
</spec-list>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | `items` | `SpecListItem[]` | `[]` | The key/value rows for the data-driven path. Ignored when the default slot has content. |
| `layout` | `layout` | `"auto" | "stacked"` | `"auto"` | `auto` is the two-column grid that collapses to stacked below `48rem`; `stacked` forces the stacked form at every width. |
| `dividers` | `dividers` | `boolean` | `true` | Whether to draw a hairline rule between rows; `false` for a dense inline listing. |
| `caption` | `caption` | `string` | `""` | Optional accessible caption rendered above the list; no element or reserved space when empty. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Optional `<dt>`/`<dd>` pairs for values that need custom markup; when present, they replace the `items` path. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-label-transform` |
| `--ui-line-height-normal` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
