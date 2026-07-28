import "../src/index.js";
import {
  notifySuccess,
  notifyError,
  notifyInfo,
  notifyWarning,
  type PriceHistoryChart,
  type DistributionChart,
  type PercentBarChart,
  type WeightBarChart,
  type ConfirmDialog,
  type SlidePanel,
  type RomanNumeral,
  type RelativeTime,
  type DistanceValue,
  type RadioCards,
  type RadioPills,
  type RangeSlider,
  type ButtonGroup,
  type MapPin,
  type MapCircle,
  type MapboxMap,
  type MarkdownView,
  type StatMeter,
  type EditableText,
  type LiveTimer,
  type ChatMessage,
  type UiCheckbox,
  type AutoScroll,
  type LoadMore,
  type FormField,
  type FormSelect,
  type MultiSelect,
  type MultiSelectOption,
  type DataTable,
  type AppShell,
  type AppSidebar,
  type PaginationNav,
  type TileGrid,
  type TreeNode,
  type TreeView,
  type PopoverPanel,
  type DropdownButton,
  type IconButton,
  type KanbanBoard,
  type KanbanColumnData,
  iconArrowPath,
  iconCheckCircle,
  iconEye,
  iconListBullet,
  iconSquares2x2,
  iconPencil,
  type PhotoGallery,
  type PhotoGalleryObjectFit,
  type PhotoGallerySlideChangeDetail,
  type GalleryItem,
  type GalleryItemVariant,
  type CalendarYear,
  type AutocompleteInput,
  type AutocompleteOption,
} from "../src/index.js";

/**
 * Demo-only fetch shim: distribution-chart fetches its data from
 * `/api/distribution/<metric>`, which isn't backed by a real API in this
 * playground. Intercept just that path so the chart has something to draw.
 */
const realFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("/api/distribution/")) {
    const points = Array.from({ length: 40 }, (_, i) => {
      const x = 600 + i * 40;
      const y = Math.exp(-((x - 1400) ** 2) / (2 * 500 ** 2));
      return { x, y };
    });
    return Promise.resolve(
      new Response(
        JSON.stringify({
          points,
          unit: "sqft",
          label: "Square footage",
          min: 600,
          max: 2160,
          mean: 1400,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
  }
  return realFetch(input, init);
};

// animate-confetti
document.getElementById("confetti-trigger")?.addEventListener("click", () => {
  const el = document.createElement("animate-confetti");
  el.duration = 4000;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
});

// photo-gallery
const galleryDemo = document.getElementById("photo-gallery-demo") as PhotoGallery;
const galleryStatus = document.getElementById("gallery-status")!;
const galleryIndex = document.getElementById("gallery-current-index") as HTMLSelectElement;
const galleryCoast = document.getElementById("gallery-coast") as GalleryItem;
const galleryBridge = document.getElementById("gallery-bridge") as GalleryItem;
const galleryCliffs = document.getElementById("gallery-cliffs") as GalleryItem;
const galleryCoastMobile = document.getElementById("gallery-coast-mobile") as GalleryItemVariant;
galleryCoast.src = new URL("./assets/photo-gallery/coast-landscape.jpg", import.meta.url).href;
galleryBridge.src = new URL("./assets/photo-gallery/golden-gate.jpg", import.meta.url).href;
galleryCliffs.src = new URL("./assets/photo-gallery/coast-portrait.jpg", import.meta.url).href;
galleryCoastMobile.srcset = new URL("./assets/photo-gallery/coast-portrait.jpg", import.meta.url).href;

document.getElementById("gallery-show-controls")?.addEventListener("change", (event) => {
  galleryDemo.showControls = (event.target as HTMLInputElement).checked;
});
document.getElementById("gallery-show-counter")?.addEventListener("change", (event) => {
  galleryDemo.showCounter = (event.target as HTMLInputElement).checked;
});
document.getElementById("gallery-show-indicators")?.addEventListener("change", (event) => {
  galleryDemo.showIndicators = (event.target as HTMLInputElement).checked;
});
document.getElementById("gallery-autoplay")?.addEventListener("change", (event) => {
  galleryDemo.delay = (event.target as HTMLInputElement).checked ? 4000 : 0;
});
document.getElementById("gallery-show-autoplay-control")?.addEventListener("change", (event) => {
  galleryDemo.showAutoplayControl = (event.target as HTMLInputElement).checked;
});
galleryIndex?.addEventListener("change", () => {
  galleryDemo.currentIndex = Number(galleryIndex.value);
});
document.getElementById("gallery-aspect-ratio")?.addEventListener("change", (event) => {
  galleryDemo.aspectRatio = (event.target as HTMLSelectElement).value;
});
document.getElementById("gallery-object-fit")?.addEventListener("change", (event) => {
  galleryDemo.objectFit = (event.target as HTMLSelectElement).value as PhotoGalleryObjectFit;
});
galleryDemo?.addEventListener("slide-change", (event) => {
  const detail = (event as CustomEvent<PhotoGallerySlideChangeDetail>).detail;
  galleryIndex.value = String(detail.currentIndex);
  galleryStatus.textContent = `Showing image ${detail.currentIndex + 1} of 3 (${detail.reason})`;
});

// roman-numeral
const romanInput = document.getElementById("roman-input") as HTMLInputElement;
const romanOutput = document.getElementById("roman-output") as RomanNumeral;
romanInput?.addEventListener("input", () => {
  romanOutput.value = Number(romanInput.value);
});

// confirm-dialog
const confirmDemo = document.getElementById("confirm-demo") as ConfirmDialog;
const confirmCount = document.getElementById("confirm-count")!;
const cancelCount = document.getElementById("cancel-count")!;
let confirms = 0;
let cancels = 0;
document.getElementById("confirm-open")?.addEventListener("click", () => {
  confirmDemo.open = true;
});
confirmDemo?.addEventListener("confirm", () => {
  confirms += 1;
  confirmCount.textContent = String(confirms);
  confirmDemo.open = false;
});
confirmDemo?.addEventListener("cancel", () => {
  cancels += 1;
  cancelCount.textContent = String(cancels);
  confirmDemo.open = false;
});

// toast-notification
document.getElementById("toast-success")?.addEventListener("click", () => notifySuccess("Saved successfully"));
document.getElementById("toast-error")?.addEventListener("click", () => notifyError("Something went wrong"));
document.getElementById("toast-info")?.addEventListener("click", () => notifyInfo("Heads up: new listings nearby"));
document
  .getElementById("toast-warning")
  ?.addEventListener("click", () =>
    notifyWarning("Listing expires soon", "This listing will be archived in 3 days unless renewed."),
  );
document
  .getElementById("toast-description")
  ?.addEventListener("click", () =>
    notifySuccess("Listing published", "Your listing is now visible to buyers in this area."),
  );

// scroll-to-bottom (window instance + container-target instance, log clicks)
const scrollBottomContainer = document.getElementById("scroll-bottom-container") as HTMLElement;
const scrollBottomContainerBtn = document.getElementById("scroll-bottom-container-btn") as HTMLElement & {
  target: HTMLElement | null;
};
if (scrollBottomContainerBtn) scrollBottomContainerBtn.target = scrollBottomContainer;
const scrollBottomLog = document.getElementById("scroll-bottom-log")!;
document.getElementById("scroll-bottom-window")?.addEventListener("scroll-to-bottom-triggered", () => {
  scrollBottomLog.textContent = "scroll-to-bottom-triggered: window";
});
scrollBottomContainerBtn?.addEventListener("scroll-to-bottom-triggered", () => {
  scrollBottomLog.textContent = "scroll-to-bottom-triggered: container";
});

// scroll-to-top (window instance + container-target instance, log clicks)
const scrollTopContainer = document.getElementById("scroll-top-container") as HTMLElement;
const scrollTopContainerBtn = document.getElementById("scroll-top-container-btn") as HTMLElement & {
  target: HTMLElement | null;
};
if (scrollTopContainerBtn) scrollTopContainerBtn.target = scrollTopContainer;
const scrollTopLog = document.getElementById("scroll-top-log")!;
document.getElementById("scroll-top-window")?.addEventListener("scroll-to-top-triggered", () => {
  scrollTopLog.textContent = "scroll-to-top-triggered: window";
});
scrollTopContainerBtn?.addEventListener("scroll-to-top-triggered", () => {
  scrollTopLog.textContent = "scroll-to-top-triggered: container";
});
// Start the container-target scroll-to-top demo scrolled down so its button
// is visible without requiring the reviewer to scroll the container first.
if (scrollTopContainer) scrollTopContainer.scrollTop = scrollTopContainer.scrollHeight;

// slide-panel
const panelDemo = document.getElementById("panel-demo") as SlidePanel;
document.getElementById("panel-open")?.addEventListener("click", () => {
  panelDemo.open = true;
});
panelDemo?.addEventListener("panel-close", () => {
  panelDemo.open = false;
});

// copy-link-button
const copyStatus = document.getElementById("copy-status")!;
document.getElementById("copy-demo")?.addEventListener("copy-success", () => {
  copyStatus.textContent = "Copied!";
});
document.getElementById("copy-demo")?.addEventListener("copy-error", () => {
  copyStatus.textContent = "Copy failed";
});

// relative-time
const relativeInput = document.getElementById("relative-input") as HTMLInputElement;
const relativeOutput = document.getElementById("relative-output") as RelativeTime;
function updateRelativeTime() {
  const hours = Number(relativeInput.value) || 0;
  const date = new Date(Date.now() - hours * 60 * 60 * 1000);
  relativeOutput.datetime = date.toISOString();
}
relativeInput?.addEventListener("input", updateRelativeTime);
updateRelativeTime();

// distance-value
const milesInput = document.getElementById("distance-miles-input") as HTMLInputElement;
const milesOutput = document.getElementById("distance-miles-output") as DistanceValue;
milesInput?.addEventListener("input", () => {
  milesOutput.miles = Number(milesInput.value);
});
const milesLongInput = document.getElementById("distance-miles-long-input") as HTMLInputElement;
const milesLongOutput = document.getElementById("distance-miles-long-output") as DistanceValue;
milesLongInput?.addEventListener("input", () => {
  milesLongOutput.miles = Number(milesLongInput.value);
});

// price-history-chart
const priceHistoryDemo = document.getElementById("price-history-demo") as PriceHistoryChart;
if (priceHistoryDemo) {
  priceHistoryDemo.history = [
    { date: "2023-01-15", price: 620000, eventType: "Listed" },
    { date: "2023-04-02", price: 635000, eventType: "Price change" },
    { date: "2023-08-20", price: 645000, eventType: "Price change" },
    { date: "2024-01-10", price: 660000, eventType: "Relisted" },
    { date: "2024-06-05", price: 680000, eventType: "Sold" },
  ];
}

// distribution-chart
const distributionDemo = document.getElementById("distribution-demo") as DistributionChart;
if (distributionDemo) {
  distributionDemo.values = [{ label: "", value: 1450 }];
  // Set after the fetch shim above is installed, since setting `metric` as an
  // HTML attribute would trigger the element's fetch during upgrade — before
  // this module's own body (and its fetch shim) has run.
  distributionDemo.metric = "sqft";
}

// percent-bar-chart (toggle mode/orientation on the primary demo instance)
const percentBarDemo = document.getElementById("percent-bar-demo") as PercentBarChart;
if (percentBarDemo) {
  percentBarDemo.groups = [
    { key: "white", label: "White", value: 45.2, color: "#4f46e5" },
    { key: "asian", label: "Asian", value: 28.1, color: "#0d9488" },
    { key: "hispanic", label: "Hispanic", value: 18.4, color: "#d97706" },
    { key: "other", label: "Other", value: 8.3, color: "#e11d48" },
  ];
}
const percentBarModeToggle = document.getElementById("percent-bar-mode-toggle") as HTMLButtonElement;
percentBarModeToggle?.addEventListener("click", () => {
  if (!percentBarDemo) return;
  percentBarDemo.mode = percentBarDemo.mode === "percent" ? "value" : "percent";
  percentBarModeToggle.textContent = `Mode: ${percentBarDemo.mode}`;
});
const percentBarOrientationToggle = document.getElementById(
  "percent-bar-orientation-toggle",
) as HTMLButtonElement;
percentBarOrientationToggle?.addEventListener("click", () => {
  if (!percentBarDemo) return;
  percentBarDemo.orientation = percentBarDemo.orientation === "horizontal" ? "vertical" : "horizontal";
  percentBarOrientationToggle.textContent = `Orientation: ${percentBarDemo.orientation}`;
});

// percent-bar-chart (mode="value" + orientation="vertical", custom valueFormat)
const percentBarValueDemo = document.getElementById("percent-bar-value-demo") as PercentBarChart;
if (percentBarValueDemo) {
  percentBarValueDemo.groups = [
    { key: "q1", label: "Q1", value: 42000, color: "#4f46e5" },
    { key: "q2", label: "Q2", value: 58500, color: "#0d9488" },
    { key: "q3", label: "Q3", value: 39750, color: "#d97706" },
    { key: "q4", label: "Q4", value: 71200, color: "#e11d48" },
  ];
  percentBarValueDemo.valueFormat = (value) => `$${Math.round(value / 1000)}k`;
}

// weight-bar-chart
const weightBarDemo = document.getElementById("weight-bar-demo") as WeightBarChart;
function randomWeights() {
  const raw = [Math.random(), Math.random(), Math.random()];
  const sum = raw.reduce((a, b) => a + b, 0);
  const [price, schools, commute] = raw.map((v) => v / sum);
  return [
    { id: "price", label: "Price", value: price },
    { id: "schools", label: "Schools", value: schools },
    { id: "commute", label: "Commute", value: commute },
  ];
}
if (weightBarDemo) {
  weightBarDemo.items = randomWeights();
}
document.getElementById("weight-shuffle")?.addEventListener("click", () => {
  weightBarDemo.items = randomWeights();
});

// address-autocomplete
const addressSelected = document.getElementById("address-selected")!;
const addressDemo = document.getElementById("address-demo") as HTMLElement & {
  suggestions: { address: string; lat: number; lng: number }[];
};
if (addressDemo) {
  addressDemo.suggestions = [
    { address: "1 Infinite Loop, Cupertino, CA", lat: 37.3318, lng: -122.0312 },
    { address: "1600 Amphitheatre Parkway, Mountain View, CA", lat: 37.4224, lng: -122.084 },
    { address: "1600 Pennsylvania Ave NW, Washington, DC", lat: 38.8977, lng: -77.0365 },
    { address: "10 Downing Street, London", lat: 51.5034, lng: -0.1276 },
    { address: "350 Fifth Avenue, New York, NY", lat: 40.7484, lng: -73.9857 },
  ];
}
addressDemo?.addEventListener("address-select", (e) => {
  const detail = (e as CustomEvent).detail;
  addressSelected.textContent = `Selected: ${detail.address} (${detail.lat}, ${detail.lng})`;
});

// auto-scroll (append entries, wire the pinned-change "jump to latest" affordance)
const autoScrollDemo = document.getElementById("auto-scroll-demo") as AutoScroll;
const autoScrollTimeline = document.getElementById("auto-scroll-timeline")!;
const autoScrollJump = document.getElementById("auto-scroll-jump") as HTMLButtonElement;
let autoScrollMessageCount = 3;
document.getElementById("auto-scroll-add")?.addEventListener("click", () => {
  autoScrollMessageCount += 1;
  const entry = document.createElement("timeline-entry");
  entry.dataset.testid = `auto-scroll-e${autoScrollMessageCount}`;
  const headline = document.createElement("span");
  headline.slot = "headline";
  headline.textContent = "Progress";
  entry.append(headline, `Step ${autoScrollMessageCount - 1} complete.`);
  autoScrollTimeline.append(entry);
});
autoScrollDemo?.addEventListener("pinned-change", (e) => {
  const pinned = (e as CustomEvent<{ pinned: boolean }>).detail.pinned;
  autoScrollJump.hidden = pinned;
});
autoScrollJump?.addEventListener("click", () => {
  autoScrollDemo?.scrollToBottom();
});

// autocomplete-input
const autocompleteSelected = document.getElementById("autocomplete-selected")!;
const autocompleteDemo = document.getElementById("autocomplete-demo") as HTMLElement & {
  options: { key: string; value: string }[];
};
if (autocompleteDemo) {
  autocompleteDemo.options = [
    { key: "ts", value: "TypeScript" },
    { key: "js", value: "JavaScript" },
    { key: "py", value: "Python" },
    { key: "java", value: "Java" },
    { key: "go", value: "Go" },
    { key: "rs", value: "Rust" },
  ];
}
autocompleteDemo?.addEventListener("option-select", (e) => {
  const detail = (e as CustomEvent).detail;
  autocompleteSelected.textContent = `Selected: ${detail.value} (key: ${detail.key})`;
});
document.getElementById("autocomplete-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formValue = new FormData(e.target as HTMLFormElement).get("language");
  autocompleteSelected.textContent = `Submitted form value: ${formValue}`;
});

// radio-cards
const radioCardsDemo = document.getElementById("radio-cards-demo") as RadioCards;
const radioCardsSelected = document.getElementById("radio-cards-selected")!;
if (radioCardsDemo) {
  radioCardsDemo.options = [
    { value: "simple", label: "Simple", description: "Quick-ranking view" },
    { value: "detailed", label: "Detailed", description: "Every section and layer" },
  ];
  radioCardsDemo.value = "simple";
  radioCardsSelected.textContent = "simple";
}
radioCardsDemo?.addEventListener("change", (e) => {
  radioCardsSelected.textContent = (e as CustomEvent).detail.value;
});

// radio-pills
const radioPillsDemo = document.getElementById("radio-pills-demo") as RadioPills;
const radioPillsSelected = document.getElementById("radio-pills-selected")!;
if (radioPillsDemo) {
  radioPillsDemo.options = [
    { value: "light", label: "Light" },
    { value: "streets", label: "Streets" },
    { value: "outdoors", label: "Outdoors" },
    { value: "satellite", label: "Satellite" },
  ];
  radioPillsDemo.value = "light";
  radioPillsSelected.textContent = "light";
}
radioPillsDemo?.addEventListener("change", (e) => {
  radioPillsSelected.textContent = (e as CustomEvent).detail.value;
});

// range-slider (value readout + form submission)
const rangeSliderDemo = document.getElementById("range-slider-demo") as RangeSlider;
const rangeSliderValue = document.getElementById("range-slider-value")!;
rangeSliderDemo?.addEventListener("input", (e) => {
  rangeSliderValue.textContent = `${(e as CustomEvent<{ value: number }>).detail.value.toLocaleString()} ft`;
});

const rangeSliderForm = document.getElementById("range-slider-form") as HTMLFormElement;
const rangeSliderFormLog = document.getElementById("range-slider-form-log")!;
rangeSliderForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(rangeSliderForm);
  rangeSliderFormLog.textContent = `submitted volume=${data.get("volume")}`;
});

