import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT_DIR = path.join(PACKAGE, "data", "full-incident");
const RUPTURE_OUT = path.join(OUT_DIR, "gsi-2026-kumamoto-surface-rupture.geojson");
const RUPTURE_META_OUT = path.join(OUT_DIR, "gsi-2026-kumamoto-surface-rupture.meta.json");
const ORTHOPHOTO_OUT = path.join(OUT_DIR, "gsi-post-quake-orthophotos-z16.manifest.json");
const ORTHOPHOTO_META_OUT = path.join(OUT_DIR, "gsi-post-quake-orthophotos-z16.meta.json");
const ORTHOPHOTO_LAYER_SOURCE_OUT = path.join(OUT_DIR, "gsi-kumamoto-incident-layers.source.json");

const RUPTURE_SOURCE = {
  id: "gsi-2026-kumamoto-sar-displacement-discontinuity-2026-08-05",
  url: "https://www.gsi.go.jp/common/000279979.zip",
  sha256: "38289aa36e905b6fc2e7b3971305698c8946c5914ad19222d514b09cb7450891",
  extracted_sha256: "d90551fdc3207cd7a7fe26f79b29f5be95ecbd8f8198cf00c834dbdc92e755e6"
};

const ORTHOPHOTO_LAYER_SOURCE = {
  id: "gsi-2026-kumamoto-incident-layer-definitions",
  url: "https://maps.gsi.go.jp/layers_txt/layers_20260729kumamoto.txt",
  sha256: "1a5bc085a80d51a90dab770f42fa77f72d80a94b6b16d6be26d8660437f78379"
};

const ORTHOPHOTO_LAYERS = [
  {
    id: "20260729kumamoto_yatsushiro_0729do",
    area: "Hikawa, Yatsushiro, Ashikita, and Tsunagi",
    flown: "2026-07-29",
    published: "2026-08-04"
  },
  {
    id: "20260729kumamoto_kumamoto1_0803do",
    area: "Koshi, Kikuyo, Kumamoto City, Mashiki, Nishihara, and Ozu",
    flown: "2026-08-03",
    published: "2026-08-06"
  },
  {
    id: "20260729kumamoto_kumamoto2_0729_0802do",
    area: "Kumamoto City, Mashiki, Kashima, and Mifune",
    flown: "2026-07-29/2026-08-02",
    published: "2026-08-07"
  },
  {
    id: "20260729kumamoto_kumamoto3_0731_0801do",
    area: "Kumamoto City, Uto, Uki, Mifune, and Kosa",
    flown: "2026-07-31/2026-08-01",
    published: "2026-08-04"
  },
  {
    id: "20260729kumamoto_kumamoto4_0730do",
    area: "Uki, Hikawa, Yatsushiro, Misato, and Kosa",
    flown: "2026-07-30",
    published: "2026-08-07"
  },
  {
    id: "20260729kumamoto_kumamotokeno_0812do_sokuho",
    area: "Yamato, Mifune, Kosa, Misato, and Yatsushiro",
    flown: "2026-08-12",
    published: "2026-08-12",
    preliminary: true
  }
];

// Union of the committed replay window ([130.48, 32.30, 130.90, 32.83]) and the broader
// flown corridor used for source discovery. Keeping the southern edge at 32.30 prevents the
// Yatsushiro part of the replay window from being silently clipped.
const FULL_INCIDENT_BBOX = [130.4, 32.3, 131.3, 33.1];
const ORTHOPHOTO_MIN_ZOOM = 10;
const ORTHOPHOTO_TARGET_ZOOM = 16;
const GSI_TILE_BASE = "https://maps.gsi.go.jp/xyz";

const PLATEAU_MUNICIPALITIES = {
  mashiki: {
    municipality: "Mashiki Town",
    municipality_code: "43443",
    survey_year: 2023,
    output_slug: "plateau-mashiki-2023-building-tiles",
    services: ["43443-bldg-lod1-latest", "43443-bldg-lod2-latest"],
    expected_content_bytes: [150_000_000, 300_000_000]
  },
  kumamoto: {
    municipality: "Kumamoto City",
    municipality_code: "43100",
    survey_year: 2022,
    output_slug: "plateau-kumamoto-city-2022-building-tiles",
    services: ["43100-bldg-lod1-latest", "43100-bldg-lod2-latest"],
    expected_content_bytes: [500_000_000, 2_000_000_000]
  }
};

