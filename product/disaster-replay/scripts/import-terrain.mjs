import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT_PNG = path.join(PACKAGE, "data", "gsi-dem10b-z11-kumamoto.png");
const OUT_META = path.join(PACKAGE, "data", "gsi-dem10b-z11-kumamoto.meta.json");
const ZOOM = 11;
const XS = [1766, 1767, 1768];
const YS = [826, 827, 828, 829];
const TEMPLATE = "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png";
const REQUESTED_BOUNDS = [[130.48, 32.30], [130.90, 32.83]];
const PIXEL_EDGE_BOUNDS = [[130.4798126221, 32.2999022411], [130.9000396729, 32.8305580294]];
const CROP = { x: 73, y: 21, width: 612, height: 917 };

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const tileUrl = (x, y) => TEMPLATE.replace("{z}", ZOOM).replace("{x}", x).replace("{y}", y);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "auraworld-gsi-dem-"));
try {
  const tiles = [];
  for (const y of YS) {
    for (const x of XS) {
      const file = path.join(temp, `${ZOOM}-${x}-${y}.png`);
      const url = tileUrl(x, y);
      execFileSync("curl", ["--fail", "--location", "--retry", "3", "--silent", "--show-error", "--output", file, url], { stdio: "inherit" });
      const bytes = fs.readFileSync(file);
      tiles.push({ z: ZOOM, x, y, url, bytes: bytes.length, sha256: sha256(bytes), file });
    }
  }

  const mosaic = path.join(temp, "mosaic.png");
  execFileSync("magick", ["montage", ...tiles.map((tile) => tile.file), "-tile", "3x4", "-geometry", "256x256+0+0", mosaic], { stdio: "inherit" });
  fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true });
  execFileSync("magick", [mosaic, "-crop", `${CROP.width}x${CROP.height}+${CROP.x}+${CROP.y}`, "+repage", "-strip", "-define", "png:color-type=2", OUT_PNG], { stdio: "inherit" });

  const output = fs.readFileSync(OUT_PNG);
  const meta = {
    schema_version: "disaster-replay.terrain-dem.v1",
    title: "GSI DEM10B terrain cut for the Kumamoto 2026 replay",
    classification: "OBSERVED_PUBLIC_BASEMAP",
    disclosure: "This is a general GSI ground-elevation basemap, not post-earthquake deformation, building height, bridge height, or survey-grade engineering data.",
    requested_bounds_wgs84: REQUESTED_BOUNDS,
    pixel_edge_bounds_wgs84: PIXEL_EDGE_BOUNDS,
    xyz_zoom: ZOOM,
    xyz_tiles: tiles.map(({ file: _file, ...tile }) => tile),
    mosaic_pixels: [768, 1024],
    crop_in_mosaic_pixels: CROP,
    output_pixels: [CROP.width, CROP.height],
    approximate_ground_sample_m_at_latitude_32_6: 64,
    output_path: path.relative(PACKAGE, OUT_PNG).split(path.sep).join("/"),
    output_bytes: output.length,
    output_sha256: sha256(output),
    encoding: {
      description: "Lossless GSI RGB elevation encoding preserved from the source PNG tiles.",
      decode: "u=65536*R+256*G+B; if u<8388608 elevation_m=u*0.01; if u==8388608 NoData; otherwise elevation_m=(u-16777216)*0.01",
      nodata_rgb: [128, 0, 0]
    },
    source: {
      provider: "Geospatial Information Authority of Japan",
      tile_template: TEMPLATE,
      tile_catalog: "https://maps.gsi.go.jp/development/ichiran.html",
      technical_specification: "https://maps.gsi.go.jp/development/demtile.html",
      attribution: "Created by processing GSI Tiles (Elevation Tile / Fundamental Geospatial Data DEM), Geospatial Information Authority of Japan."
    },
    processing: {
      tool: "ImageMagick",
      rule: "Stitch XYZ tiles with x increasing east and y increasing south; crop [73,21,685,938) without lossy conversion.",
      frozen_on: "2026-08-23"
    }
  };
  fs.writeFileSync(OUT_META, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`TERRAIN: ${CROP.width}x${CROP.height}, ${output.length} bytes, SHA-256 ${meta.output_sha256}`);
  console.log(`TILES: ${tiles.length}, ${tiles.reduce((sum, tile) => sum + tile.bytes, 0)} source bytes`);
} finally {
  if (temp.startsWith(`${os.tmpdir()}${path.sep}auraworld-gsi-dem-`)) fs.rmSync(temp, { recursive: true, force: true });
}
