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
  "skip-link": [
    { name: "(default)", description: "Optional custom link wording, overriding `label`." },
  ],
  "spec-list": [
    {
      name: "(default)",
      description:
        "Optional `<dt>`/`<dd>` pairs for values that need custom markup; when present, they replace the `items` path.",
    },
  ],
  "empty-state": [
    { name: "icon", description: "Optional leading glyph. The consumer supplies it (e.g. an inline SVG icon)." },
    { name: "(default)", description: "Optional rich body content, an alternative to `description`." },
    { name: "actions", description: "Optional call to action, e.g. a `ui-button`." },
  ],
  "card-grid": [
    { name: "(default)", description: "`link-card` elements (or other card-shaped content)." },
  ],
  "reveal-button": [{ name: "(default)", description: "Content to reveal when clicked." }],
  "photo-gallery": [
    { name: "(default)", description: "Declarative `gallery-item` elements rendered as slides." },
  ],
  "gallery-item": [
    { name: "(default)", description: "Optional `gallery-item-variant` responsive image sources." },
  ],
  "confirm-dialog": [{ name: "(default)", description: "Dialog body content." }],
  "modal-dialog": [
    { name: "(default)", description: "Dialog body content." },
    { name: "title", description: "Overrides the header title text (falls back to the `heading` property)." },
  ],
  "split-hero": [
    { name: "(default)", description: "Form or other content for the non-image half." },
  ],
  "slide-panel": [
    { name: "(default)", description: "Panel body content." },
    { name: "title", description: "Overrides the header title text (falls back to the `heading` property)." },
  ],
  "ui-button": [
    { name: "(default)", description: "Button label." },
    { name: "icon", description: "Optional leading icon (e.g. an inline SVG)." },
  ],
  "ui-checkbox": [
    {
      name: "(default)",
      description:
        "The label, overriding the `label` property; for a label that needs its own markup or styling.",
    },
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
  "chevron-panel": [
    { name: "(default)", description: "Body content, shown only while `open`." },
    { name: "headline", description: "Header content, always visible, clickable to toggle." },
  ],
  "calendar-entry": [
    { name: "title", description: "Plain-text title shown instead of the `label` fallback." },
    {
      name: "detail",
      description: "Repeatable plain-text details rendered inside the shared body spanning all remaining days.",
    },
    { name: "footer", description: "Plain-text ending note pinned to the bottom of the shared body." },
    { name: "location", description: "Plain-text location, shown on its own line with a leading marker icon." },
  ],
  "calendar-day": [
    { name: "(default)", description: "Declarative `calendar-entry` elements to render for this day." },
    {
      name: "actions",
      description: "Optional controls rendered beside the day name (e.g. day-navigation buttons).",
    },
  ],
  "calendar-month": [
    { name: "(default)", description: "Declarative `calendar-entry` elements to render for this month." },
    {
      name: "actions",
      description: "Optional controls rendered beside the month name (e.g. month-navigation buttons).",
    },
  ],
  "calendar-week": [
    { name: "(default)", description: "Declarative `calendar-entry` elements to render for this week." },
    {
      name: "actions",
      description: "Optional controls rendered beside the day headers (e.g. week-navigation buttons).",
    },
  ],
  "calendar-year": [
    {
      name: "(default)",
      description: "Declarative `calendar-entry` elements spanning the displayed year, re-projected into each month.",
    },
  ],
  "tab-bar": [{ name: "(default)", description: "`tab-item` elements." }],
  "tab-item": [{ name: "(default)", description: "Panel content, shown only while `selected`." }],
};

/** Metadata-only components are demonstrated through their visual parent. */
const PLAYGROUND_ANCHORS = {
  "calendar-entry": "calendar-month",
  "gallery-item": "photo-gallery",
  "gallery-item-variant": "photo-gallery",
  "kanban-card": "kanban-board",
  "kanban-column": "kanban-board",
  "tab-item": "tab-bar",
  "timeline-entry": "timeline-container",
};

