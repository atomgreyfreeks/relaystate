import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const basePath = path.join(root, "product/disaster-replay/scenarios/kumamoto-2026-real-response/scenario.json");
const packageDir = path.join(root, "product/disaster-replay/scenarios/kumamoto-2026-full-incident");
const overlayPath = path.join(packageDir, "decision-overlay.json");
const outputPath = path.join(packageDir, "scenario.json");

const readJson = (candidate) => JSON.parse(fs.readFileSync(candidate, "utf8"));
const base = readJson(basePath);
const overlay = readJson(overlayPath);

if (overlay.schema_version !== "kumamoto-full-incident.decision-overlay.v1") {
  throw new Error(`unsupported overlay schema ${overlay.schema_version}`);
}

const unique = (rows, key, label) => {
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row[key])) throw new Error(`duplicate ${label} ${row[key]}`);
    ids.add(row[key]);
  }
  return rows;
};

const scenario = {
  ...base,
  ...overlay.scenario,
  sources: unique([...base.sources, ...overlay.sources], "source_id", "source"),
  observations: unique([...base.observations, ...overlay.observations], "observation_id", "observation"),
  unknowns: unique([...base.unknowns, ...overlay.unknowns], "unknown_id", "unknown"),
  targets: unique([...base.targets, ...overlay.targets], "target_id", "target"),
  resources: unique([...base.resources, ...overlay.resources], "resource_id", "resource"),
  decision_slots: unique([...base.decision_slots, ...overlay.decision_slots], "decision_slot_id", "decision slot")
    .sort((left, right) => left.reconstruction_slot_number - right.reconstruction_slot_number),
  limitations: [...base.limitations, ...overlay.limitations],
};

fs.writeFileSync(outputPath, `${JSON.stringify(scenario, null, 2)}\n`, "utf8");
process.stdout.write(`wrote ${path.relative(root, outputPath)} with ${scenario.decision_slots.length} decision slots\n`);
