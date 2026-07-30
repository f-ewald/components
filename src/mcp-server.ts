#!/usr/bin/env node
/**
 * Stdio MCP server exposing the `@f-ewald/components` catalog to AI coding
 * assistants (Claude Code, etc.) working in a consuming project.
 *
 * Tools, backed by the same `custom-elements.json` and `docs/*.md` this
 * package already generates and ships via `npm run docs`, plus the authored
 * `docs/layouts/*.md` recipes:
 * - `list_components`: every tag name + one-line description.
 * - `get_component_docs`: the full generated Markdown doc for one tag.
 * - `list_layouts`: every dashboard page template + one-line summary.
 * - `get_layout`: the full recipe for one page template.
 * - `list_icons`: every icon, its default size, and its intended use case.
 *
 * No new data source — this is just a different transport over docs that
 * already exist. See `docs/mcp-evaluation.md` for the design rationale.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// This file compiles to dist/mcp-server.js; custom-elements.json and docs/
// ship alongside dist/ at the package root, whether run from the repo
// checkout or from an installed node_modules/@f-ewald/components.
const packageRoot = path.join(__dirname, "..");
const docsDir = path.join(packageRoot, "docs");
const layoutsDir = path.join(docsDir, "layouts");

/** One row of the `list_components` result. */
interface ComponentSummary {
  tag: string;
  summary: string;
}

/** One row of the `list_layouts` result. */
interface LayoutSummary {
  name: string;
  title: string;
  summary: string;
}

/** One row of the `list_icons` result. */
interface IconSummary {
  name: string;
  defaultSize: number;
  usage: string;
}

/** Reads the package's own version out of package.json, for server metadata. */
async function readPackageVersion(): Promise<string> {
  const text = await readFile(path.join(packageRoot, "package.json"), "utf8");
  return (JSON.parse(text) as { version: string }).version;
}

/** Extracts {tag, one-line summary} for every custom element, sorted by tag. */
async function listComponents(): Promise<ComponentSummary[]> {
  const text = await readFile(path.join(packageRoot, "custom-elements.json"), "utf8");
  const manifest = JSON.parse(text) as {
    modules: { declarations?: { customElement?: boolean; tagName: string; description?: string }[] }[];
  };
  const components: ComponentSummary[] = [];
  for (const mod of manifest.modules) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.customElement) continue;
      const summary = (decl.description ?? "").split("\n\n")[0]!.replace(/\n/g, " ").trim();
      components.push({ tag: decl.tagName, summary });
    }
  }
  components.sort((a, b) => a.tag.localeCompare(b.tag));
  return components;
}

/**
 * Extracts {name, defaultSize, usage} for every `icon*` export in
 * `src/icons.ts`, sorted by name. `usage` is the "use for ..." guideline
 * `scripts/generate-icons.mjs` writes as a JSDoc comment above each export,
 * which `npm run analyze` lifts into this same `custom-elements.json` — the
 * same source `listComponents` reads, just a different module/kind filter.
 */
async function listIcons(): Promise<IconSummary[]> {
  const text = await readFile(path.join(packageRoot, "custom-elements.json"), "utf8");
  const manifest = JSON.parse(text) as {
    modules: {
      path: string;
      declarations?: {
        kind?: string;
        name: string;
        description?: string;
        parameters?: { default?: string }[];
      }[];
    }[];
  };
  const icons: IconSummary[] = [];
  for (const mod of manifest.modules) {
    if (mod.path !== "src/icons.ts") continue;
    for (const decl of mod.declarations ?? []) {
      if (decl.kind !== "function" || !decl.name.startsWith("icon")) continue;
      icons.push({
        name: decl.name,
        defaultSize: Number(decl.parameters?.[0]?.default ?? 18),
        usage: decl.description ?? "",
      });
    }
  }
  icons.sort((a, b) => a.name.localeCompare(b.name));
  return icons;
}

/**
 * Extracts {name, title, one-line summary} for every `docs/layouts/*.md`
 * recipe, sorted by name. `name` is the filename without `.md`; `summary` is
 * the recipe's first prose paragraph.
 */
