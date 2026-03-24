"use client";

import { ReactFlowProvider } from "@xyflow/react";

import { CanvasEditor } from "@/components/CanvasEditor";
import { ConnectionDialog } from "@/components/ConnectionDialog";
import { FileManager } from "@/components/FileManager";
import { FlowHydration } from "@/components/FlowHydration";
import { Palette } from "@/components/Palette";
import { SimulatorView } from "@/components/SimulatorView";
import { StepNodePanel } from "@/components/StepNodePanel";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <FlowHydration />
      <FileManager />
      <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr] overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,380px)] lg:grid-rows-1">
        <aside className="border-b p-3 lg:border-b-0 lg:border-r">
          <Palette />
        </aside>
        <section className="min-h-[480px] p-3 lg:min-h-0">
          <ReactFlowProvider>
            <CanvasEditor />
          </ReactFlowProvider>
        </section>
        <aside className="min-h-0 min-w-0 overflow-hidden border-t lg:border-l lg:border-t-0">
          <StepNodePanel />
        </aside>
      </main>
      <ConnectionDialog />
      <SimulatorView />
    </div>
  );
}
