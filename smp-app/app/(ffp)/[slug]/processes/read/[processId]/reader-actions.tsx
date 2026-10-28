"use client";

/* What a reader does on a process page: print it, say they have read the
   version in force, and, for its approver, approve it or send it back with a
   note. The actions are the ones the lifecycle already had (process-acknowledge,
   process-lifecycle); only where they sit changed. */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import { acknowledgeProcess } from "@/ffp/lib/actions/process-acknowledge";
import { approveProcess, returnProcessToDraft } from "@/ffp/lib/actions/process-lifecycle";
import { bandQuiet } from "../../band";

type Res = { ok: boolean; error?: string; message?: string };
const said = (r: Res) => (r.error === "VALIDATION_ERROR" ? (r.message ?? "That could not be saved") : (r.error ?? "Failed"));

export function PrintButton() {
  const m = useMessages().reading.page;
  return (
    <button type="button" onClick={() => window.print()} className={bandQuiet}>
      {m.print}
    </button>
  );
}

/** "I have read it", on the band's wait line or in the Summary's waiting box. */
export function ReadButton({ workspaceId, processId, quiet }: { workspaceId: string; processId: string; quiet?: boolean }) {
  const m = useMessages().reading.page;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await acknowledgeProcess({ workspaceId, processId });
            if (!r.ok) return setError(said(r));
            router.refresh();
          });
        }}
        className={
          quiet
            ? "font-semibold underline underline-offset-2 disabled:opacity-60"
            : "rounded-md border border-[#C9A24D] bg-[#C9A24D] px-2.5 py-1 text-[12.5px] font-semibold text-[#16325C] disabled:opacity-60"
        }
      >
        {pending ? m.saving : m.iHaveRead}
      </button>
      {error && (
        <span role="alert" className="text-[12.5px] font-semibold text-[#FF9B8F]">
          {error}
        </span>
      )}
    </>
  );
}

/** The gold strip over a version sent for this person's approval. */
export function ApproveStrip({ workspaceId, processId, version, line }: { workspaceId: string; processId: string; version: number | null; line: string }) {
  const m = useMessages().reading.page;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [back, setBack] = useState(false);
  const [why, setWhy] = useState("");
  const run = (fn: () => Promise<Res>) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(said(r));
      router.push(`/${workspaceId}/processes/read`);
      router.refresh();
    });
  };
  const btn = "rounded-md border px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50";
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[#C9A24D] bg-[#FBF6E9] px-3 py-2.5 text-[13.5px] print:hidden">
      <b className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#8A6B22]">{m.forYourApproval}</b>
      <span className="min-w-0 flex-1">{line}</span>
      {back ? (
        <span className="flex w-full flex-wrap items-center gap-1.5">
          <input
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder={m.sendBackWhy}
            aria-label={m.sendBackWhy}
            maxLength={500}
            className="min-w-60 flex-1 rounded-md border border-[#78899F] bg-white px-2 py-1.5 text-[13px]"
          />
          <button type="button" disabled={pending || !why.trim()} onClick={() => run(() => returnProcessToDraft({ workspaceId, processId, reason: why }))} className={`${btn} border-[#D6DCE5] bg-white`}>
            {m.sendBackGo}
          </button>
          <button type="button" onClick={() => setBack(false)} className="text-[13px] font-semibold text-[#414A58] underline">
            {m.cancel}
          </button>
        </span>
      ) : (
        <span className="ms-auto flex flex-wrap gap-1.5">
          <button type="button" disabled={pending} onClick={() => setBack(true)} className={`${btn} border-[#D6DCE5] bg-white`}>
            {m.sendBack}
          </button>
          <button type="button" disabled={pending} onClick={() => run(() => approveProcess({ workspaceId, processId }))} className={`${btn} border-[#C9A24D] bg-[#C9A24D] text-[#16325C]`}>
            {pending ? m.saving : m.approve(version)}
          </button>
        </span>
      )}
      {error && (
        <span role="alert" className="w-full text-[13px] font-semibold text-[#8C3327]">
          {error}
        </span>
      )}
    </div>
  );
}
