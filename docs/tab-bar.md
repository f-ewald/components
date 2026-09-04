# `<tab-bar>`

WAI-ARIA tabs pattern (automatic activation, roving tabindex) driving a
strip of declarative `tab-item` children. `tab-bar` renders the `role="tab"`
button strip itself, reading `label`/`value`/`selected` off each slotted
`tab-item`; each `tab-item` owns its own visibility via its reflected
`selected` attribute.

The active tab's underline uses `--ui-primary`; a `--ui-border` line spans
the full strip beneath every tab, standing in for the inactive state since
this design system has no dedicated secondary accent color.

## Install

```js
import "@f-ewald/components/tab-bar.js";
```

## Usage

```html
<tab-bar label="Project sections">
  <tab-item label="Overview" value="overview" selected>Overview content</tab-item>
  <tab-item label="Activity" value="activity">Activity content</tab-item>
  <tab-item label="Settings" value="settings">Settings content</tab-item>
</tab-bar>
<script type="module">
  document.querySelector("tab-bar").addEventListener("change", (e) => console.log(e.detail.value));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible name for the tablist (e.g. "Editor mode"). |

## Events

| Event | Description |
| --- | --- |
| `change` | The active tab changed via click or keyboard; detail: `TabChangeDetail`. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | `tab-item` elements. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-text` |
| `--ui-text-muted` |
