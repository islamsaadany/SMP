/* ── THE ARITHMETIC, ONCE, FOR EVERY DRAWING THAT READS A FIGURE ────────────
   Spec 060 §5.2, one level further in than `_rows.js`.

   THAT FILE STOPPED THREE DRAWINGS HOLDING THREE COPIES OF THE PLAN AND LEFT
   THEM HOLDING THREE COPIES OF THE SUMS. `roll()` and `kids()` were written out
   twice, byte for byte but for a variable declaration, and the predicates that
   decide what is owed were a third copy on Progress. They agreed, which is what
   made it worth fixing while they still did: the landing is the fourth drawing
   and it needs the roll-up AND the owed counts in one place, so copying would
   have made a fifth and a sixth.

   WHAT LIVES HERE IS A FIGURE. What does not is FORMAT — `day()` prints a date
   with a year on Analytics and without one on the Plan, which is a choice each
   screen makes and must keep making. Extracting that would force two screens to
   read alike for no reason; extracting the sums stops two screens disagreeing
   about the same project, which is the whole of §5.2.

   Every function takes its rows. Nothing here reads a global but `TODAY`, which
   is declared in `_rows.js` beside the plan it dates.

   AND ONE NUMBER LIVES HERE, WHICH IS NOT THE SAME AS A FIGURE. `SOON` is how
   much warning a commitment gets — the one thing in this drawing set somebody
   CHOSE rather than derived, so it is named once and every screen that prints a
   commitment date reads it. §9.13a is the record of it being written twice
   (thirty days on a landing, beside the fourteen Analytics already had) and of
   the lesson: it is not a guessed constant (§122.5's fix there is to measure,
   and how much warning somebody wants cannot be measured) — it is a decision,
   reversible in one place, and it decides a COLOUR and never a word.
   ────────────────────────────────────────────────────────────────────────── */
  function d(s){ return new Date(s + "T00:00:00Z").getTime(); }

  var SOON = 14;   /* days of warning — see the note above */
  function daysTo(e, today){ return Math.round((d(e) - d(today)) / 864e5); }

  /* the rows one level under row i — or, where that level is empty, everything
     beneath it, so a phase with activities hung straight off it still rolls up */
  function kids(rows, i){
    var lvl = rows[i].lvl, out = [], j;
    for (j = i + 1; j < rows.length && rows[j].lvl > lvl; j++){
      if (rows[j].lvl === lvl + 1) out.push(j);
    }
    if (!out.length){
      for (j = i + 1; j < rows.length && rows[j].lvl > lvl; j++) out.push(j);
    }
    return out;
  }

  /* ONE LEVEL AT A TIME, equal weights unless somebody sets them (§9.8).
     Writes pct, the widest span, the status and the activity tally onto every
     parent — the tally because a phase's "2 of 3 done" and its percentage are
     two readings of one set and must be taken from it together. */
  function roll(rows){
    for (var i = rows.length - 1; i >= 0; i--){
      var r = rows[i];
      if (r.lvl === 2) continue;
      var ks = kids(rows, i).map(function(j){ return rows[j]; });
      r.pct = Math.round(ks.reduce(function(a,x){ return a + (x.pct || 0); }, 0) / ks.length);
      r.s = ks.reduce(function(a,x){ return !a || d(x.s) < d(a) ? x.s : a; }, null);
      r.e = ks.reduce(function(a,x){ return !a || d(x.e) > d(a) ? x.e : a; }, null);
      r.st = r.pct === 100 ? "done" : r.pct > 0 ? "wip" : "not";
      var acts = [], j;
      for (j = i + 1; j < rows.length && rows[j].lvl > r.lvl; j++){
        if (rows[j].lvl === 2) acts.push(rows[j]);
      }
      r.total = acts.length;
      r.done = acts.filter(function(x){ return x.pct === 100; }).length;
    }
  }

  /* the project's own figure — the phases, equally weighted, which is the same
     rule one level up and not a second one */
  function overall(rows){
    var ps = rows.filter(function(r){ return r.lvl === 0; });
    if (!ps.length) return null;   /* no plan is not nought (§35, §93) */
    return Math.round(ps.reduce(function(a,p){ return a + p.pct; }, 0) / ps.length);
  }

  /* LATE IS A FACT ABOUT A DATE AND NEVER ABOUT A PERCENTAGE (§344).
     "On Track" is the reference's word for 90% and is a claim the figure cannot
     make; these two answer separate questions and are drawn separately. */
  function behind(r, today){ return r.pct < 100 && d(r.e) < d(today); }
  function howFar(p){
    if (p === 100) return ["Done", "done"];
    if (p >= 90)   return ["Nearly done", "on"];
    if (p >= 25)   return ["Under way", "on"];
    if (p > 0)     return ["Early", "on"];
    return ["Not started", ""];
  }

  /* WHAT IS WAITING ON SOMEBODY — three predicates, named once, because
     Progress draws them as three sections and the landing counts them as one
     number, and a section and a count that disagree is the fault §5.2 is about.
     A ROW IS ONE THING TO FIX (§279): an activity nobody is on that is also
     past its date is owed ONCE, so the union is by row and never a sum of the
     three lengths (§108.1's arithmetic). */
  function acts(rows){ return rows.filter(function(r){ return r.lvl === 2; }); }
  function waiting(rows){ return acts(rows).filter(function(r){ return r.st === "sign"; }); }
  function overdue(rows, today){
    return acts(rows).filter(function(r){ return behind(r, today); });
  }
  function nobodyOn(rows){
    return acts(rows).filter(function(r){ return !r.who && r.pct < 100; });
  }
  function signedOff(rows){ return acts(rows).filter(function(r){ return r.st === "done"; }); }

  /* A COMMITMENT IS MET WHEN SOMEBODY SIGNED IT OFF, never when its work was
     finished — §9.12's rule, shared so the Analytics tab and the landing cannot
     mean two things by "met". Culture's 2.1 was accepted five days late and is
     MET; its 2.2 is finished, unsigned, and is not. Whether a met one was met
     ON TIME is Analytics' question and stays there. */
  function commitments(rows){ return rows.filter(function(r){ return r.ms; }); }
  function metOn(r){ return r.off || null; }
  function unmet(rows){ return commitments(rows).filter(function(r){ return !metOn(r); }); }
  function owed(rows, today){
    var out = [];
    [waiting(rows), overdue(rows, today), nobodyOn(rows)].forEach(function(list){
      list.forEach(function(r){ if (out.indexOf(r) < 0) out.push(r); });
    });
    return out;
  }