// button-group
const buttonGroupDemo = document.getElementById("button-group-demo") as ButtonGroup;
const buttonGroupSelected = document.getElementById("button-group-selected")!;
if (buttonGroupDemo) {
  buttonGroupDemo.options = [
    { value: "list", label: "List" },
    { value: "kanban", label: "Kanban" },
    { value: "calendar", label: "Calendar" },
  ];
  buttonGroupDemo.value = "list";
  buttonGroupSelected.textContent = "list";
}
buttonGroupDemo?.addEventListener("change", (e) => {
  buttonGroupSelected.textContent = (e as CustomEvent).detail.value;
});

const buttonGroupIconOnly = document.getElementById("button-group-icon-only") as ButtonGroup;
const buttonGroupIconOnlySelected = document.getElementById("button-group-icon-only-selected")!;
if (buttonGroupIconOnly) {
  buttonGroupIconOnly.options = [
    { value: "list", label: "List", icon: iconListBullet() },
    { value: "kanban", label: "Kanban", icon: iconSquares2x2() },
  ];
  buttonGroupIconOnly.value = "list";
  buttonGroupIconOnlySelected.textContent = "list";
}
buttonGroupIconOnly?.addEventListener("change", (e) => {
  buttonGroupIconOnlySelected.textContent = (e as CustomEvent).detail.value;
});

