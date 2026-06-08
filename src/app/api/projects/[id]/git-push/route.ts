import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import simpleGit from "simple-git";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import path from "path";
import os from "os";

// POST /api/projects/[id]/git-push
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "READONLY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { message } = await req.json().catch(() => ({}));
  const commitMessage = message || `chore: update topology snapshot [${new Date().toISOString()}]`;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      topologies: true,
      gitConfigs: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const gitConfig = project.gitConfigs[0];
  if (!gitConfig) return NextResponse.json({ error: "Git não configurado para este projeto" }, { status: 400 });

  const tmpDir = path.join(os.tmpdir(), `omnitopology-${id}-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const repoUrlWithAuth = gitConfig.token
      ? gitConfig.repoUrl.replace("https://", `https://${gitConfig.username || "oauth2"}:${gitConfig.token}@`)
      : gitConfig.repoUrl;

    const git = simpleGit({ baseDir: tmpDir });
    await git.clone(repoUrlWithAuth, ".", ["--depth", "1", "--branch", gitConfig.branch]);

    // Write topology files
    const topoDir = path.join(tmpDir, "topologies");
    mkdirSync(topoDir, { recursive: true });

    for (const topo of project.topologies) {
      writeFileSync(
        path.join(topoDir, `${topo.name.replace(/[^a-z0-9]/gi, "_")}.json`),
        JSON.stringify({ name: topo.name, version: topo.version, updatedAt: topo.updatedAt, canvasData: topo.canvasData }, null, 2)
      );
    }
    writeFileSync(path.join(tmpDir, "project.json"), JSON.stringify({ id: project.id, name: project.name, description: project.description, updatedAt: new Date() }, null, 2));

    await git.addConfig("user.name", process.env.GIT_AUTHOR_NAME || "OmniTopology");
    await git.addConfig("user.email", process.env.GIT_AUTHOR_EMAIL || "omni@topology.local");
    await git.add(".");
    const commitResult = await git.commit(commitMessage);
    await git.push("origin", gitConfig.branch);

    const hash = commitResult.commit || "unknown";
    await prisma.gitCommit.create({
      data: {
        gitConfigId: gitConfig.id,
        hash,
        message: commitMessage,
        author: session.user?.name || "OmniTopology",
        branch: gitConfig.branch,
        status: "success",
      },
    });

    return NextResponse.json({ ok: true, hash, message: commitMessage });
  } catch (err: any) {
    await prisma.gitCommit.create({
      data: {
        gitConfigId: gitConfig.id,
        hash: "error",
        message: commitMessage,
        author: session.user?.name || "OmniTopology",
        branch: gitConfig.branch,
        status: "error",
      },
    }).catch(() => {});
    return NextResponse.json({ error: err.message || "Git push failed" }, { status: 500 });
  } finally {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  }
}

// GET /api/projects/[id]/git-push — commit history
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gitConfig = await prisma.gitConfig.findUnique({
    where: { projectId: id },
    include: { commits: { orderBy: { createdAt: "desc" }, take: 30 } },
  });
  if (!gitConfig) return NextResponse.json({ commits: [], config: null });
  return NextResponse.json({ commits: gitConfig.commits, config: { repoUrl: gitConfig.repoUrl, branch: gitConfig.branch, username: gitConfig.username } });
}
