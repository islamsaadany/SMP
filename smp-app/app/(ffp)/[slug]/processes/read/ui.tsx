/* ── THE READING SIDE'S SMALL PIECES ───────────────────────────────────────
   Tables, pills, chips and flags as the approved prototype draws them (spec
   067 §2): rows white then light grey under a header a step darker, no row
   hover (§278.3), a process opening from its name or its button. */
import Link from "next/link";

export function TableBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  );
}

const thCls = "border-b border-[var(--line)] text-start [&+th]:border-s";

export function Head({ cols }: { cols: (React.ReactNode | { label: string; href: string; sorted: "ascending" | "descending" | null })[] }) {
  return (
    <thead className="bg-[var(--thead)] text-start text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--ink-2)]">
      <tr>
        {cols.map((c, i) =>
          c && typeof c === "object" && "href" in c ? (
            <th key={i} className={`${thCls} p-0`} aria-sort={c.sorted ?? undefined}>
              <Link href={c.href} className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 hover:text-[var(--ink)]">
                {c.label}
                <span aria-hidden="true" className={c.sorted ? "text-[var(--gold-deep)]" : "text-[var(--ink-3)]"}>
                  {c.sorted === "descending" ? "↓" : c.sorted ? "↑" : "↕"}
                </span>
              </Link>
            </th>
          ) : (
            <th key={i} className={`${thCls} whitespace-nowrap px-3 py-2.5`}>
              {c}
            </th>
          )
        )}
      </tr>
    </thead>
  );
}

export const td = "border-t border-[var(--line-soft)] px-3 py-2.5 align-middle [&+td]:border-s";

export function Code({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs font-bold text-[var(--stone)]">{children}</span>;
}

export type Tone = "good" | "attn" | "bad" | "q";
const PILL: Record<Tone, string> = {
  good: "bg-[var(--good-bg)] text-[var(--good-tx)]",
  attn: "bg-[var(--attn-bg)] text-[var(--attn-tx)]",
  bad: "bg-[var(--bad-bg)] text-[var(--bad-tx)]",
  q: "bg-[var(--surface-2)] text-[var(--ink-2)]",
};
export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-[9px] py-px text-[11.5px] font-semibold ${PILL[tone]}`}>{children}</span>;
}

const CHIP = {
  plain: "border-[var(--line)] text-[var(--ink-2)] bg-white",
  gold: "border-[var(--gold)] bg-[var(--over-bg)] text-[var(--gold-deep)]",
  navy: "border-[var(--stone)] text-[var(--stone)] bg-white",
  bad: "border-[var(--bad)] bg-[var(--bad-bg)] text-[var(--bad-tx)]",
};
export function Chip({ tone = "plain", children }: { tone?: keyof typeof CHIP; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-px text-[10.5px] font-bold uppercase tracking-[.04em] ${CHIP[tone]}`}>{children}</span>;
}

export type Flag = ["" | "bad" | "warn" | "good", string];
const FLAG = { "": "", bad: "font-semibold text-[var(--bad-tx)]", warn: "font-semibold text-[var(--attn-tx)]", good: "font-semibold text-[var(--good-tx)]" };
export function Flags({ flags }: { flags: Flag[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[var(--ink-2)]">
      {flags.map(([k, t]) => (
        <span key={t} className={FLAG[k]}>
          {t}
        </span>
      ))}
    </div>
  );
}

/** A button-styled link: gold for the one thing to do, plain otherwise. */
export function Btn({ href, gold, children }: { href: string; gold?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-[12.5px] font-semibold ${gold ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--on-accent)]" : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--gold)]"}`}
    >
      {children}
    </Link>
  );
}

/** Whole days from today to a date, negative once it has passed. */
export function daysUntil(d: Date) {
  const day = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.round((day(d) - day(new Date())) / 864e5);
}

export const panel = "rounded-lg border border-[var(--line)] bg-white";
export const lbl = "text-[11px] font-extrabold uppercase tracking-[.12em] text-[var(--ink-2)]";
export const note = "text-[12.5px] text-[var(--ink-3)]";
