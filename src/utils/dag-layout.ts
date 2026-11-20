import { Graph, layout } from "@dagrejs/dagre";

/** Height of every node card, in pixels. */
export const DAG_NODE_HEIGHT = 24;
/** Space before a node's label: left padding, 14px icon, and gap. */
export const DAG_LABEL_OFFSET = 26;
/** Space before a node's label when it has no icon. */
export const DAG_LABEL_OFFSET_PLAIN = 8;
const LABEL_PADDING_END = 10;
/** Narrowest node card, in pixels. */
export const DAG_MIN_NODE_WIDTH = 48;
/** Widest node card, in pixels; longer labels are shortened with an ellipsis. */
export const DAG_MAX_NODE_WIDTH = 200;
/** Height of an edge label's box, in pixels. */
export const DAG_EDGE_LABEL_HEIGHT = 16;
/** Space on each side of an edge label's text, inside its box. */
export const DAG_EDGE_LABEL_PADDING = 4;
/** Widest edge label box, in pixels; longer labels are shortened with an ellipsis. */
export const DAG_MAX_EDGE_LABEL_WIDTH = 140;
const RANK_GAP = 90;
const NODE_GAP = 6;
const ELLIPSIS = "…";

/** Flow direction of the layers: left to right or top to bottom. */
export type DagDirection = "LR" | "TB";

/** Returns the rendered width of a label in pixels. */
export type MeasureText = (text: string) => number;

/** Width estimate used when the browser cannot measure text (no 2D canvas). */
export const approximateTextWidth: MeasureText = (text) => text.length * 6.2;

/** A point in layout coordinates. */
export interface DagPoint {
  x: number;
  y: number;
}

/** One node to lay out. */
export interface DagLayoutInput {
  id: string;
  label: string;
  /** Whether the node shows an icon before its label. */
  hasIcon: boolean;
}

/** A positioned node: centered at `(x, y)` and sized to its (possibly shortened) label. */
export interface DagLayoutNode extends DagPoint {
  id: string;
  width: number;
  label: string;
}

/** One edge to lay out; a `label` gets room of its own between the two nodes. */
export interface DagLayoutEdgeInput {
  source: string;
  target: string;
  label?: string;
}

/** A positioned edge label: its box is centered at `(x, y)` and sized to its (possibly shortened) text. */
export interface DagLayoutEdgeLabel extends DagPoint {
  text: string;
  width: number;
}

/** A routed edge; `backward` edges run against the flow direction and close a cycle. */
export interface DagLayoutEdge {
  source: string;
  target: string;
  points: DagPoint[];
  backward: boolean;
  /** Present when the input edge has a non-empty label. */
  label?: DagLayoutEdgeLabel;
}

/** Positioned nodes and routed edges, in input-independent order. */
export interface DagLayout {
  nodes: DagLayoutNode[];
  edges: DagLayoutEdge[];
}

/** Shortens `text` with an ellipsis until it fits `maxWidth`. */
export function fitLabel(text: string, maxWidth: number, measure: MeasureText): string {
  if (measure(text) <= maxWidth) return text;
  let end = text.length - 1;
  while (end > 1 && measure(text.slice(0, end) + ELLIPSIS) > maxWidth) end -= 1;
  return text.slice(0, end) + ELLIPSIS;
}

function nodeSize(node: DagLayoutInput, measure: MeasureText): { label: string; width: number } {
  const offset = node.hasIcon ? DAG_LABEL_OFFSET : DAG_LABEL_OFFSET_PLAIN;
  const label = fitLabel(node.label, DAG_MAX_NODE_WIDTH - offset - LABEL_PADDING_END, measure);
  const width = Math.ceil(offset + measure(label) + LABEL_PADDING_END);
  return { label, width: Math.min(DAG_MAX_NODE_WIDTH, Math.max(DAG_MIN_NODE_WIDTH, width)) };
}

function edgeLabelSize(text: string, measure: MeasureText): { text: string; width: number } {
  const fitted = fitLabel(text, DAG_MAX_EDGE_LABEL_WIDTH - 2 * DAG_EDGE_LABEL_PADDING, measure);
  return { text: fitted, width: Math.ceil(measure(fitted) + 2 * DAG_EDGE_LABEL_PADDING) };
}

/**
 * Lays out a directed graph in layers (Sugiyama-style, via dagre) so every edge points along `direction`.
 *
 * Cycles are broken only to assign layers: every edge is returned, and the ones that close a cycle are marked
 * `backward`. Edges whose endpoints are not both in `nodes`, self-edges, and duplicates are ignored (the last
 * duplicate wins). Labeled edges reserve room for their label midway along the edge. The result does not depend
 * on input order.
 */
export function layoutDag(
  nodes: DagLayoutInput[],
  edges: DagLayoutEdgeInput[],
  direction: DagDirection = "LR",
  measure: MeasureText = approximateTextWidth,
): DagLayout {
  if (nodes.length === 0) return { nodes: [], edges: [] };
  const graph = new Graph();
  graph.setGraph({
    rankdir: direction,
    ranksep: RANK_GAP,
    nodesep: NODE_GAP,
    edgesep: 4,
    marginx: 0,
    marginy: 0,
  });
  graph.setDefaultEdgeLabel(() => ({}));
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const sizes = new Map(sorted.map((node) => [node.id, nodeSize(node, measure)]));
  for (const node of sorted) {
    graph.setNode(node.id, { width: sizes.get(node.id)!.width, height: DAG_NODE_HEIGHT });
  }
  const known = new Set(sizes.keys());
  const unique = new Map(
    edges
      .filter((edge) => known.has(edge.source) && known.has(edge.target) && edge.source !== edge.target)
      .map((edge) => [`${edge.source}\u0000${edge.target}`, edge]),
  );
  const kept = [...unique.values()].sort(
    (a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target),
  );
  const labels = new Map(
    kept
      .filter((edge) => edge.label)
      .map((edge) => [edge, edgeLabelSize(edge.label!, measure)]),
  );
  for (const edge of kept) {
    const label = labels.get(edge);
    graph.setEdge(
      edge.source,
      edge.target,
      label ? { width: label.width, height: DAG_EDGE_LABEL_HEIGHT, labelpos: "c" } : {},
    );
  }
  layout(graph);
  const positioned = new Map(
    sorted.map((node) => {
      const { x, y } = graph.node(node.id) as DagPoint;
      return [node.id, { id: node.id, x, y, ...sizes.get(node.id)! }];
    }),
  );
  const axis = direction === "LR" ? "x" : "y";
  return {
    nodes: [...positioned.values()],
    edges: kept.map((edge) => {
      const routed = graph.edge(edge.source, edge.target) as { points: DagPoint[]; x?: number; y?: number };
      const label = labels.get(edge);
      return {
        source: edge.source,
        target: edge.target,
        points: routed.points.map(({ x, y }) => ({ x, y })),
        backward: positioned.get(edge.target)![axis] < positioned.get(edge.source)![axis],
        ...(label ? { label: { ...label, x: routed.x!, y: routed.y! } } : {}),
      };
    }),
  };
}
