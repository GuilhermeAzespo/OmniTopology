"use client";
import { Edge } from "reactflow";

interface SwitchPanelProps {
  nodeId: string;
  data: any;
  edges: Edge[];
}

export default function SwitchPanel({ nodeId, data, edges }: SwitchPanelProps) {
  const interfaces = data.interfaces || [];

  const isPortActive = (portName: string) => {
    return edges.some(e => 
      (e.source === nodeId && e.data?.sourcePort === portName) ||
      (e.target === nodeId && e.data?.targetPort === portName)
    );
  };

  return (
    <div style={{ background: "#1e1e1e", border: "2px solid #333", borderRadius: 8, padding: "1.5rem 1rem", marginTop: "1rem", position: "relative" }}>
      {/* Brand logo area */}
      <div style={{ position: "absolute", top: 10, left: 15, fontSize: "0.7rem", fontWeight: "bold", color: "#666", letterSpacing: 1 }}>
        {data.vendor ? data.vendor.toUpperCase() : "OMNI"} {data.category === "switch" ? "SWITCH" : "ROUTER"}
      </div>
      
      {/* Ports Area */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem", justifyContent: "center", padding: "1rem", background: "#111", borderRadius: 6, border: "1px solid #222" }}>
        {interfaces.map((iface: any, idx: number) => {
          const active = isPortActive(iface.name);
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
              {/* LED */}
              <div style={{ 
                width: 8, height: 8, borderRadius: "50%", 
                background: active ? "#28c840" : "#333",
                boxShadow: active ? "0 0 6px #28c840" : "inset 0 1px 2px rgba(0,0,0,0.5)"
              }} />
              {/* RJ45 Port Socket */}
              <div style={{ 
                width: 28, height: 24, background: active ? "#0a0a0a" : "#1a1a1a",
                border: "2px solid #333", borderBottomColor: "#444", borderRadius: "2px 2px 0 0",
                position: "relative",
                display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 2
              }}>
                <div style={{ width: 14, height: 4, background: "#000", borderTop: "1px solid #222" }} />
              </div>
              {/* Label */}
              <div style={{ fontSize: "0.55rem", color: "#666", fontFamily: "monospace", marginTop: 2 }}>
                {iface.name}
              </div>
            </div>
          );
        })}
        {interfaces.length === 0 && (
          <div style={{ fontSize: "0.8rem", color: "#666" }}>Nenhuma porta configurada</div>
        )}
      </div>
    </div>
  );
}
