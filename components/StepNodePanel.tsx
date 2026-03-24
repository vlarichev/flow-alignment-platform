"use client";

import { Plus } from "lucide-react";

import { APICallEditor } from "@/components/APICallEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FlowLibraryPanel } from "@/components/FlowLibraryPanel";
import { StepColorPicker } from "@/components/StepColorPicker";
import { StepDialogueEditor } from "@/components/StepDialogueEditor";
import { createEmptyApiCall, useFlowStore } from "@/lib/store";
import type { ApiCall, ConnectionType, Substep } from "@/lib/types";

function parseFakeValue(raw: string): string | number | boolean {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
  return raw;
}

export function StepNodePanel() {
  const selectedStepId = useFlowStore((s) => s.selectedStepId);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const selectedTextNodeId = useFlowStore((s) => s.selectedTextNodeId);
  const steps = useFlowStore((s) => s.steps);
  const textNodes = useFlowStore((s) => s.textNodes);
  const connections = useFlowStore((s) => s.connections);
  const updateStep = useFlowStore((s) => s.updateStep);
  const deleteStep = useFlowStore((s) => s.deleteStep);
  const updateTextNode = useFlowStore((s) => s.updateTextNode);
  const deleteTextNode = useFlowStore((s) => s.deleteTextNode);
  const updateConnection = useFlowStore((s) => s.updateConnection);
  const deleteConnection = useFlowStore((s) => s.deleteConnection);

  const step = steps.find((s) => s.id === selectedStepId);
  const edge = connections.find((c) => c.id === selectedEdgeId);
  const flowText = textNodes.find((t) => t.id === selectedTextNodeId);

  if (selectedTextNodeId && flowText) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l bg-card">
        <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Flow text</h2>
            <p className="font-mono text-xs text-muted-foreground">
              {flowText.id}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => deleteTextNode(flowText.id)}
          >
            Delete
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-4">
            <div className="grid gap-2">
              <Label htmlFor="flow-text-body">Text</Label>
              <Textarea
                id="flow-text-body"
                value={flowText.text}
                onChange={(e) =>
                  updateTextNode(flowText.id, { text: e.target.value })
                }
                rows={6}
                placeholder="Explain this section of the flow…"
                className="text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This text is only for the diagram— it is not part of the
              simulator steps.
            </p>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (selectedEdgeId && edge) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Connection</h2>
          <p className="text-xs text-muted-foreground">
            {edge.from} → {edge.to}
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-4">
            <div className="grid gap-2">
              <Label className="text-xs">Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={edge.type}
                onChange={(e) =>
                  updateConnection(edge.id, {
                    type: e.target.value as ConnectionType,
                    condition:
                      e.target.value === "conditional"
                        ? edge.condition ?? ""
                        : null,
                  })
                }
              >
                <option value="linear">linear</option>
                <option value="conditional">conditional</option>
                <option value="loop">loop</option>
              </select>
            </div>
            {edge.type === "conditional" ? (
              <div className="grid gap-2">
                <Label className="text-xs">Condition name</Label>
                <Input
                  value={edge.condition ?? ""}
                  onChange={(e) =>
                    updateConnection(edge.id, { condition: e.target.value })
                  }
                  placeholder="approval_granted"
                />
              </div>
            ) : null}
            <Separator />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => deleteConnection(edge.id)}
            >
              Delete connection
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l bg-card">
        <FlowLibraryPanel />
      </div>
    );
  }

  const st = step;
  const fakeEntries = Object.entries(st.inputData.fakeData);

  function setFakeData(next: Record<string, string | number | boolean>) {
    updateStep(st.id, { inputData: { fakeData: next } });
  }

  function updateApiCalls(next: ApiCall[]) {
    updateStep(st.id, { apiCalls: next });
  }

  function updateSubsteps(next: Substep[]) {
    updateStep(st.id, { substeps: next });
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l bg-card">
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">Step properties</h2>
          <p className="font-mono text-xs text-muted-foreground">{st.id}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => deleteStep(st.id)}
        >
          Delete
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <div className="grid gap-2">
            <Label htmlFor="step-name">Name</Label>
            <Input
              id="step-name"
              value={st.name}
              onChange={(e) => updateStep(st.id, { name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="step-system-name">System</Label>
            <Input
              id="step-system-name"
              value={st.systemName ?? ""}
              onChange={(e) =>
                updateStep(st.id, {
                  systemName: e.target.value.trim()
                    ? e.target.value
                    : undefined,
                })
              }
              placeholder="e.g. ERP, NX, A4M"
            />
          </div>

          <StepColorPicker
            value={st.color}
            onChange={(hex) => updateStep(st.id, { color: hex })}
          />

          <div className="grid gap-2">
            <Label htmlFor="step-prompt">System prompt</Label>
            <Textarea
              id="step-prompt"
              value={st.systemPrompt}
              onChange={(e) =>
                updateStep(st.id, { systemPrompt: e.target.value })
              }
              rows={5}
            />
          </div>

          <Separator />

          <StepDialogueEditor
            lines={st.dialogueSequence ?? []}
            onChange={(dialogueSequence) =>
              updateStep(st.id, { dialogueSequence })
            }
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="video-id">Video ID</Label>
              <Input
                id="video-id"
                value={st.videoId}
                onChange={(e) =>
                  updateStep(st.id, { videoId: e.target.value })
                }
                placeholder="1 or 3_1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={st.videoUrl}
                onChange={(e) =>
                  updateStep(st.id, { videoUrl: e.target.value })
                }
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Input data (fake data)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() => {
                  const key = `key_${fakeEntries.length + 1}`;
                  setFakeData({ ...st.inputData.fakeData, [key]: "" });
                }}
              >
                <Plus className="h-4 w-4" />
                Add field
              </Button>
            </div>
            <div className="space-y-2">
              {fakeEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No key-value pairs yet.
                </p>
              ) : null}
              {fakeEntries.map(([key, val]) => (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2"
                >
                  <Input
                    className="font-mono text-xs"
                    value={key}
                    onChange={(e) => {
                      const nk = e.target.value;
                      const next = { ...st.inputData.fakeData };
                      delete next[key];
                      next[nk] = val;
                      setFakeData(next);
                    }}
                  />
                  <Input
                    className="text-xs"
                    value={String(val)}
                    onChange={(e) => {
                      setFakeData({
                        ...st.inputData.fakeData,
                        [key]: e.target.value,
                      });
                    }}
                    onBlur={(e) => {
                      const parsed = parseFakeValue(e.target.value);
                      setFakeData({
                        ...st.inputData.fakeData,
                        [key]: parsed,
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-2 text-destructive"
                    onClick={() => {
                      const next = { ...st.inputData.fakeData };
                      delete next[key];
                      setFakeData(next);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>API calls</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() =>
                  updateApiCalls([...st.apiCalls, createEmptyApiCall()])
                }
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {st.apiCalls.map((call, idx) => (
                <APICallEditor
                  key={call.id}
                  call={call}
                  onChange={(next) => {
                    const copy = [...st.apiCalls];
                    copy[idx] = next;
                    updateApiCalls(copy);
                  }}
                  onRemove={() => {
                    updateApiCalls(st.apiCalls.filter((_, i) => i !== idx));
                  }}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Substeps (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() =>
                  updateSubsteps([
                    ...(st.substeps ?? []),
                    {
                      id: `sub_${Math.random().toString(36).slice(2, 8)}`,
                      videoId: "",
                      description: "",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {(st.substeps ?? []).map((sub, idx) => (
                <div
                  key={sub.id}
                  className="space-y-2 rounded-md border p-2"
                >
                  <div className="grid gap-1">
                    <Label className="text-xs">Video ID</Label>
                    <Input
                      value={sub.videoId}
                      onChange={(e) => {
                        const list = [...(st.substeps ?? [])];
                        list[idx] = { ...sub, videoId: e.target.value };
                        updateSubsteps(list);
                      }}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={sub.description}
                      onChange={(e) => {
                        const list = [...(st.substeps ?? [])];
                        list[idx] = { ...sub, description: e.target.value };
                        updateSubsteps(list);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      updateSubsteps(
                        (st.substeps ?? []).filter((_, i) => i !== idx),
                      )
                    }
                  >
                    Remove substep
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
