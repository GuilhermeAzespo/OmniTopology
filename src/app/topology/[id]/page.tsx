"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Node, Edge } from "reactflow";
import Link from "next/link";
import dynamic from "next/dynamic";
import yaml from "js-yaml";

const TopologyCanvas = dynamic(() => import("@/components/topology/TopologyCanvas"), { ssr: false });
const DeviceLibrary = dynamic(() => import("@/components/topology/DeviceLibrary"), { ssr: false });
const PropertiesPanel = dynamic(() => import("@/components/topology/PropertiesPanel"), { ssr: false });

interface Topology {
  id: string; name: string; version: number; projectId?: string;
  canvasData: { nodes: Node[]; edges: Edge[] };
  project?: { id: string; name: string };
  backups?: Backup[];
}
interface Backup {
  id: string; name: string; version: number; fileSize: number;
  createdAt: string; createdBy?: string;
}

export default function TopologyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [topology, setTopology] = useState<Topology | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupName, setBackupName] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const role = (session?.user as any)?.role;
  const readonly = role === "READONLY";

  useEffect(() => { fetchTopology(); }, [id]);

  async function fetchTopology() {
    setLoading(true);
    const res = await fetch(`/api/topologies/${id}`);
    if (res.ok) {
      const data: Topology = await res.json();
      setTopology(data);
      setNodes((data.canvasData as any)?.nodes || []);
      setEdges((data.canvasData as any)?.edges || []);
      setBackups(data.backups || []);
    }
    setLoading(false);
  }

  async function handleSave(ns: Node[], es: Edge[]) {
    setNodes(ns); setEdges(es);
    const res = await fetch(`/api/topologies/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvasData: { nodes: ns, edges: es } }),
    });
    if (res.ok) showFeedback("success", "✓ Topologia salva!");
    else showFeedback("error", "Erro ao salvar");
  }

  function handleNodeUpdate(nodeId: string, data: any) {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data } : n));
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data } : prev);
  }

  async function createBackup() {
    const res = await fetch(`/api/topologies/${id}/backup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: backupName || undefined }),
    });
    if (res.ok) {
      const b = await res.json();
      setBackups(prev => [b, ...prev]);
      setBackupName("");
      showFeedback("success", "✓ Backup criado!");
    } else showFeedback("error", "Erro ao criar backup");
  }

  async function handleRollback(backupId: string) {
    if (!confirm("Restaurar este backup? O estado atual será salvo como snapshot antes da restauração.")) return;
    await fetch(`/api/topologies/${id}/backup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Pre-rollback snapshot` }) });
    const res = await fetch(`/api/topologies/${id}/rollback`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backupId }),
    });
    if (res.ok) { await fetchTopology(); showFeedback("success", "✓ Rollback realizado!"); setShowBackups(false); }
    else showFeedback("error", "Erro ao fazer rollback");
  }

  function handleUploadRollback(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const res = await fetch(`/api/topologies/${id}/rollback`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadedData: parsed }),
        });
        if (res.ok) { await fetchTopology(); showFeedback("success", "✓ Topologia restaurada do arquivo!"); setShowBackups(false); }
        else showFeedback("error", "Erro ao restaurar");
      } catch { showFeedback("error", "Arquivo inválido"); }
    };
    reader.readAsText(file);
  }

  function exportJSON() {
    const data = { id, name: topology?.name, version: topology?.version, exportedAt: new Date().toISOString(), canvasData: { nodes, edges } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${topology?.name || "topology"}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportYAML() {
    const data = { id, name: topology?.name, version: topology?.version, exportedAt: new Date().toISOString(), canvasData: { nodes, edges } };
    const blob = new Blob([yaml.dump(data)], { type: "application/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${topology?.name || "topology"}.yaml`; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPNG() {
    const { toPng } = await import("html-to-image");
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { backgroundColor: "#080c17", quality: 1 });
      const a = document.createElement("a");
      a.href = dataUrl; a.download = `${topology?.name || "topology"}.png`; a.click();
      showFeedback("success", "✓ PNG exportado!");
    } catch { showFeedback("error", "Erro ao exportar PNG"); }
  }

  async function exportPDF() {
    const { toPng } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { backgroundColor: "#080c17", quality: 1 });
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const pdf = new jsPDF({ orientation: img.width > img.height ? "l" : "p", unit: "px", format: [img.width, img.height] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${topology?.name || "topology"}.pdf`);
        showFeedback("success", "✓ PDF exportado!");
      };
    } catch { showFeedback("error", "Erro ao exportar PDF"); }
  }

  function showFeedback(type: string, text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  }

  if (loading) return <div className="empty-state" style={{ height: "100vh" }}><div className="spinner" /></div>;
  if (!topology) return <div style={{ padding: "2rem" }}><div className="alert alert-error">Topologia não encontrada</div></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)" }}>
      {/* Toolbar */}
      <div className="topology-toolbar">
        <Link href={topology.project ? `/projects/${topology.project.id}` : "/dashboard"} className="btn btn-ghost btn-sm">← Voltar</Link>
        <div className="toolbar-separator" />
        <div>
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{topology.name}</span>
          {topology.project && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{topology.project.name}</span>}
        </div>
        <span className="badge badge-editor" style={{ fontSize: "0.6rem" }}>v{topology.version}</span>
        <div style={{ flex: 1 }} />

        {feedback && (
          <div className={`alert alert-${feedback.type}`} style={{ margin: 0, padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>{feedback.text}</div>
        )}

        <div className="toolbar-separator" />
        {/* Export buttons */}
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <button id="btn-export-png" className="btn btn-secondary btn-sm" onClick={exportPNG} title="Exportar PNG">PNG</button>
          <button id="btn-export-pdf" className="btn btn-secondary btn-sm" onClick={exportPDF} title="Exportar PDF">PDF</button>
          <button id="btn-export-json" className="btn btn-secondary btn-sm" onClick={exportJSON} title="Exportar JSON">JSON</button>
          <button id="btn-export-yaml" className="btn btn-secondary btn-sm" onClick={exportYAML} title="Exportar YAML">YAML</button>
        </div>
        <div className="toolbar-separator" />
        <button id="btn-backups" className="btn btn-secondary btn-sm" onClick={() => setShowBackups(true)}>⏱ Backups</button>
        {readonly && <span className="badge badge-readonly">Somente Leitura</span>}
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Device Library */}
        {!readonly && (
          <div style={{ width: 220, flexShrink: 0, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              ⬡ Dispositivos
            </div>
            <DeviceLibrary />
          </div>
        )}

        {/* Center: Canvas */}
        <div style={{ flex: 1, position: "relative" }} ref={canvasRef}>
          <TopologyCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onSave={handleSave}
            onSelectNode={setSelectedNode}
            readonly={readonly}
          />
        </div>

        {/* Right: Properties */}
        <PropertiesPanel node={selectedNode} onUpdate={handleNodeUpdate} readonly={readonly} />
      </div>

      {/* Backup modal */}
      {showBackups && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBackups(false)}>
          <div className="modal-content" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>⏱ Backups & Rollback</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBackups(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {!readonly && (
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input className="form-input" placeholder="Nome do backup (opcional)" value={backupName} onChange={e => setBackupName(e.target.value)} style={{ flex: 1 }} />
                  <button id="btn-create-backup" className="btn btn-primary btn-sm" onClick={createBackup}>+ Criar Backup</button>
                </div>
              )}
              {!readonly && (
                <div>
                  <label className="form-label" style={{ marginBottom: "0.3rem", display: "block" }}>Upload de arquivo para rollback</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleUploadRollback} />
                    <button id="btn-upload-backup" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>↑ Upload .json</button>
                  </div>
                </div>
              )}
              <div className="divider" />
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                {backups.length} backup{backups.length !== 1 ? "s" : ""} disponíveis
              </div>
              {backups.length === 0 ? (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <p style={{ fontSize: "0.75rem" }}>Nenhum backup criado ainda</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {backups.map(b => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          v{b.version} · {(b.fileSize / 1024).toFixed(1)}KB · {new Date(b.createdAt).toLocaleString("pt-BR")} {b.createdBy ? `· ${b.createdBy}` : ""}
                        </div>
                      </div>
                      {!readonly && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleRollback(b.id)}>↩ Restaurar</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
