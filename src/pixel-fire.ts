import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * The classic 8-bit fire ramp, from cold (index 0, drawn transparent) to the
 * white-hot base. Literal colors by design: the retro palette is the effect
 * and stays independent of the theme.
 */
const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [0x07, 0x07, 0x07], [0x1f, 0x07, 0x07], [0x2f, 0x0f, 0x07], [0x47, 0x0f, 0x07],
  [0x57, 0x17, 0x07], [0x67, 0x1f, 0x07], [0x77, 0x1f, 0x07], [0x8f, 0x27, 0x07],
  [0x9f, 0x2f, 0x07], [0xaf, 0x3f, 0x07], [0xbf, 0x47, 0x07], [0xc7, 0x47, 0x07],
  [0xdf, 0x4f, 0x07], [0xdf, 0x57, 0x07], [0xdf, 0x57, 0x07], [0xd7, 0x5f, 0x07],
  [0xd7, 0x5f, 0x07], [0xd7, 0x67, 0x0f], [0xcf, 0x6f, 0x0f], [0xcf, 0x77, 0x0f],
  [0xcf, 0x7f, 0x0f], [0xcf, 0x87, 0x17], [0xc7, 0x87, 0x17], [0xc7, 0x8f, 0x17],
  [0xc7, 0x97, 0x1f], [0xbf, 0x9f, 0x1f], [0xbf, 0x9f, 0x1f], [0xbf, 0xa7, 0x27],
  [0xbf, 0xa7, 0x27], [0xbf, 0xaf, 0x2f], [0xb7, 0xaf, 0x2f], [0xb7, 0xb7, 0x2f],
  [0xb7, 0xb7, 0x37], [0xcf, 0xcf, 0x6f], [0xdf, 0xdf, 0x9f], [0xef, 0xef, 0xc7],
  [0xff, 0xff, 0xff],
];
const MAX_HEAT = PALETTE.length - 1;
/** Fraction of the strip's height the tallest flames reach at full intensity. */
const FLAME_REACH = 0.8;
/** Simulation steps per second; the low rate is part of the retro look. */
const STEPS_PER_SECOND = 30;
const STEP_MS = 1000 / STEPS_PER_SECOND;
/** Share of cooling that follows the rising cooling map rather than per-cell noise. */
const MAP_WEIGHT = 0.7;
/** Coldest palette steps, which fade in from transparent so flame tips read as smoke. */
const SMOKE_STEPS = 6;

/**
 * Builds a smooth, high-contrast noise field with a mean of `0.5`. It wraps
 * vertically so it can scroll upward with the flames, carving them into
 * rising tongues.
 */
function coolingMap(cols: number, rows: number): Float32Array {
  let map: Float32Array = new Float32Array(cols * rows);
  for (let i = 0; i < map.length; i++) map[i] = Math.random();
  for (let pass = 0; pass < 4; pass++) map = blur(map, cols, rows);
  let min = Infinity;
  let max = -Infinity;
  for (const value of map) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const range = max - min || 1;
  let sum = 0;
  for (let i = 0; i < map.length; i++) {
    map[i] = ((map[i] - min) / range) ** 2;
    sum += map[i];
  }
  const scale = (0.5 * map.length) / (sum || 1);
  for (let i = 0; i < map.length; i++) map[i] *= scale;
  return map;
}

/** 3×3 box blur that clamps horizontally and wraps vertically. */
function blur(source: Float32Array, cols: number, rows: number): Float32Array {
  const out = new Float32Array(source.length);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = ((y + dy + rows) % rows) * cols;
        for (let dx = -1; dx <= 1; dx++) {
          sum += source[row + Math.min(cols - 1, Math.max(0, x + dx))];
        }
      }
      out[y * cols + x] = sum / 9;
    }
  }
  return out;
}

/**
 * Pixelated, 8-bit style fire in the manner of old computer games. By default
 * it is pinned full width to the bottom of the viewport as a decorative,
 * click-through overlay; `contained` pins it to the bottom of the nearest
 * positioned ancestor instead.
 *
 * The strip's height is set with `--pixel-fire-height` (default `8rem`). It
 * paints at `z-index: 30`, above ordinary page content but below `app-shell`'s
 * chrome and every dialog or popover. Under `prefers-reduced-motion: reduce`
 * it draws one still frame instead of animating. The canvas is hidden from
 * assistive technology.
 *
 * @element pixel-fire
 */
@customElement("pixel-fire")
export class PixelFire extends LitElement {
  /** Size of one fire pixel in CSS pixels; larger values look chunkier. */
  @property({ type: Number, attribute: "pixel-size" })
  pixelSize: number = 4;

  /**
   * Heat of the fire's source, from `0` to `1`. Lowering it shortens the
   * flames; `0` lets the fire burn out.
   */
  @property({ type: Number })
  intensity: number = 1;

  /**
   * Pins the fire to the bottom of the nearest positioned ancestor instead of
   * the viewport.
   */
  @property({ type: Boolean, reflect: true })
  contained: boolean = false;

