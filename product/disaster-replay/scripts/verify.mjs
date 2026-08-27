import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReplay, canonicalJson, sha256, timelineJsonl } from "./build-replay.mjs";
import { assertCanonicalRunIdentity } from "./run-identity.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const SAMPLE = path.join(PACKAGE, "samples", "kumamoto-2026.exercise.replay.json");
const INPUTS = path.join(PACKAGE, "scenarios", "kumamoto-2026", "exercise-inputs.json");
const HAZARDS = path.join(PACKAGE, "data", "gsi-2026-kumamoto-landslides.geojson");
const ROADS = path.join(PACKAGE, "data", "mlit-2026-kumamoto-road-restrictions.geojson");
const JMA_UPDATES = path.join(PACKAGE, "data", "jma-2026-kumamoto-official-updates.json");
const SHELTERS = path.join(PACKAGE, "data", "gsi-uki-designated-shelters.geojson");
const TERRAIN = path.join(PACKAGE, "data", "gsi-dem10b-z11-kumamoto.png");
const TERRAIN_META = path.join(PACKAGE, "data", "gsi-dem10b-z11-kumamoto.meta.json");
const PLATEAU_FOCUS = path.join(PACKAGE, "data", "plateau-uki-2025-focus");
const RUN = path.join(PACKAGE, "runs", "kumamoto-2026", "260728");
const SCHEMAS = [
  path.join(PACKAGE, "schemas", "scenario.schema.json"),
  path.join(PACKAGE, "schemas", "replay-event.schema.json"),
  path.join(PACKAGE, "schemas", "replay-bundle.schema.json")
];

for (const schemaPath of SCHEMAS) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
}

const stored = JSON.parse(fs.readFileSync(SAMPLE, "utf8"));
const exerciseInputs = JSON.parse(fs.readFileSync(INPUTS, "utf8"));
const rebuilt = buildReplay();
assert.deepEqual(stored, rebuilt, "stored replay must rebuild byte-for-byte from local frozen inputs");

assert.equal(stored.schema_version, "disaster-replay.bundle.v1");
assert.equal(stored.scenario.incident.magnitude, 7.1, "current JMA magnitude must be preserved");
assert.equal(stored.scenario.incident.maximum_intensity, "JMA 7");
assert.equal(stored.scenario.exercise.synthetic, true);
assert.match(stored.scenario.disclosure, /synthetic exercise data/i);

const hazardsBuffer = fs.readFileSync(HAZARDS);
const hazards = JSON.parse(hazardsBuffer);
assert.equal(hazards.features.length, 35, "normalized GSI layer must preserve all 35 landslide polygons");
assert.equal(stored.source_data_sha256_by_id["gsi-kumamoto-2026-landslides"], sha256(hazardsBuffer));
assert.equal(hazards.source.source_zip_sha256, "8133f7cb714990cc5b9fe6bfb10fb991009a413569a4468b3ffe8686c0532531");
const featureIds = new Set(hazards.features.map((feature) => feature.id));
for (const target of stored.scenario.exercise.target_feature_ids) assert.ok(featureIds.has(target));

const roadsBuffer = fs.readFileSync(ROADS);
const roads = JSON.parse(roadsBuffer);
assert.equal(roads.features.length, 29, "normalized MLIT snapshot must preserve all 29 road restrictions");
assert.equal(stored.source_data_sha256_by_id["mlit-kumamoto-2026-passable-map-0729-1200"], sha256(roadsBuffer));
assert.equal(roads.source.source_zip_sha256, "8dd8cf569879e68ae392ba6b4e26263d1f3ba8c758b09d85dcad6cfae8b62d84");

const jmaUpdatesBuffer = fs.readFileSync(JMA_UPDATES);
const jmaUpdates = JSON.parse(jmaUpdatesBuffer);
const jmaSource = stored.scenario.data_sources.find((source) => source.source_id === "jma-kumamoto-2026-official-updates");
assert.equal(jmaUpdates.updates.length, 7);
assert.equal(jmaUpdates.station_count, 1248);
assert.equal(jmaUpdates.stations.length, 1248);
assert.equal(jmaUpdates.stations[0].name, "宇城市豊野町＊");
assert.equal(stored.source_data_sha256_by_id["jma-kumamoto-2026-official-updates"], sha256(jmaUpdatesBuffer));

