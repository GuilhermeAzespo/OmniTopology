import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  let projects;
  if (role === "ADMIN") {
    projects = await prisma.project.findMany({
      include: { _count: { select: { topologies: true, members: true } } },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { topologies: true, members: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }
  return NextResponse.json(projects);
}

// POST /api/projects
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, color, icon } = await req.json();
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const userId = (session.user as any).id;
  const project = await prisma.project.create({
    data: {
      name, description, color: color || "#06b6d4", icon: icon || "network",
      members: { create: { userId, role: "ADMIN" } },
    },
    include: { _count: { select: { topologies: true, members: true } } },
  });
  return NextResponse.json(project, { status: 201 });
}
