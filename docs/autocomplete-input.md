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

## Install

```js
import "@f-ewald/components/autocomplete-input.js";
```

## Usage

```html
<form>
  <autocomplete-input name="language" placeholder="Start typing a language…"></autocomplete-input>
</form>
<script type="module">
  // Local mode: filters client-side, no network request.
  document.querySelector("autocomplete-input").options = [
    { key: "ts", value: "TypeScript" },
    { key: "py", value: "Python" },
  ];

  // API mode: omit `options` and set `endpoint` instead — it's queried as
  // `${endpoint}?${queryParam}=<text>` and must respond with [{key, value}].
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Current input value; also the form-associated value submitted with the form. |
| `placeholder` | `placeholder` | `string` | `""` | Placeholder text shown when the input is empty. |
| `required` | `required` | `boolean` | `false` | Marks the input as required for native form validation. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the input and closes its suggestion popup. |
| `endpoint` | `endpoint` | `string` | `""` | API endpoint queried in API mode. Ignored when `options` is set. |
| `queryParam` | `query-param` | `string` | `"q"` | Query string parameter name the current input text is sent under. |
| `debounce` | `debounce` | `number` | `300` | Debounce delay (ms) before firing a request/filter after typing. |
| `minLength` | `min-length` | `number` | `3` | Minimum query length before suggestions are shown. |
| `options` | _(JS property only)_ | `AutocompleteOption[] | null` | `null` | Fixed candidate list to filter locally instead of fetching from `endpoint`. When set (non-null), no network request is ever made — this takes priority over the API mode. |
| `selectedOption` | _(JS property only)_ | `AutocompleteOption | null` | `—` | Last-picked option, or null once the input diverges from it. _(read-only)_ |

## Events

| Event | Description |
| --- | --- |
| `option-select` | An option was picked; detail: AutocompleteOption. |

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
