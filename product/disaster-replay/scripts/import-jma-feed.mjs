import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(HERE, "..");
const OUT = path.join(PACKAGE, "data", "jma-2026-kumamoto-official-updates.json");
const LIST_URL = "https://www.jma.go.jp/bosai/quake/data/list.json";
const DETAIL_BASE = "https://www.jma.go.jp/bosai/quake/data/";
const EVENT_ID = "20260728162718";

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const fetchBuffer = (url) => execFileSync("curl", ["--fail", "--location", "--retry", "3", "--silent", "--show-error", url], { maxBuffer: 16 * 1024 * 1024 });
const array = (value) => value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];

function stations(detail) {
  const rows = [];
  for (const pref of array(detail.Body?.Intensity?.Observation?.Pref)) {
    for (const area of array(pref.Area)) {
      for (const city of array(area.City)) {
        for (const station of array(city.IntensityStation)) {
          rows.push({
            prefecture: pref.Name ?? null,
            area: area.Name ?? null,
            municipality: city.Name ?? null,
            name: station.Name,
            english_name: station.enName ?? null,
            code: station.Code,
            latitude: station.latlon?.lat,
            longitude: station.latlon?.lon,
            intensity: station.Int
          });
        }
      }
    }
  }
  return rows;
}

const listBuffer = fetchBuffer(LIST_URL);
const list = JSON.parse(listBuffer);
const entries = list
  .filter((entry) => entry.eid === EVENT_ID)
  .sort((a, b) => a.rdt.localeCompare(b.rdt) || a.ctt.localeCompare(b.ctt));
if (entries.length !== 7) throw new Error(`expected seven official updates for ${EVENT_ID}, got ${entries.length}`);

const details = entries.map((entry) => {
  const url = `${DETAIL_BASE}${entry.json}`;
  const bytes = fetchBuffer(url);
  const detail = JSON.parse(bytes);
  const stationRows = stations(detail);
  return {
    entry,
    detail,
    bytes,
    stationRows,
    summary: {
      report_id: entry.json.replace(/\.json$/, ""),
      report_datetime: detail.Head?.ReportDateTime ?? entry.rdt,
      title: detail.Head?.Title ?? entry.ttl,
      serial: String(detail.Head?.Serial ?? entry.ser ?? "0"),
      event_id: detail.Head?.EventID ?? entry.eid,
      event_origin_time: detail.Body?.Earthquake?.OriginTime || entry.at || null,
      magnitude: detail.Body?.Earthquake?.Magnitude || entry.mag || null,
      max_intensity: detail.Body?.Intensity?.Observation?.MaxInt || entry.maxi || null,
      hypocenter_coordinate: detail.Body?.Earthquake?.Hypocenter?.Area?.Coordinate || entry.cod || null,
      station_count: stationRows.length,
      source_url: url,
      source_sha256: sha256(bytes)
    }
  };
});
const fullest = [...details].sort((a, b) => b.stationRows.length - a.stationRows.length)[0];
if (fullest.stationRows.length !== 1248) throw new Error(`expected 1,248 station readings, got ${fullest.stationRows.length}`);

const normalized = {
  schema_version: "disaster-replay.jma-updates.v1",
  event_id: EVENT_ID,
  classification: "OBSERVED_PUBLIC",
  disclosure: "These are normalized historical JMA earthquake reports. AURAWORLD did not generate or forecast them; report times and revisions are preserved.",
  source: {
    provider: "Japan Meteorological Agency",
    list_url: LIST_URL,
    filtered_event_entries_sha256: sha256(Buffer.from(JSON.stringify(entries))),
    event_page: "https://www.data.jma.go.jp/eqev/data/kyoshin/jishin/2607281627_kumamoto/",
    attribution: "Japan Meteorological Agency; normalized by AURAWORLD."
  },
  updates: details.map((row) => row.summary),
  station_readings_from_report_id: fullest.summary.report_id,
  station_count: fullest.stationRows.length,
  stations: fullest.stationRows,
  processing: {
    frozen_on: "2026-08-23",
    rule: "Filter the live JMA list to event 20260728162718, retain all seven issued reports in report-time order, and flatten the fullest report's station tree without changing values."
  }
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(normalized, null, 2)}\n`);
console.log(`JMA: ${normalized.updates.length} official updates; ${normalized.station_count} geolocated station readings; ${fs.statSync(OUT).size} bytes`);
