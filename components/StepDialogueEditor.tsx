"use client";

import { Plus } from "lucide-react";

import { DialogueKindIcon } from "@/components/DialogueKindIcon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyDialogueLine,
  DIALOGUE_KIND_OPTIONS,
} from "@/lib/dialogue-line";
import type { DialogueLine, DialogueLineKind } from "@/lib/types";

type Props = {
  lines: DialogueLine[];
  onChange: (next: DialogueLine[]) => void;
};

export function StepDialogueEditor({ lines, onChange }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <Label>Dialogue sequence</Label>
          <p className="text-xs text-muted-foreground">
            Mock user ↔ system flow and actions for this step.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2"
          onClick={() => onChange([...lines, createEmptyDialogueLine()])}
        >
          <Plus className="h-4 w-4" />
          Add line
        </Button>
      </div>
      <div className="space-y-2">
        {lines.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No lines yet. Add a line and pick User, Trigger, System, or
            Action.
          </p>
        ) : null}
        {lines.map((line, idx) => (
          <div
            key={line.id}
            className="rounded-md border border-border/80 bg-muted/20 p-2"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <DialogueKindIcon
                  kind={line.kind}
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <select
                  className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                  value={line.kind}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = {
                      ...line,
                      kind: e.target.value as DialogueLineKind,
                    };
                    onChange(next);
                  }}
                  aria-label={`Line ${idx + 1} role`}
                >
                  {DIALOGUE_KIND_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2 text-destructive"
                onClick={() => onChange(lines.filter((_, i) => i !== idx))}
              >
                Remove
              </Button>
            </div>
            <Textarea
              value={line.text}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, text: e.target.value };
                onChange(next);
              }}
              rows={2}
              placeholder="Message or action description…"
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
