# `<form-actions>`

Form footer button bar with a fixed action order for internal apps: the
primary (submit) button is always rightmost, the secondary (cancel) button
sits to its immediate left, and an optional tertiary/destructive action is
pinned to the far left. The order is enforced by the component regardless of
the source order the buttons are authored in, so every form in a product
reads the same way.

Purely presentational: it lays out whatever controls (usually `ui-button`)
are slotted and never intercepts their clicks, `type="submit"`, or events.

## Install

```js
import "@f-ewald/components/form-actions.js";
```

## Usage

```html
<form-actions>
  <ui-button slot="start" variant="danger">Delete</ui-button>
  <ui-button slot="secondary" variant="secondary">Cancel</ui-button>
  <ui-button slot="primary" type="submit" variant="primary">Save</ui-button>
</form-actions>
```

## Attributes / properties

_None._

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
