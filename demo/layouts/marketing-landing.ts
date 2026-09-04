import "../../src/index.js";
import type {
  CodeDiff,
  StepLadder,
  StatStrip,
  TerminalBlock,
  TileGrid,
  DataTable,
  IconButton,
} from "../../src/index.js";
import { iconSun, iconMoon } from "../../src/icons.js";
import { developerDarkTokenValues, developerLightTokenValues } from "../../src/tokens.js";
import { html } from "lit";

/**
 * Wiring for the shell-less marketing-landing template demo: seeds every
 * data-driven section component and makes the `window-chrome` theme toggle
 * actually switch between `developer-dark`/`developer-light` — unlike the
 * reference this page is modeled on, whose own light-mode button is a running
 * joke that never switches anything.
 */

const diff = document.getElementById("landing-diff") as CodeDiff | null;
if (diff) {
  diff.lines = [
    { type: "del", text: "class CacheManager:" },
    { type: "del", text: "def __init__(self, ttl, maxsize): ..." },
    { type: "context", text: "" },
    { type: "add", text: "@lru_cache(maxsize=1000)" },
    { type: "add", text: "def fetch(...): ..." },
  ];
}

const ladder = document.getElementById("landing-ladder") as StepLadder | null;
if (ladder) {
  ladder.items = [
    { title: "Does this need to exist?", description: "Speculative need = skip it." },
    {
      title: "Already in this codebase?",
      description: "Reuse the helper, util, or pattern that already lives here.",
    },
    { title: "Does the standard library do it?", description: "Use it." },
    { title: "Native platform feature covers it?", description: "Prefer it over a picker library." },
    { title: "Can it be one line?", description: "One line." },
  ];
}

const stats = document.getElementById("landing-stats") as StatStrip | null;
if (stats) {
  stats.items = [
    { value: "54%", label: "less code" },
    { value: "22%", label: "fewer tokens" },
    { value: "20%", label: "lower cost" },
    { value: "27%", label: "faster" },
    { value: "100%", label: "safety kept" },
  ];
}

const terminal = document.getElementById("landing-terminal") as TerminalBlock | null;
if (terminal) {
  terminal.lines = [
    { type: "comment", text: "# Claude Code" },
    { type: "prompt", text: "/plugin marketplace add example/example" },
    { type: "prompt", text: "/plugin install example@example" },
  ];
}

interface OtherAgent {
  name: string;
  command: string;
}

const others = document.getElementById("landing-others") as TileGrid | null;
if (others) {
  others.items = [
    { name: "codex", command: "codex plugin marketplace add example/example" },
    { name: "copilot cli", command: "copilot plugin install example@example" },
    { name: "gemini cli", command: "gemini extensions install github.com/example/example" },
    { name: "pi harness", command: "pi install git:github.com/example/example" },
  ] satisfies OtherAgent[];
  others.renderTile = (item) => {
    const agent = item as OtherAgent;
    return html`<span class="other-agent">${agent.name}</span
      ><code class="other-command">${agent.command}</code>`;
  };
}

const commands = document.getElementById("landing-commands") as DataTable | null;
if (commands) {
  commands.columns = [
    { key: "command", label: "Command" },
    { key: "description", label: "Description" },
  ];
  commands.rows = [
    { command: "/product lite|full|ultra|off", description: "set intensity, or turn it off" },
    { command: "/product-review", description: "find over-engineering in the current diff" },
    { command: "/product-audit", description: "scan the whole repo for bloat" },
  ];
}

// The theme toggle: swaps data-theme on <html> and the icon, so the page
// (unlike its reference) actually has a working light mode.
//
// This demo — unlike the shared playground's own theme picker in
// ../main.ts — is the only consumer of a theme on this page, so it applies
// the token values as inline custom properties directly rather than
// reimplementing main.ts's multi-theme picker. Necessary because this page
// (like every demo/playground page) imports component *sources*, never the
// built package, so dist/tokens.css's [data-theme] rules are never present
// here — only a real consumer that loads dist/tokens.css gets the toggled
// data-theme attribute alone to do the full job.
const toggle = document.getElementById("theme-toggle") as IconButton | null;
const THEMES = { dark: "developer-dark", light: "developer-light" } as const;

function applyTheme(name: (typeof THEMES)[keyof typeof THEMES]): void {
  const { style, dataset } = document.documentElement;
  for (const values of [developerDarkTokenValues, developerLightTokenValues]) {
    for (const property of Object.keys(values)) style.removeProperty(property);
  }
  const values = name === THEMES.dark ? developerDarkTokenValues : developerLightTokenValues;
  for (const [property, value] of Object.entries(values)) style.setProperty(property, value);
  dataset.theme = name;
}

function syncToggleIcon(): void {
  if (!toggle) return;
  const isDark = document.documentElement.dataset.theme !== THEMES.light;
  toggle.icon = isDark ? iconMoon(16) : iconSun(16);
  toggle.label = isDark ? "Switch to light mode" : "Switch to dark mode";
}

toggle?.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme !== THEMES.light;
  applyTheme(isDark ? THEMES.light : THEMES.dark);
  syncToggleIcon();
});

applyTheme(THEMES.dark);
syncToggleIcon();
