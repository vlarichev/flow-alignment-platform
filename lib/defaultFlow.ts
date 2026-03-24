import type { FlowDocument } from "./types";

export const defaultFlow: FlowDocument = {
  flowMetadata: {
    name: "Hannover Messe - 5min Demo",
    version: "v1.0",
    mode: "linear",
    description: "Short linear flow for trade show booth",
  },
  steps: [
    {
      id: "step_1",
      name: "Normal Operations",
      order: 1,
      systemPrompt:
        "Monitor 4 machines. All healthy. Report utilization.",
      inputData: {
        fakeData: {
          machine_am01_utilization: 75,
          machine_am02_utilization: 82,
          machine_am03_utilization: 70,
          machine_post_utilization: 68,
        },
      },
      videoId: "1",
      videoUrl: "https://a4m.com/video/1",
      apiCalls: [],
      color: "#3b82f6",
    },
    {
      id: "step_2",
      name: "Incident Triggered",
      order: 2,
      systemPrompt:
        "Thermal sensor fault detected on AM-01. Analyze impact.",
      inputData: {
        fakeData: {
          fault_machine: "AM-01",
          fault_type: "thermal_sensor",
          current_workload: 5,
          orders_at_risk: 2,
        },
      },
      videoId: "2",
      videoUrl: "https://a4m.com/video/2",
      color: "#f59e0b",
      apiCalls: [
        {
          id: "api_opc_read",
          type: "OPC-UA",
          endpoint: "opc://plc.siemens.local/factory",
          action: "Read current machine states",
          mockResponse:
            "AM-01 utilization dropped to 0%, AM-02 at 82%, AM-03 at 70%",
        },
      ],
      dialogueSequence: [
        {
          id: "dlg_ex_1",
          kind: "system",
          text: "Incident detected. Should I reschedule?",
        },
        { id: "dlg_ex_2", kind: "user", text: "Yes do, please." },
        { id: "dlg_ex_3", kind: "action", text: "Start Video 2" },
        {
          id: "dlg_ex_4",
          kind: "system",
          text: "Starting rescheduling.",
        },
      ],
    },
    {
      id: "step_3",
      name: "AI Reasoning",
      order: 3,
      systemPrompt:
        "Evaluate 3 options: redistribute to AM-02, redistribute to AM-03, pause. Recommend best option.",
      inputData: {
        fakeData: {
          available_capacity_am02: 18,
          available_capacity_am03: 30,
          transfer_time_minutes: 5,
        },
      },
      videoId: "3_1",
      videoUrl: "https://a4m.com/video/3_1",
      color: "#8b5cf6",
      apiCalls: [
        {
          id: "api_http_a4m",
          type: "REST",
          endpoint: "http://a4m.local/reason",
          action: "Send workload scenario to A4M agent",
          mockResponse:
            "Recommended action: redistribute 5 units to AM-03 (highest capacity, 12min completion)",
        },
      ],
      substeps: [
        {
          id: "step_3_1",
          videoId: "3_1",
          description: "Reasoning Phase 1: Problem Analysis",
        },
        {
          id: "step_3_2",
          videoId: "3_2",
          description: "Reasoning Phase 2: Solution Evaluation",
        },
        {
          id: "step_3_3",
          videoId: "3_3",
          description: "Reasoning Phase 3: Recommendation",
        },
      ],
    },
    {
      id: "step_4",
      name: "Execution",
      order: 4,
      systemPrompt: "Execute workload redistribution to AM-03.",
      inputData: {
        fakeData: {
          action_approved: true,
          target_machine: "AM-03",
          units_to_transfer: 5,
        },
      },
      videoId: "4",
      videoUrl: "https://a4m.com/video/4",
      color: "#10b981",
      apiCalls: [
        {
          id: "api_mqtt_publish",
          type: "MQTT",
          topic: "factory/AM-03/workload",
          action: "Publish new workload (5 units)",
          mockResponse:
            "Message published. AM-03 will process units in ~12 minutes.",
        },
        {
          id: "api_opc_write",
          type: "OPC-UA",
          endpoint: "opc://plc.siemens.local/factory",
          action: "Write workload change to Opcenter",
          mockResponse:
            "Opcenter updated. AM-01 now idle, AM-03 at 94% utilization.",
        },
      ],
    },
  ],
  connections: [
    {
      id: "c1",
      from: "step_1",
      to: "step_2",
      type: "linear",
      condition: null,
    },
    {
      id: "c2",
      from: "step_2",
      to: "step_3",
      type: "linear",
      condition: null,
    },
    {
      id: "c3",
      from: "step_3",
      to: "step_4",
      type: "linear",
      condition: null,
    },
  ],
  textNodes: [],
};

export function defaultNodePositions(): Record<
  string,
  { x: number; y: number }
> {
  return {
    step_1: { x: 80, y: 120 },
    step_2: { x: 80, y: 280 },
    step_3: { x: 80, y: 440 },
    step_4: { x: 80, y: 600 },
  };
}
