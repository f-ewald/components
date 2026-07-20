#!/usr/bin/env node
/**
 * Stdio MCP server exposing the `@f-ewald/components` catalog to AI coding
 * assistants (Claude Code, etc.) working in a consuming project.
 *
 * Two tools, backed by the same `custom-elements.json` and `docs/*.md` this
 * package already generates and ships via `npm run docs`:
 * - `list_components`: every tag name + one-line description.
 * - `get_component_docs`: the full generated Markdown doc for one tag.
 *
 * No new data source — this is just a different transport over data that
 * already exists. See `docs/mcp-evaluation.md` for the design rationale.
 */
import { readFile } from "node:fs/promises";
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

/** One row of the `list_components` result. */
interface ComponentSummary {
  tag: string;
  summary: string;
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

const transport = new StdioServerTransport();
await server.connect(transport);
