/* ── The office assistant (§104, spec 016) ─────────────────────────────────
   Answers a question from the knowledge base, or says it cannot and hands the
   conversation to a person.

   THE ONLY PLACE `GEMINI_API_KEY` IS READ, and nothing this module returns
   contains it — the rule `lib/mailer.js` follows for Resend (§72, §97.5). A
   credential read in two places is a credential logged in one of them.

   NO SDK, NO DEPENDENCY. The repository carries `pg` and nothing else, and
   `lib/mailer.js` already calls a third-party API over plain HTTP for exactly
   this reason: a dependency is a supply chain, and this is one POST.

   THE MODEL IS AN ENVIRONMENT VARIABLE. Provider model names are renamed and
   retired on somebody else's schedule, and a rename must not need a deploy —
   so `GEMINI_MODEL` overrides the default, and a rejected name is reported
   with the name in it rather than as a bare failure.

   NOTHING HERE EVER THROWS. Every failure — no key, a refusal, a timeout, a
   malformed answer — comes back as `{ ok: false, why }`, because the caller's
   contract is that a broken assistant degrades to exactly the chat as it
   worked before it existed: the message is already stored and the conversation
   is left waiting for a person (spec 016 §4.2). */

const KEY_NAME = "GEMINI_API_KEY";
const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 12000;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";

/* THE ENDPOINT IS OVERRIDABLE, and that is not a test hook bolted on. It is
   what lets a check MODEL the provider rather than branch around it — §100.3's
   lesson, where a stub that merely answered instead of modelling made a
   correct client read as broken. It is also the seam for a corporate proxy,
   which a client deployment may one day need. Absent, it is Google's. */
function endpoint() { return process.env.GEMINI_ENDPOINT || ENDPOINT; }

function apiKey() { return process.env[KEY_NAME] || ""; }
function model() { return process.env.GEMINI_MODEL || DEFAULT_MODEL; }
function configured() { return !!apiKey(); }

/* ── What it is allowed to say ────────────────────────────────────────
   THE WHOLE CORPUS GOES IN. It is about 13,200 tokens and there is no
   retrieval step, no chunking and no second store to keep in step — a
   measurement, not a preference (spec 016 §1). If it ever stops fitting, that
   is the day to build retrieval and not before.

   `who` CHOOSES BETWEEN TWO PUBLIC ANSWERS, and never hides one. Every word
   here is on a page the asker may open (§37), so the audience tag is about
   usefulness: telling somebody to press a pen they do not have is a worse
   answer, not a safer one. */
function corpusText(kb, labels) {
  const sub = function (t) {
    return String(t == null ? "" : t)
      .replace(/\{pillars\}/g, (labels.pillars || "pillars"))
      .replace(/\{pillar\}/g, (labels.pillar || "pillar"))
      .replace(/<[^>]+>/g, "");                  /* the model reads prose, not markup */
  };
  const blocks = function (s) {
    return (s.blocks || []).map(function (b) {
      return (b.h ? "### " + sub(b.h) + "\n" : "") + sub(b.p);
    }).join("\n\n");
  };
  const parts = [];
  parts.push("# How the platform works\n");
  (kb.sections || []).forEach(function (s) {
    parts.push("## [" + s.id + "] " + sub(s.title) + "\n" + blocks(s));
  });
  parts.push("\n# What each page is for\n");
  (kb.pages || []).forEach(function (s) {
    parts.push("## [" + s.id + "] " + sub(s.title) + "\n" + blocks(s));
  });
  parts.push("\n# How to do things\n");
  (kb.recipes || []).forEach(function (r) {
    parts.push("## [" + r.id + "] " + sub(r.q) +
               (r.who === "office" ? "\n(useful only to the Strategy Office)" : "") +
               "\n" + sub(r.a).split("|").join("\n\n"));
  });
  return parts.join("\n\n");
}

/* THE INSTRUCTION IS SHORT AND ITS RULES ARE ABSOLUTE, in that order of
   importance: declining well is the hard part of this feature, not composing
   prose. Everything here is a rule about WHEN NOT TO ANSWER. */
