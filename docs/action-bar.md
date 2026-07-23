# `<action-bar>`

Toolbar that sits directly above a list or table: a left cluster for
search and filters and a right cluster for record actions (create, delete,
bulk actions). It's a presentational layout container only — drop any
controls (`autocomplete-input`, `multi-select`, `ui-button`, …) into the
`start` and `end` slots; the bar owns none of their behavior and adds no
search field of its own. The two clusters wrap onto separate rows when the
bar is too narrow.

## Install

```js
import "@f-ewald/components/action-bar.js";
```

## Usage

```html
<action-bar>
  <autocomplete-input slot="start" placeholder="Search…"></autocomplete-input>
  <ui-button slot="end" variant="secondary">Delete</ui-button>
  <ui-button slot="end" variant="primary">Create</ui-button>
</action-bar>
```

## Attributes / properties

_None._

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