const sheltersBuffer = fs.readFileSync(SHELTERS);
const shelters = JSON.parse(sheltersBuffer);
const shelterSource = stored.scenario.data_sources.find((source) => source.source_id === "gsi-uki-designated-shelters");
assert.equal(shelters.features.length, 92);
assert.equal(shelters.designation_record_count, shelters.features.length);
assert.equal(shelters.unique_location_count, 56);
assert.equal(new Set(shelters.features.map((feature) => JSON.stringify(feature.geometry.coordinates))).size, shelters.unique_location_count);
assert.equal(shelters.features.filter((feature) => feature.properties.designation === "DESIGNATED_SHELTER").length, 45);
assert.equal(shelters.features.filter((feature) => feature.properties.designation === "EARTHQUAKE_EVACUATION_PLACE").length, 47);
assert.ok(shelters.features.every((feature) => feature.properties.event_status === "DESIGNATED_ONLY_UNKNOWN_EVENT_STATUS"));
assert.equal(stored.source_data_sha256_by_id["gsi-uki-designated-shelters"], sha256(sheltersBuffer));
assert.equal(shelterSource.sha256, sha256(sheltersBuffer), "scenario shelter hash must match the bundled normalized layer");
assert.equal(jmaSource.sha256, sha256(jmaUpdatesBuffer), "scenario JMA hash must match the bundled normalized feed");
assert.equal(jmaSource.archive_bytes, jmaUpdatesBuffer.length, "scenario JMA byte count must match the bundled normalized feed");

const terrainBuffer = fs.readFileSync(TERRAIN);
const terrainMeta = JSON.parse(fs.readFileSync(TERRAIN_META, "utf8"));
const terrainSource = stored.scenario.data_sources.find((source) => source.source_id === "gsi-dem-tiles");
assert.deepEqual(terrainMeta.output_pixels, [612, 917]);
assert.equal(terrainMeta.xyz_tiles.length, 12);
assert.equal(terrainMeta.xyz_tiles.reduce((sum, tile) => sum + tile.bytes, 0), 1198792);
assert.equal(terrainMeta.output_bytes, terrainBuffer.length);
assert.equal(terrainMeta.output_sha256, sha256(terrainBuffer));
assert.equal(stored.source_data_sha256_by_id["gsi-dem-tiles"], sha256(terrainBuffer));
assert.equal(stored.source_data_sha256_by_id["gsi-dem-tiles-metadata"], sha256(fs.readFileSync(TERRAIN_META)));
assert.equal(terrainSource.sha256, sha256(terrainBuffer), "scenario terrain hash must match the bundled image");
assert.equal(terrainSource.archive_bytes, terrainBuffer.length, "scenario terrain byte count must match the bundled image");
assert.equal(stored.scenario.world_features.terrain_dem_png, "data/gsi-dem10b-z11-kumamoto.png");

const plateauMetaPath = path.join(PLATEAU_FOCUS, "metadata.json");
const plateauTilesetPath = path.join(PLATEAU_FOCUS, "tileset.json");
const plateauMeta = JSON.parse(fs.readFileSync(plateauMetaPath, "utf8"));
const plateauTileset = JSON.parse(fs.readFileSync(plateauTilesetPath, "utf8"));
const plateauSource = stored.scenario.data_sources.find((source) => source.source_id === "plateau-uki-2025-3d");
assert.equal(plateauMeta.content_count, 9);
assert.equal(plateauMeta.content_bytes, 3768764);
assert.equal(plateauMeta.source.archive_sha256, "d271ce2a6e0e337cd7d8e913ee498832e7719e3cd86fa006c84036346c8385a8");
assert.equal(plateauSource.sha256, plateauMeta.source.archive_sha256, "scenario PLATEAU hash must match the acquired archive");
assert.equal(plateauSource.archive_bytes, plateauMeta.source.archive_bytes, "scenario PLATEAU byte count must match the acquired archive");
assert.equal(plateauTileset.root.children.length, plateauMeta.content_count);
assert.equal(stored.source_data_sha256_by_id["plateau-uki-2025-3d-manifest"], sha256(fs.readFileSync(plateauMetaPath)));
assert.equal(stored.source_data_sha256_by_id["plateau-uki-2025-3d-tileset"], sha256(fs.readFileSync(plateauTilesetPath)));
assert.equal(stored.scenario.world_features.building_tileset, "data/plateau-uki-2025-focus/tileset.json");
for (const content of plateauMeta.contents) {
  const bytes = fs.readFileSync(path.join(PLATEAU_FOCUS, content.uri));
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "b3dm", `${content.uri} must be a b3dm tile`);
  assert.equal(bytes.readUInt32LE(4), 1, `${content.uri} must use b3dm version 1`);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `${content.uri} header length must match file length`);
  assert.equal(bytes.length, content.bytes);
  assert.equal(sha256(bytes), content.sha256);
}

