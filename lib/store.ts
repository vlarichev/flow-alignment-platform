"use client";

import { create } from "zustand";

import { defaultFlow, defaultNodePositions } from "./defaultFlow";
import {
  generateConnectionId,
  generateStepId,
  normalizeFlowDocument,
  persistedToDocument,
} from "./flow-utils";
import { computeHorizontalCleanupLayout } from "./canvas-layout";
import {
  MAX_FLOW_LIBRARY_ENTRIES,
  readFlowLibrary,
  writeFlowLibrary,
} from "./flow-library";
import type {
  ApiCall,
  Connection,
  ConnectionType,
  FlowDocument,
  FlowLibraryEntry,
  FlowMetadata,
  FlowTextNode,
  PersistedFlowState,
  Step,
} from "./types";

/** Which nodes appear selected on the canvas (React Flow). Drives `selectedStepId` / `selectedTextNodeId` when exactly one node is selected. */
function derivePrimarySelection(
  selectedNodeIds: string[],
  steps: Step[],
  textNodes: FlowTextNode[],
): { selectedStepId: string | null; selectedTextNodeId: string | null } {
  const stepIdSet = new Set(steps.map((s) => s.id));
  const textIdSet = new Set(textNodes.map((t) => t.id));
  const selSteps = selectedNodeIds.filter((id) => stepIdSet.has(id));
  const selTexts = selectedNodeIds.filter((id) => textIdSet.has(id));
  if (selSteps.length === 1 && selTexts.length === 0) {
    return { selectedStepId: selSteps[0]!, selectedTextNodeId: null };
  }
  if (selTexts.length === 1 && selSteps.length === 0) {
    return { selectedStepId: null, selectedTextNodeId: selTexts[0]! };
  }
  return { selectedStepId: null, selectedTextNodeId: null };
}

const STORAGE_KEY = "hannover-flow-v1";

const MAX_UNDO_STACK = 5;

function clonePersisted(get: () => FlowStore): PersistedFlowState {
  const s = get();
  return structuredClone({
    flowMetadata: s.flowMetadata,
    steps: s.steps,
    connections: s.connections,
    nodePositions: s.nodePositions,
    textNodes: s.textNodes,
  });
}

export type ConnectionModeState =
  | { status: "idle" }
  | { status: "pickSource" }
  | { status: "pickTarget"; fromId: string };

export interface PendingConnection {
  fromId: string;
  toId: string;
}

export interface SimulatorState {
  isOpen: boolean;
  started: boolean;
  currentStepId: string | null;
  /** Last edge taken (for display) */
  lastConnection: Connection | null;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(get: () => FlowStore) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const s = get();
      const payload: PersistedFlowState = {
        flowMetadata: s.flowMetadata,
        steps: s.steps,
        connections: s.connections,
        nodePositions: s.nodePositions,
        textNodes: s.textNodes,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, 300);
}

