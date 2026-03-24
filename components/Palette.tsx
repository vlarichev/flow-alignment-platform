"use client";

import { GitBranch, Plus, TextQuote, Waypoints } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFlowStore } from "@/lib/store";

export function Palette() {
  const addStep = useFlowStore((s) => s.addStep);
  const addTextNode = useFlowStore((s) => s.addTextNode);
  const beginAddConnection = useFlowStore((s) => s.beginAddConnection);
  const cancelAddConnection = useFlowStore((s) => s.cancelAddConnection);
  const connectionMode = useFlowStore((s) => s.connectionMode);
  const openSimulator = useFlowStore((s) => s.openSimulator);

  const connecting =
    connectionMode.status === "pickSource" ||
    connectionMode.status === "pickTarget";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Palette</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => addStep()}
        >
          <Plus className="h-4 w-4" />
          Add step
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => addTextNode()}
        >
          <TextQuote className="h-4 w-4" />
          Add note
        </Button>
        <Button
          type="button"
          variant={connecting ? "default" : "secondary"}
          className="w-full justify-start gap-2"
          onClick={() =>
            connecting ? cancelAddConnection() : beginAddConnection()
          }
        >
          <Waypoints className="h-4 w-4" />
          {connecting ? "Cancel connection" : "Add connection"}
        </Button>
        {connecting ? (
          <p className="text-xs text-muted-foreground">
            {connectionMode.status === "pickSource"
              ? "Click a step or its left/right handle (source), then the target step."
              : "Click the target step or a handle on it."}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => openSimulator()}
        >
          <GitBranch className="h-4 w-4" />
          Simulator
        </Button>
        <p className="text-xs text-muted-foreground">
          With the canvas focused: <span className="font-medium text-foreground">Delete</span>{" "}
          or <span className="font-medium text-foreground">Backspace</span> removes the
          selected step, note, or connection.
        </p>
      </CardContent>
    </Card>
  );
}
