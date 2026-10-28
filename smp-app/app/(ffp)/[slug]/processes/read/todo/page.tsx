import { readerSeat } from "@/ffp/lib/auth/workspace";
import { doneLately, readerOf, todoOf, type TodoItem } from "@/ffp/lib/data/reading-side";
import { formatDate } from "@/ffp/lib/i18n/locale";
import { getLocale, getMessages } from "@/ffp/lib/i18n/server";
import { Sheet } from "../../band";
import { HomeHead } from "../home-head";
import { Btn, Code, lbl, note, panel } from "../ui";

/**
 * TO DO (spec 067 §3.1): what waits on the person, grouped: to approve, to
 * read. Each item has its button, and a short "Done lately" sits beside it.
 * Acting here or on a Processes row clears it in both, because both read the
 * one list (reading-side.ts todoOf). Reviews and answers to suggestions join
 * in stage 4, with owners and suggestions.
 */
export default async function ToDo(props: PageProps<"/[slug]/processes/read/todo">) {
  const { slug } = await props.params;
  const seat = await readerSeat(slug);
  const reader = await readerOf(slug, seat.ok ? seat.personKey : null);
  const [todo, done] = await Promise.all([todoOf(slug, reader), doneLately(slug, reader)]);
  const locale = await getLocale();
  const m = (await getMessages()).reading;
  const t = m.todo;
  const date = (d: Date | null) => (d ? formatDate(d, locale) : null);
  const base = `/${slug}/processes/read`;

  const card = (x: TodoItem) => {
    const c =
      x.kind === "plan"
        ? { key: "plan", code: null, name: t.planName, what: t.planWhat, meta: t.planMeta, why: t.planWhy, act: m.act.plan, href: `${base}/priorities` }
        : x.kind === "approve"
          ? { key: x.row.id, code: x.row.code, name: x.row.name, what: t.approveWhat(x.row.version), meta: t.approveMeta(x.row.submittedByName, date(x.row.submittedAt)), why: t.approveWhy, act: m.act.approve, href: `${base}/${x.row.id}` }
          : { key: x.row.id, code: x.row.code, name: x.row.name, what: t.readWhat(x.row.version, date(x.row.since)), meta: t.readMeta(x.row.mySteps), why: t.readWhy, act: m.act.read, href: `${base}/${x.row.id}?tab=steps` };
    return (
      <div key={c.key} className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1.5 rounded-lg border border-s-4 border-[#D6DCE5] border-s-[#C9A24D] bg-white px-4 py-3.5 max-sm:grid-cols-1">
        <div>
          <h3 className="flex flex-wrap items-baseline gap-1.5 text-[15.5px] font-semibold text-[#171B22]">
            {c.code && <Code>{c.code}</Code>}
            {c.name}
          </h3>
          <p className="mt-0.5 text-[13.5px] text-[#414A58]">{c.what}</p>
          <p className={note}>
            {c.meta} · {c.why}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5 max-sm:justify-start">
          <Btn href={c.href} gold>
            {c.act}
          </Btn>
        </div>
      </div>
    );
  };
  const group = (title: string, items: TodoItem[]) =>
    items.length > 0 && (
      <div className="mb-3.5">
        <div className="flex items-baseline gap-2">
          <span className={lbl}>{title}</span>
          <span className={note}>{items.length}</span>
        </div>
        {items.map(card)}
      </div>
    );

  return (
    <Sheet>
      <HomeHead slug={slug} which="todo" />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {todo.length ? (
            <>
              {group(t.approve, todo.filter((x) => x.kind !== "read"))}
              {group(t.read, todo.filter((x) => x.kind === "read"))}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">
              <b className="mb-1 block text-[15px] text-[#171B22]">{t.emptyTitle}</b>
              {reader.personId ? t.emptyBody : t.officeBody}
            </div>
          )}
        </div>
        <div className={`${panel} px-3.5 py-3`}>
          <span className={lbl}>{t.done}</span>
          {done.length ? (
            <ul className="mt-1.5">
              {done.map((d, i) => (
                <li key={i} className="border-t border-[#E6EAF0] py-[5px] text-[13px] text-[#636C79] first:border-t-0">
                  {d.kind === "read" ? t.doneRead(d.name, d.version) : t.doneApproved(d.name, d.version)} · {date(d.at)}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${note} mt-1.5`}>{t.doneNone}</p>
          )}
        </div>
      </div>
    </Sheet>
  );
}
