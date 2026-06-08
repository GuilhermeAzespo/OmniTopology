"use client";
import { useCallback, useRef, useState, DragEvent, useEffect } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  Connection, Edge, Node, BackgroundVariant, MarkerType, Panel, ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import DeviceNode from "./DeviceNode";
import PropertiesPanel from "./PropertiesPanel";
import { DEVICE_LIBRARY, LINK_TYPES } from "@/lib/devices";
import type { DeviceDefinition } from "@/lib/devices";
import { simulatePing } from "@/lib/network-simulator";

const nodeTypes = { deviceNode: DeviceNode };

interface TopologyCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onSave: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onSelectNode: (node: Node | null) => void;
  readonly?: boolean;
}

let nodeIdCounter = Date.now();
const getId = () => `node-${nodeIdCounter++}`;

export default function TopologyCanvas({ initialNodes, initialEdges, onSave, onSelectNode, readonly }: TopologyCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdgeType, setSelectedEdgeType] = useState("ethernet");
  const [saving, setSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [selectedSourcePort, setSelectedSourcePort] = useState<string>("");
  const [selectedTargetPort, setSelectedTargetPort] = useState<string>("");

  const [showPingModal, setShowPingModal] = useState(false);
  const [pingSource, setPingSource] = useState("");
  const [pingTarget, setPingTarget] = useState("");
  const [pingLog, setPingLog] = useState("");
  const [pingResult, setPingResult] = useState(false);

  const handleRunPing = () => {
    setPingLog("Simulando...");
    setTimeout(() => {
      const res = simulatePing(pingSource, pingTarget, nodes, edges);
      setPingLog(res.log);
      setPingResult(res.success);
    }, 600);
  };

  const onConnect = useCallback((params: Connection) => {
    setPendingConnection(params);
    // Para evitar closures defasadas, usaremos useEffect para o pre-select
  }, []);

  useEffect(() => {
    if (pendingConnection) {
      const sNode = nodes.find(n => n.id === pendingConnection.source);
      const tNode = nodes.find(n => n.id === pendingConnection.target);
      if (sNode?.data?.interfaces?.length) setSelectedSourcePort(sNode.data.interfaces[0].name);
      if (tNode?.data?.interfaces?.length) setSelectedTargetPort(tNode.data.interfaces[0].name);
    }
  }, [pendingConnection, nodes]);

  const confirmConnection = useCallback((sourcePort: string, targetPort: string) => {
    if (!pendingConnection) return;
    const lt = LINK_TYPES.find(l => l.id === selectedEdgeType) || LINK_TYPES[0];
    setEdges(eds => addEdge({
      ...pendingConnection,
      animated: lt.style === "dashed" || lt.style === "dotted",
      style: { stroke: lt.color, strokeWidth: 2, strokeDasharray: lt.style === "dotted" ? "4 4" : lt.style === "dashed" ? "8 4" : undefined },
      label: lt.label,
      data: { linkType: lt.id, sourcePort, targetPort },
    }, eds));
    setPendingConnection(null);
  }, [pendingConnection, selectedEdgeType]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    if (!reactFlowInstance || !reactFlowWrapper.current) return;
    const deviceData = event.dataTransfer.getData("application/omnitopology-device");
    if (!deviceData) return;
    const device: DeviceDefinition = JSON.parse(deviceData);
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    let defaultInterfaces = [{ name: "eth0", ip: "" }];
    if (device.category === "switch") {
      defaultInterfaces = Array.from({ length: 8 }).map((_, i) => ({ name: `port${i + 1}`, ip: "", vlan: "1", mode: "access" }));
    } else if (device.category === "router" || device.category === "firewall") {
      defaultInterfaces = Array.from({ length: 4 }).map((_, i) => ({ name: `eth${i}`, ip: "" }));
    }

    const newNode: Node = {
      id: getId(),
      type: "deviceNode",
      position,
      data: {
        label: device.label,
        deviceId: device.id,
        vendor: device.vendor,
        category: device.category,
        model: device.models[0],
        hostname: `${device.id}-${Math.floor(Math.random() * 99 + 1).toString().padStart(2, "0")}`,
        status: "active",
        color: device.color,
        cliVendor: device.cliVendor,
        interfaces: defaultInterfaces,
        notes: "",
        vlans: "",
      },
    };
    setNodes(nds => nds.concat(newNode));
  }, [reactFlowInstance]);

  const onNodeClick = useCallback((_: any, node: Node) => { 
    setSelectedNodeId(node.id);
    onSelectNode(node); 
  }, [onSelectNode]);
  const onPaneClick = useCallback(() => { 
    setSelectedNodeId(null);
    onSelectNode(null); 
  }, [onSelectNode]);

  const handleNodeDataUpdate = useCallback((nodeId: string, data: any) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data } : n));
  }, [setNodes]);

  async function handleSave() {
    setSaving(true);
    await onSave(nodes, edges);
    setSaving(false);
  }

  const selectedLinkType = LINK_TYPES.find(l => l.id === selectedEdgeType);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
    <div ref={reactFlowWrapper} style={{ flex: 1, height: "100%", position: "relative" }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={readonly ? undefined : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        onConnect={readonly ? undefined : onConnect}
        onDragOver={readonly ? undefined : onDragOver}
        onDrop={readonly ? undefined : onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={readonly ? null : "Delete"}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: "#06b6d4" },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <Controls style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }} />
        <MiniMap
          nodeColor={(n) => n.data?.color || "#06b6d4"}
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }}
        />

        {!readonly && (
          <Panel position="top-right">
            <div style={{ background: "var(--bg-glass)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.6rem", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 160 }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Tipo de Cabo</div>
              {LINK_TYPES.map(lt => (
                <button key={lt.id}
                  onClick={() => setSelectedEdgeType(lt.id)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.5rem", borderRadius: 6, border: `1px solid ${selectedEdgeType === lt.id ? lt.color : "transparent"}`, background: selectedEdgeType === lt.id ? `${lt.color}18` : "transparent", color: selectedEdgeType === lt.id ? lt.color : "var(--text-secondary)", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <div style={{ width: 20, height: 2, borderRadius: 2, flexShrink: 0, borderTop: lt.style === "dotted" ? `2px dotted ${lt.color}` : lt.style === "dashed" ? `2px dashed ${lt.color}` : `2px solid ${lt.color}`, background: "transparent" }} />
                  {lt.label}
                </button>
              ))}
              <div className="divider" style={{ margin: "0.25rem 0" }} />
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPingModal(true)}>
                Testar Conectividade
              </button>
              <button id="btn-save-topology" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000", width: 12, height: 12, borderWidth: 2 }} />Salvando</> : "💾 Salvar"}
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {pendingConnection && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Conectar Portas</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setPendingConnection(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Origem ({nodes.find(n => n.id === pendingConnection.source)?.data?.label})</label>
                <select className="form-input" value={selectedSourcePort} onChange={e => setSelectedSourcePort(e.target.value)}>
                  {nodes.find(n => n.id === pendingConnection.source)?.data?.interfaces?.map((i: any) => (
                    <option key={i.name} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Destino ({nodes.find(n => n.id === pendingConnection.target)?.data?.label})</label>
                <select className="form-input" value={selectedTargetPort} onChange={e => setSelectedTargetPort(e.target.value)}>
                  {nodes.find(n => n.id === pendingConnection.target)?.data?.interfaces?.map((i: any) => (
                    <option key={i.name} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPendingConnection(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => confirmConnection(selectedSourcePort, selectedTargetPort)} disabled={!selectedSourcePort || !selectedTargetPort}>
                Conectar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPingModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Testar Conectividade</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPingModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", gap: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nó de Origem</label>
                  <select className="form-input" value={pingSource} onChange={e => setPingSource(e.target.value)}>
                    <option value="">Selecione...</option>
                    {nodes.filter(n => n.data.category !== "switch" && n.data.category !== "link").map(n => (
                      <option key={n.id} value={n.id}>{n.data.label} ({n.data.hostname})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nó de Destino</label>
                  <select className="form-input" value={pingTarget} onChange={e => setPingTarget(e.target.value)}>
                    <option value="">Selecione...</option>
                    {nodes.filter(n => n.data.category !== "switch" && n.data.category !== "link").map(n => (
                      <option key={n.id} value={n.id}>{n.data.label} ({n.data.hostname})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={handleRunPing} disabled={!pingSource || !pingTarget}>
                Executar Ping
              </button>
              
              {pingLog && (
                <div style={{ marginTop: "1rem", background: "#000", color: pingResult ? "#28c840" : "#ff5f57", padding: "1rem", borderRadius: 8, fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
                  {pingLog}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    <PropertiesPanel 
      node={nodes.find(n => n.id === selectedNodeId) || null} 
      nodes={nodes} 
      edges={edges} 
      onUpdate={handleNodeDataUpdate} 
      readonly={readonly} 
    />
    </div>
  );
}
