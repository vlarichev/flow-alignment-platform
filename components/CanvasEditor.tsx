"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { FlowTextNode } from "@/components/flow/FlowTextNode";
import { StepNode, type StepNodeData } from "@/components/flow/StepNode";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  /**
   * next-themes resolves stored preference on the client before paint, so `resolvedTheme`
   * can be "dark" while SSR always implied "light" — mismatch on React Flow's wrapper.
   * Until mounted, keep React Flow in "light" to match the server; then sync to the real theme.
   */
  const reactFlowColorMode =
    mounted && resolvedTheme === "dark" ? "dark" : "light";
  const steps = useFlowStore((s) => s.steps);
  const textNodes = useFlowStore((s) => s.textNodes);
  const connections = useFlowStore((s) => s.connections);
  const nodePositions = useFlowStore((s) => s.nodePositions);
  const selectedNodeIds = useFlowStore((s) => s.selectedNodeIds);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const connectionMode = useFlowStore((s) => s.connectionMode);

  const setNodePosition = useFlowStore((s) => s.setNodePosition);
  const setSelectedEdgeId = useFlowStore((s) => s.setSelectedEdgeId);
  const deleteStep = useFlowStore((s) => s.deleteStep);
  const deleteTextNode = useFlowStore((s) => s.deleteTextNode);
  const deleteConnection = useFlowStore((s) => s.deleteConnection);
  const applyNodeSelectChanges = useFlowStore(
    (s) => s.applyNodeSelectChanges,
  );
  const clearCanvasSelection = useFlowStore((s) => s.clearCanvasSelection);
  const selectNodeForConnection = useFlowStore(
    (s) => s.selectNodeForConnection,
  );
  const pushUndoSnapshot = useFlowStore((s) => s.pushUndoSnapshot);

  const canvasSelectable = connectionMode.status === "idle";

  const onNodeDragStart = useCallback(() => {
    pushUndoSnapshot();
  }, [pushUndoSnapshot]);

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
        // No fixed width/height: step cards vary with content. A fixed tall box
        // (previously STEP_NODE_HEIGHT) made a huge invisible hit area below the
        // card — clicks on "empty" canvas still selected the node and felt buggy.
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
        if (ch.type === "remove" && ch.id) {
          if (connectionMode.status !== "idle") continue;
          const s = useFlowStore.getState();
          if (s.steps.some((st) => st.id === ch.id)) {
            deleteStep(ch.id);
          } else if (s.textNodes.some((t) => t.id === ch.id)) {
            deleteTextNode(ch.id);
          }
          continue;
        }
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
    [
      connectionMode.status,
      deleteStep,
      deleteTextNode,
      setNodePosition,
      applyNodeSelectChanges,
    ],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const ch of changes) {
        if (ch.type === "remove" && ch.id) {
          if (connectionMode.status !== "idle") continue;
          deleteConnection(ch.id);
        }
      }
    },
    [connectionMode.status, deleteConnection],
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
        colorMode={reactFlowColorMode}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode={["Backspace", "Delete"]}
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
            if (node.type === "flowText") {
              const tn = textNodes.find((t) => t.id === node.id);
              const c = normalizeStepColor(tn?.color ?? null);
              return c ?? "#94a3b8";
            }
            const st = steps.find((s) => s.id === node.id);
            const c = normalizeStepColor(st?.color ?? null);
            return c ?? "#94a3b8";
          }}
        />
      </ReactFlow>
    </div>
  );
}