const PLATEAU_CATALOG_BASE = "https://api.plateauview.mlit.go.jp/datacatalog/3dtiles";

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function fetchPinned(source) {
  const bytes = execFileSync(
    "curl",
    ["--fail", "--location", "--retry", "3", "--silent", "--show-error", source.url],
    { maxBuffer: 32 * 1024 * 1024 }
  );
  const actual = sha256(bytes);
  if (actual !== source.sha256) {
    throw new Error(`${source.id}: expected SHA-256 ${source.sha256}, got ${actual}`);
  }
  return bytes;
}

function visitCoordinates(value, positions) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    positions.push([value[0], value[1]]);
    return;
  }
  for (const child of value) visitCoordinates(child, positions);
}

function featureBounds(features) {
  const positions = [];
  for (const feature of features) visitCoordinates(feature.geometry?.coordinates, positions);
  if (positions.length === 0) throw new Error("cannot calculate bounds for empty geometry");
  return [
    [Math.min(...positions.map(([longitude]) => longitude)), Math.min(...positions.map(([, latitude]) => latitude))],
    [Math.max(...positions.map(([longitude]) => longitude)), Math.max(...positions.map(([, latitude]) => latitude))]
  ];
}

function importSurfaceRupture() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "auraworld-gsi-rupture-"));
  try {
    const archiveBytes = fetchPinned(RUPTURE_SOURCE);
    const archivePath = path.join(temp, "surface-rupture.zip");
    fs.writeFileSync(archivePath, archiveBytes);
    const sourceBytes = execFileSync("unzip", ["-p", archivePath], { maxBuffer: 1024 * 1024 });
    const extractedHash = sha256(sourceBytes);
    if (extractedHash !== RUPTURE_SOURCE.extracted_sha256) {
      throw new Error(`${RUPTURE_SOURCE.id}: expected extracted SHA-256 ${RUPTURE_SOURCE.extracted_sha256}, got ${extractedHash}`);
    }
    const source = JSON.parse(sourceBytes);
    if (source.type !== "FeatureCollection" || source.features?.length !== 51) {
      throw new Error(`expected 51 GSI surface-rupture features, got ${source.features?.length}`);
    }
    if (source.features.some((feature) => feature.geometry?.type !== "MultiLineString")) {
      throw new Error("GSI surface-rupture source contains an unexpected geometry type");
    }
    const sourceGeometryStats = source.features.map((feature) => {
      const lineParts = feature.geometry.coordinates;
      return {
        line_part_count: lineParts.length,
        vertex_count: lineParts.reduce((sum, line) => sum + line.length, 0)
      };
    });
    const nonemptyTraceCount = sourceGeometryStats.filter(({ line_part_count }) => line_part_count > 0).length;
    const linePartCount = sourceGeometryStats.reduce((sum, { line_part_count }) => sum + line_part_count, 0);
    const vertexCount = sourceGeometryStats.reduce((sum, { vertex_count }) => sum + vertex_count, 0);
    const uniqueSourceIdCount = new Set(source.features.map((feature) => feature.properties?.id ?? null)).size;
    if (nonemptyTraceCount !== 25 || linePartCount !== 25 || vertexCount !== 181 || uniqueSourceIdCount !== 21) {
      throw new Error("unexpected GSI surface-rupture source geometry counts");
    }

    const collection = {
      type: "FeatureCollection",
      schema_version: "disaster-replay.surface-rupture.v1",
      name: "2026 Kumamoto earthquake: GSI provisional SAR displacement-discontinuity traces",
      classification: "OBSERVED_PUBLIC_REMOTE_SENSING_INTERPRETATION",
      disclosure: "Provisional GSI interpretation of SAR displacement discontinuities as of 2026-08-05. These traces are not field-surveyed rupture positions; the source warns of positional errors from tens to 100 metres and recommends display at zoom 15 or below. Of 51 source features, 25 contain a trace and 26 have empty geometries.",
      bbox: featureBounds(source.features),
      source: {
        provider: "Geospatial Information Authority of Japan",
        url: RUPTURE_SOURCE.url,
        source_zip_sha256: RUPTURE_SOURCE.sha256,
        extracted_geojson_sha256: RUPTURE_SOURCE.extracted_sha256,
        revision: "2026-08-05",
        attribution: "解析：国土地理院 原初データ所有：JAXA。出典：国土地理院ウェブサイト（https://www.gsi.go.jp/BOUSAI/20260728_kumamoto_earthquake.html）を加工して作成"
      },
      features: source.features.map((feature, index) => ({
        type: "Feature",
        id: `gsi-2026-kumamoto-surface-rupture-${String(index + 1).padStart(3, "0")}`,
        properties: {
          classification: "OBSERVED_PUBLIC_REMOTE_SENSING_INTERPRETATION",
          source_feature_id: feature.properties?.id ?? null,
          observation_kind: "SAR_DISPLACEMENT_DISCONTINUITY_TRACE",
          revision: "PROVISIONAL_2026-08-05",
          geometry_status: sourceGeometryStats[index].line_part_count > 0 ? "NONEMPTY_TRACE" : "EMPTY_SOURCE_GEOMETRY",
          line_part_count: sourceGeometryStats[index].line_part_count,
          vertex_count: sourceGeometryStats[index].vertex_count
        },
        geometry: feature.geometry
      }))
    };
    const outputBytes = Buffer.from(`${JSON.stringify(collection, null, 2)}\n`);
    const meta = {
      schema_version: "disaster-replay.surface-rupture-metadata.v1",
      title: collection.name,
      classification: collection.classification,
      source_feature_count: collection.features.length,
      nonempty_trace_count: nonemptyTraceCount,
      empty_geometry_count: collection.features.length - nonemptyTraceCount,
      line_part_count: linePartCount,
      vertex_count: vertexCount,
      unique_source_id_count: uniqueSourceIdCount,
      bbox: collection.bbox,
      output: {
        path: path.relative(PACKAGE, RUPTURE_OUT).split(path.sep).join("/"),
        bytes: outputBytes.length,
        sha256: sha256(outputBytes)
      },
      source: {
        provider: "Geospatial Information Authority of Japan",
        ...RUPTURE_SOURCE,
        archive_bytes: archiveBytes.length,
        extracted_bytes: sourceBytes.length
      },
      license: {
        name: "Public Data License 1.0",
        commercial_use: true,
        terms: "https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html",
        attribution: collection.source.attribution
      },
      processing: {
        tool: "product/disaster-replay/scripts/import-gsi-full-incident-assets.mjs surface-rupture",
        rule: "Verify the official ZIP and its single extracted GeoJSON by SHA-256; retain all 51 MultiLineString source features, including 26 explicitly labelled empty geometries; report 25 nonempty traces without deduplicating 21 repeated source IDs; add stable local IDs, classification, revision, disclosure, and bounds without changing coordinates.",
        frozen_on: "2026-08-23"
      }
    };
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(RUPTURE_OUT, outputBytes);
    fs.writeFileSync(RUPTURE_META_OUT, `${JSON.stringify(meta, null, 2)}\n`);
    console.log(`SURFACE RUPTURE: ${collection.features.length} source features, ${nonemptyTraceCount} nonempty traces, ${outputBytes.length} bytes, SHA-256 ${meta.output.sha256}`);
  } finally {
    if (temp.startsWith(`${os.tmpdir()}${path.sep}auraworld-gsi-rupture-`)) {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }
}