  private _cols = 0;
  private _rows = 0;
  private _heat = new Float32Array(0);
  private _cooling: Float32Array = new Float32Array(0);
  private _time = 0;
  private _image?: ImageData;
  private _frame?: number;
  private _lastStep = 0;
  private _resizeObserver?: ResizeObserver;
  private _motionQuery?: MediaQueryList;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        position: fixed;
        inset: auto 0 0 0;
        z-index: 30;
        height: var(--pixel-fire-height, 8rem);
        overflow: hidden;
        pointer-events: none;
      }

      :host([contained]) {
        position: absolute;
      }

      :host([hidden]) {
        display: none;
      }

      canvas {
        position: absolute;
        left: 0;
        bottom: 0;
        display: block;
        image-rendering: pixelated;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._motionQuery.addEventListener("change", this._restart);
    this._resizeObserver = new ResizeObserver(this._resize);
    this._resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._motionQuery?.removeEventListener("change", this._restart);
    this._motionQuery = undefined;
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._stop();
  }

  protected override firstUpdated(): void {
    this._resize();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("pixelSize") && changed.get("pixelSize") !== undefined) {
      this._resize();
      return;
    }
    if (changed.has("intensity") && changed.get("intensity") !== undefined) {
      this._restart();
    }
  }

  override render() {
    return html`<canvas aria-hidden="true"></canvas>`;
  }

  private get _canvas(): HTMLCanvasElement | null {
    return this.renderRoot.querySelector("canvas");
  }

  private get _cellSize(): number {
    return Math.max(1, Math.round(this.pixelSize) || 1);
  }

  private get _sourceHeat(): number {
    const intensity = Number.isFinite(this.intensity) ? this.intensity : 1;
    return Math.min(1, Math.max(0, intensity)) * MAX_HEAT;
  }

  /** Rebuilds the fire grid to cover the host's current box, then restarts it. */
  private readonly _resize = (): void => {
    const canvas = this._canvas;
    if (!canvas) return;
    const size = this._cellSize;
    const cols = Math.ceil(this.clientWidth / size);
    const rows = Math.ceil(this.clientHeight / size);
    this._cols = cols;
    this._rows = rows;
    this._heat = new Float32Array(cols * rows);
    this._cooling = coolingMap(cols, rows);
    canvas.width = cols;
    canvas.height = rows;
    canvas.style.width = `${cols * size}px`;
    canvas.style.height = `${rows * size}px`;
    this._image = cols > 0 && rows > 0 ? new ImageData(cols, rows) : undefined;
    this._restart();
  };

  /** Animates the fire, or draws one settled frame under reduced motion. */
  private readonly _restart = (): void => {
    this._stop();
    if (!this._image) return;
    if (this._motionQuery?.matches) {
      for (let i = 0; i < this._rows * 2; i++) this._step();
      this._draw();
      return;
    }
    this._frame = window.requestAnimationFrame(this._tick);
  };

  private _stop(): void {
    if (this._frame === undefined) return;
    window.cancelAnimationFrame(this._frame);
    this._frame = undefined;
  }

  private readonly _tick = (time: number): void => {
    this._frame = undefined;
    if (time - this._lastStep >= STEP_MS) {
      this._lastStep = time;
      const burning = this._step();
      this._draw();
      if (!burning) return;
    }
    this._frame = window.requestAnimationFrame(this._tick);
  };

  /**
   * Advances the fire one step: the bottom row is fed with heat and every cell
   * rises one row, drifting sideways and cooling at random.
   *
   * @returns Whether any cell is still burning.
   */
  private _step(): boolean {
    const cols = this._cols;
    const rows = this._rows;
    const heat = this._heat;
    const cooling = this._cooling;
    const meanCooling = MAX_HEAT / Math.max(1, (rows - 1) * FLAME_REACH);
    this._time = (this._time + 1) % rows;

    heat.fill(this._sourceHeat, (rows - 1) * cols);
    for (let y = 0; y < rows - 1; y++) {
      const mapRow = ((y + this._time) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const below = heat[(y + 1) * cols + x];
        const drift = Math.min(cols - 1, Math.max(0, x + Math.round(Math.random() * 2 - 1)));
        const local = MAP_WEIGHT * cooling[mapRow + x] + (1 - MAP_WEIGHT) * Math.random();
        heat[y * cols + drift] = Math.max(0, below - 2 * meanCooling * local);
      }
    }
    // Cells no drift landed on keep their old heat, so scan the whole grid.
    return heat.some((value) => value > 0);
  }

  /** Paints the heat grid to the canvas through the palette. */
  private _draw(): void {
    const image = this._image;
    const context = this._canvas?.getContext("2d");
    if (!image || !context) return;
    const data = image.data;
    const heat = this._heat;
    for (let i = 0; i < heat.length; i++) {
      const index = Math.min(MAX_HEAT, Math.floor(heat[i]));
      const [r, g, b] = PALETTE[index];
      const offset = i * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = Math.min(255, Math.round((255 * index) / SMOKE_STEPS));
    }
    context.putImageData(image, 0, 0);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pixel-fire": PixelFire;
  }
}
