"use client";

import { useEffect, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlowStore } from "@/lib/store";
import type { ConnectionType } from "@/lib/types";

export function ConnectionDialog() {
  const open = useFlowStore((s) => s.connectionDialogOpen);
  const pending = useFlowStore((s) => s.pendingConnection);
  const confirm = useFlowStore((s) => s.confirmNewConnection);
  const cancel = useFlowStore((s) => s.cancelAddConnection);

  const [type, setType] = useState<ConnectionType>("linear");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    if (open) {
      setType("linear");
      setCondition("");
    }
  }, [open, pending?.fromId, pending?.toId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) cancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New connection</DialogTitle>
          <DialogDescription>
            {pending ? (
              <>
                From <span className="font-mono">{pending.fromId}</span> to{" "}
                <span className="font-mono">{pending.toId}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="conn-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ConnectionType)}
            >
              <SelectTrigger id="conn-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">linear</SelectItem>
                <SelectItem value="conditional">conditional</SelectItem>
                <SelectItem value="loop">loop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "conditional" ? (
            <div className="grid gap-2">
              <Label htmlFor="conn-condition">Condition name</Label>
              <Input
                id="conn-condition"
                placeholder="e.g. approval_granted"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => cancel()}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              confirm(
                type,
                type === "conditional" ? (condition.trim() || null) : null,
              )
            }
          >
            Add connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
