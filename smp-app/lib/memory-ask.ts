/* Asking the consulting memory (spec 044, phase C).
 *
 * NOT A SECOND ASSISTANT. lib/assistant.cjs already answers from a corpus,
 * declines rather than inventing, hands over to a person (§104) and caps its
 * own thinking (§133); this points it at a different corpus under two rules
 * of its own. It is built LAST on purpose — an assistant over an empty memory
 * answers confidently from nothing, which is worse than no assistant.
 */
import type { Pool } from "pg";
import { createRequire } from "node:module";
import type { SessionUser } from "./auth.ts";

const require = createRequire(import.meta.url);
const A = require("./assistant.cjs");

export const NOT_WRITTEN_UP =
  "Nobody has written that one up yet. If you know the answer, it is worth adding.";

export type Sourced = { id: string; title: string; client: string; author: string };

/* RULE ONE: EVERY ANSWER NAMES ITS SOURCES. The knowledge base's assistant
   cites a manual everybody can already read, so a missing citation costs
   little there. Here the errand is "go and ask the person who wrote it", and
   an answer with no source is worse than no answer.

   RULE TWO: it answers only from what the asker may read — today that is
   everything (decision 1), so this filters nothing, and it is written down
   anyway or a later narrowing would have nowhere to be enforced (§42). */
const INSTRUCTION = [
  "You are answering a consultant at Forefront from the firm's own consulting memory:",
  "write-ups of what was learned on client engagements, each one written by a named",
  "colleague about a named client.",
  "",
  "Answer ONLY from the entries below. Never invent an engagement, a client, a person",
  "or an outcome, and never generalise beyond what an entry actually says.",
  "",
  "ALWAYS name your sources. `source` must be the bracketed id of every entry you drew",
  "on, comma separated — a consultant's next step is to go and ask the person who wrote",
  "it, and they cannot do that if you do not say which one it was.",
  "",
  "If the memory does not cover the question, set answered to false and say so plainly:",
  "nobody has written this one up yet. That is a useful answer. A confident answer from",
  "nothing is not.",
  "",
  "Reply in plain prose, a few sentences, in British English. No markdown."
].join("\n");

type Row = {
  id: string; kind: string; title: string; occurred: string;
  happened: string; did: string; came_of_it: string; next_person: string;
  client_name: string; industry: string; author_name: string;
};

/* The corpus is written here rather than through assistant.cjs's own
   corpusText(), because that one is shaped for a manual — sections, pages and
   recipes — and an insight is none of those (§53.5: one shape per thing, not
   one thing squeezed into another's shape). */
export function corpusOf(rows: Row[]): string {
  return rows.map((r) => {
    const lines = [
      "## [" + r.id + "] " + r.title,
      "Client: " + r.client_name + (r.industry ? " (" + r.industry + ")" : ""),
      "Written by: " + r.author_name,
      "Kind: " + r.kind + (r.occurred ? " · when: " + r.occurred : ""),
    ];
    if (r.happened) lines.push("What happened: " + r.happened);
    if (r.did) lines.push("What we did: " + r.did);
    if (r.came_of_it) lines.push("What came of it: " + r.came_of_it);
    if (r.next_person) lines.push("What the next person should know: " + r.next_person);
    return lines.join("\n");
  }).join("\n\n");
}

export async function memoryAsk(pool: Pool, me: SessionUser, question: string) {
  const q = String(question || "").trim();
  if (!q) return { ok: false, why: "there is no question" };
  const rows: Row[] = (await pool.query(
    "SELECT e.id, e.kind, e.title, e.occurred, e.happened, e.did, e.came_of_it, e.next_person, " +
    "       t.name AS client_name, t.industry, u.name AS author_name " +
    "FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id JOIN users u ON u.id = e.author_id " +
    "ORDER BY e.created_at DESC LIMIT 300")).rows;
  if (!rows.length) return { ok: false, why: "the memory is empty — nothing has been written up yet" };

  const r = await A.ask({
    question: q,
    /* assistant.cjs refuses an empty corpus by counting recipes and sections,
       so the rows ride in as `sections` — the count is all it reads them for
       when corpusText is supplied. */
    kb: { sections: rows.map((x) => ({ id: x.id })), recipes: [] },
    corpusName: "THE CONSULTING MEMORY",
    /* RED: the entries are not sent, so it would answer from nothing at all */
    corpusText: process.env.SMP_BREAK === "no-corpus" ? "" : corpusOf(rows),
    instruction: INSTRUCTION,
    emptyWhy: "the memory is empty — nothing has been written up yet",
  });
  if (!r || !r.ok) return { ok: false, why: (r && r.why) || "the assistant could not be reached" };

  /* THE SOURCES ARE RESOLVED AGAINST WHAT WAS SENT, never trusted as written:
     a model that cites an id nobody has is citing nothing, and a page drawing
     it would send somebody after an insight that does not exist (§96.2). */
  const byId = new Map(rows.map((x) => [String(x.id), x]));
  const cited: Sourced[] = String(r.source || "")
    .split(/[,\s]+/).map((s) => s.replace(/[[\]]/g, "").trim()).filter(Boolean)
    .filter((id, i, all) => all.indexOf(id) === i)
    .map((id) => byId.get(id)).filter(Boolean)
    .map((x) => ({ id: String(x!.id), title: x!.title, client: x!.client_name, author: x!.author_name }));

  /* A DECLINE IS ANSWERED IN THE PRODUCT'S WORDS, NEVER THE MODEL'S (§125).
     assistant.cjs BLANKS the reply when it hands over, deliberately: on the
     product's manual a decline means a person is coming, and the model's
     sentence would read as the answer. Here nobody is coming — "nobody has
     written this one up yet" IS the answer, and it is the most useful thing
     the memory can say, because it tells you to go and write it. So the
     sentence is ours (§125's rule kept, its conclusion reversed for a corpus
     where the handover does not exist). */
  if (!r.answered) return { ok: true, answered: false, reply: NOT_WRITTEN_UP, sources: [] };
  return { ok: true, answered: true, reply: String(r.reply || ""), sources: cited };
}
