"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [gitConfig, setGitConfig] = useState<any>(null);
  const [gitForm, setGitForm] = useState({ repoUrl: "", branch: "main", username: "", token: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const role = (session?.user as any)?.role;

  useEffect(() => {
    fetchProject(); fetchGitConfig(); fetchCommits();
  }, [id]);

  async function fetchProject() {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
  }

  async function fetchGitConfig() {
    const res = await fetch(`/api/projects/${id}/git-config`);
    if (res.ok) {
      const data = await res.json();
      if (data) { setGitConfig(data); setGitForm(f => ({ ...f, repoUrl: data.repoUrl, branch: data.branch, username: data.username || "" })); }
    }
  }

  async function fetchCommits() {
    const res = await fetch(`/api/projects/${id}/git-push`);
    if (res.ok) { const data = await res.json(); setCommits(data.commits || []); }
  }

  async function saveGitConfig() {
    setSaving(true);
    const res = await fetch(`/api/projects/${id}/git-config`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(gitForm),
    });
    if (res.ok) { setFeedback({ type: "success", text: "✓ Configuração Git salva!" }); await fetchGitConfig(); }
    else setFeedback({ type: "error", text: "Erro ao salvar configuração" });
    setSaving(false);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function deleteProject() {
    if (!confirm(`Excluir o projeto "${project?.name}"? Esta ação é irreversível.`)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  }

  if (!project) return <div className="empty-state" style={{ height: "60vh" }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Link href={`/projects/${id}`} className="text-muted text-sm" style={{ textDecoration: "none" }}>← {project.name}</Link>
          <span className="text-muted">›</span>
          <span className="text-sm">Configurações</span>
        </div>
        <h1 style={{ fontSize: "1.4rem" }}>Configurações do Projeto</h1>
      </div>
      <div className="page-body flex flex-col gap-4">
        {feedback && <div className={`alert alert-${feedback.type}`}>{feedback.text}</div>}

        {/* Git Config */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>↑ Integração Git</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: "1.25rem" }}>Configure o repositório para sincronizar as topologias via Git Push.</p>
          <div className="flex flex-col gap-3">
            <div className="form-group">
              <label className="form-label">URL do Repositório</label>
              <input id="git-repo-url" className="form-input" placeholder="https://github.com/usuario/repo.git"
                value={gitForm.repoUrl} onChange={e => setGitForm(f => ({ ...f, repoUrl: e.target.value }))} disabled={role === "READONLY"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <input className="form-input" placeholder="main" value={gitForm.branch} onChange={e => setGitForm(f => ({ ...f, branch: e.target.value }))} disabled={role === "READONLY"} />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" placeholder="GuilhermeAzespo" value={gitForm.username} onChange={e => setGitForm(f => ({ ...f, username: e.target.value }))} disabled={role === "READONLY"} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Token de Acesso (PAT)</label>
              <input id="git-token" className="form-input" type="password" placeholder="ghp_xxxxxxxxxxxx"
                value={gitForm.token} onChange={e => setGitForm(f => ({ ...f, token: e.target.value }))} disabled={role === "READONLY"} />
              <span className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>O token não é exibido após salvo por segurança.</span>
            </div>
            {role !== "READONLY" && (
              <button id="btn-save-git" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={saveGitConfig} disabled={saving}>
                {saving ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />Salvando...</> : "Salvar Configuração Git"}
              </button>
            )}
          </div>
        </div>

        {/* Commit history */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Histórico de Commits</h2>
          {commits.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "0.75rem" }}>Nenhum commit ainda. Configure o Git e faça o primeiro push.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {commits.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.status === "success" ? "var(--success)" : "var(--danger)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500 }}>{c.message}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {c.hash !== "error" ? <><span className="font-mono" style={{ color: "var(--primary)" }}>{c.hash?.slice(0, 8)}</span> · </> : null}
                      {c.author} · {new Date(c.createdAt).toLocaleString("pt-BR")} · {c.branch}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        {role === "ADMIN" && (
          <div className="card" style={{ padding: "1.5rem", borderColor: "rgba(239,68,68,0.2)" }}>
            <h2 style={{ fontSize: "1rem", color: "var(--danger)", marginBottom: "0.5rem" }}>⚠ Zona de Perigo</h2>
            <p className="text-secondary text-sm" style={{ marginBottom: "1rem" }}>Esta ação é irreversível. Todas as topologias e backups serão excluídos.</p>
            <button className="btn btn-danger" onClick={deleteProject}>Excluir Projeto</button>
          </div>
        )}
      </div>
    </div>
  );
}
