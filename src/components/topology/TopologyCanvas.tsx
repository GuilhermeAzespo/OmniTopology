"use client";
import { useCallback, useRef, useState, DragEvent } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  Connection, Edge, Node, BackgroundVariant, MarkerType, Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import DeviceNode from "./DeviceNode";
import { DEVICE_LIBRARY, LINK_TYPES } from "@/lib/devices";
import type { DeviceDefinition } from "@/lib/devices";

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

  const onConnect = useCallback((params: Connection) => {
    const lt = LINK_TYPES.find(l => l.id === selectedEdgeType) || LINK_TYPES[0];
    setEdges(eds => addEdge({
      ...params,
      animated: lt.style === "dashed" || lt.style === "dotted",
      style: { stroke: lt.color, strokeWidth: 2, strokeDasharray: lt.style === "dotted" ? "4 4" : lt.style === "dashed" ? "8 4" : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color: lt.color },
      label: lt.label,
      data: { linkType: lt.id },
    }, eds));
  }, [selectedEdgeType]);

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
        interfaces: [{ name: "eth0", ip: "" }],
        notes: "",
        vlans: "",
      },
    };
    setNodes(nds => nds.concat(newNode));
  }, [reactFlowInstance]);

  const onNodeClick = useCallback((_: any, node: Node) => { onSelectNode(node); }, [onSelectNode]);
  const onPaneClick = useCallback(() => { onSelectNode(null); }, [onSelectNode]);

  async function handleSave() {
    setSaving(true);
    await onSave(nodes, edges);
    setSaving(false);
  }

  const selectedLinkType = LINK_TYPES.find(l => l.id === selectedEdgeType);

  return (
    <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes} edges={edges}
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
          markerEnd: { type: MarkerType.ArrowClosed },
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
              <button id="btn-save-topology" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000", width: 12, height: 12, borderWidth: 2 }} />Salvando</> : "💾 Salvar"}
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
