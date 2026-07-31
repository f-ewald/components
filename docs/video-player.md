# `<video-player>`

Video player wrapping a native `<video>` element (native `controls`
disabled) with the same tokenized transport bar as `audio-player` — a
play/pause `icon-button`, elapsed/total time, a seekable progress bar, a
mute toggle + volume slider — plus a fullscreen toggle. The control bar
sits in a persistent strip under the video frame rather than a
hover-reveal overlay, so it stays usable for keyboard/touch input without
a pointer hover state.

## Install

```js
import "@f-ewald/components/video-player.js";
```

## Usage

```html
<video-player
  src="/clip.mp4"
  poster="/clip-poster.jpg"
  label="Episode 12"
></video-player>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `src` | `src` | `string` | `""` | URL of the video file to play. |
| `poster` | `poster` | `string` | `""` | Poster image shown before playback starts. |
| `label` | `label` | `string` | `"Video player"` | Accessible name for the player, e.g. a video title. |
| `loop` | `loop` | `boolean` | `false` | Loops playback once it reaches the end. |
| `preload` | `preload` | `"none" | "metadata" | "auto"` | `"metadata"` | Native `<video preload>` hint. |

## Events

| Event | Description |
| --- | --- |
| `play` | The video started playing. |
| `pause` | The video was paused. |
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