// ui-button (form-associated submit)
document.getElementById("button-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const note = new FormData(e.target as HTMLFormElement).get("note");
  document.getElementById("button-form-result")!.textContent = `Submitted: ${note}`;
});

// map-pin (highlighted toggle)
const pinHighlightDemo = document.getElementById("pin-highlight-demo") as MapPin;
document.getElementById("pin-highlight-toggle")?.addEventListener("click", () => {
  if (pinHighlightDemo) pinHighlightDemo.highlighted = !pinHighlightDemo.highlighted;
});

// map-circle (highlighted toggle)
const circleHighlightDemo = document.getElementById("circle-highlight-demo") as MapCircle;
document.getElementById("circle-highlight-toggle")?.addEventListener("click", () => {
  if (circleHighlightDemo) circleHighlightDemo.highlighted = !circleHighlightDemo.highlighted;
});

// mapbox-map (token-gated: needs VITE_MAPBOX_TOKEN to actually render)
const mapboxMapDemo = document.getElementById("mapbox-map-demo") as MapboxMap;
const mapboxMapStatus = document.getElementById("mapbox-map-status")!;
const mapboxToken = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_MAPBOX_TOKEN;
if (mapboxMapDemo) {
  if (mapboxToken) {
    mapboxMapDemo.accessToken = mapboxToken;
    mapboxMapDemo.center = [-122.42, 37.77];
    mapboxMapDemo.zoom = 10;
    mapboxMapDemo.addEventListener("map-ready", () => {
      mapboxMapStatus.textContent = "map-ready fired — mapboxgl.Map instance available via e.detail.map.";
    });
  } else {
    mapboxMapStatus.textContent = "Set VITE_MAPBOX_TOKEN in the playground's .env to see a live map here.";
  }
}

// markdown-view
const markdownViewDemo = document.getElementById("markdown-view-demo") as MarkdownView;
if (markdownViewDemo) {
  markdownViewDemo.markdown = [
    "## Release notes",
    "",
    "- Added **markdown-view**, a sanitized markdown renderer",
    "- Fixed a table alignment bug",
    "- Untrusted input is always sanitized: `<script>alert(1)</script>` is stripped",
    "",
    "```ts",
    "const el = document.querySelector(\"markdown-view\");",
    "el.markdown = \"# Hello\";",
    "```",
    "",
    "| Component | Status |",
    "| --- | --- |",
    "| markdown-view | New |",
    "| button-group | Updated |",
    "",
    "> See the [changelog](#markdown-view) for details.",
  ].join("\n");
}

