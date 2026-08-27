import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT_DIR = path.join(PACKAGE, "data", "full-incident");
const POPULATION_OUT = path.join(OUT_DIR, "estat-2020-kumamoto-500m-population.geojson");
const POPULATION_META_OUT = path.join(OUT_DIR, "estat-2020-kumamoto-500m-population.meta.json");
const JMA_SEQUENCE_OUT = path.join(OUT_DIR, "jma-2026-kumamoto-earthquake-sequence.json");
const JMA_SEQUENCE_META_OUT = path.join(OUT_DIR, "jma-2026-kumamoto-earthquake-sequence.meta.json");
const TERRAIN_MANIFEST_OUT = path.join(OUT_DIR, "gsi-high-resolution-terrain.manifest.json");
const TERRAIN_META_OUT = path.join(OUT_DIR, "gsi-high-resolution-terrain.meta.json");
const JMA_SEQUENCE_SOURCE_OUT = path.join(OUT_DIR, "jma-earthquake-list-2026-08-23.source.json");

const POPULATION_SOURCE = {
  id: "estat-2020-t001101-kumamoto",
  url: "https://www.e-stat.go.jp/gis/statmap-search/data?statsId=T001101&code=43&downloadType=2&datum=2000",
  sha256: "b3ccddf272da81da7af83c2574cc66743fec0d4886ffd3f5984bbc52afb6ffbf",
  filename: "tblT001101H43.zip"
};

const BOUNDARY_SOURCES = [
  ["4829", "96c1dbc0077121fd7c2fc7ffb83d3fb05872552e1757738ec289453783afeedf"],
  ["4830", "3a27e4763116cd0b05d1717ac98a36cd23bb5a10a635462fb77516d0faf9aba4"],
  ["4831", "2b42fb2c0825f3dc37ddad354cca21ed8b17898e45c4036e899f8027db8c9510"],
  ["4929", "db8c70a739f59f5180e565403d52511c4c0c10f5802ae3c53b70be4528258d4b"],
  ["4930", "4eb6dcfcc3c437adab28f3940004300039ebe84d7d9334c746c891f5948202c6"],
  ["4931", "cd2938631f533659cb2fe6358745d0248a10896d1bb86ed37643f4573e60fe2b"]
].map(([mesh, sha256]) => ({
  id: `estat-500m-boundary-${mesh}`,
  mesh,
  url: `https://www.e-stat.go.jp/gis/statmap-search/data?dlserveyId=H&code=${mesh}&coordSys=1&format=shape&downloadType=5`,
  sha256,
  filename: `HDDSWH${mesh}.zip`
}));

const JMA_SEQUENCE_SOURCE = {
  id: "jma-earthquake-list-2026-08-23",
  url: "https://www.jma.go.jp/bosai/quake/data/list.json",
  sha256: "be725e798cd8747068a98c8b988d84c270771018c8956383e030c9289768d161",
  filename: "list.json"
};
const MAIN_SHOCK_EVENT_ID = "20260728162718";
const MAIN_SHOCK_TIME = "2026-07-28T16:27:00+09:00";
const JMA_DETAIL_BASE = "https://www.jma.go.jp/bosai/quake/data/";

const TERRAIN_LAYERS = [
  {
    id: "gsi-dem5-family-full-incident",
    title: "Best available GSI five-metre DEM family, full Kumamoto incident area",
    tile_layers: ["dem5a_png", "dem5b_png", "dem5c_png"],
    zoom: 15,
    requested_bbox: [130.38, 32.28, 130.92, 32.85],
    x_range: [28251, 28300],
    y_range: [13215, 13276],
    expected_logical_tiles: 3100,
    nominal_source_resolution_m: 5,
    approximate_ground_sample_m: 4
  },
  {
    id: "gsi-dem1a-kumamoto-city",
    title: "GSI DEM1A, central Kumamoto hero area",
    tile_layers: ["dem1a_png"],
    zoom: 17,
    requested_bbox: [130.55, 32.65, 130.85, 32.89],
    x_range: [113067, 113177],
    y_range: [52843, 52947],
    expected_logical_tiles: 11655,
    nominal_source_resolution_m: 1,
    approximate_ground_sample_m: 1
  }
];
const GSI_TILE_BASE = "https://cyberjapandata.gsi.go.jp/xyz";