function tileRange(bbox, zoom) {
  const [west, south, east, north] = bbox;
  const scale = 2 ** zoom;
  const x = (longitude) => Math.floor((longitude + 180) / 360 * scale);
  const y = (latitude) => Math.floor(
    (1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * scale
  );
  return { x_min: x(west), x_max: x(east), y_min: y(north), y_max: y(south) };
}

function tilesInRange(zoom, range) {
  const tiles = [];
  for (let y = range.y_min; y <= range.y_max; y += 1) {
    for (let x = range.x_min; x <= range.x_max; x += 1) tiles.push({ z: zoom, x, y });
  }
  return tiles;
}

function tileCoverageBbox(tiles) {
  if (tiles.length === 0) return null;
  const zoom = tiles[0].z;
  const scale = 2 ** zoom;
  const longitude = (x) => x / scale * 360 - 180;
  const latitude = (y) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI;
  return [
    Math.min(...tiles.map((tile) => longitude(tile.x))),
    Math.min(...tiles.map((tile) => latitude(tile.y + 1))),
    Math.max(...tiles.map((tile) => longitude(tile.x + 1))),
    Math.max(...tiles.map((tile) => latitude(tile.y)))
  ].map((value) => Number(value.toFixed(10)));
}

async function fetchPngTile(tile) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(tile.url, { signal: AbortSignal.timeout(30_000) });
      if (response.status === 404) return { ...tile, available: false, http_status: 404 };
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 8 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
        throw new Error("response is not a PNG");
      }
      return {
        ...tile,
        available: true,
        http_status: response.status,
        bytes: bytes.length,
        sha256: sha256(bytes)
      };
    } catch (error) {
      if (attempt === 2) throw new Error(`${tile.url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
    }
  }
  throw new Error(`${tile.url}: exhausted retries`);
}

async function mapWithConcurrency(items, concurrency, mapper, progressLabel) {
  const output = Array.from({ length: items.length });
  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(items[index]);
      completed += 1;
      if (completed % 500 === 0 || completed === items.length) {
        console.log(`${progressLabel}: ${completed}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return output;
}

function findLayerDefinition(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const value of Object.values(node)) {
    if (!Array.isArray(value)) continue;
    for (const child of value) {
      const match = findLayerDefinition(child, id);
      if (match) return match;
    }
  }
  return null;
}

