import { normalizeStepColor } from "./step-colors";
import { isDialogueLineKind } from "./dialogue-line";
import type {
  Connection,
  DialogueLine,
  FlowDocument,
  FlowTextNode,
  IncomingConnection,
  PersistedFlowState,
  Step,
} from "./types";

export function stepIds(steps: Step[]): Set<string> {
  return new Set(steps.map((s) => s.id));
}

export function filterValidConnections(
  connections: IncomingConnection[],
  stepIdSet: Set<string>,
): IncomingConnection[] {
  return connections.filter(
    (c) => stepIdSet.has(c.from) && stepIdSet.has(c.to),
  );
}

export function outgoingConnections(
  connections: IncomingConnection[],
  fromId: string,
): IncomingConnection[] {
  return connections.filter((c) => c.from === fromId);
}

export function documentToPersisted(
  doc: FlowDocument,
  nodePositions: Record<string, { x: number; y: number }>,
  textNodes: FlowTextNode[],
): PersistedFlowState {
  return {
    flowMetadata: doc.flowMetadata,
    steps: doc.steps,
    connections: doc.connections,
    nodePositions,
    textNodes,
  };
}

export function persistedToDocument(
  state: PersistedFlowState,
): FlowDocument {
  return {
    flowMetadata: state.flowMetadata,
    steps: state.steps,
    connections: state.connections,
    textNodes: state.textNodes?.length ? state.textNodes : undefined,
  };
}

export function parseFlowJson(raw: string): FlowDocument {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid JSON: expected object");
  }
  const obj = parsed as Record<string, unknown>;
  if (!obj.flowMetadata || !Array.isArray(obj.steps) || !Array.isArray(obj.connections)) {
    throw new Error("Invalid flow document: missing flowMetadata, steps, or connections");
  }
  return normalizeFlowDocument(
    parsed as Omit<FlowDocument, "connections"> & {
      connections: IncomingConnection[];
    },
  );
}

/** Ensures connection ids and drops invalid edges. */
export function normalizeFlowDocument(
  doc: Omit<FlowDocument, "connections"> & {
    connections: IncomingConnection[];
  },
): FlowDocument {
  const ids = stepIds(doc.steps);
  const filtered = filterValidConnections(doc.connections, ids);
  const connections: Connection[] = filtered.map((c, idx) => ({
    id:
      c.id && String(c.id).length > 0
        ? c.id
        : `conn_${idx}_${c.from}_${c.to}`,
    from: c.from,
    to: c.to,
    type: c.type,
    condition: c.condition,
  }));
  const steps: Step[] = doc.steps.map((s) => normalizeStepColors(s));
  const textNodes = normalizeTextNodes(doc.textNodes);
  return {
    flowMetadata: doc.flowMetadata,
    steps,
    connections,
    textNodes,
  };
}

function normalizeTextNodes(raw: unknown): FlowTextNode[] {
  if (!Array.isArray(raw)) return [];
  const out: FlowTextNode[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : null;
    const text = typeof o.text === "string" ? o.text : "";
    const x = typeof o.x === "number" && Number.isFinite(o.x) ? o.x : 0;
    const y = typeof o.y === "number" && Number.isFinite(o.y) ? o.y : 0;
    const width =
      typeof o.width === "number" && Number.isFinite(o.width) && o.width > 0
        ? o.width
        : 280;
    const height =
      typeof o.height === "number" && Number.isFinite(o.height) && o.height > 0
        ? o.height
        : 120;
    if (!id || !id.length) continue;
    out.push({ id, text, x, y, width, height });
  }
  return out;
}

function normalizeDialogueSequence(raw: unknown): DialogueLine[] {
  if (!Array.isArray(raw)) return [];
  const out: DialogueLine[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const id =
      typeof o.id === "string" && o.id.length > 0
        ? o.id
        : `dlg_${Math.random().toString(36).slice(2, 11)}`;
    const kind = isDialogueLineKind(o.kind) ? o.kind : "system";
    const text = typeof o.text === "string" ? o.text : "";
    out.push({ id, kind, text });
  }
  return out;
}

function normalizeStepColors(s: Step): Step {
  const c = normalizeStepColor(s.color ?? null);
  const dialogueSequence = normalizeDialogueSequence(s.dialogueSequence);
  return {
    ...s,
    color: c ?? undefined,
    dialogueSequence,
  };
}

export function generateStepId(steps: Step[]): string {
  let n = steps.length + 1;
  let id = `step_${n}`;
  const existing = new Set(steps.map((s) => s.id));
  while (existing.has(id)) {
    n += 1;
    id = `step_${n}`;
  }
  return id;
}

/**
 * Keeps existing node positions for step ids that still exist and assigns
 * default positions for new steps so bulk JSON/table edits do not reset the canvas.
 */
export function mergeNodePositions(
  previous: Record<string, { x: number; y: number }>,
  newSteps: Step[],
): Record<string, { x: number; y: number }> {
  const next: Record<string, { x: number; y: number }> = {};
  const ids = new Set(newSteps.map((s) => s.id));
  for (const id of Object.keys(previous)) {
    if (ids.has(id)) {
      next[id] = previous[id]!;
    }
  }
  let i = 0;
  for (const s of newSteps) {
    if (!next[s.id]) {
      next[s.id] = {
        x: 120 + (i % 4) * 48,
        y: 120 + Math.floor(i / 4) * 160,
      };
    }
    i += 1;
  }
  return next;
}

export function generateConnectionId(
  connections: Connection[],
  from: string,
  to: string,
): string {
  const base = `${from}->${to}`;
  const existing = new Set(connections.map((c) => c.id));
  let id = base;
  let i = 0;
  while (existing.has(id)) {
    i += 1;
    id = `${base}#${i}`;
  }
  return id;
}
