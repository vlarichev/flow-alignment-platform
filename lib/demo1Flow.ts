import type {
  ApiCall,
  ApiCallType,
  Connection,
  DialogueLine,
  DialogueLineKind,
  FlowDocument,
  Step,
  StepInputData,
} from "./types";

/** Colors for canvas grouping (cycles if more steps than entries). */
const DEMO1_STEP_COLORS = [
  "#3b82f6",
  "#2563eb",
  "#f59e0b",
  "#d97706",
  "#8b5cf6",
  "#7c3aed",
  "#ec4899",
  "#db2777",
  "#10b981",
  "#059669",
  "#6366f1",
];

function fakeDataFrom(
  obj: Record<string, unknown> | undefined,
): StepInputData {
  if (!obj) return { fakeData: {} };
  const fakeData: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      fakeData[k] = v;
    } else {
      fakeData[k] = JSON.stringify(v);
    }
  }
  return { fakeData };
}

type RawDlg = {
  type: "user" | "system" | "action" | "trigger";
  content: string;
};

type RawApi = {
  type: ApiCallType;
  endpoint?: string;
  topic?: string;
  action: string;
};

type RawStep = {
  n: number;
  name: string;
  systemName: string;
  videoId?: string;
  systemPrompt: string;
  inputData?: Record<string, unknown>;
  apiCalls?: RawApi[];
  dialogue?: RawDlg[];
};

function toDialogue(stepId: string, raw: RawDlg[] | undefined): DialogueLine[] {
  if (!raw?.length) return [];
  const kindMap: Record<string, DialogueLineKind> = {
    user: "user",
    system: "system",
    action: "action",
    trigger: "trigger",
  };
  return raw.map((d, i) => ({
    id: `dlg_${stepId}_${i}`,
    kind: kindMap[d.type] ?? "system",
    text: d.content,
  }));
}

function toApiCalls(stepId: string, raw: RawApi[] | undefined): ApiCall[] {
  if (!raw?.length) return [];
  return raw.map((a, i) => ({
    id: `api_${stepId}_${i}`,
    type: a.type,
    endpoint: a.endpoint,
    topic: a.topic,
    action: a.action,
    mockResponse: "",
  }));
}

function toStep(r: RawStep): Step {
  const id = `step_${r.n}`;
  const dialogueSequence = toDialogue(id, r.dialogue);
  return {
    id,
    name: r.name,
    systemName: r.systemName,
    order: r.n,
    systemPrompt: r.systemPrompt,
    inputData: fakeDataFrom(r.inputData),
    videoId: r.videoId ?? "",
    videoUrl: "",
    apiCalls: toApiCalls(id, r.apiCalls),
    dialogueSequence: dialogueSequence.length > 0 ? dialogueSequence : undefined,
    color: DEMO1_STEP_COLORS[(r.n - 1) % DEMO1_STEP_COLORS.length],
  };
}

