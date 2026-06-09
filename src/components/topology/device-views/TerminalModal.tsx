"use client";
import { useEffect, useRef } from "react";
import { CliTemplate } from "@/lib/cli-templates";

interface TerminalModalProps {
  data: any;
  cli: CliTemplate | undefined;
  computedPrompt: string;
  history: string[];
  input: string;
  onInputChange: (val: string) => void;
  onCommand: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
  isBooting?: boolean;
  onUpdateField?: (field: string, value: any) => void;
}

export default function TerminalModal({ data, cli, computedPrompt, history, input, onInputChange, onCommand, onClose, isBooting, onUpdateField }: TerminalModalProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ width: "90vw", height: "85vh", maxWidth: "1400px", display: "flex", flexDirection: "column", padding: 0, background: "#050505", border: "1px solid #333" }}>
        <div className="terminal-titlebar" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #222", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div className="terminal-dot" style={{ background: "#ff5f57", cursor: "pointer" }} onClick={onClose} />
            <div className="terminal-dot" style={{ background: "#febc2e" }} />
            <div className="terminal-dot" style={{ background: "#28c840" }} />
          </div>
          <span style={{ fontSize: "0.85rem", color: "#888", marginLeft: "1rem", flex: 1, textAlign: "center" }}>
            {data.hostname || "device"} — {data.cliVendor || "generic"} CLI
          </span>
          <div style={{ width: 40 }} />
        </div>
        <div className="terminal-body" style={{ flex: 1, padding: "1.5rem", fontSize: "0.95rem", lineHeight: 1.5, overflowY: "auto", overflowX: "auto", fontFamily: "'JetBrains Mono', monospace" }}>
          {data.status === "inactive" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: "#ff5f57", height: "100%", minHeight: "300px" }}>
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" opacity={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.828a5 5 0 117.07 0M12 12V4" />
              </svg>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#e5e5e5" }}>Equipamento Desligado (Power Off)</h3>
                <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.5rem" }}>O equipamento está offline. Ative-o para acessar o terminal.</p>
              </div>
              {onUpdateField && (
                <button className="btn btn-primary" onClick={() => onUpdateField("status", "active")}>
                  ⚡ Ligar Equipamento
                </button>
              )}
            </div>
          ) : (
            <>
              {history.map((line, i) => (
                <div key={i} className="terminal-output" style={{ color: line.startsWith(data.hostname) ? "#06b6d4" : "#e5e5e5", whiteSpace: "pre" }}>
                  {line}
                </div>
              ))}
              <div className="terminal-input-row" style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
                <span className="terminal-prompt" style={{ color: "#06b6d4", marginRight: "0.5rem", whiteSpace: "nowrap" }}>
                  {isBooting ? "[BOOTING] " : computedPrompt}
                </span>
                <input 
                  className="terminal-input" 
                  style={{ flex: 1, background: "transparent", border: "none", color: "#e5e5e5", outline: "none", fontFamily: "monospace", fontSize: "0.95rem" }}
                  value={input} 
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={onCommand} 
                  autoFocus
                  autoComplete="off" 
                  spellCheck={false} 
                  disabled={isBooting}
                  placeholder={isBooting ? "Reiniciando o sistema..." : ""}
                />
              </div>
            </>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
