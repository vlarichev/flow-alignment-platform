/** Preset palette for quick grouping (hex). */
export const STEP_COLOR_PRESETS: { label: string; hex: string }[] = [
  { label: "Slate", hex: "#64748b" },
  { label: "Blue", hex: "#3b82f6" },
  { label: "Cyan", hex: "#06b6d4" },
  { label: "Emerald", hex: "#10b981" },
  { label: "Amber", hex: "#f59e0b" },
  { label: "Orange", hex: "#ea580c" },
  { label: "Rose", hex: "#f43f5e" },
  { label: "Violet", hex: "#8b5cf6" },
];

const FULL_HEX = /^#([0-9a-f]{6})$/i;
const SHORT_HEX = /^#([0-9a-f]{3})$/i;

/** Returns normalized #rrggbb or null if invalid / empty. */
export function normalizeStepColor(
  raw: string | null | undefined,
): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (FULL_HEX.test(t)) return t.toLowerCase();
  const m = t.match(SHORT_HEX);
  if (m) {
    const [r, g, b] = m[1]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = normalizeStepColor(hex);
  if (!n) return `rgba(0,0,0,${alpha})`;
  const r = Number.parseInt(n.slice(1, 3), 16);
  const g = Number.parseInt(n.slice(3, 5), 16);
  const b = Number.parseInt(n.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
