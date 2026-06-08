"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "⬡", label: "Dashboard" },
  { href: "/admin", icon: "⚙", label: "Admin", roles: ["ADMIN"] },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;

  return (
    <aside className="sidebar">
      <div style={{ padding: "1.25rem 1.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.4)" strokeWidth="1"/>
            <circle cx="20" cy="20" r="3.5" fill="#06b6d4"/>
            <circle cx="8" cy="12" r="2.5" fill="#8b5cf6"/>
            <circle cx="32" cy="12" r="2.5" fill="#8b5cf6"/>
            <circle cx="8" cy="28" r="2.5" fill="#06b6d4" opacity="0.7"/>
            <circle cx="32" cy="28" r="2.5" fill="#06b6d4" opacity="0.7"/>
            <line x1="20" y1="20" x2="8" y2="12" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7"/>
            <line x1="20" y1="20" x2="32" y2="12" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7"/>
            <line x1="20" y1="20" x2="8" y2="28" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
            <line x1="20" y1="20" x2="32" y2="28" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>OmniTopology</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Network Platform</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0.75rem 0", overflowY: "auto" }}>
        <div className="nav-section">Menu</div>
        {NAV.filter(item => !item.roles || item.roles.includes(role)).map(item => (
          <Link key={item.href} href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}>
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.5rem", marginBottom: "0.25rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary-glow)", border: "1px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.name}</div>
            <span className={`badge badge-${role?.toLowerCase()}`}>{role}</span>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem" }}>
          ↩ Sair
        </button>
      </div>
    </aside>
  );
}