function loadFromStorage(): PersistedFlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFlowState;
    if (!parsed.steps || !parsed.connections || !parsed.flowMetadata) return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface FlowStore {
  flowMetadata: FlowMetadata;
  steps: Step[];
  connections: Connection[];
  nodePositions: Record<string, { x: number; y: number }>;
  textNodes: FlowTextNode[];

  /** Canvas selection (supports Shift+click multi-select). */
  selectedNodeIds: string[];
  selectedStepId: string | null;
  selectedEdgeId: string | null;
  selectedTextNodeId: string | null;
  connectionMode: ConnectionModeState;
  pendingConnection: PendingConnection | null;
  connectionDialogOpen: boolean;

  simulator: SimulatorState;

  hydrateFromStorage: () => void;
  setFlowMetadata: (patch: Partial<FlowMetadata>) => void;

  addStep: () => void;
  updateStep: (id: string, patch: Partial<Step>) => void;
  deleteStep: (id: string) => void;
  setNodePosition: (id: string, pos: { x: number; y: number }) => void;

  addTextNode: () => void;
  updateTextNode: (
    id: string,
    patch: Partial<
      Pick<FlowTextNode, "text" | "x" | "y" | "width" | "height" | "color">
    >,
    /** Set true for resize/drag intermediate updates (undo pushed once at start). */
    skipUndo?: boolean,
  ) => void;
  deleteTextNode: (id: string) => void;
  setSelectedTextNodeId: (id: string | null) => void;

  setConnectionMode: (mode: ConnectionModeState) => void;
  beginAddConnection: () => void;
  cancelAddConnection: () => void;
  selectNodeForConnection: (stepId: string) => void;
  confirmNewConnection: (
    type: ConnectionType,
    condition: string | null,
  ) => void;
  deleteConnection: (id: string) => void;
  updateConnection: (id: string, patch: Partial<Connection>) => void;

  setSelectedStepId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  /** Merge React Flow `select` changes into `selectedNodeIds` and derived panel targets. */
  applyNodeSelectChanges: (
    changes: ReadonlyArray<{ type: "select"; id: string; selected: boolean }>,
  ) => void;
  clearCanvasSelection: () => void;

  loadDocument: (
    doc: FlowDocument,
    positions?: Record<string, { x: number; y: number }>,
    textNodes?: FlowTextNode[],
  ) => void;
  newFlow: (name: string) => void;
  saveToBrowser: () => void;
  exportJson: () => string;
  clearAll: () => void;
  /** Place steps in one horizontal row by order; flow-text notes on a second row. */
  cleanupHorizontalLayout: () => void;

  /** Bumps when the browser flow library list changes (for UI refresh). */
  flowLibraryRevision: number;
  saveCurrentToLibrary: (name: string) => void;
  loadFromLibrary: (id: string) => void;
  removeLibraryEntry: (id: string) => void;

  openSimulator: () => void;
  closeSimulator: () => void;
  setSimulatorStartStep: (stepId: string | null) => void;
  simulatorPlay: () => void;
  simulatorReset: () => void;
  simulatorNext: (connection: Connection) => void;

  /** In-memory undo (last 5 flow snapshots); cleared on load/import/new flow. */
  undoStack: PersistedFlowState[];
  pushUndoSnapshot: () => void;
  undo: () => void;
}

