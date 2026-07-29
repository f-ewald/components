# `<tab-item>`

A single labeled panel inside a `tab-bar`. Renders its default slot as an
ARIA `tabpanel`, shown or hidden based on `selected` — `tab-bar` reads
`label`/`value` to build its tab strip and toggles `selected` on the
active panel.

## Install

```js
import "@f-ewald/components/tab-item.js";
```

## Usage

```html
<tab-item></tab-item>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Text shown in the tab-bar's tab button for this panel. |
| `value` | `value` | `string` | `""` | Stable identifier reported in `tab-bar`'s `change` event; defaults to `label`. |
| `selected` | `selected` | `boolean` | `false` | Whether this panel is the active one; `tab-bar` owns this. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Panel content, shown only while `selected`. |

## CSS custom properties

_None._
