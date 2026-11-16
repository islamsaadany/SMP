import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { ProcessMapPdfDocument } from "@/ffp/lib/export/pdf/process-map-pdf";
import { auth } from "@/ffp/lib/auth/config";

export async function GET(_request: Request, ctx: { params: Promise<{ processId: string }> }) {
  return build(await ctx.params, null);
}

/** The same PDF with the map's own drawing (a picture the page took) as its first page, so the PDF shows the whole map as it is drawn. */
export async function POST(request: Request, ctx: { params: Promise<{ processId: string }> }) {
  let image: string | null = null;
  try {
    const body = (await request.json()) as { image?: unknown };
    if (typeof body.image === "string" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.image) && body.image.length < 12_000_000) image = body.image;
  } catch {}
  if (!image) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  return build(await ctx.params, image);
}

async function build({ processId }: { processId: string }, mapImage: string | null) {

  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const access = await requireWorkspaceAccess(process.workspaceId, "VIEWER");
  if (!access.ok) {
    const status = access.error === "UNAUTHORIZED" ? 401 : access.error === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json(access, { status });
  }

  const [workspace, steps, connections, session] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: process.workspaceId } }),
    prisma.processStep.findMany({
      where: { processId },
      include: { assignedRole: true, links: { include: { targetProcess: true } } },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.stepConnection.findMany({ where: { processId } }),
    auth(),
  ]);

  const predecessorOf = new Map(connections.map((c) => [c.toStepId, c.fromStepId]));
  const stepById = new Map(steps.map((s) => [s.id, s]));

  const buffer = await renderToBuffer(
    ProcessMapPdfDocument({
      workspaceName: workspace?.name ?? "",
      processCode: process.code,
      processName: process.name,
      steps: steps.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        roleName: s.assignedRole?.name ?? null,
        predecessorLabel: stepById.get(predecessorOf.get(s.id) ?? "")?.label ?? null,
        links: s.links.map((l) => ({ code: l.targetProcess.code, name: l.targetProcess.name })),
      })),
      generatedFor: session?.user?.email ?? "Unknown",
      mapImage,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${process.code}-process-map.pdf"`,
    },
  });
}
