import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'

function MovingParticle({ start, end, startTime, duration, color }) {
    const meshRef = useRef(null)

    useFrame(() => {
        if (!meshRef.current) return
        const now = performance.now()
        const progress = (now - startTime) / duration

        if (progress < 0 || progress > 1) {
            meshRef.current.visible = false
            return
        }

        meshRef.current.visible = true
        const x = start[0] + (end[0] - start[0]) * progress
        const y = start[1] + (end[1] - start[1]) * progress
        const z = start[2] + (end[2] - start[2]) * progress
        meshRef.current.position.set(x, y, z)
    })

    return (
        <mesh ref={meshRef} visible={false}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
    )
}

function NodeSphere({ position, color, isSelected, onSelect, flashWindows }) {
    const meshRef = useRef(null)

    useFrame(() => {
        if (!meshRef.current) return
        if (!flashWindows || flashWindows.length === 0) {
            if (meshRef.current.material.emissiveIntensity !== 0) {
                meshRef.current.material.emissiveIntensity = 0
            }
            return
        }

        const now = performance.now()
        const isFlashing = flashWindows.some(([start, end]) => now >= start && now <= end)
        const intensity = isFlashing ? 1.6 : 0

        if (meshRef.current.material.emissiveIntensity !== intensity) {
            meshRef.current.material.emissiveIntensity = intensity
        }
    })

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={isSelected ? 1.25 : 1}
            onPointerDown={onSelect}
        >
            <sphereGeometry args={[0.45, 32, 32]} />
            <meshStandardMaterial color={color} emissive="#ff5c5c" emissiveIntensity={0} />
        </mesh>
    )
}

