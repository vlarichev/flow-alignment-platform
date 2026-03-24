"use client";

import { NodeResizer, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
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

  const text = note?.text?.trim() ? note.text : "Flow note — edit in the panel";

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
          "box-border h-full w-full overflow-auto rounded-md border border-dashed px-3 py-2 text-left shadow-sm transition-shadow",
          "border-amber-600/45 bg-amber-500/[0.12] dark:border-amber-400/40 dark:bg-amber-400/[0.1]",
          selected &&
            "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-100/80">
          Flow text
        </div>
        <div className="whitespace-pre-wrap text-sm leading-snug text-foreground">
          {text}
        </div>
      </div>
    </>
  );
}
