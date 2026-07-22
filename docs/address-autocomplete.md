# `<address-autocomplete>`

Form-associated text input with a suggestion dropdown. Works as a
drop-in replacement for a plain `<input name="address">`: consumers keep
reading `new FormData(form).get("address")` and calling `form.reset()`
unchanged.

Supports two suggestion sources:
- **API** (default): fetches from `endpoint`, a Mapbox Geocoding v6-shaped
  forward-geocode URL, debounced as the user types.
- **Local array**: set `suggestions` to a fixed `AddressSuggestion[]` and
  the component filters it client-side instead of making any network
  request. Useful for small/fixed address lists, offline use, or tests.
  Takes priority over `endpoint` whenever it's non-null.

## Install

```js
import "@f-ewald/components/address-autocomplete.js";
```

## Usage

```html
<address-autocomplete
  placeholder="Start typing an address…"
  access-token="pk.your-mapbox-token"
></address-autocomplete>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Current input value; also the form-associated value submitted with the form. |
| `placeholder` | `placeholder` | `string` | `""` | Placeholder text shown when the input is empty. |
| `required` | `required` | `boolean` | `false` | Marks the input as required for native form validation. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the input and closes its suggestion popup. |
| `types` | `types` | `string` | `"address"` | Mapbox `types` param, e.g. "address" or "address,poi". |
| `endpoint` | `endpoint` | `string` | `"https://api.mapbox.com/search/geocode/v6/forward"` | Geocoding endpoint URL. Defaults to the Mapbox Geocoding v6 forward URL. |
| `accessToken` | `access-token` | `string` | `""` | Mapbox access token. Required for requests to succeed. |
| `bbox` | `bbox` | `string` | `""` | Optional bounding box bias, comma-separated `west,south,east,north`. |
| `proximity` | `proximity` | `string` | `""` | Optional proximity bias, comma-separated `lng,lat`. |
| `debounce` | `debounce` | `number` | `300` | Debounce delay (ms) before firing a geocode request after typing. |
| `minLength` | `min-length` | `number` | `3` | Minimum query length before suggestions are fetched. |
| `suggestions` | _(JS property only)_ | `AddressSuggestion[] | null` | `null` | Fixed candidate list to filter locally instead of fetching from `endpoint`. When set (non-null), no network request is ever made — this takes priority over the API mode. |
| `selectedSuggestion` | _(JS property only)_ | `AddressSuggestion | null` | `—` | Last-picked suggestion, or null once the input diverges from it. _(read-only)_ |

## Events

| Event | Description |
| --- | --- |
| `address-select` | A suggestion was picked; detail: AddressSuggestion. |

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
