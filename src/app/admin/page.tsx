"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ROLES = ["ADMIN", "EDITOR", "READONLY"];

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "READONLY" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (role && role !== "ADMIN") { router.push("/dashboard"); return; }
    fetchUsers();
  }, [role]);

  async function fetchUsers() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  async function createUser() {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) {
      setFeedback({ type: "success", text: "✓ Usuário criado!" });
      setShowModal(false); setForm({ name: "", email: "", password: "", role: "READONLY" });
      await fetchUsers();
    } else {
      const err = await res.json();
      setFeedback({ type: "error", text: err.error || "Erro ao criar usuário" });
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 3000);
  }

  const ROLE_COLORS: Record<string, string> = { ADMIN: "badge-admin", EDITOR: "badge-editor", READONLY: "badge-readonly" };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>⚙ Administração</h1>
          <p className="text-secondary text-sm">Gerencie usuários e permissões da plataforma</p>
        </div>
        <button id="btn-new-user" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Novo Usuário</button>
      </div>
      <div className="page-body">
        {feedback && <div className={`alert alert-${feedback.type}`}>{feedback.text}</div>}
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nome", "Email", "Role", "Criado em"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--primary-glow)", border: "1px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{u.name}</span>
                      {u.id === (session?.user as any)?.id && <span className="badge badge-active" style={{ fontSize: "0.6rem" }}>Você</span>}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>{u.email}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><span className={`badge ${ROLE_COLORS[u.role] || "badge-readonly"}`}>{u.role}</span></td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-header"><h3>Novo Usuário</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input id="user-name" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input id="user-email" type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input id="user-password" type="password" className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button id="btn-create-user" className="btn btn-primary" onClick={createUser} disabled={saving || !form.name || !form.email || !form.password}>
                {saving ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />Criando...</> : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
