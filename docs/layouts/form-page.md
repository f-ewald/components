# Form page

A create/edit form: navigation, a titled header, a single form grouped into
framed sections, and a `form-actions` bar with the fixed button order.

**When to use:** creating or editing one record. Keep the form in a single
column so the eye tracks one field to the next.

## Shell slots

- `sidebar` → `app-sidebar`.
- `topbar` → `page-header` with a `breadcrumb`.
- default (`main`) → one `<form>`; group fields with `frame-box` and end with
  `form-actions`.

## Markup

```html
<app-shell style="height: 100vh">
  <app-sidebar slot="sidebar"><!-- nav items --></app-sidebar>

  <page-header slot="topbar" heading="Invite member">
    <nav slot="breadcrumb" aria-label="Breadcrumb">Members / Invite</nav>
  </page-header>

  <form style="max-width: 40rem;">
    <frame-box label="Details"><!-- name, email fields --></frame-box>
    <frame-box label="Role"><!-- role field --></frame-box>

    <form-actions>
      <ui-button slot="secondary" variant="secondary">Cancel</ui-button>
      <ui-button slot="primary" type="submit" variant="primary">Send invite</ui-button>
    </form-actions>
  </form>
</app-shell>
```

## Notes

- Button order is fixed and enforced by `form-actions`: primary/submit rightmost,
  secondary/cancel to its left, any destructive action pinned far left. Never
  hand-place form buttons in a different order.
- Constrain the form with a `max-width` (about `40rem`); a full-width form on a
  wide dashboard is hard to scan.
- Group related fields with `frame-box`; keep one field per row in a single
  column.
- `ui-button type="submit"` associates with the ancestor `<form>` even from
  inside `form-actions`.

**Live demo:** `demo/layouts/form-page.html`

**Components:** app-shell, app-sidebar, page-header, frame-box, form-actions, ui-button
