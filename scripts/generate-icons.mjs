#!/usr/bin/env node
// Regenerates src/icons.ts from the heroicons package. Add an entry to
// ICONS below and re-run `npm run icons` to add a new icon.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const heroiconsDir = path.join(__dirname, "../node_modules/heroicons/24");

/**
 * `usage` is a short, imperative "use for/when ..." guideline — it's emitted
 * as a JSDoc comment above the generated export, which `npm run analyze`
 * then lifts into `custom-elements.json` as that function's `description`.
 * It's the single source of truth consumed by `docs/icons.md`, `llms.txt`,
 * and the MCP server's `list_icons` tool — always add one for a new icon.
 *
 * @type {Record<string, { slug: string; variant?: "outline" | "solid"; size?: number; usage: string }>}
 */
const ICONS = {
  X: { slug: "x-mark", usage: "Close, dismiss, or clear (e.g. a modal, toast, or clearable input)." },
  Bars3: { slug: "bars-3", usage: "A hamburger menu toggle, e.g. collapsing or opening a sidebar/nav drawer." },
  ChevronLeft: {
    slug: "chevron-left",
    size: 16,
    usage: "\"Previous\" navigation, e.g. pagination or carousel back controls.",
  },
  ChevronRight: {
    slug: "chevron-right",
    size: 16,
    usage: "\"Next\" navigation, or a collapsed disclosure/submenu indicator.",
  },
  ChevronUp: {
    slug: "chevron-up",
    size: 16,
    usage: "\"Scroll to top\", or an expanded/upward disclosure control.",
  },
  Cog: { slug: "cog-6-tooth", size: 20, usage: "Settings, preferences, or configuration entry points." },
  Info: { slug: "information-circle", size: 20, usage: "Neutral informational messages, e.g. an info toast or status banner." },
  QuestionMarkCircle: {
    slug: "question-mark-circle",
    size: 20,
    usage: "Help, tooltips, or \"learn more\" affordances.",
  },
  Pencil: { slug: "pencil", size: 16, usage: "Edit actions, e.g. an edit icon-button or inline edit toggle." },
  Trash: {
    slug: "trash",
    size: 16,
    usage: "Delete/remove actions, typically paired with a destructive/danger style.",
  },
  EllipsisVertical: {
    slug: "ellipsis-vertical",
    size: 16,
    usage: "An overflow (\"kebab\") menu trigger, e.g. dropdown-button's icon variant.",
  },
  Plus: { slug: "plus", size: 16, usage: "\"Add new\" actions, e.g. creating a new item or row." },
  ListBullet: { slug: "list-bullet", usage: "A list-view toggle, or to represent list-type content." },
  CurrencyDollar: {
    slug: "currency-dollar",
    size: 16,
    usage: "Monetary values, pricing, or billing-related content.",
  },
  Home: { slug: "home", size: 16, usage: "A primary navigation link to the app's home or dashboard." },
  MapPin: { slug: "map-pin", size: 16, usage: "A location, address, or map marker." },
  Clock: { slug: "clock", size: 16, usage: "Timestamps, durations, or time-related metadata." },
  Tag: { slug: "tag", size: 16, usage: "Tags, labels, or categorical metadata." },
  Calendar: { slug: "calendar", size: 16, usage: "Dates, due dates, or calendar-related metadata." },
  ArrowsPointingOut: { slug: "arrows-pointing-out", size: 16, usage: "\"Expand\" or \"view fullscreen\" actions." },
  Map: { slug: "map", size: 16, usage: "A map-view toggle, or to represent map/geographic content." },
  CheckCircle: {
    slug: "check-circle",
    size: 16,
    usage: "Success states, confirmations, or a selected-item checkmark.",
  },
  Sun: { slug: "sun", size: 16, usage: "A light-theme toggle, or to represent daytime/light mode." },
  Sparkles: {
    slug: "sparkles",
    size: 16,
    usage:
      "An AI-powered action (pairs with ui-button's `ai` ring), a gradient-theme toggle, or a decorative/enhanced visual style.",
  },
  ShieldExclamation: {
    slug: "shield-exclamation",
    size: 16,
    usage: "Security warnings, or at-risk/compromised states.",
  },
  ArrowPath: {
    slug: "arrow-path",
    size: 12,
    usage: "Refresh actions, or an animated busy/loading spinner.",
  },
  ArrowRight: {
    slug: "arrow-right",
    size: 12,
    usage: "\"Continue\" or forward-progressing actions, e.g. a compact next-step arrow.",
  },
  ArrowDownTray: { slug: "arrow-down-tray", size: 16, usage: "Download or export actions." },
  ArrowsRightLeft: {
    slug: "arrows-right-left",
    size: 16,
    usage: "Swap, exchange, or compare actions between two items.",
  },
  Link: { slug: "link", size: 16, usage: "Copy-link or hyperlink-related actions, e.g. copy-link-button." },
  Heart: { slug: "heart", size: 16, usage: "\"Like\"/\"favorite\" actions in their unselected state." },
  HeartSolid: {
    slug: "heart",
    variant: "solid",
    size: 16,
    usage: "\"Like\"/\"favorite\" actions in their selected/active state; pair with iconHeart for the unselected state.",
  },
  Eye: {
    slug: "eye",
    size: 16,
    usage: "\"Show\"/\"preview\" actions or a visible/reviewed state, e.g. password visibility or a review status.",
  },
  EyeSlash: {
    slug: "eye-slash",
    size: 16,
    usage: "\"Hide\" actions or a hidden/masked state; pair with iconEye for the visible state.",
  },
  ShieldCheck: { slug: "shield-check", size: 16, usage: "Verified, secure, or trusted states." },
  UserCircle: {
    slug: "user-circle",
    size: 20,
    usage: "A generic user/person fallback, e.g. user-avatar's icon fallback.",
  },
  ClipboardDocumentList: {
    slug: "clipboard-document-list",
    size: 18,
    usage: "Task lists, checklists, or clipboard/notes content.",
  },
  CpuChip: { slug: "cpu-chip", size: 18, usage: "System, hardware, or technical/processing content." },
  Folder: { slug: "folder", size: 18, usage: "Folders, directories, or grouped file content." },
  ChevronDown: {
    slug: "chevron-down",
    size: 16,
    usage: "\"Scroll to bottom\", a downward disclosure, or an expanded tree/accordion indicator.",
  },
  Document: { slug: "document", size: 18, usage: "A generic file/document icon, e.g. tile-grid's default file icon." },
  Squares2x2: {
    slug: "squares-2x2",
    size: 18,
    usage: "A grid or kanban-view toggle, or to represent card/tile layouts.",
  },
  ChatBubbleLeftRight: {
    slug: "chat-bubble-left-right",
    size: 18,
    usage: "Messaging, comments, or conversation-related content.",
  },
  ArrowTopRightOnSquare: {
    slug: "arrow-top-right-on-square",
    size: 16,
    usage: "Links that open in a new tab/window, or navigate to an external site.",
  },
  AcademicCap: { slug: "academic-cap", size: 18, usage: "Education, learning, or certification-related content." },
  QueueList: { slug: "queue-list", size: 16, usage: "Queues, backlogs, or ordered work-item lists." },
  ExclamationTriangle: {
    slug: "exclamation-triangle",
    size: 16,
    usage: "Warning states, e.g. the warning variant of toast-notification.",
  },
  ExclamationCircle: {
    slug: "exclamation-circle",
    size: 16,
    usage: "Error states, e.g. the error variant of toast-notification.",
  },
  Moon: { slug: "moon", size: 16, usage: "A dark-theme toggle, or to represent night/dark mode." },
  ComputerDesktop: {
    slug: "computer-desktop",
    size: 16,
    usage: "A \"system/auto\" theme option, or to represent a desktop device.",
  },
  CodeBracketSquare: {
    slug: "code-bracket-square",
    size: 16,
    usage: "Code snippets, developer tools, or technical/API content.",
  },
  PuzzlePiece: { slug: "puzzle-piece", size: 18, usage: "Plugins, integrations, or extensible/add-on features." },
  Users: { slug: "users", size: 18, usage: "Teams, groups, or multi-user/collaboration content." },
  ArrowRightOnRectangle: { slug: "arrow-right-on-rectangle", size: 16, usage: "Logout/sign-out actions." },
  WrenchScrewdriver: { slug: "wrench-screwdriver", size: 18, usage: "Tools, maintenance, or build/configuration actions." },
  Play: { slug: "play", size: 18, usage: "\"Play\" transport actions, e.g. audio-player/video-player's paused state." },
  Pause: { slug: "pause", size: 18, usage: "\"Pause\" transport actions, e.g. audio-player/video-player's playing state." },
  SpeakerWave: {
    slug: "speaker-wave",
    size: 18,
    usage: "An unmuted volume control, e.g. audio-player/video-player's mute toggle.",
  },
  SpeakerXMark: {
    slug: "speaker-x-mark",
    size: 18,
    usage: "A muted volume state; pair with iconSpeakerWave for the unmuted state.",
  },
  ArrowsPointingIn: {
    slug: "arrows-pointing-in",
    size: 16,
    usage: "\"Exit fullscreen\" actions; pair with iconArrowsPointingOut for entering fullscreen.",
  },
  GlobeAmericas: {
    slug: "globe-americas",
    size: 16,
    usage: "Terrain/outdoors content, or a Americas-centric globe/region selector.",
  },
  GlobeAlt: {
    slug: "globe-alt",
    size: 16,
    usage: "A generic globe/satellite-view toggle, or international/worldwide content.",
  },
  Signal: {
    slug: "signal",
    size: 16,
    usage: "Live/real-time data, connectivity strength, or a traffic-conditions toggle.",
  },
  Clipboard: {
    slug: "clipboard",
    size: 18,
    usage: "Copy-to-clipboard actions, e.g. copy-link-button.",
  },
  MagnifyingGlass: {
    slug: "magnifying-glass",
    size: 16,
    usage: "Search inputs or search-triggering actions.",
  },
};

