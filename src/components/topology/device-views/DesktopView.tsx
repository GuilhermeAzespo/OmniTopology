"use client";
import { useState } from "react";
import { simulateWebRequest } from "@/lib/network-simulator";
import { Node, Edge } from "reactflow";

interface DesktopViewProps {
  nodeId: string;
  nodes: Node[];
  edges: Edge[];
}

export default function DesktopView({ nodeId, nodes, edges }: DesktopViewProps) {
  const [url, setUrl] = useState("http://omni.local");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGo = () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setContent(null);

    // Simulando delay de rede
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
    <div style={{ background: "#0078d7", borderRadius: 8, padding: "0.25rem", marginTop: "1rem", height: 350, display: "flex", flexDirection: "column" }}>
      {/* Barra superior estilo Windows */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0.5rem", color: "#fff", fontSize: "0.75rem", fontFamily: "segoe ui, sans-serif" }}>
        <span>Workstation Desktop</span>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <div style={{ width: 10, height: 10, background: "#fff", opacity: 0.5 }} />
          <div style={{ width: 10, height: 10, background: "#fff", opacity: 0.5 }} />
          <div style={{ width: 10, height: 10, background: "#ff5f57" }} />
        </div>
      </div>
      
      {/* Área principal (Browser App) */}
      <div style={{ flex: 1, background: "#fff", borderRadius: "0 0 6px 6px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Browser Toolbar */}
        <div style={{ background: "#f3f3f3", borderBottom: "1px solid #ccc", padding: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.2rem" }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>⬅</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>➡</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>🔄</button>
          </div>
          <input 
            type="text" 
            value={url} 
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGo()}
            style={{ flex: 1, padding: "0.3rem 0.6rem", borderRadius: 16, border: "1px solid #ddd", fontSize: "0.8rem", outline: "none" }}
            placeholder="Digite uma URL (ex: http://servidor ou 192.168.1.10)"
          />
          <button 
            onClick={handleGo}
            style={{ background: "#0078d7", color: "#fff", border: "none", padding: "0.3rem 0.8rem", borderRadius: 4, fontSize: "0.75rem", cursor: "pointer" }}
            disabled={loading}
          >
            Ir
          </button>
        </div>

        {/* Browser Viewport */}
        <div style={{ flex: 1, background: "#fff", position: "relative", overflowY: "auto" }}>
          {loading && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#0078d7", animation: "loading-bar 1s infinite linear" }} />
          )}
          
          <div style={{ padding: "1.5rem" }}>
            {error ? (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <div style={{ fontSize: "3rem", color: "#ccc", marginBottom: "1rem" }}>🌐</div>
                <h3 style={{ color: "#333", fontSize: "1.2rem", margin: "0 0 0.5rem 0" }}>Não foi possível acessar esse site</h3>
                <p style={{ color: "#666", fontSize: "0.85rem" }}>{error}</p>
              </div>
            ) : content ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div style={{ textAlign: "center", marginTop: "2rem", color: "#999", fontSize: "0.85rem" }}>
                Bem-vindo ao navegador do Workstation.<br/>Digite uma URL e clique em Ir.
              </div>
            )}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}} />
      </div>
    </div>
  );
}
