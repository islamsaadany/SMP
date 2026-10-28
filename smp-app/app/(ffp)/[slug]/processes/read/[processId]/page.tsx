import Link from "next/link";
import { notFound } from "next/navigation";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { clientSettings } from "@/ffp/lib/data/client-settings";
import { readProcess, readerOf, todoOf, type ReadStep } from "@/ffp/lib/data/reading-side";
import { formatDate } from "@/ffp/lib/i18n/locale";
import { getLocale, getMessages } from "@/ffp/lib/i18n/server";
import { Band, Sheet, TabRow, WaitLabel, bandGold } from "../../band";
import { barStyle } from "../home-head";
import { Chip, Pill, daysUntil, lbl, note, panel } from "../ui";
import { ReadingFlow } from "./flow";
import { ApproveStrip, PrintButton, ReadButton } from "./reader-actions";

/**
 * A PROCESS, ON THE READING SIDE (spec 067 §3.2; Islam: "flow first and the
 * steps and summary comes as tabs"). The band names the process, the version
 * in force and the reader's part, with tiles for its steps, roles, how many
 * have read it, risks with no control and days to the review. The tabs are
 * Flow · Steps · Summary, and it opens on Flow. Readers see the version in
 * force; the approver also reads the version sent to them, under a gold strip
 * to approve it or send it back. Suggest a change joins in stage 4.
 */
