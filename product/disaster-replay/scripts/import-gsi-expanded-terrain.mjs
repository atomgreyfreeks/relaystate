import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT_PNG = path.join(PACKAGE, "data/full-incident/gsi-dem10b-z11-full-incident.png");
const OUT_META = path.join(PACKAGE, "data/full-incident/gsi-dem10b-z11-full-incident.meta.json");
const REPLAY = path.join(PACKAGE, "runs/kumamoto-2026-full-incident/260728-72h/timeline.jsonl");

const ZOOM = 11;
const TILE_SIZE = 256;
const TEMPLATE = "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png";

// The sealed replay's geometry reaches [130.4, 32.183096, 131.328246, 32.92495].
// This rectangle retains roughly two kilometres of context around every edge so a camera
// aimed at an edge event still sees ground around the subject instead of a black border.
const REQUESTED_BOUNDS = [[130.38, 32.16], [131.35, 32.95]];

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const round6 = (value) => Number(value.toFixed(6));
const scale = 2 ** ZOOM * TILE_SIZE;
const worldX = (longitude) => (longitude + 180) / 360 * scale;
const worldY = (latitude) =>
  (1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * scale;
const longitudeAt = (x) => x / scale * 360 - 180;
const latitudeAt = (y) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI;
const tileUrl = (x, y) => TEMPLATE.replace("{z}", ZOOM).replace("{x}", x).replace("{y}", y);

function positions(value, output = []) {
  if (!Array.isArray(value)) return output;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    output.push([value[0], value[1]]);
    return output;
  }
  for (const child of value) positions(child, output);
  return output;
}

function replayGeometryExtent() {
  const events = fs.readFileSync(REPLAY, "utf8").trimEnd().split("\n").map(JSON.parse);
  const points = [];
  for (const event of events) {
    const geometry = event.geometry ?? event.payload?.geometry ?? event.payload?.earthquake?.geometry;
    if (geometry) positions(geometry.coordinates, points);
  }
  if (points.length === 0) throw new Error("the sealed replay contains no camera geometry");
  const extent = [
    Math.min(...points.map(([longitude]) => longitude)),
    Math.min(...points.map(([, latitude]) => latitude)),
    Math.max(...points.map(([longitude]) => longitude)),
    Math.max(...points.map(([, latitude]) => latitude)),
  ];
  const [[west, south], [east, north]] = REQUESTED_BOUNDS;
  if (extent[0] < west || extent[1] < south || extent[2] > east || extent[3] > north) {
    throw new Error(`requested terrain does not cover replay geometry ${JSON.stringify(extent)}`);
  }
  return { event_count: events.length, point_count: points.length, extent_wgs84: extent };
}

