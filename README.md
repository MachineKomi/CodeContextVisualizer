# Code Context Visualizer ("Iron Man" CAD for Software)

An immersive, 3D interactive design tool for software architecture. It moves beyond static UML diagrams to provide a "semantic layer" where architects can visualize complexity, resolve ambiguity iteratively, and simulate traffic/failure scenarios before writing a single line of code.

![Project Status](https://img.shields.io/badge/Status-MVP_Complete-green)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI_|_React_|_Three.js-blue)

## 🚀 Vision
Built as an experiment in **"Agentic Coding"**, this project aims to replicate the "Iron Man/Jarvis" design experience:
1.  **Visual**: Semantic 3D graph (Nodes/Edges) representing abstract components.
2.  **Interactive**: Native handling of "Ambiguity" notes that block progress until resolved by the human-in-the-loop.
3.  **Simulation**: Configurable traffic simulation (latency, error rates, chaos monkey) to test architectural resilience.

## ✨ Features
-   **3D Radial Visualization**: Built with `React Three Fiber`, styled with "Space Grotesk" for a futuristic HUD aesthetic.
-   **Ambiguity Resolution Loop**: A dedicated workflow where "Ambiguity Nodes" (Red) must be clicked and resolved into concrete components.
-   **Live Simulation Engine**:
    -   Visualizes packet flow with particles.
    -   Configurable **Error Rate** and **Latency** via HUD sliders.
    -   Visual feedback for dropped packets (Red flash on failure).
-   **Interactive HUD**: Overlay system for node details and simulation controls.

## 🛠️ Tech Stack
-   **Backend**: Python, FastAPI, NetworkX (Graph Logic).
-   **Frontend**: React, Vite, Three.js (`@react-three/fiber`), HTML/CSS HUD.

## 📦 Installation

### Prerequisites
-   Python 3.8+
-   Node.js 16+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
# Run the server
python -m uvicorn main:app --reload
```
API runs at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
# Run the development server
npm run dev
```
Frontend runs at `http://localhost:5173`.

## 🎮 Usage Guide
1.  **Launch**: Start both Backend and Frontend terminals.
2.  **Explore**: Open the Web UI. You will see a "Build a Bike" seed graph.
3.  **Resolve**: Locate the Red "Ambiguity" node ("Type of Bike?"). Click it and choose "Motorcycle".
4.  **Simulate**: Use the timeline controls on the right.
    -   Adjust **Error Rate** to 0.5 (50%).
    -   Click **Run Simulation**.
    -   Watch particles flow and nodes flash red upon error.

## 🤝 Collaboration
This project was built via an autonomous collaboration between two AI Agents:
-   **Antigravity** (Backend/Architecture/Coordination)
-   **GPT5.2-Codex** (Frontend/Visualization/UX)

See [COLLABORATION_LOG.MD](./COLLABORATION_LOG.MD) for the full history of their interaction.
