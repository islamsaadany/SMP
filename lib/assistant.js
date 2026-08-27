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
/* Whether this provider accepts thinkingConfig — null until asked, then
   remembered for the process (§134). Never persisted: a fresh process asks
   again, which is what lets a provider that LEARNS the knob start being sent
   it again without anybody doing anything. */
let THINK_CAP_OK = null;
/* RETIRED FOR NEW USERS, NOT FOR OLD ONES (§132). Google's own 404, verbatim
   off Islam's screen: "This model models/gemini-2.5-flash is no longer
   available to new users. Please update your code to use models/gemini-3.6-flash".
   Strategy-Formulation goes on using 2.5-flash because its Google project
   predates the retirement — the same default was right there and wrong here,
   which is a difference no code review could see. GEMINI_MODEL still overrides
   for the day this one is retired in its turn. */
const DEFAULT_MODEL = "gemini-3.6-flash";
/* 20s, AND THE FUNCTION AROUND IT MUST OUTLIVE IT (§133). This was 12s while
   Vercel's DEFAULT function cap was 10 — so a slow model answer did not time
   out politely, it had the whole function killed under it: the person's
   message was already stored, the reply never happened, and nothing anywhere
   said so. The diagnostic's short question finished in time and went green,
   which is exactly how the two stopped agreeing. `vercel.json` now grants
   api/*.js 30s, and this stays comfortably inside it. */
const TIMEOUT_MS = 20000;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";

/* THE ENDPOINT IS OVERRIDABLE, and that is not a test hook bolted on. It is
   what lets a check MODEL the provider rather than branch around it — §100.3's
   lesson, where a stub that merely answered instead of modelling made a
   correct client read as broken. It is also the seam for a corporate proxy,
   which a client deployment may one day need. Absent, it is Google's. */
function endpoint() { return process.env.GEMINI_ENDPOINT || ENDPOINT; }

/* WHAT A HANDOFF SAYS (§125), and it lives HERE rather than beside the INSERT
   that writes it, because `api/chat.js` and `scripts/test-assistant.js` both
   need it and a string written twice is a string that drifts (§53.5). It
   promises nothing the panel has not already promised — the office's own words
   about how quickly it answers are on the panel's second line and are the
   tenant's to set (§98) — so it states what happened, says who has it, and
   stops. */
const HANDOFF_LINE =
  "I could not answer this one from the knowledge base. The office has it.";

/* TRIMMED, AND QUOTES STRIPPED (§124). A key pasted into a dashboard field
   arrives with a trailing newline often enough to be the first thing to rule
   out, and some people paste it with the quotes around it. Both produce the
   provider's least helpful error — "API key not valid" — against a key that is
   character-for-character correct, and neither is visible anywhere: the
   variable is set, it is non-empty, and it is wrong.

   Done HERE rather than asking somebody to check, because a value that only
   works when it is clean should be cleaned by whatever reads it. */
