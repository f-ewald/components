# `<cron-schedule>`

Repeat-schedule picker that reads and writes a standard 5-field cron
expression. The collapsed trigger shows a compact English description of
the current schedule ("Every hour", "10:17 every Monday"); clicking it
opens an anchored panel with the schedule form.

The panel offers frequency presets (every N minutes, hourly, daily, weekly,
monthly, yearly) plus an `Advanced` mode that edits each cron field as a
list of terms, so any valid expression — including compound fields that mix
ranges, steps, and single values — is reachable. Edits apply immediately:
each change updates `value` and fires `change`; closing the panel only
dismisses it.

An unparseable `value` (e.g. `@reboot`, which has no five-field form) is
preserved verbatim and shown as-is on the trigger; the panel then starts
from the default hourly schedule.

The host is `display: block` with a full-width trigger, matching the other
value-entry fields. To shrink an instance to its content, constrain the
host: `cron-schedule { display: inline-block; }`.

## Install

```js
import "@f-ewald/components/cron-schedule.js";
```

## Usage

```html
<cron-schedule label="Backup schedule" value="0 * * * *"></cron-schedule>

<script type="module">
  const schedule = document.querySelector("cron-schedule");
  schedule.addEventListener("change", (e) => {
    console.log(e.detail.value, schedule.description);
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `"0 * * * *"` | The cron expression, e.g. `"0 * * * *"`. |
| `label` | `label` | `string` | `""` | Accessible label for the trigger. |
| `disabled` | `disabled` | `boolean` | `false` | Whether the picker is disabled. |
| `open` | `open` | `boolean` | `false` | Whether the schedule panel is open. |
| `description` | _(JS property only)_ | `string` | `—` | The compact English description of the current expression. _(read-only)_ |

## Events

| Event | Description |
| --- | --- |
| `change` | Fired with `{ value: string }` whenever the expression changes. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-mono` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-label-transform` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-shadow-lg` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