export default async function ReadProcessPage(props: PageProps<"/[slug]/processes/read/[processId]">) {
  const { slug, processId } = await props.params;
  const sp = await props.searchParams;
  const seat = await readerSeat(slug);
  const reader = await readerOf(slug, seat.ok ? seat.personKey : null);
  const p = await readProcess(slug, processId, reader);
  if (!p) notFound();
  const todo = (await todoOf(slug, reader)).filter((t) => t.kind !== "plan" && t.row.id === processId);
  const toRead = todo.some((t) => t.kind === "read");
  const locale = await getLocale();
  const all = await getMessages();
  const m = all.reading.page;
  const date = (d: Date | null) => (d ? formatDate(d, locale) : null);
  const client = (await clientSettings(slug))?.name || (seat.ok ? seat.tenantName : slug);
  const base = `/${slug}/processes/read`;
  const here = `${base}/${processId}`;
  const r = p.row;

  const asked = typeof sp.tab === "string" ? sp.tab : "";
  const tab = asked === "steps" || asked === "summary" ? asked : "flow";
  const counted = p.steps.filter((s) => s.n);
  const roles = new Set(counted.map((s) => s.role).filter(Boolean)).size;
  const noControl = p.steps.reduce((n, s) => n + s.controls.filter((c) => !c.control).length, 0) + p.looseNoControl.length;
  const review = p.mode === "live" && r.nextReviewDue ? daysUntil(r.nextReviewDue) : null;
  const part = r.approves ? m.youApprove : r.mySteps.length ? m.yourStep : null;

  /* Is it in good shape? (spec 067 §3.2): the next version, the RACI, risks with no control, who has not read it, the SOP, the review */
  const health: { k: "ok" | "warn" | "bad"; text: string; small?: string }[] = [];
  if (p.mode === "live") health.push({ k: "ok", text: all.reading.todo.readWhat(r.version, date(r.since)), small: p.versionNote ?? undefined });
  if (p.mode === "approve") health.push({ k: "warn", text: m.withApprover(r.version, r.approverName), small: r.submittedAt ? m.sentOn(date(r.submittedAt)!) : undefined });
  if (p.mode === "notyet") health.push({ k: "ok", text: m.isApproved(r.version), small: m.isApprovedSmall });
  const stepById = new Map(p.steps.map((s) => [s.id, s]));
  for (const g of p.gaps) {
    const s = stepById.get(g.stepId)!;
    health.push({ k: "bad", text: m.gapLine(s.n ?? 0, s.label, m.gaps[g.kind]) });
  }
  if (!p.gaps.length && counted.length) health.push({ k: "ok", text: m.allClear });
  for (const s of p.steps) for (const c of s.controls) if (!c.control) health.push({ k: "bad", text: m.riskNoControl(s.n, s.label, c.risk) });
  for (const risk of p.looseNoControl) health.push({ k: "bad", text: m.riskNoControl(null, null, risk) });
  if (p.mode === "live") {
    health.push({ k: r.readBy < r.readers ? "warn" : "ok", text: m.readCount(r.readBy, r.readers, r.version), small: p.stillToRead.length ? m.stillToRead(p.stillToRead) : undefined });
    if (!p.sopVersion || !p.sopEffectiveDate) health.push({ k: "warn", text: m.noSop });
    if (review !== null && review < 0) health.push({ k: "bad", text: m.reviewDue(date(r.nextReviewDue)!) });
  }
  const toLook = health.filter((h) => h.k !== "ok").length;

  const pill =
    p.mode === "approve" ? <Pill tone="attn">{m.forApproval(r.version)}</Pill> : p.mode === "notyet" ? <Pill tone="attn">{m.approved(r.version)}</Pill> : <Pill tone="good">{m.inForce(r.version)}</Pill>;
  const purpose = p.purpose?.split(/(?<=\.)\s/)[0];

  const stepCard = (s: ReadStep, id: string) => (
    <div key={s.id} id={id} className="grid scroll-mt-20 grid-cols-[34px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-[#E6EAF0] px-4 py-3.5 first:border-t-0">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#16325C] text-[13px] font-extrabold text-white">{s.n}</span>
      <div>
        <h3 className="flex flex-wrap items-center gap-1.5 text-[15.5px] font-semibold text-[#171B22]">
          {s.label}
          {s.type === "DECISION" && <Chip>{m.decision}</Chip>}
          {s.controls.some((c) => !c.control) && <Chip tone="bad">{m.noControlChip}</Chip>}
          {s.mine && <Chip tone="navy">{m.yourStep}</Chip>}
        </h3>
        <p className="text-[12.5px] text-[#636C79]">{m.doneByLine(s.role ?? m.noRole)}</p>
        {s.acts.length > 0 && (
          <ul className="mt-1 grid list-disc gap-0.5 ps-[18px] text-[13.5px]">
            {s.acts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
        {(s.approval.length > 0 || s.time.length > 0) && (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#414A58]">
            {s.approval.length > 0 && (
              <span>
                <em className="me-1.5 not-italic text-[#636C79]">{m.approval}</em>
                {s.approval.join(" ")}
              </span>
            )}
            {s.time.length > 0 && (
              <span>
                <em className="me-1.5 not-italic text-[#636C79]">{m.timeLimit}</em>
                {s.time.join(" ")}
              </span>
            )}
          </div>
        )}
        {s.controls.map((c, i) => (
          <p key={i} className={`mt-1 text-[12.5px] ${c.control ? "text-[#414A58]" : "font-semibold text-[#8C3327]"}`}>
            {m.riskLine(c.risk, c.control)}
          </p>
        ))}
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (tab === "flow") {
    body = <ReadingFlow steps={p.steps} lanes={p.lanes} connections={p.connections} toSteps={asked ? null : `${here}?tab=steps`} />;
  } else if (tab === "steps") {
    body = !counted.length ? (
      <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">{m.noSteps}</div>
    ) : (
      <div className="grid items-start gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label={m.theSteps} className={`${panel} px-3 py-2.5 max-lg:hidden lg:sticky lg:top-[72px]`}>
          <span className={lbl}>{m.theSteps}</span>
          <ol className="mt-1.5 grid gap-0.5">
            {counted.map((s) => (
              <li key={s.id}>
                <a href={`#sc-${s.id}`} className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-1.5 rounded-md px-1.5 py-[5px] text-[13px] text-[#171B22] hover:bg-[#EFF2F6]">
                  <i className="font-extrabold not-italic text-[#16325C]">{s.n}</i>
                  {s.label}
                  <span className="col-start-2 text-[11.5px] text-[#636C79]">{s.role ?? m.noRole}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className={panel}>{counted.map((s) => stepCard(s, `sc-${s.id}`))}</div>
      </div>
    );
  } else {
    body = (
      <>
        <div className="mb-3.5 grid gap-3.5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className={`${panel} px-4 py-3.5`}>
            <span className={lbl}>{m.purpose}</span>
            <p className="mt-1 text-[14.5px]">{p.purpose || m.notWritten}</p>
            {(p.inScope.length > 0 || p.outScope.length > 0) && (
              <div className="mt-2.5 flex flex-wrap gap-[5px]">
                {p.inScope.map((x, i) => (
                  <span key={`i${i}`} className="rounded-[5px] border border-[#D6DCE5] bg-[#F5F7FA] px-2 py-0.5 text-xs">
                    {x}
                  </span>
                ))}
                {p.outScope.map((x, i) => (
                  <span key={`o${i}`} className="rounded-[5px] border border-dashed border-[#D6DCE5] bg-[#F5F7FA] px-2 py-0.5 text-xs text-[#636C79]">
                    {m.notIn(x)}
                  </span>
                ))}
              </div>
            )}
            {p.kpis.length > 0 && (
              <>
                <div className="mb-2 mt-3.5 flex flex-wrap items-baseline gap-2">
                  <span className={lbl}>{m.measures}</span>
                  <span className={note}>{m.measuresNote}</span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {p.kpis.map((k, i) => (
                    <div key={i} className="rounded-lg border border-[#D6DCE5] bg-white px-3 py-2.5">
                      <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#636C79]">{k.metric}</div>
                      <div className="text-xl font-bold">{k.target}</div>
                      {k.frequency && <div className="text-xs text-[#636C79]">{m.checked(k.frequency)}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className={`${panel} px-4 py-3.5`}>
            <span className={lbl}>{m.shape}</span>
            <div className="mt-2 grid gap-[7px]">
              {health.map((h, i) => (
                <div key={i} className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2 text-[13.5px]">
                  <i
                    className={`mt-0.5 grid h-[18px] w-[18px] place-items-center rounded-full text-[11px] font-extrabold not-italic ${h.k === "ok" ? "bg-[#E4F0EA] text-[#1F6248]" : h.k === "warn" ? "bg-[#F7EFD6] text-[#7A5D1C]" : "bg-[#F7E3E0] text-[#8C3327]"}`}
                  >
                    {h.k === "ok" ? "✓" : "!"}
                  </i>
                  <span>
                    {h.text}
                    {h.small && <small className="block text-xs text-[#636C79]">{h.small}</small>}
                  </span>
                </div>
              ))}
            </div>
            {toRead && (
              <div className="mt-3 rounded-lg border border-[#C9A24D] bg-[#FBF6E9] px-3 py-2.5">
                <b className="text-[13.5px]">{m.waitRead(r.version)}</b>
                <p className={`${note} mt-0.5`}>{all.reading.todo.readMeta(r.mySteps)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <ReadButton workspaceId={slug} processId={processId} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={`${panel} mb-3.5 px-4 py-3.5`}>
          <div className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className={lbl}>{m.glance}</span>
            <Link href={`${here}?tab=flow`} className="ms-auto text-[13px] font-semibold text-[#16325C] underline underline-offset-2">
              {m.fullFlow}
            </Link>
          </div>
          <div className="flex items-stretch overflow-x-auto px-0.5 pb-1.5 pt-2.5">
            {counted.map((s, i) => (
              <div key={s.id} className="flex items-stretch">
                {i > 0 && (
                  <span aria-hidden="true" className="self-center px-1.5 text-[#636C79]">
                    →
                  </span>
                )}
                <Link
                  href={`${here}?tab=steps#sc-${s.id}`}
                  className={`relative grid w-32 shrink-0 gap-0.5 rounded-lg border bg-white px-2.5 py-2 text-[12.5px] ${s.type === "DECISION" ? "border-dashed border-[#16325C]" : "border-[#D6DCE5]"}`}
                >
                  <span className="font-mono text-xs font-bold text-[#16325C]">{s.n}</span>
                  <b className="text-[13px] leading-tight">{s.label}</b>
                  <span className="text-[11.5px] text-[#636C79]">{s.role ?? m.noRole}</span>
                  {s.controls.some((c) => !c.control) && (
                    <span className="absolute -top-2 end-1.5">
                      <Chip tone="bad">{m.noControlChip}</Chip>
                    </span>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <span className={lbl}>{m.theSteps}</span>
          <span className={note}>{m.openOne}</span>
        </div>
        <div className={panel}>
          {counted.map((s) => (
            <details key={s.id} id={`cs-${s.id}`} className="scroll-mt-20 border-t border-[#E6EAF0] first:border-t-0 [&[open]>summary]:border-b [&[open]>summary]:border-[#E6EAF0]">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-[14px] font-semibold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#16325C] text-[12px] font-extrabold text-white">{s.n}</span>
                {s.label}
                <span className="text-[12px] font-normal text-[#636C79]">{s.role ?? m.noRole}</span>
              </summary>
              {stepCard(s, `cs-in-${s.id}`)}
            </details>
          ))}
        </div>
      </>
    );
  }

  return (
    <Sheet>
      <Band
        barStyle={barStyle()}
        eyebrow={
          <>
            {client} ·{" "}
            <Link href={base} className="underline underline-offset-2">
              {m.back}
            </Link>{" "}
            › {r.code}
            {r.department ? ` · ${r.department}` : ""}
          </>
        }
        title={
          <>
            {r.name} {pill}
            {part && <span className="rounded border border-[var(--bar-accent)] px-1.5 py-px text-[10px] font-bold uppercase tracking-[.05em] text-[var(--bar-accent)]">{part}</span>}
          </>
        }
        desc={
          <>
            {purpose ? `${purpose} · ` : ""}
            {m.approver} <b>{r.approverName ?? "—"}</b>
          </>
        }
        wait={
          toRead ? (
            <>
              <WaitLabel>{all.reading.waitingOnYou}</WaitLabel>
              <span>{m.readVersion(r.version)}</span>
              <ReadButton workspaceId={slug} processId={processId} quiet />
            </>
          ) : undefined
        }
        actions={
          <>
            <PrintButton />
            {seat.ok && seat.office && (
              <Link href={`/${slug}/processes/processes/${processId}`} className={bandGold}>
                {m.openInBuilder}
              </Link>
            )}
          </>
        }
        tiles={[
          { n: counted.length, label: m.tiles.steps },
          { n: roles, label: m.tiles.roles },
          ...(p.mode === "live" ? [{ n: `${r.readBy}/${r.readers}`, label: m.tiles.read }] : []),
          { n: noControl, label: m.tiles.noControl, late: noControl > 0 },
          ...(review !== null ? [{ n: Math.max(0, review), label: review < 0 ? m.tiles.reviewLate : m.tiles.review, late: review < 0 }] : []),
        ]}
      />
      {p.mode === "approve" && (
        <ApproveStrip
          workspaceId={slug}
          processId={processId}
          version={r.version}
          line={[m.approveLine(r.version, r.submittedByName, date(r.submittedAt)), p.versionNote].filter(Boolean).join(" ")}
        />
      )}
      {p.mode === "notyet" && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[#16325C] bg-white px-3 py-2.5 text-[13.5px]">
          <b className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#16325C]">{m.notYet}</b>
          <span>{m.notYetLine(r.version)}</span>
        </div>
      )}
      <TabRow
        label={m.views}
        tabs={[
          { key: "flow", label: m.tabs.flow, href: `${here}?tab=flow`, on: tab === "flow" },
          { key: "steps", label: m.tabs.steps, href: `${here}?tab=steps`, on: tab === "steps", count: counted.length || undefined },
          { key: "summary", label: m.tabs.summary, href: `${here}?tab=summary`, on: tab === "summary", count: toLook ? m.toLookAt(toLook) : undefined },
        ]}
      />
      {body}
    </Sheet>
  );
}