// stat-meter (randomize CPU/MEM readings; I/O stays unset to show the null state)
const meterCpu = document.getElementById("meter-cpu") as StatMeter;
const meterMem = document.getElementById("meter-mem") as StatMeter;
document.getElementById("meter-randomize")?.addEventListener("click", () => {
  if (meterCpu) meterCpu.percent = Math.round(Math.random() * 100);
  if (meterMem) meterMem.percent = Math.round(Math.random() * 100);
});

// editable-text (log committed changes)
const editableChangeLog = document.getElementById("editable-change-log")!;
for (const id of ["editable-title", "editable-description"]) {
  const el = document.getElementById(id) as EditableText;
  el?.addEventListener("change", (e) => {
    editableChangeLog.textContent = `${id}: ${(e as CustomEvent).detail.value}`;
  });
}

// live-timer (start both demo timers from "now" on click)
const timerSeconds = document.getElementById("timer-seconds") as LiveTimer;
const timerCompact = document.getElementById("timer-compact") as LiveTimer;
document.getElementById("timer-start")?.addEventListener("click", () => {
  const now = new Date().toISOString();
  if (timerSeconds) timerSeconds.since = now;
  if (timerCompact) timerCompact.since = now;
});

// load-more (simulate a fetch with setTimeout, reach the exhausted state)
const loadMoreList = document.getElementById("load-more-list") as HTMLUListElement;
let loadMoreItemCount = 3;

const loadMoreBottom = document.getElementById("load-more-bottom") as LoadMore;
let loadMoreBottomLoads = 0;
loadMoreBottom?.addEventListener("load-more", () => {
  loadMoreBottom.loading = true;
  setTimeout(() => {
    for (let i = 0; i < 2; i++) {
      loadMoreItemCount += 1;
      const li = document.createElement("li");
      li.textContent = `Item ${loadMoreItemCount}`;
      loadMoreList.append(li);
    }
    loadMoreBottom.loading = false;
    loadMoreBottomLoads += 1;
    if (loadMoreBottomLoads >= 2) loadMoreBottom.exhausted = true;
  }, 500);
});

const loadMoreTop = document.getElementById("load-more-top") as LoadMore;
loadMoreTop?.addEventListener("load-more", () => {
  loadMoreTop.loading = true;
  setTimeout(() => {
    const li = document.createElement("li");
    li.textContent = "Item 0 (older)";
    loadMoreList.prepend(li);
    loadMoreTop.loading = false;
    loadMoreTop.exhausted = true;
  }, 500);
});

// chat-message (log collapsible toggles)
const chatToggleLog = document.getElementById("chat-toggle-log")!;
for (const id of ["msg-tool", "msg-thinking"]) {
  const el = document.getElementById(id) as ChatMessage;
  el?.addEventListener("toggle", (e) => {
    chatToggleLog.textContent = `${id} collapsed: ${(e as CustomEvent).detail.collapsed}`;
  });
}

// ui-checkbox (log toggles, wire the indeterminate demo, log form submission)
const checkboxBasic = document.getElementById("checkbox-basic") as UiCheckbox;
const checkboxBasicLog = document.getElementById("checkbox-basic-log")!;
checkboxBasic?.addEventListener("change", (e) => {
  checkboxBasicLog.textContent = `checked: ${(e as CustomEvent<{ checked: boolean }>).detail.checked}`;
});

const checkboxIcon = document.getElementById("checkbox-icon") as UiCheckbox;
if (checkboxIcon) checkboxIcon.icon = iconListBullet(14);

const checkboxIndeterminate = document.getElementById("checkbox-indeterminate") as UiCheckbox;
if (checkboxIndeterminate) checkboxIndeterminate.indeterminate = true;
document.getElementById("checkbox-indeterminate-toggle")?.addEventListener("click", () => {
  if (checkboxIndeterminate) checkboxIndeterminate.indeterminate = !checkboxIndeterminate.indeterminate;
});

const checkboxForm = document.getElementById("checkbox-form") as HTMLFormElement;
const checkboxFormLog = document.getElementById("checkbox-form-log")!;
checkboxForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(checkboxForm);
  checkboxFormLog.textContent = `submitted terms=${data.get("terms") ?? "(unchecked)"}`;
});

// form-select (seed options, log picked changes)
const selectOptions = [
  { value: "backlog", label: "Backlog", icon: iconListBullet(14), iconSize: 14 },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress", icon: iconArrowPath(16), iconSize: 16 },
  { value: "review", label: "Needs review", icon: iconEye(18), iconSize: 18 },
  { value: "done", label: "Done", icon: iconCheckCircle(16), iconSize: 16 },
];
const selectState = document.getElementById("select-state") as FormSelect;
if (selectState) {
  selectState.options = selectOptions;
  selectState.value = "open";
}
const selectSearchable = document.getElementById("select-searchable") as FormSelect;
if (selectSearchable) {
  selectSearchable.options = selectOptions;
  selectSearchable.value = "open";
}
// form-field (compose form-select/ui-checkbox/autocomplete-input, toggle error)
const fieldSelect = document.getElementById("field-select") as FormSelect;
if (fieldSelect) {
  fieldSelect.options = selectOptions;
  fieldSelect.value = "open";
}
const fieldCheckboxWrap = document.getElementById("field-checkbox-wrap") as FormField;
document.getElementById("field-error-toggle")?.addEventListener("click", () => {
  if (!fieldCheckboxWrap) return;
  fieldCheckboxWrap.error = fieldCheckboxWrap.error ? "" : "You must accept to continue";
});
const fieldAutocomplete = document.getElementById("field-autocomplete") as HTMLElement & {
  options: { key: string; value: string }[];
};
if (fieldAutocomplete) {
  fieldAutocomplete.options = [
    { key: "ts", value: "TypeScript" },
    { key: "js", value: "JavaScript" },
    { key: "py", value: "Python" },
  ];
}

