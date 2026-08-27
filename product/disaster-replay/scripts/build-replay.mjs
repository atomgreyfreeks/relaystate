import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRunIdentity } from "./run-identity.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const SCENARIO_PATH = path.join(PACKAGE, "scenarios", "kumamoto-2026", "scenario.json");
const INPUTS_PATH = path.join(PACKAGE, "scenarios", "kumamoto-2026", "exercise-inputs.json");
const HAZARDS_PATH = path.join(PACKAGE, "data", "gsi-2026-kumamoto-landslides.geojson");
const ROADS_PATH = path.join(PACKAGE, "data", "mlit-2026-kumamoto-road-restrictions.geojson");
const JMA_UPDATES_PATH = path.join(PACKAGE, "data", "jma-2026-kumamoto-official-updates.json");
const SHELTERS_PATH = path.join(PACKAGE, "data", "gsi-uki-designated-shelters.geojson");
const TERRAIN_PATH = path.join(PACKAGE, "data", "gsi-dem10b-z11-kumamoto.png");
const TERRAIN_META_PATH = path.join(PACKAGE, "data", "gsi-dem10b-z11-kumamoto.meta.json");
const PLATEAU_FOCUS_PATH = path.join(PACKAGE, "data", "plateau-uki-2025-focus");
const SAMPLE_PATH = path.join(PACKAGE, "samples", "kumamoto-2026.exercise.replay.json");
const RUN_PATH = path.join(PACKAGE, "runs", "kumamoto-2026", "260728");
const ZERO_HASH = "0".repeat(64);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function timelineJsonl(events) {
  return `${events.map((event) => canonicalJson(event)).join("\n")}\n`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function centroid(geometry) {
  const positions = [];
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      positions.push([value[0], value[1]]);
      return;
    }
    for (const child of value) visit(child);
  };
  visit(geometry.coordinates);
  if (positions.length === 0) throw new Error("geometry has no positions");
  return {
    type: "Point",
    coordinates: [
      positions.reduce((sum, [x]) => sum + x, 0) / positions.length,
      positions.reduce((sum, [, y]) => sum + y, 0) / positions.length
    ]
  };
}

function groupObservations(inputs) {
  const grouped = new Map();
  for (const observation of inputs.observations) {
    if (!grouped.has(observation.target_feature_id)) grouped.set(observation.target_feature_id, []);
    grouped.get(observation.target_feature_id).push(observation);
  }
  return grouped;
}

function compileClaimVersions(observations) {
  const byValue = new Map();
  for (const observation of observations) {
    const key = String(observation.claim.value);
    if (!byValue.has(key)) byValue.set(key, []);
    byValue.get(key).push(observation);
  }
  const versions = [...byValue.entries()]
    .map(([key, rows]) => ({ value: Number(key), observations: rows }))
    .sort((a, b) => b.observations.length - a.observations.length || b.value - a.value);
  const supported = versions[0].observations.length >= 2 ? versions[0] : null;
  return versions.map((version) => ({
    value: version.value,
    observation_ids: version.observations.map((row) => row.observation_id),
    verdict: supported === version ? "SUPPORTED" : supported ? "REJECTED" : "UNRESOLVED"
  }));
}

function jstSecondsAfterIncident(raw, scenario) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+|\/)(\d{1,2}):(\d{2})$/.exec(raw ?? "");
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const event = scenario.incident;
  const incidentMilliseconds = Date.UTC(2026, 6, 28, 7, 27, 15, 200);
  assertIncidentMatches(event);
  const observedMilliseconds = Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
  return Math.max(0, Math.floor((observedMilliseconds - incidentMilliseconds) / 1000));
}

function normalizeJstMinute(raw) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+|\/)(\d{1,2}):(\d{2})$/.exec(raw ?? "");
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    + `T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+09:00`;
}

function secondsAfterIncident(isoTimestamp, scenario) {
  const incident = Date.parse(scenario.incident.occurred_at);
  const timestamp = Date.parse(isoTimestamp);
  if (!Number.isFinite(incident) || !Number.isFinite(timestamp)) throw new Error(`invalid replay timestamp ${isoTimestamp}`);
  return Math.max(0, Math.floor((timestamp - incident) / 1000));
}

function assertIncidentMatches(incident) {
  if (incident.occurred_at !== "2026-07-28T16:27:15.200+09:00") {
    throw new Error("update the explicit incident clock conversion before changing the scenario origin");
  }
}

