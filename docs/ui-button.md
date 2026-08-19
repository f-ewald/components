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

`primary`/`danger` backgrounds read `--ui-button-background`/
`--ui-button-danger-background` (and their `-hover`/`-active`
counterparts), which default to the flat `--ui-primary`/`--ui-danger`
tokens unchanged — so `--ui-primary`/`--ui-danger` stay the single source
of truth for every other component. A consumer can override just these
button-specific tokens with a `linear-gradient(...)` to opt every
`ui-button` into a gradient look without touching component markup —
`gradientTokenValues` in `tokens.ts` ships exactly this, wired up via
`data-theme="gradient"` (see `tokens.css`'s "Gradient theme" section) —
pairing it with `--ui-button-border`/`--ui-button-danger-border` (default
`transparent`) for a defining edge a shade darker than the gradient's dark
stop, and setting the `-active` variant's stops in reverse for a
pressed/"indented" look while the button is held down. `secondary`'s
background/border read the equivalent `--ui-button-secondary-*` tokens
(shared with `confirm-dialog`'s Cancel button), defaulting to today's
transparent/bordered look, so it can be themed into a matching (e.g.
white-to-gray) gradient too.

`ai` is an orthogonal modifier rather than a fourth variant: it leaves the
variant's fill (flat or gradient-themed) untouched and only adds an
animated multi-hue ring *outside* the button box — a crisp masked edge
plus a blurred bloom behind it that fades out to transparent, so the ring
melts into the page instead of ending on a hard line. Both layers are
masked into a donut, so nothing is ever painted over the background or
label. The ring's four stops are the `--ui-ai-1`…`--ui-ai-4` tokens. It
sweeps slowly at rest, faster on hover and while `busy`, holds still while
disabled or under `prefers-reduced-motion`, and drops the bloom for a
solid `CanvasText` ring in forced-colors mode. The bloom reaches about
`0.5rem` past the control, so give an AI button that much clearance from
its neighbors and avoid `overflow: hidden` ancestors that would clip it.

Do not combine `ai` with `pill` under the gradient theme
(`data-theme="gradient"`). That theme defines a button through a darker
`--ui-button-border` edge plus a glossy top highlight; a pill's
fully-rounded silhouette runs flush against the ring around its entire
outline, so that border and gloss read as the inner edge of the rainbow
rather than as the button's own shape, and the vertical gradient fill
stops reading as a gradient at all. Use `ai` with the default
`--ui-radius-sm` corners there, and keep `ai` + `pill` for the flat theme.

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
<ui-button variant="primary" ai>Ask AI</ui-button>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `ButtonVariant` | `"primary"` | Visual weight. |
| `size` | `size` | `"sm" | "md"` | `"md"` | Size — `sm` reduces height/padding/font-size one step below the default. |
| `pill` | `pill` | `boolean` | `false` | Renders fully rounded (pill-shaped) corners instead of the default `--ui-radius-sm`. |
| `ai` | `ai` | `boolean` | `false` | Draws the animated multi-hue "AI" ring (crisp edge plus a bloom fading out to transparent) around the button, on top of whatever variant/theme it already uses. |
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
| `--ui-ai-1` |
| `--ui-ai-2` |
| `--ui-ai-3` |
| `--ui-ai-4` |
| `--ui-border` |
| `--ui-button-background` |
| `--ui-button-background-active` |
| `--ui-button-background-hover` |
| `--ui-button-border` |
| `--ui-button-danger-background` |
| `--ui-button-danger-background-active` |
| `--ui-button-danger-background-hover` |
| `--ui-button-danger-border` |
| `--ui-button-highlight` |
| `--ui-button-secondary-` |
| `--ui-button-secondary-background` |
| `--ui-button-secondary-background-active` |
| `--ui-button-secondary-background-hover` |
| `--ui-button-secondary-border` |
| `--ui-button-secondary-border-hover` |
| `--ui-button-text-shadow` |
| `--ui-danger` |
| `--ui-danger-hover` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius-pill` |
| `--ui-radius-sm` |
| `--ui-text` |
| `--ui-text-muted` |