/** One copy-paste usage example per component, mirroring the playground snippets. */
const EXAMPLES = {
  "ui-checkbox": `<ui-checkbox label="Subscribe to updates"></ui-checkbox>
<ui-checkbox name="terms" label="I agree to the terms" required></ui-checkbox>
<!-- Slot the label when it needs its own markup; it overrides the property -->
<ui-checkbox name="beta">Enable <strong>beta</strong> features</ui-checkbox>
<!-- .icon is set programmatically (a pre-rendered TemplateResult), not an attribute -->
<ui-checkbox label="Show list view"></ui-checkbox>`,
  "audio-player": `<audio-player src="/episode-12.mp3" label="Episode 12"></audio-player>
<script type="module">
  document.querySelector("audio-player").addEventListener("ended", () => {
    console.log("playback finished");
  });
</script>`,
  "video-player": `<video-player
  src="/clip.mp4"
  poster="/clip-poster.jpg"
  label="Episode 12"
></video-player>`,
  "vote-control": `<vote-control value="7" target="10" label="Vote for this entry"></vote-control>
<vote-control orientation="horizontal" value="42" target="50"></vote-control>
<vote-control value="3" disabled></vote-control>`,
  "skip-link": `<skip-link href="#main"></skip-link>
<skip-link href="#results" label="Jump to results"></skip-link>`,
  "breadcrumb-nav": `<breadcrumb-nav></breadcrumb-nav>
<script type="module">
  const trail = document.querySelector("breadcrumb-nav");
  trail.items = [
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Members" },
  ];
  trail.addEventListener("breadcrumb-navigate", (e) => console.log(e.detail.item.label, e.detail.index));
</script>`,
  "spec-list": `<spec-list caption="Specifications"></spec-list>
<script type="module">
  document.querySelector("spec-list").items = [
    { label: "Material", value: "Anodized aluminum" },
    { label: "Weight", value: "1.2 kg" },
    { label: "Warranty", value: "2 years" },
  ];
</script>

<!-- Or slot your own pairs when a value needs a link, a status-pill, or other
     markup; slotted \`dt\`/\`dd\` pick up the component's own key/value styling.
     \`dividers\` defaults to true; turn it off via the property, since a
     \`dividers="false"\` attribute still parses as a truthy boolean. -->
<spec-list layout="stacked" id="sheet">
  <dt>Homepage</dt>
  <dd><a href="https://example.com">example.com</a></dd>
</spec-list>`,
  "empty-state": `<empty-state heading="No results found" description="Try adjusting your search or filters.">
  <span slot="icon">...</span>
  <ui-button slot="actions" variant="primary">Clear filters</ui-button>
</empty-state>
<empty-state size="sm" heading="No pinned items"></empty-state>`,
  "comment-composer": `<comment-composer placeholder="Add a comment…"></comment-composer>
<script type="module">
  document.querySelector("comment-composer").addEventListener("submit", (e) => {
    postComment(e.detail.value);
  });
</script>`,
  "range-slider": `<range-slider min="100" max="5000" step="50" value="1000"></range-slider>
<script type="module">
  document.querySelector("range-slider").addEventListener("input", (e) => {
    console.log(e.detail.value);
  });
</script>`,
  "mapbox-map": `<mapbox-map
  access-token="pk.your-token"
  style-url="mapbox://styles/mapbox/light-v11"
></mapbox-map>
<script type="module">
  document.querySelector("mapbox-map").addEventListener("map-ready", (e) => {
    const map = e.detail.map; // the underlying mapboxgl.Map
    map.addSource("mine", { type: "geojson", data: "/mine.geojson" });
    map.addLayer({ id: "mine", type: "circle", source: "mine", paint: { "circle-color": "#4f46e5" } });
  });
</script>`,
  "form-field": `<form-field label="Task state" hint="Only affects your own view">
  <form-select></form-select>
</form-field>
<form-field label="Terms" required error="You must accept to continue">
  <ui-checkbox label="I agree to the terms"></ui-checkbox>
</form-field>
<form-field floating-label label="Email">
  <input type="email" placeholder="name@example.com" />
</form-field>
<form-field floating-label label="Language">
  <autocomplete-input clearable placeholder="Start typing…"></autocomplete-input>
</form-field>`,
  "auto-scroll": `<auto-scroll style="height: 24rem">
  <timeline-container>
    <timeline-entry datetime="2026-07-23T09:00:00Z">
      <span slot="headline">Deployment started</span>
      Release v1.4.0 is rolling out.
    </timeline-entry>
  </timeline-container>
</auto-scroll>`,
  "scroll-to-bottom": `<scroll-to-bottom></scroll-to-bottom>

<!-- Floats inside its own scrollport instead of the whole page: -->
<div id="log" style="position: relative; overflow-y: auto; height: 10rem">
  ...
  <scroll-to-bottom threshold="20"></scroll-to-bottom>
</div>
<script type="module">
  document.querySelector('scroll-to-bottom').target = document.querySelector('#log');
</script>`,
  "scroll-to-top": `<scroll-to-top></scroll-to-top>`,
  "scroll-dots": `<scroll-dots label="Journey stops"></scroll-dots>
<script type="module">
  const rail = document.querySelector('scroll-dots');
  rail.items = ['Intro', 'Freiburg', 'Berkeley', { label: 'Credits', muted: true }];
  rail.active = 0;
  rail.addEventListener('dot-select', (e) => {
    rail.active = e.detail.index;
    sections[e.detail.index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
</script>`,
  "fullscreen-button": `<fullscreen-button></fullscreen-button>
<script type="module">
  const button = document.querySelector('fullscreen-button');
  button.target = document.querySelector('#deck'); // omit for the whole page
  button.addEventListener('fullscreen-change', (e) => console.log(e.detail.active));
</script>`,
  "load-more": `<load-more direction="top" label="Load older"></load-more>
<load-more></load-more>`,
  "loading-dots": `<loading-dots></loading-dots>
<loading-dots size="sm"></loading-dots>
<loading-dots size="lg" label="Sending message"></loading-dots>`,
  "loading-spinner": `<loading-spinner></loading-spinner>
<loading-spinner size="sm"></loading-spinner>
<loading-spinner size="lg" label="Loading results"></loading-spinner>`,
  "content-divider": `<content-divider></content-divider>

<content-divider label="OR"></content-divider>`,
  "timeline-container": `<timeline-container>
  <timeline-entry datetime="2026-07-23T09:00:00Z">
    <span slot="headline">Deployment started</span>
    Release v1.4.0 is rolling out.
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:45:00Z" color="success">
    <span slot="headline">Review approved</span>
    <status-pill label="In Review" color="info"></status-pill>
  </timeline-entry>
  <timeline-entry datetime="2026-07-23T08:30:00Z">
    <!-- chat-message's own timestamp is left unset: timeline-entry already shows one -->
    <chat-message role="user" author="Freddy">Ship it.</chat-message>
  </timeline-entry>
</timeline-container>

<!-- A presentation timeline: centered line, label and body swapping sides. -->
<timeline-container layout="alternating">
  <timeline-entry label="1987">
    <span slot="headline">Where it started</span>
    A first stop, with the label on the left.
  </timeline-entry>
  <timeline-entry label="2004">
    <span slot="headline">The question</span>
    The second entry mirrors the first.
  </timeline-entry>
</timeline-container>`,
  "timeline-entry": `<timeline-entry datetime="2026-07-23T09:00:00Z" color="danger">
  <span slot="headline">Build failed</span>
  The release pipeline halted on the test stage.
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
  "page-header": `<page-header heading="Team members" description="Everyone with access to this workspace.">
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
  "modal-dialog": `<modal-dialog open heading="Changelog" dismissible>
  Dialog body content goes here.
</modal-dialog>`,
  "toast-notification": `<toast-notification></toast-notification>
<script type="module">
  import { notifySuccess } from "@f-ewald/components/toast-notification.js";
  notifySuccess("Saved!", "Your changes are now live.");
</script>`,
  "slide-panel": `<slide-panel open heading="Property details">
  Panel body content goes here.
</slide-panel>`,
  "split-hero": `<split-hero src="/photos/coast.jpg" alt="Coastal road" style="height: 100vh">
  <form>
    <h1>Sign in</h1>
    <form-field label="Email"><input type="email" name="email" /></form-field>
    <form-field label="Password"><input type="password" name="password" /></form-field>
    <ui-button type="submit" variant="primary">Sign in</ui-button>
  </form>
</split-hero>`,
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
  "progress-bar": `<progress-bar value="3" max="14" label="Question 3 out of 14"></progress-bar>
<progress-bar value="7" max="10" color="#dc2626" track-color="#fecaca"></progress-bar>`,
  "distribution-chart": `<distribution-chart metric="sqft"></distribution-chart>
<script type="module">
  document.querySelector("distribution-chart").values = [{ label: "", value: 1450 }];
</script>`,
  "percent-bar-chart": `<percent-bar-chart></percent-bar-chart>
<script type="module">
  const chart = document.querySelector("percent-bar-chart");
  chart.groups = [
    { key: "a", label: "White", value: 45.2, color: "#4f46e5" },
    { key: "b", label: "Asian", value: 28.1, color: "#0d9488" },
  ];

  // Absolute values instead of percentages, as vertical columns:
  chart.mode = "value";
  chart.orientation = "vertical";
  chart.valueFormat = (value) => \`$\${value.toLocaleString()}\`;
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
  clearable
  placeholder="Start typing an address…"
  access-token="pk.your-mapbox-token"
></address-autocomplete>`,
  "autocomplete-input": `<form>
  <autocomplete-input clearable name="language" placeholder="Start typing a language…"></autocomplete-input>
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
  "button-group": `<button-group></button-group>
<script type="module">
  const el = document.querySelector("button-group");
  el.options = [
    { value: "list", label: "List" },
    { value: "kanban", label: "Kanban" },
  ];
  el.value = "list";
  el.addEventListener("change", (e) => console.log(e.detail.value));
</script>`,
  "ui-button": `<ui-button variant="primary">
  <span slot="icon">...</span>
  New property
</ui-button>
<ui-button variant="danger">Delete</ui-button>
<ui-button variant="secondary" href="/properties?edit=42">Edit</ui-button>
<ui-button variant="primary" ai>Ask AI</ui-button>`,
  "map-pin": `<map-pin color="#1a73e8" size="30">3</map-pin>
<map-pin color="#22c55e" size="26" highlighted>🏠</map-pin>`,
  "map-circle": `<map-circle color="#6b7280"></map-circle>
<map-circle color="#0099D8" size="14" ring-width="3"></map-circle>
<map-circle color="#1a73e8" size="24" ring-width="5" highlighted>1</map-circle>`,
  "markdown-editor": `<markdown-editor></markdown-editor>
<script type="module">
  const el = document.querySelector("markdown-editor");
  el.value = \`---
title: Weekly status
author: Ada Lovelace
tags: [engineering, updates]
---

# Weekly status

Some **markdown** content here.\`;
  el.addEventListener("input", (e) => console.log(e.detail.value));
</script>`,
  "tab-bar": `<tab-bar label="Project sections">
  <tab-item label="Overview" value="overview" selected>Overview content</tab-item>
  <tab-item label="Activity" value="activity">Activity content</tab-item>
  <tab-item label="Settings" value="settings">Settings content</tab-item>
</tab-bar>
<script type="module">
  document.querySelector("tab-bar").addEventListener("change", (e) => console.log(e.detail.value));
</script>`,
  "markdown-view": `<markdown-view></markdown-view>
<script type="module">
  const el = document.querySelector("markdown-view");
  el.markdown = \`## Release notes

- Added **markdown-view**
- Fixed a table alignment bug

\\\`\\\`\\\`ts
const x = 1;
\\\`\\\`\\\`

| Component | Status |
| --- | --- |
| markdown-view | New |

See the [changelog](#markdown-view) for details.\`;
</script>`,
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
  "status-banner": `<status-banner variant="warning">Reconnecting… — data may be stale</status-banner>
<status-banner variant="info">
  A new version is available.
  <button slot="actions">Reload</button>
</status-banner>`,
  "ui-admonition": `<ui-admonition variant="info">
  These are balanced defaults — take the quiz to personalize them.
  <ui-button slot="actions" variant="primary">Take the quiz</ui-button>
</ui-admonition>`,
  "status-pill": `<status-pill label="Running" color="primary" spinner></status-pill>
<status-pill label="Blocked" color="danger"></status-pill>`,
  "editable-text": `<editable-text value="Write the quarterly report" label="Title"></editable-text>
<editable-text multiline placeholder="Add a description…" label="Description"></editable-text>`,
  "live-timer": `<live-timer since="2026-07-19T12:00:00Z" prefix="Sleeping for "></live-timer>
<live-timer since="2026-07-19T12:00:00Z" format="compact" prefix="running for "></live-timer>`,
  "countdown-timer": `<countdown-timer until="2026-07-19T12:00:10Z" prefix="Retrying in "></countdown-timer>
<countdown-timer until="2026-07-19T12:00:10Z" format="compact" prefix="retrying in "></countdown-timer>`,
  "cron-schedule": `<cron-schedule label="Backup schedule" value="0 * * * *"></cron-schedule>

<script type="module">
  const schedule = document.querySelector("cron-schedule");
  schedule.addEventListener("change", (e) => {
    console.log(e.detail.value, schedule.description);
  });
</script>`,
  "chat-message": `<chat-message role="user" author="Freddy" timestamp="2026-07-19T12:00:00Z">
  Write notes.md containing a haiku.
</chat-message>
<chat-message role="agent" variant="tool" collapsible collapsed summary='file_write · {"filename": "notes.md"}'>
  directory: .
  filename: notes.md
</chat-message>`,
  "chevron-panel": `<chevron-panel>
  <strong slot="headline">Why these scores?</strong>
  <p>Each category blends several weighted inputs.</p>
</chevron-panel>
<script type="module">
  document.querySelector("chevron-panel").addEventListener("toggle", (e) => {
    console.log(e.detail.open);
  });
</script>`,
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
<dropdown-button variant="icon" label="Row actions"></dropdown-button>
<script type="module">
  import { iconEllipsisVertical } from "@f-ewald/components/icons.js";

  const dropdown = document.querySelector("dropdown-button");
  dropdown.options = [
    { value: "retry", label: "Retry" },
    { value: "close", label: "Close" },
    { value: "delete", label: "Delete", danger: true },
  ];
  dropdown.addEventListener("select", (e) => console.log(e.detail.value));

  // Icon-only overflow ("three dot") menu — label becomes the accessible name.
  const kebab = document.querySelector('dropdown-button[variant="icon"]');
  kebab.icon = iconEllipsisVertical(16);
  kebab.options = [{ value: "delete", label: "Delete", danger: true }];
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
  <span slot="location">Beach house</span>
  <span slot="detail">Out of office</span>
  <span slot="detail">Road trip along the California coast with several scenic stops</span>
  <span slot="footer">Return July 19 at 6 PM</span>
</calendar-entry>`,
  "calendar-day": `<calendar-day date="2026-07-15" time-marker>
  <calendar-entry start="2026-07-15" end="2026-07-15" label="Company holiday" color="neutral"></calendar-entry>
  <calendar-entry start="2026-07-15T09:00" end="2026-07-15T09:30" label="Standup" color="info"></calendar-entry>
  <calendar-entry start="2026-07-15T09:15" end="2026-07-15T10:00" label="Design review" color="primary" href="#review">
    <span slot="detail">Walk through the new onboarding flow</span>
    <span slot="location">Room A</span>
  </calendar-entry>
</calendar-day>`,
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
  <calendar-entry start="2026-07-27" end="2026-07-28" label="Client lunch" color="neutral">
    <span slot="location">Downtown bistro</span>
  </calendar-entry>
</calendar-month>`,
  "calendar-week": `<calendar-week date="2026-07-15">
  <calendar-entry start="2026-07-13" end="2026-07-15" label="Offsite" color="primary" href="#offsite"></calendar-entry>
  <calendar-entry start="2026-07-14T09:00" end="2026-07-14T09:30" label="Standup" color="info"></calendar-entry>
  <calendar-entry start="2026-07-16T14:00" end="2026-07-16T15:00" label="Customer demo" color="success">
    <span slot="location">Main conference room</span>
  </calendar-entry>
</calendar-week>`,
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
  "text-area": `<form-field floating-label label="Description">
  <text-area placeholder="Describe the issue…" rows="4"></text-area>
</form-field>
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
  "tree-view": `<tree-view lines></tree-view>
<script type="module">
  const tree = document.querySelector("tree-view");
  tree.nodes = [
    {
      id: "docs",
      label: "docs",
      children: [{ id: "fil_1", label: "notes.txt", data: { id: "fil_1" } }],
    },
    { id: "fil_2", label: "readme.md", data: { id: "fil_2" } },
  ];
  tree.renderNode = (node) => node.label;
  tree.addEventListener("node-click", (e) => console.log(e.detail));
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
  "card-grid": `<card-grid>
  <link-card
    heading="Grafana"
    description="Metrics dashboards."
    href="https://grafana.example.com"
    logo="/logos/grafana.svg"
    status="up"
  ></link-card>
  <link-card heading="Plex" description="Media server." href="https://plex.example.com" status="up"></link-card>
</card-grid>`,
  "link-card": `<link-card
  heading="Grafana"
  description="Metrics dashboards."
  href="https://grafana.example.com"
  logo="/logos/grafana.svg"
  status="up"
></link-card>
<link-card heading="Backup Server" description="Nightly restic snapshots." status="checking"></link-card>`,
};

