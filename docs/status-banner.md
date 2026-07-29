# `<status-banner>`

Full-width, app-level status bar for a persistent condition — "Reconnecting…",
"Read-only mode", "New version available". Unlike `toast-notification` (which
is transient, imperative, and stacks in a corner) this stays put for as long
as the condition holds, so the consumer controls its presence by rendering it
or not.

Colors mirror `status-pill`: a tinted background with accent-colored text.
Announced to assistive tech via `role="status"` (or `role="alert"` for the
`danger` variant, matching `toast-notification`'s split).

## Install

```js
import "@f-ewald/components/status-banner.js";
```

## Usage

```html
<status-banner variant="warning">Reconnecting… — data may be stale</status-banner>
<status-banner variant="info">
  A new version is available.
  <button slot="actions">Reload</button>
</status-banner>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `StatusBannerVariant` | `"info"` | Visual style; also selects the accent color. |
| `icon` | _(JS property only)_ | `TemplateResult | null` | `null` | Optional leading icon, pre-rendered by the consumer (e.g. `iconInfo(14)`), matching `nav-item`/`icon-button` — icons are passed in, not named, so the component never has to know the icon catalog. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-info` |
| `--ui-line-height-normal` |
| `--ui-success` |
| `--ui-text-muted` |
| `--ui-warning` |
