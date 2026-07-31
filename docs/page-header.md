# `<page-header>`

Page title block for the top of a dashboard view: an optional breadcrumb
trail, the page heading with a right-aligned cluster of page-level actions
beside it, and an optional description of what the page is for underneath.
The actions sit in the title row rather than beside the whole block, so a
longer or wrapping description never moves them. It only lays these out —
the breadcrumb links and action buttons are entirely the consumer's, so it
stays framework- and router-agnostic.

## Install

```js
import "@f-ewald/components/page-header.js";
```

## Usage

```html
<page-header heading="Team members" description="Everyone with access to this workspace.">
  <nav slot="breadcrumb" aria-label="Breadcrumb">Home / Settings / Members</nav>
  <ui-button slot="actions" variant="primary">Invite</ui-button>
</page-header>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The page heading text. |
| `description` | `description` | `string` | `""` | Optional supporting line under the heading, explaining what the page does. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-text` |
| `--ui-text-muted` |
