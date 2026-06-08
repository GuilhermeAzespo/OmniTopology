import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = (session.user as any).companyId;

  const t = await prisma.topology.findFirst({
    where: { id, project: { companyId } },
    include: { backups: { orderBy: { createdAt: "desc" } }, project: true },
  });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(t);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const companyId = (session.user as any).companyId;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.topology.findFirst({ where: { id, project: { companyId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const topology = await prisma.topology.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      canvasData: data.canvasData,
      version: data.incrementVersion ? { increment: 1 } : undefined,
    },
  });
  return NextResponse.json(topology);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const companyId = (session.user as any).companyId;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.topology.findFirst({ where: { id, project: { companyId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.topology.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
