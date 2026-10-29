"use client";

/* ── THE BUILDER PAGE'S FRAME (spec 067 §4.1, §4.3) ──────────────────────────
   One process at a time. The band names it, and the name is a picker: find
   another process and it opens on the same section. Its actions are Preview as
   manager and the draft's next step. Save and exit sits just under the band and
   stays in view; it goes back to where the office came from (the process's
   reading page, through Open in builder, or else All processes). A menu on the
   left lists the ten sections, each with a status dot. Every change saves as it
   is made, so Save and exit has nothing left to save. */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@/ffp/lib/i18n/client";
import { Band, Sheet, bandGold, bandQuiet, type Tile } from "../../../band";

export const SECTIONS = ["map", "raci", "authority", "risks", "quality", "lifecycle", "people", "compliance", "connections", "ai"] as const;
export type SectionKey = (typeof SECTIONS)[number];
export type Dot = "ok" | "bad" | "q";

/** Where each section lives: the Map, RACI, Authority and Check with AI keep their own pages; the rest are tabs of the process page. */
export function sectionHref(base: string, k: SectionKey) {
  return k === "map" || k === "raci" || k === "authority" ? `${base}/${k}` : k === "ai" ? `${base}/review` : `${base}?tab=${k}`;
}
function sectionAt(pathname: string, tab: string | null, base: string): SectionKey {
  const rest = pathname.slice(base.length);
  if (rest.startsWith("/map")) return "map";
  if (rest.startsWith("/raci")) return "raci";
  if (rest.startsWith("/authority")) return "authority";
  if (rest.startsWith("/review")) return "ai";
  return (SECTIONS as readonly string[]).includes(tab ?? "") ? (tab as SectionKey) : "map";
}

export type PickerRow = { id: string; code: string; name: string; state: string };

