# `<drop-zone>`

A form-associated area for choosing files by dragging them onto it or by
browsing. It only collects files — uploading them is up to the consumer.
Inside a native `<form>`, the chosen files are submitted under `name`,
just like `<input type="file">`, and `form.reset()` clears them.

Files are checked against `accept`, `max-size`, and `max-files` as they
arrive; files that don't fit are listed under the zone with the reason and
reported through `files-reject`. Without `multiple`, a new file replaces
the current one. Chosen files are listed with their size and a remove
button. The "Choose" button is the keyboard path; clicking anywhere on the
zone also opens the file picker.

## Install

```js
import "@f-ewald/components/drop-zone.js";
```

## Usage

```html
<form>
  <drop-zone
    name="attachments"
    accept="image/*,.pdf"
    multiple
    max-size="5242880"
    max-files="3"
    hint="Images or PDF, up to 5 MB each"
  ></drop-zone>
</form>
<script>
  const zone = document.querySelector("drop-zone");
  zone.addEventListener("change", (e) => console.log(e.detail.files));
  zone.addEventListener("files-reject", (e) => console.log(e.detail.rejected));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | Form field name the chosen files are submitted under. |
| `accept` | `accept` | `string` | `""` | Allowed files in native `accept` syntax, e.g. `"image/*,.pdf"`. Empty allows any file. |
| `multiple` | `multiple` | `boolean` | `false` | Allows choosing more than one file; otherwise a new file replaces the current one. |
| `maxSize` | `max-size` | `number` | `0` | Largest allowed file size in bytes; `0` means no limit. |
| `maxFiles` | `max-files` | `number` | `0` | Most files allowed with `multiple`; `0` means no limit. |
| `required` | `required` | `boolean` | `false` | Requires at least one file for native form validation. |
| `disabled` | `disabled` | `boolean` | `false` | Disables dropping, browsing, and removing. |
| `label` | `label` | `string` | `"Drag and drop files here"` | Main prompt text inside the zone. |
| `hint` | `hint` | `string` | `""` | Optional smaller line under the prompt, e.g. `"PNG or JPG, up to 5 MB"`. |
| `files` | _(JS property only)_ | `File[]` | `[]` | The chosen files. Setting it replaces the selection without firing `change`. |

## Events

| Event | Description |
| --- | --- |
| `files-reject` | Some dropped or picked files were not added; detail: `{ rejected: DropZoneRejection[] }`. |
| `change` | The chosen files changed through a drop, the picker, or a remove button; detail: `{ files: File[] }`. Setting `files` does not fire it. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
