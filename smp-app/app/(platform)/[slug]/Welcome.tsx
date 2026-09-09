/* The welcome screen as a page (§148, §159, §187, §200, §202) — welcome.js's
   markup class for class, drawn from lib/landing.ts's answer. Every door is
   an address (doorHref), so the whole screen is server-rendered HTML and
   needs no script of its own. */
import { doorHref, type Landing, type Act } from "../../../lib/landing.ts";
import type { SessionUser } from "../../../lib/auth.ts";
import type { Tenant } from "../../../lib/door.ts";

function Sub({ parts }: { parts: Act["sub"] }) {
  if (!parts.length) return null;
  return (
    <span>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && p.kind !== "plain" ? " · " : i > 0 ? " " : ""}
          {p.kind === "em" ? <i>{p.text}</i> : p.kind === "alert" ? <em className="walert">{p.text}</em> : p.text}
        </span>
      ))}
    </span>
  );
}

export default function Welcome({ slug, tenant, user, data }: { slug: string; tenant: Tenant; user: SessionUser; data: Landing | null }) {
  const d: Landing = data || { known: false, org: tenant.name, initials: tenant.name.split(/\s+/).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase() };
  const name = d.known ? d.name : (user.name || "").split(/\s+/)[0] || "";
  const acts = d.acts || [];
  const pages = d.pages || [];
  const home = d.home || "group";
  const continueHref = doorHref(slug, { target: home });
  const empty = acts.length === 0;
  const cycleChip = d.known && d.review && d.review.open && !d.cycle;
  return (
    <div className="welcomeover" role="dialog" aria-label="Welcome">
      <div className="wwrap">
        <div className="whero">
          <div className="wgreet">
            <p className="wkick">Strategy Management Platform</p>
            <h2>Welcome{name ? ", " + name : ""}</h2>
            <div className="wwho">
              {(d.chips || []).map((c, i) => <span className="wchip" key={i}>{c.role}{c.where ? " · " + c.where : ""}</span>)}
              {cycleChip && <span className="wchip wcycle"><i></i>{(d.review!.name || "The") + " cycle is open"}</span>}
            </div>
          </div>
          <div className="wtenant">
            {d.initials && <div className="wmark">{d.initials}</div>}
            <h1>{d.org || tenant.name}</h1>
            <div className="woffice">Strategy Management Office</div>
          </div>
        </div>
        <div className="wcols">
          <div className="wmain">
            <p className="wseclab">Waiting on you</p>
            <div className="wacts">
              {!d.known && (
                /* A login the register does not hold yet (§313.32): the fact,
                   in words, and who answers it. */
                <div className="wact wempty"><div className="wwhat"><b>You are not on {d.org || tenant.name}&rsquo;s register yet</b><span>The SMO places you from People.</span></div></div>
              )}
              {d.known && empty && (
                /* An empty list says so (§45.2), and says only what it knows. */
                <div className="wact wempty"><div className="wwhat"><b>Nothing is waiting on you</b></div></div>
              )}
              {acts.map((a, i) => (
                <div className="wact" key={i}>
                  <div className="wwhat"><b>{a.title}</b><Sub parts={a.sub} /></div>
                  <a className={"wbtn" + (a.cta ? " wcta" : "")} href={doorHref(slug, a.go)}>{a.btn}</a>
                </div>
              ))}
            </div>
          </div>
          <div className="wside">
            {pages.length > 0 && (
              <div className="wpagesbox">
                <p className="wseclab">Your pages</p>
                <div className="wcard wpages">
                  {pages.map((p, i) => (
                    <a key={i} href={doorHref(slug, p.go)}>{p.label}{p.small ? <> <small>{p.small}</small></> : null}<span className="wgo">›</span></a>
                  ))}
                </div>
              </div>
            )}
            {d.cycle && (
              <div className="wcyc">
                <h4>{d.cycle.name} <span className={"wbdg " + (d.cycle.open ? "wb-open" : "wb-shut")}>{d.cycle.open ? "Open" : "Closed"}</span></h4>
                <div className="wcycline"><span>Reported</span><b>{d.cycle.done} of {d.cycle.total}</b></div>
                <div className="wcycline"><span>Submitted</span><b>{d.cycle.sub}</b></div>
                <div className="wcycline"><span>In progress</span><b>{d.cycle.progress}</b></div>
                {d.cycle.none ? <div className="wcycline"><span>Not started</span><b className="wlate">{d.cycle.none}</b></div> : null}
                <p className="wcycmeta">{d.cycle.meta}</p>
              </div>
            )}
            {d.tour && (
              /* THE INTRO ROUND FOLDS (§202) — a native fold, no script. */
              <details className="wtour">
                <summary className="wtoggle"><h3>Take an intro round</h3><span className="wtcar" aria-hidden="true">›</span></summary>
                <div className="wtourbody">
                  <p>A short walk of the platform on your own plan — about two minutes.</p>
                  <div className="wtourbtns"><a className="wtbtn" href={"/" + slug + "/tour"}>Start the round</a></div>
                </div>
              </details>
            )}
          </div>
        </div>
        {/* THE WAY OUT SPANS BOTH COLUMNS (§159), loud when nothing else is. */}
        <a className={"wexit" + (d.known && empty ? " wloud" : "")} href={continueHref}>
          <span className="wexlab">{d.known ? d.continueWord : "Continue to " + (d.org || tenant.name)}</span><span className="wgo">›</span>
        </a>
      </div>
    </div>
  );
}
