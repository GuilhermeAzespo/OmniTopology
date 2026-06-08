import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = (session.user as any).companyId;

  const project = await prisma.project.findFirst({
    where: { id, companyId },
    include: {
      topologies: { 
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { backups: true } } }
      },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      gitConfigs: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

// PATCH /api/projects/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const companyId = (session.user as any).companyId;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existingProject = await prisma.project.findFirst({ where: { id, companyId } });
  if (!existingProject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const project = await prisma.project.update({
    where: { id },
    data: { name: data.name, description: data.description, color: data.color, icon: data.icon },
  });
  return NextResponse.json(project);
}

// DELETE /api/projects/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const companyId = (session.user as any).companyId;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existingProject = await prisma.project.findFirst({ where: { id, companyId } });
  if (!existingProject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
