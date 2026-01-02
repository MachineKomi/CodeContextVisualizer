import networkx as nx
from .models import GraphPayload, Node, Edge, SimulationEvent, ScenarioConfig
import uuid
import random
import time
from typing import List

class SemanticEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._seed_demo_data()

    def _seed_demo_data(self):
        """Seeds the graph with the 'Bike' example."""
        # Root Idea
        root_id = "root_bike"
        self.graph.add_node(root_id, type="component", label="Build a Bike", status="draft")

        # Ambiguity Node
        amb_id = "ambiguity_type"
        self.graph.add_node(amb_id, type="ambiguity", label="Type of Bike?", status="clarification_needed")
        self.graph.add_edge(root_id, amb_id, type="clarifies")

        # Options
        self.graph.add_node("opt_motor", type="note", label="Motorcycle", status="draft")
        self.graph.add_node("opt_tri", type="note", label="Tricycle", status="draft")
        
        self.graph.add_edge(amb_id, "opt_motor", type="contains")
        self.graph.add_edge(amb_id, "opt_tri", type="contains")

    def get_graph(self) -> GraphPayload:
        nodes = []
        for n, attrs in self.graph.nodes(data=True):
            nodes.append(Node(id=n, **attrs))
        
        edges = []
        for u, v, attrs in self.graph.edges(data=True):
            edges.append(Edge(source=u, target=v, **attrs))
            
        return GraphPayload(nodes=nodes, edges=edges)

    def add_node(self, label: str, type: str = "component"):
        node_id = str(uuid.uuid4())[:8]
        self.graph.add_node(node_id, label=label, type=type, status="draft")
        return node_id

    def resolve_ambiguity(self, ambiguity_id: str, option_id: str):
        """
        Resolves an ambiguity by:
        1. Verifying the option is valid for this ambiguity.
        2. promoting the option to a component.
        3. Removing the ambiguity node and rejected options.
        4. Connecting the parent of the ambiguity to the chosen option.
        """
        if not self.graph.has_node(ambiguity_id) or not self.graph.has_node(option_id):
            raise ValueError("Invalid ID")
        
        # Find parent of ambiguity (who asked?)
        parents = [u for u, v in self.graph.in_edges(ambiguity_id)]
        
        # Promote option
        self.graph.nodes[option_id]['type'] = 'component'
        self.graph.nodes[option_id]['status'] = 'approved'
        
        # Re-link parents to new option
        for p in parents:
            self.graph.add_edge(p, option_id, type="depends_on")
            
        # Clean up interaction
        # Find all options attached to this ambiguity
        options = [v for u, v in self.graph.out_edges(ambiguity_id) if self.graph.nodes[v].get('type') == 'note']
        
        # Remove ambiguity node
        self.graph.remove_node(ambiguity_id)
        
        # Remove rejected options
        for opt in options:
            if opt != option_id:
                self.graph.remove_node(opt)



    def simulate_traffic(self, config: ScenarioConfig = None) -> List[SimulationEvent]:
        """
        Generates a mock 'scenario' of traffic flowing through the system.
        It traverses the graph from the root and assigns timestamps.
        """
        if config is None:
            config = ScenarioConfig()

        events = []
        # Find root
        roots = [n for n, d in self.graph.in_degree() if d == 0]
        if not roots:
            return []

        # BFS for simplicity
        queue = [(roots[0], 0.0)] # node_id, current_time
        visited = set()

        while queue:
            current_id, current_time = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)

            # Find children
            children = [v for u, v in self.graph.out_edges(current_id)]
            
            for child in children:
                # Calculate 'latency'
                latency = random.uniform(config.min_latency, config.max_latency)
                arrival_time = current_time + latency
                
                # Check for 'error' (random chaos monkey)
                if random.random() < config.error_rate:
                    events.append(SimulationEvent(
                        source=current_id,
                        target=child,
                        timestamp=arrival_time,
                        duration=latency,
                        type="error",
                        details="Timeout" if config.include_details else None
                    ))
                else:
                    events.append(SimulationEvent(
                        source=current_id,
                        target=child,
                        timestamp=arrival_time,
                        duration=latency,
                        type="packet"
                    ))
                    queue.append((child, arrival_time))
        
        return sorted(events, key=lambda x: x.timestamp)

engine = SemanticEngine()
