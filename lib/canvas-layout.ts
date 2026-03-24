import type { FlowTextNode, Step } from "./types";

/** Typical step width for horizontal layout spacing (cards use min/max width in CSS). */
export const STEP_NODE_WIDTH = 320;
/** Legacy reference height for note row offset; step nodes size to content in React Flow. */
export const STEP_NODE_HEIGHT = 520;

/** Gap between adjacent node boxes (no overlap). */
export const HORIZONTAL_LAYOUT_GAP = 80;

export const HORIZONTAL_LAYOUT_ORIGIN = { x: 80, y: 120 } as const;

/** Second row for flow-text notes (below the step strip). */
export const FLOW_TEXT_ROW_OFFSET_Y = 560;

const DEFAULT_TEXT_W = 280;

/**
 * Places steps in one horizontal row by `order`, then flow-text nodes on a row below,
 * with a fixed gap between each node’s bounding width.
 */
export function computeHorizontalCleanupLayout(
  steps: Step[],
  textNodes: FlowTextNode[],
): {
  nodePositions: Record<string, { x: number; y: number }>;
  textNodes: FlowTextNode[];
} {
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const { x: ox, y: oy } = HORIZONTAL_LAYOUT_ORIGIN;
  const stride = STEP_NODE_WIDTH + HORIZONTAL_LAYOUT_GAP;

  sortedSteps.forEach((st, i) => {
    nodePositions[st.id] = { x: ox + i * stride, y: oy };
  });

  let textX = ox;
  const textY = oy + FLOW_TEXT_ROW_OFFSET_Y;
  const nextTextNodes = textNodes.map((tn) => {
    const w = tn.width ?? DEFAULT_TEXT_W;
    const next = { ...tn, x: textX, y: textY };
    textX += w + HORIZONTAL_LAYOUT_GAP;
    return next;
  });

  return { nodePositions, textNodes: nextTextNodes };
}
