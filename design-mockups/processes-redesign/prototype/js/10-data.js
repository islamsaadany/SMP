/* ══ SAMPLE DATA ════════════════════════════════════════════════════════
   Every name, process and figure below is invented for this drawing. Raya
   Trade is SMP's demo client; none of this is its real content. Codes follow
   the module's own rule (first three letters of the name, then 100, 101…). */
const S = {};
(function seed() {
  S.ws = { name: 'Raya Trade', industry: 'Retail & distribution', about: 'Distribution and retail group with stores and a business-to-business arm. Sample text for this drawing.', logo: null, colors: ['#0F6B63', '#3E7F8F', '#C9A24D'] };
  S.me = { name: 'Strategy Office', email: 'office@forefront.example' };

  S.roles = [
    ['r1', 'Sales coordinator'], ['r2', 'Credit controller'], ['r3', 'Finance manager'], ['r4', 'Logistics coordinator'],
    ['r5', 'Warehouse supervisor'], ['r6', 'Procurement officer'], ['r7', 'Store manager'], ['r8', 'Customer service agent'],
    ['r9', 'CFO'], ['r10', 'HR business partner'], ['r11', 'Accounts payable clerk'], ['r12', 'Billing clerk'],
    ['r13', 'Inventory controller'], ['r14', 'Commercial manager'], ['r15', 'Supply chain manager'], ['r16', 'Chief operating officer'],
    ['r17', 'Retail operations manager'], ['r18', 'Customer service lead'], ['r19', 'Accountant'],
  ].map(([id, name]) => ({ id, name, archived: false }));

  const P = (id, name, roles, mgr, reg, email) => ({ id, name, roles, mgr, reg: reg !== false, email: email === undefined ? name.toLowerCase().replace(/[^a-z]+/g, '.') + '@rayatrade.example' : email, archived: false });
  S.people = [
    P('p1', 'Yara Kamal', ['r9'], null), P('p2', 'Tarek Samy', ['r16'], null), P('p3', 'Hend Mourad', ['r3'], 'p1'), P('p4', 'Hala Mansour', ['r3'], 'p1'),
    P('p5', 'Karim Fouad', ['r15'], 'p2'), P('p6', 'Omar Fathy', ['r14'], 'p2'), P('p7', 'Amr Hassan', ['r17'], 'p2'), P('p8', 'Nour Samir', ['r18'], 'p2'),
    P('p9', 'Laila Zaki', ['r10'], 'p2'), P('p10', 'Salma Adel', ['r2'], 'p3'), P('p11', 'Sherif Adel', ['r11'], 'p4'), P('p12', 'Dina Shawky', ['r12'], 'p3'),
    P('p13', 'Dalia Sabry', ['r1'], 'p6'), P('p14', 'Nadia Fouad', ['r1'], 'p6'), P('p15', 'Mai Sobhy', ['r4'], 'p5'), P('p16', 'Ramy Behairy', ['r5'], 'p5'),
    P('p17', 'Kareem Hafez', ['r13'], 'p5'), P('p18', 'Heba Salem', ['r6'], 'p5'), P('p19', 'Rania Fahmy', ['r8'], 'p8'), P('p20', 'Mostafa Deif', ['r7'], 'p7'),
    P('p21', 'Amaka Eze', ['r19'], 'p4', false, ''),
  ];
  S.categories = ['Finance', 'Supply Chain', 'Retail', 'Commercial', 'Care', 'HR'];

  const st = (id, type, label, role, x) => Object.assign({ id, type, label, role, actions: [], risk: '', inputs: '', output: '', errors: '', links: [], milestone: false, phase: null, support: [], requiresAll: false, note: '' }, x || {});
  const chain = (ids) => ids.slice(1).map((to, i) => ({ from: ids[i], to, label: '' }));
  const proc = (o) => Object.assign({
    desc: '', cat: null, parent: null, branchFrom: null, owner: null, status: 'DRAFT', approver: null, reviewers: [], sentBy: null, sentAt: null,
    changeNote: '', returnReason: '', reviewMonths: 12, nextReview: null, purpose: '', inScope: [], outScope: [], entities: [], kpis: [],
    doc: { version: '', effective: '', owner: '', approvedBy: '' }, revisions: [], steps: [], conn: [], ext: [],
    raci: { final: false, finalAt: null, cells: {}, skip: [], acts: [], pinned: [], dots: [] }, auth: { rules: [], skip: [] },
    controls: [], ncs: [], versions: [], acks: [], prio: { imp: null, cx: null, risk: null, why: '', dec: null }, proposals: [], findings: null, deleted: null,
  }, o);
  const cells = (rows) => { const c = {}; Object.keys(rows).forEach((sid) => rows[sid].split(' ').forEach((pair) => { const [r, l] = pair.split(':'); c[sid + '|' + r] = l; })); return c; };
  const rule = (step, on, value, dir, then, whoType, whoId) => ({ id: uid('ru'), step, on, value, dir, then, who: whoId ? { type: whoType, id: whoId } : null });
  const ctl = (step, risk, level, control, type, freq, owner, evidence, test, testedAt) => ({ id: uid('c'), step, risk, level, control, type, freq, owner, evidence, test: test || 'not_tested', testedAt: testedAt || null });

  S.processes = [
    proc({
      code: 'ORD100', name: 'Order-to-Cash', cat: 'Finance', owner: 'p3', status: 'APPROVED', approver: 'p1', reviewers: ['p5'], sentBy: 'Hend Mourad', sentAt: '2026-09-30',
      desc: 'From a confirmed customer order to cash in the bank.', changeNote: 'Credit check moved before delivery; prepayment path added.',
      purpose: 'Take a confirmed customer order through the credit check, delivery, invoicing and collection, so that every order is delivered once and paid for within terms.',
      inScope: ['Orders from trade customers on credit terms', 'Deliveries from the central warehouse', 'Invoicing and collection'], outScope: ['Cash sales in stores', 'Returns and refunds (ORD101)', 'Export orders'],
      entities: [{ name: 'Customer', desc: 'Places the order and pays the invoice.' }, { name: 'Bank', desc: 'Confirms receipts against the statement.' }],
      kpis: [{ metric: 'Order to invoice', target: '2 days', freq: 'Weekly' }, { metric: 'Invoice accuracy', target: '98%', freq: 'Monthly' }, { metric: 'Days to collect', target: '45 days', freq: 'Monthly' }],
      doc: { version: '', effective: '', owner: 'Hend Mourad', approvedBy: 'Yara Kamal' },
      revisions: [{ v: '2.0', date: '2025-10-03', by: 'Hend Mourad', change: 'Returns handling added' }, { v: '1.0', date: '2025-01-14', by: 'Omar Fathy', change: 'First issue' }],
      steps: [
        st('o1', 'START', 'Order received', 'r1'),
        st('o2', 'TASK', 'Confirm order', 'r1', { actions: ['Check the order against the quote', 'Confirm prices, quantities and the delivery date with the customer', 'Enter the order in the ERP'], inputs: 'Customer purchase order; the quote; the ERP', output: 'Order confirmed in the ERP', errors: 'Quote expired; customer code missing', risk: 'An order goes out at an old price', phase: 'ph1', milestone: true }),
        st('o3', 'DECISION', 'Credit check', 'r2', { actions: ['Add this order to the customer\'s balance', 'Compare with the credit limit', 'Release the order or hold it for prepayment'], inputs: 'Confirmed order; customer balance from the ERP', output: 'Order released, or held for prepayment', risk: 'Goods released to a customer who cannot pay', phase: 'ph1', milestone: true, support: ['r3'] }),
        st('o4', 'TASK', 'Ask for prepayment', 'r1', { actions: ['Send the pro-forma invoice', 'Chase until it is paid or cancelled'], inputs: 'Held order', output: 'Payment received and the order released', phase: 'ph1' }),
        st('o5', 'TASK', 'Deliver', 'r4', { actions: ['Pick and pack', 'Deliver and bring back signed proof of delivery'], inputs: 'Released order; pick list', output: 'Goods delivered; signed proof returned', links: ['LOG100'], phase: 'ph2', support: ['r5'], milestone: true }),
        st('o6', 'TASK', 'Invoice', 'r12', { actions: ['Raise the invoice from the signed proof', 'Send it to the customer'], inputs: 'Signed proof of delivery; price list', output: 'Invoice sent', errors: 'Wrong price list applied', phase: 'ph3' }),
        st('o7', 'TASK', 'Collect payment', 'r2', { actions: ['Match receipts to invoices', 'Chase overdue invoices every week'], inputs: 'Open invoices; bank statement', output: 'Cash received and matched', links: ['REC100'], phase: 'ph3', milestone: true }),
        st('o8', 'END', 'Cash matched', 'r2'),
      ],
      conn: [{ from: 'o1', to: 'o2', label: '' }, { from: 'o2', to: 'o3', label: '' }, { from: 'o3', to: 'o5', label: 'Within limit' }, { from: 'o3', to: 'o4', label: 'Over limit' }, { from: 'o4', to: 'o5', label: 'Once paid' }, { from: 'o5', to: 'o6', label: '' }, { from: 'o6', to: 'o7', label: '' }, { from: 'o7', to: 'o8', label: '' }],
      raci: { final: true, finalAt: '2026-10-04', skip: [], acts: [], pinned: [], dots: [], cells: cells({ o2: 'r1:R r3:A r2:I r4:I', o3: 'r2:R r3:A r1:C', o4: 'r1:R r3:A r2:C', o5: 'r5:R r4:A r1:I r12:I', o6: 'r12:R r3:A r1:I', o7: 'r2:R r3:A r1:C' }) },
      auth: { rules: [rule('o3', 'money', 250000, 'gte', 'approval', 'role', 'r9'), rule('o3', 'time', 1, 'gt', 'escalate', 'role', 'r3'), rule('o4', 'time', 5, 'gt', 'escalate', 'role', 'r14'), rule('o6', 'time', 2, 'gt', 'escalate', 'role', 'r3')], skip: ['o2', 'o5', 'o7'] },
      controls: [ctl('o3', 'Goods released to a customer over the credit limit', 'High', 'The ERP blocks orders over the credit limit', 'Preventive', 'Every order', 'Credit controller', 'ERP block log', 'pass', '2026-08-14'), ctl('o6', 'Invoice sent with the wrong price', 'Medium', 'Price list signed off before use', 'Detective', 'Monthly', 'Finance manager', 'Signed price list'), ctl('o5', 'Proof of delivery missing', 'Medium', '', '', '', '', '')],
      ncs: [{ id: 'nc7', ref: 'NC-07', title: 'Wrong price on 4 invoices', detail: 'An expired price list stayed loaded for a week.', action: 'Re-sign the price list; credit the four customers', owner: 'Finance manager', raised: '2026-10-09', status: 'In progress' }, { id: 'nc4', ref: 'NC-04', title: 'Delivery left without signed proof', detail: '', action: 'Drivers briefed; proof photo added to the app', owner: 'Logistics coordinator', raised: '2026-08-21', status: 'Closed' }],
      versions: [{ n: 3, approvedAt: '2026-10-04', by: 'Yara Kamal', role: 'CFO', published: null, note: 'Credit check moved before delivery; prepayment path added.', sentBy: 'Hend Mourad' }, { n: 2, approvedAt: '2025-09-28', by: 'Yara Kamal', role: 'CFO', published: '2025-10-03', note: 'Returns handling added.', sentBy: 'Hend Mourad' }, { n: 1, approvedAt: '2025-01-10', by: 'Tarek Samy', role: 'Chief operating officer', published: '2025-01-14', note: 'First issue.', sentBy: 'Omar Fathy' }],
      acks: ['p10', 'p12', 'p14', 'p15'], nextReview: '2026-11-12',
      prio: { imp: 5, cx: 4, risk: 5, why: 'Revenue leaks if credit and invoicing slip', dec: 'W1' },
    }),
    proc({ code: 'ORD101', name: 'Returns & refunds', cat: 'Finance', parent: 'ORD100', owner: 'p10',
      steps: [st('a1', 'TASK', 'Log the return', 'r8'), st('a2', 'TASK', 'Inspect the goods', 'r5'), st('a3', 'TASK', 'Issue the credit note', 'r12')], conn: chain(['a1', 'a2', 'a3']),
      raci: { final: false, cells: cells({ a1: 'r8:R', a2: 'r5:R', a3: 'r12:R r3:A' }), skip: [], acts: [], pinned: [], dots: [] } }),
    proc({ code: 'ORD102', name: 'Customer credit setup', cat: 'Finance', parent: 'ORD100', branchFrom: { code: 'ORD100', step: 'o3' }, owner: 'p3',
      steps: [st('b1', 'TASK', 'Collect trade references', 'r2'), st('b2', 'TASK', 'Set the credit limit', 'r3')], conn: chain(['b1', 'b2']) }),
    proc({
      code: 'INV100', name: 'Inventory & Stock Count', cat: 'Supply Chain', owner: 'p5', desc: 'Counting stock and correcting the records.',
      purpose: 'Count stock on a fixed cycle and correct the records, so that what the system says is on the shelf is on the shelf.', inScope: ['Central warehouse', 'All stores'], outScope: ['Goods in transit'],
      steps: [st('i1', 'START', 'Count scheduled', 'r13'), st('i2', 'TASK', 'Freeze stock movements', 'r5'), st('i3', 'TASK', 'Count and record', 'r5', { milestone: true }), st('i4', 'DECISION', 'Variance above tolerance?', 'r13'), st('i5', 'TASK', 'Recount', 'r5'), st('i6', 'TASK', 'Post adjustments', 'r19'), st('i7', 'END', 'Records match', 'r19')],
      conn: [{ from: 'i1', to: 'i2', label: '' }, { from: 'i2', to: 'i3', label: '' }, { from: 'i3', to: 'i4', label: '' }, { from: 'i4', to: 'i5', label: 'Yes' }, { from: 'i4', to: 'i6', label: 'No' }, { from: 'i5', to: 'i6', label: '' }, { from: 'i6', to: 'i7', label: '' }],
      raci: { final: false, cells: cells({ i2: 'r5:R r15:A', i3: 'r5:R r13:C', i4: 'r13:R r15:A', i5: 'r5:R', i6: 'r19:R r3:A' }), skip: [], acts: [], pinned: [], dots: [] },
      auth: { rules: [rule('i6', 'money', 10000, 'gt', 'approval', 'role', 'r3')], skip: ['i3', 'i4', 'i5'] },
      controls: [ctl('i3', 'Count recorded against the wrong location', 'Medium', 'Blind count by a second person', 'Detective', 'Every count', 'Inventory controller', 'Count sheets', 'pass', '2026-09-30')],
      prio: { imp: 4, cx: 4, risk: 5, why: 'Shrinkage and write-offs across the stores', dec: 'W1' },
    }),
    proc({
      code: 'PRO100', name: 'Procure-to-Pay', cat: 'Supply Chain', owner: 'p5', status: 'IN_REVIEW', approver: 'p1', reviewers: ['p4'], sentBy: 'Karim Fouad', sentAt: '2026-10-18',
      changeNote: 'Three-way match added before payment; approval levels updated.', desc: 'From a purchase request to a paid supplier.',
      purpose: 'Buy what the business needs at the agreed price and pay suppliers once, on time, for goods actually received.', inScope: ['Goods and services bought centrally'], outScope: ['Store petty cash'],
      kpis: [{ metric: 'Purchase order cycle time', target: '3 days', freq: 'Monthly' }, { metric: 'Invoices paid on time', target: '95%', freq: 'Monthly' }],
      doc: { version: '', effective: '', owner: 'Karim Fouad', approvedBy: '' }, revisions: [{ v: '2.0', date: '2025-12-03', by: 'Karim Fouad', change: 'Approval levels by amount' }],
      steps: [st('q1', 'START', 'Need raised', 'r6'), st('q2', 'TASK', 'Raise purchase request', 'r6'), st('q3', 'DECISION', 'Within budget?', 'r3'), st('q4', 'TASK', 'Issue purchase order', 'r6', { milestone: true }), st('q5', 'TASK', 'Receive goods', 'r5'), st('q6', 'TASK', 'Three-way match', 'r11', { milestone: true }), st('q7', 'TASK', 'Pay supplier', 'r11'), st('q8', 'END', 'Supplier paid', 'r11')],
      conn: [{ from: 'q1', to: 'q2', label: '' }, { from: 'q2', to: 'q3', label: '' }, { from: 'q3', to: 'q4', label: 'Yes' }, { from: 'q3', to: 'q2', label: 'No, revise' }, { from: 'q4', to: 'q5', label: '' }, { from: 'q5', to: 'q6', label: '' }, { from: 'q6', to: 'q7', label: '' }, { from: 'q7', to: 'q8', label: '' }],
      raci: { final: true, finalAt: '2026-10-22', skip: [], acts: [], pinned: [], dots: [], cells: cells({ q2: 'r6:R r15:A', q3: 'r3:R r9:A r6:C', q4: 'r6:R r15:A', q5: 'r5:R r15:A r6:I', q6: 'r11:R r3:A', q7: 'r11:R r3:A r6:I' }) },
      auth: { rules: [rule('q4', 'money', 50000, 'gt', 'approval', 'role', 'r3'), rule('q4', 'money', 250000, 'gte', 'approval', 'role', 'r9'), rule('q7', 'time', 3, 'gt', 'escalate', 'role', 'r3')], skip: ['q2', 'q3', 'q5', 'q6'] },
      controls: [ctl('q6', 'Supplier paid for goods not received', 'High', 'Payment blocked until order, receipt and invoice match', 'Preventive', 'Every invoice', 'Accounts payable clerk', 'Match report', 'pass', '2026-09-10'), ctl('q4', 'Order split to avoid an approval level', 'Medium', 'Weekly report of orders just under a threshold', 'Detective', 'Weekly', 'Finance manager', 'Report', 'fail', '2026-09-28')],
      versions: [{ n: 2, approvedAt: '2025-11-30', by: 'Yara Kamal', role: 'CFO', published: '2025-12-03', note: 'Approval levels by amount.', sentBy: 'Karim Fouad' }, { n: 1, approvedAt: '2025-02-20', by: 'Tarek Samy', role: 'Chief operating officer', published: '2025-02-24', note: 'First issue.', sentBy: 'Karim Fouad' }],
      acks: ['p11', 'p16', 'p18'], nextReview: '2026-12-03',
      prio: { imp: 5, cx: 4, risk: 4, why: 'Largest spend; three approval levels', dec: 'W1' },
    }),
    proc({
      code: 'CRE100', name: 'Credit & Collections', cat: 'Finance', owner: 'p4',
      steps: [st('k1', 'TASK', 'Review aged debt', 'r2'), st('k2', 'TASK', 'Send reminders', 'r2'), st('k3', 'DECISION', 'Paid within 30 days?', 'r2'), st('k4', 'TASK', 'Hand to collections', 'r3'), st('k5', 'END', 'Debt closed', 'r2')],
      conn: [{ from: 'k1', to: 'k2', label: '' }, { from: 'k2', to: 'k3', label: '' }, { from: 'k3', to: 'k5', label: 'Yes' }, { from: 'k3', to: 'k4', label: 'No' }, { from: 'k4', to: 'k5', label: '' }],
      raci: { final: true, finalAt: '2026-10-20', skip: [], acts: [], pinned: [], dots: [], cells: cells({ k1: 'r2:R r3:A', k2: 'r2:R r3:A', k3: 'r2:R r3:A', k4: 'r3:R r9:A r2:C' }) },
      prio: { imp: 4, cx: 3, risk: 5, why: 'Overdue balances rising', dec: 'W1' },
    }),
    proc({
      code: 'REC100', name: 'Record-to-Report', cat: 'Finance', owner: 'p4', status: 'PUBLISHED', approver: 'p1', sentBy: 'Hala Mansour', nextReview: '2027-03-14', reviewMonths: 12,
      purpose: 'Close each month on time with accounts that reconcile, so that management sees a true position by the fifth working day.', inScope: ['Monthly close', 'Group consolidation'], outScope: ['Tax filings'],
      doc: { version: '2.0', effective: '2026-03-14', owner: 'Hala Mansour', approvedBy: 'Yara Kamal' }, revisions: [{ v: '2.0', date: '2026-03-14', by: 'Hala Mansour', change: 'Close moved to five working days' }],
      steps: [st('c1', 'START', 'Period ends', 'r19'), st('c2', 'TASK', 'Post receipts', 'r19', { phase: 'ph4' }), st('c3', 'TASK', 'Reconcile accounts', 'r19', { phase: 'ph4' }), st('c4', 'TASK', 'Accrue and adjust', 'r19', { phase: 'ph4' }), st('c5', 'TASK', 'Review the trial balance', 'r3', { phase: 'ph4', milestone: true }), st('c6', 'TASK', 'Approve and lock the period', 'r9', { phase: 'ph4', milestone: true }), st('c7', 'END', 'Period closed', 'r9')],
      conn: chain(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']), ext: [{ step: 'c2', code: 'ORD100', stepId: 'o7', label: 'Receipts matched' }],
      raci: { final: true, finalAt: '2026-03-01', skip: [], acts: [], pinned: [], dots: [], cells: cells({ c2: 'r19:R r3:A', c3: 'r19:R r3:A', c4: 'r19:R r3:A', c5: 'r3:R r9:A', c6: 'r3:R r9:A' }) },
      auth: { rules: [], skip: ['c2', 'c3', 'c4', 'c5', 'c6'] },
      versions: [{ n: 2, approvedAt: '2026-03-10', by: 'Yara Kamal', role: 'CFO', published: '2026-03-14', note: 'Close moved to five working days.', sentBy: 'Hala Mansour' }],
      acks: ['p4', 'p11'], prio: { imp: 4, cx: 4, risk: 4, why: 'Month-end close takes nine days', dec: 'W2' },
    }),
    proc({ code: 'REC101', name: 'Month-end close', cat: 'Finance', parent: 'REC100', owner: 'p4', steps: [st('d1', 'TASK', 'Run the close checklist', 'r19'), st('d2', 'TASK', 'Sign off the close', 'r3')], conn: chain(['d1', 'd2']) }),
    proc({ code: 'REC102', name: 'Fixed assets', cat: 'Finance', parent: 'REC100', owner: null }),
    proc({
      code: 'LOG100', name: 'Logistics & Last-mile', cat: 'Supply Chain', owner: 'p5',
      steps: [st('l1', 'TASK', 'Plan routes', 'r4', { phase: 'ph2' }), st('l2', 'TASK', 'Load vehicles', 'r5', { phase: 'ph2' }), st('l3', 'TASK', 'Deliver to customer', 'r4', { phase: 'ph2' }), st('l4', 'TASK', 'Return proof of delivery', 'r4', { phase: 'ph2' })],
      conn: chain(['l1', 'l2', 'l3', 'l4']), ext: [{ step: 'l1', code: 'ORD100', stepId: 'o5', label: 'Order released' }],
      prio: { imp: 4, cx: 5, risk: 3, why: 'Many hand-offs, many partners', dec: 'W2' },
    }),
    proc({
      code: 'NEW100', name: 'New Store Opening', cat: 'Retail', owner: 'p7', status: 'PUBLISHED', approver: 'p2', sentBy: 'Amr Hassan', nextReview: '2026-09-20',
      purpose: 'Open a new store on the agreed date, fitted, staffed and stocked.', doc: { version: '1.0', effective: '2025-09-20', owner: 'Amr Hassan', approvedBy: 'Tarek Samy' },
      steps: [st('n1', 'TASK', 'Approve the site', 'r16', { milestone: true }), st('n2', 'TASK', 'Sign the lease', 'r16'), st('n3', 'TASK', 'Fit out the store', 'r17'), st('n4', 'TASK', 'Get the permits', 'r17'), st('n5', 'TASK', 'Hire and train staff', 'r10'), st('n6', 'TASK', 'Stock the store', 'r13'), st('n7', 'TASK', 'Soft opening', 'r7'), st('n8', 'TASK', 'Grand opening', 'r17', { milestone: true })],
      conn: chain(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8']),
      raci: { final: true, finalAt: '2025-09-01', skip: [], acts: [], pinned: [], dots: [], cells: cells({ n1: 'r17:R r16:A', n2: 'r16:R r9:A', n3: 'r17:R r16:A', n4: 'r17:R r16:A', n5: 'r10:R r17:A', n6: 'r13:R r17:A', n7: 'r7:R r17:A', n8: 'r17:R r16:A' }) },
      auth: { rules: [rule('n2', 'money', 1000000, 'gte', 'approval', 'role', 'r9')], skip: ['n1', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'] },
      versions: [{ n: 1, approvedAt: '2025-09-15', by: 'Tarek Samy', role: 'Chief operating officer', published: '2025-09-20', note: 'First issue.', sentBy: 'Amr Hassan' }],
      acks: ['p20'], prio: { imp: 4, cx: 5, risk: 3, why: 'Complex, but only a few a year', dec: 'W2' },
    }),
    proc({ code: 'NEW101', name: 'Store fit-out', cat: 'Retail', parent: 'NEW100', owner: 'p7', steps: [st('f1', 'TASK', 'Brief the contractor', 'r17'), st('f2', 'TASK', 'Inspect the works', 'r17'), st('f3', 'TASK', 'Hand over the keys', 'r7')], conn: chain(['f1', 'f2', 'f3']) }),
    proc({ code: 'PRI100', name: 'Pricing & Promotions', cat: 'Commercial', owner: 'p6', steps: [st('g1', 'TASK', 'Propose a price change', 'r14'), st('g2', 'TASK', 'Approve the price change', 'r9')], conn: chain(['g1', 'g2']), prio: { imp: 5, cx: 3, risk: 3, why: 'Margin impact, but it works today', dec: 'W2' } }),
    proc({ code: 'CUS100', name: 'Customer Complaints', cat: 'Care', owner: 'p8', prio: { imp: 3, cx: 2, risk: 2, why: 'Handled well by the call centre', dec: 'HIGH' } }),
    proc({ code: 'HIR100', name: 'Hire-to-Retire', cat: 'HR', owner: 'p9', steps: [st('h1', 'TASK', 'Raise the vacancy', 'r10'), st('h2', 'TASK', 'Interview and offer', 'r10'), st('h3', 'TASK', 'Onboard', 'r10')], conn: chain(['h1', 'h2', 'h3']) }),
    proc({
      code: 'STO100', name: 'Store Cash Handling', cat: 'Retail', owner: 'p7', status: 'PUBLISHED', approver: 'p1', sentBy: 'Amr Hassan', nextReview: '2026-11-10',
      purpose: 'Count, record and bank store takings every day, so that cash matches sales.', doc: { version: '1.0', effective: '2025-11-10', owner: 'Amr Hassan', approvedBy: 'Yara Kamal' },
      steps: [st('t1', 'TASK', 'Open the till', 'r7'), st('t2', 'TASK', 'Count cash at close', 'r7'), st('t3', 'DECISION', 'Matches the till report?', 'r7'), st('t4', 'TASK', 'Bank the takings', 'r7')],
      conn: [{ from: 't1', to: 't2', label: '' }, { from: 't2', to: 't3', label: '' }, { from: 't3', to: 't4', label: 'Yes' }],
      versions: [{ n: 1, approvedAt: '2025-11-05', by: 'Yara Kamal', role: 'CFO', published: '2025-11-10', note: 'First issue.', sentBy: 'Amr Hassan' }],
      acks: ['p20'], prio: { imp: 3, cx: 2, risk: 4, why: 'Works today; audited every quarter', dec: 'HIGH' },
    }),
    proc({ code: 'OLD100', name: 'Old order process', cat: 'Finance', owner: 'p3', deleted: '2026-09-14', steps: [st('z1', 'TASK', 'Take the order', 'r1')] }),
    proc({ code: 'TES100', name: 'Test process', owner: null, deleted: '2026-10-02' }),
  ];

  S.plan = { weights: { imp: 35, risk: 40, cx: 25 }, capacity: 4, timing: { W1: 'Start now', W2: 'Next', LATER: 'Review later' }, status: 'DRAFT', approver: null, sentBy: null, sentAt: null, snapshot: null, approvedAt: null, returned: null, record: [] };

  S.phases = [{ id: 'ph1', name: 'Order intake', color: '#4F46E5' }, { id: 'ph2', name: 'Fulfilment', color: '#0E7490' }, { id: 'ph3', name: 'Billing & cash', color: '#B45309' }, { id: 'ph4', name: 'Close & report', color: '#7C3AED' }];

  S.gov = {
    profile: { size: 'Mid-market', jurisdiction: 'Egypt' },
    aspects: [['a1', 'Board Structure'], ['a2', 'Risk & Internal Controls'], ['a3', 'Ethics Policy'], ['a4', 'Compensation'], ['a5', 'ESG'], ['a6', 'Data Integrity'], ['a7', 'Accessibility']].map(([id, name]) => ({ id, name })),
    assess: {
      a1: { at: '2026-10-05', summary: 'Accountability: the board meets quarterly but has no written charter, so who decides what rests on custom. Transparency & Fairness: minutes are kept but not shared with the audit committee. Responsibility: committee roles overlap. Independence: two of seven directors are independent.', },
      a2: { at: '2026-10-12', summary: 'Accountability: risk owners are named for the main processes, but treatment actions are often late. Transparency & Fairness: the risk register is reviewed monthly by Finance only. Responsibility: three high risks sit with one person. Independence: internal audit reports to the CFO rather than to the audit committee.', },
    },
    checklist: [
      { id: 'k1', aspect: 'a2', title: 'Give internal audit a line to the audit committee', desc: 'So findings reach the board without passing through Finance.', when: 'Immediate', owner: 'Yara Kamal', due: '2026-10-15', done: false, policy: null },
      { id: 'k2', aspect: 'a2', title: 'Name a second owner for the three high risks', desc: 'One person holds all three today.', when: 'Immediate', owner: 'Tarek Samy', due: '2026-11-15', done: false, policy: null },
      { id: 'k3', aspect: 'a2', title: 'Publish the risk management policy', desc: 'Approved, not yet in force.', when: 'Near-term', owner: 'Hala Mansour', due: '2026-09-30', done: true, policy: 'pol1' },
      { id: 'k4', aspect: 'a2', title: 'Run a yearly risk workshop with every unit head', desc: '', when: 'Long-term', owner: '', due: '', done: false, policy: null },
      { id: 'k5', aspect: 'a1', title: 'Adopt a board charter', desc: 'Write down what the board decides and what it delegates.', when: 'Immediate', owner: 'Tarek Samy', due: '2026-11-30', done: false, policy: 'pol2' },
      { id: 'k6', aspect: 'a1', title: 'Add a third independent director', desc: '', when: 'Long-term', owner: '', due: '', done: false, policy: null },
    ],
    risks: [
      { id: 'rk1', title: 'Customer credit exposure above appetite', desc: 'Large trade customers exceed limits during peak season.', aspect: 'a2', lik: 'High', imp: 'High', status: 'Mitigating', owner: 'Hend Mourad', treat: { strategy: 'Mitigate', tLik: 'Medium', tImp: 'Medium', rationale: 'The ERP block plus a weekly exposure report brings it inside appetite.', actions: [{ id: 'ta1', desc: 'Weekly exposure report to the CFO', owner: 'Hend Mourad', due: '2026-10-10', done: false }] } },
      { id: 'rk2', title: 'Stock shrinkage in stores', desc: '', aspect: 'a2', lik: 'Medium', imp: 'High', status: 'Open', owner: 'Karim Fouad', treat: null },
      { id: 'rk3', title: 'Supplier paid twice', desc: '', aspect: 'a2', lik: 'Low', imp: 'High', status: 'Mitigating', owner: 'Hala Mansour', treat: null },
      { id: 'rk4', title: 'Board decisions without a written mandate', desc: '', aspect: 'a1', lik: 'Medium', imp: 'Medium', status: 'Open', owner: 'Tarek Samy', treat: null },
      { id: 'rk5', title: 'Customer data shared without consent', desc: '', aspect: 'a6', lik: 'Low', imp: 'Critical', status: 'Open', owner: '', treat: null },
      { id: 'rk6', title: 'Late month-end close', desc: '', aspect: null, lik: 'Medium', imp: 'Low', status: 'Accepted', owner: 'Hala Mansour', treat: null },
      { id: 'rk7', title: 'Cash shortfall at store close', desc: '', aspect: null, lik: 'Low', imp: 'Low', status: 'Closed', owner: 'Amr Hassan', treat: null },
    ],
    policies: [
      { id: 'pol1', title: 'Risk Management Policy', aspect: 'a2', governs: 'a2', life: 'Published', edited: true, updated: '2026-09-01', effective: '2026-09-01', approvedBy: 'Yara Kamal', approvedAt: '2026-08-28', reviewDue: '2027-09-01', body: '1. Purpose\nSets how Raya Trade finds, scores, owns and treats risk.\n\n2. Scope\nEvery unit and function.\n\n3. Roles\nThe CFO owns this policy. Each risk has a named owner.', versions: 2, acks: ['p3', 'p4', 'p5'] },
      { id: 'pol2', title: 'Board Charter', aspect: 'a1', governs: 'a1', life: 'In review', edited: false, updated: '2026-10-06', effective: null, approvedBy: null, reviewDue: null, body: '1. Purpose\nWhat the board decides and what it delegates.', versions: 1, acks: [] },
      { id: 'pol3', title: 'Code of Ethics and Conduct', aspect: 'a3', governs: null, life: 'Draft', edited: false, updated: '2026-10-08', effective: null, reviewDue: null, body: '', versions: 1, acks: [] },
      { id: 'pol4', title: 'Delegation of Authority', aspect: null, governs: null, life: 'Published', edited: true, updated: '2025-06-01', effective: '2025-06-01', approvedBy: 'Tarek Samy', approvedAt: '2025-05-28', reviewDue: '2026-06-01', body: 'Approval limits by amount and role.', versions: 3, acks: ['p1', 'p3'] },
      { id: 'pol5', title: 'Data Protection Policy', aspect: 'a6', governs: null, life: 'Draft', edited: true, updated: '2026-10-11', effective: null, reviewDue: null, body: '', versions: 1, acks: [] },
    ],
    activity: [
      ['2026-10-22 16:10', 'Policy', 'Risk Management Policy', 'Acknowledgement marked for Karim Fouad', 'Strategy Office'],
      ['2026-10-12 11:02', 'Assessment', 'Risk & Internal Controls', 'Generated assessment — 4 new checklist items, 3 new risks, governing policy drafted', 'Strategy Office'],
      ['2026-10-11 09:40', 'Policy', 'Data Protection Policy', 'Edited', 'Strategy Office'],
      ['2026-10-08 14:21', 'Risk', 'Customer credit exposure above appetite', 'Edited', 'Strategy Office'],
      ['2026-10-06 10:05', 'Policy', 'Board Charter', 'Submitted for review', 'Strategy Office'],
      ['2026-10-05 15:30', 'Assessment', 'Board Structure', 'Generated assessment — 2 new checklist items, 1 new risk, governing policy drafted', 'Strategy Office'],
      ['2026-09-30 12:00', 'Checklist item', 'Publish the risk management policy', 'Marked Done', 'Strategy Office'],
      ['2026-09-01 09:00', 'Policy', 'Risk Management Policy', 'Published', 'Yara Kamal'],
    ],
  };

  S.pack = [['cover', 'Cover page', true, true], ['org', 'Org Structure', true], ['heli', 'Helicopter View', true], ['vc', 'Value Chain', true], ['gov', 'Governance & Risk', false], ['index', 'Processes in This Report', true], ['close', 'Closing page', true]].map(([id, name, on, locked]) => ({ id, name, on, locked: !!locked }));
  S.inside = [
    { id: 's1', name: 'Executive Summary', on: true, blocks: [['purpose', 'Process Purpose'], ['trigger', 'Trigger & Output'], ['roles', 'Internal Roles'], ['ext', 'External Entities']] },
    { id: 's2', name: 'Process Map & Narrative', on: true, blocks: [['scope', 'Scope'], ['diagram', 'Workflow diagram'], ['narr', 'Step narrative']] },
    { id: 's3', name: 'RACI & Authority Matrix', on: true, blocks: [['raci', 'RACI grid'], ['auth', 'Authority rules']] },
    { id: 's4', name: 'Governance, Controls & Metrics', on: true, blocks: [['kcp', 'Key Control Points'], ['kpi', 'Operational KPIs & SLAs']] },
  ].map((s) => Object.assign(s, { blocks: s.blocks.map(([id, name]) => ({ id, name, on: true })) }));

  S.feed = [
    ['2026-10-22', 'Karim Fouad finalised the RACI of <b>Procure-to-Pay</b>'],
    ['2026-10-20', 'Hala Mansour finalised the RACI of <b>Credit &amp; Collections</b>'],
    ['2026-10-18', '<b>Procure-to-Pay</b> sent to Yara Kamal for approval'],
    ['2026-10-04', 'Yara Kamal approved <b>Order-to-Cash</b> v3'],
  ];
})();
