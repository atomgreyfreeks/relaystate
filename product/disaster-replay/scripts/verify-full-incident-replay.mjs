import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  RUN_DIR,
  buildFullIncidentReplay,
  canonicalJson,
  fileSha256,
  sha256,
  timelineJsonl,
} from "./build-full-incident-replay.mjs";

const readJson = (candidate) => JSON.parse(fs.readFileSync(candidate, "utf8"));
const storedScenario = readJson(path.join(RUN_DIR, "scenario.json"));
const storedFinalState = readJson(path.join(RUN_DIR, "final-state.json"));
const storedCertificate = readJson(path.join(RUN_DIR, "certificate.json"));
const storedTimelineText = fs.readFileSync(path.join(RUN_DIR, "timeline.jsonl"), "utf8");
const storedEvents = storedTimelineText.trimEnd().split("\n").map(JSON.parse);
const rebuilt = buildFullIncidentReplay({ write: false });

assert.deepEqual(storedScenario, rebuilt.scenario, "stored scenario must rebuild byte-identically");
assert.deepEqual(storedFinalState, rebuilt.finalState, "stored final state must rebuild byte-identically");
assert.deepEqual(storedCertificate, rebuilt.certificate, "stored certificate must rebuild byte-identically");
assert.equal(storedTimelineText, rebuilt.timelineText, "stored timeline must rebuild byte-identically");
assert.equal(storedTimelineText, timelineJsonl(storedEvents), "timeline must use canonical JSONL");

assert.equal(storedScenario.schema_version, "kumamoto-full-incident.replay-scenario.v1");
assert.equal(storedScenario.incident.occurred_at, "2026-07-28T16:27:15.200+09:00");
assert.equal(storedScenario.incident.ends_at, "2026-07-31T16:27:15.200+09:00");
assert.deepEqual(storedScenario.acts.map((act) => act.label), ["Hour one", "The first night", "Day two: the water crisis", "The turn"]);
assert.equal(storedScenario.decisions.slot_count, 11);
assert.deepEqual(storedScenario.decisions.graphs, ["plain_summary", "evidence_table", "evidence_feedback"]);
assert.equal(storedScenario.decisions.full_incident_claim_boundary, "DESCRIPTIVE_ONLY_NO_REGISTERED_CLAIMS");
assert.deepEqual(storedScenario.world_features, {
  earthquake_sequence: "data/full-incident/jma-2026-kumamoto-earthquake-sequence.json",
  official_mainshock_updates: "data/jma-2026-kumamoto-official-updates.json",
  road_restrictions: "data/mlit-2026-kumamoto-road-restrictions.geojson",
  landslide_interpretation: "data/gsi-2026-kumamoto-landslides.geojson",
  terrain_dem_png: "data/full-incident/gsi-dem10b-z11-full-incident.png",
  terrain_dem_metadata: "data/full-incident/gsi-dem10b-z11-full-incident.meta.json",
});

const sourceIds = new Set(storedScenario.source_catalog.map((source) => source.source_id));
const eventIds = new Set();
let previous = "0".repeat(64);
let lastSimTime = -1;
for (const [index, event] of storedEvents.entries()) {
  assert.equal(event.schema_version, "disaster-replay.event.v1");
  assert.equal(event.sequence, index);
  assert.equal(event.arm, "SHARED");
  assert.ok(event.sim_time_s >= lastSimTime, `time moved backward at ${event.event_id}`);
  lastSimTime = event.sim_time_s;
  assert.equal(event.previous_event_sha256, previous);
  const { event_sha256: actual, ...hashInput } = event;
  assert.equal(actual, sha256(canonicalJson(hashInput)), `bad hash ${event.event_id}`);
  assert.ok(!eventIds.has(event.event_id), `duplicate event ID ${event.event_id}`);
  eventIds.add(event.event_id);
  for (const cause of event.caused_by) assert.ok(eventIds.has(cause), `future or missing cause ${cause}`);
  assert.ok(event.provenance.source_ids.length > 0, `unsourced event ${event.event_id}`);
  for (const sourceId of event.provenance.source_ids) assert.ok(sourceIds.has(sourceId), `unknown source ${sourceId}`);
  assert.notEqual(event.provenance.classification, "SYNTHETIC_EXERCISE");
  assert.ok(!event.provenance.input_classifications.includes("SYNTHETIC_EXERCISE"));
  assert.ok(event.payload.story?.act_id, `event lacks story metadata ${event.event_id}`);
  previous = event.event_sha256;
}
assert.equal(storedEvents[0].type, "WORLD_INITIALIZED");
assert.equal(storedEvents[0].sim_time_s, 0);
assert.equal(storedEvents.at(-1).sim_time_s, 72 * 60 * 60);
assert.equal(storedCertificate.terminal_event_sha256, storedEvents.at(-1).event_sha256);

