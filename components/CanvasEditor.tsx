"use client";

import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { FlowTextNode } from "@/components/flow/FlowTextNode";
import { StepNode, type StepNodeData } from "@/components/flow/StepNode";
import { STEP_NODE_HEIGHT, STEP_NODE_WIDTH } from "@/lib/canvas-layout";
import { normalizeStepColor } from "@/lib/step-colors";
import { useFlowStore } from "@/lib/store";
import type { Connection } from "@/lib/types";

const nodeTypes = {
  demoStep: StepNode,
  flowText: FlowTextNode,
} as const satisfies NodeTypes;

function connectionLabel(c: Connection): string | undefined {
  if (c.type === "linear") return undefined;
  if (c.type === "conditional" && c.condition) {
    return `${c.type}: ${c.condition}`;
  }
  return c.type;
}

export function CanvasEditor() {
  const steps = useFlowStore((s) => s.steps);
  const textNodes = useFlowStore((s) => s.textNodes);
  const connections = useFlowStore((s) => s.connections);
  const nodePositions = useFlowStore((s) => s.nodePositions);
  const selectedNodeIds = useFlowStore((s) => s.selectedNodeIds);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const connectionMode = useFlowStore((s) => s.connectionMode);

  const setNodePosition = useFlowStore((s) => s.setNodePosition);
  const setSelectedEdgeId = useFlowStore((s) => s.setSelectedEdgeId);
  const applyNodeSelectChanges = useFlowStore(
    (s) => s.applyNodeSelectChanges,
  );
  const clearCanvasSelection = useFlowStore((s) => s.clearCanvasSelection);
  const selectNodeForConnection = useFlowStore(
    (s) => s.selectNodeForConnection,
  );

  const canvasSelectable = connectionMode.status === "idle";

  const nodes: Node[] = useMemo(() => {
    const stepRf: Node[] = steps.map((st) => {
      const pos = nodePositions[st.id] ?? { x: 0, y: 0 };
      const data: StepNodeData = {
        stepId: st.id,
        name: st.name,
        videoId: st.videoId,
        apiCount: st.apiCalls.length,
      };
      return {
        id: st.id,
        type: "demoStep",
        position: pos,
        width: STEP_NODE_WIDTH,
        height: STEP_NODE_HEIGHT,
        data,
        selected: selectedNodeIds.includes(st.id),
        selectable: canvasSelectable,
      };
    });
    const textRf: Node[] = textNodes.map((tn) => ({
      id: tn.id,
      type: "flowText",
      position: { x: tn.x, y: tn.y },
      width: tn.width ?? 280,
      height: tn.height ?? 120,
      data: { textId: tn.id },
      selected: selectedNodeIds.includes(tn.id),
      draggable: true,
      selectable: canvasSelectable,
    }));
    return [...stepRf, ...textRf];
  }, [
    steps,
    textNodes,
    nodePositions,
    selectedNodeIds,
    canvasSelectable,
  ]);

  const edges: Edge[] = useMemo(
    () =>
      connections.map((c) => {
        const label = connectionLabel(c);
        return {
          id: c.id,
          source: c.from,
          target: c.to,
          ...(label !== undefined ? { label } : {}),
          type: "smoothstep" as const,
          selected: selectedEdgeId === c.id,
          style: { strokeWidth: selectedEdgeId === c.id ? 2.5 : 1.5 },
        };
      }),
    [connections, selectedEdgeId],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const selectChanges: {
        type: "select";
        id: string;
        selected: boolean;
      }[] = [];
      for (const ch of changes) {
        if (ch.type === "position" && ch.id && ch.position) {
          setNodePosition(ch.id, ch.position);
        } else if (ch.type === "select") {
          selectChanges.push(ch);
        }
      }
      if (selectChanges.length > 0) {
        applyNodeSelectChanges(selectChanges);
      }
    },
    [setNodePosition, applyNodeSelectChanges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (
        connectionMode.status === "pickSource" ||
        connectionMode.status === "pickTarget"
      ) {
        if (node.type !== "demoStep") return;
        selectNodeForConnection(node.id);
      }
    },
    [connectionMode.status, selectNodeForConnection],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
    },
    [setSelectedEdgeId],
  );

  const onPaneClick = useCallback(() => {
    if (
      connectionMode.status === "pickSource" ||
      connectionMode.status === "pickTarget"
    ) {
      return;
    }
    clearCanvasSelection();
  }, [connectionMode.status, clearCanvasSelection]);

  return (
    <div className="h-full min-h-[560px] w-full rounded-lg border bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elevateEdgesOnSelect
        multiSelectionKeyCode="Shift"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          className="!bg-card"
          zoomable
          pannable
          nodeStrokeWidth={2}
          nodeStrokeColor="hsl(var(--border))"
          nodeColor={(node) => {
            if (node.type === "flowText") return "#fbbf24";
            const st = steps.find((s) => s.id === node.id);
            const c = normalizeStepColor(st?.color ?? null);
            return c ?? "#94a3b8";
          }}
        />
      </ReactFlow>
    </div>
  );
}
