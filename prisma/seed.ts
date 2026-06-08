import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding OmniTopology database...");

  // Admin user
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@omnitopology.local" },
    update: {},
    create: {
      email: "admin@omnitopology.local",
      password: adminPass,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  // Editor user
  const editorPass = await bcrypt.hash("editor123", 10);
  const editor = await prisma.user.upsert({
    where: { email: "editor@omnitopology.local" },
    update: {},
    create: {
      email: "editor@omnitopology.local",
      password: editorPass,
      name: "Editor Redes",
      role: "EDITOR",
    },
  });

  // Demo project
  const project = await prisma.project.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      name: "Rede Corporativa Demo",
      description: "Topologia de exemplo com roteadores, switches e firewalls",
      color: "#06b6d4",
      icon: "network",
      members: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: editor.id, role: "EDITOR" },
        ],
      },
    },
  });

  // Demo topology
  const demoCanvas = {
    nodes: [
      {
        id: "node-1", type: "deviceNode",
        position: { x: 300, y: 150 },
        data: {
          label: "Core Router", deviceId: "mikrotik-router", vendor: "mikrotik",
          category: "router", model: "CCR2004", hostname: "core-router-01",
          status: "active", color: "#ef4444",
          interfaces: [
            { name: "ether1", ip: "192.168.1.1/24" },
            { name: "ether2", ip: "10.0.0.1/24" },
          ],
          notes: "Roteador principal da rede corporativa",
        },
      },
      {
        id: "node-2", type: "deviceNode",
        position: { x: 150, y: 320 },
        data: {
          label: "Firewall", deviceId: "pfsense", vendor: "pfsense",
          category: "firewall", model: "pfSense CE", hostname: "fw-01",
          status: "active", color: "#d97706",
          interfaces: [
            { name: "em0", ip: "192.168.1.2/24" },
            { name: "em1", ip: "10.10.0.1/24" },
          ],
          notes: "Firewall perimetral",
        },
      },
      {
        id: "node-3", type: "deviceNode",
        position: { x: 450, y: 320 },
        data: {
          label: "Core Switch", deviceId: "cisco-switch", vendor: "cisco",
          category: "switch", model: "Catalyst 9300", hostname: "sw-core-01",
          status: "active", color: "#1d4ed8",
          interfaces: [
            { name: "Gi0/0", ip: "" },
            { name: "Gi0/1", ip: "" },
          ],
          notes: "Switch de core, VLANs 10,20,30",
        },
      },
      {
        id: "node-4", type: "deviceNode",
        position: { x: 300, y: 490 },
        data: {
          label: "Servidor Linux", deviceId: "linux-server", vendor: "linux",
          category: "server", model: "Ubuntu Server 22.04", hostname: "srv-app-01",
          status: "active", color: "#f59e0b",
          interfaces: [{ name: "eth0", ip: "10.0.0.10/24" }],
          notes: "Servidor de aplicações",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "node-1", target: "node-2", label: "Ethernet", data: { linkType: "ethernet" } },
      { id: "e1-3", source: "node-1", target: "node-3", label: "Ethernet", data: { linkType: "ethernet" } },
      { id: "e3-4", source: "node-3", target: "node-4", label: "Ethernet", data: { linkType: "ethernet" } },
    ],
  };

  await prisma.topology.upsert({
    where: { id: "demo-topo-001" },
    update: {},
    create: {
      id: "demo-topo-001",
      name: "Topologia Principal",
      description: "Topologia de demonstração com dispositivos Mikrotik, Cisco e pfSense",
      projectId: project.id,
      canvasData: demoCanvas,
      version: 1,
    },
  });

  console.log("✅ Seed completed!");
  console.log("📧 Admin: admin@omnitopology.local / admin123");
  console.log("📧 Editor: editor@omnitopology.local / editor123");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
