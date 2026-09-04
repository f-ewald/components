# Marketing landing page

A monospace, editor/terminal-chrome marketing/landing page — no `app-shell`,
no sidebar: a sticky `window-chrome` bar, a hero, and a stack of section
components, set in the `developer-dark` theme by default with a working
toggle to `developer-light`.

**When to use:** a public-facing marketing/landing page for a developer
tool or product, in the terminal-styled `developer-dark`/`developer-light`
themes — not an authenticated dashboard view (use one of the other recipes
for that; this is the one shell-less exception in this set).

## Page structure

- `window-chrome` — sticky top bar; its `actions` slot holds a real
  `icon-button` (sun/moon) that toggles `data-theme` between
  `developer-dark`/`developer-light` — and actually reapplies the token
  values, unlike a real consumer that only needs to flip the attribute once
  `dist/tokens.css` is loaded (see the Notes below).
- Hero — a heading with a trailing `blink-cursor`, tagline, `ui-button` CTAs
  (bracket styling is literal slot text, e.g. `[ view on github ]` — not a
  component feature), and a `ui-admonition` callout.
- `comment-label` above each section heading (the `## section_name` eyebrow).
- `code-diff` — the "why" section's before/after snippet.
- `step-ladder` — the prioritized fallback list.
- `stat-strip` — the benchmark numbers row.
- `terminal-block` — install instructions, plus a `tile-grid` for other
  agents' install commands.
- `data-table` — the commands reference table.
- `frame-box` cards in a plain grid (each with a `status-pill` "default"
  badge on one) — the intensity/mode cards.
- Footer — `comment-label` (`prefix="//"` `italic`) quote line, plus a
  second `blink-cursor` after a prompt string.

## Markup

```html
<html data-theme="developer-dark">
  <body>
    <window-chrome label="~/product — README.md">
      <icon-button id="theme-toggle" slot="actions" label="Toggle light/dark"></icon-button>
    </window-chrome>

    <main class="wrap">
      <header class="hero">
        <h1>product<blink-cursor></blink-cursor></h1>
        <p class="tag">One line. It works.</p>
        <div class="cta">
          <ui-button variant="primary">[ view on github ]</ui-button>
          <ui-button variant="secondary">[ install ]</ui-button>
        </div>
        <ui-admonition variant="warning">
          Something's coming. Be the first to know.
          <ui-button slot="actions" size="sm" variant="secondary">Notify me</ui-button>
        </ui-admonition>
      </header>

      <section>
        <comment-label>the_whole_idea</comment-label>
        <h2>Your agent reaches for fifty lines. The job needs one.</h2>
        <code-diff id="landing-diff" filename="cache.py" stat="−48  +1"></code-diff>
      </section>

      <section>
        <comment-label>the_ladder</comment-label>
        <h2>Stop at the first rung that holds.</h2>
        <step-ladder id="landing-ladder"></step-ladder>
      </section>

      <footer>
        <comment-label prefix="//" italic>the best code is the code never written.</comment-label>
        <p class="prompt">~/product ❯ <blink-cursor></blink-cursor></p>
      </footer>
    </main>
  </body>
</html>
```

## Notes

- This recipe has no `app-shell` slots to fill — it's a plain document, styled
  by the page's own `<style>` block (`max-width`/section rhythm/hero type),
  the same way a component's own playground section owns its layout chrome.
- `data-diff`/`step-ladder`/`stat-strip`/`terminal-block`/`data-table`/
  `tile-grid` are all headless: seed their `items`/`lines`/`columns`/`rows`
  properties from a script, the same pattern `data-table` already uses in
  every other recipe.
- The theme toggle icon (`iconSun`/`iconMoon` from `icons.js`) is swapped by
  hand on click — `icon-button`'s `icon` property takes a pre-rendered
  template, it does not know about themes.
- A real consumer that has loaded `dist/tokens.css` only needs to flip
  `data-theme` between `"developer-dark"`/`"developer-light"` on `<html>` —
  the demo additionally re-applies the token values as inline custom
  properties because, like every demo/playground page, it imports component
  *sources* and never loads the built `dist/tokens.css` (see `CLAUDE.md`).
- Bracket CTAs (`[ view on github ]`) are literal text passed to `ui-button`'s
  default slot, not a component variant — `ui-button` itself is unchanged by
  this theme.

**Live demo:** `demo/layouts/marketing-landing.html`

**Components:** window-chrome, blink-cursor, comment-label, ui-button, ui-admonition, code-diff, step-ladder, stat-strip, terminal-block, tile-grid, data-table, frame-box, status-pill, icon-button
