import { writeFileSync } from 'fs';
const { jsPDF } = await import('jspdf');
(jsPDF.prototype as any).save = function(){
  writeFileSync('/tmp/preview.pdf', Buffer.from(this.output('arraybuffer')));
  console.log('SAVED bytes=', this.output('arraybuffer').byteLength);
  return this;
};
const mod = await import('./lib/planExport');
mod.exportPlanAsPDF({
  id:'1', user_id:'u', title:'Implementation Plan demo1',
  strategy_id:'s1', strategy_name:'RPRx Rate Crusher — Highest-Interest Debt First',
  status:'in_progress', notes:'test 1\nanother personal note line', is_focus:true,
  created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
  content:{
    summary:'Reduce total interest by directing every available surplus dollar to the highest-rate debt while keeping minimums on the rest. Savings compound month over month.',
    horseman:['Interest'], complexity:2, taxReference:'N/A',
    expected_result:{ impact_range:'$800 - $2,400 / year', first_win_timeline:'7-14 days', confidence_note:'High — depends on consistent surplus' },
    before_you_start:['List all debts with balance, APR, min payment','Confirm monthly surplus from cash flow','Login access to each lender portal','Calendar reminder for monthly payment day'],
    steps:[
      { title:'Inventory all debts', instruction:'Pull statements for every debt and record balance, APR, and minimum payment in one place.', time_estimate:'30-45 min', done_definition:'Single list with all debts and APRs' },
      { title:'Identify highest-APR debt', instruction:'Sort the list by APR descending and mark the top one as your focus debt.', time_estimate:'5 min', done_definition:'Focus debt selected' },
      { title:'Set autopay for minimums', instruction:'Enable autopay for the minimum on every non-focus debt to protect your credit.', time_estimate:'15-20 min', done_definition:'All non-focus debts on autopay' },
      { title:'Direct surplus to focus debt', instruction:'Schedule an extra payment equal to your monthly surplus toward the focus debt right after payday.', time_estimate:'10 min', done_definition:'Recurring extra payment scheduled' },
      { title:'Track payoff progress monthly', instruction:'On the 1st of each month, log the new balance and remaining months to payoff.', time_estimate:'10 min / month', done_definition:'Tracker updated for current month' },
      { title:'Roll payment to next debt', instruction:'When the focus debt is paid off, redirect its full payment to the next-highest APR debt.', time_estimate:'15 min', done_definition:'Next focus debt funded' },
    ],
    risks_and_mistakes_to_avoid:['Skipping minimums on other debts to overpay one','Adding new revolving balances during payoff','Ignoring fees from balance transfers'],
    advisor_packet:['Most recent statement for each debt','Net monthly cash flow figure','List of any balance-transfer offers received'],
    completedSteps:[0,1],
  }
} as any);