function initialSimulator(): SimulatorState {
  return {
    isOpen: false,
    started: false,
    currentStepId: null,
    lastConnection: null,
  };
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  flowMetadata: defaultFlow.flowMetadata,
  steps: defaultFlow.steps,
  connections: defaultFlow.connections,
  nodePositions: defaultNodePositions(),
  textNodes: [],

  selectedNodeIds: [],
  selectedStepId: null,
  selectedEdgeId: null,
  selectedTextNodeId: null,
  connectionMode: { status: "idle" },
  pendingConnection: null,
  connectionDialogOpen: false,

  simulator: initialSimulator(),

  flowLibraryRevision: 0,

  undoStack: [],

  pushUndoSnapshot: () => {
    const snap = clonePersisted(get);
    set((state) => ({
      undoStack: [...state.undoStack, snap].slice(-MAX_UNDO_STACK),
    }));
  },

  undo: () => {
    const stack = get().undoStack;
    if (stack.length === 0) return;
    const nextStack = stack.slice(0, -1);
    const toRestore = stack[stack.length - 1]!;
    set({
      undoStack: nextStack,
      flowMetadata: toRestore.flowMetadata,
      steps: toRestore.steps,
      connections: toRestore.connections,
      nodePositions: toRestore.nodePositions ?? defaultNodePositions(),
      textNodes: toRestore.textNodes ?? [],
      selectedNodeIds: [],
      selectedStepId: null,
      selectedEdgeId: null,
      selectedTextNodeId: null,
      connectionMode: { status: "idle" },
      pendingConnection: null,
      connectionDialogOpen: false,
      simulator: initialSimulator(),
    });
    schedulePersist(get);
  },

  hydrateFromStorage: () => {
    const loaded = loadFromStorage();
    if (loaded) {
      get().loadDocument(
        persistedToDocument(loaded),
        loaded.nodePositions ?? defaultNodePositions(),
        loaded.textNodes,
      );
    }
  },

  setFlowMetadata: (patch) => {
    get().pushUndoSnapshot();
    set((s) => ({
      flowMetadata: { ...s.flowMetadata, ...patch },
    }));
    schedulePersist(get);
  },

  addStep: () => {
    get().pushUndoSnapshot();
    const s = get();
    const id = generateStepId(s.steps);
    const order =
      s.steps.length === 0
        ? 1
        : Math.max(...s.steps.map((x) => x.order)) + 1;
    const newStep: Step = {
      id,
      name: `Step ${order}`,
      systemName: undefined,
      order,
      systemPrompt: "",
      inputData: { fakeData: {} },
      videoId: "",
      videoUrl: "",
      apiCalls: [],
      dialogueSequence: [],
    };
    const x = 80 + s.steps.length * 400;
    const y = 120;
    set({
      steps: [...s.steps, newStep],
      nodePositions: { ...s.nodePositions, [id]: { x, y } },
      selectedNodeIds: [id],
      selectedStepId: id,
      selectedEdgeId: null,
      selectedTextNodeId: null,
    });
    schedulePersist(get);
  },

  updateStep: (id, patch) => {
    get().pushUndoSnapshot();
    set((state) => ({
      steps: state.steps.map((st) =>
        st.id === id ? { ...st, ...patch } : st,
      ),
    }));
    schedulePersist(get);
  },

  deleteStep: (id) => {
    get().pushUndoSnapshot();
    set((state) => {
      const steps = state.steps.filter((st) => st.id !== id);
      const connections = state.connections.filter(
        (c) => c.from !== id && c.to !== id,
      );
      const nodePositions = { ...state.nodePositions };
      delete nodePositions[id];
      const selectedNodeIds = state.selectedNodeIds.filter((x) => x !== id);
      const primaries = derivePrimarySelection(
        selectedNodeIds,
        steps,
        state.textNodes,
      );
      return {
        steps,
        connections,
        nodePositions,
        selectedNodeIds,
        ...primaries,
        selectedEdgeId: null,
        connectionMode: { status: "idle" },
        pendingConnection: null,
        connectionDialogOpen: false,
      };
    });
    schedulePersist(get);
  },

  setNodePosition: (id, pos) => {
    set((state) => {
      if (state.textNodes.some((t) => t.id === id)) {
        return {
          textNodes: state.textNodes.map((t) =>
            t.id === id ? { ...t, x: pos.x, y: pos.y } : t,
          ),
        };
      }
      return {
        nodePositions: { ...state.nodePositions, [id]: pos },
      };
    });
    schedulePersist(get);
  },

  addTextNode: () => {
    get().pushUndoSnapshot();
    const s = get();
    const id = `text_${Math.random().toString(36).slice(2, 11)}`;
    const x = 180 + (s.textNodes.length % 4) * 24;
    const y = 100 + (s.textNodes.length % 4) * 40;
    const note: FlowTextNode = {
      id,
      text: "Explain this part of the flow…",
      x,
      y,
      width: 280,
      height: 120,
      color: null,
    };
    set({
      textNodes: [...s.textNodes, note],
      selectedNodeIds: [id],
      selectedTextNodeId: id,
      selectedStepId: null,
      selectedEdgeId: null,
    });
    schedulePersist(get);
  },

  updateTextNode: (id, patch, skipUndo) => {
    if (!skipUndo) get().pushUndoSnapshot();
    set((state) => ({
      textNodes: state.textNodes.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    }));
    schedulePersist(get);
  },

  deleteTextNode: (id) => {
    get().pushUndoSnapshot();
    set((state) => {
      const textNodes = state.textNodes.filter((t) => t.id !== id);
      const selectedNodeIds = state.selectedNodeIds.filter((x) => x !== id);
      const primaries = derivePrimarySelection(
        selectedNodeIds,
        state.steps,
        textNodes,
      );
      return {
        textNodes,
        selectedNodeIds,
        ...primaries,
      };
    });
    schedulePersist(get);
  },

  setSelectedTextNodeId: (id) =>
    set({
      selectedTextNodeId: id,
      selectedNodeIds: id ? [id] : [],
      selectedStepId: id ? null : get().selectedStepId,
      selectedEdgeId: id ? null : get().selectedEdgeId,
    }),

  setConnectionMode: (mode) => set({ connectionMode: mode }),

  beginAddConnection: () => {
    set({
      connectionMode: { status: "pickSource" },
      selectedNodeIds: [],
      selectedStepId: null,
      selectedEdgeId: null,
      selectedTextNodeId: null,
    });
  },

  cancelAddConnection: () => {
    set({
      connectionMode: { status: "idle" },
      pendingConnection: null,
      connectionDialogOpen: false,
    });
  },

  selectNodeForConnection: (stepId) => {
    const { connectionMode } = get();
    if (connectionMode.status === "pickSource") {
      set({
        connectionMode: { status: "pickTarget", fromId: stepId },
      });
      return;
    }
    if (connectionMode.status === "pickTarget") {
      const fromId = connectionMode.fromId;
      if (stepId === fromId) return;
      const dup = get().connections.some(
        (c) => c.from === fromId && c.to === stepId,
      );
      if (dup) {
        set({ connectionMode: { status: "idle" } });
        return;
      }
      set({
        pendingConnection: { fromId, toId: stepId },
        connectionDialogOpen: true,
        connectionMode: { status: "idle" },
      });
    }
  },

  confirmNewConnection: (type, condition) => {
    const pending = get().pendingConnection;
    if (!pending) return;
    get().pushUndoSnapshot();
    const conns = get().connections;
    const id = generateConnectionId(conns, pending.fromId, pending.toId);
    const conn: Connection = {
      id,
      from: pending.fromId,
      to: pending.toId,
      type,
      condition:
        type === "conditional" ? (condition ?? "") : null,
    };
    set((state) => ({
      connections: [...state.connections, conn],
      pendingConnection: null,
      connectionDialogOpen: false,
      selectedEdgeId: id,
      selectedNodeIds: [],
      selectedStepId: null,
      selectedTextNodeId: null,
    }));
    schedulePersist(get);
  },

  deleteConnection: (id) => {
    get().pushUndoSnapshot();
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }));
    schedulePersist(get);
  },

  updateConnection: (id, patch) => {
    get().pushUndoSnapshot();
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
    schedulePersist(get);
  },

  setSelectedStepId: (id) =>
    set({
      selectedStepId: id,
      selectedNodeIds: id ? [id] : [],
      selectedEdgeId: id ? null : get().selectedEdgeId,
      selectedTextNodeId: id ? null : get().selectedTextNodeId,
    }),

  setSelectedEdgeId: (id) =>
    set({
      selectedEdgeId: id,
      selectedNodeIds: id ? [] : get().selectedNodeIds,
      selectedStepId: id ? null : get().selectedStepId,
      selectedTextNodeId: id ? null : get().selectedTextNodeId,
    }),

  applyNodeSelectChanges: (changes) => {
    if (changes.length === 0) return;
    set((state) => {
      const ids = new Set(state.selectedNodeIds);
      for (const ch of changes) {
        if (ch.selected) ids.add(ch.id);
        else ids.delete(ch.id);
      }
      const selectedNodeIds = [...ids];
      const primaries = derivePrimarySelection(
        selectedNodeIds,
        state.steps,
        state.textNodes,
      );
      return {
        selectedNodeIds,
        ...primaries,
        selectedEdgeId: null,
      };
    });
  },

  clearCanvasSelection: () =>
    set({
      selectedNodeIds: [],
      selectedStepId: null,
      selectedTextNodeId: null,
      selectedEdgeId: null,
    }),

  loadDocument: (doc, positions, textNodesFromPersist) => {
    const normalized = normalizeFlowDocument(doc);
    const textNodes =
      textNodesFromPersist !== undefined
        ? textNodesFromPersist
        : (normalized.textNodes ?? []);
    set({
      undoStack: [],
      flowMetadata: normalized.flowMetadata,
      steps: normalized.steps,
      connections: normalized.connections,
      nodePositions: positions ?? defaultNodePositions(),
      textNodes,
      selectedNodeIds: [],
      selectedStepId: null,
      selectedEdgeId: null,
      selectedTextNodeId: null,
      connectionMode: { status: "idle" },
      pendingConnection: null,
      connectionDialogOpen: false,
      simulator: initialSimulator(),
    });
    schedulePersist(get);
  },

  newFlow: (name) => {
    const doc = structuredClone(defaultFlow);
    doc.flowMetadata.name = name;
    get().loadDocument(doc, defaultNodePositions());
  },

  saveToBrowser: () => {
    const s = get();
    const payload: PersistedFlowState = {
      flowMetadata: s.flowMetadata,
      steps: s.steps,
      connections: s.connections,
      nodePositions: s.nodePositions,
      textNodes: s.textNodes,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  },

  exportJson: () => {
    const s = get();
    const doc = persistedToDocument({
      flowMetadata: s.flowMetadata,
      steps: s.steps,
      connections: s.connections,
      nodePositions: s.nodePositions,
      textNodes: s.textNodes,
    });
    return JSON.stringify(doc, null, 2);
  },

  clearAll: () => {
    get().loadDocument(structuredClone(defaultFlow), defaultNodePositions());
  },

  cleanupHorizontalLayout: () => {
    get().pushUndoSnapshot();
    set((state) => {
      const { nodePositions, textNodes } = computeHorizontalCleanupLayout(
        state.steps,
        state.textNodes,
      );
      return { nodePositions, textNodes };
    });
    schedulePersist(get);
  },

  saveCurrentToLibrary: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const s = get();
    const payload: PersistedFlowState = {
      flowMetadata: s.flowMetadata,
      steps: s.steps,
      connections: s.connections,
      nodePositions: s.nodePositions,
      textNodes: s.textNodes,
    };
    const entry: FlowLibraryEntry = {
      id: `lib_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: trimmed,
      savedAt: new Date().toISOString(),
      payload,
    };
    const next = [entry, ...readFlowLibrary()].slice(
      0,
      MAX_FLOW_LIBRARY_ENTRIES,
    );
    writeFlowLibrary(next);
    set((state) => ({
      flowLibraryRevision: state.flowLibraryRevision + 1,
    }));
  },

  loadFromLibrary: (id) => {
    const entries = readFlowLibrary();
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const doc = persistedToDocument(entry.payload);
    get().loadDocument(
      doc,
      entry.payload.nodePositions,
      entry.payload.textNodes,
    );
  },

  removeLibraryEntry: (id) => {
    const next = readFlowLibrary().filter((e) => e.id !== id);
    writeFlowLibrary(next);
    set((state) => ({
      flowLibraryRevision: state.flowLibraryRevision + 1,
    }));
  },

  openSimulator: () => {
    const s = get();
    const first = s.steps[0]?.id ?? null;
    set({
      simulator: {
        ...s.simulator,
        isOpen: true,
        started: false,
        currentStepId: first,
        lastConnection: null,
      },
    });
  },

  closeSimulator: () => {
    set(() => ({
      simulator: { ...initialSimulator(), isOpen: false },
    }));
  },

  setSimulatorStartStep: (stepId) => {
    set((state) => ({
      simulator: {
        ...state.simulator,
        currentStepId: stepId,
        started: false,
        lastConnection: null,
      },
    }));
  },

  simulatorPlay: () => {
    const s = get();
    const id = s.simulator.currentStepId ?? s.steps[0]?.id ?? null;
    set({
      simulator: {
        ...s.simulator,
        started: true,
        currentStepId: id,
        lastConnection: null,
      },
    });
  },

  simulatorReset: () => {
    const s = get();
    const id = s.simulator.currentStepId ?? s.steps[0]?.id ?? null;
    set({
      simulator: {
        ...s.simulator,
        started: false,
        currentStepId: id,
        lastConnection: null,
      },
    });
  },

  simulatorNext: (connection) => {
    set((state) => ({
      simulator: {
        ...state.simulator,
        currentStepId: connection.to,
        lastConnection: connection,
      },
    }));
  },
}));

export function createEmptyApiCall(): ApiCall {
  return {
    id: `api_${Math.random().toString(36).slice(2, 10)}`,
    type: "REST",
    endpoint: "",
    action: "",
    mockResponse: "",
  };
}

export { STORAGE_KEY, loadFromStorage };
