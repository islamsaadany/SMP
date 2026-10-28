import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOffice } from "@/ffp/lib/auth/require-office";
import { prisma } from "@/ffp/lib/db/client";
import { clientSettings } from "@/ffp/lib/data/client-settings";
import { processGaps } from "@/ffp/lib/data/process-gaps";
import { loadPlan, loadPriorityRows } from "@/ffp/lib/data/priorities";
import { DECISION_LABEL, goesDeep, type Decision } from "@/ffp/lib/domain/priorities";
import { readinessMarks } from "@/ffp/lib/domain/process-readiness";
import { expectedAcknowledgers } from "@/ffp/lib/domain/process-reader";
import { formatDate } from "@/ffp/lib/i18n/locale";
import { getLocale, getMessages } from "@/ffp/lib/i18n/server";
import { barVars } from "@/lib/branding.ts";
import { BuilderFrame, type Dot, type SectionKey } from "./builder-frame";
import { officeSuggestions, stepName } from "@/ffp/lib/data/office-suggestions";
import { changedSteps, inForce as heldVersion, liveContent, sameContent } from "@/ffp/lib/data/process-content";

/**
 * THE BUILDER PAGE (spec 067 §4.3, stage 3). Every page of one process (the
 * Map, the RACI, Authority, Check with AI and the process page's sections) sits
 * in this frame: the band, the picker on the process's name, Save and exit, and
 * the menu of sections with their status dots. The office's six tabs step aside
 * here (../../office-frame.tsx).
 */
