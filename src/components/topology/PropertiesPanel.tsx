"use client";
import { useState, useEffect } from "react";
import { Node, Edge } from "reactflow";
import { CLI_VENDORS } from "@/lib/cli-templates";
import { simulateDHCP } from "@/lib/network-simulator";
import TerminalModal from "./device-views/TerminalModal";
import SwitchPanel from "./device-views/SwitchPanel";
import DesktopView from "./device-views/DesktopView";

const STATUS_OPTIONS = ["active", "inactive", "maintenance", "unknown"];
const STATUS_LABELS: Record<string, string> = { active: "Ativo", inactive: "Inativo", maintenance: "Manutenção", unknown: "Desconhecido" };

interface PropertiesPanelProps {
  node: Node | null;
  nodes?: Node[];
  edges?: Edge[];
  onUpdate: (nodeId: string, data: any) => void;
  readonly?: boolean;
}

type Tab = "info" | "interfaces" | "terminal" | "notes" | "view";

export default function PropertiesPanel({ node, nodes = [], edges = [], onUpdate, readonly }: PropertiesPanelProps) {
  const [tab, setTab] = useState<Tab>("info");
  const [data, setData] = useState<any>({});
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [cliState, setCliState] = useState<any>({});
  const [isBooting, setIsBooting] = useState(false);

  useEffect(() => {
    if (node) {
      setData({ ...node.data });
      setCliState({});
      const cli = CLI_VENDORS[node.data.cliVendor || "generic"];
      setTerminalHistory([cli?.welcome || "", ""]);
      setTab("info");
      setIsBooting(false);
    }
  }, [node?.id]);

  function updateField(field: string, value: any) {
    const newData = { ...data, [field]: value };
    setData(newData);
    if (node) onUpdate(node.id, newData);
  }

  function handlePowerOff() {
    updateField("status", "inactive");
    setTerminalHistory(h => [...h, "\n*** CONNECTION TERMINATED / SYSTEM SHUTDOWN ***", ""]);
  }

  function handlePowerOn() {
    updateField("status", "active");
    simulateBoot();
  }

  function handleReboot() {
    setCliState({});
    simulateBoot();
  }

  function simulateBoot() {
    setIsBooting(true);
    const cli = CLI_VENDORS[data.cliVendor || "generic"];
    const vendor = data.cliVendor || "generic";
    
    setTerminalHistory(["[System Boot Initiated...]"]);
    
    const bootLines: string[] = [];
    if (vendor === "cisco") {
      bootLines.push(
        "Proceed with reload? [confirm]",
        "\n*Mar 1 00:00:00.000: %SYS-5-RELOAD: Reload requested by console.",
        "System rebooting...",
        "\nROMMON V1.12 - Booting system flash...",
        "Decompressing system image: ######################################## [OK]",
        "Restoring configuration from NVRAM... [OK]\n",
        cli?.welcome || ""
      );
    } else if (vendor === "mikrotik") {
      bootLines.push(
        "Rebooting system...",
        "\nLoading system drivers...",
        "Starting services...",
        "Ready for connection!\n",
        cli?.welcome || ""
      );
    } else if (vendor === "pfsense" || vendor === "opnsense") {
      bootLines.push(
        "Rebooting system...",
        "\nBooting pfSense CE 2.7.2...",
        "Initializing cryptodev...",
        "Starting DHCP service... [OK]",
        "Starting DNS service... [OK]",
        "Configuring firewall rules... [OK]\n",
        cli?.welcome || ""
      );
    } else {
      bootLines.push(
        "Rebooting system...",
        "\n[  0.000000] Linux version 5.15.0-88-generic",
        "[  0.892401] SCSI subsystem initialized",
        "[  1.201092] EXT4-fs (sda1): mounted filesystem with ordered data mode.",
        "[  2.100982] IP-Config: eth0: DHCP answer received.\n",
        cli?.welcome || ""
      );
    }

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootLines.length) {
        setTerminalHistory(h => [...h, bootLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setIsBooting(false);
      }
    }, 250);
  }

  function handleTerminalCommand(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
    const cli = CLI_VENDORS[data.cliVendor || "generic"];
    if (!cli) return;
    
    const promptStr = typeof cli.prompt === "function" ? cli.prompt(cliState) : (cli.prompt || "$ ");
    const computedPrompt = `${data.hostname || "device"}${promptStr}`;
    
    if (cmd === "clear") { setTerminalHistory([cli.welcome || ""]); return; }

    // Intercept reload / reboot / shutdown commands across vendors
    const isCiscoReload = cmd === "reload" && data.cliVendor === "cisco";
    const isMikrotikReboot = cmd === "/system reboot" && data.cliVendor === "mikrotik";
    const isMikrotikShutdown = cmd === "/system shutdown" && data.cliVendor === "mikrotik";
    const isPfsenseReboot = cmd === "5" && (data.cliVendor === "pfsense" || data.cliVendor === "opnsense");
    const isPfsenseHalt = cmd === "6" && (data.cliVendor === "pfsense" || data.cliVendor === "opnsense");
    const isLinuxReboot = (cmd === "reboot" || cmd === "shutdown -r now" || cmd === "init 6") && (data.cliVendor === "linux" || data.cliVendor === "generic" || data.cliVendor === "ubiquiti");
    const isLinuxShutdown = (cmd === "poweroff" || cmd === "shutdown now" || cmd === "init 0" || cmd === "halt") && (data.cliVendor === "linux" || data.cliVendor === "generic" || data.cliVendor === "ubiquiti");
    const isWindowsReboot = cmd === "shutdown /r" && data.cliVendor === "windows";
    const isWindowsShutdown = cmd === "shutdown /s" && data.cliVendor === "windows";

    if (isCiscoReload || isMikrotikReboot || isPfsenseReboot || isLinuxReboot || isWindowsReboot) {
      handleReboot();
      return;
    }

    if (isMikrotikShutdown || isPfsenseHalt || isLinuxShutdown || isWindowsShutdown) {
      handlePowerOff();
      return;
    }
    
    let output = "";
    let handled = false;
    
    if (cli.parseCommand) {
      const res = cli.parseCommand(cmd, data, cliState, setCliState, updateField, nodes, edges);
      if (res !== null) {
        output = res;
        handled = true;
      }
    }
    
    if (!handled) {
      const handler = cli.commands[cmd];
      output = handler ? handler(cmd.split(" "), data, cliState, setCliState, updateField, nodes, edges) : `bash: ${cmd}: command not found`;
    }
    
    setTerminalHistory(h => [...h, `${computedPrompt}${cmd}`, ...(output ? [output] : [])]);
  }

  function updateInterface(idx: number, field: string, value: string) {
    const ifaces = [...(data.interfaces || [])];
    ifaces[idx] = { ...ifaces[idx], [field]: value };
    updateField("interfaces", ifaces);
  }

  if (!node) {
    return (
      <div className="properties-panel" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="empty-state" style={{ padding: "2rem" }}>
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" opacity={0.3}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
          <p style={{ fontSize: "0.75rem" }}>Clique em um dispositivo para editar</p>
        </div>
      </div>
    );
  }

  const cli = CLI_VENDORS[data.cliVendor || "generic"];
  const promptStr = typeof cli?.prompt === "function" ? cli.prompt(cliState) : (cli?.prompt || "$ ");
  const computedPrompt = `${data.hostname || "device"}${promptStr}`;

  return (
    <div className="properties-panel">
      <div style={{ padding: "0.75rem 1rem 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: data.status === "inactive" ? "#ff5f57" : (data.color || "var(--primary)") }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.label}</span>
          <span className={`badge badge-${data.status === "active" ? "active" : data.status === "inactive" ? "inactive" : "maintenance"}`} style={{ marginLeft: "auto", flexShrink: 0 }}>{STATUS_LABELS[data.status] || data.status}</span>
        </div>
        
        {/* Power simulation controls */}
        {!readonly && (
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", padding: "0.4rem 0.6rem", background: "var(--bg-elevated)", borderRadius: 6, alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>Energia / Simulação</span>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {data.status === "inactive" ? (
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ background: "#28c840", color: "#fff", padding: "0.2rem 0.5rem", fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "0.25rem", border: "none" }}
                  onClick={handlePowerOn}
                >
                  ⚡ Ligar
                </button>
              ) : (
                <>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ background: "#ff5f5718", color: "#ff5f57", borderColor: "#ff5f5733", padding: "0.2rem 0.5rem", fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={handlePowerOff}
                  >
                    🔌 Desligar
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={handleReboot}
                  >
                    🔄 Reiniciar
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="tabs">
          {(["info", "interfaces", "terminal", "notes", "view"] as Tab[]).map(t => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {{ info: "Info", interfaces: "IPs", terminal: "CLI", notes: "Notas", view: data.category === "endpoint" ? "Desktop" : "Visão Fís." }[t]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem" }}>
        {tab === "info" && (
          <div className="flex flex-col gap-3">
            <div className="form-group">
              <label className="form-label">Hostname</label>
              <input className="form-input" value={data.hostname || ""} onChange={e => updateField("hostname", e.target.value)} disabled={readonly} placeholder="router-01" />
            </div>
            <div className="form-group">
              <label className="form-label">Nome/Label</label>
              <input className="form-input" value={data.label || ""} onChange={e => updateField("label", e.target.value)} disabled={readonly} />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input className="form-input" value={data.model || ""} onChange={e => updateField("model", e.target.value)} disabled={readonly} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={data.status || "active"} onChange={e => updateField("status", e.target.value)} disabled={readonly}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            
            {(data.category === "server" || data.category === "router" || data.category === "firewall") && (
              <div className="form-group" style={{ marginTop: "0.5rem", padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", margin: 0 }}>
                  <input type="checkbox" checked={data.dhcpServer || false} onChange={e => updateField("dhcpServer", e.target.checked)} disabled={readonly} />
                  Ativar Servidor DHCP
                </label>
                {data.dhcpServer && (
                  <input className="form-input" style={{ marginTop: "0.5rem" }} value={data.dhcpNetwork || ""} onChange={e => updateField("dhcpNetwork", e.target.value)} disabled={readonly} placeholder="Rede (ex: 192.168.10.0/24)" />
                )}
              </div>
            )}
          </div>
        )}

        {tab === "interfaces" && (
          <div className="flex flex-col gap-2">
            {/* VLAN Manager for switch category */}
            {data.category === "switch" && (() => {
              const nodeVlans = Array.isArray(data.vlans) ? data.vlans : [{ id: "1", name: "default" }];
              return (
                <div style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "0.8rem", marginBottom: "0.4rem", border: "1px dashed var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>VLANs no Switch</span>
                    {!readonly && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: "0.1rem 0.4rem", fontSize: "0.65rem" }}
                        onClick={() => {
                          const id = prompt("Digite o ID da VLAN (número):");
                          if (!id || isNaN(Number(id))) return;
                          const name = prompt("Digite o Nome da VLAN:", `VLAN${id.padStart(4, '0')}`) || `VLAN${id.padStart(4, '0')}`;
                          let vlans = Array.isArray(data.vlans) ? [...data.vlans] : [{ id: "1", name: "default" }];
                          if (vlans.some(v => v.id === id)) {
                            alert("Esta VLAN já existe!");
                            return;
                          }
                          vlans.push({ id, name });
                          updateField("vlans", vlans);
                        }}
                      >
                        + VLAN
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {nodeVlans.map((v: any) => (
                      <span key={v.id} style={{ fontSize: "0.68rem", background: "var(--border)", padding: "0.2rem 0.4rem", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <strong>{v.id}</strong>: {v.name}
                        {!readonly && v.id !== "1" && (
                          <span 
                            style={{ cursor: "pointer", color: "#ff5f57", fontWeight: "bold", marginLeft: "0.2rem" }}
                            onClick={() => {
                              if (confirm(`Remover a VLAN ${v.id} (${v.name})?`)) {
                                let vlans = nodeVlans.filter((vl: any) => vl.id !== v.id);
                                updateField("vlans", vlans);
                                // Reset ports that were on this VLAN to VLAN 1
                                const ifaces = (data.interfaces || []).map((i: any) => i.vlan === v.id ? { ...i, vlan: "1" } : i);
                                updateField("interfaces", ifaces);
                              }
                            }}
                          >
                            ×
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(data.interfaces || []).map((iface: any, idx: number) => {
              const nodeVlans = Array.isArray(data.vlans) ? data.vlans : [{ id: "1", name: "default" }];
              return (
                <div key={idx} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "0.6rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600, marginBottom: "0.4rem", fontFamily: "monospace" }}>{iface.name || `Interface ${idx + 1}`}</div>
                  <div className="flex flex-col gap-2">
                    <input className="form-input" style={{ fontSize: "0.75rem" }} value={iface.name || ""} onChange={e => updateInterface(idx, "name", e.target.value)} disabled={readonly} placeholder="eth0 / ether1 / Gi0/0" />
                    {data.category === "switch" ? (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <select className="form-input" style={{ fontSize: "0.75rem", flex: 1 }} value={iface.mode || "access"} onChange={e => updateInterface(idx, "mode", e.target.value)} disabled={readonly}>
                          <option value="access">Access</option>
                          <option value="trunk">Trunk</option>
                        </select>
                        {iface.mode === "trunk" ? (
                          <input 
                            className="form-input" 
                            style={{ fontSize: "0.75rem", flex: 2 }} 
                            value={iface.vlan || ""} 
                            onChange={e => updateInterface(idx, "vlan", e.target.value)} 
                            disabled={readonly} 
                            placeholder="Allowed (ex: 10,20)" 
                          />
                        ) : (
                          <select 
                            className="form-input" 
                            style={{ fontSize: "0.75rem", flex: 2 }} 
                            value={iface.vlan || "1"} 
                            onChange={e => updateInterface(idx, "vlan", e.target.value)} 
                            disabled={readonly}
                          >
                            {nodeVlans.map((v: any) => (
                              <option key={v.id} value={v.id}>{v.id} - {v.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <input className="form-input" style={{ fontSize: "0.75rem", flex: 1 }} value={iface.ip || ""} onChange={e => updateInterface(idx, "ip", e.target.value)} disabled={readonly} placeholder="IP (ex: 192.168.1.1/24)" />
                          <input className="form-input" style={{ fontSize: "0.75rem", flex: 1 }} value={iface.gateway || ""} onChange={e => updateInterface(idx, "gateway", e.target.value)} disabled={readonly} placeholder="Gateway (opcional)" />
                        </div>
                        {!readonly && !iface.ip && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: "0 0.5rem", fontSize: "0.65rem", flexShrink: 0 }}
                            onClick={() => {
                              if (!node) return;
                              const ip = simulateDHCP(node, nodes, edges);
                              if (ip) updateInterface(idx, "ip", ip);
                              else alert("Nenhum servidor DHCP encontrado nesta rede.");
                            }}
                          >
                            DHCP
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!readonly && (
              <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}
                onClick={() => {
                  const len = data.interfaces?.length || 0;
                  const newName = data.category === "switch" ? `port${len + 1}` : `eth${len}`;
                  updateField("interfaces", [...(data.interfaces || []), { name: newName, ip: "", mode: "access", vlan: "1" }]);
                }}>
                + Interface
              </button>
            )}
          </div>
        )}

        {tab === "terminal" && (
          <div className="terminal-wrapper">
            <div className="terminal-titlebar">
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                <div className="terminal-dot" style={{ background: "#febc2e" }} />
                <div className="terminal-dot" style={{ background: "#28c840" }} />
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.5rem", flex: 1 }}>{data.hostname || "device"} — CLI</span>
              <button 
                onClick={() => setIsTerminalMaximized(true)}
                style={{ background: "transparent", border: "none", color: "#06b6d4", cursor: "pointer", fontSize: "0.7rem" }}
              >
                ⛶ Expandir
              </button>
            </div>
            {data.status === "inactive" ? (
              <div className="terminal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: "#ff5f57", minHeight: "220px" }}>
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" opacity={0.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.828a5 5 0 117.07 0M12 12V4" />
                </svg>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, margin: 0, color: "#e5e5e5" }}>Equipamento Desligado (Power Off)</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Ligue o equipamento para acessar a interface de comando (CLI).</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handlePowerOn}>
                  ⚡ Ligar Equipamento
                </button>
              </div>
            ) : (
              <div className="terminal-body">
                {terminalHistory.map((line, i) => (
                  <div key={i} className="terminal-output" style={{ color: line.startsWith(data.hostname) ? "#06b6d4" : "#d4d4d4" }}>{line}</div>
                ))}
                <div className="terminal-input-row">
                  <span className="terminal-prompt">{isBooting ? "[BOOTING] " : computedPrompt}</span>
                  <input 
                    className="terminal-input" 
                    value={terminalInput} 
                    onChange={e => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalCommand} 
                    placeholder={isBooting ? "Reiniciando o sistema..." : "Digite um comando..."} 
                    autoComplete="off" 
                    spellCheck={false}
                    disabled={isBooting}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="form-group">
            <label className="form-label">Notas (Markdown)</label>
            <textarea className="form-input" style={{ minHeight: 200, fontSize: "0.8rem", fontFamily: "monospace" }}
              value={data.notes || ""} onChange={e => updateField("notes", e.target.value)} disabled={readonly}
              placeholder="# Documentação&#10;&#10;Descreva configurações, links, histórico..." />
          </div>
        )}

        {tab === "view" && (
          <div>
            {data.category === "endpoint" ? (
              <DesktopView nodeId={node.id} nodes={nodes} edges={edges} onOpenTerminal={() => setIsTerminalMaximized(true)} />
            ) : (
              <SwitchPanel nodeId={node.id} data={data} edges={edges} />
            )}
          </div>
        )}
      </div>

      {isTerminalMaximized && (
        <TerminalModal
          data={data}
          cli={cli}
          computedPrompt={computedPrompt}
          history={terminalHistory}
          input={terminalInput}
          onInputChange={setTerminalInput}
          onCommand={handleTerminalCommand}
          onClose={() => setIsTerminalMaximized(false)}
          isBooting={isBooting}
          onUpdateField={updateField}
        />
      )}
    </div>
  );
}
