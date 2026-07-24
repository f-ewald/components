#!/usr/bin/env node
// Reads custom-elements.json (produced by `npm run analyze`) and writes
// docs/<tag-name>.md per component plus llms.txt at the repo root.
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const docsDir = path.join(rootDir, "docs");
const siteDir = path.join(rootDir, "pages-dist");
const args = process.argv.slice(2);

if (args.length > 1 || (args.length === 1 && args[0] !== "--site")) {
  throw new Error("Usage: node scripts/generate-docs.mjs [--site]");
}

const siteOnly = args[0] === "--site";

/** Slots aren't auto-detected by the analyzer without JSDoc @slot tags, so
 * they're curated here — the set is small and stable. */
const SLOTS = {
  "reveal-button": [{ name: "(default)", description: "Content to reveal when clicked." }],
  "photo-gallery": [
    { name: "(default)", description: "Declarative `gallery-item` elements rendered as slides." },
  ],
  "gallery-item": [
    { name: "(default)", description: "Optional `gallery-item-variant` responsive image sources." },
  ],
  "confirm-dialog": [{ name: "(default)", description: "Dialog body content." }],
  "slide-panel": [
    { name: "(default)", description: "Panel body content." },
    { name: "title", description: "Overrides the header title text (falls back to the `heading` property)." },
  ],
  "ui-button": [
    { name: "(default)", description: "Button label." },
    { name: "icon", description: "Optional leading icon (e.g. an inline SVG)." },
  ],
  "map-pin": [
    { name: "(default)", description: "Badge content shown centered on the pin's circular head — a rank number, an emoji, a small icon." },
  ],
  "map-circle": [
    { name: "(default)", description: "Optional badge content shown centered on the circle — a rank number, an emoji, a small icon." },
  ],
  "popover-panel": [
    { name: "(default)", description: "Popover body content." },
    { name: "title", description: "Overrides the plain `heading` text with custom markup." },
    { name: "actions", description: "Extra header controls (e.g. an icon+label link) rendered between the title and the close button." },
  ],
  "calendar-entry": [
    { name: "title", description: "Plain-text title shown instead of the `label` fallback." },
    {
      name: "detail",
      description: "Repeatable plain-text details rendered inside the shared body spanning all remaining days.",
    },
    { name: "footer", description: "Plain-text ending note pinned to the bottom of the shared body." },
  ],
  "calendar-month": [
    { name: "(default)", description: "Declarative `calendar-entry` elements to render for this month." },
  ],
  "calendar-year": [
    {
      name: "(default)",
      description: "Declarative `calendar-entry` elements spanning the displayed year, re-projected into each month.",
    },
  ],
};

/** Metadata-only components are demonstrated through their visual parent. */
const PLAYGROUND_ANCHORS = {
  "calendar-entry": "calendar-month",
  "gallery-item": "photo-gallery",
  "gallery-item-variant": "photo-gallery",
  "kanban-card": "kanban-board",
  "kanban-column": "kanban-board",
  "timeline-entry": "timeline-container",
};

