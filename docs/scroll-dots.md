# `<scroll-dots>`

Vertical section navigator for a long scrolled page or a slide deck: one dot
per section, the active one drawn as an elongated rounded bar rather than a
dot, which is the only cue needed to read position at a glance.

Controlled, like `pagination-nav`: it owns no scroll behavior and never
reads the scroll position. The consumer sets `active` and moves the page in
response to `dot-select` — what counts as the active section differs too much
between a snapped deck and an ordinary long page to bake in.

Positioning is also the consumer's, since a rail is normally fixed into a
reserved gutter that only the page knows the width of.

The dots use the same lighter-on-top gradient as `map-circle`/`map-pin`,
derived from a single base `color` — a rail beside a map reads as the same
family of marks as the pins on it.

## Install

```js
import "@f-ewald/components/scroll-dots.js";
```

## Usage

```html
<scroll-dots label="Journey stops"></scroll-dots>
<script type="module">
  const rail = document.querySelector('scroll-dots');
  rail.items = ['Intro', 'Freiburg', 'Berkeley', { label: 'Credits', muted: true }];
  rail.active = 0;
  rail.addEventListener('dot-select', (e) => {
    rail.active = e.detail.index;
    sections[e.detail.index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | _(JS property only)_ | `ScrollDotsItem[]` | `[]` | Dots to render, in document order. A bare string is shorthand for `{ label }`. |
| `active` | `active` | `number` | `0` | 0-based index of the active dot. Out-of-range values simply match no dot. |
| `color` | `color` | `string` | `""` | Base color the dot gradient is derived from. Empty uses `--ui-primary`. |
| `label` | `label` | `string` | `""` | Accessible name for the rail, e.g. "Journey stops". |

## Events

| Event | Description |
| --- | --- |
| `dot-select` | The user picked a dot (`detail: { index }`). |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-primary` |
| `--ui-text-muted` |
