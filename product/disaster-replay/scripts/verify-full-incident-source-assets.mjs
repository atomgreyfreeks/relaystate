/** Offline integrity gate for the large official-source manifests used by the full replay. */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const REPO = path.resolve(PACKAGE, "..", "..");
const DATA = path.join(PACKAGE, "data", "full-incident");
const MANIFEST = path.join(DATA, "gsi-post-quake-orthophotos-z16.manifest.json");
const META = path.join(DATA, "gsi-post-quake-orthophotos-z16.meta.json");
const LAYER_SOURCE = path.join(DATA, "gsi-kumamoto-incident-layers.source.json");
const SHELTERS = path.join(DATA, "modeled-shelter-occupancy.json");
const RECONSTRUCTION = path.join(REPO, "docs", "rescueworld", "REAL-RESPONSE-RECONSTRUCTION.md");
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const manifestBytes = fs.readFileSync(MANIFEST);
const manifest = JSON.parse(manifestBytes);
const meta = readJson(META);

assert.equal(manifest.schema_version,
  "disaster-replay.gsi-post-quake-orthophoto-manifest.v1");
assert.equal(manifest.classification, "OBSERVED_PUBLIC_POST_EVENT_ORTHOPHOTO");
assert.equal(manifest.target_zoom, 16);
assert.deepEqual(manifest.requested_bbox_wgs84, [130.4, 32.3, 131.3, 33.1]);
const [west, south, east, north] = manifest.requested_bbox_wgs84;
assert.ok(west <= 130.48 && south <= 32.30 && east >= 130.90 && north >= 32.83,
  "orthophoto discovery bounds do not contain the committed replay window");
assert.equal(manifest.layers.length, 6);
assert.equal(new Set(manifest.layers.map((layer) => layer.id)).size, 6,
  "orthophoto layer IDs are not unique");

let tileCount = 0;
let sourceBytes = 0;
for (const layer of manifest.layers) {
  assert.equal(layer.zoom, 16, `${layer.id}: wrong target zoom`);
  assert.equal(layer.tile_count, layer.tiles.length, `${layer.id}: tile count mismatch`);
  assert.equal(layer.source_bytes,
    layer.tiles.reduce((sum, tile) => sum + tile.bytes, 0),
    `${layer.id}: source-byte count mismatch`);
  assert.deepEqual(layer.discovery_levels.map((level) => level.zoom), [10, 11, 12, 13, 14, 15, 16],
    `${layer.id}: incomplete discovery pyramid`);
  assert.equal(layer.discovery_levels.at(-1).available_count, layer.tile_count,
    `${layer.id}: target discovery count disagrees with tile rows`);
  const tileKeys = new Set();
  for (const tile of layer.tiles) {
    assert.equal(tile.available, true, `${layer.id}: unavailable tile stored in available manifest`);
    assert.equal(tile.http_status, 200, `${layer.id}: non-200 tile stored in manifest`);
    assert.equal(tile.z, 16, `${layer.id}: tile at wrong zoom`);
    assert.ok(Number.isInteger(tile.x) && Number.isInteger(tile.y) && tile.bytes > 0,
      `${layer.id}: malformed tile coordinates or byte count`);
    assert.match(tile.sha256, /^[a-f0-9]{64}$/, `${layer.id}: malformed tile hash`);
    assert.equal(tile.url,
      `https://maps.gsi.go.jp/xyz/${layer.id}/${tile.z}/${tile.x}/${tile.y}.png`,
      `${layer.id}: tile URL is not derived from its recorded coordinates`);
    const key = `${tile.z}/${tile.x}/${tile.y}`;
    assert.equal(tileKeys.has(key), false, `${layer.id}: duplicate tile ${key}`);
    tileKeys.add(key);
  }
  tileCount += layer.tile_count;
  sourceBytes += layer.source_bytes;
}

assert.equal(tileCount, 8027);
assert.equal(sourceBytes, 1028398957);
assert.equal(meta.output.bytes, manifestBytes.length);
assert.equal(meta.output.sha256, sha256(manifestBytes));
assert.equal(meta.output.layer_count, manifest.layers.length);
assert.equal(meta.output.tile_count, tileCount);
assert.equal(meta.output.source_bytes, sourceBytes);
const layerSourceBytes = fs.readFileSync(LAYER_SOURCE);
assert.equal(meta.source.layer_definitions.bytes, layerSourceBytes.length);
assert.equal(meta.source.layer_definitions.sha256, sha256(layerSourceBytes));
assert.match(meta.processing.acquisition_mode, /Every target tile byte was fetched and hashed/i);
assert.match(manifest.disclosure, /not a field-confirmed damage assessment/i);

const shelters = readJson(SHELTERS);
assert.equal(shelters.schema_version, "disaster-replay.modeled-shelter-occupancy.v1");
assert.equal(shelters.classification, "MODELED_FROM_OFFICIAL_AGGREGATES");
assert.equal(shelters.scope.kind, "PREFECTURE_AGGREGATE");
assert.equal(shelters.scope.prefecture_code, "43");
assert.equal(shelters.scope.spatial_allocation, null,
  "modeled shelter totals must not be assigned to individual shelters");
assert.deepEqual(shelters.observed_aggregate_points.map((point) => [
  point.reported_at, point.open_shelters, point.occupants,
]), [
  ["2026-07-29T06:20:00+09:00", 506, 9186],
  ["2026-07-29T13:10:00+09:00", 419, 7547],
  ["2026-07-30T06:30:00+09:00", 419, 9931],
  ["2026-07-31T07:30:00+09:00", 399, 9637],
]);
assert.equal(shelters.derived_display.method,
  "LINEAR_INTERPOLATION_BETWEEN_REPORTED_PREFECTURE_TOTALS");
assert.match(shelters.disclosure, /must not assign occupants to individual shelters/i);
assert.match(shelters.derived_display.forbidden_visual,
  /specific shelter or municipality/i);
const reconstructionBytes = fs.readFileSync(RECONSTRUCTION);
assert.equal(shelters.source.reconstruction_sha256, sha256(reconstructionBytes),
  "modeled shelter layer no longer points to the exact reconstruction it cites");

console.log(`PASS: ${tileCount.toLocaleString("en-US")} official orthophoto tiles retain exact URLs, bytes and hashes.`);
console.log("PASS: the expanded discovery bounds contain the whole committed replay window.");
console.log("PASS: shelter occupancy remains a four-point prefecture aggregate with no invented local allocation.");
