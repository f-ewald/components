# `<load-more>`

Click-to-load button for either end of a list. Fully property-driven: the
consumer sets `loading` while a fetch is in flight and `exhausted` once
there's nothing left to load; this component never fetches or manages
state itself.

## Install

```js
import "@f-ewald/components/load-more.js";
```

## Usage

```html
<load-more direction="top" label="Load older"></load-more>
<load-more></load-more>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `direction` | `direction` | `"top" | "bottom"` | `"bottom"` | Which end of a list this instance loads more content for. |
| `loading` | `loading` | `boolean` | `false` | Consumer-managed busy flag, forwarded to the internal `ui-button`'s `busy`. |
| `exhausted` | `exhausted` | `boolean` | `false` | Terminal "no more content" state: disables the button and swaps its label. |
| `label` | `label` | `string` | `"Load more"` | Button text in the normal (loadable) state. |
| `exhaustedLabel` | `exhausted-label` | `string` | `"No more results"` | Button text shown once `exhausted` is true. |

## Events

| Event | Description |
| --- | --- |
| `load-more` | The button was clicked while not `loading`/`exhausted`; detail: `{ direction }`. |

## Slots

_None._

## CSS custom properties

_None._
