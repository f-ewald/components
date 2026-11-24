# `<floating-text>`

Text whose last few characters float up and away as it scrolls into view,
then bob gently in place, as though gravity let go of the end of the word.
The lift follows the scroll position smoothly; a sudden jump (a page load
with the text already visible, or a fast scroll) holds for a moment, then
floats the characters up over about a second and a half. Scrolling back
down below the text lets them settle again.

The text is the element's own text content, rendered in the surrounding
font and color — wrap it in a heading to size it. Each floating character
lifts further than the one before it (the last by `lift`), tilting
slightly about its bottom edge. Assistive technology reads the text as one
word. Under `prefers-reduced-motion: reduce` the characters sit in their
floated positions without animating.

## Install

```js
import "@f-ewald/components/floating-text.js";
```

## Usage

```html
<h1><floating-text>Antigravity</floating-text></h1>

<!-- Float the last five characters, higher -->
<h2><floating-text float-count="5" lift="0.8">Weightless</floating-text></h2>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `floatCount` | `float-count` | `number` | `3` | How many trailing characters float away. |
| `lift` | `lift` | `number` | `0.45` | How far the last character rises when fully floated, in `em`. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
