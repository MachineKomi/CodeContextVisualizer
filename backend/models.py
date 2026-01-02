from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal

class Node(BaseModel):
    id: str
    type: Literal["component", "class", "function", "ambiguity", "note"]
    label: str
    description: Optional[str] = None
    status: Literal["draft", "clarification_needed", "approved"] = "draft"
    metadata: Dict[str, str] = Field(default_factory=dict)

class Edge(BaseModel):
    source: str
    target: str
    type: Literal["depends_on", "calls", "contains", "clarifies"]
    description: Optional[str] = None

class ResolutionRequest(BaseModel):
    ambiguity_id: str
    option_id: str

class SimulationEvent(BaseModel):
    source: str
    target: str
    timestamp: float
    duration: float
    type: Literal["packet", "error"]
    type: Literal["packet", "error"]
    details: Optional[str] = None

class ScenarioConfig(BaseModel):
    error_rate: float = 0.1
    min_latency: float = 0.5
    max_latency: float = 2.0
    include_details: bool = True

class GraphPayload(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
