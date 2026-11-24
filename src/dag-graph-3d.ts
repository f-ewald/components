import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  GridHelper,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import "./button-group.js";
import "./icon-button.js";
import type { DagEdge, DagNode, DagNodeKind, DagNodeSelectDetail } from "./dag-graph.js";
import type { ButtonGroupOption } from "./button-group.js";
import {
  iconChevronLeft,
  iconCube,
  iconEye,
  iconHome,
  iconMagnifyingGlassMinus,
  iconMagnifyingGlassPlus,
  iconMap,
  iconPause,
  iconPlay,
} from "./icons.js";
import { tokens } from "./tokens.js";
import { layoutDag } from "./utils/dag-layout.js";

/** World units per layout pixel across the street (x) and toward the horizon (depth). */
const X_SCALE = 1 / 26;
const Z_SCALE = 1 / 7;
const ROAD_Y = 0.02;
const ROAD_WIDTH = 0.22;
/** Extra road width added for the graph's heaviest edge. */
const ROAD_WEIGHT_WIDTH = 0.7;
const DOT_RADIUS = 0.2;
const DOT_HEIGHT = 0.28;
/** Average world units a request travels per second; each request varies by up to `DOT_SPEED_SPREAD` of it. */
const DOT_SPEED = 5;
const DOT_SPEED_SPREAD = 0.3;
/** Largest random hue and lightness shift of a request's shade from the request color. */
const SHADE_HUE = 0.04;
const SHADE_LIGHTNESS = 0.18;
const MAX_DOTS = 400;
/** A request that has crossed this many roads (e.g. around a cycle) is retired. */
const MAX_HOPS = 24;
/** Height of a node's label anchor, and of its glow's center, with and without the pin. */
const LABEL_HEIGHT = 1.9;
const LABEL_HEIGHT_FLAT = 0.8;
const GLOW_HEIGHT = 1.1;
const GLOW_HEIGHT_FLAT = 0.3;
/** The street view looks at a point this far ahead of the current node, from 5 units up and 7 behind the node. */
const STREET_AHEAD = 12;
const STREET_DISTANCE = Math.hypot(5, STREET_AHEAD + 7);
const STREET_ELEVATION = Math.atan2(5, STREET_AHEAD + 7);
const OVERVIEW_ELEVATION = Math.PI / 4;
/** Just short of straight down, so the camera's up direction stays defined. */
const TOP_ELEVATION = MathUtils.degToRad(89.5);
const MIN_ELEVATION = MathUtils.degToRad(5);
const MIN_DISTANCE = 3;
/** Room around the graph when fitting it into view, in world units. */
const FIT_MARGIN = 3;
/** Fog and label fade distances, as multiples of the camera's distance to what it looks at. */
const FOG_NEAR = 0.8;
const FOG_FAR = 4.5;
const LABEL_FADE_START = 1.4;
const LABEL_FADE_END = 2.5;
const FLIGHT_MS = 1200;
const ROTATE_PER_PIXEL = 0.005;
const KEY_PAN = 48;
const KEY_ROTATE = MathUtils.degToRad(10);
const KEY_ZOOM = 1.25;
const WHEEL_ZOOM = 0.01;
const DRAG_THRESHOLD = 4;
/** Size of a node's glow halo, how bright it gets on a hit, and how fast a hit's glow fades, per second. */
const GLOW_SIZE = 2.8;
const GLOW_OPACITY = 0.85;
const GLOW_FADE = 1.6;

/** A drawn edge that requests travel along, from `source` to `target`. */
interface Road {
  source: string;
  target: string;
  curve: CatmullRomCurve3;
  length: number;
  /** Relative share of the traffic leaving `source`. */
  share: number;
  /** Drawn width; requests spread across it. */
  width: number;
}

/** A request in flight. */
interface Request {
  road: Road;
  distance: number;
  hops: number;
  speed: number;
  /** Position across the road, from -1 (one edge) to 1 (the other), kept from road to road. */
  lane: number;
  color: Color;
}

/** A laid-out node and the meshes that show it. */
interface Place {
  id: string;
  position: Vector3;
  kindColor: Color;
  /** The pin's head, absent with `hide-pins`. */
  cap?: MeshBasicMaterial;
  capColor: Color;
  disk: MeshBasicMaterial;
  diskColor: Color;
  glow: Sprite;
  /** How lit the node is from requests arriving, from 0 to 1. */
  pulse: number;
}

/** A camera preset: behind the selected node (`street`), the whole graph from 45° (`overview`), or from above (`top`). */
export type DagGraph3dView = "street" | "overview" | "top";

/** A toolbar control: `back`, `home` (the first root), `view` (the presets), `zoom` (in and out), or `pause`. */
export type DagGraph3dControl = "back" | "home" | "view" | "zoom" | "pause";

const CONTROLS: readonly DagGraph3dControl[] = ["back", "home", "view", "zoom", "pause"];
/** Controls that move the camera, which a `static` view leaves out. */
const CAMERA_CONTROLS: ReadonlySet<DagGraph3dControl> = new Set(["view", "zoom"]);

/** Detail of the `view-change` event. */
export interface DagGraph3dViewChangeDetail {
  view: DagGraph3dView;
}

/** An orbit camera looking at `target` from `distance` away, `azimuth` around the vertical and `elevation` up. */
interface CameraPose {
  target: Vector3;
  distance: number;
  azimuth: number;
  elevation: number;
}

interface Flight {
  from: CameraPose;
  to: CameraPose;
  start: number;
}

const VIEW_OPTIONS: ButtonGroupOption[] = [
  { value: "street", label: "Street view", icon: iconEye(18) },
  { value: "overview", label: "Overview from 45°", icon: iconCube(18) },
  { value: "top", label: "View from the top", icon: iconMap(18) },
];

