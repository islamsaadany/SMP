"use client";

import { useCanEdit } from "../../../workspace-access";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProcessStepsBulk } from "@/ffp/lib/actions/process";

export function BulkAddStepsForm({ workspaceId, processId }: { workspaceId: string; processId: string }) {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Nothing here but a way to change something, so a Viewer is shown none
  // of it rather than controls the server would refuse.
  if (!canEdit) return null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setAddedCount(null);
          }}
          className="self-start rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          + Add multiple steps at once
        </button>
        {addedCount !== null && (
          <span className="text-xs text-emerald-700">
            Added {addedCount} step{addedCount === 1 ? "" : "s"}. Pick each on the Map above to fill it in.
          </span>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await addProcessStepsBulk({ workspaceId, processId, labels: lines });
          if (!result.ok) {
            setError(result.error === "VALIDATION_ERROR" ? (result.message ?? "Invalid step list") : result.error);
            return;
          }
          setAddedCount(result.data.ids.length);
          setText("");
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        One step per line — each is added as a Task, chained to the one before it
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={"Receive requisition\nCheck budget\nApprove or reject\nNotify requester"}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || lines.length === 0}
          className="self-start rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding…" : `Add ${lines.length} step${lines.length === 1 ? "" : "s"}`}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setText("");
            setError(null);
          }}
          disabled={pending}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <p className="text-xs text-slate-500">
        All added as plain Task steps. Pick each on the Map above to set who does it and what it is.
      </p>
    </form>
  );
}
