import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const RUN = path.join(ROOT, "product/disaster-replay/runs/kumamoto-2026-full-incident/260728-72h");
const readJson = (candidate) => JSON.parse(fs.readFileSync(candidate, "utf8"));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function publicFile(url) {
  assert.equal(typeof url, "string", "a delivered asset URL must be a string");
  assert.ok(url.startsWith("/"), `asset URL must be root-relative: ${url}`);
  const candidate = path.resolve(PUBLIC, `.${url}`);
  assert.ok(candidate.startsWith(`${PUBLIC}${path.sep}`), `asset escapes public/: ${url}`);
  assert.ok(fs.existsSync(candidate), `delivered asset is missing: ${url}`);
  return candidate;
}

const baked = readJson(path.join(PUBLIC, "rescueworld-log.json"));
const certificate = readJson(path.join(RUN, "certificate.json"));
const sealedEvents = fs.readFileSync(path.join(RUN, "timeline.jsonl"), "utf8")
  .trimEnd().split("\n").map(JSON.parse);

assert.equal(baked.schema_version, "disaster-replay.baked-run.v1");
assert.equal(baked.scenario_id, "kumamoto-2026-full-incident");
assert.equal(baked.source?.timeline_sha256, certificate.timeline_sha256);
assert.equal(baked.events?.length, 414);
assert.deepEqual(baked.events, sealedEvents, "the viewer changed or reordered a sealed event");

const decisions = baked.events.filter((event) => event.type === "DECISION_PROPOSED");
const earthquakes = baked.events.filter((event) => event.payload?.earthquake);
const bulletins = baked.events.filter((event) => event.payload?.report_id);
assert.equal(decisions.length, 11);
assert.equal(earthquakes.length, 300);
assert.equal(bulletins.length, 7);
assert.equal(decisions.reduce((sum, event) =>
  sum + event.payload.full_incident_demonstration.choices.length, 0), 264);
assert.equal(decisions.reduce((sum, event) =>
  sum + (event.payload.registered_five_slot_experiment?.choices.length ?? 0), 0), 120);

for (const url of Object.values(baked.world_features ?? {})) {
  if (typeof url === "string" && url.startsWith("/")) publicFile(url);
}
for (const url of Object.values(baked.context_features ?? {})) {
  if (typeof url === "string" && url.startsWith("/")) publicFile(url);
}

const terrainUrl = baked.world_features?.terrain_dem_png;
const terrainMeta = readJson(publicFile(baked.world_features?.terrain_dem_metadata));
assert.equal(terrainMeta.output_sha256, sha256(fs.readFileSync(publicFile(terrainUrl))));
assert.deepEqual(terrainMeta.output_pixels, [1414, 1366]);
assert.equal(terrainMeta.replay_geometry?.event_count, 414);

const result = readJson(path.join(ROOT, "experiment/results/production-analysis.json"));
assert.equal(result.arms?.plain_summary?.fully_valid, 0);
assert.equal(result.arms?.evidence_table?.fully_valid, 17);
assert.equal(result.arms?.evidence_feedback?.fully_valid, 34);

console.log("PASS: the viewer is byte-for-byte aligned with the sealed 414-event timeline.");
console.log("PASS: all delivered terrain and context assets exist and the terrain hash matches.");
console.log("PASS: the package carries 11 decision moments, 120 registered choices, and the 0/17/34 aggregate.");
