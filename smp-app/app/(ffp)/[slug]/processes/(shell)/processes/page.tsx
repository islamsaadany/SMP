import { requireOffice } from "@/ffp/lib/auth/require-office";
import { isOverdueForReview, STATUS_LABEL } from "@/ffp/lib/domain/process-lifecycle";
import { registerReady } from "@/ffp/lib/register-sync";
import Link from "next/link";
import { prisma } from "@/ffp/lib/db/client";
import { Prisma } from "@/ffp/generated/prisma/client";
import { CreateProcessForm, CloneProcessButton, EditProcessButton, ArchiveProcessButton } from "./process-forms";
import { GenerateTemplateForm } from "./template-form";
import { ImportPanel } from "./import-panel";
import { FoldProvider, FoldRow, FoldToggle, FoldAllControls } from "./process-fold";
import { foldChains } from "./fold-chains";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { processGaps } from "@/ffp/lib/data/process-gaps";
import { clientSettings } from "@/ffp/lib/data/client-settings";
import { READINESS_MARKS, READINESS_RULES, readinessMarks } from "@/ffp/lib/domain/process-readiness";
import { hasSufficientAccess } from "@/ffp/lib/domain/access-control";
import { orderProcessTree } from "@/ffp/lib/domain/process-hierarchy";

