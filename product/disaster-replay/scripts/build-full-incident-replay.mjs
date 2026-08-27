import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../../..");
const PACKAGE = path.join(ROOT, "product/disaster-replay");
export const RUN_DIR = path.join(PACKAGE, "runs/kumamoto-2026-full-incident/260728-72h");
const DECISION_SCENARIO = path.join(PACKAGE, "scenarios/kumamoto-2026-full-incident/scenario.json");
const TIMELINE_INPUTS = path.join(PACKAGE, "scenarios/kumamoto-2026-full-incident/timeline-inputs.json");
const JMA_SEQUENCE = path.join(PACKAGE, "data/full-incident/jma-2026-kumamoto-earthquake-sequence.json");
const JMA_UPDATES = path.join(PACKAGE, "data/jma-2026-kumamoto-official-updates.json");
const ROADS = path.join(PACKAGE, "data/mlit-2026-kumamoto-road-restrictions.geojson");
const LANDSLIDES = path.join(PACKAGE, "data/gsi-2026-kumamoto-landslides.geojson");
const TERRAIN_DEM = path.join(PACKAGE, "data/full-incident/gsi-dem10b-z11-full-incident.png");
const TERRAIN_METADATA = path.join(PACKAGE, "data/full-incident/gsi-dem10b-z11-full-incident.meta.json");
const REGISTERED_MANIFEST = path.join(ROOT, "experiments/kumamoto-real-response/validation/freeze-manifest.json");
const REGISTERED_RESULTS = path.join(ROOT, "experiments/kumamoto-real-response/results/production-v1.1");
const REGISTERED_ANALYSIS = path.join(REGISTERED_RESULTS, "production-analysis.json");
const CAMPAIGN_MANIFEST = path.join(ROOT, "experiments/kumamoto-full-incident-campaign/validation/freeze-manifest.json");
const CAMPAIGN_RESULTS = path.join(ROOT, "experiments/kumamoto-full-incident-campaign/results/demonstration-v1");
const ZERO_HASH = "0".repeat(64);
const START_AT = "2026-07-28T16:27:15.200+09:00";
const END_AT = "2026-07-31T16:27:15.200+09:00";
const REGISTERED_SLOT_NUMBERS = new Set([1, 2, 4, 6, 9]);
const ARM_IDS = ["plain_summary", "evidence_table", "evidence_feedback"];

const EXTRA_SOURCES = [
  {
    source_id: "source-prefecture-headquarters-feed",
    publisher: "Kumamoto Prefecture",
    title: "Disaster headquarters archive feed",
    url: "https://portal.bousai.pref.kumamoto.jp/data/headquarter/headquarter.json",
  },
  {
    source_id: "source-cabinet-report-0823",
    publisher: "Cabinet Office, Government of Japan",
    title: "Kumamoto earthquake situation report current through 2026-08-23",
    url: "https://www.bousai.go.jp/updates/r8kumamoto_jishin/status/pdf/r8kumamoto_jishin_20260823.pdf",
  },
  {
    source_id: "source-cabinet-hq-meeting-1",
    publisher: "Cabinet Office, Government of Japan",
    title: "First Extreme Disaster Management Headquarters meeting materials",
    url: "https://www.bousai.go.jp/updates/r8kumamoto_jishin/pdf/r8kumamoto_dai1kai_giji.pdf",
  },
  {
    source_id: "source-cabinet-hq-meeting-2",
    publisher: "Cabinet Office, Government of Japan",
    title: "Second Extreme Disaster Management Headquarters meeting materials",
    url: "https://www.bousai.go.jp/updates/r8kumamoto_jishin/pdf/r8kumamoto_dai2kai_giji.pdf",
  },
  {
    source_id: "source-gsi-landslides",
    publisher: "Geospatial Information Authority of Japan",
    title: "2026 Kumamoto earthquake landslide interpretation layer",
    url: "https://www.gsi.go.jp/BOUSAI/20260728_kumamoto_earthquake.html",
  },
];

const LOCATION_POINTS = {
  epicenter: [130.67833333333334, 32.625],
  "prefecture-hq": [130.7417, 32.7898],
  yatsushiro: [130.6017, 32.5074],
  hikawa: [130.6748, 32.5825],
  "yatsushiro-sea": [130.48, 32.48],
  uki: [130.6842, 32.6478],
  mifune: [130.8019, 32.7145],
  kashima: [130.7563, 32.7408],
  mashiki: [130.8167, 32.7912],
  uto: [130.6581, 32.6873],
  "kumamoto-city": [130.7079, 32.8031],
  kosa: [130.8114, 32.6516],
  "yatsushiro-port": [130.5595, 32.5119],
};

