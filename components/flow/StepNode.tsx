"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { hexToRgba, normalizeStepColor } from "@/lib/step-colors";
import { DialogueKindIcon } from "@/components/DialogueKindIcon";
import { useFlowStore } from "@/lib/store";
import type { ApiCall } from "@/lib/types";

export type StepNodeData = {
  stepId: string;
  name: string;
  videoId: string;
  apiCount: number;
  color?: string | null;
};

function summarizeApiCalls(calls: ApiCall[]): string {
  if (calls.length === 0) return "—";
  if (calls.length === 1) {
    const c = calls[0];
    const bit = c.action?.trim() || c.endpoint || c.topic || c.type;
    return `${c.type}: ${bit.length > 72 ? `${bit.slice(0, 72)}…` : bit}`;
  }
  return calls
    .map((c) => {
      const bit = c.action?.trim() || c.endpoint || c.topic || "";
      const short = bit.length > 36 ? `${bit.slice(0, 36)}…` : bit;
      return `${c.type}${short ? ` — ${short}` : ""}`;
    })
    .join("\n");
}

export function StepNode(props: NodeProps) {
  const { data: raw, selected } = props;
  const data = raw as StepNodeData;
  const step = useFlowStore((s) =>
    s.steps.find((st) => st.id === data.stepId),
  );
  const mode = useFlowStore((s) => s.connectionMode);
  const connectHighlight =
    mode.status === "pickSource" || mode.status === "pickTarget";

  const name = step?.name ?? data.name;
  const videoId = step?.videoId ?? data.videoId;
  const accent = normalizeStepColor(step?.color ?? data.color ?? null);

  const systemPrompt = step?.systemPrompt?.trim() ?? "";
  const apiCalls = step?.apiCalls ?? [];
  const fakeData = step?.inputData?.fakeData ?? {};
  const inputDataJson = JSON.stringify(fakeData, null, 2);
  const dialogueLines = step?.dialogueSequence ?? [];

  return (
    <div
      className={cn(
        "min-w-[280px] max-w-[340px] rounded-lg border bg-card px-3 py-2 text-left shadow-sm transition-shadow",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        connectHighlight &&
          "ring-2 ring-amber-500/80 ring-offset-2 ring-offset-background",
      )}
      style={
        accent
          ? {
              borderLeftWidth: 4,
              borderLeftColor: accent,
              backgroundColor: hexToRgba(accent, 0.12),
            }
          : undefined
      }
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !bg-background"
      />
      <div className="text-xs font-medium text-muted-foreground">Step</div>
      <div className="truncate text-sm font-semibold leading-tight">
        {name || "(unnamed)"}
      </div>

      <div className="mt-2 space-y-2 border-t border-border/60 pt-2 text-[11px] leading-snug">
        <div>
          <div className="font-medium text-muted-foreground">Video ID</div>
          <div className="mt-0.5 break-all font-mono text-foreground">
            {videoId ? `"${videoId}"` : "—"}
          </div>
        </div>

        <div>
          <div className="font-medium text-muted-foreground">API call</div>
          <div className="mt-0.5 max-h-20 overflow-y-auto whitespace-pre-wrap text-foreground">
            {summarizeApiCalls(apiCalls)}
          </div>
        </div>

        <div>
          <div className="font-medium text-muted-foreground">System prompt</div>
          <p className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap text-foreground">
            {systemPrompt || "—"}
          </p>
        </div>

        {dialogueLines.length > 0 ? (
          <div>
            <div className="font-medium text-muted-foreground">
              Dialogue
            </div>
            <ul className="mt-1 max-h-32 space-y-1.5 overflow-y-auto">
              {dialogueLines.map((line) => (
                <li
                  key={line.id}
                  className="flex gap-1.5 text-[10px] leading-snug text-foreground"
                >
                  <DialogueKindIcon
                    kind={line.kind}
                    className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 break-words">
                    {line.text.trim() ? line.text : "…"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <div className="font-medium text-muted-foreground">Input data</div>
          <pre className="mt-0.5 max-h-28 overflow-auto rounded-md border border-border/80 bg-muted/40 p-2 font-mono text-[10px] leading-relaxed text-foreground">
            {inputDataJson === "{}" ? "{}" : inputDataJson}
          </pre>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !bg-background"
      />
    </div>
  );
}
