import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniTopology — Network Documentation & Emulation",
  description:
    "Plataforma profissional de documentação e emulação de topologias de rede. Suporte a Cisco, Mikrotik, pfSense, Firewalls, Switches e muito mais.",
  keywords: "network topology, documentation, Mikrotik, Cisco, pfSense, firewall, switch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
