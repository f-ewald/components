# `<link-card>`

A single linked-resource tile — logo (or an initial-letter fallback),
heading, optional description, and an optional reachability status dot.
Renders as a real `<a>` (opening in a new tab) when `href` is set, or a
non-interactive `<div>` otherwise. Meant to be laid out inside
`card-grid`, mirroring how `gallery-item` pairs with `photo-gallery`.

## Install

```js
import "@f-ewald/components/link-card.js";
```

## Usage

```html
<link-card
  heading="Grafana"
  description="Metrics dashboards."
  href="https://grafana.example.com"
  logo="/logos/grafana.svg"
  status="up"
></link-card>
<link-card heading="Backup Server" description="Nightly restic snapshots." status="checking"></link-card>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | Card title. |
| `description` | `description` | `string` | `""` | Optional supporting text shown below the heading. |
| `href` | `href` | `string` | `""` | Destination URL. When set, the card renders as a link (opened in a new tab); when unset, a non-interactive tile. |
| `logo` | `logo` | `string` | `""` | Logo image URL. Falls back to the first letter of `heading` if unset or it fails to load. |
| `status` | `status` | `LinkCardStatus` | `""` | Reachability state for the corner status dot. `""` (default) renders no dot. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-lg` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-radius` |
| `--ui-radius-pill` |
| `--ui-shadow` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