/**
 * Extracts the inner markup (paths, etc.) of an SVG file's root element.
 * @param {string} svg
 * @returns {string}
 */
function innerOf(svg) {
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!match) {
    throw new Error("Could not parse SVG root element");
  }
  return match[1].trim().replace(/\s+/g, " ");
}

/**
 * @param {string} name
 * @param {{ slug: string; variant?: "outline" | "solid"; size?: number; usage: string }} spec
 */
async function renderIcon(name, spec) {
  const variant = spec.variant ?? "outline";
  const filePath = path.join(heroiconsDir, variant, `${spec.slug}.svg`);
  const raw = await readFile(filePath, "utf8");
  const inner = innerOf(raw);
  const defaultSize = spec.size ?? 18;

  const attrs =
    variant === "solid"
      ? `fill="currentColor"`
      : `fill="none" stroke-width="1.5" stroke="currentColor"`;

  return `/** ${spec.usage} */
export const icon${name} = (size = ${defaultSize}) =>
  svg\`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${attrs} width=\${size} height=\${size} aria-hidden="true">${inner}</svg>\`;`;
}

const entries = await Promise.all(
  Object.entries(ICONS).map(([name, spec]) => renderIcon(name, spec))
);

const header = `import { svg } from "lit";

// GENERATED by scripts/generate-icons.mjs — do not edit;
// add names to the ICONS list in the script and re-run \`npm run icons\`.
`;

const output = `${header}\n${entries.join("\n\n")}\n`;

await writeFile(path.join(__dirname, "../src/icons.ts"), output, "utf8");
console.log(`Wrote src/icons.ts with ${entries.length} icons`);