function instruction(who) {
  return [
    "You are the assistant for a strategy management platform. You answer only",
    "from the knowledge base given below, which is the platform's own",
    "documentation.",
    "",
    "RULES, in order:",
    "1. If the knowledge base does not answer the question, set answered=false.",
    "   Never guess, never reason from what is plausible for software in",
    "   general, and never combine two entries into a claim neither makes.",
    "2. If the person is asking for a human, or is unhappy with an earlier",
    "   answer, set answered=false. That is an instruction, not a question.",
    "3. If they ask about their own figures, targets, scores or anything about",
    "   the data in this deployment, set answered=false. You cannot see any of",
    "   it. Do not describe what you would see.",
    "4. When you do answer: 2-4 short sentences, plain language, no headings",
    "   and no lists. Say what to do next where there is something to do.",
    "5. Cite the id in square brackets of the entry you used, as `source`.",
    "   If you used none, you are not answering: set answered=false.",
    "",
    "The person asking is " + (who || "someone in the organisation") + ".",
    "Where the knowledge base gives two answers to a question, choose the one",
    "written for them.",
    "",
    "When answered=false, leave reply empty. The platform tells them the",
    "Strategy Office will pick it up; you do not need to say so."
  ].join("\n");
}

const SCHEMA = {
  type: "object",
  properties: {
    answered: { type: "boolean" },
    reply: { type: "string" },
    source: { type: "string" }
  },
  required: ["answered", "reply", "source"]
};

/* ── The call ─────────────────────────────────────────────────────────
   `history` is the conversation so far, oldest first, as
   `{ from_office, body }` — so a follow-up ("what about the other one?")
   reads as a follow-up rather than as a question with no subject. */
async function ask(opts) {
  const kb = opts.kb || {};
  if (!configured()) return { ok: false, why: "no " + KEY_NAME + " is set on this deployment" };
  if (!(kb.recipes || []).length && !(kb.sections || []).length) {
    return { ok: false, why: "the knowledge base is empty" };
  }

  const turns = (opts.history || []).slice(-8).map(function (m) {
    return { role: m.from_office ? "model" : "user",
             parts: [{ text: String(m.body || "") }] };
  });
  /* A conversation must start with the person, or the provider rejects it. */
  while (turns.length && turns[0].role === "model") turns.shift();
  turns.push({ role: "user", parts: [{ text: String(opts.question || "") }] });

  const body = {
    systemInstruction: { parts: [
      { text: instruction(opts.who) },
      { text: "\n\n=== KNOWLEDGE BASE ===\n\n" + corpusText(kb, opts.labels || {}) }
    ] },
    contents: turns,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
      temperature: 0,
      maxOutputTokens: 700
    }
  };

  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, opts.timeoutMs || TIMEOUT_MS);
  let res, text;
  try {
    res = await fetch(endpoint() + encodeURIComponent(model()) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    text = await res.text();
  } catch (e) {
    return { ok: false, why: e && e.name === "AbortError"
      ? "the assistant did not answer in time" : "the assistant could not be reached" };
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    /* THE MODEL NAME IS IN THE MESSAGE when the provider rejects it, because
       "400 Bad Request" sends whoever reads the log to the wrong place, and a
       renamed model is the likeliest cause of a sudden 404 here. */
    let detail = "";
    try { detail = (JSON.parse(text).error || {}).message || ""; } catch (e) { detail = ""; }
    return { ok: false, status: res.status,
             why: "the assistant refused the request (" + res.status +
                  (res.status === 404 ? ", model \"" + model() + "\"" : "") +
                  (detail ? ": " + detail.slice(0, 200) : "") + ")" };
  }

  let out;
  try {
    const j = JSON.parse(text);
    const cand = (j.candidates || [])[0] || {};
    const parts = (cand.content || {}).parts || [];
    const raw = parts.map(function (p) { return p.text || ""; }).join("");
    if (!raw) return { ok: false, why: "the assistant answered with nothing" };
    out = JSON.parse(raw);
  } catch (e) {
    /* A MALFORMED ANSWER IS A FAILURE, NEVER A GUESS. Salvaging prose out of
       broken JSON would put an unflagged answer into the thread and leave
       nothing waiting for a person — the one outcome this must not produce. */
    return { ok: false, why: "the assistant's answer could not be read" };
  }

  const answered = out.answered === true;
  const reply = String(out.reply || "").trim();
  /* ANSWERED WITH NOTHING TO SAY IS NOT AN ANSWER. Checked here rather than
     trusted from the flag, because the flag is what moves the conversation out
     of the office's queue. */
  if (answered && !reply) return { ok: true, answered: false, reply: "", source: null };
  return { ok: true, answered: answered, reply: answered ? reply : "",
           source: answered ? (String(out.source || "").replace(/[\[\]]/g, "").trim() || null) : null };
}

module.exports = { ask, configured, model, KEY_NAME, corpusText, instruction, SCHEMA };
