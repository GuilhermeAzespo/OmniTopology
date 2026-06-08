import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/topologies/[id]/rollback — restore from backup
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { backupId, uploadedData } = await req.json();
  let canvasData: any;
  let version = 1;

  if (backupId) {
    const backup = await prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    canvasData = backup.canvasData;
    version = backup.version;
  } else if (uploadedData) {
    canvasData = uploadedData.canvasData || uploadedData;
    version = uploadedData.version || 1;
  } else {
    return NextResponse.json({ error: "backupId or uploadedData required" }, { status: 400 });
  }

  // Create snapshot before rollback
  const current = await prisma.topology.findUnique({ where: { id } });
  if (current) {
    await prisma.backup.create({
      data: {
        topologyId: id,
        name: `Pre-rollback snapshot — ${new Date().toLocaleString("pt-BR")}`,
        canvasData: current.canvasData as any,
        version: current.version,
        fileSize: Buffer.byteLength(JSON.stringify(current.canvasData), "utf8"),
        createdBy: session.user?.name || "system",
      },
    });
  }

  const topology = await prisma.topology.update({
    where: { id },
    data: { canvasData, version },
  });
  return NextResponse.json(topology);
}