/** One copy-paste usage example per component, mirroring the playground snippets. */
const EXAMPLES = {
  "content-divider": `<content-divider></content-divider>

<content-divider label="OR"></content-divider>`,
  "timeline-container": `<timeline-container>
  <timeline-entry datetime="2026-07-23T09:00:00Z">
    <span slot="headline">Deployment started</span>
    Release v1.4.0 is rolling out.
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:45:00Z">
    <span slot="headline">Review approved</span>
    <status-pill label="In Review" color="info"></status-pill>
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:30:00Z">
    <!-- chat-message's own timestamp is left unset: timeline-entry already shows one -->
    <chat-message role="user" author="Freddy">Ship it.</chat-message>
  </timeline-entry>
</timeline-container>`,
  "timeline-entry": `<timeline-entry datetime="2026-07-23T09:00:00Z">
  <span slot="headline">Deployment started</span>
  Release v1.4.0 is rolling out to production.
</timeline-entry>`,
  "action-bar": `<action-bar>
  <autocomplete-input slot="start" placeholder="Search…"></autocomplete-input>
  <ui-button slot="end" variant="secondary">Delete</ui-button>
  <ui-button slot="end" variant="primary">Create</ui-button>
</action-bar>`,
  "app-shell": `<app-shell detail-open style="height: 100vh">
  <app-sidebar slot="sidebar">
    <a href="/dashboard" aria-current="page" aria-label="Dashboard">
      <!-- icon --><span style="display: var(--app-sidebar-label, inline)">Dashboard</span>
    </a>
  </app-sidebar>
  <page-header slot="topbar" heading="Members"></page-header>
  <action-bar>
    <autocomplete-input slot="start" placeholder="Search…"></autocomplete-input>
    <ui-button slot="end" variant="primary">Create</ui-button>
  </action-bar>
  <data-table></data-table>
  <div slot="detail">Selected record…</div>
  <pagination-nav slot="footer" total-pages="5"></pagination-nav>
</app-shell>`,
  "app-sidebar": `<app-sidebar>
  <a href="/dashboard" aria-current="page" aria-label="Dashboard">
    <!-- icon --><span style="display: var(--app-sidebar-label, inline)">Dashboard</span>
  </a>
  <a href="/members" aria-label="Members">
    <!-- icon --><span style="display: var(--app-sidebar-label, inline)">Members</span>
  </a>
</app-sidebar>`,
  "form-actions": `<form-actions>
  <ui-button slot="start" variant="danger">Delete</ui-button>
  <ui-button slot="secondary" variant="secondary">Cancel</ui-button>
  <ui-button slot="primary" type="submit" variant="primary">Save</ui-button>
</form-actions>`,
  "page-header": `<page-header heading="Team members">
  <nav slot="breadcrumb" aria-label="Breadcrumb">Home / Settings / Members</nav>
  <ui-button slot="actions" variant="primary">Invite</ui-button>
</page-header>`,
  "pagination-nav": `<pagination-nav current-page="1" total-pages="5"></pagination-nav>`,
  "animate-confetti": `<animate-confetti duration="6000"></animate-confetti>`,
  "reveal-button": `<reveal-button label="Show the secret">
  Surprise! This content was hidden.
</reveal-button>`,
  "gallery-item-variant": `<gallery-item-variant
  media="(max-width: 640px)"
  srcset="/photos/coast-portrait.jpg"
></gallery-item-variant>`,
  "gallery-item": `<gallery-item
  src="/photos/coast.jpg"
  alt="Rocky California coastline"
  caption="California coast"
>
  <gallery-item-variant
    media="(max-width: 640px)"
    srcset="/photos/coast-portrait.jpg"
  ></gallery-item-variant>
</gallery-item>`,
  "photo-gallery": `<photo-gallery delay="5000" show-counter show-indicators>
  <gallery-item
    src="/photos/coast.jpg"
    alt="Rocky California coastline"
    caption="California coast"
  >
    <gallery-item-variant
      media="(max-width: 640px)"
      srcset="/photos/coast-portrait.jpg"
    ></gallery-item-variant>
  </gallery-item>
  <gallery-item src="/photos/bridge.jpg" alt="Golden Gate Bridge"></gallery-item>
</photo-gallery>
<script type="module">
  document.querySelector("photo-gallery").addEventListener("slide-change", (event) => {
    console.log(event.detail.currentIndex);
  });
</script>`,
  "roman-numeral": `<roman-numeral value="2004"></roman-numeral>`,
  "confirm-dialog": `<confirm-dialog open confirm-label="Delete" cancel-label="Cancel">
  Are you sure you want to delete this item?
</confirm-dialog>`,
  "toast-notification": `<toast-notification></toast-notification>
<script type="module">
  import { notifySuccess } from "@f-ewald/components/toast-notification.js";
  notifySuccess("Saved!");
</script>`,
  "slide-panel": `<slide-panel open heading="Property details">
  Panel body content goes here.
</slide-panel>`,
  "copy-link-button": `<copy-link-button value="https://example.com/listing/42" label="Copy listing link"></copy-link-button>`,
  "relative-time": `<relative-time datetime="2026-07-17T07:00:00Z"></relative-time>`,
  "distance-value": `<distance-value miles="5"></distance-value>`,
  "price-history-chart": `<price-history-chart></price-history-chart>
<script type="module">
  document.querySelector("price-history-chart").history = [
    { date: "2023-01-01", price: 620000, eventType: "Listed" },
    { date: "2024-02-01", price: 680000, eventType: "Sold" },
  ];
</script>`,
  "distribution-chart": `<distribution-chart metric="sqft"></distribution-chart>
<script type="module">
  document.querySelector("distribution-chart").values = [{ label: "", value: 1450 }];
</script>`,
  "percent-bar-chart": `<percent-bar-chart></percent-bar-chart>
<script type="module">
  document.querySelector("percent-bar-chart").groups = [
    { key: "a", label: "White", pct: 45.2, color: "#4f46e5" },
    { key: "b", label: "Asian", pct: 28.1, color: "#0d9488" },
  ];
</script>`,
  "weight-bar-chart": `<weight-bar-chart></weight-bar-chart>
<script type="module">
  document.querySelector("weight-bar-chart").items = [
    { id: "price", label: "Price", value: 0.4 },
    { id: "schools", label: "Schools", value: 0.35 },
    { id: "commute", label: "Commute", value: 0.25 },
  ];
</script>`,
  "address-autocomplete": `<address-autocomplete
  placeholder="Start typing an address…"
  access-token="pk.your-mapbox-token"
></address-autocomplete>`,
  "autocomplete-input": `<form>
  <autocomplete-input name="language" placeholder="Start typing a language…"></autocomplete-input>
</form>
<script type="module">
  // Local mode: filters client-side, no network request.
  document.querySelector("autocomplete-input").options = [
    { key: "ts", value: "TypeScript" },
    { key: "py", value: "Python" },
  ];

  // API mode: omit \`options\` and set \`endpoint\` instead — it's queried as
  // \`\${endpoint}?\${queryParam}=<text>\` and must respond with [{key, value}].
</script>`,
  "user-avatar": `<user-avatar src="https://example.com/photo.jpg" name="Freddy" size="40"></user-avatar>`,
  "radio-cards": `<radio-cards></radio-cards>
<script type="module">
  const el = document.querySelector("radio-cards");
  el.options = [
    { value: "simple", label: "Simple", description: "Quick-ranking view" },
    { value: "detailed", label: "Detailed", description: "Every section and layer" },
  ];
  el.value = "simple";
  el.addEventListener("change", (e) => console.log(e.detail.value));
</script>`,
  "radio-pills": `<radio-pills></radio-pills>
<script type="module">
  const el = document.querySelector("radio-pills");
  el.options = [
    { value: "light", label: "Light" },
    { value: "streets", label: "Streets" },
  ];
  el.value = "light";
  el.addEventListener("change", (e) => console.log(e.detail.value));
</script>`,
  "ui-button": `<ui-button variant="primary">
  <span slot="icon">...</span>
  New property
</ui-button>
<ui-button variant="danger">Delete</ui-button>
<ui-button variant="secondary" href="/properties?edit=42">Edit</ui-button>`,
  "map-pin": `<map-pin color="#1a73e8" size="30">3</map-pin>
<map-pin color="#22c55e" size="26" highlighted>🏠</map-pin>`,
  "map-circle": `<map-circle color="#6b7280"></map-circle>
<map-circle color="#0099D8" size="14" ring-width="3"></map-circle>
<map-circle color="#1a73e8" size="24" ring-width="5" highlighted>1</map-circle>`,
  "multi-select": `<multi-select name="colors" label="Colors" searchable></multi-select>
<multi-select id="colors-list" variant="list" visible-rows="4"></multi-select>
<script type="module">
  const options = [
    { value: "red", label: "Red" },
    { value: "green", label: "Green" },
    { value: "blue", label: "Blue" },
    { value: "amber", label: "Amber" },
    { value: "violet", label: "Violet" },
  ];
  const dropdown = document.querySelector("multi-select[name='colors']");
  dropdown.options = options;
  dropdown.values = ["red", "blue"];
  dropdown.searchable = true;
  dropdown.addEventListener("change", (e) => console.log(e.detail.values));

  const list = document.getElementById("colors-list");
  list.options = options;
  list.values = ["green"];
</script>`,
  "stat-meter": `<stat-meter label="CPU" percent="42"></stat-meter>
<stat-meter label="MEM" percent="76"></stat-meter>
<stat-meter label="I/O"></stat-meter> <!-- percent unset -> null -> renders "—" -->
<stat-meter label="GPU" percent="88" color="#dc2626"></stat-meter>`,
  "status-pill": `<status-pill label="Running" color="primary" spinner></status-pill>
<status-pill label="Blocked" color="danger"></status-pill>`,
  "editable-text": `<editable-text value="Write the quarterly report" label="Title"></editable-text>
<editable-text multiline placeholder="Add a description…" label="Description"></editable-text>`,
  "live-timer": `<live-timer since="2026-07-19T12:00:00Z" prefix="Sleeping for "></live-timer>
<live-timer since="2026-07-19T12:00:00Z" format="compact" prefix="running for "></live-timer>`,
  "chat-message": `<chat-message role="user" author="Freddy" timestamp="2026-07-19T12:00:00Z">
  Write notes.md containing a haiku.
</chat-message>
<chat-message role="agent" variant="tool" collapsible collapsed summary='file_write · {"filename": "notes.md"}'>
  directory: .
  filename: notes.md
</chat-message>`,
  "form-select": `<form-select label="Task state" searchable></form-select>
<script type="module">
  import { iconArrowPath, iconCheckCircle, iconListBullet } from "@f-ewald/components/icons.js";

  const select = document.querySelector("form-select");
  select.options = [
    { value: "backlog", label: "Backlog", icon: iconListBullet(14), iconSize: 14 },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress", icon: iconArrowPath(16), iconSize: 16 },
    { value: "review", label: "Needs review" },
    { value: "done", label: "Done", icon: iconCheckCircle(16), iconSize: 16 },
  ];
  select.value = "open";
  select.addEventListener("change", (e) => console.log(e.detail.value));
</script>`,
  "dropdown-button": `<dropdown-button label="Resolve…"></dropdown-button>
<script type="module">
  const dropdown = document.querySelector("dropdown-button");
  dropdown.options = [
    { value: "retry", label: "Retry" },
    { value: "close", label: "Close" },
    { value: "backlog", label: "Backlog" },
  ];
  dropdown.addEventListener("select", (e) => console.log(e.detail.value));
</script>`,
  "icon-button": `<icon-button label="Edit"></icon-button>
<script type="module">
  import { iconPencil } from "@f-ewald/components/icons.js";
  const btn = document.querySelector("icon-button");
  btn.icon = iconPencil(16);
  btn.addEventListener("click", () => console.log("edit clicked"));
</script>`,
  "kbd-hint": `<kbd-hint keys="Mod+K"></kbd-hint>
<kbd-hint keys="Mod+Shift+Enter" platform="mac"></kbd-hint>`,
  "frame-box": `<frame-box label="Debug">
  Framed content goes here.
</frame-box>`,
  "calendar-entry": `<calendar-entry
  start="2026-07-10"
  end="2026-07-18"
  label="Vacation"
  color="success"
>
  <span slot="title">Vacation</span>
  <span slot="detail">Out of office</span>
  <span slot="detail">Road trip along the California coast with several scenic stops</span>
  <span slot="footer">Return July 19 at 6 PM</span>
</calendar-entry>`,
  "calendar-month": `<calendar-month year="2026" month="7">
  <calendar-entry start="2026-07-10" end="2026-07-18" label="Vacation" color="success">
    <span slot="title">Vacation</span>
    <span slot="detail">Out of office</span>
    <span slot="detail">Road trip along the California coast with several scenic stops</span>
    <span slot="footer">Return July 19 at 6 PM</span>
  </calendar-entry>
  <calendar-entry start="2026-07-15" end="2026-07-20" label="Conference" color="warning" href="#conf">
    <span slot="detail">Talks and workshops</span>
    <span slot="footer">Closing keynote · July 20</span>
  </calendar-entry>
</calendar-month>`,
  "calendar-year": `<calendar-year year="2026">
  <calendar-entry start="2026-01-28" end="2026-02-03" label="Offsite" color="primary" href="#offsite">
    <span slot="detail">New York</span>
    <span slot="detail">Team workshops</span>
    <span slot="footer">Closing dinner Friday</span>
  </calendar-entry>
  <calendar-entry start="2026-03-05" end="2026-03-18" label="Product launch" color="success" href="#launch">
    <span slot="detail">Coordinate the release across engineering, design, support, and marketing.</span>
    <span slot="detail">Monitor adoption and production health throughout the rollout.</span>
    <span slot="footer">Public launch · March 18 at 9 AM</span>
  </calendar-entry>
  <calendar-entry start="2026-07-10" end="2026-07-18" label="Vacation" color="success"></calendar-entry>
</calendar-year>`,
  "data-table": `<data-table></data-table>
<script type="module">
  const table = document.querySelector("data-table");
  table.columns = [
    { key: "title", label: "Title" },
    { key: "state", label: "State" },
  ];
  table.rows = [
    { id: "tsk_1", title: "Write onboarding docs", state: "Backlog" },
    { id: "tsk_2", title: "Fix the login bug", state: "Done" },
  ];
  table.rowHref = (row) => \`#/tasks/\${row.id}\`;
</script>`,
  "text-area": `<text-area placeholder="Describe the issue…" rows="4"></text-area>
<text-area readonly value="Error code: 429 - No deployments available for selected model."></text-area>`,
  "tile-grid": `<tile-grid file-icon></tile-grid>
<script type="module">
  const grid = document.querySelector("tile-grid");
  grid.items = [
    { name: "notes.txt" },
    { name: "photo.jpg" },
  ];
  grid.renderTile = (item) => item.name;
</script>`,
  "kanban-board": `<kanban-board label="Project tasks"></kanban-board>
<script type="module">
  const board = document.querySelector("kanban-board");
  board.columns = [
    {
      id: "todo",
      title: "To Do",
      cards: [
        {
          id: "c1",
          ticket: "PROJ-142",
          title: "Wire up auth callback",
          description: "Handle the OAuth redirect and persist the session token.",
          createdAt: "2026-07-18T09:12:00Z",
          updatedAt: "2026-07-21T14:03:00Z",
        },
      ],
    },
    { id: "doing", title: "In Progress", cards: [] },
    { id: "done", title: "Done", cards: [] },
  ];
  // A card's column is its state; drag-and-drop, keyboard, and the detail
  // popover state selector all emit the same card-move event.
  board.addEventListener("card-move", (e) => console.log(e.detail));
  board.addEventListener("card-open", (e) => console.log(e.detail.cardId));
</script>`,
  "popover-panel": `<div style="position: relative; display: inline-block;">
  <button id="new-task-btn">New task</button>
  <popover-panel heading="New task">
    Popover body content goes here.
  </popover-panel>
</div>
<script type="module">
  const popover = document.querySelector("popover-panel");
  document.querySelector("#new-task-btn").addEventListener("click", () => (popover.open = true));
  popover.addEventListener("panel-close", () => (popover.open = false));
</script>`,
};

