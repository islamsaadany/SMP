import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { officeSeat } from "@/ffp/lib/auth/workspace";
import { prisma } from "@/ffp/lib/db/client";
import { loadPlan, loadPriorityRows } from "@/ffp/lib/data/priorities";
import { DECISION_LABEL, inTree } from "@/ffp/lib/domain/priorities";

/**
 * Every step of every process, main and sub, as one flat sheet for reporting, with a column saying
 * whether it is flagged. Office only: it carries the working notes and scores. One row per step,
 * with where it sits (process, main process, step number), who does it, whether it is flagged, its
 * scores, its wave and why. Processes in the screen's order, steps in map order.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const seat = await officeSeat(workspaceId);
  if (!seat.ok) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [plan, workspace] = await Promise.all([
    loadPlan(workspaceId),
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
  ]);
  if (!workspace) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const rows = inTree(await loadPriorityRows(workspaceId, plan.weights));
  const byId = new Map(rows.map((r) => [r.row.id, r.row]));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Steps", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Level", key: "level", width: 8 },
    { header: "Main process", key: "main", width: 30 },
    { header: "Process code", key: "code", width: 12 },
    { header: "Process", key: "proc", width: 36 },
    { header: "Department", key: "dept", width: 20 },
    { header: "Step no.", key: "no", width: 9 },
    { header: "Step", key: "step", width: 44 },
    { header: "Role", key: "role", width: 24 },
    { header: "Flagged", key: "flag", width: 9 },
    { header: "Importance (1-5)", key: "imp", width: 12 },
    { header: "Complexity (1-5)", key: "cx", width: 12 },
    { header: "Risk (1-5)", key: "risk", width: 10 },
    { header: "Score (0-100)", key: "score", width: 10 },
    { header: "Wave", key: "wave", width: 22 },
    { header: "Why", key: "why", width: 40 },
    { header: "What the map noticed", key: "sig", width: 50 },
    { header: "Now its own process", key: "now", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const { row: r, sub } of rows) {
    for (const x of r.steps) {
      ws.addRow({
        level: sub ? "Sub" : "Main",
        main: r.parentId ? (byId.get(r.parentId)?.name ?? "") : r.name,
        code: r.code,
        proc: r.name,
        dept: r.department ?? "",
        no: x.order + 1,
        step: x.label,
        role: x.roleName ?? "",
        flag: x.flagged ? "Yes" : "No",
        imp: x.importance ?? "",
        cx: x.complexity ?? "",
        risk: x.risk ?? "",
        score: x.score ?? "",
        wave: x.flagged ? (x.decision ? DECISION_LABEL[x.decision] : r.decision ? `${DECISION_LABEL[r.decision]} (with its process)` : "Not decided") : "",
        why: x.why ?? "",
        sig: x.signals.map((g) => g.label).join("; "),
        now: x.nowProcesses.map((p) => `${p.name} (${p.code})`).join("; "),
      });
    }
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${workspace.name.replace(/[^a-z0-9]+/gi, "-")}-all-steps.xlsx"`,
    },
  });
}
