# `<audio-player>`

Compact audio player wrapping a native `<audio>` element (kept off-screen
for its decoding/playback engine and free `timeupdate`/`loadedmetadata`
events) behind a tokenized transport bar: a play/pause `icon-button`,
elapsed/total time, a seekable progress bar, and a mute toggle + volume
slider. The seek/volume sliders are native `<input type="range">`
elements (see `utils/transport-controls.ts`) for free keyboard and
pointer support, per this package's "native semantics before custom ARIA"
rule.

## Install

```js
import "@f-ewald/components/audio-player.js";
```

## Usage

```html
<audio-player src="/episode-12.mp3" label="Episode 12"></audio-player>
<script type="module">
  document.querySelector("audio-player").addEventListener("ended", () => {
    console.log("playback finished");
  });
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `src` | `src` | `string` | `""` | URL of the audio file to play. |
| `label` | `label` | `string` | `"Audio player"` | Accessible name for the player, e.g. a track/episode title. |
| `loop` | `loop` | `boolean` | `false` | Loops playback once it reaches the end. |
| `preload` | `preload` | `"none" | "metadata" | "auto"` | `"metadata"` | Native `<audio preload>` hint. |

## Events

| Event | Description |
| --- | --- |
| `play` | The audio started playing. |
| `pause` | The audio was paused. |
| `ended` | Playback reached the end. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-radius` |
| `--ui-surface` |
| `--ui-text-muted` |
