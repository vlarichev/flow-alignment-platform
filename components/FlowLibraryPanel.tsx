"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { readFlowLibrary } from "@/lib/flow-library";
import { useFlowStore } from "@/lib/store";

export function FlowLibraryPanel() {
  const rev = useFlowStore((s) => s.flowLibraryRevision);
  const flowName = useFlowStore((s) => s.flowMetadata.name);
  const saveCurrentToLibrary = useFlowStore((s) => s.saveCurrentToLibrary);
  const loadFromLibrary = useFlowStore((s) => s.loadFromLibrary);
  const removeLibraryEntry = useFlowStore((s) => s.removeLibraryEntry);

  /** Avoid hydration mismatch: localStorage is empty on the server but may have data on first client read. */
  const [libraryReady, setLibraryReady] = useState(false);
  useEffect(() => {
    setLibraryReady(true);
  }, []);

  const entries = useMemo(() => {
    if (!libraryReady) return [];
    return readFlowLibrary();
  }, [libraryReady, rev]);
  const [name, setName] = useState("");

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden bg-card">
      <div className="shrink-0 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Flow library</h2>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={flowName}>
          Current: {flowName}
        </p>
      </div>
      <ScrollArea className="min-h-0 min-w-0 flex-1 overflow-x-hidden">
        <div className="min-w-0 space-y-4 p-4">
          <p className="break-words text-xs leading-relaxed text-muted-foreground">
            Save named snapshots of the current flow (steps, connections, canvas
            layout). Click <span className="font-medium text-foreground">Load</span>{" "}
            to restore one—your current work is kept automatically as
            &quot;Previous&quot; at the top of the list.
          </p>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              className="min-w-0 flex-1"
              placeholder="Snapshot name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveCurrentToLibrary(name);
                  setName("");
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => {
                saveCurrentToLibrary(name);
                setName("");
              }}
            >
              Save snapshot
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Snapshots</Label>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No snapshots yet. Save one to build your library.
              </p>
            ) : (
              <ul className="min-w-0 space-y-2">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex min-w-0 flex-col gap-2 rounded-md border border-border/80 bg-muted/30 p-2 sm:flex-row sm:items-start sm:gap-2"
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="break-words text-sm font-medium leading-snug">
                        {e.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(e.savedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 self-end sm:self-start">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-1 px-2"
                        onClick={() => loadFromLibrary(e.id)}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Load
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        title="Remove from library"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove “${e.name}” from the library?`,
                            )
                          ) {
                            removeLibraryEntry(e.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
