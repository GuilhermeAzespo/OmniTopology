"use client";
import { DragEvent } from "react";
import { DEVICE_LIBRARY, CATEGORY_LABELS, DeviceCategory } from "@/lib/devices";

const CATEGORIES: DeviceCategory[] = ["router", "switch", "firewall", "access-point", "server", "endpoint", "cloud"];

interface DeviceLibraryProps {
  onDragStart?: (device: any) => void;
}

export default function DeviceLibrary({ onDragStart }: DeviceLibraryProps) {
  function handleDragStart(event: DragEvent, device: any) {
    event.dataTransfer.setData("application/omnitopology-device", JSON.stringify(device));
    event.dataTransfer.effectAllowed = "move";
    if (onDragStart) onDragStart(device);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", flex: 1 }}>
      {CATEGORIES.map(cat => {
        const devices = DEVICE_LIBRARY.filter(d => d.category === cat);
        if (!devices.length) return null;
        return (
          <div key={cat}>
            <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {CATEGORY_LABELS[cat]}
            </div>
            {devices.map(device => (
              <div
                key={device.id}
                draggable
                onDragStart={e => handleDragStart(e, device)}
                title={`${device.label} — arraste para o canvas`}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.55rem 0.75rem",
                  cursor: "grab", borderRadius: 6, margin: "0 0.25rem 0.1rem",
                  transition: "background 0.12s",
                  userSelect: "none",
                }}
                className="lib-device-item"
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${device.color}18`, border: `1px solid ${device.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: device.color, opacity: 0.9 }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)" }}>{device.label}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{device.models[0]}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