export default async function ProcessesPage(props: PageProps<"/[slug]/processes/processes">) {
  const { slug: workspaceId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);
  const searchParams = await props.searchParams;
  const qRaw = searchParams["q"];
  const q = (typeof qRaw === "string" ? qRaw : "").trim();
  /* Every heading sorts (spec 067 §4.2, Q8); a sorted list is flat, like a searched one. */
  const sortRaw = typeof searchParams["sort"] === "string" ? searchParams["sort"] : "";
  const sort = (["name", "owner", "state", "ready", "gaps"] as const).find((k) => k === sortRaw) ?? null;
  const desc = searchParams["dir"] === "desc";

  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

  // The layout has already admitted this viewer; this re-reads the level so the
  // recovery link is offered only to someone who could act on it.
  const access = await requireWorkspaceAccess(workspaceId, "VIEWER");
  const canEdit = access.ok && hasSufficientAccess(access.data.accessLevel, "EDITOR");

  const [processes, allCategories, deletedCount, registerPeople] = await Promise.all([
    prisma.process.findMany({
      where: {
        workspaceId,
        archivedAt: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
                { category: { name: { contains: q, mode: "insensitive" } } },
                { owner: { name: { contains: q, mode: "insensitive" } } },
                { steps: { some: { label: { contains: q, mode: "insensitive" } } } },
                { activities: { some: { name: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { steps: true } },
        raciMatrixStatus: true,
        parentProcess: true,
        category: true,
        owner: { select: { name: true } },
        /* the version in force while the next is drafted: published, and kept (stage 5, process-content.ts inForce) */
        versions: { where: { publishedAt: { not: null }, snapshot: { not: Prisma.DbNull } }, orderBy: { number: "desc" }, take: 1, select: { number: true } },
        // Steps feed the "Branches from → starts at step" picker; the branch
        // origin feeds the sub-line under a branching process's name.
        steps: { select: { id: true, label: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
        branchFromStep: { select: { id: true, label: true, process: { select: { id: true, code: true } } } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.processCategory.findMany({ where: { firmId: workspace.firmId } }),
    prisma.process.count({ where: { workspaceId, archivedAt: { not: null } } }),
    /* who can own a process: the client register (stage 4, Islam: "all names from register") */
    prisma.person.findMany({ where: { workspaceId, archivedAt: null, smpKey: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  /* A process's department is one of the client's Official BU names (stage 1b, spec 067 §4.4), in the
     list's own order; a department a process already files under stays offered, so editing it keeps it. */
  const departments = (await clientSettings(workspaceId))?.departments ?? [];
  const usedIds = new Set(processes.map((p) => p.categoryId).filter(Boolean));
  const categories = [
    ...departments.map((n) => allCategories.find((c) => c.name === n)).filter((c): c is (typeof allCategories)[number] => !!c),
    ...allCategories.filter((c) => usedIds.has(c.id) && !departments.includes(c.name)).sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const processOptions = processes.map((proc) => ({
    id: proc.id,
    code: proc.code,
    name: proc.name,
    steps: proc.steps.map((step) => ({ id: step.id, label: step.label })),
  }));

  // Group as a tree: a parent, then its children, to whatever depth the data
  // goes. This was built inline as a *two-level* tree — top-level processes,
  // each followed by its direct children, plus any child whose parent was
  // missing — and a process nested one level deeper than that was in none of
  // those buckets and silently vanished from the list. It still opened by URL
  // and search still found it, because search shows matches flat and skips
  // the grouping entirely, which is exactly how it was reported: "it's not
  // displayed, I have to search for it."
  //
  // Search results stay flat (by code) — a match's parent may not itself match.
  /* Where each process is, and how ready (spec 067 §4.2): the lifecycle in words, the six marks, the gaps. */
  const gapDetail = await processGaps(workspaceId);
  const now = new Date();
  const facts = (p: (typeof processes)[number]) => {
    const d = gapDetail.get(p.id);
    const marks = readinessMarks({
      steps: d?.steps ?? 0,
      kinds: d?.kinds ?? new Set(),
      controls: d?.controls ?? 0,
      controlsMissing: d?.controlsMissing ?? 0,
      sopVersion: p.sopVersion,
      sopEffectiveDate: p.sopEffectiveDate,
      lifecycleStatus: p.lifecycleStatus,
    });
    const overdue = isOverdueForReview(p.lifecycleStatus, p.nextReviewDue, now);
    const sentBack = p.lifecycleStatus === "DRAFT" && !!p.returnReason;
    /* while its next version is drawn, a process keeps the one in force (stage 5) */
    const held = p.lifecycleStatus !== "PUBLISHED" && p.lifecycleStatus !== "RETIRED" && p.versions[0] ? ` · v${p.versions[0].number} in force` : "";
    /* "Where it is" sorts by what needs the office first */
    const state0 = sentBack
      ? { label: "Sent back", tone: "bad", rank: 0 }
      : overdue
        ? { label: "Review overdue", tone: "bad", rank: 1 }
        : p.lifecycleStatus === "APPROVED"
          ? { label: "Approved, to publish", tone: "attn", rank: 2 }
          : p.lifecycleStatus === "IN_REVIEW"
            ? { label: "In review", tone: "attn", rank: 3 }
            : p.lifecycleStatus === "DRAFT"
              ? { label: "Draft", tone: "q", rank: 4 }
              : { label: STATUS_LABEL[p.lifecycleStatus], tone: p.lifecycleStatus === "PUBLISHED" ? "good" : "q", rank: p.lifecycleStatus === "PUBLISHED" ? 5 : 6 };
    const state = { ...state0, label: state0.label + held };
    return { marks, ready: Object.values(marks).filter(Boolean).length, gaps: d?.gaps ?? 0, state };
  };
  const factsById = new Map(processes.map((p) => [p.id, facts(p)]));
  const KEY = {
    name: (p: (typeof processes)[number]) => p.name.toLowerCase(),
    owner: (p: (typeof processes)[number]) => (p.owner?.name ?? "\uffff").toLowerCase(),
    state: (p: (typeof processes)[number]) => factsById.get(p.id)!.state.rank,
    ready: (p: (typeof processes)[number]) => factsById.get(p.id)!.ready,
    gaps: (p: (typeof processes)[number]) => factsById.get(p.id)!.gaps,
  };
  const sorted = sort
    ? [...processes].sort((a, b) => {
        const x = KEY[sort](a), y = KEY[sort](b);
        const c = typeof x === "number" ? x - (y as number) : String(x).localeCompare(String(y));
        return (desc ? -c : c) || a.code.localeCompare(b.code);
      })
    : processes;
  const rows = q || sort
    ? sorted.map((process) => ({ process, depth: 0 }))
    : orderProcessTree(processes);

  // Search results and sorted lists are flat and are never folded (process-fold.tsx).
  const { ancestorsOf, directSubs } = foldChains(rows);
  const folding = !q && !sort;
  const totalCount = await prisma.process.count({ where: { workspaceId, archivedAt: null } });
  const sortHref = (k: NonNullable<typeof sort>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    next.set("sort", k);
    if (sort === k && !desc) next.set("dir", "desc");
    return `/${workspaceId}/processes/processes?${next}`;
  };
  const TONE: Record<string, string> = {
    good: "bg-[var(--good-bg)] text-[var(--good-tx)]",
    attn: "bg-[var(--attn-bg)] text-[var(--attn-tx)]",
    bad: "bg-[var(--bad-bg)] text-[var(--bad-tx)]",
    q: "bg-[var(--surface-2)] text-[var(--ink-2)]",
  };

  return (
    <main className="w-full">

      <form method="GET" className="flex flex-wrap items-center gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, code, owner, department, or task…"
          aria-label="Search processes"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Search
        </button>
        {(q || sort) && (
          <Link
            href={`/${workspaceId}/processes/processes`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear
          </Link>
        )}
        <span className="text-[12.5px] text-[var(--ink-3)]">
          {q ? `${rows.length} of ${totalCount} processes` : `${totalCount} process${totalCount === 1 ? "" : "es"} · click a heading to sort`}
        </span>
      </form>

      {canEdit && (
        <p className="mt-3 text-xs">
          <Link
            href={`/${workspaceId}/processes/processes/deleted`}
            className="font-semibold text-slate-600 underline hover:text-slate-900"
          >
            Deleted processes
            {deletedCount > 0 ? ` (${deletedCount})` : ""}
          </Link>
          <span className="ms-2 text-slate-600">Deleting hides a process — it can be brought back.</span>
        </p>
      )}

      <FoldProvider enabled={folding} parentIds={[...directSubs.keys()]}>
      <FoldAllControls any={directSubs.size > 0} />
      <div className="relative mt-3 overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--thead)] text-start text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--ink-2)]">
            <tr>
              {(
                [
                  ["name", "Process"],
                  ["owner", "Owner"],
                  ["state", "Where it is"],
                  ["ready", "Ready"],
                  ["gaps", "Gaps"],
                ] as const
              ).map(([k, label]) => (
                <th key={k} className="border-b border-[var(--line)] p-0 text-start" aria-sort={sort === k ? (desc ? "descending" : "ascending") : undefined}>
                  <Link href={sortHref(k)} className="flex items-center gap-1.5 px-3 py-2.5 hover:text-[var(--ink)]">
                    {label}
                    <span aria-hidden="true" className={sort === k ? "text-[var(--gold-deep)]" : "text-[var(--ink-3)]"}>
                      {sort === k ? (desc ? "↓" : "↑") : "↕"}
                    </span>
                  </Link>
                </th>
              ))}
              <th className="border-b border-[var(--line)] px-3 py-2.5 text-end">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="ffp-zebra">
            {rows.map(({ process: p, depth }) => {
              const f = factsById.get(p.id)!;
              return (
              <FoldRow
                key={p.id}
                ancestors={ancestorsOf.get(p.id) ?? []}
                className="border-t border-[var(--line-soft)]"
              >
                <td
                  className="px-3 py-2.5"
                  // Indented by how deep it actually sits, so a sub-process of
                  // a sub-process reads as one rather than as a sibling of its
                  // own parent.
                  style={depth > 0 ? { paddingInlineStart: 12 + depth * 30 } : undefined}
                >
                  <div className="flex items-start">
                    <FoldToggle id={p.id} code={p.code} count={directSubs.get(p.id) ?? 0} />
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-[var(--stone)]">{p.code}</span>{" "}
                      <Link href={`/${workspaceId}/processes/processes/${p.id}`} className="font-bold text-[var(--ink)] hover:underline hover:decoration-[var(--gold)]">
                        {p.name}
                      </Link>
                      {folding && (directSubs.get(p.id) ?? 0) > 0 && (
                        <span className="ms-2 text-xs font-normal text-[var(--ink-3)]" data-fold-count>
                          {directSubs.get(p.id) === 1 ? "1 sub-process" : `${directSubs.get(p.id)} sub-processes`}
                        </span>
                      )}
                      {/* Said only where the parent is not the row it is folded
                          under — a search result, or one whose parent is deleted. */}
                      {p.parentProcessId && depth === 0 && (
                        <span className="ms-2 text-xs font-normal text-[var(--ink-3)]">
                          sub-process of {p.parentProcess?.code}
                          {/* The parent is loaded regardless of its own deletion, so
                              without this the row named a code that is nowhere on
                              the list — the child looked misfiled rather than
                              orphaned. */}
                          {p.parentProcess?.archivedAt ? " (deleted)" : ""}
                        </span>
                      )}
                      {p.category && <span className="block text-xs text-[var(--ink-3)]">{p.category.name}</span>}
                      {p.branchFromStep && (
                        <span className="block text-xs font-normal text-amber-700">
                          ↰ branches from {p.branchFromStep.process.code} · {p.branchFromStep.label}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="border-s border-[var(--line-soft)] px-3 py-2.5">{p.owner?.name ?? <span className="text-[var(--ink-3)]">—</span>}</td>
                <td className="border-s border-[var(--line-soft)] px-3 py-2.5">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-[9px] py-px text-[11.5px] font-semibold ${TONE[f.state.tone]}`}>{f.state.label}</span>
                </td>
                <td className="border-s border-[var(--line-soft)] px-3 py-2.5">
                  <span className="inline-flex gap-[3px]" aria-label={`${f.ready} of 6 ready`}>
                    {READINESS_MARKS.map((mk) => (
                      <i
                        key={mk}
                        title={`${mk}: ${READINESS_RULES[mk]}${f.marks[mk] ? "" : " (not yet)"}`}
                        className={`inline-grid h-[18px] w-[18px] place-items-center rounded-[4px] border text-[10px] font-extrabold not-italic ${f.marks[mk] ? "border-[var(--panel)] bg-[var(--panel)] text-[var(--panel-ink)]" : "border-[var(--line)] text-[var(--ink-3)]"}`}
                      >
                        {mk === "Approved" ? "✓" : mk[0]}
                      </i>
                    ))}
                  </span>
                </td>
                <td className={`border-s border-[var(--line-soft)] px-3 py-2.5 ${f.gaps ? "font-semibold text-[var(--bad-tx)]" : "text-[var(--ink-3)]"}`}>{f.gaps || "—"}</td>
                <td className="border-s border-[var(--line-soft)] px-3 py-2.5 text-end">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/${workspaceId}/processes/processes/${p.id}`}
                      className="whitespace-nowrap rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink-2)] hover:border-[var(--gold)] hover:text-[var(--ink)]"
                    >
                      Open
                    </Link>
                    <EditProcessButton
                      workspaceId={workspaceId}
                      process={{
                        id: p.id,
                        code: p.code,
                        name: p.name,
                        description: p.description ?? "",
                        categoryId: p.categoryId,
                        parentProcessId: p.parentProcessId,
                        branchFromStepId: p.branchFromStepId,
                        branchFromProcessId: p.branchFromStep?.process.id ?? null,
                      }}
                      processes={processOptions}
                      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                    />
                    <CloneProcessButton
                      workspaceId={workspaceId}
                      sourceProcessId={p.id}
                      sourceName={p.name}
                      sourceParentProcessId={p.parentProcessId}
                      processes={processOptions}
                    />
                    <ArchiveProcessButton workspaceId={workspaceId} processId={p.id} />
                  </div>
                </td>
              </FoldRow>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {q ? `No processes match "${q}".` : "No processes yet — create one below."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </FoldProvider>

      {/* the band's New process lands here */}
      <div id="new-process" className="mt-4 flex scroll-mt-24 flex-col gap-3">
        <CreateProcessForm
          workspaceId={workspaceId}
          processes={processOptions}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          people={registerPeople}
          prefill={typeof searchParams["new"] === "string" ? { name: searchParams["new"], fromSuggestionId: typeof searchParams["from"] === "string" ? searchParams["from"] : "" } : null}
        />
        <GenerateTemplateForm workspaceId={workspaceId} />
        {canEdit && <ImportPanel workspaceId={workspaceId} />}
      </div>
    </main>
  );
}
