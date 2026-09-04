# `<code-diff>`

A compact, read-only code diff viewer: a bordered panel with a header bar
for `filename` and `stat`, followed by a numbered `<pre>` listing of
`lines`. Each CodeDiffLine renders as `"add"`, `"del"`, or
`"context"` with fixed `"+ "` / `"- "` / `"  "` prefixes so the diff
remains understandable even when color is unavailable.

Added and removed rows reuse `--ui-success` / `--ui-danger` for their text
and low-alpha background washes, while the shell itself reuses
`--ui-font-mono`, `--ui-border`, and `--ui-surface`. The caller owns the
data shape entirely: `filename` and `stat` are passed through verbatim, and
`lines` is a flat ordered array of `{ type, text }` objects.

## Install

```js
import "@f-ewald/components/code-diff.js";
```

## Usage

```html
<code-diff filename="cache.py" stat="&minus;48  +1"></code-diff>
<script type="module">
  document.querySelector("code-diff").lines = [
    { type: "del", text: "class CacheManager:" },
    { type: "add", text: "@lru_cache(maxsize=1000)" },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `filename` | `filename` | `string` | `""` | The filename shown in the header bar's left side. |
| `stat` | `stat` | `string` | `""` | The caller-supplied stat summary shown in the header bar's right side. |
| `lines` | `lines` | `CodeDiffLine[]` | `[]` | Ordered diff lines, each rendered with its type-driven prefix and styling. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-danger` |
| `--ui-font-mono` |
| `--ui-font-size-sm` |
| `--ui-line-height-normal` |
| `--ui-numeric` |
| `--ui-radius` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
