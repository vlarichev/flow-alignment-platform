"use client";

import { NodeResizer, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { hexToRgba, normalizeStepColor } from "@/lib/step-colors";
import { useFlowStore } from "@/lib/store";

/** Used when `fontSize` is omitted (older flows) or out of range. */
const DEFAULT_NOTE_FONT_PX = 16;

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
  const pushUndoSnapshot = useFlowStore((s) => s.pushUndoSnapshot);

  const text = note?.text?.trim() ? note.text : "Note — edit in the panel";
  const accent = normalizeStepColor(note?.color ?? null);
  const fontPx =
    typeof note?.fontSize === "number" &&
    Number.isFinite(note.fontSize) &&
    note.fontSize >= 10 &&
    note.fontSize <= 40
      ? note.fontSize
      : DEFAULT_NOTE_FONT_PX;
  const labelPx = Math.round(Math.max(10, fontPx * 0.72));

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={72}
        color="hsl(var(--ring))"
        handleClassName="!border-2 !border-background"
        lineClassName="!border-ring"
        onResizeStart={() => {
          pushUndoSnapshot();
        }}
        onResize={(_, p) => {
          updateTextNode(
            data.textId,
            {
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
            },
            true,
          );
        }}
      />
      <div
        className={cn(
          "box-border h-full w-full overflow-auto rounded-md border px-3 py-2 text-left shadow-sm transition-shadow",
          !accent && "border-dashed border-muted-foreground/35 bg-muted/30",
          selected &&
            "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
        style={
          accent
            ? {
                backgroundColor: hexToRgba(accent, 0.2),
                borderColor: hexToRgba(accent, 0.55),
                borderStyle: "solid",
              }
            : undefined
        }
      >
        <div
          className={cn(
            "mb-1 font-semibold uppercase tracking-wide",
            accent ? "text-muted-foreground" : "text-muted-foreground/90",
          )}
          style={{ fontSize: labelPx }}
        >
          Note
        </div>
        <div
          className="whitespace-pre-wrap leading-snug text-foreground"
          style={{ fontSize: fontPx }}
        >
          {text}
        </div>
      </div>
    </>
  );
}
