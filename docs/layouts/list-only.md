# List-only page

A full-width list/table view: a collapsible sidebar, a top bar, an action row,
the list, and pagination. The default internal-dashboard "index" screen.

**When to use:** browsing or managing a collection of records where a row does
not need a side-by-side detail pane (rows link to their own detail page). If you
want an inline detail pane, use the list + detail template instead.

## Shell slots

- `sidebar` → `app-sidebar` with the app's navigation.
- `topbar` → `page-header` with the collection title (and optional actions).
- default (`main`) → an `action-bar` above a `data-table`.
- `footer` → `pagination-nav`.

## Markup

```html
<app-shell style="height: 100vh">
  <app-sidebar slot="sidebar"><!-- nav items --></app-sidebar>

  <page-header slot="topbar" heading="Members"></page-header>

  <div>
    <action-bar>
      <autocomplete-input slot="start" placeholder="Search…"></autocomplete-input>
      <ui-button slot="end" variant="secondary">Filter</ui-button>
      <ui-button slot="end" variant="primary">Create</ui-button>
    </action-bar>
    <data-table style="margin-top: 1rem; display: block;"></data-table>
  </div>

  <pagination-nav slot="footer" current-page="1" total-pages="6"></pagination-nav>
</app-shell>
```

## Notes

- Give `app-shell` a height (e.g. `100vh`) so the sidebar and main can size and
  scroll independently.
- `pagination-nav` is controlled: set `current-page`/`total-pages` and re-render
  in response to its `page-change` event, the same way `data-table` leaves the
  rows to you.
- Put search and filters in the action bar's `start` slot and record actions
  (create, delete) in `end`.

**Live demo:** `demo/layouts/list-only.html`

**Components:** app-shell, app-sidebar, page-header, action-bar, data-table, pagination-nav