const COLUMN = {
  population: "T001101001",
  populationMale: "T001101002",
  populationFemale: "T001101003",
  age0To14: "T001101004",
  age15To64: "T001101010",
  age65Plus: "T001101019",
  age75Plus: "T001101022",
  households: "T001101034",
  householdsWith65Plus: "T001101047",
  elderlySingleHouseholds: "T001101049",
  elderlyCoupleHouseholds: "T001101050"
};

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

function roundCoordinate(value) {
  return Number(value.toFixed(10));
}

// JIS X 0410 fourth-area (500 m) mesh. The ninth digit selects a quadrant:
// 1=south-west, 2=south-east, 3=north-west, 4=north-east.
function meshPolygon(meshCode) {
  if (!/^\d{9}$/.test(meshCode)) throw new Error(`invalid 500 m mesh code: ${meshCode}`);
  const primaryLatitude = Number(meshCode.slice(0, 2));
  const primaryLongitude = Number(meshCode.slice(2, 4));
  const secondaryLatitude = Number(meshCode[4]);
  const secondaryLongitude = Number(meshCode[5]);
  const tertiaryLatitude = Number(meshCode[6]);
  const tertiaryLongitude = Number(meshCode[7]);
  const quadrant = Number(meshCode[8]);
  if (quadrant < 1 || quadrant > 4) throw new Error(`invalid 500 m mesh quadrant: ${meshCode}`);

  const south = primaryLatitude / 1.5
    + secondaryLatitude / 12
    + tertiaryLatitude / 120
    + (quadrant >= 3 ? 1 / 240 : 0);
  const west = primaryLongitude + 100
    + secondaryLongitude / 8
    + tertiaryLongitude / 80
    + (quadrant % 2 === 0 ? 1 / 160 : 0);
  const north = south + 1 / 240;
  const east = west + 1 / 160;
  const ring = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south]
  ].map(([longitude, latitude]) => [roundCoordinate(longitude), roundCoordinate(latitude)]);
  return { type: "Polygon", coordinates: [ring] };
}

function parseNumber(value) {
  const normalized = value?.trim();
  if (!normalized || normalized === "*" || normalized === "-" || normalized === "X") return null;
  const number = Number(normalized);
  if (!Number.isFinite(number)) throw new Error(`invalid census number: ${value}`);
  return number;
}

function parsePopulationCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 3) throw new Error("population CSV is missing its two header rows");
  const headers = lines[0].split(",");
  const index = Object.fromEntries(headers.map((header, columnIndex) => [header, columnIndex]));
  for (const required of ["KEY_CODE", "HTKSYORI", "HTKSAKI", "GASSAN", ...Object.values(COLUMN)]) {
    if (!(required in index)) throw new Error(`population CSV is missing ${required}`);
  }

  return lines.slice(2).filter(Boolean).map((line) => {
    const cells = line.split(",");
    const meshCode = cells[index.KEY_CODE];
    const privacyCode = cells[index.HTKSYORI];
    const aggregateTargetMesh = cells[index.HTKSAKI] || null;
    const aggregatedSourceMeshes = cells[index.GASSAN]
      ? cells[index.GASSAN].split(";").filter(Boolean)
      : [];
    const number = (column) => parseNumber(cells[index[column]]);
    const privacyStatus = privacyCode === "0"
      ? "NOT_SUPPRESSED"
      : privacyCode === "1"
        ? "AGGREGATE_TARGET"
        : privacyCode === "2"
          ? "SUPPRESSED_SOURCE"
          : "UNKNOWN";

    return {
      type: "Feature",
      id: `estat-2020-kumamoto-500m-${meshCode}`,
      geometry: meshPolygon(meshCode),
      properties: {
        mesh_code: meshCode,
        population_total: number(COLUMN.population),
        population_male: number(COLUMN.populationMale),
        population_female: number(COLUMN.populationFemale),
        population_age_0_14: number(COLUMN.age0To14),
        population_age_15_64: number(COLUMN.age15To64),
        population_age_65_plus: number(COLUMN.age65Plus),
        population_age_75_plus: number(COLUMN.age75Plus),
        households_total: number(COLUMN.households),
        households_with_age_65_plus: number(COLUMN.householdsWith65Plus),
        elderly_single_households: number(COLUMN.elderlySingleHouseholds),
        elderly_couple_households: number(COLUMN.elderlyCoupleHouseholds),
        privacy_status: privacyStatus,
        aggregate_target_mesh: aggregateTargetMesh,
        aggregated_source_meshes: aggregatedSourceMeshes
      }
    };
  });
}

