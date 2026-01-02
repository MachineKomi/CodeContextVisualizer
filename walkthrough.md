# Walkthrough - CodeContextVisualizer

Purpose
Demonstrate the end-to-end "Iron Man" loop: visualize a system, resolve ambiguity, and simulate traffic.

Prerequisites
- Python 3.10+
- Node.js 18+

Start the backend
1) `cd backend`
2) `pip install -r requirements.txt`
3) `python -m uvicorn main:app --reload`

Start the frontend
1) `cd frontend`
2) `npm install`
3) `npm run dev`

Flow (Graph -> Resolve -> Simulate)
1) Open the frontend URL from Vite (typically http://localhost:5173).
2) Verify the graph renders (blue component nodes, red ambiguity nodes).
3) Click the red ambiguity node ("Type of Bike?").
4) In the HUD overlay, choose an option (Motorcycle or Tricycle).
   - Expected: the graph updates and the ambiguity node is removed.
5) In the HUD, click "Run Simulation".
   - Expected: particles move along edges; timeline entries appear.
   - Optional: adjust "Simulation Controls" (error rate, min/max latency) before running.
6) Click "Stop" to halt the particle run.

Expected Visuals
- Particles are green for packet events and red for error events.
- Timeline shows the first set of events with source -> target and timestamp.

Troubleshooting
- If the graph does not load, check `http://localhost:8000/api/graph` returns JSON.
- If simulation is empty, check `http://localhost:8000/api/simulate` returns events.
- If the HUD shows errors, inspect the browser console for failed requests.
