from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import GraphPayload, ResolutionRequest, SimulationEvent, ScenarioConfig
from typing import List
from .engine import engine

app = FastAPI(title="CodeContextVisualizer", description="Iron Man style CAD for Software")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Service Operational", "status": "Online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/graph", response_model=GraphPayload)
async def get_graph():
    return engine.get_graph()

@app.post("/api/resolve", response_model=GraphPayload)
async def resolve_ambiguity(request: ResolutionRequest):
    try:
        engine.resolve_ambiguity(request.ambiguity_id, request.option_id)
        return engine.get_graph()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/simulate", response_model=List[SimulationEvent])
async def simulate_scenario():
    return engine.simulate_traffic()

@app.post("/api/simulate", response_model=List[SimulationEvent])
async def simulate_scenario_custom(config: ScenarioConfig):
    return engine.simulate_traffic(config)
