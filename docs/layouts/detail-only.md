# Detail-only page

A single record's read view: navigation, a titled header carrying the record
actions, and the record body grouped into framed sections.

**When to use:** viewing one record on its own route (linked to from a list).
Read and edit are distinct modes — keep this page read-only and let its primary
action navigate to the form page for editing.

## Shell slots

- `sidebar` → `app-sidebar`.
- `topbar` → `page-header` with a linked `breadcrumb` and the record `actions`.
- default (`main`) → the record body; group distinct sections with `frame-box`.

## Markup

```html
<app-shell style="height: 100vh">
  <app-sidebar slot="sidebar"><!-- nav items --></app-sidebar>

  <page-header slot="topbar" heading="Ada Lovelace">
    <nav slot="breadcrumb" aria-label="Breadcrumb"><a href="/members">Members</a> / Ada Lovelace</nav>
    <!-- Record actions: primary rightmost, destructive de-emphasized. -->
    <ui-button slot="actions" variant="secondary">Deactivate</ui-button>
    <ui-button slot="actions" variant="primary">Edit</ui-button>
  </page-header>

  <div style="max-width: 48rem;">
    <frame-box label="Profile"><!-- fields --></frame-box>
    <frame-box label="Access"><!-- fields --></frame-box>
  </div>
</app-shell>
```

## Notes

- Put record actions in the header, not a footer bar. The primary action (Edit)
  is the rightmost, prominent button; keep destructive actions (Deactivate,
  Delete) de-emphasized — a secondary button, or an overflow menu — and gate
  them with a `confirm-dialog`.
- Do **not** add a `form-actions` footer here. `form-actions` (Save/Cancel) is
  for the bottom of an editable form; a read view has nothing to save. Reserve
  it for the form page — which is where Edit navigates.
- Back navigation comes from the breadcrumb link, so there is no separate Close
  button.
- Constrain the record body with a `max-width` (about `40rem`–`48rem`) and fence
  distinct field groups with `frame-box`.

**Live demo:** `demo/layouts/detail-only.html`

**Components:** app-shell, app-sidebar, page-header, frame-box, ui-button
