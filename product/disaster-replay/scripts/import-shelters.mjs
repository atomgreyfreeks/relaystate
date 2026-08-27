import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT = path.join(PACKAGE, "data", "gsi-uki-designated-shelters.geojson");
const BASE = "https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/geoJSON";
const SOURCES = [
  { id: "43213_1", kind: "DESIGNATED_SHELTER", url: `${BASE}/43213_1.geojson` },
  { id: "43213_2", kind: "EARTHQUAKE_EVACUATION_PLACE", url: `${BASE}/43213_2.geojson` }
];

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const fetchBuffer = (url) => execFileSync("curl", ["--fail", "--location", "--retry", "3", "--silent", "--show-error", url], { maxBuffer: 8 * 1024 * 1024 });

const sourceRecords = [];
const features = [];
for (const source of SOURCES) {
  const bytes = fetchBuffer(source.url);
  const collection = JSON.parse(bytes);
  const selected = source.kind === "EARTHQUAKE_EVACUATION_PLACE"
    ? collection.features.filter((feature) => feature.properties?.["地震"] === "1")
    : collection.features;
  sourceRecords.push({
    source_id: source.id,
    kind: source.kind,
    url: source.url,
    source_sha256: sha256(bytes),
    source_feature_count: collection.features.length,
    selected_feature_count: selected.length
  });
  for (const feature of selected) {
    const props = feature.properties ?? {};
    const commonId = props["共通ID"];
    features.push({
      type: "Feature",
      id: `gsi-uki-${source.kind.toLowerCase().replaceAll("_", "-")}-${commonId}`,
      geometry: feature.geometry,
      properties: {
        source_feature_id: commonId,
        name: props["施設・場所名"],
        address: props["住所"],
        designation: source.kind,
        earthquake_eligible: source.kind === "EARTHQUAKE_EVACUATION_PLACE" ? true : null,
        event_status: "DESIGNATED_ONLY_UNKNOWN_EVENT_STATUS",
        source_file_id: source.id,
        source_sequence: props.NO
      }
    });
  }
}

const positions = features.map((feature) => feature.geometry.coordinates);
const uniqueLocationCount = new Set(positions.map((coordinates) => JSON.stringify(coordinates))).size;
const bbox = [
  Math.min(...positions.map(([x]) => x)),
  Math.min(...positions.map(([, y]) => y)),
  Math.max(...positions.map(([x]) => x)),
  Math.max(...positions.map(([, y]) => y))
];
const output = {
  type: "FeatureCollection",
  schema_version: "disaster-replay.designated-shelters.v1",
  classification: "OBSERVED_PUBLIC_STATIC_DESIGNATION",
  disclosure: "These are officially designated locations. This file does not say that any location was open, safe, staffed, supplied, reachable, or had spare capacity after the earthquake.",
  designation_record_count: features.length,
  unique_location_count: uniqueLocationCount,
  bbox,
  source: {
    provider: "Geospatial Information Authority of Japan",
    landing_page: "https://www.gsi.go.jp/bousaichiri/hinanbasho",
    attribution: "Geospatial Information Authority of Japan; normalized by AURAWORLD.",
    frozen_on: "2026-08-23",
    files: sourceRecords
  },
  features: features.sort((a, b) => a.id.localeCompare(b.id))
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`SHELTERS: ${sourceRecords[0].selected_feature_count} designated-shelter records + ${sourceRecords[1].selected_feature_count} earthquake-evacuation records at ${uniqueLocationCount} unique coordinates`);
