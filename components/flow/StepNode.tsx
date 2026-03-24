"use client";

import { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { normalizeStepColor } from "@/lib/step-colors";
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

  const hasVideoId = Boolean(videoId?.trim());
  const hasApiCalls = apiCalls.length > 0;
  const hasSystemPrompt = Boolean(systemPrompt);
  const hasDialogue = dialogueLines.length > 0;
  const hasInputData = Object.keys(fakeData).length > 0;
  const hasOverviewBody =
    hasVideoId ||
    hasApiCalls ||
    hasSystemPrompt ||
    hasDialogue ||
    hasInputData;

  const onConnectionHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const store = useFlowStore.getState();
      if (store.connectionMode.status === "idle") {
        store.beginAddConnection();
      }
      store.selectNodeForConnection(data.stepId);
    },
    [data.stepId],
  );

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
              borderTopWidth: 4,
              borderTopColor: accent,
            }
          : undefined
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        onPointerDown={onConnectionHandlePointerDown}
        className="cursor-connect-plus !h-3.5 !w-3.5 !min-h-[18px] !min-w-[18px] !border-2 !bg-background hover:!border-primary"
      />
      <div className="truncate text-sm font-semibold leading-tight">
        {name || "(unnamed)"}
      </div>
      {step?.systemName ? (
        <div className="truncate text-[11px] text-muted-foreground">
          {step.systemName}
        </div>
      ) : null}

      {hasOverviewBody ? (
        <div className="mt-2 space-y-2 border-t border-border pt-2 text-[11px] leading-snug">
          {hasSystemPrompt ? (
            <div>
              <div className="font-medium text-muted-foreground">
                System prompt
              </div>
              <p className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted px-2 py-1.5 text-foreground">
                {systemPrompt}
              </p>
            </div>
          ) : null}

          {hasDialogue ? (
            <div>
              <div className="font-medium text-muted-foreground">
                Dialogue
              </div>
              <ul className="mt-1 max-h-32 space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted p-2">
                {dialogueLines.map((line) => (
                  <li
                    key={line.id}
                    className="flex gap-1.5 text-[11px] leading-snug text-foreground"
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

          {hasVideoId ? (
            <div>
              <div className="font-medium text-muted-foreground">Video ID</div>
              <div className="mt-0.5 break-all rounded-md border border-border bg-muted px-2 py-1 font-mono text-foreground">
                &quot;{videoId.trim()}&quot;
              </div>
            </div>
          ) : null}

          {hasApiCalls ? (
            <div>
              <div className="font-medium text-muted-foreground">API call</div>
              <div className="mt-0.5 max-h-20 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted px-2 py-1 text-foreground">
                {summarizeApiCalls(apiCalls)}
              </div>
            </div>
          ) : null}

          {hasInputData ? (
            <div>
              <div className="font-medium text-muted-foreground">Input data</div>
              <pre className="mt-0.5 max-h-28 overflow-auto rounded-md border border-border bg-muted p-2 font-mono text-[10px] leading-relaxed text-foreground">
                {inputDataJson}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      <Handle
        type="source"
        position={Position.Right}
        onPointerDown={onConnectionHandlePointerDown}
        className="cursor-connect-plus !h-3.5 !w-3.5 !min-h-[18px] !min-w-[18px] !border-2 !bg-background hover:!border-primary"
      />
    </div>
  );
}