const clonePose = (pose: CameraPose): CameraPose => ({ ...pose, target: pose.target.clone() });

/** Interpolates between two poses, turning the short way round and zooming evenly. */
function lerpPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  const turn = MathUtils.euclideanModulo(to.azimuth - from.azimuth + Math.PI, Math.PI * 2) - Math.PI;
  return {
    target: from.target.clone().lerp(to.target, t),
    distance: from.distance * (to.distance / from.distance) ** t,
    azimuth: from.azimuth + turn * t,
    elevation: MathUtils.lerp(from.elevation, to.elevation, t),
  };
}

let colorProbe: CanvasRenderingContext2D | null | undefined;

/** Converts any CSS color to a three.js color by painting one pixel. */
function cssColor(value: string): Color {
  colorProbe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!colorProbe) return new Color(0, 0, 0);
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = "#000000";
  colorProbe.fillStyle = value;
  colorProbe.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorProbe.getImageData(0, 0, 1, 1).data;
  return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
}

/** Builds a flat ribbon of `width` along `curve`, optionally dashed. */
function ribbon(curve: CatmullRomCurve3, width: number, dashed: boolean): BufferGeometry {
  const samples = Math.max(8, Math.ceil(curve.getLength() * 3));
  const points = curve.getSpacedPoints(samples);
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const tangent = curve.getTangentAt(i / samples);
    const length = Math.hypot(tangent.x, tangent.z) || 1;
    const nx = (-tangent.z / length) * (width / 2);
    const nz = (tangent.x / length) * (width / 2);
    const { x, y, z } = points[i];
    positions.push(x + nx, y, z + nz, x - nx, y, z - nz);
    if (i === samples || (dashed && i % 4 >= 2)) continue;
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  return geometry;
}

/** Disposes every geometry and material below `root`, except the shared ones (and three's sprite geometry). */
function disposeTree(root: Object3D, shared: Set<unknown>): void {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.geometry && !shared.has(mesh.geometry) && !(object as Sprite).isSprite) mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) if (!shared.has(material)) material.dispose();
  });
}

