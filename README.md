# Interactive flow alignment platform

A web application for **cross-team alignment** on **user flows** and **interaction patterns**. Instead of scattered documents and ad hoc diagrams, teams share one interactive model: what happens step by step, how the system and user talk to each other, and how branches fit together.

---

## The problem

- **Product, UX, engineering, and operations** often mean slightly different things when they say “the flow.” Requirements live in docs, Figma, tickets, and heads—and drift from what gets built.
- **Linear text** is a weak way to express **order, branching, and dialogue**. Reviewers miss edge cases; stakeholders cannot “walk” the experience together.
- **Handoffs** lose nuance: API touchpoints, prompts, and fake data for demos are described separately from the journey, so alignment meetings repeat the same clarifications.

---

## What we are building toward

A **single place** where a flow is both **a diagram** (structure) and **a specification** (content): steps, connections, optional dialogue lines (user, system, trigger, action), prompts, APIs, and sample data—so everyone points at the same artifact.

**Today**, the app encodes opinionated concepts (steps, connections, a lightweight simulator) in a fixed schema. **Next**, we intend to make much of this **configurable**—so different teams can map their own terminology, fields, and export formats without forking the product.

---

## How this version helps

| Capability | Purpose |
|------------|---------|
| **Visual flow editor** | Build and rearrange steps on a canvas; connect them with typed links (linear, conditional, loop). |
| **Step detail** | Attach system prompts, video references, API call definitions, structured input data, and an **in-step dialogue sequence** to mock conversations and actions. |
| **Canvas notes** | Free-form labels for areas of the diagram that are not simulation steps. |
| **Simulator** | Walk through the flow and pick branches to sanity-check structure before implementation. |
| **Persistence** | Work is saved in the browser (local storage) and can be exported or imported as JSON for sharing and review. |

The goal is not to replace your ticketing or design tools, but to give **review sessions** a shared, interactive backbone: “this is the flow we agreed on.”

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

## Project status

This repository is an **early, product-shaped prototype**: the domain model and UI will evolve, especially as we add **configuration** and tighter integration with your team’s workflows. Feedback from real alignment sessions should drive what gets built next.
