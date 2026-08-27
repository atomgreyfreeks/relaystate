import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const scenarioPath = path.join(root, "product/disaster-replay/scenarios/kumamoto-2026-real-response/scenario.json");
const schemaPath = path.join(root, "product/disaster-replay/schemas/real-response-scenario.schema.json");

const scenario = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const SHA256 = /^[a-f0-9]{64}$/;

function indexUnique(rows, key, label) {
  assert.ok(Array.isArray(rows) && rows.length > 0, `${label} must be a non-empty array`);
  const index = new Map();
  for (const [position, row] of rows.entries()) {
    assert.ok(row && typeof row === "object" && !Array.isArray(row), `${label}[${position}] must be an object`);
    const id = row[key];
    assert.equal(typeof id, "string", `${label}[${position}].${key} must be a string`);
    assert.ok(id.length > 0, `${label}[${position}].${key} must not be empty`);
    assert.ok(!index.has(id), `duplicate ${label} ID ${id}`);
    index.set(id, row);
  }
  return index;
}

function assertTimestamp(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.match(value, ISO_WITH_OFFSET, `${label} must be an ISO timestamp with an explicit offset`);
  const millis = Date.parse(value);
  assert.ok(Number.isFinite(millis), `${label} must parse as a date`);
  return millis;
}

function assertStringSet(values, label, { allowEmpty = false } = {}) {
  assert.ok(Array.isArray(values), `${label} must be an array`);
  if (!allowEmpty) assert.ok(values.length > 0, `${label} must not be empty`);
  const set = new Set();
  for (const value of values) {
    assert.equal(typeof value, "string", `${label} values must be strings`);
    assert.ok(value.length > 0, `${label} values must not be empty`);
    assert.ok(!set.has(value), `duplicate ${label} value ${value}`);
    set.add(value);
  }
  return set;
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
  }
  return value;
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(sorted(value))).digest("hex");
}

assert.equal(scenario.schema_version, "disaster-decision.real-response-scenario.v1");
assert.equal(scenario.incident.timezone, "Asia/Tokyo");
assertTimestamp(scenario.incident.occurred_at, "incident.occurred_at");

const sources = indexUnique(scenario.sources, "source_id", "sources");
const observations = indexUnique(scenario.observations, "observation_id", "observations");
const unknowns = indexUnique(scenario.unknowns, "unknown_id", "unknowns");
const targets = indexUnique(scenario.targets, "target_id", "targets");
const resources = indexUnique(scenario.resources, "resource_id", "resources");
const slots = indexUnique(scenario.decision_slots, "decision_slot_id", "decision_slots");
const methods = indexUnique(scenario.graph_methods, "method_id", "graph_methods");

assert.ok(sources.has(scenario.incident.event_source_id), "incident event source is unknown");
for (const source of sources.values()) {
  assert.doesNotThrow(() => new URL(source.url), `${source.source_id} has an invalid URL`);
  if (source.sha256 !== null && source.sha256 !== undefined) assert.match(source.sha256, SHA256, `${source.source_id} has an invalid SHA-256`);
}

for (const observation of observations.values()) {
  assertTimestamp(observation.available_at, `${observation.observation_id}.available_at`);
  const sourceIds = assertStringSet(observation.source_ids, `${observation.observation_id}.source_ids`, { allowEmpty: true });
  if (observation.classification === "RECONSTRUCTED_ASSUMPTION") {
    assert.equal(observation.availability_basis, "RECONSTRUCTED_ASSUMPTION");
  } else {
    assert.ok(sourceIds.size > 0, `${observation.observation_id} must cite a source`);
  }
  for (const sourceId of sourceIds) assert.ok(sources.has(sourceId), `${observation.observation_id} cites unknown source ${sourceId}`);
  for (const targetId of assertStringSet(observation.subjects, `${observation.observation_id}.subjects`)) {
    assert.ok(targets.has(targetId), `${observation.observation_id} cites unknown subject ${targetId}`);
  }
}

