import { requireOffice } from "@/ffp/lib/auth/require-office";
import Link from "next/link";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import type { Revision } from "@/ffp/lib/domain/sop";
import { auth } from "@/ffp/lib/auth/config";
import { daysToReview, isOverdueForReview } from "@/ffp/lib/domain/process-lifecycle";
import { acknowledgementProgress, expectedAcknowledgers } from "@/ffp/lib/domain/process-reader";
import { StaffLink } from "../../staff-link";
import { LifecyclePanel } from "./lifecycle-panel";
import { AddControlForm, DeleteControlButton, AddNonConformanceForm, NonConformanceStatus } from "./quality-forms";
import { getMessages } from "@/ffp/lib/i18n/server";
import { OwnerPicker } from "./owner-picker";
import { inForce as heldVersion, liveContent, sameContent } from "@/ffp/lib/data/process-content";

/* The process page's own sections in the builder's menu (builder-frame.tsx); the Map, RACI, Authority and Check with AI are pages of their own. */
const TABS = ["lifecycle", "risks", "quality", "people", "compliance", "connections"] as const;
type Tab = (typeof TABS)[number];

type Kpi = { metric: string; target: string; frequency: string };

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line)] bg-white px-[18px] py-[22px] text-[13.5px] text-[var(--ink-2)]">
      <b className="mb-1 block text-[15px] text-[var(--ink)]">{title}</b>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default async function ProcessPage(props: PageProps<"/[slug]/processes/processes/[processId]">) {
  const { slug: workspaceId, processId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  const want = (await props.searchParams).tab;
  const tab = TABS.find((t) => t === want) as Tab | undefined;
  // The builder opens a process on its Map (spec 067 §4.3).
  if (!tab) redirect(`/${workspaceId}/processes/processes/${processId}/map`);
  await registerReady(workspaceId);

  const process = await prisma.process.findUnique({
    where: { id: processId },
    
  });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [controls, ncs, stepList, registerPeople, versions, session, msgs] = await Promise.all([
    prisma.processControl.findMany({
      where: { processId },
      include: { step: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.processNonConformance.findMany({ where: { processId }, orderBy: { raisedAt: "desc" } }),
    prisma.processStep.findMany({ where: { processId }, orderBy: { order: "asc" } }),
    prisma.person.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, smpKey: true, personRoles: { select: { roleId: true, role: { select: { name: true, archivedAt: true } } } } },
    }),
    prisma.processVersion.findMany({ where: { processId }, orderBy: { number: "desc" } }),
    auth(),
    getMessages(),
  ]);
  const bp = msgs.builder.page;
  const people = registerPeople.map((x) => {
    const roles = x.personRoles.filter((r) => !r.role.archivedAt).map((r) => r.role.name);
    return { id: x.id, name: x.name, email: x.email, role: roles.length ? roles.join(", ") : null };
  });
  // Who is expected to have read the version in force, and who has: people
  // holding a role one of the steps is given to, against the acknowledgements.
  // The version in force stays in force while the next is drawn (stage 5): its steps say who reads it.
  const held = tab === "lifecycle" ? await heldVersion(processId) : null;
  const inForce = held ? { number: held.number } : null;
  const changed = held ? !sameContent(held.content, (await liveContent(processId))!) : false;
  const ackRows = inForce ? await prisma.processAcknowledgement.findMany({ where: { processId, versionNumber: inForce.number }, select: { personKey: true } }) : [];
  const progress = acknowledgementProgress(
    expectedAcknowledgers({
      stepRoleIds: held ? held.content.steps.filter((s) => s.n).map((s) => s.roleId) : [],
      people: registerPeople.map((x) => ({ personKey: x.smpKey, name: x.name, roleIds: x.personRoles.map((r) => r.roleId) })),
    }),
    new Set(ackRows.map((a) => a.personKey))
  );
  const approverRow = people.find((x) => x.id === process.approverPersonId);
  const me = (session?.user.email ?? "").trim().toLowerCase();
  const canReturnFromReview =
    !!me && (me === (approverRow?.email ?? "").trim().toLowerCase() || me === (process.submittedByEmail ?? "").trim().toLowerCase());
  const today = new Date();
  const overdue = isOverdueForReview(process.lifecycleStatus, process.nextReviewDue, today);
  const covered = new Set(controls.filter((c) => c.control && c.stepId).map((c) => c.stepId));
  const stepsNoControl = stepList.filter((s) => !covered.has(s.id));

  const base = `/${workspaceId}/processes/processes/${processId}`;
  const kpis = (process.kpis as unknown as Kpi[]) ?? [];
  const revisions = (process.sopRevisions as unknown as Revision[]) ?? [];

  return (
    <main className="w-full">
      <div className="w-full">

        {tab === "lifecycle" && (
          <>
            <Card title={bp.ownerPick}>
              <OwnerPicker
                workspaceId={workspaceId}
                processId={processId}
                ownerId={process.ownerPersonId}
                people={registerPeople.filter((x) => x.smpKey).map((x) => ({ id: x.id, name: x.name, role: people.find((y) => y.id === x.id)?.role ?? null }))}
              />
            </Card>
            <LifecyclePanel
              workspaceId={workspaceId}
              processId={processId}
              status={process.lifecycleStatus}
              people={people}
              approver={process.approverName ? { name: process.approverName, role: process.approverRole } : null}
              reviewers={(process.reviewers as unknown as { name: string; role: string | null }[]) ?? []}
              changeNote={process.pendingChangeNote}
              submittedBy={process.submittedByName}
              returnReason={process.returnReason}
              reviewIntervalMonths={process.reviewIntervalMonths}
              canReturnFromReview={canReturnFromReview}
              inForce={inForce?.number ?? null}
              changed={changed}
              nextVersion={(versions[0]?.number ?? 0) + 1}
            />
            {inForce && process.nextReviewDue && (
              <Card title="Next review">
                <p className={`text-sm ${overdue ? "font-semibold text-rose-700" : "text-slate-700"}`}>
                  {String(process.nextReviewDue.toISOString()).slice(0, 10)} ·{" "}
                  {overdue
                    ? `${-daysToReview(process.nextReviewDue, today)} day(s) overdue`
                    : `in ${daysToReview(process.nextReviewDue, today)} day(s)`}
                </p>
              </Card>
            )}
            {inForce && (
              <Card title="Link for staff">
                <StaffLink label="Send this to the people who should read it" path={`/${workspaceId}/processes/read/${processId}`} />
                <p className="mt-2 text-xs text-slate-500">
                  They sign in as usual and need to be on the Client register. They see only the published version and can confirm they have read it.
                </p>
              </Card>
            )}
            {inForce && (
              <Card title={`Read and acknowledged · v${inForce.number}`}>
                {progress.total === 0 ? (
                  <p className="text-sm text-slate-500">
                    No step is given to a role that anybody on the Client register holds, so nobody is expected to acknowledge yet.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{progress.done}</span> of {progress.total} have confirmed they have read it.
                    </p>
                    {progress.outstanding.length > 0 && (
                      <p className="mt-1 text-sm text-slate-600">Still to read: {progress.outstanding.map((o) => o.name).join(", ")}.</p>
                    )}
                  </>
                )}
              </Card>
            )}
            <Card title="Approved versions">
              {versions.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing has been approved yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {versions.map((v) => (
                    <li key={v.id} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                      <span className="font-mono font-semibold">v{v.number}</span> · approved{" "}
                      {v.approvedAt.toISOString().slice(0, 10)} by {v.approvedBy}
                      {v.approvedRole ? ` (${v.approvedRole})` : ""}
                      {v.publishedAt ? ` · published ${v.publishedAt.toISOString().slice(0, 10)}` : " · not published"}
                      <div className="text-slate-600">
                        {v.changeNote || "No note"}
                        {v.submittedBy ? ` — sent by ${v.submittedBy}` : ""}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
            <Card title="Document control">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Version</dt>
                <dd>{process.sopVersion || "Not recorded yet"}</dd>
                <dt className="text-slate-500">Owner</dt>
                <dd>{process.sopOwner || "Not recorded yet"}</dd>
                <dt className="text-slate-500">Effective</dt>
                <dd>{process.sopEffectiveDate ? String(process.sopEffectiveDate).slice(0, 10) : "Not recorded yet"}</dd>
                <dt className="text-slate-500">Approved by</dt>
                <dd>{process.sopApprovedBy || "Not recorded yet"}</dd>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Edit these on the{" "}
                <Link href={`${base}/map`} className="font-semibold text-slate-700 underline">
                  process map page
                </Link>
                .
              </p>
            </Card>
            <Card title="Revision history">
              {revisions.length === 0 ? (
                <p className="text-sm text-slate-500">No revisions recorded yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {revisions.map((r, i) => (
                    <li key={i} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                      <span className="font-mono font-semibold">{r.version}</span> · {r.date} · {r.by}
                      <div className="text-slate-600">{r.change}</div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </>
        )}

        {tab === "risks" && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">Risks recorded</div>
                <div className="text-xl font-semibold">{controls.length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">Risks with no control</div>
                <div className="text-xl font-semibold">{controls.filter((c) => !c.control).length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">Steps with no control</div>
                <div className="text-xl font-semibold">{stepsNoControl.length}</div>
              </div>
            </div>
            <Card title="Risks and controls">
              {controls.length === 0 ? (
                <p className="text-sm text-slate-500">Risks and controls are not recorded yet for this process.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th className="py-1 text-start">Risk</th>
                      <th className="py-1 text-start">Step</th>
                      <th className="py-1 text-start">Level</th>
                      <th className="py-1 text-start">Control</th>
                      <th className="py-1 text-start">Type</th>
                      <th className="py-1 text-start">Last test</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {controls.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100 align-top">
                        <td className="py-1.5">{c.risk}</td>
                        <td className="py-1.5">{c.step?.label ?? "Whole process"}</td>
                        <td className="py-1.5 capitalize">{c.riskLevel}</td>
                        <td className="py-1.5">
                          {c.control ? (
                            <>
                              {c.control}
                              {(c.owner || c.frequency) && (
                                <div className="text-xs text-slate-500">
                                  {[c.owner, c.frequency].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="font-semibold text-red-600">No control</span>
                          )}
                        </td>
                        <td className="py-1.5 capitalize">{c.controlType ?? "—"}</td>
                        <td className="py-1.5">
                          {c.lastTestResult && c.lastTestResult !== "not_tested"
                            ? `${c.lastTestResult === "pass" ? "Pass" : "Fail"}${c.lastTestedAt ? ` · ${String(c.lastTestedAt.toISOString()).slice(0, 10)}` : ""}`
                            : "Not tested"}
                        </td>
                        <td className="py-1.5 text-end">
                          <DeleteControlButton workspaceId={workspaceId} processId={processId} id={c.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title="Add a risk and its control">
              <AddControlForm
                workspaceId={workspaceId}
                processId={processId}
                steps={stepList.map((s) => ({ id: s.id, label: s.label }))}
              />
            </Card>
          </>
        )}
        {tab === "quality" && (
          <>
            <Card title="Measures">
              {kpis.length === 0 ? (
                <p className="text-sm text-slate-500">No measures recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-start text-xs text-slate-500">
                    <tr>
                      <th className="py-1 text-start">Metric</th>
                      <th className="py-1 text-start">Target</th>
                      <th className="py-1 text-start">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((k, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1">{k.metric}</td>
                        <td className="py-1">{k.target}</td>
                        <td className="py-1">{k.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">Open non-conformances</div>
                <div className="text-xl font-semibold">{ncs.filter((n) => n.status !== "closed").length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">Closed</div>
                <div className="text-xl font-semibold">{ncs.filter((n) => n.status === "closed").length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500">Failed control tests</div>
                <div className="text-xl font-semibold">{controls.filter((c) => c.lastTestResult === "fail").length}</div>
              </div>
            </div>
            <Card title="Non-conformances">
              {ncs.length === 0 ? (
                <p className="text-sm text-slate-500">No non-conformances recorded yet for this process.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {ncs.map((n) => (
                    <li key={n.id} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{n.title}</span>
                        <NonConformanceStatus workspaceId={workspaceId} processId={processId} id={n.id} status={n.status} />
                      </div>
                      {n.detail && <div className="text-slate-600">{n.detail}</div>}
                      <div className="text-xs text-slate-500">
                        Raised {String(n.raisedAt.toISOString()).slice(0, 10)}
                        {n.correctiveAction ? ` · Action: ${n.correctiveAction}` : ""}
                        {n.actionOwner ? ` · ${n.actionOwner}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Record a non-conformance">
              <AddNonConformanceForm workspaceId={workspaceId} processId={processId} />
            </Card>
          </>
        )}
        {(tab === "people" || tab === "compliance" || tab === "connections") && (
          <Empty title={bp.nothingTitle}>
            {bp.desc[tab]} {bp.nothingNote}
          </Empty>
        )}
      </div>
    </main>
  );
}
