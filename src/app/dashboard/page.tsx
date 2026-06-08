"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Project {
  id: string; name: string; description?: string; color: string;
  _count: { topologies: number; members: number };
  updatedAt: string;
}

const PROJECT_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#06b6d4" });
  const [saving, setSaving] = useState(false);
  const role = (session?.user as any)?.role;

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }

  async function createProject() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { await fetchProjects(); setShowModal(false); setForm({ name: "", description: "", color: "#06b6d4" }); }
    setSaving(false);
  }

  const stats = [
    { label: "Projetos", value: projects.length, icon: "◈", color: "var(--primary)" },
    { label: "Topologias", value: projects.reduce((s, p) => s + p._count.topologies, 0), icon: "⬡", color: "var(--accent)" },
    { label: "Membros Totais", value: projects.reduce((s, p) => s + p._count.members, 0), icon: "◎", color: "var(--success)" },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Bem-vindo, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-secondary" style={{ marginTop: "0.25rem" }}>Gerencie suas topologias de rede</p>
        </div>
        {role !== "READONLY" && (
          <button id="btn-new-project" className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: "0.5rem" }}>
            + Novo Projeto
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: "2rem" }}>
          {stats.map(s => (
            <div key={s.label} className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Projetos</h2>
          <span className="text-xs text-muted">{projects.length} projeto{projects.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p>Nenhum projeto ainda. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: "1.25rem", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${project.color}20`, border: `1px solid ${project.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>⬡</div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "0.9rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.1rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.description || "Sem descrição"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span className="text-xs text-muted">⬡ {project._count.topologies} topologia{project._count.topologies !== 1 ? "s" : ""}</span>
                    <span className="text-xs text-muted">◎ {project._count.members} membro{project._count.members !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Atualizado {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New project modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Projeto</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input id="project-name" className="form-input" placeholder="Ex: Rede Corporativa" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-input" placeholder="Descreva o projeto..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Cor</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {PROJECT_COLORS.map(c => (
                    <div key={c} className={`color-swatch ${form.color === c ? "selected" : ""}`}
                      style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button id="btn-create-project" className="btn btn-primary" onClick={createProject} disabled={saving || !form.name.trim()}>
                {saving ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />Criando...</> : "Criar Projeto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
