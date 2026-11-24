import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { PointerWatch, pulseRadius, wanderStep } from "./utils/wander.js";

/** How the ring that swells and parts the particles moves. */
export type ParticleBackgroundMode = "drift" | "follow";

/** Upper bound on particles, so a huge host with a tiny spacing stays cheap. */
const MAX_PARTICLES = 40_000;
/** Smallest accepted `spacing`, in CSS pixels. */
const MIN_SPACING = 4;
/** Particle length per unit of scale, as a share of the spacing. */
const SIZE_PER_SPACING = 0.15;
/** Fixed clock and ring position for the reduced-motion still frame. */
const STILL_TIME = 12;
/** Elapsed seconds wrap here to keep shader noise inputs well-conditioned. */
const TIME_WRAP = 3600;

const NOISE_GLSL = /* glsl */ `
  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }

  float corner(vec3 cell, vec3 f, vec3 offset) {
    return dot(hash3(cell + offset), f - offset);
  }

  // Gradient noise with a quintic fade, roughly in [-1, 1].
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float x00 = mix(corner(i, f, vec3(0, 0, 0)), corner(i, f, vec3(1, 0, 0)), u.x);
    float x10 = mix(corner(i, f, vec3(0, 1, 0)), corner(i, f, vec3(1, 1, 0)), u.x);
    float x01 = mix(corner(i, f, vec3(0, 0, 1)), corner(i, f, vec3(1, 0, 1)), u.x);
    float x11 = mix(corner(i, f, vec3(0, 1, 1)), corner(i, f, vec3(1, 1, 1)), u.x);
    return 1.4 * mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
  }
`;

/**
 * Positions are in units of the host's shorter side, y pointing down. Each
 * particle's state is a pure function of its rest position, the clock, and the
 * ring, so the simulation needs no per-particle storage on the GPU.
 */
const VERTEX_SHADER = /* glsl */ `#version 300 es
  precision highp float;

  in vec2 aRest;

  uniform vec2 uResolution;
  uniform float uUnit;
  uniform float uTime;
  uniform vec2 uRing;
  uniform float uRadius;
  uniform float uSize;
  uniform float uPixelRatio;

  out float vScale;
  out float vAngle;
  out float vTone;

  ${NOISE_GLSL}

  float band(float dist, float dist1, float width) {
    float inner = smoothstep(uRadius - width * 2.0, uRadius, dist);
    float outer = smoothstep(uRadius, uRadius + width, dist1);
    return max(inner - outer, 0.0);
  }

  void main() {
    float t = uTime * 0.5;
    vec2 p = aRest / uUnit;
    float dist = distance(p, uRing);
    float dist1 = distance(p + noise(vec3(p * 0.1 + 18.49, t * 0.5)) * 0.01, uRing);

    float wide = pow(band(dist, dist1, 0.22), 2.0);
    float narrow = pow(band(dist, dist1, 0.1), 3.0);
    float disc = 1.0 - smoothstep(uRadius, uRadius + 0.1, dist);
    float ambient = noise(vec3(p * 0.9 + vec2(18.49, 72.97), t * 0.5));

    float scale = wide + narrow * 3.0 + disc * 0.4;
    scale += noise(vec3(p * 13.5 + 11.49, t * 0.5)) * disc * 0.5;
    scale += pow((ambient + 1.5) * 0.5, 2.0) * 0.6;

    vec2 disp = vec2(
      noise(vec3(p * 1.8 + vec2(88.49, 32.44), t * 0.35)),
      noise(vec3(p * 1.8 + vec2(50.90, 120.95), t * 0.35))
    ) * 0.06;
    disp += vec2(
      noise(vec3(p * 9.0 + vec2(18.49, 72.97), t * 0.5)),
      noise(vec3(p * 9.0 + vec2(50.90, 120.95), t * 0.5))
    ) * 0.011;
    float far = clamp(dist, 0.0, 1.0) * 0.044;
    disp += vec2(sin(p.x * 9.0 + t * 4.0), cos(p.y * 9.0 + t * 3.0)) * far;

    vec2 pos = p + disp;
    pos += (pos - uRing) * pow(narrow, 0.75) * 0.08;

    vScale = scale;
    vAngle = atan(p.y - uRing.y, p.x - uRing.x) + noise(vec3(p * 4.5 + 7.3, uTime * 0.85)) * 0.5;
    vTone = noise(vec3(p * 0.9 + vec2(74.66, 91.56), uTime * 0.5)) * 0.5 + 0.5;

    vec2 clip = (pos * uUnit / uResolution) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    gl_PointSize = scale < 0.1 ? 0.0 : scale * uSize * uPixelRatio;
  }
`;