export default async function BuilderLayout(props: LayoutProps<"/[slug]/processes/processes/[processId]">) {
  const { slug: workspaceId, processId } = await props.params;
  await requireOffice(workspaceId);

  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      workspaceId: true, code: true, name: true, lifecycleStatus: true, approverName: true, returnReason: true, submittedAt: true,
      owner: { select: { name: true } },
      sopVersion: true, sopEffectiveDate: true, kpis: true, publishedAt: true, deepDiveDecision: true,
      category: { select: { name: true } },
      versions: { orderBy: { number: "desc" }, select: { number: true, publishedAt: true, approvedBy: true } },
    },
  });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [gaps, picker, findings, ncs, settings, locale, all, drafting] = await Promise.all([
    processGaps(workspaceId),
    prisma.process.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true, lifecycleStatus: true, returnReason: true, approverName: true } }),
    prisma.reviewFinding.count({ where: { processId, status: { in: ["OPEN", "EDITED"] } } }),
    prisma.processNonConformance.findMany({ where: { processId }, select: { status: true } }),
    clientSettings(workspaceId),
    getLocale(),
    getMessages(),
    officeSuggestions(workspaceId, ["IN_DRAFT"], processId),
  ]);
  const m = all.builder.page;
  const g = gaps.get(processId) ?? { gaps: 0, kinds: new Set(), steps: 0, controls: 0, controlsMissing: 0 };
  const status = process.lifecycleStatus;
  const latest = process.versions[0];
  const sentBack = status === "DRAFT" && !!process.returnReason;
  /* the version in force, kept beside the draft the office edits here (stage 5): readers keep it until the next is published */
  const held = await heldVersion(processId);
  const inForce = held ? { number: held.number, publishedAt: held.publishedAt } : null;
  const now = held ? await liveContent(processId) : null;
  const differs = !!held && !!now && !sameContent(held.content, now);
  const changedCount = held && now ? changedSteps(held.content, now).size : 0;
  const draftOpen = !!held && (status !== "PUBLISHED" || differs);
  const draftVersion = status === "APPROVED" ? latest?.number ?? null : (latest?.number ?? 0) + 1;
  const date = (d: Date | null) => (d ? formatDate(d, locale) : null);

  const stateOf = (s: { lifecycleStatus: string; returnReason: string | null; approverName: string | null }, v: number | null) =>
    s.lifecycleStatus === "PUBLISHED" ? m.state.inForce(v) : s.lifecycleStatus === "IN_REVIEW" ? m.state.withApprover(s.approverName) : s.lifecycleStatus === "APPROVED" ? m.state.approved(v) : s.lifecycleStatus === "RETIRED" ? m.state.retired : s.returnReason ? m.state.sentBack : m.state.draft;
  const tone = status === "PUBLISHED" ? "bg-[#E4F0EA] text-[#1F6248]" : sentBack ? "bg-[#F7E3E0] text-[#8C3327]" : status === "IN_REVIEW" || status === "APPROVED" ? "bg-[#F7EFD6] text-[#7A5D1C]" : "bg-[#EFF2F6] text-[#414A58]";
  const version = status === "PUBLISHED" ? inForce?.number ?? null : status === "APPROVED" ? latest?.number ?? null : draftVersion;

  const marks = readinessMarks({ steps: g.steps, kinds: g.kinds, controls: g.controls, controlsMissing: g.controlsMissing, sopVersion: process.sopVersion, sopEffectiveDate: process.sopEffectiveDate, lifecycleStatus: status });
  const ready = Object.values(marks).filter(Boolean).length;

  /* who has read the version in force: everyone whose job title does a step (process-reader.ts) */
  let read: { done: number; total: number } | null = null;
  if (held && inForce) {
    const people = await prisma.person.findMany({ where: { workspaceId, archivedAt: null, smpKey: { not: null } }, select: { smpKey: true, name: true, personRoles: { select: { roleId: true } } } });
    const expected = expectedAcknowledgers({ stepRoleIds: held.content.steps.filter((s) => s.n).map((s) => s.roleId), people: people.map((p) => ({ personKey: p.smpKey, name: p.name, roleIds: p.personRoles.map((r) => r.roleId) })) });
    const acked = new Set((await prisma.processAcknowledgement.findMany({ where: { processId, versionNumber: inForce.number }, select: { personKey: true } })).map((a) => a.personKey));
    read = { done: expected.filter((e) => acked.has(e.personKey)).length, total: expected.length };
  }

  /* a dot per section: red where something is missing, green where it holds, grey where nothing is recorded */
  const has = (...k: string[]) => k.some((x) => g.kinds.has(x as never));
  const drawn = g.steps > 0;
  const kpis = Array.isArray(process.kpis) ? process.kpis.length : 0;
  const dots: Record<SectionKey, Dot> = {
    map: !drawn ? "q" : g.kinds.size ? "bad" : "ok",
    raci: !drawn ? "q" : has("ACCOUNTABLE", "TOO_MANY_ACCOUNTABLE", "RESPONSIBLE") ? "bad" : "ok",
    authority: !drawn ? "q" : has("APPROVER", "INCOMPLETE_RULE") ? "bad" : "ok",
    risks: !g.controls ? "q" : g.controlsMissing ? "bad" : "ok",
    quality: ncs.some((n) => n.status !== "closed") ? "bad" : kpis || ncs.length ? "ok" : "q",
    lifecycle: sentBack ? "bad" : held ? "ok" : "q",
    people: "q",
    compliance: "q",
    connections: "q",
    ai: findings ? "bad" : "q",
  };

  const strip =
    sentBack || status === "IN_REVIEW" || status === "APPROVED" ? (
      <div className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2.5 text-[13.5px] ${status === "IN_REVIEW" ? "border-[#16325C] bg-white" : "border-[#C9A24D] bg-[#FBF6E9]"}`}>
        <b className={`text-[11px] font-extrabold uppercase tracking-[.1em] ${status === "IN_REVIEW" ? "text-[#16325C]" : "text-[#8A6B22]"}`}>
          {sentBack ? m.strip.sentBack : status === "IN_REVIEW" ? m.strip.withApprover : m.strip.approved}
        </b>
        <span>
          {sentBack
            ? m.strip.sentBackLine(process.approverName, process.returnReason ?? "")
            : status === "IN_REVIEW"
              ? m.strip.withApproverLine(process.approverName, date(process.submittedAt))
              : m.strip.approvedLine(latest?.approvedBy || process.approverName)}
        </span>
      </div>
    ) : held ? (
      /* in force, with or without the next version being drawn */
      <div className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2.5 text-[13.5px] ${draftOpen ? "border-[#C9A24D] bg-[#FBF6E9]" : "border-[#16325C] bg-white"}`}>
        <b className={`text-[11px] font-extrabold uppercase tracking-[.1em] ${draftOpen ? "text-[#8A6B22]" : "text-[#16325C]"}`}>{draftOpen ? m.draftLabel : m.inForceLabel}</b>
        <span>{draftOpen ? m.draftLine(held.number, draftVersion, changedCount) : m.inForceLine(held.number)}</span>
      </div>
    ) : null;

  /* chosen for a deep dive? say so, with where it ranks and how far it has got (Priorities) */
  let deepDive: React.ReactNode = null;
  if (goesDeep(process.deepDiveDecision)) {
    const plan = await loadPlan(workspaceId);
    const row = (await loadPriorityRows(workspaceId, plan.weights)).find((r) => r.id === processId);
    if (row)
      deepDive = (
        <Link
          href={`/${workspaceId}/processes/priorities?step=plan`}
          title="Why this process is being taken deep, and how far it has got"
          className="rounded border border-[var(--bar-accent)] px-1.5 py-px text-[11px] font-bold text-[var(--bar-accent)]"
        >
          {DECISION_LABEL[process.deepDiveDecision as Decision]}
          {row.rank ? ` · rank ${row.rank}` : ""} · deep dive {row.progress.done} of {row.progress.total}
        </Link>
      );
  }
  const client = settings?.name || workspaceId;
  const barStyle = Object.fromEntries(barVars("#16325C").split(";").map((d) => d.split(":") as [string, string])) as React.CSSProperties;

  return (
    <BuilderFrame
      workspaceId={workspaceId}
      processId={processId}
      barStyle={barStyle}
      eyebrow={`${client} · ${all.builder.eyebrow} › ${process.code}${process.category ? ` · ${process.category.name}` : ""}`}
      name={process.name}
      pill={
        <>
          {held && status !== "PUBLISHED" && status !== "RETIRED" && (
            <span className="inline-flex whitespace-nowrap rounded-full bg-[#E4F0EA] px-[9px] py-px text-[11.5px] font-semibold text-[#1F6248]">{m.state.inForce(held.number)}</span>
          )}
          <span className={`inline-flex whitespace-nowrap rounded-full px-[9px] py-px text-[11.5px] font-semibold ${tone}`}>
            {held && status === "DRAFT" && !sentBack ? m.draftOf(draftVersion) : stateOf(process, version)}
          </span>
          {held && status === "PUBLISHED" && differs && (
            <span className="inline-flex whitespace-nowrap rounded-full bg-[#EFF2F6] px-[9px] py-px text-[11.5px] font-semibold text-[#414A58]">{m.draftOf(draftVersion)}</span>
          )}
          {deepDive}
        </>
      }
      sub={
        <>
          {inForce ? `${m.since(inForce.number, date(inForce.publishedAt)!)} · ` : ""}
          {drafting[0] ? `${m.fromSuggestion(drafting[0].byName, stepName(drafting[0], all.reading.page.step))} · ` : ""}
          {m.owner} <b>{process.owner?.name ?? m.noOwner}</b> · {m.subApprover} <b>{process.approverName ?? m.noApprover}</b>
        </>
      }
      next={
        status === "DRAFT"
          ? sentBack
            ? m.next.sendAgain
            : held
              ? m.sendVersion(draftVersion)
              : m.next.send
          : status === "PUBLISHED" && differs
            ? m.sendVersion(draftVersion)
            : status === "APPROVED"
              ? m.next.publish(latest?.number ?? null)
              : null
      }
      canPreview={drawn}
      tiles={[
        { n: g.steps, label: m.tiles.steps },
        { n: g.gaps, label: m.tiles.gaps, late: g.gaps > 0 },
        { n: `${ready}/6`, label: m.tiles.ready },
        ...(read ? [{ n: `${read.done}/${read.total}`, label: m.tiles.read(inForce?.number ?? null) }] : []),
      ]}
      strip={strip}
      dots={dots}
      aiCount={findings}
      picker={picker.map((p) => ({ id: p.id, code: p.code, name: p.name, state: stateOf(p, null) }))}
    >
      {props.children}
    </BuilderFrame>
  );
}
