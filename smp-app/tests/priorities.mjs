/* The Priorities rules. Run: node --experimental-strip-types tests/priorities.mjs — no database. */
import * as P from "../ffp/lib/domain/priorities.ts";
let pass = 0, fail = 0;
const check = (n, c) => (c ? pass++ : (fail++, console.log("  FAIL  " + n)));
const W = P.DEFAULT_WEIGHTS;
const s = (importance, complexity, risk) => ({ importance, complexity, risk });

// Refusals
check("a half-scored process has no score", P.weightedScore(W, s(5, null, 5)) === null);
check("weights that sum to nothing give no score", P.weightedScore({ importance: 0, risk: 0, complexity: 0 }, s(5, 5, 5)) === null);
check("a weight over 100 or fractional is invalid", !P.validWeights({ importance: 101, risk: 0, complexity: 0 }) && !P.validWeights({ importance: 33.5, risk: 33, complexity: 33 }));
check("negative weights are invalid", !P.validWeights({ importance: -1, risk: 50, complexity: 50 }));
check("0 and 6 are not scores", !P.validScore(0) && !P.validScore(6) && !P.validScore(2.5) && !P.validScore(null));
check("nothing logged is not 'low risk'", P.suggestRisk({ steps: 9, decisions: 0, crossProcess: 0, roles: 2, risksHigh: 0, risksMedium: 0, risksLow: 0 }) === null);
check("nothing mapped suggests no complexity", P.suggestComplexity({ steps: 0, decisions: 0, crossProcess: 0, roles: 0, risksHigh: 0, risksMedium: 0, risksLow: 0 }) === null);
check("a draft plan cannot be sent with nobody shortlisted", !P.planCanSend("DRAFT", 0));
check("a sent plan cannot be edited or sent again", !P.planEditable("SENT") && !P.planCanSend("SENT", 3) && !P.planEditable("APPROVED"));
check("only a sent or approved plan can be reopened", !P.planCanReopen("DRAFT") && P.planCanReopen("SENT") && P.planCanReopen("APPROVED"));
check("somebody else may not approve", !P.mayApprovePlan({ actorPersonKey: "b", approverPersonKey: "a", actorEmail: "b@x", senderEmail: "o@x" }).ok);
check("the sender may not approve their own", P.mayApprovePlan({ actorPersonKey: "a", approverPersonKey: "a", actorEmail: "O@X ", senderEmail: "o@x" }).reason === "OWN_PLAN");
check("no register key is a refusal", !P.mayApprovePlan({ actorPersonKey: null, approverPersonKey: "a", actorEmail: "", senderEmail: "" }).ok);

// Legitimate
check("all fives score 100, all ones 20", P.weightedScore(W, s(5, 5, 5)) === 100 && P.weightedScore(W, s(1, 1, 1)) === 20);
check("the mockup's Order-to-Cash scores 95", P.weightedScore(W, s(5, 4, 5)) === 95);
check("the weights matter", P.weightedScore({ importance: 0, risk: 0, complexity: 100 }, s(1, 5, 1)) === 100);
const items = [
  { id: "a", code: "B", ...s(3, 3, 3) }, { id: "b", code: "A", ...s(5, 4, 5) }, { id: "c", code: "C", ...s(4, 3, 5) },
  { id: "d", code: "D", ...s(5, 5, null) }, { id: "e", code: "E", ...s(3, 3, 3) },
];
const rk = P.rankProcesses(items, W);
check("ranked highest score first", rk[0].item.id === "b" && rk[1].item.id === "c");
check("a full tie goes to the lower code: B before E", rk[2].item.id === "a" && rk[3].item.id === "e");
check("unscored ones come last with no rank", rk[rk.length - 1].item.id === "d" && rk[rk.length - 1].rank === null && rk[0].rank === 1);
check("ranks run 1.. over the scored ones only", rk.filter((x) => x.rank != null).map((x) => x.rank).join() === "1,2,3,4");
const tie = P.rankProcesses([{ id: "x", code: "Z", ...s(3, 3, 4) }, { id: "y", code: "Y", ...s(4, 3, 3) }], { importance: 50, risk: 50, complexity: 0 });
check("a tie goes to the riskier process", tie[0].item.id === "x");
const sd = P.suggestDecisions(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"], 4);
check("suggested waves follow capacity: 4 / 4 / 3 / rest", ["1", "4"].every((k) => sd[k] === "WAVE_1") && ["5", "8"].every((k) => sd[k] === "WAVE_2") && ["9", "11"].every((k) => sd[k] === "LATER") && ["12", "14"].every((k) => sd[k] === "HIGH_LEVEL"));
check("a capacity of 0 is treated as 1", P.suggestDecisions(["a", "b"], 0).a === "WAVE_1" && P.suggestDecisions(["a", "b"], 0).b === "WAVE_2");
check("over capacity is noticed", P.wave1OverCapacity(5, 4) && !P.wave1OverCapacity(4, 4));
check("wave 1 and 2 go deep, the rest do not", P.goesDeep("WAVE_1") && P.goesDeep("WAVE_2") && !P.goesDeep("LATER") && !P.goesDeep(null));
check("complexity grows with the map", P.suggestComplexity({ steps: 3, decisions: 0, crossProcess: 0, roles: 1, risksHigh: 0, risksMedium: 0, risksLow: 0 }).score === 1 && P.suggestComplexity({ steps: 20, decisions: 4, crossProcess: 3, roles: 6, risksHigh: 0, risksMedium: 0, risksLow: 0 }).score === 5);
check("risk follows what is logged", P.suggestRisk({ steps: 1, decisions: 0, crossProcess: 0, roles: 1, risksHigh: 2, risksMedium: 0, risksLow: 0 }).score === 5 && P.suggestRisk({ steps: 1, decisions: 0, crossProcess: 0, roles: 1, risksHigh: 0, risksMedium: 1, risksLow: 0 }).score === 3 && P.suggestRisk({ steps: 1, decisions: 0, crossProcess: 0, roles: 1, risksHigh: 0, risksMedium: 0, risksLow: 2 }).score === 2);
const pg = P.deepDiveProgress({ steps: 8, raciFinal: true, authorityAssigned: 2, controlsLogged: 1, sopVersion: "v1", lifecycleStatus: "PUBLISHED" });
check("all six aspects done reads 6 of 6", pg.done === 6 && pg.total === 6);
const pg2 = P.deepDiveProgress({ steps: 2, raciFinal: false, authorityAssigned: 0, controlsLogged: 0, sopVersion: "  ", lifecycleStatus: "DRAFT" });
check("a barely-mapped draft reads 0 of 6", pg2.done === 0 && pg2.aspects.length === 6);
check("approved but not published still counts as approved", P.deepDiveProgress({ steps: 0, raciFinal: false, authorityAssigned: 0, controlsLogged: 0, sopVersion: null, lifecycleStatus: "APPROVED" }).aspects[5].done);
check("the named approver, by register key, may approve", P.mayApprovePlan({ actorPersonKey: "a", approverPersonKey: "a", actorEmail: "a@x", senderEmail: "o@x" }).ok);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
