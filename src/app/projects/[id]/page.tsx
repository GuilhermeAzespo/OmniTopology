"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Topology {
  id: string; name: string; description?: string; version: number;
  updatedAt: string; _count: { backups: number };
}
interface Project {
  id: string; name: string; description?: string; color: string;
  topologies: Topology[];
  members: any[];
  gitConfigs: any[];
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [gitPushing, setGitPushing] = useState(false);
  const [gitMsg, setGitMsg] = useState("");
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const role = (session?.user as any)?.role;

  useEffect(() => { fetchProject(); }, [id]);

  async function fetchProject() {
    setLoading(true);
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
    setLoading(false);
  }

  async function createTopology() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/topologies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: id }),
    });
    if (res.ok) {
      const topo = await res.json();
      setShowModal(false);
      router.push(`/topology/${topo.id}`);
    }
    setSaving(false);
  }

  async function handleGitPush() {
    setGitPushing(true);
    setFeedback(null);
    const res = await fetch(`/api/projects/${id}/git-push`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: gitMsg || undefined }),
    });
    const data = await res.json();
    if (res.ok) setFeedback({ type: "success", text: `✓ Push realizado! Commit: ${data.hash?.slice(0, 8)}` });
    else setFeedback({ type: "error", text: data.error || "Erro ao fazer push" });
    setGitPushing(false);
  }

  if (loading) return <div className="empty-state" style={{ height: "100vh" }}><div className="spinner" /></div>;
  if (!project) return <div className="page-body"><div className="alert alert-error">Projeto não encontrado</div></div>;

  const hasGit = project.gitConfigs?.length > 0;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Link href="/dashboard" className="text-muted text-sm" style={{ textDecoration: "none" }}>Dashboard</Link>
          <span className="text-muted">›</span>
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{project.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${project.color}20`, border: `1px solid ${project.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>⬡</div>
            <div>
              <h1 style={{ fontSize: "1.4rem" }}>{project.name}</h1>
              {project.description && <p className="text-secondary text-sm">{project.description}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {hasGit && role !== "READONLY" && (
              <button id="btn-git-push" className="btn btn-secondary" onClick={handleGitPush} disabled={gitPushing}>
                {gitPushing ? <><span className="spinner" />Publicando...</> : "↑ Git Push"}
              </button>
            )}
            <Link href={`/projects/${id}/settings`}><button className="btn btn-secondary btn-sm">⚙ Config</button></Link>
            {role !== "READONLY" && (
              <button id="btn-new-topology" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Topologia</button>
            )}
          </div>
        </div>
      </div>

      <div className="page-body">
        {feedback && <div className={`alert alert-${feedback.type}`} style={{ marginBottom: "1rem" }}>{feedback.text}</div>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Topologias</h2>
          <span className="text-xs text-muted">{project.topologies.length} topologia{project.topologies.length !== 1 ? "s" : ""}</span>
        </div>

        {project.topologies.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <p>Nenhuma topologia. Crie a primeira!</p>
          </div>
        ) : (
          <div className="grid-3">
            {project.topologies.map(topo => (
              <Link key={topo.id} href={`/topology/${topo.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: "1.25rem", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "0.875rem", margin: 0 }}>{topo.name}</h3>
                    <span className="badge badge-active" style={{ fontSize: "0.6rem" }}>v{topo.version}</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{topo.description || "Sem descrição"}</p>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span className="text-xs text-muted">◉ {topo._count.backups} backup{topo._count.backups !== 1 ? "s" : ""}</span>
                    <span className="text-xs text-muted">{new Date(topo.updatedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-header"><h3>Nova Topologia</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input id="topology-name" className="form-input" placeholder="Ex: Topologia Principal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-input" placeholder="Descreva a topologia..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button id="btn-create-topology" className="btn btn-primary" onClick={createTopology} disabled={saving || !form.name.trim()}>
                {saving ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />Criando...</> : "Criar e Abrir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
