"use client";

/* ── THE BUILDER HOME'S FRAME (spec 067 §4.2) ─────────────────────────────
   The navy band and the six tabs that replace the side menu. The band names
   the builder and the section's one line (no page carries its own title any
   more), the office's counts sit on its right, and its two actions are the
   staff view and a new process. The tabs stay in place as the page scrolls;
   a section's own views (Landscape's two) ride in a lighter row under them.
   The band takes the shared ledger panel's look (lib/ledger.ts) in Forefront's
   navy: its inks are passed in as CSS variables, worked out on the server. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@/ffp/lib/i18n/client";
import { LanguageSwitcher } from "@/ffp/language-switcher";

type Section = "all" | "handle" | "landscape" | "priorities" | "governance" | "export" | "roles" | "other";

/** Which tab a path under /[slug]/processes belongs to. A process's own pages sit under All processes. */
function sectionOf(rest: string): Section {
  const first = rest.split("/")[1] ?? "";
  if (first === "" || first === "processes") return "all";
  if (first === "handle") return "handle";
  if (first === "value-chain" || first === "helicopter") return "landscape";
  if (first === "priorities" || first === "governance" || first === "export" || first === "roles") return first;
  return "other";
}

export type OfficeCounts = { total: number; drafts: number; sentBack: number; gaps: number; toHandle: number };

export function OfficeFrame({
  workspaceId,
  clientName,
  counts,
  canEdit,
  barStyle,
  children,
}: {
  workspaceId: string;
  clientName: string;
  counts: OfficeCounts;
  canEdit: boolean;
  barStyle: React.CSSProperties;
  children: React.ReactNode;
}) {
  const m = useMessages();
  const b = m.builder;
  const pathname = usePathname() ?? "";
  const base = `/${workspaceId}/processes`;
  const sec = sectionOf(pathname.startsWith(base) ? pathname.slice(base.length) : "");
  const tabs: { key: Exclude<Section, "other" | "roles">; href: string; count?: number; hot?: boolean }[] = [
    { key: "all", href: `${base}/processes`, count: counts.total },
    { key: "handle", href: `${base}/handle`, count: counts.toHandle, hot: true },
    { key: "landscape", href: `${base}/value-chain` },
    { key: "priorities", href: `${base}/priorities` },
    { key: "governance", href: `${base}/governance` },
    { key: "export", href: `${base}/export` },
  ];
  const views =
    sec === "landscape"
      ? [
          { key: "valueChain" as const, href: `${base}/value-chain` },
          { key: "helicopter" as const, href: `${base}/helicopter` },
        ]
      : null;
  const desc = sec === "all" ? b.desc.all(counts.total, counts.drafts) : b.desc[sec];
  const tiles = [
    { n: counts.sentBack, label: b.tiles.sentBack, late: counts.sentBack > 0 },
    { n: counts.drafts, label: b.tiles.drafts, late: false },
    { n: counts.gaps, label: b.tiles.gaps, late: counts.gaps > 0 },
  ];

  /* the tab bar is marked once it holds on, so it reads as a bar over the page */
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const on = () => setStuck(!!bar.current && window.scrollY > 0 && bar.current.getBoundingClientRect().top <= 1);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="ffp-office mx-auto w-full max-w-[1320px] px-4 pb-16 pt-5 sm:px-6" style={{ fontFamily: "'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif" }}>
      <header
        className="mb-3.5 rounded-xl px-5 pb-[18px] pt-4 text-[var(--bar-ink)] shadow-[inset_0_-3px_0_var(--bar-accent)]"
        style={{ ...barStyle, background: "var(--bar)" }}
      >
        <div className="flex flex-wrap items-stretch justify-between gap-[18px]">
          <div className="min-w-0">
            <p className="mb-[7px] text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--bar-accent)]">
              {clientName} · {b.eyebrow}
              {sec !== "all" && sec !== "other" && sec !== "roles" ? ` › ${b.tabs[sec]}` : sec === "roles" ? ` › ${b.handle.roles}` : ""}
            </p>
            <h1 className="text-2xl font-semibold leading-tight">
              {b.title}
              {!canEdit && (
                <span className="ms-3 rounded border border-[var(--bar-accent)] px-1.5 py-px align-middle text-[10px] font-bold uppercase tracking-wide text-[var(--bar-accent)]">
                  {b.viewOnly}
                </span>
              )}
            </h1>
            <p className="mt-1 max-w-[80ch] text-[13px] text-[var(--bar-quiet)]">{desc}</p>
          </div>
          <div className="flex flex-col items-end justify-between gap-3.5">
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <a href={`${base}/read`} className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[var(--bar-quiet)] hover:bg-[var(--bar-hover)] hover:text-[var(--bar-ink)]">
                {b.staffView}
              </a>
              {canEdit && (
                <Link href={`${base}/processes#new-process`} className="rounded-md bg-[var(--bar-accent)] px-3 py-1.5 text-[13px] font-bold text-[#16325C]">
                  {b.newProcess}
                </Link>
              )}
            </div>
            <div className="flex gap-[22px] tabular-nums">
              {tiles.map((t) => (
                <div key={t.label} className="min-h-12 text-end">
                  <b className={`block text-[22px] font-semibold leading-none ${t.late ? "text-[var(--bar-late)]" : ""}`}>{t.n}</b>
                  <span className="mt-[3px] block whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[.1em] text-[var(--bar-quiet)]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div
        ref={bar}
        className={`sticky top-0 z-20 -mx-4 mb-3.5 bg-[#F7F8FA] px-4 py-1.5 transition-shadow sm:-mx-6 sm:px-6 ${stuck ? "shadow-[0_1px_0_#D6DCE5,0_8px_12px_-10px_rgba(15,23,42,.35)]" : ""}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav aria-label={b.sections} className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-[10px] border border-[#D6DCE5] bg-white p-1">
            {tabs.map((t) => {
              const on = t.key === sec;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex items-baseline gap-[7px] whitespace-nowrap rounded-[7px] px-4 py-2 text-[14.5px] font-semibold ${on ? "bg-[#16325C] text-white" : "text-[#414A58] hover:text-[#171B22]"}`}
                >
                  {b.tabs[t.key]}
                  {t.count ? (
                    <span
                      className={
                        t.hot
                          ? "rounded-full bg-[#E8A33A] px-[7px] text-xs font-bold leading-[18px] text-[#16325C]"
                          : `text-xs font-semibold ${on ? "text-[#B9C2CE]" : "text-[#636C79]"}`
                      }
                    >
                      {t.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <LanguageSwitcher />
        </div>
        {views && (
          <nav aria-label={b.views} className="mt-1.5 inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-[#D6DCE5] bg-[#EFF2F6] p-[3px]">
            {views.map((v) => {
              const on = pathname.startsWith(v.href);
              return (
                <Link
                  key={v.key}
                  href={v.href}
                  aria-current={on ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-[5px] text-[13px] font-semibold ${on ? "bg-white text-[#171B22] shadow-[0_1px_2px_rgba(15,23,42,.14)]" : "text-[#414A58]"}`}
                >
                  {b.landscapeViews[v.key]}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {children}
    </div>
  );
}