const DECISION_LOCATIONS = {
  1: "epicenter",
  2: "kashima",
  3: "yatsushiro-port",
  4: "uki",
  5: "prefecture-hq",
  6: "kashima",
  7: "prefecture-hq",
  8: "yatsushiro",
  9: "yatsushiro",
  10: "prefecture-hq",
  11: "uki",
};

function readJson(candidate) {
  return JSON.parse(fs.readFileSync(candidate, "utf8"));
}

function relative(candidate) {
  return path.relative(ROOT, candidate).split(path.sep).join("/");
}

/** Paths in scenario.world_features are resolved from the disaster-replay package, not repo root. */
function packageRelative(candidate) {
  return path.relative(PACKAGE, candidate).split(path.sep).join("/");
}

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

export function fileSha256(candidate) {
  return sha256(fs.readFileSync(candidate));
}

export function timelineJsonl(events) {
  return `${events.map(canonicalJson).join("\n")}\n`;
}

function selfHash(object, hashKey) {
  return sha256(canonicalJson(Object.fromEntries(Object.entries(object).filter(([key]) => key !== hashKey))));
}

function point(locationId) {
  const coordinates = LOCATION_POINTS[locationId];
  if (!coordinates) throw new Error(`unknown location ${locationId}`);
  return { type: "Point", coordinates };
}

function centroid(geometry) {
  const positions = [];
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      positions.push([value[0], value[1]]);
    } else {
      value.forEach(visit);
    }
  };
  visit(geometry.coordinates);
  if (!positions.length) return null;
  return pointFromCoordinates([
    positions.reduce((sum, row) => sum + row[0], 0) / positions.length,
    positions.reduce((sum, row) => sum + row[1], 0) / positions.length,
  ]);
}

function pointFromCoordinates(coordinates) {
  return { type: "Point", coordinates };
}

function millis(iso) {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) throw new Error(`invalid timestamp ${iso}`);
  return parsed;
}

function simTime(iso) {
  return Math.max(0, Math.floor((millis(iso) - millis(START_AT)) / 1000));
}

function normalizeJstMinute(raw) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+|\/)(\d{1,2}):(\d{2})$/.exec(raw ?? "");
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00+09:00`;
}

function reportClock(reportId) {
  const stamp = reportId.slice(0, 14);
  if (!/^\d{14}$/.test(stamp)) throw new Error(`report ID has no second-resolved clock: ${reportId}`);
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(8, 10)}:${stamp.slice(10, 12)}:${stamp.slice(12, 14)}+09:00`;
}

function actFor(at, acts) {
  const time = millis(at);
  const act = acts.find((row) => time >= millis(row.starts_at) && time <= millis(row.ends_at));
  if (!act) throw new Error(`timestamp outside acts: ${at}`);
  return act;
}

function automaticRound(at, act) {
  const prefix = act.act_id.replace(/^act-\d+-/, "");
  return { round_id: `continuous-${prefix}`, round_label: `${act.label}: continuous regional feed` };
}

function sourceCatalog(decisionScenario) {
  const normalized = decisionScenario.sources.map((source) => ({
    ...source,
    classification: source.classification ?? "OBSERVED_PUBLIC",
  }));
  const byId = new Map([...normalized, ...EXTRA_SOURCES.map((source) => ({ ...source, classification: "OBSERVED_PUBLIC" }))]
    .map((source) => [source.source_id, source]));
  return [...byId.values()].sort((left, right) => left.source_id.localeCompare(right.source_id));
}

function verifyManifest(candidate, expectedCount) {
  const manifest = readJson(candidate);
  if (manifest.freeze_manifest_hash !== selfHash(manifest, "freeze_manifest_hash")) {
    throw new Error(`bad manifest self-hash: ${relative(candidate)}`);
  }
  if (manifest.production_configs.length !== expectedCount) {
    throw new Error(`unexpected config count in ${relative(candidate)}`);
  }
  return manifest;
}