function boundsForFeatures(features) {
  const west = Math.min(...features.map((feature) => feature.geometry.coordinates[0][0][0]));
  const south = Math.min(...features.map((feature) => feature.geometry.coordinates[0][0][1]));
  const east = Math.max(...features.map((feature) => feature.geometry.coordinates[0][2][0]));
  const north = Math.max(...features.map((feature) => feature.geometry.coordinates[0][2][1]));
  return [west, south, east, north];
}

function importPopulation() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "auraworld-estat-population-"));
  try {
    const populationArchive = fetchPinned(POPULATION_SOURCE);
    const archivePath = path.join(temp, POPULATION_SOURCE.filename);
    fs.writeFileSync(archivePath, populationArchive);
    execFileSync("unzip", ["-qq", archivePath, "-d", temp]);
    const csvPath = path.join(temp, "tblT001101H43.txt");
    const csvBytes = fs.readFileSync(csvPath);
    const csvText = new TextDecoder("shift_jis").decode(csvBytes);
    const features = parsePopulationCsv(csvText);
    const populationSum = features.reduce(
      (sum, feature) => sum + (feature.properties.population_total ?? 0),
      0
    );
    if (features.length !== 11_529) throw new Error(`expected 11,529 population cells, got ${features.length}`);
    if (populationSum !== 1_738_301) throw new Error(`expected population total 1,738,301, got ${populationSum}`);

    const boundaryFiles = BOUNDARY_SOURCES.map((source) => {
      const bytes = fetchPinned(source);
      return { ...source, bytes: bytes.length };
    });
    const collection = {
      type: "FeatureCollection",
      schema_version: "disaster-replay.population-grid.v1",
      classification: "OBSERVED_PUBLIC_CENSUS",
      disclosure: "Official 2020 census counts on a 500 m mesh. This is not a 2026 population estimate, a live occupancy layer, or a count of people present during the earthquake. Privacy-suppressed values remain null and the official aggregation flags are preserved.",
      features
    };
    const collectionBytes = Buffer.from(`${JSON.stringify(collection)}\n`);
    const meta = {
      schema_version: "disaster-replay.population-grid-metadata.v1",
      title: "2020 census population and households, Kumamoto Prefecture, 500 m mesh",
      classification: "OBSERVED_PUBLIC_CENSUS",
      census_date: "2020-10-01",
      published_year: 2020,
      coordinate_reference_system: "JGD2000 geographic longitude/latitude",
      mesh_standard: "JIS X 0410 fourth-area mesh (500 m)",
      feature_count: features.length,
      population_total: populationSum,
      bbox: boundsForFeatures(features),
      output: {
        path: path.relative(PACKAGE, POPULATION_OUT).split(path.sep).join("/"),
        bytes: collectionBytes.length,
        sha256: sha256(collectionBytes)
      },
      source: {
        provider: "Statistics Bureau of Japan, e-Stat",
        landing_page: "https://www.e-stat.go.jp/gis",
        table_code: "T001101",
        prefecture_code: "43",
        statistics_archive: {
          ...POPULATION_SOURCE,
          bytes: populationArchive.length,
          extracted_filename: "tblT001101H43.txt",
          extracted_sha256: sha256(csvBytes)
        },
        official_boundary_archives: boundaryFiles,
        definition: "https://www.e-stat.go.jp/help/data-definition-information/downloaddata/T001101.pdf"
      },
      license: {
        name: "Government Standard Terms of Use 2.0",
        commercial_use: true,
        terms: "https://www.e-stat.go.jp/terms-of-use",
        attribution: "出典：政府統計の総合窓口(e-Stat)（https://www.e-stat.go.jp/）を加工して作成"
      },
      processing: {
        tool: "product/disaster-replay/scripts/import-full-incident-data.mjs population",
        rule: "Decode the official Shift JIS table, convert official * / - / X suppressed values to null, retain HTKSYORI / HTKSAKI / GASSAN semantics, and derive each standard mesh rectangle from its nine-digit JIS X 0410 code. Verify the six official e-Stat boundary packages by pinned SHA-256.",
        frozen_on: "2026-08-23"
      }
    };

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(POPULATION_OUT, collectionBytes);
    fs.writeFileSync(POPULATION_META_OUT, `${JSON.stringify(meta, null, 2)}\n`);
    console.log(`POPULATION: ${features.length} cells, ${populationSum} people, ${collectionBytes.length} bytes, SHA-256 ${meta.output.sha256}`);
    console.log(`BOUNDARIES: ${boundaryFiles.length} official packages verified by pinned hash`);
  } finally {
    if (temp.startsWith(`${os.tmpdir()}${path.sep}auraworld-estat-population-`)) {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }
}

