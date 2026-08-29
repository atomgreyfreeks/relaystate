#!/usr/bin/env node
/**
 * Bake the accepted receipt-fork run into the data the pages read.
 *
 * The receipt-fork calibration is written by
 * `experiments/kumamoto-bounded-probe-pilot/runner/kumamoto_bounded_probe_pilot/receipt_fork.py`.
 * Its `analyze` step writes one `receipt-fork-analysis.json` per run directory, holding the
 * verdict, the call budget, the two primary arms, the safety arm and one row per job. This
 * script copies those ids and numbers into `app/public/receipt-fork-data.json`. It adds nothing:
 * every value in the output is read from a file under the results root, and the totals are only
 * re-derived from the rows to prove they agree with the totals the runner recorded.
 *
 * The output carries no sentences. Pages render their own words from these ids and numbers.
 *
 * Every directory under the results root that holds a `receipt-fork-analysis.json` becomes one
 * entry in `runs`, in directory-name order. A replication on a larger model, dropped beside the
 * accepted run, becomes a second entry with no change to this script or to the schema.
 *
 * `strip` is the same numbers again under the names the strip across the top of the page uses:
 * `first_model` from the accepted run, `replication` from the run whose directory name carries
 * `qwen35`. Until that second run exists the replication block reads `pending` with no counts.
 *
 *     node app/scripts/bake-receipt-fork.mjs [results root]
 *
 * Add `--check` to prove the committed file is current, without writing.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// In the partner repository the Vite application lives at the repository root.
const ROOT = APP;
// The accepted run directories under experiments/ are intentionally ignored because they hold
// every raw call. This smaller, tracked evidence bundle carries the exact accepted analyses and
// plans needed to reproduce the public data on any clean checkout.
const RESULTS = path.join(ROOT, "docs/rescueworld/evidence/receipt-fork");
const OUT = path.join(APP, "public", "receipt-fork-data.json");
const SCHEMA = "kumamoto-receipt-fork.page-data.v1";
const EVIDENCE_SCHEMA = "rescueworld-receipt-evidence-bundle.v1";

/** the three arms the runner writes, and the block each one fills in a history */
const CONTROL = "EMPTY_RECEIPT_CONTROL";
const TREATMENT = "EVIDENCE_BOUND_RECEIPT";
const SAFETY = "SHARED_EMPTY_RECEIPT_SAFETY";

/** a run directory whose name carries this is the replication on the larger model */
const REPLICATION_MARK = "qwen35";


function fileEndingWith(directory, suffix) {
  const hits = fs.readdirSync(directory).filter((name) => name.endsWith(suffix)).sort();
  return hits.length ? path.join(directory, hits[0]) : null;
}

