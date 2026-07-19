import "../src/index.js";
import {
  notifySuccess,
  notifyError,
  notifyInfo,
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
  type MapPin,
  type MapCircle,
  type StatMeter,
  type EditableText,
  type LiveTimer,
  type ChatMessage,
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

// percent-bar-chart
const percentBarDemo = document.getElementById("percent-bar-demo") as PercentBarChart;
if (percentBarDemo) {
  percentBarDemo.groups = [
    { key: "white", label: "White", pct: 45.2, color: "#4f46e5" },
    { key: "asian", label: "Asian", pct: 28.1, color: "#0d9488" },
    { key: "hispanic", label: "Hispanic", pct: 18.4, color: "#d97706" },
    { key: "other", label: "Other", pct: 8.3, color: "#e11d48" },
  ];
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

// chat-message (log collapsible toggles)
const chatToggleLog = document.getElementById("chat-toggle-log")!;
for (const id of ["msg-tool", "msg-thinking"]) {
  const el = document.getElementById(id) as ChatMessage;
  el?.addEventListener("toggle", (e) => {
    chatToggleLog.textContent = `${id} collapsed: ${(e as CustomEvent).detail.collapsed}`;
  });
}

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
