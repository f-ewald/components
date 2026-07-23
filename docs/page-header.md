# `<page-header>`

Page title block for the top of a dashboard view: an optional breadcrumb
trail, the page heading, and a right-aligned cluster of page-level actions.
It only lays these out — the breadcrumb links and action buttons are entirely
the consumer's, so it stays framework- and router-agnostic.

## Install

```js
import "@f-ewald/components/page-header.js";
```

## Usage

```html
<page-header heading="Team members">
  <nav slot="breadcrumb" aria-label="Breadcrumb">Home / Settings / Members</nav>
  <ui-button slot="actions" variant="primary">Invite</ui-button>
</page-header>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The page heading text. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-tight` |
| `--ui-text` |
| `--ui-text-muted` |
