export type FlowMode = "linear" | "branching";

export interface FlowMetadata {
  name: string;
  version: string;
  mode: FlowMode;
  description: string;
}

export type ApiCallType = "REST" | "OPC-UA" | "MQTT";

export interface ApiCall {
  id: string;
  type: ApiCallType;
  endpoint?: string;
  topic?: string;
  action: string;
  mockResponse: string;
}

export interface Substep {
  id: string;
  videoId: string;
  description: string;
}

export interface StepInputData {
  fakeData: Record<string, string | number | boolean>;
}

/** Role of one line in the in-step dialogue / sequence mockup. */
export type DialogueLineKind = "user" | "trigger" | "system" | "action";

export interface DialogueLine {
  id: string;
  kind: DialogueLineKind;
  text: string;
}

export interface Step {
  id: string;
  name: string;
  /** Owning product or system (e.g. ERP, NX, A4M) for labeling and alignment. */
  systemName?: string;
  order: number;
  systemPrompt: string;
  inputData: StepInputData;
  videoId: string;
  videoUrl: string;
  apiCalls: ApiCall[];
  /** Ordered mock dialogue (user / trigger / system / action) for this step. */
  dialogueSequence?: DialogueLine[];
  substeps?: Substep[];
  /** Optional hex color (e.g. #3b82f6) for visual grouping on the canvas. */
  color?: string | null;
}

export type ConnectionType = "linear" | "conditional" | "loop";

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  condition: string | null;
}

/** Parsed from JSON before ids are normalized. */
export type IncomingConnection = Omit<Connection, "id"> & { id?: string };

/** Free-form note on the canvas (not a simulation step). */
export interface FlowTextNode {
  id: string;
  text: string;
  x: number;
  y: number;
  /** Pixel size on the canvas (resize with corner/edge handles). */
  width?: number;
  height?: number;
  /** Optional hex color for border accent / grouping (same presets as steps). */
  color?: string | null;
  /** Body text size in pixels (default 16 when omitted). */
  fontSize?: number;
}

export interface FlowDocument {
  flowMetadata: FlowMetadata;
  steps: Step[];
  connections: Connection[];
  textNodes?: FlowTextNode[];
}

export interface PersistedFlowState {
  flowMetadata: FlowMetadata;
  steps: Step[];
  connections: Connection[];
  nodePositions: Record<string, { x: number; y: number }>;
  textNodes?: FlowTextNode[];
}

/** Named snapshot stored in the browser flow library (versions / backups). */
export interface FlowLibraryEntry {
  id: string;
  name: string;
  savedAt: string;
  payload: PersistedFlowState;
}