function parseJmaCoordinate(raw) {
  const match = /^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+)?\/$/.exec(raw ?? "");
  if (!match) return null;
  const decodeDegrees = (encoded, maximum) => {
    const number = Number(encoded);
    if (Math.abs(number) <= maximum) return number;
    const sign = Math.sign(number);
    const absolute = Math.abs(number);
    const degrees = Math.floor(absolute / 100);
    const minutes = absolute - degrees * 100;
    if (minutes >= 60 || degrees > maximum) return null;
    return sign * (degrees + minutes / 60);
  };
  return {
    // Ordinary reports use decimal degrees (+32.6+130.7); the revised
    // hypocentre bulletin uses compact degrees/minutes (+3237.5+13040.7).
    latitude: decodeDegrees(match[1], 90),
    longitude: decodeDegrees(match[2], 180),
    depth_m: match[3] ? Math.abs(Number(match[3])) : null
  };
}

function importJmaSequence() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const sourceBytes = fs.existsSync(JMA_SEQUENCE_SOURCE_OUT)
    ? fs.readFileSync(JMA_SEQUENCE_SOURCE_OUT)
    : fetchPinned(JMA_SEQUENCE_SOURCE);
  const actualSourceHash = sha256(sourceBytes);
  if (actualSourceHash !== JMA_SEQUENCE_SOURCE.sha256) {
    throw new Error(`${JMA_SEQUENCE_SOURCE.id}: expected SHA-256 ${JMA_SEQUENCE_SOURCE.sha256}, got ${actualSourceHash}`);
  }
  if (!fs.existsSync(JMA_SEQUENCE_SOURCE_OUT)) fs.writeFileSync(JMA_SEQUENCE_SOURCE_OUT, sourceBytes);
  const list = JSON.parse(sourceBytes);
  if (!Array.isArray(list)) throw new Error("JMA earthquake list is not an array");

  const regionalEventIds = new Set(list
    .filter((entry) => entry.at >= MAIN_SHOCK_TIME && /熊本県/.test(entry.anm ?? ""))
    .map((entry) => entry.eid));
  const regionalReports = list
    .filter((entry) => regionalEventIds.has(entry.eid))
    .sort((a, b) => a.at.localeCompare(b.at) || a.rdt.localeCompare(b.rdt) || a.ctt.localeCompare(b.ctt));
  const grouped = new Map();
  for (const entry of regionalReports) {
    if (!grouped.has(entry.eid)) grouped.set(entry.eid, []);
    grouped.get(entry.eid).push(entry);
  }
  const events = [...grouped.entries()].map(([eventId, entries]) => {
    const reports = [...entries].sort((a, b) => a.rdt.localeCompare(b.rdt) || a.ctt.localeCompare(b.ctt));
    const latest = reports.at(-1);
    const latestValue = (key) => [...reports].reverse()
      .map((report) => report[key])
      .find((value) => value !== undefined && value !== null && value !== "") ?? null;
    const coordinateRaw = latestValue("cod");
    const magnitudeRaw = latestValue("mag");
    return {
      event_id: eventId,
      origin_time: latest.at,
      area_name: latestValue("anm"),
      area_name_english: latestValue("en_anm"),
      area_code: latestValue("acd"),
      hypocenter: parseJmaCoordinate(coordinateRaw),
      hypocenter_coordinate_raw: coordinateRaw,
      magnitude: Number.isFinite(Number(magnitudeRaw)) ? Number(magnitudeRaw) : null,
      magnitude_raw: magnitudeRaw,
      maximum_intensity: latestValue("maxi"),
      report_count: reports.length,
      reports: reports.map((entry) => ({
        report_datetime: entry.rdt,
        control_datetime: entry.ctt,
        title: entry.ttl,
        title_english: entry.en_ttl ?? null,
        information_type: entry.ift ?? null,
        serial: entry.ser ?? null,
        detail_url: `${JMA_DETAIL_BASE}${entry.json}`,
        intensity_by_prefecture: entry.int ?? []
      }))
    };
  }).sort((a, b) => a.origin_time.localeCompare(b.origin_time) || a.event_id.localeCompare(b.event_id));

  const mainShock = events.find((event) => event.event_id === MAIN_SHOCK_EVENT_ID);
  if (!mainShock) throw new Error(`main shock ${MAIN_SHOCK_EVENT_ID} is missing from the regional sequence`);
  if (regionalReports.length !== 709) throw new Error(`expected 709 reports across the selected Kumamoto-region events, got ${regionalReports.length}`);
  if (events.length !== 570) throw new Error(`expected 570 Kumamoto-region event IDs, got ${events.length}`);
  if (mainShock.report_count !== 7) throw new Error(`expected seven main-shock reports, got ${mainShock.report_count}`);

  const output = {
    schema_version: "disaster-replay.jma-earthquake-sequence.v1",
    classification: "OBSERVED_PUBLIC",
    disclosure: "Historical JMA earthquake events selected when at least one report names a source area in Kumamoto Prefecture, beginning with the July 28 main shock; every update for each selected event is retained. JMA does not label causal aftershock relationships in this feed, so this is a regional earthquake sequence and not a scientific assertion that every later event was an aftershock.",
    main_shock_event_id: MAIN_SHOCK_EVENT_ID,
    event_count: events.length,
    report_count: regionalReports.length,
    first_origin_time: events[0].origin_time,
    last_origin_time: events.at(-1).origin_time,
    events
  };
  const outputBytes = Buffer.from(`${JSON.stringify(output)}\n`);
  const allEventIds = new Set(list.map((entry) => entry.eid));
  const areaCounts = [...new Set(events.map((event) => event.area_name))]
    .sort()
    .map((area) => ({ area, events: events.filter((event) => event.area_name === area).length }));
  const meta = {
    schema_version: "disaster-replay.jma-earthquake-sequence-metadata.v1",
    title: "JMA Kumamoto regional earthquake sequence following the July 28, 2026 main shock",
    classification: "OBSERVED_PUBLIC",
    output: {
      path: path.relative(PACKAGE, JMA_SEQUENCE_OUT).split(path.sep).join("/"),
      bytes: outputBytes.length,
      sha256: sha256(outputBytes),
      event_count: events.length,
      report_count: regionalReports.length,
      main_shock_report_count: mainShock.report_count,
      later_regional_event_count: events.length - 1,
      area_counts: areaCounts
    },
    source: {
      provider: "Japan Meteorological Agency",
      ...JMA_SEQUENCE_SOURCE,
      bytes: sourceBytes.length,
      snapshot_path: path.relative(PACKAGE, JMA_SEQUENCE_SOURCE_OUT).split(path.sep).join("/"),
      source_report_count: list.length,
      source_event_count: allEventIds.size,
      source_first_origin_time: [...list].sort((a, b) => a.at.localeCompare(b.at))[0]?.at ?? null,
      source_last_origin_time: [...list].sort((a, b) => b.at.localeCompare(a.at))[0]?.at ?? null
    },
    license: {
      name: "Japan Meteorological Agency website terms / Public Data License 1.0",
      commercial_use: true,
      terms: "https://www.jma.go.jp/jma/kishou/info/coment.html",
      attribution: "出典：気象庁ホームページ（https://www.jma.go.jp/bosai/quake/）を加工して作成"
    },
    processing: {
      tool: "product/disaster-replay/scripts/import-full-incident-data.mjs jma-sequence",
      rule: "Freeze the complete public list by SHA-256; select event IDs at or after the main shock when at least one JMA report area name contains 熊本県; retain every update for those event IDs; use the last issued report as the event summary while retaining all report-level intensity summaries.",
      frozen_on: "2026-08-23"
    }
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(JMA_SEQUENCE_OUT, outputBytes);
  fs.writeFileSync(JMA_SEQUENCE_META_OUT, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`JMA SEQUENCE: ${events.length} event IDs, ${regionalReports.length} reports, ${outputBytes.length} bytes, SHA-256 ${meta.output.sha256}`);
}