/** A soft white radial falloff, tinted per node through its sprite material's color. */
function glowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgb(255 255 255 / 1)");
    gradient.addColorStop(0.25, "rgb(255 255 255 / 0.55)");
    gradient.addColorStop(1, "rgb(255 255 255 / 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The center and extent of `points` on the ground. */
function boundsOf(points: Vector3[]): { center: Vector3; width: number; depth: number } {
  if (!points.length) return { center: new Vector3(), width: 0, depth: 0 };
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  return { center: new Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2), width: maxX - minX, depth: maxZ - minZ };
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Experimental three-dimensional view of a directed graph, rendered with three.js: the graph is laid out like a
 * street network on a ground plane. The default `street` view stands behind the current node, with the nodes it
 * leads to further away toward the horizon; `overview` shows the whole graph from 45° and `top` from straight
 * above, both with the flow running left to right. Requests, drawn as dots, set out from the root nodes at `rate` per second and
 * flow along the edges at a pace set by `speed`, choosing each outgoing edge in proportion to its `weight`.
 *
 * Takes the same `nodes`, `edges`, and `kinds` as `dag-graph`. Clicking a node or its label selects it, and in
 * the street view travels there; Back and Home in the toolbar return to the previous node and the first root. Drag
 * to pan; right-drag or Shift + drag to rotate and tilt; pinch or Ctrl/⌘ + wheel to zoom (a plain wheel scrolls the
 * page). With the view focused, arrow keys pan, Shift + arrows rotate and tilt, `+`/`-` zoom, and `0` resets the
 * view. The toolbar offers the `controls` you enable; set `static` to fix the camera, e.g. for a presentation. Heavier edges are drawn as wider roads and highlighted
 * nodes and edges use the highlight color. Under reduced motion the view shows a still picture without requests and
 * moves between nodes without a flight. Set `hide-pins` to draw nodes as flat disks without the pin standing up
 * from each.
 *
 * Colors can be changed with `--dag-edge-color`, `--dag-selected-color`, `--dag-highlight-color`, and
 * `--dag-request-color`; `--dag-graph-3d-height` sets the height (default `24rem`).
 *
 * @element dag-graph-3d
 * @fires node-select - A node was selected by clicking it, its label, Back, or Home; `detail` is `{ id }`.
 * @fires view-change - The toolbar switched `view`; `detail` is `{ view }`.
 * @slot empty - Shown when there are no nodes.
 */
@customElement("dag-graph-3d")
export class DagGraph3d extends LitElement {
  /** The graph's nodes. */
  @property({ type: Array }) nodes: DagNode[] = [];

  /** The graph's edges; edges whose endpoints aren't both in `nodes` are ignored. */
  @property({ type: Array }) edges: DagEdge[] = [];

  /** Presentation of each node kind, keyed by `DagNode.kind`; only `color` and `icon` are used. */
  @property({ attribute: false }) kinds: Record<string, DagNodeKind> = {};

  /** Id of the selected node, where the street view stands; defaults to the first root. */
  @property({ reflect: true }) selected: string | null = null;

  /** Accessible name of the view. */
  @property() label = "Directed graph";

  /** New requests per second, spread across the root nodes. */
  @property({ type: Number }) rate = 4;

  /** How fast requests travel, as a multiple of the default pace; `0` stops them where they are. */
  @property({ type: Number }) speed = 1;

  /** Draws each node as just its ground disk, without the pin standing up from it. */
  @property({ type: Boolean, reflect: true, attribute: "hide-pins" }) hidePins = false;

  /** Camera preset; changing it flies there, and `0` returns to it after panning, tilting, or zooming. */
  @property({ reflect: true }) view: DagGraph3dView = "street";

  /**
   * Space-separated toolbar controls to show: any of `back`, `home`, `view`, `zoom`, and `pause`, in that order.
   * An empty value hides the toolbar.
   */
  @property({ reflect: true }) controls = "back home view zoom pause";

  /**
   * Fixes the camera, e.g. for a presentation: panning, rotating, tilting, and zooming are off, and the `view` and
   * `zoom` controls are hidden. `view` and `selected` still move it, and an `overview` or `top` view stays fitted
   * when resized. Nodes can still be selected.
   */
  @property({ type: Boolean, reflect: true, attribute: "static" }) isStatic = false;

  /** Freezes the requests in place and stops new ones. */
  @property({ type: Boolean, reflect: true }) paused = false;

  @state() private _unsupported = false;
  @state() private _current: string | null = null;

  private _renderer?: WebGLRenderer;
  private _scene?: Scene;
  private _camera?: PerspectiveCamera;
  private _world?: Group;
  private _dots?: InstancedMesh;
  private _requestColor = new Color();
  private _places = new Map<string, Place>();
  private _outgoing = new Map<string, Road[]>();
  private _roots: string[] = [];
  private _requests: Request[] = [];
  /** Seconds until the next request sets out; arrivals are random (a Poisson process). */
  private _nextSpawn = 0;
  private _history: string[] = [];
  private _pose: CameraPose = {
    target: new Vector3(),
    distance: STREET_DISTANCE,
    azimuth: 0,
    elevation: STREET_ELEVATION,
  };
  private _flight: Flight | null = null;
  /** Center and extent of the laid-out nodes, across (`width`, x) and toward the horizon (`depth`, z). */
  private _bounds = { center: new Vector3(), width: 0, depth: 0 };
  private _frame?: number;
  private _lastTime = 0;
  private _onScreen = true;
  private _labels = new Map<string, HTMLElement>();
  private _drag: {
    pointerId: number;
    mode: "pan" | "rotate";
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null = null;
  private _shared = new Set<unknown>();
  private _glowTexture?: CanvasTexture;
  private _geometries?: {
    disk: CylinderGeometry;
    beacon: CylinderGeometry;
    cap: SphereGeometry;
    ring: RingGeometry;
  };
  private _motionQuery?: MediaQueryList;
  private _schemeQuery?: MediaQueryList;
  private _themeObserver?: MutationObserver;
  private _resizeObserver?: ResizeObserver;
  private _intersectionObserver?: IntersectionObserver;

  static override styles = [
    tokens,
    css`
      :host {
        --_background: var(--ui-surface, #ffffff);
        --_ground: var(--ui-border, #e2e8f0);
        --_edge: var(--dag-edge-color, var(--ui-text-muted, #64748b));
        --_selected: var(--dag-selected-color, var(--ui-warning, #d97706));
        --_highlight: var(--dag-highlight-color, var(--ui-danger, #dc2626));
        --_request: var(--dag-request-color, var(--ui-primary, #4f46e5));
        --_kind: var(--ui-primary, #4f46e5);
        display: block;
        position: relative;
        height: var(--dag-graph-3d-height, 24rem);
        overflow: hidden;
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
        font-size: var(--ui-font-size-xs, 0.6875rem);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
      }
      .stage {
        position: absolute;
        inset: 0;
        cursor: grab;
        touch-action: none;
        user-select: none;
        outline: none;
      }
      :host([static]) .stage {
        cursor: default;
      }
      .stage.dragging {
        cursor: grabbing;
      }
      .stage:focus-visible {
        box-shadow: inset var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .labels {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .label {
        position: absolute;
        top: 0;
        left: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        box-sizing: border-box;
        max-width: 12rem;
        min-height: 2rem;
        padding: 0 0.5rem;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text, #0f172a);
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
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        white-space: nowrap;
        cursor: pointer;
        pointer-events: auto;
        visibility: hidden;
        will-change: transform, opacity;
      }
      .label span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .label .icon {
        display: inline-flex;
        line-height: 0;
        color: var(--dag-kind-color, var(--ui-primary, #4f46e5));
      }
      .label:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .label[aria-current="location"] {
        border-color: var(--dag-selected-color, var(--ui-warning, #d97706));
      }
      .label.muted span {
        color: var(--ui-text-muted, #64748b);
      }
      .label:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .toolbar {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        gap: 0.25rem;
        padding: 0.25rem;
        background: var(--ui-button-secondary-background, none), var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow:
          var(--ui-button-highlight, 0 0 0 0 transparent),
          var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      .message {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        margin: 0;
        font-size: var(--ui-font-size, 0.875rem);
        color: var(--ui-text-muted, #64748b);
      }
      @media (forced-colors: active) {
        .label:focus-visible,
        .stage:focus-visible {
          outline: 2px solid CanvasText;
        }
        .label[aria-current="location"] {
          border-color: Highlight;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._motionQuery.addEventListener("change", this._restart);
    this._schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._schemeQuery.addEventListener("change", this._rebuild);
    this._themeObserver = new MutationObserver(this._rebuild);
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    this._resizeObserver = new ResizeObserver(this._resize);
    this._resizeObserver.observe(this);
    this._intersectionObserver = new IntersectionObserver(this._onIntersect);
    this._intersectionObserver.observe(this);
    document.addEventListener("visibilitychange", this._restart);
    this.addEventListener("wheel", this._onWheel, { passive: false });
    if (this.hasUpdated) this._init();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._motionQuery?.removeEventListener("change", this._restart);
    this._schemeQuery?.removeEventListener("change", this._rebuild);
    this._themeObserver?.disconnect();
    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this._restart);
    this.removeEventListener("wheel", this._onWheel);
    this._teardown();
  }

  protected override firstUpdated(): void {
    this._init();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("nodes") || changed.has("edges") || changed.has("selected")) {
      const known = this.selected && this.nodes.some((node) => node.id === this.selected);
      const next = known ? this.selected : this._firstRoot();
      if (next !== this._current) {
        if (this._current) this._history.push(this._current);
        this._current = next;
      }
    }
  }

  protected override updated(changed: PropertyValues): void {
    this._labels = new Map(
      [...this.renderRoot.querySelectorAll<HTMLElement>(".label")].map((el) => [el.dataset.id!, el]),
    );
    if (changed.has("nodes") || changed.has("edges") || changed.has("kinds") || changed.has("hidePins")) {
      this._rebuild();
      return;
    }
    if (changed.has("_current")) this._updateHalos();
    const settle = changed.has("isStatic") && this.isStatic;
    if (settle || changed.has("view") || (changed.has("_current") && this.view === "street"))
      this._flyTo(this._poseFor(this.view));
    else this._drawIfStill();
  }

  override render() {
    if (this._unsupported) return html`<p class="message">This 3D view needs WebGL.</p>`;
    const empty = this.nodes.length === 0;
    return html`
      <div
        class="stage"
        role="group"
        aria-label=${this._summary()}
        tabindex=${this.isStatic ? nothing : "0"}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
        @contextmenu=${(event: Event) => event.preventDefault()}
        @keydown=${this._onKeyDown}
      >
        <canvas aria-hidden="true"></canvas>
      </div>
      <div class="labels">
        ${repeat(
          this.nodes,
          (node) => node.id,
          (node) => this._renderLabel(node),
        )}
      </div>
      ${empty ? html`<div class="message"><slot name="empty"></slot></div>` : this._renderToolbar()}
    `;
  }

  private _renderLabel(node: DagNode) {
    const kind = node.kind ? this.kinds[node.kind] : undefined;
    return html`<button
      type="button"
      class="label ${node.muted ? "muted" : ""}"
      data-id=${node.id}
      title=${node.label}
      aria-current=${node.id === this._current ? "location" : nothing}
      style=${kind?.color ? `--dag-kind-color: ${kind.color}` : nothing}
      @click=${() => this._choose(node.id)}
    >
      ${kind?.icon ? html`<span class="icon" aria-hidden="true">${kind.icon(14)}</span>` : nothing}
      <span>${node.label}</span>
    </button>`;
  }

  /** The enabled `controls`, minus camera controls when `static` and pause under reduced motion. */
  private get _controls(): Set<DagGraph3dControl> {
    const enabled = new Set(this.controls.split(/\s+/));
    return new Set(
      CONTROLS.filter(
        (control) =>
          enabled.has(control) &&
          !(this.isStatic && CAMERA_CONTROLS.has(control)) &&
          !(control === "pause" && this._reducedMotion),
      ),
    );
  }

  private _renderToolbar() {
    const controls = this._controls;
    if (!controls.size) return nothing;
    return html`<div class="toolbar" role="toolbar" aria-label="Graph view">
      ${
        controls.has("back")
          ? html`<icon-button
              data-control="back"
              label="Back"
              .icon=${iconChevronLeft(18)}
              ?disabled=${this._history.length === 0}
              @click=${this._back}
            ></icon-button>`
          : nothing
      }
      ${
        controls.has("home")
          ? html`<icon-button
              data-control="home"
              label="Go to root"
              .icon=${iconHome(18)}
              @click=${this._home}
            ></icon-button>`
          : nothing
      }
      ${
        controls.has("view")
          ? html`<button-group
              data-control="view"
              icon-only
              .options=${VIEW_OPTIONS}
              .value=${this.view}
              @change=${(event: CustomEvent<{ value: DagGraph3dView }>) => this._setView(event.detail.value)}
            ></button-group>`
          : nothing
      }
      ${
        controls.has("zoom")
          ? html`<icon-button
                data-control="zoom-in"
                label="Zoom in"
                .icon=${iconMagnifyingGlassPlus(18)}
                @click=${() => this._zoom(1 / KEY_ZOOM)}
              ></icon-button>
              <icon-button
                data-control="zoom-out"
                label="Zoom out"
                .icon=${iconMagnifyingGlassMinus(18)}
                @click=${() => this._zoom(KEY_ZOOM)}
              ></icon-button>`
          : nothing
      }
      ${
        controls.has("pause")
          ? html`<icon-button
              data-control="pause"
              label=${this.paused ? "Resume requests" : "Pause requests"}
              .icon=${this.paused ? iconPlay(18) : iconPause(18)}
              @click=${() => (this.paused = !this.paused)}
            ></icon-button>`
          : nothing
      }
    </div>`;
  }

  private _summary(): string {
    const current = this.nodes.find((node) => node.id === this._current);
    const ahead = current
      ? new Set(this.edges.filter((edge) => edge.source === current.id).map((edge) => edge.target)).size
      : 0;
    const where = current ? `, ${this.view} view, at ${current.label} with ${ahead} outgoing` : "";
    return `${this.label}: ${this.nodes.length} nodes, ${this.edges.length} edges${where}`;
  }

  private get _reducedMotion(): boolean {
    return this._motionQuery?.matches ?? false;
  }

  private get _animating(): boolean {
    return !this._reducedMotion && this._onScreen && !document.hidden && this.nodes.length > 0;
  }

  /** The first node without incoming edges (other than cycle-closing ones), or the first node. */
  private _firstRoot(): string | null {
    return this._computeRoots()[0] ?? null;
  }

  private _computeRoots(): string[] {
    const ids = new Set(this.nodes.map((node) => node.id));
    const targets = new Set(
      this.edges.filter((edge) => ids.has(edge.source) && edge.source !== edge.target).map((edge) => edge.target),
    );
    const roots = this.nodes.filter((node) => !targets.has(node.id)).map((node) => node.id);
    return roots.length ? roots : this.nodes.slice(0, 1).map((node) => node.id);
  }

  private _choose(id: string): void {
    if (id === this._current) return;
    this.selected = id;
    this.dispatchEvent(
      new CustomEvent<DagNodeSelectDetail>("node-select", {
        detail: { id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private readonly _back = (): void => {
    const previous = this._history.pop();
    if (!previous) return;
    this._current = previous;
    this.selected = previous;
    this.dispatchEvent(
      new CustomEvent<DagNodeSelectDetail>("node-select", {
        detail: { id: previous },
        bubbles: true,
        composed: true,
      }),
    );
    this.requestUpdate();
  };

  private readonly _home = (): void => {
    const root = this._firstRoot();
    if (root) this._choose(root);
  };

  private _init(): void {
    const canvas = this.renderRoot.querySelector("canvas");
    if (!canvas || this._renderer) return;
    try {
      this._renderer = new WebGLRenderer({ canvas, antialias: true });
    } catch {
      this._unsupported = true;
      return;
    }
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._scene = new Scene();
    this._camera = new PerspectiveCamera(55, 1, 0.1, 200);
    this._geometries = {
      disk: new CylinderGeometry(0.7, 0.7, 0.12, 40),
      beacon: new CylinderGeometry(0.08, 0.08, 1.3, 12),
      cap: new SphereGeometry(0.24, 20, 12),
      ring: new RingGeometry(0.85, 1.05, 48),
    };
    const dotGeometry = new SphereGeometry(DOT_RADIUS, 16, 12);
    this._dots = new InstancedMesh(dotGeometry, new MeshBasicMaterial(), MAX_DOTS);
    this._dots.setColorAt(0, new Color(1, 1, 1));
    this._dots.count = 0;
    this._dots.frustumCulled = false;
    this._glowTexture = glowTexture();
    this._shared = new Set([...Object.values(this._geometries), dotGeometry, this._dots.material, this._glowTexture]);
    this._resize();
    this._rebuild();
  }

  private _teardown(): void {
    this._stop();
    if (this._world) disposeTree(this._world, this._shared);
    for (const item of this._shared) (item as { dispose(): void }).dispose();
    this._renderer?.dispose();
    this._renderer =
      this._scene =
      this._camera =
      this._world =
      this._dots =
      this._geometries =
      this._glowTexture =
        undefined;
    this._places.clear();
    this._outgoing.clear();
    this._requests = [];
  }

  /** Lays the graph out again and rebuilds the scene with the current theme's colors. */
  private readonly _rebuild = (): void => {
    const scene = this._scene;
    if (!scene || !this._dots) return;
    if (this._world) {
      scene.remove(this._world);
      disposeTree(this._world, this._shared);
    }
    const style = getComputedStyle(this);
    const color = (name: string) => cssColor(style.getPropertyValue(name).trim());
    const background = color("--_background");
    scene.background = background;
    scene.fog = new Fog(background, FOG_NEAR, FOG_FAR);
    this._world = new Group();
    this._layOut(color);
    this._requestColor = color("--_request");
    this._world.add(this._dots);
    scene.add(this._world);
    this._requests = [];
    this._updateHalos();
    this._flyTo(this._poseFor(this.view), true);
  };

  private _layOut(color: (name: string) => Color): void {
    const world = this._world!;
    const layout = layoutDag(
      this.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        hasIcon: Boolean(this._kindOf(node)?.icon),
      })),
      this.edges,
      "TB",
    );
    const position = (x: number, y: number) => new Vector3(x * X_SCALE, ROAD_Y, -y * Z_SCALE);
    const centers = new Map(layout.nodes.map((node) => [node.id, position(node.x, node.y)]));
    this._bounds = boundsOf([...centers.values()]);
    const extent = Math.max(40, ...[...centers.values()].map((point) => Math.abs(point.z) + Math.abs(point.x)));
    const grid = new GridHelper(extent * 4, Math.round(extent * 2), color("--_ground"), color("--_ground"));
    world.add(grid);
    this._addRoads(layout.edges, centers, color);
    this._addPlaces(centers, color);
    this._roots = this._computeRoots();
  }

  private _kindOf(node: DagNode): DagNodeKind | undefined {
    return node.kind ? this.kinds[node.kind] : undefined;
  }

  private _addRoads(
    routed: ReturnType<typeof layoutDag>["edges"],
    centers: Map<string, Vector3>,
    color: (name: string) => Color,
  ): void {
    const byKey = new Map(this.edges.map((edge) => [`${edge.source}\u0000${edge.target}`, edge]));
    const weightOf = (edge?: DagEdge) =>
      typeof edge?.weight === "number" && Number.isFinite(edge.weight) && edge.weight >= 0 ? edge.weight : undefined;
    const heaviest = Math.max(0, ...this.edges.map((edge) => weightOf(edge) ?? 0));
    const edgeMaterial = new MeshBasicMaterial({
      color: color("--_edge"),
      side: DoubleSide,
    });
    const highlightMaterial = new MeshBasicMaterial({
      color: color("--_highlight"),
      side: DoubleSide,
    });
    this._outgoing = new Map();
    routed.forEach((layoutEdge, i) => {
      const edge = byKey.get(`${layoutEdge.source}\u0000${layoutEdge.target}`);
      const points = [
        centers.get(layoutEdge.source)!,
        ...layoutEdge.points.map((p) => new Vector3(p.x * X_SCALE, ROAD_Y, -p.y * Z_SCALE)),
        centers.get(layoutEdge.target)!,
      ];
      const deduped = points.filter((point, j) => j === 0 || point.distanceTo(points[j - 1]) > 0.05);
      const curve = new CatmullRomCurve3(
        deduped.map((point) => point.clone().setY(ROAD_Y + i * 0.0005)),
        false,
        "centripetal",
      );
      const weight = weightOf(edge);
      const width = ROAD_WIDTH + (heaviest > 0 && weight ? (weight / heaviest) * ROAD_WEIGHT_WIDTH : 0);
      const material = edge?.highlighted ? highlightMaterial : edgeMaterial;
      this._world!.add(new Mesh(ribbon(curve, width, layoutEdge.backward), material));
      const road: Road = {
        source: layoutEdge.source,
        target: layoutEdge.target,
        curve,
        length: curve.getLength(),
        share: weight ?? 1,
        width,
      };
      this._outgoing.set(road.source, [...(this._outgoing.get(road.source) ?? []), road]);
    });
  }

  private _addPlaces(centers: Map<string, Vector3>, color: (name: string) => Color): void {
    const { disk, beacon, cap } = this._geometries!;
    const fallback = color("--_kind");
    const background = color("--_background");
    this._places = new Map();
    for (const node of this.nodes) {
      const center = centers.get(node.id);
      if (!center) continue;
      const kindColor = this._kindOf(node)?.color ? cssColor(this._kindOf(node)!.color!) : fallback.clone();
      const opacity = node.muted ? 0.4 : 1;
      const material = (tint: Color) =>
        new MeshBasicMaterial({
          color: tint,
          transparent: Boolean(node.muted),
          opacity,
        });
      const group = new Group();
      group.position.copy(center).setY(0);
      group.userData.id = node.id;
      const diskColor = kindColor.clone().lerp(background, 0.55);
      const diskMaterial = material(diskColor);
      const capMaterial = this.hidePins ? undefined : material(kindColor);
      const glow = new Sprite(
        new SpriteMaterial({
          map: this._glowTexture,
          color: kindColor,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      glow.scale.setScalar(GLOW_SIZE);
      glow.visible = false;
      group.add(new Mesh(disk, diskMaterial).translateY(0.06));
      if (capMaterial) {
        group.add(new Mesh(beacon, material(kindColor)).translateY(0.65));
        group.add(new Mesh(cap, capMaterial).translateY(1.35));
      }
      group.add(glow.translateY(this.hidePins ? GLOW_HEIGHT_FLAT : GLOW_HEIGHT));
      this._world!.add(group);
      this._places.set(node.id, {
        id: node.id,
        position: center,
        kindColor,
        cap: capMaterial,
        capColor: kindColor.clone(),
        disk: diskMaterial,
        diskColor,
        glow,
        pulse: 0,
      });
    }
  }

  /** Moves the camera to `pose`: a flight while animating, otherwise a jump. */
  private _flyTo(pose: CameraPose, instant = false): void {
    if (instant || !this._animating) {
      this._pose = pose;
      this._flight = null;
      this._drawIfStill();
      return;
    }
    this._flight = { from: clonePose(this._pose), to: pose, start: performance.now() };
  }

  /** The camera pose of `view`: behind the current node, or fitting the whole graph with the flow left to right. */
  private _poseFor(view: DagGraph3dView): CameraPose {
    if (view === "street") {
      const at = this._places.get(this._current ?? "")?.position ?? this._bounds.center;
      return {
        target: new Vector3(at.x, 0, at.z - STREET_AHEAD),
        distance: STREET_DISTANCE,
        azimuth: 0,
        elevation: STREET_ELEVATION,
      };
    }
    const elevation = view === "top" ? TOP_ELEVATION : OVERVIEW_ELEVATION;
    return {
      target: this._bounds.center.clone(),
      distance: this._fitDistance(elevation),
      azimuth: Math.PI / 2,
      elevation,
    };
  }

  /** How far away the camera must be, at `elevation` and looking along the flow, to fit the whole graph. */
  private _fitDistance(elevation: number): number {
    const camera = this._camera;
    if (!camera) return STREET_DISTANCE;
    const tanVertical = Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const across = this._bounds.depth / 2 + FIT_MARGIN;
    const up = (this._bounds.width / 2 + FIT_MARGIN) * Math.sin(elevation) + 2 * Math.cos(elevation);
    return Math.max(MIN_DISTANCE, across / (tanVertical * camera.aspect), up / tanVertical) * 1.1;
  }

  private _setView(view: DagGraph3dView): void {
    if (view === this.view) return;
    this.view = view;
    this.dispatchEvent(
      new CustomEvent<DagGraph3dViewChangeDetail>("view-change", { detail: { view }, bubbles: true, composed: true }),
    );
  }

  /** Rings the current node in the selected color and highlighted nodes in the highlight color. */
  private _updateHalos(): void {
    const ring = this._geometries?.ring;
    if (!ring) return;
    const style = getComputedStyle(this);
    const tints = {
      selected: cssColor(style.getPropertyValue("--_selected").trim()),
      highlighted: cssColor(style.getPropertyValue("--_highlight").trim()),
    };
    const highlighted = new Set(this.nodes.filter((node) => node.highlighted).map((node) => node.id));
    for (const place of this._places.values()) {
      const group = place.glow.parent!;
      const old = group.children.find((child) => (child as Mesh).geometry === ring) as Mesh | undefined;
      if (old) {
        group.remove(old);
        (old.material as MeshBasicMaterial).dispose();
      }
      const tint = place.id === this._current ? tints.selected : highlighted.has(place.id) ? tints.highlighted : null;
      if (!tint) continue;
      const halo = new Mesh(ring, new MeshBasicMaterial({ color: tint, side: DoubleSide }));
      group.add(halo.rotateX(-Math.PI / 2).translateZ(0.13));
    }
  }

  private readonly _resize = (): void => {
    if (!this._renderer || !this._camera) return;
    const width = Math.max(1, this.clientWidth);
    const height = Math.max(1, this.clientHeight);
    this._renderer.setSize(width, height, false);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    if (this.isStatic) this._flyTo(this._poseFor(this.view), true);
    else this._drawIfStill();
  };

  private readonly _onIntersect = (entries: IntersectionObserverEntry[]): void => {
    this._onScreen = entries.some((entry) => entry.isIntersecting);
    this._restart();
  };

  /** Runs the frame loop while it may animate; otherwise draws a single still frame. */
  private readonly _restart = (): void => {
    this._stop();
    if (!this._renderer) return;
    if (!this._animating) {
      this._requests = [];
      if (this._flight) this._pose = this._flight.to;
      this._flight = null;
      this._drawFrame();
      return;
    }
    this._lastTime = performance.now();
    this._frame = requestAnimationFrame(this._tick);
  };

  private _stop(): void {
    if (this._frame !== undefined) cancelAnimationFrame(this._frame);
    this._frame = undefined;
  }

  private _drawIfStill(): void {
    if (this._frame === undefined) this._drawFrame();
  }

  private readonly _tick = (now: number): void => {
    const dt = Math.min((now - this._lastTime) / 1000, 0.1);
    this._lastTime = now;
    if (this._flight) {
      const t = Math.min(1, (now - this._flight.start) / FLIGHT_MS);
      this._pose = lerpPose(this._flight.from, this._flight.to, easeInOut(t));
      if (t >= 1) this._flight = null;
    }
    if (!this.paused) this._simulate(dt);
    this._updateGlows(dt);
    this._drawFrame();
    this._frame = requestAnimationFrame(this._tick);
  };

  /** Fades each node's glow; a lit node's halo shows and its marker and ground disk brighten. */
  private _updateGlows(dt: number): void {
    const white = new Color(1, 1, 1);
    for (const place of this._places.values()) {
      if (place.pulse === 0) continue;
      place.pulse = Math.max(0, place.pulse - dt * GLOW_FADE);
      place.glow.visible = place.pulse > 0;
      place.glow.material.opacity = place.pulse * GLOW_OPACITY;
      place.cap?.color.copy(place.capColor).lerp(white, place.pulse * 0.45);
      place.disk.color.copy(place.diskColor).lerp(place.kindColor, place.pulse * 0.7);
    }
  }

  /** Spawns requests at the roots and moves every request along its road. */
  private _simulate(dt: number): void {
    const rate = this.rate;
    this._nextSpawn = rate > 0 ? this._nextSpawn - dt : 0;
    while (rate > 0 && this._nextSpawn <= 0) {
      this._nextSpawn += -Math.log(1 - Math.random()) / rate;
      if (this._requests.length < MAX_DOTS) this._spawn();
    }
    this._requests = this._requests.filter((request) => {
      request.distance += request.speed * Math.max(0, this.speed) * dt;
      while (request.distance >= request.road.length) {
        const arrived = this._places.get(request.road.target);
        if (arrived) arrived.pulse = 1;
        const next = this._pickRoad(request.road.target);
        if (!next || ++request.hops >= MAX_HOPS) return false;
        request.distance -= request.road.length;
        request.road = next;
      }
      return true;
    });
  }

  /** Starts a request at a root chosen in proportion to its outgoing traffic, with its own speed, lane, and shade. */
  private _spawn(): void {
    const outgoing = (id: string) => (this._outgoing.get(id) ?? []).reduce((sum, road) => sum + road.share, 0);
    const total = this._roots.reduce((sum, id) => sum + outgoing(id), 0);
    let pick = Math.random() * total;
    const root = this._roots.find((id) => (pick -= outgoing(id)) < 0);
    const road = root ? this._pickRoad(root) : undefined;
    if (!road) return;
    const jitter = () => Math.random() * 2 - 1;
    this._requests.push({
      road,
      distance: 0,
      hops: 0,
      speed: DOT_SPEED * (1 + jitter() * DOT_SPEED_SPREAD),
      lane: jitter(),
      color: this._requestColor.clone().offsetHSL(jitter() * SHADE_HUE, 0, jitter() * SHADE_LIGHTNESS),
    });
  }

  /** Picks one of `id`'s outgoing roads in proportion to its share of the traffic. */
  private _pickRoad(id: string): Road | undefined {
    const roads = this._outgoing.get(id) ?? [];
    const total = roads.reduce((sum, road) => sum + road.share, 0);
    if (total <= 0) return undefined;
    let pick = Math.random() * total;
    return roads.find((road) => (pick -= road.share) < 0) ?? roads[roads.length - 1];
  }

  private _drawFrame(): void {
    const { _renderer: renderer, _scene: scene, _camera: camera } = this;
    if (!renderer || !scene || !camera) return;
    const { target, distance, azimuth, elevation } = this._pose;
    const flat = distance * Math.cos(elevation);
    camera.position.set(
      target.x + flat * Math.sin(azimuth),
      target.y + distance * Math.sin(elevation),
      target.z + flat * Math.cos(azimuth),
    );
    camera.lookAt(target);
    camera.far = Math.max(200, distance * 8);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (scene.fog instanceof Fog) {
      scene.fog.near = distance * FOG_NEAR;
      scene.fog.far = distance * FOG_FAR;
    }
    this._drawRequests();
    renderer.render(scene, camera);
    this._positionLabels(camera);
  }

  /** Places each request at its lane across its road, in its own shade. */
  private _drawRequests(): void {
    const dots = this._dots;
    if (!dots) return;
    const matrix = new Matrix4();
    this._requests.forEach((request, i) => {
      const { road } = request;
      const t = Math.min(1, request.distance / road.length);
      const point = road.curve.getPointAt(t);
      const tangent = road.curve.getTangentAt(t);
      const across = Math.hypot(tangent.x, tangent.z) || 1;
      const offset = request.lane * Math.max(0, road.width / 2 - DOT_RADIUS);
      const x = point.x - (tangent.z / across) * offset;
      const z = point.z + (tangent.x / across) * offset;
      dots.setMatrixAt(i, matrix.makeTranslation(x, DOT_HEIGHT, z));
      dots.setColorAt(i, request.color);
    });
    dots.count = this._requests.length;
    dots.instanceMatrix.needsUpdate = true;
    if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
  }

  /** Pins each label above its node; labels outside the view or far beyond what the camera looks at are hidden. */
  private _positionLabels(camera: PerspectiveCamera): void {
    const width = this.clientWidth;
    const height = this.clientHeight;
    const point = new Vector3();
    for (const [id, label] of this._labels) {
      const place = this._places.get(id);
      if (!place) continue;
      point.copy(place.position).setY(this.hidePins ? LABEL_HEIGHT_FLAT : LABEL_HEIGHT);
      const distance = camera.position.distanceTo(point);
      point.project(camera);
      const reach = this._pose.distance;
      const fade = 1 - (distance - reach * LABEL_FADE_START) / (reach * (LABEL_FADE_END - LABEL_FADE_START));
      const visible = point.z < 1 && Math.abs(point.x) <= 1.05 && Math.abs(point.y) <= 1.05 && fade > 0.05;
      label.style.visibility = visible ? "visible" : "hidden";
      if (!visible) continue;
      const x = ((point.x + 1) / 2) * width;
      const y = ((1 - point.y) / 2) * height;
      const scale = Math.min(1, Math.max(0.7, (reach * 0.5) / distance));
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${scale})`;
      label.style.opacity = String(Math.min(1, fade));
      label.style.zIndex = String(Math.round(1000 - distance * 10));
    }
  }

  private _onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.button !== 2) return;
    this._drag = {
      pointerId: event.pointerId,
      mode: event.button === 2 || event.shiftKey ? "rotate" : "pan",
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  private _onPointerMove(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return;
    drag.moved = true;
    (event.currentTarget as HTMLElement).classList.add("dragging");
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (this.isStatic) return;
    if (drag.mode === "pan") this._pan(dx, dy);
    else this._rotate(-dx * ROTATE_PER_PIXEL, dy * ROTATE_PER_PIXEL);
  }

  private _onPointerUp(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    this._drag = null;
    (event.currentTarget as HTMLElement).classList.remove("dragging");
    if (!drag.moved && event.type === "pointerup" && event.button === 0) this._pick(event);
  }

  /** Zooms on pinch or Ctrl/⌘ + wheel, leaving a plain wheel to scroll the page. */
  private readonly _onWheel = (event: WheelEvent): void => {
    if (this.isStatic || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    this._zoom(Math.exp(event.deltaY * WHEEL_ZOOM));
  };

  /** Arrow keys pan (Shift: rotate and tilt), `+`/`-` zoom, and `0` returns to the current `view`. */
  private _onKeyDown(event: KeyboardEvent): void {
    if (this.isStatic) return;
    const move: Record<string, () => void> = event.shiftKey
      ? {
          ArrowLeft: () => this._rotate(KEY_ROTATE, 0),
          ArrowRight: () => this._rotate(-KEY_ROTATE, 0),
          ArrowUp: () => this._rotate(0, KEY_ROTATE),
          ArrowDown: () => this._rotate(0, -KEY_ROTATE),
        }
      : {
          ArrowLeft: () => this._pan(KEY_PAN, 0),
          ArrowRight: () => this._pan(-KEY_PAN, 0),
          ArrowUp: () => this._pan(0, KEY_PAN),
          ArrowDown: () => this._pan(0, -KEY_PAN),
        };
    const actions: Record<string, () => void> = {
      ...move,
      "+": () => this._zoom(1 / KEY_ZOOM),
      "=": () => this._zoom(1 / KEY_ZOOM),
      "-": () => this._zoom(KEY_ZOOM),
      "0": () => this._flyTo(this._poseFor(this.view)),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  /** Moves what the camera looks at across the ground, as if dragging the ground by `dx`, `dy` pixels. */
  private _pan(dx: number, dy: number): void {
    const camera = this._camera;
    if (!camera) return;
    this._flight = null;
    const { distance, azimuth, elevation } = this._pose;
    const perPixel = (2 * distance * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, this.clientHeight);
    const right = new Vector3(Math.cos(azimuth), 0, -Math.sin(azimuth));
    const forward = new Vector3(-Math.sin(azimuth), 0, -Math.cos(azimuth));
    this._pose.target
      .addScaledVector(right, -dx * perPixel)
      .addScaledVector(forward, (dy * perPixel) / Math.max(0.3, Math.sin(elevation)));
    this._drawIfStill();
  }

  /** Turns the camera around what it looks at, and tilts it between near the ground and straight above. */
  private _rotate(azimuth: number, elevation: number): void {
    this._flight = null;
    this._pose.azimuth += azimuth;
    this._pose.elevation = MathUtils.clamp(this._pose.elevation + elevation, MIN_ELEVATION, TOP_ELEVATION);
    this._drawIfStill();
  }

  /** Moves the camera `factor` times as far from what it looks at, within limits. */
  private _zoom(factor: number): void {
    this._flight = null;
    const farthest = Math.max(200, this._fitDistance(OVERVIEW_ELEVATION) * 3);
    this._pose.distance = MathUtils.clamp(this._pose.distance * factor, MIN_DISTANCE, farthest);
    this._drawIfStill();
  }

  /** Selects the node under the pointer, if any. */
  private _pick(event: PointerEvent): void {
    if (!this._camera || !this._world) return;
    const rect = this.getBoundingClientRect();
    const pointer = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new Raycaster();
    raycaster.setFromCamera(pointer, this._camera);
    for (const hit of raycaster.intersectObjects(this._world.children, true)) {
      let object: Object3D | null = hit.object;
      while (object && object.userData.id === undefined) object = object.parent;
      if (object) return this._choose(object.userData.id as string);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dag-graph-3d": DagGraph3d;
  }
}