function verifyCell(resultDir, config, manifest) {
  const target = path.join(resultDir, config.config_id);
  const resultPath = path.join(target, "result.json");
  const callsPath = path.join(target, "calls.jsonl");
  const certificatePath = path.join(target, "certificate.json");
  for (const candidate of [resultPath, callsPath, certificatePath]) {
    if (!fs.existsSync(candidate)) throw new Error(`missing campaign artifact ${relative(candidate)}`);
  }
  const result = readJson(resultPath);
  const certificate = readJson(certificatePath);
  if (certificate.certificate_hash !== selfHash(certificate, "certificate_hash")) {
    throw new Error(`bad cell certificate self-hash ${config.config_id}`);
  }
  if (certificate.manifest_hash !== manifest.freeze_manifest_hash || result.manifest_hash !== manifest.freeze_manifest_hash) {
    throw new Error(`manifest mismatch ${config.config_id}`);
  }
  if (certificate.result_sha256 !== fileSha256(resultPath) || certificate.calls_sha256 !== fileSha256(callsPath)) {
    throw new Error(`cell artifact hash mismatch ${config.config_id}`);
  }
  if (canonicalJson(result.config) !== canonicalJson(config)) throw new Error(`config mismatch ${config.config_id}`);
  for (const arm of ARM_IDS) if (!result.arms[arm]?.decision || !result.arms[arm]?.score) throw new Error(`missing arm ${arm}`);
  return { result, certificate };
}

function loadCampaign(resultDir, manifestPath, expectedCount) {
  const manifest = verifyManifest(manifestPath, expectedCount);
  const cells = manifest.production_configs.map((config) => ({ config, ...verifyCell(resultDir, config, manifest) }));
  return { manifest, cells };
}

function verifyCampaignSeal(campaign) {
  const analysisPath = path.join(CAMPAIGN_RESULTS, "demonstration-analysis.json");
  const sealPath = path.join(CAMPAIGN_RESULTS, "campaign-certificate.json");
  if (!fs.existsSync(analysisPath) || !fs.existsSync(sealPath)) {
    throw new Error("demonstration analysis and campaign certificate are required before replay sealing");
  }
  const seal = readJson(sealPath);
  if (seal.certificate_hash !== selfHash(seal, "certificate_hash")) throw new Error("bad campaign certificate self-hash");
  if (!seal.complete || seal.certified_config_count !== campaign.cells.length) throw new Error("campaign certificate is incomplete");
  if (seal.manifest_hash !== campaign.manifest.freeze_manifest_hash) throw new Error("campaign seal manifest mismatch");
  if (seal.analysis_sha256 !== fileSha256(analysisPath)) throw new Error("campaign analysis hash mismatch");
  let previous = ZERO_HASH;
  seal.configuration_chain.forEach((node, sequence) => {
    const expectedCell = campaign.cells[sequence];
    if (node.sequence !== sequence || node.config_id !== expectedCell.config.config_id) throw new Error(`bad chain position ${sequence}`);
    if (node.cell_certificate_hash !== expectedCell.certificate.certificate_hash) throw new Error(`bad chain cell ${sequence}`);
    if (node.previous_chain_sha256 !== previous || node.chain_sha256 !== selfHash(node, "chain_sha256")) {
      throw new Error(`bad campaign chain ${sequence}`);
    }
    previous = node.chain_sha256;
  });
  if (seal.terminal_chain_sha256 !== previous) throw new Error("bad campaign terminal chain");
  return { seal, analysisPath, sealPath };
}

function compactChoice(cell, arm) {
  const row = cell.result.arms[arm];
  return {
    graph_id: arm,
    config_id: cell.config.config_id,
    seed: cell.config.seed,
    decision: row.decision,
    score: row.score,
    historical_overlap: row.historical_overlap,
    certificate_hash: cell.certificate.certificate_hash,
  };
}

function choicesForSlot(campaign, slotId) {
  return campaign.cells
    .filter((cell) => cell.config.slot_id === slotId)
    .sort((left, right) => left.config.seed - right.config.seed)
    .flatMap((cell) => ARM_IDS.map((arm) => compactChoice(cell, arm)));
}

function observed(sourceIds, explanation) {
  return {
    classification: "OBSERVED_PUBLIC",
    input_classifications: ["OBSERVED_PUBLIC"],
    source_ids: [...new Set(sourceIds)],
    explanation,
  };
}

function recorded(sourceIds, explanation) {
  return {
    classification: "RECORDED_MODEL_OUTPUT",
    input_classifications: ["OBSERVED_PUBLIC", "RECORDED_MODEL_OUTPUT"],
    source_ids: [...new Set(sourceIds)],
    explanation,
  };
}

function storyMeta({ act, round, at, precision = "SECOND", holdSeconds = 2, priority = "NORMAL", camera = "REGIONAL" }) {
  return {
    act_id: act.act_id,
    act_label: act.label,
    round_id: round.round_id,
    round_label: round.round_label,
    real_clock: at,
    time_precision: precision,
    hold_seconds: holdSeconds,
    story_priority: priority,
    camera,
  };
}

