# `<split-hero>`

Full-viewport split layout: a user-supplied photo fills one half, the
default slot (typically a sign-in/sign-up form) fills the other. Below the
shared 48rem breakpoint the photo becomes a blurred, full-bleed backdrop
behind a solid content card instead of disappearing outright.

Give the host a height the same way as `app-shell` (e.g. `height: 100vh`).

## Install

```js
import "@f-ewald/components/split-hero.js";
```

## Usage

```html
<split-hero src="/photos/coast.jpg" alt="Coastal road" style="height: 100vh">
  <form>
    <h1>Sign in</h1>
    <form-field label="Email"><input type="email" name="email" /></form-field>
    <form-field label="Password"><input type="password" name="password" /></form-field>
    <ui-button type="submit" variant="primary">Sign in</ui-button>
  </form>
</split-hero>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `src` | `src` | `string` | `""` | URL of the image filling the visual half; omit to render content full-width. |
| `alt` | `alt` | `string` | `""` | Accessible alternative text for the image; leave empty for a decorative photo. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Form or other content for the non-image half. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-radius` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
