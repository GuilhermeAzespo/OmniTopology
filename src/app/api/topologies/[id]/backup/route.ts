import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/topologies/[id]/backup — create snapshot
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topology = await prisma.topology.findUnique({ where: { id: params.id } });
  if (!topology) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, description } = await req.json().catch(() => ({}));
  const dataStr = JSON.stringify(topology.canvasData);
  const backup = await prisma.backup.create({
    data: {
      topologyId: params.id,
      name: name || `Backup v${topology.version} — ${new Date().toLocaleString("pt-BR")}`,
      description: description || "",
      canvasData: topology.canvasData as any,
      version: topology.version,
      fileSize: Buffer.byteLength(dataStr, "utf8"),
      createdBy: session.user?.name || session.user?.email || "unknown",
    },
  });
  return NextResponse.json(backup, { status: 201 });
}

// GET /api/topologies/[id]/backup — list backups
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const backups = await prisma.backup.findMany({
    where: { topologyId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(backups);
}