const selectInline = document.getElementById("select-inline") as FormSelect;
if (selectInline) {
  selectInline.options = selectOptions;
  selectInline.value = "open";
}
const selectDisabled = document.getElementById("select-disabled") as FormSelect;
if (selectDisabled) {
  selectDisabled.options = [{ value: "locked", label: "Locked" }];
  selectDisabled.value = "locked";
}
const selectChangeLog = document.getElementById("select-change-log")!;
selectState?.addEventListener("change", (e) => {
  selectChangeLog.textContent = `select-state: ${(e as CustomEvent).detail.value}`;
});
const selectSearchableLog = document.getElementById("select-searchable-log")!;
selectSearchable?.addEventListener("change", (e) => {
  selectSearchableLog.textContent = `select-searchable: ${(e as CustomEvent).detail.value}`;
});

// multi-select (seed shared options, log change/submit, wire form reset)
const colorOptions: MultiSelectOption[] = [
  { value: "red", label: "Red", icon: iconCheckCircle(16), iconSize: 16 },
  { value: "green", label: "Green", icon: iconListBullet(16), iconSize: 16 },
  { value: "blue", label: "Blue", icon: iconEye(16), iconSize: 16 },
  { value: "amber", label: "Amber", icon: iconArrowPath(16), iconSize: 16 },
  { value: "violet", label: "Violet", icon: iconPencil(16), iconSize: 16 },
  { value: "gray", label: "Gray (disabled)", disabled: true },
];
const msChangeLog = document.getElementById("ms-change-log");
const seedMultiSelect = (id: string, values: string[]): MultiSelect | null => {
  const el = document.getElementById(id) as MultiSelect | null;
  if (!el) return null;
  el.options = colorOptions;
  el.values = values;
  el.addEventListener("change", (e) => {
    if (msChangeLog) {
      const picked = (e as CustomEvent<{ values: string[] }>).detail.values;
      msChangeLog.textContent = `${id}: [${picked.join(", ")}]`;
    }
  });
  return el;
};
seedMultiSelect("ms-dropdown", ["red", "blue"]);
seedMultiSelect("ms-searchable", ["green"]);
seedMultiSelect("ms-list", ["blue"]);
seedMultiSelect("ms-list-search", []);
seedMultiSelect("ms-inline", ["red"]);
seedMultiSelect("ms-required", ["red"]);
seedMultiSelect("ms-form-disabled", ["amber"]);
const msFormLog = document.getElementById("ms-form-log");
document.getElementById("ms-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = new FormData(e.target as HTMLFormElement).getAll("colors");
  if (msFormLog) {
    msFormLog.textContent = values.length
      ? `Submitted colors (${values.length}): ${values.join(", ")}`
      : "Submitted with no colors selected.";
  }
});
document.getElementById("ms-form")?.addEventListener("reset", () => {
  if (msFormLog) msFormLog.textContent = "Form reset to defaults.";
});

// popover-panel
const popoverDemo = document.getElementById("popover-demo") as PopoverPanel;
document.getElementById("popover-open")?.addEventListener("click", () => {
  popoverDemo.open = true;
});
popoverDemo?.addEventListener("panel-close", () => {
  popoverDemo.open = false;
});

const popoverCenteredDemo = document.getElementById("popover-centered-demo") as PopoverPanel;
document.getElementById("popover-centered-open")?.addEventListener("click", () => {
  popoverCenteredDemo.open = true;
});
popoverCenteredDemo?.addEventListener("panel-close", () => {
  popoverCenteredDemo.open = false;
});

// dropdown-button (seed options, log picked actions)
const dropdownResolve = document.getElementById("dropdown-resolve") as DropdownButton;
if (dropdownResolve) {
  dropdownResolve.options = [
    { value: "retry", label: "Retry" },
    { value: "close", label: "Close" },
    { value: "backlog", label: "Backlog" },
  ];
}
const dropdownSelectLog = document.getElementById("dropdown-select-log")!;
dropdownResolve?.addEventListener("select", (e) => {
  dropdownSelectLog.textContent = `dropdown-resolve: ${(e as CustomEvent).detail.value}`;
});
const dropdownDisabled = document.getElementById("dropdown-disabled") as DropdownButton;
if (dropdownDisabled) {
  dropdownDisabled.options = [{ value: "x", label: "X" }];
}

// icon-button (wire an icon, log clicks)
const iconButtonEdit = document.getElementById("icon-button-edit") as IconButton;
const iconButtonClickLog = document.getElementById("icon-button-click-log")!;
if (iconButtonEdit) {
  iconButtonEdit.icon = iconPencil(16);
  iconButtonEdit.addEventListener("click", () => {
    iconButtonClickLog.textContent = "icon-button-edit: clicked";
  });
}
const iconButtonDisabled = document.getElementById("icon-button-disabled") as IconButton;
if (iconButtonDisabled) {
  iconButtonDisabled.icon = iconPencil(16);
}