assert.equal(stored.events.length, 81);
assert.equal(stored.replay_certificate.event_count, stored.events.length);
assert.equal(stored.replay_certificate.scenario_sha256, stored.scenario_sha256);
assert.deepEqual(stored.replay_certificate.source_data_sha256_by_id, stored.source_data_sha256_by_id);
assert.equal(stored.replay_certificate.timeline_sha256, sha256(timelineJsonl(stored.events)));
assertCanonicalRunIdentity(stored, exerciseInputs);
assert.deepEqual(stored.replay_certificate.run_identity.equality_keys, {
  scenario_basis_sha256: "aecad03969b0efca4b7b3af12b5c77b24d3a009a91bd0a97e0788cde4a456857",
  observation_set_sha256: "effda5912392bc162740d5784d3372f029d9ac246d1c3115eb4c98fae9b50a6c",
  resources_sha256: "81f3a5dc71065efd3939c82a09590b84890e92b5a058d4145f45419fcb1d909f",
  decision_slots_sha256: "ccac2c1a1786b897f111b82e79dda4ccf780ccd319acc67925a7cf9deb2dbe76"
});
assert.equal(stored.events[0].previous_event_sha256, "0".repeat(64));
const eventIds = new Set();
const lastSimTimeByArm = new Map();
for (let index = 0; index < stored.events.length; index += 1) {
  const event = stored.events[index];
  assert.equal(event.sequence, index);
  assert.ok(event.sim_time_s >= (lastSimTimeByArm.get(event.arm) ?? 0), `simulation time moved backward inside ${event.arm}`);
  lastSimTimeByArm.set(event.arm, event.sim_time_s);
  assert.ok(!eventIds.has(event.event_id), `duplicate event ID ${event.event_id}`);
  eventIds.add(event.event_id);
  if (index > 0) assert.equal(event.previous_event_sha256, stored.events[index - 1].event_sha256);
  const { event_sha256: actualHash, ...hashInput } = event;
  assert.equal(actualHash, sha256(canonicalJson(hashInput)), `bad event hash at sequence ${index}`);
  for (const cause of event.caused_by) assert.ok(eventIds.has(cause), `${event.event_id} cites a future or missing cause ${cause}`);
  if (event.provenance.classification === "DERIVED_DETERMINISTIC") {
    assert.deepEqual(event.provenance.input_classifications, ["SYNTHETIC_EXERCISE"]);
  }
}
assert.equal(stored.replay_certificate.terminal_event_sha256, stored.events.at(-1).event_sha256);

const exerciseSourceEvents = stored.events.filter((event) => event.type === "SOURCE_INGESTED" && event.payload.observation_id);
assert.equal(exerciseSourceEvents.length, 8);
assert.ok(exerciseSourceEvents.every((event) => event.provenance.classification === "SYNTHETIC_EXERCISE"));
const realRoadEvents = stored.events.filter((event) => event.payload.restriction_id);
const expectedTimedRoadIds = [
  ...Array.from({ length: 16 }, (_, index) => `mlit-2026-kumamoto-road-restriction-${String(index + 1).padStart(3, "0")}`),
  "mlit-2026-kumamoto-road-restriction-023",
  "mlit-2026-kumamoto-road-restriction-024",
  "mlit-2026-kumamoto-road-restriction-025",
  "mlit-2026-kumamoto-road-restriction-026",
  "mlit-2026-kumamoto-road-restriction-027",
  "mlit-2026-kumamoto-road-restriction-028",
  "mlit-2026-kumamoto-road-restriction-029"
];
const expectedUntimedRoadIds = Array.from(
  { length: 6 },
  (_, index) => `mlit-2026-kumamoto-road-restriction-${String(index + 17).padStart(3, "0")}`
);
assert.deepEqual(realRoadEvents.map((event) => event.payload.restriction_id).sort(), expectedTimedRoadIds);
assert.deepEqual(
  roads.features.filter((feature) => (feature.properties.restriction_started_at ?? null) === null).map((feature) => feature.id).sort(),
  expectedUntimedRoadIds
);
assert.equal(realRoadEvents.length, 23, "the replay must carry every restriction with a reported start minute");
assert.ok(realRoadEvents.every((event) => event.provenance.classification === "OBSERVED_PUBLIC" && event.geometry?.type === "LineString"));
assert.ok(realRoadEvents.every((event) => event.temporal?.basis === "SOURCE_FIELD_RECONSTRUCTED_FROM_SNAPSHOT"));
assert.ok(realRoadEvents.every((event) => event.temporal?.precision === "MINUTE"));
assert.ok(realRoadEvents.every((event) => event.temporal?.available_at === roads.source.snapshot_at));
assert.equal(stored.events.filter((event) => event.provenance.classification === "RECORDED_MODEL_OUTPUT").length, 0);

