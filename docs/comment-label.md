# `<comment-label>`

A code-comment-style eyebrow line for section chrome in terminal- or
editor-themed pages. It renders a colored comment marker (`##` by default)
before muted slotted text, so `<comment-label>the_whole_idea</comment-label>`
reads like a short section kicker. Set `prefix="//"` and `italic` for a
closing or footer quote line that keeps the marker upright while the message
itself turns italic.

## Install

```js
import "@f-ewald/components/comment-label.js";
```

## Usage

```html
<comment-label>the_whole_idea</comment-label>
<comment-label prefix="//" italic>the best code is the code never written.</comment-label>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `prefix` | `prefix` | `string` | `"##"` | Comment marker rendered before the slotted label text. |
| `italic` | `italic` | `boolean` | `false` | Renders the slotted label text in italics while leaving the prefix upright. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font-mono` |
| `--ui-font-size-sm` |
| `--ui-font-weight-semibold` |
| `--ui-label-transform` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
