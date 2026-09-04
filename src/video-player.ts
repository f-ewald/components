import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { transportRangeStyles } from "./utils/transport-controls.js";
import { formatClockDuration } from "./utils/duration.js";
import {
  iconArrowsPointingIn,
  iconArrowsPointingOut,
  iconPause,
  iconPlay,
  iconSpeakerWave,
  iconSpeakerXMark,
} from "./icons.js";
import "./icon-button.js";

/**
 * Video player wrapping a native `<video>` element (native `controls`
 * disabled) with the same tokenized transport bar as `audio-player` — a
 * play/pause `icon-button`, elapsed/total time, a seekable progress bar, a
 * mute toggle + volume slider — plus a fullscreen toggle. The control bar
 * sits in a persistent strip under the video frame rather than a
 * hover-reveal overlay, so it stays usable for keyboard/touch input without
 * a pointer hover state.
 *
 * @element video-player
 * @fires play - The video started playing.
 * @fires pause - The video was paused.
 * @fires ended - Playback reached the end.
 */
@customElement("video-player")
export class VideoPlayer extends LitElement {
  static override styles = [
    tokens,
    transportRangeStyles,
    css`
      :host {
        display: block;
      }
      .player {
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        overflow: hidden;
        background: var(--ui-surface, #ffffff);
        font-family: var(
          --ui-font,
          ui-sans-serif,
          system-ui,
          sans-serif,
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji"
        );
      }
      .frame {
        display: flex;
        /* Letterboxing behind the video's own content is a universal video
           convention independent of the surrounding theme — same literal-color
           exception category as this package's white map rings/avatar marks. */
        background: #000000;
      }
      video {
        display: block;
        width: 100%;
        max-height: 30rem;
        object-fit: contain;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
      }
      .time {
        flex: 0 0 auto;
        min-width: 2.5rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: tabular-nums;
        text-align: center;
      }
      .seek {
        /* Sets its own width (100%) and flex-basis: 0 (not auto) so it
           fills the row's remaining space via flex-grow — an auto basis
           would otherwise derive its hypothetical size from that same
           width:100%, resolved against an indefinite container, and
           collapse the track to 0. */
        flex: 1 1 0%;
        min-width: 0;
        width: 100%;
      }
      .volume {
        flex: 0 0 auto;
        width: 4rem;
      }
      .error {
        padding: 0.5rem 0.75rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-danger, #dc2626);
      }
      @media (forced-colors: active) {
        .player {
          border-color: CanvasText;
        }
      }
    `,
  ];

  /** URL of the video file to play. */
  @property() src = "";
  /** Poster image shown before playback starts. */
  @property() poster = "";
  /** Accessible name for the player, e.g. a video title. */
  @property() label = "Video player";
  /** Loops playback once it reaches the end. */
  @property({ type: Boolean }) loop = false;
  /** Native `<video preload>` hint. */
  @property() preload: "none" | "metadata" | "auto" = "metadata";

  @state() private _playing = false;
  @state() private _currentTime = 0;
  @state() private _duration = NaN;
  @state() private _volume = 1;
  @state() private _muted = false;
  @state() private _errored = false;
  @state() private _fullscreen = false;

  @query("video") private _video?: HTMLVideoElement;
  @query(".frame") private _frame?: HTMLDivElement;

  #onFullscreenChange = (): void => {
    this._fullscreen = document.fullscreenElement === this._frame;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("fullscreenchange", this.#onFullscreenChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("fullscreenchange", this.#onFullscreenChange);
  }

  private _togglePlay(): void {
    const video = this._video;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  private _toggleMute(): void {
    const video = this._video;
    if (!video) return;
    video.muted = !video.muted;
  }

  private _toggleFullscreen(): void {
    const frame = this._frame;
    if (!frame) return;
    if (document.fullscreenElement === frame) document.exitFullscreen();
    else frame.requestFullscreen();
  }

  private _onSeekInput(e: Event): void {
    const video = this._video;
    if (!video) return;
    const value = Number((e.target as HTMLInputElement).value);
    video.currentTime = value;
    this._currentTime = value;
  }

  private _onVolumeInput(e: Event): void {
    const video = this._video;
    if (!video) return;
    const value = Number((e.target as HTMLInputElement).value);
    video.volume = value;
    // Adjusting the slider while muted is treated as an implicit unmute, so
    // dragging it back up audibly takes effect instead of appearing frozen.
    if (video.muted && value > 0) video.muted = false;
  }

  private _onLoadedMetadata(): void {
    this._duration = this._video?.duration ?? NaN;
    this._errored = false;
  }

  private _onTimeUpdate(): void {
    this._currentTime = this._video?.currentTime ?? 0;
  }

  private _onPlay(): void {
    this._playing = true;
    this.dispatchEvent(new CustomEvent("play", { bubbles: true, composed: true }));
  }

  private _onPause(): void {
    this._playing = false;
    this.dispatchEvent(new CustomEvent("pause", { bubbles: true, composed: true }));
  }

  private _onEnded(): void {
    this._playing = false;
    this.dispatchEvent(new CustomEvent("ended", { bubbles: true, composed: true }));
  }

  private _onVolumeChange(): void {
    const video = this._video;
    if (!video) return;
    this._volume = video.volume;
    this._muted = video.muted;
  }

  private _onError(): void {
    this._errored = true;
  }

  override render() {
    const duration = this._duration;
    const seekMax = Number.isFinite(duration) && duration > 0 ? duration : 0;
    return html`
      <div class="player" role="group" aria-label=${this.label}>
        <div class="frame">
          <video
            .src=${this.src}
            poster=${this.poster || ""}
            ?loop=${this.loop}
            preload=${this.preload}
            @loadedmetadata=${this._onLoadedMetadata}
            @timeupdate=${this._onTimeUpdate}
            @play=${this._onPlay}
            @pause=${this._onPause}
            @ended=${this._onEnded}
            @volumechange=${this._onVolumeChange}
            @error=${this._onError}
            @click=${this._togglePlay}
          ></video>
        </div>
        ${this._errored
          ? html`<span class="error">Unable to load video</span>`
          : html`
              <div class="controls">
                <icon-button
                  .icon=${this._playing ? iconPause(18) : iconPlay(18)}
                  label=${this._playing ? "Pause" : "Play"}
                  @click=${this._togglePlay}
                ></icon-button>
                <span class="time">${formatClockDuration(this._currentTime)}</span>
                <input
                  class="seek"
                  type="range"
                  min="0"
                  max=${seekMax}
                  step="0.1"
                  .value=${String(this._currentTime)}
                  aria-label="Seek"
                  aria-valuetext=${formatClockDuration(this._currentTime)}
                  @input=${this._onSeekInput}
                />
                <span class="time">${formatClockDuration(duration)}</span>
                <icon-button
                  .icon=${this._muted || this._volume === 0 ? iconSpeakerXMark(18) : iconSpeakerWave(18)}
                  label=${this._muted ? "Unmute" : "Mute"}
                  @click=${this._toggleMute}
                ></icon-button>
                <input
                  class="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  .value=${String(this._muted ? 0 : this._volume)}
                  aria-label="Volume"
                  @input=${this._onVolumeInput}
                />
                <icon-button
                  .icon=${this._fullscreen ? iconArrowsPointingIn(18) : iconArrowsPointingOut(18)}
                  label=${this._fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  @click=${this._toggleFullscreen}
                ></icon-button>
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "video-player": VideoPlayer;
  }
}
