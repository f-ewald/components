# `<multi-select>`

A form-associated multi-select: a trigger showing a compact summary of the
current selection, opening a multi-selectable listbox popover, with an
optional removable-chip list of the chosen values. A drop-in generic
replacement for a native `<select multiple>` — set `name` on the element
itself and each
selected value is submitted as a repeated `name=value` entry, matching native
multiple-select semantics; `new FormData(form).getAll(name)` and
`form.reset()` work unchanged.

The trigger visually follows `form-select`: a `2rem` field showing the
`placeholder` when empty, the single selected label when one value is chosen,
and `N selected` when several are. Set `show-chips` to additionally render
the selected values as compact chips below the trigger, each with an
accessible `32px` remove control; chips are off by default and the region
reserves no space while nothing is selected. Like `form-select`, the host is
`display: block` and fills its container by default; constrain the host
(`multi-select { display: inline-block; }`) to shrink it to its content
instead.

Set `searchable` to replace the button trigger with an editable combobox that
infix-filters the predefined options by case-insensitive label. Typed text is
only a query: `values` changes exclusively when options are toggled, and an
uncommitted query is discarded when the list closes.

The `variant` chooses between two presentations, and `searchable` applies to
both:

- `"dropdown"` (default) is the popover form described above: a compact
  trigger (button, or search combobox when `searchable`) that opens a
  multi-selectable listbox on demand, closes on outside click / Escape, and
  shows a chevron.
- `"list"` renders the options as a persistently visible, bordered surface
  with no popover, no chevron, and no `open` host state; it never registers
  outside-click listeners. Its scroll viewport is sized to roughly
  `visibleRows` `2rem` rows (see `visible-rows`). When not `searchable` the
  `listbox` itself is focusable and drives Arrow/Home/End/Enter/Space keyboard
  navigation via `aria-activedescendant`; when `searchable` a `2rem` search
  field sits above the list and owns navigation, and Escape only clears the
  query instead of hiding the list.

## Install

```js
import "@f-ewald/components/multi-select.js";
```

## Usage

```html
<multi-select name="colors" label="Colors" searchable></multi-select>
<multi-select id="colors-list" variant="list" visible-rows="4"></multi-select>
<script type="module">
  const options = [
    { value: "red", label: "Red" },
    { value: "green", label: "Green" },
    { value: "blue", label: "Blue" },
    { value: "amber", label: "Amber" },
    { value: "violet", label: "Violet" },
  ];
  const dropdown = document.querySelector("multi-select[name='colors']");
  dropdown.options = options;
  dropdown.values = ["red", "blue"];
  dropdown.searchable = true;
  dropdown.addEventListener("change", (e) => console.log(e.detail.values));

  const list = document.getElementById("colors-list");
  list.options = options;
  list.values = ["green"];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | _(JS property only)_ | `MultiSelectOption[]` | `[]` | The full list of selectable options. |
| `values` | _(JS property only)_ | `string[]` | `[]` | The currently selected values. Programmatic assignments are deduplicated while preserving order and never fire `change`. |
| `name` | `name` | `string` | `""` | Form control name; each selected value submits under it. |
| `label` | `label` | `string` | `""` | Accessible label applied to the trigger. |
| `placeholder` | `placeholder` | `string` | `"Select options"` | Text shown on the trigger when nothing is selected. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the whole control, preventing the popover from opening. |
| `required` | `required` | `boolean` | `false` | Marks the control as required for native form validation. |
| `searchable` | `searchable` | `boolean` | `false` | Enables editable, case-insensitive infix filtering by option label. Typed text never becomes a selected value. |
| `max` | `max` | `number` | `0` | Maximum number of selectable values; `0` (default) means unlimited. |
| `variant` | `variant` | `MultiSelectVariant` | `"dropdown"` | Presentation variant. `"dropdown"` (default) opens a popover listbox; `"list"` renders a persistently visible, bordered list surface. Reflected so consumers can style by `[variant="list"]`. |
| `visibleRows` | `visible-rows` | `number` | `5` | Number of `2rem` rows the `list` variant's scroll viewport shows before it scrolls, mirroring a native `<select size>`. Normalized to an integer of at least `1` (default `5`); ignored by the `dropdown` variant. |
| `showChips` | `show-chips` | `boolean` | `false` | When true, the selected values are also rendered as removable chips below the trigger, each with an accessible `32px` remove control. Off by default: the trigger already summarizes the selection, and values can be toggled off in the listbox. Applies to both variants. |

## Events

| Event | Description |
| --- | --- |
| `change` | Fired with `{ values: string[] }` (a copied array) when a value is added or removed through the UI. Programmatic `values` assignments do not fire it. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
