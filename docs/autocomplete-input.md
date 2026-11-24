# `<autocomplete-input>`

Generic form-associated text input with a suggestion dropdown, for any
"type to filter a list of `{key, value}` options" use case. Works as a
drop-in replacement for a plain `<input>` inside a `<form>`: set `name` on
the element itself and consumers keep reading
`new FormData(form).get(name)` and calling `form.reset()` unchanged — the
submitted value is the picked option's `value`, while `key` is available
via the `option-select` event and the `selectedOption` getter for cases
that need the underlying id rather than the display text.

Supports two suggestion sources:
- **API**: set `endpoint` to a URL that, given a `?<query-param>=<text>`
  query string, responds with a JSON array of `{key, value}` objects.
  Requests are debounced as the user types.
- **Local array**: set `options` to a fixed `AutocompleteOption[]` and the
  component filters it client-side instead of making any network
  request. Useful for small/fixed lists, offline use, or tests. Takes
  priority over `endpoint` whenever it's non-null.

Each option may also carry an `icon` (shown before the value) and a
`description` (a smaller, muted line under the value); options without
them render as a plain value. A local option's `icon` is a pre-rendered
template. An endpoint's JSON can't carry one, so it may name an icon
instead (`{"key": "api", "value": "API", "icon": "server"}`), which is
looked up in the `icons` map; any other JSON `icon` is ignored. Options
with no icon, or an unknown name, fall back to `optionIcon`, if set.

The selected option's icon also shows inside the field until the text is
edited. Picking an option sets `selectedKey`; set `selectedKey` and
`value` together, in the same update, to show a selection made elsewhere.
In API mode such a selection shows `optionIcon`'s icon, since the
endpoint's own icon for it isn't known until it has been suggested.

Set `clearable` to show an in-field clear action whenever a value is
present.

## Install

```js
import "@f-ewald/components/autocomplete-input.js";
```

## Usage

```html
<form>
  <autocomplete-input clearable name="language" placeholder="Start typing a language…"></autocomplete-input>
</form>
<script type="module">
  import { iconGlobeAlt } from "@f-ewald/components/icons.js";

  // Local mode: filters client-side, no network request. `icon` and
  // `description` are optional.
  document.querySelector("autocomplete-input").options = [
    { key: "ts", value: "TypeScript", icon: iconGlobeAlt(14), description: "Typed superset of JavaScript" },
    { key: "py", value: "Python" },
  ];

  // API mode: omit `options` and set `endpoint` instead — it's queried as
  // `${endpoint}?${queryParam}=<text>` and must respond with [{key, value}].
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `endpoint` | `endpoint` | `string` | `""` | API endpoint queried in API mode. Ignored when `options` is set. |
| `queryParam` | `query-param` | `string` | `"q"` | Query string parameter name the current input text is sent under. |
| `options` | _(JS property only)_ | `AutocompleteOption[] | null` | `null` | Fixed candidate list to filter locally instead of fetching from `endpoint`. When set (non-null), no network request is ever made — this takes priority over the API mode. |
| `selectedKey` | `selected-key` | `string | null` | `null` | Key of the selected option: set by picking one, or by the caller together with `value`. |
| `icons` | _(JS property only)_ | `Record<string, AutocompleteIconFactory>` | `{}` | Icons an endpoint may name in an option's `icon`, e.g. `{ server: iconServer, library: iconBookOpen }`. Called with `14`. |
| `optionIcon` | _(JS property only)_ | `AutocompleteOptionIcon | null` | `null` | Icon for any option without one of its own (or whose named icon isn't in `icons`), e.g. `() => iconServer(14)`. Applies to local and API options. |
| `selectedOption` | _(JS property only)_ | `AutocompleteOption | null` | `—` | Selected option (picked, or matching `selectedKey`), or null once the input diverges from it. _(read-only)_ |
| `value` | `value` | `string` | `""` | Current input value; also the form-associated value submitted with the form. |
| `placeholder` | `placeholder` | `string` | `""` | Placeholder text shown when the input is empty. |
| `required` | `required` | `boolean` | `false` | Marks the input as required for native form validation. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the input and closes its suggestion popup. |
| `clearable` | `clearable` | `boolean` | `false` | Shows an in-field clear action while the control has a value. |
| `debounce` | `debounce` | `number` | `300` | Debounce delay (ms) before firing a request/filter after typing. |
| `minLength` | `min-length` | `number` | `3` | Minimum query length before suggestions are shown. |

## Events

| Event | Description |
| --- | --- |
| `option-select` | An option was picked; detail: AutocompleteOption. |
| `input` | Native-compatible input event fired while editing or clearing. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-regular` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