function loadOrCaptureLayerDefinitions() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const bytes = fs.existsSync(ORTHOPHOTO_LAYER_SOURCE_OUT)
    ? fs.readFileSync(ORTHOPHOTO_LAYER_SOURCE_OUT)
    : fetchPinned(ORTHOPHOTO_LAYER_SOURCE);
  const actual = sha256(bytes);
  if (actual !== ORTHOPHOTO_LAYER_SOURCE.sha256) {
    throw new Error(`${ORTHOPHOTO_LAYER_SOURCE.id}: expected SHA-256 ${ORTHOPHOTO_LAYER_SOURCE.sha256}, got ${actual}`);
  }
  if (!fs.existsSync(ORTHOPHOTO_LAYER_SOURCE_OUT)) fs.writeFileSync(ORTHOPHOTO_LAYER_SOURCE_OUT, bytes);
  return { bytes, definitions: JSON.parse(bytes) };
}

async function discoverOrthophotoLayer(layer) {
  let candidates = tilesInRange(ORTHOPHOTO_MIN_ZOOM, tileRange(FULL_INCIDENT_BBOX, ORTHOPHOTO_MIN_ZOOM));
  const levels = [];
  let targetTiles = [];
  for (let zoom = ORTHOPHOTO_MIN_ZOOM; zoom <= ORTHOPHOTO_TARGET_ZOOM; zoom += 1) {
    const requests = candidates.map((tile) => ({
      ...tile,
      url: `${GSI_TILE_BASE}/${layer.id}/${tile.z}/${tile.x}/${tile.y}.png`
    }));
    const results = await mapWithConcurrency(requests, 32, fetchPngTile, `${layer.id}/z${zoom}`);
    const available = results.filter((tile) => tile.available);
    levels.push({
      zoom,
      candidate_count: results.length,
      available_count: available.length,
      unavailable_count: results.length - available.length,
      available_bytes: available.reduce((sum, tile) => sum + tile.bytes, 0)
    });
    if (zoom === ORTHOPHOTO_TARGET_ZOOM) {
      targetTiles = available;
      break;
    }

    const nextRange = tileRange(FULL_INCIDENT_BBOX, zoom + 1);
    candidates = available.flatMap((tile) => [
      { z: zoom + 1, x: tile.x * 2, y: tile.y * 2 },
      { z: zoom + 1, x: tile.x * 2 + 1, y: tile.y * 2 },
      { z: zoom + 1, x: tile.x * 2, y: tile.y * 2 + 1 },
      { z: zoom + 1, x: tile.x * 2 + 1, y: tile.y * 2 + 1 }
    ]).filter((tile) => (
      tile.x >= nextRange.x_min && tile.x <= nextRange.x_max
      && tile.y >= nextRange.y_min && tile.y <= nextRange.y_max
    ));
  }
  if (targetTiles.length === 0) throw new Error(`${layer.id}: sparse-pyramid discovery found no zoom-16 tiles`);
  return {
    ...layer,
    tile_template: `${GSI_TILE_BASE}/${layer.id}/{z}/{x}/{y}.png`,
    zoom: ORTHOPHOTO_TARGET_ZOOM,
    coverage_bbox_wgs84: tileCoverageBbox(targetTiles),
    tile_count: targetTiles.length,
    source_bytes: targetTiles.reduce((sum, tile) => sum + tile.bytes, 0),
    discovery_levels: levels,
    tiles: targetTiles
  };
}

