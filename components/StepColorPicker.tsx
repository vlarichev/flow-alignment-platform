"use client";

import { cn } from "@/lib/utils";
import {
  STEP_COLOR_PRESETS,
  normalizeStepColor,
} from "@/lib/step-colors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_HELPER =
  "Use the same color on related steps to group them when walking through the demo.";

type Props = {
  value: string | null | undefined;
  onChange: (hex: string | null) => void;
  /** Tighter layout for flow overview cards */
  compact?: boolean;
  /** Defaults to "Group color" (steps). */
  label?: string;
  /** Extra description under the label. Pass `null` to hide. */
  helperText?: string | null;
};

export function StepColorPicker({
  value,
  onChange,
  compact,
  label = "Group color",
  helperText,
}: Props) {
  const normalized = normalizeStepColor(value);
  const pickerFallback = normalized ?? "#64748b";
  const helper =
    helperText === undefined
      ? !compact
        ? DEFAULT_HELPER
        : null
      : helperText;

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div>
        <Label className={cn(!compact && "text-sm")}>{label}</Label>
        {helper ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          title="Default (no color)"
          onClick={() => onChange(null)}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-[10px] text-muted-foreground transition hover:border-foreground/50",
            !normalized && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
        >
          ∅
        </button>
        {STEP_COLOR_PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            title={p.label}
            onClick={() => onChange(p.hex)}
            className={cn(
              "h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-sm transition dark:border-white/10",
              normalized === p.hex.toLowerCase() &&
                "ring-2 ring-ring ring-offset-2 ring-offset-background",
            )}
            style={{ backgroundColor: p.hex }}
          />
        ))}
        <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-input shadow-sm">
          <span className="sr-only">Custom color</span>
          <input
            type="color"
            className="absolute inset-0 h-[200%] w-[200%] min-w-0 cursor-pointer -translate-x-1/4 -translate-y-1/4 p-0"
            value={pickerFallback}
            onChange={(e) => onChange(normalizeStepColor(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <Input
          key={normalized ?? "none"}
          className="font-mono text-xs"
          placeholder="#3b82f6"
          defaultValue={normalized ?? ""}
          onBlur={(e) => {
            const n = normalizeStepColor(e.target.value);
            onChange(n);
          }}
        />
        {normalized ? (
          <span
            className="h-6 w-10 shrink-0 rounded border"
            style={{ backgroundColor: normalized }}
          />
        ) : null}
      </div>
    </div>
  );
}