// kanban-board (seed columns/cards, log moves and opens)
const kanbanDemo = document.getElementById("kanban-demo") as KanbanBoard;
const kanbanLog = document.getElementById("kanban-log");
if (kanbanDemo) {
  let kanbanColumns: KanbanColumnData[] = [
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
        {
          id: "c2",
          ticket: "PROJ-148",
          title: "Empty-state illustration",
          description: "Design the illustration shown when a board has no cards.",
          createdAt: "2026-07-19T11:40:00Z",
          updatedAt: "2026-07-20T08:15:00Z",
        },
      ],
    },
    {
      id: "doing",
      title: "In Progress",
      cards: [
        {
          id: "c3",
          ticket: "PROJ-131",
          title: "Drag-and-drop reorder",
          description: "Support reordering cards within a column, not just across.",
          createdAt: "2026-07-15T16:22:00Z",
          updatedAt: "2026-07-22T10:05:00Z",
        },
      ],
    },
    {
      id: "done",
      title: "Done",
      cards: [
        {
          id: "c4",
          ticket: "PROJ-120",
          title: "Token audit",
          description: "Migrate every literal color onto a design token.",
          createdAt: "2026-07-10T13:00:00Z",
          updatedAt: "2026-07-17T09:30:00Z",
        },
      ],
    },
  ];
  kanbanDemo.columns = kanbanColumns;

  // Reference reducer: how a consumer applies a `card-move` to its own state.
  const applyKanbanMove = (
    columns: KanbanColumnData[],
    detail: { cardId: string; fromColumnId: string; toColumnId: string; toIndex: number },
  ): KanbanColumnData[] => {
    const next = columns.map((column) => ({ ...column, cards: [...column.cards] }));
    const from = next.find((column) => column.id === detail.fromColumnId);
    const to = next.find((column) => column.id === detail.toColumnId);
    if (!from || !to) return columns;
    const index = from.cards.findIndex((card) => card.id === detail.cardId);
    if (index < 0) return columns;
    const [card] = from.cards.splice(index, 1);
    to.cards.splice(Math.max(0, Math.min(detail.toIndex, to.cards.length)), 0, card);
    return next;
  };

  const kanbanManual = document.getElementById("kanban-manual") as HTMLInputElement | null;
  kanbanManual?.addEventListener("change", () => {
    kanbanDemo.manual = kanbanManual.checked;
    if (kanbanLog) {
      kanbanLog.textContent = kanbanManual.checked
        ? "Manual mode: the board waits for the simulated server to echo each move back."
        : "Optimistic mode: the board applies moves locally and emits card-move.";
    }
  });

  const kanbanReorderable = document.getElementById("kanban-reorderable") as HTMLInputElement | null;
  kanbanReorderable?.addEventListener("change", () => {
    kanbanDemo.reorderable = kanbanReorderable.checked;
    if (kanbanLog) {
      kanbanLog.textContent = kanbanReorderable.checked
        ? "Reordering within a column is on."
        : "Reordering within a column is off — cards can only move between columns.";
    }
  });

  kanbanDemo.addEventListener("card-move", (event) => {
    const detail = (event as CustomEvent).detail as {
      cardId: string;
      fromColumnId: string;
      toColumnId: string;
      toIndex: number;
    };
    // Keep our own copy in sync — this is the state a real app persists.
    kanbanColumns = applyKanbanMove(kanbanColumns, detail);
    if (kanbanLog) {
      kanbanLog.textContent = `card-move ${detail.cardId}: ${detail.fromColumnId} → ${detail.toColumnId} (index ${detail.toIndex})`;
    }
    // In manual mode the board didn't move the card; simulate an API write plus
    // a socket echo that assigns the authoritative state back to the board.
    if (kanbanDemo.manual) {
      window.setTimeout(() => {
        kanbanDemo.columns = kanbanColumns;
      }, 150);
    }
  });

  kanbanDemo.addEventListener("card-open", (event) => {
    const { cardId } = (event as CustomEvent).detail;
    if (kanbanLog) kanbanLog.textContent = `Opened ${cardId}`;
  });
}

// data-table (seed columns/rows, wire a row-click destination)
const tableTasks = document.getElementById("table-tasks") as DataTable;
if (tableTasks) {
  tableTasks.columns = [
    { key: "title", label: "Title" },
    { key: "state", label: "State" },
  ];
  tableTasks.rows = [
    { id: "tsk_1", title: "Write onboarding docs", state: "Backlog" },
    { id: "tsk_2", title: "Fix the login bug", state: "Done" },
  ];
  tableTasks.rowHref = (row) => `#${(row as { id: string }).id}`;
}

// tile-grid
const gridFiles = document.getElementById("grid-files") as TileGrid;
if (gridFiles) {
  gridFiles.items = [
    { id: "fil_1", name: "notes.txt" },
    { id: "fil_2", name: "photo.jpg" },
  ];
  gridFiles.renderTile = (item) => (item as { name: string }).name;
  gridFiles.itemHref = (item) => `#${(item as { id: string }).id}`;
}

// tree-view
const treeFiles = document.getElementById("tree-files") as TreeView;
if (treeFiles) {
  treeFiles.nodes = [
    {
      id: "docs",
      label: "docs",
      children: [{ id: "fil_1", label: "notes.txt", data: { id: "fil_1" } }],
    },
    { id: "fil_2", label: "readme.md", data: { id: "fil_2" } },
  ] satisfies TreeNode[];
  treeFiles.renderNode = (node) => (node as TreeNode).label;
  treeFiles.addEventListener("node-click", (e) => {
    const detail = (e as CustomEvent<{ id: string; data: unknown }>).detail;
    location.hash = `#${(detail.data as { id: string }).id}`;
  });
}

