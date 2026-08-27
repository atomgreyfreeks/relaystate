import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUTPUT = path.join(PACKAGE, "data", "gsi-2026-kumamoto-landslides.geojson");
const ROAD_OUTPUT = path.join(PACKAGE, "data", "mlit-2026-kumamoto-road-restrictions.geojson");

const SOURCE_URL = "https://www1.gsi.go.jp/geowww/saigai/20260728_kumamoto/hokai/kumamoto_yatsushiro0814.zip";
const SOURCE_SHA256 = "8133f7cb714990cc5b9fe6bfb10fb991009a413569a4468b3ffe8686c0532531";
const ROAD_SOURCE_URL = "https://www.mlit.go.jp/road/saigai/r8kumamoto/2607291200data.zip";
const ROAD_SOURCE_SHA256 = "8dd8cf569879e68ae392ba6b4e26263d1f3ba8c758b09d85dcad6cfae8b62d84";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function visitPositions(value, positions) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    positions.push([value[0], value[1]]);
    return;
  }
  for (const child of value) visitPositions(child, positions);
}

function bounds(features) {
  const positions = [];
  for (const feature of features) visitPositions(feature.geometry.coordinates, positions);
  const xs = positions.map(([x]) => x);
  const ys = positions.map(([, y]) => y);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}

