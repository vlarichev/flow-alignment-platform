import type { DialogueLine, DialogueLineKind } from "./types";

export const DIALOGUE_KIND_OPTIONS: {
  value: DialogueLineKind;
  label: string;
}[] = [
  { value: "user", label: "User" },
  { value: "trigger", label: "Trigger" },
  { value: "system", label: "System" },
  { value: "action", label: "Action" },
];

export function isDialogueLineKind(v: unknown): v is DialogueLineKind {
  return (
    v === "user" ||
    v === "trigger" ||
    v === "system" ||
    v === "action"
  );
}

export function createEmptyDialogueLine(): DialogueLine {
  return {
    id: `dlg_${Math.random().toString(36).slice(2, 11)}`,
    kind: "system",
    text: "",
  };
}
