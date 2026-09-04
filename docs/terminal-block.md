# `<terminal-block>`

A headless, data-driven terminal transcript shell for short install or usage
instructions. Callers provide a flat ordered `lines` array of
`TerminalLine` objects, and the component renders each line exactly in that
order with a type-driven visual treatment: `"prompt"` lines get a fixed
leading `❯` marker in `--ui-primary`, `"comment"` lines render as dim italic
guidance, and `"output"` lines render as plain terminal text.

The panel deliberately stays dark regardless of the surrounding page theme:
it reuses `--ui-tooltip` for the surface and `--ui-tooltip-text` for the
main foreground (not `--ui-on-accent` — that token means "text on a solid
*semantic* fill" and a theme is free to darken it for a light accent color,
whereas `--ui-tooltip`'s own fill stays dark unconditionally), because this
is meant to read as "the terminal" rather than as a normal page card that
follows the ambient surface palette.

An empty `lines` array still renders the bordered, padded shell so consumers
can see that an instruction block is present but currently has no transcript
content, rather than having the component silently disappear.

## Install

```js
import "@f-ewald/components/terminal-block.js";
```

## Usage

```html
<terminal-block></terminal-block>
<script type="module">
  document.querySelector("terminal-block").lines = [
    { type: "comment", text: "# Claude Code" },
    { type: "prompt", text: "/plugin marketplace add example/example" },
    { type: "prompt", text: "/plugin install example@example" },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `lines` | `lines` | `TerminalLine[]` | `[]` | Ordered terminal transcript lines. Each entry is a `{ type, text }` object, and an empty array still renders the visible terminal shell. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-font-mono` |
| `--ui-font-size` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-on-accent` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-tooltip` |
| `--ui-tooltip-text` |
