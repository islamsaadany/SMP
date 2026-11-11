"use client";

/* HOW THE LIBRARY IS ARRANGED (the bar above the list) AND THE MOVE BUTTONS OF "MY ORDER". The bar only changes the
   address (arrange, direction, group), so the arrangement can be shared as a link and the server draws the list;
   nothing is stored by choosing one. The buttons are the one thing here that writes: they save a process's place in
   "My order" and nothing else. */
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { moveProcessInOrder } from "@/ffp/lib/actions/process";
import { ARRANGE_LABEL, type ArrangeKey } from "@/ffp/lib/domain/process-arrange";

/** The keys where the biggest or the newest is what one looks for first. */
const BIGGEST_FIRST: ArrangeKey[] = ["steps", "updated"];

export function ArrangeBar({ arrange, desc, group, keys }: { arrange: ArrangeKey; desc: boolean; group: boolean; keys: readonly ArrangeKey[] }) {
  const router = useRouter();
  const path = usePathname();
  const go = (next: { arrange?: ArrangeKey; desc?: boolean; group?: boolean }) => {
    const a = next.arrange ?? arrange;
    const d = next.desc ?? (next.arrange ? BIGGEST_FIRST.includes(next.arrange) : desc);
    const g = next.group ?? group;
    const q = new URLSearchParams();
    if (a !== "code") q.set("arrange", a);
    if (d) q.set("adir", "desc");
    if (g) q.set("group", "dept");
    router.push(q.size ? `${path}?${q}` : path);
  };
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]" role="group" aria-label="Arrange the list">
      <label className="flex items-center gap-2 font-semibold text-[var(--ink-2)]">
        Arrange
        <select
          value={arrange}
          onChange={(e) => go({ arrange: e.target.value as ArrangeKey })}
          className="rounded-md border border-[var(--field-line)] bg-white px-2 py-1 text-[12.5px] font-normal text-[var(--ink)]"
        >
          {keys.map((k) => (
            <option key={k} value={k}>
              {ARRANGE_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => go({ desc: !desc })}
        disabled={arrange === "mine"}
        aria-label={desc ? "Reverse order, now reversed" : "Reverse order"}
        title={arrange === "mine" ? "My order is the order you set" : "Reverse the order"}
        className="rounded-md border border-[var(--line)] bg-white px-2 py-1 font-semibold text-[var(--ink)] hover:border-[var(--gold)] disabled:opacity-40"
      >
        {desc ? "↓ Reversed" : "↑ As is"}
      </button>
      <label className="flex items-center gap-1.5 text-[var(--ink-2)]">
        <input type="checkbox" checked={group} onChange={(e) => go({ group: e.target.checked })} />
        Group by department
      </label>
      {arrange === "mine" && !group && <span className="text-[var(--ink-3)]">Use the ▲ ▼ beside a process to move it among its own level.</span>}
    </div>
  );
}

export function MoveButtons({ workspaceId, processId, name, canUp, canDown }: { workspaceId: string; processId: string; name: string; canUp: boolean; canDown: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (direction: "UP" | "DOWN") => start(async () => {
    const r = await moveProcessInOrder({ workspaceId, processId, direction });
    if (r.ok) router.refresh();
  });
  const b = "grid h-5 w-5 place-items-center rounded text-[10px] leading-none text-[var(--ink-2)] hover:bg-[var(--surface-2)] disabled:opacity-25";
  return (
    <span className="me-1.5 flex flex-none flex-col">
      <button type="button" className={b} disabled={!canUp || pending} aria-label={`Move ${name} up`} onClick={() => move("UP")}>
        ▲
      </button>
      <button type="button" className={b} disabled={!canDown || pending} aria-label={`Move ${name} down`} onClick={() => move("DOWN")}>
        ▼
      </button>
    </span>
  );
}