export function BuilderFrame({
  workspaceId,
  processId,
  barStyle,
  eyebrow,
  name,
  pill,
  sub,
  next,
  canPreview,
  tiles,
  strip,
  dots,
  aiCount,
  picker,
  children,
}: {
  workspaceId: string;
  processId: string;
  barStyle: React.CSSProperties;
  eyebrow: string;
  name: string;
  pill: React.ReactNode;
  sub: React.ReactNode;
  next: string | null;
  canPreview: boolean;
  tiles: Tile[];
  strip: React.ReactNode;
  dots: Record<SectionKey, Dot>;
  aiCount: number;
  picker: PickerRow[];
  children: React.ReactNode;
}) {
  const m = useMessages().builder.page;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const tab = useSearchParams()?.get("tab") ?? null;
  const home = `/${workspaceId}/processes`;
  const base = `${home}/processes/${processId}`;
  const sec = sectionAt(pathname, tab, base);
  const fromKey = `ffp-builder-from:${processId}`;

  /* came through Open in builder? Save and exit goes back there */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") === "read") {
      try {
        sessionStorage.setItem(fromKey, `${home}/read/${processId}`);
      } catch {}
    }
  }, [fromKey, home, processId]);
  const exit = () => {
    let to = `${home}/processes`;
    try {
      to = sessionStorage.getItem(fromKey) || to;
      sessionStorage.removeItem(fromKey);
    } catch {}
    router.push(to);
  };

  /* the picker on the process name */
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const found = picker.filter((p) => !q || `${p.code} ${p.name}`.toLowerCase().includes(q.toLowerCase()));
  const hrefFor = (id: string) => sectionHref(`${home}/processes/${id}`, sec);

  return (
    <Sheet>
      <div ref={box} className="relative">
        <Band
          barStyle={barStyle}
          eyebrow={eyebrow}
          title={
            <>
              <button
                type="button"
                onClick={() => {
                  setOpen(!open);
                  setQ("");
                }}
                aria-haspopup="true"
                aria-expanded={open}
                title={m.pick}
                className="inline-flex items-center gap-1.5 border-b border-dashed border-white/45 text-start"
              >
                {name} <i aria-hidden="true" className="text-[15px] not-italic text-[var(--bar-accent)]">▾</i>
              </button>
              {pill}
            </>
          }
          desc={sub}
          actions={
            <>
              {canPreview && (
                <Link href={`${home}/read/${processId}?preview=1`} className={bandQuiet}>
                  {m.preview}
                </Link>
              )}
              {next && (
                <Link href={`${base}?tab=lifecycle`} className={bandGold}>
                  {next}
                </Link>
              )}
            </>
          }
          tiles={tiles}
        />
        {open && (
          <div className="absolute start-5 top-[78px] z-30 grid w-[min(340px,calc(100%-40px))] gap-1 rounded-[10px] border border-[var(--line)] bg-white p-2 text-[var(--ink)] shadow-[0_10px_28px_rgba(15,23,42,.16)]">
            <input
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && found[0] && router.push(hrefFor(found[0].id))}
              placeholder={m.find}
              aria-label={m.find}
              autoComplete="off"
              className="w-full rounded-md border border-[var(--field-line)] px-2 py-1.5 text-[13px]"
            />
            <div role="list" className="grid max-h-[280px] overflow-auto">
              {found.length ? (
                found.map((p) => (
                  <Link
                    key={p.id}
                    role="listitem"
                    href={hrefFor(p.id)}
                    onClick={() => setOpen(false)}
                    className={`flex gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-[var(--surface-2)] ${p.id === processId ? "bg-[var(--surface-2)]" : ""}`}
                  >
                    <span className="font-mono text-xs font-bold text-[var(--stone)]">{p.code}</span>
                    <span>
                      {p.name}
                      <br />
                      <small className="text-[11.5px] text-[var(--ink-3)]">{p.state}</small>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-2 py-1.5 text-[12.5px] text-[var(--ink-3)]">{m.noMatch}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sticky top-0 z-20 -mx-4 mb-3.5 flex flex-wrap items-center justify-between gap-2.5 bg-[var(--ground)] px-4 py-1.5 sm:-mx-6 sm:px-6">
        <span className="text-[12.5px] text-[var(--ink-3)]">{m.saved}</span>
        <button type="button" onClick={exit} className="rounded-md border border-[var(--gold)] bg-[var(--gold)] px-3 py-1.5 text-[13px] font-bold text-[var(--on-accent)]">
          {m.exit}
        </button>
      </div>
      {strip}

      <div className="grid items-start gap-3.5 min-[900px]:grid-cols-[210px_minmax(0,1fr)]">
        <nav
          aria-label={m.sections}
          className="grid gap-0.5 rounded-lg border border-[var(--line)] bg-white p-2 max-[899px]:auto-cols-max max-[899px]:grid-flow-col max-[899px]:overflow-x-auto min-[900px]:sticky min-[900px]:top-[60px]"
        >
          {SECTIONS.map((k, i) => (
            <div key={k} className="contents">
              {(i === 6 || i === 9) && <span className="mx-1.5 my-1 h-px bg-[var(--line-soft)] max-[899px]:hidden" />}
              <Link
                href={sectionHref(base, k)}
                aria-current={k === sec ? "page" : undefined}
                className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-2.5 py-2 text-[13.5px] font-semibold ${k === sec ? "bg-[var(--panel)] text-[var(--panel-ink)]" : "text-[var(--ink-2)] hover:bg-[var(--surface-2)]"}`}
              >
                <span>
                  {m.menu[k]}
                  {k === "ai" && aiCount > 0 ? ` · ${aiCount}` : ""}
                </span>
                <span className={`h-2 w-2 flex-none rounded-full ${dots[k] === "bad" ? "bg-[var(--bad)]" : dots[k] === "ok" ? "bg-[var(--good)]" : "bg-[var(--line)]"}`} />
              </Link>
            </div>
          ))}
        </nav>
        <div className="min-w-0">
          <p className="mb-2.5 text-[12.5px] text-[var(--ink-3)]">{m.desc[sec]}</p>
          {children}
        </div>
      </div>
    </Sheet>
  );
}
