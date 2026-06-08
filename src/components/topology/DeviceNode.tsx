"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

const ICONS: Record<string, React.ReactNode> = {
  router: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  switch: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="7" x2="6" y2="3" /><line x1="10" y1="7" x2="10" y2="3" />
      <line x1="14" y1="7" x2="14" y2="3" /><line x1="18" y1="7" x2="18" y2="3" />
    </svg>
  ),
  firewall: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  "access-point": (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ),
  server: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v.75a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25v-.75m19.5 0a2.25 2.25 0 00-2.25-2.25H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 19.409a2.25 2.25 0 01-1.07-1.916V17.25m19.5-10.5a2.25 2.25 0 00-2.25-2.25H4.5a2.25 2.25 0 00-2.25 2.25v.75m19.5 0v.243..." />
    </svg>
  ),
  cloud: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
  endpoint: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
};

const STATUS_COLORS: Record<string, string> = {
  active: "var(--success)",
  inactive: "var(--danger)",
  maintenance: "var(--warning)",
  unknown: "var(--text-muted)",
};

function DeviceNode({ data, selected }: NodeProps) {
  const icon = ICONS[data.category] || ICONS.router;
  const statusColor = STATUS_COLORS[data.status] || STATUS_COLORS.unknown;

  return (
    <div className={`device-node ${selected ? "selected" : ""}`} style={{ borderColor: selected ? data.color || "var(--primary)" : undefined }}>
      <Handle type="target" position={Position.Top} style={{ background: data.color || "var(--primary)", width: 8, height: 8, border: "2px solid var(--bg-primary)" }} />
      <div className="device-node-header">
        <div className="device-node-icon" style={{ background: `${data.color || "#06b6d4"}20`, color: data.color || "var(--primary)" }}>
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="device-node-name">{data.label}</div>
          <div className="device-node-type">{data.model || data.vendor}</div>
        </div>
        <div className="device-node-status" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
      </div>
      {data.hostname && (
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem", paddingLeft: "0.2rem", fontFamily: "var(--font-mono, monospace)" }}>
          {data.hostname}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: data.color || "var(--primary)", width: 8, height: 8, border: "2px solid var(--bg-primary)" }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: data.color || "var(--primary)", width: 8, height: 8, border: "2px solid var(--bg-primary)" }} />
      <Handle type="target" position={Position.Right} id="right" style={{ background: data.color || "var(--primary)", width: 8, height: 8, border: "2px solid var(--bg-primary)" }} />
    </div>
  );
}

export default memo(DeviceNode);
