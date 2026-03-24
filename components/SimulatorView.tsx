"use client";

import { Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { outgoingConnections } from "@/lib/flow-utils";
import { useFlowStore } from "@/lib/store";
import type { Connection } from "@/lib/types";

function formatFakeTable(
  data: Record<string, string | number | boolean>,
): { key: string; value: string }[] {
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

export function SimulatorView() {
  const steps = useFlowStore((s) => s.steps);
  const connections = useFlowStore((s) => s.connections);
  const sim = useFlowStore((s) => s.simulator);
  const closeSimulator = useFlowStore((s) => s.closeSimulator);
  const setSimulatorStartStep = useFlowStore((s) => s.setSimulatorStartStep);
  const simulatorPlay = useFlowStore((s) => s.simulatorPlay);
  const simulatorReset = useFlowStore((s) => s.simulatorReset);
  const simulatorNext = useFlowStore((s) => s.simulatorNext);

  const current =
    steps.find((s) => s.id === sim.currentStepId) ?? steps[0] ?? null;
  const outgoing = current
    ? outgoingConnections(connections, current.id)
    : [];

  function pickNext(conn: Connection) {
    simulatorNext(conn);
  }

  return (
    <Dialog open={sim.isOpen} onOpenChange={(o) => !o && closeSimulator()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Simulator</DialogTitle>
          <DialogDescription>
            Step through the flow and preview data and mock API responses.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2">
              <Label>Starting step</Label>
              <Select
                value={sim.currentStepId ?? ""}
                onValueChange={(v) => setSimulatorStartStep(v || null)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Choose step" />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.order}. {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="gap-2"
              onClick={() => simulatorPlay()}
              disabled={!sim.currentStepId && steps.length === 0}
            >
              <Play className="h-4 w-4" />
              Play
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => simulatorReset()}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {!sim.started ? (
            <p className="text-sm text-muted-foreground">
              Choose a starting step and press Play to begin the simulation.
            </p>
          ) : null}

          {sim.started && current ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div>
                <h3 className="text-lg font-semibold">{current.name}</h3>
                <p className="text-xs text-muted-foreground">{current.id}</p>
              </div>

              {sim.lastConnection ? (
                <div className="rounded-md bg-background/80 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Via: </span>
                  <span className="font-medium">{sim.lastConnection.type}</span>
                  {sim.lastConnection.type === "conditional" &&
                  sim.lastConnection.condition ? (
                    <span className="text-muted-foreground">
                      {" "}
                      ({sim.lastConnection.condition})
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div>
                <h4 className="mb-1 text-sm font-medium">System prompt</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {current.systemPrompt || "—"}
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">Input data</h4>
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 font-medium">Key</th>
                        <th className="px-3 py-2 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formatFakeTable(current.inputData.fakeData).map(
                        (row) => (
                          <tr key={row.key} className="border-t">
                            <td className="px-3 py-1.5 font-mono text-xs">
                              {row.key}
                            </td>
                            <td className="px-3 py-1.5">{row.value}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium">Video</h4>
                <p className="text-sm">
                  ID: <span className="font-mono">{current.videoId || "—"}</span>
                </p>
                {current.videoUrl ? (
                  <a
                    href={current.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {current.videoUrl}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No URL set</p>
                )}
                <div className="mt-2 aspect-video w-full max-w-md rounded-md border border-dashed bg-muted/40" />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">API calls</h4>
                {current.apiCalls.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  <ul className="space-y-2">
                    {current.apiCalls.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <div className="font-medium">
                          {a.type}
                          {a.endpoint ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {a.endpoint}
                            </span>
                          ) : null}
                          {a.topic ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {a.topic}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-muted-foreground">{a.action}</div>
                        <div className="mt-1 text-xs">
                          <span className="text-muted-foreground">→ </span>
                          {a.mockResponse}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="mb-2 text-sm font-medium">Next step</h4>
                {outgoing.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No outgoing connections (end of graph).
                  </p>
                ) : outgoing.length === 1 ? (
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => pickNext(outgoing[0] as Connection)}
                  >
                    <SkipForward className="h-4 w-4" />
                    Go to{" "}
                    {steps.find((s) => s.id === outgoing[0].to)?.name ??
                      outgoing[0].to}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Multiple branches — pick one:
                    </p>
                    <div className="flex flex-col gap-2">
                      {outgoing.map((c) => (
                        <Button
                          key={c.id}
                          type="button"
                          variant="secondary"
                          className="h-auto justify-start py-2 text-left"
                          onClick={() => pickNext(c as Connection)}
                        >
                          <span className="block w-full">
                            <span className="font-medium">
                              {steps.find((s) => s.id === c.to)?.name ?? c.to}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {c.type}
                              {c.condition ? ` · ${c.condition}` : ""}
                            </span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
