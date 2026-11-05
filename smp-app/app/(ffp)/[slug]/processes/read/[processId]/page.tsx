import Link from "next/link";
import { notFound } from "next/navigation";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { clientSettings } from "@/ffp/lib/data/client-settings";
import { mySuggestions, readProcess, readerOf, todoOf, type ReadStep } from "@/ffp/lib/data/reading-side";
import { formatDate } from "@/ffp/lib/i18n/locale";
import { getLocale, getMessages } from "@/ffp/lib/i18n/server";
import { Band, Sheet, TabRow, WaitLabel, bandGold } from "../../band";
import { barStyle } from "../home-head";
import { Chip, Pill, daysUntil, lbl, note, panel } from "../ui";
import { ReadingFlow } from "./flow";
import { ApproveStrip, PrintButton, ReadButton } from "./reader-actions";
import { ReplyButton, StillRightButton, SuggestButton } from "../dialogs";

/**
 * A PROCESS, ON THE READING SIDE (spec 067 §3.2; Islam: "flow first and the
 * steps and summary comes as tabs"). The band names the process, the version
 * in force and the reader's part, with tiles for its steps, roles, how many
 * have read it, risks with no control and days to the review. The tabs are
 * Flow · Steps · Summary, and it opens on Flow. Readers see the version in
 * force; the approver also reads the version sent to them, under a gold strip
 * to approve it or send it back. Suggest a change works on every tab and can
 * be pinned to a step; the owner does the yearly review from the Summary.
 */