/** Draws each particle as a short capsule pointing away from the ring. */
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
  precision highp float;

  in float vScale;
  in float vAngle;
  in float vTone;

  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  out vec4 outColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vAngle);
    float s = sin(vAngle);
    uv = mat2(c, -s, s, c) * uv;
    uv.x -= clamp(uv.x, -0.3, 0.3);
    float d = length(uv) - 0.14;
    float alpha = clamp(0.5 - d / max(fwidth(d), 1e-4), 0.0, 1.0);
    alpha *= smoothstep(0.1, 0.2, vScale);
    if (alpha < 0.01) discard;

    float progress = smoothstep(0.0, 0.75, vTone * vTone);
    vec3 color = progress < 0.8
      ? mix(uColor1, uColor2, progress / 0.8)
      : mix(uColor2, uColor3, (progress - 0.8) / 0.2);
    outColor = vec4(color * alpha, alpha);
  }
`;

let colorProbe: CanvasRenderingContext2D | null | undefined;

/** Converts any CSS color to linear 0–1 sRGB channels by painting one pixel. */
function cssColorToRgb(value: string): [number, number, number] {
  colorProbe ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!colorProbe) return [0, 0, 0];
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = "#000000";
  colorProbe.fillStyle = value;
  colorProbe.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorProbe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/** Compiles and links the particle program, or returns `null` on failure. */
function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const program = gl.createProgram();
  const shaders = [
    [gl.VERTEX_SHADER, VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
  ] as const;
  for (const [type, source] of shaders) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

/**
 * Scatters rest positions on a jittered grid covering the box plus a
 * one-cell margin, so displaced particles still reach the edges.
 */
function restPositions(width: number, height: number, spacing: number): Float32Array {
  const step = Math.max(spacing, Math.sqrt((width * height) / MAX_PARTICLES));
  const cols = Math.ceil(width / step) + 2;
  const rows = Math.ceil(height / step) + 2;
  const points = new Float32Array(cols * rows * 2);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 2;
      points[i] = (col - 0.9 + Math.random() * 0.8) * step;
      points[i + 1] = (row - 0.9 + Math.random() * 0.8) * step;
    }
  }
  return points;
}

/**
 * A decorative field of small, color-shifting particles that swim on layered
 * noise. A pulsing ring swells and parts the particles it passes: in `drift`
 * mode it wanders across the field on its own; in `follow` mode it eases
 * toward the pointer, and drifts again when the pointer leaves.
 *
 * By default it fills the viewport behind the page at `z-index: -1` and never
 * intercepts the pointer. That only shows through when the page's background
 * is painted by `<html>` or `<body>` alone (if both paint, the body hides it)
 * and content between the two is transparent. With `contained` it fills the
 * nearest positioned ancestor instead; give that ancestor
 * `isolation: isolate` so the field stays behind the ancestor's own content.
 *
 * Particles mix three colors, set with `--particle-background-color-1`
 * (dominant, default `--ui-primary`), `--particle-background-color-2`
 * (default `--ui-danger`), and `--particle-background-color-3` (rarest,
 * default `--ui-warning`). They are re-read when the page theme changes.
 *
 * Rendering uses WebGL2; where that is unavailable nothing is drawn. Under
 * `prefers-reduced-motion: reduce` it draws one still frame instead of
 * animating. Animation pauses while the host is off-screen or the tab is
 * hidden. The canvas is hidden from assistive technology.
 *
 * @element particle-background
 */
@customElement("particle-background")
export class ParticleBackground extends LitElement {
  /**
   * How the ring moves: `drift` wanders on its own, `follow` eases toward the
   * pointer while it is over the host.
   */
  @property({ type: String, reflect: true })
  mode: ParticleBackgroundMode = "drift";

  /** Fills the nearest positioned ancestor instead of the viewport. */
  @property({ type: Boolean, reflect: true })
  contained: boolean = false;

  /**
   * Average distance between particles in CSS pixels (minimum `4`). Particle
   * size scales with it.
   */
  @property({ type: Number })
  spacing: number = 24;

  private _gl?: WebGL2RenderingContext;
  private _program?: WebGLProgram;
  private _buffer?: WebGLBuffer;
  private _vao?: WebGLVertexArrayObject;
  private _uniforms = new Map<string, WebGLUniformLocation | null>();
  private _count = 0;
  private _width = 0;
  private _height = 0;
  private _pixelRatio = 1;
  private _colors: Array<[number, number, number]> = [];

  private _frame?: number;
  private _lastFrame?: number;
  private _time = 0;
  private _ring: [number, number] = [0.5, 0.5];
  private readonly _pointer = new PointerWatch(this);
  private _onScreen = true;

  private _resizeObserver?: ResizeObserver;
  private _intersectionObserver?: IntersectionObserver;
  private _themeObserver?: MutationObserver;
  private _motionQuery?: MediaQueryList;
  private _schemeQuery?: MediaQueryList;

  static override styles = [
    tokens,
    css`
      :host {
        --_color-1: var(--particle-background-color-1, var(--ui-primary, #4f46e5));
        --_color-2: var(--particle-background-color-2, var(--ui-danger, #dc2626));
        --_color-3: var(--particle-background-color-3, var(--ui-warning, #d97706));
        display: block;
        position: fixed;
        inset: 0;
        z-index: -1;
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
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._motionQuery.addEventListener("change", this._restart);
    this._schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._schemeQuery.addEventListener("change", this._refreshColors);
    this._themeObserver = new MutationObserver(this._refreshColors);
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    this._resizeObserver = new ResizeObserver(this._resize);
    this._resizeObserver.observe(this);
    this._intersectionObserver = new IntersectionObserver(this._onIntersect, {
      rootMargin: "100px",
    });
    this._intersectionObserver.observe(this);
    document.addEventListener("visibilitychange", this._restart);
    if (this.hasUpdated) this._initGl();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._motionQuery?.removeEventListener("change", this._restart);
    this._schemeQuery?.removeEventListener("change", this._refreshColors);
    this._themeObserver?.disconnect();
    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this._restart);
    this._stop();
    this._pointer.track(false);
    this._releaseGl();
  }

  protected override firstUpdated(): void {
    const canvas = this._canvas;
    canvas?.addEventListener("webglcontextlost", this._onContextLost);
    canvas?.addEventListener("webglcontextrestored", this._onContextRestored);
    this._initGl();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("spacing") && changed.get("spacing") !== undefined) {
      this._uploadParticles();
      this._restart();
      return;
    }
    if (changed.has("mode") && changed.get("mode") !== undefined) this._restart();
  }

  override render() {
    return html`<canvas aria-hidden="true"></canvas>`;
  }

  private get _canvas(): HTMLCanvasElement | null {
    return this.renderRoot.querySelector("canvas");
  }

  private get _spacing(): number {
    return Number.isFinite(this.spacing) ? Math.max(MIN_SPACING, this.spacing) : 24;
  }

  private get _animating(): boolean {
    return !this._motionQuery?.matches && !document.hidden && this._onScreen;
  }

  /** Creates the context, program, and buffers, then sizes and starts the field. */
  private _initGl(): void {
    const canvas = this._canvas;
    const gl = canvas?.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      stencil: false,
    });
    if (!gl || gl.isContextLost()) return;
    const program = createProgram(gl);
    if (!program) return;
    this._gl = gl;
    this._program = program;
    this._buffer = gl.createBuffer();
    this._vao = gl.createVertexArray();
    gl.bindVertexArray(this._vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    const rest = gl.getAttribLocation(program, "aRest");
    gl.enableVertexAttribArray(rest);
    gl.vertexAttribPointer(rest, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this._uniforms.clear();
    this._refreshColors();
    this._resize();
  }

  private _releaseGl(): void {
    const gl = this._gl;
    if (gl && !gl.isContextLost()) {
      gl.deleteBuffer(this._buffer ?? null);
      gl.deleteVertexArray(this._vao ?? null);
      gl.deleteProgram(this._program ?? null);
    }
    this._gl = undefined;
    this._program = undefined;
    this._buffer = undefined;
    this._vao = undefined;
  }

  private readonly _onContextLost = (event: Event): void => {
    event.preventDefault();
    this._stop();
    this._gl = undefined;
  };

  private readonly _onContextRestored = (): void => {
    this._initGl();
  };

  /** Matches the backing store to the host's box and rebuilds the particles. */
  private readonly _resize = (): void => {
    const canvas = this._canvas;
    if (!canvas) return;
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this._width = this.clientWidth;
    this._height = this.clientHeight;
    canvas.width = Math.round(this._width * this._pixelRatio);
    canvas.height = Math.round(this._height * this._pixelRatio);
    this._uploadParticles();
    this._restart();
  };

  private _uploadParticles(): void {
    const gl = this._gl;
    if (!gl || !this._buffer) return;
    const points = restPositions(this._width, this._height, this._spacing);
    this._count = points.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  }

  /** Re-reads the three particle colors from the host's computed style. */
  private readonly _refreshColors = (): void => {
    const style = getComputedStyle(this);
    this._colors = ["--_color-1", "--_color-2", "--_color-3"].map((name) =>
      cssColorToRgb(style.getPropertyValue(name).trim()),
    );
    if (!this._animating) this._drawStill();
  };

  private readonly _onIntersect = (entries: IntersectionObserverEntry[]): void => {
    this._onScreen = entries.some((entry) => entry.isIntersecting);
    this._restart();
  };

  /** Animates while visible and allowed to move; otherwise draws one still frame. */
  private readonly _restart = (): void => {
    this._stop();
    if (!this._gl) return;
    this._pointer.track(this.mode === "follow" && this._animating);
    if (!this._animating) {
      this._drawStill();
      return;
    }
    this._frame = window.requestAnimationFrame(this._tick);
  };

  private _stop(): void {
    this._lastFrame = undefined;
    if (this._frame === undefined) return;
    window.cancelAnimationFrame(this._frame);
    this._frame = undefined;
  }

  private _drawStill(): void {
    if (this._motionQuery?.matches) this._ring = [0.5, 0.5];
    this._draw(this._motionQuery?.matches ? STILL_TIME : this._time);
  }

  private readonly _tick = (now: number): void => {
    const dt = this._lastFrame === undefined ? 0 : Math.min(0.1, (now - this._lastFrame) / 1000);
    this._lastFrame = now;
    this._time = (this._time + dt) % TIME_WRAP;
    this._moveRing(dt);
    this._draw(this._time);
    this._frame = window.requestAnimationFrame(this._tick);
  };

  /** Eases the ring toward the pointer (follow mode) or its drift path. */
  private _moveRing(dt: number): void {
    const pointer = this.mode === "follow" ? this._pointer.target() : undefined;
    this._ring = wanderStep(this._ring, this._time, dt, pointer);
  }

  private _uniform(name: string): WebGLUniformLocation | null {
    if (!this._uniforms.has(name)) {
      this._uniforms.set(name, this._gl!.getUniformLocation(this._program!, name));
    }
    return this._uniforms.get(name)!;
  }

  /** Renders the field at `time` seconds with the current ring position. */
  private _draw(time: number): void {
    const gl = this._gl;
    if (!gl || !this._program || !this._vao || this._width === 0 || this._height === 0) return;
    const unit = Math.min(this._width, this._height);
    const aspect: [number, number] = [this._width / unit, this._height / unit];
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this._program);
    gl.uniform2f(this._uniform("uResolution"), this._width, this._height);
    gl.uniform1f(this._uniform("uUnit"), unit);
    gl.uniform1f(this._uniform("uTime"), time);
    gl.uniform2f(this._uniform("uRing"), this._ring[0] * aspect[0], this._ring[1] * aspect[1]);
    gl.uniform1f(this._uniform("uRadius"), pulseRadius(time));
    gl.uniform1f(this._uniform("uSize"), this._spacing * SIZE_PER_SPACING);
    gl.uniform1f(this._uniform("uPixelRatio"), this._pixelRatio);
    this._colors.forEach((rgb, i) => gl.uniform3f(this._uniform(`uColor${i + 1}`), ...rgb));
    gl.bindVertexArray(this._vao);
    gl.drawArrays(gl.POINTS, 0, this._count);
    gl.bindVertexArray(null);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "particle-background": ParticleBackground;
  }
}