function apiKey() {
  return String(process.env[KEY_NAME] || "").trim().replace(/^["']|["']$/g, "");
}
function model() { return String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim(); }
/* PRESENT, NOT VALID. Everything this can see is that a value exists — whether
   the provider accepts it is a question only the provider answers, and §124
   was written because a row reading "working" off this was read as "the key is
   fine" while the provider was refusing it. */
function configured() { return !!apiKey(); }

/* WHAT KEY IS THIS, WITHOUT SAYING WHAT KEY THIS IS (§126). "The key is
   rejected" and "the key here is not the key you made" are two completely
   different errands — the first sends somebody to Google's console, the second
   to Vercel — and nothing on the screen could tell them apart, because the one
   fact that separates them is the value itself and that must never be printed.

   Its LENGTH and its first four characters are enough and are not secret.
   Four characters of a long secret is not the secret, and this row is behind
   the office's own door in any case.

   TWO SHAPES ARE GOOGLE'S (§132.2, correcting §126 the day it met a real key):
   the classic `AIza` + 35, and the newer `AQ.`-prefixed form Google now issues
   — Islam's fresh key was 53 characters starting `AQ.A`, this row called it a
   "different kind of credential", and the provider ACCEPTED it on the very
   next step, which is the one proof that outranks the heuristic. A shape test
   may say "this is not any key Google issues" only about shapes Google issues
   neither of; an unrecognised shape is reported as unrecognised, never as
   wrong — §124's rule again, a word must not claim more than was measured. */
const KEY_LEN = 39, KEY_HEAD = "AIza", KEY_HEAD2 = "AQ.";
function keyShape() {
  const k = apiKey();
  if (!k) return null;
  const classic = k.length === KEY_LEN && k.slice(0, 4) === KEY_HEAD;
  const newer = k.slice(0, 3) === KEY_HEAD2 && k.length >= 20;
  return { len: k.length, head: k.slice(0, 4),
           looksRight: classic || newer };
}

/* Does this failure say the KEY is wrong, rather than anything else? Google
   answers a bad key with 400 and a message, not 401, so the status alone
   cannot be trusted to mean what it usually means. */
function looksLikeBadKey(status, detail) {
  if (status === 401 || status === 403) return true;
  return /api[ _-]?key not valid|invalid api key|api key expired/i.test(String(detail || ""));
}

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

  /* NO THINKING FOR A LOOKUP (§134). The model reasons before it answers by
     default, and how long it reasons is a lottery — the same short question
     answered in under 12s on one run and blew a 20s budget on the next, which
     is §133's timeout fault coming back however big the budget. Answering
     from a corpus that is IN THE PROMPT is retrieval, not reasoning, so the
     thinking is capped at nought and the latency stops being weather.

     AND THE KNOB IS DROPPED IF THE PROVIDER REFUSES IT, once per process:
     the field's contract on a model Google ships tomorrow is unknowable from
     here, and a config knob must never be the thing that takes the assistant
     down (§112.2). A 400 naming "thinking" retries once without it and
     remembers. */
  const cfg = {
    responseMimeType: "application/json",
    responseSchema: SCHEMA,
    temperature: 0,
    /* THINKING COUNTS (§133): reasoning is billed against maxOutputTokens, so
       the headroom stays even with the budget at nought — a dropped knob or a
       model that thinks regardless must not starve the visible answer. */
    maxOutputTokens: 2048
  };
  if (THINK_CAP_OK !== false) cfg.thinkingConfig = { thinkingBudget: 0 };
  const body = {
    systemInstruction: { parts: [
      { text: instruction(opts.who) },
      { text: "\n\n=== KNOWLEDGE BASE ===\n\n" + corpusText(kb, opts.labels || {}) }
    ] },
    contents: turns,
    generationConfig: cfg
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
    /* THE FAULT IS REPORTED WHERE IT BELONGS. A rejected key arriving as "the
       model refused" sent somebody to look at the model name while the row
       above said the key was working (§124). */
    if (looksLikeBadKey(res.status, detail)) {
      return { ok: false, status: res.status, badKey: true,
               why: "the provider rejected the key" + (detail ? ": " + detail.slice(0, 160) : "") };
    }
    /* THE KNOB, NOT THE QUESTION (§134). A 400 that names thinking is the
       provider refusing thinkingConfig, not the ask — drop it, remember, and
       ask the same question once more. Only after the bad-key check: a bad
       key's 400 must never be retried into. */
    if (res.status === 400 && THINK_CAP_OK === null &&
        /thinking/i.test(detail)) {
      THINK_CAP_OK = false;
      return ask(opts);
    }
    return { ok: false, status: res.status,
             why: "the assistant refused the request (" + res.status +
                  (res.status === 404 ? ", model \"" + model() + "\"" : "") +
                  (detail ? ": " + detail.slice(0, 200) : "") + ")" };
  }

  if (THINK_CAP_OK === null) THINK_CAP_OK = true;

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

module.exports = { ask, configured, model, KEY_NAME, corpusText, instruction, SCHEMA,
                   looksLikeBadKey, HANDOFF_LINE, keyShape, KEY_LEN, KEY_HEAD, KEY_HEAD2,
                   /* test hook only: the cap's memory is per process, and a test
                      that cannot reset it can only measure the first case (§134). */
                   _resetThinkCap: function () { THINK_CAP_OK = null; } };