function buildRows(inputs) {
  const { timelineInputs, sequence, updates, roads, decisionScenario, registered, campaign } = inputs;
  const rows = [];
  let stable = 0;
  const add = (at, rank, row) => rows.push({ at, rank, stable: stable += 1, ...row });

  const firstAct = timelineInputs.acts[0];
  add(START_AT, 0, {
    type: "WORLD_INITIALIZED",
    actor: { kind: "WORLD", id: "kumamoto-regional-world", role: "historical first-72-hours regional event stream" },
    entityRefs: ["kumamoto-2026-full-incident"],
    geometry: point("epicenter"),
    provenance: observed(["source-jma-mainshock-sequence"], "The incident clock, hypocentre, magnitude and intensity are from the official JMA sequence."),
    payload: {
      incident: {
        occurred_at: START_AT,
        magnitude: 7.1,
        maximum_intensity: "JMA 7",
        latitude: 32.625,
        longitude: 130.67833333333334,
      },
      disclosure: "Observed public history plus clearly labeled recorded model counterfactuals; no synthetic exercise events.",
      story: storyMeta({ act: firstAct, round: { round_id: "round-01-shock-and-trigger", round_label: "The signal before the bulletin" }, at: START_AT, priority: "ANCHOR", holdSeconds: 5, camera: "EPICENTER" }),
    },
  });

  const staticSources = [
    ["source-jma-mainshock-sequence", JMA_SEQUENCE, sequence.event_count, "official earthquake sequence"],
    ["source-jma-mainshock-sequence", JMA_UPDATES, updates.updates.length, "official main-shock bulletins"],
    ["source-mlit-road-snapshot-0729-0500", ROADS, roads.features.length, "observed road-restriction geometry snapshot"],
    ["source-gsi-landslides", LANDSLIDES, inputs.landslides.features.length, "observed landslide interpretation layer"],
  ];
  staticSources.forEach(([sourceId, artifactPath, recordCount, role], index) => add(START_AT, 5 + index, {
    type: "SOURCE_INGESTED",
    actor: { kind: "SOURCE", id: sourceId, role },
    entityRefs: [relative(artifactPath)],
    geometry: null,
    provenance: observed([sourceId], `The immutable local ${role} is identified by its content hash.`),
    payload: {
      artifact_path: relative(artifactPath),
      artifact_sha256: fileSha256(artifactPath),
      record_count: recordCount,
      story: storyMeta({ act: firstAct, round: { round_id: "round-01-shock-and-trigger", round_label: "The signal before the bulletin" }, at: START_AT, precision: "STATIC_SOURCE", holdSeconds: 0 }),
    },
  }));

  for (const update of updates.updates) {
    const at = reportClock(update.report_id);
    const act = actFor(at, timelineInputs.acts);
    const round = at <= "2026-07-28T16:30:59+09:00"
      ? { round_id: "round-02-first-public-picture", round_label: "The first public picture" }
      : at <= "2026-07-28T16:35:59+09:00"
        ? { round_id: "round-03-two-silent-towns", round_label: "Two towns stay silent" }
        : automaticRound(at, act);
    add(at, 20, {
      type: "SOURCE_INGESTED",
      actor: { kind: "SOURCE", id: "source-jma-mainshock-sequence", role: "official public earthquake bulletin" },
      entityRefs: [update.report_id, update.event_id],
      geometry: update.hypocenter_coordinate ? point("epicenter") : null,
      temporal: { basis: "OFFICIAL_REPORT_TIME", precision: "MINUTE", observed_at: update.report_datetime, available_at: update.report_datetime },
      provenance: observed(["source-jma-mainshock-sequence"], "The bulletin and its second-resolved publication clock are preserved from the JMA report identifier."),
      payload: {
        ...update,
        published_at_exact: at,
        story: storyMeta({ act, round, at, priority: "ANCHOR", holdSeconds: 4, camera: "REGIONAL_BULLETIN" }),
      },
    });
  }

  for (const milestone of timelineInputs.milestones) {
    const act = timelineInputs.acts.find((row) => row.act_id === milestone.act_id);
    const at = milestone.at;
    add(at, 40, {
      type: "OUTCOME_OBSERVED",
      actor: { kind: "SOURCE", id: milestone.source_ids[0], role: "reconstructed public response record" },
      entityRefs: [milestone.id],
      geometry: point(milestone.location_id),
      temporal: null,
      provenance: observed(milestone.source_ids, "This response milestone is transcribed from the cited reconstruction sources; precision and aggregate caveats remain in the payload."),
      payload: {
        milestone_id: milestone.id,
        headline: milestone.headline,
        detail: milestone.detail,
        values: milestone.payload,
        occurred_at: milestone.occurred_at === undefined ? at : milestone.occurred_at,
        display_placement_at: at,
        story: storyMeta({
          act,
          round: { round_id: milestone.round_id, round_label: milestone.round_label },
          at,
          precision: milestone.time_precision ?? "SECOND",
          priority: /fire-mobilization|two-rescue|water|seventy-two|silent|headquarters|cabinet-report/.test(milestone.id) ? "ANCHOR" : "NORMAL",
          holdSeconds: /seventy-two|two-rescue|water-push|rescue-water-turn/.test(milestone.id) ? 5 : 2,
          camera: milestone.location_id === "prefecture-hq" ? "COMMAND" : "SITE",
        }),
      },
    });
  }

  const windowAftershocks = sequence.events.filter((event) => millis(event.origin_time) >= millis(START_AT) && millis(event.origin_time) <= millis(END_AT));
  for (const aftershock of windowAftershocks) {
    const at = aftershock.origin_time;
    const act = actFor(at, timelineInputs.acts);
    add(at, 30, {
      type: "OUTCOME_OBSERVED",
      actor: { kind: "SOURCE", id: "source-jma-mainshock-sequence", role: "official regional earthquake sequence" },
      entityRefs: [aftershock.event_id],
      geometry: pointFromCoordinates([aftershock.hypocenter.longitude, aftershock.hypocenter.latitude]),
      temporal: { basis: "OFFICIAL_REPORT_TIME", precision: "MINUTE", observed_at: at, available_at: aftershock.reports[0]?.report_datetime ?? at },
      provenance: observed(["source-jma-mainshock-sequence"], "The aftershock origin, hypocentre, magnitude and maximum intensity are copied from the official JMA sequence."),
      payload: {
        earthquake: {
          event_id: aftershock.event_id,
          origin_time: aftershock.origin_time,
          area_name: aftershock.area_name,
          area_name_english: aftershock.area_name_english,
          magnitude: aftershock.magnitude,
          maximum_intensity: aftershock.maximum_intensity,
          depth_m: aftershock.hypocenter.depth_m,
          report_count: aftershock.report_count,
        },
        story: storyMeta({ act, round: automaticRound(at, act), at, precision: "MINUTE", priority: Number(aftershock.magnitude) >= 5 ? "ANCHOR" : "AMBIENT", holdSeconds: Number(aftershock.magnitude) >= 5 ? 3 : 0, camera: "SEISMIC_PULSE" }),
      },
    });
  }

  for (const feature of roads.features) {
    const sourceAt = normalizeJstMinute(feature.properties.restriction_started_at);
    if (!sourceAt || millis(sourceAt) > millis(END_AT)) continue;
    const sameIncidentMinute = sourceAt === "2026-07-28T16:27:00+09:00";
    if (millis(sourceAt) < millis(START_AT) && !sameIncidentMinute) continue;
    const at = sameIncidentMinute ? START_AT : sourceAt;
    const act = actFor(at, timelineInputs.acts);
    add(at, 35, {
      type: "OUTCOME_OBSERVED",
      actor: { kind: "SOURCE", id: "source-mlit-road-snapshot-0729-0500", role: "observed road restriction snapshot" },
      entityRefs: [feature.id],
      geometry: feature.geometry,
      temporal: { basis: "SOURCE_FIELD_RECONSTRUCTED_FROM_SNAPSHOT", precision: "MINUTE", observed_at: sourceAt, available_at: "2026-07-29T07:00:00+09:00" },
      provenance: observed(["source-mlit-road-snapshot-0729-0500"], "The restriction start minute and geometry come from a later official snapshot; the minute is not a dispatch or reopening clock. The incident-minute record is placed at the exact replay boundary because its source has only minute precision."),
      payload: {
        restriction_id: feature.id,
        restriction: feature.properties,
        display_centroid: centroid(feature.geometry),
        story: storyMeta({ act, round: automaticRound(at, act), at: sourceAt, precision: sameIncidentMinute ? "MINUTE_CLAMPED_TO_INCIDENT_BOUNDARY" : "MINUTE_SOURCE_FIELD", priority: "AMBIENT", holdSeconds: 0, camera: "ROAD" }),
      },
    });
  }

  for (const slot of [...decisionScenario.decision_slots].sort((left, right) => left.reconstruction_slot_number - right.reconstruction_slot_number)) {
    const at = slot.cutoff_at;
    const act = actFor(at, timelineInputs.acts);
    const historicSources = slot.historical_choice.source_ids;
    const registeredChoices = REGISTERED_SLOT_NUMBERS.has(slot.reconstruction_slot_number)
      ? choicesForSlot(registered, slot.decision_slot_id)
      : [];
    const demonstrationChoices = choicesForSlot(campaign, slot.decision_slot_id);
    if (registeredChoices.length !== (REGISTERED_SLOT_NUMBERS.has(slot.reconstruction_slot_number) ? 24 : 0)) {
      throw new Error(`registered choice count mismatch for ${slot.decision_slot_id}`);
    }
    if (demonstrationChoices.length !== 24) throw new Error(`campaign choice count mismatch for ${slot.decision_slot_id}`);
    add(at, 60, {
      type: "DECISION_PROPOSED",
      actor: { kind: "AGENT", id: "recorded-three-graph-campaign", role: "frozen counterfactual decision replay" },
      entityRefs: [slot.decision_slot_id, ...slot.eligible_target_ids],
      geometry: point(DECISION_LOCATIONS[slot.reconstruction_slot_number]),
      provenance: recorded(historicSources, "Historical action and frozen recorded outputs from all three graphs are co-located without treating overlap as success."),
      graph: { graph_id: "three-graph-recorded-choices", node_id: slot.decision_slot_id, edge_id: null },
      payload: {
        classification: "RECORDED_MODEL_COUNTERFACTUALS_DESCRIPTIVE_ONLY",
        registered_claims: [],
        decision_slot: {
          decision_slot_id: slot.decision_slot_id,
          reconstruction_slot_number: slot.reconstruction_slot_number,
          title: slot.title,
          task: slot.task,
          decider: slot.decider,
          cutoff_at: slot.cutoff_at,
          assumptions: slot.assumptions,
          historical_choice: slot.historical_choice,
        },
        registered_five_slot_experiment: REGISTERED_SLOT_NUMBERS.has(slot.reconstruction_slot_number) ? {
          manifest_hash: registered.manifest.freeze_manifest_hash,
          choices: registeredChoices,
        } : null,
        full_incident_demonstration: {
          claim_boundary: "DESCRIPTIVE_ONLY_NO_REGISTERED_CLAIMS",
          manifest_hash: campaign.manifest.freeze_manifest_hash,
          choices: demonstrationChoices,
        },
        story: storyMeta({ act, round: automaticRound(at, act), at, priority: "DECISION", holdSeconds: 6, camera: "DECISION_SPLIT" }),
      },
    });
  }
  return rows;
}