const treeLines = document.getElementById("tree-lines") as TreeView;
if (treeLines) {
  treeLines.nodes = [
    {
      id: "src",
      label: "src",
      children: [
        {
          id: "components",
          label: "components",
          children: [
            { id: "button.ts", label: "button.ts", data: { id: "button.ts" } },
            { id: "tree.ts", label: "tree.ts", data: { id: "tree.ts" } },
          ],
        },
        { id: "index.ts", label: "index.ts", data: { id: "index.ts" } },
      ],
    },
    { id: "readme.md", label: "README.md", data: { id: "readme.md" } },
  ] satisfies TreeNode[];
  treeLines.renderNode = (node) => (node as TreeNode).label;
}

// calendar-year
const calendarYearSelect = document.getElementById("calendar-year-select") as HTMLSelectElement | null;
const calendarYearDemo = document.getElementById("calendar-year-demo") as CalendarYear | null;
calendarYearSelect?.addEventListener("change", () => {
  if (calendarYearDemo) calendarYearDemo.year = Number(calendarYearSelect.value);
});

// Active nav link highlighting.
const sections = Array.from(document.querySelectorAll("main section[id]"));
const navLinks = new Map(
  Array.from(document.querySelectorAll<HTMLAnchorElement>(".demo-nav a")).map((a) => [a.getAttribute("href")?.slice(1), a]),
);
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const link = navLinks.get(entry.target.id);
      if (!link) continue;
      link.classList.toggle("active", entry.isIntersecting);
    }
  },
  { rootMargin: "-10% 0px -70% 0px" },
);
for (const section of sections) observer.observe(section);

// Sidebar component filter: an autocomplete-input whose local options are the
// in-page component anchors. Picking one jumps to that section by hash — a
// fast "find a component" affordance rather than an in-place list filter.
const navFilter = document.getElementById("nav-filter") as AutocompleteInput | null;
if (navFilter) {
  const componentAnchors = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.demo-nav a[href^="#"]'),
  );
  navFilter.options = componentAnchors.map((a) => {
    const id = a.getAttribute("href")!.slice(1);
    return { key: id, value: a.textContent?.trim() ?? id };
  });
  navFilter.addEventListener("option-select", (e) => {
    const { key } = (e as CustomEvent<AutocompleteOption>).detail;
    location.hash = `#${key}`;
  });
}

// ---------------------------------------------------------------------------
// Layout components: action-bar, app-shell, app-sidebar, form-actions,
// page-header, pagination-nav.
// ---------------------------------------------------------------------------

// app-shell — assembled dashboard: seed the table, toggle the detail column,
// and reflect the footer pager's page changes.
const appShellDemo = document.getElementById("app-shell-demo") as AppShell | null;
const appShellTable = document.getElementById("app-shell-table") as DataTable | null;
if (appShellTable) {
  appShellTable.columns = [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ];
  appShellTable.rows = [
    { id: "m1", name: "Ada Lovelace", role: "Owner", status: "Active" },
    { id: "m2", name: "Alan Turing", role: "Admin", status: "Active" },
    { id: "m3", name: "Grace Hopper", role: "Editor", status: "Invited" },
  ];
}
document.getElementById("app-shell-toggle-detail")?.addEventListener("click", () => {
  if (appShellDemo) appShellDemo.detailOpen = !appShellDemo.detailOpen;
});
const appShellPager = document.getElementById("app-shell-pager") as PaginationNav | null;
appShellPager?.addEventListener("page-change", (event) => {
  const { page } = (event as CustomEvent<{ page: number }>).detail;
  if (appShellPager) appShellPager.currentPage = page;
});

// app-sidebar — standalone: toggle rail mode and shrink the frame to the rail width.
const appSidebarDemo = document.getElementById("app-sidebar-demo") as AppSidebar | null;
const appSidebarFrame = document.getElementById("app-sidebar-frame");
const appSidebarToggle = document.getElementById("app-sidebar-toggle");
appSidebarToggle?.addEventListener("click", () => {
  if (!appSidebarDemo || !appSidebarFrame) return;
  appSidebarDemo.collapsed = !appSidebarDemo.collapsed;
  appSidebarFrame.style.width = appSidebarDemo.collapsed ? "3.5rem" : "16rem";
  appSidebarToggle.textContent = appSidebarDemo.collapsed ? "Expand" : "Collapse";
});

// form-actions — report which action fired without navigating away.
const formActionsForm = document.getElementById("form-actions-form") as HTMLFormElement | null;
const formActionsStatus = document.getElementById("form-actions-status");
formActionsForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (formActionsStatus) formActionsStatus.textContent = "Saved (submit fired).";
});
document.getElementById("form-actions-cancel")?.addEventListener("click", () => {
  if (formActionsStatus) formActionsStatus.textContent = "Cancelled.";
});
document.getElementById("form-actions-delete")?.addEventListener("click", () => {
  if (formActionsStatus) formActionsStatus.textContent = "Delete requested.";
});

// pagination-nav — controlled: reflect the chosen page back onto the element.
const paginationDemo = document.getElementById("pagination-demo") as PaginationNav | null;
const paginationStatus = document.getElementById("pagination-status");
paginationDemo?.addEventListener("page-change", (event) => {
  const { page } = (event as CustomEvent<{ page: number }>).detail;
  if (!paginationDemo) return;
  paginationDemo.currentPage = page;
  if (paginationStatus) {
    paginationStatus.textContent = `On page ${page} of ${paginationDemo.totalPages}`;
  }
});

// timeline-container — set each entry's datetime relative to now so the
// relative-time labels ("30 seconds ago", "2 hours ago") stay sensible.
for (const entry of document.querySelectorAll<HTMLElement>("#timeline-demo timeline-entry[data-ago]")) {
  const agoSeconds = Number(entry.dataset.ago);
  (entry as HTMLElement & { datetime: string }).datetime = new Date(
    Date.now() - agoSeconds * 1000,
  ).toISOString();
}