async function importOrthophotos() {
  const { bytes: definitionBytes, definitions } = loadOrCaptureLayerDefinitions();
  for (const layer of ORTHOPHOTO_LAYERS) {
    const definition = findLayerDefinition(definitions, layer.id);
    if (!definition) throw new Error(`official layer definition is missing ${layer.id}`);
    if (definition.minZoom !== ORTHOPHOTO_MIN_ZOOM || definition.maxZoom < ORTHOPHOTO_TARGET_ZOOM) {
      throw new Error(`${layer.id}: official zoom range changed`);
    }
  }

  const layers = [];
  for (const layer of ORTHOPHOTO_LAYERS) layers.push(await discoverOrthophotoLayer(layer));
  const totalTiles = layers.reduce((sum, layer) => sum + layer.tile_count, 0);
  if (totalTiles < 7_000 || totalTiles > 12_000) {
    throw new Error(`expected 7,000-12,000 total zoom-16 orthophotos, got ${totalTiles}`);
  }
  const manifest = {
    schema_version: "disaster-replay.gsi-post-quake-orthophoto-manifest.v1",
    incident_id: "kumamoto-2026-07-28",
    classification: "OBSERVED_PUBLIC_POST_EVENT_ORTHOPHOTO",
    disclosure: "Official GSI post-earthquake orthophotos. Automated and standard orthorectification can leave distorted, shifted, or discontinuous structures; clouds can obscure the ground. Visible appearance alone is not a field-confirmed damage assessment.",
    requested_bbox_wgs84: FULL_INCIDENT_BBOX,
    target_zoom: ORTHOPHOTO_TARGET_ZOOM,
    layers
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`);
  const meta = {
    schema_version: "disaster-replay.gsi-post-quake-orthophoto-metadata.v1",
    title: "GSI post-quake orthophotos for the full Kumamoto incident area at zoom 16",
    classification: manifest.classification,
    output: {
      path: path.relative(PACKAGE, ORTHOPHOTO_OUT).split(path.sep).join("/"),
      bytes: manifestBytes.length,
      sha256: sha256(manifestBytes),
      layer_count: layers.length,
      tile_count: totalTiles,
      source_bytes: layers.reduce((sum, layer) => sum + layer.source_bytes, 0)
    },
    source: {
      provider: "Geospatial Information Authority of Japan",
      incident_page: "https://www.gsi.go.jp/BOUSAI/20260728_kumamoto_earthquake.html",
      layer_definitions: {
        ...ORTHOPHOTO_LAYER_SOURCE,
        snapshot_path: path.relative(PACKAGE, ORTHOPHOTO_LAYER_SOURCE_OUT).split(path.sep).join("/"),
        bytes: definitionBytes.length
      }
    },
    license: {
      name: "Public Data License 1.0",
      commercial_use: true,
      terms: "https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html",
      attribution: "国土地理院撮影の空中写真（2026年7月29日～8月12日撮影）を加工して作成"
    },
    processing: {
      tool: "product/disaster-replay/scripts/import-gsi-full-incident-assets.mjs orthophotos",
      rule: "Within the declared full-incident bbox, probe every official layer at zoom 10 and recursively probe all four intersecting children of each available tile through zoom 16. Hash every available zoom-16 PNG and retain its exact URL, byte count, and SHA-256. The cocotile pyramid guarantees that an unavailable parent has no available descendant.",
      acquisition_mode: "Every target tile byte was fetched and hashed. The repository stores the URL/hash manifest rather than duplicating the large public image cache.",
      concurrency: 32,
      frozen_on: "2026-08-23"
    }
  };
  fs.writeFileSync(ORTHOPHOTO_OUT, manifestBytes);
  fs.writeFileSync(ORTHOPHOTO_META_OUT, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`ORTHOPHOTOS: ${layers.length} layers, ${totalTiles} zoom-16 tiles, ${meta.output.source_bytes} source bytes, SHA-256 ${meta.output.sha256}`);
}

async function fetchBinaryAsset(url, timeoutMs = 120_000) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      return {
        receipt: {
          url,
          resolved_url: response.url,
          http_status: response.status,
          content_type: response.headers.get("content-type"),
          bytes: bytes.length,
          sha256: sha256(bytes)
        },
        bytes
      };
    } catch (error) {
      if (attempt === 2) throw new Error(`${url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
    }
  }
  throw new Error(`${url}: exhausted retries`);
}