function sealEvents(rows, scenarioId) {
  rows.sort((left, right) => simTime(left.at) - simTime(right.at) || left.rank - right.rank || left.stable - right.stable);
  const events = [];
  let previous = ZERO_HASH;
  let worldEventId = null;
  for (const row of rows) {
    const sequence = events.length;
    const base = {
      schema_version: "disaster-replay.event.v1",
      event_id: `${scenarioId}:e${String(sequence).padStart(4, "0")}`,
      sequence,
      sim_time_s: simTime(row.at),
      arm: "SHARED",
      type: row.type,
      actor: row.actor,
      entity_refs: [...new Set(row.entityRefs ?? [])],
      caused_by: row.type === "WORLD_INITIALIZED" ? [] : [worldEventId],
      geometry: row.geometry ?? null,
      temporal: row.temporal ?? null,
      provenance: row.provenance,
      graph: row.graph ?? null,
      payload: row.payload ?? {},
      previous_event_sha256: previous,
    };
    const event = { ...base, event_sha256: sha256(canonicalJson(base)) };
    if (row.type === "WORLD_INITIALIZED") worldEventId = event.event_id;
    previous = event.event_sha256;
    events.push(event);
  }
  return events;
}

function sourceHashes(sealInfo) {
  const paths = [
    DECISION_SCENARIO,
    TIMELINE_INPUTS,
    JMA_SEQUENCE,
    JMA_UPDATES,
    ROADS,
    LANDSLIDES,
    TERRAIN_DEM,
    TERRAIN_METADATA,
    REGISTERED_MANIFEST,
    REGISTERED_ANALYSIS,
    CAMPAIGN_MANIFEST,
    sealInfo.analysisPath,
    sealInfo.sealPath,
  ];
  return Object.fromEntries(paths.map((candidate) => [relative(candidate), fileSha256(candidate)]));
}