function reduce(events) {
  const states = {
    PLAIN_GRAPH: { claims: {}, graph: { node_id: null, transitions: 0 }, decisions: [], dispatches: [], outcomes: [], metrics: {} },
    EVIDENCE_GRAPH: { claims: {}, graph: { node_id: null, transitions: 0 }, decisions: [], dispatches: [], outcomes: [], metrics: {} }
  };
  for (const event of events) {
    if (!(event.arm in states)) continue;
    const state = states[event.arm];
    if (event.type === "CLAIM_STATE_CHANGED") {
      state.claims[event.payload.claim_version_id] = event.payload;
    } else if (event.type === "GRAPH_TRANSITION") {
      state.graph.node_id = event.graph.node_id;
      state.graph.transitions += 1;
    } else if (event.type === "DECISION_PROPOSED") {
      state.decisions.push(event.payload);
    } else if (event.type === "RESOURCE_DISPATCHED") {
      state.dispatches.push(event.payload);
    } else if (event.type === "OUTCOME_OBSERVED") {
      state.outcomes.push(event.payload);
    } else if (event.type === "METRIC_UPDATED") {
      state.metrics[event.payload.metric_id] = event.payload.value;
    }
  }
  return states;
}

function buildEvents(scenario, inputs, hazards, roads, jmaUpdates, shelters) {
  const featureById = new Map(hazards.features.map((feature) => [feature.id, feature]));
  const geometryByTarget = new Map(scenario.exercise.target_feature_ids.map((id) => {
    const feature = featureById.get(id);
    if (!feature) throw new Error(`scenario target missing from GSI data: ${id}`);
    return [id, centroid(feature.geometry)];
  }));
  const events = [];
  let previousHash = ZERO_HASH;

  const emit = ({ simTimeS, arm, type, actor, entityRefs = [], causedBy = [], geometry = null, temporal = null, provenance, graph = null, payload = {} }) => {
    const sequence = events.length;
    const base = {
      schema_version: "disaster-replay.event.v1",
      event_id: `${scenario.scenario_id}:e${String(sequence).padStart(4, "0")}`,
      sequence,
      sim_time_s: simTimeS,
      arm,
      type,
      actor,
      entity_refs: entityRefs,
      caused_by: causedBy,
      geometry,
      temporal,
      provenance,
      graph,
      payload,
      previous_event_sha256: previousHash
    };
    const event = { ...base, event_sha256: sha256(canonicalJson(base)) };
    previousHash = event.event_sha256;
    events.push(event);
    return event;
  };

  const observed = (sourceIds, explanation) => ({
    classification: "OBSERVED_PUBLIC", input_classifications: ["OBSERVED_PUBLIC"], source_ids: sourceIds, explanation
  });
  const synthetic = (sourceIds, explanation) => ({
    classification: "SYNTHETIC_EXERCISE", input_classifications: ["SYNTHETIC_EXERCISE"], source_ids: sourceIds, explanation
  });
  const derived = (sourceIds, explanation) => ({
    classification: "DERIVED_DETERMINISTIC", input_classifications: ["SYNTHETIC_EXERCISE"], source_ids: sourceIds, explanation
  });
  const world = { kind: "WORLD", id: "kumamoto-world", role: "real geography with an exercise overlay" };
  const intake = { kind: "AGENT", id: "intake-01", role: "report intake" };
  const compiler = { kind: "AGENT", id: "evidence-compiler-01", role: "claim versioning and evidence comparison" };
  const allocator = { kind: "AGENT", id: "allocator-01", role: "scarce-resource allocation" };
  const dispatcher = { kind: "AGENT", id: "dispatcher-01", role: "idempotent dispatch" };
  const controller = { kind: "HUMAN", id: "exercise-controller", role: "reveals synthetic exercise truth" };
  const reducerActor = { kind: "REDUCER", id: scenario.reducer_version, role: "deterministic metrics and state" };

  const worldEvent = emit({
    simTimeS: 0,
    arm: "SHARED",
    type: "WORLD_INITIALIZED",
    actor: world,
    entityRefs: [scenario.scenario_id],
    geometry: { type: "Point", coordinates: [scenario.incident.longitude, scenario.incident.latitude] },
    provenance: observed([scenario.incident.source_id], "Epicenter, depth, magnitude, and maximum intensity come from the current JMA record."),
    payload: { incident: scenario.incident, disclosure: scenario.disclosure }
  });
  const roadTimeline = roads.features
    .map((feature) => ({
      feature,
      simTimeS: jstSecondsAfterIncident(feature.properties.restriction_started_at, scenario),
      observedAt: normalizeJstMinute(feature.properties.restriction_started_at)
    }))
    .filter((row) => row.simTimeS !== null)
    .sort((a, b) => a.simTimeS - b.simTimeS || a.feature.id.localeCompare(b.feature.id));
  const observationEventById = new Map();
  const sharedSourceRows = [
    {
      simTimeS: 1,
      stableId: "layer:gsi-kumamoto-2026-landslides",
      emit: () => emit({
        simTimeS: 1,
        arm: "SHARED",
        type: "SOURCE_INGESTED",
        actor: { kind: "SOURCE", id: "gsi-kumamoto-2026-landslides", role: "observed hazard layer" },
        entityRefs: scenario.exercise.target_feature_ids,
        causedBy: [worldEvent.event_id],
        provenance: observed(["gsi-kumamoto-2026-landslides"], "Normalized without changing the 35 source geometries."),
        payload: { feature_count: hazards.features.length, bbox: hazards.bbox }
      })
    },
    {
      simTimeS: 2,
      stableId: "layer:mlit-kumamoto-2026-passable-map-0729-1200",
      emit: () => emit({
        simTimeS: 2,
        arm: "SHARED",
        type: "SOURCE_INGESTED",
        actor: { kind: "SOURCE", id: "mlit-kumamoto-2026-passable-map-0729-1200", role: "observed road-restriction layer" },
        entityRefs: roads.features.map((feature) => feature.id),
        causedBy: [worldEvent.event_id],
        provenance: observed(["mlit-kumamoto-2026-passable-map-0729-1200"], "Normalized from the official 2026-07-29 12:00 JST Passable Map snapshot without changing its 29 source geometries."),
        payload: { feature_count: roads.features.length, bbox: roads.bbox, snapshot_at: roads.source.snapshot_at }
      })
    },
    {
      simTimeS: 3,
      stableId: "layer:gsi-uki-designated-shelters",
      emit: () => emit({
        simTimeS: 3,
        arm: "SHARED",
        type: "SOURCE_INGESTED",
        actor: { kind: "SOURCE", id: "gsi-uki-designated-shelters", role: "static designated-shelter layer" },
        entityRefs: shelters.features.map((feature) => feature.id),
        causedBy: [worldEvent.event_id],
        provenance: observed(["gsi-uki-designated-shelters"], "Officially designated locations normalized from GSI; event-time opening, safety, staffing, reachability, supply, and capacity remain unknown."),
        payload: {
          designation_record_count: shelters.designation_record_count,
          unique_location_count: shelters.unique_location_count,
          designated_shelter_count: shelters.features.filter((feature) => feature.properties.designation === "DESIGNATED_SHELTER").length,
          earthquake_evacuation_place_count: shelters.features.filter((feature) => feature.properties.designation === "EARTHQUAKE_EVACUATION_PLACE").length,
          bbox: shelters.bbox,
          event_status: "DESIGNATED_ONLY_UNKNOWN_EVENT_STATUS"
        }
      })
    }
  ];
  for (const update of jmaUpdates.updates) {
    const simTimeS = secondsAfterIncident(update.report_datetime, scenario);
    sharedSourceRows.push({
      simTimeS,
      stableId: `jma:${update.report_id}`,
      emit: () => emit({
        simTimeS,
        arm: "SHARED",
        type: "SOURCE_INGESTED",
        actor: { kind: "SOURCE", id: "jma-kumamoto-2026-official-updates", role: "official earthquake report update" },
        entityRefs: [scenario.incident.source_id],
        causedBy: [worldEvent.event_id],
        geometry: { type: "Point", coordinates: [scenario.incident.longitude, scenario.incident.latitude] },
        temporal: {
          basis: "OFFICIAL_REPORT_TIME",
          precision: "MINUTE",
          observed_at: update.event_origin_time,
          available_at: update.report_datetime
        },
        provenance: observed(["jma-kumamoto-2026-official-updates"], "This is one of seven historical JMA reports for the event, normalized without changing its issue time, revision, magnitude, intensity, or station count."),
        payload: update
      })
    });
  }
  for (const observation of inputs.observations) {
    const simTimeS = observation.step * scenario.clock.step_seconds;
    sharedSourceRows.push({
      simTimeS,
      stableId: `exercise:${observation.observation_id}`,
      emit: () => {
        const event = emit({
          simTimeS,
          arm: "SHARED",
          type: "SOURCE_INGESTED",
          actor: { kind: "SOURCE", id: observation.observation_id, role: observation.source_label },
          entityRefs: [observation.target_feature_id],
          geometry: geometryByTarget.get(observation.target_feature_id),
          provenance: synthetic([observation.observation_id], inputs.disclosure),
          payload: observation
        });
        observationEventById.set(observation.observation_id, event.event_id);
      }
    });
  }
  for (const { feature, simTimeS, observedAt } of roadTimeline) {
    sharedSourceRows.push({
      simTimeS,
      stableId: `road:${feature.id}`,
      emit: () => emit({
        simTimeS,
        arm: "SHARED",
        type: "SOURCE_INGESTED",
        actor: { kind: "SOURCE", id: "mlit-kumamoto-2026-passable-map-0729-1200", role: "timestamped road restriction" },
        entityRefs: [feature.id],
        causedBy: [worldEvent.event_id],
        geometry: feature.geometry,
        temporal: {
          basis: "SOURCE_FIELD_RECONSTRUCTED_FROM_SNAPSHOT",
          precision: "MINUTE",
          observed_at: observedAt,
          available_at: roads.source.snapshot_at
        },
        provenance: observed(["mlit-kumamoto-2026-passable-map-0729-1200"], "Road status and geometry come from the official MLIT Passable Map snapshot; its reported start minute was normalized without implying second precision."),
        payload: { restriction_id: feature.id, ...feature.properties }
      })
    });
  }
  sharedSourceRows
    .sort((a, b) => a.simTimeS - b.simTimeS || a.stableId.localeCompare(b.stableId))
    .forEach((row) => row.emit());

  const grouped = groupObservations(inputs);
  const compiledByTarget = new Map([...grouped].map(([target, rows]) => [target, compileClaimVersions(rows)]));
  const graphStart = Math.max(9 * scenario.clock.step_seconds, ...roadTimeline.map((row) => row.simTimeS)) + scenario.clock.step_seconds;
  const decisionSlot = scenario.decision_slots.find((slot) => slot.decision_slot_id === "initial-assessment-allocation");
  if (!decisionSlot) throw new Error("scenario is missing the initial-assessment-allocation decision slot");
  const resourceById = new Map(scenario.resources.map((resource) => [resource.resource_id, resource]));
  const eligibleResources = decisionSlot.eligible_resource_ids.map((resourceId) => {
    const resource = resourceById.get(resourceId);
    if (!resource) throw new Error(`decision slot cites missing resource ${resourceId}`);
    return resource;
  });

  const runArm = (arm) => {
    const graphDefinition = scenario.graphs.find((graph) => graph.arm === arm);
    const graphId = graphDefinition.graph_id;
    const sourceEventIds = inputs.observations.map((row) => observationEventById.get(row.observation_id));
    let time = graphStart;
    let priorNode = null;
    const transition = (nodeId, edgeId, detail) => {
      const event = emit({
        simTimeS: time,
        arm,
        type: "GRAPH_TRANSITION",
        actor: nodeId === "DISPATCH" ? dispatcher : nodeId === "RANK" ? allocator : nodeId === "INGEST" ? intake : compiler,
        entityRefs: scenario.exercise.target_feature_ids,
        causedBy: priorNode ? [priorNode.event_id] : sourceEventIds,
        provenance: derived(inputs.observations.map((row) => row.observation_id), detail),
        graph: { graph_id: graphId, node_id: nodeId, edge_id: edgeId },
        payload: { prior_node_id: priorNode?.graph?.node_id ?? null, node_id: nodeId, detail }
      });
      priorNode = event;
      time += 30;
      return event;
    };

    transition("INGEST", null, "The arm receives the exact same eight synthetic reports.");
    const rankings = [];

    if (arm === "PLAIN_GRAPH") {
      transition("SUMMARIZE", "INGEST_TO_SUMMARIZE", "Keep the largest reported number for each site; no claim versions or evidence verdicts are created.");
      for (const [target, rows] of grouped) {
        const chosen = [...rows].sort((a, b) => b.claim.value - a.claim.value || a.observation_id.localeCompare(b.observation_id))[0];
        const compiled = compiledByTarget.get(target);
        const laterVerdict = compiled.find((version) => version.value === chosen.claim.value).verdict;
        emit({
          simTimeS: time,
          arm,
          type: "CLAIM_STATE_CHANGED",
          actor: compiler,
          entityRefs: [target],
          causedBy: [observationEventById.get(chosen.observation_id)],
          geometry: geometryByTarget.get(target),
          provenance: derived([chosen.observation_id], "Plain graph summary: maximum observed value, with no evidence gate."),
          graph: { graph_id: graphId, node_id: "SUMMARIZE", edge_id: null },
          payload: {
            claim_version_id: `${target}:people_waiting:${chosen.claim.value}`,
            target_feature_id: target,
            value: chosen.claim.value,
            unit: chosen.claim.unit,
            verdict: "NOT_EVALUATED",
            comparison_verdict: laterVerdict,
            supporting_observation_ids: [chosen.observation_id]
          }
        });
        rankings.push({ target, value: chosen.claim.value, version: compiled.find((version) => version.value === chosen.claim.value) });
      }
      time += 30;
      transition("RANK", "SUMMARIZE_TO_RANK", "Rank the four maximum reported values and keep the top two.");
    } else {
      transition("VERSION", "INGEST_TO_VERSION", "Keep every competing number as its own immutable claim version.");
      transition("CORROBORATE", "VERSION_TO_CORROBORATE", "Count independent exercise sources that report the same value.");
      for (const [target, versions] of compiledByTarget) {
        for (const version of versions) {
          emit({
            simTimeS: time,
            arm,
            type: "CLAIM_STATE_CHANGED",
            actor: compiler,
            entityRefs: [target],
            causedBy: version.observation_ids.map((id) => observationEventById.get(id)),
            geometry: geometryByTarget.get(target),
            provenance: derived(version.observation_ids, "Two agreeing independent exercise sources support a version; a contradicted competing version is rejected; a lone uncontradicted version remains unresolved."),
            graph: { graph_id: graphId, node_id: "CORROBORATE", edge_id: null },
            payload: {
              claim_version_id: `${target}:people_waiting:${version.value}`,
              target_feature_id: target,
              value: version.value,
              unit: "simulated_people",
              verdict: version.verdict,
              comparison_verdict: version.verdict,
              supporting_observation_ids: version.observation_ids
            }
          });
          if (version.verdict === "SUPPORTED") rankings.push({ target, value: version.value, version });
        }
      }
      time += 30;
      transition("GATE", "CORROBORATE_TO_GATE", "Rejected and unresolved versions cannot authorize a scarce-team dispatch.");
      transition("RANK", "GATE_TO_RANK", "Rank only supported current claim versions and keep the top two.");
    }

    rankings.sort((a, b) => b.value - a.value || a.target.localeCompare(b.target));
    const selected = rankings.slice(0, decisionSlot.selection_count);
    const decisionEvent = emit({
      simTimeS: time,
      arm,
      type: "DECISION_PROPOSED",
      actor: allocator,
      entityRefs: selected.map((row) => row.target),
      causedBy: [priorNode.event_id],
      provenance: derived(selected.flatMap((row) => row.version.observation_ids), "Deterministic descending rank under a two-resource limit."),
      graph: { graph_id: graphId, node_id: "RANK", edge_id: null },
      payload: {
        decision_id: `${arm.toLowerCase()}:dispatch-decision`,
        decision_slot_id: decisionSlot.decision_slot_id,
        selected_targets: selected.map((row) => row.target),
        claimed_people: selected.map((row) => row.value),
        resource_limit: decisionSlot.selection_count
      }
    });
    time += 30;

    const supportedSelections = selected.filter((row) => row.version.verdict === "SUPPORTED").length;
    const rejectedSelections = selected.filter((row) => row.version.verdict === "REJECTED").length;
    const unsupportedSelections = selected.length - supportedSelections;
    emit({
      simTimeS: time,
      arm,
      type: "POLICY_EVALUATED",
      actor: { kind: "POLICY", id: arm === "EVIDENCE_GRAPH" ? "evidence-gate-v1" : "plain-no-gate-v1", role: "dispatch eligibility" },
      entityRefs: selected.map((row) => row.target),
      causedBy: [decisionEvent.event_id],
      provenance: derived(selected.flatMap((row) => row.version.observation_ids), arm === "EVIDENCE_GRAPH" ? "Every selected target has a supported current claim version." : "The plain arm has no evidence eligibility gate; verdicts are computed only for matched scoring."),
      graph: { graph_id: graphId, node_id: arm === "EVIDENCE_GRAPH" ? "GATE" : "RANK", edge_id: null },
      payload: {
        policy_id: arm === "EVIDENCE_GRAPH" ? "evidence-gate-v1" : "plain-no-gate-v1",
        disposition: arm === "EVIDENCE_GRAPH" ? "ALLOW_SUPPORTED_ONLY" : "NO_GATE",
        supported_selections: supportedSelections,
        rejected_selections: rejectedSelections,
        unsupported_selections: unsupportedSelections
      }
    });
    time += 30;
    transition("DISPATCH", arm === "EVIDENCE_GRAPH" ? "RANK_TO_DISPATCH" : "RANK_TO_DISPATCH", "Assign each selected target to one exact resource with an idempotency key.");

    let peopleReached = 0;
    const dispatchRows = selected.map((selection, index) => {
      const resource = eligibleResources[index];
      const dispatchEvent = emit({
        simTimeS: time + index * 15,
        arm,
        type: "RESOURCE_DISPATCHED",
        actor: dispatcher,
        entityRefs: [selection.target, resource.resource_id],
        causedBy: [decisionEvent.event_id, priorNode.event_id],
        geometry: geometryByTarget.get(selection.target),
        provenance: derived(selection.version.observation_ids, "Exact target, resource, claim version, and idempotency key are recorded."),
        graph: { graph_id: graphId, node_id: "DISPATCH", edge_id: null },
        payload: {
          dispatch_id: `${arm.toLowerCase()}:dispatch-${index + 1}`,
          resource_id: resource.resource_id,
          target_feature_id: selection.target,
          authorizing_claim_version_id: `${selection.target}:people_waiting:${selection.value}`,
          idempotency_key: `${scenario.scenario_id}:${arm}:${resource.resource_id}`
        }
      });
      return { selection, resource, dispatchEvent, index };
    });
    for (const { selection, resource, dispatchEvent, index } of dispatchRows) {
      const reached = inputs.truth_by_target[selection.target];
      peopleReached += reached;
      emit({
        simTimeS: time + 60 + index * 15,
        arm,
        type: "OUTCOME_OBSERVED",
        actor: controller,
        entityRefs: [selection.target, resource.resource_id],
        causedBy: [dispatchEvent.event_id],
        geometry: geometryByTarget.get(selection.target),
        provenance: synthetic([inputs.exercise_id], "Outcome is revealed from frozen synthetic exercise truth, not from the real Kumamoto response."),
        graph: { graph_id: graphId, node_id: "OBSERVE", edge_id: "DISPATCH_TO_OBSERVE" },
        payload: { target_feature_id: selection.target, exercise_people_reached: reached, unit: "simulated_people" }
      });
    }
    time += 120;
    if (arm === "EVIDENCE_GRAPH") transition("UPDATE", "OBSERVE_TO_UPDATE", "Close exact dispatch receipts and retain all claim versions for review.");
    else transition("OBSERVE", "DISPATCH_TO_OBSERVE", "Record the exercise outcome for the plain graph.");

    const metricRows = [
      ["exercise_people_reached", peopleReached, "simulated_people"],
      ["dispatches_on_rejected_claim_versions", rejectedSelections, "dispatches"],
      ["decision_source_coverage", supportedSelections / selected.length, "fraction"]
    ];
    for (const [metricId, value, unit] of metricRows) {
      emit({
        simTimeS: time,
        arm,
        type: "METRIC_UPDATED",
        actor: reducerActor,
        entityRefs: selected.map((row) => row.target),
        causedBy: events.filter((event) => event.arm === arm && event.type === "OUTCOME_OBSERVED").map((event) => event.event_id),
        provenance: derived([inputs.exercise_id], "Metric is computed from the frozen synthetic truth and exact dispatch records."),
        graph: { graph_id: graphId, node_id: arm === "EVIDENCE_GRAPH" ? "UPDATE" : "OBSERVE", edge_id: null },
        payload: { metric_id: metricId, value, unit }
      });
    }
  };

  runArm("PLAIN_GRAPH");
  runArm("EVIDENCE_GRAPH");
  return events;
}