for (const resource of resources.values()) {
  assert.ok(Number.isInteger(resource.capacity) && resource.capacity > 0, `${resource.resource_id} has invalid capacity`);
  if (resource.observed_mobilized_at !== null) assertTimestamp(resource.observed_mobilized_at, `${resource.resource_id}.observed_mobilized_at`);
  if (resource.classification === "MODELED_DECISION_CAPACITY") {
    assert.match(resource.availability_note, /[Mm]odeled/, `${resource.resource_id} must disclose that it is modeled`);
  }
}

assert.deepEqual(
  [...slots.values()].map((slot) => slot.reconstruction_slot_number).sort((a, b) => a - b),
  [1, 2, 4, 6, 9],
  "the first run must contain exactly reconstructed slots 1, 2, 4, 6 and 9"
);

for (const slot of slots.values()) {
  const cutoff = assertTimestamp(slot.cutoff_at, `${slot.decision_slot_id}.cutoff_at`);
  const visibleIds = assertStringSet(slot.visible_observation_ids, `${slot.decision_slot_id}.visible_observation_ids`);
  const resourceIds = assertStringSet(slot.eligible_resource_ids, `${slot.decision_slot_id}.eligible_resource_ids`);
  const targetIds = assertStringSet(slot.eligible_target_ids, `${slot.decision_slot_id}.eligible_target_ids`);
  const unknownIds = assertStringSet(slot.required_unknown_ids, `${slot.decision_slot_id}.required_unknown_ids`);
  const forbiddenIds = assertStringSet(slot.forbidden_hindsight_observation_ids, `${slot.decision_slot_id}.forbidden_hindsight_observation_ids`);

  for (const observationId of visibleIds) {
    const observation = observations.get(observationId);
    assert.ok(observation, `${slot.decision_slot_id} exposes unknown observation ${observationId}`);
    assert.ok(assertTimestamp(observation.available_at, `${observationId}.available_at`) <= cutoff,
      `${slot.decision_slot_id} exposes ${observationId} after its cutoff`);
    assert.notEqual(observation.classification, "LATER_OUTCOME", `${slot.decision_slot_id} exposes later outcome ${observationId}`);
    assert.ok(!forbiddenIds.has(observationId), `${slot.decision_slot_id} both exposes and forbids ${observationId}`);
  }
  for (const observationId of forbiddenIds) assert.ok(observations.has(observationId), `${slot.decision_slot_id} forbids unknown observation ${observationId}`);
  for (const resourceId of resourceIds) assert.ok(resources.has(resourceId), `${slot.decision_slot_id} cites unknown resource ${resourceId}`);
  for (const targetId of targetIds) assert.ok(targets.has(targetId), `${slot.decision_slot_id} cites unknown target ${targetId}`);
  for (const unknownId of unknownIds) assert.ok(unknowns.has(unknownId), `${slot.decision_slot_id} cites unknown unknown ${unknownId}`);

  const contract = slot.action_contract;
  assert.ok(Number.isInteger(contract.minimum_assignments) && contract.minimum_assignments >= 0,
    `${slot.decision_slot_id} has invalid minimum assignments`);
  assert.ok(Number.isInteger(contract.maximum_assignments) && contract.maximum_assignments >= contract.minimum_assignments,
    `${slot.decision_slot_id} has invalid maximum assignments`);
  assert.ok(Number.isInteger(contract.maximum_total_quantity) && contract.maximum_total_quantity >= 1,
    `${slot.decision_slot_id} has invalid quantity cap`);
  if (!contract.allow_resource_reuse) {
    assert.ok(contract.maximum_assignments <= resourceIds.size, `${slot.decision_slot_id} cannot make more unique assignments than resources`);
  }

  const historicalSources = assertStringSet(slot.historical_choice.source_ids, `${slot.decision_slot_id}.historical_choice.source_ids`);
  for (const sourceId of historicalSources) assert.ok(sources.has(sourceId), `${slot.decision_slot_id} historical choice cites unknown source ${sourceId}`);
  const historicalResourceUse = new Set();
  for (const assignment of slot.historical_choice.assignments) {
    assert.ok(resources.has(assignment.resource_id), `${slot.decision_slot_id} historical choice cites unknown resource ${assignment.resource_id}`);
    assert.ok(targets.has(assignment.target_id), `${slot.decision_slot_id} historical choice cites unknown target ${assignment.target_id}`);
    assert.ok(Number.isInteger(assignment.quantity) && assignment.quantity > 0, `${slot.decision_slot_id} historical choice has invalid quantity`);
    if (!contract.allow_resource_reuse) {
      assert.ok(!historicalResourceUse.has(assignment.resource_id), `${slot.decision_slot_id} historical choice reuses ${assignment.resource_id}`);
      historicalResourceUse.add(assignment.resource_id);
    }
  }
  assert.ok(slot.assumptions.length > 0, `${slot.decision_slot_id} must declare assumptions`);
  assert.match(slot.scoring_boundary, /[Ss]core/, `${slot.decision_slot_id} must state a scoring boundary`);
}