export async function importPublicData() {
  // This GSI host currently requires TLS behavior that Node's fetch rejects.
  // curl succeeds on both macOS and Linux and keeps the acquisition command explicit.
  const download = spawnSync("curl", ["-fsSL", SOURCE_URL], { maxBuffer: 5 * 1024 * 1024 });
  if (download.status !== 0) throw new Error(`GSI download failed: ${download.stderr?.toString() || "curl error"}`);
  const zipBuffer = download.stdout;
  const actualSha256 = sha256(zipBuffer);
  if (actualSha256 !== SOURCE_SHA256) {
    throw new Error(`GSI ZIP hash changed: expected ${SOURCE_SHA256}, got ${actualSha256}`);
  }

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "disaster-replay-gsi-"));
  try {
    const zipPath = path.join(tempDirectory, "source.zip");
    const unpacked = path.join(tempDirectory, "unpacked");
    fs.mkdirSync(unpacked);
    fs.writeFileSync(zipPath, zipBuffer);

    const unzip = spawnSync("unzip", ["-qq", zipPath, "-d", unpacked], { encoding: "utf8" });
    if (unzip.status !== 0) throw new Error(`unzip failed: ${unzip.stderr || unzip.stdout}`);

    const sourceName = fs.readdirSync(unpacked).find((name) => name.endsWith("_土砂.geojson"));
    if (!sourceName) throw new Error("GSI source ZIP did not contain the expected landslide GeoJSON");
    const source = JSON.parse(fs.readFileSync(path.join(unpacked, sourceName), "utf8"));
    if (source.type !== "FeatureCollection" || source.features.length !== 35) {
      throw new Error(`unexpected GSI source shape: ${source.type}, ${source.features?.length} features`);
    }

    const normalized = {
      type: "FeatureCollection",
      name: "2026 Kumamoto earthquake: GSI observed landslide/deposition polygons",
      source: {
        classification: "OBSERVED_PUBLIC",
        provider: "Geospatial Information Authority of Japan",
        url: SOURCE_URL,
        source_zip_sha256: SOURCE_SHA256,
        revision: "2026-08-14",
        interpretation: "GSI interpretation of aerial photographs captured from 2026-07-29 through 2026-08-03.",
        attribution: "Geospatial Information Authority of Japan",
        license_note: "Reuse with source attribution under the content-use terms and disclaimer carried in the source ZIP and linked incident page."
      },
      bbox: bounds(source.features),
      features: source.features.map((feature, index) => ({
        type: "Feature",
        id: `gsi-2026-kumamoto-landslide-${String(index + 1).padStart(3, "0")}`,
        properties: {
          classification: "OBSERVED_PUBLIC",
          source_feature_index: index,
          observed_by: "Geospatial Information Authority of Japan",
          observation_kind: "LANDSLIDE_OR_DEPOSITION_POLYGON"
        },
        geometry: feature.geometry
      }))
    };

    const roadDownload = spawnSync("curl", ["-fsSL", ROAD_SOURCE_URL], { maxBuffer: 40 * 1024 * 1024 });
    if (roadDownload.status !== 0) throw new Error(`MLIT road download failed: ${roadDownload.stderr?.toString() || "curl error"}`);
    const roadZipBuffer = roadDownload.stdout;
    const roadActualSha256 = sha256(roadZipBuffer);
    if (roadActualSha256 !== ROAD_SOURCE_SHA256) {
      throw new Error(`MLIT road ZIP hash changed: expected ${ROAD_SOURCE_SHA256}, got ${roadActualSha256}`);
    }
    const roadZipPath = path.join(tempDirectory, "roads.zip");
    fs.writeFileSync(roadZipPath, roadZipBuffer);
    const roadExtract = spawnSync("unzip", ["-p", roadZipPath, "dourokisei.geojson"], { maxBuffer: 2 * 1024 * 1024 });
    if (roadExtract.status !== 0) throw new Error(`road restriction extraction failed: ${roadExtract.stderr?.toString() || "unzip error"}`);
    const roadSource = JSON.parse(roadExtract.stdout.toString("utf8"));
    if (roadSource.type !== "FeatureCollection" || roadSource.features.length !== 29) {
      throw new Error(`unexpected MLIT road source shape: ${roadSource.type}, ${roadSource.features?.length} features`);
    }
    const normalizedRoads = {
      type: "FeatureCollection",
      name: "2026 Kumamoto earthquake: MLIT observed road restrictions at 2026-07-29 12:00 JST",
      source: {
        classification: "OBSERVED_PUBLIC",
        provider: "Ministry of Land, Infrastructure, Transport and Tourism",
        url: ROAD_SOURCE_URL,
        source_zip_sha256: ROAD_SOURCE_SHA256,
        snapshot_at: "2026-07-29T12:00:00+09:00",
        attribution: "Ministry of Land, Infrastructure, Transport and Tourism, Japan",
        license_note: "Official public Passable Map snapshot. Preserve the ministry attribution and source-page link when reused."
      },
      bbox: bounds(roadSource.features),
      features: roadSource.features.map((feature, index) => ({
        type: "Feature",
        id: `mlit-2026-kumamoto-road-restriction-${String(index + 1).padStart(3, "0")}`,
        properties: {
          classification: "OBSERVED_PUBLIC",
          source_feature_index: index,
          prefecture: feature.properties["県名"],
          municipality: feature.properties["市町村名"],
          road_kind: feature.properties["道路種別"],
          route_name: feature.properties["路線名"],
          restriction_kind: feature.properties["規制種別"],
          restriction_reason: feature.properties["規制理由"],
          restriction_started_at: feature.properties["規制開始_日時"],
          restriction_status: feature.properties["規制開始_内容"],
          length_km: Number(feature.properties["延長_Km"])
        },
        geometry: feature.geometry
      }))
    };

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, `${JSON.stringify(normalized, null, 2)}\n`);
    fs.writeFileSync(ROAD_OUTPUT, `${JSON.stringify(normalizedRoads, null, 2)}\n`);
    return {
      output: OUTPUT,
      features: normalized.features.length,
      source_zip_sha256: actualSha256,
      road_output: ROAD_OUTPUT,
      road_features: normalizedRoads.features.length,
      road_source_zip_sha256: roadActualSha256
    };
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await importPublicData();
  console.log(`IMPORTED: ${result.features} observed GSI polygons; source ZIP sha256 ${result.source_zip_sha256}`);
  console.log(`IMPORTED: ${result.road_features} observed MLIT road restrictions; source ZIP sha256 ${result.road_source_zip_sha256}`);
}
