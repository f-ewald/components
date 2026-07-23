# List + detail page

A master-detail dashboard: the list-only page plus a right-hand detail column.
Selecting a row shows its detail beside the list on desktop and as an overlay on
narrow screens.

**When to use:** triaging or editing records where keeping the list visible
while inspecting one item speeds up the workflow (inbox-style screens, admin
record management).

## Shell slots

- `sidebar` → `app-sidebar`.
- `topbar` → `page-header`.
- default (`main`) → `action-bar` + `data-table`.
- `detail` → the selected record's detail; shown when `detail-open` is set.
- `footer` → `pagination-nav`.

## Markup

```html
<app-shell detail-width="comfortable" style="height: 100vh">
  <app-sidebar slot="sidebar"><!-- nav items --></app-sidebar>
  <page-header slot="topbar" heading="Members"></page-header>

  <div>
    <action-bar>
      <autocomplete-input slot="start" placeholder="Search…"></autocomplete-input>
      <ui-button slot="end" variant="primary">Create</ui-button>
    </action-bar>
    <data-table style="margin-top: 0.5rem; display: block;"></data-table>
  </div>

  <div slot="detail" style="padding: 1rem;"><!-- selected record --></div>

  <pagination-nav slot="footer" current-page="1" total-pages="6"></pagination-nav>
</app-shell>
```

## Notes

- Set `detail-open` on `app-shell` to reveal the detail column; clear it (or
  listen for the `detail-close` event, fired when the mobile scrim/Escape
  dismisses the overlay) to hide it.
- Wire a row selection (e.g. `data-table`'s `rowHref` + a hash listener, or your
  router) to populate the detail slot and open it.
- `detail-width` is `compact` (20rem) or `comfortable` (25rem); below 48rem the
  detail becomes an overlay regardless.

**Live demo:** `demo/layouts/list-detail.html`

**Components:** app-shell, app-sidebar, page-header, action-bar, data-table, pagination-nav