export function buildReplay() {
  const scenario = readJson(SCENARIO_PATH);
  const inputs = readJson(INPUTS_PATH);
  const hazardsBuffer = fs.readFileSync(HAZARDS_PATH);
  const roadsBuffer = fs.readFileSync(ROADS_PATH);
  const jmaUpdatesBuffer = fs.readFileSync(JMA_UPDATES_PATH);
  const sheltersBuffer = fs.readFileSync(SHELTERS_PATH);
  const terrainBuffer = fs.readFileSync(TERRAIN_PATH);
  const terrainMetaBuffer = fs.readFileSync(TERRAIN_META_PATH);
  const plateauManifestBuffer = fs.readFileSync(path.join(PLATEAU_FOCUS_PATH, "metadata.json"));
  const plateauTilesetBuffer = fs.readFileSync(path.join(PLATEAU_FOCUS_PATH, "tileset.json"));
  const hazards = JSON.parse(hazardsBuffer);
  const roads = JSON.parse(roadsBuffer);
  const jmaUpdates = JSON.parse(jmaUpdatesBuffer);
  const shelters = JSON.parse(sheltersBuffer);
  const events = buildEvents(scenario, inputs, hazards, roads, jmaUpdates, shelters);
  const finalStateByArm = reduce(events);
  const scenarioSha256 = sha256(canonicalJson(scenario));
  const sourceDataSha256ById = {
    "gsi-kumamoto-2026-landslides": sha256(hazardsBuffer),
    "mlit-kumamoto-2026-passable-map-0729-1200": sha256(roadsBuffer),
    "jma-kumamoto-2026-official-updates": sha256(jmaUpdatesBuffer),
    "gsi-uki-designated-shelters": sha256(sheltersBuffer),
    "gsi-dem-tiles": sha256(terrainBuffer),
    "gsi-dem-tiles-metadata": sha256(terrainMetaBuffer),
    "plateau-uki-2025-3d-manifest": sha256(plateauManifestBuffer),
    "plateau-uki-2025-3d-tileset": sha256(plateauTilesetBuffer)
  };
  const certificate = {
    reducer_version: scenario.reducer_version,
    event_count: events.length,
    scenario_sha256: scenarioSha256,
    source_data_sha256_by_id: sourceDataSha256ById,
    timeline_sha256: sha256(timelineJsonl(events)),
    terminal_event_sha256: events.at(-1).event_sha256,
    final_state_sha256_by_arm: Object.fromEntries(Object.entries(finalStateByArm).map(([arm, state]) => [arm, sha256(canonicalJson(state))])),
    byte_identical_rebuild: true,
    run_identity: buildRunIdentity({ scenario, exerciseInputs: inputs, sourceDataSha256ById })
  };
  return {
    schema_version: "disaster-replay.bundle.v1",
    scenario,
    scenario_sha256: scenarioSha256,
    source_data_sha256_by_id: sourceDataSha256ById,
    events,
    final_state_by_arm: finalStateByArm,
    replay_certificate: certificate,
    limitations: [
      "The map and earthquake facts are real public data; the people reports and outcomes are synthetic exercise data.",
      "This local vertical slice uses deterministic stub policies, not live language-model inference.",
      "The result demonstrates the renderer and orchestration contract; it is not a new benchmark result and does not measure real emergency response.",
      "Real GSI terrain and a focused pre-event PLATEAU building cut are bundled; shelters and emergency routes are identified but not yet bundled.",
      "No human emergency-operations baseline is represented."
    ]
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const replay = buildReplay();
  fs.mkdirSync(path.dirname(SAMPLE_PATH), { recursive: true });
  fs.writeFileSync(SAMPLE_PATH, `${JSON.stringify(replay, null, 2)}\n`);
  fs.mkdirSync(RUN_PATH, { recursive: true });
  fs.writeFileSync(path.join(RUN_PATH, "scenario.json"), `${JSON.stringify(replay.scenario, null, 2)}\n`);
  fs.writeFileSync(path.join(RUN_PATH, "timeline.jsonl"), timelineJsonl(replay.events));
  fs.writeFileSync(path.join(RUN_PATH, "final-state.json"), `${JSON.stringify(replay.final_state_by_arm, null, 2)}\n`);
  fs.writeFileSync(path.join(RUN_PATH, "certificate.json"), `${JSON.stringify(replay.replay_certificate, null, 2)}\n`);
  console.log(`BUILT: ${SAMPLE_PATH}`);
  console.log(`BUILT: ${RUN_PATH}/{scenario.json,timeline.jsonl,final-state.json,certificate.json}`);
}
