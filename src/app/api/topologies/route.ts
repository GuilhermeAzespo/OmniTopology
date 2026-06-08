import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/topologies?projectId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = (session.user as any).companyId;
  const projectId = req.nextUrl.searchParams.get("projectId");
  
  const where: any = { project: { companyId } };
  if (projectId) where.projectId = projectId;

  const topologies = await prisma.topology.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { backups: true } } },
  });
  return NextResponse.json(topologies);
}

// POST /api/topologies
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const companyId = (session.user as any).companyId;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, projectId, canvasData } = await req.json();
  if (!name || !projectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) return NextResponse.json({ error: "Project not found or forbidden" }, { status: 404 });

  const topology = await prisma.topology.create({
    data: { name, description, projectId, canvasData: canvasData || { nodes: [], edges: [] } },
  });
  return NextResponse.json(topology, { status: 201 });
}