const manifest = JSON.parse(await readFile(path.join(rootDir, "custom-elements.json"), "utf8"));

/** @typedef {{ tagName: string, className: string, description: string, sourcePath: string, properties: any[], events: any[] }} ComponentInfo */

/** @type {ComponentInfo[]} */
const components = [];
for (const mod of manifest.modules) {
  for (const decl of mod.declarations ?? []) {
    if (!decl.customElement) continue;
    const publicFields = (decl.members ?? []).filter(
      (m) =>
        m.kind === "field" &&
        !m.static &&
        m.privacy !== "private" &&
        m.privacy !== "protected" &&
        !m.name.startsWith("#"),
    );
    components.push({
      tagName: decl.tagName,
      className: decl.name,
      description: decl.description ?? "",
      sourcePath: mod.path,
      properties: publicFields,
      events: decl.events ?? [],
    });
  }
}
components.sort((a, b) => a.tagName.localeCompare(b.tagName));

/** Extracts the unique `--ui-*` custom property names referenced in a source file. */
async function cssTokensUsedBy(sourcePath) {
  const text = await readFile(path.join(rootDir, sourcePath), "utf8");
  const matches = text.matchAll(/--ui-[\w-]+/g);
  return [...new Set([...matches].map((m) => m[0]))].sort();
}

