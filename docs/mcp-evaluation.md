# MCP server evaluation

**Update (0.6.0 era, 34 components): built.** The catalog crossed the ~30+
revisit threshold below, so the upgrade path described here was implemented
as `src/mcp-server.ts`. See the "MCP server" section in the root `CLAUDE.md`
for the current tools, build step, and how consuming projects wire it up.
The original evaluation is kept below for the reasoning that justified
waiting until this point.

## Original recommendation (superseded): do not build an MCP server yet

## Rationale

The component catalog was small (14 tags). `llms.txt` ships in the npm
package and is fetchable directly from unpkg or GitHub raw, so any LLM or
agent can load the full API surface — every component's attributes,
properties, events, slots, tokens, and a usage example — in one small file,
with no server, process, or additional versioning/packaging burden. An MCP
server would duplicate that same data behind a stdio process that needs its
own install, auth-free-but-still-a-process lifecycle, and release cadence
kept in sync with the package — for zero functional gain at that scale.

## When to revisit (met)

- The catalog grows past a size where `llms.txt` stops being comfortable to
  load into a single context window (rule of thumb: ~30+ components). —
  **met at 34 components.**
- Consumers want live search, fuzzy matching, or filtered/paginated results
  instead of "load everything."
- Consumers want examples or docs that go beyond what's derivable from
  `custom-elements.json` (e.g. runnable playground snippets, live preview).

## Upgrade path (implemented)

A thin stdio MCP server exposing two tools — `list_components` and
`get_component_docs(tag)` — backed by the same `custom-elements.json` this
package already generates and ships. No new data source was needed; the
server is just a different transport over data that already existed.
