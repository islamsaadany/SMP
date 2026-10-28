/* ── THE READING SIDE'S SMALL PIECES ───────────────────────────────────────
   Tables, pills, chips and flags as the approved prototype draws them (spec
   067 §2): rows white then light grey under a header a step darker, no row
   hover (§278.3), a process opening from its name or its button. */
import Link from "next/link";

export function TableBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-auto rounded-lg border border-[#D6DCE5] bg-white">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  );
}

const thCls = "border-b border-[#D6DCE5] text-start [&+th]:border-s";

export function Head({ cols }: { cols: (React.ReactNode | { label: string; href: string; sorted: "ascending" | "descending" | null })[] }) {
  return (
    <thead className="bg-[#E4E9F0] text-start text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[#414A58]">
      <tr>
        {cols.map((c, i) =>
          c && typeof c === "object" && "href" in c ? (
            <th key={i} className={`${thCls} p-0`} aria-sort={c.sorted ?? undefined}>
              <Link href={c.href} className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 hover:text-[#171B22]">
                {c.label}
                <span aria-hidden="true" className={c.sorted ? "text-[#8A6B22]" : "text-[#636C79]"}>
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

export const td = "border-t border-[#E6EAF0] px-3 py-2.5 align-middle [&+td]:border-s";

export function Code({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs font-bold text-[#16325C]">{children}</span>;
}

export type Tone = "good" | "attn" | "bad" | "q";
const PILL: Record<Tone, string> = {
  good: "bg-[#E4F0EA] text-[#1F6248]",
  attn: "bg-[#F7EFD6] text-[#7A5D1C]",
  bad: "bg-[#F7E3E0] text-[#8C3327]",
  q: "bg-[#EFF2F6] text-[#414A58]",
};
export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-[9px] py-px text-[11.5px] font-semibold ${PILL[tone]}`}>{children}</span>;
}

const CHIP = {
  plain: "border-[#D6DCE5] text-[#414A58] bg-white",
  gold: "border-[#C9A24D] bg-[#FBF6E9] text-[#8A6B22]",
  navy: "border-[#16325C] text-[#16325C] bg-white",
  bad: "border-[#B04434] bg-[#F7E3E0] text-[#8C3327]",
};
export function Chip({ tone = "plain", children }: { tone?: keyof typeof CHIP; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-px text-[10.5px] font-bold uppercase tracking-[.04em] ${CHIP[tone]}`}>{children}</span>;
}

export type Flag = ["" | "bad" | "warn" | "good", string];
const FLAG = { "": "", bad: "font-semibold text-[#8C3327]", warn: "font-semibold text-[#7A5D1C]", good: "font-semibold text-[#1F6248]" };
export function Flags({ flags }: { flags: Flag[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[#414A58]">
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
      className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-[12.5px] font-semibold ${gold ? "border-[#C9A24D] bg-[#C9A24D] text-[#16325C]" : "border-[#D6DCE5] bg-white text-[#171B22] hover:border-[#C9A24D]"}`}
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

export const panel = "rounded-lg border border-[#D6DCE5] bg-white";
export const lbl = "text-[11px] font-extrabold uppercase tracking-[.12em] text-[#414A58]";
export const note = "text-[12.5px] text-[#636C79]";
