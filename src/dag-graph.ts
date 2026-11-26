import { LitElement, css, html, nothing, svg, type PropertyValues, type SVGTemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { curveBasis, line } from "d3-shape";
import { tokens } from "./tokens.js";
import {
  iconArrowLongDown,
  iconArrowLongRight,
  iconArrowsPointingIn,
  iconMagnifyingGlassMinus,
  iconMagnifyingGlassPlus,
  iconViewfinderCircle,
} from "./icons.js";
import "./icon-button.js";
import {
  approximateTextWidth,
  DAG_LABEL_OFFSET,
  DAG_EDGE_LABEL_HEIGHT,
  DAG_LABEL_OFFSET_PLAIN,
  DAG_NODE_HEIGHT,
  layoutDag,
  type DagDirection,
  type DagLayout,
  type DagLayoutEdge,
  type DagLayoutNode,
  type DagPoint,
  type MeasureText,
} from "./utils/dag-layout.js";

export type { DagDirection } from "./utils/dag-layout.js";

/** One node of a `dag-graph`. */
export interface DagNode {
  /** Unique id, referenced by edges and by `selected`. */
  id: string;
  /** Text shown on the node; long labels are shortened with an ellipsis (the full text is the tooltip). */
  label: string;
  /** Key into `kinds`, which supplies the node's icon, color, and border style. */
  kind?: string;
  /** Draws the node faded with a dotted border, e.g. for data that is incomplete or unavailable. */
  muted?: boolean;
  /** Emphasizes the node, e.g. as part of a highlighted path or cycle. */
  highlighted?: boolean;
}

/** One directed edge of a `dag-graph`, pointing from `source` to `target`. */
export interface DagEdge {
  source: string;
  target: string;
  /** Emphasizes the edge, e.g. as part of a highlighted path or cycle. */
  highlighted?: boolean;
  /**
   * Text shown midway along the edge, with room reserved for it in the layout; long labels are shortened with an
   * ellipsis (the full text is the tooltip).
   */
  label?: string;
  /**
   * Non-negative magnitude, e.g. a call count: the edge is drawn thicker in proportion to the graph's heaviest
   * weight (1px for none, up to 6px), and the weight is added to its tooltip. Other values are ignored.
   */
  weight?: number;
}

/** Presentation of one node kind. */
export interface DagNodeKind {
  /** Name shown in the legend and appended to the node tooltip. */
  label?: string;
  /** Accent color (any CSS color) for the icon and border; defaults to `--ui-primary`. */
  color?: string;
  /** Icon factory, called with the icon size in pixels — e.g. one of the package's `icon*` exports. */
  icon?: (size: number) => SVGTemplateResult;
  /** Draws the node with a dashed border. */
  dashed?: boolean;
}

/** A built-in toolbar control: `zoom` (in and out), `fit`, `center` (on the selected node), or `direction`. */
export type DagControl = "zoom" | "fit" | "center" | "direction";

/** Detail of the `direction-change` event. */
export interface DagDirectionChangeDetail {
  direction: DagDirection;
}

/** Detail of the `node-select` event. */
export interface DagNodeSelectDetail {
  id: string;
}

interface View {
  x: number;
  y: number;
  k: number;
}

/** A laid-out edge with everything needed to draw it and its label. */
interface StyledEdge {
  layout: DagLayoutEdge;
  title: string;
  highlighted: boolean;
  incident: boolean;
  /** Stroke width in pixels, for weighted edges only. */
  width?: number;
  /** Arrowhead length in layout units, for weighted edges only. */
  arrow?: number;
}

const ICON_SIZE = 14;
const MIN_SCALE = 0.05;
const MAX_SCALE = 3;
const FIT_PADDING = 24;
/** Below this fitted zoom labels get hard to read, so the selected node is shown at 100% instead. */
const READABLE_SCALE = 0.6;
const DRAG_THRESHOLD = 4;
const KEY_PAN = 48;
const KEY_ZOOM = 1.25;
const CONTROLS: readonly DagControl[] = ["zoom", "fit", "center", "direction"];
/** Stroke width, in pixels, of the graph's heaviest edge. */
const MAX_EDGE_WIDTH = 6;

const route = line<DagPoint>()
  .x((point) => point.x)
  .y((point) => point.y)
  .curve(curveBasis);

/**
 * Interactive layered drawing of a directed graph — dependencies, pipelines, or any node-link data.
 *
 * Nodes are placed in layers (via dagre) so edges flow left to right (or top to bottom with
 * `direction="TB"`); cycles are allowed, and the edges closing them are drawn dashed and point backward.
 * Each node is a compact card sized to its label, with an optional icon, color, and border style from
 * `kinds`. The whole graph is shown when it fits at a readable zoom; otherwise the selected node is centered at
 * 100%. Drag to pan; pinch or Ctrl/⌘ + wheel to zoom (a plain wheel scrolls the page). With keyboard
 * focus on the graph, arrow keys pan, `+`/`-` zoom, and `0` fits the graph. Clicking a node, or pressing
 * Enter/Space on it, selects it. A toolbar in the top-right corner offers the `controls` you enable.
 *
 * Edges can carry an optional `label`, drawn midway along the edge, and an optional `weight`, which draws the
 * edge thicker in proportion to the heaviest weight in the graph.
 *
 * Set `static` to present a fixed picture: the graph is always fitted into view, panning and zooming
 * are off, and the toolbar is hidden; nodes can still be selected.
 *
 * Colors can be changed with these custom properties: `--dag-node-background`, `--dag-node-text`,
 * `--dag-edge-color`, `--dag-selected-color`, and `--dag-highlight-color`; `--dag-graph-height` sets the
 * height (default `24rem`).
 *
 * @element dag-graph
 * @fires node-select - A node was clicked or activated with the keyboard; `detail` is `{ id }`.
 * @fires direction-change - The toolbar's direction control flipped `direction`; `detail` is `{ direction }`.
 * @slot empty - Shown when there are no nodes.
 */
@customElement("dag-graph")
export class DagGraph extends LitElement {
  /** Nodes to draw. */
  @property({ type: Array }) nodes: DagNode[] = [];

  /** Directed edges between `nodes`; edges with an unknown endpoint or to the node itself are ignored. */
  @property({ type: Array }) edges: DagEdge[] = [];

  /** Presentation per node `kind`: legend label, color, icon, and border style. */
  @property({ attribute: false }) kinds: Record<string, DagNodeKind> = {};

  /**
   * Id of the selected node. Selecting a node updates it; when it changes to a node outside the visible area,
   * the view follows.
   */
  @property({ reflect: true }) selected: string | null = null;

  /** Layer direction: `LR` (left to right) or `TB` (top to bottom). */
  @property({ reflect: true }) direction: DagDirection = "LR";

  /** Accessible name of the graph; the node and edge counts are appended. */
  @property() label = "Directed graph";

  /** Shows a legend of `kinds` below the graph. */
  @property({ type: Boolean, reflect: true }) legend = false;

  /**
   * Space-separated toolbar controls to show: any of `zoom`, `fit`, `center`, and `direction`, in that
   * order. An empty value hides the toolbar.
   */
  @property({ reflect: true }) controls = "zoom fit center";

  /** Presents a static picture: always fitted, with panning, zooming, and the toolbar turned off. */
  @property({ type: Boolean, reflect: true, attribute: "static" }) isStatic = false;

  @state() private _view: View = { x: 0, y: 0, k: 1 };
  @state() private _hovered: string | null = null;
  @state() private _panning = false;

  @query("svg") private _svg!: SVGSVGElement;

  private _layout: DagLayout = { nodes: [], edges: [] };
  private _positions = new Map<string, DagLayoutNode>();
  private _size = { width: 0, height: 0 };
  private _viewReady = false;
  private _lastSelected: string | null = null;
  private _lastDirection: DagDirection | null = null;
  private _measure: MeasureText = approximateTextWidth;
  private _measureFont = "";
  private _resizeObserver: ResizeObserver | null = null;
  private _drag: { pointerId: number; x: number; y: number; view: View; moved: boolean } | null = null;
  private _suppressClick = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: var(--dag-graph-height, 24rem);
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
      }
      .canvas {
        position: relative;
        flex: 1;
        min-height: 0;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
        cursor: grab;
        touch-action: none;
        user-select: none;
        outline: none;
      }
      svg.panning {
        cursor: grabbing;
      }
      :host([static]) svg {
        cursor: default;
      }
      .toolbar {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        gap: 0.25rem;
        padding: 0.25rem;
        background:
          var(--ui-button-secondary-background, none),
          var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow:
          var(--ui-button-highlight, 0 0 0 0 transparent),
          var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      svg:focus-visible {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .edge {
        fill: none;
        stroke: var(--dag-edge-color, var(--ui-text-muted, #64748b));
        stroke-opacity: 0.45;
        stroke-width: var(--_dag-edge-width, 1px);
        vector-effect: non-scaling-stroke;
      }
      .edge.backward {
        stroke-dasharray: 4 3;
      }
      .edges.emphasis .edge {
        stroke-opacity: 0.08;
      }
      .edges.emphasis .edge.incident {
        stroke-opacity: 0.9;
      }
      .edge.highlighted,
      .edges.emphasis .edge.highlighted {
        stroke: var(--dag-highlight-color, var(--ui-danger, #dc2626));
        stroke-opacity: 1;
        stroke-width: calc(var(--_dag-edge-width, 1px) + 1px);
      }
      .edge-label rect {
        rx: var(--ui-radius-sm, 0.25rem);
        fill: var(--ui-surface, #ffffff);
      }
      .edge-label text {
        fill: var(--ui-text-muted, #64748b);
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
      }
      .edge-label.highlighted text {
        fill: var(--dag-highlight-color, var(--ui-danger, #dc2626));
      }
      .edge-labels.emphasis .edge-label {
        opacity: 0.25;
      }
      .edge-labels.emphasis .edge-label.incident,
      .edge-labels.emphasis .edge-label.highlighted {
        opacity: 1;
      }
      .arrow {
        fill: var(--dag-edge-color, var(--ui-text-muted, #64748b));
        fill-opacity: 0.7;
      }
      .arrow.highlighted {
        fill: var(--dag-highlight-color, var(--ui-danger, #dc2626));
        fill-opacity: 1;
      }
      .node {
        cursor: pointer;
        outline: none;
      }
      .gloss-start {
        stop-color: var(--ui-button-secondary-gloss-start, var(--ui-surface, #ffffff));
      }
      .gloss-end {
        stop-color: var(--ui-button-secondary-gloss-end, var(--ui-surface, #ffffff));
      }
      .node rect {
        rx: var(--ui-radius-sm, 0.25rem);
        fill: var(--dag-node-background, url(#node-fill));
        stroke: color-mix(
          in srgb,
          var(--dag-kind-color, var(--ui-primary, #4f46e5)) 55%,
          var(--dag-node-background, var(--ui-surface, #ffffff))
        );
        stroke-width: 1;
      }
      .node.dashed rect {
        stroke-dasharray: 4 2;
      }
      .node.muted rect {
        fill: var(--ui-surface-muted, #f8fafc);
        stroke: var(--ui-text-muted, #64748b);
        stroke-opacity: 0.6;
        stroke-dasharray: 1.5 2;
      }
      .node.muted .icon,
      .node.muted .label {
        opacity: 0.6;
      }
      .node.selected rect {
        fill: color-mix(
          in srgb,
          var(--dag-selected-color, var(--ui-warning, #d97706)) 15%,
          var(--dag-node-background, var(--ui-surface, #ffffff))
        );
        stroke: var(--dag-selected-color, var(--ui-warning, #d97706));
        stroke-opacity: 1;
        stroke-width: 1.5;
      }
      .node.highlighted rect {
        stroke: var(--dag-highlight-color, var(--ui-danger, #dc2626));
        stroke-opacity: 1;
        stroke-width: 1.5;
      }
      .node:hover rect,
      .node:focus-visible rect {
        stroke: var(--ui-primary, #4f46e5);
        stroke-opacity: 1;
        stroke-width: 2;
      }
      .icon {
        color: var(--dag-kind-color, var(--ui-primary, #4f46e5));
      }
      .label {
        fill: var(--dag-node-text, var(--ui-text, #0f172a));
        dominant-baseline: central;
        pointer-events: none;
      }
      .empty {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        margin: 0;
        font-size: var(--ui-font-size, 0.875rem);
        color: var(--ui-text-muted, #64748b);
        pointer-events: none;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        margin: 0;
        padding: 0.5rem 0 0;
        list-style: none;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
      }
      .legend li {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .legend .swatch {
        display: inline-flex;
        line-height: 0;
        color: var(--dag-kind-color, var(--ui-primary, #4f46e5));
      }
      @media (forced-colors: active) {
        .node:focus-visible rect,
        .node.selected rect {
          stroke: Highlight;
        }
        svg:focus-visible {
          outline: 2px solid CanvasText;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver((entries) => this._resize(entries[0]?.contentRect));
    const canvas = this.renderRoot.querySelector(".canvas");
    if (canvas) this._resizeObserver.observe(canvas);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  protected override firstUpdated(): void {
    const canvas = this.renderRoot.querySelector(".canvas");
    if (canvas) this._resizeObserver?.observe(canvas);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("nodes") || changed.has("edges") || changed.has("direction") || changed.has("kinds")) {
      this._relayout();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("isStatic") && this.isStatic) this.fit();
    if (changed.has("selected") && !this._layoutChanged(changed)) this._revealSelected();
  }

  /** Fits the whole graph into view, never enlarging it beyond 100%. */
  fit(): void {
    if (!this._layout.nodes.length || !this._size.width) return;
    const boxes = [
      ...this._layout.nodes.map((node) => ({ ...node, height: DAG_NODE_HEIGHT })),
      ...this._layout.edges.flatMap((edge) => (edge.label ? [{ ...edge.label, height: DAG_EDGE_LABEL_HEIGHT }] : [])),
    ];
    const left = Math.min(...boxes.map((box) => box.x - box.width / 2));
    const right = Math.max(...boxes.map((box) => box.x + box.width / 2));
    const top = Math.min(...boxes.map((box) => box.y - box.height / 2));
    const bottom = Math.max(...boxes.map((box) => box.y + box.height / 2));
    const k = this._clamp(
      Math.min(
        1,
        (this._size.width - 2 * FIT_PADDING) / Math.max(right - left, 1),
        (this._size.height - 2 * FIT_PADDING) / Math.max(bottom - top, 1),
      ),
    );
    this._centerOn({ x: (left + right) / 2, y: (top + bottom) / 2 }, k);
  }

  /** Centers the view on a node (the selected one by default) at 100% zoom. */
  center(id: string | null = this.selected): void {
    const node = id ? this._positions.get(id) : undefined;
    if (node) this._centerOn(node, 1);
  }

  /** Zooms by `factor` (e.g. `1.25` or `0.8`) around the center of the view. */
  zoomBy(factor: number): void {
    this._zoomAround(this._size.width / 2, this._size.height / 2, factor);
  }

  override render() {
    const nodeCount = this._layout.nodes.length;
    const summary = `${this.label}: ${nodeCount} ${nodeCount === 1 ? "node" : "nodes"}, `
      + `${this._layout.edges.length} ${this._layout.edges.length === 1 ? "edge" : "edges"}`;
    const { x, y, k } = this._view;
    const edges = this._styledEdges();
    const emphasis = this._hovered ? "emphasis" : "";
    return html`
      <div class="canvas">
        <svg
          class=${this._panning ? "panning" : ""}
          role="group"
          tabindex=${this.isStatic ? nothing : "0"}
          aria-label=${summary}
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          @wheel=${this._onWheel}
          @keydown=${this._onKeyDown}
        >
          <defs>
            <marker id="arrow" viewBox="0 -4 8 8" refX="8" refY="0" markerWidth="7" markerHeight="7" orient="auto">
              <path class="arrow" d="M0,-4L8,0L0,4Z" />
            </marker>
            <marker id="arrow-highlighted" viewBox="0 -4 8 8" refX="8" refY="0" markerWidth="7" markerHeight="7"
              orient="auto">
              <path class="arrow highlighted" d="M0,-4L8,0L0,4Z" />
            </marker>
            ${this._renderWeightedArrows(edges)}
            <linearGradient id="node-fill" x1="0" y1="0" x2="0" y2="1">
              <stop class="gloss-start" offset="0%" />
              <stop class="gloss-end" offset="100%" />
            </linearGradient>
          </defs>
          <g transform="translate(${x},${y}) scale(${k})">
            <g class="edges ${emphasis}">${edges.map((edge) => this._renderEdge(edge))}</g>
            <g class="edge-labels ${emphasis}">${edges.map((edge) => this._renderEdgeLabel(edge))}</g>
            <g class="nodes">${this._layout.nodes.map((node) => this._renderNode(node))}</g>
          </g>
        </svg>
        ${nodeCount ? nothing : html`<p class="empty"><slot name="empty">No nodes to show.</slot></p>`}
        ${this._renderToolbar()}
      </div>
      ${this.legend ? this._renderLegend() : nothing}
    `;
  }

  /** The enabled `controls`, in their fixed order; none in static mode or without nodes. */
  private get _controls(): DagControl[] {
    if (this.isStatic || !this._layout.nodes.length) return [];
    const enabled = new Set(this.controls.split(/\s+/));
    return CONTROLS.filter((control) => enabled.has(control));
  }

  private _renderToolbar() {
    const controls = this._controls;
    if (!controls.length) return nothing;
    const vertical = this.direction === "TB";
    const button = (control: string, label: string, icon: SVGTemplateResult, action: () => void) => html`
      <icon-button data-control=${control} label=${label} .icon=${icon} @click=${action}></icon-button>`;
    return html`<div class="toolbar" role="toolbar" aria-label="Graph view">
      ${controls.map((control) => {
        switch (control) {
          case "zoom":
            return html`${button("zoom-in", "Zoom in", iconMagnifyingGlassPlus(18), () => this.zoomBy(KEY_ZOOM))}
              ${button("zoom-out", "Zoom out", iconMagnifyingGlassMinus(18), () => this.zoomBy(1 / KEY_ZOOM))}`;
          case "fit":
            return button("fit", "Fit graph", iconArrowsPointingIn(18), () => this.fit());
          case "center":
            return html`<icon-button
              data-control="center"
              label="Center selected node"
              .icon=${iconViewfinderCircle(18)}
              ?disabled=${!this.selected || !this._positions.has(this.selected)}
              @click=${() => this.center()}
            ></icon-button>`;
          case "direction":
            return button(
              "direction",
              vertical ? "Lay out left to right" : "Lay out top to bottom",
              vertical ? iconArrowLongRight(18) : iconArrowLongDown(18),
              () => this._toggleDirection(),
            );
        }
      })}
    </div>`;
  }

  private _toggleDirection(): void {
    this.direction = this.direction === "LR" ? "TB" : "LR";
    this.dispatchEvent(
      new CustomEvent<DagDirectionChangeDetail>("direction-change", {
        detail: { direction: this.direction },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Pairs each laid-out edge with its input's presentation; on duplicate edges the last one wins. */
  private _styledEdges(): StyledEdge[] {
    const inputs = new Map(this.edges.map((edge) => [this._edgeKey(edge), edge]));
    const highlighted = new Set(
      this.edges.filter((edge) => edge.highlighted).map((edge) => this._edgeKey(edge)),
    );
    const names = new Map(this.nodes.map((node) => [node.id, node.label]));
    const weighted = this._layout.edges.map((edge) => {
      const weight = inputs.get(this._edgeKey(edge))?.weight;
      return typeof weight === "number" && Number.isFinite(weight) && weight >= 0 ? weight : undefined;
    });
    const heaviest = Math.max(0, ...weighted.map((weight) => weight ?? 0));
    return this._layout.edges.map((edge, index) => {
      const input = inputs.get(this._edgeKey(edge));
      const weight = weighted[index];
      const isHighlighted = highlighted.has(this._edgeKey(edge));
      const width = weight === undefined
        ? undefined
        : Math.round(2 * (1 + ((MAX_EDGE_WIDTH - 1) * weight) / (heaviest || 1))) / 2;
      const title = `${names.get(edge.source)} → ${names.get(edge.target)}`
        + (input?.label ? `: ${input.label}` : "")
        + (weight === undefined ? "" : ` (weight ${weight.toLocaleString()})`);
      return {
        layout: edge,
        title,
        highlighted: isHighlighted,
        incident: edge.source === this._hovered || edge.target === this._hovered,
        width,
        arrow: width === undefined ? undefined : 5 + 2 * (width + (isHighlighted ? 1 : 0)),
      };
    });
  }

  /**
   * Arrowheads for weighted edges, one per size and color: they grow more slowly than the stroke and sit just
   * past the shortened path, so a thick stroke never pokes out beside the arrow's tip.
   */
  private _renderWeightedArrows(edges: StyledEdge[]): SVGTemplateResult[] {
    const sizes = new Map<string, { size: number; highlighted: boolean }>();
    for (const { arrow, highlighted } of edges) {
      if (arrow !== undefined) sizes.set(this._arrowId(arrow, highlighted), { size: arrow, highlighted });
    }
    return [...sizes].map(([id, { size, highlighted }]) => svg`<marker id=${id} viewBox="0 -4 8 8" refX="0"
      refY="0" markerUnits="userSpaceOnUse" markerWidth=${size} markerHeight=${size} orient="auto">
      <path class="arrow ${highlighted ? "highlighted" : ""}" d="M0,-4L8,0L0,4Z" /></marker>`);
  }

  private _arrowId(size: number, highlighted: boolean): string {
    return `arrow-${size}${highlighted ? "-highlighted" : ""}`;
  }

  private _renderEdge(edge: StyledEdge): SVGTemplateResult {
    const { layout, arrow } = edge;
    const classes = [
      "edge",
      layout.backward ? "backward" : "",
      edge.highlighted ? "highlighted" : "",
      edge.incident ? "incident" : "",
    ].filter(Boolean).join(" ");
    const marker = arrow === undefined
      ? (edge.highlighted ? "arrow-highlighted" : "arrow")
      : this._arrowId(arrow, edge.highlighted);
    const points = arrow === undefined ? layout.points : this._shortenEnd(layout.points, arrow);
    return svg`<path class=${classes} data-source=${layout.source} data-target=${layout.target}
      style=${edge.width === undefined ? nothing : `--_dag-edge-width: ${edge.width}px`}
      d=${route(points) ?? ""} marker-end="url(#${marker})">
      <title>${edge.title}</title></path>`;
  }

  private _renderEdgeLabel(edge: StyledEdge): SVGTemplateResult | typeof nothing {
    const { layout } = edge;
    const label = layout.label;
    if (!label) return nothing;
    const classes = [
      "edge-label",
      edge.highlighted ? "highlighted" : "",
      edge.incident ? "incident" : "",
    ].filter(Boolean).join(" ");
    return svg`<g class=${classes} data-source=${layout.source} data-target=${layout.target}
      transform="translate(${label.x},${label.y})">
      <title>${edge.title}</title>
      <rect x=${-label.width / 2} y=${-DAG_EDGE_LABEL_HEIGHT / 2} width=${label.width}
        height=${DAG_EDGE_LABEL_HEIGHT}></rect>
      <text>${label.text}</text>
    </g>`;
  }

  /** Pulls the last point back by `length` (at most 80% of the final segment) to make room for an arrowhead. */
  private _shortenEnd(points: DagPoint[], length: number): DagPoint[] {
    if (points.length < 2) return points;
    const end = points[points.length - 1];
    const previous = points[points.length - 2];
    const distance = Math.hypot(end.x - previous.x, end.y - previous.y);
    if (!distance) return points;
    const ratio = Math.min(length, 0.8 * distance) / distance;
    return [
      ...points.slice(0, -1),
      { x: end.x - (end.x - previous.x) * ratio, y: end.y - (end.y - previous.y) * ratio },
    ];
  }

  private _renderNode(position: DagLayoutNode): SVGTemplateResult {
    const node = this.nodes.find((candidate) => candidate.id === position.id)!;
    const kind = node.kind ? this.kinds[node.kind] : undefined;
    const classes = [
      "node",
      kind?.dashed ? "dashed" : "",
      node.muted ? "muted" : "",
      node.highlighted ? "highlighted" : "",
      node.id === this.selected ? "selected" : "",
    ].filter(Boolean).join(" ");
    const left = -position.width / 2;
    const offset = kind?.icon ? DAG_LABEL_OFFSET : DAG_LABEL_OFFSET_PLAIN;
    const name = kind?.label ? `${node.label} (${kind.label})` : node.label;
    return svg`<g class=${classes} data-id=${node.id} role="button" tabindex="0"
      aria-pressed=${node.id === this.selected ? "true" : "false"} aria-label=${name}
      style=${kind?.color ? `--dag-kind-color: ${kind.color}` : nothing}
      transform="translate(${position.x},${position.y})"
      @click=${() => this._activate(node.id)}
      @keydown=${(event: KeyboardEvent) => this._onNodeKey(event, node.id)}
      @pointerenter=${() => { this._hovered = node.id; }}
      @pointerleave=${() => { this._hovered = null; }}
      @focus=${() => { this._hovered = node.id; }}
      @blur=${() => { this._hovered = null; }}>
      <title>${name}</title>
      <rect x=${left} y=${-DAG_NODE_HEIGHT / 2} width=${position.width} height=${DAG_NODE_HEIGHT}></rect>
      ${kind?.icon
        ? svg`<g class="icon" transform="translate(${left + 6},${-ICON_SIZE / 2})">${kind.icon(ICON_SIZE)}</g>`
        : nothing}
      <text class="label" x=${left + offset}>${position.label}</text>
    </g>`;
  }

  private _renderLegend() {
    const entries = Object.entries(this.kinds).filter(([, kind]) => kind.label);
    if (!entries.length) return nothing;
    return html`<ul class="legend" aria-label="Legend">
      ${entries.map(([key, kind]) => html`<li data-kind=${key}
        style=${kind.color ? `--dag-kind-color: ${kind.color}` : nothing}>
        ${kind.icon ? html`<span class="swatch" aria-hidden="true">${kind.icon(ICON_SIZE)}</span>` : nothing}
        ${kind.label}</li>`)}
    </ul>`;
  }

  private _edgeKey(edge: { source: string; target: string }): string {
    return `${edge.source}\u0000${edge.target}`;
  }

  private _layoutChanged(changed: PropertyValues<this>): boolean {
    return changed.has("nodes") || changed.has("edges") || changed.has("direction") || changed.has("kinds");
  }

  /** Lays the graph out again, keeping the selected node where it was on screen. */
  private _relayout(): void {
    const previous = this.selected ? this._positions.get(this.selected) : undefined;
    const previousSelected = this._lastSelected;
    this._updateMeasure();
    const inputs = this.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      hasIcon: Boolean(node.kind && this.kinds[node.kind]?.icon),
    }));
    this._layout = layoutDag(inputs, this.edges, this.direction, this._measure);
    this._positions = new Map(this._layout.nodes.map((node) => [node.id, node]));
    const directionChanged = this._lastDirection !== null && this._lastDirection !== this.direction;
    this._lastSelected = this.selected;
    this._lastDirection = this.direction;
    if (!this._size.width) return;
    if (!this._viewReady) {
      this._initView();
      return;
    }
    const current = this.selected ? this._positions.get(this.selected) : undefined;
    if (current && previous && previousSelected === this.selected && !directionChanged && !this.isStatic) {
      const { x, y, k } = this._view;
      this._view = { k, x: x + k * (previous.x - current.x), y: y + k * (previous.y - current.y) };
    } else {
      this._frame();
    }
  }

  private _initView(): void {
    this._viewReady = true;
    this._frame();
  }

  /**
   * Shows the whole graph when it fits at a readable zoom (always, when static); otherwise centers the selected
   * node at 100%.
   */
  private _frame(): void {
    this.fit();
    if (this.isStatic) return;
    if (this._view.k < READABLE_SCALE && this.selected && this._positions.has(this.selected)) this.center();
  }

  /** Brings the selected node into view if it is outside the visible area. */
  private _revealSelected(): void {
    const node = this.selected ? this._positions.get(this.selected) : undefined;
    if (!node || !this._size.width || this.isStatic) return;
    const { x, y, k } = this._view;
    const screenX = x + k * node.x;
    const screenY = y + k * node.y;
    const visible = screenX > 0 && screenX < this._size.width && screenY > 0 && screenY < this._size.height;
    if (!visible) this.center();
  }

  /** Measures labels with the host's actual font, so themes with other fonts still size cards correctly. */
  private _updateMeasure(): void {
    const style = getComputedStyle(this);
    const font = `${style.fontSize} ${style.fontFamily}`;
    if (font === this._measureFont) return;
    this._measureFont = font;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      this._measure = approximateTextWidth;
      return;
    }
    context.font = font;
    const widths = new Map<string, number>();
    this._measure = (text) => {
      if (!widths.has(text)) widths.set(text, context.measureText(text).width);
      return widths.get(text)!;
    };
  }

  private _resize(rect: DOMRectReadOnly | undefined): void {
    if (!rect) return;
    const { width, height } = rect;
    // A hidden graph (e.g. `display: none` in an inactive tab) measures 0×0; keep the last real size so the view
    // is unchanged when it is shown again, instead of shifting by half the canvas.
    if (!width || !height) return;
    const previous = this._size;
    this._size = { width, height };
    if (!this._viewReady) {
      if (this._layout.nodes.length) this._initView();
      return;
    }
    if (this.isStatic) {
      this.fit();
      return;
    }
    this._view = {
      ...this._view,
      x: this._view.x + (width - previous.width) / 2,
      y: this._view.y + (height - previous.height) / 2,
    };
  }

  private _clamp(k: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));
  }

  private _centerOn(point: DagPoint, k: number): void {
    this._view = { k, x: this._size.width / 2 - k * point.x, y: this._size.height / 2 - k * point.y };
  }

  private _zoomAround(screenX: number, screenY: number, factor: number): void {
    const { x, y, k } = this._view;
    const next = this._clamp(k * factor);
    const ratio = next / k;
    this._view = { k: next, x: screenX - (screenX - x) * ratio, y: screenY - (screenY - y) * ratio };
  }

  private _activate(id: string): void {
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    this.selected = id;
    this.dispatchEvent(
      new CustomEvent<DagNodeSelectDetail>("node-select", { detail: { id }, bubbles: true, composed: true }),
    );
  }

  private _onNodeKey(event: KeyboardEvent, id: string): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    this._activate(id);
  }

  private _onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.isStatic) return;
    this._suppressClick = false;
    this._drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, view: this._view, moved: false };
  }

  private _onPointerMove(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      this._panning = true;
      this._svg.setPointerCapture(event.pointerId);
    }
    this._view = { ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy };
  }

  private _onPointerUp(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    this._suppressClick = drag.moved;
    this._drag = null;
    this._panning = false;
    if (this._svg.hasPointerCapture(event.pointerId)) this._svg.releasePointerCapture(event.pointerId);
  }

  /** Pinch gestures and Ctrl/⌘ + wheel zoom; a plain wheel is left to the page so it can scroll. */
  private _onWheel(event: WheelEvent): void {
    if ((!event.ctrlKey && !event.metaKey) || this.isStatic) return;
    event.preventDefault();
    const bounds = this._svg.getBoundingClientRect();
    // d3-zoom's wheel scale: pixel, line, and page deltas, amplified for pinch (which reports ctrlKey and
    // small deltas); one event zooms at most 2x either way.
    const unit = event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002;
    const steps = Math.max(-1, Math.min(1, -event.deltaY * unit * (event.ctrlKey ? 10 : 1)));
    this._zoomAround(event.clientX - bounds.left, event.clientY - bounds.top, 2 ** steps);
  }

  private _onKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || this.isStatic) return;
    const pan: Record<string, [number, number]> = {
      ArrowLeft: [KEY_PAN, 0],
      ArrowRight: [-KEY_PAN, 0],
      ArrowUp: [0, KEY_PAN],
      ArrowDown: [0, -KEY_PAN],
    };
    if (event.key in pan) {
      const [dx, dy] = pan[event.key];
      this._view = { ...this._view, x: this._view.x + dx, y: this._view.y + dy };
    } else if (event.key === "+" || event.key === "=") {
      this.zoomBy(KEY_ZOOM);
    } else if (event.key === "-") {
      this.zoomBy(1 / KEY_ZOOM);
    } else if (event.key === "0") {
      this.fit();
    } else {
      return;
    }
    event.preventDefault();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dag-graph": DagGraph;
  }
}
