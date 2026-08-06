# `<toast-notification>`

Fixed-position stack of dismissible notifications, anchored top-right
(top-full-width on mobile). Every toast shares one fixed width so entries
never appear narrower or wider than one another. Not wired to any app state
yet — callers add toasts imperatively via the `show()` method on a live
element reference,
e.g. `document.querySelector('toast-notification')?.show('Offline', { variant: 'error' })`,
or via the `notifySuccess`/`notifyError`/`notifyInfo` module-level helpers
exported from this file. The first argument is the required bold headline; an
optional `description` renders a smaller, non-bold second line. Each variant
leads with a matching status icon (success → check, error → exclamation
circle, info → information circle, warning → exclamation triangle). Each toast
auto-dismisses after `duration` ms and can also be dismissed via its ✕
button. Appears/disappears instantly — no slide/fade transitions.

A toast with `duration > 0` replaces its ✕ button with a countdown: a
number of seconds remaining inside a ring that fills in clockwise over
`duration`. Hovering or keyboard-focusing the toast swaps the countdown
back for the ✕ and pauses the countdown (both the visual ring/number and
the underlying auto-dismiss timer) — the toast won't disappear while
someone's reading it or has tabbed to its close button — resuming from
where it left off once the pointer/focus leaves. A `duration: 0` toast has
no countdown to show, so its ✕ is always visible, exactly as before.

Each variant's background reads a dedicated `--ui-toast-*-background` hook
(`success`/`error`/`info`/`warning`), which defaults to the flat
`--ui-success`/`--ui-danger`/`--ui-info`/`--ui-warning` tokens unchanged —
so those stay the single source of truth for every other component. A
consumer can override just these toast-specific tokens with a
`linear-gradient(...)` to opt every toast into a gradient look without
touching component markup — `gradientTokenValues` in `tokens.ts` ships
exactly this, wired up via `data-theme="gradient"` (see `tokens.css`'s
"Gradient theme" section), the same mechanism `ui-button` uses.
`--ui-toast-highlight` (a glossy top-edge box-shadow, layered onto the
existing elevation shadow) and `--ui-toast-text-shadow` (legibility
against the gradient's lighter stop) round out the effect, mirroring
`ui-button`'s `--ui-button-highlight`/`--ui-button-text-shadow`.

## Install

```js
import "@f-ewald/components/toast-notification.js";
```

## Usage

```html
<toast-notification></toast-notification>
<script type="module">
  import { notifySuccess } from "@f-ewald/components/toast-notification.js";
  notifySuccess("Saved!", "Your changes are now live.");
</script>
```

## Attributes / properties

_None._

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-button-highlight` |
| `--ui-button-text-shadow` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-hover-overlay` |
| `--ui-info` |
| `--ui-line-height-glyph` |
| `--ui-line-height-normal` |
| `--ui-on-accent` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-success` |
| `--ui-text` |
| `--ui-toast-` |
| `--ui-toast-error-background` |
| `--ui-toast-highlight` |
| `--ui-toast-info-background` |
| `--ui-toast-success-background` |
| `--ui-toast-text-shadow` |
| `--ui-toast-warning-background` |
| `--ui-warning` |
