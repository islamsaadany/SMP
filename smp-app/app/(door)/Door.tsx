"use client";
/* The door's card, index.html's markup and script ported (§34, §69.11,
   §313.36). Server mode only — there is no legacy latch here: the app is
   never opened from a memory stick. Everything it does is take an address and
   a password, and hand over. */
import { useEffect, useRef, useState } from "react";

type Dress = { name: string; mark: string | null } | null;
type WhereItem = { at: string; name: string };
type Where = { units: WhereItem[]; functions: WhereItem[]; near: string[]; mainbu: string | null; mine: string | null };

const Mark = () => (
  <span className="mark">
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 5.2 27.4 12H4.6z" fill="#16325C" />
      <rect x="5.2" y="13.2" width="21.6" height="2.4" fill="#16325C" />
      <rect x="7.2" y="17" width="3.2" height="7.4" fill="#C9A24D" />
      <rect x="14.4" y="17" width="3.2" height="7.4" fill="#C9A24D" />
      <rect x="21.6" y="17" width="3.2" height="7.4" fill="#C9A24D" />
      <rect x="4.4" y="25.6" width="23.2" height="2.8" rx="0.6" fill="#16325C" />
    </svg>
  </span>
);
const Ic = ({ d }: { d: string }) => (
  <span className="ic">
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  </span>
);
const LOCK = "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z";
/* The address, carried across the one navigation a refusal now costs (§370).
   Per TAB, so it cannot outlive the attempt or reach another person's. */
const EMAIL_BACK = "smp.door.email";

/* The password reveal, once for every password field (index.html wired it
   over all of them rather than three times by hand). */
