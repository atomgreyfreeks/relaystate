import assert from "node:assert/strict";
import crypto from "node:crypto";

export const EQUALITY_KEY_SCHEMA_VERSION = "disaster-replay.equality-key.v1";
export const RUN_IDENTITY_SCHEMA_VERSION = "disaster-replay.run-identity.v1";

export const RUN_ARMS = Object.freeze([
  Object.freeze({ arm: "PLAIN_GRAPH", runSlug: "plain-graph" }),
  Object.freeze({ arm: "EVIDENCE_GRAPH", runSlug: "evidence-graph" })
]);

const COMPONENTS = new Set(["scenario_basis", "observation_set", "resources", "decision_slots"]);
const EQUALITY_KEY_NAMES = Object.freeze([
  "scenario_basis_sha256",
  "observation_set_sha256",
  "resources_sha256",
  "decision_slots_sha256"
]);
const SLOT_SET_KEYS = new Set(["visible_observation_ids", "eligible_resource_ids", "eligible_target_ids"]);

function assertJsonValue(value, at = "$", ancestors = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${at} must be a finite JSON number`);
    return;
  }
  if (typeof value !== "object") throw new TypeError(`${at} is not a JSON value`);
  if (ancestors.has(value)) throw new TypeError(`${at} contains a cycle`);
  ancestors.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) throw new TypeError(`${at} contains a sparse array entry at ${index}`);
      assertJsonValue(value[index], `${at}[${index}]`, ancestors);
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${at} must be a plain JSON object`);
    if (Object.getOwnPropertySymbols(value).length > 0) throw new TypeError(`${at} has symbol keys`);
    for (const [key, child] of Object.entries(value)) assertJsonValue(child, `${at}.${key}`, ancestors);
  }
  ancestors.delete(value);
}

function assertUniqueIds(rows, idKey, component) {
  if (!Array.isArray(rows)) throw new TypeError(`${component} must be an array`);
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new TypeError(`${component}[${index}] must be an object`);
    const id = row[idKey];
    if (typeof id !== "string" || id.length === 0) throw new TypeError(`${component}[${index}].${idKey} must be a non-empty string`);
    if (seen.has(id)) throw new Error(`duplicate ${component} ID ${id}`);
    seen.add(id);
  }
}

function sortedUniqueStrings(values, at) {
  if (!Array.isArray(values) || values.length === 0) throw new TypeError(`${at} must be a non-empty array`);
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) throw new TypeError(`${at} values must be non-empty strings`);
    if (seen.has(value)) throw new Error(`duplicate ${at} ID ${value}`);
    seen.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

function normalizeComponent(component, value) {
  if (!COMPONENTS.has(component)) throw new Error(`unknown equality-key component ${component}`);
  assertJsonValue(value);
  if (component === "observation_set") {
    assertUniqueIds(value, "observation_id", component);
    return [...value].sort((a, b) => a.observation_id.localeCompare(b.observation_id));
  }
  if (component === "resources") {
    assertUniqueIds(value, "resource_id", component);
    return [...value].sort((a, b) => a.resource_id.localeCompare(b.resource_id));
  }
  if (component === "decision_slots") {
    assertUniqueIds(value, "decision_slot_id", component);
    return value
      .map((slot) => Object.fromEntries(Object.entries(slot).map(([key, child]) => [
        key,
        SLOT_SET_KEYS.has(key) ? sortedUniqueStrings(child, `decision_slots.${slot.decision_slot_id}.${key}`) : child
      ])))
      .sort((a, b) => a.decision_slot_id.localeCompare(b.decision_slot_id));
  }
  const normalized = structuredClone(value);
  if (Array.isArray(normalized.metrics)) {
    assertUniqueIds(normalized.metrics, "metric_id", "scenario_basis.metrics");
    normalized.metrics.sort((a, b) => a.metric_id.localeCompare(b.metric_id));
  }
  if (normalized.exercise?.target_feature_ids) {
    normalized.exercise.target_feature_ids = sortedUniqueStrings(
      normalized.exercise.target_feature_ids,
      "scenario_basis.exercise.target_feature_ids"
    );
  }
  return normalized;
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObjectKeys(value[key])]));
  }
  return value;
}

export function canonicalEqualityJson(component, value) {
  const wrapper = {
    schema_version: EQUALITY_KEY_SCHEMA_VERSION,
    component,
    value: normalizeComponent(component, value)
  };
  return JSON.stringify(sortObjectKeys(wrapper));
}

export function equalityKeySha256(component, value) {
  return crypto.createHash("sha256").update(canonicalEqualityJson(component, value)).digest("hex");
}

