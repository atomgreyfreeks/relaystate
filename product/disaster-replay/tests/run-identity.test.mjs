import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildReplay } from "../scripts/build-replay.mjs";
import {
  assertCanonicalRunIdentity,
  canonicalEqualityJson,
  computeEqualityKeys,
  equalityKeySha256
} from "../scripts/run-identity.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const INPUTS = JSON.parse(fs.readFileSync(path.join(PACKAGE, "scenarios", "kumamoto-2026", "exercise-inputs.json"), "utf8"));
const EXPECTED_KEYS = {
  scenario_basis_sha256: "aecad03969b0efca4b7b3af12b5c77b24d3a009a91bd0a97e0788cde4a456857",
  observation_set_sha256: "effda5912392bc162740d5784d3372f029d9ac246d1c3115eb4c98fae9b50a6c",
  resources_sha256: "81f3a5dc71065efd3939c82a09590b84890e92b5a058d4145f45419fcb1d909f",
  decision_slots_sha256: "ccac2c1a1786b897f111b82e79dda4ccf780ccd319acc67925a7cf9deb2dbe76"
};

function replayAndInputs() {
  return { replay: buildReplay(), exerciseInputs: structuredClone(INPUTS) };
}

function keysFor(replay, exerciseInputs = INPUTS) {
  return computeEqualityKeys({
    scenario: replay.scenario,
    exerciseInputs,
    sourceDataSha256ById: replay.source_data_sha256_by_id
  });
}

test("canonical equality keys match the frozen Kumamoto certificate", () => {
  const { replay } = replayAndInputs();
  assert.deepEqual(keysFor(replay), EXPECTED_KEYS);
  assert.deepEqual(replay.replay_certificate.run_identity.equality_keys, EXPECTED_KEYS);
  assert.equal(assertCanonicalRunIdentity(replay, INPUTS), true);
});

test("set-like input order does not change equality keys", () => {
  const { replay, exerciseInputs } = replayAndInputs();
  exerciseInputs.observations.reverse();
  replay.scenario.resources.reverse();
  replay.scenario.metrics.reverse();
  replay.scenario.exercise.target_feature_ids.reverse();
  replay.scenario.decision_slots.reverse();
  for (const slot of replay.scenario.decision_slots) {
    slot.visible_observation_ids.reverse();
    slot.eligible_resource_ids.reverse();
    slot.eligible_target_ids.reverse();
  }
  assert.deepEqual(keysFor(replay, exerciseInputs), EXPECTED_KEYS);
});

test("each equality key isolates its own policy component", () => {
  const { replay } = replayAndInputs();
  const baseline = keysFor(replay);

  const presentationOnly = structuredClone(replay);
  presentationOnly.scenario.title = "A presentation-only rename";
  presentationOnly.scenario.disclosure = "A presentation-only disclosure";
  presentationOnly.scenario.agents.reverse();
  presentationOnly.scenario.graphs.reverse();
  assert.deepEqual(keysFor(presentationOnly), baseline);

  const changedObservation = structuredClone(INPUTS);
  changedObservation.observations[0].claim.value += 1;
  const observationKeys = keysFor(replay, changedObservation);
  assert.notEqual(observationKeys.observation_set_sha256, baseline.observation_set_sha256);
  assert.equal(observationKeys.scenario_basis_sha256, baseline.scenario_basis_sha256);
  assert.equal(observationKeys.resources_sha256, baseline.resources_sha256);
  assert.equal(observationKeys.decision_slots_sha256, baseline.decision_slots_sha256);

  const changedResource = structuredClone(replay);
  changedResource.scenario.resources[0].capacity += 1;
  const resourceKeys = keysFor(changedResource);
  assert.equal(resourceKeys.observation_set_sha256, baseline.observation_set_sha256);
  assert.notEqual(resourceKeys.resources_sha256, baseline.resources_sha256);
  assert.equal(resourceKeys.decision_slots_sha256, baseline.decision_slots_sha256);

  const changedSlot = structuredClone(replay);
  changedSlot.scenario.decision_slots[0].information_cutoff_sim_time_s += 1;
  const slotKeys = keysFor(changedSlot);
  assert.equal(slotKeys.scenario_basis_sha256, baseline.scenario_basis_sha256);
  assert.equal(slotKeys.observation_set_sha256, baseline.observation_set_sha256);
  assert.equal(slotKeys.resources_sha256, baseline.resources_sha256);
  assert.notEqual(slotKeys.decision_slots_sha256, baseline.decision_slots_sha256);
});

