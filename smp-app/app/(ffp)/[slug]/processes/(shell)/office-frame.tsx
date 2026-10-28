"use client";

/* ── THE BUILDER HOME'S FRAME (spec 067 §4.2) ─────────────────────────────
   The navy band and the six tabs that replace the side menu (both drawn by
   ../band.tsx, which the reading side wears too). The band names the builder
   and the section's one line (no page carries its own title any more), the
   office's counts sit on its right, and its two actions are the staff view and
   a new process. A section's own views (Landscape's two) ride in a lighter row
   under the tabs. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import { Band, Sheet, TabRow, bandGold, bandQuiet } from "../band";

type Section = "all" | "handle" | "landscape" | "priorities" | "governance" | "export" | "roles" | "other" | "builder";

/** Which tab a path under /[slug]/processes belongs to. A process's own pages are the builder page, which draws its own band. */
function sectionOf(rest: string): Section {
  const [, first = "", second = ""] = rest.split("/");
  if (first === "processes" && second && second !== "deleted") return "builder";
  if (first === "" || first === "processes") return "all";
  if (first === "handle") return "handle";
  if (first === "value-chain" || first === "helicopter") return "landscape";
  if (first === "priorities" || first === "governance" || first === "export" || first === "roles") return first;
  return "other";
}

export type OfficeCounts = { total: number; drafts: number; sentBack: number; gaps: number; suggestions: number; toHandle: number };

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
  /* one process at a time: the builder page (processes/[processId]/layout.tsx) has its own band and menu */
  if (sec === "builder") return <>{children}</>;
  const tabs: { key: Exclude<Section, "other" | "roles" | "builder">; href: string; count?: number; hot?: boolean }[] = [
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
    { n: counts.suggestions, label: b.tiles.suggestions, hot: counts.suggestions > 0 },
    { n: counts.sentBack, label: b.tiles.sentBack, late: counts.sentBack > 0 },
    { n: counts.drafts, label: b.tiles.drafts },
    { n: counts.gaps, label: b.tiles.gaps, late: counts.gaps > 0 },
  ];

  return (
    <Sheet>
      <Band
        barStyle={barStyle}
        eyebrow={
          <>
            {clientName} · {b.eyebrow}
            {sec !== "all" && sec !== "other" && sec !== "roles" ? ` › ${b.tabs[sec]}` : sec === "roles" ? ` › ${b.handle.roles}` : ""}
          </>
        }
        title={
          <>
            {b.title}
            {!canEdit && (
              <span className="rounded border border-[var(--bar-accent)] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-[var(--bar-accent)]">{b.viewOnly}</span>
            )}
          </>
        }
        desc={desc}
        actions={
          <>
            <a href={`${base}/read`} className={bandQuiet}>
              {b.staffView}
            </a>
            {canEdit && (
              <Link href={`${base}/processes#new-process`} className={bandGold}>
                {b.newProcess}
              </Link>
            )}
          </>
        }
        tiles={tiles}
      />
      <TabRow
        label={b.sections}
        tabs={tabs.map((t) => ({ ...t, label: b.tabs[t.key], on: t.key === sec }))}
        views={
          views && (
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
          )
        }
      />
      {children}
    </Sheet>
  );
}