export function buildScenarioBasis(scenario, exerciseInputs, sourceDataSha256ById) {
  return {
    scenario_id: scenario.scenario_id,
    seed: scenario.seed,
    incident: scenario.incident,
    clock: scenario.clock,
    viewport: scenario.viewport,
    world_features: scenario.world_features,
    exercise: {
      synthetic: scenario.exercise.synthetic,
      question: scenario.exercise.question,
      exercise_id: exerciseInputs.exercise_id,
      target_feature_ids: scenario.exercise.target_feature_ids,
      truth_by_target: exerciseInputs.truth_by_target
    },
    metrics: scenario.metrics,
    reducer_version: scenario.reducer_version,
    source_data_sha256_by_id: sourceDataSha256ById
  };
}

export function computeEqualityKeys({ scenario, exerciseInputs, sourceDataSha256ById }) {
  if (!scenario.decision_slots) throw new Error("canonical run identity requires scenario.decision_slots");
  return {
    scenario_basis_sha256: equalityKeySha256(
      "scenario_basis",
      buildScenarioBasis(scenario, exerciseInputs, sourceDataSha256ById)
    ),
    observation_set_sha256: equalityKeySha256("observation_set", exerciseInputs.observations),
    resources_sha256: equalityKeySha256("resources", scenario.resources),
    decision_slots_sha256: equalityKeySha256("decision_slots", scenario.decision_slots)
  };
}

export function buildRunIdentity({ scenario, exerciseInputs, sourceDataSha256ById }) {
  return {
    schema_version: RUN_IDENTITY_SCHEMA_VERSION,
    equality_keys: computeEqualityKeys({ scenario, exerciseInputs, sourceDataSha256ById }),
    runs: RUN_ARMS.map(({ arm, runSlug }) => ({
      run_id: `${scenario.scenario_id}:${scenario.seed}:${runSlug}:v1`,
      arm
    }))
  };
}

function assertSlotSemantics(scenario, exerciseInputs) {
  const observations = new Map();
  assertUniqueIds(exerciseInputs.observations, "observation_id", "observation_set");
  for (const observation of exerciseInputs.observations) observations.set(observation.observation_id, observation);
  const resources = new Set();
  assertUniqueIds(scenario.resources, "resource_id", "resources");
  for (const resource of scenario.resources) resources.add(resource.resource_id);
  const targets = new Set(sortedUniqueStrings(scenario.exercise.target_feature_ids, "scenario.exercise.target_feature_ids"));
  const slots = new Map();
  assertUniqueIds(scenario.decision_slots, "decision_slot_id", "decision_slots");
  for (const slot of scenario.decision_slots) {
    assert.equal(slot.decision_type, "SCARCE_RESOURCE_ALLOCATION", `${slot.decision_slot_id} has an unsupported decision type`);
    assert.ok(Number.isInteger(slot.information_cutoff_sim_time_s) && slot.information_cutoff_sim_time_s >= 0,
      `${slot.decision_slot_id} has an invalid information cutoff`);
    assert.ok(Number.isInteger(slot.selection_count) && slot.selection_count >= 1,
      `${slot.decision_slot_id} has an invalid selection count`);
    for (const observationId of sortedUniqueStrings(slot.visible_observation_ids, `${slot.decision_slot_id}.visible_observation_ids`)) {
      const observation = observations.get(observationId);
      assert.ok(observation, `${slot.decision_slot_id} cites unknown observation ${observationId}`);
      assert.ok(observation.step * scenario.clock.step_seconds <= slot.information_cutoff_sim_time_s,
        `${slot.decision_slot_id} exposes ${observationId} after its information cutoff`);
    }
    for (const resourceId of sortedUniqueStrings(slot.eligible_resource_ids, `${slot.decision_slot_id}.eligible_resource_ids`)) {
      assert.ok(resources.has(resourceId), `${slot.decision_slot_id} cites unknown resource ${resourceId}`);
    }
    for (const targetId of sortedUniqueStrings(slot.eligible_target_ids, `${slot.decision_slot_id}.eligible_target_ids`)) {
      assert.ok(targets.has(targetId), `${slot.decision_slot_id} cites unknown target ${targetId}`);
    }
    assert.ok(slot.selection_count <= slot.eligible_resource_ids.length,
      `${slot.decision_slot_id} selects more resources than are eligible`);
    assert.ok(slot.selection_count <= slot.eligible_target_ids.length,
      `${slot.decision_slot_id} selects more targets than are eligible`);
    slots.set(slot.decision_slot_id, slot);
  }
  return slots;
}

