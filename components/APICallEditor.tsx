"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiCall, ApiCallType } from "@/lib/types";

const TYPES: ApiCallType[] = ["REST", "OPC-UA", "MQTT"];

export function APICallEditor({
  call,
  onChange,
  onRemove,
}: {
  call: ApiCall;
  onChange: (next: ApiCall) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          API call
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive"
          onClick={onRemove}
          aria-label="Remove API call"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-2">
        <Label className="text-xs">Type</Label>
        <Select
          value={call.type}
          onValueChange={(v) => onChange({ ...call, type: v as ApiCallType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {call.type === "MQTT" ? (
        <div className="grid gap-2">
          <Label className="text-xs">Topic</Label>
          <Input
            value={call.topic ?? ""}
            onChange={(e) => onChange({ ...call, topic: e.target.value })}
            placeholder="factory/line/topic"
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label className="text-xs">Endpoint</Label>
          <Input
            value={call.endpoint ?? ""}
            onChange={(e) => onChange({ ...call, endpoint: e.target.value })}
            placeholder="https:// or opc://"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label className="text-xs">Action</Label>
        <Input
          value={call.action}
          onChange={(e) => onChange({ ...call, action: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label className="text-xs">Mock response</Label>
        <Textarea
          value={call.mockResponse}
          onChange={(e) => onChange({ ...call, mockResponse: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
