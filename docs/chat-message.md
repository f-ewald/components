# `<chat-message>`

One conversation entry in a chat-style activity feed. Tool calls and
"thinking" traces are variants of this component rather than separate
ones — they share the same header, collapse behavior, and body card as a
normal message, just dimmed and collapsible with an always-visible summary.

## Install

```js
import "@f-ewald/components/chat-message.js";
```

## Usage

```html
<chat-message role="user" author="Freddy" timestamp="2026-07-19T12:00:00Z">
  Write notes.md containing a haiku.
</chat-message>
<chat-message role="agent" variant="tool" collapsible collapsed summary='file_write · {"filename": "notes.md"}'>
  directory: .
  filename: notes.md
</chat-message>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `role` | `role` | `ChatMessageRole` | `"agent"` | Whose message this is; drives the card background/border. |
| `variant` | `variant` | `ChatMessageVariant` | `"normal"` | `tool`/`thinking` render dimmed and smaller, with `tool` using monospace for its body. |
| `author` | `author` | `string` | `""` | Header label, e.g. "Freddy" or "Architect". |
| `timestamp` | `timestamp` | `string | null` | `null` | ISO-8601 timestamp, rendered via `relative-time` in the header. |
| `summary` | `summary` | `string` | `""` | Always-visible one-liner for `tool`/`thinking` variants (e.g. a truncated args preview). |
| `collapsible` | `collapsible` | `boolean` | `false` | Whether clicking the header/summary toggles the body slot. |
| `collapsed` | `collapsed` | `boolean` | `false` | Current collapse state (reflected as an attribute). |

## Events

| Event | Description |
| --- | --- |
| `toggle` | Fired with `{ collapsed: boolean }` when the header/summary is clicked in collapsible mode. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