function collectContentUris(value, uris = []) {
  if (!value || typeof value !== "object") return uris;
  if (Array.isArray(value)) {
    for (const child of value) collectContentUris(child, uris);
    return uris;
  }
  if (typeof value.content?.uri === "string") uris.push(value.content.uri);
  for (const [key, child] of Object.entries(value)) {
    if (key !== "content") collectContentUris(child, uris);
  }
  return uris;
}

async function acquirePlateauService(serviceId) {
  const catalogUrl = `${PLATEAU_CATALOG_BASE}/${serviceId}/tileset.json`;
  const catalogAsset = await fetchBinaryAsset(catalogUrl);
  const catalog = JSON.parse(catalogAsset.bytes);
  const pendingTilesets = collectContentUris(catalog)
    .map((uri) => new URL(uri, catalogAsset.receipt.resolved_url).href)
    .sort();
  const seenTilesets = new Set();
  const tilesets = [];
  const contentUrls = new Set();

  while (pendingTilesets.length > 0) {
    const tilesetUrl = pendingTilesets.shift();
    if (seenTilesets.has(tilesetUrl)) continue;
    seenTilesets.add(tilesetUrl);
    const tilesetAsset = await fetchBinaryAsset(tilesetUrl);
    const tileset = JSON.parse(tilesetAsset.bytes);
    tilesets.push(tilesetAsset.receipt);
    for (const uri of collectContentUris(tileset)) {
      const resolved = new URL(uri, tilesetAsset.receipt.resolved_url).href;
      if (/\/tileset\.json(?:\?|$)/.test(resolved)) pendingTilesets.push(resolved);
      else contentUrls.add(resolved);
    }
    pendingTilesets.sort();
  }

  const sortedContentUrls = [...contentUrls].sort();
  const contents = await mapWithConcurrency(sortedContentUrls, 16, async (url) => {
    const asset = await fetchBinaryAsset(url);
    if (!/\.b3dm(?:\?|$)/.test(url)) throw new Error(`${serviceId}: unexpected content type ${url}`);
    if (asset.bytes.length < 4 || asset.bytes.subarray(0, 4).toString("ascii") !== "b3dm") {
      throw new Error(`${serviceId}: content is not a b3dm tile: ${url}`);
    }
    return asset.receipt;
  }, serviceId);

  return {
    service_id: serviceId,
    lod: serviceId.includes("lod2") ? 2 : 1,
    catalog_tileset: catalogAsset.receipt,
    source_tilesets: tilesets,
    content_count: contents.length,
    content_bytes: contents.reduce((sum, content) => sum + content.bytes, 0),
    contents
  };
}

