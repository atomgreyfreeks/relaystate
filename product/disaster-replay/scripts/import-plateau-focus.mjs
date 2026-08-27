import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT = path.join(PACKAGE, "data", "plateau-uki-2025-focus");
const URL = "https://assets.cms.plateau.reearth.io/assets/c3/6b9e5c-cbdc-415a-9ac1-601df5f79fd4/43213_uki-shi_city_2025_3dtiles_mvt_1_op.zip";
const SOURCE_SHA256 = "d271ce2a6e0e337cd7d8e913ee498832e7719e3cd86fa006c84036346c8385a8";
const PREFIX = "43213_uki-shi_city_2025_citygml_1_op_bldg_3dtiles_lod1/";
const TILESET_MEMBER = `${PREFIX}tileset.json`;
const FOCUS_BOUNDS = [130.665, 32.612, 130.691, 32.638];

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const unzipMember = (archive, member) => execFileSync("unzip", ["-p", archive, member], { maxBuffer: 32 * 1024 * 1024 });
const degrees = (radians) => radians * 180 / Math.PI;

function intersects(tile) {
  const region = tile.boundingVolume?.region;
  if (!Array.isArray(region) || region.length < 4) return false;
  const [west, south, east, north] = region.slice(0, 4).map(degrees);
  return !(east < FOCUS_BOUNDS[0] || west > FOCUS_BOUNDS[2] || north < FOCUS_BOUNDS[1] || south > FOCUS_BOUNDS[3]);
}

function coverageFrontier(tile, selected = []) {
  if (!intersects(tile)) return selected;
  const children = (tile.children ?? []).filter(intersects);
  if (children.length > 0) {
    for (const child of children) coverageFrontier(child, selected);
  } else if (tile.content?.uri) {
    selected.push(tile);
  }
  return selected;
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "auraworld-plateau-"));
let archive = process.argv[2] ? path.resolve(process.argv[2]) : null;
try {
  if (!archive) {
    archive = path.join(temp, "uki-2025.zip");
    execFileSync("curl", ["--fail", "--location", "--retry", "3", "--silent", "--show-error", "--output", archive, URL], { stdio: "inherit" });
  }
  if (!fs.existsSync(archive)) throw new Error(`source archive does not exist: ${archive}`);
  const archiveBytes = fs.readFileSync(archive);
  const archiveHash = sha256(archiveBytes);
  if (archiveHash !== SOURCE_SHA256) throw new Error(`source archive hash changed: expected ${SOURCE_SHA256}, got ${archiveHash}`);

  const sourceTileset = JSON.parse(unzipMember(archive, TILESET_MEMBER));
  const frontier = coverageFrontier(sourceTileset.root);
  if (frontier.length === 0) throw new Error("focus bounds selected no PLATEAU building tiles");

  fs.mkdirSync(path.join(OUT, "data"), { recursive: true });
  const contents = [];
  for (const tile of frontier.sort((a, b) => a.content.uri.localeCompare(b.content.uri))) {
    const member = `${PREFIX}${tile.content.uri}`;
    const bytes = unzipMember(archive, member);
    const target = path.join(OUT, tile.content.uri);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    contents.push({ uri: tile.content.uri, bytes: bytes.length, sha256: sha256(bytes), bounding_volume: tile.boundingVolume });
  }

  const rootRegion = [
    FOCUS_BOUNDS[0] * Math.PI / 180,
    FOCUS_BOUNDS[1] * Math.PI / 180,
    FOCUS_BOUNDS[2] * Math.PI / 180,
    FOCUS_BOUNDS[3] * Math.PI / 180,
    Math.min(...frontier.map((tile) => tile.boundingVolume.region[4])),
    Math.max(...frontier.map((tile) => tile.boundingVolume.region[5]))
  ];
  const tileset = {
    asset: { version: "1.0", generator: "AURAWORLD PLATEAU focus extractor" },
    geometricError: Math.max(...frontier.map((tile) => tile.geometricError ?? 0)),
    root: {
      boundingVolume: { region: rootRegion },
      geometricError: Math.max(...frontier.map((tile) => tile.geometricError ?? 0)),
      refine: "ADD",
      children: frontier.map((tile) => ({
        boundingVolume: tile.boundingVolume,
        geometricError: 0,
        refine: "ADD",
        content: { uri: tile.content.uri }
      }))
    }
  };
  fs.writeFileSync(path.join(OUT, "tileset.json"), `${JSON.stringify(tileset, null, 2)}\n`);

  const metadata = {
    schema_version: "disaster-replay.plateau-focus.v1",
    title: "Project PLATEAU Uki City 2025 LOD1 building focus cut",
    classification: "OBSERVED_PUBLIC_BASEMAP",
    disclosure: "These are real pre-event municipal building geometries. They do not show earthquake damage, occupancy, safety, or rescue need.",
    source: {
      provider: "Uki City / Project PLATEAU / Ministry of Land, Infrastructure, Transport and Tourism",
      url: URL,
      archive_bytes: archiveBytes.length,
      archive_sha256: archiveHash,
      source_member: TILESET_MEMBER,
      attribution: "Created by processing the 2025 Uki City 3D city model (Uki City / Project PLATEAU / MLIT Japan)."
    },
    focus_bounds_wgs84: FOCUS_BOUNDS,
    selection_rule: "For every source-tile branch intersecting the focus bounds, retain the deepest intersecting tile; flatten those coverage-frontier tiles into one local tileset.",
    content_count: contents.length,
    content_bytes: contents.reduce((sum, item) => sum + item.bytes, 0),
    contents
  };
  fs.writeFileSync(path.join(OUT, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`PLATEAU: ${contents.length} LOD1 building tiles, ${metadata.content_bytes} bytes, focus ${FOCUS_BOUNDS.join(",")}`);
} finally {
  if (temp.startsWith(`${os.tmpdir()}${path.sep}auraworld-plateau-`)) fs.rmSync(temp, { recursive: true, force: true });
}