function App() {
    const [graph, setGraph] = useState({ nodes: [], edges: [] })
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState(null)
    const [selectedNodeId, setSelectedNodeId] = useState(null)
    const [actionStatus, setActionStatus] = useState('idle')
    const [actionError, setActionError] = useState(null)
    const [simulationEvents, setSimulationEvents] = useState([])
    const [simulationStatus, setSimulationStatus] = useState('idle')
    const [simulationError, setSimulationError] = useState(null)
    const [simulationStartTime, setSimulationStartTime] = useState(null)
    const [simulationConfig, setSimulationConfig] = useState({
        errorRate: 0.1,
        minLatency: 0.5,
        maxLatency: 2.0,
        includeDetails: true,
    })
    const simulationTimerRef = useRef(null)
    const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

    useEffect(() => {
        const controller = new AbortController()

        async function loadGraph() {
            try {
                const response = await fetch(`${baseUrl}/api/graph`, { signal: controller.signal })
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`)
                }
                const payload = await response.json()
                setGraph(payload)
                setStatus('ready')
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message)
                    setStatus('error')
                }
            }
        }

        loadGraph()

        return () => controller.abort()
    }, [])

    useEffect(() => {
        return () => {
            if (simulationTimerRef.current) {
                clearTimeout(simulationTimerRef.current)
            }
        }
    }, [])

    const nodeById = useMemo(() => {
        const lookup = new Map()
        graph.nodes.forEach((node) => lookup.set(node.id, node))
        return lookup
    }, [graph.nodes])

    const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : null

    const resolutionOptions = useMemo(() => {
        if (!selectedNode || selectedNode.type !== 'ambiguity') return []
        return graph.edges
            .filter((edge) => edge.source === selectedNode.id && edge.type === 'contains')
            .map((edge) => nodeById.get(edge.target))
            .filter(Boolean)
    }, [graph.edges, nodeById, selectedNode])

    const nodePositions = useMemo(() => {
        const positions = new Map()
        const count = graph.nodes.length || 1
        const radius = Math.max(4, count * 0.8)

        graph.nodes.forEach((node, index) => {
            const angle = (index / count) * Math.PI * 2
            const baseY = node.type === 'ambiguity' ? 1.5 : node.type === 'note' ? -1.2 : 0
            positions.set(node.id, [Math.cos(angle) * radius, baseY, Math.sin(angle) * radius])
        })

        return positions
    }, [graph.nodes])

    const typeColor = {
        component: '#4ea1ff',
        class: '#6dd19c',
        function: '#ffd166',
        ambiguity: '#ff5c5c',
        note: '#bdbdbd',
    }

    const simulationPalette = {
        ok: '#6dd19c',
        warn: '#ffd166',
        error: '#ff5c5c',
    }

    const getEventStatus = (event) => {
        if (event.status) return event.status
        if (event.type === 'error') return 'error'
        if (event.type === 'warn') return 'warn'
        return 'ok'
    }

    const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value))

    const updateErrorRate = (value) => {
        const nextValue = clampNumber(value, 0, 1)
        setSimulationConfig((prev) => ({ ...prev, errorRate: nextValue }))
    }

    const updateMinLatency = (value) => {
        setSimulationConfig((prev) => {
            const nextValue = clampNumber(value, 0.1, prev.maxLatency)
            return { ...prev, minLatency: nextValue }
        })
    }

    const updateMaxLatency = (value) => {
        setSimulationConfig((prev) => {
            const nextValue = clampNumber(value, prev.minLatency, 3.0)
            return { ...prev, maxLatency: nextValue }
        })
    }

    const normalizedEvents = useMemo(() => {
        if (!simulationStartTime) return []
        return simulationEvents
            .map((event, index) => {
                const start = nodePositions.get(event.source)
                const end = nodePositions.get(event.target)
                if (!start || !end) return null
                const timestamp = typeof event.timestamp === 'number' ? event.timestamp : 0
                const duration = typeof event.duration === 'number' ? event.duration : 1.5
                return {
                    id: event.id || `${event.source}-${event.target}-${index}`,
                    start,
                    end,
                    target: event.target,
                    startTime: simulationStartTime + timestamp * 1000,
                    duration: Math.max(0.2, duration) * 1000,
                    status: getEventStatus(event),
                }
            })
            .filter(Boolean)
    }, [nodePositions, simulationEvents, simulationStartTime])

    const timelineEvents = useMemo(() => {
        return [...simulationEvents]
            .filter((event) => typeof event.timestamp === 'number')
            .sort((a, b) => a.timestamp - b.timestamp)
    }, [simulationEvents])

    const errorFlashMap = useMemo(() => {
        const map = new Map()
        normalizedEvents.forEach((event) => {
            if (event.status !== 'error' || !event.target) return
            const flashStart = event.startTime + event.duration
            const flashEnd = flashStart + 500
            const windows = map.get(event.target) || []
            windows.push([flashStart, flashEnd])
            map.set(event.target, windows)
        })
        return map
    }, [normalizedEvents])

    const handleNodeSelect = (event, nodeId) => {
        event.stopPropagation()
        setSelectedNodeId(nodeId)
        setActionError(null)
    }

    const resolveAmbiguity = async (optionId) => {
        if (!selectedNode) return
        setActionStatus('resolving')
        setActionError(null)
        try {
            const response = await fetch(`${baseUrl}/api/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ambiguity_id: selectedNode.id,
                    option_id: optionId,
                }),
            })

            if (!response.ok) {
                throw new Error(`Resolve failed: ${response.status}`)
            }

            const payload = await response.json()
            setGraph(payload)
            setSelectedNodeId(null)
            setActionStatus('idle')
        } catch (err) {
            setActionError(err.message)
            setActionStatus('error')
        }
    }

    const runSimulation = async () => {
        setSimulationStatus('loading')
        setSimulationError(null)
        setSimulationStartTime(null)

        if (simulationTimerRef.current) {
            clearTimeout(simulationTimerRef.current)
        }

        try {
            const payloadConfig = {
                error_rate: simulationConfig.errorRate,
                min_latency: simulationConfig.minLatency,
                max_latency: simulationConfig.maxLatency,
                include_details: simulationConfig.includeDetails,
            }

            let response = await fetch(`${baseUrl}/api/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadConfig),
            })

            if (!response.ok) {
                if (response.status === 404 || response.status === 405) {
                    response = await fetch(`${baseUrl}/api/simulate`)
                }
            }

            if (!response.ok) {
                throw new Error(`Simulation failed: ${response.status}`)
            }

            const payload = await response.json()
            const events = Array.isArray(payload) ? payload : payload.events || []
            setSimulationEvents(events)
            const startTime = performance.now()
            setSimulationStartTime(startTime)
            setSimulationStatus('playing')

            const totalSeconds = events.reduce((maxValue, event) => {
                const timestamp = typeof event.timestamp === 'number' ? event.timestamp : 0
                const duration = typeof event.duration === 'number' ? event.duration : 1.5
                return Math.max(maxValue, timestamp + duration)
            }, 0)

            simulationTimerRef.current = setTimeout(() => {
                setSimulationStatus('idle')
            }, Math.max(1500, totalSeconds * 1000 + 400))
        } catch (err) {
            setSimulationError(err.message)
            setSimulationStatus('error')
        }
    }

    const stopSimulation = () => {
        if (simulationTimerRef.current) {
            clearTimeout(simulationTimerRef.current)
        }
        setSimulationStatus('idle')
        setSimulationEvents([])
        setSimulationStartTime(null)
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: 'radial-gradient(circle at top, #141b2d, #0b0f1a 60%)' }}>
            <Canvas
                camera={{ position: [0, 6, 14], fov: 55 }}
                onPointerMissed={() => setSelectedNodeId(null)}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.2} />
                {graph.edges.map((edge) => {
                    const start = nodePositions.get(edge.source)
                    const end = nodePositions.get(edge.target)
                    if (!start || !end) return null
                    return (
                        <Line
                            key={`${edge.source}-${edge.target}`}
                            points={[start, end]}
                            color="#2f415d"
                            lineWidth={1.5}
                        />
                    )
                })}
                {graph.nodes.map((node) => {
                    const position = nodePositions.get(node.id) || [0, 0, 0]
                    return (
                        <NodeSphere
                            key={node.id}
                            position={position}
                            color={typeColor[node.type] || '#888'}
                            isSelected={node.id === selectedNodeId}
                            onSelect={(event) => handleNodeSelect(event, node.id)}
                            flashWindows={errorFlashMap.get(node.id)}
                        />
                    )
                })}
                {normalizedEvents.map((event) => (
                    <MovingParticle
                        key={event.id}
                        start={event.start}
                        end={event.end}
                        startTime={event.startTime}
                        duration={event.duration}
                        color={simulationPalette[event.status] || simulationPalette.ok}
                    />
                ))}
                <OrbitControls />
            </Canvas>
            <div
                style={{
                    position: 'absolute',
                    top: 24,
                    left: 24,
                    color: '#e7eef8',
                    fontFamily: '"Space Grotesk", sans-serif',
                    maxWidth: 360,
                }}
            >
                <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 1 }}>CodeContextVisualizer</h1>
                <p style={{ margin: '8px 0 16px', color: '#9fb4d3' }}>
                    Visual CAD for software intent, ambiguity, and simulation.
                </p>
                <div style={{ fontSize: 14, color: '#9fb4d3' }}>
                    <strong style={{ color: '#e7eef8' }}>Status:</strong> {status}
                </div>
                {error && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#ff7b7b' }}>
                        {error}
                    </div>
                )}
            </div>
            <div
                style={{
                    position: 'absolute',
                    right: 24,
                    top: 24,
                    width: 240,
                    background: 'rgba(12, 17, 30, 0.7)',
                    border: '1px solid rgba(79, 110, 152, 0.4)',
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: '"Space Grotesk", sans-serif',
                    color: '#e7eef8',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#9fb4d3' }}>
                    Legend
                </div>
                {Object.entries(typeColor).map(([type, color]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: color,
                                marginRight: 8,
                            }}
                        />
                        <span style={{ fontSize: 13 }}>{type}</span>
                    </div>
                ))}
                <div style={{ marginTop: 16, fontSize: 12, color: '#9fb4d3' }}>
                    Nodes: {graph.nodes.length} | Edges: {graph.edges.length}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#9fb4d3' }}>
                    Simulation
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#9fb4d3' }}>
                    Status: {simulationStatus}
                </div>
                <button
                    type="button"
                    onClick={runSimulation}
                    disabled={simulationStatus === 'loading'}
                    style={{
                        marginTop: 10,
                        width: '100%',
                        background: 'rgba(109, 209, 156, 0.15)',
                        border: '1px solid rgba(109, 209, 156, 0.5)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        color: '#e7eef8',
                        cursor: simulationStatus === 'loading' ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                    }}
                >
                    Run Simulation
                </button>
                <button
                    type="button"
                    onClick={stopSimulation}
                    disabled={simulationStatus !== 'playing'}
                    style={{
                        marginTop: 8,
                        width: '100%',
                        background: 'rgba(255, 123, 123, 0.12)',
                        border: '1px solid rgba(255, 123, 123, 0.5)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        color: '#e7eef8',
                        cursor: simulationStatus !== 'playing' ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                    }}
                >
                    Stop
                </button>
                {simulationError && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#ff7b7b' }}>
                        {simulationError}
                    </div>
                )}
                <div style={{ marginTop: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#9fb4d3' }}>
                    Simulation Controls
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#c4d6f1' }}>
                    Error Rate: {(simulationConfig.errorRate * 100).toFixed(0)}%
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={simulationConfig.errorRate}
                    onChange={(event) => updateErrorRate(parseFloat(event.target.value))}
                    style={{ width: '100%', accentColor: '#ff5c5c' }}
                />
                <div style={{ marginTop: 10, fontSize: 12, color: '#c4d6f1' }}>
                    Min Latency: {simulationConfig.minLatency.toFixed(2)}s
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={simulationConfig.minLatency}
                    onChange={(event) => updateMinLatency(parseFloat(event.target.value))}
                    style={{ width: '100%', accentColor: '#6dd19c' }}
                />
                <div style={{ marginTop: 10, fontSize: 12, color: '#c4d6f1' }}>
                    Max Latency: {simulationConfig.maxLatency.toFixed(2)}s
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={simulationConfig.maxLatency}
                    onChange={(event) => updateMaxLatency(parseFloat(event.target.value))}
                    style={{ width: '100%', accentColor: '#6dd19c' }}
                />
                <label style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#c4d6f1' }}>
                    <input
                        type="checkbox"
                        checked={simulationConfig.includeDetails}
                        onChange={(event) =>
                            setSimulationConfig((prev) => ({ ...prev, includeDetails: event.target.checked }))
                        }
                    />
                    Include error details
                </label>
                <div style={{ marginTop: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#9fb4d3' }}>
                    Timeline
                </div>
                {timelineEvents.length === 0 ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#9fb4d3' }}>
                        No simulation events yet.
                    </div>
                ) : (
                    <div
                        style={{
                            marginTop: 8,
                            maxHeight: 160,
                            overflowY: 'auto',
                            fontSize: 12,
                            color: '#c4d6f1',
                        }}
                    >
                        {timelineEvents.slice(0, 12).map((event, index) => (
                            <div
                                key={`${event.source}-${event.target}-${index}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 0',
                                    borderBottom: '1px solid rgba(79, 110, 152, 0.2)',
                                }}
                            >
                                <span
                                    style={{ color: simulationPalette[getEventStatus(event)] || '#c4d6f1' }}
                                    title={event.details || ''}
                                >
                                    {event.details ? `${event.type || event.status || 'event'} (${event.details})` : (event.type || event.status || 'event')}
                                </span>
                                <span style={{ flex: 1, textAlign: 'right' }}>
                                    {event.source} -> {event.target}
                                </span>
                                <span style={{ color: '#9fb4d3' }}>
                                    {event.timestamp?.toFixed?.(2) ?? event.timestamp}s
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedNode && (
                <div
                    style={{
                        position: 'absolute',
                        left: 24,
                        bottom: 24,
                        width: 320,
                        background: 'rgba(9, 14, 24, 0.9)',
                        border: `1px solid ${typeColor[selectedNode.type] || 'rgba(79, 110, 152, 0.4)'}`,
                        borderRadius: 12,
                        padding: 16,
                        fontFamily: '"Space Grotesk", sans-serif',
                        color: '#e7eef8',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#9fb4d3' }}>
                            Node Focus
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedNodeId(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#9fb4d3',
                                fontSize: 16,
                                cursor: 'pointer',
                            }}
                        >
                            x
                        </button>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>{selectedNode.label}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#9fb4d3' }}>
                        Type: {selectedNode.type} | Status: {selectedNode.status}
                    </div>
                    {selectedNode.description && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#c4d6f1' }}>
                            {selectedNode.description}
                        </div>
                    )}
                    {selectedNode.type === 'ambiguity' && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12, letterSpacing: 1.4, color: '#9fb4d3', textTransform: 'uppercase' }}>
                                Resolve
                            </div>
                            {resolutionOptions.length === 0 && (
                                <div style={{ marginTop: 8, fontSize: 13, color: '#c4d6f1' }}>
                                    No options found for this ambiguity node.
                                </div>
                            )}
                            {resolutionOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => resolveAmbiguity(option.id)}
                                    disabled={actionStatus === 'resolving'}
                                    style={{
                                        marginTop: 8,
                                        width: '100%',
                                        background: 'rgba(78, 161, 255, 0.15)',
                                        border: '1px solid rgba(78, 161, 255, 0.45)',
                                        borderRadius: 8,
                                        padding: '8px 10px',
                                        color: '#e7eef8',
                                        cursor: actionStatus === 'resolving' ? 'not-allowed' : 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                            {actionStatus === 'resolving' && (
                                <div style={{ marginTop: 8, fontSize: 12, color: '#9fb4d3' }}>
                                    Resolving...
                                </div>
                            )}
                            {actionError && (
                                <div style={{ marginTop: 8, fontSize: 12, color: '#ff7b7b' }}>
                                    {actionError}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default App