/** Sample content: sequential ERP → manufacturing → anomaly → rescheduling (Hannover Messe–style demo). */
const RAW_STEPS: RawStep[] = [
  {
    n: 1,
    name: "ERP - Order Initiation",
    systemName: "ERP",
    videoId: "ID_5",
    systemPrompt:
      "Action a4m: reset/start. ERP triggers a new order for manufacturing standard size 10 midsoles",
    inputData: {
      order_type: "high_priority_customized_mid_sole",
      order_size: 10,
      priority: "high",
    },
  },
  {
    n: 2,
    name: "ERP - Order to Opcenter",
    systemName: "ERP",
    systemPrompt:
      "ERP order is sent to Opcenter: 'Requesting orders, rearranging...'",
    inputData: {
      order_id: "ORD-2026-001",
      destination_system: "Opcenter",
      status: "sent",
    },
    apiCalls: [
      {
        type: "REST",
        endpoint: "/opcenter/api/orders",
        action: "Send order to Opcenter scheduling",
      },
    ],
  },
  {
    n: 3,
    name: "Opcenter - BOP Adaptation",
    systemName: "OC (Opcenter)",
    videoId: "ID_3",
    systemPrompt:
      "Adapt BOP (Bill of Operations) to the needed size and for a specific line. A4M: 'Requesting schedule change from Opcenter'",
    inputData: {
      product_size: 10,
      production_line: 1,
      material_specs: "midsole_standard_10",
    },
    apiCalls: [
      {
        type: "OPC-UA",
        endpoint: "opc://opcenter.siemens.local/bop",
        action:
          "Adapt BOP for size 10 midsoles on production line 1",
      },
    ],
    dialogue: [
      {
        type: "system",
        content:
          "Opcenter Copilot shows adapting production BOP to manufacture the size 10 midsoles to be produced on production line 1",
      },
    ],
  },
  {
    n: 4,
    name: "NX - 3D Printer Nesting",
    systemName: "NX",
    videoId: "ID_4",
    systemPrompt:
      "System performs 3D printer nesting. A4M: 'Trigger: renesting from NX. AM integrating customized sole in printing'",
    inputData: {
      product_models: ["midsole_model_10_v1", "midsole_model_10_v2"],
      printer_bed_optimization: "optimal_space_usage",
      nesting_algorithm: "3d_spatial",
    },
    apiCalls: [
      {
        type: "REST",
        endpoint: "/nx/api/nesting",
        action:
          "Perform 3D printer nesting - arranging multiple midsole models on the print bed for optimal space usage",
      },
    ],
    dialogue: [
      {
        type: "system",
        content:
          "NX interface showing 3D printer nesting - arranging multiple midsole models on the print bed",
      },
      { type: "action", content: "Production Slot identified (Build Job XYZ, Printer XYZ)" },
      { type: "action", content: "NX: Animation of printing progress bar" },
      { type: "action", content: "Agent: Identifying retestable Volume" },
      { type: "action", content: "NX: Highlighting upper Half of Midsoles" },
      { type: "action", content: "Agent: Starting re-nesting" },
      { type: "action", content: "Agent: re-nesting finished" },
      { type: "action", content: "Agent: Updating Print file" },
      { type: "action", content: "NX: EOS Integration" },
      { type: "action", content: "Agent: Updated Print job resumed" },
    ],
  },
  {
    n: 5,
    name: "A4M - Production Status Display",
    systemName: "A4M",
    videoId: "ID_5",
    systemPrompt:
      "Display last state message 'rescheduling finished. Continuous operations ongoing'. A4M -> switch middle screen to Insight Hub video 'OEE Dashboard'",
    inputData: {
      system_status: "rescheduling_finished",
      operations_mode: "continuous",
      dashboard_type: "OEE",
    },
    dialogue: [
      {
        type: "system",
        content:
          "IH-OEE LONG Dashboard video with some fancy data in repeat loop!!!",
      },
    ],
  },
  {
    n: 6,
    name: "A4M - Trigger Second Flow (Anomaly Detection)",
    systemName: "A4M",
    systemPrompt:
      "NEW TRIGGER for A4M: Switch to drone parts. During normal manufacturing, IH detects a machine failure. A4M: 'Anomaly in nitting process detected'",
    inputData: {
      trigger_type: "anomaly_detection",
      process: "nitting",
      severity: "machine_failure",
      alternate_product: "drone_parts",
    },
    apiCalls: [
      {
        type: "MQTT",
        topic: "factory/anomaly/detection",
        action: "Trigger anomaly detection for machine failure",
      },
    ],
    dialogue: [
      {
        type: "trigger",
        content: "Machine failure detected in nitting process",
      },
    ],
  },
  {
    n: 7,
    name: "IH - Anomaly Detection Alert",
    systemName: "IH (Insights Hub)",
    systemPrompt:
      "IH dashboard showing anomaly detection alert pending machine failure flagged. Operator using IH-Copilot to troubleshoot. Result: 1) Opcenter APS: rescheduling needed, Copilot takes care of it. 2) IH sending alert to the Accenture Orchestrator",
    inputData: {
      alert_type: "machine_failure",
      alert_status: "pending",
      systems_affected: ["Opcenter", "APS"],
      action_required: "rescheduling",
    },
    apiCalls: [
      {
        type: "REST",
        endpoint: "/ih/api/alerts",
        action: "Send machine failure alert to Accenture Orchestrator",
      },
    ],
    dialogue: [
      {
        type: "system",
        content:
          "IH dashboard showing anomaly detection alert pending machine failure flagged",
      },
      { type: "action", content: "Operator using IH-Copilot to troubleshoot" },
    ],
  },
  {
    n: 8,
    name: "A4M - Orchestrator Alert & Mitigation Calculation",
    systemName: "A4M",
    systemPrompt:
      "IH alerts the Accenture Orchestrator application about the pending failure. A4M: 'Calculating mitigation possibility to compensate line failures'. Show possibility to change to drone part manufacturing. Opcenter video with human in the loop! [CONFIRM, Apply Button or similar]. State Change - BIG SCREEN - 'how to finish? Wait for call back [State - Fall back option]'",
    inputData: {
      failure_type: "machine_failure_nitting",
      mitigation_strategy: "switch_to_drone_parts",
      human_approval_required: true,
      fallback_option: "wait_for_callback",
    },
    apiCalls: [
      {
        type: "REST",
        endpoint: "/orchestrator/api/mitigation",
        action:
          "Calculate mitigation possibility to compensate line failures",
      },
    ],
    dialogue: [
      { type: "action", content: "Show BOP / CAD image" },
      { type: "action", content: "Opcenter video with human in the loop" },
      {
        type: "user",
        content:
          "CONFIRM or Apply Button (YES selected, left side no trigger - we only use YES)",
      },
      {
        type: "action",
        content:
          "State Change - BIG SCREEN - 'How to finish? Wait for call back [State - Fall back option]'",
      },
    ],
  },
  {
    n: 9,
    name: "A4M - Rescheduling for Drone Parts",
    systemName: "A4M",
    systemPrompt:
      "After YES: 'Rescheduling for drone part manufacturing'. Trigger Opcenter video with new BOP for drone manufacturing",
    inputData: {
      new_product: "drone_parts",
      action: "rescheduling",
      bop_type: "drone_manufacturing",
    },
    apiCalls: [
      {
        type: "OPC-UA",
        endpoint: "opc://opcenter.siemens.local/rescheduling",
        action:
          "Reschedule for drone part manufacturing with new BOP",
      },
    ],
    dialogue: [
      {
        type: "system",
        content: "Opcenter video with new BOP for drone manufacturing",
      },
    ],
  },
  {
    n: 10,
    name: "NX AM - 3D Nesting for Drone Parts",
    systemName: "NX AM",
    videoId: "ID_10_1, ID_10_2",
    systemPrompt:
      "System performs 3D nesting of drone parts. Agent: Nested parts. NX: Start nesting, Agent: Nesting finished, Agent: Creating print file, NX: EOS Integration",
    inputData: {
      product: "drone_parts",
      nesting_type: "3d_spatial",
      printer_integration: "eos",
    },
    apiCalls: [
      {
        type: "REST",
        endpoint: "/nx/api/nesting",
        action: "Perform 3D nesting of drone parts",
      },
    ],
    dialogue: [
      {
        type: "action",
        content: "Production Slot identified (Build Job XYZ, Printer XYZ)",
      },
      { type: "action", content: "NX: Start nesting" },
      { type: "action", content: "Agent: Nesting finished" },
      { type: "action", content: "Agent: Creating print file" },
      { type: "action", content: "NX: EOS Integration" },
    ],
  },
  {
    n: 11,
    name: "AC - Final State Display",
    systemName: "AC",
    systemPrompt:
      "Display last state message 'rescheduling finished. Continuous operations ongoing'. A4M -> switch middle screen to Insight Hub video 'OEE Dashboard'",
    inputData: {
      system_status: "rescheduling_finished",
      operations_mode: "continuous",
      dashboard_type: "OEE",
    },
    dialogue: [
      {
        type: "system",
        content:
          "IH-OEE LONG Dashboard video with some fancy data in repeat loop!!!",
      },
    ],
  },
];

function linearConnections(stepIds: string[]): Connection[] {
  const out: Connection[] = [];
  for (let i = 0; i < stepIds.length - 1; i++) {
    const from = stepIds[i]!;
    const to = stepIds[i + 1]!;
    out.push({
      id: `conn_${from}_${to}`,
      from,
      to,
      type: "linear",
      condition: null,
    });
  }
  return out;
}

const steps = RAW_STEPS.map(toStep);
const stepIds = steps.map((s) => s.id);

export const demo1FlowDocument: FlowDocument = {
  flowMetadata: {
    name: "Example: Hannover Messe operations (AI orchestration)",
    version: "v1.2",
    mode: "linear",
    description:
      "Sample 11-step flow (trade-show style): order → manufacturing → anomaly → rescheduling. Use it as a template — swap in your own agents and tools.",
  },
  steps,
  connections: linearConnections(stepIds),
  textNodes: [],
};

/** Horizontal layout for the linear chain (left → right); spacing fits step width + edges. */
export function demo1NodePositions(): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  const baseX = 80;
  const baseY = 120;
  const dx = 400;
  for (let i = 0; i < stepIds.length; i++) {
    pos[stepIds[i]!] = { x: baseX + i * dx, y: baseY };
  }
  return pos;
}