function sourceHashesById(sourceDataSha256ByPath) {
  const sources = {
    earthquake_sequence: JMA_SEQUENCE,
    official_mainshock_updates: JMA_UPDATES,
    road_restrictions: ROADS,
    landslide_interpretation: LANDSLIDES,
    terrain_dem_png: TERRAIN_DEM,
    terrain_dem_metadata: TERRAIN_METADATA,
  };
  return Object.fromEntries(Object.entries(sources).map(([id, candidate]) => {
    const hash = sourceDataSha256ByPath[relative(candidate)];
    if (!hash) throw new Error(`source hash missing for ${id}: ${relative(candidate)}`);
    return [id, hash];
  }));
}

function buildFinalState(events, sourceDataSha256ByPath, sourceDataSha256ById) {
  const milestones = events.filter((event) => event.payload.milestone_id);
  const lastShelter = milestones.filter((event) => event.payload.values.scope === "PREFECTURE_AGGREGATE" && event.payload.values.occupants).at(-1);
  const waterMunicipalities = milestones.find((event) => event.payload.milestone_id === "prefecture-hq-meeting-4-1600")
    ?.payload.values.water_municipalities ?? [];
  return {
    schema_version: "kumamoto-full-incident.final-state.v1",
    window: { starts_at: START_AT, ends_at: END_AT, elapsed_hours: 72 },
    event_count: events.length,
    event_count_by_type: Object.fromEntries([...new Set(events.map((event) => event.type))]
      .sort().map((type) => [type, events.filter((event) => event.type === type).length])),
    act_event_counts: Object.fromEntries([...new Set(events.map((event) => event.payload.story?.act_id).filter(Boolean))]
      .map((actId) => [actId, events.filter((event) => event.payload.story?.act_id === actId).length])),
    decision_moments: events.filter((event) => event.type === "DECISION_PROPOSED").length,
    recorded_agent_choices: events.filter((event) => event.type === "DECISION_PROPOSED")
      .reduce((sum, event) => sum + event.payload.full_incident_demonstration.choices.length + (event.payload.registered_five_slot_experiment?.choices.length ?? 0), 0),
    aftershocks: events.filter((event) => event.payload.earthquake).length,
    jma_mainshock_bulletins: events.filter((event) => event.payload.report_id).length,
    timed_road_restrictions: events.filter((event) => event.payload.restriction_id).length,
    road_snapshot_only_restrictions: 6,
    latest_shelter_aggregate: lastShelter ? {
      as_of: lastShelter.payload.display_placement_at,
      open_shelters: lastShelter.payload.values.open_shelters,
      occupants: lastShelter.payload.values.occupants,
      scope: "PREFECTURE_AGGREGATE",
    } : null,
    named_water_municipalities: waterMunicipalities,
    later_observed_outcome_not_available_to_agents: {
      as_of: "2026-08-23",
      classification: "LATER_OBSERVED_HARM_GEOGRAPHY_NOT_AN_INPUT_TO_FIRST_72_HOURS",
      deaths: 38,
      named_municipalities: { Yatsushiro: 20, Kashima: 7, Hikawa: 5, Uki: 3, Kosa: 1 },
      other_not_named_here: 2,
      source_ids: ["source-cabinet-report-0823"],
    },
    disclosure: "Shelter and casualty aggregates remain aggregates. Later outcome geography is segregated and was never exposed to the recorded decisions.",
    source_data_sha256_by_path: sourceDataSha256ByPath,
    source_data_sha256_by_id: sourceDataSha256ById,
  };
}

