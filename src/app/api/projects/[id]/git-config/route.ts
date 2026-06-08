import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]/git-config
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = await prisma.gitConfig.findUnique({ where: { projectId: id } });
  if (!config) return NextResponse.json(null);
  // Don't expose the token
  return NextResponse.json({ id: config.id, repoUrl: config.repoUrl, branch: config.branch, username: config.username, autoCommit: config.autoCommit });
}

// POST /api/projects/[id]/git-config — create or update
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { repoUrl, branch, token, username, autoCommit } = await req.json();
  if (!repoUrl) return NextResponse.json({ error: "repoUrl required" }, { status: 400 });

  const config = await prisma.gitConfig.upsert({
    where: { projectId: id },
    update: { repoUrl, branch: branch || "main", token, username, autoCommit: !!autoCommit, userId: (session.user as any).id },
    create: { repoUrl, branch: branch || "main", token, username, autoCommit: !!autoCommit, projectId: id, userId: (session.user as any).id },
  });
  return NextResponse.json({ id: config.id, repoUrl: config.repoUrl, branch: config.branch, username: config.username });
}
