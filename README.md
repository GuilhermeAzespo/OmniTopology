# OmniTopology

Plataforma profissional para documentação e emulação comportamental de topologias de rede. Projetada para ser agnóstica a fornecedores, permitindo a gestão de ativos Cisco, Mikrotik, pfSense, Ubiquiti, entre outros, em um único canvas dinâmico.

## 🚀 Funcionalidades

- **Canvas Interativo (Drag & Drop):** Construído com React Flow para criar topologias complexas com facilidade.
- **Biblioteca Multi-Vendor:** Suporte para Roteadores, Switches, Firewalls, Access Points e Servidores.
- **CLI Emulada:** Terminal web integrado com suporte a sintaxe Cisco IOS, Mikrotik RouterOS e pfSense shell.
- **Gestão de Interfaces e VLANs:** Documente configurações de IP e redes de forma organizada.
- **Sistema de Backups e Rollback:** Tire snapshots do seu canvas e restaure versões anteriores a qualquer momento.
- **Integração Git Nativa:** Envie suas topologias e metadados diretamente para um repositório Git.
- **Exportação Versátil:** Exporte seus diagramas em PNG, PDF, JSON ou YAML.
- **Controle de Acesso:** Níveis de permissão Granulares (Administrador, Editor e Read-Only).

## 🛠️ Stack Tecnológica

- **Frontend & Backend:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM (v7)
- **Autenticação:** NextAuth.js (v4)
- **Diagramação:** React Flow
- **Estilização:** CSS Vanilla com Design System Premium (Dark Theme / Glassmorphism)
- **Deploy:** Docker & Docker Compose otimizado para Easypanel

## 📦 Deploy no Easypanel

1. Crie um novo projeto no Easypanel
2. Crie um serviço Postgres (versão 16)
3. Crie um serviço App (Node.js/Docker)
4. Defina a origem do código para este repositório GitHub
5. Adicione as Variáveis de Ambiente (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
6. (Opcional) Adicione o comando `npx prisma db push && npm run db:seed` no post-deploy para preparar o banco de dados inicial.

## 👥 Credenciais Iniciais (Após o Seed)
- **Administrador:** admin@omnitopology.local / admin123
- **Editor:** editor@omnitopology.local / editor123
