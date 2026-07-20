#!/usr/bin/env node
// Reads custom-elements.json (produced by `npm run analyze`) and writes
// docs/<tag-name>.md per component plus llms.txt at the repo root.
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const docsDir = path.join(rootDir, "docs");

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
    { name: "(default)", description: "Reserved for future use; no slotted content is required today." },
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

/** One copy-paste usage example per component, mirroring the playground snippets. */
const EXAMPLES = {
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
<map-circle color="#1a73e8" size="24" ring-width="5" highlighted>1</map-circle>`,
  "map-point": `<map-point color="#0099D8"></map-point>
<map-point color="#fb8072" size="10" ring-width="2"></map-point>`,
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
  "form-select": `<form-select label="Task state"></form-select>
<script type="module">
  const select = document.querySelector("form-select");
  select.options = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "done", label: "Done" },
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
  "frame-box": `<frame-box label="Debug">
  Framed content goes here.
</frame-box>`,
  "calendar-entry": `<calendar-entry
  start="2026-07-10"
  end="2026-07-18"
  label="Vacation"
  color="success"
></calendar-entry>`,
  "calendar-month": `<calendar-month year="2026" month="7">
  <calendar-entry start="2026-07-10" end="2026-07-18" label="Vacation" color="success"></calendar-entry>
  <calendar-entry start="2026-07-15" end="2026-07-20" label="Conference" color="warning" href="#conf"></calendar-entry>
</calendar-month>`,
  "calendar-year": `<calendar-year year="2026">
  <calendar-entry start="2026-01-28" end="2026-02-03" label="Offsite" color="primary" href="#offsite"></calendar-entry>
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
  "tile-grid": `<tile-grid></tile-grid>
<script type="module">
  const grid = document.querySelector("tile-grid");
  grid.items = [
    { name: "notes.txt" },
    { name: "photo.jpg" },
  ];
  grid.renderTile = (item) => item.name;
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

await mkdir(docsDir, { recursive: true });

const llmsSections = [];

for (const c of components) {
  const tokens = await cssTokensUsedBy(c.sourcePath);
  const importLine = `import "@f-ewald/components/${path.basename(c.sourcePath, ".ts")}.js";`;
  const example = EXAMPLES[c.tagName] ?? `<${c.tagName}></${c.tagName}>`;

  const md = `# \`<${c.tagName}>\`

${c.description}

## Install

\`\`\`js
${importLine}
\`\`\`

## Usage

\`\`\`html
${example}
\`\`\`

## Attributes / properties

${propertiesTable(c.properties)}

## Events

${eventsTable(c.events)}

## Slots

${slotsTable(c.tagName)}

## CSS custom properties

${cssPropsTable(tokens)}
`;

  await writeFile(path.join(docsDir, `${c.tagName}.md`), md, "utf8");

  llmsSections.push(`## <${c.tagName}>

${c.description}

Import: \`${importLine}\`

Properties: ${c.properties.length === 0 ? "none" : c.properties.map((p) => `\`${p.name}\`${p.attribute ? ` (attribute \`${p.attribute}\`)` : " (JS property only)"} : ${p.type?.text ?? "unknown"}, default ${p.default ?? "—"}`).join("; ")}
Events: ${c.events.length === 0 ? "none" : c.events.map((e) => `\`${e.name}\``).join(", ")}
CSS custom properties: ${tokens.length === 0 ? "none" : tokens.map((t) => `\`${t}\``).join(", ")}

Example:
\`\`\`html
${example}
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

console.log(`Wrote ${components.length} docs/*.md files and llms.txt`);