const manifest = JSON.parse(await readFile(path.join(rootDir, "custom-elements.json"), "utf8"));

/** @typedef {{ tagName: string, className: string, description: string, sourcePath: string, properties: any[], events: any[] }} ComponentInfo */

/** @type {ComponentInfo[]} */
const components = [];
for (const mod of manifest.modules) {
  for (const decl of mod.declarations ?? []) {
    if (!decl.customElement || !decl.tagName) continue;
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

/** @typedef {{ name: string, defaultSize: string, usage: string }} IconInfo */

/**
 * Extracts {name, defaultSize, usage} for every generated `icon*` export in
 * `src/icons.ts`, sorted alphabetically. `usage` is the JSDoc comment
 * `scripts/generate-icons.mjs` writes above each export (its `usage` field),
 * lifted into `custom-elements.json` by `npm run analyze` — this keeps the
 * icon's use-case guidance defined in exactly one place.
 * @returns {IconInfo[]}
 */
function iconCatalog() {
  const icons = [];
  for (const mod of manifest.modules) {
    if (mod.path !== "src/icons.ts") continue;
    for (const decl of mod.declarations ?? []) {
      if (decl.kind !== "function" || !decl.name.startsWith("icon")) continue;
      icons.push({
        name: decl.name,
        defaultSize: decl.parameters?.[0]?.default ?? "18",
        usage: decl.description ?? "",
      });
    }
  }
  icons.sort((a, b) => a.name.localeCompare(b.name));
  return icons;
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

/** Renders the `docs/icons.md` catalog table body shared by the file and llms.txt. */
function iconsTableBody(icons) {
  return icons
    .map((icon) => `| \`${icon.name}\` | ${icon.defaultSize}px | ${icon.usage} |`)
    .join("\n");
}

/** Writes `docs/icons.md`, the checked-in use-case catalog for every generated icon. */
async function writeIconDocumentation(icons) {
  const md = `# Icon catalog

Every icon in \`@f-ewald/components/icons.js\`, generated from
\`scripts/generate-icons.mjs\` by \`npm run icons\`, with the intended use case
for each so consumers (including AI coding agents) pick a consistent icon for
a given situation instead of ad hoc choices. Each is a function taking an
optional \`size\` (pixels) and returning a Lit \`TemplateResult\`:

\`\`\`js
import { iconPencil } from "@f-ewald/components/icons.js";

const icon = iconPencil(16); // 16px, defaults shown below if omitted
\`\`\`

| Icon | Default size | Use for |
| --- | --- | --- |
${iconsTableBody(icons)}
`;
  await writeFile(path.join(docsDir, "icons.md"), md, "utf8");
}

/** Writes the checked-in Markdown docs and compact LLM reference. */
async function writeMarkdownDocumentation(componentDocs, icons) {
  await mkdir(docsDir, { recursive: true });
  await writeIconDocumentation(icons);
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
\`@f-ewald/components/tokens.css\` stylesheet as a starting point. That
stylesheet also ships five named themes, selected with a \`data-theme\`
attribute on \`<html>\` (mutually exclusive): \`"dark"\`/\`"light"\` force one of
the two flat palettes over the OS preference, \`"gradient"\` glosses buttons and
toasts, \`"metro"\` squares every tokenized corner and replaces drop shadows
with hairline rings over a blue accent, and \`"blueprint"\` restyles the palette
as a monospace spec sheet — ink on paper, one pure-blue accent, square corners,
uppercase micro-labels, tabular figures, and 1.5px hairline rules in place of
shadows.

## Icons

Import from \`@f-ewald/components/icons.js\`, e.g. \`iconPencil(16)\`. Use this
table to pick the icon matching a use case, for consistency across apps:

| Icon | Default size | Use for |
| --- | --- | --- |
${iconsTableBody(icons)}

${llmsSections.join("\n")}`;

  await writeFile(path.join(rootDir, "llms.txt"), llmsTxt, "utf8");
  console.log(`Wrote ${componentDocs.length} docs/*.md files, docs/icons.md, and llms.txt`);
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
  await writeMarkdownDocumentation(componentDocs, iconCatalog());
}
