"use client";
import { useState } from "react";
import { simulateWebRequest } from "@/lib/network-simulator";
import { Node, Edge } from "reactflow";

import Minesweeper from "./Minesweeper";

interface DesktopViewProps {
  nodeId: string;
  nodes: Node[];
  edges: Edge[];
}

export default function DesktopView({ nodeId, nodes, edges }: DesktopViewProps) {
  const [activeApp, setActiveApp] = useState<"browser" | "minesweeper" | null>(null);
  const [url, setUrl] = useState("http://omni.local");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGo = () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setContent(null);

    setTimeout(() => {
      const res = simulateWebRequest(nodeId, url, nodes, edges);
      if (res.success) {
        setContent(res.html || "");
      } else {
        setError(res.error || "Erro ao carregar a página.");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ 
      background: "url('https://upload.wikimedia.org/wikipedia/en/2/21/Bliss_%28Windows_XP%29.png') center/cover", 
      borderRadius: 8, marginTop: "1rem", height: 400, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" 
    }}>
      {/* Desktop Icons */}
      <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", width: 60 }} onDoubleClick={() => setActiveApp("browser")}>
          <div style={{ fontSize: "2rem", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>🌐</div>
          <span style={{ color: "#fff", textShadow: "1px 1px 2px #000", fontSize: "0.7rem", textAlign: "center", marginTop: "4px" }}>Internet Explorer</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", width: 60 }} onDoubleClick={() => setActiveApp("minesweeper")}>
          <div style={{ fontSize: "2rem", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>💣</div>
          <span style={{ color: "#fff", textShadow: "1px 1px 2px #000", fontSize: "0.7rem", textAlign: "center", marginTop: "4px" }}>Campo Minado</span>
        </div>
      </div>

      {/* Windows App Modals */}
      {activeApp === "browser" && (
        <div style={{ position: "absolute", top: "5%", left: "5%", width: "90%", height: "85%", background: "#ece9d8", border: "2px solid #0054e3", borderRadius: "8px 8px 0 0", display: "flex", flexDirection: "column", boxShadow: "2px 2px 10px rgba(0,0,0,0.5)" }}>
          <div style={{ background: "linear-gradient(180deg, #0058e6 0%, #3a93ff 100%)", padding: "4px 8px", color: "#fff", fontWeight: "bold", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
            <span>Internet Explorer</span>
            <button onClick={() => setActiveApp(null)} style={{ background: "#e04343", color: "#fff", border: "1px solid #fff", borderRadius: 3, cursor: "pointer", fontWeight: "bold", padding: "0 6px" }}>X</button>
          </div>
          <div style={{ background: "#ece9d8", borderBottom: "1px solid #ccc", padding: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGo()} style={{ flex: 1, padding: "0.2rem", border: "1px solid #7f9db9" }} placeholder="Endereço" />
            <button onClick={handleGo} style={{ padding: "0.2rem 1rem", cursor: "pointer" }} disabled={loading}>Ir</button>
          </div>
          <div style={{ flex: 1, background: "#fff", overflowY: "auto", position: "relative" }}>
            {loading && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#0078d7", animation: "loading-bar 1s infinite linear" }} />}
            <div style={{ padding: "1rem" }}>
              {error ? <div style={{ color: "red" }}>{error}</div> : content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : <div style={{ color: "#666" }}>Página inicial em branco.</div>}
            </div>
          </div>
        </div>
      )}

      {activeApp === "minesweeper" && (
        <div style={{ position: "absolute", top: "10%", left: "20%", background: "#ece9d8", border: "2px solid #0054e3", borderRadius: "8px 8px 0 0", display: "flex", flexDirection: "column", boxShadow: "2px 2px 10px rgba(0,0,0,0.5)" }}>
          <div style={{ background: "linear-gradient(180deg, #0058e6 0%, #3a93ff 100%)", padding: "4px 8px", color: "#fff", fontWeight: "bold", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
            <span>Minesweeper</span>
            <button onClick={() => setActiveApp(null)} style={{ background: "#e04343", color: "#fff", border: "1px solid #fff", borderRadius: 3, cursor: "pointer", fontWeight: "bold", padding: "0 6px" }}>X</button>
          </div>
          <div style={{ padding: "10px", background: "#c0c0c0", display: "flex", justifyContent: "center" }}>
            <Minesweeper />
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div style={{ height: 30, background: "linear-gradient(to bottom, #245edb 0%, #3f8cf3 9%, #245edb 18%, #245edb 92%, #333 100%)", display: "flex", alignItems: "center" }}>
        <button style={{ background: "linear-gradient(to bottom, #3c8243 0%, #59a659 10%, #3c8243 20%, #3c8243 100%)", border: "none", borderRadius: "0 10px 10px 0", color: "#fff", fontWeight: "bold", fontStyle: "italic", height: "100%", padding: "0 15px", cursor: "pointer", boxShadow: "inset -1px -1px 2px rgba(0,0,0,0.3)" }}>
          Start
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ background: "#0f8ded", height: "100%", borderLeft: "1px solid #1042af", display: "flex", alignItems: "center", padding: "0 10px", color: "#fff", fontSize: "0.75rem", boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.4)" }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
