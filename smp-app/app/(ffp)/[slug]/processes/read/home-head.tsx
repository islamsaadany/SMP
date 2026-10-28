import Link from "next/link";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { clientSettings } from "@/ffp/lib/data/client-settings";
import { filterRows, readerOf, readingRows, todoOf } from "@/ffp/lib/data/reading-side";
import { getMessages } from "@/ffp/lib/i18n/server";
import { barVars } from "@/lib/branding.ts";
import { Band, TabRow, WaitLabel, bandGold } from "../band";

export const barStyle = () => Object.fromEntries(barVars("#16325C").split(";").map((d) => d.split(":") as [string, string])) as React.CSSProperties;

/**
 * THE READING SIDE'S BAND AND TABS (spec 067 §3.1): Processes, with the
 * person's job title and their part; tiles for what they approve, what waits on
 * them and the risks with no control in what they approve; and a "Waiting on
 * you" line that opens To do, so the to-do never hides. The tabs are
 * Processes · To do, To do carrying a gold count. "You own" joins in stage 4,
 * when a process has an owner.
 */
export async function HomeHead({ slug, which }: { slug: string; which: "list" | "todo" }) {
  const seat = await readerSeat(slug);
  const m = (await getMessages()).reading;
  const reader = await readerOf(slug, seat.ok ? seat.personKey : null);
  const f = filterRows(await readingRows(slug, reader));
  const todo = await todoOf(slug, reader);
  const client = (await clientSettings(slug))?.name || (seat.ok ? seat.tenantName : slug);
  const base = `/${slug}/processes/read`;
  const noControl = f.yours.reduce((n, r) => n + r.noControl, 0);
  const office = seat.ok && seat.office;

  return (
    <>
      <Band
        barStyle={barStyle()}
        eyebrow={`${client} · ${m.eyebrow}`}
        title={m.title}
        desc={
          reader.personId ? (
            <>
              {reader.name}
              {reader.title ? ` · ${reader.title}` : ""} · <b>{f.yours.length}</b> {m.youApprove} · <b>{f.step.length}</b> {m.youHaveStep}
            </>
          ) : (
            m.officeDesc
          )
        }
        wait={
          todo.length > 0 && which !== "todo" ? (
            <>
              <WaitLabel>{m.waitingOnYou}</WaitLabel>
              <span>{m.waitingThings(todo.length)}</span>
              <Link href={`${base}/todo`} className="font-semibold underline underline-offset-2">
                {m.seeThem}
              </Link>
            </>
          ) : undefined
        }
        actions={
          office ? (
            <Link href={`/${slug}/processes/processes`} className={bandGold}>
              {m.backToBuilder}
            </Link>
          ) : undefined
        }
        tiles={
          reader.personId
            ? [
                { n: f.yours.length, label: m.tiles.approve },
                { n: todo.length, label: m.tiles.waiting, hot: todo.length > 0 },
                { n: noControl, label: m.tiles.noControl, late: noControl > 0 },
              ]
            : [{ n: f.all.length, label: m.tiles.inForce }]
        }
      />
      <TabRow
        label={m.sections}
        tabs={[
          { key: "list", label: m.tabs.list, href: base, on: which === "list", count: f.all.length },
          { key: "todo", label: m.tabs.todo, href: `${base}/todo`, on: which === "todo", count: todo.length || undefined, hot: true },
        ]}
      />
    </>
  );
}
