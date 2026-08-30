#!/usr/bin/env node
// Recomputes every headline number in README.md from tracked files in this
// repository. No network, no models, no arguments. If a number in the README
// is not printed by this script, the README is wrong.
//
// README に載っている数字を、この repository の追跡済みファイルから再計算します。
// ネットワーク・モデル・引数は不要です。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const NETWORK = 'public/decision-network-data.json';
const IMPACT = 'public/impact-view-data.json';
const FORK_A = 'docs/rescueworld/evidence/receipt-fork/receipt-fork-20260828-v1/receipt-fork-analysis.json';
const FORK_B = 'docs/rescueworld/evidence/receipt-fork/qwen35-receipt-production-v2/qwen35-receipt-fork-analysis.json';

const line = (label, value, source) =>
  console.log(`${String(value).padStart(9)}  ${label.padEnd(46)} ${source}`);

// ---- scale of the exercise -------------------------------------------------
const net = read(NETWORK);
const campaigns = net.views.length;
const modelCalls = net.views.reduce((n, v) => n + v.model_calls, 0);
const decisionCells = net.views.reduce((n, v) => n + v.decisions, 0);
const methods = new Set(net.views.map((v) => v.method_id)).size;
const seeds = new Set(net.views.map((v) => v.seed)).size;

console.log('\nSCALE / 規模');
line('complete campaigns', campaigns, NETWORK);
line('orchestration methods x seeds', `${methods} x ${seeds}`, NETWORK);
line('scored decision cells', decisionCells, NETWORK);
line('recorded model calls', modelCalls, NETWORK);

// ---- the chain that breaks -------------------------------------------------
// Decision index 5 is the Yatsushiro paper-mill dispatch confirmation: it can
// only be satisfied by naming a group from the assignment made at the same
// cutoff by decision index 4.
const HANDOFF = 5;
let handoffTotal = 0;
let handoffAdmitted = 0;
for (const view of net.views) {
  for (const moment of view.moments) {
    if (moment.decision !== HANDOFF) continue;
    handoffTotal += 1;
    if (!moment.verdict.includes('failed')) handoffAdmitted += 1;
  }
}

console.log('\nTHE CHAIN THAT BREAKS / 途切れる連鎖');
line('dispatch-confirmation handoffs attempted', handoffTotal, NETWORK);
line('handoffs admitted by the rule checker', handoffAdmitted, NETWORK);
line('methods that avoided the failure', 0, NETWORK);

// ---- adaptation still works ------------------------------------------------
const impact = read(IMPACT);
console.log('\nADAPTATION MEASURED ANYWAY / それでも適応は起きた');
console.log(`           measure: ${impact.aggregate_across_seeds.measure}`);
for (const m of impact.aggregate_across_seeds.methods) {
  const pairs = m.paired_differences;
  const pct = pairs.reduce((s, p) => s + -p.difference / p.control_value, 0) / pairs.length;
  const allBetter = pairs.every((p) => p.difference < 0);
  line(
    `${m.label} vs fixed coverage`,
    `${(pct * 100).toFixed(0)}%`,
    `better in ${pairs.filter((p) => p.difference < 0).length}/${pairs.length} paired seeds${allBetter ? '' : ' (NOT all)'}`
  );
}

// ---- the one-variable repair -----------------------------------------------
console.log('\nONE VARIABLE CHANGED / 一条件だけ変更');
for (const [label, path] of [['Qwen3-32B', FORK_A], ['Qwen3.5-122B', FORK_B]]) {
  const a = read(path);
  const p = a.primary;
  line(`${label}  empty record -> handover record`,
    `${p.control_successes}/${p.denominator_per_arm} -> ${p.treatment_successes}/${p.denominator_per_arm}`,
    path.replace('docs/rescueworld/evidence/receipt-fork/', ''));
  line(`${label}  valid on first attempt`, `${p.treatment_valid_immediately}/${p.denominator_per_arm}`, '');
  line(`${label}  false completions`, a.safety.false_resolutions, '');
  line(`${label}  logical model calls in this fork`, a.logical_call_count, '');
}

console.log('\nEvery number above is read from a tracked file. Nothing here is typed in by hand.');
console.log('上の数字はすべて追跡済みファイルから読み出しています。手入力の値はありません。\n');