const [[west, south], [east, north]] = REQUESTED_BOUNDS;
const pixel = {
  west: Math.floor(worldX(west)),
  east: Math.ceil(worldX(east)),
  north: Math.floor(worldY(north)),
  south: Math.ceil(worldY(south)),
};
const range = {
  x_min: Math.floor(pixel.west / TILE_SIZE),
  x_max: Math.floor((pixel.east - 1) / TILE_SIZE),
  y_min: Math.floor(pixel.north / TILE_SIZE),
  y_max: Math.floor((pixel.south - 1) / TILE_SIZE),
};
const columns = range.x_max - range.x_min + 1;
const rows = range.y_max - range.y_min + 1;
const crop = {
  x: pixel.west - range.x_min * TILE_SIZE,
  y: pixel.north - range.y_min * TILE_SIZE,
  width: pixel.east - pixel.west,
  height: pixel.south - pixel.north,
};

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "auraworld-gsi-full-incident-dem-"));
try {
  const replayGeometry = replayGeometryExtent();
  const tiles = [];
  for (let y = range.y_min; y <= range.y_max; y++) {
    for (let x = range.x_min; x <= range.x_max; x++) {
      const file = path.join(temp, `${ZOOM}-${x}-${y}.png`);
      const url = tileUrl(x, y);
      execFileSync(
        "curl",
        ["--fail", "--location", "--retry", "3", "--silent", "--show-error", "--output", file, url],
        { stdio: "inherit" },
      );
      const bytes = fs.readFileSync(file);
      tiles.push({ z: ZOOM, x, y, url, bytes: bytes.length, sha256: sha256(bytes), file });
    }
  }

  const mosaic = path.join(temp, "mosaic.png");
  execFileSync(
    "magick",
    ["montage", ...tiles.map((tile) => tile.file), "-tile", `${columns}x${rows}`,
      "-geometry", `${TILE_SIZE}x${TILE_SIZE}+0+0`, mosaic],
    { stdio: "inherit" },
  );
  fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true });
  execFileSync(
    "magick",
    [mosaic, "-crop", `${crop.width}x${crop.height}+${crop.x}+${crop.y}`, "+repage",
      "-strip", "-define", "png:color-type=2", OUT_PNG],
    { stdio: "inherit" },
  );

  const output = fs.readFileSync(OUT_PNG);
  const meta = {
    schema_version: "disaster-replay.terrain-dem.v1",
    title: "GSI DEM10B terrain cut covering the Kumamoto full-incident replay",
    classification: "OBSERVED_PUBLIC_BASEMAP",
    disclosure: "General GSI ground elevation, not earthquake deformation, building or bridge height, or survey-grade engineering data.",
    requested_bounds_wgs84: REQUESTED_BOUNDS,
    replay_geometry: replayGeometry,
    visual_context_margin_degrees: {
      west: round6(replayGeometry.extent_wgs84[0] - west),
      south: round6(replayGeometry.extent_wgs84[1] - south),
      east: round6(east - replayGeometry.extent_wgs84[2]),
      north: round6(north - replayGeometry.extent_wgs84[3]),
    },
    pixel_edge_bounds_wgs84: [
      [Number(longitudeAt(pixel.west).toFixed(10)), Number(latitudeAt(pixel.south).toFixed(10))],
      [Number(longitudeAt(pixel.east).toFixed(10)), Number(latitudeAt(pixel.north).toFixed(10))],
    ],
    xyz_zoom: ZOOM,
    xyz_tile_range: range,
    xyz_tiles: tiles.map(({ file: _file, ...tile }) => tile),
    mosaic_pixels: [columns * TILE_SIZE, rows * TILE_SIZE],
    crop_in_mosaic_pixels: crop,
    output_pixels: [crop.width, crop.height],
    approximate_ground_sample_m_at_latitude_32_6: 64,
    output_path: path.relative(PACKAGE, OUT_PNG).split(path.sep).join("/"),
    output_bytes: output.length,
    output_sha256: sha256(output),
    encoding: {
      description: "Lossless GSI RGB elevation encoding preserved from the source PNG tiles.",
      decode: "u=65536*R+256*G+B; if u<8388608 elevation_m=u*0.01; if u==8388608 NoData; otherwise elevation_m=(u-16777216)*0.01",
      nodata_rgb: [128, 0, 0],
    },
    source: {
      provider: "Geospatial Information Authority of Japan",
      tile_template: TEMPLATE,
      tile_catalog: "https://maps.gsi.go.jp/development/ichiran.html",
      technical_specification: "https://maps.gsi.go.jp/development/demtile.html",
      attribution: "Created by processing GSI Tiles (Elevation Tile / Fundamental Geospatial Data DEM), Geospatial Information Authority of Japan.",
    },
    processing: {
      tool: "product/disaster-replay/scripts/import-gsi-expanded-terrain.mjs + ImageMagick",
      rule: `Stitch XYZ tiles x-east/y-south; losslessly crop world pixels [${pixel.west},${pixel.north},${pixel.east},${pixel.south}).`,
      frozen_on: "2026-08-23",
    },
  };
  fs.writeFileSync(OUT_META, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  console.log(`TERRAIN: ${crop.width}x${crop.height}, ${output.length} bytes, SHA-256 ${meta.output_sha256}`);
  console.log(`COVERAGE: ${JSON.stringify(meta.pixel_edge_bounds_wgs84)} covers ${replayGeometry.point_count} replay geometry points`);
  console.log(`TILES: ${tiles.length}, ${tiles.reduce((sum, tile) => sum + tile.bytes, 0)} source bytes`);
} finally {
  if (temp.startsWith(`${os.tmpdir()}${path.sep}auraworld-gsi-full-incident-dem-`)) {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