export default async function ReadProcessPage(props: PageProps<"/[slug]/processes/read/[processId]">) {
  const { slug, processId } = await props.params;
  const sp = await props.searchParams;
  const seat = await readerSeat(slug);
  const reader = await readerOf(slug, seat.ok ? seat.personKey : null);
  /* Preview as manager (spec 067 §4.1): the office reads the current draft as a reader will once it is published */
  const preview = sp.preview === "1" && seat.ok && seat.office;
  const p = await readProcess(slug, processId, reader, preview);
  if (!p) notFound();
  const todo = (await todoOf(slug, reader)).filter((t) => ("row" in t ? t.row.id === processId : t.kind === "answer" && t.s.processId === processId));
  const toRead = todo.some((t) => t.kind === "read");
  const toReview = todo.some((t) => t.kind === "review");
  const answer = todo.find((t) => t.kind === "answer");
  const mine = (await mySuggestions(slug, reader)).filter((s) => s.processId === processId);
  const locale = await getLocale();
  const all = await getMessages();
  const m = all.reading.page;
  const date = (d: Date | null) => (d ? formatDate(d, locale) : null);
  const client = (await clientSettings(slug))?.name || (seat.ok ? seat.tenantName : slug);
  const base = `/${slug}/processes/read`;
  const here = `${base}/${processId}`;
  const q = preview ? "&preview=1" : "";
  const r = p.row;
  /* the version on the page: the one in force, or the one sent for approval */
  const v = p.mode === "live" ? r.version : (r.draftVersion ?? r.version);

  const asked = typeof sp.tab === "string" ? sp.tab : "";
  const tab = asked === "steps" || asked === "summary" ? asked : "flow";
  const counted = p.steps.filter((s) => s.n);
  const roles = new Set(counted.map((s) => s.role).filter(Boolean)).size;
  const noControl = p.steps.reduce((n, s) => n + s.controls.filter((c) => !c.control).length, 0) + p.looseNoControl.length;
  const review = p.mode === "live" && r.nextReviewDue ? daysUntil(r.nextReviewDue) : null;
  const part = r.owns ? m.youOwn : r.approves ? m.youApprove : r.mySteps.length ? m.yourStep : null;
  /* anyone reading what is in force, or the owner reading what is on its way, can suggest a change; the approver approves or sends back instead */
  const canSuggest = !!reader.personId && (p.mode === "live" || p.mode === "notyet");
  const pick = counted.map((s) => ({ id: s.id, n: s.n!, label: s.label }));
  const suggestLink = "text-[12.5px] font-semibold text-[var(--stone)] underline underline-offset-2";

  /* Is it in good shape? (spec 067 §3.2): the next version, the RACI, risks with no control, who has not read it, the SOP, the review */
  const health: { k: "ok" | "warn" | "bad"; text: string; small?: string; act?: React.ReactNode }[] = [];
  if (p.mode === "live") health.push({ k: "ok", text: all.reading.todo.readWhat(r.version, date(r.since)), small: p.versionNote ?? undefined });
  if (p.mode === "approve") health.push({ k: "warn", text: m.withApprover(v, r.approverName), small: r.submittedAt ? m.sentOn(date(r.submittedAt)!) : undefined });
  if (p.mode === "notyet")
    health.push(r.status === "IN_REVIEW" ? { k: "warn", text: m.withApprover(r.version, r.approverName) } : { k: "ok", text: m.isApproved(r.version), small: m.isApprovedSmall });
  const stepById = new Map(p.steps.map((s) => [s.id, s]));
  for (const g of p.gaps) {
    const s = stepById.get(g.stepId)!;
    health.push({ k: "bad", text: m.gapLine(s.n ?? 0, s.label, m.gaps[g.kind]) });
  }
  if (!p.gaps.length && counted.length) health.push({ k: "ok", text: m.allClear });
  for (const s of p.steps)
    for (const c of s.controls)
      if (!c.control)
        health.push({
          k: "bad",
          text: m.riskNoControl(s.n, s.label, c.risk),
          act: canSuggest ? <SuggestButton workspaceId={slug} processId={processId} steps={pick} stepId={s.n ? s.id : undefined} label={m.suggestOne} className={suggestLink} /> : undefined,
        });
  for (const risk of p.looseNoControl) health.push({ k: "bad", text: m.riskNoControl(null, null, risk) });
  if (p.mode === "live") health.push({ k: r.readBy < r.readers ? "warn" : "ok", text: m.readCount(r.readBy, r.readers, r.version), small: p.stillToRead.length ? m.stillToRead(p.stillToRead) : undefined });
  if ((p.mode === "live" || p.mode === "preview") && (!p.sopVersion || !p.sopEffectiveDate)) health.push({ k: "warn", text: m.noSop });
  if (p.mode === "live") {
    if (review !== null && review < 0) health.push({ k: "bad", text: m.reviewDue(date(r.nextReviewDue)!) });
  }
  const toLook = health.filter((h) => h.k !== "ok").length;

  const pill =
    p.mode === "preview" ? (
      <Pill tone="attn">{all.builder.page.previewStrip}</Pill>
    ) : p.mode === "approve" ? (
      <Pill tone="attn">{m.forApproval(v)}</Pill>
    ) : p.mode === "notyet" ? (
      <Pill tone="attn">{r.status === "IN_REVIEW" ? all.reading.state.inReview : m.approved(v)}</Pill>
    ) : (
      <Pill tone="good">{m.inForce(r.version)}</Pill>
    );
  const purpose = p.purpose?.split(/(?<=\.)\s/)[0];

  const stepCard = (s: ReadStep, id: string) => (
    <div key={s.id} id={id} className="grid scroll-mt-20 grid-cols-[34px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-[var(--line-soft)] px-4 py-3.5 first:border-t-0">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--panel)] text-[13px] font-extrabold text-[var(--panel-ink)]">{s.n}</span>
      <div>
        <h3 className="flex flex-wrap items-center gap-1.5 text-[15.5px] font-semibold text-[var(--ink)]">
          {s.label}
          {s.type === "DECISION" && <Chip>{m.decision}</Chip>}
          {s.controls.some((c) => !c.control) && <Chip tone="bad">{m.noControlChip}</Chip>}
          {s.mine && <Chip tone="navy">{m.yourStep}</Chip>}
          {s.changed && <Chip tone="gold">{m.changedIn(r.version)}</Chip>}
        </h3>
        <p className="text-[12.5px] text-[var(--ink-3)]">{m.doneByLine(s.role ?? m.noRole)}</p>
        {s.acts.length > 0 && (
          <ul className="mt-1 grid list-disc gap-0.5 ps-[18px] text-[13.5px]">
            {s.acts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
        {(s.approval.length > 0 || s.time.length > 0) && (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--ink-2)]">
            {s.approval.length > 0 && (
              <span>
                <em className="me-1.5 not-italic text-[var(--ink-3)]">{m.approval}</em>
                {s.approval.join(" ")}
              </span>
            )}
            {s.time.length > 0 && (
              <span>
                <em className="me-1.5 not-italic text-[var(--ink-3)]">{m.timeLimit}</em>
                {s.time.join(" ")}
              </span>
            )}
          </div>
        )}
        {s.controls.map((c, i) => (
          <p key={i} className={`mt-1 text-[12.5px] ${c.control ? "text-[var(--ink-2)]" : "font-semibold text-[var(--bad-tx)]"}`}>
            {m.riskLine(c.risk, c.control)}
          </p>
        ))}
        {canSuggest && (
          <div className="mt-1.5">
            <SuggestButton workspaceId={slug} processId={processId} steps={pick} stepId={s.id} label={m.suggestStep} className={suggestLink} />
          </div>
        )}
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (tab === "flow") {
    body = (
      <ReadingFlow
        steps={p.steps}
        lanes={p.lanes}
        connections={p.connections}
        toSteps={asked ? null : `${here}?tab=steps${q}`}
        suggest={canSuggest ? { workspaceId: slug, processId, steps: pick } : null}
      />
    );
  } else if (tab === "steps") {
    body = !counted.length ? (
      <div className="rounded-lg border border-dashed border-[var(--line)] bg-white px-[18px] py-[22px] text-[13.5px] text-[var(--ink-2)]">{m.noSteps}</div>
    ) : (
      <div className="grid items-start gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label={m.theSteps} className={`${panel} px-3 py-2.5 max-lg:hidden lg:sticky lg:top-[72px]`}>
          <span className={lbl}>{m.theSteps}</span>
          <ol className="mt-1.5 grid gap-0.5">
            {counted.map((s) => (
              <li key={s.id}>
                <a href={`#sc-${s.id}`} className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-1.5 rounded-md px-1.5 py-[5px] text-[13px] text-[var(--ink)] hover:bg-[var(--surface-2)]">
                  <i className="font-extrabold not-italic text-[var(--stone)]">{s.n}</i>
                  {s.label}
                  <span className="col-start-2 text-[11.5px] text-[var(--ink-3)]">{s.role ?? m.noRole}</span>
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
                  <span key={`i${i}`} className="rounded-[5px] border border-[var(--line)] bg-[var(--zebra)] px-2 py-0.5 text-xs">
                    {x}
                  </span>
                ))}
                {p.outScope.map((x, i) => (
                  <span key={`o${i}`} className="rounded-[5px] border border-dashed border-[var(--line)] bg-[var(--zebra)] px-2 py-0.5 text-xs text-[var(--ink-3)]">
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
                    <div key={i} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5">
                      <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--ink-3)]">{k.metric}</div>
                      <div className="text-xl font-bold">{k.target}</div>
                      {k.frequency && <div className="text-xs text-[var(--ink-3)]">{m.checked(k.frequency)}</div>}
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
                <div key={i} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-2 text-[13.5px]">
                  <i
                    className={`mt-0.5 grid h-[18px] w-[18px] place-items-center rounded-full text-[11px] font-extrabold not-italic ${h.k === "ok" ? "bg-[var(--good-bg)] text-[var(--good-tx)]" : h.k === "warn" ? "bg-[var(--attn-bg)] text-[var(--attn-tx)]" : "bg-[var(--bad-bg)] text-[var(--bad-tx)]"}`}
                  >
                    {h.k === "ok" ? "✓" : "!"}
                  </i>
                  <span>
                    {h.text}
                    {h.small && <small className="block text-xs text-[var(--ink-3)]">{h.small}</small>}
                  </span>
                  <span>{h.act}</span>
                </div>
              ))}
            </div>
            {toReview && (
              <div className="mt-3 rounded-lg border border-[var(--gold)] bg-[var(--over-bg)] px-3 py-2.5">
                <b className="text-[13.5px]">{m.reviewWait((review ?? 0) < 0, date(r.nextReviewDue)!)}</b>
                <p className={`${note} mt-0.5`}>{m.reviewHint}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StillRightButton
                    workspaceId={slug}
                    processId={processId}
                    label={m.stillRight}
                    className="rounded-md border border-[var(--gold)] bg-[var(--gold)] px-2.5 py-1 text-[12.5px] font-semibold text-[var(--on-accent)] disabled:opacity-60"
                  />
                  <SuggestButton workspaceId={slug} processId={processId} steps={pick} label={m.suggest} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12.5px] font-semibold" />
                </div>
              </div>
            )}
            {!toReview && toRead && (
              <div className="mt-3 rounded-lg border border-[var(--gold)] bg-[var(--over-bg)] px-3 py-2.5">
                <b className="text-[13.5px]">{m.waitRead(r.version)}</b>
                <p className={`${note} mt-0.5`}>{all.reading.todo.readMeta(r.mySteps)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <ReadButton workspaceId={slug} processId={processId} />
                </div>
              </div>
            )}
            {mine.length > 0 && (
              <>
                <span className={`${lbl} mt-3.5 block`}>{m.yourSuggestions}</span>
                {mine.map((x) => (
                  <div key={x.id} className="mt-1.5">
                    <p className="text-[13px]">“{x.text}”</p>
                    <p className={note}>{m.sugState[x.state]}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <div className={`${panel} mb-3.5 px-4 py-3.5`}>
          <div className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className={lbl}>{m.glance}</span>
            <Link href={`${here}?tab=flow${q}`} className="ms-auto text-[13px] font-semibold text-[var(--stone)] underline underline-offset-2">
              {m.fullFlow}
            </Link>
          </div>
          <div className="flex items-stretch overflow-x-auto px-0.5 pb-1.5 pt-2.5">
            {counted.map((s, i) => (
              <div key={s.id} className="flex items-stretch">
                {i > 0 && (
                  <span aria-hidden="true" className="self-center px-1.5 text-[var(--ink-3)]">
                    →
                  </span>
                )}
                <Link
                  href={`${here}?tab=steps${q}#sc-${s.id}`}
                  className={`relative grid w-32 shrink-0 gap-0.5 rounded-lg border bg-white px-2.5 py-2 text-[12.5px] ${s.type === "DECISION" ? "border-dashed border-[var(--stone)]" : "border-[var(--line)]"}`}
                >
                  <span className="font-mono text-xs font-bold text-[var(--stone)]">{s.n}</span>
                  <b className="text-[13px] leading-tight">{s.label}</b>
                  <span className="text-[11.5px] text-[var(--ink-3)]">{s.role ?? m.noRole}</span>
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
            <details key={s.id} id={`cs-${s.id}`} className="scroll-mt-20 border-t border-[var(--line-soft)] first:border-t-0 [&[open]>summary]:border-b [&[open]>summary]:border-[var(--line-soft)]">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-[14px] font-semibold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--panel)] text-[12px] font-extrabold text-[var(--panel-ink)]">{s.n}</span>
                {s.label}
                <span className="text-[12px] font-normal text-[var(--ink-3)]">{s.role ?? m.noRole}</span>
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
            {m.owner} <b>{r.ownerName ?? "—"}</b> · {m.approver} <b>{r.approverName ?? "—"}</b>
            {p.mode === "live" && (r.owns || r.approves) && r.status !== "PUBLISHED" && r.status !== "RETIRED" ? ` · ${m.draftNote(r.status, r.draftVersion, r.approverName)}` : ""}
          </>
        }
        wait={
          toReview ? (
            <>
              <WaitLabel>{all.reading.waitingOnYou}</WaitLabel>
              <span>{m.reviewLine((review ?? 0) < 0, date(r.nextReviewDue)!)}</span>
              <Link href={`${here}?tab=summary`} className="font-semibold underline underline-offset-2">
                {m.openSummary}
              </Link>
            </>
          ) : toRead ? (
            <>
              <WaitLabel>{all.reading.waitingOnYou}</WaitLabel>
              <span>{m.readVersion(r.version)}</span>
              <ReadButton workspaceId={slug} processId={processId} quiet />
            </>
          ) : answer?.kind === "answer" ? (
            <>
              <WaitLabel>{all.reading.waitingOnYou}</WaitLabel>
              <span>{m.answered}</span>
              <ReplyButton
                workspaceId={slug}
                suggestionId={answer.s.id}
                suggestion={answer.s.text}
                answer={answer.s.answerText ?? ""}
                answerBy={all.reading.todo.answerMeta(answer.s.answerBy, date(answer.s.answeredAt))}
                label={m.reply}
                className="font-semibold underline underline-offset-2"
              />
            </>
          ) : undefined
        }
        actions={
          <>
            <PrintButton />
            {canSuggest && <SuggestButton workspaceId={slug} processId={processId} steps={pick} label={m.suggest} className={bandGold} />}
            {seat.ok && seat.office && !preview && (
              <Link href={`/${slug}/processes/processes/${processId}/map?from=read`} className={bandGold}>
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
          version={v}
          line={[m.approveLine(v, r.submittedByName, date(r.submittedAt)), p.versionNote].filter(Boolean).join(" ")}
        />
      )}
      {p.mode === "preview" && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[var(--gold)] bg-[var(--over-bg)] px-3 py-2.5 text-[13.5px] print:hidden">
          <b className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[var(--gold-deep)]">{all.builder.page.previewStrip}</b>
          <span className="min-w-0 flex-1">{all.builder.page.previewLine}</span>
          <Link href={`/${slug}/processes/processes/${processId}/map`} className="rounded-md border border-[var(--gold)] bg-[var(--gold)] px-3 py-1.5 text-[13px] font-semibold text-[var(--on-accent)]">
            {all.builder.page.backToBuilder}
          </Link>
        </div>
      )}
      {p.mode === "notyet" && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[var(--stone)] bg-white px-3 py-2.5 text-[13.5px]">
          <b className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[var(--stone)]">{m.notYet}</b>
          <span>{r.status === "IN_REVIEW" ? m.notYetReview(v, r.approverName) : m.notYetLine(v)}</span>
        </div>
      )}
      <TabRow
        label={m.views}
        tabs={[
          { key: "flow", label: m.tabs.flow, href: `${here}?tab=flow${q}`, on: tab === "flow" },
          { key: "steps", label: m.tabs.steps, href: `${here}?tab=steps${q}`, on: tab === "steps", count: counted.length || undefined },
          { key: "summary", label: m.tabs.summary, href: `${here}?tab=summary${q}`, on: tab === "summary", count: toLook ? m.toLookAt(toLook) : undefined },
        ]}
      />
      {body}
    </Sheet>
  );
}