function propertiesTable(properties) {
  if (properties.length === 0) return "_None._";
  const rows = properties.map((p) => {
    const type = p.type?.text ?? "unknown";
    const def = p.default ?? "—";
    const desc = (p.description ?? "").replace(/\n/g, " ") + (p.readonly ? " _(read-only)_" : "");
    const attribute = p.attribute ? `\`${p.attribute}\`` : "_(JS property only)_";
    return `| \`${p.name}\` | ${attribute} | \`${type}\` | \`${def}\` | ${desc} |`;
  });
  return [
    "| Property | Attribute | Type | Default | Description |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function eventsTable(events) {
  if (events.length === 0) return "_None._";
  const rows = events.map((e) => `| \`${e.name}\` | ${(e.description ?? "").replace(/\n/g, " ")} |`);
  return ["| Event | Description |", "| --- | --- |", ...rows].join("\n");
}

function slotsTable(tagName) {
  const slots = SLOTS[tagName];
  if (!slots || slots.length === 0) return "_None._";
  const rows = slots.map((s) => `| \`${s.name}\` | ${s.description} |`);
  return ["| Slot | Description |", "| --- | --- |", ...rows].join("\n");
}

function cssPropsTable(tokens) {
  if (tokens.length === 0) return "_None._";
  return ["| Custom property |", "| --- |", ...tokens.map((t) => `| \`${t}\` |`)].join("\n");
}

/** Escapes untrusted manifest and package text for HTML text and attributes. */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Renders the small inline Markdown subset used by component JSDoc. */
function inlineHtml(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/** Renders paragraphs and simple unordered lists from component descriptions. */
function descriptionHtml(value) {
  if (!value) return '<p class="empty">No description provided.</p>';
  return String(value)
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim());
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>${lines.map((line) => `<li>${inlineHtml(line.slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map(inlineHtml).join("<br />")}</p>`;
    })
    .join("\n");
}

/** Returns a concise plain-text description for cards and metadata. */
function descriptionSummary(value) {
  return String(value ?? "")
    .split(/\n{2,}/, 1)[0]
    .replace(/\n/g, " ")
    .replace(/[`*]/g, "")
    .trim();
}

/** Renders a semantic API table or a consistent empty-state paragraph. */
function apiTableHtml(headers, rows) {
  if (rows.length === 0) return '<p class="empty">None.</p>';
  return `<div class="table-wrap">
  <table>
    <thead><tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
</div>`;
}

/** Renders the public properties for a component. */
function propertiesHtml(properties) {
  return apiTableHtml(
    ["Property", "Attribute", "Type", "Default", "Description"],
    properties.map((property) => [
      `<code>${escapeHtml(property.name)}</code>`,
      property.attribute
        ? `<code>${escapeHtml(property.attribute)}</code>`
        : "<em>JS property only</em>",
      `<code>${escapeHtml(property.type?.text ?? "unknown")}</code>`,
      `<code>${escapeHtml(property.default ?? "-")}</code>`,
      `${inlineHtml((property.description ?? "").replace(/\n/g, " "))}${
        property.readonly ? ' <span class="badge">read-only</span>' : ""
      }`,
    ])
  );
}

/** Renders the custom events for a component. */
function eventsHtml(events) {
  return apiTableHtml(
    ["Event", "Description"],
    events.map((event) => [
      `<code>${escapeHtml(event.name)}</code>`,
      inlineHtml((event.description ?? "").replace(/\n/g, " ")),
    ])
  );
}

/** Renders the curated slots for a component. */
function slotsHtml(tagName) {
  return apiTableHtml(
    ["Slot", "Description"],
    (SLOTS[tagName] ?? []).map((slot) => [
      `<code>${escapeHtml(slot.name)}</code>`,
      inlineHtml(slot.description),
    ])
  );
}

/** Renders the CSS custom properties consumed by a component. */
function cssPropertiesHtml(tokens) {
  return apiTableHtml(
    ["Custom property"],
    tokens.map((token) => [`<code>${escapeHtml(token)}</code>`])
  );
}

/** Renders the shared component navigation for API pages. */
function componentNavigationHtml(componentDocs, currentTag) {
  return `<nav class="component-nav" aria-label="Component documentation">
  <h2>Components</h2>
  <ul>
    ${componentDocs
      .map(
        (component) =>
          `<li><a href="./${encodeURIComponent(component.tagName)}.html"${
            component.tagName === currentTag ? ' aria-current="page"' : ""
          }>${escapeHtml(component.tagName)}</a></li>`
      )
      .join("\n    ")}
  </ul>
</nav>`;
}

/** Wraps generated documentation content in the shared static page shell. */
function pageHtml({ title, description, stylesheet, homeHref, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${stylesheet}" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${homeHref}">@f-ewald/components</a>
      <nav aria-label="Primary">
        <a href="${homeHref}">Documentation</a>
        <a href="${homeHref}playground/">Playground</a>
        <a href="https://github.com/f-ewald/components">GitHub</a>
      </nav>
    </header>
    ${body}
    <footer>
      <p>Generated from <code>custom-elements.json</code> by @f-ewald/components.</p>
    </footer>
  </body>
</html>
`;
}

/** Renders the documentation landing page. */
function landingPageHtml(componentDocs, packageJson) {
  const cards = componentDocs
    .map(
      (component) => `<li class="component-card">
  <a href="./docs/${encodeURIComponent(component.tagName)}.html">
    <code>&lt;${escapeHtml(component.tagName)}&gt;</code>
    <span>${escapeHtml(descriptionSummary(component.description))}</span>
  </a>
</li>`
    )
    .join("\n");

  const body = `<main>
  <section class="hero">
    <p class="eyebrow">Lit web components</p>
    <h1>Reusable components, documented and ready to explore.</h1>
    <p class="lede">${escapeHtml(packageJson.description)}</p>
    <div class="actions">
      <a class="button primary" href="./playground/">Open the playground</a>
      <a class="button" href="https://www.npmjs.com/package/%40f-ewald%2Fcomponents">View on npm</a>
    </div>
  </section>

  <section aria-labelledby="install-heading">
    <h2 id="install-heading">Install</h2>
    <pre><code>npm install @f-ewald/components</code></pre>
    <p>Import the whole library, or use a component subpath so applications only load what they use.</p>
    <pre><code>import &quot;@f-ewald/components&quot;;
import &quot;@f-ewald/components/confirm-dialog.js&quot;;</code></pre>
  </section>

  <section aria-labelledby="components-heading">
    <div class="section-heading">
      <div>
        <p class="eyebrow">${componentDocs.length} components</p>
        <h2 id="components-heading">Component reference</h2>
      </div>
      <a href="./playground/">See every component live</a>
    </div>
    <ul class="component-grid">${cards}</ul>
  </section>

  <section class="split" aria-labelledby="theming-heading">
    <div>
      <h2 id="theming-heading">Theme with CSS properties</h2>
      <p>Every component includes token fallbacks and works without global CSS. Override any <code>--ui-*</code> property on an ancestor to apply a theme.</p>
    </div>
    <pre><code>:root {
  --ui-primary: #0ea5e9;
  --ui-radius: 0.75rem;
}</code></pre>
  </section>

  <section aria-labelledby="resources-heading">
    <h2 id="resources-heading">Machine-readable resources</h2>
    <ul class="resource-list">
      <li><a href="./custom-elements.json"><code>custom-elements.json</code></a> - Custom Elements Manifest</li>
      <li><a href="./llms.txt"><code>llms.txt</code></a> - compact AI-oriented component reference</li>
    </ul>
  </section>
</main>`;

  return pageHtml({
    title: `${packageJson.name} - Documentation`,
    description: packageJson.description,
    stylesheet: "./assets/docs.css",
    homeHref: "./",
    body,
  });
}

/** Renders one component API reference page. */
function componentPageHtml(component, componentDocs) {
  const tag = escapeHtml(component.tagName);
  const playgroundAnchor = PLAYGROUND_ANCHORS[component.tagName] ?? component.tagName;
  const body = `<main class="docs-layout">
  ${componentNavigationHtml(componentDocs, component.tagName)}
  <article class="api-doc">
    <p class="breadcrumbs"><a href="../">Documentation</a> / ${tag}</p>
    <div class="api-heading">
      <div>
        <p class="eyebrow">Component API</p>
        <h1><code>&lt;${tag}&gt;</code></h1>
      </div>
      <a class="button primary" href="../playground/#${encodeURIComponent(playgroundAnchor)}">Open live example</a>
    </div>
    <div class="description">${descriptionHtml(component.description)}</div>

    <section>
      <h2>Install</h2>
      <pre><code>${escapeHtml(component.importLine)}</code></pre>
    </section>
    <section>
      <h2>Usage</h2>
      <pre><code>${escapeHtml(component.example)}</code></pre>
    </section>
    <section>
      <h2>Attributes / properties</h2>
      ${propertiesHtml(component.properties)}
    </section>
    <section>
      <h2>Events</h2>
      ${eventsHtml(component.events)}
    </section>
    <section>
      <h2>Slots</h2>
      ${slotsHtml(component.tagName)}
    </section>
    <section>
      <h2>CSS custom properties</h2>
      ${cssPropertiesHtml(component.tokens)}
    </section>
  </article>
</main>`;

  return pageHtml({
    title: `<${component.tagName}> - @f-ewald/components`,
    description: descriptionSummary(component.description),
    stylesheet: "../assets/docs.css",
    homeHref: "../",
    body,
  });
}

/** Builds the shared documentation model once for Markdown and HTML renderers. */
async function componentDocumentation() {
  return Promise.all(
    components.map(async (component) => ({
      ...component,
      tokens: await cssTokensUsedBy(component.sourcePath),
      importLine: `import "@f-ewald/components/${path.basename(component.sourcePath, ".ts")}.js";`,
      example: EXAMPLES[component.tagName] ?? `<${component.tagName}></${component.tagName}>`,
    }))
  );
}

/** Writes the checked-in Markdown docs and compact LLM reference. */
async function writeMarkdownDocumentation(componentDocs) {
  await mkdir(docsDir, { recursive: true });
  const llmsSections = [];

  for (const component of componentDocs) {
    const md = `# \`<${component.tagName}>\`

${component.description}

## Install

\`\`\`js
${component.importLine}
\`\`\`

## Usage

\`\`\`html
${component.example}
\`\`\`

## Attributes / properties

${propertiesTable(component.properties)}

## Events

${eventsTable(component.events)}

## Slots

${slotsTable(component.tagName)}

## CSS custom properties

${cssPropsTable(component.tokens)}
`;

    await writeFile(path.join(docsDir, `${component.tagName}.md`), md, "utf8");

    llmsSections.push(`## <${component.tagName}>

${component.description}

Import: \`${component.importLine}\`

Properties: ${component.properties.length === 0 ? "none" : component.properties.map((p) => `\`${p.name}\`${p.attribute ? ` (attribute \`${p.attribute}\`)` : " (JS property only)"} : ${p.type?.text ?? "unknown"}, default ${p.default ?? "—"}`).join("; ")}
Events: ${component.events.length === 0 ? "none" : component.events.map((e) => `\`${e.name}\``).join(", ")}
CSS custom properties: ${component.tokens.length === 0 ? "none" : component.tokens.map((t) => `\`${t}\``).join(", ")}

Example:
\`\`\`html
${component.example}
\`\`\`
`);
  }

  const llmsTxt = `# @f-ewald/components

A collection of self-contained Lit web components sharing a Tailwind-inspired
design token system. Every component is individually importable and ships
its own TypeScript types and a checked-in custom-elements.json manifest.

Install: \`npm install @f-ewald/components\`

Import patterns:
- Whole library: \`import "@f-ewald/components";\` (registers every component)
- Individual component: \`import "@f-ewald/components/<tag-name>.js";\` (tree-shakes
  everything else, including d3 for non-chart components)

Theming: components use \`var(--ui-*, <fallback>)\` custom properties, so they
render correctly with zero external CSS. Override any \`--ui-*\` property on
\`:root\` (or an ancestor) to retheme, or import the optional
\`@f-ewald/components/tokens.css\` stylesheet as a starting point.

${llmsSections.join("\n")}`;

  await writeFile(path.join(rootDir, "llms.txt"), llmsTxt, "utf8");
  console.log(`Wrote ${componentDocs.length} docs/*.md files and llms.txt`);
}

/** Writes the disposable static artifact consumed by GitHub Pages. */
async function writeSiteDocumentation(componentDocs) {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
  await rm(siteDir, { recursive: true, force: true });
  await Promise.all([
    mkdir(path.join(siteDir, "assets"), { recursive: true }),
    mkdir(path.join(siteDir, "docs"), { recursive: true }),
  ]);

  await Promise.all([
    writeFile(path.join(siteDir, "index.html"), landingPageHtml(componentDocs, packageJson), "utf8"),
    copyFile(path.join(rootDir, "custom-elements.json"), path.join(siteDir, "custom-elements.json")),
    copyFile(path.join(rootDir, "llms.txt"), path.join(siteDir, "llms.txt")),
    copyFile(path.join(rootDir, "site", "docs.css"), path.join(siteDir, "assets", "docs.css")),
    ...componentDocs.map((component) =>
      writeFile(
        path.join(siteDir, "docs", `${component.tagName}.html`),
        componentPageHtml(component, componentDocs),
        "utf8"
      )
    ),
  ]);

  console.log(`Wrote static documentation for ${componentDocs.length} components to pages-dist/`);
}

const componentDocs = await componentDocumentation();
if (siteOnly) {
  await writeSiteDocumentation(componentDocs);
} else {
  await writeMarkdownDocumentation(componentDocs);
}