function longitudeForTileX(x, zoom) {
  return x / (2 ** zoom) * 360 - 180;
}

function latitudeForTileY(y, zoom) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / (2 ** zoom)))) * 180 / Math.PI;
}

function tileCoverageBbox(layer) {
  return [
    longitudeForTileX(layer.x_range[0], layer.zoom),
    latitudeForTileY(layer.y_range[1] + 1, layer.zoom),
    longitudeForTileX(layer.x_range[1] + 1, layer.zoom),
    latitudeForTileY(layer.y_range[0], layer.zoom)
  ].map(roundCoordinate);
}

function decodeGsiElevation(r, g, b) {
  const value = 65536 * r + 256 * g + b;
  if (value < 8388608) return value * 0.01;
  if (value === 8388608) return null;
  return (value - 16777216) * 0.01;
}

function verifyGsiDecoder() {
  if (decodeGsiElevation(0, 0, 100) !== 1) throw new Error("GSI elevation decoder failed positive-height self-test");
  if (decodeGsiElevation(128, 0, 0) !== null) throw new Error("GSI elevation decoder failed NoData self-test");
  if (decodeGsiElevation(255, 255, 156) !== -1) throw new Error("GSI elevation decoder failed negative-height self-test");
}

async function fetchTerrainTile(tile) {
  for (const candidate of tile.candidates) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(candidate.url, { signal: AbortSignal.timeout(30_000) });
        if (response.status === 404) break;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length < 8 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
          throw new Error("response is not a PNG");
        }
        return {
          z: tile.z,
          x: tile.x,
          y: tile.y,
          available: true,
          http_status: response.status,
          source_layer: candidate.source_layer,
          url: candidate.url,
          bytes: bytes.length,
          sha256: sha256(bytes)
        };
      } catch (error) {
        if (attempt === 2) throw new Error(`${candidate.url}: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
      }
    }
  }
  return {
    z: tile.z,
    x: tile.x,
    y: tile.y,
    available: false,
    http_status: 404,
    unavailable_reason: "SOURCE_TILE_NOT_FOUND_HTTP_404"
  };
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

async function importTerrainManifest() {
  verifyGsiDecoder();
  const layers = [];
  for (const layer of TERRAIN_LAYERS) {
    const logicalTiles = [];
    for (let y = layer.y_range[0]; y <= layer.y_range[1]; y += 1) {
      for (let x = layer.x_range[0]; x <= layer.x_range[1]; x += 1) {
        logicalTiles.push({
          z: layer.zoom,
          x,
          y,
          candidates: layer.tile_layers.map((sourceLayer) => ({
            source_layer: sourceLayer,
            url: `${GSI_TILE_BASE}/${sourceLayer}/${layer.zoom}/${x}/${y}.png`
          }))
        });
      }
    }
    if (logicalTiles.length !== layer.expected_logical_tiles) {
      throw new Error(`${layer.id}: expected ${layer.expected_logical_tiles} logical tiles, got ${logicalTiles.length}`);
    }
    const tiles = await mapWithConcurrency(logicalTiles, 32, fetchTerrainTile, layer.id);
    const available = tiles.filter((tile) => tile.available);
    const unavailable = tiles.filter((tile) => !tile.available);
    const availableBySourceLayer = layer.tile_layers.map((sourceLayer) => ({
      source_layer: sourceLayer,
      tile_count: available.filter((tile) => tile.source_layer === sourceLayer).length,
      bytes: available.filter((tile) => tile.source_layer === sourceLayer).reduce((sum, tile) => sum + tile.bytes, 0)
    }));
    layers.push({
      id: layer.id,
      title: layer.title,
      source_priority: layer.tile_layers,
      tile_templates: layer.tile_layers.map((sourceLayer) => `${GSI_TILE_BASE}/${sourceLayer}/{z}/{x}/{y}.png`),
      zoom: layer.zoom,
      requested_bbox_wgs84: layer.requested_bbox,
      tile_coverage_bbox_wgs84: tileCoverageBbox(layer),
      x_range: layer.x_range,
      y_range: layer.y_range,
      logical_tile_count: tiles.length,
      available_tile_count: available.length,
      unavailable_tile_count: unavailable.length,
      available_source_bytes: available.reduce((sum, tile) => sum + tile.bytes, 0),
      available_by_source_layer: availableBySourceLayer,
      nominal_source_resolution_m: layer.nominal_source_resolution_m,
      approximate_ground_sample_m: layer.approximate_ground_sample_m,
      tiles
    });
  }

  const manifest = {
    schema_version: "disaster-replay.gsi-terrain-tile-manifest.v1",
    classification: "OBSERVED_PUBLIC_BASEMAP",
    disclosure: "Pre-earthquake/general ground elevation from GSI. This is not measured earthquake deformation, building or bridge height, a damage layer, or survey-grade engineering data. Five-metre tiles use GSI source priority DEM5A then DEM5B then DEM5C. A missing DEM1A tile falls back to the five-metre family; a NoData pixel or missing five-metre tile falls back to the existing DEM10B layer.",
    layers
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`);
  const meta = {
    schema_version: "disaster-replay.gsi-terrain-metadata.v1",
    title: "High-resolution GSI terrain manifests for the Kumamoto full-incident replay",
    classification: "OBSERVED_PUBLIC_BASEMAP",
    output: {
      path: path.relative(PACKAGE, TERRAIN_MANIFEST_OUT).split(path.sep).join("/"),
      bytes: manifestBytes.length,
      sha256: sha256(manifestBytes),
      logical_tile_count: layers.reduce((sum, layer) => sum + layer.logical_tile_count, 0),
      available_tile_count: layers.reduce((sum, layer) => sum + layer.available_tile_count, 0),
      unavailable_tile_count: layers.reduce((sum, layer) => sum + layer.unavailable_tile_count, 0),
      available_source_bytes: layers.reduce((sum, layer) => sum + layer.available_source_bytes, 0)
    },
    source: {
      provider: "Geospatial Information Authority of Japan",
      tile_catalog: "https://maps.gsi.go.jp/development/ichiran.html",
      elevation_specification: "https://maps.gsi.go.jp/development/demtile.html",
      accuracy_and_source_notes: "https://maps.gsi.go.jp/development/hyokochi.html",
      tile_base: GSI_TILE_BASE
    },
    encoding: {
      description: "GSI twenty-four-bit RGB elevation encoding; deliberately not Mapbox Terrain-RGB or Terrarium.",
      decode: "u=65536*R+256*G+B; if u<8388608 elevation_m=u*0.01; if u==8388608 NoData; otherwise elevation_m=(u-16777216)*0.01",
      nodata_rgb: [128, 0, 0],
      self_tests: [
        { rgb: [0, 0, 100], elevation_m: 1 },
        { rgb: [128, 0, 0], elevation_m: null },
        { rgb: [255, 255, 156], elevation_m: -1 }
      ]
    },
    fallback: {
      missing_dem1a_tile: "Use the selected five-metre DEM5A/DEM5B/DEM5C tile for the same ground area.",
      missing_five_metre_tile_or_nodata_pixel: "Use the existing local DEM10B terrain layer; never infer a high-resolution height."
    },
    license: {
      name: "Japan Public Data License 1.0",
      commercial_use: true,
      terms: "https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html",
      attribution: "地理院タイル（標高タイル）を加工して作成"
    },
    processing: {
      tool: "product/disaster-replay/scripts/import-full-incident-data.mjs terrain-manifest",
      acquisition_mode: "Every selected tile byte was fetched and hashed. Each logical five-metre cell tries DEM5A, then DEM5B, then DEM5C. The repository stores the deterministic URL/hash manifest rather than duplicating the large public tile cache.",
      concurrency: 32,
      frozen_on: "2026-08-23"
    }
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(TERRAIN_MANIFEST_OUT, manifestBytes);
  fs.writeFileSync(TERRAIN_META_OUT, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`TERRAIN MANIFEST: ${meta.output.available_tile_count}/${meta.output.logical_tile_count} tiles, ${meta.output.available_source_bytes} source bytes, SHA-256 ${meta.output.sha256}`);
}

const task = process.argv[2];
if (task === "population") {
  importPopulation();
} else if (task === "jma-sequence") {
  importJmaSequence();
} else if (task === "terrain-manifest") {
  await importTerrainManifest();
} else {
  console.error("usage: node product/disaster-replay/scripts/import-full-incident-data.mjs <population|jma-sequence|terrain-manifest>");
  process.exitCode = 2;
}
