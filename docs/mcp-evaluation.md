# MCP server evaluation

**Recommendation: do not build an MCP server for this package now.**

## Rationale

The component catalog is small (14 tags). `llms.txt` ships in the npm
package and is fetchable directly from unpkg or GitHub raw, so any LLM or
agent can load the full API surface — every component's attributes,
properties, events, slots, tokens, and a usage example — in one small file,
with no server, process, or additional versioning/packaging burden. An MCP
server would duplicate that same data behind a stdio process that needs its
own install, auth-free-but-still-a-process lifecycle, and release cadence
kept in sync with the package — for zero functional gain at this scale.

## When to revisit

- The catalog grows past a size where `llms.txt` stops being comfortable to
  load into a single context window (rule of thumb: ~30+ components).
- Consumers want live search, fuzzy matching, or filtered/paginated results
  instead of "load everything."
- Consumers want examples or docs that go beyond what's derivable from
  `custom-elements.json` (e.g. runnable playground snippets, live preview).

## Upgrade path

If/when it's warranted, a thin stdio MCP server exposing two tools —
`list_components` and `get_component_docs(tag)` — backed by the same
`custom-elements.json` this package already generates and ships. No new
data source would be needed; the server would just be a different transport
over data that already exists.
