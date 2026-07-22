# `<kbd-hint>`

Renders a keyboard shortcut as one boxed keycap per `+`-separated token.
Modifier keys are platform-aware: `Mod` becomes Command on macOS and
Control elsewhere. Keycaps derive their presentation from `currentColor`,
so the hint works inside neutral and accent-colored controls.

## Install

```js
import "@f-ewald/components/kbd-hint.js";
```

## Usage

```html
<kbd-hint keys="Mod+K"></kbd-hint>
<kbd-hint keys="Mod+Shift+Enter" platform="mac"></kbd-hint>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `keys` | `keys` | `string` | `""` | Shortcut as case-insensitive, `+`-separated tokens, e.g. `"Mod+Enter"`. |
| `platform` | `platform` | `KbdPlatform` | `"auto"` | Platform override; `auto` detects macOS from the browser. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font-mono` |
| `--ui-font-size-xs` |
| `--ui-radius-sm` |
