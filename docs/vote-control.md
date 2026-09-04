# `<vote-control>`

An up/down vote widget with a live score readout — the "vote an entry up or
down toward a promotion threshold" pattern from a public register site,
where one member casts a single vote that can be changed or withdrawn at any
time. Two native `<button>`s flank a score; the button matching the user's
own cast `vote` reads as pressed (`aria-pressed`), and clicking it again
withdraws the vote. Set an optional `target` to render a thin progress meter
toward the promotion threshold beneath (vertical) or beside (horizontal) the
buttons.

## Install

```js
import "@f-ewald/components/vote-control.js";
```

## Usage

```html
<vote-control value="7" target="10" label="Vote for this entry"></vote-control>
<vote-control orientation="horizontal" value="42" target="50"></vote-control>
<vote-control value="3" disabled></vote-control>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `number` | `0` | The current net score shown between the buttons. |
| `vote` | `vote` | `"up" | "down" | null` | `null` | This user's own cast vote, or `null` if they have not voted. Reflected so CSS can style the pressed button. |
| `disabled` | `disabled` | `boolean` | `false` | Disables both buttons and dims the control. |
| `orientation` | `orientation` | `"vertical" | "horizontal"` | `"vertical"` | Layout — `vertical` is the compact stacked box (default); `horizontal` is the wide inline variant. |
| `target` | `target` | `number` | `0` | Promotion threshold. When > 0, a thin progress meter toward it renders; when 0 (default) no meter renders and no space is reserved for it. |
| `label` | `label` | `string` | `"Vote"` | Accessible label naming the vote group. |

## Events

| Event | Description |
| --- | --- |
| `vote-change` | The user cast, switched, or withdrew their vote; detail: { vote: "up" | "down" | null, value: number }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-button-accent` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-lg` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-label-transform` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-pill` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
