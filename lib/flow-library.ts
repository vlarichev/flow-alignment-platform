import { demo1FlowDocument, demo1NodePositions } from "./demo1Flow";
import { documentToPersisted } from "./flow-utils";
import type { FlowLibraryEntry, PersistedFlowState } from "./types";

export const FLOW_LIBRARY_KEY = "hannover-flow-library-v1";

/** Stable id for the built-in Demo 1 snapshot (sample operations / manufacturing flow). */
export const DEMO1_BASELINE_LIBRARY_ID = "seed_demo1_baseline";

const HIDE_DEMO1_BASELINE_KEY = "hannover-flow-library-hide-demo1";

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

/** User removed the baseline from the library; do not auto-inject it again. */
export function markDemo1BaselineDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HIDE_DEMO1_BASELINE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Ensures the canonical Demo 1 flow appears as the first library entry (once),
 * unless the user dismissed it. Call after hydration.
 * @returns true if the library was updated
 */
export function ensureDemo1BaselineInLibrary(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(HIDE_DEMO1_BASELINE_KEY) === "1") return false;
    const entries = readFlowLibrary();
    if (entries.some((e) => e.id === DEMO1_BASELINE_LIBRARY_ID)) {
      return false;
    }
    const textNodes = demo1FlowDocument.textNodes ?? [];
    const payload = documentToPersisted(
      demo1FlowDocument,
      demo1NodePositions(),
      textNodes,
    );
    const entry: FlowLibraryEntry = {
      id: DEMO1_BASELINE_LIBRARY_ID,
      name: "Sample: Hannover Messe operations (11 steps, baseline)",
      savedAt: new Date().toISOString(),
      payload,
    };
    writeFlowLibrary([entry, ...entries].slice(0, MAX_FLOW_LIBRARY_ENTRIES));
    return true;
  } catch {
    return false;
  }
}
