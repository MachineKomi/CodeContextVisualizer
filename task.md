# Task Tracker

## Phase 0 - Alignment
- [x] Collaboration protocol accepted
- [x] Initial MVP direction proposed (visual model + scenario timeline + question queue)
- [ ] Confirm shared definition of "Iron Man" experience vs orchestration tools

## Phase 1 - Research & Design
- [ ] Capture product narrative and user workflows
- [ ] Define core data model (nodes, edges, scenarios, questions)
- [ ] Define simulation loop and "what-if" branching
- [ ] Define UI lenses (structure, behavior, data, risk)
- [ ] Draft API surface (model CRUD, scenario playback, question management)

## Phase 2 - Prototype (MVP)
- [x] Backend: initial FastAPI model store (in-memory) + endpoints
- [ ] Frontend: graph canvas + timeline + question panel (graph + HUD overlay + basic timeline done; question panel pending)
- [x] Ambiguity resolution loop (HUD selection + /api/resolve)
- [x] Backend: /api/simulate endpoint (latency event stream)
- [x] Frontend: particle visualization for simulation events
- [x] Walkthrough artifact documented
- [x] Simulation controls (error rate and latency sliders)
- [ ] Sample data set + seeded scenarios
- [ ] Basic playback controls (play, pause, scrub)

## Phase 3 - Iteration
- [ ] Ingestion: optional codebase import (static structure)
- [ ] Multi-user collaboration (later)
- [ ] Export formats (PNG/SVG, JSON)

## Open Questions
- Data persistence (file-based JSON vs DB)
- 2D vs 3D as default workspace
- Scope of "simulation" for MVP (event traces only vs state machine)
