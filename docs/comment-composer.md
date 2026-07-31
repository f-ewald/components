# `<comment-composer>`

GitHub/Slack-style comment composer: a one-line text field that expands
into a multi-line textarea with a bottom-right Cancel/Submit footer
(`form-actions`) as soon as it's focused or clicked. Submitting fires
`submit` with the trimmed value, then clears the field and collapses back
to one line — it's meant for posting one comment at a time, not editing a
persistent value in place (see `editable-text` for that). Canceling (the
Cancel button or `Escape`) discards the draft and collapses without
firing `submit`. Clicking away (blur) does neither — the composer stays
expanded until the user explicitly submits or cancels. `Cmd`/`Ctrl`+`Enter`
submits from the textarea, matching `editable-text`'s multiline shortcut —
the Submit button always shows a `kbd-hint` for it, so the shortcut is
discoverable rather than a hidden power-user feature.
Purely token-styled (no bespoke colors), so it's themeable via the same
`--ui-*` custom properties as every other value-entry field.

## Install

```js
import "@f-ewald/components/comment-composer.js";
```

## Usage

```html
<comment-composer placeholder="Add a comment…"></comment-composer>
<script type="module">
  document.querySelector("comment-composer").addEventListener("submit", (e) => {
    postComment(e.detail.value);
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | Committed value shown in the collapsed one-line field. |
| `placeholder` | `placeholder` | `string` | `"Add a comment…"` | Placeholder text shown when empty. |
| `label` | `label` | `string` | `"Comment"` | Accessible name applied to the input/textarea. |
| `rows` | `rows` | `number` | `4` | Visible row count once expanded. |
| `submitLabel` | `submit-label` | `string` | `"Submit"` | Label for the primary submit button. |
| `cancelLabel` | `cancel-label` | `string` | `"Cancel"` | Label for the secondary cancel button. |
| `disabled` | `disabled` | `boolean` | `false` | Disables the field entirely. |

## Events

| Event | Description |
| --- | --- |
| `cancel` | User discarded the draft via the Cancel button or `Escape`. |
| `submit` | User submitted a non-empty comment; detail: `{ value: string }`. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-line-height-normal` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-text` |
