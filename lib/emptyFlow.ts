import type { FlowDocument } from "./types";

/** Default document for new sessions and after Clear all — no steps until the user adds them. */
export const emptyFlowDocument: FlowDocument = {
  flowMetadata: {
    name: "Untitled workflow",
    version: "v1.0",
    mode: "linear",
    description: "",
  },
  steps: [],
  connections: [],
  textNodes: [],
};

export function emptyNodePositions(): Record<string, { x: number; y: number }> {
  return {};
}
