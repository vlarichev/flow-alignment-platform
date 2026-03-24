import type { FlowLibraryEntry, PersistedFlowState } from "./types";

export const FLOW_LIBRARY_KEY = "hannover-flow-library-v1";

export const MAX_FLOW_LIBRARY_ENTRIES = 50;

function isPersistedState(x: unknown): x is PersistedFlowState {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.flowMetadata === "object" &&
    o.flowMetadata !== null &&
    Array.isArray(o.steps) &&
    Array.isArray(o.connections) &&
    typeof o.nodePositions === "object" &&
    o.nodePositions !== null
  );
}

function isValidEntry(x: unknown): x is FlowLibraryEntry {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.name === "string" &&
    typeof o.savedAt === "string" &&
    isPersistedState(o.payload)
  );
}

export function readFlowLibrary(): FlowLibraryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FLOW_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

export function writeFlowLibrary(entries: FlowLibraryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = entries.slice(0, MAX_FLOW_LIBRARY_ENTRIES);
    localStorage.setItem(FLOW_LIBRARY_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}
