import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { transportRangeStyles } from "./utils/transport-controls.js";
import { formatClockDuration } from "./utils/duration.js";
import { iconPause, iconPlay, iconSpeakerWave, iconSpeakerXMark } from "./icons.js";
import "./icon-button.js";

/**
 * Compact audio player wrapping a native `<audio>` element (kept off-screen
 * for its decoding/playback engine and free `timeupdate`/`loadedmetadata`
 * events) behind a tokenized transport bar: a play/pause `icon-button`,
 * elapsed/total time, a seekable progress bar, and a mute toggle + volume
 * slider. The seek/volume sliders are native `<input type="range">`
 * elements (see `utils/transport-controls.ts`) for free keyboard and
 * pointer support, per this package's "native semantics before custom ARIA"
 * rule.
 *
 * @element audio-player
 * @fires play - The audio started playing.
 * @fires pause - The audio was paused.
 * @fires ended - Playback reached the end.
 */
@customElement("audio-player")
export class AudioPlayer extends LitElement {
  static override styles = [
    tokens,
    transportRangeStyles,
    css`
      :host {
        display: block;
      }
      .player {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
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
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-danger, #dc2626);
      }
      audio {
        display: none;
      }
      @media (forced-colors: active) {
        .player {
          border-color: CanvasText;
        }
      }
    `,
  ];

  /** URL of the audio file to play. */
  @property() src = "";
  /** Accessible name for the player, e.g. a track/episode title. */
  @property() label = "Audio player";
  /** Loops playback once it reaches the end. */
  @property({ type: Boolean }) loop = false;
  /** Native `<audio preload>` hint. */
  @property() preload: "none" | "metadata" | "auto" = "metadata";

  @state() private _playing = false;
  @state() private _currentTime = 0;
  @state() private _duration = NaN;
  @state() private _volume = 1;
  @state() private _muted = false;
  @state() private _errored = false;

  @query("audio") private _audio?: HTMLAudioElement;

  private _togglePlay(): void {
    const audio = this._audio;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  private _toggleMute(): void {
    const audio = this._audio;
    if (!audio) return;
    audio.muted = !audio.muted;
  }

  private _onSeekInput(e: Event): void {
    const audio = this._audio;
    if (!audio) return;
    const value = Number((e.target as HTMLInputElement).value);
    audio.currentTime = value;
    this._currentTime = value;
  }

  private _onVolumeInput(e: Event): void {
    const audio = this._audio;
    if (!audio) return;
    const value = Number((e.target as HTMLInputElement).value);
    audio.volume = value;
    // Adjusting the slider while muted is treated as an implicit unmute, so
    // dragging it back up audibly takes effect instead of appearing frozen.
    if (audio.muted && value > 0) audio.muted = false;
  }

  private _onLoadedMetadata(): void {
    this._duration = this._audio?.duration ?? NaN;
    this._errored = false;
  }

  private _onTimeUpdate(): void {
    this._currentTime = this._audio?.currentTime ?? 0;
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
    const audio = this._audio;
    if (!audio) return;
    this._volume = audio.volume;
    this._muted = audio.muted;
  }

  private _onError(): void {
    this._errored = true;
  }

  override render() {
    const duration = this._duration;
    const seekMax = Number.isFinite(duration) && duration > 0 ? duration : 0;
    return html`
      <div class="player" role="group" aria-label=${this.label}>
        <audio
          .src=${this.src}
          ?loop=${this.loop}
          preload=${this.preload}
          @loadedmetadata=${this._onLoadedMetadata}
          @timeupdate=${this._onTimeUpdate}
          @play=${this._onPlay}
          @pause=${this._onPause}
          @ended=${this._onEnded}
          @volumechange=${this._onVolumeChange}
          @error=${this._onError}
        ></audio>
        ${this._errored
          ? html`<span class="error">Unable to load audio</span>`
          : html`
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
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "audio-player": AudioPlayer;
  }
}
