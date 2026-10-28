"use client";

/* ── THE NAVY BAND AND THE TAB ROW, ON BOTH SIDES OF PROCESSES (spec 067 §2) ──
   The builder's frame and the reading side wear the same masthead: a gold path,
   a white title, one line under it, count tiles on the right with the actions
   above them, and a gold rule along the bottom. Under it a row of navy tab
   buttons stays in place as the page scrolls and gets a thin line once it has
   stuck. The band takes the shared ledger panel's look (lib/ledger.ts) in
   Forefront's navy: its inks arrive as CSS variables, worked out on the server
   (lib/branding.ts barVars). */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/ffp/language-switcher";

/** The page under the top bar: SMP's width and Source Sans, as the Internal Tracker sets them. */
export function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="ffp-office mx-auto w-full max-w-[1320px] px-4 pb-16 pt-5 sm:px-6" style={{ fontFamily: "'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif" }}>
      {children}
    </div>
  );
}

export type Tile = { n: React.ReactNode; label: string; late?: boolean; hot?: boolean };

/** A quiet action on the band (Print, Open the staff view). */
export const bandQuiet = "rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[var(--bar-quiet)] hover:bg-[var(--bar-hover)] hover:text-[var(--bar-ink)]";
/** The band's one gold action. */
export const bandGold = "rounded-md bg-[var(--bar-accent)] px-3 py-1.5 text-[13px] font-bold text-[#16325C] disabled:opacity-60";

export function Band({
  barStyle,
  eyebrow,
  title,
  desc,
  wait,
  actions,
  tiles,
}: {
  barStyle: React.CSSProperties;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  desc?: React.ReactNode;
  /** "Waiting on you", and what: the line that keeps the to-do in sight (spec 067 §3.1). */
  wait?: React.ReactNode;
  actions?: React.ReactNode;
  tiles: Tile[];
}) {
  return (
    <header
      className="mb-3.5 rounded-xl px-5 pb-[18px] pt-4 text-[var(--bar-ink)] shadow-[inset_0_-3px_0_var(--bar-accent)] max-sm:px-3.5"
      style={{ ...barStyle, background: "var(--bar)" }}
    >
      <div className="flex flex-wrap items-stretch justify-between gap-[18px]">
        <div className="min-w-0">
          <p className="mb-[7px] text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--bar-accent)]">{eyebrow}</p>
          <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-2xl font-semibold leading-tight">{title}</h1>
          {desc && <p className="mt-1 max-w-[80ch] text-[13px] text-[var(--bar-quiet)] [&_b]:font-semibold [&_b]:text-[var(--bar-ink)]">{desc}</p>}
          {wait && (
            <p className="mt-[9px] inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-md border border-[rgba(232,163,58,.45)] bg-[rgba(232,163,58,.14)] px-2.5 py-1 text-[13px]">
              {wait}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end justify-between gap-3.5 max-sm:items-start">
          {actions && <div className="flex flex-wrap items-center justify-end gap-1.5 max-sm:justify-start">{actions}</div>}
          <div className="flex flex-wrap gap-[22px] tabular-nums max-sm:gap-3.5">
            {tiles.map((t) => (
              <div key={t.label} className="min-h-12 text-end max-sm:text-start">
                <b className={`block text-[22px] font-semibold leading-none ${t.late ? "text-[var(--bar-late)]" : t.hot ? "text-[var(--bar-accent)]" : ""}`}>{t.n}</b>
                <span className="mt-[3px] block whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[.1em] text-[var(--bar-quiet)]">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/** The gold "Waiting on you" label that opens the band's wait line. */
export function WaitLabel({ children }: { children: React.ReactNode }) {
  return <b className="font-bold text-[var(--bar-accent)]">{children}</b>;
}

export type Tab = { key: string; label: string; href: string; on: boolean; count?: number | string; hot?: boolean };

export function TabRow({ label, tabs, views }: { label: string; tabs: Tab[]; views?: React.ReactNode }) {
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
    <div
      ref={bar}
      className={`sticky top-0 z-20 -mx-4 mb-3.5 bg-[#F7F8FA] px-4 py-1.5 transition-shadow sm:-mx-6 sm:px-6 print:hidden ${stuck ? "shadow-[0_1px_0_#D6DCE5,0_8px_12px_-10px_rgba(15,23,42,.35)]" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label={label} className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-[10px] border border-[#D6DCE5] bg-white p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.on ? "page" : undefined}
              className={`inline-flex items-baseline gap-[7px] whitespace-nowrap rounded-[7px] px-4 py-2 text-[14.5px] font-semibold max-sm:px-3 max-sm:text-sm ${t.on ? "bg-[#16325C] text-white" : "text-[#414A58] hover:text-[#171B22]"}`}
            >
              {t.label}
              {t.count ? (
                <span
                  className={
                    t.hot
                      ? "rounded-full bg-[#E8A33A] px-[7px] text-xs font-bold leading-[18px] text-[#16325C]"
                      : `text-xs font-semibold ${t.on ? "text-[#B9C2CE]" : "text-[#636C79]"}`
                  }
                >
                  {t.count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher />
      </div>
      {views}
    </div>
  );
}
