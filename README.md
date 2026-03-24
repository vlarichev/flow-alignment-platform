# Agentic Workflow Builder

A web app for **designing, testing, and refining agentic workflows** — the kind of multi-step flows where users, systems, tools, and LLMs interact in sequence and branch. Think **Postman for the agentic age**: one place to map the journey, attach prompts and API shapes, and walk a **simulator** before you wire up real models.

The **Hannover Messe** scenario in the repo is a **sample flow** (operations → manufacturing → rescheduling) to show how the product works — not the product name.

---

## Why this exists

- **Flows are hard to review in prose.** Order, branching, and dialogue are easier to align on when everyone sees the same interactive diagram.
- **Agent workflows** mix **steps**, **prompts**, **API calls**, and **sample payloads**. Keeping that next to the graph reduces drift between “what we agreed” and what gets built.
- **Simulation today** is structural: walk branches and inspect mock data. **Next**, we plan to plug in **LLM runs**, **model selection**, and richer execution — this codebase is shaped so that layer can land without throwing away the editor.

---

## What you can do today

| Capability | Purpose |
|------------|---------|
| **Visual workflow editor** | Build steps on a canvas; connect them (linear, conditional, loop). |
| **Step detail** | System prompts, video refs, API call definitions, structured input data, and **in-step dialogue** (user / system / trigger / action). |
| **Canvas notes** | Free-form labels for areas of the diagram that are not simulation steps. |
| **Simulator** | Step through the flow and sanity-check structure and payloads (mock / preview). |
| **Persistence** | Work saved in the browser (local storage); export/import JSON for sharing. |

---

## Tech stack

- **Next.js** (App Router), **React**, **TypeScript**
- **Tailwind CSS** and **shadcn/ui**-style components
- **React Flow** (`@xyflow/react`) for the graph
- **Zustand** for client state

---

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:3000`).

```bash
npm run build
npm start
```

Production build and run.

---

## Roadmap (directional)

- Deeper **LLM integration** for simulations, **model pickers**, and optional live runs against your stack.
- More **export** and **team** workflows as usage grows.

Feedback from real design and review sessions should drive what ships next.
