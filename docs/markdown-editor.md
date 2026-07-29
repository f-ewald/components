# `<markdown-editor>`

GitHub-style markdown editor: a "Write" tab holding a plain textarea and a
"Preview" tab rendering the markdown body (via `markdown-view`). Leading
YAML front matter (a `---`-delimited block) is detected, parsed, and shown
as a key-value table above the rendered body rather than as raw text.

## Install

```js
import "@f-ewald/components/markdown-editor.js";
```

## Usage

```html
<markdown-editor></markdown-editor>
<script type="module">
  const el = document.querySelector("markdown-editor");
  el.value = `---
title: Weekly status
author: Ada Lovelace
tags: [engineering, updates]
---

# Weekly status

Some **markdown** content here.`;
  el.addEventListener("input", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Full raw document text, including any front matter block. |
| `rows` | `rows` | `number` | `12` | Visible row count for the Write tab's textarea. |
| `placeholder` | `placeholder` | `string` | `""` | Placeholder text shown when the Write tab is empty. |

## Events

| Event | Description |
| --- | --- |
| `input` | Fires on every keystroke in the Write tab; detail: { value: string }. |
| `change` | Native change semantics (on blur, if the value changed); detail: { value: string }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-normal` |
| `--ui-text` |
| `--ui-text-muted` |
