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
}

export default function TerminalModal({ data, cli, computedPrompt, history, input, onInputChange, onCommand, onClose }: TerminalModalProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ width: "80vw", height: "80vh", maxWidth: "1200px", display: "flex", flexDirection: "column", padding: 0, background: "#0a0a0a", border: "1px solid #333" }}>
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
        <div className="terminal-body" style={{ flex: 1, padding: "1rem", fontSize: "0.95rem", lineHeight: 1.4, overflowY: "auto" }}>
          {history.map((line, i) => (
            <div key={i} className="terminal-output" style={{ color: line.startsWith(data.hostname) ? "#06b6d4" : "#e5e5e5", whiteSpace: "pre-wrap" }}>
              {line}
            </div>
          ))}
          <div className="terminal-input-row" style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
            <span className="terminal-prompt" style={{ color: "#06b6d4", marginRight: "0.5rem", whiteSpace: "nowrap" }}>
              {computedPrompt}
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
            />
          </div>
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
