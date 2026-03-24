"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Plus, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepColorPicker } from "@/components/StepColorPicker";
import { Textarea } from "@/components/ui/textarea";
import {
  generateConnectionId,
  generateStepId,
  mergeNodePositions,
  parseFlowJson,
} from "@/lib/flow-utils";
import { useFlowStore } from "@/lib/store";
import type { Connection, ConnectionType, FlowMetadata, Step } from "@/lib/types";

const CONN_TYPES: ConnectionType[] = ["linear", "conditional", "loop"];

/** Scrollable body: explicit max-height so flex children don’t grow past the viewport (ScrollArea alone often won’t scroll without a fixed height). */
const overviewScrollClass =
  "max-h-[calc(90vh-14rem)] min-h-0 overflow-y-auto overscroll-contain px-6 py-4";

export function FlowOverviewDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const loadDocument = useFlowStore((s) => s.loadDocument);

  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [meta, setMeta] = useState<FlowMetadata | null>(null);
  const [tableSteps, setTableSteps] = useState<Step[]>([]);
  const [tableConnections, setTableConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!open) return;
    const s = useFlowStore.getState();
    setJsonText(s.exportJson());
    setJsonError(null);
    setMeta(structuredClone(s.flowMetadata));
    setTableSteps(structuredClone(s.steps));
    setTableConnections(structuredClone(s.connections));
  }, [open]);

  function applyJson() {
    setJsonError(null);
    try {
      const doc = parseFlowJson(jsonText);
      const positions = mergeNodePositions(
        useFlowStore.getState().nodePositions,
        doc.steps,
      );
      loadDocument(doc, positions);
      onOpenChange(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  function applyTable() {
    if (!meta) return;
    const doc = {
      flowMetadata: meta,
      steps: tableSteps,
      connections: tableConnections.map((c) => ({
        ...c,
        condition:
          c.type === "conditional"
            ? (c.condition?.trim() || null)
            : null,
      })),
      textNodes: useFlowStore.getState().textNodes,
    };
    try {
      const parsed = parseFlowJson(JSON.stringify(doc));
      const positions = mergeNodePositions(
        useFlowStore.getState().nodePositions,
        parsed.steps,
      );
      loadDocument(parsed, positions);
      onOpenChange(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid data");
    }
  }

  function addStepRow() {
    setTableSteps((prev) => {
      const id = generateStepId(prev);
      const order =
        prev.length === 0
          ? 1
          : Math.max(...prev.map((x) => x.order), 0) + 1;
      const step: Step = {
        id,
        name: `Step ${order}`,
        order,
        systemPrompt: "",
        inputData: { fakeData: {} },
        videoId: "",
        videoUrl: "",
        apiCalls: [],
      };
      return [...prev, step];
    });
  }

  function removeStepRow(id: string) {
    setTableSteps((prev) => prev.filter((s) => s.id !== id));
    setTableConnections((prev) =>
      prev.filter((c) => c.from !== id && c.to !== id),
    );
  }

  function updateStepById(stepId: string, patch: Partial<Step>) {
    setTableSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    );
  }

  function addConnectionRow() {
    const ids = tableSteps.map((s) => s.id);
    const from = ids[0] ?? "step_1";
    const to = ids[1] ?? from;
    setTableConnections((prev) => {
      const id = generateConnectionId(prev, from, to);
      const conn: Connection = {
        id,
        from,
        to,
        type: "linear",
        condition: null,
      };
      return [...prev, conn];
    });
  }

  function updateConnectionAt(index: number, patch: Partial<Connection>) {
    setTableConnections((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  function removeConnectionRow(index: number) {
    setTableConnections((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Flow overview
          </DialogTitle>
          <DialogDescription>
            Edit the whole flow as JSON or in tables. Applying updates the
            canvas and the right panel. Canvas positions are kept for existing
            step ids; new steps get a default placement.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="json"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b px-6">
            <TabsList className="h-10 bg-transparent p-0">
              <TabsTrigger value="json" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <Table2 className="h-4 w-4" />
                Table
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="json"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <div className={overviewScrollClass}>
              <Textarea
                className="min-h-[240px] w-full font-mono text-xs leading-relaxed"
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError(null);
                }}
                spellCheck={false}
              />
            </div>
            {jsonError ? (
              <p className="shrink-0 px-6 pb-2 text-sm text-destructive">
                {jsonError}
              </p>
            ) : null}
            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => applyJson()}>
                Apply JSON
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent
            value="table"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <div className={overviewScrollClass}>
              {meta ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Flow metadata</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={meta.name}
                          onChange={(e) =>
                            setMeta({ ...meta, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Version</Label>
                        <Input
                          value={meta.version}
                          onChange={(e) =>
                            setMeta({ ...meta, version: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Mode</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          value={meta.mode}
                          onChange={(e) =>
                            setMeta({
                              ...meta,
                              mode: e.target.value as FlowMetadata["mode"],
                            })
                          }
                        >
                          <option value="linear">linear</option>
                          <option value="branching">branching</option>
                        </select>
                      </div>
                      <div className="grid gap-1.5 sm:col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={meta.description}
                          onChange={(e) =>
                            setMeta({ ...meta, description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Steps</h3>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => addStepRow()}
                      >
                        <Plus className="h-4 w-4" />
                        Add step
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {tableSteps.map((step) => (
                        <div
                          key={step.id}
                          className="rounded-lg border bg-muted/20 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {step.id}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive"
                              onClick={() => removeStepRow(step.id)}
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Name</Label>
                              <Input
                                value={step.name}
                                onChange={(e) =>
                                  updateStepById(step.id, {
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Order</Label>
                              <Input
                                type="number"
                                value={step.order}
                                onChange={(e) =>
                                  updateStepById(step.id, {
                                    order: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Video ID</Label>
                              <Input
                                value={step.videoId}
                                onChange={(e) =>
                                  updateStepById(step.id, {
                                    videoId: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Video URL</Label>
                              <Input
                                value={step.videoUrl}
                                onChange={(e) =>
                                  updateStepById(step.id, {
                                    videoUrl: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <StepColorPicker
                                compact
                                value={step.color}
                                onChange={(hex) =>
                                  updateStepById(step.id, {
                                    color: hex ?? undefined,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1.5 sm:col-span-2">
                              <Label className="text-xs">System prompt</Label>
                              <Textarea
                                value={step.systemPrompt}
                                onChange={(e) =>
                                  updateStepById(step.id, {
                                    systemPrompt: e.target.value,
                                  })
                                }
                                rows={3}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Input data, dialogue sequence, API calls, and
                            substeps are preserved
                            from the current step. Use the JSON tab to edit them
                            in bulk.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Connections</h3>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => addConnectionRow()}
                        disabled={tableSteps.length < 2}
                      >
                        <Plus className="h-4 w-4" />
                        Add connection
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {tableConnections.map((c, index) => (
                        <div
                          key={c.id}
                          className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-6"
                        >
                          <div className="grid gap-1.5 lg:col-span-2">
                            <Label className="text-xs">From</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                              value={c.from}
                              onChange={(e) =>
                                updateConnectionAt(index, {
                                  from: e.target.value,
                                })
                              }
                            >
                              {tableSteps.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.id}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-1.5 lg:col-span-2">
                            <Label className="text-xs">To</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                              value={c.to}
                              onChange={(e) =>
                                updateConnectionAt(index, { to: e.target.value })
                              }
                            >
                              {tableSteps.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.id}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Type</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                              value={c.type}
                              onChange={(e) => {
                                const type = e.target.value as ConnectionType;
                                updateConnectionAt(index, {
                                  type,
                                  condition:
                                    type === "conditional"
                                      ? c.condition ?? ""
                                      : null,
                                });
                              }}
                            >
                              {CONN_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Condition</Label>
                            <Input
                              value={c.condition ?? ""}
                              disabled={c.type !== "conditional"}
                              placeholder="if conditional"
                              onChange={(e) =>
                                updateConnectionAt(index, {
                                  condition: e.target.value || null,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-end lg:col-span-6">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeConnectionRow(index)}
                            >
                              Remove connection
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            {jsonError ? (
              <p className="shrink-0 px-6 pb-2 text-sm text-destructive">
                {jsonError}
              </p>
            ) : null}
            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => applyTable()}>
                Apply table
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