function PasswordField({ id, autoComplete, placeholder, autoFocus, inputRef }: {
  id: string; autoComplete: string; placeholder: string; autoFocus?: boolean; inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [shown, setShown] = useState(false);
  const local = useRef<HTMLInputElement | null>(null);
  const ref = inputRef || local;
  return (
    <div className="field">
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={LOCK} />
      </svg>
      <input ref={ref} type={shown ? "text" : "password"} id={id} name={id} autoComplete={autoComplete} placeholder={placeholder} autoFocus={autoFocus} />
      <button type="button" className={"eye" + (shown ? " revealed" : "")} aria-label={shown ? "Hide password" : "Show password"}
        onClick={() => { setShown(!shown); ref.current?.focus(); }}>
        <svg className="i-open" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <svg className="i-shut" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
        </svg>
      </button>
    </div>
  );
}

/* THE MARK IS THE DOOR'S CLIENT'S, AND THE ROOT DOOR HAS NONE (§313.36):
   inserted above the heading of both cards, from the client's own row. */
function ClientMark({ dress }: { dress: Dress }) {
  if (!dress || !dress.mark) return null;
  return (<><img className="clientmark" src={dress.mark} alt={dress.name} /><hr /></>);
}

async function api(path: string, body: unknown): Promise<any> {
  const r = await fetch("/api/auth/" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

export default function Door({ slug, dress, initial }: { slug: string | null; dress: Dress; initial: "login" | "change" }) {
  const [card, setCard] = useState<"login" | "change">(initial);
  const [error, setError] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  /* `landing` was this card's own memory of where the sign-in said to go,
     and with the browser doing the navigating there is nothing left to
     remember — the password endpoint answers with its own. Deleted rather
     than left holding null for a reader to take as load-bearing (§24). */
  const [where, setWhere] = useState<Where | null>(null);
  const [at, setAt] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  /* `pwRef` reached in to read the password and then to WIPE it; with the
     browser posting the form there is nothing here that may touch that
     field, and the wipe was half of what confused the password keeper
     (§370). PasswordField keeps its own ref for the reveal. */
  const newRef = useRef<HTMLInputElement | null>(null);

  /* THE FIRST FIELD THAT IS ACTUALLY THERE (§69.11): whoever reveals a card
     decides where the cursor goes. */
  /* THE SIGN-IN FORM POSTS TO THE API ITSELF, ALWAYS (method and action
     below) — before the script is live, and since §370 after it too, which
     is why a press in the first few hundred milliseconds behaves exactly
     like every other one. The API answers a form post with a redirect, and
     `?refused=1` is how the door then says the one sentence. The PASSWORD
     card is still the script's, because it compares two fields and asks
     where they work before it may navigate. `data-hydrated` is for the
     checks, which must not press before the handlers are attached. */
  useEffect(() => {
    setHydrated(true);
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("refused")) {
        setError("That email and password do not match.");
        /* AND THE ADDRESS IS PUT BACK (§370). A refusal is a fresh document
           now, so the field the browser refills is one it has SAVED — which
           for the person this section is about it has not, because they are
           typing their password precisely because it is not saved. Kept for
           this tab only, never in the address (a query string is history and
           a server log), and a store that throws is not worth a broken
           sign-in (§107). */
        try { const was = sessionStorage.getItem(EMAIL_BACK); if (was && emailRef.current) emailRef.current.value = was; } catch {}
        history.replaceState(null, "", location.pathname);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (card === "login") emailRef.current?.focus();
    if (card === "change") {
      newRef.current?.focus();
      /* THE LIST COMES FROM THE SERVER, and the control is hidden until it
         does; the register having already answered means no question. */
      fetch("/api/auth/where", { cache: "no-store" }).then((r) => r.json()).then((j) => {
        if (!j || !j.ok || j.settled) return;
        setWhere(j); setAt(j.mine || "");
      }).catch(() => { /* no question rather than a broken one */ });
    }
  }, [card]);

  /* ── THE BROWSER SUBMITS THIS FORM (§370) ────────────────────────────
     Islam: "the mouse doesn't click from the first time, the whole window
     should be clicked first anywhere, then the hovering effect happens" —
     on the console, after signing in, "only when I use the password to
     login; if I login when it remembers the password it works fine."

     MEASURED FROM HIS OWN RECORDING: at 10.7s the console is fully drawn,
     the pointer is sitting ON a module row, and there is no hand cursor and
     no highlight; at 14.5s the same row lights under the same pointer with
     nothing reloaded in between. So the page is finished and is not being
     given the mouse — not a slow boot, and nothing of ours covering it
     (measured: no full-window layer, 47 of 47 controls reachable).

     AND THE AUTOFILL HALF IS WHAT NAMES THE CAUSE, because it is the one
     thing that differs between his two cases: a password already saved
     raises no question, and a newly typed one does. This handler was taking
     the press itself (`preventDefault`), posting in the background, WIPING
     THE PASSWORD FIELD and then replacing the location — which is the shape
     a browser's password keeper cannot tie to a submission, so it falls to
     its heuristics and raises its prompt late, over the page we navigated
     to. While that prompt holds the pointer the console gets no `mousemove`
     at all, so `:hover` is never recomputed and the first press goes to
     dismissing it. That is the dead window, and it is ours to stop causing.

     THE SERVER ALREADY ANSWERED A REAL FORM POST — `sign-in/route.ts` reads
     `application/x-www-form-urlencoded`, sets the cookie and answers 303 —
     because that is the no-script path this door was built with. So there
     is nothing to add: the form carries `method`, `action`, the hidden
     door, `autocomplete="username"` and `autocomplete="current-password"`,
     and the one thing stopping the browser doing this itself was the line
     below. Handing it back means the keeper sees an ordinary submission and
     asks its question HERE, where it belongs, before anything navigates.

     WHAT IS NOT CLAIMED (§124): the prompt is not visible anywhere in the
     recording, so this is reasoned from the autofill difference and not
     read off the screen. What IS certain is that the guessy path is ours
     and this removes it. */
  function signIn() {
    setError(null); setBusy(true);
    try { sessionStorage.setItem(EMAIL_BACK, emailRef.current?.value.trim() || ""); } catch {}
    /* no preventDefault: the browser posts the form and follows the 303 */
  }

  async function setPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChangeError(null);
    const f = e.currentTarget;
    const a = (f.elements.namedItem("newpw") as HTMLInputElement).value;
    const b = (f.elements.namedItem("newpw2") as HTMLInputElement).value;
    if (a !== b) { setChangeError("The two entries differ."); return; }
    setBusy(true);
    try {
      const j = await api("password", { next: a });
      if (!j.ok) { setChangeError(j.message || "Could not set the password."); return; }
      /* THE PASSWORD IS ALREADY SET BY HERE, so nothing about where they work
         may stop them getting in: the declaration is sent and not waited on
         for anything that matters. */
      const go = () => location.replace(j.landing || "/");
      if (!where || !at) return go();
      api("where", { at }).then(go, go);
    } catch { setChangeError("Could not reach the server."); }
    finally { setBusy(false); }
  }

  const group = (list: WhereItem[], label: string) => list.length ? (
    <optgroup key={label} label={label}>{list.map((x) => <option key={x.at} value={x.at}>{x.name}</option>)}</optgroup>
  ) : null;
  let whereGroups: React.ReactNode[] = [];
  if (where) {
    const all = where.units.concat(where.functions);
    const near = where.near.map((a) => all.find((x) => x.at === a)).filter(Boolean) as WhereItem[];
    if (near.length) {
      const rest = (l: WhereItem[]) => l.filter((x) => where.near.indexOf(x.at) === -1);
      whereGroups = [group(near, where.mainbu || "Yours"), group(rest(where.units), "Other business units"), group(rest(where.functions), "Other supporting functions")];
    } else {
      whereGroups = [group(where.units, "Business units"), group(where.functions, "Supporting functions")];
    }
  }

  return (
    <div className="gate" data-hydrated={hydrated ? "1" : undefined}>
      <aside className="brand">
        <span className="halo halo-a"></span><span className="halo halo-b"></span><span className="halo halo-c"></span>
        <div className="brand-in">
          <div className="mark-row">
            <Mark />
            <div><h1>FOREFRONT CONSULTING</h1><p>Strategy Management Platform</p></div>
          </div>
          <div className="hero">
            <h2>Every plan,<br /><em>measured the same way</em>.</h2>
            <p>Group and business-unit strategy — planned, scored, reported and reviewed in one place.</p>
          </div>
          {/* Everything claimed here is something SMP actually does — no
              invented capability on the front door (§34). The fourth line is
              Islam's (2026-09-09): the wall is an introduction, not a pitch. */}
          <ul className="props">
            <li><Ic d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <div><b>Scores nobody types</b><span>Derived from the plan and the actuals, every time</span></div></li>
            <li><Ic d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <div><b>Cycles that keep their record</b><span>Each reporting cycle snapshotted, never overwritten</span></div></li>
            <li><Ic d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              <div><b>Everyone sees their own view</b><span>By role, from group CEO to strategy custodian</span></div></li>
            <li><Ic d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm8 11v4m-4 0h8" />
              <div><b>Presented from the same place</b><span>The review is presented from the page it was reported on, never from a copy</span></div></li>
          </ul>
        </div>
        <p className="quote">&ldquo;A strategy you cannot measure is a document.&rdquo;</p>
      </aside>

      <main className="stage">
        <div className="dots"></div>
        <div className="mobrand">
          <Mark />
          <div><h1>FOREFRONT CONSULTING</h1><p>Strategy Management Platform</p></div>
        </div>
        <div className="frame">
          {card === "login" && (
            <div className="card" id="login">
              <ClientMark dress={dress} />
              <h2>Welcome back</h2>
              <p>Sign in to continue</p>
              <form id="loginForm" method="post" action="/api/auth/sign-in" onSubmit={signIn}>
                {slug && <input type="hidden" name="door" value={slug} />}
                <label htmlFor="user">Email</label>
                <div className="field">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7l8.5 6 8.5-6" />
                  </svg>
                  <input ref={emailRef} type="text" id="user" name="email" autoComplete="username" autoCapitalize="none" inputMode="email" spellCheck={false} placeholder="Your work email" />
                </div>
                <label htmlFor="password">Password</label>
                <PasswordField id="password" autoComplete="current-password" placeholder="Enter your password" />
                <div className="error" id="error" style={{ display: error ? "block" : "none" }}>{error}</div>
                <button type="submit" disabled={busy}>Sign In</button>
              </form>
              <p className="foot">You will stay signed in on this device for 30 days.</p>
            </div>
          )}
          {card === "change" && (
            <div className="card" id="change" style={{ display: "block" }}>{/* the stylesheet hides #change; index.html's show() sets it inline, as here */}
              <ClientMark dress={dress} />
              <h2>Choose your own password</h2>
              <p>The one you were issued is temporary</p>
              <form id="changeForm" method="post" action="/api/auth/password" onSubmit={setPassword}>
                <label htmlFor="newpw">New password</label>
                <PasswordField id="newpw" autoComplete="new-password" placeholder="At least 8 characters" inputRef={newRef} />
                <p className="hint">At least 8 characters, with an uppercase letter, a number and a special character.</p>
                <label htmlFor="newpw2">Repeat it</label>
                <PasswordField id="newpw2" autoComplete="new-password" placeholder="Type it again" />
                {where && (
                  <div id="whereWrap">
                    <label htmlFor="whereSel">Pick your unit or function</label>
                    <div className="field">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <select id="whereSel" value={at} onChange={(e) => setAt(e.target.value)}>
                        <option value="">— I would rather the SMO set it —</option>
                        {whereGroups}
                      </select>
                    </div>
                    <p className="hint">The SMO confirms it. Leave it blank if you are not sure.</p>
                  </div>
                )}
                <div className="error" id="changeError" style={{ display: changeError ? "block" : "none" }}>{changeError}</div>
                <button type="submit" disabled={busy}>Set password</button>
              </form>
            </div>
          )}
          <p className="copy">&copy; 2026 Forefront Consulting</p>
        </div>
      </main>
    </div>
  );
}
