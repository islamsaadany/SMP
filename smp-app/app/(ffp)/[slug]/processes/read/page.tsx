import Link from "next/link";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { filterRows, readerOf, readingRows, todoOf, type ReadRow, type TodoItem } from "@/ffp/lib/data/reading-side";
import { formatDate } from "@/ffp/lib/i18n/locale";
import { getLocale, getMessages } from "@/ffp/lib/i18n/server";
import { Sheet } from "../band";
import { HomeHead } from "./home-head";
import { Btn, Chip, Code, Flags, Head, Pill, TableBox, daysUntil, td, type Flag, type Tone } from "./ui";

/**
 * PROCESSES, ON THE READING SIDE (spec 067 §3.1; Islam: "the default one is the
 * all processes as is and then people see the other tables they should see as
 * filters", then "A": the tab is Processes, its first filter All). One page,
 * three filters: All, what is in force, searchable and sortable, with the
 * person's part; Yours, what they approve, in any state; You have a step in.
 * A filter shows only when it has rows. In Yours and You have a step in each
 * row carries its own button, read from the same list as To do.
 */
export default async function ReadProcesses(props: PageProps<"/[slug]/processes/read">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const seat = await readerSeat(slug);
  const reader = await readerOf(slug, seat.ok ? seat.personKey : null);
  const rows = await readingRows(slug, reader);
  const f = filterRows(rows);
  const todo = await todoOf(slug, reader);
  const locale = await getLocale();
  const m = (await getMessages()).reading;
  const date = (d: Date | null) => (d ? formatDate(d, locale) : "—");
  const base = `/${slug}/processes/read`;

  const n = { all: f.all.length, yours: f.yours.length, step: f.step.length };
  const want = one("f");
  const filt: keyof typeof n = (want === "yours" || want === "step") && n[want] ? want : "all";

  /* the buttons a row carries: whatever waits on this person for this process */
  const acts = (id: string) =>
    todo
      .filter((t): t is Extract<TodoItem, { row: ReadRow }> => t.kind !== "plan" && t.row.id === id)
      .map((t) =>
        t.kind === "approve" ? (
          <Btn key="a" href={`${base}/${id}`} gold>
            {m.act.approve}
          </Btn>
        ) : (
          <Btn key="r" href={`${base}/${id}?tab=steps`}>
            {m.act.read}
          </Btn>
        )
      );
  const openable = (r: ReadRow) => r.status === "PUBLISHED" || (r.approves && (r.status === "IN_REVIEW" || r.status === "APPROVED"));
  const name = (r: ReadRow) => (
    <>
      <Code>{r.code}</Code>{" "}
      {openable(r) ? (
        <Link href={`${base}/${r.id}`} className="border-b border-transparent font-bold text-[#171B22] hover:border-[#C9A24D]">
          {r.name}
        </Link>
      ) : (
        <b className="text-[#171B22]">{r.name}</b>
      )}
    </>
  );
  const where = (r: ReadRow): [Tone, string] =>
    r.status === "PUBLISHED"
      ? ["good", m.state.inForce(r.version)]
      : r.status === "IN_REVIEW"
        ? ["attn", m.state.inReview]
        : r.status === "APPROVED"
          ? ["attn", m.state.approved]
          : r.returnReason
            ? ["bad", m.state.sentBack]
            : ["q", m.state.drawing];

  let body: React.ReactNode;
  if (filt === "yours") {
    const flags = (r: ReadRow): Flag[] => {
      const out: Flag[] = [];
      if (r.noControl) out.push(["bad", m.flags.noControl(r.noControl)]);
      if (r.status === "PUBLISHED") {
        out.push([r.readBy < r.readers ? "warn" : "", m.flags.read(r.readBy, r.readers)]);
        if (r.nextReviewDue) {
          const d = daysUntil(r.nextReviewDue);
          out.push(d < 0 ? ["bad", m.flags.reviewLate] : d <= 30 ? ["warn", m.flags.reviewIn(d)] : ["", m.flags.reviewOn(date(r.nextReviewDue))]);
        }
      }
      if (r.status === "IN_REVIEW") out.push(["warn", m.flags.yourApproval]);
      if (r.status === "APPROVED") out.push(["good", m.flags.approved(r.version)]);
      if (r.status === "DRAFT" && r.returnReason) out.push(["warn", m.flags.sentBack]);
      return out;
    };
    body = (
      <>
        <TableBox>
          <Head cols={[m.head.process, m.head.part, m.head.where, m.head.attention]} />
          <tbody className="ffp-zebra">
            {f.yours.map((r) => {
              const a = acts(r.id);
              const [tone, label] = where(r);
              return (
                <tr key={r.id}>
                  <td className={td}>
                    {name(r)}
                    {r.department && <span className="block text-xs text-[#636C79]">{r.department}</span>}
                  </td>
                  <td className={td}>
                    <Chip tone="navy">{m.part.approver}</Chip>
                  </td>
                  <td className={td}>
                    <Pill tone={tone}>{label}</Pill>
                  </td>
                  <td className={td}>
                    <Flags flags={flags(r)} />
                    {a.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{a}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableBox>
        <p className="mt-2 text-[12.5px] text-[#636C79]">{m.yoursNote}</p>
      </>
    );
  } else if (filt === "step") {
    body = (
      <>
        <TableBox>
          <Head cols={[m.head.process, m.head.step, m.head.where, m.head.forYou]} />
          <tbody className="ffp-zebra">
            {f.step.map((r) => {
              const a = acts(r.id);
              const [tone, label] = where(r);
              return (
                <tr key={r.id}>
                  <td className={td}>
                    {name(r)}
                    {r.department && <span className="block text-xs text-[#636C79]">{r.department}</span>}
                  </td>
                  <td className={td}>{r.mySteps.join(", ")}</td>
                  <td className={td}>
                    <Pill tone={tone}>{label}</Pill>
                  </td>
                  <td className={td}>
                    <Flags flags={[r.iRead ? ["good", m.flags.readIt(r.version)] : ["warn", m.flags.notRead]]} />
                    {a.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{a}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableBox>
        <p className="mt-2 text-[12.5px] text-[#636C79]">{m.stepNote}</p>
      </>
    );
  } else {
    /* All: what is in force, searchable and sortable, with the person's part */
    const q = one("q").trim();
    const sort = (["name", "since", "part"] as const).find((k) => k === one("sort")) ?? "name";
    const desc = one("dir") === "desc";
    const part = (r: ReadRow) => (r.approves ? m.part.approver : r.mySteps.length ? m.part.step : "");
    const key = { name: (r: ReadRow) => r.name, since: (r: ReadRow) => (r.since ? r.since.toISOString() : ""), part: (r: ReadRow) => part(r) || "￿" }[sort];
    const shown = f.all
      .filter((r) => !q || `${r.code} ${r.name}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => key(a).localeCompare(key(b)) * (desc ? -1 : 1) || a.name.localeCompare(b.name));
    const sortHref = (k: typeof sort) => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      p.set("sort", k);
      if (sort === k && !desc) p.set("dir", "desc");
      return `${base}?${p}`;
    };
    const col = (k: typeof sort, label: string) => ({ label, href: sortHref(k), sorted: sort === k ? (desc ? ("descending" as const) : ("ascending" as const)) : null });
    body = !f.all.length ? (
      <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">{m.nothingInForce}</div>
    ) : (
      <>
        <form method="get" action={base} className="mb-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2">
          <label className="flex min-w-[220px] flex-[0_1_380px]">
            <span className="sr-only">{m.search}</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={m.searchPlaceholder}
              autoComplete="off"
              className="w-full rounded-md border border-[#78899F] bg-white px-2.5 py-[7px] text-[13.5px]"
            />
          </label>
          <button type="submit" className="rounded-md border border-[#D6DCE5] bg-white px-3 py-[7px] text-[13px] font-semibold">
            {m.searchGo}
          </button>
          <span className="text-[12.5px] text-[#636C79]">{q ? m.matchNote(shown.length, f.all.length) : m.inForceNote(f.all.length)}</span>
        </form>
        <TableBox>
          <Head cols={[col("name", m.head.process), col("since", m.head.since), col("part", m.head.part), <span key="o" className="sr-only">{m.head.open}</span>]} />
          <tbody className="ffp-zebra">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className={td}>{name(r)}</td>
                <td className={`${td} whitespace-nowrap`}>{m.since(r.version, date(r.since))}</td>
                <td className={td}>{part(r) ? <Chip tone={r.approves ? "gold" : "navy"}>{part(r)}</Chip> : <span className="text-[#636C79]">—</span>}</td>
                <td className={`${td} text-end`}>
                  <Btn href={`${base}/${r.id}`}>{m.open}</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </TableBox>
        {!shown.length && <p className="px-4 py-[18px] text-[13.5px] text-[#414A58]">{m.noMatch(q)}</p>}
      </>
    );
  }

  return (
    <Sheet>
      <HomeHead slug={slug} which="list" />
      <div role="group" aria-label={m.filters.label} className="mb-2.5 flex flex-wrap items-center gap-[5px]">
        {(["all", "yours", "step"] as const)
          .filter((k) => k === "all" || n[k])
          .map((k) => (
            <Link
              key={k}
              href={k === "all" ? base : `${base}?f=${k}`}
              aria-current={k === filt ? "true" : undefined}
              className={`whitespace-nowrap rounded-full border px-3 py-[5px] text-[13px] font-semibold ${k === filt ? "border-[#16325C] bg-[#16325C] text-white" : "border-[#D6DCE5] bg-white text-[#414A58] hover:border-[#C9A24D]"}`}
            >
              {m.filters[k]} <span className={`ms-[3px] font-bold ${k === filt ? "text-[#B9C2CE]" : "text-[#636C79]"}`}>{n[k]}</span>
            </Link>
          ))}
      </div>
      {body}
    </Sheet>
  );
}