test("certificate mismatches and descriptor collisions are refused", () => {
  const { replay } = replayAndInputs();
  replay.replay_certificate.run_identity.equality_keys.resources_sha256 = "0".repeat(64);
  assert.throws(() => assertCanonicalRunIdentity(replay, INPUTS), /equality-key mismatch/);

  const duplicateRun = buildReplay();
  duplicateRun.replay_certificate.run_identity.runs[1].run_id = duplicateRun.replay_certificate.run_identity.runs[0].run_id;
  assert.throws(() => assertCanonicalRunIdentity(duplicateRun, INPUTS), /duplicate run ID/);

  const duplicateArm = buildReplay();
  duplicateArm.replay_certificate.run_identity.runs[1].arm = duplicateArm.replay_certificate.run_identity.runs[0].arm;
  assert.throws(() => assertCanonicalRunIdentity(duplicateArm, INPUTS), /duplicate run arm/);
});

test("semantic verifier rejects missing slots, overselection, and ineligible references", () => {
  const missingSlot = buildReplay();
  delete missingSlot.events.find((event) => event.type === "DECISION_PROPOSED").payload.decision_slot_id;
  assert.throws(() => assertCanonicalRunIdentity(missingSlot, INPUTS), /missing decision_slot_id/);

  const overselection = buildReplay();
  const decision = overselection.events.find((event) => event.type === "DECISION_PROPOSED");
  decision.payload.selected_targets.push("gsi-2026-kumamoto-landslide-003");
  decision.payload.claimed_people.push(35);
  assert.throws(() => assertCanonicalRunIdentity(overselection, INPUTS), /overselects/);

  const ineligibleResource = buildReplay();
  ineligibleResource.events.find((event) => event.type === "RESOURCE_DISPATCHED").payload.resource_id = "unknown-team";
  assert.throws(() => assertCanonicalRunIdentity(ineligibleResource, INPUTS), /ineligible resource/);
});

test("legacy documents remain schema-compatible but are not canonical runs", () => {
  const scenarioSchema = JSON.parse(fs.readFileSync(path.join(PACKAGE, "schemas", "scenario.schema.json"), "utf8"));
  const bundleSchema = JSON.parse(fs.readFileSync(path.join(PACKAGE, "schemas", "replay-bundle.schema.json"), "utf8"));
  assert.ok(!scenarioSchema.required.includes("decision_slots"));
  assert.ok(!bundleSchema.properties.replay_certificate.required.includes("run_identity"));

  const legacy = buildReplay();
  delete legacy.scenario.decision_slots;
  delete legacy.replay_certificate.run_identity;
  assert.throws(() => assertCanonicalRunIdentity(legacy, INPUTS), /requires run_identity/);
});

test("canonicalizer rejects duplicate IDs and non-JSON numeric values", () => {
  const duplicate = [structuredClone(INPUTS.observations[0]), structuredClone(INPUTS.observations[0])];
  assert.throws(() => equalityKeySha256("observation_set", duplicate), /duplicate observation_set ID/);
  assert.throws(() => canonicalEqualityJson("resources", [{ resource_id: "bad", capacity: Number.NaN }]), /finite JSON number/);
  assert.throws(() => canonicalEqualityJson("resources", [{ resource_id: "bad", capacity: undefined }]), /not a JSON value/);
});
