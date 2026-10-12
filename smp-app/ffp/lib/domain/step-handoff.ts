/**
 * Hand-overs between steps of DIFFERENT processes. Pure and framework-free.
 *
 * A hand-over says "this step in process A is a predecessor of that step in
 * process B". Same-process predecessors stay in StepConnection and are not
 * touched here.
 */

export type HandoffEdge = { fromStepId: string; toStepId: string };

export type HandoffRefusal =
  | "SAME_STEP"
  | "SAME_PROCESS"
  | "UNKNOWN_STEP"
  | "DUPLICATE"
  | "LOOP";

export const HANDOFF_REFUSALS: Record<HandoffRefusal, string> = {
  SAME_STEP: "A step cannot be its own predecessor.",
  SAME_PROCESS: "Both steps are in the same process. Use the ordinary predecessor for that.",
  UNKNOWN_STEP: "That step is not in this workspace.",
  DUPLICATE: "That hand-over already exists.",
  LOOP: "That would make the two processes wait on each other in a circle.",
};

/**
 * Can `toStepId` be reached from `fromStepId` by following same-process
 * connections and hand-overs forwards? Used to refuse a circle that spans
 * processes. Ordinary rework loops inside one process are NOT refused here:
 * only the new hand-over is being judged.
 */
export function reaches(
  startId: string,
  targetId: string,
  edges: HandoffEdge[]
): boolean {
  const next = new Map<string, string[]>();
  for (const e of edges) {
    const list = next.get(e.fromStepId);
    if (list) list.push(e.toStepId);
    else next.set(e.fromStepId, [e.toStepId]);
  }
  const seen = new Set<string>([startId]);
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop() as string;
    if (id === targetId) return true;
    for (const n of next.get(id) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return false;
}

/**
 * Judge a proposed hand-over. `stepProcessId` holds every step of the
 * workspace; `connections` and `handoffs` are all existing edges.
 * Returns null when it is allowed.
 */
export function judgeHandoff(
  proposed: HandoffEdge,
  stepProcessId: Map<string, string>,
  connections: HandoffEdge[],
  handoffs: HandoffEdge[]
): HandoffRefusal | null {
  const { fromStepId, toStepId } = proposed;
  if (fromStepId === toStepId) return "SAME_STEP";
  const fromProcess = stepProcessId.get(fromStepId);
  const toProcess = stepProcessId.get(toStepId);
  if (!fromProcess || !toProcess) return "UNKNOWN_STEP";
  if (fromProcess === toProcess) return "SAME_PROCESS";
  if (handoffs.some((h) => h.fromStepId === fromStepId && h.toStepId === toStepId)) {
    return "DUPLICATE";
  }
  // A circle exists if the new target already leads back to the new source.
  if (reaches(toStepId, fromStepId, [...connections, ...handoffs])) return "LOOP";
  return null;
}

/** One hand-over into a step, as already stored. */
export type ExistingHandoff = { id: string; fromStepId: string; label: string | null };

/** One staged box in the editor's "from another process" list. */
export type HandoffDraft = { handoffId: string | null; fromStepId: string; label: string };

export type HandoffOperation =
  | { kind: "delete"; handoffId: string }
  | { kind: "create"; fromStepId: string; label: string };

/**
 * Diffs the staged boxes against what is stored. A changed step or label is a
 * delete of the old row and a create of the new one (there is no in-place
 * update, same as ordinary predecessors). Deletes come first so a replaced
 * link never trips the duplicate rule against itself.
 */
export function reconcileHandoffDrafts(
  existing: ExistingHandoff[],
  staged: HandoffDraft[]
): HandoffOperation[] {
  const byId = new Map(existing.map((h) => [h.id, h]));
  const seen = new Set<string>();
  const deletes: HandoffOperation[] = [];
  const creates: HandoffOperation[] = [];

  for (const d of staged) {
    const matched = d.handoffId ? byId.get(d.handoffId) : undefined;
    if (matched) seen.add(matched.id);
    if (d.fromStepId === "") {
      if (matched) deletes.push({ kind: "delete", handoffId: matched.id });
      continue;
    }
    if (matched) {
      if (d.fromStepId === matched.fromStepId && d.label === (matched.label ?? "")) continue;
      deletes.push({ kind: "delete", handoffId: matched.id });
    }
    creates.push({ kind: "create", fromStepId: d.fromStepId, label: d.label });
  }
  for (const h of existing) {
    if (!seen.has(h.id)) deletes.push({ kind: "delete", handoffId: h.id });
  }
  return [...deletes, ...creates];
}
