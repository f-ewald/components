# `<user-avatar>`

Circular avatar. Shows `src` when it loads successfully; falls back to the
first letter of `name` (uppercased) if `src` is unset or fails to load
(e.g. an expired OAuth profile-photo URL); falls back further to a generic
person icon if `name` is also unset. A broken image never leaves a blank
circle.

## Install

```js
import "@f-ewald/components/user-avatar.js";
```

## Usage

```html
<user-avatar src="https://example.com/photo.jpg" name="Freddy" size="40"></user-avatar>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `src` | `src` | `string | null` | `null` | Image URL to show. Falls back to initials/icon if unset or it fails to load. |
| `name` | `name` | `string | null` | `null` | Source string for the fallback initial (e.g. a display name or email) — first character, uppercased. |
| `size` | `size` | `number` | `32` | Diameter in CSS pixels. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-primary` |
