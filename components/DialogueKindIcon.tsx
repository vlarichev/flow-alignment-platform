"use client";

import { Bot, PlayCircle, User, Zap, type LucideIcon } from "lucide-react";

import type { DialogueLineKind } from "@/lib/types";

const kindIcon: Record<DialogueLineKind, LucideIcon> = {
  user: User,
  trigger: Zap,
  system: Bot,
  action: PlayCircle,
};

export function DialogueKindIcon({
  kind,
  className,
}: {
  kind: DialogueLineKind;
  className?: string;
}) {
  const Icon = kindIcon[kind];
  return <Icon className={className} aria-hidden />;
}