function must(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/**
 * Verify the tracked evidence bundle before any public number is baked from it.
 *
 * The semantic hashes inside the analysis and plan are the runner's own identities. The file
 * hashes in the manifest additionally prove that the portable copies are byte-for-byte the
 * accepted files that were reviewed after the GPU runs.
 */
function verifyEvidenceManifest(results) {
  const file = path.join(results, "acceptance-manifest.json");
  must(fs.existsSync(file), `no portable acceptance manifest at ${file}`);
  const manifest = read(file);
  must(manifest.schema_version === EVIDENCE_SCHEMA,
    `unsupported evidence schema ${manifest.schema_version}`);
  must(manifest.status === "accepted_focused_finding",
    `evidence bundle is not accepted for the focused finding`);
  must(Array.isArray(manifest.runs) && manifest.runs.length === 2,
    `portable acceptance manifest must name exactly two runs`);

  for (const run of manifest.runs) {
    const analysisFile = path.join(results, run.analysis.file);
    const planFile = path.join(results, run.plan.file);
    must(fs.existsSync(analysisFile), `${run.id} portable analysis is missing`);
    must(fs.existsSync(planFile), `${run.id} portable plan is missing`);
    must(fileSha256(analysisFile) === run.analysis.file_sha256,
      `${run.id} portable analysis bytes do not match the accepted manifest`);
    must(fileSha256(planFile) === run.plan.file_sha256,
      `${run.id} portable plan bytes do not match the accepted manifest`);

    const analysis = read(analysisFile);
    const plan = read(planFile);
    must(analysis.analysis_sha256 === run.analysis.semantic_sha256,
      `${run.id} analysis identity does not match the accepted manifest`);
    must((analysis.plan_sha256 ?? plan.plan_sha256) === run.plan.semantic_sha256,
      `${run.id} plan identity does not match the accepted manifest`);
    must(plan.model.id === run.model.id && plan.model.revision === run.model.revision,
      `${run.id} model identity does not match the accepted manifest`);
    must(analysis.complete === true && analysis.production_provenance_valid === true,
      `${run.id} is not complete and provenance-valid`);
  }
}

/** every run directory under the results root, newest name last, dot directories skipped */
function runDirectories(results) {
  must(fs.existsSync(results), `no results root at ${results}`);
  return fs.readdirSync(results)
    .filter((name) => !name.startsWith("."))
    .filter((name) => fs.statSync(path.join(results, name)).isDirectory() && fileEndingWith(path.join(results, name), "receipt-fork-analysis.json") !== null)
    .sort();
}

/** one entry in `runs`: the run's identity, its totals, and its eight prefix histories */
function bakeRun(results, name) {
  const directory = path.join(results, name);
  const analysis = read(fileEndingWith(directory, "receipt-fork-analysis.json"));
  const planFile = fileEndingWith(directory, "receipt-fork-plan.json") ?? fileEndingWith(directory, "receipt-plan.json");
  must(planFile !== null && fs.existsSync(planFile), `${name} has no plan file ending in receipt-fork-plan.json or receipt-plan.json to read the model from`);
  const plan = read(planFile);

  const rows = analysis.rows;
  must(Array.isArray(rows) && rows.length === analysis.verified_jobs,
    `${name} records ${analysis.verified_jobs} verified jobs but carries a different row count`);

  /** the rows of one prefix, one per arm */
  const byPrefix = new Map();
  for (const row of rows) {
    if (!byPrefix.has(row.prefix_id)) byPrefix.set(row.prefix_id, {});
    const arms = byPrefix.get(row.prefix_id);
    must(!arms[row.arm], `${name} carries two ${row.arm} rows for ${row.prefix_id}`);
    arms[row.arm] = row;
  }

  const histories = [...byPrefix.keys()].sort().map((prefixId) => {
    const arms = byPrefix.get(prefixId);
    for (const arm of [CONTROL, TREATMENT, SAFETY]) {
      must(arms[arm], `${name} has no ${arm} row for ${prefixId}`);
    }
    const control = arms[CONTROL];
    const treatment = arms[TREATMENT];
    const safety = arms[SAFETY];
    const dash = prefixId.indexOf("-");
    must(dash > 0, `the prefix name ${prefixId} carries no method id`);
    return {
      prefix_id: prefixId,
      seed: control.seed,
      method_id: prefixId.slice(dash + 1),
      control: {
        success: control.final.primary_success,
        admitted: control.final.admitted,
        correction_used: control.correction_used,
      },
      treatment: {
        success: treatment.final.primary_success,
        admitted: treatment.final.admitted,
        correction_used: treatment.correction_used,
        disposition: treatment.final.receipt_disposition ?? null,
      },
      safety: {
        pass: safety.final.safety_pass,
        false_resolution: safety.final.false_resolution,
      },
    };
  });

  // The runner's totals are the record. These re-derivations only prove the rows agree with them,
  // so a page drawing its own table from `histories` cannot disagree with the headline numbers.
  const count = (pick) => histories.filter(pick).length;
  must(histories.length === analysis.primary.denominator_per_arm,
    `${name} holds ${histories.length} prefixes for a primary denominator of`
    + ` ${analysis.primary.denominator_per_arm}`);
  must(histories.length === analysis.safety.denominator,
    `${name} holds ${histories.length} prefixes for a safety denominator of`
    + ` ${analysis.safety.denominator}`);
  must(count((one) => one.control.success) === analysis.primary.control_successes,
    `${name} rows and totals disagree on control successes`);
  must(count((one) => one.treatment.success) === analysis.primary.treatment_successes,
    `${name} rows and totals disagree on treatment successes`);
  must(count((one) => one.safety.pass) === analysis.safety.passes,
    `${name} rows and totals disagree on safety passes`);
  must(count((one) => one.safety.false_resolution) === analysis.safety.false_resolutions,
    `${name} rows and totals disagree on false resolutions`);
  must(rows.reduce((n, row) => n + 1 + (row.correction_used ? 1 : 0), 0)
    === analysis.logical_call_count,
    `${name} rows and totals disagree on the logical call count`);

  const planSha = analysis.plan_sha256 ?? plan.plan_sha256 ?? null;
  const source = {
    directory: path.relative(ROOT, directory),
    analysis_sha256: analysis.analysis_sha256,
  };
  if (planSha) source.plan_sha256 = planSha;

  return {
    id: name,
    model: { id: plan.model.id, revision: plan.model.revision },
    source,
    verdict: analysis.signal_verdict,
    complete: analysis.complete,
    provenance_valid: analysis.production_provenance_valid,
    calls: {
      logical_count: analysis.logical_call_count,
      maximum: analysis.maximum_logical_calls,
    },
    primary: {
      control_successes: analysis.primary.control_successes,
      treatment_successes: analysis.primary.treatment_successes,
      denominator: analysis.primary.denominator_per_arm,
      treatment_valid_immediately: analysis.primary.treatment_valid_immediately,
      treatment_rescued_by_correction: analysis.primary.treatment_rescued_by_correction,
    },
    safety: {
      denominator: analysis.safety.denominator,
      passes: analysis.safety.passes,
      false_resolutions: analysis.safety.false_resolutions,
    },
    histories,
  };
}

/**
 * The ten headline values of one run, under the names the strip across the top of the page uses.
 *
 * Every value is the run's own, already copied from its analysis file. The strip renames them and
 * nothing else: it computes no ratio, no difference and no sentence.
 */
function stripBlock(run) {
  return {
    model_id: run.model.id,
    accepted: run.complete && run.provenance_valid,
    handoffs_total: run.primary.denominator,
    exact_responsibilities_delivered: run.primary.treatment_successes,
    admitted_first_try: run.primary.treatment_valid_immediately,
    corrections_used: run.primary.treatment_rescued_by_correction,
    empty_receipt_cases: run.safety.denominator,
    safe_open_cases: run.safety.passes,
    false_resolutions: run.safety.false_resolutions,
    analysis_sha256: run.source.analysis_sha256,
  };
}

/**
 * The same ten fields, in the same order, with nothing filled in.
 *
 * The field names come from `stripBlock` itself rather than a second list, so the two halves of
 * the strip cannot drift apart. A replication that has not been run has not been accepted, so
 * `accepted` is false where the counts are absent.
 */
function pendingBlock() {
  const block = stripBlock({ model: {}, primary: {}, safety: {}, source: {} });
  for (const field of Object.keys(block)) block[field] = null;
  block.accepted = false;
  return block;
}

/**
 * The strip: the accepted run on the smaller model, and its replication on the larger one.
 *
 * A results directory whose name carries `qwen35` is the replication. Until one exists the
 * replication block stands as `pending` with no model and no counts, so the page can draw the
 * empty half of the strip from the data rather than from a placeholder of its own.
 */
function bakeStrip(runs) {
  const replication = runs.find((run) => run.id.includes(REPLICATION_MARK)) ?? null;
  const first = runs.find((run) => run !== replication);
  must(first, `every run under the results root reads as a ${REPLICATION_MARK} replication`);
  return {
    first_model: stripBlock(first),
    replication: replication
      ? { status: replication.verdict, ...stripBlock(replication) }
      : { status: "pending", ...pendingBlock() },
  };
}

function bake(results) {
  // A custom raw-results root remains useful while a new replication is being baked. The default
  // handoff path is stricter: it must carry and pass the portable acceptance manifest.
  if (path.resolve(results) === path.resolve(RESULTS)) verifyEvidenceManifest(results);
  const names = runDirectories(results);
  must(names.length, `no receipt-fork run under ${results}`);
  const runs = names.map((name) => bakeRun(results, name));
  return { schema_version: SCHEMA, strip: bakeStrip(runs), runs };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const given = args.find((one) => !one.startsWith("--"));
  const results = given ? path.resolve(given) : RESULTS;

  const out = bake(results);
  const text = `${JSON.stringify(out, null, 1)}\n`;
  const name = path.basename(OUT);
  const runs = `${out.runs.length} run${out.runs.length === 1 ? "" : "s"}`;
  const histories = out.runs.reduce((n, run) => n + run.histories.length, 0);

  if (check) {
    const held = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (held !== text) {
      console.error(`${name} is out of date. Run the script without --check.`);
      process.exit(1);
    }
    console.log(`${name} is current: ${runs}, ${histories} histories, analysis`
      + ` ${out.runs[0].source.analysis_sha256.slice(0, 12)}.`);
    return;
  }
  fs.writeFileSync(OUT, text);
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${runs}, ${histories} histories,`
    + ` analysis ${out.runs[0].source.analysis_sha256.slice(0, 12)}.`);
}

try {
  main();
} catch (err) {
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
}
