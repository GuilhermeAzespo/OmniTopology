"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, password }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar. Tente novamente.");
      }
      
      // Sucesso
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-grid" />
      </div>
      <div className="login-container">
        <div className="login-card card" style={{ maxWidth: "500px", margin: "0 auto" }}>
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.4)" strokeWidth="1"/>
              <circle cx="20" cy="20" r="4" fill="#06b6d4"/>
              <circle cx="8" cy="12" r="3" fill="#8b5cf6" opacity="0.8"/>
              <circle cx="32" cy="12" r="3" fill="#8b5cf6" opacity="0.8"/>
              <circle cx="8" cy="28" r="3" fill="#06b6d4" opacity="0.6"/>
              <circle cx="32" cy="28" r="3" fill="#06b6d4" opacity="0.6"/>
              <line x1="20" y1="20" x2="8" y2="12" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6"/>
              <line x1="20" y1="20" x2="32" y2="12" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6"/>
              <line x1="20" y1="20" x2="8" y2="28" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5"/>
              <line x1="20" y1="20" x2="32" y2="28" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5"/>
            </svg>
            <div>
              <h1 style={{ fontSize: "1.4rem", margin: 0 }}>OmniTopology</h1>
              <p style={{ fontSize: "0.75rem", margin: 0, color: "var(--text-muted)" }}>Network Documentation Platform</p>
            </div>
          </div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>Criar Nova Conta</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: "1.5rem" }}>Registre sua empresa e crie seu usuário Administrador</p>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Nome da Empresa</label>
              <input id="companyName" type="text" className="form-input" placeholder="Minha Empresa TI"
                value={companyName} onChange={e => setCompanyName(e.target.value)} required autoFocus />
            </div>
            
            <div className="form-group">
              <label className="form-label">Seu Nome</label>
              <input id="name" type="text" className="form-input" placeholder="João Silva"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email de Acesso</label>
              <input id="email" type="email" className="form-input" placeholder="admin@empresa.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input id="password" type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            
            <button id="btn-register" type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ padding: "0.7rem", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              {loading ? <><span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />Registrando...</> : "Criar Conta e Empresa"}
            </button>
            
            <p className="text-sm text-center mt-2">
              <span className="text-muted">Já possui uma conta? </span>
              <Link href="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
      <style>{`
        .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .login-bg { position: fixed; inset: 0; pointer-events: none; }
        .login-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
        .login-orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%); top: -100px; left: -100px; }
        .login-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); bottom: -80px; right: -80px; }
        .login-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 40px 40px; }
        .login-container { position: relative; z-index: 1; width: 100%; max-width: 460px; padding: 1.5rem; }
        .login-card { padding: 2.5rem; }
        .login-logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem; }
      `}</style>
    </div>
  );
}