function writeJson(candidate, value) {
  fs.writeFileSync(candidate, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function buildFullIncidentReplay({ write = true } = {}) {
  const decisionScenario = readJson(DECISION_SCENARIO);
  const timelineInputs = readJson(TIMELINE_INPUTS);
  const sequence = readJson(JMA_SEQUENCE);
  const updates = readJson(JMA_UPDATES);
  const roads = readJson(ROADS);
  const landslides = readJson(LANDSLIDES);
  const registered = loadCampaign(REGISTERED_RESULTS, REGISTERED_MANIFEST, 40);
  const campaign = loadCampaign(CAMPAIGN_RESULTS, CAMPAIGN_MANIFEST, 88);
  const campaignSeal = verifyCampaignSeal(campaign);
  const sources = sourceCatalog(decisionScenario);
  const allReferencedSources = new Set([
    ...timelineInputs.milestones.flatMap((row) => row.source_ids),
    ...decisionScenario.decision_slots.flatMap((row) => row.historical_choice.source_ids),
    "source-gsi-landslides",
  ]);
  const catalogIds = new Set(sources.map((source) => source.source_id));
  for (const sourceId of allReferencedSources) if (!catalogIds.has(sourceId)) throw new Error(`source not catalogued: ${sourceId}`);

  const scenario = {
    schema_version: "kumamoto-full-incident.replay-scenario.v1",
    scenario_id: "kumamoto-2026-full-incident",
    title: "Kumamoto 2026: the first seventy-two hours as one regional event stream",
    incident: { occurred_at: START_AT, ends_at: END_AT, latitude: 32.625, longitude: 130.67833333333334, magnitude: 7.1, maximum_intensity: "JMA 7" },
    acts: timelineInputs.acts,
    source_catalog: sources,
    world_features: {
      earthquake_sequence: packageRelative(JMA_SEQUENCE),
      official_mainshock_updates: packageRelative(JMA_UPDATES),
      road_restrictions: packageRelative(ROADS),
      landslide_interpretation: packageRelative(LANDSLIDES),
      terrain_dem_png: packageRelative(TERRAIN_DEM),
      terrain_dem_metadata: packageRelative(TERRAIN_METADATA),
    },
    decisions: {
      slot_count: decisionScenario.decision_slots.length,
      registered_five_slot_manifest_hash: registered.manifest.freeze_manifest_hash,
      full_incident_demonstration_manifest_hash: campaign.manifest.freeze_manifest_hash,
      model: campaign.manifest.model,
      graphs: ARM_IDS,
      full_incident_claim_boundary: campaign.manifest.claim_boundary,
      registered_results_path: relative(REGISTERED_RESULTS),
      full_incident_demonstration_results_path: relative(CAMPAIGN_RESULTS),
    },
    disclosure: "A sourced historical stream with recorded model counterfactuals. The demonstration creates no registered claim and historical overlap is not success.",
    limitations: decisionScenario.limitations,
  };
  const rows = buildRows({ timelineInputs, sequence, updates, roads, landslides, decisionScenario, registered, campaign });
  const events = sealEvents(rows, scenario.scenario_id);
  const sourceDataSha256ByPath = sourceHashes(campaignSeal);
  const sourceDataSha256ById = sourceHashesById(sourceDataSha256ByPath);
  scenario.source_data_sha256_by_path = sourceDataSha256ByPath;
  scenario.source_data_sha256_by_id = sourceDataSha256ById;
  const finalState = buildFinalState(events, sourceDataSha256ByPath, sourceDataSha256ById);
  const timelineText = timelineJsonl(events);
  const scenarioSha256 = sha256(canonicalJson(scenario));
  const finalStateSha256 = sha256(canonicalJson(finalState));
  const certificate = {
    schema_version: "kumamoto-full-incident.replay-certificate.v1",
    scenario_id: scenario.scenario_id,
    event_count: events.length,
    scenario_sha256: scenarioSha256,
    timeline_sha256: sha256(timelineText),
    terminal_event_sha256: events.at(-1).event_sha256,
    final_state_sha256: finalStateSha256,
    source_data_sha256_by_path: sourceDataSha256ByPath,
    source_data_sha256_by_id: sourceDataSha256ById,
    registered_manifest_hash: registered.manifest.freeze_manifest_hash,
    demonstration_manifest_hash: campaign.manifest.freeze_manifest_hash,
    demonstration_campaign_certificate_hash: campaignSeal.seal.certificate_hash,
    demonstration_campaign_terminal_chain_sha256: campaignSeal.seal.terminal_chain_sha256,
    registered_cell_count: registered.cells.length,
    demonstration_cell_count: campaign.cells.length,
    hash_rule: "SHA-256 of recursively key-sorted compact UTF-8 JSON; timeline is one canonical event plus newline per line.",
    rebuild_command: "node product/disaster-replay/scripts/build-full-incident-replay.mjs",
  };
  certificate.certificate_hash = selfHash(certificate, "certificate_hash");
  if (write) {
    fs.mkdirSync(RUN_DIR, { recursive: true });
    writeJson(path.join(RUN_DIR, "scenario.json"), scenario);
    fs.writeFileSync(path.join(RUN_DIR, "timeline.jsonl"), timelineText, "utf8");
    writeJson(path.join(RUN_DIR, "final-state.json"), finalState);
    writeJson(path.join(RUN_DIR, "certificate.json"), certificate);
  }
  return { scenario, events, finalState, certificate, timelineText };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const replay = buildFullIncidentReplay();
  process.stdout.write(`wrote ${relative(RUN_DIR)}: ${replay.events.length} events, terminal ${replay.certificate.terminal_event_sha256}\n`);
}
