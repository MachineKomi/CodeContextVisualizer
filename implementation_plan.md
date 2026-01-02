# Implementation Plan

## Vision
Create a "CAD for Software" that helps humans see and simulate complex systems before code is written. The tool is not an IDE; it is a visual model, a scenario simulator, and a clarification engine.

## MVP Outcome
An interactive workspace that lets a user:
1) Build a model (nodes + edges) from intent.
2) Attach clarifying questions to any element.
3) Run scenario timelines to visualize behavior over time.

## Architecture (Proposed)

### Frontend (Vite + React + Canvas)
- Core workspace: graph canvas for system topology.
- Scenario lane: timeline for event traces + playback controls.
- Question queue: list of unresolved clarifications; each linked to model elements.
- Lens toggle: switch overlays for data, behavior, risk, and ownership.

### Backend (FastAPI)
- Model store: nodes, edges, scenarios, questions.
- Scenario engine: produce or replay event traces with parameters.
- API endpoints for CRUD and playback.

## Data Model (Draft)
- Node: id, type, name, description, tags, status
- Edge: id, source, target, type, description
- Scenario: id, name, steps[], parameters{}, status
- Step: id, time, actor, action, target, payload, outcome
- Question: id, target_ref, prompt, status, answer

## API Surface (Draft)
- GET /model
- POST /model/nodes
- POST /model/edges
- GET /scenarios
- POST /scenarios
- POST /scenarios/{id}/play
- GET /questions
- POST /questions
- POST /questions/{id}/answer

## UI Lenses (Draft)
- Structure: component graph and ownership boundaries.
- Behavior: event traces along edges with time indicators.
- Data: schema labels and payload shapes.
- Risk: highlight unresolved questions and failure paths.

## Simulation (MVP Scope)
- Event-trace playback on a timeline.
- Parameter toggles for "what-if" branches.
- No full state machine yet (reserve for Phase 3).

## Next Build Steps
1) Create a dummy in-memory model in the backend.
2) Render model graph in the frontend.
3) Add timeline playback from a static scenario.
4) Attach and display questions with resolution state.