const bulletins = storedEvents.filter((event) => event.payload.report_id);
assert.equal(bulletins.length, 7);
assert.deepEqual(bulletins.map((event) => event.payload.published_at_exact), [
  "2026-07-28T16:28:48+09:00",
  "2026-07-28T16:29:03+09:00",
  "2026-07-28T16:30:03+09:00",
  "2026-07-28T16:31:03+09:00",
  "2026-07-28T16:31:48+09:00",
  "2026-07-28T16:35:28+09:00",
  "2026-07-28T20:30:23+09:00",
]);
assert.equal(storedEvents.filter((event) => event.payload.earthquake).length, 300);
assert.equal(storedEvents.filter((event) => event.payload.restriction_id).length, 23);
assert.equal(storedFinalState.road_snapshot_only_restrictions, 6);

const decisions = storedEvents.filter((event) => event.type === "DECISION_PROPOSED");
assert.equal(decisions.length, 11);
assert.equal(decisions.reduce((sum, event) => sum + event.payload.full_incident_demonstration.choices.length, 0), 264);
assert.equal(decisions.reduce((sum, event) => sum + (event.payload.registered_five_slot_experiment?.choices.length ?? 0), 0), 120);
assert.equal(decisions.filter((event) => event.payload.registered_five_slot_experiment).length, 5);
for (const event of decisions) {
  assert.equal(event.payload.full_incident_demonstration.choices.length, 24);
  assert.deepEqual([...new Set(event.payload.full_incident_demonstration.choices.map((choice) => choice.graph_id))].sort(), ["evidence_feedback", "evidence_table", "plain_summary"]);
  assert.deepEqual(event.payload.registered_claims, []);
  assert.equal(event.provenance.classification, "RECORDED_MODEL_OUTPUT");
}

const shelterMilestones = storedEvents.filter((event) => /shelter/.test(event.payload.milestone_id ?? ""));
assert.ok(shelterMilestones.length >= 5);
for (const event of shelterMilestones.filter((row) => row.payload.values.occupants)) {
  assert.equal(event.payload.values.scope, "PREFECTURE_AGGREGATE");
}
assert.deepEqual(storedFinalState.named_water_municipalities, ["Uki", "Yatsushiro", "Hikawa", "Kashima", "Uto", "Nishihara", "Mifune", "Kamiamakusa"]);
assert.deepEqual(storedFinalState.later_observed_outcome_not_available_to_agents.named_municipalities, {
  Yatsushiro: 20, Kashima: 7, Hikawa: 5, Uki: 3, Kosa: 1,
});

assert.equal(storedCertificate.event_count, storedEvents.length);
assert.equal(storedCertificate.scenario_sha256, sha256(canonicalJson(storedScenario)));
assert.equal(storedCertificate.timeline_sha256, sha256(storedTimelineText));
assert.equal(storedCertificate.final_state_sha256, sha256(canonicalJson(storedFinalState)));
const { certificate_hash: actualCertificateHash, ...certificateHashInput } = storedCertificate;
assert.equal(actualCertificateHash, sha256(canonicalJson(certificateHashInput)));
for (const [artifact, expectedHash] of Object.entries(storedCertificate.source_data_sha256_by_path)) {
  assert.equal(fileSha256(path.join(ROOT, artifact)), expectedHash, `source artifact changed: ${artifact}`);
}
assert.deepEqual(storedCertificate.source_data_sha256_by_id, storedScenario.source_data_sha256_by_id);
assert.deepEqual(storedFinalState.source_data_sha256_by_id, storedScenario.source_data_sha256_by_id);
for (const [id, expectedHash] of Object.entries(storedCertificate.source_data_sha256_by_id)) {
  assert.ok(Object.values(storedCertificate.source_data_sha256_by_path).includes(expectedHash),
    `source ID ${id} does not mirror a certified artifact hash`);
}

assert.equal(storedEvents.filter((event) => event.payload.milestone_id).length, 68);
assert.deepEqual(
  storedEvents.find((event) => event.payload.milestone_id === "kashima-kosa-intensity-gap-163528")?.payload.values.municipalities,
  ["Kashima Town", "Kōsa Town"],
);

console.log(`PASS: ${storedEvents.length} immutable events cover the exact first 72 hours: 7 JMA bulletins, 300 aftershocks, 23 timed roads plus 6 snapshot-only roads, 68 response milestones, and 11 decision moments.`);
console.log("PASS: 264 descriptive three-graph demonstration choices and 120 registered five-slot choices retain cell certificates; all events are sourced, aggregate caveats survive, and the four run artifacts rebuild byte-identically.");