async function listLayouts(): Promise<LayoutSummary[]> {
  let files: string[];
  try {
    files = await readdir(layoutsDir);
  } catch {
    return [];
  }
  const layouts: LayoutSummary[] = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const name = file.slice(0, -3);
    const lines = (await readFile(path.join(layoutsDir, file), "utf8")).split("\n");
    const title = lines.find((line) => line.startsWith("# "))?.slice(2).trim() ?? name;
    let seenTitle = false;
    let summary = "";
    for (const line of lines) {
      const text = line.trim();
      if (!seenTitle) {
        if (text.startsWith("# ")) seenTitle = true;
        continue;
      }
      if (text === "" || text.startsWith("#")) continue;
      summary = text;
      break;
    }
    layouts.push({ name, title, summary });
  }
  layouts.sort((a, b) => a.name.localeCompare(b.name));
  return layouts;
}

const server = new McpServer({
  name: "f-ewald-components",
  version: await readPackageVersion(),
});

server.registerTool(
  "list_components",
  {
    title: "List components",
    description:
      "Lists every web component tag in @f-ewald/components with a one-line " +
      "description. Call get_component_docs(tag) for the full usage example, " +
      "attributes/properties, events, slots, and CSS custom properties of a " +
      "specific tag.",
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(await listComponents(), null, 2) }],
  }),
);

server.registerTool(
  "get_component_docs",
  {
    title: "Get component docs",
    description:
      "Returns the full generated Markdown documentation (install snippet, " +
      "usage example, attributes/properties, events, slots, CSS custom " +
      "properties) for one @f-ewald/components tag. Use list_components " +
      "first to find valid tags.",
    inputSchema: { tag: z.string().describe('Component tag name, e.g. "ui-button".') },
  },
  async ({ tag }) => {
    try {
      const text = await readFile(path.join(docsDir, `${tag}.md`), "utf8");
      return { content: [{ type: "text", text }] };
    } catch {
      const validTags = (await listComponents()).map((c) => c.tag).join(", ");
      return {
        content: [{ type: "text", text: `No docs found for tag "${tag}". Valid tags: ${validTags}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "list_layouts",
  {
    title: "List layouts",
    description:
      "Lists the dashboard page templates (layout recipes) in " +
      "@f-ewald/components — list-only, list+detail, detail-only, and form — " +
      "with a one-line summary each. Call get_layout(name) for the full recipe " +
      "(which components fill which app-shell slots, example markup, and notes). " +
      "Use this to learn the preferred internal-dashboard layout before " +
      "composing app-shell, app-sidebar, action-bar, pagination-nav, " +
      "form-actions, and page-header.",
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(await listLayouts(), null, 2) }],
  }),
);

server.registerTool(
  "get_layout",
  {
    title: "Get layout recipe",
    description:
      "Returns the full Markdown recipe for one dashboard page template: which " +
      "components go in which app-shell slots, copy-paste markup, and layout " +
      "notes. Use list_layouts first to find valid names.",
    inputSchema: { name: z.string().describe('Layout name, e.g. "list-detail".') },
  },
  async ({ name }) => {
    if (/^[a-z0-9-]+$/.test(name)) {
      try {
        const text = await readFile(path.join(layoutsDir, `${name}.md`), "utf8");
        return { content: [{ type: "text", text }] };
      } catch {
        // Fall through to the not-found response with valid names.
      }
    }
    const validNames = (await listLayouts()).map((layout) => layout.name).join(", ");
    return {
      content: [{ type: "text", text: `No layout named "${name}". Valid layouts: ${validNames}` }],
      isError: true,
    };
  },
);

server.registerTool(
  "list_icons",
  {
    title: "List icons",
    description:
      "Lists every icon in @f-ewald/components/icons.js (e.g. iconPencil) " +
      "with its default size in pixels and its intended use case, so an " +
      "agent picks the one consistent icon for a given situation (e.g. " +
      "delete vs. edit vs. close) instead of guessing. Import as " +
      '`import { iconPencil } from "@f-ewald/components/icons.js"` and call ' +
      "with an optional size override, e.g. iconPencil(16).",
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(await listIcons(), null, 2) }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