assert.deepEqual([...methods.keys()].sort(), ["evidence-feedback-graph-v1", "evidence-table-graph-v1", "plain-summary-graph-v1"]);
assert.equal(methods.get("plain-summary-graph-v1").model_call_budget, 4);
assert.equal(methods.get("evidence-table-graph-v1").model_call_budget, 4);
assert.equal(methods.get("evidence-feedback-graph-v1").model_call_budget, 5);
assert.match(methods.get("evidence-feedback-graph-v1").feedback_policy, /one conditional revision/i);

assert.ok(slots.get("slot-01-early-fire-mobilization").assumptions.some((line) => /mobilized later.*modeled/i.test(line)),
  "slot 1 must disclose the later-unit eligibility assumption");
assert.ok(slots.get("slot-02-missing-telemetry-triage").eligible_resource_ids.every((id) => resources.get(id).classification === "MODELED_DECISION_CAPACITY"),
  "slot 2 must use only disclosed modeled attention capacity");
assert.ok(slots.get("slot-04-first-municipal-liaisons").forbidden_hindsight_observation_ids.includes("outcome-2150-yatsushiro-liaison-added"),
  "slot 4 must forbid the later Yatsushiro liaison addition");
assert.ok(slots.get("slot-06-first-night-response-split").forbidden_hindsight_observation_ids.includes("outcome-0823-municipal-deaths"),
  "slot 6 must forbid later municipal deaths");
assert.ok(slots.get("slot-09-push-water-planning").forbidden_hindsight_observation_ids.includes("outcome-0730-water-peak"),
  "slot 9 must forbid the later water-outage peak");
assert.equal(observations.get("obs-0729-1200-water-outages").value.approximate_total_maximum_households, 84000);
assert.equal(observations.get("outcome-0730-water-peak").value, 108100);

const scenarioBasis = Object.fromEntries(Object.entries(scenario).filter(([key]) => !["observations", "resources", "decision_slots"].includes(key)));
const identity = {
  schema_version: "disaster-decision.matched-input-identity.v1",
  scenario_basis_sha256: hash(scenarioBasis),
  observation_set_sha256: hash([...observations.values()].sort((a, b) => a.observation_id.localeCompare(b.observation_id))),
  resources_sha256: hash([...resources.values()].sort((a, b) => a.resource_id.localeCompare(b.resource_id))),
  decision_slots_sha256: hash([...slots.values()].sort((a, b) => a.decision_slot_id.localeCompare(b.decision_slot_id)))
};

console.log(`PASS: ${sources.size} sources; ${observations.size} observations; ${resources.size} resources; ${slots.size} source-bounded real decision slots; 3 matched graph methods.`);
console.log(JSON.stringify(identity, null, 2));
