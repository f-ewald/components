# `<markdown-view>`

Renders a markdown string as sanitized, styled HTML — headings, lists,
code, tables, blockquotes, and links all get token-driven styling, with
wide content (code blocks, tables) scrolling in its own container instead
of widening the page.

The markdown source is treated as untrusted: it is always parsed with
`marked` and sanitized with `DOMPurify` before being injected, never
rendered as-is.

## Install

```js
import "@f-ewald/components/markdown-view.js";
```

## Usage

```html
<markdown-view></markdown-view>
<script type="module">
  const el = document.querySelector("markdown-view");
  el.markdown = `## Release notes

- Added **markdown-view**
- Fixed a table alignment bug

\`\`\`ts
const x = 1;
\`\`\`

| Component | Status |
| --- | --- |
| markdown-view | New |

See the [changelog](#markdown-view) for details.`;
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `markdown` | `markdown` | `string` | `""` | Raw markdown source to render. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-mono` |
| `--ui-font-size` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
