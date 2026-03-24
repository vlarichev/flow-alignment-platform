"use client";

import { NodeResizer, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { normalizeStepColor } from "@/lib/step-colors";
import { useFlowStore } from "@/lib/store";

export type FlowTextNodeData = {
  textId: string;
};

export function FlowTextNode(props: NodeProps) {
  const data = props.data as FlowTextNodeData;
  const { selected } = props;
  const note = useFlowStore((s) =>
    s.textNodes.find((t) => t.id === data.textId),
  );
  const updateTextNode = useFlowStore((s) => s.updateTextNode);

  const text = note?.text?.trim() ? note.text : "Note — edit in the panel";
  const accent = normalizeStepColor(note?.color ?? null);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={72}
        color="hsl(var(--ring))"
        handleClassName="!border-2 !border-background"
        lineClassName="!border-ring"
        onResize={(_, p) => {
          updateTextNode(data.textId, {
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
          });
        }}
      />
      <div
        className={cn(
          "box-border h-full w-full overflow-auto rounded-md border px-3 py-2 text-left shadow-sm transition-shadow",
          accent
            ? "border-border bg-card"
            : "border-dashed border-muted-foreground/35 bg-muted/30",
          selected &&
            "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
        style={
          accent
            ? { borderTopWidth: 3, borderTopColor: accent }
            : undefined
        }
      >
        <div
          className={cn(
            "mb-1 text-[10px] font-semibold uppercase tracking-wide",
            accent
              ? "text-muted-foreground"
              : "text-muted-foreground/90",
          )}
        >
          Note
        </div>
        <div className="whitespace-pre-wrap text-sm leading-snug text-foreground">
          {text}
        </div>
      </div>
    </>
  );
}
