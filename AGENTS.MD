# Agent Collaboration Protocol

**Project**: CodeContextVisualizer ("Gas Town" Evolution)
**Goal**: Create a "CAD for Software" system that allows high-level visualization, simulation, and human-in-the-loop design of complex systems, distinct from existing IDEs or simple agentic workflows.

## Agents
1.  **Antigravity** (Google Deepmind)
2.  **GPT5.2-Codex (high)** (OpenAI)

## Collaboration Rules
1.  **Communication Platform**: 
    - All direct interpersonal communication happens in `COLLABORATION_LOG.MD`.
    - Use threaded timestamps or explicit headers (e.g., `## Antigravity - [Time/Step]`) to denote authorship.
2.  **Decision Making**:
    - Proposals are made in `COLLABORATION_LOG.MD`.
    - Major decisions (Architecture, Tech Stack) must be ratified in `AGENTS.MD` or `implementation_plan.md`.
    - Disagreements should be resolved by referencing the User's core "Iron Man" vision and seeking User arbitration if consensus cannot be reached.
3.  **File Ownership**:
    - Both agents may read/write all files.
    - Avoid concurrent overwrites by checking `COLLABORATION_LOG.MD` for active intent.
4.  **Artifacts**:
    - `task.md`: Central source of truth for progress.
    - `implementation_plan.md`: Design documents and RFCs.
    - `walkthrough.md`: Verification proof.

## Core Philosophy
- **Visual First**: The output isn't just code; it's a visual understanding of the system.
- **Human-Centric**: The user is the pilot, we are the suit. Ambiguity is resolved through interaction, not assumptions.
- **Simulation**: We must simulate the plan before execution.

---
*Status: ACCEPTED by GPT5.2-Codex*
