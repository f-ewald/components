# `<blink-cursor>`

A small inline blinking cursor glyph for terminal- or editor-styled
headings, prompts, and status lines. It renders its own decorative
character so consumers can append it directly to adjacent text while
inheriting the surrounding typography.

The cursor uses the shared `--ui-primary` accent color so it reads as an
active insertion point across themes. Change `char` to swap the glyph (for
example `|` or `▋`). Under `prefers-reduced-motion` the blink stops and the
cursor remains visible.

## Install

```js
import "@f-ewald/components/blink-cursor.js";
```

## Usage

```html
<h1>ponytail<blink-cursor></blink-cursor></h1>
<p>~/ponytail &#10095; <blink-cursor char="|"></blink-cursor></p>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `char` | `char` | `string` | `"▋"` | Character shown for the cursor; any single character or short string such as `|` or `▋` works. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-line-height-glyph` |
| `--ui-primary` |
