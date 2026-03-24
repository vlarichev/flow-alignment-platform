"use client";

import { useRef, useState } from "react";
import { BetweenHorizontalStart, LayoutGrid } from "lucide-react";

import { FlowOverviewDialog } from "@/components/FlowOverviewDialog";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { defaultFlow, defaultNodePositions } from "@/lib/defaultFlow";
import { parseFlowJson } from "@/lib/flow-utils";
import { useFlowStore } from "@/lib/store";

export function FileManager() {
  const flowMetadata = useFlowStore((s) => s.flowMetadata);
  const loadDocument = useFlowStore((s) => s.loadDocument);
  const newFlow = useFlowStore((s) => s.newFlow);
  const saveToBrowser = useFlowStore((s) => s.saveToBrowser);
  const exportJson = useFlowStore((s) => s.exportJson);
  const clearAll = useFlowStore((s) => s.clearAll);
  const cleanupHorizontalLayout = useFlowStore(
    (s) => s.cleanupHorizontalLayout,
  );

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState(flowMetadata.name);
  const [clearOpen, setClearOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function downloadExport() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowMetadata.name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const doc = parseFlowJson(text);
        if (
          !window.confirm(
            "Replace the current flow with the imported file? Unsaved changes in the editor will be lost.",
          )
        ) {
          return;
        }
        loadDocument(doc, defaultNodePositions());
      } catch (err) {
        window.alert(
          err instanceof Error ? err.message : "Failed to import JSON",
        );
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <header className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-sm font-semibold md:text-base">
            Agentic Workflow Builder
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Like Postman for agentic flows — design, simulate, iterate.
          </p>
          <p className="truncate text-[11px] text-muted-foreground/90">
            {flowMetadata.name} · {flowMetadata.version} · {flowMetadata.mode}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setNewName(flowMetadata.name); setNewOpen(true); }}>
          New flow
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => saveToBrowser()}>
          Save to browser
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => downloadExport()}>
          Export JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => importRef.current?.click()}
        >
          Import JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          title="Align all steps in one row by order; notes on a second row below"
          onClick={() => cleanupHorizontalLayout()}
        >
          <BetweenHorizontalStart className="h-4 w-4" />
          Clean up layout
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => setOverviewOpen(true)}
        >
          <LayoutGrid className="h-4 w-4" />
          Flow overview
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImportFile}
        />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setClearOpen(true)}
        >
          Clear all
        </Button>
        <ThemeToggle />
      </header>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New flow</DialogTitle>
            <DialogDescription>
              Start from the built-in sample workflow (operations / manufacturing
              demo) with a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="new-flow-name">Flow name</Label>
            <Input
              id="new-flow-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                newFlow(newName.trim() || defaultFlow.flowMetadata.name);
                setNewOpen(false);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FlowOverviewDialog open={overviewOpen} onOpenChange={setOverviewOpen} />

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all?</DialogTitle>
            <DialogDescription>
              Reset the editor to the default example flow. This cannot be undone
              unless you have exported JSON.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clearAll();
                setClearOpen(false);
              }}
            >
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
