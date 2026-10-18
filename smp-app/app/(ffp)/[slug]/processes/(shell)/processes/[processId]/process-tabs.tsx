import Link from "next/link";

export const PROCESS_TABS = [
  { key: "overview", label: "Overview" },
  { key: "lifecycle", label: "Lifecycle" },
  { key: "risks", label: "Risks & controls" },
  { key: "quality", label: "Quality" },
  { key: "people", label: "People" },
  { key: "compliance", label: "Compliance" },
  { key: "connections", label: "Connections" },
] as const;

export type ProcessTabKey = (typeof PROCESS_TABS)[number]["key"];

export function parseTab(raw: string | string[] | undefined): ProcessTabKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return PROCESS_TABS.some((t) => t.key === v) ? (v as ProcessTabKey) : "overview";
}

export function ProcessTabs({
  workspaceId,
  processId,
  active,
}: {
  workspaceId: string;
  processId: string;
  active: ProcessTabKey;
}) {
  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Process sections">
      {PROCESS_TABS.map((t) => (
        <Link
          key={t.key}
          href={`/${workspaceId}/processes/processes/${processId}?tab=${t.key}`}
          aria-current={t.key === active ? "page" : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13px] font-semibold transition ${
            t.key === active
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
