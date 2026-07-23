# Record + metadata rail page

A record's read view with the main content on the left and a persistent
metadata/detail rail on the right — the Jira/Linear issue layout (description +
status, assignee, labels, priority).

**When to use:** viewing one rich record whose metadata (status, owner, labels,
progress) should stay visible alongside the content, and where that metadata is
mostly a static display of components rather than a transient selection.

## Layout

The rail is a **two-column CSS grid inside the `main` slot**, not the shell's
`detail` slot:

- `sidebar` → `app-sidebar`.
- `topbar` → `page-header` with a linked `breadcrumb` and record `actions`
  (primary Edit rightmost).
- default (`main`) → a grid: the body (description, activity) on the left, an
  `<aside>` metadata rail on the right. It collapses to one column at the shared
  48rem breakpoint so the metadata **stacks below** the content on narrow
  screens instead of hiding.

The metadata rail is composed from existing components: `frame-box` to group,
`status-pill` for status/priority/labels, `user-avatar` for people, and
`stat-meter` for progress. Activity uses `chat-message`.

## Markup

```html
<app-shell style="height: 100vh">
  <app-sidebar slot="sidebar"><!-- nav items --></app-sidebar>

  <page-header slot="topbar" heading="Fix flaky login redirect">
    <nav slot="breadcrumb" aria-label="Breadcrumb"><a href="/board">Board</a> / PROJ-142</nav>
    <ui-button slot="actions" variant="primary">Edit</ui-button>
  </page-header>

  <div class="ticket">
    <div class="ticket-body">
      <h3>Description</h3>
      <p>…</p>
      <frame-box label="Activity">
        <chat-message role="user" author="Ada Lovelace">…</chat-message>
      </frame-box>
    </div>

    <aside class="ticket-meta" aria-label="Issue details">
      <frame-box label="Details">
        <dl class="meta">
          <div class="meta-row"><dt>Status</dt><dd><status-pill label="In Progress" color="info"></status-pill></dd></div>
          <div class="meta-row"><dt>Assignee</dt><dd><user-avatar name="Ada Lovelace" size="24"></user-avatar> Ada Lovelace</dd></div>
          <div class="meta-row"><dt>Priority</dt><dd><status-pill label="High" color="warning"></status-pill></dd></div>
        </dl>
        <stat-meter label="Progress" percent="60"></stat-meter>
      </frame-box>
    </aside>
  </div>
</app-shell>
```

```css
.ticket {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 48rem) {
  .ticket { grid-template-columns: minmax(0, 1fr); }
}
```

## Notes

- Use the two-column grid inside `main` (not the shell `detail` slot) when the
  metadata is **persistent** and should stack on mobile. The shell's `detail`
  slot is for a **transient master-detail selection** (list + selected item): on
  mobile it becomes a dismissible overlay, which hides persistent record
  metadata. Reach for it in the list + detail template, not here.
- Editable metadata is a drop-in swap: replace a `status-pill` with a
  `form-select`, or the label pills with a `multi-select`.
- Keep the record actions in the header (primary Edit); there is no
  `form-actions` footer on a read view.

**Live demo:** `demo/layouts/record-detail.html`

**Components:** app-shell, app-sidebar, page-header, frame-box, status-pill, user-avatar, stat-meter, chat-message
