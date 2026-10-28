/* ══ SAMPLE DATA ═══════════════════════════════════════════════════════
   Invented for a sample client, Raya Trade. seed() rebuilds it, so Start over
   puts every process, suggestion and to-do back where the story begins. */
const st = (id, type, label, role, acts) => ({ id, type, label, role, acts: acts || [] });
const chain = (ids) => ids.slice(1).map((to, i) => [ids[i], to, '']);
const cells = (o) => { const r = {}; Object.keys(o).forEach((k) => { r[k] = {}; o[k].split(' ').forEach((x) => { const [role, l] = x.split(':'); r[k][role] = l; }); }); return r; };
const ctl = (step, risk, level, control, test, testedAt) => ({ step, risk, level, control: control || '', test: test || 'none', testedAt: testedAt || null });
const rule = (step, kind, n, role) => ({ step, kind, n, role });
const content = (o) => Object.assign({ purpose: '', inScope: [], outScope: [], steps: [], conn: [], raci: {}, auth: [], controls: [], kpis: [] }, o);

function seed() {
  const roles = [['r1', 'Sales coordinator'], ['r2', 'Credit controller'], ['r3', 'Finance manager'], ['r4', 'Logistics coordinator'], ['r5', 'Warehouse supervisor'], ['r6', 'Procurement officer'], ['r7', 'Store manager'], ['r8', 'Customer service agent'], ['r9', 'CFO'], ['r10', 'HR business partner'], ['r11', 'Accounts payable clerk'], ['r12', 'Billing clerk'], ['r13', 'Inventory controller'], ['r14', 'Commercial manager'], ['r15', 'Supply chain manager'], ['r16', 'Chief operating officer'], ['r17', 'Retail operations manager'], ['r18', 'Customer service lead'], ['r19', 'Accountant']].map(([id, name]) => ({ id, name }));
  const P = (id, name, role, mgr, reg) => ({ id, name, roles: [role], mgr, reg: reg !== false });
  const people = [P('p1', 'Yara Kamal', 'r9', null), P('p2', 'Tarek Samy', 'r16', null), P('p3', 'Hend Mourad', 'r3', 'p1'), P('p4', 'Hala Mansour', 'r3', 'p1'), P('p5', 'Karim Fouad', 'r15', 'p2'), P('p6', 'Omar Fathy', 'r14', 'p2'), P('p7', 'Amr Hassan', 'r17', 'p2'), P('p8', 'Nour Samir', 'r18', 'p2'), P('p9', 'Laila Zaki', 'r10', 'p2'), P('p10', 'Salma Adel', 'r2', 'p3'), P('p11', 'Sherif Adel', 'r11', 'p4'), P('p12', 'Dina Shawky', 'r12', 'p3'), P('p13', 'Dalia Sabry', 'r1', 'p6'), P('p14', 'Nadia Fouad', 'r1', 'p6'), P('p15', 'Mai Sobhy', 'r4', 'p5'), P('p16', 'Ramy Behairy', 'r5', 'p5'), P('p17', 'Kareem Hafez', 'r13', 'p5'), P('p18', 'Heba Salem', 'r6', 'p5'), P('p19', 'Rania Fahmy', 'r8', 'p8'), P('p20', 'Mostafa Deif', 'r7', 'p7'), P('p21', 'Amaka Eze', 'r19', 'p4', false)];
  people.push({ id: 'office', name: 'Mona Farag', roles: [], mgr: null, reg: false, office: true });

  const ord = content({
    purpose: 'Take a confirmed customer order through the credit check, delivery, invoicing and collection, so that every order is delivered once and paid for within terms.',
    inScope: ['Trade customers on credit terms', 'Deliveries from the central warehouse', 'Invoicing and collection'], outScope: ['Cash sales in stores', 'Returns (ORD101)'],
    steps: [st('o1', 'START', 'Order received', 'r1'), st('o2', 'TASK', 'Confirm order', 'r1', ['Check the order against the quote', 'Confirm prices, quantities and the delivery date with the customer', 'Enter the order in the ERP']), st('o3', 'DECISION', 'Credit check', 'r2', ['Add this order to the customer’s balance', 'Compare it with the credit limit', 'Within the limit: release the order. Over it: ask for prepayment']), st('o4', 'TASK', 'Ask for prepayment', 'r1', ['Send the pro-forma invoice', 'Chase until it is paid or cancelled']), st('o5', 'TASK', 'Deliver', 'r4', ['Pick and pack', 'Deliver and bring back signed proof of delivery']), st('o6', 'TASK', 'Invoice', 'r12', ['Raise the invoice from the signed proof', 'Send it to the customer']), st('o7', 'TASK', 'Collect payment', 'r2', ['Match receipts to invoices', 'Chase overdue invoices every week']), st('o8', 'END', 'Cash matched', 'r2')],
    conn: [['o1', 'o2', ''], ['o2', 'o3', ''], ['o3', 'o5', 'within limit'], ['o3', 'o4', 'over limit'], ['o4', 'o5', 'once paid'], ['o5', 'o6', ''], ['o6', 'o7', ''], ['o7', 'o8', '']],
    raci: cells({ o2: 'r1:R r3:A r2:I', o3: 'r2:R r3:A r9:C r1:I', o4: 'r1:R r2:I', o5: 'r4:R r3:A r1:I', o6: 'r12:R r3:A r2:I', o7: 'r2:R r3:A r12:C' }),
    auth: [rule('o3', 'money', 250000, 'r9'), rule('o3', 'time', 1, 'r3'), rule('o4', 'time', 5, 'r14'), rule('o6', 'time', 2, 'r3')],
    controls: [ctl('o3', 'Goods released to a customer over the limit', 'High', 'The ERP blocks orders over the limit', 'pass', '2026-08-14'), ctl('o5', 'Proof of delivery missing', 'Medium', ''), ctl('o6', 'Invoice sent with the wrong price', 'Medium', 'Price list signed off before use')],
    kpis: [['Order to invoice', '2 days', 'Weekly'], ['Invoice accuracy', '98%', 'Monthly'], ['Days to collect', '45 days', 'Monthly']],
  });
  const ordDraft = clone(ord);
  ordDraft.steps.find((s) => s.id === 'o5').acts = ['Pick and pack', 'Deliver, and photograph the signed proof in the app'];
  ordDraft.steps.find((s) => s.id === 'o5').changed = true;

  const pro = content({
    purpose: 'Buy what the business needs at the agreed price and pay suppliers once, on time, for goods actually received.', inScope: ['Goods and services bought centrally'], outScope: ['Store petty cash'],
    steps: [st('q1', 'START', 'Need raised', 'r6'), st('q2', 'TASK', 'Raise purchase request', 'r6', ['Describe what is needed and why', 'Attach a quote']), st('q3', 'DECISION', 'Within budget?', 'r3', ['Check the request against the budget line', 'Within it: approve. Over it: send back to revise']), st('q4', 'TASK', 'Issue purchase order', 'r6', ['Raise the order in the ERP', 'Send it to the supplier']), st('q5', 'TASK', 'Receive goods', 'r5', ['Check the delivery against the order', 'Record the receipt']), st('q6', 'TASK', 'Three-way match', 'r11', ['Match order, receipt and invoice', 'Hold any invoice that does not match']), st('q7', 'TASK', 'Pay supplier', 'r11', ['Pay on the due date', 'Send the remittance']), st('q8', 'END', 'Supplier paid', 'r11')],
    conn: [['q1', 'q2', ''], ['q2', 'q3', ''], ['q3', 'q4', 'yes'], ['q3', 'q2', 'no, revise'], ['q4', 'q5', ''], ['q5', 'q6', ''], ['q6', 'q7', ''], ['q7', 'q8', '']],
    raci: cells({ q2: 'r6:R r15:A', q3: 'r3:R r9:A r6:C', q4: 'r6:R r15:A', q5: 'r5:R r15:A r6:I', q6: 'r11:R r3:A', q7: 'r11:R r3:A r6:I' }),
    auth: [rule('q4', 'money', 50000, 'r3'), rule('q4', 'money', 250000, 'r9'), rule('q7', 'time', 3, 'r3')],
    controls: [ctl('q6', 'Supplier paid for goods not received', 'High', 'Payment blocked until order, receipt and invoice match', 'pass', '2026-09-10'), ctl('q4', 'Order split to avoid an approval level', 'Medium', 'Weekly report of orders just under a threshold', 'fail', '2026-09-28')],
    kpis: [['Purchase order cycle time', '3 days', 'Monthly'], ['Invoices paid on time', '95%', 'Monthly']],
  });
  const proDraft = clone(pro);
  proDraft.auth.push(rule('q6', 'time', 2, 'r3'));

  const cre = content({
    purpose: 'Keep what customers owe within terms, and act early on what is overdue.', inScope: ['Trade customers on credit terms'], outScope: ['Store sales'],
    steps: [st('k1', 'TASK', 'Review aged debt', 'r2', ['Run the aged debt report every Monday']), st('k2', 'TASK', 'Send reminders', 'r2', ['Remind at 7, 14 and 21 days overdue']), st('k3', 'DECISION', 'Paid within 30 days?', 'r2', ['Yes: close it. No: hand it on']), st('k4', 'TASK', 'Hand to collections', 'r3', ['Agree a plan with the customer, or hand to the agency'], ), st('k5', 'END', 'Debt closed', 'r2')],
    conn: [['k1', 'k2', ''], ['k2', 'k3', ''], ['k3', 'k5', 'yes'], ['k3', 'k4', 'no'], ['k4', 'k5', '']],
    raci: cells({ k1: 'r2:R r3:A', k2: 'r2:R r3:A', k3: 'r2:R r3:A', k4: 'r3:R r9:A r2:C' }),
    auth: [rule('k4', 'money', 10000, 'r3')], controls: [ctl('k4', 'A debt written off without approval', 'High', 'Write-offs above $10,000 signed by the Finance manager', 'none')],
    kpis: [['Overdue above 60 days', 'Under 5%', 'Monthly']],
  });
  cre.steps.find((s) => s.id === 'k4').changed = true;

  const rec = content({
    purpose: 'Close each month on time with accounts that reconcile, so that management sees a true position by the fifth working day.', inScope: ['Monthly close', 'Group consolidation'], outScope: ['Tax filings'],
    steps: [st('c1', 'START', 'Period ends', 'r19'), st('c2', 'TASK', 'Post receipts', 'r19', ['Post every receipt matched in Order-to-Cash']), st('c3', 'TASK', 'Reconcile accounts', 'r19', ['Reconcile bank, debtors and creditors']), st('c4', 'TASK', 'Accrue and adjust', 'r19', ['Post accruals and prepayments']), st('c5', 'TASK', 'Review the trial balance', 'r3', ['Review every movement above $20,000']), st('c6', 'TASK', 'Approve and lock the period', 'r9', ['Sign off the close', 'Lock the period in the ERP']), st('c7', 'END', 'Period closed', 'r9')],
    conn: chain(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']),
    raci: cells({ c2: 'r19:R r3:A', c3: 'r19:R r3:A', c4: 'r19:R r3:A', c5: 'r3:R r9:A', c6: 'r9:R r9:A' }),
    auth: [rule('c6', 'time', 5, 'r9')], controls: [ctl('c3', 'An account left unreconciled', 'Medium', 'Reconciliation checklist signed by the Finance manager', 'pass', '2026-09-05')],
    kpis: [['Close completed', '5 working days', 'Monthly']],
  });
  const newc = content({
    purpose: 'Open a new store on the agreed date, fitted, staffed and stocked.', inScope: ['New stores'], outScope: ['Refits'],
    steps: [st('n1', 'TASK', 'Approve the site', 'r16'), st('n2', 'TASK', 'Sign the lease', 'r16'), st('n3', 'TASK', 'Fit out the store', 'r17'), st('n4', 'TASK', 'Hire and train staff', 'r10'), st('n5', 'TASK', 'Stock the store', 'r13'), st('n6', 'TASK', 'Open the store', 'r7')],
    conn: chain(['n1', 'n2', 'n3', 'n4', 'n5', 'n6']), raci: cells({ n1: 'r17:R r16:A', n2: 'r16:R r9:A', n3: 'r17:R r16:A', n4: 'r10:R r17:A', n5: 'r13:R r17:A', n6: 'r7:R r17:A' }),
    auth: [rule('n2', 'money', 1000000, 'r9')], controls: [ctl('n2', 'A lease signed above budget', 'High', 'Leases above $1,000,000 signed by the CFO', 'pass', '2026-02-11')],
  });
  const sto = content({
    purpose: 'Count, record and bank store takings every day, so that cash matches sales.', inScope: ['Every store'], outScope: ['Card payments'],
    steps: [st('t1', 'TASK', 'Open the till', 'r7', ['Count the float']), st('t2', 'TASK', 'Count cash at close', 'r7', ['Count the takings', 'Print the till report']), st('t3', 'DECISION', 'Matches the till report?', 'r7', ['Yes: bank it. No: record the difference']), st('t4', 'TASK', 'Bank the takings', 'r7', ['Bank by noon the next day'])],
    conn: [['t1', 't2', ''], ['t2', 't3', ''], ['t3', 't4', 'yes']], raci: cells({ t1: 'r7:R r17:A', t2: 'r7:R r17:A', t3: 'r7:R r17:A', t4: 'r7:R r17:A' }),
    auth: [rule('t3', 'money', 200, 'r17')], controls: [ctl('t2', 'Cash shortfall at close', 'Low', 'Two people count the till', 'pass', '2026-06-20')],
  });
  const stoDraft = clone(sto);
  stoDraft.steps.splice(2, 0, Object.assign(st('t5', 'TASK', 'Second person checks the count', 'r7', ['A second person counts again and signs the report']), { changed: true }));
  stoDraft.conn = [['t1', 't2', ''], ['t2', 't5', ''], ['t5', 't3', ''], ['t3', 't4', 'yes']];
  stoDraft.raci.t5 = { r7: 'R', r17: 'A' };

  const drawn = (steps, raci, extra) => content(Object.assign({ steps, conn: chain(steps.map((s) => s.id)), raci: raci || {} }, extra || {}));
  const ret = drawn([st('a1', 'TASK', 'Log the return', 'r8', ['Record the order, the goods and the reason']), st('a2', 'TASK', 'Inspect the goods', 'r5', ['Check the goods and their condition']), st('a3', 'TASK', 'Issue the credit note', 'r12', ['Raise the credit note against the invoice'])], cells({ a1: 'r8:R r18:A', a2: 'r5:R r15:A', a3: 'r12:R r3:A' }), { purpose: 'Take back goods a customer returns and refund them fairly and fast.', auth: [rule('a3', 'money', 5000, 'r3')], controls: [ctl('a3', 'A credit note raised twice', 'Medium', 'The ERP blocks a second credit note on one invoice', 'none')] });
  const credit = drawn([st('b1', 'TASK', 'Collect trade references', 'r2'), st('b2', 'TASK', 'Set the credit limit', 'r3')]);
  const inv = drawn([st('i1', 'TASK', 'Freeze stock movements', 'r5'), st('i2', 'TASK', 'Count and record', 'r5'), st('i3', 'DECISION', 'Variance above tolerance?', 'r13'), st('i4', 'TASK', 'Post adjustments', 'r19')], cells({ i1: 'r5:R r15:A', i2: 'r5:R r13:C', i3: 'r13:R r15:A', i4: 'r19:R r3:A' }), { controls: [ctl('i2', 'Stock shrinkage', 'High', 'Second count signed by the supervisor', 'fail', '2026-09-30')] });
  const log = drawn([st('l1', 'TASK', 'Plan routes', 'r4'), st('l2', 'TASK', 'Load vehicles', 'r5'), st('l3', 'TASK', 'Deliver to customer', 'r4')]);
  const pri = drawn([st('g1', 'TASK', 'Propose a price change', 'r14'), st('g2', 'TASK', 'Approve the price change', 'r9')]);
  const hir = drawn([st('h1', 'TASK', 'Raise the vacancy', 'r10'), st('h2', 'TASK', 'Interview and offer', 'r10'), st('h3', 'TASK', 'Onboard', 'r10')]);

  const proc = (o) => Object.assign({ parent: null, approver: 'p1', acks: [], nextReview: null, high: false, sop: false, live: null, inForce: null, publishedAt: null, versions: [], draft: null, ncs: [] }, o);
  const processes = [
    proc({ code: 'ORD100', name: 'Order-to-Cash', cat: 'Finance', area: 'sell', owner: 'p3', live: ord, inForce: 2, publishedAt: '2025-10-03', acks: ['p10', 'p12', 'p14', 'p15'], nextReview: '2026-11-12',
      versions: [{ v: 2, date: '2025-10-03', by: 'Yara Kamal', note: 'Returns handling added' }, { v: 1, date: '2025-01-14', by: 'Tarek Samy', note: 'First issue' }],
      draft: { v: 3, state: 'draft', from: 's1', started: '2026-10-24', note: 'Proof of delivery by photo, from Hend Mourad’s suggestion', c: ordDraft },
      ncs: [{ ref: 'NC-07', title: 'Wrong price on 4 invoices', action: 'Re-sign the price list; credit the four customers', owner: 'Finance manager', raised: '2026-10-09', status: 'In progress' }, { ref: 'NC-04', title: 'Delivery left without signed proof', action: 'Drivers briefed; proof photo added to the app', owner: 'Logistics coordinator', raised: '2026-08-21', status: 'Closed' }] }),
    proc({ code: 'ORD101', name: 'Returns & refunds', cat: 'Finance', area: 'fin', parent: 'ORD100', owner: 'p10', approver: 'p3', draft: { v: 1, state: 'in-review', sentAt: '2026-10-21', sentBy: 'Salma Adel', note: 'First issue', c: ret } }),
    proc({ code: 'ORD102', name: 'Customer credit setup', cat: 'Finance', area: 'fin', parent: 'ORD100', owner: 'p3', draft: { v: 1, state: 'draft', note: 'First issue', c: credit } }),
    proc({ code: 'PRO100', name: 'Procure-to-Pay', cat: 'Supply Chain', area: 'buy', owner: 'p5', live: pro, inForce: 2, publishedAt: '2025-12-03', acks: ['p3', 'p4', 'p11', 'p16', 'p18'], nextReview: '2026-12-03',
      versions: [{ v: 2, date: '2025-12-03', by: 'Yara Kamal', note: 'Approval levels by amount' }, { v: 1, date: '2025-02-24', by: 'Tarek Samy', note: 'First issue' }],
      draft: { v: 3, state: 'returned', sentAt: '2026-10-18', sentBy: 'Mona Farag', returnedAt: '2026-10-22', returnedNote: 'The $50,000 rule needs a deputy for when the Finance manager is away.', note: 'Three-way match escalates after 2 days', c: proDraft } }),
    proc({ code: 'CRE100', name: 'Credit & Collections', cat: 'Finance', area: 'fin', owner: 'p4', live: cre, inForce: 2, publishedAt: '2026-10-20', acks: ['p10', 'p4'], nextReview: '2027-10-20', sop: true,
      versions: [{ v: 2, date: '2026-10-20', by: 'Yara Kamal', note: 'Write-offs above $10,000 need the Finance manager' }, { v: 1, date: '2025-06-02', by: 'Yara Kamal', note: 'First issue' }] }),
    proc({ code: 'REC100', name: 'Record-to-Report', cat: 'Finance', area: 'fin', owner: 'p4', live: rec, inForce: 2, publishedAt: '2026-03-14', acks: ['p1', 'p3', 'p4', 'p21'], nextReview: '2027-03-14', sop: true,
      versions: [{ v: 2, date: '2026-03-14', by: 'Yara Kamal', note: 'Close moved to five working days' }, { v: 1, date: '2025-03-01', by: 'Yara Kamal', note: 'First issue' }] }),
    proc({ code: 'NEW100', name: 'New Store Opening', cat: 'Retail', area: 'stores', owner: 'p7', approver: 'p2', live: newc, inForce: 1, publishedAt: '2025-09-20', acks: ['p2', 'p7', 'p9', 'p17', 'p20'], nextReview: '2026-09-20', sop: true,
      versions: [{ v: 1, date: '2025-09-20', by: 'Tarek Samy', note: 'First issue' }] }),
    proc({ code: 'STO100', name: 'Store Cash Handling', cat: 'Retail', area: 'stores', owner: 'p7', live: sto, inForce: 1, publishedAt: '2025-11-10', acks: ['p20'], nextReview: '2026-11-10', sop: true,
      versions: [{ v: 1, date: '2025-11-10', by: 'Yara Kamal', note: 'First issue' }],
      draft: { v: 2, state: 'in-review', sentAt: '2026-10-21', sentBy: 'Mona Farag', note: 'A second person checks the count before banking', c: stoDraft } }),
    proc({ code: 'PRI100', name: 'Pricing & Promotions', cat: 'Commercial', area: 'sell', owner: 'p6', high: true, draft: { v: 1, state: 'draft', note: 'First issue', c: pri } }),
    proc({ code: 'LOG100', name: 'Logistics & Last-mile', cat: 'Supply Chain', area: 'sell', owner: 'p5', high: true, draft: { v: 1, state: 'draft', note: 'First issue', c: log } }),
    proc({ code: 'INV100', name: 'Inventory & Stock Count', cat: 'Supply Chain', area: 'buy', owner: 'p5', draft: { v: 1, state: 'draft', note: 'First issue', c: inv } }),
    proc({ code: 'HIR100', name: 'Hire-to-Retire', cat: 'HR', area: 'fin', owner: 'p9', high: true, draft: { v: 1, state: 'draft', note: 'First issue', c: hir } }),
    proc({ code: 'CUS100', name: 'Customer Complaints', cat: 'Care', area: 'sell', owner: 'p8', high: true }),
  ];

  S = {
    roles, people, processes,
    suggestions: [
      { id: 's1', by: 'p3', code: 'ORD100', step: 'o5', text: 'Since August the warehouse sends the proof of delivery by photo, not paper.', at: '2026-10-23', state: 'answered', draftV: 3,
        answer: { by: 'office', text: 'Does the photo replace the signed paper, or come with it? We will draft it in v3 once we know.', at: '2026-10-23' } },
      { id: 's2', by: 'p14', code: 'ORD100', step: 'o2', text: 'Customers now confirm by WhatsApp. Can we accept that instead of a signed form?', at: '2026-10-24', state: 'new' },
    ],
    plan: { state: 'draft', approver: 'p1', weights: { imp: 35, risk: 40, cx: 25 }, capacity: 4 },
    prio: [['ORD100', 5, 4, 4, 'Every sale runs through it; one gap in delivery proof', 'W1'], ['PRO100', 4, 4, 4, 'Approval levels unclear above $50,000', 'W1'], ['INV100', 4, 5, 3, 'Stock counts disagree with the books', 'W1'], ['CRE100', 4, 3, 4, 'Write-offs signed by one person', 'W1'], ['PRI100', 5, 3, 3, 'Margin impact, but it works today', 'W2'], ['NEW100', 4, 3, 3, 'Review is late; four openings next year', 'W2'], ['REC100', 4, 3, 3, 'Close is on time; written down once', 'W2'], ['LOG100', 3, 3, 3, 'Waits for Order-to-Cash to settle', 'W2'], ['STO100', 3, 2, 4, 'Cash differences small but frequent', 'LATER'], ['HIR100', 3, 3, 2, 'Handled by HR, low risk', 'LATER'], ['CUS100', 3, 2, 2, 'Handled well by the call centre', 'HIGH'], ['ORD101', 3, 2, 3, 'A wrong refund reaches the customer', 'W2'], ['ORD102', 3, 2, 2, 'New customers wait for a limit', 'LATER']],
    /* steps inside a process the office flagged, each with its own score and wave (main §601–§608) */
    steps: { 'ORD100:o3': { imp: 5, cx: 4, risk: 5, why: 'Orders released over the limit cost the most', wave: 'W1' }, 'ORD100:o5': { imp: 4, cx: 3, risk: 4, why: 'Proof of delivery is missing on one order in ten', wave: 'W2' }, 'INV100:i2': { imp: 4, cx: 3, risk: 5, why: 'Counts disagree with the books every month', wave: 'proc' } },
    risks: [['Customer credit exposure above appetite', 'Risk & controls', 'High', 'High', 'High', 'Mitigating', 'Hend Mourad'], ['Stock shrinkage in stores', 'Risk & controls', 'Medium', 'High', 'High', 'Open', 'Karim Fouad'], ['Supplier paid twice', 'Risk & controls', 'Low', 'High', 'Medium', 'Mitigating', 'Hala Mansour'], ['Board decisions without a written mandate', 'Board structure', 'Medium', 'Medium', 'Medium', 'Open', 'Tarek Samy'], ['Customer data shared without consent', 'Data integrity', 'Low', 'Critical', 'High', 'Open', 'No owner yet'], ['Late month-end close', '—', 'Medium', 'Low', 'Low', 'Accepted', 'Hala Mansour'], ['Cash shortfall at store close', '—', 'Low', 'Low', 'Low', 'Closed', 'Amr Hassan']],
    policies: [['Risk Management Policy', 'Risk & controls', 'Published', '1 Sep 2026', '1 Sep 2027', '3 of 5'], ['Board Charter', 'Board structure', 'Draft', '—', '—', '—'], ['Code of Conduct', 'Ethics', 'In review', '—', '—', '—'], ['Data Protection Policy', 'Data integrity', 'Approved', '—', '—', '—']],
    checklist: [['Give internal audit a line to the audit committee', 'Immediate', 'Yara Kamal', '15 Oct', false, true], ['Name a second owner for the three high risks', 'Immediate', 'Tarek Samy', '15 Nov', false], ['Publish the risk management policy', 'Near-term', 'Hala Mansour', '30 Sep', true], ['Run a yearly risk workshop with every unit head', 'Long-term', 'No owner yet', '', false]],
    log: [['24 Oct', 'Nadia Fouad suggested a change to Order-to-Cash, step 1'], ['24 Oct', 'Mona Farag started Order-to-Cash draft v3 from Hend Mourad’s suggestion'], ['23 Oct', 'Hend Mourad suggested a change to Order-to-Cash, step 4'], ['22 Oct', 'Yara Kamal sent Procure-to-Pay v3 back'], ['21 Oct', 'Salma Adel sent Returns & refunds v1 to Hend Mourad for approval'], ['20 Oct', 'Credit & Collections v2 published'], ['9 Oct', 'NC-07 raised on Order-to-Cash: wrong price on 4 invoices']],
    done: { p3: ['You read Record-to-Report v2 · 2 Oct', 'You answered the office on Customer credit setup · 28 Sep'], p1: ['You approved Credit & Collections v2 · 20 Oct'], p13: [] },
    exp: ['ORD100', 'PRO100', 'CRE100', 'REC100'],
  };
}