const officialUpdateEvents = stored.events.filter((event) => event.actor.id === "jma-kumamoto-2026-official-updates");
assert.equal(officialUpdateEvents.length, 7);
assert.deepEqual(officialUpdateEvents.map((event) => event.payload.report_id), jmaUpdates.updates.map((update) => update.report_id));
assert.ok(officialUpdateEvents.every((event) => event.temporal?.basis === "OFFICIAL_REPORT_TIME"));
assert.ok(officialUpdateEvents.every((event) => event.temporal?.available_at === event.payload.report_datetime));
const shelterLayerEvents = stored.events.filter((event) => event.actor.id === "gsi-uki-designated-shelters");
assert.equal(shelterLayerEvents.length, 1);
assert.equal(shelterLayerEvents[0].payload.designation_record_count, 92);
assert.equal(shelterLayerEvents[0].payload.unique_location_count, 56);
assert.equal(shelterLayerEvents[0].payload.event_status, "DESIGNATED_ONLY_UNKNOWN_EVENT_STATUS");

assert.equal(stored.scenario.metrics.length, 3);
assert.ok(stored.scenario.metrics.every((metric) => metric.scope === "SYNTHETIC_EXERCISE" && metric.formula));
assert.equal(stored.events.filter((event) => event.type === "METRIC_UPDATED").length, 6);
assert.equal(stored.events.filter((event) => event.type === "DECISION_PROPOSED").length, 2);
assert.equal(stored.events.filter((event) => event.type === "RESOURCE_DISPATCHED").length, 4);
assert.equal(stored.events.filter((event) => event.type === "CLAIM_STATE_CHANGED" && event.arm === "PLAIN_GRAPH").length, 4);
assert.equal(stored.events.filter((event) => event.type === "CLAIM_STATE_CHANGED" && event.arm === "EVIDENCE_GRAPH").length, 5);

const expectedMetrics = {
  PLAIN_GRAPH: {
    exercise_people_reached: 60,
    dispatches_on_rejected_claim_versions: 1,
    decision_source_coverage: 0.5
  },
  EVIDENCE_GRAPH: {
    exercise_people_reached: 77,
    dispatches_on_rejected_claim_versions: 0,
    decision_source_coverage: 1
  }
};
for (const [arm, metrics] of Object.entries(expectedMetrics)) {
  assert.deepEqual(stored.final_state_by_arm[arm].metrics, metrics);
  assert.equal(
    stored.replay_certificate.final_state_sha256_by_arm[arm],
    sha256(canonicalJson(stored.final_state_by_arm[arm]))
  );
}

const treatment = stored.final_state_by_arm.EVIDENCE_GRAPH;
const treatmentClaims = new Map(Object.values(treatment.claims).map((claim) => [claim.claim_version_id, claim]));
for (const dispatch of treatment.dispatches) {
  assert.equal(treatmentClaims.get(dispatch.authorizing_claim_version_id)?.verdict, "SUPPORTED");
}
const idempotencyKeys = stored.events
  .filter((event) => event.type === "RESOURCE_DISPATCHED")
  .map((event) => event.payload.idempotency_key);
assert.equal(new Set(idempotencyKeys).size, idempotencyKeys.length, "dispatch idempotency keys must be unique");

assert.deepEqual(JSON.parse(fs.readFileSync(path.join(RUN, "scenario.json"), "utf8")), stored.scenario);
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(RUN, "final-state.json"), "utf8")), stored.final_state_by_arm);
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(RUN, "certificate.json"), "utf8")), stored.replay_certificate);
const runTimelineText = fs.readFileSync(path.join(RUN, "timeline.jsonl"), "utf8");
assert.equal(runTimelineText, timelineJsonl(stored.events), "run timeline must be the canonical JSONL encoding");
assert.deepEqual(runTimelineText.trimEnd().split("\n").map(JSON.parse), stored.events);

console.log("PASS: 3 schemas parse; 4 canonical equality keys pair 2 run arms; 7 real JMA report updates and 1,248 station readings; 35 real GSI polygons; all 29 MLIT restrictions preserved (23 timed, 6 snapshot-only); 92 shelter/evacuation designations at 56 unique locations; 612x917 real terrain; 9 PLATEAU building tiles; 8 disclosed synthetic reports; 81 hash-linked events replay byte-identically.");
console.log("LOCAL DEMO ONLY: plain graph 60 versus evidence graph 77 simulated people; this is not a new benchmark result.");