export function assertCanonicalRunIdentity(replay, exerciseInputs) {
  assert.ok(replay?.scenario, "canonical run identity requires a scenario");
  assert.ok(replay.replay_certificate?.run_identity, "canonical replay certificate requires run_identity");
  assert.ok(replay.scenario.decision_slots, "canonical scenario requires decision_slots");
  const identity = replay.replay_certificate.run_identity;
  const expected = buildRunIdentity({
    scenario: replay.scenario,
    exerciseInputs,
    sourceDataSha256ById: replay.source_data_sha256_by_id
  });
  assert.equal(identity.schema_version, RUN_IDENTITY_SCHEMA_VERSION);
  assert.deepEqual(Object.keys(identity.equality_keys).sort(), [...EQUALITY_KEY_NAMES].sort(),
    "run identity must contain exactly four equality keys");
  assert.deepEqual(identity.equality_keys, expected.equality_keys, "run identity equality-key mismatch");
  assert.ok(Array.isArray(identity.runs), "run identity runs must be an array");
  const runIds = new Set();
  const arms = new Set();
  for (const run of identity.runs) {
    assert.equal(typeof run.run_id, "string", "run descriptor is missing run_id");
    assert.equal(typeof run.arm, "string", "run descriptor is missing arm");
    assert.ok(!runIds.has(run.run_id), `duplicate run ID ${run.run_id}`);
    assert.ok(!arms.has(run.arm), `duplicate run arm ${run.arm}`);
    runIds.add(run.run_id);
    arms.add(run.arm);
  }
  assert.deepEqual(identity.runs, expected.runs, "run descriptors do not match the canonical arms");

  const slots = assertSlotSemantics(replay.scenario, exerciseInputs);
  const decisionsByArmAndSlot = new Map();
  for (const event of replay.events.filter((candidate) => candidate.type === "DECISION_PROPOSED")) {
    const slotId = event.payload.decision_slot_id;
    assert.equal(typeof slotId, "string", `${event.event_id} is missing decision_slot_id`);
    const slot = slots.get(slotId);
    assert.ok(slot, `${event.event_id} cites unknown decision slot ${slotId}`);
    assert.ok(RUN_ARMS.some(({ arm }) => arm === event.arm), `${event.event_id} has unknown run arm ${event.arm}`);
    const key = `${event.arm}\u0000${slotId}`;
    assert.ok(!decisionsByArmAndSlot.has(key), `multiple decisions for ${event.arm}/${slotId}`);
    const selectedTargets = event.payload.selected_targets;
    const selectedSet = new Set(sortedUniqueStrings(selectedTargets, `${event.event_id}.selected_targets`));
    assert.ok(selectedTargets.length <= slot.selection_count, `${event.event_id} overselects ${slotId}`);
    for (const targetId of selectedSet) {
      assert.ok(slot.eligible_target_ids.includes(targetId), `${event.event_id} selects ineligible target ${targetId}`);
    }
    assert.equal(event.payload.claimed_people?.length, selectedTargets.length,
      `${event.event_id} claimed_people does not pair with selected_targets`);
    assert.ok(Number.isInteger(event.payload.resource_limit) && event.payload.resource_limit >= selectedTargets.length,
      `${event.event_id} has an invalid resource limit`);
    assert.ok(event.payload.resource_limit <= slot.selection_count, `${event.event_id} exceeds the slot resource limit`);
    decisionsByArmAndSlot.set(key, { event, slot, selectedSet });
  }
  for (const { arm } of RUN_ARMS) {
    for (const slotId of slots.keys()) {
      assert.ok(decisionsByArmAndSlot.has(`${arm}\u0000${slotId}`), `missing decision for ${arm}/${slotId}`);
    }
  }
  assert.equal(decisionsByArmAndSlot.size, RUN_ARMS.length * slots.size,
    "canonical runs require exactly one decision per arm and slot");

  const dispatchedResourcesByDecision = new Map();
  for (const event of replay.events.filter((candidate) => candidate.type === "RESOURCE_DISPATCHED")) {
    const decisions = [...decisionsByArmAndSlot.values()].filter(({ event: decision }) => (
      decision.arm === event.arm && event.caused_by.includes(decision.event_id)
    ));
    assert.equal(decisions.length, 1, `${event.event_id} cannot resolve one decision slot`);
    const [{ event: decision, slot, selectedSet }] = decisions;
    assert.ok(slot.eligible_resource_ids.includes(event.payload.resource_id),
      `${event.event_id} dispatches ineligible resource ${event.payload.resource_id}`);
    assert.ok(selectedSet.has(event.payload.target_feature_id),
      `${event.event_id} dispatches unselected target ${event.payload.target_feature_id}`);
    const resources = dispatchedResourcesByDecision.get(decision.event_id) ?? new Set();
    assert.ok(!resources.has(event.payload.resource_id), `${event.event_id} reuses resource ${event.payload.resource_id}`);
    resources.add(event.payload.resource_id);
    assert.ok(resources.size <= selectedSet.size && resources.size <= slot.selection_count,
      `${event.event_id} dispatches too many resources`);
    dispatchedResourcesByDecision.set(decision.event_id, resources);
  }
  return true;
}
