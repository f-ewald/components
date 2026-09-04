# `<step-ladder>`

A flat ordered ladder of fallback steps — an escalating "try this first,
then move to the next rung only if it does not solve it" list. Each rung
shows a zero-padded ordinal, a bold title, and a muted description, with a
hairline rule between rows.

Feed it the `items` array for the plain data path, where each
StepLadderItem supplies a `title` and `description`, or slot bare
`<li>` steps when a rung needs links, emphasis, or other richer markup.
Slotted content takes precedence over `items`; with neither, nothing is
rendered. As with `spec-list`, richer wrapper elements are accepted too, but
those own their own inner markup.

## Install

```js
import "@f-ewald/components/step-ladder.js";
```

## Usage

```html
<step-ladder></step-ladder>
<script type="module">
  document.querySelector("step-ladder").items = [
    { title: "Does this need to exist?", description: "Speculative need = skip it." },
    { title: "Already in this codebase?", description: "Reuse the helper that already lives here." },
    { title: "Does the standard library do it?", description: "Use it." },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | `items` | `StepLadderItem[]` | `[]` | The rungs for the data-driven path. Ignored when the default slot has content. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-weight-bold` |
| `--ui-font-weight-regular` |
| `--ui-line-height-normal` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-text` |
| `--ui-text-muted` |
