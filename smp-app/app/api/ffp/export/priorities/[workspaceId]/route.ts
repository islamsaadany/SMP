import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { officeSeat } from "@/ffp/lib/auth/workspace";
import { prisma } from "@/ffp/lib/db/client";
import { loadPlan, loadPriorityRows } from "@/ffp/lib/data/priorities";
import { ASPECT_DEFS, DECISION_LABEL, inTree } from "@/ffp/lib/domain/priorities";

/**
 * The deep-dive priorities as a spreadsheet: the office's working list, one row per process in the
 * same order as the screen, with the "why" notes. Office only — it carries the working notes, so it
 * is not the client's page (that is the one-page sign-off export).
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
  const ws = wb.addWorksheet("Priorities", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Level", key: "level", width: 8 },
    { header: "Code", key: "code", width: 12 },
    { header: "Process", key: "name", width: 40 },
    { header: "Main process", key: "main", width: 30 },
    { header: "Department", key: "dept", width: 20 },
    { header: "Importance (1-5)", key: "imp", width: 12 },
    { header: "Complexity (1-5)", key: "cx", width: 12 },
    { header: "Risk (1-5)", key: "risk", width: 10 },
    { header: "Score (0-100)", key: "score", width: 10 },
    { header: "Rank", key: "rank", width: 8 },
    { header: "Decision", key: "dec", width: 16 },
    { header: "Why", key: "why", width: 40 },
    { header: "Deep dive (of 6)", key: "done", width: 12 },
    ...ASPECT_DEFS.map((a) => ({ header: a.label, key: `a_${a.label}`, width: 11 })),
  ];
  ws.getRow(1).font = { bold: true };
  for (const { row: r, sub } of rows) {
    ws.addRow({
      level: sub ? "Sub" : "Main",
      code: r.code,
      name: r.name,
      main: r.parentId ? (byId.get(r.parentId)?.name ?? "") : "",
      dept: r.department ?? "",
      imp: r.importance ?? "",
      cx: r.complexity ?? "",
      risk: r.risk ?? "",
      score: r.score ?? "",
      rank: r.rank ?? "",
      dec: r.decision ? DECISION_LABEL[r.decision] : "Not decided",
      why: r.why ?? "",
      done: r.progress.done,
      ...Object.fromEntries(r.progress.aspects.map((a) => [`a_${a.label}`, a.done ? "Yes" : "No"])),
    });
  }

  const st = wb.addWorksheet("Flagged steps", { views: [{ state: "frozen", ySplit: 1 }] });
  st.columns = [
    { header: "In process", key: "proc", width: 36 },
    { header: "Process code", key: "code", width: 12 },
    { header: "Step", key: "step", width: 40 },
    { header: "Importance (1-5)", key: "imp", width: 12 },
    { header: "Complexity (1-5)", key: "cx", width: 12 },
    { header: "Risk (1-5)", key: "risk", width: 10 },
    { header: "Score (0-100)", key: "score", width: 10 },
    { header: "Why", key: "why", width: 40 },
    { header: "What the map noticed", key: "sig", width: 50 },
    { header: "Now its own process", key: "now", width: 30 },
  ];
  st.getRow(1).font = { bold: true };
  for (const { row: r } of rows) {
    for (const x of r.steps.filter((y) => y.flagged || y.nowProcesses.length)) {
      st.addRow({
        proc: r.name, code: r.code, step: x.label, imp: x.importance ?? "", cx: x.complexity ?? "", risk: x.risk ?? "",
        score: x.score ?? "", why: x.why ?? "", sig: x.signals.map((g) => g.label).join("; "), now: x.nowProcesses.map((p) => `${p.name} (${p.code})`).join("; "),
      });
    }
  }

  const s = wb.addWorksheet("Settings");
  s.columns = [{ header: "Setting", key: "k", width: 36 }, { header: "Value", key: "v", width: 40 }];
  s.getRow(1).font = { bold: true };
  s.addRows([
    { k: "Client", v: workspace.name },
    { k: "Exported", v: new Date().toISOString().slice(0, 10) },
    { k: "Weight: importance", v: `${plan.weights.importance}%` },
    { k: "Weight: risk", v: `${plan.weights.risk}%` },
    { k: "Weight: complexity", v: `${plan.weights.complexity}%` },
    { k: "Deep dives at once", v: plan.capacity },
    { k: "Plan status", v: plan.status === "DRAFT" ? "Draft" : plan.status === "SENT" ? "With the client" : "Approved" },
    { k: "Approver", v: plan.approverName ? `${plan.approverName}${plan.approverRole ? `, ${plan.approverRole}` : ""}` : "" },
  ]);

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${workspace.name.replace(/[^a-z0-9]+/gi, "-")}-priorities.xlsx"`,
    },
  });
}
