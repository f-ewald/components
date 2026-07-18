# `<ui-button>`

Button (or link styled as one) with an optional leading icon, in three
visual weights. Set `href` to render an `<a>` instead of a `<button>` —
same styling either way — for cross-page navigation that should look like
an action button; a disabled/busy link stays a real `<a>` with
`aria-disabled` + `pointer-events: none` rather than losing its href.
Put the icon in the `icon` slot and the label in the default slot.

Form-associated (`type="submit"`/`"reset"`): the actual `<button>` lives in
this element's shadow root, which native HTML form association does not
cross into from an ancestor light-DOM `<form>`. `type="submit"`/`"reset"`
is instead wired through `ElementInternals.form` — the same mechanism
`address-autocomplete` uses to associate with an ancestor form.

## Install

```js
import "@f-ewald/components/ui-button.js";
```

## Usage

```html
<ui-button variant="primary">
  <span slot="icon">...</span>
  New property
</ui-button>
<ui-button variant="danger">Delete</ui-button>
<ui-button variant="secondary" href="/properties?edit=42">Edit</ui-button>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `ButtonVariant` | `"primary"` | Visual weight. |
| `href` | `href` | `string | null` | `null` | Renders an `<a href="...">` instead of a `<button>` when set. |
| `type` | `type` | `"button" | "submit" | "reset"` | `"button"` | Native button `type`. Ignored when `href` is set. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the control and dims it. |
| `busy` | `busy` | `boolean` | `false` | Shows a spinner in place of the icon slot and disables the control. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Button label. |
| `icon` | Optional leading icon (e.g. an inline SVG). |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-danger-hover` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius-sm` |
| `--ui-text` |
| `--ui-text-muted` |
