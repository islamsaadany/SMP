/* ══ START ═════════════════════════════════════════════════════════════ */
seed();
const firstVisit = !location.hash;
render();
if (firstVisit) ACT.guide();
