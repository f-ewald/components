# List-only page

A full-width list/table view: a collapsible sidebar, a top bar, an action row,
the list, and pagination. The default internal-dashboard "index" screen.

**When to use:** browsing or managing a collection of records where a row does
not need a side-by-side detail pane (rows link to their own detail page). If you
want an inline detail pane, use the list + detail template instead.

## Shell slots

- `sidebar` → `app-sidebar` with the app's navigation.
- `topbar` → `page-header` with the collection title and, optionally, its
  `actions` slot holding a dismissible `popover-panel` and/or a fullscreen
  `modal-dialog` trigger.
- default (`main`) → an `action-bar` above a `data-table`.
- `footer` → `pagination-nav`.

## Markup

```html
<app-shell style="height: 100vh">
  <app-sidebar slot="sidebar"><!-- nav items --></app-sidebar>

  <page-header slot="topbar" heading="Members">
    <div slot="actions" style="display: flex; align-items: center; gap: 0.5rem;">
      <ui-button id="fullscreen-report-open" size="sm" variant="secondary">Full report</ui-button>
      <modal-dialog id="fullscreen-report" heading="Members — full report" size="fullscreen">
        <div style="padding: 1rem;">
          <data-table style="display: block;"></data-table>
        </div>
      </modal-dialog>

      <div style="position: relative; display: inline-block;">
        <icon-button id="quick-actions-trigger" label="Quick actions"></icon-button>
        <popover-panel id="quick-actions-popover" heading="Quick actions">
          <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem;">
            <ui-button size="sm" variant="secondary">Export CSV</ui-button>
            <ui-button size="sm" variant="secondary">Import CSV</ui-button>
          </div>
        </popover-panel>
      </div>
    </div>
  </page-header>

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
- The `popover-panel` trigger needs a `position: relative` wrapper around both
  the trigger and the panel — the panel anchors to that ancestor, not to
  `page-header` itself. Toggle `.open` on click and set it back to `false` on
  the panel's `panel-close` event (fired on outside click, Escape, or its own
  close button) — `popover-panel` never closes itself.
- For a full-viewport overlay, use `modal-dialog` with `size="fullscreen"`
  instead of growing `popover-panel` — `popover-panel`'s `centered` mode tops
  out at a 25rem card, and `modal-dialog` already owns the fullscreen/lg/default
  sizing plus the same focus-trap/Escape/layer-stack behavior. It needs no
  positioning wrapper (it's a fixed, viewport-relative overlay) and is wired
  the same way: toggle `.open` on click, reset it to `false` on `panel-close`.

**Live demo:** `demo/layouts/list-only.html`

**Components:** app-shell, app-sidebar, page-header, action-bar, data-table, pagination-nav, icon-button, popover-panel, modal-dialog