async function importPlateau(municipalityKey) {
  const definition = PLATEAU_MUNICIPALITIES[municipalityKey];
  if (!definition) throw new Error(`unknown PLATEAU municipality: ${municipalityKey}`);
  const services = [];
  for (const serviceId of definition.services) services.push(await acquirePlateauService(serviceId));
  const totalBytes = services.reduce((sum, service) => sum + service.content_bytes, 0);
  const [minimumBytes, maximumBytes] = definition.expected_content_bytes;
  if (totalBytes < minimumBytes || totalBytes > maximumBytes) {
    throw new Error(`${definition.municipality}: expected ${minimumBytes}-${maximumBytes} content bytes, got ${totalBytes}`);
  }
  const manifest = {
    schema_version: "disaster-replay.plateau-building-tile-manifest.v1",
    classification: "OBSERVED_PUBLIC_BASEMAP",
    disclosure: `Real pre-event ${definition.survey_year} municipal building geometries. They do not show 2026 earthquake damage, occupancy, safety, rescue need, or the post-earthquake position of the ground.`,
    municipality: definition.municipality,
    municipality_code: definition.municipality_code,
    survey_year: definition.survey_year,
    services
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`);
  const manifestPath = path.join(OUT_DIR, `${definition.output_slug}.manifest.json`);
  const metaPath = path.join(OUT_DIR, `${definition.output_slug}.meta.json`);
  const contentCount = services.reduce((sum, service) => sum + service.content_count, 0);
  const uniqueContentSha256Count = new Set(
    services.flatMap((service) => service.contents.map((content) => content.sha256))
  ).size;
  const meta = {
    schema_version: "disaster-replay.plateau-building-tile-metadata.v1",
    title: `Project PLATEAU ${definition.municipality} ${definition.survey_year} LOD1 and LOD2 building tiles`,
    classification: manifest.classification,
    output: {
      path: path.relative(PACKAGE, manifestPath).split(path.sep).join("/"),
      bytes: manifestBytes.length,
      sha256: sha256(manifestBytes),
      service_count: services.length,
      source_tileset_count: services.reduce((sum, service) => sum + service.source_tilesets.length, 0),
      content_count: contentCount,
      unique_content_sha256_count: uniqueContentSha256Count,
      content_bytes: totalBytes
    },
    source: {
      provider: `${definition.municipality} / Project PLATEAU / Ministry of Land, Infrastructure, Transport and Tourism`,
      catalog_base: PLATEAU_CATALOG_BASE,
      services: definition.services
    },
    license: {
      name: "Public Data License 1.0 / Creative Commons Attribution 4.0 International",
      commercial_use: true,
      terms: "https://www.mlit.go.jp/plateau/site-policy/",
      attribution: `出典：国土交通省 PLATEAUウェブサイト（${definition.municipality} ${definition.survey_year} 3D都市モデル）を加工して作成`
    },
    processing: {
      tool: `product/disaster-replay/scripts/import-gsi-full-incident-assets.mjs plateau ${municipalityKey}`,
      rule: "Fetch and hash the official catalog tileset, recursively resolve and hash every referenced source tileset, then fetch, validate as b3dm, and hash every unique LOD1/LOD2 content URI.",
      acquisition_mode: "Every 3D tile byte was fetched and hashed. The repository stores the deterministic URL/hash manifest rather than duplicating the public tile cache.",
      concurrency: 16,
      frozen_on: "2026-08-23"
    }
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(manifestPath, manifestBytes);
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`PLATEAU ${definition.municipality.toUpperCase()}: ${services.length} services, ${contentCount} b3dm tiles, ${totalBytes} bytes, SHA-256 ${meta.output.sha256}`);
}

const task = process.argv[2];
if (task === "surface-rupture") {
  importSurfaceRupture();
} else if (task === "orthophotos") {
  await importOrthophotos();
} else if (task === "plateau") {
  await importPlateau(process.argv[3]);
} else {
  console.error("usage: node product/disaster-replay/scripts/import-gsi-full-incident-assets.mjs <surface-rupture|orthophotos|plateau <mashiki|kumamoto>>");
  process.exitCode = 2;
}
