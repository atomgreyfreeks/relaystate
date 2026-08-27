/**
 * RESCUE WORLD — one inhabitable world over real Kumamoto ground.
 *
 * On 28 July 2026 an earthquake struck Kumamoto Prefecture in Japan. This page plays back a
 * recorded rescue operation over that place. Two desks read exactly the same reports about the
 * same earthquake. The plain desk keeps the largest number reported for each place and sends
 * its two teams to the two largest numbers. The evidence desk keeps every competing number as
 * its own version, counts how many separate sources agree, and will not send a team on a
 * version no second source confirmed. That rule is the only thing that differs.
 *
 * THIS PAGE RUNS NO AGENT LOGIC. It reads one baked file — `/rescueworld-log.json`, an 81-event
 * run written by `product/disaster-replay/` and delivered by `app/scripts/bake-rescueworld.mjs`
 * — and every mark on screen comes out of it. `geometry.coordinates` place the marks,
 * `sim_time_s` places the moment, `arm` picks the desk, and the payload writes the words.
 *
 * WHAT IS REAL. The ground is the Geospatial Information Authority of Japan's published
 * elevation tiles, decoded by the rule their own metadata states and placed through the pixel
 * edge bounds that metadata records. The landslide zones are that authority's interpretation of
 * aerial photographs flown 29 July to 3 August 2026. The road closures are the Ministry of
 * Land, Infrastructure, Transport and Tourism's passable-road snapshot of 29 July 2026 12:00
 * Japan time. The shelters are officially designated locations. The buildings are Japan's open
 * 3D city model of Uki City, standing as pre-event context.
 *
 * WHAT IS INVENTED. Every report about people, every count, every dispatch and every outcome is
 * synthetic exercise data, and the damage drawn on the ground is a simulation. The exercise's
 * four sites sit far north of the mapped city block, and no real building is ever drawn damaged
 * or marked as a rescue site.
 *
 * DETERMINISM. Every frame is a pure function of one number, the playback tick. Ground marks
 * are re-deposited from tick zero on any rewind, the dust is a function of the tick, and there
 * is no random source and no wall clock anywhere in the state. The camera is a viewpoint rather
 * than state: a person gets freedom of viewpoint and freedom of interrogation, never freedom of
 * history.
 *
 * THE CLOCK. The run's recorded seconds run from 0 to 20,444 and its reports arrive in bursts
 * hours apart, so playing them on a straight line would leave the whole decision in the last
 * half second. Instead each recorded moment — each distinct value of `sim_time_s` — gets the
 * same share of the playback grid, and the transport always states the true recorded time and
 * the true time of day. The order is the log's order and no moment is skipped or reordered.
 */
import * as THREE from "three";
import {
  applyLook, initPost, LOOK_KEYS, LOOKS, postCompose, resizePost, type PostState,
} from "./post";
import { buildStations } from "./stations";
import { GROUND, loadTerrain, makeFrame, type DemMeta, type Terrain } from "./terrain";
import {
  buildHazardLines, buildRoadLines, readHazards, readRoads, readShelters,
  type DrawnLines, type HazardFeature, type RoadFeature, type ShelterFeature,
} from "./layers";
import { mountContextLayers, type ContextLayers } from "./context";
import { makeRig, type Pose, type Rig } from "./camera";
import {
  deriveActs, openingBeat,
  type Act, type Beat as ActBeat, type OpeningBeat, type ReplayEvent as ActEvent,
} from "./acts";
import { createBillboards, type BillboardRect, type Billboards } from "./billboards";
import { buildDamage, type DamageField } from "./damage";
import { loadBuildings, type BuildingSet } from "./buildings";
import { buildRoute } from "./route";
import * as COPY from "./copy";
import * as GLOSS from "./gloss";
import {
  divergenceEpisode, divergences, pairRuns,
  type DivergenceEpisode, type ReplayEvent,
} from "./pairing";
import {
  buildTraces, readSeedDesks,
  type AgentTrace, type RawContext, type RawDecisionEvent, type TraceCard, type TraceDesk,
} from "./trace";
import { loadHighlights, stripOf, type StripReading } from "./highlights";
import {
  actionOf, buildTree, drawTree, treeReport, windowSecondsOf, type TreeHandle, type TreeModel,
} from "./tree";
import { mountArtDirector } from "../rescueworld-art-director";
import { recolorDamage, residueRgb } from "../rescueworld-art-director/burn";

// ------------------------------------------------------------------ the shape of the piece
const TICKS = 520;           // the playback grid the recorded moments are laid onto
const RATE = 24;             // ticks per second — one pass is about 22 seconds
const LOOK = 26;             // ticks an event stays the live one
const ALERT_LIFE = 118;      // ticks an alert stays in the feed — playback time, not wall time
const BEAT_LIFE = 96;        // ticks a regional line stays under the feed — playback time again
const BEAT_SHOWN = 3;        // regional lines on screen at once, newest last
const QUAKE_MIN_MAG = 4.2;   // the recorded magnitude a shock needs to earn a line of its own
const WATCH_IDLE = 12;       // seconds of untouched controls before the camera tour takes over
const WATCH_GLIDE = 2.4;     // seconds one tour move takes
const WATCH_HOLD = 4.2;      // seconds the tour rests at a place before moving on
/**
 * The directed watch — the default after Begin. A round plays for a number of seconds derived
 * from how many events it carries, then the run holds at the round's last tick for a dwell
 * derived the same way, so a dense round breathes longer than a thin one. On this record the
 * evidence desk's eight rounds come to about five minutes end to end.
 */
const DIRECT_PLAY_BASE = 8;        // seconds a round gets before its own events are counted
const DIRECT_PLAY_PER_EVENT = 2.1; // seconds each event in the round adds to the play
const DIRECT_PLAY_MIN = 14, DIRECT_PLAY_MAX = 92;
const DIRECT_DWELL_BASE = 8;       // seconds the hold gets before the events are counted
const DIRECT_DWELL_PER_EVENT = 0.45;
const DIRECT_DWELL_MIN = 9, DIRECT_DWELL_MAX = 18;
const DIRECT_FLY = 2.6;            // seconds one directed camera move takes
const DIRECT_MOVE_GAP = 4.5;       // the least seconds of play between two moves inside a round
const DIRECT_BREATH = 4.5;         // seconds of the whole ground before the debrief rises
const REAL_URL = "/real-response-summary.json";
/**
 * The registered highlight contract. One program, `app/scripts/derive-rescueworld-highlights.mjs`,
 * reads the sealed run and writes every registered count into this file, and checks the file
 * against the run again on every build. Every count of tries this page shows is read from it, so
 * the screen and that program can never disagree.
 */
const HIGHLIGHTS_URL = "/rescueworld-highlights.json";
/** how many recorded tries one strip of cells stands for */
const STRIP_CELLS = 8;
/**
 * How far ahead of a decision's deadline the map lights the places under consideration, in
 * seconds of watching. The camera move for a decision moment is pulled the same distance earlier,
 * so the frame is already on the place while the proposals are still standing.
 */
const TELEGRAPH_LEAD_SECONDS = 3.2;
/**
 * Where agreement is low enough that a viewer is told to read the moment's own reports. The
 * threshold is stated on screen with the count it is about, so nothing hidden drives it.
 */
const WEAK_AGREEMENT = 2;
/**
 * The agent trace follows one recorded run of each moment of decision, and this is which one.
 * Eight runs of every moment were recorded; run 51104 is the one the water-planning moment's
 * story is told from, so the same run is followed at every other moment for consistency.
 */
const TRACE_SEED = 51104;
/**
 * The moment the directed watch stops at and opens the trace on by itself. It is the clearest
 * of the eleven: the evidence-table desk allocated 24 water trucks where 22 were allowed, the
 * check said exactly that, and the one correction brought it to 22.
 */
const TRACE_FLAGSHIP = "slot-09-push-water-planning";
/**
 * The way of deciding whose answer a decision row and a ledger row show. It is the last of the
 * three the record holds — an evidence table with one correction message — because it is the one
 * whose answer the simulation finally acted on.
 */
const FINAL_METHOD = "evidence_feedback";
const OPEN_SECONDS = 5.0;    // the opening flight, from high above down to the first site
const MS_N = 120;            // frames of cost history the meter keeps
const WARM = 60;             // frames after a load or a resize the meter does not count
const REACH = "exercise_people_reached";
const D2R = Math.PI / 180;

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const el = (id: string) => document.getElementById(id)!;
const num = (v: unknown, d = 0) => (typeof v === "number" && isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" && v ? v : d);

const SIG: [number, number, number] = [0.49, 0.976, 1.0];   // the one live thing
/** Randy's approved live-art-direction snapshot, copied from the G panel on 23 August 2026. */
const DEFAULT_ART_GRADE: PostState["params"] = {
  halation: 0.52,
  haloThreshold: 0.27,
  haloSpread: 5.35,
  exposure: 1.04,
  contrast: 1.08,
  lift: 0.006,
  gamma: 1,
  saturation: 1,
  grain: 0.066,
  grainSize: 1.6,
  vignette: 0.93,
  split: 1.1,
  scan: 0.66,
  postStrength: 1,
};
const DEFAULT_BURN = "#1f2eff";
const EMB: [number, number, number] = [31 / 255, 46 / 255, 1]; // spent, unrecoverably
const BONE: [number, number, number] = [0.85, 0.94, 1.0];   // places, at rest
let burnHex = DEFAULT_BURN;

/** plain words for each recorded event type — the label that rides the picture */
const TAG: Record<string, string> = {
  WORLD_INITIALIZED: "the run begins",
  SOURCE_INGESTED: "report",
  GRAPH_TRANSITION: "next step",
  CLAIM_STATE_CHANGED: "verdict",
  DECISION_PROPOSED: "decision",
  POLICY_EVALUATED: "rule",
  RESOURCE_DISPATCHED: "team sent",
  OUTCOME_OBSERVED: "what the team found",
  METRIC_UPDATED: "counted",
};

/**
 * Plain words for the steps a desk takes. The names on the left are the node identifiers the
 * recorded graph uses; a node this list does not cover is shown as its own identifier in lower
 * case, so a changed backend graph names itself rather than going blank.
 */
const NODE: Record<string, string> = {
  INTAKE: "the reports come in",
  INGEST: "the desk takes the reports in",
  SUMMARIZE: "the desk keeps the largest number",
  VERSION: "the desk keeps every version apart",
  CORROBORATE: "the desk counts agreeing sources",
  GATE: "the desk applies its rule",
  RANK: "the desk ranks the places",
  DISPATCH: "the desk sends the teams",
  OBSERVE: "what the teams found",
  UPDATE: "the desk writes down what its teams found",
};

/** the few recorded Japanese terms this page states in English as well as as written */
const JP: Record<string, string> = {
  "全面通行止": "closed to all traffic",
  "落石": "falling rock",
  "道路損壊": "road damage",
  "橋梁損傷": "bridge damage",
  "地震": "the earthquake",
  "地震による路面段差": "the earthquake left a step in the road",
  "地震による橋台段差": "the earthquake left a step where the bridge meets the road",
  "災害": "disaster",
  "都道府県道": "prefectural road",
  "市区町村道": "municipal road",
  "高速道路": "expressway",
  "直轄国道": "a national road the state looks after",
  "補助国道": "a national road the prefecture looks after",
};
const en = (v: unknown) => {
  const s = str(v);
  return s && JP[s] ? `${s} — ${JP[s]}` : s;
};

// ---------------------------------------- the real-response summary, exactly as the bake wrote it
/**
 * What `app/scripts/bake-real-response.mjs` writes into `app/public/real-response-summary.json`.
 * Every field is copied out of a committed artifact: the forty certificate-checked result files,
 * the sealed scenario, and the dual-signed report. This page reads it and displays it.
 */
interface RealArm {
  arm: string;
  name: string;
  seeds: number;
  fully_valid: number;
  communication_failures: number;
  constraint_passes: number;
  example: {
    seeds_matching: number;
    first_seed: number;
    fully_valid: boolean;
    assignment_count: number;
    total_quantity: number;
    unlisted: number;
    line: string;
    targets: { label: string; quantity: number }[];
    resources: { label: string; quantity: number }[];
  };
}
interface RealSlot {
  slot_id: string;
  slot_number: number;
  title: string;
  decider: string;
  task_line: string;
  cutoff_words: string;
  /** the recorded deadline, in full — what the regional line under the feed fires on */
  cutoff_at: string;
  cutoff_day: string;
  cutoff_time: string;
  historical: {
    summary: string;
    unknowns: string[];
    line: string;
    targets: { label: string; quantity: number }[];
    resources: { label: string; quantity: number }[];
  };
  arms: RealArm[];
}
interface RealSummary {
  configurations: number;
  seeds: number;
  manifest_hash: string;
  arms: { arm: string; name: string }[];
  totals: Record<string, number>;
  verdicts: { claim: string; outcome: string; sentence: string }[];
  honesty: string;
  disclosure: string;
  slots: RealSlot[];
}

// ------------------------------------------------------------------ the log, verbatim
interface Geom { type: string; coordinates: unknown }
interface Actor { id: string; kind: string; role?: string }
interface Ev {
  sequence: number;
  sim_time_s: number;
  type: string;
  arm: string;
  actor: Actor;
  event_id: string;
  caused_by?: string[];
  entity_refs?: string[];
  geometry: Geom | null;
  graph?: { graph_id: string; node_id: string; edge_id: string | null } | null;
  payload?: Record<string, unknown>;
  provenance?: { classification?: string; explanation?: string; source_ids?: string[] };
  event_sha256?: string | null;
}
interface ArmSpec { id: string; name: string; gloss: string }
interface RawLog {
  scenario: string;
  title?: string;
  seed: number;
  synthetic?: boolean;
  screen_label?: string;
  disclosure?: string;
  clock?: { start_at?: string; step_seconds?: number };
  /** the earthquake this run is about, copied from the scenario manifest by the bake */
  incident?: {
    occurred_at?: string; ends_at?: string;
    latitude?: number; longitude?: number;
    magnitude?: number; maximum_intensity?: string;
  };
  /** the acts the manifest cuts the run into; a run that declares none plays as one stretch */
  acts?: { act_id: string; label?: string; starts_at?: string; ends_at?: string; story?: string }[];
  source?: { run_dir?: string; timeline_sha256?: string; baked_at?: string };
  world_features?: Record<string, string>;
  /** the switchable context layers the bake delivered beside the run, if it delivered any */
  context_features?: Record<string, string>;
  /**
   * What each moment of decision rested on, carried beside the sealed events by the bake: the
   * reports visible by each deadline, the unknowns each moment required a decider to name, and
   * the readable label behind each identifier. A run baked before this block existed carries
   * none, and the agent trace then shows only what the events themselves hold.
   */
  decision_context?: RawContext;
  data_sources?: { source_id?: string; title?: string; provider?: string;
    classification?: string; url?: string }[];
  viewport?: { center: [number, number]; bounds: [[number, number], [number, number]] };
  run_identity?: {
    schema_version?: string;
    equality_keys?: Record<string, string>;
    runs?: { run_id?: string; arm?: string }[];
  };
  arms: ArmSpec[];
  events: Ev[];
}

/** what a click can land on */
type Target =
  | { kind: "site"; i: number }
  | { kind: "hazard"; i: number }
  | { kind: "road"; i: number }
  | { kind: "shelter"; i: number }
  | { kind: "buildings" }
  | { kind: "epicentre" };

interface Site {
  id: string; lon: number; lat: number;
  x: number; y: number; z: number; u: number; v: number;
  name: string;
  hazard: number;      // the landslide polygon this site is the centre of, or -1
}

interface Arm {
  spec: ArmSpec;
  order: Ev[];
  evTick: Int32Array;
  byTick: Ev[][];
  liveIdx: Int32Array;
  sentTick: Float32Array;
  foundTick: Float32Array;
  reached: Float32Array;
  cool: Float32Array; ash: Float32Array;
  resData: Uint8Array; resTex: THREE.DataTexture; resTick: number; resDirty: boolean;
  mGeo: THREE.BufferGeometry; mSize: Float32Array; mAlpha: Float32Array; mCol: Float32Array;
  rGeo: THREE.BufferGeometry; rSize: Float32Array; rAlpha: Float32Array; rCol: Float32Array;
  objects: THREE.Object3D[];
  damage: DamageField;
}

/** one line in the information panel: what is known, who says so, and when they saw it */
interface Line { text: string; source: string; tone?: "sig" | "hot" }

async function boot() {
  // ---- the recorded run. `?log=<name>.json` names another baked file in the same public
  //      directory, which is how the twenty-event demonstration stays reachable.
  const wanted = new URLSearchParams(location.search).get("log") ?? "";
  const LOG_URL = /^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(wanted)
    ? `/${wanted}` : "/rescueworld-log.json";
  const log = await (await fetch(LOG_URL)).json() as RawLog;
  const events = log.events.slice()
    .sort((a, b) => a.sim_time_s - b.sim_time_s || a.sequence - b.sequence);

  // ------------------------------------------------------------------ the clock
  // Each distinct recorded moment gets the same share of the grid. Recorded order is kept and
  // nothing is dropped; only the empty hours between bursts of reports are compressed.
  const moments = [...new Set(events.map((e) => e.sim_time_s))].sort((a, b) => a - b);
  const M = moments.length;
  const FIRST_TICK = 26, LAST_TICK = TICKS - 30;
  const anchor = moments.map((_, i) =>
    M < 2 ? FIRST_TICK : Math.round(FIRST_TICK + i * (LAST_TICK - FIRST_TICK) / (M - 1)));
  const tickOfMoment = new Map(moments.map((t, i) => [t, anchor[i]]));
  const tickAt = (e: { sim_time_s: number }) => tickOfMoment.get(e.sim_time_s) ?? 0;
  const spanS = moments[M - 1];
  /** the true recorded second a playback tick stands at */
  function secondsAt(tick: number) {
    if (tick <= anchor[0]) return moments[0];
    for (let i = 1; i < M; i++) {
      if (tick <= anchor[i]) {
        const k = (tick - anchor[i - 1]) / Math.max(1, anchor[i] - anchor[i - 1]);
        return moments[i - 1] + (moments[i] - moments[i - 1]) * k;
      }
    }
    return moments[M - 1];
  }
  /**
   * The time of day, worked out from the run's own start time by arithmetic — never a clock.
   * A run that declares a clock names its own start; a run that declares none but names the
   * incident it replays starts at the moment that incident happened, which for the full
   * incident is the earthquake's own origin time.
   */
  const startAt = str(log.clock?.start_at,
    str(log.incident?.occurred_at, str(log.source?.baked_at)));
  const startMatch = /T(\d\d):(\d\d):(\d\d)/.exec(startAt);
  const startSec = startMatch
    ? (+startMatch[1]) * 3600 + (+startMatch[2]) * 60 + (+startMatch[3]) : 0;
  const zone = /([+-]\d\d:\d\d)$/.exec(startAt)?.[1] ?? "";
  function timeOfDay(sec: number) {
    const t = Math.floor(startSec + sec);
    const day = Math.floor(t / 86400);
    const s = ((t % 86400) + 86400) % 86400;
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    return `${hh}:${mm}${day ? ` +${day}d` : ""}`;
  }
  /** how a recorded moment is written on an evidence line */
  const stamped = (sec: number) =>
    `recorded ${Math.round(sec)} s · ${timeOfDay(sec)}${zone ? ` (${zone})` : ""}`;

  // ------------------------------------------------------------------ the world's own files
  // The baked run names the picture files the bake delivered beside it. A log written before
  // those files existed — the twenty-event demonstration, still reachable through `?log=` —
  // names none, so the shipped run's own asset map stands in and the demonstration plays over
  // the same real ground. The console says so when that happens.
  let wf = log.world_features ?? {};
  let cf = log.context_features ?? {};
  if (!wf.terrain_dem_png) {
    const shipped = await (await fetch("/rescueworld-log.json")).json() as RawLog;
    wf = shipped.world_features ?? {};
    cf = shipped.context_features ?? {};
    console.info("rescueworld: this log names no world assets, so the ground, the observed"
      + " layers and the buildings are read from the shipped run's delivered files");
  }
  /**
   * The delivered files, under every name a run is known to give them. Two generations of run
   * name the same picture differently: the routing exercise calls the landslide interpretation
   * `observed_hazards_geojson` and the full incident calls it `landslide_interpretation`. Each
   * row lists the names one file answers to, newest first, so both runs read the same ground
   * without either bake being rewritten. A run may simply not deliver a file — the full
   * incident delivers no shelter list and no city model — and the page then draws nothing for
   * that layer and says so, rather than inventing one or refusing to start.
   */
  const FILE_NAMES: Record<string, string[]> = {
    terrain_dem_png: ["terrain_dem_png"],
    terrain_dem_metadata: ["terrain_dem_metadata"],
    hazards: ["landslide_interpretation", "observed_hazards_geojson"],
    roads: ["road_restrictions", "observed_road_restrictions_geojson"],
    shelters: ["designated_shelters_geojson"],
    updates: ["official_mainshock_updates", "official_report_updates"],
    buildings: ["building_tileset"],
  };
  /** the served path of one delivered file, or an empty string when this run delivered none */
  const fileUrl = (key: string) => {
    for (const name of FILE_NAMES[key] ?? [key]) {
      const value = str(wf[name]);
      if (value.startsWith("/")) return value;
    }
    return "";
  };
  const need = (key: string) => {
    const v = fileUrl(key);
    if (!v) throw new Error(`no delivered file is named for ${key} under world_features`);
    return v;
  };
  const grab = async (key: string) => (await fetch(need(key))).json();
  /**
   * A delivered file the page can do without. The regional lines under the report feed read
   * three of these; a run whose bake delivered none of them plays exactly as before, with no
   * regional lines and a camera tour that visits the run's own sites and the whole ground.
   */
  const grabOptional = async (url: string): Promise<Record<string, unknown> | null> => {
    if (!url.startsWith("/")) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json() as Record<string, unknown>;
    } catch { return null; }
  };
  /** a delivered file this run may not have at all */
  const grabFile = async (key: string) => grabOptional(fileUrl(key));
  const [demMeta, hazardRaw, roadRaw, shelterRaw, quakeSeqRaw, updatesRaw, realSummaryRaw,
    highlightsFile]
    = await Promise.all([
      grab("terrain_dem_metadata") as Promise<DemMeta>,
      grabFile("hazards"),
      grabFile("roads"),
      grabFile("shelters"),
      grabOptional(str(cf.aftershock_sequence)),
      grabFile("updates"),
      grabOptional(REAL_URL),
      loadHighlights(HIGHLIGHTS_URL),
    ]);

  /**
   * The highlight file is derived from one recorded run and names that run inside itself. Loading
   * a different log used to leave this page printing that one run's counts, marked moments and
   * totals under a record they were never taken from: the twenty-event demonstration opened a
   * ledger of no rows that still reported six marked moments and totals out of forty tries. The
   * file is only used where it names the log that is actually loaded.
   */
  const highlights = highlightsFile && highlightsFile.contract.source.file === LOG_URL
    ? highlightsFile : null;
  if (highlightsFile && !highlights) {
    console.info(`rescueworld: ${HIGHLIGHTS_URL} was derived from`
      + ` ${highlightsFile.contract.source.file}, so this run shows none of its counts`);
  }

  type Collection = Parameters<typeof readHazards>[0];
  const frame = makeFrame(demMeta.pixel_edge_bounds_wgs84);
  const hazards: HazardFeature[] = readHazards((hazardRaw ?? {}) as Collection, frame);
  const roads: RoadFeature[] = readRoads((roadRaw ?? {}) as Collection, frame);
  const shelters: ShelterFeature[] = shelterRaw
    ? readShelters(shelterRaw as Collection, frame) : [];
  const hazardTotal = ((hazardRaw?.features as unknown[]) ?? []).length;
  const roadTotal = ((roadRaw?.features as unknown[]) ?? []).length;
  for (const [key, held] of [["hazards", hazardRaw], ["roads", roadRaw],
    ["shelters", shelterRaw]] as [string, unknown][]) {
    if (!held) console.info(`rescueworld: this run delivers no ${key} file, so that layer is empty`);
  }

  // ---- the sites the exercise is about: every place the log names a target feature at
  const sites: Site[] = [];
  const siteOf = new Map<string, number>();
  for (const e of events) {
    const id = str(e.payload?.target_feature_id);
    if (!id || siteOf.has(id)) continue;
    const g = e.geometry;
    if (!g || g.type !== "Point" || !Array.isArray(g.coordinates)) continue;
    const [lon, lat] = g.coordinates as [number, number];
    siteOf.set(id, sites.length);
    sites.push({
      id, lon, lat, x: 0, y: 0, z: 0, u: frame.u(lon), v: frame.v(lat),
      name: id.replace(/^gsi-\d+-kumamoto-/, "").replace(/-/g, " ").toUpperCase(),
      hazard: hazards.findIndex((h) => h.id === id),
    });
  }
  /**
   * A run that names target features gives this world its places, and the routing exercise
   * names four. The full incident names none: its record is a stream of moments, each carrying
   * its own coordinate and its own plain headline. Where no target feature is named, every
   * distinct coordinate a headline moment stands on becomes a place, so the instruments, the
   * marks and the information panel have somebody to stand on. Nothing is invented here: the
   * coordinate is the record's own point and the name is the record's own identifier for the
   * first thing that happened there.
   */
  if (sites.length === 0) {
    const placeAt = new Map<string, number>();
    for (const e of events) {
      const g = e.geometry;
      if (!g || g.type !== "Point" || !Array.isArray(g.coordinates)) continue;
      const slotHere = e.payload?.decision_slot as
        { title?: string; decision_slot_id?: string } | undefined;
      const headline = e.payload?.headline
        ? GLOSS.plainHeadline(str(e.payload?.milestone_id), str(e.payload?.headline))
        : GLOSS.plainSlotTitle(str(slotHere?.decision_slot_id), str(slotHere?.title));
      if (!headline) continue;
      const [lon, lat] = g.coordinates as [number, number];
      if (!frame.inside(lon, lat)) continue;
      const key = `${lon.toFixed(5)},${lat.toFixed(5)}`;
      let index = placeAt.get(key);
      if (index === undefined) {
        index = sites.length;
        placeAt.set(key, index);
        const id = str((e.entity_refs ?? [])[0], e.event_id);
        sites.push({
          id, lon, lat, x: 0, y: 0, z: 0, u: frame.u(lon), v: frame.v(lat),
          name: id.replace(/[-:]/g, " ").toUpperCase(),
          hazard: -1,
        });
      }
      // every identifier the moments at this place carry points back at the place, so the
      // information panel and the live ring find it whichever moment names it
      for (const ref of e.entity_refs ?? []) if (!siteOf.has(ref)) siteOf.set(ref, index);
    }
  }
  const NP = sites.length;
  const epi = (() => {
    const w = events.find((e) => e.type === "WORLD_INITIALIZED");
    const c = w?.geometry?.coordinates;
    return Array.isArray(c) ? [c[0] as number, c[1] as number] as [number, number]
      : [frame.lonOf(0.5), frame.latOf(0.5)] as [number, number];
  })();

  // ------------------------------------------------------------------ the ground
  const terrain: Terrain = await loadTerrain(need("terrain_dem_png"), demMeta, {
    roads: roads.map((r) => r.line),
    shelters: shelters.map((s) => s.at),
    sites: sites.map((s) => [s.lon, s.lat] as [number, number]),
  });
  for (const s of sites) {
    s.x = frame.x(s.lon); s.z = frame.z(s.lat);
    s.y = terrain.heightAtLonLat(s.lon, s.lat);
  }
  const epiPos = new THREE.Vector3(
    frame.x(epi[0]), terrain.heightAtLonLat(epi[0], epi[1]), frame.z(epi[1]));

  // ------------------------------------------------------------------ the rest of the region
  /**
   * The exercise works four sites in one corner of this map, and the recorded region around them
   * goes on living the whole time. The ministry's road file records the minute each closure
   * began. The agency's earthquake sequence records the minute, the place and the magnitude of
   * every shock. The frozen experiment records the deadline of each of the five real decision
   * moments. Every one of those recorded minutes that falls inside this run's own window writes
   * one line under the report feed, at the playback tick that minute sits at, and every line is
   * a place the camera can be sent to.
   *
   * Nothing here is generated and nothing is timed against a wall clock. A line's tick is a pure
   * function of its recorded minute and the transport's own mapping, so two people stopped at
   * the same tick read the same lines in the same order, and a seek backwards shows the lines
   * that stretch of the record holds rather than replaying the ones already passed.
   */
  interface RegionBeat {
    id: string;
    kind: "road" | "quake" | "moment";
    /** the playback tick the recorded minute sits at */
    tick: number;
    /** the recorded second since the run's first moment */
    seconds: number;
    text: string;
    stamp: string;
    tip: string;
    at: THREE.Vector3;
    /** how far back the camera stands when this line is clicked */
    dist: number;
  }

  const runStartMs = Date.parse(startAt);
  /** the run's own zone offset in milliseconds, taken from the run's own start stamp */
  const zoneMs = (() => {
    const m = /([+-])(\d\d):?(\d\d)$/.exec(startAt);
    return m ? (m[1] === "-" ? -1 : 1) * ((+m[2]) * 60 + (+m[3])) * 60000 : 0;
  })();
  /**
   * The recorded seconds since the run's first moment for one written time. A stamp that names
   * its own zone is read as written; a stamp that names none — the road file writes
   * "2026/7/28 17:30" — is read in the run's own zone, which is the zone the road file is
   * published in. A stamp this cannot read places nothing and writes no line.
   */
  function secondsOfStamp(text: string): number | null {
    if (!text) return null;
    let ms = /(?:[+-]\d\d:?\d\d|Z)$/.test(text) ? Date.parse(text) : NaN;
    if (!isFinite(ms)) {
      const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(text);
      if (!m) return null;
      ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0) - zoneMs;
    }
    if (!isFinite(ms) || !isFinite(runStartMs)) return null;
    return (ms - runStartMs) / 1000;
  }
  /** the playback tick a recorded second sits at — the transport's own mapping, run backwards */
  function tickOfSeconds(sec: number) {
    if (M === 0) return 0;
    if (sec <= moments[0]) return anchor[0];
    for (let i = 1; i < M; i++) {
      if (sec <= moments[i]) {
        const gap = Math.max(1e-9, moments[i] - moments[i - 1]);
        return anchor[i - 1] + (anchor[i] - anchor[i - 1]) * (sec - moments[i - 1]) / gap;
      }
    }
    return anchor[M - 1];
  }
  /** true when a recorded second falls inside the window this run actually plays */
  const inWindow = (sec: number | null): sec is number =>
    sec !== null && sec >= moments[0] && sec <= moments[M - 1];
  /**
   * How a regional line writes its own recorded time. The run's first moment falls two tenths of
   * a second after a whole second, and the transport's clock drops that fraction, so a recorded
   * minute is rounded to the nearest second before it is written — otherwise a closure recorded
   * at 19:00 would be stated as 18:59.
   */
  const beatClock = (sec: number) => `${timeOfDay(Math.round(sec))}${zone ? ` ${zone}` : ""}`;
  const beatStamp = (sec: number) => COPY.REGION.stamp(beatClock(sec));
  const groundOf = (lon: number, lat: number) => new THREE.Vector3(
    frame.x(lon), terrain.heightAtLonLat(lon, lat), frame.z(lat));

  const regionBeats: RegionBeat[] = [];

  // ---- the recorded road closures, at the minute each one began
  roads.forEach((rd, i) => {
    const sec = secondsOfStamp(str(rd.props.restriction_started_at));
    if (!inWindow(sec)) return;
    const head = rd.line[0];
    regionBeats.push({
      id: `road-${rd.id}-${i}`,
      kind: "road",
      tick: tickOfSeconds(sec),
      seconds: sec,
      text: COPY.REGION.road(str(rd.props.route_name, rd.id), str(rd.props.road_kind)),
      stamp: beatStamp(sec),
      tip: COPY.REGION.roadTip,
      at: groundOf(head[0], head[1]),
      dist: 0.52,
    });
  });

  // ---- the recorded earthquake sequence, at and above one stated magnitude
  interface RawQuake {
    event_id?: string;
    origin_time?: string;
    magnitude?: number;
    hypocenter?: { latitude?: number; longitude?: number };
  }
  const quakeRecords: RawQuake[] = Array.isArray(quakeSeqRaw?.events)
    ? quakeSeqRaw.events as RawQuake[] : [];
  const quakeBeatsBuilt: RegionBeat[] = [];
  for (const q of quakeRecords) {
    const mag = num(q.magnitude, NaN);
    if (!isFinite(mag) || mag < QUAKE_MIN_MAG) continue;
    const lon = num(q.hypocenter?.longitude, NaN), lat = num(q.hypocenter?.latitude, NaN);
    if (!isFinite(lon) || !isFinite(lat) || !frame.inside(lon, lat)) continue;
    const sec = secondsOfStamp(str(q.origin_time));
    if (!inWindow(sec)) continue;
    quakeBeatsBuilt.push({
      id: `quake-${str(q.event_id, String(quakeBeatsBuilt.length))}`,
      kind: "quake",
      tick: tickOfSeconds(sec),
      seconds: sec,
      text: COPY.REGION.quake(mag.toFixed(1)),
      stamp: beatStamp(sec),
      tip: "",
      at: groundOf(lon, lat),
      dist: 0.52,
    });
  }
  // the tooltip states the threshold and how many shocks it leaves, so the choice is on screen
  const quakeTip = COPY.REGION.quakeTip(QUAKE_MIN_MAG.toFixed(1), quakeBeatsBuilt.length);
  for (const b of quakeBeatsBuilt) { b.tip = quakeTip; regionBeats.push(b); }

  // ---- the five real decision moments, at the minute each recorded deadline ran out
  /**
   * Where a place named in a decision moment stands. The agency's station list is the only
   * delivered file that carries a coordinate for a named municipality, so a place is put at the
   * mean of the recorded stations on this map whose own written name begins with that place's
   * name — "Uki City" finds the stations written "Uki-shi ...". A name no station carries places
   * nothing, and a moment that places nothing falls back to the epicentre.
   */
  interface RawStation { english_name?: string; latitude?: number; longitude?: number }
  const recordedStations: RawStation[] = Array.isArray(updatesRaw?.stations)
    ? updatesRaw.stations as RawStation[] : [];
  function stationsOfLabel(label: string) {
    const words = label.split(/[^A-Za-z]+/).filter((w) => w.length > 2).map((w) => w.toLowerCase());
    const hits: [number, number][] = [];
    if (!words.length) return hits;
    for (const s of recordedStations) {
      const name = str(s.english_name);
      const lon = num(s.longitude, NaN), lat = num(s.latitude, NaN);
      if (!name || !isFinite(lon) || !isFinite(lat) || !frame.inside(lon, lat)) continue;
      const parts = name.toLowerCase().split(/\s+/);
      if (!words.some((w) => parts.some((p) => p.startsWith(`${w}-`)))) continue;
      hits.push([lon, lat]);
    }
    return hits;
  }
  const realSummary: RealSummary | null = Array.isArray(realSummaryRaw?.slots)
    ? realSummaryRaw as unknown as RealSummary : null;
  for (const slot of realSummary?.slots ?? []) {
    const sec = secondsOfStamp(str(slot.cutoff_at));
    if (!inWindow(sec)) continue;
    const hits: [number, number][] = [];
    for (const t of slot.historical?.targets ?? []) hits.push(...stationsOfLabel(str(t.label)));
    let at = epiPos.clone();
    let dist = 0.9;
    if (hits.length) {
      const lon = hits.reduce((s, h) => s + h[0], 0) / hits.length;
      const lat = hits.reduce((s, h) => s + h[1], 0) / hits.length;
      const spanLon = Math.max(...hits.map((h) => h[0])) - Math.min(...hits.map((h) => h[0]));
      const spanLat = Math.max(...hits.map((h) => h[1])) - Math.min(...hits.map((h) => h[1]));
      at = groundOf(lon, lat);
      dist = clamp(Math.max(spanLon * frame.kx, spanLat) * frame.scale * 1.6, 0.5, 1.7);
    }
    regionBeats.push({
      id: `moment-${str(slot.slot_id, String(slot.slot_number))}`,
      kind: "moment",
      tick: tickOfSeconds(sec),
      seconds: sec,
      // this sentence adds its own full stop, so a title that already ends in one loses it
      text: COPY.REGION.moment(
        GLOSS.plainSlotTitle(str(slot.slot_id), str(slot.title)).replace(/[.\s]+$/, "")),
      stamp: beatStamp(sec),
      tip: COPY.REGION.momentTip,
      at,
      dist,
    });
  }

  // one order, fixed at load: the recorded minute first, then the recorded identifier, so a
  // stretch of the record that holds several lines always presents them the same way round
  regionBeats.sort((a, b) => a.tick - b.tick || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  /** the lines this stretch of the record holds, derived from the tick and nothing else */
  function beatsAt(tick: number) {
    const out: RegionBeat[] = [];
    for (const b of regionBeats) {
      if (b.tick <= tick && tick - b.tick < BEAT_LIFE) out.push(b);
    }
    return out;
  }

  // the residue field follows the ground's own shape, so a round mark stays round
  const RESY = 288;
  const RESX = Math.max(32, Math.round(RESY * frame.mapW / frame.mapD));
  const RESN = RESX * RESY;

  // ------------------------------------------------------------------ what each event is about
  const evTarget = new Map<string, Target>();
  /** the city model arrives after the world is standing, so everything guards against null */
  let buildings: BuildingSet | null = null;
  const roadOf = new Map<string, number>();
  roads.forEach((r, i) => roadOf.set(r.id, i));
  const hazardOf = new Map<string, number>();
  hazards.forEach((h, i) => hazardOf.set(h.id, i));
  const shelterOf = new Map<string, number>();
  shelters.forEach((s, i) => shelterOf.set(s.id, i));

  for (const e of events) {
    const tf = str(e.payload?.target_feature_id);
    if (tf && siteOf.has(tf)) { evTarget.set(e.event_id, { kind: "site", i: siteOf.get(tf)! }); continue; }
    let done = false;
    for (const id of e.entity_refs ?? []) {
      if (siteOf.has(id)) { evTarget.set(e.event_id, { kind: "site", i: siteOf.get(id)! }); done = true; break; }
    }
    if (done) continue;
    for (const id of e.entity_refs ?? []) {
      if (roadOf.has(id)) { evTarget.set(e.event_id, { kind: "road", i: roadOf.get(id)! }); done = true; break; }
      if (hazardOf.has(id)) { evTarget.set(e.event_id, { kind: "hazard", i: hazardOf.get(id)! }); done = true; break; }
    }
    if (done) continue;
    const sel = e.payload?.selected_targets;
    if (Array.isArray(sel)) {
      for (const t of sel) {
        const id = str(t);
        if (siteOf.has(id)) { evTarget.set(e.event_id, { kind: "site", i: siteOf.get(id)! }); done = true; break; }
      }
    }
    if (done) continue;
    if (e.geometry?.type === "Point") evTarget.set(e.event_id, { kind: "epicentre" });
  }
  /** the site an event is about, or -1 — what the instruments and the live ring read */
  const siteIdx = (e: Ev | null) => {
    const t = e ? evTarget.get(e.event_id) : undefined;
    return t && t.kind === "site" ? t.i : -1;
  };
  function targetPos(t: Target): THREE.Vector3 {
    if (t.kind === "site") return new THREE.Vector3(sites[t.i].x, sites[t.i].y, sites[t.i].z);
    if (t.kind === "hazard") {
      const [lon, lat] = hazards[t.i].centroid;
      return new THREE.Vector3(frame.x(lon), terrain.heightAtLonLat(lon, lat), frame.z(lat));
    }
    if (t.kind === "road") {
      const [lon, lat] = roads[t.i].mid;
      return new THREE.Vector3(frame.x(lon), terrain.heightAtLonLat(lon, lat), frame.z(lat));
    }
    if (t.kind === "shelter") {
      const [lon, lat] = shelters[t.i].at;
      return new THREE.Vector3(frame.x(lon), terrain.heightAtLonLat(lon, lat), frame.z(lat));
    }
    if (t.kind === "buildings" && buildings) return buildings.centre.clone();
    return epiPos.clone();
  }

  /**
   * The ground this world actually holds. The terrain is a rectangular cut of the real map, and
   * the record names features that stand outside it: a road closed in Shiiba Village in Miyazaki
   * Prefecture is east of the cut's eastern edge, and hundreds of the recorded aftershocks fall
   * outside it too. A camera sent to one of those looks at ground that does not exist, so no
   * point outside the cut is ever a camera destination. The record still shows it; the view goes
   * to the whole ground instead.
   */
  /**
   * A camera destination has to be inside the cut AND on ground the cut paints. A third of this
   * rectangle is sea and part of it lies outside the survey; both are drawn dark, so a landing
   * aimed at one of them is a black frame with the instruments still running. A place is
   * accepted when at least a fifth of the ground around it carries an elevation.
   */
  const LIT_GROUND = 0.20;
  const onMap = (p: { x: number; z: number }) => {
    if (Math.abs(p.x) > frame.mapW / 2 || Math.abs(p.z) > frame.mapD / 2) return false;
    return terrain.landAround(p.x / frame.mapW + 0.5, 0.5 - p.z / frame.mapD) >= LIT_GROUND;
  };
  /** the words a card wears when the place it names stands off this map */
  const OFF_MAP_TAG = "this place stands off the map";

  // ---- when each observed feature first appears: the moment the run's own log names it
  function showTickFor(prefix: string) {
    const first = new Map<string, number>();
    let layer = Infinity;
    for (const e of events) {
      const t = tickAt(e);
      let touchedLayer = false;
      for (const id of e.entity_refs ?? []) {
        if (!id.startsWith(prefix)) continue;
        touchedLayer = true;
        if (!first.has(id) || first.get(id)! > t) first.set(id, t);
      }
      if (touchedLayer && t < layer) layer = t;
    }
    if (!isFinite(layer)) layer = FIRST_TICK;
    return (id: string) => first.get(id) ?? layer;
  }
  const hazardShow = showTickFor("gsi-2026-kumamoto-landslide");
  const roadShow = showTickFor("mlit-2026-kumamoto-road-restriction");
  const shelterLayerTick = (() => {
    for (const e of events) {
      if ((e.entity_refs ?? []).some((id) => id.startsWith("gsi-uki-designated-shelter"))) {
        return tickAt(e);
      }
    }
    return FIRST_TICK;
  })();

  // ------------------------------------------------------------------ per-desk tables
  function prep(spec: ArmSpec): Arm {
    const order = events.filter((e) => e.arm === spec.id || e.arm === "SHARED");
    const evTick = new Int32Array(order.length);
    const byTick: Ev[][] = Array.from({ length: TICKS + 1 }, () => []);
    for (let i = 0; i < order.length; i++) {
      const t = tickAt(order[i]);
      evTick[i] = t;
      byTick[t].push(order[i]);
    }
    const liveIdx = new Int32Array(TICKS + 1).fill(-1);
    for (let t = 0, i = -1; t <= TICKS; t++) {
      while (i + 1 < order.length && evTick[i + 1] <= t) i++;
      liveIdx[t] = i;
    }
    const sentTick = new Float32Array(NP).fill(Infinity);
    const foundTick = new Float32Array(NP).fill(Infinity);
    for (let i = 0; i < order.length; i++) {
      const p = siteIdx(order[i]);
      if (p < 0) continue;
      if (order[i].type === "RESOURCE_DISPATCHED") sentTick[p] = Math.min(sentTick[p], evTick[i]);
      if (order[i].type === "OUTCOME_OBSERVED") foundTick[p] = Math.min(foundTick[p], evTick[i]);
    }
    const reached = new Float32Array(TICKS + 1);
    for (let t = 0, v = 0; t <= TICKS; t++) {
      for (const e of byTick[t]) {
        if (e.arm !== spec.id || e.type !== "METRIC_UPDATED") continue;
        if (str(e.payload?.metric_id) !== REACH) continue;
        v = num(e.payload?.value, v);
      }
      reached[t] = v;
    }
    return {
      spec, order, evTick, byTick, liveIdx, sentTick, foundTick, reached,
      resTick: -1, resDirty: true, objects: [],
    } as unknown as Arm;
  }
  /**
   * One prepared table per arm the log declares. The routing exercise declares two desks and
   * the page compares them; the full incident declares one, because its record is a single
   * recorded story and the alternatives it recorded sit inside each decision moment's own
   * payload rather than in a second desk. Everything that needs a second desk — the desk
   * switch, the split view, the ghost echo and the debrief's divergence beats — is keyed on
   * this one number, so both logs play in the same viewer.
   */
  const arms: Arm[] = log.arms.map(prep);
  const twoDesks = arms.length > 1;

  /**
   * The run is counted in rounds, not in seconds, because that is the shape the log has: a
   * desk takes one step at a time and the record marks each step with a graph transition. A
   * round opens at each of this desk's transitions; the first round is everything before the
   * desk starts — the world opening, the observed layers arriving, and every report coming in.
   * The two desks take a different number of steps, and the round counter says so.
   */
  interface Round {
    start: number; end: number; node: string; name: string;
    /** the headline the copy deck writes for this round */
    headline: string;
    /** the round's own recorded second, which every report card's age is measured against */
    simTimeS: number;
  }
  function roundsFor(arm: Arm): Round[] {
    // One round per step this desk takes: each of its own graph transitions opens one. The first
    // round opens at tick zero, because the reports it takes in arrive before the desk moves.
    const marks: { tick: number; node: string; sec: number; detail: string }[] = [];
    const arrivals: { tick: number; sec: number }[] = [];
    for (let i = 0; i < arm.order.length; i++) {
      const e = arm.order[i];
      if (e.arm !== arm.spec.id) continue;
      if (e.type === "GRAPH_TRANSITION") {
        marks.push({
          tick: arm.evTick[i], sec: e.sim_time_s,
          node: str(e.payload?.node_id, str(e.graph?.node_id, "STEP")),
          detail: str(e.payload?.detail),
        });
      }
      if (e.type === "OUTCOME_OBSERVED") arrivals.push({ tick: arm.evTick[i], sec: e.sim_time_s });
    }
    const out: Round[] = marks.map((m, i) => ({
      start: i === 0 ? 0 : m.tick, end: TICKS, node: m.node, name: "",
      // Where a recorded graph names a step this deck has no headline for, the round states the
      // transition's own recorded detail rather than inventing a sentence for it.
      headline: COPY.ROUND_HEADLINES[`${arm.spec.id}:${m.node}`]
        ?? m.detail ?? NODE[m.node] ?? m.node.toLowerCase(),
      simTimeS: m.sec,
    }));
    // The arrivals sit between the dispatch transition and the closing one, so they are played as
    // their own round. That is the copy deck's own derivation of six plain and eight evidence
    // rounds from five and seven declared graph nodes.
    for (let i = 0; i < marks.length; i++) {
      const from = marks[i].tick;
      const to = i + 1 < marks.length ? marks[i + 1].tick : Infinity;
      const inside = arrivals.filter((a) => a.tick > from && a.tick < to);
      if (inside.length === 0) continue;
      out.push({
        start: inside[0].tick, end: TICKS, node: "ARRIVAL", name: "",
        headline: COPY.ROUND_HEADLINES[`${arm.spec.id}:ARRIVAL`] ?? NODE.OBSERVE,
        simTimeS: inside[0].sec,
      });
    }
    out.sort((a, b) => a.start - b.start);
    for (let i = 0; i < out.length; i++) {
      out[i].end = i + 1 < out.length ? out[i + 1].start - 1 : TICKS;
      out[i].name = COPY.ROUND_LABELS[out[i].node]
        ?? out[i].node.replace(/_/g, " ").toLowerCase();
    }
    return out;
  }
  // ------------------------------------------------------------------ the acts of the record
  /**
   * A run of three days is unwatchable as one flat stream, and the full incident's manifest
   * already cuts its seventy-two hours into four acts. `acts.ts` reads that cut and the story
   * tag every event carries, and hands back the running order: four acts, each cut into beats,
   * each beat carrying one place on the map. Where the log declares acts, the run is walked act
   * by act; where it declares none — the routing exercise declares none — the run is walked
   * round by round exactly as before.
   *
   * The terrain rectangle is passed in so a beat's camera place is the mean of the positions
   * this ground actually holds, and a position off the edge of the cut is left out and counted.
   */
  const terrainBounds = {
    west: frame.west, south: frame.south, east: frame.east, north: frame.north,
  };
  const acts: Act[] = (() => {
    if (!log.acts || log.acts.length === 0) return [];
    try {
      return deriveActs(
        { scenario_id: log.scenario, title: log.title, acts: log.acts, incident: log.incident },
        events as unknown as ActEvent[], terrainBounds);
    } catch (error) {
      console.warn(`rescueworld: the acts could not be read — ${(error as Error).message}`);
      return [];
    }
  })();
  const walkActs = acts.length > 0;
  const opening: OpeningBeat | null = (() => {
    if (!walkActs) return null;
    try { return openingBeat(events as unknown as ActEvent[]); } catch { return null; }
  })();

  /** the playback tick a recorded moment sits at, for anything the acts hand back in seconds */
  const tickOfSimSeconds = (seconds: number) =>
    tickOfMoment.get(seconds) ?? tickOfSeconds(seconds);

  /**
   * One round per act: the act's label is the round's name, the act's story line from the
   * scenario is its headline, and the round runs from the act's first recorded moment to the
   * moment before the next act opens.
   */
  function roundsOfActs(): Round[] {
    const out: Round[] = acts.map((act, i) => ({
      start: i === 0 ? 0 : Math.round(tickOfSimSeconds(act.window.startSimSeconds)),
      end: TICKS,
      node: act.actId,
      name: act.label,
      headline: act.story,
      simTimeS: act.window.startSimSeconds,
    }));
    for (let i = 0; i < out.length; i++) {
      out[i].end = i + 1 < out.length ? out[i + 1].start - 1 : TICKS;
    }
    return out;
  }
  const actRounds: Round[] = walkActs ? roundsOfActs() : [];

  /**
   * Every beat of every act in one table, in the order the record reaches them, each with the
   * playback tick it opens at and the one place on the map it stands. The transport's face
   * reads the beat the run is on off this table, and the story cards open from it. A beat whose
   * place the terrain cut does not paint carries no place, so nothing is ever hung over ground
   * that is not there.
   */
  interface BeatRow {
    beat: ActBeat;
    actIndex: number;
    tick: number;
    at: THREE.Vector3 | null;
  }
  const actBeatRows: BeatRow[] = [];
  acts.forEach((act, actIndex) => {
    for (const beat of act.beats) {
      const at = beat.anchor ? groundOf(beat.anchor.longitude, beat.anchor.latitude) : null;
      actBeatRows.push({
        beat, actIndex,
        tick: Math.round(tickOfSimSeconds(beat.startSimSeconds)),
        at: at && onMap(at) ? at : null,
      });
    }
  });
  actBeatRows.sort((a, b) => a.tick - b.tick || a.beat.firstSequence - b.beat.firstSequence);
  /** the beat this playback tick stands in, or nothing before the first one opens */
  function beatAt(tick: number): ActBeat | null {
    let found: ActBeat | null = null;
    for (const row of actBeatRows) {
      if (row.tick > tick) break;
      found = row.beat;
    }
    return found;
  }
  /** how a beat writes its own recorded time: the record's wall clock, to the minute */
  const beatHour = (beat: ActBeat) => beat.startClock.slice(11, 16)
    + (zone ? ` ${zone}` : "");
  /**
   * What a beat is called on screen. A moment the record gave a headline of its own wears that
   * headline. The two kinds the record batches by the hour — the tremors and the road closures
   * — are counted rather than headlined, so the count is written as a statement instead of a
   * bare number.
   */
  function beatWords(beat: ActBeat): string {
    if (beat.kind === "aftershocks") return COPY.INCIDENT.batched.aftershocks(beat.eventCount);
    if (beat.kind === "roads") return COPY.INCIDENT.batched.roads(beat.eventCount);
    if (beat.kind === "sources") return COPY.INCIDENT.batched.sources(beat.eventCount);
    return beat.label;
  }
  const rounds: Round[][] = walkActs ? arms.map(() => actRounds) : arms.map(roundsFor);
  function roundAt(tick: number, k: number) {
    const rs = rounds[k];
    for (let i = rs.length - 1; i >= 0; i--) if (tick >= rs[i].start) return i;
    return 0;
  }
  /** the evidence desk is the default world; the plain desk is one key away */
  let desk = arms.length > 1 && arms[1].spec.id === "EVIDENCE_GRAPH" ? 1 : 0;
  let split = false;

  // ------------------------------------------------------------------ materials
  // Every body is drawn more than once — halo, body, core. The ceiling on the sprite size is
  // the important number: a glow that is geometrically correct a kilometre from a site fills
  // half the window, so each layer states how many screen pixels it is allowed to become and
  // a close pass over the ground stays a landscape rather than a white ball.
  const POINT_V = `
    attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
    uniform float uPix; uniform float uSizeMul; uniform float uGain; uniform float uMaxPx;
    varying vec3 vCol; varying float vA;
    void main(){
      vCol = aColor; vA = aAlpha * uGain;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = clamp(aSize * uSizeMul * uPix / max(0.02, -mv.z), 1.0, uMaxPx);
      gl_Position = projectionMatrix * mv;
    }`;
  const POINT_F = `
    uniform float uPow; uniform float uWhite; uniform float uRing;
    varying vec3 vCol; varying float vA;
    void main(){
      float r = min(1.0, length(gl_PointCoord - 0.5) * 2.0);
      float a = uRing > 0.5 ? exp(-pow((r - 0.74) * 11.0, 2.0)) : pow(1.0 - r, uPow);
      a *= vA;
      if (a <= 0.003) discard;
      gl_FragColor = vec4(mix(vCol, vec3(1.0), uWhite) * a, a);
    }`;
  const allPointMats: THREE.ShaderMaterial[] = [];
  /** the current pixel scale, so a material built after a resize starts at the right size */
  let pointPix = 400;
  const mkPoint = (pow: number, sizeMul: number, gain: number, white: number, ring = 0,
    maxPx = 120) => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uPix: { value: 400 }, uSizeMul: { value: sizeMul }, uGain: { value: gain },
        uPow: { value: pow }, uWhite: { value: white }, uRing: { value: ring },
        uMaxPx: { value: maxPx },
      },
      vertexShader: POINT_V, fragmentShader: POINT_F,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    allPointMats.push(m);
    return m;
  };

  /**
   * The ground shader draws the terrain the way a contour map draws it: the lines of equal
   * elevation carry the reading and the shading is only there to say which way is downhill.
   * That order comes from `docs/rescueworld/DEATH-STRANDING-REFERENCE.md`, directives 1, 2
   * and 20, and three things follow from it.
   *
   * The lines hold one width on screen. A line is drawn where the elevation crosses a multiple
   * of the contour interval, and how wide that crossing is in pixels is asked of the graphics
   * hardware through `fwidth`, which reports how much a value changes between one pixel and the
   * next. So a line is about one and a half pixels wide whether the ground under it is a flat
   * field or a cliff, and on the cliff the lines crowd together into a bright bundle. The
   * crowding is the steepness: nothing computes a slope anywhere in this file.
   *
   * The edge of the surveyed data is the brightest stroke on the ground. The elevation tiles
   * record nothing for the sea, so the boundary between data and no data is the coastline, and
   * drawing it bright gives the whole cut one silhouette instead of a fading smear.
   *
   * What this desk remembers is added over the top, so residue keeps its own brightness.
   */
  const TERRAIN_V = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  /**
   * The ground rectangle is wider than it is deep, so a ring measured in the texture's own
   * coordinates would come out as an ellipse. These two numbers put the scan back into a round
   * shape: the first is the rectangle's aspect, the second the distance the front must travel to
   * leave the ground entirely.
   */
  const SCAN_ASPECT = frame.mapW / frame.mapD;
  const SCAN_REACH = Math.hypot(SCAN_ASPECT, 1) * 1.05;
  const TERRAIN_F = `
    precision highp float;
    uniform sampler2D uMap; uniform sampler2D uRes;
    uniform vec3 uTint; uniform vec3 uCool; uniform vec3 uLine;
    uniform float uAmt; uniform float uResAmt;
    uniform vec2 uScanAt;      // the selected point, in the terrain's own coordinates
    uniform float uScanAge;    // seconds since the selection fired; negative means no scan
    uniform vec3 uScanFront;   // the deeper blue of the moving edge
    varying vec2 vUv;

    /** one family of contour lines, at a constant width on screen whatever the slope */
    float lines(float h, float bands){
      float x = h * bands;
      float tri = abs(fract(x) - 0.5) * 2.0;    // 0 on a line, 1 halfway between two
      float w = max(fwidth(x) * 1.6, 1e-5);     // a pixel and a half, in units of the wave
      float line = 1.0 - smoothstep(0.0, w, tri);
      // Where one pixel already spans a whole interval there is no line left to draw, only
      // noise, so the family fades out rather than washing the far hills into solid light. The
      // fade starts later and takes longer than it did, because the opening view stands far
      // enough back that the old fade left the whole map black under the briefing.
      return line * (1.0 - smoothstep(0.80, 2.10, w));
    }

    void main(){
      vec4 s = texture2D(uMap, vUv);
      float e = s.r;
      float p = s.g;
      float pop = s.b;
      float land = s.a;

      // Three families at once, and the fade inside the line helper decides which of them a
      // piece of ground gets. The middle family is the contour interval proper. Every fifth
      // one of those is drawn heavier, which is how a paper contour map states its own scale.
      // The third family is twenty times finer, so it is washed out by the fade everywhere
      // except on ground gentle enough to carry it — which is how the coastal plain, whose
      // whole relief is a third of one contour interval, still reads as ground rather than as
      // a hole in the map.
      float contour = min(1.55,
        lines(e, 12.0) + lines(e, 2.4) * 0.60 + lines(e, 240.0) * 0.25) * land;
      float relief = pow(clamp(e, 0.0, 1.0), 2.6);

      vec3 col = uTint * (0.075 + relief * 0.35);   // the shading recedes to support
      col += uLine * contour * 0.55;                // and the linework carries the reading
      col += uTint * (1.0 - p) * 0.90;              // the roads that are closed
      col += uCool * pop * 0.55;                    // the crowd's own glow
      col *= mix(0.10, 1.0, land);                  // no data is not flat ground

      // The scan pulse. Selecting a place sends a ground-following ring out from it: a narrow
      // band of deeper blue at the moving edge, and behind the edge the contour lines already
      // on the ground lit brighter and decaying back to rest. The growth is eased rather than
      // linear, and the origin keeps a small dark circle so the selected place is not swallowed
      // by its own light.
      if (uScanAge >= 0.0) {
        vec2 sp = vec2(vUv.x * ${SCAN_ASPECT.toFixed(6)}, vUv.y);
        vec2 sc = vec2(uScanAt.x * ${SCAN_ASPECT.toFixed(6)}, uScanAt.y);
        float sd = distance(sp, sc);
        float st = clamp(uScanAge / 1.5, 0.0, 1.0);
        float sr = (1.0 - pow(1.0 - st, 5.0)) * ${SCAN_REACH.toFixed(6)};
        float sw = 0.012 * ${SCAN_ASPECT.toFixed(6)};
        float sFront = exp(-pow((sd - sr) / sw, 2.0));
        float sBehind = sd < sr ? exp(-(sr - sd) / 0.55) : 0.0;
        float sCore = smoothstep(0.0, 0.05 * ${SCAN_ASPECT.toFixed(6)}, sd);
        float sFade = 1.0 - clamp((uScanAge - 1.5) / 0.9, 0.0, 1.0);
        col += uLine * contour * sBehind * 0.90 * sCore * sFade;
        col += uScanFront * sFront * 1.30 * sCore * sFade * land;
      }

      // the coastline: the edge of the survey, at about twice the brightness of a contour
      float cw = max(fwidth(land) * 1.5, 0.16);
      col += uLine * (1.0 - smoothstep(0.0, cw, abs(land - 0.5))) * 1.10;

      vec2 d = abs(vUv - 0.5) * 2.0;
      float rim = clamp(1.20 - pow(max(d.x, d.y), 10.0) * 1.20, 0.0, 1.0);
      gl_FragColor = vec4(col * uAmt * rim + texture2D(uRes, vUv).rgb * uResAmt, 1.0);
    }`;

  /**
   * How bright the ground is drawn, before the run starts and after.
   *
   * The opening view stands so far back that a single screen pixel covers a whole contour
   * interval, and the contour helper fades a family out at exactly that point rather than
   * washing the far hills into a solid glare. The honest consequence is that the briefing used
   * to stand over a black rectangle: nine tenths of the frame was below the darkest step this
   * page draws, and a reader had no idea there was a place under the writing.
   *
   * So the ground is drawn brighter while the briefing stands, and eases back to its working
   * brightness over the opening flight. This is the same kind of number as the scanning pulse
   * and the bracket reveals: it runs on elapsed real time, it is a property of the view and not
   * of the record, and nothing a verifier reads out of `state()` ever sees it.
   */
  const WARM_AMT = 0.82;
  const COLD_AMT = 5.2;
  const AMT_EASE = 1.9;

  /** the plate under the residue: grain and a graticule, and nothing that competes with it */
  const GRAIN = new Float32Array(RESN);
  const BASE = (() => {
    const b = new Float32Array(RESN * 3);
    for (let y = 0; y < RESY; y++) for (let x = 0; x < RESX; x++) {
      let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      const g = ((n ^ (n >>> 16)) >>> 0) / 4294967296;
      GRAIN[y * RESX + x] = g;
      let val = 0.006 + 0.004 * g;
      if (x % 32 === 0 || y % 32 === 0) val += 0.004;
      const j = (y * RESX + x) * 3;
      b[j] = val * 0.40; b[j + 1] = val * 0.80; b[j + 2] = val * 1.0;
    }
    return b;
  })();

  // ------------------------------------------------------------------ the scene
  const canvas = el("gl") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const groundMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: terrain.tex }, uRes: { value: null },
      uTint: { value: new THREE.Vector3(0.17, 0.42, 0.55) },
      uCool: { value: new THREE.Vector3(...SIG) },
      uLine: { value: new THREE.Vector3(...BONE) },
      uAmt: { value: COLD_AMT }, uResAmt: { value: 1.35 },
      uScanAt: { value: new THREE.Vector2(0.5, 0.5) },
      uScanAge: { value: -1 },
      uScanFront: { value: new THREE.Vector3(0.36, 0.50, 0.85) },
    },
    vertexShader: TERRAIN_V, fragmentShader: TERRAIN_F,
  });
  const ground = new THREE.Mesh(terrain.geo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = 0;
  scene.add(ground);

  // ---- the observed layers, drawn cold so nothing simulated can be mistaken for one
  const hazardLines: DrawnLines = buildHazardLines(hazards, frame, terrain, hazardShow, BONE);
  const roadLines: DrawnLines = buildRoadLines(roads, frame, terrain, roadShow, SIG);
  scene.add(hazardLines.object, roadLines.object);

  /** a zone this small is a few pixels of outline from any distance, so it also gets a ring */
  const hazardRings = (() => {
    const n = hazards.length;
    const pos = new Float32Array(n * 3), size = new Float32Array(n);
    const alpha = new Float32Array(n), col = new Float32Array(n * 3);
    hazards.forEach((_hazard, i) => {
      const p = targetPos({ kind: "hazard", i });
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + 0.006; pos[i * 3 + 2] = p.z;
      size[i] = 0.030;
      col[i * 3] = BONE[0]; col[i * 3 + 1] = BONE[1]; col[i * 3 + 2] = BONE[2];
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, mkPoint(1, 1, 1, 0, 1, 90));
    pts.frustumCulled = false; pts.renderOrder = 3;
    scene.add(pts);
    return { geo, alpha, size, col };
  })();

  const shelterPoints = (() => {
    const n = shelters.length;
    const pos = new Float32Array(n * 3), size = new Float32Array(n);
    const alpha = new Float32Array(n), col = new Float32Array(n * 3);
    shelters.forEach((_shelter, i) => {
      const p = targetPos({ kind: "shelter", i });
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + 0.004; pos[i * 3 + 2] = p.z;
      size[i] = 0.022;
      col[i * 3] = BONE[0]; col[i * 3 + 1] = BONE[1]; col[i * 3 + 2] = BONE[2];
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, mkPoint(2.4, 1, 1, 0.25, 0, 34));
    pts.frustumCulled = false; pts.renderOrder = 3;
    scene.add(pts);
    return { geo, alpha, size, col };
  })();

  /** the epicentre: one quiet ring where the Japan Meteorological Agency puts the earthquake */
  const epiMark = (() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position",
      new THREE.BufferAttribute(new Float32Array([epiPos.x, epiPos.y + 0.006, epiPos.z]), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([0.10]), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array([0.5]), 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array([...BONE]), 3));
    const pts = new THREE.Points(geo, mkPoint(1, 1, 1, 0, 1, 150));
    pts.frustumCulled = false; pts.renderOrder = 3;
    scene.add(pts);
    return { geo, alpha: geo.getAttribute("aAlpha") as THREE.BufferAttribute };
  })();

  // ---- the full-incident context layers, each off until a reader asks for it. They add
  //      recorded open data to the same ground and nothing else: no run state, no metric, no
  //      moment of the story. `app/src/rescueworld/context.ts` states what each one is.
  const context: ContextLayers = mountContextLayers({
    scene, frame, terrain, shelters, shelterFile: shelterRaw,
    urls: {
      aftershocks: str(cf.aftershock_sequence).startsWith("/") ? str(cf.aftershock_sequence) : null,
      population: str(cf.population_grid).startsWith("/") ? str(cf.population_grid) : null,
    },
    startMs: Date.parse(startAt),
    moments, anchors: anchor, ticks: TICKS, bone: BONE,
    registerPoints(material) {
      material.uniforms.uPix.value = pointPix;
      allPointMats.push(material);
    },
  });

  // ---- the damage the simulation does: at every mapped landslide zone, and at every outcome
  const damageSites = [
    ...hazards.map((h, i) => {
      const p = targetPos({ kind: "hazard", i });
      return {
        x: p.x, y: p.y, z: p.z, tick: hazardShow(h.id),
        spread: clamp(h.spanM * frame.scale / 110540, 0.011, 0.060), weight: 0,
      };
    }),
  ];
  function outcomeSites(arm: Arm) {
    const out: typeof damageSites = [];
    for (let i = 0; i < arm.order.length; i++) {
      const e = arm.order[i];
      if (e.type !== "OUTCOME_OBSERVED" || e.arm !== arm.spec.id) continue;
      const p = siteIdx(e);
      if (p < 0) continue;
      out.push({
        x: sites[p].x, y: sites[p].y, z: sites[p].z, tick: arm.evTick[i],
        spread: 0.055 + 0.0016 * num(e.payload?.exercise_people_reached), weight: 1,
      });
    }
    return out;
  }

  // ---- one set of per-desk objects: what this desk sees, remembers and spends
  function build(arm: Arm) {
    arm.cool = new Float32Array(RESN);
    arm.ash = new Float32Array(RESN);
    arm.resData = new Uint8Array(RESN * 4);
    arm.resTex = new THREE.DataTexture(arm.resData, RESX, RESY, THREE.RGBAFormat);
    arm.resTex.minFilter = arm.resTex.magFilter = THREE.LinearFilter;

    arm.mSize = new Float32Array(NP); arm.mAlpha = new Float32Array(NP);
    arm.mCol = new Float32Array(NP * 3);
    const mPos = new Float32Array(NP * 3);
    for (let p = 0; p < NP; p++) {
      mPos[p * 3] = sites[p].x; mPos[p * 3 + 1] = sites[p].y + 0.012; mPos[p * 3 + 2] = sites[p].z;
    }
    arm.mGeo = new THREE.BufferGeometry();
    arm.mGeo.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
    arm.mGeo.setAttribute("aSize", new THREE.BufferAttribute(arm.mSize, 1));
    arm.mGeo.setAttribute("aAlpha", new THREE.BufferAttribute(arm.mAlpha, 1));
    arm.mGeo.setAttribute("aColor", new THREE.BufferAttribute(arm.mCol, 3));
    for (const [pw, sz, gn, wh, mx] of [[1.7, 3.3, 0.26, 0, 128], [3.2, 1.35, 0.80, 0.10, 84],
      [9.0, 0.52, 1.0, 0.72, 40]] as [number, number, number, number, number][]) {
      const pts = new THREE.Points(arm.mGeo, mkPoint(pw, sz, gn, wh, 0, mx));
      pts.renderOrder = 3; pts.frustumCulled = false;
      scene.add(pts); arm.objects.push(pts);
    }

    arm.rSize = new Float32Array(1); arm.rAlpha = new Float32Array(1);
    arm.rCol = new Float32Array(3);
    arm.rGeo = new THREE.BufferGeometry();
    arm.rGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    arm.rGeo.setAttribute("aSize", new THREE.BufferAttribute(arm.rSize, 1));
    arm.rGeo.setAttribute("aAlpha", new THREE.BufferAttribute(arm.rAlpha, 1));
    arm.rGeo.setAttribute("aColor", new THREE.BufferAttribute(arm.rCol, 3));
    const ring = new THREE.Points(arm.rGeo, mkPoint(1, 1, 1, 0, 1, 260));
    ring.renderOrder = 5; ring.frustumCulled = false;
    scene.add(ring); arm.objects.push(ring);

    arm.damage = buildDamage({
      sites: [...damageSites, ...outcomeSites(arm)], burn: EMB, point: mkPoint,
    });
    for (const o of arm.damage.objects) { scene.add(o); arm.objects.push(o); }
  }
  arms.forEach(build);

  const stations = buildStations({
    events, armIds: arms.map((a) => a.spec.id), ticks: TICKS, rate: RATE, tickOf: tickAt,
    evPlace: new Map(events.flatMap((e) => {
      const p = siteIdx(e);
      return p >= 0 ? [[e.event_id, p] as [string, number]] : [];
    })),
    placeLabel: sites.map((s) => s.name),
    wx: Float32Array.from(sites.map((s) => s.x)),
    wz: Float32Array.from(sites.map((s) => s.z)),
    gy: Float32Array.from(sites.map((s) => s.y)),
    np: NP,
    anisotropy: renderer.capabilities.getMaxAnisotropy(),
    bone: BONE, signal: SIG, burn: EMB,
  });
  arms.forEach((a, k) => {
    const holder = new THREE.Group();
    stations.addTo(holder, k);
    scene.add(holder);
    a.objects.push(holder);
  });

  /** the void behind the world — a wide, soft, cold bloom, never a visible disc */
  {
    const N = 160, d = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (x + 0.5) / N - 0.5, dy = (y + 0.5) / N - 0.44;
      const v = Math.exp(-(dx * dx * 1.1 + dy * dy * 2.4) * 9.5);
      const j = (y * N + x) * 4;
      d[j] = v * 8; d[j + 1] = v * 18; d[j + 2] = v * 25; d[j + 3] = 255;
    }
    const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
    t.needsUpdate = true; t.minFilter = t.magFilter = THREE.LinearFilter;
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(46, 30), new THREE.MeshBasicMaterial({
      map: t, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false,
    }));
    haze.position.set(0, 1.0, -13); haze.renderOrder = -10;
    scene.add(haze);
  }

  function setArm(k: number) {
    for (let a = 0; a < arms.length; a++) {
      const on = a === k;
      for (const o of arms[a].objects) o.visible = on;
    }
    groundMat.uniforms.uRes.value = arms[k].resTex;
  }
  setArm(desk);

  // ---- the buildings arrive after the world is already standing, so nothing waits on them.
  //      A run that delivers no city model draws none and says so; nothing stands in for it.
  const tilesetUrl = fileUrl("buildings");
  if (!tilesetUrl) {
    console.info("rescueworld: this run delivers no city model, so no buildings are drawn");
  }
  if (tilesetUrl) loadBuildings(tilesetUrl, {
    frame, terrain, colour: BONE, dracoPath: "/draco/",
  }).then((set) => {
    buildings = set;
    scene.add(set.group);
    const bad = set.tiles.filter((t) => !t.ok).length;
    console.info(`rescueworld: ${set.tiles.length - bad} of ${set.tiles.length} building tiles`
      + ` placed, ${set.buildings} buildings, ${set.vertices} vertices`
      + `${bad ? `; ${bad} tile(s) skipped` : ""}`);
  }).catch((error) => {
    console.warn(`rescueworld: the building tiles could not be read — ${(error as Error).message}`);
  });

  // ------------------------------------------------------------------ the world remembers
  function stamp(f: Float32Array, u: number, v: number, amt: number, rad: number, grain = false) {
    const cx = u * RESX, cy = v * RESY;
    const r = Math.ceil(rad), s2 = 2 * (rad * 0.55) * (rad * 0.55);
    const xa = Math.max(0, (cx - r) | 0), xb = Math.min(RESX - 1, (cx + r) | 0);
    const ya = Math.max(0, (cy - r) | 0), yb = Math.min(RESY - 1, (cy + r) | 0);
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) continue;
      const j = y * RESX + x;
      f[j] += amt * Math.exp(-d2 / s2) * (grain ? 0.45 + 1.1 * GRAIN[j] : 1);
    }
  }

  /** the mapped landslide zones, grouped by the tick their layer arrives at */
  const hazardAtTick = new Map<number, number[]>();
  hazards.forEach((h, i) => {
    const t = hazardShow(h.id);
    if (!hazardAtTick.has(t)) hazardAtTick.set(t, []);
    hazardAtTick.get(t)!.push(i);
  });

  /** everything this desk remembers about one tick. Additive only — nothing here forgets. */
  function depositTick(arm: Arm, t: number) {
    // the ground gives way where the observed layer says it gave way: burn-coloured scarring,
    // diffuse and soft, so it is never mistaken for the hairline that marks the zone itself
    for (const i of hazardAtTick.get(t) ?? []) {
      const [lon, lat] = hazards[i].centroid;
      const u = frame.u(lon), v = frame.v(lat);
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      stamp(arm.ash, u, v, 0.24, 4.2, true);
      stamp(arm.cool, u, v, 0.04, 2.6);
    }
    for (const e of arm.byTick[t]) {
      const p = siteIdx(e);
      if (p < 0) continue;
      const u = sites[p].u, v = sites[p].v;
      stamp(arm.cool, u, v, 0.05, 3.4);
      if (e.type === "RESOURCE_DISPATCHED") stamp(arm.cool, u, v, 0.34, 7.0);
      if (e.type === "OUTCOME_OBSERVED") {
        const reached = num(e.payload?.exercise_people_reached);
        stamp(arm.cool, u, v, 0.08 + 0.007 * reached, 4.0 + 0.07 * reached);
        // the team that went here cannot be sent anywhere else today: that is the burn
        stamp(arm.ash, u, v, 0.52, 7.5, true);
      }
    }
    arm.resDirty = true;
  }
  function marksTo(arm: Arm, t: number) {
    if (t < arm.resTick) { arm.cool.fill(0); arm.ash.fill(0); arm.resTick = -1; }
    for (let k = arm.resTick + 1; k <= t; k++) depositTick(arm, k);
    arm.resTick = t;
  }
  /** Reinhard on both channels — deposits keep arriving, the frame never blows out */
  function paintSurface(arm: Arm) {
    const d = arm.resData, co = arm.cool, ash = arm.ash;
    const burn = residueRgb(EMB);
    for (let p = 0, j = 0; p < RESN; p++, j += 4) {
      const c = co[p] / (co[p] + 0.9), a = ash[p] / (ash[p] + 0.8);
      const b = p * 3;
      d[j] = clamp(BASE[b] * 255 + c * 24 + a * burn[0], 0, 255);
      d[j + 1] = clamp(BASE[b + 1] * 255 + c * 86 + a * burn[1], 0, 255);
      d[j + 2] = clamp(BASE[b + 2] * 255 + c * 112 + a * burn[2], 0, 255);
      d[j + 3] = 255;
    }
    arm.resTex.needsUpdate = true;
    arm.resDirty = false;
  }

  // ------------------------------------------------------------------ the camera
  /**
   * How steeply the camera looks down, worked out from how far back it stands.
   *
   * A close pass over one place is watched from a shallow angle, because a low angle is what
   * gives a place its horizon and its depth. The same angle from far back points most of the
   * frame at empty sky, which is how a wide pull-back ends up a black picture with the
   * instruments still running. So the further back the camera stands the more it looks down,
   * from the shallow angle a framing asks for to the steep angle a shot holding the whole
   * ground needs. Between the two ends the change is smooth, so a pull-back tips rather than
   * snaps.
   */
  const CLOSE_DIST = 0.26;          // the closest stand-off any framing asks for
  const WIDE_DIST = GROUND * 0.95;  // the furthest back a directed shot ever stands
  const WIDE_PITCH = 54 * D2R;      // where a shot that holds the whole ground looks
  function pitchFor(closePitch: number, dist: number): number {
    const k = clamp((dist - CLOSE_DIST) / Math.max(1e-6, WIDE_DIST - CLOSE_DIST));
    const steep = Math.max(closePitch, WIDE_PITCH);
    return closePitch + (steep - closePitch) * Math.pow(k, 0.7);
  }

  /**
   * How far back a shot has to stand before the frame holds ground the cut actually paints.
   *
   * Some places the record names sit over water or over ground outside the survey — the
   * earthquake's own hypocentre is in the Yatsushiro Sea — and both are drawn dark. A close
   * pass over such a place is a black frame with the instruments still turning. So the test
   * walks outwards from the aim point until the elevation tiles fill enough of the box around
   * it, and the distance that box needs is the least this shot may stand at. The camera holds
   * a little over half its own distance either side of what it is aimed at, which is where the
   * conversion below comes from.
   */
  const LAND_IN_FRAME = 0.55;
  /** how much of the ground right under an aim point has to be painted for a close shot */
  const NEAR_GROUND = 0.60;
  function standBackFor(at: THREE.Vector3, from = 0.46): number {
    const u = at.x / frame.mapW + 0.5;
    const v = 0.5 - at.z / frame.mapD;
    const across = Math.max(frame.mapW, frame.mapD);
    let dist = Math.max(CLOSE_DIST, from);
    for (let step = 0; step < 14; step++) {
      // the box this stand-off holds, written as a fraction of the whole cut
      const radius = clamp(0.55 * dist / across, 0.008, 0.5);
      if (terrain.landAround(u, v, radius) >= LAND_IN_FRAME) return dist;
      if (dist >= WIDE_DIST) break;
      dist = Math.min(WIDE_DIST, dist * 1.35);
    }
    return WIDE_DIST;
  }

  const groundY = (x: number, z: number) =>
    terrain.heightAt(x / frame.mapW + 0.5, 0.5 - z / frame.mapD);
  const centreSite = sites.length ? sites[0] : null;
  // the home view frames the ground that has data rather than the middle of the rectangle,
  // because a third of this cut is sea and the sea is not the subject
  const homeX = (terrain.landCentre.u - 0.5) * frame.mapW;
  const homeZ = -(terrain.landCentre.v - 0.5) * frame.mapD;
  const HOME: Pose = {
    tx: homeX, ty: terrain.heightAt(terrain.landCentre.u, terrain.landCentre.v), tz: homeZ,
    yaw: -0.26, pitch: 43 * D2R, dist: GROUND * 0.86,
  };
  const SKY: Pose = { ...HOME, pitch: 70 * D2R, dist: GROUND * 1.85 };
  // The opening lands north of the first site looking back south, so the mass of the
  // prefecture stands behind the place the first report came from rather than empty sky. Where
  // the record names no worked site, it lands over the epicentre instead, because that is the
  // place the record itself opens on.
  const OPEN_TO: Pose = centreSite && onMap(centreSite)
    ? {
      tx: centreSite.x, ty: centreSite.y, tz: centreSite.z,
      yaw: 2.86, pitch: pitchFor(24 * D2R, 0.92), dist: 0.92,
    }
    : { ...HOME };
  const rig: Rig = makeRig({
    groundY, mapW: frame.mapW, mapD: frame.mapD, home: HOME, clearance: 0.0065,
  });
  rig.attach(canvas);
  // The world stands still under the briefing. The opening flight is what the Begin control
  // starts, so a stranger reads the situation first and then watches the camera go down to it.
  rig.setPose(SKY, true);
  const cam = rig.cam;

  // ------------------------------------------------------------------ the frame
  const gl = renderer.getContext();
  const gl2 = typeof WebGL2RenderingContext !== "undefined"
    && gl instanceof WebGL2RenderingContext ? gl : null;
  const post: PostState = initPost(gl);
  // The owner chose the opening picture in the live G panel, then copied its complete settings
  // block back into the project. Keep `post.look` on a named look so the performance meter has a
  // stable label; the actual opening values below are the approved custom grade. Shift and a
  // number still flicks between all seven Halo Forge reference looks.
  /**
   * The one thing this page changes about a graded look, and why.
   *
   * The simulated damage is drawn as stacked additive points, so the worst-hit ground climbs to
   * a white core, and the halation pass then spreads that core over the places standing near it.
   * At the epicentre it grew wide enough to swallow the name of a place whole. The numbers in
   * the look table are the owner's approved values and are left alone; this page instead holds
   * the bloom's own two numbers to a ceiling, so a bright frame stays bright and a place always
   * keeps its name. The colour split is held down for the same reason: at full strength it
   * fringes the far left edge of the frame.
   */
  const BLOOM_CEILING = 0.72;      // the most halation this page adds back over the frame
  const BLOOM_FLOOR = 0.40;        // below this brightness a pixel feeds no halation
  const SPLIT_CEILING = 0.20;      // the most colour split this page lets the corners carry
  function holdBloom() {
    post.params.halation = Math.min(post.params.halation, BLOOM_CEILING);
    post.params.haloThreshold = Math.max(post.params.haloThreshold, BLOOM_FLOOR);
    post.params.split = Math.min(post.params.split, SPLIT_CEILING);
  }
  applyLook(post, "halation");
  Object.assign(post.params, DEFAULT_ART_GRADE);
  const postVao = gl2 ? gl2.createVertexArray() : null;
  let sceneRT: THREE.WebGLRenderTarget | null = null;
  let sceneTex: WebGLTexture | null = null;

  let W = 0, H = 0;
  let warm = WARM;
  const GUT = 4;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    const stageW = split ? (W / 2 - GUT) : W;
    cam.aspect = stageW / Math.max(1, H);
    cam.updateProjectionMatrix();
    const pix = (H * renderer.getPixelRatio()) * 0.5 / Math.tan(cam.fov * Math.PI / 360);
    pointPix = pix;
    for (const m of allPointMats) m.uniforms.uPix.value = pix;
    sizeGrade();
    warm = WARM;
  }
  function sizeGrade() {
    const pr = renderer.getPixelRatio();
    const dw = Math.max(1, Math.round(W * pr)), dh = Math.max(1, Math.round(H * pr));
    if (sceneRT && sceneRT.width === dw && sceneRT.height === dh) return;
    sceneRT?.dispose();
    sceneRT = new THREE.WebGLRenderTarget(dw, dh, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
      depthBuffer: true, stencilBuffer: false, samples: 4,
    });
    sceneRT.texture.colorSpace = THREE.SRGBColorSpace;
    sceneTex = null;
    resizePost(post, dw, dh);
  }
  /**
   * Keep the story panel's own sentence inside the frame.
   *
   * The stylesheet anchors `#narrate` by its foot, above the decision rail, so a taller panel
   * grows upward. The sentence it carries is the largest reading on the page, and a resolved
   * action runs to two or three lines where a public beat ran to one: at 1280 by 720 that pushed
   * the sentence's own first line above the top of the window.
   *
   * What gives way is decided by what the panel is for. The sentence saying what is happening at
   * this minute is the reason the panel exists; the act's own standing line under it is context a
   * reader has already met at the top of the act. So the act line goes first, and the panel is
   * only lowered off the place the stylesheet gives it if dropping that line was not enough.
   * At every size with room for the whole panel nothing changes at all.
   */
  const NARRATE_EDGE = 12;
  /** whether the act's own line belongs on screen at all, which the act itself decides */
  let narrateAbout = false;
  /** whether this window is too short for it, which is decided by measuring, once per sentence */
  let narrateTight = false;
  function fitNarrate() {
    const panel = document.getElementById("narrate");
    const about = document.getElementById("roundAboutLabel");
    const line = document.getElementById("roundLine");
    if (!panel) return;
    panel.style.bottom = "";
    narrateTight = false;
    const show = (on: boolean) => {
      if (about) about.style.display = on ? "block" : "none";
      if (line) line.style.display = on ? "block" : "none";
    };
    show(narrateAbout);
    if (panel.getBoundingClientRect().height === 0) return;
    if (panel.getBoundingClientRect().top >= NARRATE_EDGE) return;
    narrateTight = true;
    show(false);
    const box = panel.getBoundingClientRect();
    if (box.top >= NARRATE_EDGE) return;
    const lift = NARRATE_EDGE - box.top;
    panel.style.bottom = `${Math.max(0, Math.round(innerHeight - box.bottom - lift))}px`;
  }
  addEventListener("resize", () => { resize(); fitNarrate(); });
  resize();

  /**
   * G opens the owner's live grade. It changes presentation only: the post state, the semantic
   * burn colour and the GPU colour attributes. No replay event, decision or outcome is touched.
   */
  let artKeysWereEnabled = true;
  const art = mountArtDirector({
    post,
    applyLook: (name) => applyLook(post, name),
    burnColor: burnHex,
    onBurnColor(rgb, hex) {
      EMB[0] = rgb[0]; EMB[1] = rgb[1]; EMB[2] = rgb[2];
      burnHex = hex;
      for (const arm of arms) {
        recolorDamage(arm.damage, EMB);
        arm.resDirty = true;
      }
    },
    onOpenChange(open) {
      if (open) {
        artKeysWereEnabled = rig.keysEnabled;
        rig.keysEnabled = false;
      }
      else rig.keysEnabled = artKeysWereEnabled;
    },
  });

  // ------------------------------------------------------------------ the bands, stated first
  const finalReached = arms.map((a) => a.reached[TICKS]);
  function dispatchedOnUnconfirmed(armId: string): boolean {
    for (const d of events) {
      if (d.arm !== armId || d.type !== "RESOURCE_DISPATCHED") continue;
      const cv = str(d.payload?.authorizing_claim_version_id);
      if (!cv) continue;
      for (const c of events) {
        if (c.type !== "CLAIM_STATE_CHANGED") continue;
        if (str(c.payload?.claim_version_id) !== cv) continue;
        const v = str(c.payload?.verdict, str(c.payload?.comparison_verdict));
        if (v && v !== "SUPPORTED") return true;
      }
    }
    return false;
  }
  /**
   * What the record actually holds, counted off the log at load. This is what the outcome and
   * the debrief state where the run keeps no count of people reached: the moments it witnessed,
   * the decision moments that fell due in it, and the tremors the agency recorded inside it.
   * Every one of these is a count of lines in the log and nothing else.
   */
  const scale = {
    events: events.length,
    decisions: events.filter((e) => e.type === "DECISION_PROPOSED").length,
    aftershocks: events.filter((e) => !!e.payload?.earthquake).length,
    hours: Math.round(spanS / 3600),
    acts: acts.length,
  };
  /** true when this run keeps the people-reached metric the two-desk exercise keeps */
  const hasReachMetric = events.some((e) =>
    e.type === "METRIC_UPDATED" && str(e.payload?.metric_id) === REACH);

  /**
   * What the record grades. Every moment of decision carries the choices three ways of
   * deciding made against it, and every choice carries the record's own two measures: whether
   * it came out completely valid, and whether it stayed inside the limits on how much could be
   * sent. Five of the eleven moments also carry the registered experiment, whose measures were
   * written down before it ran; the rest carry the same three ways as a description.
   *
   * Every number below is counted off the sealed log at load. Nothing is stored in this file
   * and nothing is estimated.
   */
  interface WayTally { runs: number; valid: number; constraint: number }
  function gradesUnder(key: string): Map<string, WayTally> {
    const out = new Map<string, WayTally>();
    for (const e of events) {
      if (e.type !== "DECISION_PROPOSED") continue;
      const block = e.payload?.[key] as { choices?: {
        graph_id?: string;
        score?: { fully_valid?: boolean; constraint_pass?: boolean };
      }[] } | undefined;
      for (const choice of block?.choices ?? []) {
        const way = str(choice.graph_id);
        if (!way) continue;
        const row = out.get(way) ?? { runs: 0, valid: 0, constraint: 0 };
        row.runs++;
        if (choice.score?.fully_valid) row.valid++;
        if (choice.score?.constraint_pass) row.constraint++;
        out.set(way, row);
      }
    }
    return out;
  }
  const WAY_ORDER = ["plain_summary", "evidence_table", "evidence_feedback"];
  const registeredGrades = gradesUnder("registered_five_slot_experiment");
  const describedGrades = gradesUnder("full_incident_demonstration");
  const gradeRow = (grades: Map<string, WayTally>, way: string): WayTally =>
    grades.get(way) ?? { runs: 0, valid: 0, constraint: 0 };
  /** true when this run grades its own model choices, which the full incident does */
  const hasGrades = registeredGrades.size > 0 || describedGrades.size > 0;
  const registeredRuns = gradeRow(registeredGrades, WAY_ORDER[0]).runs;
  const describedRuns = gradeRow(describedGrades, WAY_ORDER[0]).runs;
  /**
   * Write the tally's cells: a name under a number, one cell per honest reading.
   *
   * `keyFirst` paints the first number in the signal colour, which is how the readouts key the
   * reading a viewer should look at first. The ledger's three counts pass it off: there the first
   * number is a count of zero passing tries, and the same colour on the eight cells beside it
   * means a try agreed and passed every check. A cyan zero read as the opposite of what it is.
   */
  function writeTally(box: HTMLElement, cells: { value: number; label: string }[],
    keyFirst = true) {
    box.textContent = "";
    cells.forEach((cell, i) => {
      const holder = document.createElement("div");
      const value = document.createElement("b");
      if (i === 0 && keyFirst) value.className = "cold";
      value.textContent = String(cell.value);
      const name = document.createElement("i");
      name.textContent = cell.label;
      holder.append(value, name);
      box.append(holder);
    });
  }
  /**
   * What the outcome states while the run is playing: how far through the record the viewer
   * is, how many moments of decision have passed, and how many tremors have arrived. A rate
   * taken from a run that is still playing is a partial rate, so no grade appears here; the
   * grades are stated once, in the debrief, after every moment has played.
   */
  function incidentCellsAt(tick: number) {
    let played = 0, decisions = 0, aftershocks = 0;
    for (const e of events) {
      if (tickAt(e) > tick) continue;
      played++;
      if (e.type === "DECISION_PROPOSED") decisions++;
      if (e.payload?.earthquake) aftershocks++;
    }
    return [
      { value: played, label: COPY.INCIDENT.countLabels.events(scale.events) },
      { value: decisions, label: COPY.INCIDENT.countLabels.decisions(scale.decisions) },
      { value: aftershocks, label: COPY.INCIDENT.countLabels.aftershocks(scale.aftershocks) },
    ];
  }
  /**
   * The graded finding: how many registered tries each way of deciding passed every check. The
   * label under each number says what the number counts and how many tries it is out of, so no
   * count on the debrief ever stands as a bare figure with a method's name under it.
   */
  const gradeCells = WAY_ORDER.map((way) => ({
    value: gradeRow(registeredGrades, way).valid,
    label: COPY.INCIDENT.countLabels.tries(
      gradeRow(registeredGrades, way).runs, COPY.INCIDENT.ways[way] ?? way),
  }));
  if (twoDesks && hasReachMetric) {
    const hi = finalReached[1] >= finalReached[0] ? 1 : 0, lo = 1 - hi;
    el("verdict").textContent = COPY.OUTCOME.verdict(
      arms[hi].spec.name, finalReached[hi], arms[lo].spec.name, finalReached[lo],
      dispatchedOnUnconfirmed(arms[lo].spec.id));
    el("countB").textContent = String(finalReached[1]);
    el("countA").textContent = String(finalReached[0]);
    el("countNameB").textContent = arms[1].spec.name;
    el("countNameA").textContent = arms[0].spec.name;
    el("outfoot").textContent = COPY.OUTCOME.footnote;
    el("chip").textContent = COPY.OUTCOME.chip;
  } else {
    // the sentence sets the scene and states the question; the numbers under it say how far
    // through the record the run has played, and nothing about how any choice was graded
    el("verdict").textContent = COPY.INCIDENT.verdict(scale.hours, scale.acts, scale.decisions);
    writeTally(el("tally"), incidentCellsAt(0));
    el("outfoot").textContent = COPY.INCIDENT.footnote;
    el("chip").textContent = COPY.INCIDENT.chip;
  }
  el("angles").textContent = COPY.MASTHEAD.angles;
  el("mastName").textContent = COPY.MASTHEAD.name;
  // the exercise is a labeled exercise and says so; the incident is the public record and says that
  el("mark").textContent = walkActs ? COPY.INCIDENT.mark : COPY.MASTHEAD.mark;
  // the briefing states the human problem and the question before anything else, and the run
  // that replays the whole incident poses a different question from the two-desk exercise
  el("briefText").textContent = walkActs
    ? COPY.INCIDENT.briefing.text : COPY.BRIEFING.text;
  el("briefHonest").textContent = walkActs
    ? COPY.INCIDENT.briefing.honesty : COPY.BRIEFING.honesty;
  // The help describes the record that is actually loaded. The run that replays the whole
  // incident holds one shared story and no second desk, so it gets its own two paragraphs, and
  // every count in them is read out of the loaded file rather than written here.
  el("helpScenario").textContent = walkActs ? COPY.HELP.incidentScenario : COPY.HELP.scenario;
  // the same count the masthead prints, so one record never states two different totals of its
  // own recorded moments on two surfaces
  el("helpDesks").textContent = walkActs
    ? COPY.HELP.incidentStory(events.length,
      events.filter((e) => e.type === "DECISION_PROPOSED").length, acts.length)
    : COPY.HELP.desks;
  el("helpLichen").textContent = COPY.HELP.lichen;
  el("helpPlaces").textContent = COPY.HELP.places(sites.length);
  el("helpDriven").textContent = COPY.HELP.driven(events.length);
  el("helpPaced").textContent = COPY.HELP.paced(twoDesks);
  el("helpAttribution").textContent = COPY.HELP.attribution;
  for (const line of COPY.HELP.controls) {
    // the tab key only switches desks on a two-desk log; on the one-story
    // incident record the key does nothing, so the help must not offer it
    if (!twoDesks && line === "Press tab to switch desks.") continue;
    const row = document.createElement("li");
    row.textContent = line;
    el("helpControls").append(row);
  }
  (el("scrub") as HTMLInputElement).max = String(TICKS);
  {
    // one honest number about the drawing itself: how much taller than life the hills are
    const metresPerUnitUp = 1 / (terrain.yFromMeters(1) - terrain.yFromMeters(0));
    const metresPerUnitAcross = 110540 / frame.scale;
    const exaggeration = metresPerUnitAcross / metresPerUnitUp;
    el("helpScale").textContent =
      `The ground is drawn ${exaggeration.toFixed(1)} times taller than life, so that hills`
      + ` of a few hundred metres can be seen across a view ${Math.round(
        (frame.east - frame.west) * 111320 * frame.kx / 1000)} kilometres wide and`
      + ` ${Math.round((frame.north - frame.south) * 110.54)} kilometres deep. Across the stretch`
      + " of ground on screen, a national survey recorded heights from"
      + ` ${Math.round(terrain.minM)} to`
      + ` ${Math.round(terrain.maxM)} metres above sea level. In ${terrain.noData} places it`
      + " recorded no height at all, because there is sea there or the survey stopped short, and"
      + " those places are drawn dark.";
  }

  // ------------------------------------------------------------------ how a container opens
  /**
   * The owner's opening gesture, applied to everything on this page that opens: four corner
   * brackets start condensed together at the middle of the container in a crosshair, spin, and
   * ease out to its corners, and only then does the writing arrive. Closing reverses, faster.
   *
   * The distances the brackets travel depend on the container's size, so they are measured once
   * at the moment it opens and written as two custom properties per corner; everything after
   * that is a transform and an opacity, which the compositor does without touching layout.
   *
   * These are interaction reveals and they run on real elapsed time since the interaction. They
   * touch nothing in the replay: the world's state is still a pure function of the playback
   * tick, and `window.__HERO.state()` never sees them.
   */
  const CORNER_INSET = 7;
  function fitCorners(box: HTMLElement) {
    const rv = box.querySelector(".rv");
    if (!(rv instanceof HTMLElement)) return;
    const dx = Math.max(0, box.offsetWidth / 2 - CORNER_INSET);
    const dy = Math.max(0, box.offsetHeight / 2 - CORNER_INSET);
    const place = (sel: string, x: number, y: number) => {
      const node = rv.querySelector(sel);
      if (!(node instanceof HTMLElement)) return;
      node.style.setProperty("--dx", `${x.toFixed(1)}px`);
      node.style.setProperty("--dy", `${y.toFixed(1)}px`);
    };
    place(".tl", dx, dy);
    place(".tr", -dx, dy);
    place(".bl", dx, -dy);
    place(".br", -dx, -dy);
  }
  const closingTimers = new WeakMap<HTMLElement, number>();
  function openBox(box: HTMLElement) {
    const pending = closingTimers.get(box);
    if (pending !== undefined) { clearTimeout(pending); closingTimers.delete(box); }
    box.classList.remove("closing", "opening", "ready");
    box.classList.add("on");
    fitCorners(box);
    // one frame with the brackets still condensed, so the eye sees them travel
    requestAnimationFrame(() => {
      box.classList.add("opening");
      const t = setTimeout(() => box.classList.add("ready"), 300);
      closingTimers.set(box, t as unknown as number);
    });
  }
  function closeBox(box: HTMLElement) {
    const pending = closingTimers.get(box);
    if (pending !== undefined) { clearTimeout(pending); closingTimers.delete(box); }
    if (!box.classList.contains("on")) return;
    box.classList.remove("opening", "ready");
    box.classList.add("closing");
    const t = setTimeout(() => {
      box.classList.remove("on", "closing");
      closingTimers.delete(box);
    }, 190);
    closingTimers.set(box, t as unknown as number);
  }

  // ------------------------------------------------------------------ the agent trace
  /**
   * The surface this whole page exists to carry: at one moment of decision, what the agents knew,
   * what each way of working proposed, what the mechanical check caught, what the one correction
   * changed, and what the final simulated action was — beside the recorded choice the real
   * responders made at that same minute.
   *
   * Three rules of shape, all from `docs/rescueworld/STORY-TEMPLATE.md`. The recorded real choice
   * is the first card a reader sees and is set at the same size and in the same place as the five
   * that follow it. The cards are read one at a time in order, so two runs never stand side by
   * side. And the standing limitation closes the last card, because that card carries a grade.
   *
   * Every sentence is built at load by `trace.ts` out of the baked file, so opening the trace
   * reads no file, fetches nothing and computes no number. The world keeps standing beside it;
   * the run holds while it is open, the same way it holds behind the help and the debrief.
   */
  const traceBox = el("trace"), traceCloseBtn = el("traceClose");
  const traces: AgentTrace[] = buildTraces(
    events.filter((e) => e.type === "DECISION_PROPOSED") as unknown as RawDecisionEvent[],
    log.decision_context,
    { seed: TRACE_SEED, flagshipMomentId: TRACE_FLAGSHIP, eventCount: events.length },
  );
  const traceOf = new Map(traces.map((trace) => [trace.momentId, trace]));
  /**
   * The walk-through follows one of the eight recorded tries of each moment. This reads any of
   * the other seven back out of the same sealed events, on the press that opens it, so the
   * decision tree can show what each try actually asked for instead of only whether it passed.
   */
  const seedDeskAt = readSeedDesks(
    events.filter((e) => e.type === "DECISION_PROPOSED") as unknown as RawDecisionEvent[],
    log.decision_context,
  );
  let traceOpen: AgentTrace | null = null;
  let traceCard = 0;
  /** true while the trace stands because the directed watch opened it rather than a reader */
  let traceAuto = false;
  let traceDrawn = "";

  /** the class one badge wears, decided by which of the three fixed wordings it carries */
  function badgeClass(text: string): string {
    if (text === COPY.INCIDENT.badge.descriptive) return "tbadge desc";
    if (text === COPY.INCIDENT.badge.passed) return "tbadge pass";
    return "tbadge fail";
  }

  // ---------------------------------------------------------------- the eight cells of a strip
  /**
   * The strip that stands beside every shown choice: eight cells, one for each recorded try of
   * that moment, in the recorded seed order.
   *
   * A cell carries two separate readings and never merges them, because they answer two different
   * questions. Whether the try produced the same set of choices as the one on screen is the fill,
   * which is how stable that way of working was. Whether it passed every prewritten check is the
   * colour, which is whether that answer held. A method can be perfectly stable and wrong, and
   * the strip has to be able to show that.
   *
   * No percentage is written anywhere near it. The honest thing this record holds is a count of
   * eight recorded tries, and the contract's own two sentences are what the strip says out loud
   * for a reader who cannot see the cells.
   *
   * A moment outside the frozen experiment gets eight outlined cells and its own badge, and never
   * a filled count, because a filled count on such a moment would be read as part of a registered
   * result it is not in.
   */
  function stripNode(reading: StripReading | null): HTMLElement {
    const box = document.createElement("div");
    const label = document.createElement("div");
    label.className = "striplab";
    // A row with no counts wears a label that says so. A label promising a count of agreeing
    // tries over eight empty cells said two different things at once.
    label.textContent = reading ? COPY.OUTCOMES.stripLabel : COPY.OUTCOMES.stripLabelNone;
    const cells = document.createElement("div");
    cells.className = reading ? "strip" : "strip empty";
    cells.setAttribute("role", "img");
    cells.setAttribute("aria-label", reading
      ? COPY.OUTCOMES.stripReading(reading.agreementCaption, reading.passCaption)
      : COPY.OUTCOMES.stripDescriptive);
    const count = reading ? reading.cells.length : STRIP_CELLS;
    for (let i = 0; i < count; i++) {
      const cell = document.createElement("i");
      const held = reading?.cells[i];
      if (held) {
        cell.className = `${held.agreed ? "on" : ""}${held.passed ? "" : " broke"}`.trim();
      }
      cells.append(cell);
    }
    const said = document.createElement("p");
    said.className = "stripsay";
    said.textContent = reading
      ? COPY.OUTCOMES.stripReading(reading.agreementCaption, reading.passCaption)
      : COPY.OUTCOMES.stripDescriptive;
    box.append(label, cells, said);
    // Where the eight tries scattered, one more sentence says what a person should do about it.
    // The sentence carries the count it is about, so the advice and the cells are one fact.
    if (reading && reading.agreement <= WEAK_AGREEMENT) {
      const warn = document.createElement("p");
      warn.className = "stripwarn";
      warn.textContent = COPY.OUTCOMES.weakAgreement(reading.agreement, reading.tries);
      box.append(warn);
    }
    return box;
  }

  // ---------------------------------------------------------------- a grade that opens its reasons
  /**
   * Every grade on this page is a control that opens the itemized list of what the check found,
   * in place, under the grade itself. The list is the same plain-English wording the walk-through
   * already builds in `trace.ts`, read from the same recorded answer, so there is one translation
   * of the checker's output on this page and never two.
   *
   * It opens on a click and closes on a second click or on escape. Nothing here appears on hover,
   * because a person demonstrating this in front of a room never hovers.
   */
  const openReasons = new Set<HTMLElement>();
  function closeAllReasons() {
    for (const list of openReasons) {
      list.classList.remove("on", "opening", "ready");
      const badge = list.previousElementSibling;
      if (badge instanceof HTMLElement) badge.classList.remove("open");
    }
    openReasons.clear();
  }
  /**
   * What a grade is about, appended by the two surfaces that stand a grade next to the eight
   * cells. The grade reads the one answer shown, and the cells read all eight recorded tries. A
   * reader who took the cyan grade under six burn cells as a verdict on all eight had read the
   * surface as one reading when it is two.
   */
  function badgeScopeNote(): HTMLElement {
    const line = document.createElement("p");
    line.className = "badgescope";
    line.textContent = COPY.OUTCOMES.badgeScope;
    return line;
  }
  /**
   * What the third badge means, appended directly under it wherever it is drawn. The badge's own
   * words are fixed by the story template and compared against character for character at
   * `badgeClass`, so the explanation stands beside the badge instead of inside it.
   */
  function descriptiveNote(): HTMLElement {
    const line = document.createElement("p");
    // Its own class, not `badgescope`. That class marks the note about what a grade covers, and
    // `verify-rescueworld-space-data.mjs:94` counts one of those per graded moment.
    line.className = "descwhy";
    line.textContent = COPY.INCIDENT.descriptiveWhy;
    return line;
  }
  /**
   * What the five cell states mean, appended where the cells first appear and again in the
   * ledger. It is one paragraph and it is always on screen, because a legend a reader has to
   * hover for is a legend nobody demonstrating this in front of a room will ever open.
   */
  function stripLegendNote(): HTMLElement {
    const line = document.createElement("p");
    line.className = "striplegend";
    line.textContent = COPY.OUTCOMES.stripLegend;
    return line;
  }
  /**
   * Write a quoted machine sentence into a node, with the square-bracket explanations this page
   * added set apart from the words the machine wrote.
   *
   * The whole line is one quotation, and a reader has to be able to see at a glance which words
   * are the machine's and which are ours. `gloss.ts` puts ours inside square brackets, and this
   * puts each bracketed run into its own span so the stylesheet can hold it apart. Every other
   * trace line is a single text node, and stays one.
   */
  function writeWithGlosses(node: HTMLElement, text: string): void {
    // The split keeps the brackets in the result, so the odd-numbered pieces are the ones this
    // page added and the even-numbered pieces are the machine's own words.
    const pieces = text.split(/(\[[^\]]*\])/g);
    pieces.forEach((piece, at) => {
      if (!piece) return;
      if (at % 2 === 0) { node.append(document.createTextNode(piece)); return; }
      const ours = document.createElement("span");
      ours.className = "tgloss";
      ours.textContent = piece;
      node.append(ours);
    });
  }

  /**
   * One grade and its reasons, as two nodes a caller appends together. The grade wording is the
   * story template's own and is never rewritten here; only the class it wears is decided by which
   * of the three fixed wordings it carries.
   */
  function verdictBadge(text: string, findings: string[]): HTMLElement {
    const box = document.createElement("div");
    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = badgeClass(text).replace("tbadge", "verdict-badge");
    const words = document.createElement("span");
    words.textContent = text;
    const hint = document.createElement("i");
    hint.textContent = COPY.OUTCOMES.reasonOpen;
    badge.append(words, hint);

    const list = document.createElement("div");
    list.className = "reasons";
    const rv = document.createElement("div");
    rv.className = "rv";
    for (const corner of ["tl", "tr", "bl", "br"]) {
      const mark = document.createElement("i");
      mark.className = corner;
      rv.append(mark);
    }
    const body = document.createElement("div");
    body.className = "rvbody";
    const lead = document.createElement("div");
    lead.className = "rlab";
    lead.textContent = COPY.TRACE.messageLabel;
    body.append(lead);
    if (findings.length === 0) {
      const none = document.createElement("p");
      none.className = "clean";
      none.textContent = COPY.OUTCOMES.reasonNone;
      body.append(none);
    }
    for (const finding of findings) {
      const line = document.createElement("p");
      line.textContent = COPY.sentenceCase(finding.replace(/\.?$/, "."));
      body.append(line);
    }
    list.append(rv, body);

    badge.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = list.classList.contains("on");
      closeAllReasons();
      if (open) return;
      list.classList.add("on");
      badge.classList.add("open");
      openReasons.add(list);
      // the house reveal: the corner brackets travel out to the corners, then the writing arrives
      fitCorners(list);
      requestAnimationFrame(() => {
        list.classList.add("opening");
        setTimeout(() => list.classList.add("ready"), 300);
      });
    });
    box.append(badge, list);
    return box;
  }

  /** the findings one recorded answer earned, in the plain wording `trace.ts` already built */
  const findingsOf = (desk: TraceDesk | null): string[] => desk?.findings ?? [];

  /** one card, written into the frame. Pure: the same card always draws the same nodes. */
  function drawTraceCard(trace: AgentTrace, card: TraceCard) {
    const key = `${card.id}:${trace.seed}`;
    if (key === traceDrawn) return;
    traceDrawn = key;
    el("traceCount").textContent = COPY.TRACE.place(traceCard + 1, trace.cards.length);
    el("traceKicker").querySelector("span")!.textContent = COPY.TRACE.title;
    el("traceMoment").textContent = trace.title;
    el("traceWhen").textContent = COPY.TRACE.deadline(trace.cutoffWords);
    el("traceWho").textContent = trace.deciderLine;

    const frame = el("traceCard");
    const isPublicRecord = card.frame === COPY.TRACE.frameReal;
    frame.classList.toggle("record", isPublicRecord);
    frame.classList.toggle("model", !isPublicRecord);
    el("traceStep").textContent = card.kicker;
    el("traceFrame").textContent = card.frame;
    el("traceHeading").textContent = card.heading;

    // Every grade on this card opens its own reasons in place, so a grade is one click from the
    // rules that produced it. The descriptive badge names no rule and carries no list.
    const badges = el("traceBadges");
    badges.textContent = "";
    closeAllReasons();
    const desk = card.id.endsWith(":plain") ? trace.plain
      : card.id.endsWith(":table") ? trace.table
        : card.id.endsWith(":final") ? trace.final : null;
    for (const text of card.badges) {
      if (text === COPY.INCIDENT.badge.descriptive) {
        const node = document.createElement("div");
        node.className = badgeClass(text);
        node.textContent = text;
        badges.append(node, descriptiveNote());
        continue;
      }
      badges.append(verdictBadge(text, findingsOf(desk)));
    }

    const body = el("traceLines");
    body.textContent = "";
    for (const line of card.lines) {
      const node = document.createElement("p");
      node.className = `t${line.kind}`;
      if (line.kind === "quote") writeWithGlosses(node, line.text);
      else node.textContent = line.text;
      body.append(node);
    }

    const dots = el("traceDots");
    dots.textContent = "";
    trace.cards.forEach((row, i) => {
      const dot = document.createElement("i");
      dot.className = `${row.frame === COPY.TRACE.frameReal ? "record" : ""}`
        + `${i === traceCard ? " on" : ""}`;
      dots.append(dot);
    });
    el("tracePlace").textContent = COPY.TRACE.place(traceCard + 1, trace.cards.length);
    el("traceHint").textContent = COPY.TRACE.hint;
    // Which recorded try this walk-through follows, and which files every sentence came from, are
    // facts about the experiment. The action-first contract keeps that behind the last card, so
    // the footer is written only on the card that is about how the action was tested. On the
    // first five it says nothing rather than putting a seed number under a rescue action.
    const tested = traceCard === trace.cards.length - 1;
    el("traceSource").textContent = tested ? `${trace.seedLabel} ${trace.sourceLabel}` : "";
    (el("tracePrev") as HTMLButtonElement).textContent = COPY.TRACE.back;
    (el("traceNext") as HTMLButtonElement).textContent = COPY.TRACE.next;
    (el("tracePrev") as HTMLButtonElement).disabled = traceCard === 0;
    (el("traceNext") as HTMLButtonElement).disabled = traceCard >= trace.cards.length - 1;
    // The standing limitation is pinned to the foot of the frame on every card that carries a
    // grade, so it stands beside the grade rather than at the end of a card a reader may not
    // scroll to. The story template requires it wherever any grade shows.
    const graded = card.badges.some((text) => text !== COPY.INCIDENT.badge.descriptive);
    el("traceLimit").textContent = trace.limitation;
    el("traceLimit").classList.toggle("on", graded);
    el("traceScroll").scrollTop = 0;
    requestAnimationFrame(drawTraceMore);
  }

  /**
   * The cue at the foot of the card. A card can hold more than the frame shows, and a reader who
   * cannot see a scrollbar reads the first screen and stops, so while there is more below the
   * fold the foot carries one line saying so, and the line goes at the end.
   */
  const traceMore = el("traceMore");
  el("traceMoreText").textContent = COPY.TRACE.scrollCue;
  function drawTraceMore() {
    const scroll = el("traceScroll");
    const left = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop;
    traceMore.classList.toggle("on", traceIsOpen() && left > 18);
  }
  el("traceScroll").addEventListener("scroll", drawTraceMore, { passive: true });

  function showTrace(trace: AgentTrace | null, card = 0, auto = false) {
    if (!trace || trace.cards.length === 0) {
      traceOpen = null;
      traceAuto = false;
      closeBox(traceBox);
      traceCloseBtn.style.display = "none";
      el("traceMore").classList.remove("on");
      rig.keysEnabled = true;
      return;
    }
    const wasOpen = traceOpen !== null;
    traceOpen = trace;
    traceAuto = auto;
    traceCard = Math.max(0, Math.min(trace.cards.length - 1, card));
    traceDrawn = "";
    drawTraceCard(trace, trace.cards[traceCard]);
    if (!wasOpen) openBox(traceBox);
    traceCloseBtn.style.display = "block";
    rig.keysEnabled = false;
  }

  /** one card forward or back. A reader who steps takes the walk-through off the direction. */
  function stepTrace(delta: number) {
    if (!traceOpen) return;
    traceAuto = false;
    traceCard = Math.max(0, Math.min(traceOpen.cards.length - 1, traceCard + delta));
    drawTraceCard(traceOpen, traceOpen.cards[traceCard]);
  }

  /** the walk-through for one moment, by the identifier the record gives that moment */
  function openTraceFor(momentId: string, card = 0): boolean {
    const trace = traceOf.get(momentId);
    if (!trace) return false;
    showTrace(trace, card, false);
    return true;
  }
  const traceExists = (momentId: string) => traceOf.has(momentId);
  const traceIsOpen = () => traceBox.classList.contains("on");
  /** where the walk-through stands, for a gate that drives it from outside */
  const traceReport = () => ({
    open: traceIsOpen(),
    momentId: traceOpen?.momentId ?? null,
    card: traceCard,
    cards: traceOpen?.cards.length ?? 0,
    cardId: traceOpen?.cards[traceCard]?.id ?? null,
    step: traceOpen?.cards[traceCard]?.step ?? -1,
    auto: traceAuto,
  });

  traceCloseBtn.addEventListener("click", () => showTrace(null));
  el("tracePrev").addEventListener("click", (e) => { e.stopPropagation(); stepTrace(-1); });
  el("traceNext").addEventListener("click", (e) => { e.stopPropagation(); stepTrace(1); });
  // clicking the card itself moves on, which is how a reader walks it without hunting a control
  el("traceScroll").addEventListener("click", () => stepTrace(1));

  // ------------------------------------------------------------------ the information panel
  const panel = el("panel"), panelClose = el("panelClose");
  let selected: Target | null = null;

  const sourceRow = (id: string) => {
    const row = (log.data_sources ?? []).find((s) => s.source_id === id);
    return row ?? null;
  };
  const siteName = (i: number) => `site ${String(i + 1)} · ${sites[i].id}`;
  const hazardSource = hazardRaw?.source as Record<string, string> | undefined;
  const roadSource = roadRaw?.source as Record<string, string> | undefined;
  const shelterSource = shelterRaw?.source as Record<string, string> | undefined;

  /** the claims that authorized one dispatch, expanded into their own recorded verdicts */
  function authorisingClaims(dispatch: Ev, armId: string): Line[] {
    const cv = str(dispatch.payload?.authorizing_claim_version_id);
    if (!cv) return [];
    const out: Line[] = [];
    for (const c of events) {
      if (c.type !== "CLAIM_STATE_CHANGED") continue;
      if (str(c.payload?.claim_version_id) !== cv) continue;
      const verdict = str(c.payload?.verdict, "NOT_EVALUATED");
      const support = (c.payload?.supporting_observation_ids as string[] | undefined) ?? [];
      out.push({
        text: `The claim it was sent on: ${num(c.payload?.value)} ${str(c.payload?.unit, "people")}`
          + ` at this place, marked ${verdict.replace(/_/g, " ").toLowerCase()}`
          + `${support.length ? `, on ${support.length} agreeing source${support.length > 1 ? "s" : ""}` : ""}.`,
        // "claim version {cv}" stood as a bare compound with nothing to anchor it. The evidence
        // desk keeps every competing number as its own version of the same claim, so the chip
        // now points back at the claim named in the line above it.
        source: `${c.arm === armId ? "this desk" : c.arm.replace(/_/g, " ").toLowerCase()}`
          + ` · ${c.actor.id} · version ${cv} of that claim · ${stamped(c.sim_time_s)}`,
        tone: verdict === "SUPPORTED" ? "sig" : "hot",
      });
    }
    return out;
  }

  /** one event, written as the sentence a stranger reads */
  function wordEvent(e: Ev): string {
    const p = e.payload ?? {};
    const t = siteIdx(e);
    const where = t >= 0 ? ` at ${siteName(t)}` : "";
    switch (e.type) {
      case "WORLD_INITIALIZED": {
        const inc = p.incident as Record<string, unknown> | undefined;
        return `The earthquake is recorded: magnitude ${num(inc?.magnitude)},`
          + ` maximum intensity ${str(inc?.maximum_intensity)}, ${num(inc?.depth_km)} km deep.`;
      }
      case "SOURCE_INGESTED": {
        const claim = p.claim as Record<string, unknown> | undefined;
        if (claim) {
          return `${str(p.source_label, "a source")} reports ${num(claim.value)}`
            + ` ${str(claim.unit, "people").replace(/_/g, " ")} waiting${where}.`;
        }
        if (p.restriction_id) {
          return "One road closure is read in:"
            + ` ${COPY.REGION.roadName(str(p.route_name), str(p.road_kind))},`
            + ` ${en(p.restriction_status)}`
            + `, because of ${en(p.restriction_reason)}.`;
        }
        if (typeof p.feature_count === "number") {
          return `One whole map file is read in, holding ${p.feature_count} shapes.`;
        }
        return str(e.provenance?.explanation, "a source is taken in");
      }
      case "GRAPH_TRANSITION":
        return str(p.detail, `the desk moves to ${str(p.node_id)}`);
      case "CLAIM_STATE_CHANGED":
        return `A claim of ${num(p.value)} ${str(p.unit, "people").replace(/_/g, " ")}${where}`
          + ` is marked ${str(p.verdict, "not evaluated").replace(/_/g, " ").toLowerCase()}.`;
      case "DECISION_PROPOSED": {
        const sel = (p.selected_targets as string[] | undefined) ?? [];
        return `${sel.length} place${sel.length === 1 ? "" : "s"} ranked for`
          + ` ${num(p.resource_limit)} team${num(p.resource_limit) === 1 ? "" : "s"}.`;
      }
      case "POLICY_EVALUATED":
        return `The rule is applied: ${str(p.disposition, "evaluated").replace(/_/g, " ").toLowerCase()}`
          + `, ${num(p.supported_selections)} supported and ${num(p.unsupported_selections)} not.`;
      case "RESOURCE_DISPATCHED":
        return `${str(p.resource_id, "a team")} is sent${where}.`;
      case "OUTCOME_OBSERVED":
        return `The team found ${num(p.exercise_people_reached)} simulated people${where}.`;
      case "METRIC_UPDATED":
        return `${str(p.metric_id, "a number").replace(/_/g, " ")} is now ${num(p.value)}.`;
      default:
        return str(e.provenance?.explanation, e.type);
    }
  }

  /** everything the panel says about one thing */
  function describe(t: Target): { kind: string; name: string; sub: string; lines: Line[] } {
    const tick = Math.min(TICKS, Math.floor(P.tick));
    if (t.kind === "site") {
      const s = sites[t.i];
      const arm = arms[desk];
      const lines: Line[] = [];
      lines.push({
        text: `This place sits in the middle of a zone where the land slipped: ${s.id}.`
          + ` It lies at ${s.lon.toFixed(5)} east and ${s.lat.toFixed(5)} north, and tiles of`
          + ` ground height put it ${Math.round(terrain.metersAt(s.u, s.v))} metres up.`,
        source: `${str(hazardSource?.provider, "Geospatial Information Authority of Japan")}`
          + ` · ${str(hazardSource?.interpretation, "interpreted from aerial photographs")}`
          + ` · revision ${str(hazardSource?.revision, "unknown")}`,
      });
      for (let i = 0; i < arm.order.length; i++) {
        const e = arm.order[i];
        if (arm.evTick[i] > tick) break;
        if (siteIdx(e) !== t.i) continue;
        const tone = e.type === "OUTCOME_OBSERVED" ? "hot"
          : e.type === "RESOURCE_DISPATCHED" ? "sig" : undefined;
        lines.push({
          text: wordEvent(e),
          source: `${e.actor.id} · ${(e.provenance?.source_ids ?? [e.actor.id]).join(", ")}`
            + ` · ${stamped(e.sim_time_s)}`,
          tone,
        });
        if (e.type === "RESOURCE_DISPATCHED") {
          lines.push(...authorisingClaims(e, arm.spec.id));
        }
      }
      if (lines.length === 1) {
        lines.push({
          text: "Nothing has been recorded here yet in this run.",
          source: `${arms[desk].spec.name}, at second`
            + ` ${Math.round(secondsAt(tick))} of the recording`,
        });
      }
      return {
        kind: "invented for this exercise · a place to send teams",
        name: siteName(t.i),
        sub: `What ${arms[desk].spec.name.toLowerCase()} knows about this place, in the order it`
          + " learned it. The reports and the outcomes are synthetic exercise data.",
        lines,
      };
    }
    if (t.kind === "hazard") {
      const h = hazards[t.i];
      const asSite = siteOf.get(h.id);
      const lines: Line[] = [{
        text: `One patch where the land slipped or where the slipped earth came to rest, about`
          + ` ${Math.round(h.spanM)} metres across, drawn from`
          + ` ${h.rings.reduce((n, r) => n + r.length, 0)} recorded positions.`,
        source: `${str(h.props.observed_by, "Geospatial Information Authority of Japan")}`
          + ` · ${str(h.props.classification, "OBSERVED_PUBLIC")} · ${h.id}`,
      }, {
        text: str(hazardSource?.interpretation,
          "Interpreted from aerial photographs flown after the earthquake."),
        source: `${str(hazardSource?.provider, "Geospatial Information Authority of Japan")}`
          + ` · revision ${str(hazardSource?.revision, "unknown")}`,
      }, {
        text: "The thin outline shows where the agency saw the land slip. The orange scarring"
          + " and the dust inside it are damage this exercise made up, and nobody saw them.",
        // The source line used to point at a file in the repository, which a viewer cannot open.
        // It says the rule instead.
        source: "this page marks every invented thing as invented, wherever it draws one",
        tone: "hot",
      }];
      if (asSite !== undefined) {
        lines.push({
          text: `This zone is also ${siteName(asSite)} in the exercise. Click the panel standing`
            + " over it to read what the desk knows about it.",
          source: "the recorded run · payload.target_feature_id",
          tone: "sig",
        });
      }
      return {
        kind: "a real map file · where the land slipped",
        name: h.id,
        sub: "A real mapped zone. Nothing about people here is observed.",
        lines,
      };
    }
    if (t.kind === "road") {
      const r = roads[t.i];
      return {
        kind: "a real map file · roads that closed",
        name: COPY.REGION.roadName(str(r.props.route_name, r.id), str(r.props.road_kind)),
        sub: `This is ${COPY.REGION.roadKind(str(r.props.road_kind))} in`
          + ` ${str(r.props.municipality)}, ${str(r.props.prefecture)}.`,
        lines: [{
          text: `Status: ${en(r.props.restriction_status) || "not stated in the record"}.`
            + ` Reason: ${en(r.props.restriction_reason) || "not stated"}.`
            + `${r.props.length_km ? ` Length ${r.props.length_km} km.` : ""}`,
          source: `${r.id}, closed because of ${en(r.props.restriction_kind)}`,
          tone: "sig",
        }, {
          text: `The road closed ${str(r.props.restriction_started_at,
            "at a time the record does not give")}.`,
          source: "the ministry wrote this time itself. It was tidied into this format here, and"
            + " nobody made it any more exact than the ministry did",
        }, {
          text: str(roadSource?.name,
            "One official record of which roads could be driven, as they stood at one recorded"
            + " minute."),
          source: `${str(roadSource?.provider, "Ministry of Land, Infrastructure, Transport"
            + " and Tourism")} · captured ${str(roadSource?.snapshot_at, "2026-07-29 12:00 JST")}`,
        }],
      };
    }
    if (t.kind === "shelter") {
      const s = shelters[t.i];
      return {
        kind: "a real map file · places named as shelters",
        name: str(s.props.name, s.id),
        sub: str(s.props.address, ""),
        lines: [{
          text: `Designation: ${str(s.props.designation, "designated").replace(/_/g, " ").toLowerCase()}.`,
          source: `${s.id} · record ${str(s.props.source_feature_id)}`,
        }, {
          text: str(shelterRaw?.disclosure, "A town put this place on a list of shelters, and nothing more."),
          source: `${str(shelterSource?.provider, "Geospatial Information Authority of Japan")}`
            + ` · frozen ${str(shelterSource?.frozen_on, "2026-08-23")}`,
          tone: "hot",
        }],
      };
    }
    if (t.kind === "buildings") {
      const b = buildings;
      const placed = b ? b.tiles.filter((x) => x.ok).length : 0;
      return {
        kind: "one real map: Japan's own model of its cities",
        name: "buildings mapped in Uki City",
        sub: b
          ? `${b.buildings} buildings in ${placed} of ${b.tiles.length} tiles, about`
            + ` ${Math.round(b.spanM)} metres across, at ${b.lon.toFixed(5)} east,`
            + ` ${b.lat.toFixed(5)} north.`
          : "Japan's model of its own cities has not finished loading.",
        lines: [{
          text: "These are real buildings from Japan's open 3D city model, standing where the"
            + " model says they stand. They are context from before the earthquake.",
          source: "Project PLATEAU, run by Japan's ministry for land and transport",
        }, {
          text: "They are never drawn damaged and they are never a rescue site. The exercise's"
            + " four sites sit about 20 kilometres north of this block, and no invented outcome"
            + " is attached to any real building.",
          source: "docs/rescueworld/SPEC.md section 6",
          tone: "hot",
        }, {
          text: "Japan's city model measures height from a mathematical shape of the earth,"
            + " and the tiles measure it from sea level. The two disagree, so the block is set"
            + " down onto the ground here instead of floating above it.",
          source: "app/src/rescueworld/buildings.ts",
        }],
      };
    }
    const inc = events.find((e) => e.type === "WORLD_INITIALIZED")?.payload?.incident as
      Record<string, unknown> | undefined;
    return {
      kind: "one real record: the earthquake struck here",
      name: "the epicentre",
      sub: `${epi[0].toFixed(4)} east, ${epi[1].toFixed(4)} north.`,
      lines: [{
        text: `Magnitude ${num(inc?.magnitude)} on the scale used by Japan's national weather`
          + ` agency, shaking at ${str(inc?.maximum_intensity)} where it was worst, and`
          + ` ${num(inc?.depth_km)} kilometres down.`,
        source: `${str(sourceRow(str(inc?.source_id))?.provider, "Japan Meteorological Agency")}`
          + ` · ${str(inc?.occurred_at)}`,
      }, {
        text: "The United States Geological Survey, which studies earthquakes for the"
          + " government of the United States, puts the same earthquake at 6.8 on a different"
          + " scale. Both numbers are current.",
        source: "the two agencies measure the same shaking on two different scales",
      }],
    };
  }

  let panelDrawn = "";
  function drawPanel() {
    if (!selected) {
      closeBox(panel);
      panelClose.classList.remove("on");
      panelDrawn = "";
      return;
    }
    // the panel answers the run as it plays, so it is rebuilt when the moment or the
    // selection changes and never once per frame
    const key = `${selected.kind}:${(selected as { i?: number }).i ?? 0}`
      + `:${desk}:${Math.min(TICKS, Math.floor(P.tick))}`;
    if (key === panelDrawn) return;
    panelDrawn = key;
    const d = describe(selected);
    el("panelKind").textContent = d.kind;
    el("panelName").textContent = d.name;
    el("panelSub").textContent = d.sub;
    const box = el("panelLines");
    box.textContent = "";
    for (const line of d.lines) {
      const row = document.createElement("div");
      row.className = `pl${line.tone ? ` ${line.tone}` : ""}`;
      const b = document.createElement("b");
      b.textContent = line.text;
      const u = document.createElement("u");
      u.textContent = line.source;
      row.append(b, u);
      box.append(row);
    }
    if (!panel.classList.contains("on")) openBox(panel);
    panelClose.classList.add("on");
    panel.scrollTop = 0;
  }
  /**
   * The scan pulse's own clock. It counts the seconds since the selection was made, which is an
   * interaction and not a moment in the run — exactly like the bracket reveals above. Nothing
   * here touches the replay: the world's state stays a pure function of the playback tick, the
   * ring is gone again within two and a half seconds, and `window.__HERO.state()` never sees it.
   */
  const SCAN_SECONDS = 1.5, SCAN_TAIL = 0.9;
  let scanAge = -1;
  function fireScan(t: Target | null) {
    if (!t) {
      scanAge = -1;
      groundMat.uniforms.uScanAge.value = -1;
      return;
    }
    const at = targetPos(t);
    (groundMat.uniforms.uScanAt.value as THREE.Vector2).set(
      at.x / frame.mapW + 0.5, 0.5 - at.z / frame.mapD);
    scanAge = 0;
    groundMat.uniforms.uScanAge.value = 0;
  }

  function select(t: Target | null) {
    const changed = !selected !== !t
      || (!!selected && !!t && (selected.kind !== t.kind
        || (selected as { i?: number }).i !== (t as { i?: number }).i));
    if (t && changed) fireScan(t);
    if (!t) fireScan(null);
    if (changed && t && panel.classList.contains("on")) {
      // a new selection is a new answer, so the panel opens again rather than swapping text
      panel.classList.remove("on", "opening", "ready", "closing");
    }
    selected = t;
    hazardLines.setSelected(t && t.kind === "hazard" ? t.i : -1);
    roadLines.setSelected(t && t.kind === "road" ? t.i : -1);
    buildings?.setSelected(!!t && t.kind === "buildings");
    drawPanel();
  }
  panelClose.addEventListener("click", () => select(null));

  // ------------------------------------------------------------------ the report feed
  /**
   * One report card, in the words the copy deck writes for that kind of source. The card is
   * built from the recorded ingest event and from nothing else: the source's own label, the
   * number it states, the place it names, and how long before this round it spoke.
   */
  function reportCardOf(e: Ev, roundSeconds: number): COPY.ReportCard | null {
    if (e.type !== "SOURCE_INGESTED") return null;
    const p = e.payload ?? {};
    const age = Math.max(0, roundSeconds - e.sim_time_s);
    const claim = p.claim as Record<string, unknown> | undefined;
    if (claim) {
      return COPY.simulatedReportCard({
        sourceType: str(p.source_type),
        sourceLabel: str(p.source_label, e.actor.id),
        value: num(claim.value),
        site: COPY.siteName(siteIdx(e)),
        ageSeconds: age,
        observationId: str(p.observation_id, e.event_id),
      });
    }
    if (p.report_id) {
      return COPY.agencyUpdateCard({
        serial: str(p.serial),
        magnitude: str(p.magnitude),
        maxIntensity: str(p.max_intensity),
        stationCount: num(p.station_count),
        reportedAt: str(p.report_datetime),
        reportId: str(p.report_id),
      });
    }
    if (p.restriction_id) {
      return COPY.roadRestrictionCard({
        routeName: COPY.REGION.roadName(str(p.route_name, str(p.restriction_id)),
          str(p.road_kind)),
        municipality: str(p.municipality),
        prefecture: str(p.prefecture),
        reason: en(p.restriction_reason),
        lengthKm: typeof p.length_km === "number" ? p.length_km : null,
        startedAt: str(p.restriction_started_at),
        restrictionId: str(p.restriction_id),
      });
    }
    const source = e.actor.id;
    if (typeof p.designation_record_count === "number") {
      return COPY.shelterLayerCard({
        designationRecordCount: num(p.designation_record_count),
        uniqueLocationCount: num(p.unique_location_count),
        designatedShelterCount: num(p.designated_shelter_count),
        earthquakeEvacuationPlaceCount: num(p.earthquake_evacuation_place_count),
        sourceId: source,
      });
    }
    if (typeof p.feature_count === "number") {
      if (p.snapshot_at) {
        return COPY.roadLayerCard({
          featureCount: num(p.feature_count),
          snapshotAt: str(p.snapshot_at),
          sourceId: source,
        });
      }
      return COPY.hazardLayerCard({ featureCount: num(p.feature_count), sourceId: source });
    }
    return null;
  }

  /**
   * The locator holds what arrived: the three most recent reports of the round the run is in,
   * each naming its own class of source. The four classes — the simulated exercise reports, the
   * official agency updates, the road-status ingests and the layer ingests — are never blended
   * into one another, which is the published rule the blueprint quotes for this region. Every
   * line flies the camera to the place it describes. Lines dim as playback time passes rather
   * than disappearing, so a paused frame keeps the round readable.
   *
   * Each line carries the report's own headline and the class it came from, and nothing else.
   * It used to carry the report's whole sentence, the minutes since it arrived and the file
   * identifier the record gave it, which told the unfolding story a second time in the corner
   * of the frame and printed a machine identifier at a viewer. The story is told once now, in
   * the panel over the decision rail. The claim sentence each report carries stays available
   * to a verifier through `window.__HERO.state().alerts`.
   */
  const feed = el("feedRows");
  const feedRows = new Map<string, HTMLElement>();
  let feedDrawn = "";
  let liveAlerts: { text: string; kind: string; born: number }[] = [];
  function drawFeed(tick: number) {
    const arm = arms[desk];
    const r = rounds[desk][roundAt(tick, desk)];
    const last = Math.min(tick, r.end);
    const items: { e: Ev; born: number; card: COPY.ReportCard }[] = [];
    for (let i = 0; i < arm.order.length; i++) {
      const t = arm.evTick[i];
      if (t < r.start || t > last) continue;
      const card = reportCardOf(arm.order[i], r.simTimeS);
      if (card) items.push({ e: arm.order[i], born: t, card });
    }
    const live = items.slice(-3);
    liveAlerts = live.map((a) => ({
      text: `${a.card.name} — ${a.card.claim}`, kind: a.card.tag, born: a.born,
    }));
    // A card that is already on screen keeps its own element, so a new arrival never restarts
    // everybody's opening gesture and a card that is only dimming is never rebuilt.
    const key = live.map((a) => a.e.event_id).join("|") || "no reports";
    const sameSet = key === feedDrawn;
    feedDrawn = key;
    const fresh: HTMLElement[] = [];
    const wanted: HTMLElement[] = [];
    for (const a of live) {
      let row = feedRows.get(a.e.event_id);
      if (!row) {
        const target = evTarget.get(a.e.event_id) ?? null;
        row = document.createElement("div");
        row.className = `alert k-${a.card.klass}`;
        const brackets = document.createElement("div");
        brackets.className = "rv";
        for (const corner of ["tl", "tr", "bl", "br"]) {
          const mark = document.createElement("i");
          mark.className = corner;
          brackets.append(mark);
        }
        const body = document.createElement("div");
        body.className = "rvbody";
        const name = document.createElement("b");
        name.textContent = a.card.name;
        // the minute it arrived, because the record publishes four separate updates under the
        // same serial number and the time is the only thing that tells them apart
        const em = document.createElement("em");
        em.textContent = a.card.age;
        const meta = document.createElement("div");
        meta.className = "meta";
        const tag = document.createElement("span");
        tag.className = "pill";
        tag.textContent = a.card.tag;
        meta.append(tag);
        // A card whose place stands off the terrain cut says so, and sends the camera to the
        // whole ground rather than to ground the world does not hold. A closure recorded in
        // another prefecture — the record holds one in Shiiba Village in Miyazaki — has no line
        // on this map at all, so the road layer is asked as well as the coordinate.
        const rid = str(a.e.payload?.restriction_id);
        const away = (rid !== "" && !roadOf.has(rid))
          || (target !== null && !onMap(targetPos(target)));
        if (away) {
          const mark = document.createElement("span");
          mark.className = "pill";
          mark.textContent = OFF_MAP_TAG;
          meta.append(mark);
        }
        body.append(name, em, meta);
        row.append(brackets, body);
        if (target || away) {
          row.addEventListener("click", () => {
            if (away || !target) { rig.goHome(); select(target); return; }
            const p = targetPos(target);
            rig.flyTo(p.x, p.y, p.z, Math.min(0.55, rig.pose().dist), 1.1);
            select(target);
          });
        }
        feedRows.set(a.e.event_id, row);
        fresh.push(row);
      }
      row.style.opacity = String(1 - 0.45 * clamp((tick - a.born) / ALERT_LIFE));
      wanted.push(row);
    }
    if (sameSet && !fresh.length) return;
    for (const [id, row] of feedRows) {
      if (!wanted.includes(row)) { row.remove(); feedRows.delete(id); }
    }
    feed.textContent = "";
    for (const row of wanted) feed.append(row);
    // Where the run is walked act by act, the region's own lines and the story cards over their
    // places are narrating the whole time, so a stretch with no new report says nothing rather
    // than leaving a line of text explaining its own emptiness.
    if (wanted.length === 0 && !walkActs) {
      const empty = document.createElement("div");
      empty.id = "feedEmpty";
      empty.textContent = COPY.FEED_EMPTY;
      feed.append(empty);
    }
    for (const row of fresh) fitCorners(row);
    requestAnimationFrame(() => {
      for (const row of fresh) row.classList.add("opening");
      setTimeout(() => { for (const row of fresh) row.classList.add("ready"); }, 150);
    });
  }

  /**
   * The rest of the region, under the reports. It is the same pattern as the feed above and it
   * obeys the same law: what is on screen is derived from the current tick, so a seek backwards
   * shows the lines that stretch of the record holds instead of stacking up everything already
   * passed. Clicking a line sends the camera to the place that recorded minute happened at.
   *
   * One recorded minute can bring more lines than the panel shows — the road file records eleven
   * closures beginning at 19:00 — so the last row states how many more the same stretch holds
   * rather than dropping them silently.
   */
  const beatsBox = el("beats");
  const beatRows = new Map<string, HTMLElement>();
  let beatsDrawn = "";
  let liveBeatTexts: string[] = [];
  function flyToRegionBeat(b: RegionBeat) {
    if (!onMap(b.at)) { rig.goHome(); return; }
    rig.flyTo(b.at.x, b.at.y, b.at.z, Math.min(b.dist, rig.pose().dist), 1.1);
  }
  function drawBeats(tick: number) {
    const inWindowNow = beatsAt(tick);
    const live = inWindowNow.slice(-BEAT_SHOWN);
    const hidden = inWindowNow.length - live.length;
    liveBeatTexts = live.map((b) => b.text);
    const key = `${live.map((b) => b.id).join("|")}#${hidden}`;
    const sameSet = key === beatsDrawn;
    beatsDrawn = key;
    const fresh: HTMLElement[] = [];
    const wanted: HTMLElement[] = [];
    for (const b of live) {
      let row = beatRows.get(b.id);
      if (!row) {
        row = document.createElement("div");
        row.className = `rbeat b-${b.kind}`;
        row.title = b.tip;
        const span = document.createElement("span");
        span.textContent = b.text;
        const em = document.createElement("em");
        em.textContent = b.stamp;
        row.append(span, em);
        if (!onMap(b.at)) {
          const mark = document.createElement("span");
          mark.className = "pill";
          mark.textContent = OFF_MAP_TAG;
          row.append(mark);
        }
        row.addEventListener("click", () => flyToRegionBeat(b));
        beatRows.set(b.id, row);
        fresh.push(row);
      }
      row.style.opacity = String(1 - 0.45 * clamp((tick - b.tick) / BEAT_LIFE));
      wanted.push(row);
    }
    if (sameSet && !fresh.length) return;
    for (const [id, row] of beatRows) {
      if (!wanted.includes(row)) { row.remove(); beatRows.delete(id); }
    }
    beatsBox.textContent = "";
    if (wanted.length) {
      const head = document.createElement("div");
      head.id = "beatsHead";
      head.textContent = COPY.REGION.head;
      beatsBox.append(head);
      for (const row of wanted) beatsBox.append(row);
      if (hidden > 0) {
        const more = document.createElement("div");
        more.id = "beatsMore";
        more.textContent = COPY.REGION.more(hidden);
        beatsBox.append(more);
      }
    }
    requestAnimationFrame(() => {
      for (const row of fresh) row.classList.add("opening");
    });
  }

  // ------------------------------------------------------------------ the decision rail
  /**
   * Every claim version the run records, with the value it states and the verdict the shared
   * evidence comparison gave it. A dispatch card names the version that authorized it, and this
   * is where that version's own numbers are read from.
   */
  const claimVersions = new Map<string, { value: number; site: number; comparison: string }>();
  for (const e of events) {
    if (e.type !== "CLAIM_STATE_CHANGED") continue;
    const id = str(e.payload?.claim_version_id);
    if (!id) continue;
    const prior = claimVersions.get(id);
    const comparison = str(e.payload?.comparison_verdict, prior?.comparison ?? "NOT_EVALUATED");
    claimVersions.set(id, {
      value: num(e.payload?.value, prior?.value ?? 0),
      site: siteIdx(e) >= 0 ? siteIdx(e) : prior?.site ?? -1,
      comparison,
    });
  }

  /**
   * A round is decisive when the desk settles something in it: it proposes where the teams go,
   * it sends one, or a team arrives. The rail opens itself on those rounds, and stays collapsed
   * to the claim lines on the rest, so the ground keeps the frame.
   */
  const decisive: boolean[][] = arms.map((arm, k) => rounds[k].map((r) =>
    arm.order.some((e, i) => e.arm === arm.spec.id
      && arm.evTick[i] >= r.start && arm.evTick[i] <= r.end
      && (e.type === "DECISION_PROPOSED" || e.type === "RESOURCE_DISPATCHED"
        || e.type === "OUTCOME_OBSERVED"))));

  interface RailClaim { line: string; stamp: string; reason: string; id: string; struck: boolean }
  interface RailDispatch {
    line: string; authority: string; status: string; id: string; site: number;
  }

  const rail = el("rail"), railBody = el("railBody"), railNote = el("railNote");
  // the decision-rail title belongs to the incident record's eleven decision
  // rows; the exercise and demo logs carry no such rows, and a title over an
  // empty box reads as something broken
  if (!walkActs) el("railHead").style.display = "none";
  let railDrawn = "";
  function railCards(tick: number): { claims: RailClaim[]; dispatches: RailDispatch[] } {
    const arm = arms[desk];
    const byVersion = new Map<string, RailClaim>();
    const dispatches: RailDispatch[] = [];
    for (let i = 0; i < arm.order.length; i++) {
      const e = arm.order[i];
      if (e.arm !== arm.spec.id || arm.evTick[i] > tick) continue;
      const p = e.payload ?? {};
      if (e.type === "CLAIM_STATE_CHANGED") {
        const id = str(p.claim_version_id);
        const verdict = str(p.verdict, "NOT_EVALUATED");
        const words = COPY.verdictWords(verdict);
        byVersion.set(id, {
          line: COPY.claimLine(num(p.value), COPY.siteName(siteIdx(e))),
          stamp: words.stamp, reason: words.reason, id,
          struck: verdict === "REJECTED",
        });
      }
      if (e.type === "RESOURCE_DISPATCHED") {
        const site = COPY.siteName(siteIdx(e));
        const cv = str(p.authorizing_claim_version_id);
        const claim = claimVersions.get(cv);
        dispatches.push({
          line: COPY.dispatchLine(COPY.teamName(str(p.resource_id)), site),
          authority: COPY.dispatchAuthority(claim ? claim.value : 0, site),
          status: COPY.dispatchStatus(claim ? claim.comparison : "UNRESOLVED"),
          id: `${str(p.dispatch_id)} · ${cv}`,
          site: siteIdx(e),
        });
      }
    }
    return { claims: [...byVersion.values()], dispatches };
  }

  /**
   * The decision rail for the run that replays the whole incident. That record holds no claim
   * cards and no dispatch cards, so the rail carries the thing the record does hold: the
   * moments when somebody had to decide something. Each one names its own clock, the person
   * the record says had to make it, and how many recorded ways of deciding were run against it
   * afterwards. The moments already passed stand quietly; the one coming next stands out.
   * Clicking one flies to the place it happened.
   */
  interface DecisionRow {
    tick: number; clock: string; title: string; decider: string; ways: string;
    id: string; at: THREE.Vector3 | null;
    /** true where this moment carries the registered experiment rather than a description */
    registered: boolean;
    /** the one sentence saying what the simulated desk finally chose here */
    chose: string;
    /**
     * The one operational reason under that action: the first report the recorded answer weighed,
     * in the record's own plain words. Empty where that answer weighed no report this moment's
     * own list holds.
     */
    reason: string;
    /**
     * The leading fact nobody had by this deadline, which is the seventh of the seven questions
     * the action-first contract says a viewer must be able to answer without opening anything.
     */
    unknown: string;
    /** the grade that answer earned, in the story template's own words */
    verdict: string;
    /** what the check found on that answer, already translated into plain words */
    findings: string[];
    /** true where the final answer passed every prewritten check */
    passed: boolean;
    /** the eight recorded tries of this moment, or nothing where it carries none */
    strip: StripReading | null;
  }
  /**
   * The eight recorded tries behind the answer a moment's row shows, read from the registered
   * contract and from nowhere else. A moment outside the frozen experiment has none, and its row
   * gets outlined cells and its own badge rather than a count.
   */
  const stripFor = (slotId: string, method: string): StripReading | null => {
    const held = highlights?.method(slotId, method) ?? null;
    return held ? stripOf(held) : null;
  };
  /**
   * The one reason line that stands under an action, read off the same recorded answer the
   * action came from.
   *
   * `docs/rescueworld/ACTION-FIRST-PRESENTATION-CONTRACT.md` puts the operational reason directly
   * after the action. The reason is the first report that answer wrote a weighing for, said in
   * the record's own plain words with the weighing it gave it. Where the answer weighed nothing
   * this moment's own list of reports holds, there is no reason line and the unknown below it
   * stands alone.
   *
   * Nothing here writes a sentence. It is a sentence `trace.ts` already built out of the sealed
   * record, so the rail, the map and the story cards can never describe one answer three ways.
   */
  function reasonLineOf(desk: TraceDesk | null): string {
    const first = desk?.factors.find((factor) => factor.known);
    return first ? `${first.sentence} ${first.state}` : "";
  }
  /**
   * The leading fact nobody had by this deadline, in the record's own plain words.
   *
   * It is the seventh of the seven questions the contract's cold-reader test asks, and the
   * contract puts it directly under the reason. The moment's own required unknowns are read in
   * the record's order, so the same moment always shows the same one.
   */
  function unknownLineOf(trace: AgentTrace | null): string {
    return trace?.known.unknowns[0]?.sentence ?? "";
  }
  const decisionRows: DecisionRow[] = !walkActs ? [] : events
    .filter((e) => e.type === "DECISION_PROPOSED")
    .map((e) => {
      const slot = e.payload?.decision_slot as
        { decision_slot_id?: string; title?: string; decider?: string; cutoff_at?: string }
        | undefined;
      const demo = e.payload?.full_incident_demonstration as
        { choices?: { graph_id?: string }[] } | undefined;
      const graphs = new Set<string>();
      for (const choice of demo?.choices ?? []) if (choice.graph_id) graphs.add(choice.graph_id);
      const coords = e.geometry?.type === "Point" && Array.isArray(e.geometry.coordinates)
        ? e.geometry.coordinates as [number, number] : null;
      const at = coords ? groundOf(coords[0], coords[1]) : null;
      // where a moment names no deadline of its own, the record's own wall clock for that
      // moment stands in for it
      const story = e.payload?.story as { real_clock?: string } | undefined;
      const id = str(slot?.decision_slot_id, e.event_id);
      // What the agents did here comes out of the walk-through this page already built, so the
      // row and the walk-through can never say two different things about one moment.
      const trace = traceOf.get(id) ?? null;
      const final = trace?.final ?? null;
      return {
        registered: !!e.payload?.registered_five_slot_experiment,
        tick: tickAt(e),
        clock: COPY.clockOf(str(slot?.cutoff_at, str(story?.real_clock))),
        title: GLOSS.plainSlotTitle(id, str(slot?.title, "Someone had to decide here.")),
        decider: GLOSS.plainDecider(id, str(slot?.decider)),
        ways: COPY.countWord(graphs.size),
        id,
        at: at && onMap(at) ? at : null,
        // The row leads with what the agents chose to do, composed by the same `actionOf` the
        // decision tree and the ledger already read this answer through. It used to lead with
        // `finalLead`, which counts units without naming one place — the sentence the joint
        // audit named as the product's central failure.
        chose: final ? actionOf(final) : "",
        reason: reasonLineOf(final),
        unknown: unknownLineOf(trace),
        verdict: final?.badge ?? "",
        findings: findingsOf(final),
        passed: final?.passed === true,
        strip: stripFor(id, FINAL_METHOD),
      };
    });

  /**
   * How long a resolved decision holds the largest sentence on the page, in ticks.
   *
   * It is the same window the map keeps the decision's own picture for, so the sentence and the
   * picture arrive and leave together and a reader never reads one against the other.
   */
  const DECISION_FOREGROUND = 34;
  /**
   * The decision this tick has just resolved, or nothing where none has.
   *
   * The rows are already in recorded time order, so the last one whose deadline has passed
   * inside the window is the one the story panel leads with. It is a pure function of the tick,
   * so seeking to the same tick always produces the same sentence.
   */
  function resolvedDecisionAt(tick: number): DecisionRow | null {
    let held: DecisionRow | null = null;
    for (const row of decisionRows) {
      if (row.tick <= tick && tick - row.tick <= DECISION_FOREGROUND) held = row;
    }
    return held;
  }
  /**
   * Which rows have opened the block that says how their action was tested.
   *
   * The rail is rewritten whenever the run passes another deadline, so what a reader opened has
   * to outlive the rows themselves. It is keyed by the moment rather than by the row's position,
   * because the rows are rebuilt from the record every time.
   */
  const railTested = new Set<string>();
  function drawIncidentRail(tick: number) {
    const passed = decisionRows.filter((row) => row.tick <= tick).length;
    const key = `incident:${passed}:${selected ? 1 : 0}:${[...railTested].sort().join(",")}`;
    if (key === railDrawn) return;
    railDrawn = key;
    // the rows are being replaced, so any reason list standing open inside one goes with them
    closeAllReasons();
    railBody.textContent = "";
    const lead = document.createElement("p");
    lead.className = "raillead";
    lead.textContent = COPY.INCIDENT.rail.lead(decisionRows.length);
    railBody.append(lead);
    decisionRows.forEach((row, i) => {
      const gone = i < passed;
      const next = i === passed;
      const box = document.createElement("div");
      // The row wears no verdict colour at rest. A bar down the left edge in the pass or fail
      // colour made a grade the first thing a reader met, before the action it is a grade of, and
      // the action-first contract keeps the result behind the action. The verdict is still on the
      // face of the row as its own badge, which carries text and shape as well as colour.
      box.className = next ? "dispatch" : "claim";
      const head = document.createElement("div");
      head.className = "cl";
      const line = document.createElement("p");
      line.textContent = row.title;
      const stamp = document.createElement("span");
      stamp.className = `stamp${next ? "" : " off"}`;
      stamp.textContent = row.clock;
      head.append(line, stamp);
      const why = document.createElement("div");
      why.className = "why";
      why.textContent = row.decider ? COPY.INCIDENT.rail.decider(row.decider) : "";
      const where = document.createElement("div");
      where.className = "route";
      where.textContent = gone ? COPY.INCIDENT.rail.passed
        : next ? COPY.INCIDENT.rail.next : COPY.INCIDENT.rail.ahead;
      box.append(head, why, where);
      // ---- the action. It is the reason this row exists, so it stands directly under the
      // situation and above everything the experiment recorded about it.
      if (row.chose) {
        const chose = document.createElement("p");
        chose.className = "chose";
        chose.textContent = row.chose;
        box.append(chose);
      }
      // ---- the one reason under that action, then the leading fact nobody had by the deadline.
      // Those are the fourth and fifth things the contract asks for, and together they are the
      // last two of the seven questions a cold reader must be able to answer here.
      for (const line of [row.reason, row.unknown]) {
        if (!line) continue;
        const said = document.createElement("div");
        said.className = "why";
        said.textContent = line;
        box.append(said);
      }
      // ---- the one verdict. The grade itself stays on the face of the row; everything that
      // counts tries moves behind the press below it.
      if (row.verdict) box.append(verdictBadge(row.verdict, row.findings));
      // ---- how that action was tested. The eight recorded tries, what the five cell states
      // mean, and what a grade is about all live here, behind one deliberate press, because the
      // action-first contract keeps method identity, seed counts and `N of 8` results out of the
      // default reading. The block is written into the row either way and hidden while it is
      // shut, so a gate counting cells reads the same eleven rows a reader can open.
      const shown = railTested.has(row.id);
      const tested = document.createElement("button");
      tested.type = "button";
      // the same control style the row's walk-through button already wears, so the row carries
      // one kind of control rather than two
      tested.className = "traceopen";
      tested.textContent = shown ? COPY.TREE.testedOpen : COPY.TREE.tested;
      tested.setAttribute("aria-expanded", shown ? "true" : "false");
      tested.addEventListener("click", (e) => {
        e.stopPropagation();
        if (shown) railTested.delete(row.id); else railTested.add(row.id);
        railDrawn = "";
        drawIncidentRail(tick);
      });
      const evidence = document.createElement("div");
      evidence.className = "railtested";
      evidence.style.display = shown ? "block" : "none";
      // The eight recorded tries, drawn beside the grade and never merged into it. A moment
      // outside the frozen experiment gets outlined cells and no count at all.
      evidence.append(stripNode(row.registered ? row.strip : null));
      // What the five cell states mean, said once on this surface, beside the first row that
      // carries them rather than over a screen that has none of them open.
      if (i === 0) evidence.append(stripLegendNote());
      if (row.verdict) evidence.append(badgeScopeNote());
      // a moment outside the registered experiment says so on its own face, so its numbers are
      // never read as part of the registered result
      if (!row.registered) {
        const badge = document.createElement("div");
        badge.className = "route";
        badge.textContent = COPY.INCIDENT.badge.descriptive;
        evidence.append(badge, descriptiveNote());
      }
      box.append(tested, evidence);
      if (row.at) {
        box.style.cursor = "pointer";
        box.addEventListener("click", () => {
          rig.flyTo(row.at!.x, row.at!.y, row.at!.z, Math.min(0.62, rig.pose().dist), 1.1);
          handsOffDirection();
        });
      }
      // The walk-through of this moment: what was known, what each way of working proposed, what
      // the check caught, and what the real responders did. It is the point of the whole page, so
      // every moment that has one carries its own control rather than hiding behind a key.
      if (traceExists(row.id)) {
        const open = document.createElement("button");
        open.type = "button";
        open.className = "traceopen";
        open.textContent = COPY.TRACE.open;
        open.addEventListener("click", (e) => {
          e.stopPropagation();
          if (row.at) {
            rig.flyTo(row.at.x, row.at.y, row.at.z, Math.min(0.62, rig.pose().dist), 1.1);
          }
          handsOffDirection();
          openTraceFor(row.id);
        });
        box.append(open);
      }
      railBody.append(box);
    });
    railNote.textContent = COPY.INCIDENT.rail.note;
  }

  function drawRail(tick: number) {
    if (walkActs) { drawIncidentRail(tick); return; }
    const open = !!selected || decisive[desk][roundAt(tick, desk)];
    const { claims, dispatches } = railCards(tick);
    const key = `${desk}:${open ? 1 : 0}:${selected ? 1 : 0}`
      + `:${claims.map((c) => `${c.id}${c.stamp}`).join(",")}`
      + `:${dispatches.map((d) => d.id).join(",")}`;
    if (key === railDrawn) return;
    railDrawn = key;
    railBody.textContent = "";
    for (const c of claims) {
      const box = document.createElement("div");
      box.className = `claim${c.struck ? " struck" : ""}`;
      const cl = document.createElement("div");
      cl.className = "cl";
      const line = document.createElement("p");
      line.textContent = c.line;
      const stamp = document.createElement("span");
      stamp.className = `stamp${c.stamp === "Supported" ? "" : " off"}`;
      stamp.textContent = c.stamp;
      cl.append(line, stamp);
      box.append(cl);
      if (open) {
        const why = document.createElement("div");
        why.className = "why";
        why.textContent = c.reason;
        const ident = document.createElement("div");
        ident.className = "id";
        ident.textContent = c.id;
        box.append(why, ident);
      }
      railBody.append(box);
    }
    for (const d of dispatches) {
      const box = document.createElement("div");
      box.className = "dispatch";
      const cl = document.createElement("div");
      cl.className = "cl";
      const line = document.createElement("p");
      line.textContent = d.line;
      cl.append(line);
      box.append(cl);
      if (open) {
        const why = document.createElement("div");
        why.className = "why";
        why.textContent = d.authority;
        const status = document.createElement("div");
        status.className = "why";
        status.textContent = d.status;
        const ident = document.createElement("div");
        ident.className = "id";
        ident.textContent = d.id;
        const route = document.createElement("div");
        route.className = "route";
        route.textContent = COPY.ILLUSTRATIVE_ROUTE;
        box.append(why, status, ident, route);
      }
      if (d.site >= 0) {
        box.style.cursor = "pointer";
        box.addEventListener("click", () => {
          const at = targetPos({ kind: "site", i: d.site });
          if (onMap(at)) rig.flyTo(at.x, at.y, at.z, Math.min(0.55, rig.pose().dist), 1.1);
          else rig.goHome();
          select({ kind: "site", i: d.site });
        });
      }
      railBody.append(box);
    }
    railNote.textContent = selected ? "" : COPY.STATES.emptySelection;
  }

  // ------------------------------------------------------------------ the consequence caption
  /**
   * What the team found, stated at the place it found it. The caption rides the site's own
   * screen position while the arrival event is the live one, and it carries the stamp that keeps
   * simulated damage labelled as simulated wherever it is drawn.
   */
  const captionBox = el("caption");
  let captionDrawn = "";
  function drawCaption(e: Ev | null, x: number, y: number, onScreen: boolean) {
    // The caption states what a team found when it arrived, which is a sentence only the
    // two-desk exercise records. Where the run is walked act by act, the story cards standing
    // over their own places are what narrates, so no caption is raised.
    const live = e && e.type === "OUTCOME_OBSERVED" && onScreen && !split && !walkActs;
    if (!live) {
      captionBox.classList.remove("on");
      captionDrawn = "";
      return;
    }
    const site = siteIdx(e);
    const key = `${e.event_id}:${desk}`;
    if (key !== captionDrawn) {
      captionDrawn = key;
      const dispatch = arms[desk].order.find((d) => d.type === "RESOURCE_DISPATCHED"
        && d.arm === arms[desk].spec.id && siteIdx(d) === site);
      const cv = str(dispatch?.payload?.authorizing_claim_version_id);
      const claim = claimVersions.get(cv);
      const onRejected = claim ? claim.comparison === "REJECTED" : false;
      el("captionText").textContent = COPY.arrivalCaption({
        team: COPY.teamName(str(dispatch?.payload?.resource_id, "assessment-team-01")),
        site: COPY.siteName(site),
        found: num(e.payload?.exercise_people_reached),
        claimed: claim ? claim.value : 0,
        onRejectedClaim: onRejected,
      });
      // The shortage is stated where it bites: the desk that spent a team on a rejected claim
      // has no team left for the site whose claim two sources agreed on.
      el("captionMore").textContent = onRejected ? COPY.SCARCITY : "";
      el("captionMore").style.display = onRejected ? "block" : "none";
      el("captionStamp").textContent = COPY.SIMULATED_DAMAGE;
    }
    captionBox.style.left = `${Math.round(x)}px`;
    captionBox.style.top = `${Math.round(y)}px`;
    captionBox.classList.add("on");
  }

  // ------------------------------------------------------------------ picking
  const v3 = new THREE.Vector3();
  function toScreen(p: THREE.Vector3) {
    v3.copy(p).project(cam);
    const stageW = split ? (W / 2 - GUT) : W;
    const ox = split && desk === 1 ? W / 2 + GUT : 0;
    return {
      x: ox + (v3.x * 0.5 + 0.5) * stageW,
      y: (1 - (v3.y * 0.5 + 0.5)) * H,
      infront: v3.z < 1,
    };
  }
  function pickAt(cx: number, cy: number): Target | null {
    // the camera's own matrices are refreshed by the renderer once a frame; a click that
    // lands between a camera move and the next frame must still be answered against where
    // the camera is now, not where it was
    cam.updateMatrixWorld();
    cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    let best: Target | null = null, bestD = 30 * 30, bestRank = 9;
    const test = (p: THREE.Vector3, t: Target, rank: number, reach: number) => {
      const s = toScreen(p);
      if (!s.infront) return;
      const d = (s.x - cx) * (s.x - cx) + (s.y - cy) * (s.y - cy);
      if (d > reach * reach) return;
      if (rank < bestRank || (rank === bestRank && d < bestD)) {
        best = t; bestD = d; bestRank = rank;
      }
    };
    for (let i = 0; i < sites.length; i++) test(targetPos({ kind: "site", i }), { kind: "site", i }, 0, 34);
    for (let i = 0; i < hazards.length; i++) {
      test(targetPos({ kind: "hazard", i }), { kind: "hazard", i }, 1, 22);
    }
    for (let i = 0; i < shelters.length; i++) {
      test(targetPos({ kind: "shelter", i }), { kind: "shelter", i }, 2, 16);
    }
    // a road is a line, so every one of its recorded positions is a place to click
    for (let i = 0; i < roads.length; i++) {
      const line = roads[i].line;
      const stepBy = Math.max(1, Math.floor(line.length / 60));
      for (let k = 0; k < line.length; k += stepBy) {
        const [lon, lat] = line[k];
        test(new THREE.Vector3(frame.x(lon), terrain.heightAtLonLat(lon, lat) + 0.006,
          frame.z(lat)), { kind: "road", i }, 3, 14);
      }
    }
    if (buildings) test(buildings.centre, { kind: "buildings" }, 2, 26);
    test(epiPos, { kind: "epicentre" }, 4, 20);
    return best;
  }

  let downAt: { x: number; y: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return;                       // that was a drag, not a click
    select(pickAt(e.clientX, e.clientY));
  });

  // ------------------------------------------------------------------ the mini-map
  const mini = el("minicv") as HTMLCanvasElement;
  const miniCtx = mini.getContext("2d")!;
  const miniBase = document.createElement("canvas");
  miniBase.width = terrain.thumb.w; miniBase.height = terrain.thumb.h;
  {
    const bctx = miniBase.getContext("2d")!;
    const img = bctx.createImageData(terrain.thumb.w, terrain.thumb.h);
    img.data.set(terrain.thumb.data);
    bctx.putImageData(img, 0, 0);
  }
  mini.width = terrain.thumb.w; mini.height = terrain.thumb.h;
  const miniXY = (x: number, z: number) => ({
    x: (x / frame.mapW + 0.5) * mini.width,
    y: (0.5 - z / frame.mapD) * mini.height,
  });
  function drawMini() {
    miniCtx.clearRect(0, 0, mini.width, mini.height);
    miniCtx.drawImage(miniBase, 0, 0);
    // the sites, and the one thing happening now
    miniCtx.fillStyle = "rgba(233,237,242,.85)";
    for (const s of sites) {
      const p = miniXY(s.x, s.z);
      miniCtx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    if (buildings) {
      const p = miniXY(buildings.centre.x, buildings.centre.z);
      miniCtx.fillStyle = "rgba(233,237,242,.55)";
      miniCtx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    // the camera's own view, drawn on the map as the shape it covers on the ground. A corner
    // whose ray meets no ground — the camera is looking above the horizon — runs out along
    // that ray instead. The corners are left where they truly fall and the canvas does the
    // clipping, so a view wider than the whole map reads as covering the whole map.
    const p = rig.pose();
    const corners: { x: number; y: number }[] = [];
    for (const [nx, ny] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as [number, number][]) {
      const hit = rig.groundHit(nx * 0.98, ny * 0.98);
      if (hit) { corners.push(miniXY(hit.x, hit.z)); continue; }
      const d = rig.rayDir(nx * 0.98, ny * 0.98);
      const reach = frame.mapD * 2.4;
      corners.push(miniXY(p.tx + d.x * reach, p.tz + d.z * reach));
    }
    // A view wider than the whole ground would otherwise be drawn as long diagonals running
    // off the corner of the mini-map. The shape is cut against the map's own edges instead,
    // so a camera that sees everything draws the whole map and a camera over one valley
    // draws that valley.
    const inside = (p: { x: number; y: number }, side: number) =>
      side === 0 ? p.x >= 0.5 : side === 1 ? p.x <= mini.width - 0.5
        : side === 2 ? p.y >= 0.5 : p.y <= mini.height - 0.5;
    const cross = (a: { x: number; y: number }, b: { x: number; y: number }, side: number) => {
      const edge = side === 0 ? 0.5 : side === 1 ? mini.width - 0.5
        : side === 2 ? 0.5 : mini.height - 0.5;
      const t = side < 2
        ? (edge - a.x) / ((b.x - a.x) || 1e-9)
        : (edge - a.y) / ((b.y - a.y) || 1e-9);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };
    let poly = corners;
    for (let side = 0; side < 4 && poly.length; side++) {
      const next: { x: number; y: number }[] = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[(i + poly.length - 1) % poly.length], b = poly[i];
        const ain = inside(a, side), bin = inside(b, side);
        if (bin) {
          if (!ain) next.push(cross(a, b, side));
          next.push(b);
        } else if (ain) next.push(cross(a, b, side));
      }
      poly = next;
    }
    if (poly.length > 2) {
      miniCtx.strokeStyle = "rgba(125,249,255,.85)";
      miniCtx.lineWidth = 1;
      miniCtx.beginPath();
      miniCtx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) miniCtx.lineTo(poly[i].x, poly[i].y);
      miniCtx.closePath();
      miniCtx.stroke();
    }
  }
  mini.addEventListener("click", (e) => {
    handsOffDirection();
    const r = mini.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * frame.mapW;
    const z = (0.5 - (e.clientY - r.top) / r.height) * frame.mapD;
    rig.flyTo(x, groundY(x, z), z, rig.pose().dist, 0.9);
  });

  // ------------------------------------------------------------------ playback and keys
  // The run is held at its first moment until the Begin control starts it.
  const P = { tick: 0, playing: false };
  /**
   * How fast the run plays, in named steps rather than a dial. The base rate gives every
   * recorded moment the same time on screen; four and sixteen times that are the fast reads.
   */
  const SPEEDS = [1, 4, 16];
  let speed = 1;
  /**
   * Which recorded event the display is standing on. While the run is playing this follows
   * playback; a step key pins it to one exact event, because several events can share one
   * recorded moment and stepping must move through them one at a time.
   */
  let stepIndex = -1;

  const scrub = el("scrub") as HTMLInputElement;
  let scrubbing = false;
  const playBtn = el("play") as HTMLButtonElement;
  const playLabel = document.createTextNode("Pause");
  playBtn.textContent = "";
  {
    const hint = document.createElement("i");
    hint.textContent = "space";
    playBtn.append(playLabel, hint);
  }
  const setPlay = (on: boolean) => {
    P.playing = on;
    playLabel.textContent = on ? "Pause" : "Play";
    if (on) stepIndex = -1;
  };
  playBtn.addEventListener("click", () => setPlay(!P.playing));
  scrub.addEventListener("pointerdown", () => { scrubbing = true; });
  addEventListener("pointerup", () => { scrubbing = false; });
  scrub.addEventListener("input", () => {
    P.tick = parseFloat(scrub.value); stepIndex = -1; directedJump();
  });

  const speedBox = el("speeds");
  function setSpeed(v: number) {
    speed = SPEEDS.includes(v) ? v : 1;
    for (const b of Array.from(speedBox.children)) {
      b.classList.toggle("on", Number((b as HTMLElement).dataset.speed) === speed);
    }
  }
  for (const b of Array.from(speedBox.children)) {
    b.addEventListener("click", () => {
      // choosing a named speed is the override: it leaves the directed watch and free-runs
      setDirected(false);
      setSpeed(Number((b as HTMLElement).dataset.speed));
    });
  }
  setSpeed(1);

  // ------------------------------------------------------------------ the directed watch
  /**
   * The default way the run plays after Begin, and the answer to the complaint that the record
   * blurred past. The run advances ROUND BY ROUND: a round's events play slowly enough to be
   * read, the run then HOLDS at that round's last tick for long enough to read the headline and
   * the freshest report cards, and the next round starts on its own. Both numbers are derived
   * from how many events the round carries, so a dense round breathes longer than a thin one.
   * On this record the evidence desk's eight rounds come to about five minutes.
   *
   * Nothing here touches replay state. The direction changes how fast the playback tick advances
   * and where the camera stands, and both of those are presentation: the world at any tick is
   * the world it always was, every seek path is unchanged, and the hold and the camera flights
   * run on elapsed real time exactly like the panel reveals and the overwatch tour. Choosing one
   * of the named speeds leaves the directed watch and free-runs the record instead.
   */
  interface Move {
    tick: number;
    /** the places this move holds, named so two moves over the same places are one move */
    key: string;
    /** the middle of those places, and how far the furthest of them stands from it */
    at: THREE.Vector3 | null; spread: number;
    names: string[];
    /** the beat of the act this move is watching, where the run is walked act by act */
    beat?: ActBeat;
  }
  interface Pace {
    /** seconds this round's events are given, and seconds the hold after them lasts */
    play: number; dwell: number;
    /** playback ticks per second of real time while this round is playing */
    rate: number;
    /** the places this round happens, in the order the round reaches them */
    moves: Move[];
    /** how many recorded events this desk sees inside this round — what both numbers come from */
    events: number;
  }
  /**
   * How each round is framed. A dispatch is watched from close in over the destination, an
   * arrival closer still, a verdict round from the middle distance over the contested site, and
   * the reports coming in and the closing tally from far enough back to hold the whole corner.
   */
  const FRAMING: Record<string, { dist: number; pitch: number }> = {
    INGEST: { dist: 0.66, pitch: 34 },
    VERSION: { dist: 0.52, pitch: 32 },
    SUMMARIZE: { dist: 0.52, pitch: 32 },
    CORROBORATE: { dist: 0.44, pitch: 31 },
    GATE: { dist: 0.44, pitch: 31 },
    RANK: { dist: 0.40, pitch: 30 },
    DISPATCH: { dist: 0.30, pitch: 28 },
    ARRIVAL: { dist: 0.26, pitch: 27 },
    OBSERVE: { dist: GROUND * 0.70, pitch: 41 },
    UPDATE: { dist: GROUND * 0.70, pitch: 41 },
  };
  /**
   * Every place one recorded event names, not just the first. A dispatch names its destination,
   * a claim change names its site, a proposal names the sites it chose between, and the file
   * arrivals name every road or landslide the delivered file covers. The camera frames all of
   * them together, which is why a round about four contested sites is watched from far enough
   * back to hold four sites and a round about one dispatch is watched from over its destination.
   */
  function placesOf(e: Ev): Target[] {
    const out: Target[] = [];
    const held = new Set<string>();
    const add = (t: Target) => {
      const key = `${t.kind}:${"i" in t ? t.i : 0}`;
      if (held.has(key)) return;
      held.add(key);
      out.push(t);
    };
    const tf = str(e.payload?.target_feature_id);
    if (tf && siteOf.has(tf)) add({ kind: "site", i: siteOf.get(tf)! });
    const sel = e.payload?.selected_targets;
    if (Array.isArray(sel)) {
      for (const s of sel) {
        const id = str(s);
        if (siteOf.has(id)) add({ kind: "site", i: siteOf.get(id)! });
      }
    }
    for (const id of e.entity_refs ?? []) {
      if (siteOf.has(id)) add({ kind: "site", i: siteOf.get(id)! });
      else if (roadOf.has(id)) add({ kind: "road", i: roadOf.get(id)! });
      else if (hazardOf.has(id)) add({ kind: "hazard", i: hazardOf.get(id)! });
    }
    if (out.length === 0 && e.geometry?.type === "Point") add({ kind: "epicentre" });
    return out;
  }
  const placeName = (t: Target) =>
    t.kind === "site" ? sites[t.i].name
      : t.kind === "road" ? `road ${t.i + 1}`
        : t.kind === "hazard" ? `landslide zone ${t.i + 1}`
          : t.kind === "epicentre" ? "the epicentre" : t.kind;

  function paceFor(k: number, i: number): Pace {
    const r = rounds[k][i];
    // what this desk sees: its own events and the reports both desks are given, never the other
    // desk's private working
    const other = arms.length > 1 ? arms[(k + 1) % arms.length].spec.id : "";
    const seen = events.filter((e) => {
      const t = tickAt(e);
      return t >= r.start && t <= r.end && e.arm !== other;
    });
    const n = seen.length;
    const play = clamp(DIRECT_PLAY_BASE + DIRECT_PLAY_PER_EVENT * n,
      DIRECT_PLAY_MIN, DIRECT_PLAY_MAX);
    const dwell = clamp(DIRECT_DWELL_BASE + DIRECT_DWELL_PER_EVENT * n,
      DIRECT_DWELL_MIN, DIRECT_DWELL_MAX);
    const rate = Math.max(1, Math.min(TICKS, r.end) - r.start) / play;
    /**
     * The places this round reaches, in the order it reaches them. Everything the record stamps
     * with one moment is one place to look, so several reports arriving together are framed
     * together. Two moves over the same places are one move, and two moves are kept at least a
     * seventh of the round's playing time apart — never less than DIRECT_MOVE_GAP seconds — so a
     * round of many reports walks the region instead of whipping between sites.
     */
    const gap = Math.max(DIRECT_MOVE_GAP, play / 7) * rate;
    const moves: Move[] = [];
    // Every graph transition in this record names all four worked sites, whichever step it is
    // opening, so a transition is only allowed to place the camera in a round that records
    // nothing else. Otherwise the round is framed on what it actually did.
    const working = seen.filter((e) => e.type !== "GRAPH_TRANSITION");
    const placing = working.length > 0 ? working : seen;
    let held: { tick: number; places: Target[] } | null = null;
    const settle = () => {
      if (!held || held.places.length === 0) return;
      const key = held.places.map((t) => `${t.kind}:${"i" in t ? t.i : 0}`).sort().join(" ");
      const last = moves[moves.length - 1];
      const at = moves.length === 0 ? r.start : held.tick;
      if (last && (last.key === key || at - last.tick < gap)) return;
      // Only places that stand on the terrain cut can frame a shot. A closure recorded in the
      // next prefecture would otherwise drag the middle of the frame off the edge and stand the
      // camera back far enough to hold it, which is how a round ends up looking at empty ground.
      // A move over nothing this map holds becomes the whole-ground view.
      const pts = held.places.map(targetPos).filter(onMap);
      if (pts.length === 0) {
        moves.push({ tick: at, key, at: null, spread: 0, names: held.places.map(placeName) });
        return;
      }
      const mid = new THREE.Vector3();
      for (const p of pts) mid.add(p);
      mid.multiplyScalar(1 / pts.length);
      mid.y = groundY(mid.x, mid.z);
      let spread = 0;
      for (const p of pts) spread = Math.max(spread, Math.hypot(p.x - mid.x, p.z - mid.z));
      moves.push({ tick: at, key, at: mid, spread, names: held.places.map(placeName) });
    };
    for (const e of placing) {
      const t = Math.max(r.start, tickAt(e));
      if (!held || held.tick !== t) { settle(); held = { tick: t, places: [] }; }
      for (const p of placesOf(e)) {
        if (!held.places.some((q) => q.kind === p.kind
          && (q as { i?: number }).i === (p as { i?: number }).i)) held.places.push(p);
      }
    }
    settle();
    if (moves.length === 0) {
      moves.push({ tick: r.start, key: "", at: null, spread: 0, names: ["the camera holds the whole ground"] });
    }
    return { play, dwell, rate, moves, events: n };
  }
  /**
   * How one act is watched. The act's own beats decide where the camera goes: `acts.ts` already
   * worked out, for every beat, the one place on the map its recorded positions average to and
   * the box those positions cover. A beat claims a camera move when the record asks for a hold
   * on it — the opening, a decision moment, a recorded milestone, an agency bulletin. The
   * drizzle of aftershocks and closures is batched by the hour and claims no move, because it
   * happens everywhere at once and the ground and the feed already carry it.
   *
   * The pace itself is the same readable-dwell rule every round has always used: how long the
   * act plays and how long it holds afterwards are both derived from how many recorded events
   * the act carries, and two moves are kept at least a seventh of the act's playing time apart,
   * so a dense act walks the region instead of whipping between places.
   */
  function paceForAct(k: number, i: number): Pace {
    const act = acts[i];
    const r = rounds[k][i];
    const n = act.window.eventCount;
    const play = clamp(DIRECT_PLAY_BASE + DIRECT_PLAY_PER_EVENT * n,
      DIRECT_PLAY_MIN, DIRECT_PLAY_MAX);
    const dwell = clamp(DIRECT_DWELL_BASE + DIRECT_DWELL_PER_EVENT * n,
      DIRECT_DWELL_MIN, DIRECT_DWELL_MAX);
    const rate = Math.max(1, Math.min(TICKS, r.end) - r.start) / play;
    const gap = Math.max(DIRECT_MOVE_GAP, play / 7) * rate;
    const moves: Move[] = [];
    /**
     * A moment of decision is telegraphed on the map before its deadline, so the camera has to be
     * standing on the place while the proposals are still up rather than arriving after the
     * dispatch. The beat is extended backwards by exactly the lead the telegraph uses. Which
     * beats get a move is decided on the beat's own recorded tick, before the lead is taken off,
     * so extending a beat never costs another beat its move.
     */
    const lead = TELEGRAPH_LEAD_SECONDS * rate;
    let lastRaw = -Infinity;
    for (const beat of act.beats) {
      if (beat.holdSeconds <= 0 || !beat.anchor) continue;
      const tick = Math.max(r.start, Math.round(tickOfSimSeconds(beat.startSimSeconds)));
      const early = beat.kind === "decision" ? Math.max(r.start, Math.round(tick - lead)) : tick;
      const at = moves.length === 0 ? r.start : early;
      if (moves.length > 0 && tick - lastRaw < gap) continue;
      lastRaw = tick;
      // The moment the record opens on is the earthquake itself, and the earthquake's own
      // position is out under the Yatsushiro Sea. A close pass over open water is a black
      // frame, so the announcement is watched over the whole ground with the scan sweep going
      // out from the epicentre, which is where the story starts anyway.
      const mid = groundOf(beat.anchor.longitude, beat.anchor.latitude);
      /**
       * Some moments the record carries stand out at sea. The earthquake's own hypocentre is
       * under the Yatsushiro Sea, and every one of the eleven moments of decision is recorded
       * at that same point, because a decision belongs to the whole region rather than to one
       * roof. The elevation tiles record nothing at sea and it is drawn dark, so a camera
       * aimed there shows a dark frame. Such a moment is watched over the whole ground
       * instead, which is also the truer picture of what it is about.
       */
      const solid = terrain.landAround(
        mid.x / frame.mapW + 0.5, 0.5 - mid.z / frame.mapD, 0.004);
      if (beat.kind === "opening" || solid < NEAR_GROUND || !onMap(mid)) {
        moves.push({
          tick: at, key: beat.beatId,
          at: new THREE.Vector3(HOME.tx, HOME.ty, HOME.tz),
          spread: GROUND * 0.42 / 1.8, names: [beat.label], beat,
        });
        continue;
      }
      // how far back: half the widest side of the box this beat's own positions cover, and
      // never closer than the distance at which the frame holds painted ground
      const box = beat.frame;
      const covered = box
        ? Math.max(Math.abs(frame.x(box.east) - frame.x(box.west)),
          Math.abs(frame.z(box.north) - frame.z(box.south))) / 2
        : 0;
      const spread = Math.max(covered, standBackFor(mid) / 1.8);
      moves.push({ tick: at, key: beat.beatId, at: mid, spread, names: [beat.label], beat });
    }
    if (moves.length === 0) {
      moves.push({ tick: r.start, key: act.actId, at: null, spread: 0, names: [act.label] });
    }
    return { play, dwell, rate, moves, events: n };
  }
  /**
   * How an act is framed. A round of the two-desk exercise watches one dispatch or one
   * contested site, so it is watched from close in at a shallow angle. An act of the whole
   * incident watches a region across a whole prefecture, so it stands further back and looks
   * further down, which is what keeps ground rather than sky in the frame.
   */
  if (walkActs) for (const act of acts) FRAMING[act.actId] = { dist: 0.62, pitch: 42 };
  const pacing: Pace[][] = arms.map((_a, k) =>
    rounds[k].map((_r, i) => (walkActs ? paceForAct(k, i) : paceFor(k, i))));

  let directed = true;                                   // the guided watch, on by default
  let dRound = 0;                                        // the round the direction is working
  let dPhase: "play" | "dwell" | "breath" | "done" = "play";
  let dwellLeft = 0;                                     // seconds left on the hold or the breath
  let dMove = 0;                                         // which of the round's places the camera is on
  let dHandback = false;                                 // the viewer took the stick this round

  /** where the camera stands for one of a round's places */
  function directedPose(k: number, i: number, m: Move): Pose {
    const f = FRAMING[rounds[k][i].node] ?? { dist: 0.46, pitch: 31 };
    // The turn changes from round to round, so two rounds working the same sites are still two
    // different pictures: the camera swings around them rather than parking in one place. It is
    // a smooth walk of at most half a radian a round, so no round opens on a whip pan.
    const yaw = HOME.yaw + 0.55 * Math.sin(i * 1.1 + k * 0.7);
    if (!m.at || !onMap(m.at)) return { ...HOME, yaw };
    // A move over several places stands back far enough to hold the furthest of them. The lens
    // is 38 degrees across a frame half again as wide as it is tall, so the ground it holds at
    // this stand-off is a little over half the distance either side of what it is aimed at.
    const dist = clamp(Math.max(f.dist, m.spread * 1.8), f.dist, WIDE_DIST);
    return {
      tx: m.at.x, ty: m.at.y, tz: m.at.z, yaw,
      pitch: pitchFor(f.pitch * D2R, dist), dist,
    };
  }
  /** the same place, seen from further back — where the camera rests while the round is held */
  function dwellPose(k: number, i: number, m: Move): Pose {
    const p = directedPose(k, i, m);
    if (!m.at || !onMap(m.at)) return p;
    // the pull-back is a wider shot, so it takes the angle its own distance asks for
    const dist = Math.min(WIDE_DIST, p.dist * 1.7);
    const f = FRAMING[rounds[k][i].node] ?? { dist: 0.46, pitch: 31 };
    return { ...p, dist, pitch: Math.min(78 * D2R, pitchFor(f.pitch * D2R, dist) + 3 * D2R) };
  }
  /** send the camera to the place the round is on now, unless the viewer or overwatch has it */
  function directFly(seconds: number) {
    if (dHandback || watchOn) return;
    const p = pacing[desk][dRound];
    rig.glideTo(directedPose(desk, dRound, p.moves[Math.min(dMove, p.moves.length - 1)]), seconds);
  }
  /** the viewer took the stick: the direction waits until the next round starts */
  function handsOffDirection() { if (directed) dHandback = true; }

  const modeChip = el("mode") as HTMLButtonElement;
  const dwellBox = el("dwell");
  const dwellNum = dwellBox.querySelector("b") as HTMLElement;
  function drawMode() {
    modeChip.textContent = directed ? COPY.DIRECTED.label : COPY.DIRECTED.free;
    modeChip.classList.toggle("on", directed);
    modeChip.title = COPY.DIRECTED.tip;
    (dwellBox.querySelector("u") as HTMLElement).textContent = COPY.DIRECTED.key;
    dwellBox.classList.toggle("on", directed && dPhase === "dwell");
  }
  /** stand the direction on whatever round the current tick falls in */
  function directedAt(handback: boolean) {
    dRound = roundAt(Math.floor(P.tick), desk);
    const p = pacing[desk][dRound];
    dPhase = "play";
    dwellLeft = 0;
    dMove = 0;
    for (let j = 0; j < p.moves.length; j++) if (P.tick >= p.moves[j].tick) dMove = j;
    dHandback = handback;
    drawMode();
  }
  /**
   * The viewer moved the run themselves: the direction picks up from where they landed. It runs
   * whether or not the directed watch is on, so the round it is standing on is always a round
   * this desk actually has — the two desks take a different number of steps.
   */
  function directedJump() { directedAt(true); }
  /** start one round from its opening, with the camera going to where it happens */
  function enterRound(i: number) {
    const rs = rounds[desk];
    dRound = Math.max(0, Math.min(rs.length - 1, i));
    // where the run is walked act by act, a new round is a new act, and the act names itself
    if (walkActs && dRound > 0) showActCard(dRound);
    P.tick = rs[dRound].start;
    dPhase = "play";
    dMove = 0;
    dwellLeft = 0;
    dHandback = false;
    stepIndex = -1;
    directFly(DIRECT_FLY);
    setPlay(true);
    drawMode();
  }
  function setDirected(on: boolean) {
    if (on === directed) return;
    directed = on;
    if (on) {
      setSpeed(1);
      directedAt(false);
      directFly(DIRECT_FLY);
      if (begun) setPlay(true);
    }
    drawMode();
  }
  modeChip.addEventListener("click", () => setDirected(true));
  // every way a person can take the camera by hand. Each of these already stops whatever flight
  // was running, so all the direction has to do here is stand back until the next round.
  canvas.addEventListener("pointerdown", handsOffDirection);
  canvas.addEventListener("wheel", handsOffDirection, { passive: true });
  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    const k = e.key.toLowerCase();
    if (k.length === 1 && "wasdqefh".includes(k)) handsOffDirection();
    else if (/^[1-9]$/.test(e.key)) handsOffDirection();
  });
  drawMode();

  /**
   * How fast the run moves through the stretch it is on now.
   *
   * The record is not evenly filled. Between the last moment of one evening and the first of
   * the next morning there can be a long stretch that holds nothing worth stopping at, and
   * playing that stretch at the reading pace leaves a watcher looking at a still picture for
   * half a minute. So a stretch with no moment in it is crossed quickly: the run covers it in
   * at most CROSS_SECONDS, and the clock on the transport visibly runs, which is what tells a
   * watcher that time is passing rather than that the run has stopped.
   *
   * Nothing here touches replay state. The tick still moves forward through every recorded
   * moment in order, and any seek to any tick draws exactly what it always drew.
   */
  const CROSS_SECONDS = 2.6;
  const MAX_QUIET = 8;
  /**
   * Every point of the run where something happens on screen: a camera move, and the opening of
   * a story card over a place. Between two of these the picture is still, so these are the
   * points the quiet stretches are measured between.
   */
  let storyTicksHeld: number[] | null = null;
  function storyTicks(): number[] {
    // built on first use, because the story cards are set up further down this file
    if (storyTicksHeld) return storyTicksHeld;
    if (!walkActs) { storyTicksHeld = []; return storyTicksHeld; }
    const held = new Set<number>();
    for (const plan of pacing[0]) for (const move of plan.moves) held.add(Math.round(move.tick));
    for (const row of cardRows) held.add(row.tick);
    for (const round of rounds[0]) held.add(round.start);
    // A deadline passing is something a viewer watches happen: the places under consideration
    // stop being proposals, the chosen dispatch draws its route and the rejected ones fade. The
    // camera move for the same moment now stands earlier than the deadline, so the deadline is
    // declared here in its own right rather than left as an unexplained still stretch.
    for (const moment of telegraphs) held.add(Math.round(moment.tick));
    storyTicksHeld = [...held].sort((a, b) => a - b);
    return storyTicksHeld;
  }
  /**
   * The stretches each act crosses quickly, worked out once. A stretch is one gap between two
   * things happening on screen, and it becomes a crossing when playing it at the reading pace
   * would leave the picture still for longer than MAX_QUIET seconds.
   */
  interface Crossing { from: number; to: number; rate: number; seconds: number; normal: number }
  let crossingsHeld: Crossing[][] | null = null;
  function crossings(): Crossing[][] {
    if (crossingsHeld) return crossingsHeld;
    crossingsHeld = rounds[0].map((round, i) => {
      if (!walkActs) return [];
      const plan = pacing[0][i];
      const end = Math.min(TICKS, round.end);
      const points = [round.start,
        ...storyTicks().filter((t) => t > round.start && t <= end), end];
      const out: Crossing[] = [];
      for (let j = 1; j < points.length; j++) {
        const from = points[j - 1], to = points[j];
        const ticks = to - from;
        if (ticks <= 0) continue;
        const normal = ticks / plan.rate;
        if (normal <= MAX_QUIET) continue;
        // one constant rate for the whole stretch, so it takes exactly the declared seconds
        out.push({ from, to, rate: ticks / CROSS_SECONDS, seconds: CROSS_SECONDS, normal });
      }
      return out;
    });
    return crossingsHeld;
  }
  /**
   * How fast the run moves right now. Inside a declared crossing the rate is that crossing's
   * own constant rate, held until its end tick, so the stretch takes the seconds it declares.
   * Everywhere else the act plays at its own reading pace.
   */
  function rateNow(p: Pace, tick: number, _end: number): number {
    if (!walkActs) return p.rate;
    for (const cross of crossings()[dRound] ?? []) {
      if (tick >= cross.from && tick < cross.to) return cross.rate;
    }
    return p.rate;
  }
  /**
   * The longest stretch of real viewing time the directed watch spends between two things
   * happening on screen, act by act. Nothing reads this to draw a frame; it is here so the
   * pacing can be measured from outside rather than judged by eye.
   */
  /**
   * The stretches the directed watch crosses quickly, one list per act. A stretch appears here
   * when the record holds nothing in it and playing it at the reading pace would leave the
   * picture still for longer than MAX_QUIET seconds. The run crosses it in CROSS_SECONDS with
   * the clock on the transport visibly running, which is the cue that time is passing.
   *
   * These are declared rather than hidden, so a check outside this page can tell a stretch
   * that was deliberately crossed from a stretch the run simply sat in.
   */
  function timeJumpsFor(i: number) {
    return (crossings()[i] ?? []).map((cross) => ({
      tick: cross.from, from: cross.from, to: cross.to,
      fromTick: cross.from, toTick: cross.to, ticks: cross.to - cross.from,
      seconds: cross.seconds, rate: +cross.rate.toFixed(3),
      atNormalPaceSeconds: +cross.normal.toFixed(2),
    }));
  }
  function quietStretches() {
    return rounds[0].map((round, i) => {
      const plan = pacing[0][i];
      const end = Math.min(TICKS, round.end);
      const points = [round.start,
        ...storyTicks().filter((t) => t > round.start && t <= end), end];
      const declared = crossings()[i] ?? [];
      let worst = 0, at = round.start;
      for (let j = 1; j < points.length; j++) {
        const from = points[j - 1], gap = points[j] - from;
        if (gap <= 0) continue;
        const cross = declared.find((c) => c.from === from);
        const seconds = cross ? cross.seconds : gap / plan.rate;
        if (seconds > worst) { worst = seconds; at = from; }
      }
      return { act: i + 1, id: round.node, worstSeconds: +worst.toFixed(2), fromTick: at };
    });
  }

  /**
   * One frame of the directed watch, in elapsed real time. It advances the playback tick at this
   * round's own rate, walks the camera to the round's next place, holds at the round's last tick
   * for the dwell, and — after the last round — takes one breath over the whole ground before
   * the debrief rises.
   */
  /**
   * The one moment the direction stops at by itself. The water-planning decision on the second
   * day is the clearest of the eleven, so a viewer who presses Begin and watches is taken into
   * its walk-through when the run reaches it, and the run holds there until they close it.
   *
   * The stop happens once per pass and only for a viewer who has not taken the stick. Any seek,
   * any camera move and the overwatch tour all set `dHandback`, so a verifier driving the page
   * through `__HERO.seek` never meets it and no gate can be held up by it.
   */
  const flagshipRow = decisionRows.find((row) => row.id === TRACE_FLAGSHIP) ?? null;
  let flagshipShown = false;
  function autoTrace(before: number, after: number) {
    if (!flagshipRow || flagshipShown || dHandback || watchOn || traceIsOpen()) return;
    if (before > flagshipRow.tick || after < flagshipRow.tick) return;
    flagshipShown = true;
    showTrace(traceOf.get(TRACE_FLAGSHIP) ?? null, 0, true);
  }

  function advanceDirected(dt: number) {
    const rs = rounds[desk];
    const p = pacing[desk][dRound];
    if (dPhase === "play") {
      const end = Math.min(TICKS, rs[dRound].end);
      const wasAt = P.tick;
      P.tick = Math.min(end, P.tick + dt * rateNow(p, P.tick, end));
      autoTrace(wasAt, P.tick);
      while (dMove + 1 < p.moves.length && P.tick >= p.moves[dMove + 1].tick) {
        dMove++;
        directFly(DIRECT_FLY);
      }
      if (P.tick < end) return;
      P.tick = end;
      dPhase = "dwell";
      dwellLeft = p.dwell;
      // the hold opens with one pull-back, so the round's place is read in its surroundings
      if (!dHandback && !watchOn) {
        rig.glideTo(dwellPose(desk, dRound, p.moves[Math.min(dMove, p.moves.length - 1)]),
          DIRECT_FLY);
      }
      drawMode();
      return;
    }
    if (dPhase === "dwell") {
      dwellLeft -= dt;
      if (dwellLeft > 0) return;
      if (dRound + 1 < rs.length) { enterRound(dRound + 1); return; }
      dPhase = "breath";
      dwellLeft = DIRECT_BREATH;
      if (!dHandback && !watchOn) rig.glideTo({ ...HOME }, DIRECT_FLY);
      drawMode();
      return;
    }
    if (dPhase === "breath") {
      dwellLeft -= dt;
      if (dwellLeft > 0) return;
      dPhase = "done";
      drawMode();
      showDebrief(true);
      return;
    }
    // "done": the record is finished and the run rests on its last tick.
  }

  // ------------------------------------------------------------------ the acts on screen
  /**
   * What rises in the middle of the screen as each act opens. The first is the earthquake
   * itself — the magnitude, the agency's own intensity reading and the origin clock, all read
   * off the record's first event — and the rest name the act and carry the story line the
   * scenario wrote for it. Each holds for a few seconds and goes, so the world is never
   * covered for long.
   *
   * The hold runs on elapsed real time, like every other reveal on this page, and nothing here
   * touches replay state.
   */
  const ACT_CARD_SECONDS = 8.5;
  const actCard = el("actcard"), actCardBox = el("actcardBox");
  let actCardLeft = 0;
  let actCardShown = -2;                                 // which act is up, or -2 for none
  function showActCard(index: number) {
    if (!walkActs || index === actCardShown) return;
    actCardShown = index;
    const kicker = el("actcardKicker"), title = el("actcardTitle");
    const line = el("actcardLine"), story = el("actcardStory"), note = el("actcardNote");
    if (index < 0 && opening) {
      kicker.textContent = COPY.INCIDENT.opening.label;
      title.textContent = COPY.INCIDENT.opening.line(String(opening.magnitude ?? ""));
      line.textContent = COPY.INCIDENT.opening.clock(COPY.clockOf(opening.originClock));
      // The opening card says the earthquake and nothing else. Its act story is already on the
      // story panel at the right of the same frame, word for word, and the sentence about the
      // ribbon sits directly under the ribbon it describes. Printing both here put the same
      // words on screen three times at the moment a viewer arrives. Later act cards keep their
      // story, because nothing else on the frame carries it at the moment they rise.
      story.textContent = "";
      note.textContent = "";
    } else {
      const act = acts[Math.max(0, index)];
      if (!act) return;
      kicker.textContent = COPY.INCIDENT.act.of(index + 1, acts.length);
      title.textContent = act.label;
      line.textContent = "";
      story.textContent = act.story;
      note.textContent = "";
    }
    line.style.display = line.textContent ? "block" : "none";
    story.style.display = story.textContent ? "block" : "none";
    note.style.display = note.textContent ? "block" : "none";
    actCard.classList.add("on");
    requestAnimationFrame(() => actCard.classList.add("opening"));
    openBox(actCardBox);
    actCardLeft = ACT_CARD_SECONDS;
  }
  function hideActCard() {
    if (actCardShown === -2) return;
    actCardShown = -2;
    actCardLeft = 0;
    closeBox(actCardBox);
    actCard.classList.remove("opening");
    setTimeout(() => { if (actCardShown === -2) actCard.classList.remove("on"); }, 320);
  }

  /**
   * The ribbon: the whole run on one strip, every moment marked.
   *
   * Each beat the record holds leaves a mark at the point of the run it plays at, so a long
   * quiet stretch is visibly a short one on the ribbon rather than an unexplained gap. The
   * moments the record asks to hold on stand tall; the batched tremors and closures stand
   * short. A full-height hairline falls at each act boundary, and a burn-coloured line walks
   * the ribbon as the run plays.
   *
   * The ribbon is drawn from the playback tick and nothing else, so the same tick always draws
   * the same picture.
   */
  const quakeStrip = el("quakestrip");
  const quakeCv = el("quakestripCv") as HTMLCanvasElement;
  const quakeCtx = quakeCv.getContext("2d");
  let quakeDrawn = -1;
  function drawQuakeStrip(tick: number) {
    if (!walkActs || !quakeCtx || actBeatRows.length === 0) return;
    const step = Math.round(tick);
    if (step === quakeDrawn) return;
    quakeDrawn = step;
    const w = quakeCv.width, h = quakeCv.height;
    quakeCtx.clearRect(0, 0, w, h);
    const atX = (t: number) => Math.round(clamp(t / TICKS) * (w - 3)) + 1;
    quakeCtx.fillStyle = "rgba(233,237,242,0.16)";
    quakeCtx.fillRect(0, h - 1, w, 1);
    // the stretches the run crosses quickly, hatched, so a leap in the clock is visible as a
    // leap rather than read as a stretch the run sat in
    for (let i = 0; i < rounds[desk].length; i++) {
      for (const jump of timeJumpsFor(i)) {
        const x0 = atX(jump.from), x1 = atX(jump.to);
        quakeCtx.fillStyle = "rgba(233,237,242,0.10)";
        quakeCtx.fillRect(x0, 1, Math.max(1, x1 - x0), h - 3);
        quakeCtx.fillStyle = "rgba(233,237,242,0.22)";
        for (let x = x0; x < x1; x += 3) quakeCtx.fillRect(x, h - 4, 1, 3);
      }
    }
    // one mark per act boundary, so the four chapters are visible as four stretches
    quakeCtx.fillStyle = "rgba(233,237,242,0.26)";
    for (const round of rounds[desk]) if (round.start > 0) quakeCtx.fillRect(atX(round.start), 0, 1, h);
    for (const row of actBeatRows) {
      const told = row.beat.holdSeconds > 0;
      const tall = told ? h - 6 : Math.max(3, Math.min(h - 10, 2 + row.beat.eventCount * 0.6));
      const passed = row.tick <= step;
      quakeCtx.fillStyle = passed
        ? (told ? "rgba(125,249,255,0.92)" : "rgba(125,249,255,0.44)")
        : (told ? "rgba(233,237,242,0.30)" : "rgba(233,237,242,0.16)");
      quakeCtx.fillRect(atX(row.tick), h - 1 - tall, told ? 2 : 1, tall);
    }
    quakeCtx.fillStyle = `rgba(${Math.round(EMB[0] * 255)},${Math.round(EMB[1] * 255)},${Math.round(EMB[2] * 255)},0.92)`;
    quakeCtx.fillRect(atX(step), 0, 1, h);
  }

  const outcomeBox = el("outcome"), chip = el("chip");
  let outcomeShown = false;
  function showOutcome(on: boolean) {
    outcomeShown = on;
    outcomeBox.classList.toggle("gone", !on);
    chip.classList.toggle("on", !on);
    el("topscrim").classList.toggle("small", !on);
    // the tally was filled once at load with tick 0, so an opened panel said "0
    // of 414 moments played" however far the run had come; refresh it from the
    // playhead every time the panel opens
    if (on && !twoDesks) writeTally(el("tally"), incidentCellsAt(P.tick));
    if (on) openBox(outcomeBox); else closeBox(outcomeBox);
  }
  chip.addEventListener("click", () => showOutcome(true));
  outcomeBox.addEventListener("click", () => showOutcome(false));
  showOutcome(false);

  /**
   * The briefing. It is the first thing on the page: the situation in plain words, the one
   * control that starts the run, and the sentence that says which parts of what follows are real
   * records and which are simulated. The masthead and the outcome chip sit above the scrim, so
   * both are already legible while it is still up.
   */
  const briefBox = el("brief"), briefCard = el("briefCard"), briefGo = el("briefGo");
  briefGo.firstChild!.textContent = COPY.BRIEFING.control;
  let begun = false;
  function begin() {
    if (begun) return;
    begun = true;
    // A focused control swallows the keys, and the Begin control is pressed with the pointer, so
    // it gives the focus back before it goes away. Without this every key is dead after Begin.
    briefGo.blur();
    closeBox(briefCard);
    briefBox.classList.add("gone");
    openBox(rail);
    openBox(el("narrate"));
    rig.openWith(SKY, OPEN_TO, OPEN_SECONDS);
    // The directed watch is the default, and round one starts on the opening flight: that flight
    // is round one's own first camera move, so nothing cuts it short.
    dRound = 0; dPhase = "play"; dMove = 0; dwellLeft = 0; dHandback = false;
    P.tick = rounds[desk][0].start;
    drawMode();
    setPlay(true);
    // The record opens on the earthquake itself: the announcement rises in the middle of the
    // screen, the scan sweep goes out from the epicentre, and the aftershock timeline starts
    // filling underneath while the first act plays.
    if (walkActs && opening) {
      showActCard(-1);
      quakeStrip.classList.add("on");
      el("quakestripLab").textContent = COPY.INCIDENT.ribbon;
      quakeDrawn = -1;
      fireScan({ kind: "epicentre" });
    }
  }
  briefGo.addEventListener("click", begin);
  openBox(briefCard);

  const helpBox = el("help"), helpClose = el("helpClose");
  const showHelp = (on: boolean) => {
    if (on) openBox(helpBox); else closeBox(helpBox);
    helpClose.style.display = on ? "block" : "none";
    rig.keysEnabled = !on;
  };
  el("helpBtn").addEventListener("click", () => showHelp(!helpBox.classList.contains("on")));
  helpClose.addEventListener("click", () => showHelp(false));

  // ------------------------------------------------------------------ the real decision moments
  /**
   * The comparison against the reconstructed real response. It reads one baked file,
   * `/real-response-summary.json`, which `app/scripts/bake-real-response.mjs` writes out of the
   * frozen experiment artifacts after re-checking every certificate. Nothing here computes a
   * number: every count, every example and both verdict sentences arrive in that file, and the
   * two verdict sentences are copied word for word out of the dual-signed report.
   *
   * The real response is shown as a run and never as a straw man. The record of what the
   * responders did is stated as the record states it, the record's own open questions are stated
   * with it, and no sentence on this surface says anyone erred. The surface opens with the whole
   * result in classroom English; the registered verdicts and the scenario's own honesty and
   * disclosure sentences follow word for word inside the panel a reader opens. The standing
   * assumption line stays above every card, so no card can be read without it.
   *
   * The file is fetched the first time the surface is asked for, so a reader who never asks for
   * it pays nothing for it, and the fetch happens off the frame.
   */
  const realBox = el("real"), realClose = el("realClose"), realSlots = el("realSlots");
  let realLoaded = false, realBusy = false;

  /**
   * One plan said aloud: the things it named, then how many of them went where. The file holds a
   * ready-made sentence for this, and that sentence carries the recording's own unit names —
   * "Unit fukuoka city command", "Additional Japan Water Works Association truck pool". Both are
   * unreadable to a stranger, so the sentence is composed here from the same two lists the file
   * carries, with every name read through `gloss.ts`. The cut-offs are the ones
   * `app/scripts/bake-real-response.mjs` uses, so the shape of the sentence does not change.
   * Where the file carries no lists, its own sentence stands.
   *
   * The things are said before the places on purpose. Written the other way round the line ended
   * "Kashima Town 1, Kōsa Town 1", and a reader had no way to tell whether those 1s were counts,
   * ranks or positions on a list. Said this way each number points back at the things just named.
   *
   * The source-repository copy audit builds the same two lines so the audit
   * judges what the screen shows. The two have to move together.
   */
  function planWords(
    targets: { label: string; quantity: number }[],
    resources: { label: string; quantity: number }[],
    written: string,
  ): string[] {
    if (!targets || targets.length === 0) return [written];
    const shown = targets.slice(0, 6);
    const where = shown.map((t, at) => (at === 0
      ? COPY.REAL.planFirstPlace(t.quantity, GLOSS.plainSummaryLabel(t.label))
      : COPY.REAL.planNextPlace(t.quantity, GLOSS.plainSummaryLabel(t.label)))).join(", ")
      + (targets.length > shown.length
        ? ` ${COPY.REAL.planMorePlaces(targets.length - shown.length)}` : "");
    const things = !resources || resources.length === 0 ? ""
      : resources.length <= 2
        ? resources.map((r) => GLOSS.plainSummaryLabel(r.label)).join(", ")
        : `${resources.slice(0, 2).map((r) => GLOSS.plainSummaryLabel(r.label)).join(", ")}`
          + ` ${COPY.REAL.planMoreThings(resources.length - 2)}`;
    return things ? [things, where] : [where];
  }

  /** the one or two lines of a plan, appended as their own paragraphs under a heading */
  function appendPlan(box: HTMLElement, lines: string[]): void {
    lines.forEach((text, at) => {
      const node = document.createElement("p");
      node.className = at === 0 ? "rline" : "rline rwhere";
      node.textContent = text;
      box.append(node);
    });
  }

  function realCard(slot: RealSlot) {
    const card = document.createElement("article");
    card.className = "rslot";
    const head = document.createElement("div");
    head.className = "rhead";
    const title = document.createElement("b");
    title.textContent = GLOSS.plainSlotTitle(slot.slot_id, slot.title);
    const clock = document.createElement("span");
    clock.className = "rclock";
    clock.textContent = `${COPY.REAL.cutoffLabel} ${slot.cutoff_words}`;
    head.append(title, clock);
    // the sentence a student reads first, composed out of this moment's own record: what the real
    // responders sent and where, then the two desks' counts side by side
    const hist = slot.historical;
    const table = slot.arms.find((a) => a.arm === "evidence_table");
    const plain = slot.arms.find((a) => a.arm === "plain_summary");
    const student = document.createElement("p");
    student.className = "rstudent";
    const choice = hist.targets.length > 0 && hist.resources.length > 0
      ? COPY.REAL.studentChoice(
        hist.targets.map((t) => `${t.quantity} to ${GLOSS.plainSummaryLabel(t.label)}`).join(" and "),
        GLOSS.plainSummaryLabel(hist.resources[0].label),
        hist.resources.length - 1,
      )
      : COPY.REAL.studentNoChoice;
    student.textContent = table && plain
      ? `${choice} ${COPY.REAL.studentDesks(table.fully_valid, plain.fully_valid, table.seeds)}`
      : choice;
    const who = document.createElement("div");
    who.className = "rwho";
    who.textContent = `${COPY.REAL.deciderLabel} ${GLOSS.plainDecider(slot.slot_id, slot.decider)}`;
    const task = document.createElement("p");
    task.className = "rtask";
    task.textContent = GLOSS.glossed(GLOSS.SUMMARY_TASK_LINE, slot.slot_id, slot.task_line);
    card.append(head, student, who, task);

    // what the real responders did, as the record has it and with the record's own gaps
    const real = document.createElement("div");
    real.className = "rreal";
    const realKey = document.createElement("span");
    realKey.className = "k";
    realKey.textContent = COPY.REAL.realLabel;
    const realText = document.createElement("p");
    realText.textContent = GLOSS.glossed(
      GLOSS.SUMMARY_HISTORICAL, slot.slot_id, slot.historical.summary);
    real.append(realKey, realText);
    if (slot.historical.line) {
      appendPlan(real, planWords(
        slot.historical.targets, slot.historical.resources, slot.historical.line));
    }
    if (slot.historical.unknowns.length > 0) {
      const open = document.createElement("p");
      open.className = "rnote";
      open.textContent = `${COPY.REAL.openLabel}: ${slot.historical.unknowns
        .map((line, at) => GLOSS.plainHistoricalUnknown(slot.slot_id, at, line)).join(" ")}`;
      real.append(open);
    }
    card.append(real);

    const arms = document.createElement("div");
    arms.className = "rarms";
    for (const arm of slot.arms) {
      const box = document.createElement("div");
      box.className = arm.arm === "plain_summary" ? "rarm" : "rarm lit";
      const name = document.createElement("div");
      name.className = "rname";
      name.textContent = GLOSS.plainSummaryLabel(arm.name);
      // one line saying in plain words what this desk did differently, so a card reads on its own
      const desk = document.createElement("p");
      desk.className = "rdesk";
      desk.textContent = COPY.REAL.deskNote[arm.arm] ?? "";
      const count = document.createElement("div");
      count.className = "rcount";
      const big = document.createElement("b");
      big.textContent = String(arm.fully_valid);
      const of = document.createElement("i");
      of.textContent = COPY.REAL.validCount(arm.seeds);
      count.append(big, of);
      const stamp = document.createElement("p");
      stamp.className = arm.example.fully_valid ? "rstamp" : "rstamp broke";
      stamp.textContent = `${arm.example.fully_valid ? COPY.REAL.exampleValid : COPY.REAL.exampleInvalid}`
        + ` · ${COPY.REAL.exampleSeeds(arm.example.seeds_matching, arm.seeds)}`;
      box.append(name, desk, count);
      appendPlan(box, planWords(
        arm.example.targets, arm.example.resources, arm.example.line));
      box.append(stamp);
      if (arm.example.unlisted > 0) {
        const note = document.createElement("p");
        note.className = "rnote";
        note.textContent = COPY.REAL.unlisted(arm.example.unlisted);
        box.append(note);
      }
      arms.append(box);
    }
    card.append(arms);
    return card;
  }

  function fillReal(data: RealSummary) {
    el("realTitle").textContent = COPY.REAL.title;
    el("realLead").textContent = "";
    const incident = COPY.REAL.incident;
    const runs = data.configurations;
    const moments = data.slots.length;
    const plain = data.totals.plain_summary ?? 0;
    const table = data.totals.evidence_table ?? 0;
    const corrected = data.totals.evidence_feedback ?? 0;
    const constraints = Object.fromEntries(WAY_ORDER.map((way) => [way,
      data.slots.reduce((sum, slot) =>
        sum + (slot.arms.find((arm) => arm.arm === way)?.constraint_passes ?? 0), 0),
    ])) as Record<string, number>;

    // The earthquake and the human problem come before the experiment and every score.
    el("realScene").textContent = COPY.INCIDENT.story.scene(
      incident.magnitude, incident.intensity, incident.clock, incident.hours);
    el("realProblem").textContent = COPY.INCIDENT.story.question;

    // The complete job: every scored moment, its clock deadline, and the definition of a pass.
    el("realJobHead").textContent = COPY.INCIDENT.story.jobHead;
    el("realJob").textContent = COPY.INCIDENT.story.job(moments, data.seeds);
    el("realMomentsHead").textContent = COPY.INCIDENT.story.momentsHead(moments);
    const momentList = el("realMoments");
    momentList.textContent = "";
    for (const slot of data.slots) {
      const item = document.createElement("li");
      const line = document.createElement("b");
      line.textContent = COPY.INCIDENT.story.momentLine(
        slot.cutoff_words,
        GLOSS.plainSlotTitle(slot.slot_id, slot.title).replace(/[.\s]+$/, ""));
      const who = document.createElement("i");
      who.textContent = `${COPY.REAL.deciderLabel} ${GLOSS.plainDecider(slot.slot_id, slot.decider)}`;
      item.append(line, who);
      // the grade this moment's final answer earned, and one click below it the rules that
      // produced that grade, in the same plain words the walk-through uses
      const trace = traceOf.get(slot.slot_id) ?? null;
      if (trace?.final) item.append(verdictBadge(trace.final.badge, findingsOf(trace.final)));
      momentList.append(item);
    }
    el("realDefinition").textContent = COPY.INCIDENT.definition;

    // One concrete decision is followed through the public record, both failures and the repair.
    el("realWorkedHead").textContent = COPY.INCIDENT.story.workedHead;
    const worked = drawWorkedExample(el("realWorked"));
    el("realWorkedHead").style.display = worked ? "block" : "none";
    el("realWorked").style.display = worked ? "block" : "none";
    el("realTraceHandoff").textContent = worked ? COPY.REAL.traceHandoff : "";
    el("realWorkedTrace").textContent = COPY.TRACE.open;
    el("realWorkedTrace").style.display = worked ? "inline-block" : "none";

    // The three methods are explained before their results. No count appears in these cards.
    el("realMethodsHead").textContent = COPY.INCIDENT.story.methodsHead;
    el("realNormal").textContent = COPY.INCIDENT.story.normalWork;
    const ways = el("realWays");
    ways.textContent = "";
    for (const way of WAY_ORDER) {
      const card = document.createElement("div");
      card.className = "beat flat";
      const label = document.createElement("div");
      label.className = "t";
      label.textContent = COPY.INCIDENT.ways[way] ?? way;
      const did = document.createElement("p");
      did.textContent = COPY.REAL.deskNote[way] ?? "";
      card.append(label, did);
      ways.append(card);
    }
    el("realTry").textContent = COPY.INCIDENT.story.tryLine(moments, runs);

    // Only now do the three scores appear, and every number says exactly what it counts.
    el("realResultHead").textContent = COPY.INCIDENT.story.resultHead;
    writeTally(el("realTally"), WAY_ORDER.map((way) => ({
      value: data.totals[way] ?? 0,
      label: COPY.INCIDENT.countLabels.tries(runs, COPY.INCIDENT.ways[way] ?? way),
    })));
    el("realZero").textContent = COPY.INCIDENT.story.zeroMeans(
      runs, constraints.plain_summary ?? 0);
    el("realTranslate").textContent = COPY.INCIDENT.story.translate(
      runs, plain, table, corrected);
    el("realRepair").textContent = COPY.INCIDENT.story.repair(runs, table, corrected);

    // What passed, what failed, and what this record has no evidence to claim.
    el("realProvesHead").textContent = COPY.INCIDENT.story.provesHead;
    el("realProves").textContent = COPY.INCIDENT.story.proves;
    el("realFailed").textContent = COPY.INCIDENT.story.whatFailed(
      runs, constraints.plain_summary ?? 0, constraints.evidence_table ?? 0);
    el("realLimit").textContent = COPY.INCIDENT.limitation;
    el("realNoReach").textContent = COPY.INCIDENT.story.noReach;
    el("realWider").textContent = COPY.INCIDENT.story.wider(
      describedRuns,
      gradeRow(describedGrades, WAY_ORDER[0]).valid,
      gradeRow(describedGrades, WAY_ORDER[1]).valid,
      gradeRow(describedGrades, WAY_ORDER[2]).valid);

    // The story closes on specific uses and the experiment that can answer the missing question.
    el("realUseHead").textContent = COPY.INCIDENT.story.useHead;
    el("realUse").textContent = COPY.INCIDENT.use;
    el("realStoryNext").textContent = COPY.INCIDENT.nextExperiment;

    // the registered wording, word for word, one click below the classroom opening
    el("realExactLabel").textContent = COPY.REAL.exactLabel;
    el("realExactNote").textContent = COPY.REAL.exactNote;
    el("realVerdictA").textContent = data.verdicts[0].sentence;
    el("realVerdictB").textContent = data.verdicts[1].sentence;
    el("realHonesty").textContent = data.honesty;
    el("realDisclosure").textContent = data.disclosure;
    el("realAssume").textContent = COPY.REAL.assumption;
    el("realSlotsHead").textContent = COPY.REAL.slotsHead;
    el("realSlotsLead").textContent = COPY.REAL.slotsLead(data.seeds);
    el("realSource").textContent = COPY.REAL.source(data.configurations, data.manifest_hash);
    realSlots.textContent = "";
    for (const slot of data.slots) realSlots.append(realCard(slot));
    // the cards are what make this surface longer than the window, so the cue is asked again
    // as soon as they are on the page
    requestAnimationFrame(() => drawRealMore());
  }

  function loadReal() {
    if (realLoaded || realBusy) return;
    realBusy = true;
    el("realTitle").textContent = COPY.REAL.title;
    el("realLead").textContent = COPY.REAL.loading;
    // the regional lines already read this file at load, so the surface fills from what is in
    // hand rather than asking for it a second time
    if (realSummary) {
      realBusy = false;
      realLoaded = true;
      fillReal(realSummary);
      return;
    }
    fetch(REAL_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`the recorded experiment answered ${r.status}`);
        return r.json() as Promise<RealSummary>;
      })
      .then((data) => { realBusy = false; realLoaded = true; fillReal(data); })
      .catch((error: Error) => {
        realBusy = false;
        el("realLead").textContent = COPY.REAL.failed(error.message);
      });
  }

  /**
   * The cue at the foot of the real-decision surface. The surface holds about three windows of
   * writing at this size, and a reader who cannot see a scrollbar reads the first window and
   * stops. So while there is more below the fold the foot of the frame carries one line saying
   * so, and the line goes when the reader reaches the end.
   */
  const realMore = el("realMore");
  el("realMoreText").textContent = COPY.REAL.scrollCue;
  function drawRealMore() {
    const open = realBox.classList.contains("on");
    const left = realBox.scrollHeight - realBox.clientHeight - realBox.scrollTop;
    realMore.classList.toggle("on", open && left > 24);
  }
  realBox.addEventListener("scroll", drawRealMore, { passive: true });

  const showReal = (on: boolean) => {
    if (on) { loadReal(); openBox(realBox); } else closeBox(realBox);
    realClose.style.display = on ? "block" : "none";
    rig.keysEnabled = !on;
    if (!on) realMore.classList.remove("on");
    else requestAnimationFrame(drawRealMore);
  };
  realClose.addEventListener("click", () => showReal(false));
  el("realWorkedTrace").addEventListener("click", () => {
    showReal(false);
    openTraceFor(TRACE_FLAGSHIP, 0);
  });

  const deskChip = el("desk"), deskToast = el("deskToast");
  let toastTimer = 0;
  /**
   * The world swap. One key exchanges the run on screen, in place, under the same camera and at
   * the same moment: the ground, the marks and the desk's own work all change together and the
   * eye judges by flicking rather than by splitting the frame. The stamp names the run now
   * showing, and the standing assumption line rides with it because a swap is a comparison.
   */
  function setDesk(k: number, announce = true) {
    desk = ((k % arms.length) + arms.length) % arms.length;
    setArm(desk);
    const stamp = COPY.SWAP_STAMP[arms[desk].spec.id] ?? arms[desk].spec.name;
    el("deskName").textContent = stamp;
    feedDrawn = "";
    feed.textContent = "";
    feedRows.clear();
    railDrawn = "";
    arms[desk].resDirty = true;
    stepIndex = -1;
    // the two desks take a different number of steps, so the direction restands on this desk's
    directedJump();
    if (selected) drawPanel();
    if (!announce) return;
    el("deskToastName").textContent = stamp;
    el("deskToastNote").textContent = COPY.ASSUMPTION;
    openBox(deskToast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => closeBox(deskToast), 1900) as unknown as number;
  }
  deskChip.addEventListener("click", () => setDesk(desk + 1));
  setDesk(desk, false);
  // A run of one recorded story has no second desk to swap to and no second desk to stand
  // beside, so the swap chip goes off the frame rather than sitting there doing nothing.
  if (!twoDesks) { deskChip.classList.remove("on"); deskChip.classList.add("gone"); }

  // ------------------------------------------------------------------ the debrief
  /**
   * The one moment where the two desks chose differently, worked out at load by the shared
   * pairing engine in `pairing.ts` and by nothing else on this page. That module matches the two
   * runs by decision stage, finds the stages where they picked different targets, and tells each
   * group of related moments as three beats: the claim verdict that split them, the dispatch
   * difference that followed, and the difference in people reached. Nothing here is written down
   * in advance — if the recorded run changes, the beats change with it.
   */
  let pairingNote = "";
  const episode: DivergenceEpisode | null = (() => {
    // A run of one recorded story has nothing to pair with. The pairing engine needs two desks
    // by construction, so it is never asked, and the debrief states what this record holds.
    if (!twoDesks) {
      pairingNote = COPY.INCIDENT.noBeats;
      return null;
    }
    try {
      const evs = events as unknown as ReplayEvent[];
      // Both arms come out of one certified run, so both carry that run's own equality keys.
      // The pairing engine checks them before it matches anything, and refuses two runs that
      // share a scenario name but were built from different observations.
      const identity = log.run_identity
        ? {
          schemaVersion: log.run_identity.schema_version,
          equalityKeys: log.run_identity.equality_keys ?? null,
        }
        : null;
      const paired = pairRuns(evs, arms[0].spec.id, evs, arms[1].spec.id, identity, identity);
      pairingNote = paired.identity.note;
      return divergenceEpisode(divergences(paired))[0] ?? null;
    } catch (error) {
      pairingNote = (error as Error).message;
      console.warn(`rescueworld: these two runs could not be paired — ${(error as Error).message}`);
      return null;
    }
  })();

  const shortId = (id: string) => id.slice(id.lastIndexOf(":") + 1);
  const tickOfSec = (s: number) => tickOfMoment.get(s) ?? 0;
  const roundStartAt = (k: number, tick: number) => rounds[k][roundAt(tick, k)].start;

  interface Beat { label: string; text: string; ids: string; site: number; from: number; k: number }

  /**
   * The three beats as this desk can be flown through them. A beat carries the place it happened,
   * the round to replay from, and the desk that recorded it.
   */
  function beatsFor(watched: number): Beat[] {
    if (!episode) return [];
    const side = watched === 0 ? "a" : "b";
    const cause = episode.cause;
    // the desk that actually stamped a verdict on the claim version that split the two runs
    const stamped = (v: string | null) => !!v && v !== "NOT_EVALUATED";
    const causeK = stamped(cause[side].verdict) ? watched : (stamped(cause.a.verdict) ? 0 : 1);
    const causeClaim = causeK === 0 ? cause.a.claim : cause.b.claim;
    const causeSite = siteOf.get(cause.siteId) ?? -1;
    const causeTick = tickOfSec(causeClaim ? causeClaim.simTimeS : cause.simTimeS);

    const mine = watched === 0 ? episode.choice.a : episode.choice.b;
    const other = watched === 0 ? episode.choice.b : episode.choice.a;
    const myDispatch = mine.dispatches[0] ?? null;
    const choiceSite = siteOf.get(myDispatch ? myDispatch.siteId : mine.onlySites[0] ?? "") ?? -1;
    const choiceTick = tickOfSec(myDispatch ? myDispatch.simTimeS : episode.simTimeS);

    const mineOut = watched === 0 ? episode.consequence.a : episode.consequence.b;
    const wanted = new Set(mine.onlySites);
    const outcome = mineOut.outcomes.find((o) => wanted.has(o.siteId))
      ?? mineOut.outcomes[mineOut.outcomes.length - 1] ?? null;
    const outcomeSite = siteOf.get(outcome ? outcome.siteId : "") ?? choiceSite;
    const outcomeTick = tickOfSec(outcome ? outcome.simTimeS : episode.simTimeS);

    const deck = COPY.DEBRIEF.beats;
    return [
      {
        label: deck[0].label, text: deck[0].text, site: causeSite, k: causeK,
        from: roundStartAt(causeK, causeTick),
        ids: causeClaim ? causeClaim.claimVersionId : cause.claimVersionId,
      },
      {
        label: deck[1].label, text: deck[1].text, site: choiceSite, k: watched,
        from: roundStartAt(watched, choiceTick),
        ids: [myDispatch?.dispatchId, other.dispatches[0]?.dispatchId]
          .filter(Boolean).join(" · "),
      },
      {
        label: deck[2].label, text: deck[2].text, site: outcomeSite, k: watched,
        from: roundStartAt(watched, outcomeTick),
        ids: [...episode.consequence.a.outcomes, ...episode.consequence.b.outcomes]
          .map((o) => shortId(o.eventId)).join(" · "),
      },
    ];
  }

  /**
   * The outcome sentence the debrief opens with. The deck's sentence carries the two counts, so
   * it is used only while the derived episode still reaches those counts; otherwise the deck's
   * templated verdict sentence states whatever the run now records.
   */
  const debriefOutcome = (() => {
    if (!twoDesks || !hasReachMetric) {
      // the finding sentence: one sentence, the registered result, compared only against the
      // other ways of deciding. Where a run carries no grades it states its own scale instead.
      return hasGrades
        ? COPY.INCIDENT.debriefOutcome(registeredRuns,
          gradeRow(registeredGrades, WAY_ORDER[0]).valid,
          gradeRow(registeredGrades, WAY_ORDER[1]).valid,
          gradeRow(registeredGrades, WAY_ORDER[2]).valid)
        : COPY.INCIDENT.debriefScale(scale.hours, scale.events, scale.decisions);
    }
    if (!episode) return el("verdict").textContent ?? "";
    const derived = [episode.consequence.a.peopleReached, episode.consequence.b.peopleReached];
    const same = derived[0] === finalReached[0] && derived[1] === finalReached[1];
    return same ? COPY.DEBRIEF.outcome : (el("verdict").textContent ?? "");
  })();

  const debriefBox = el("debrief"), debriefCard = el("debriefCard");
  let debriefShown = false;
  /**
   * The cue at the foot of the debrief. The story runs longer than one window at this size, and
   * a reader who cannot see that the card scrolls reads as far as the three counts and stops
   * before the sentence saying what the counts do not show.
   */
  const debriefMore = el("debriefMore");
  el("debriefMoreText").textContent = COPY.REAL.scrollCue;
  function drawDebriefMore() {
    const left = debriefCard.scrollHeight - debriefCard.clientHeight - debriefCard.scrollTop;
    debriefMore.classList.toggle("on", debriefShown && left > 24);
  }
  debriefCard.addEventListener("scroll", drawDebriefMore, { passive: true });
  /**
   * The debrief, told in the order the findings standard sets rather than as a table of
   * results. A stranger reads the human question first, then one moment out of the record with
   * the office that owned it and the minute it was due, then what each of the three ways of
   * working actually did differently, then what one try was and what the checks were, and only
   * then the three counts, each one turned into a share a person already has a feel for.
   *
   * Every sentence comes out of the copy deck and every number out of the sealed run.
   */
  /**
   * One paragraph of the worked example, with the badge the recorded answer earned under it
   * where the story has reached a grade. The badge wording is the story template's own, read
   * off the trace rather than written here.
   */
  function workedPara(box: HTMLElement, text: string, kind = "", badge = "", passed = false) {
    const p = document.createElement("p");
    if (kind) p.className = kind;
    p.textContent = text;
    box.append(p);
    if (!badge) return;
    const mark = document.createElement("div");
    mark.className = passed ? "badge ok" : "badge";
    mark.textContent = badge;
    p.append(mark);
  }

  /**
   * The worked example: one recorded moment of decision carried all the way through the three
   * ways of deciding, so a reader watches one decision go wrong and get put right rather than
   * reading three descriptions of methods. The public record's own choice is read first and is
   * set at the same size as the three answers that follow it, and the closing sentence says
   * what that comparison is allowed to mean.
   *
   * Every number and every badge comes out of the same trace the agent walk-through reads.
   */
  function drawWorkedExample(box: HTMLElement): boolean {
    box.textContent = "";
    const trace = traces.find((row) => row.flagship) ?? null;
    if (!trace || !trace.plain || !trace.table || !trace.final) return false;
    const { plain, table, final } = trace;
    // this sentence supplies its own "the" before the name, so the name arrives without one
    workedPara(box, COPY.INCIDENT.story.workedMoment(
      trace.cutoffWords, GLOSS.withoutArticle(trace.decider),
      table.limit ?? plain.limit ?? 0, table.unit));
    workedPara(box, `${COPY.INCIDENT.story.workedRecordLead} ${trace.real.summary}`);
    workedPara(box, `${COPY.INCIDENT.story.workedPlain(plain.total, plain.unit)}`
      + ` ${plain.unknownsLine}`, "", plain.badge, plain.passed);
    workedPara(box, COPY.INCIDENT.story.workedTable(table.total, table.unit, table.limit ?? 0),
      "", table.badge, table.passed);
    workedPara(box, COPY.INCIDENT.story.workedCheckLead);
    if (trace.check.findings[0]) workedPara(box, trace.check.findings[0], "quote");
    workedPara(box, COPY.INCIDENT.story.workedFix);
    for (const change of trace.check.changes) workedPara(box, change, "small");
    workedPara(box, COPY.INCIDENT.story.workedPassed(final.total, final.unit),
      "", final.badge, final.passed);
    workedPara(box, COPY.TRACE.compareClaim, "small");
    return true;
  }

  function drawDebriefStory(): boolean {
    const told = !twoDesks && hasGrades;
    for (const id of ["debriefScene", "debriefJobHead", "debriefJob", "debriefMomentsHead",
      "debriefDefinition", "debriefWorkedHead", "debriefMethodsHead", "debriefNormal",
      "debriefTry", "debriefResultHead", "debriefZero", "debriefTranslate", "debriefRepair",
      "debriefProvesHead", "debriefProves", "debriefFailed", "debriefNoReach", "debriefWider",
      "debriefUseHead"]) {
      el(id).style.display = told ? "block" : "none";
    }
    el("debriefMoments").style.display = told ? "block" : "none";
    el("debriefWorked").style.display = told ? "block" : "none";
    if (!told) return false;
    const rows = WAY_ORDER.map((way) => gradeRow(registeredGrades, way));
    const [plain, table, corrected] = rows.map((r) => r.valid);
    const runs = registeredRuns;
    const registeredMoments = traces.filter((row) => row.registered);
    const moments = registeredMoments.length || decisionRows.length || 1;
    const tries = Math.max(1, Math.round(runs / Math.max(1, moments)));
    // step one: the incident itself, before the question and long before any count
    el("debriefScene").textContent = opening
      ? `${COPY.INCIDENT.story.scene(
        String(opening.magnitude ?? ""),
        String(opening.maximumIntensity ?? "").replace(/^JMA\s*/i, ""),
        COPY.clockOf(opening.originClock), scale.hours)} ${COPY.INCIDENT.story.replayed(scale.events)}`
      : COPY.INCIDENT.debriefScale(scale.hours, scale.events, scale.decisions);
    el("debriefVerdict").textContent = COPY.INCIDENT.story.question;
    // step two: the job, and every scored moment with the minute it fell due
    el("debriefJobHead").textContent = COPY.INCIDENT.story.jobHead;
    el("debriefJob").textContent = COPY.INCIDENT.story.job(moments, tries);
    el("debriefMomentsHead").textContent = COPY.INCIDENT.story.momentsHead(moments);
    const list = el("debriefMoments");
    list.textContent = "";
    for (const row of registeredMoments) {
      const item = document.createElement("li");
      const line = document.createElement("b");
      line.textContent = COPY.INCIDENT.story.momentLine(
        row.cutoffWords, row.title.replace(/[.\s]+$/, ""));
      const who = document.createElement("i");
      who.textContent = row.deciderLine;
      item.append(line, who);
      // the grade, and one click below it the rules that produced it
      if (row.final) item.append(verdictBadge(row.final.badge, findingsOf(row.final)));
      list.append(item);
    }
    // what passing means, stated before the first badge a reader meets
    el("debriefDefinition").textContent = COPY.INCIDENT.definition;
    // step three: the same moment through all three ways of deciding
    el("debriefWorkedHead").textContent = COPY.INCIDENT.story.workedHead;
    const worked = drawWorkedExample(el("debriefWorked"));
    el("debriefWorkedHead").style.display = worked ? "block" : "none";
    el("debriefWorked").style.display = worked ? "block" : "none";
    // step four: the three ways stated generally, with the ordinary one named first
    el("debriefMethodsHead").textContent = COPY.INCIDENT.story.methodsHead;
    el("debriefNormal").textContent = COPY.INCIDENT.story.normalWork;
    el("debriefTry").textContent = COPY.INCIDENT.story.tryLine(moments, runs);
    // step five: the counts, each one under a sentence that already makes sense without it
    el("debriefResultHead").textContent = COPY.INCIDENT.story.resultHead;
    el("debriefZero").textContent = COPY.INCIDENT.story.zeroMeans(
      runs, gradeRow(registeredGrades, WAY_ORDER[0]).constraint);
    el("debriefTranslate").textContent =
      COPY.INCIDENT.story.translate(runs, plain, table, corrected);
    el("debriefRepair").textContent = COPY.INCIDENT.story.repair(runs, table, corrected);
    // step six: what the run shows, and what it does not show, at the same size
    el("debriefProvesHead").textContent = COPY.INCIDENT.story.provesHead;
    el("debriefProves").textContent = COPY.INCIDENT.story.proves;
    el("debriefFailed").textContent = COPY.INCIDENT.story.whatFailed(runs,
      gradeRow(registeredGrades, WAY_ORDER[0]).constraint,
      gradeRow(registeredGrades, WAY_ORDER[1]).constraint);
    el("debriefNoReach").textContent = COPY.INCIDENT.story.noReach;
    // the wider set of runs stands after the result it is not part of, never before it
    el("debriefWider").textContent = COPY.INCIDENT.story.wider(describedRuns,
      gradeRow(describedGrades, WAY_ORDER[0]).valid,
      gradeRow(describedGrades, WAY_ORDER[1]).valid,
      gradeRow(describedGrades, WAY_ORDER[2]).valid);
    el("debriefUseHead").textContent = COPY.INCIDENT.story.useHead;
    return true;
  }

  function drawDebrief() {
    el("debriefVerdict").textContent = debriefOutcome;
    const storyTold = drawDebriefStory();
    if (twoDesks && hasReachMetric) {
      el("dCountB").textContent = String(finalReached[1]);
      el("dCountA").textContent = String(finalReached[0]);
      el("dNameB").textContent = arms[1].spec.name;
      el("dNameA").textContent = arms[0].spec.name;
      el("debriefHonest").textContent = COPY.DEBRIEF.honesty;
    } else {
      writeTally(el("dTally"), hasGrades ? gradeCells : incidentCellsAt(TICKS));
    }
    // the closing lines: where this could be useful, what it has not shown, the exact next
    // run, all three angles together, and the one file every number came out of
    const closing = !(twoDesks && hasReachMetric);
    el("debriefUse").textContent = closing ? COPY.INCIDENT.use : "";
    el("debriefAssume").textContent = closing ? COPY.INCIDENT.limitation : COPY.ASSUMPTION;
    el("debriefNext").textContent = closing ? COPY.INCIDENT.nextExperiment : "";
    el("debriefAngles").textContent = closing ? COPY.MASTHEAD.angles : "";
    if (closing) el("debriefHonest").textContent = COPY.INCIDENT.honesty(scale.events);
    for (const id of ["debriefUse", "debriefNext", "debriefAngles"]) {
      el(id).style.display = el(id).textContent ? "block" : "none";
    }
    const box = el("debriefBeats");
    box.textContent = "";
    // A run of one recorded story has no two desks to diverge, and the thing it does have to
    // show is what the three ways of deciding were graded at. One card each, in the order the
    // registered experiment lists them.
    if (storyTold) {
      // one card per way of working: its name, what it actually did differently in ordinary
      // words, and what the record graded it at
      for (const way of WAY_ORDER) {
        const registered = gradeRow(registeredGrades, way);
        const card = document.createElement("div");
        card.className = "beat flat";
        const label = document.createElement("div");
        label.className = "t";
        label.textContent = COPY.INCIDENT.ways[way] ?? way;
        const did = document.createElement("p");
        did.textContent = COPY.REAL.deskNote[way] ?? "";
        const passed = document.createElement("p");
        passed.className = "second";
        passed.textContent = COPY.INCIDENT.gradedCard(registered.valid, registered.runs);
        const limits = document.createElement("p");
        limits.className = "second";
        limits.textContent = COPY.INCIDENT.constraintCard(registered.constraint, registered.runs);
        card.append(label, did, passed, limits);
        box.append(card);
      }
      // what passing every check means now stands above the worked example, which is where a
      // reader meets the first badge, rather than under the three cards
      return;
    }
    const beats = beatsFor(desk);
    if (beats.length === 0) {
      const none = document.createElement("p");
      none.textContent = twoDesks ? COPY.NO_PAIR : COPY.INCIDENT.noBeats;
      box.append(none);
      return;
    }
    beats.forEach((b, i) => {
      const card = document.createElement("div");
      card.className = `beat${i === 2 ? " loss" : ""}`;
      const label = document.createElement("div");
      label.className = "t";
      label.textContent = b.label;
      const text = document.createElement("p");
      text.textContent = b.text;
      const ids = document.createElement("div");
      ids.className = "id";
      ids.textContent = b.ids;
      const go = document.createElement("div");
      go.className = "go";
      go.textContent = COPY.DEBRIEF.control;
      card.append(label, text, ids, go);
      card.addEventListener("click", () => flyToBeat(b));
      box.append(card);
    });
  }
  function showDebrief(on: boolean) {
    if (on === debriefShown) return;
    debriefShown = on;
    if (on) {
      drawDebrief();
      setPlay(false);
      debriefBox.classList.add("on");
      requestAnimationFrame(() => { debriefBox.classList.add("opening"); drawDebriefMore(); });
      openBox(debriefCard);
      return;
    }
    debriefMore.classList.remove("on");
    closeBox(debriefCard);
    debriefBox.classList.remove("opening");
    debriefBox.classList.add("closing");
    setTimeout(() => debriefBox.classList.remove("on", "closing"), 220);
  }
  /** Fly to where a beat happened and replay its round, with the rail open on the evidence. */
  function flyToBeat(b: Beat) {
    showDebrief(false);
    if (b.k !== desk) setDesk(b.k, false);
    if (b.site >= 0) {
      const at = targetPos({ kind: "site", i: b.site });
      if (onMap(at)) rig.flyTo(at.x, at.y, at.z, 0.42, 1.6);
      else rig.goHome();
      select({ kind: "site", i: b.site });
    }
    P.tick = b.from;
    stepIndex = -1;
    directedJump();
    setPlay(true);
  }
  el("debriefClose").addEventListener("click", () => showDebrief(false));

  // ------------------------------------------------------------------ the consequence ledger
  /**
   * What the run closes on: all eleven moments of decision, read back in the order they happened.
   *
   * Each row carries four things and no more. What the simulated desk finally chose, in one
   * sentence. How far its eight recorded tries agreed, as the same eight cells the decision rail
   * draws. The grade in the story template's own words, which opens the rules behind it on a
   * click. And the public record set beside it, by kind and scale only.
   *
   * The ledger lists moments and totals nothing across them. There is no sum, no average and no
   * ranking here, because the frozen experiment counted tries at each moment and never scored a
   * run of the world. The only counts the ledger closes on are that experiment's own three, out
   * of forty tries each, stated beside the standing limitation.
   *
   * Every count comes from the registered contract; every sentence comes from the walk-through
   * `trace.ts` already built out of the sealed run. Nothing here computes a number of its own.
   */
  const ledgerBox = el("ledger"), ledgerCloseBtn = el("ledgerClose");
  const ledgerMore = el("ledgerMore");
  let ledgerDrawn = false;
  /** which rows, and whether the closing counts, have opened their own testing block */
  const ledgerTested = new Set<string>();
  let ledgerTotalsShown = false;
  /** the one control and the one block the closing counts live behind, built once and reused */
  let ledgerClosingBox: HTMLElement | null = null;
  let ledgerClosingBtn: HTMLButtonElement | null = null;

  /** one moment of decision as a row of the ledger */
  function ledgerRow(trace: AgentTrace, row: DecisionRow | null): HTMLElement {
    const card = document.createElement("article");
    // no verdict colour at rest, for the same reason the rail rows carry none: a coloured edge
    // makes the grade the first thing read, ahead of the action it grades
    card.className = "ledrow";

    const head = document.createElement("div");
    head.className = "lhead";
    const title = document.createElement("b");
    title.textContent = trace.title;
    const clock = document.createElement("span");
    clock.className = "lclock";
    clock.textContent = trace.cutoffClock;
    head.append(title, clock);
    const who = document.createElement("div");
    who.className = "lwho";
    who.textContent = trace.deciderLine;
    card.append(head, who);

    // ---- the action, then one reason under it, then the leading fact nobody had. Same three
    // lines the rail carries, read from the same walk-through.
    if (trace.final) {
      const chose = document.createElement("p");
      chose.className = "lchose";
      chose.textContent = actionOf(trace.final);
      card.append(chose);
    }
    for (const line of [reasonLineOf(trace.final), unknownLineOf(trace)]) {
      if (!line) continue;
      const because = document.createElement("div");
      because.className = "lwho";
      because.textContent = line;
      card.append(because);
    }
    // ---- the one verdict
    if (trace.final) card.append(verdictBadge(trace.final.badge, findingsOf(trace.final)));
    // ---- what the responders were recorded doing, set beside the simulated proposal at rest and
    // named as the public record, because the ledger's own opening line promises both.
    const said = document.createElement("p");
    said.className = "lsaid";
    said.textContent = trace.real.comparison;
    card.append(said);

    // ---- how that action was tested. The eight cells, what a grade is about, the moment's own
    // classification and the public-record comparison all live behind one press, so the resting
    // row is an action, a reason, an unknown and a verdict and nothing else.
    const shown = ledgerTested.has(trace.momentId);
    const tested = document.createElement("button");
    tested.type = "button";
    // the same control style the rail's own testing block wears; `lopen` stays the one control
    // that opens a moment's walk-through, which is how a gate finds it
    tested.className = "traceopen";
    tested.textContent = shown ? COPY.TREE.testedOpen : COPY.TREE.tested;
    tested.setAttribute("aria-expanded", shown ? "true" : "false");
    tested.addEventListener("click", (event) => {
      event.stopPropagation();
      if (shown) ledgerTested.delete(trace.momentId); else ledgerTested.add(trace.momentId);
      ledgerDrawn = false;
      drawLedger();
    });
    const evidence = document.createElement("div");
    evidence.className = "ledtested";
    evidence.style.display = shown ? "block" : "none";
    evidence.append(stripNode(trace.registered ? stripFor(trace.momentId, FINAL_METHOD) : null));
    if (trace.final) evidence.append(badgeScopeNote());
    if (trace.descriptiveBadge) {
      const badge = document.createElement("div");
      badge.className = "lwho";
      badge.textContent = trace.descriptiveBadge;
      evidence.append(badge);
    }
    // the contract's own classifications, named on the moment they belong to
    for (const mark of highlights?.classificationsFor(trace.momentId) ?? []) {
      const tag = document.createElement("div");
      tag.className = `lmark${mark.kind === "persistent_problem" ? " bad" : ""}`;
      tag.textContent = COPY.OUTCOMES.ledger.marked[mark.kind] ?? mark.kind;
      const say = document.createElement("p");
      say.className = "lmarksay";
      say.textContent = mark.caption;
      evidence.append(tag, say);
    }
    card.append(tested, evidence);

    const open = document.createElement("button");
    open.type = "button";
    open.className = "lopen";
    open.textContent = COPY.OUTCOMES.ledger.row;
    open.addEventListener("click", (event) => {
      event.stopPropagation();
      showLedger(false);
      if (row?.at) {
        rig.flyTo(row.at.x, row.at.y, row.at.z, Math.min(0.62, rig.pose().dist), 1.1);
        handsOffDirection();
      }
      openTraceFor(trace.momentId);
    });
    card.append(open);
    return card;
  }

  /**
   * The line across the head of the ledger. The ledger opens on a key at any hour, so this says
   * which of the two things is true rather than always announcing an ending. It is written every
   * time the ledger opens, not once when its rows are built, because the same reader can open it
   * at hour two and again at the end of the run.
   */
  function drawLedgerHead() {
    // finished means every recorded moment has played, whether the playhead
    // got there by playing to the end or by stepping event by event; the
    // trailing dwell after the last event does not keep the header on
    // "still playing"
    const finished = P.tick >= TICKS
      || (events.length > 0 && P.tick >= tickAt(events[events.length - 1]));
    el("ledgerEnded").textContent = finished
      ? COPY.OUTCOMES.ended : COPY.OUTCOMES.ledger.playing(traces.length);
  }

  function drawLedger() {
    if (ledgerDrawn) return;
    ledgerDrawn = true;
    const rowOf = new Map(decisionRows.map((row) => [row.id, row]));
    const registered = traces.filter((trace) => trace.registered).length;
    el("ledgerTitle").textContent = COPY.OUTCOMES.ledger.title;
    el("ledgerLead").textContent = COPY.OUTCOMES.ledger.lead(traces.length);
    el("ledgerScope").textContent =
      COPY.OUTCOMES.ledger.scope(registered, traces.length - registered);
    // A record with no highlight file derived from it says so here, and every count, marked
    // moment and source line below is left off rather than filled from another run's file.
    el("ledgerNoHighlights").textContent = COPY.OUTCOMES.ledger.noHighlights;
    el("ledgerNoHighlights").style.display = highlights ? "none" : "block";
    el("ledgerDefinition").textContent = COPY.INCIDENT.definition;
    el("ledgerDefinition").style.display = highlights ? "block" : "none";
    // The one visible control that reaches the decision tree. The ledger reads the same eleven
    // moments back as a list, so it is where a reader who wants to see them as one picture is
    // standing when they want it.
    if (treeAvailable && !el("ledgerTree").dataset.wired) {
      el("ledgerTree").dataset.wired = "yes";
      el("ledgerTree").textContent = COPY.TREE.open;
      el("ledgerTree").addEventListener("click", () => { showLedger(false); showTree(true); });
    }
    el("ledgerTree").style.display = treeAvailable ? "" : "none";

    // the moments the contract singles out, each named in the contract's own sentence
    const marked = el("ledgerMarked");
    marked.textContent = "";
    const reel = highlights?.contract.reel ?? [];
    el("ledgerMarkedHead").textContent = COPY.OUTCOMES.ledger.markedHead;
    el("ledgerMarkedHead").style.display = reel.length > 0 ? "block" : "none";
    for (const entry of reel) {
      const trace = traceOf.get(entry.slot_id) ?? null;
      const line = document.createElement("p");
      line.className = "lmarksay";
      const caption = GLOSS.glossed(GLOSS.REEL_CAPTION, entry.kind, entry.caption);
      // the title carries its own full stop, so it is not given a second one here
      line.textContent = trace
        ? `${trace.title.replace(/[.\s]+$/, "")}. ${caption}` : caption;
      const tag = document.createElement("div");
      tag.className = `lmark${entry.kind === "persistent_problem" ? " bad" : ""}`;
      tag.textContent = COPY.OUTCOMES.ledger.marked[entry.kind] ?? entry.kind;
      marked.append(tag, line);
    }

    el("ledgerRowsHead").textContent = COPY.INCIDENT.story.momentsHead(traces.length);
    const rows = el("ledgerRows");
    rows.textContent = "";
    for (const trace of traces) rows.append(ledgerRow(trace, rowOf.get(trace.momentId) ?? null));

    // the three counts the frozen experiment recorded, each stated with what it counts and how
    // many tries it is out of. They are that experiment's own totals, read from the contract,
    // and nothing on this page adds anything up across the eleven rows.
    const totals = highlights?.contract.totals ?? [];
    el("ledgerCountHead").textContent = COPY.OUTCOMES.ledger.countHead;
    el("ledgerCountHead").style.display = totals.length > 0 ? "block" : "none";
    writeTally(el("ledgerTally"), totals.map((total) => ({
      value: total.passes,
      label: COPY.INCIDENT.countLabels.tries(total.tries, total.label),
    })), false);
    // the standing limitation and the source line are both statements about the highlight file,
    // so a record that has none of that file carries neither
    el("ledgerLimit").textContent =
      highlights?.contract.wording.standing_limitation ?? COPY.INCIDENT.limitation;
    el("ledgerLimit").style.display = highlights ? "block" : "none";
    el("ledgerSource").textContent = COPY.OUTCOMES.ledger.source(HIGHLIGHTS_URL);
    el("ledgerSource").style.display = highlights ? "block" : "none";

    // ---- everything the ledger says about the experiment rather than about the disaster, put
    // behind one press.
    //
    // Which rows carry counts, the moments the contract singles out, what a passing check means,
    // the three closing totals and the file they were read from are all statements about the
    // frozen experiment. Standing above the eleven action rows they were the first thing a
    // reader met, which is the hierarchy the action-first contract overturns. They keep their own
    // markup and their own identifiers — a gate reads them by name — and are moved into one
    // block that opens on a press. The standing limitation stays outside it, because the story
    // template requires it wherever a grade is on screen and the rows carry grades at rest.
    //
    // The control and its block are built once and reused. An earlier version made a fresh pair
    // on every toggle and left the old pair standing, so pressing it twice put two controls and
    // two blocks in the frame.
    if (!ledgerClosingBox) {
      const box = document.createElement("div");
      box.className = "ledtested";
      for (const id of ["ledgerScope", "ledgerNoHighlights", "ledgerMarkedHead", "ledgerMarked",
        "ledgerDefinition", "ledgerCountHead", "ledgerTally", "ledgerSource"]) {
        box.append(el(id));
      }
      // the same legend the rail carries, because the ledger is where a reader meets the eight
      // cells a second time and the two surfaces must not explain them differently
      box.append(stripLegendNote());
      const button = document.createElement("button");
      button.type = "button";
      button.className = "traceopen";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        ledgerTotalsShown = !ledgerTotalsShown;
        ledgerDrawn = false;
        drawLedger();
      });
      el("ledgerLimit").before(button, box);
      ledgerClosingBox = box;
      ledgerClosingBtn = button;
    }
    ledgerClosingBtn!.textContent =
      ledgerTotalsShown ? COPY.TREE.testedOpen : COPY.TREE.tested;
    ledgerClosingBtn!.setAttribute("aria-expanded", ledgerTotalsShown ? "true" : "false");
    ledgerClosingBox.style.display = ledgerTotalsShown ? "block" : "none";
  }

  function drawLedgerMore() {
    const open = ledgerBox.classList.contains("on");
    const left = ledgerBox.scrollHeight - ledgerBox.clientHeight - ledgerBox.scrollTop;
    ledgerMore.classList.toggle("on", open && left > 24);
  }
  el("ledgerMoreText").textContent = COPY.OUTCOMES.ledger.scrollCue;
  ledgerBox.addEventListener("scroll", drawLedgerMore, { passive: true });

  /**
   * Whether this record has a ledger at all. The ledger reads the walk-throughs the log's own
   * decision moments build, and a log that records no moment of decision builds none. Such a
   * record used to open an empty frame that still reported another run's marked moments and
   * totals, so on those records the control and the key are simply not there.
   */
  const ledgerAvailable = traces.length > 0;
  // The control list names the l key only on a record that has a ledger to open.
  if (ledgerAvailable) {
    const row = document.createElement("li");
    row.textContent = COPY.HELP.ledgerControl;
    el("helpControls").append(row);
  }

  function showLedger(on: boolean) {
    if (on && !ledgerAvailable) return;
    if (on === ledgerBox.classList.contains("on")) return;
    closeAllReasons();
    if (on) {
      drawLedger();
      drawLedgerHead();
      setPlay(false);
      ledgerBox.scrollTop = 0;
      ledgerBox.classList.remove("closing");
      ledgerBox.classList.add("on");
      // the house reveal: the corner brackets travel out to the frame's corners, then the
      // writing arrives inside them
      requestAnimationFrame(() => {
        ledgerBox.classList.add("opening");
        drawLedgerMore();
      });
      openBox(el("ledgerInner"));
    } else {
      closeBox(el("ledgerInner"));
      ledgerBox.classList.remove("opening");
      ledgerBox.classList.add("closing");
      setTimeout(() => ledgerBox.classList.remove("on", "closing"), 220);
      ledgerMore.classList.remove("on");
    }
    ledgerCloseBtn.style.display = on ? "block" : "none";
    rig.keysEnabled = !on;
  }
  ledgerCloseBtn.addEventListener("click", () => showLedger(false));
  el("debriefLedger").textContent = COPY.OUTCOMES.ledger.open;
  el("debriefLedger").style.display = ledgerAvailable ? "" : "none";
  el("debriefLedger").addEventListener("click", () => {
    showDebrief(false);
    showLedger(true);
  });

  // ------------------------------------------------------------------ the decision tree
  /**
   * The whole record on one screen, one key away.
   *
   * The ledger reads the eleven moments back as a list. This reads the same eleven moments as
   * one picture: a line for the seventy-two hours, a mark on it at the hour each moment really
   * happened, and at the five moments the frozen experiment graded, three short branches
   * carrying the three recorded answers and the check's verdict on each one.
   *
   * It adds no reading of its own. Where a mark sits comes from that moment's recorded second;
   * what a branch says comes from the walk-through `trace.ts` already built and from the frozen
   * experiment's own file; and clicking a branch opens that same walk-through at the card the
   * answer lives on, so there is one walk-through on this page and not two.
   *
   * The one boundary the surface exists inside is written across the foot of the frame at every
   * size: a branch is a recorded answer and a recorded verdict, and nothing here says what the
   * world would have become after a different choice, because nothing ever simulated that.
   */
  const treeBox = el("tree"), treeCloseBtn = el("treeClose"), treeFoot = el("treeFoot");
  const decisionSeconds = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "DECISION_PROPOSED") continue;
    const slot = e.payload?.decision_slot as { decision_slot_id?: string } | undefined;
    decisionSeconds.set(str(slot?.decision_slot_id, e.event_id), e.sim_time_s);
  }
  // how long the line is: the record's own last recorded second, carried up to a whole twelve
  // hours so the scale under the line ends on a mark. Nothing here invents a length.
  let lastRecordedSecond = 0;
  for (const e of events) lastRecordedSecond = Math.max(lastRecordedSecond, e.sim_time_s);
  const treeModel: TreeModel = buildTree(
    traces, decisionSeconds, highlights, windowSecondsOf(lastRecordedSecond),
  );
  /** the playback tick each moment of decision falls on, for opening on the one just reached */
  const treeTickOf = new Map(decisionRows.map((row) => [row.id, row.tick]));
  /** a record that holds no moment of decision draws no tree, so its key does nothing */
  const treeAvailable = treeModel.junctions.length > 0;
  let treeHandle: TreeHandle | null = null;
  function drawTreeOnce() {
    if (treeHandle) return;
    el("treeFootText").textContent = COPY.TREE.footer;
    treeCloseBtn.textContent = COPY.TREE.close;
    treeHandle = drawTree(
      el("treeBody"), treeModel,
      (momentId, card) => { showTree(false); openTraceFor(momentId, card); },
      // the tree opens its panels with this page's own container opening rather than one of
      // its own, so every surface here opens the same way
      openBox,
      // one recorded try, read out of the same sealed events the walk-through reads, on the
      // press that opens it. Nothing is read until a reader asks for that try.
      seedDeskAt,
    );
  }
  function showTree(on: boolean) {
    if (on && !treeAvailable) return;
    if (on === treeBox.classList.contains("on")) return;
    if (on) {
      drawTreeOnce();
      setPlay(false);
      // the moment the run has reached is the one the instrument opens on, so a viewer lands
      // where they were watching rather than back at the start
      const reached = Math.min(TICKS, Math.floor(P.tick));
      treeHandle?.selectAt((momentId) => (treeTickOf.get(momentId) ?? 0) <= reached);
      treeBox.classList.remove("closing");
      treeBox.classList.add("on");
      // the world's own working chrome steps out while the instrument is up
      document.body.classList.add("treeon");
      requestAnimationFrame(() => {
        treeBox.classList.add("opening");
        // the frame has a size now, so the branches can be measured against it
        treeHandle?.shown();
        // The row of beacons takes the keyboard as the instrument opens. Without this the frame
        // opens with nothing focused, and the first press of the down key reaches the page rather
        // than the row, so a reader has to find the row with the tab key before it answers.
        treeHandle?.focusSelected();
      });
    } else {
      treeBox.classList.remove("opening");
      treeBox.classList.add("closing");
      document.body.classList.remove("treeon");
      setTimeout(() => treeBox.classList.remove("on", "closing"), 220);
    }
    treeCloseBtn.style.display = on ? "block" : "none";
    treeFoot.classList.toggle("on", on);
    rig.keysEnabled = !on;
  }
  const treeIsOpen = () => treeBox.classList.contains("on");
  treeCloseBtn.addEventListener("click", () => showTree(false));
  // The control list names the b key only on a record that has a tree to draw.
  if (treeAvailable) {
    const row = document.createElement("li");
    row.textContent = COPY.TREE.control;
    el("helpControls").append(row);
  }

  // ------------------------------------------------------------------ the ghost echo
  /**
   * Comparison without splitting the frame. At the moment the watched desk sends a team, the
   * other desk's team of the same name stands on the ground where it went instead: a spectral
   * marker, an illustrative route from the place this desk chose to the place that one chose,
   * and one sentence naming it. It is visible for the beat and then gone.
   *
   * Which team, which place and which moment all come out of the shared pairing engine — the
   * dispatch the other desk made to the site only it chose, matched to this desk's dispatch of
   * the same recorded resource. Nothing about the ghost is a wall-clock effect: its fade is a
   * pure function of the playback tick, so seeking to the same tick draws the same echo.
   */
  const GHOST_LIFE = 44;
  interface Ghost {
    atTick: number; site: number; text: string;
    route: { setFade(f: number): void }; alpha: THREE.BufferAttribute;
  }
  const ghostBox = el("ghost");
  function buildGhost(watched: number): Ghost | null {
    if (!episode) return null;
    const other = watched === 0 ? episode.choice.b : episode.choice.a;
    const theirs = other.dispatches[0] ?? null;
    if (!theirs) return null;
    const theirSite = siteOf.get(theirs.siteId) ?? -1;
    if (theirSite < 0) return null;
    const arm = arms[watched];
    let mineTick = -1, mineSite = -1;
    for (let i = 0; i < arm.order.length; i++) {
      const e = arm.order[i];
      if (e.arm !== arm.spec.id || e.type !== "RESOURCE_DISPATCHED") continue;
      if (str(e.payload?.resource_id) !== theirs.resourceId) continue;
      mineTick = arm.evTick[i];
      mineSite = siteIdx(e);
      break;
    }
    if (mineTick < 0) return null;

    // the route: a straight illustrative path from the place this desk chose to that one, laid
    // on the ground it crosses. The recorded events carry no road, and the card says so.
    const from = targetPos({ kind: "site", i: mineSite >= 0 ? mineSite : theirSite });
    const to = targetPos({ kind: "site", i: theirSite });
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      const x = lerp(from.x, to.x, k), z = lerp(from.z, to.z, k);
      points.push(new THREE.Vector3(x, groundY(x, z) + 0.010, z));
    }
    const route = buildRoute({ points, colour: BONE, width: 0.006, gap: 0.40, segments: 9 });
    scene.add(route.object);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position",
      new THREE.BufferAttribute(new Float32Array([to.x, to.y + 0.014, to.z]), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([0.055]), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array([0]), 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array([...BONE]), 3));
    const marker = new THREE.Points(geo, mkPoint(1, 1, 1, 0, 1, 190));
    marker.frustumCulled = false;
    marker.renderOrder = 5;
    scene.add(marker);

    return {
      atTick: mineTick, site: theirSite,
      text: COPY.GHOST.named(
        arms[1 - watched].spec.name.replace(/^the /i, ""),
        COPY.teamName(theirs.resourceId),
        COPY.siteName(theirSite)),
      route,
      alpha: geo.getAttribute("aAlpha") as THREE.BufferAttribute,
    };
  }
  const ghosts: (Ghost | null)[] = arms.map((_a, k) => buildGhost(k));
  el("ghostNote").textContent = COPY.ASSUMPTION;

  function drawGhost(tick: number) {
    let showing = false;
    for (let k = 0; k < ghosts.length; k++) {
      const g = ghosts[k];
      if (!g) continue;
      const age = tick - g.atTick;
      const live = k === desk && !split && age >= 0 && age <= GHOST_LIFE;
      const fade = live
        ? Math.min(1, age / 3) * (1 - clamp((age - (GHOST_LIFE - 12)) / 12))
        : 0;
      g.route.setFade(fade * 0.85);
      g.alpha.setX(0, fade * 0.60);
      g.alpha.needsUpdate = true;
      if (k !== desk || fade <= 0.05) continue;
      const at = toScreen(targetPos({ kind: "site", i: g.site }));
      if (!at.infront) continue;
      showing = true;
      el("ghostText").textContent = g.text;
      ghostBox.style.left = `${Math.round(at.x)}px`;
      ghostBox.style.top = `${Math.round(at.y)}px`;
      ghostBox.classList.add("on");
    }
    if (!showing) ghostBox.classList.remove("on");
  }

  // ------------------------------------------------------------------ the map telegraph
  /**
   * What is about to be decided, drawn on the ground before it is decided.
   *
   * The decision rail says a moment is coming next and says nothing about what is at stake. This
   * puts the stakes on the map: as a deadline comes up, every place the recorded answers proposed
   * sending to lights as a hollow, hatched mark at the position the record puts it, with the
   * count that answer put on it. Two sets are drawn and keyed by colour — the places the
   * plain-notes desk named, and the places the evidence-table desk named — so where the two
   * disagree, the disagreement is the picture. When the deadline passes, the places the final
   * decision actually sends to draw their routes and stay solid, the rejected proposals fade, and
   * one sentence says what was chosen.
   *
   * The vocabulary is capped at three marks, which is the place, the number of teams and which
   * desk wanted it. Anything a fourth mark would say belongs in the rail.
   *
   * Where does a proposed place stand? At the coordinate the record itself puts it, which this
   * page already works out for every recorded identifier: the point of the first recorded moment
   * that named that place. Several places share one such point, because the record puts several
   * of them at one prefectural office, so those places form one ordered stack at that point
   * rather than piling on top of each other. A place the record puts nowhere on this ground gets
   * no mark at all and is counted in one sentence instead, because a mark at a made-up position
   * would be an invention.
   *
   * Determinism: every fade is a pure function of the playback tick. Seeking to the same tick
   * always draws the same telegraph.
   */
  const TELEGRAPH_HOLD = 34;              // ticks a resolved telegraph stays before it goes
  /**
   * How many proposed places one stack draws at once. Into the Breach cut its weapon roster to
   * three kinds because the preview of every enemy attack had to stay readable on one screen, and
   * the same cap applies here: a stack that draws eight places over the ground is unreadable, so
   * it draws four and counts the rest in one sentence. Every one of them is listed in full in the
   * walk-through the moment opens.
   */
  const TELEGRAPH_CELLS = 4;
  /** ticks a moment that has just resolved keeps the picture, so its settling is always seen */
  const TELEGRAPH_SETTLE = 7;
  const PLAIN_METHOD = "plain_summary", TABLE_METHOD = "evidence_table";

  interface GhostMark {
    targetId: string;
    /** the place, in the words the record's own label gives it */
    place: string;
    quantity: number;
    unit: string;
    /** which way of deciding wanted this place, said in that desk's own name */
    who: string;
    /** true where both shown ways of deciding named this place with the same count */
    agreed: boolean;
    /** true where only the plain-notes desk named it, which takes the burn colour */
    burn: boolean;
    /** true where the final simulated decision sends to this place */
    taken: boolean;
    site: number;
  }
  interface TelegraphStack {
    site: number;
    marks: GhostMark[];
    node: HTMLElement;
    cells: HTMLElement[];
    /** the state line inside each cell, rewritten as the deadline passes */
    states: HTMLElement[];
    alpha: THREE.BufferAttribute;
    route: { setFade(fade: number): void } | null;
    /** true where the chosen action sends to at least one place standing at this point */
    chosen: boolean;
  }
  interface Telegraph {
    momentId: string;
    /** the tick the deadline falls on */
    tick: number;
    stacks: TelegraphStack[];
    unplaced: number;
    /**
     * How the chosen action's own destinations came out against acceptance gate 6 of
     * `docs/rescueworld/ACTION-FIRST-PRESENTATION-CONTRACT.md`: a destination the sealed record
     * places gets a mark at that recorded position, and a destination it places nowhere stays
     * written in the panel and never gains a point.
     */
    chosenPlaced: number;
    chosenUnplaced: number;
  }

  const telegraphBox = el("telegraph");
  /**
   * One moment's proposals, read out of the walk-through this page already built. The plan rows
   * carry the place, the count and the count noun; nothing here is computed beyond adding up the
   * recorded quantities a single answer gave one place.
   */
  function ghostMarks(trace: AgentTrace): {
    marks: GhostMark[]; unplaced: number; chosenPlaced: number; chosenUnplaced: number;
  } {
    // The count noun follows the count on that one line rather than the plan's own total, so a
    // place that takes one truck reads "1 water truck" and never "1 water trucks".
    const gather = (desk: TraceDesk | null) => {
      const by = new Map<string, { place: string; quantity: number; unit: string }>();
      if (!desk) return by;
      for (const row of desk.assignments) {
        const held = by.get(row.targetId);
        if (held) held.quantity += row.quantity;
        else by.set(row.targetId, { place: row.targetLabel, quantity: row.quantity, unit: "" });
      }
      // The count noun is the one the action sentence itself uses, read from the same table
      // `actionOf` reads, so a panel cannot call the same thing an officer pair on one line and
      // a unit on the next. `desk.unitWords` is the walk-through's own shorter table and names
      // only the divisible pools, which is why it used to say "unit" under "one officer pair".
      const words = COPY.TREE.actionUnit[desk.kind] ?? COPY.TRACE.unitFallback;
      for (const held of by.values()) {
        held.unit = held.quantity === 1 ? words.one : words.many;
      }
      return by;
    };
    const plain = gather(trace.plain);
    const table = gather(trace.table);
    // The chosen action is read first and its own quantities are the ones a cell states, because
    // the chosen action is what this panel is about. Acceptance gate 6 of the action-first
    // contract asks that every destination the record places for that action carries a mark on
    // the ground, so its destinations lead the order rather than being folded in afterwards.
    const chosen = gather(trace.final);
    const taken = new Set(chosen.keys());
    const order: string[] = [];
    for (const id of chosen.keys()) if (!order.includes(id)) order.push(id);
    for (const id of table.keys()) if (!order.includes(id)) order.push(id);
    for (const id of plain.keys()) if (!order.includes(id)) order.push(id);

    const marks: GhostMark[] = [];
    let unplaced = 0;
    let chosenPlaced = 0;
    let chosenUnplaced = 0;
    for (const id of order) {
      const site = siteOf.get(id) ?? -1;
      const fromChosen = chosen.get(id) ?? null;
      const fromTable = table.get(id) ?? null;
      const fromPlain = plain.get(id) ?? null;
      const held = fromChosen ?? fromTable ?? fromPlain!;
      // A destination the record puts nowhere on this ground gets no mark, ever. It is counted
      // here and named in the panel's own sentence instead, because a mark at a position this
      // page made up would be an invention.
      if (site < 0 || !onMap(targetPos({ kind: "site", i: site }))) {
        unplaced++;
        if (fromChosen) chosenUnplaced++;
        continue;
      }
      if (fromChosen) chosenPlaced++;
      const agreed = !!fromTable && !!fromPlain && fromTable.quantity === fromPlain.quantity;
      const burn = !fromTable;
      marks.push({
        targetId: id,
        place: held.place,
        quantity: held.quantity,
        unit: held.unit,
        // Which way of working asked for this place is a fact about the experiment, not about
        // the disaster, so it is carried but drawn only where the two ways disagreed. The
        // action-first contract makes method disagreement a secondary mode of this panel.
        who: agreed
          ? ""
          : COPY.OUTCOMES.telegraph.wanted(
            COPY.TRACE.deskName[burn ? PLAIN_METHOD : TABLE_METHOD] ?? ""),
        agreed,
        burn,
        taken: taken.has(id),
        site,
      });
    }
    return { marks, unplaced, chosenPlaced, chosenUnplaced };
  }

  /** the one telegraph a moment carries, or nothing where the record places none of its places */
  function buildTelegraph(row: DecisionRow): Telegraph | null {
    const trace = traceOf.get(row.id) ?? null;
    if (!trace) return null;
    const { marks, unplaced, chosenPlaced, chosenUnplaced } = ghostMarks(trace);
    if (marks.length === 0) return null;
    // the three sentences the panel leads with once the deadline passes: what the agents chose to
    // do, the one report that answer weighed behind it, and the leading fact nobody had
    const action = trace.final ? actionOf(trace.final) : "";
    const because = [reasonLineOf(trace.final), unknownLineOf(trace)]
      .filter(Boolean).join(" ");

    // several proposed places stand at one recorded point, so they form one ordered stack there
    const bySite = new Map<number, GhostMark[]>();
    for (const mark of marks) {
      const held = bySite.get(mark.site);
      if (held) held.push(mark);
      else bySite.set(mark.site, [mark]);
    }
    const from = row.at ?? targetPos({ kind: "site", i: [...bySite.keys()][0] });
    const stacks: TelegraphStack[] = [];
    for (const [site, own] of bySite) {
      const node = document.createElement("div");
      node.className = "tgstack";
      const label = document.createElement("div");
      label.className = "tglab";
      label.textContent = COPY.OUTCOMES.telegraph.label;
      const due = document.createElement("p");
      due.className = "tgdue";
      due.textContent = COPY.OUTCOMES.telegraph.due(row.clock);
      node.append(label, due);
      // ---- what the agents chose to do, and the one report behind it. Both stand above the
      // destinations rather than under them, and both are written by `drawTelegraph` once the
      // deadline has passed, because before the deadline nothing has been chosen yet and a
      // panel that announced the answer early would be telling the viewer something untrue.
      const said = document.createElement("p");
      said.className = "tgsaid";
      const why = document.createElement("p");
      why.className = "tgnote tgwhy";
      node.append(said, why);
      // The stack draws at most four places. Which four is the record's own order, and the rest
      // are counted in one sentence rather than drawn smaller.
      const shown = own.slice(0, TELEGRAPH_CELLS);
      const cells: HTMLElement[] = [];
      const states: HTMLElement[] = [];
      for (const mark of shown) {
        const cell = document.createElement("div");
        cell.className = `ghostcell${mark.burn ? " burn" : ""}`;
        // one destination, said as the decision tree already says one piece of an action: how
        // many of what, and where it goes
        const words = document.createElement("b");
        words.textContent = `${COPY.TREE.spot(
          `${COPY.countWord(mark.quantity)} ${mark.unit}`)} ${COPY.TREE.spotTo(mark.place)}`;
        const state = document.createElement("u");
        cell.append(words, state);
        node.append(cell);
        cells.push(cell);
        states.push(state);
      }
      if (own.length > shown.length) {
        const more = document.createElement("p");
        more.className = "tgnote";
        more.textContent = COPY.OUTCOMES.telegraph.more(own.length - shown.length);
        node.append(more);
      }
      // Which way of working asked for a place is the experiment's business, so it is said once
      // at the foot of the panel and only where the two ways named different places. It never
      // captions a destination and it never stands above the action.
      const split = shown.filter((mark) => mark.who);
      if (split.length > 0) {
        const note = document.createElement("p");
        note.className = "tgnote";
        note.textContent = split
          .map((mark) => `${mark.place}: ${mark.who}`).join(". ");
        node.append(note);
      }
      // the count of proposed places the record puts nowhere on this ground, stated once
      if (unplaced > 0 && stacks.length === 0) {
        const note = document.createElement("p");
        note.className = "tgnote";
        note.textContent = COPY.OUTCOMES.telegraph.unplaced(unplaced);
        node.append(note);
      }
      // What a hollow mark is, said on the stack itself. It goes the moment the deadline passes,
      // because from then on the places the decision took are no longer proposals and a line
      // saying nothing has moved would be untrue.
      const what = document.createElement("p");
      what.className = "tgnote tgwhat";
      what.textContent = COPY.OUTCOMES.telegraph.what;
      node.append(what);
      telegraphBox.append(node);

      // the hollow mark on the ground itself, under the stack
      const at = targetPos({ kind: "site", i: site });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position",
        new THREE.BufferAttribute(new Float32Array([at.x, at.y + 0.012, at.z]), 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([0.050]), 1));
      geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array([0]), 1));
      geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array([...SIG]), 3));
      const points = new THREE.Points(geo, mkPoint(1, 1, 1, 0, 1, 170));
      points.frustumCulled = false;
      points.renderOrder = 5;
      scene.add(points);

      // the route the chosen dispatch draws once the deadline has passed. A place the moment was
      // itself recorded at needs no route, so none is built where the two points are one point.
      let route: { setFade(fade: number): void } | null = null;
      const goes = own.some((mark) => mark.taken);
      if (goes && from.distanceTo(at) > 0.02) {
        const path: THREE.Vector3[] = [];
        for (let i = 0; i <= 24; i++) {
          const k = i / 24;
          const x = lerp(from.x, at.x, k), z = lerp(from.z, at.z, k);
          path.push(new THREE.Vector3(x, groundY(x, z) + 0.010, z));
        }
        const built = buildRoute({ points: path, colour: SIG, width: 0.005, gap: 0.42 });
        scene.add(built.object);
        route = built;
      }
      stacks.push({
        site, marks: shown, node, cells, states, route,
        alpha: geo.getAttribute("aAlpha") as THREE.BufferAttribute,
        chosen: goes,
      });
      // the two sentences this stack shows once its deadline passes, held on the nodes so the
      // per-tick draw writes them without reading the record again
      said.dataset.action = action;
      why.dataset.reason = because;
    }
    return {
      momentId: row.id, tick: row.tick, stacks, unplaced, chosenPlaced, chosenUnplaced,
    };
  }

  const telegraphs: Telegraph[] = !walkActs ? []
    : decisionRows.map(buildTelegraph).filter((held): held is Telegraph => held !== null);
  /** how many ticks before a deadline the places under consideration light up */
  const telegraphLead = (i: number) =>
    TELEGRAPH_LEAD_SECONDS * (pacing[0][i]?.rate ?? 1);
  /**
   * The lead in ticks for one moment, taken from the act that moment falls in, so a dense act
   * that plays fast and a sparse act that plays slowly both light their proposals the same number
   * of seconds of watching before the deadline.
   */
  function leadFor(tick: number): number {
    const i = rounds[0].findIndex((r) => tick >= r.start && tick <= r.end);
    return telegraphLead(i < 0 ? 0 : i);
  }
  const telegraphLeadOf = new Map(telegraphs.map((t) => [t.momentId, leadFor(t.tick)]));

  /** how far through its own life one telegraph stands at this tick, or nothing where it is shut */
  function telegraphAt(moment: Telegraph, tick: number): { fade: number; past: boolean } | null {
    const lead = telegraphLeadOf.get(moment.momentId) ?? 0;
    const age = tick - (moment.tick - lead);
    const life = lead + TELEGRAPH_HOLD;
    if (!walkActs || split || age < 0 || age > life) return null;
    // the fade in and the fade out are both functions of the tick alone
    const fade = Math.min(1, age / Math.max(1, lead * 0.4))
      * (1 - clamp((age - (life - 10)) / 10));
    return { fade, past: tick >= moment.tick };
  }

  /**
   * The part of the frame a stack may stand in: the ground between the masthead band at the top,
   * the transport at the foot and the decision rail down the right edge. Measured off the page as
   * it stands, so a resized window and a hidden panel both work without a second rule.
   */
  function telegraphRoom(): { left: number; right: number; top: number; bottom: number } {
    const edge = 16;
    const seen = (id: string) => {
      const node = document.getElementById(id);
      if (!node || node.classList.contains("gone")) return null;
      const style = getComputedStyle(node);
      if (style.visibility === "hidden" || Number(style.opacity) < 0.06) return null;
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0 ? box : null;
    };
    // the band across the top of the frame: the scrim, the masthead, the incident control and
    // the seventy-two-hour ribbon, whichever of them are standing
    let top = edge;
    for (const id of ["topscrim", "mast", "chip", "outcome", "quakestrip"]) {
      const box = seen(id);
      if (box) top = Math.max(top, box.bottom + edge);
    }
    const rail = seen("rail");
    const bar = seen("bar");
    return {
      left: edge,
      right: Math.max(edge + 280, (rail ? rail.left : W) - edge),
      top,
      bottom: Math.max(top + 120, (bar ? bar.top : H) - edge),
    };
  }

  /**
   * The standing panels a stack has to keep off, over and above the frame's own edges: the
   * regional feed, the smaller map, the report feed and anything else floating over the ground.
   * A stack drawn under one of these has its own foot printed over, and a viewer reads neither.
   */
  const TELEGRAPH_CLEAR_OF = ["beats", "mini", "feed", "narrate", "caption", "layerNote",
    "deskToast", "actcardBox", "ghost"];
  /** one rectangle on the screen, in the page's own coordinates */
  interface Rect { left: number; top: number; right: number; bottom: number }
  const rectsHit = (a: Rect, b: Rect) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  /** the box a standing panel occupies, or nothing where that panel is not on screen */
  function panelRect(id: string): Rect | null {
    const node = document.getElementById(id);
    if (!node || node.classList.contains("gone")) return null;
    const style = getComputedStyle(node);
    if (style.visibility === "hidden" || Number(style.opacity) < 0.06) return null;
    const box = node.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return null;
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
  }
  /**
   * One stack moved off whatever it lands on. It is lifted above the panel first, because a
   * stack still points at its own ground when it stands higher over it. Where there is no room
   * above, it goes sideways to whichever side of the panel holds it.
   *
   * `also` carries the stacks this same frame has already placed. One decision can propose
   * places at two recorded positions, and each position gets its own panel; without this, those
   * two panels landed on the same stretch of ground and clipped each other's heading and rows,
   * so a viewer read neither. A sibling is treated exactly like any other standing panel.
   */
  function telegraphClear(
    box: { x: number; y: number; w: number; h: number },
    room: { left: number; right: number; top: number; bottom: number },
    also: Rect[] = [],
  ): { x: number; y: number } {
    let { x, y } = box;
    const gap = 10;
    const walls: Rect[] = [];
    for (const id of TELEGRAPH_CLEAR_OF) {
      const rect = panelRect(id);
      if (rect) walls.push(rect);
    }
    for (const other of [...walls, ...also]) {
      if (!rectsHit({ left: x, top: y, right: x + box.w, bottom: y + box.h }, other)) continue;
      const lifted = other.top - gap - box.h;
      if (lifted >= room.top) { y = lifted; continue; }
      const toLeft = other.left - gap - box.w;
      const toRight = other.right + gap;
      if (toLeft >= room.left) x = toLeft;
      else if (toRight + box.w <= room.right) x = toRight;
      else y = Math.max(room.top, lifted);
    }
    return { x, y };
  }

  /**
   * The one line that stands in for a stack this window has no room to draw clear of the others.
   * The research rule this page follows is to cut what is shown rather than shrink it, so a stack
   * with nowhere clear to stand is dropped whole and counted here instead of being drawn over its
   * neighbour. At 1600 by 900 every recorded decision fits and this line never appears.
   */
  const telegraphCrowded = document.createElement("p");
  telegraphCrowded.className = "tgnote tgcrowd";
  telegraphCrowded.style.display = "none";
  telegraphBox.append(telegraphCrowded);

  function drawTelegraph(tick: number) {
    // Two decision moments can stand a few ticks apart, and two sets of proposals over one
    // stretch of ground is unreadable. Only the moment whose own deadline is nearest to this
    // tick is drawn, so a viewer reads one decision at a time and always sees a moment resolve
    // before the next one lights up. The rest is in the rail.
    // A moment that has just resolved holds the frame for a few ticks whatever else is coming,
    // because the resolution is the thing the telegraph was built for: two of these deadlines
    // fall five ticks apart in the record, and without this the second would take the picture
    // before anyone saw the first one settle.
    let live: Telegraph | null = null;
    let nearest = Infinity;
    for (const moment of telegraphs) {
      if (telegraphAt(moment, tick) === null) continue;
      const settling = tick >= moment.tick && tick <= moment.tick + TELEGRAPH_SETTLE;
      const away = settling ? moment.tick - tick - 1 : Math.abs(tick - moment.tick);
      if (away < nearest) { nearest = away; live = moment; }
    }
    // Where the live moment proposes places at more than one recorded position, its stacks are
    // placed one after another in the record's own order, and each one is kept clear of the ones
    // already standing. The order is fixed, so the same tick always places them the same way.
    const placedBoxes: Rect[] = [];
    let lastPlaced: Rect | null = null;
    let crowded = 0;
    let crowdedFade = 0;
    for (const held of telegraphs) {
      const standing = held === live ? telegraphAt(held, tick) : null;
      const fade = standing?.fade ?? 0;
      const past = standing?.past ?? false;
      for (const stack of held.stacks) {
        // Acceptance gate 6 of the action-first contract: once the deadline has passed, the
        // ground under a place the chosen action sends to carries the strongest mark on the
        // world, and a point the record never placed is not drawn at all. Before the deadline
        // every place under consideration is drawn at the same quiet strength, because none of
        // them has been chosen yet.
        stack.alpha.setX(0, fade * (past ? (stack.chosen ? 0.86 : 0.24) : 0.34));
        stack.alpha.needsUpdate = true;
        stack.route?.setFade(past ? fade * 0.80 : 0);
        if (fade <= 0.04) { stack.node.style.opacity = "0"; continue; }
        const at = toScreen(targetPos({ kind: "site", i: stack.site }));
        if (!at.infront) { stack.node.style.opacity = "0"; continue; }
        // once the deadline has passed, the places the decision actually sends to stop being
        // proposals and the rejected ones fade back
        stack.cells.forEach((cell, i) => {
          const mark = stack.marks[i];
          cell.classList.toggle("taken", past && mark.taken);
          cell.classList.toggle("faded", past && !mark.taken);
          const state = stack.states[i];
          if (state) {
            state.textContent = !past
              ? COPY.OUTCOMES.telegraph.underConsideration
              : mark.taken
                ? COPY.OUTCOMES.telegraph.chosen
                : COPY.OUTCOMES.telegraph.notChosen;
          }
        });
        // What the agents chose to do leads the panel the moment the deadline passes, with the
        // one report behind it directly under. Before the deadline both are empty, because the
        // answer this panel is about had not been given yet.
        const said = stack.node.querySelector(".tgsaid");
        if (said instanceof HTMLElement) {
          said.textContent = past ? said.dataset.action ?? "" : "";
        }
        const why = stack.node.querySelector(".tgwhy");
        if (why instanceof HTMLElement) {
          why.textContent = past ? why.dataset.reason ?? "" : "";
        }
        const what = stack.node.querySelector(".tgwhat");
        if (what instanceof HTMLElement) what.style.display = past ? "none" : "block";
        // The stack stands over the place it is about, and it is kept inside the ground the world
        // is drawn on rather than inside the whole window: a stack that runs under the masthead
        // or under the decision rail is a stack a viewer reads half of. It is nudged only as far
        // as it has to be, so it still points at its own place.
        const box = stack.node.getBoundingClientRect();
        const width = box.width || 246, height = box.height || 120;
        const room = telegraphRoom();
        const left = clamp(at.x, room.left + width / 2,
          Math.max(room.left + width / 2, room.right - width / 2));
        const top = clamp(at.y - 16, room.top + height,
          Math.max(room.top + height, room.bottom));
        const placed = telegraphClear(
          { x: left - width / 2, y: top - height, w: width, h: height }, room, placedBoxes);
        const box2 = {
          left: placed.x, top: placed.y, right: placed.x + width, bottom: placed.y + height,
        };
        // Nowhere clear was found, so this stack is dropped whole and counted in one line rather
        // than drawn over the stack already standing.
        if (placedBoxes.some((other) => rectsHit(box2, other))) {
          stack.node.style.opacity = "0";
          crowded++;
          crowdedFade = fade;
          continue;
        }
        placedBoxes.push(box2);
        lastPlaced = box2;
        stack.node.style.left = `${Math.round(placed.x + width / 2)}px`;
        stack.node.style.top = `${Math.round(placed.y + height)}px`;
        stack.node.style.opacity = fade.toFixed(3);
      }
    }
    if (crowded > 0 && lastPlaced) {
      telegraphCrowded.textContent = COPY.OUTCOMES.telegraph.crowded(crowded);
      telegraphCrowded.style.display = "block";
      telegraphCrowded.style.left = `${Math.round(lastPlaced.left)}px`;
      telegraphCrowded.style.top = `${Math.round(lastPlaced.bottom + 6)}px`;
      telegraphCrowded.style.opacity = crowdedFade.toFixed(3);
    } else {
      telegraphCrowded.style.display = "none";
    }
  }

  // ------------------------------------------------------------------ the story cards
  /**
   * As an act plays, a card hangs over the place in the world the record is talking about,
   * carrying that beat's own plain sentence, with a leader line running down to the place.
   *
   * Which beats get a card is the record's choice and not this page's: a beat gets one where
   * the record asks for a hold on it, which is the opening, a decision moment, a recorded
   * response milestone and an agency bulletin. The drizzle of aftershocks and road closures is
   * batched by the hour and carried by the ground, the closing lines and the feed instead, so
   * the cards stay readable rather than flickering past.
   *
   * Three cards stand at once; a fourth retires the oldest. Clicking one selects the thing
   * underneath it, so the information panel opens on the record behind the sentence. Which
   * cards stand is a pure function of the playback tick, so a seek to the same tick shows the
   * same three. Only the reveal and the layout run on elapsed real time, exactly like every
   * other panel here, and pausing freezes the cards where they stand.
   */
  const CARDS_SHOWN = 3;
  const billboards: Billboards | null = walkActs
    ? createBillboards(document.body, null,
      { maxVisible: CARDS_SHOWN, runMax: 300, runStep: 14 })
    : null;
  const cardRows = actBeatRows.filter((row) => row.at !== null && row.beat.holdSeconds > 0);
  /**
   * The place a card hangs over. Several recorded moments happen at one place — thirty-three of
   * them stand at the prefectural headquarters — so one card stands there and says what most
   * recently happened, rather than three cards stacking on the same rooftop.
   */
  const cardPlace = (row: BeatRow) =>
    `place ${row.at!.x.toFixed(4)} ${row.at!.z.toFixed(4)}`;
  /** the three places this tick is narrating, and the newest moment recorded at each */
  function cardsAt(tick: number): BeatRow[] {
    const held = new Map<string, BeatRow>();
    for (const row of cardRows) {
      if (row.tick > tick) break;
      const key = cardPlace(row);
      held.delete(key);
      held.set(key, row);
      while (held.size > CARDS_SHOWN) {
        held.delete(held.keys().next().value as string);
      }
    }
    return [...held.values()];
  }
  /**
   * The words one card carries. The heading is the moment's own recorded headline, which the
   * record writes the way a newspaper writes one. Under it stands a complete sentence, and
   * that sentence is the record's own too wherever the record wrote one: a recorded response
   * milestone carries a plain description of what happened, and where it carries none the
   * sentence is composed from the moment's own recorded fields. Nothing is invented and no
   * number appears without saying what it counts.
   */
  function cardWords(row: BeatRow): { heading: string; sentence: string } {
    const first = events.find((e) => e.sequence === row.beat.firstSequence);
    const payload = first?.payload ?? {};
    const heading = beatWords(row.beat).replace(/[.\s]+$/, "");
    const detail = GLOSS.plainDetail(str(payload.milestone_id), str(payload.detail));
    if (detail) return { heading, sentence: detail };
    if (row.beat.kind === "decision") {
      const slot = payload.decision_slot as
        { decider?: string; cutoff_at?: string; decision_slot_id?: string } | undefined;
      // The card over a decision says what the agents chose to do there and the one report
      // behind it. It used to count the ways of deciding that were run against the moment
      // afterwards, which is a fact about the experiment standing where the disaster action
      // belongs. The two sentences are the same ones the rail and the map carry, read through
      // the same walk-through, so one moment never reads three ways.
      const trace = traceOf.get(str(slot?.decision_slot_id)) ?? null;
      const action = trace?.final ? actionOf(trace.final) : "";
      if (action) {
        const because = [reasonLineOf(trace?.final ?? null), unknownLineOf(trace)]
          .filter(Boolean).join(" ");
        return { heading, sentence: because ? `${action} ${because}` : action };
      }
      const ways = new Set<string>();
      const demo = payload.full_incident_demonstration as
        { choices?: { graph_id?: string }[] } | undefined;
      for (const choice of demo?.choices ?? []) if (choice.graph_id) ways.add(choice.graph_id);
      return {
        heading,
        sentence: COPY.INCIDENT.card.decision(
          GLOSS.plainDecider(str(slot?.decision_slot_id), str(slot?.decider, "no one by name")),
          COPY.clockOf(str(slot?.cutoff_at, row.beat.startClock)),
          COPY.countWord(ways.size)),
      };
    }
    if (row.beat.kind === "bulletin") {
      return { heading, sentence: COPY.INCIDENT.card.bulletin(COPY.clockOf(row.beat.startClock)) };
    }
    if (row.beat.kind === "opening") {
      const incident = payload.incident as { magnitude?: number } | undefined;
      return {
        heading: COPY.INCIDENT.opening.label,
        sentence: COPY.INCIDENT.card.opening(
          String(incident?.magnitude ?? log.incident?.magnitude ?? ""),
          COPY.clockOf(row.beat.startClock)),
      };
    }
    return { heading, sentence: `${heading}.` };
  }

  /** the record behind one beat's sentence, so a click on the card opens the panel on it */
  function selectBeat(row: BeatRow) {
    const first = events.find((e) => e.sequence === row.beat.firstSequence);
    const target = first ? evTarget.get(first.event_id) ?? null : null;
    if (target) select(target);
  }
  /**
   * The panels a card must stay clear of, measured off the page as it stands. The act title
   * rises and goes on its own few-second timer, so the list is measured every frame rather than
   * only when the set of standing cards changes: a title that arrives after the cards are laid
   * out would otherwise land straight on top of one of them.
   *
   * `#actcard` is a full-screen container whose card is the box that actually covers ground, so
   * the box is measured and the container is not.
   */
  const AVOID_IDS = ["mast", "outcome", "feed", "beats", "rail", "bar", "mini", "camctl",
    "desk", "watch", "actcardBox", "quakestrip", "layerNote", "caption", "deskToast",
    "chip", "narrate"];
  function cardAvoid(): BillboardRect[] {
    const out: BillboardRect[] = [];
    for (const id of AVOID_IDS) {
      const node = document.getElementById(id);
      if (!node || node.classList.contains("gone")) continue;
      if (id === "actcardBox" && !el("actcard").classList.contains("on")) continue;
      const box = node.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      // Several of these panels are always laid out and fade in and out on their own, so a box
      // with a size is not the same thing as a panel a reader can see. A panel nobody can see is
      // not an obstacle, and counting it as one takes room away from the cards for nothing.
      const style = getComputedStyle(node);
      if (style.visibility === "hidden" || Number(style.opacity) < 0.06) continue;
      out.push({ x: box.left, y: box.top, w: box.width, h: box.height });
    }
    // The places under consideration stand over their own ground for a few seconds around each
    // deadline, and a story card laid on top of them hides the thing the telegraph exists to
    // show. They are counted here for as long as they are standing.
    for (const node of document.querySelectorAll(".tgstack")) {
      if (!(node instanceof HTMLElement) || Number(node.style.opacity) < 0.06) continue;
      const box = node.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      out.push({ x: box.left, y: box.top, w: box.width, h: box.height });
    }
    return out;
  }
  /** one short line naming where every panel stands, so an unchanged frame relays out nothing */
  function avoidKey(rects: BillboardRect[]): string {
    let s = "";
    for (const r of rects) {
      s += `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)};`;
    }
    return s;
  }
  let cardsDrawn = "";
  let cardPose = "";
  let cardAvoidKey = "";
  const cardScreen: { id: string; x: number; y: number; infront: boolean }[] = [];
  function drawCards(tick: number) {
    if (!billboards) return;
    const want = cardsAt(tick);
    const key = want.map((row) => `${cardPlace(row)}=${row.beat.beatId}`).join("|");
    let changed = key !== cardsDrawn;
    if (changed) {
      cardsDrawn = key;
      const keep = new Set(want.map(cardPlace));
      for (const id of billboards.visible()) if (!keep.has(id)) billboards.hide(id);
      for (const row of want) {
        const words = cardWords(row);
        billboards.show({
          id: cardPlace(row),
          worldPos: row.at!,
          title: COPY.INCIDENT.card.stamp(beatHour(row.beat)),
          sentence: words.heading,
          detail: words.sentence,
          onClick: () => selectBeat(row),
        });
      }
    }
    // a panel arriving or leaving moves the room the cards have, so the cards are laid out again
    const rects = cardAvoid();
    const rectKey = avoidKey(rects);
    if (rectKey !== cardAvoidKey) {
      cardAvoidKey = rectKey;
      billboards.setAvoid(rects);
      changed = true;
    }
    cardScreen.length = 0;
    for (const row of want) {
      const at = toScreen(row.at!);
      cardScreen.push({ id: cardPlace(row), x: at.x, y: at.y, infront: at.infront });
    }
    // The cards hold where they stand while the run is paused. A camera still flying is not a
    // still frame, so while the view is moving they keep following their places; otherwise a
    // leader line would point at ground the camera has already left.
    const p = rig.pose();
    const poseKey = `${p.tx.toFixed(3)} ${p.ty.toFixed(3)} ${p.tz.toFixed(3)}`
      + ` ${p.yaw.toFixed(4)} ${p.pitch.toFixed(4)} ${p.dist.toFixed(4)}`;
    const still = poseKey === cardPose;
    cardPose = poseKey;
    billboards.setPaused(!P.playing && still && !changed);
    billboards.tick(cardScreen);
  }

  el("camHome").addEventListener("click", () => { handsOffDirection(); rig.goHome(); });
  el("camIn").addEventListener("click", () => { handsOffDirection(); rig.zoomBy(1 / 1.35); });
  el("camOut").addEventListener("click", () => { handsOffDirection(); rig.zoomBy(1.35); });

  /** one recorded event forward or back, in this desk's own stream */
  function stepEvent(dir: number) {
    const arm = arms[desk];
    const ti = Math.min(TICKS, Math.floor(P.tick));
    const from = stepIndex >= 0 ? stepIndex : arm.liveIdx[ti];
    const i = Math.max(0, Math.min(arm.order.length - 1, from + dir));
    setPlay(false);
    stepIndex = i;
    P.tick = arm.evTick[i];
    directedJump();
  }
  /**
   * One round forward or back — one step the desk takes. The run lands at the END of that
   * round rather than at its opening, so the feed at the frame edge narrates everything the
   * round brought and the world shows where the round left it.
   */
  function stepRound(dir: number) {
    // In the directed watch these keys are the "next round now" control that the hold names: the
    // named round starts from its opening and the camera goes with it.
    if (directed) { enterRound(roundAt(Math.floor(P.tick), desk) + dir); return; }
    const rs = rounds[desk];
    const k = Math.max(0, Math.min(rs.length - 1, roundAt(Math.floor(P.tick), desk) + dir));
    setPlay(false);
    stepIndex = -1;
    P.tick = Math.max(rs[k].start, Math.min(TICKS, rs[k].end));
  }

  // ------------------------------------------------------------------ overwatch: the camera tour
  /**
   * Overwatch answers one thing: with nobody flying the camera, the world's own activity should
   * pull the view around the region instead of leaving it parked in the corner the exercise
   * happens in. Turn it on, leave the controls alone for twelve seconds, and the camera visits
   * three places in turn — the place the run is working right now, the last thing the region
   * recorded, and the whole ground — resting a few seconds at each one.
   *
   * It is an interaction animation, exactly like the panel reveals: it runs on elapsed real time
   * since the reader last touched anything, it moves the camera and nothing else, and the run's
   * state stays a pure function of the playback tick. The three places themselves are read out
   * of the run at the tick the camera is standing in, so two people stopped at the same tick are
   * shown the same tour. Any key, any drag and any wheel turn hands the camera straight back.
   */
  const watchBox = el("watch");
  const watchState = watchBox.querySelector("b") as HTMLElement;
  const watchKey = watchBox.querySelector("i") as HTMLElement;
  let watchOn = false;
  let watchIdle = 0;        // seconds since the reader last touched the camera
  let watchStop = -1;       // which stop of the tour the camera is at, or -1 for none
  let watchAge = 0;         // seconds since that stop began
  function drawWatch() {
    el("watchName").textContent = COPY.WATCH.label;
    watchState.textContent = watchOn ? COPY.WATCH.on : COPY.WATCH.off;
    watchKey.textContent = COPY.WATCH.key;
    watchBox.title = COPY.WATCH.tip;
    watchBox.classList.toggle("on", watchOn);
  }
  function setWatch(on: boolean) {
    watchOn = on;
    watchIdle = 0; watchStop = -1; watchAge = 0;
    drawWatch();
  }
  /**
   * The reader took the controls. The tour stops at once and the twelve seconds start again.
   * The camera is only taken off its glide when the tour is the thing flying it, so this can
   * never cut the opening flight short.
   */
  function handsOn() {
    watchIdle = 0;
    if (watchStop >= 0) { watchStop = -1; watchAge = 0; rig.takeOver(); }
  }
  /** where the tour's next stop stands, read out of the run at this tick */
  function watchPose(stop: number, tick: number): Pose {
    const ti = Math.min(TICKS, Math.floor(tick));
    const turn = HOME.yaw + 0.55 * ((stop % 4) - 1.5);
    const leg = stop % 3;
    if (leg === 0) {
      const ev = liveEv[desk];
      const t = ev ? evTarget.get(ev.event_id) ?? null : null;
      if (t) {
        const p = targetPos(t);
        // a stop that stands off the terrain cut is dropped and the tour holds the whole ground
        if (onMap(p)) return { tx: p.x, ty: p.y, tz: p.z, yaw: turn, pitch: 30 * D2R, dist: 0.44 };
      }
    }
    if (leg === 1) {
      const live = beatsAt(ti);
      const b = live[live.length - 1];
      if (b && onMap(b.at)) {
        return { tx: b.at.x, ty: b.at.y, tz: b.at.z, yaw: turn, pitch: 30 * D2R, dist: b.dist };
      }
    }
    return { ...HOME };
  }
  watchBox.addEventListener("click", () => setWatch(!watchOn));
  addEventListener("keydown", handsOn);
  addEventListener("pointerdown", handsOn);
  addEventListener("wheel", handsOn, { passive: true });
  drawWatch();

  /**
   * A control keeps keyboard focus after it is clicked with a pointer, and the key handler below
   * hands the focused control its own keys. Together those two rules meant that after the first
   * click of a session every presentation key was dead: t, l, d, r and o all reached a focused
   * button instead of the page. A pointer click now gives focus straight back to the page.
   *
   * Reaching a control with the tab key still leaves it focused, so space and enter still work
   * it. `event.detail` counts pointer clicks and is zero only for the click a keyboard produced,
   * which is how the two cases are told apart. This listener runs in the capture phase, because
   * several controls here stop their own click from travelling any further.
   */
  addEventListener("click", (e) => {
    if (e.detail <= 0 || !(e.target instanceof HTMLElement)) return;
    const control = e.target.closest("button");
    // The decision tree hands its own controls their own keys: the arrows walk its row of
    // moments, the left and right keys open and close one level, and the number keys open one of
    // the eight recorded tries. Handing the page back the keyboard there would take the row's
    // keys away the moment a reader touched anything with a pointer, so a control inside that
    // one screen keeps the focus it was just given.
    if (control?.closest("#tree")) return;
    if (control instanceof HTMLButtonElement) control.blur();
  }, true);

  addEventListener("keydown", (e) => {
    const a = document.activeElement;
    // A typing field takes every key it is given. A control that still holds focus keeps only
    // the two keys that work a control, so that every other key reaches the page.
    if (a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement) {
      if (e.key !== "Tab" && e.key !== "Escape") return;
    } else if (a instanceof HTMLButtonElement) {
      if (e.key === " " || e.key === "Enter") return;
    }
    const k = e.key;
    if (!begun) {
      // While the briefing is up the only thing a key can do is start the run.
      if (k === "Enter" || k === " ") { begin(); e.preventDefault(); }
      return;
    }
    if (debriefShown) {
      // the debrief holds the frame: one key closes it, and nothing else reaches the world
      if (k === "Escape" || k.toLowerCase() === "d") showDebrief(false);
      // the natural moment to ask what the real responders did is the one right after the debrief
      else if (k.toLowerCase() === "r") { showDebrief(false); showReal(true); }
      return;
    }
    if (k === "Escape") {
      // a reason list standing open under a grade is the innermost thing on the page, so it is
      // the first thing escape closes
      if (openReasons.size > 0) { closeAllReasons(); return; }
      if (helpBox.classList.contains("on")) showHelp(false);
      else if (ledgerBox.classList.contains("on")) showLedger(false);
      // the decision tree holds the frame the way the ledger does. A mark or a stub standing
      // selected inside it is the innermost thing on the page, so the first escape lets go of
      // that and the next one closes the screen.
      else if (treeIsOpen()) { if (!treeHandle?.collapse()) showTree(false); }
      else if (realBox.classList.contains("on")) showReal(false);
      else if (traceIsOpen()) showTrace(null);
      // the incident tally is a surface like the others, so the same key
      // closes it instead of leaving it a toggle only its own key can clear
      else if (outcomeShown) showOutcome(false);
      else select(null);
      return;
    }
    // the ledger holds the frame the way the help does: one key closes it
    if (ledgerBox.classList.contains("on")) {
      if (k.toLowerCase() === "l") showLedger(false);
      return;
    }
    // the decision tree holds the frame the same way: b shuts it, and nothing else gets past
    if (treeIsOpen()) {
      if (k.toLowerCase() === "b") showTree(false);
      return;
    }
    // the agent trace holds the frame the way the help does: the arrows walk it and one key shuts
    // it, and nothing else reaches the world while it stands
    if (traceIsOpen()) {
      if (k === "ArrowRight" || k === "ArrowDown" || k === " ") {
        stepTrace(1); e.preventDefault(); return;
      }
      if (k === "ArrowLeft" || k === "ArrowUp") { stepTrace(-1); e.preventDefault(); return; }
      if (k.toLowerCase() === "t") showTrace(null);
      return;
    }
    if (helpBox.classList.contains("on") && k !== "?") return;
    // the real-decision surface holds the frame the way the help does: one key closes it
    if (realBox.classList.contains("on")) {
      if (k.toLowerCase() === "r") showReal(false);
      return;
    }
    if (k === " ") { setPlay(!P.playing); e.preventDefault(); return; }
    if (k === "Tab") {
      if (twoDesks) setDesk(desk + 1);
      e.preventDefault();
      return;
    }
    if (k === "?" || (k === "/" && e.shiftKey)) {
      showHelp(!helpBox.classList.contains("on")); e.preventDefault(); return;
    }
    const low = k.toLowerCase();
    if (low === "v") {
      // the internal view: the two desks side by side, and the raw seek bar with them. It is a
      // building tool, and it says so across the whole frame the entire time it is open. A run
      // of one recorded story has no second desk to stand beside, so the view stays shut.
      if (!twoDesks) return;
      split = !split;
      el("bar").classList.toggle("internal", split);
      el("internal").textContent = COPY.STATES.internalView;
      el("internal").classList.toggle("on", split);
      resize();
      return;
    }
    if (low === "r") { showReal(true); return; }
    if (low === "t") {
      // the walk-through of the moment of decision the run has reached, or the first one ahead
      // of it where none has passed yet
      const ti = Math.min(TICKS, Math.floor(P.tick));
      const passed = decisionRows.filter((row) => row.tick <= ti);
      const row = passed[passed.length - 1] ?? decisionRows[0] ?? null;
      if (row) openTraceFor(row.id);
      return;
    }
    // p, because v already opens the internal view
    if (low === "p") { setWatch(!watchOn); return; }
    if (low === "h") { rig.goHome(); return; }
    if (low === "o") { showOutcome(!outcomeShown); return; }
    if (low === "d") { showDebrief(true); return; }
    if (low === "l") { showLedger(true); return; }
    // b, because t already opens one moment's walk-through and l already opens the ledger
    if (low === "b") { showTree(true); return; }
    if (k === "0") { P.tick = 0; stepIndex = -1; directedJump(); return; }
    if (k === ",") { stepEvent(-1); e.preventDefault(); return; }
    if (k === ".") { stepEvent(1); e.preventDefault(); return; }
    if (k === "[") { stepRound(-1); e.preventDefault(); return; }
    if (k === "]") { stepRound(1); e.preventDefault(); return; }
    // the seven approved grades move to shift and a number, because the plain numbers are
    // the camera bookmarks the field's own convention puts there
    if (e.shiftKey) {
      const slot = "!@#$%^&".indexOf(k);
      const alt = "1234567".indexOf(k);
      const idx = slot >= 0 ? slot : alt;
      if (idx >= 0 && idx < LOOK_KEYS.length) {
        applyLook(post, LOOK_KEYS[idx]);
        holdBloom();
        art.syncFromState();
        return;
      }
    }
    const digit = "123456789".indexOf(k);
    if (digit >= 0) {
      if (e.ctrlKey || e.metaKey) { rig.saveBookmark(digit + 1); e.preventDefault(); }
      else rig.recallBookmark(digit + 1);
    }
  });

  // ------------------------------------------------------------------ per-frame assembly
  const liveEv: (Ev | null)[] = [null, null];
  let liveScreenX = 0, liveScreenY = 0, liveOn = false;
  let paintBudget = 1;

  function updateArm(k: number, tt: number, visible: boolean) {
    const arm = arms[k];
    const ti = Math.min(TICKS, Math.floor(tt));
    // stepping pins the display to one exact event, because a recorded moment can hold several
    const li = k === desk && stepIndex >= 0 ? stepIndex : arm.liveIdx[ti];
    const ev = li >= 0 ? arm.order[li] : null;
    const age = ev ? tt - arm.evTick[li] : Infinity;
    const lit = ev !== null && age < LOOK;
    const lp = ev ? siteIdx(ev) : -1;
    liveEv[k] = ev;

    for (let p = 0; p < NP; p++) {
      let alpha = 0.58, size = 0.030;
      let r = BONE[0], g = BONE[1], b = BONE[2];
      if (arm.sentTick[p] <= tt) {
        const fl = Math.exp(-(tt - arm.sentTick[p]) / 8);
        alpha += 0.30 + 0.35 * fl; size *= 1.10 + 0.20 * fl;
      }
      if (arm.foundTick[p] <= tt) {
        const fl = Math.exp(-(tt - arm.foundTick[p]) / 7);
        r = lerp(BONE[0], EMB[0], 0.35 + 0.55 * fl);
        g = lerp(BONE[1], EMB[1], 0.35 + 0.55 * fl);
        b = lerp(BONE[2], EMB[2], 0.35 + 0.55 * fl);
        alpha += 0.45 * fl;
      }
      if (lit && p === lp) {
        const pulse = 0.62 + 0.38 * Math.sin(tt * 2.4);
        const hot = ev!.type === "OUTCOME_OBSERVED" ? EMB : SIG;
        const fade = Math.pow(1 - age / LOOK, 0.8);
        r = lerp(r, hot[0], fade); g = lerp(g, hot[1], fade); b = lerp(b, hot[2], fade);
        alpha = Math.min(1.7, alpha + (0.55 + 0.35 * pulse) * fade);
        size *= 1 + 0.42 * fade;
      }
      arm.mSize[p] = size; arm.mAlpha[p] = alpha;
      arm.mCol[p * 3] = r; arm.mCol[p * 3 + 1] = g; arm.mCol[p * 3 + 2] = b;
    }
    for (const name of ["aSize", "aAlpha", "aColor"]) {
      (arm.mGeo.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
    }

    const target = ev ? evTarget.get(ev.event_id) ?? null : null;
    if (lit && target) {
      const fade = Math.pow(1 - age / LOOK, 0.8);
      const hot = ev!.type === "OUTCOME_OBSERVED" ? EMB : SIG;
      const at = targetPos(target);
      const pos = arm.rGeo.getAttribute("position") as THREE.BufferAttribute;
      pos.setXYZ(0, at.x, at.y + 0.016, at.z);
      pos.needsUpdate = true;
      arm.rSize[0] = 0.024 + 0.070 * ((tt - arm.evTick[li]) < 3.2
        ? (tt - arm.evTick[li]) / 3.2 : 1);
      arm.rAlpha[0] = 0.85 * fade;
      arm.rCol[0] = hot[0]; arm.rCol[1] = hot[1]; arm.rCol[2] = hot[2];
      if (visible) {
        const s = toScreen(at);
        liveScreenX = s.x; liveScreenY = s.y; liveOn = s.infront;
      }
    } else {
      arm.rAlpha[0] = 0; arm.rSize[0] = 0.01;
      if (visible) liveOn = false;
    }
    for (const name of ["aSize", "aAlpha", "aColor"]) {
      (arm.rGeo.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
    }

    stations.update(k, tt, lit && lp >= 0 ? lp : -1,
      lit ? Math.pow(1 - age / LOOK, 0.8) : 0, ev !== null && ev.type === "OUTCOME_OBSERVED");
    arm.damage.update(tt);

    marksTo(arm, ti);
    if (arm.resDirty && paintBudget > 0) { paintSurface(arm); paintBudget--; }
  }

  // ---- the observed layers fade in at the tick their own record arrives
  function updateLayers(tt: number) {
    hazardLines.setTick(tt);
    roadLines.setTick(tt);
    for (let i = 0; i < hazards.length; i++) {
      const age = tt - hazardShow(hazards[i].id);
      hazardRings.alpha[i] = age < 0 ? 0 : clamp(age / 8) * 0.42;
    }
    (hazardRings.geo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
    const shelterAge = tt - shelterLayerTick;
    const sa = shelterAge < 0 ? 0 : clamp(shelterAge / 10) * 0.40;
    for (let i = 0; i < shelters.length; i++) shelterPoints.alpha[i] = sa;
    (shelterPoints.geo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
    epiMark.alpha.setX(0, tt > 0 ? 0.45 : 0);
    epiMark.alpha.needsUpdate = true;
    context.update(tt);
  }

  // ------------------------------------------------------------------ the readouts
  const msRing = new Float64Array(MS_N), msSort = new Float64Array(MS_N);
  let msFill = 0, msPtr = 0, msMed = 0, msWorst = 0, frame_i = 0, last = -1;
  // seconds the page has been open, counted the way the scanning pulse counts: elapsed real
  // time, never the playback tick. The instruments turn on this, so they keep turning while
  // the run is paused, and nothing a verifier reads is a function of it.
  let idleClock = 0;
  function msStats() {
    if (!msFill) return;
    msSort.set(msRing.subarray(0, msFill));
    const view = msSort.subarray(0, msFill);
    view.sort();
    msMed = view[msFill >> 1];
    msWorst = view[msFill - 1];
  }

  const tagEl = el("tag");
  function bands() {
    const ti = Math.min(TICKS, Math.floor(P.tick));
    const sec = secondsAt(ti);
    // the round is the time control; the recorded second and the time of day ride under it
    const rs = rounds[desk];
    const ri = roundAt(ti, desk);
    const arm = arms[desk];
    const li = stepIndex >= 0 ? stepIndex : arm.liveIdx[ti];
    const ev = li >= 0 ? arm.order[li] : null;
    // the counter rides the masthead; the bar carries the round's own headline sentence. Where
    // the run is walked act by act, the round is an act and the counter says so.
    el("mastDate").textContent = walkActs
      ? COPY.INCIDENT.mastLine(events.length, ri + 1, rs.length)
      : COPY.MASTHEAD.line(events.length, ri + 1, rs.length);
    // The panel over the decision rail, in its fixed order: which act the run is in, the
    // sentence saying what is happening at this minute, the clock, and what the whole act is
    // about. The sentence is the primary reading on the page, so it never falls back to an
    // empty line: before the first beat of a run opens, the act's own line stands in its place.
    const beatNow = walkActs ? beatAt(ti) : null;
    const beatLine = beatNow ? `${beatWords(beatNow).replace(/[.\s]+$/, "")}.` : "";
    const wasNow = el("roundNow").textContent;
    // A decision that has just resolved takes the largest sentence on the page for as long as
    // its own picture stands on the map. The action-first contract asks for exactly this: at a
    // decision beat the resolved action is the foreground story, and the public bulletins that
    // happen to fall in the same minute stay in the background where the cards and the feed
    // already carry them. Outside that window the panel goes back to the record's own beat.
    const resolved = walkActs ? resolvedDecisionAt(ti) : null;
    const nowLine = resolved?.chose ? resolved.chose : beatLine;
    if (walkActs) {
      el("roundKicker").textContent = COPY.INCIDENT.narrate.kicker(ri + 1, rs.length, rs[ri].name);
      el("roundNow").textContent = nowLine || rs[ri].headline;
      el("roundAboutLabel").textContent = COPY.INCIDENT.narrate.aboutLabel;
      el("roundLine").textContent = rs[ri].headline;
      const sameAct = !nowLine || rs[ri].headline === el("roundNow").textContent;
      narrateAbout = !sameAct;
      const showAbout = narrateAbout && !narrateTight;
      el("roundAboutLabel").style.display = showAbout ? "block" : "none";
      el("roundLine").style.display = showAbout ? "block" : "none";
    } else {
      el("roundKicker").textContent = rs[ri].name;
      el("roundNow").textContent = rs[ri].headline;
      el("roundAboutLabel").style.display = "none";
      el("roundLine").style.display = "none";
    }
    // A resolved action runs to two lines where a public beat ran to one, and the stylesheet
    // anchors this panel by its foot, so the taller panel grew upward and at 1280 by 720 the
    // first line of the largest sentence on the page ran off the top of the frame. The panel is
    // lowered only as far as it has to be, and only when the sentence changes, so the measuring
    // never happens inside a still frame.
    if (el("roundNow").textContent !== wasNow) fitNarrate();
    // the hold's countdown, in small type beside the headline it gives the reader time to read
    if (directed && dPhase === "dwell") {
      dwellNum.textContent = COPY.DIRECTED.hold(Math.max(1, Math.ceil(dwellLeft)));
    }
    // where the run has got to, under the sentence: the recorded wall clock, the hour of the
    // three days, and the moment of the record. The moment's own name is no longer repeated
    // here, because the sentence above it now carries it at reading size.
    el("roundSub").textContent = walkActs
      ? COPY.INCIDENT.face(
        "",
        `${timeOfDay(sec)}${zone ? ` ${zone}` : ""}`,
        Math.min(scale.hours, Math.floor(sec / 3600) + 1), scale.hours,
        ev ? ev.sequence + 1 : 1, events.length)
      : `${timeOfDay(sec)}${zone ? ` ${zone}` : ""}`
        + ` · ${Math.round(sec)} s of ${Math.round(spanS)}`
        + ` · event ${ev ? ev.sequence + 1 : 0} of ${events.length}`;
    if (!scrubbing) scrub.value = String(ti);

    drawQuakeStrip(ti);
    drawFeed(ti);
    drawBeats(ti);
    drawRail(ti);
    drawCaption(ev, liveScreenX, liveScreenY, liveOn);
    drawGhost(ti);
    drawTelegraph(P.tick);

    if (ev && liveOn && !split) {
      tagEl.textContent = TAG[ev.type] ?? ev.type;
      tagEl.style.left = `${Math.round(liveScreenX)}px`;
      tagEl.style.top = `${Math.round(liveScreenY)}px`;
      tagEl.style.color = ev.type === "OUTCOME_OBSERVED" ? burnHex : "#7df9ff";
      tagEl.classList.add("on");
    } else tagEl.classList.remove("on");

    const p = rig.pose();
    (el("northMark") as HTMLElement).style.transform = `rotate(${(-p.yaw / D2R).toFixed(1)}deg)`;
    drawMini();

    msStats();
    el("meter").textContent = msFill === 0
      ? "measuring"
      : `${msMed.toFixed(2)} ms/frame · worst ${msWorst.toFixed(2)}`
        + ` · ${LOOKS[post.look].label}${split ? " · internal comparison view" : ""}`;
    if (selected) drawPanel();
  }

  // ------------------------------------------------------------------ the loop
  function drawStage(k: number, x: number, w: number) {
    setArm(k);
    renderer.setViewport(x, 0, w, H);
    renderer.setScissor(x, 0, w, H);
    renderer.render(scene, cam);
  }
  function frameAt(tt: number) {
    updateLayers(tt);
    stations.faceYaw(rig.pose().yaw);
    stations.idleSpin(idleClock);
    if (split) { updateArm(0, tt, desk === 0); updateArm(1, tt, desk === 1); }
    else updateArm(desk, tt, true);

    renderer.setRenderTarget(sceneRT);
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    if (split) {
      const half = W / 2 - GUT;
      drawStage(0, 0, half);
      drawStage(1, W / 2 + GUT, half);
    } else {
      drawStage(desk, 0, W);
    }
    renderer.setScissorTest(false);
    renderer.setRenderTarget(null);

    if (sceneRT) {
      if (!sceneTex) {
        sceneTex = (renderer.properties.get(sceneRT.texture) as
          { __webglTexture?: WebGLTexture }).__webglTexture ?? null;
      }
      if (gl2 && postVao) gl2.bindVertexArray(postVao);
      postCompose(post, tt / RATE, sceneTex);
      if (gl2) gl2.bindVertexArray(null);
      renderer.resetState();
    }
    // the story cards ride the frame, so they follow their places while the camera flies
    drawCards(Math.min(TICKS, Math.floor(tt)));
  }

  el("boot").classList.add("gone");

  function loop(now: number) {
    requestAnimationFrame(loop);
    const t0 = performance.now();
    const dt = last < 0 ? 0 : Math.min(0.1, (now - last) / 1000);
    last = now;
    idleClock += dt;
    const want = Math.min(devicePixelRatio, 2);
    if (renderer.getPixelRatio() !== want) { renderer.setPixelRatio(want); resize(); }
    if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize();
    // An overlay holding the frame holds the run with it, in both modes: nothing advances behind
    // the debrief, the help or the real-decision surface.
    const held = !begun || debriefShown
      || helpBox.classList.contains("on") || realBox.classList.contains("on")
      || traceBox.classList.contains("on");
    if (P.playing && !scrubbing && !held) {
      if (directed) advanceDirected(dt);
      else {
        P.tick += dt * RATE * speed;
        // The run ends rather than looping: the world dims and the debrief rises on the last tick.
        if (P.tick >= TICKS) { P.tick = TICKS; showDebrief(true); }
      }
    }
    // the camera tour, on elapsed real time and nothing else. It never runs while the briefing,
    // the help, the real-decision surface or the debrief is holding the frame.
    if (watchOn && begun && !debriefShown && !traceBox.classList.contains("on")
      && !helpBox.classList.contains("on") && !realBox.classList.contains("on")) {
      watchIdle += dt;
      if (watchIdle >= WATCH_IDLE) {
        watchAge += dt;
        if (watchStop < 0 || watchAge >= WATCH_GLIDE + WATCH_HOLD) {
          watchStop = watchStop < 0 ? 0 : watchStop + 1;
          watchAge = 0;
          rig.glideTo(watchPose(watchStop, P.tick), WATCH_GLIDE);
        }
      }
    } else if (watchStop >= 0) { watchStop = -1; watchAge = 0; }
    rig.update(dt);
    // the ground comes down from its briefing brightness to its working one over the flight in
    {
      const want = begun ? WARM_AMT : COLD_AMT;
      const u = groundMat.uniforms.uAmt;
      u.value = want + ((u.value as number) - want) * Math.exp(-AMT_EASE * dt);
    }
    if (scanAge >= 0) {
      scanAge += dt;
      if (scanAge > SCAN_SECONDS + SCAN_TAIL) scanAge = -1;
      groundMat.uniforms.uScanAge.value = scanAge;
    }
    const tt = clamp(P.tick, 0, TICKS - 0.001);
    paintBudget = split ? 2 : 1;
    frameAt(tt);
    if (warm > 0) { warm--; msFill = 0; msPtr = 0; } else {
      msRing[msPtr] = performance.now() - t0;
      msPtr = (msPtr + 1) % MS_N;
      msFill = Math.min(MS_N, msFill + 1);
    }
    // the act card holds for its few seconds and then goes, and the aftershock timeline stands
    // for as long as the first act is playing
    if (actCardLeft > 0) {
      actCardLeft -= dt;
      if (actCardLeft <= 0) hideActCard();
    }
    if ((frame_i & 7) === 0) bands();
    frame_i++;
  }
  requestAnimationFrame(loop);

  // ---- the verification handle: seek is deterministic — same tick, same pixels
  (window as unknown as { __HERO: unknown }).__HERO = {
    seek(t: number) {
      P.tick = clamp(t, 0, TICKS); setPlay(false);
      stepIndex = -1;
      directedJump();
      rig.takeOver();
      paintBudget = 99;
      // both desks' ground is brought up to this moment, so the checksums a verifier reads
      // describe the same instant on both sides whichever one is on screen
      const ti = Math.min(TICKS, Math.floor(P.tick));
      arms.forEach((a) => { marksTo(a, ti); a.resDirty = true; });
      frameAt(clamp(P.tick, 0, TICKS - 0.001));
      bands();
    },
    tick: () => P.tick,
    maxTick: () => TICKS,
    // where the instruments' turning plates stand. This is outside state() on purpose: the
    // turn runs on elapsed real time, so it is the one thing two runs of the same tick may
    // disagree on, and nothing that decides a picture's content depends on it.
    stationTurns: () => stations.turns(),
    begin() { begin(); },
    begun: () => begun,
    debrief(on: boolean) { showDebrief(on); },
    beats: () => beatsFor(desk).map((b) => ({ label: b.label, text: b.text, ids: b.ids,
      site: b.site, from: b.from, desk: arms[b.k].spec.id })),
    flyToBeat(i: number) {
      const list = beatsFor(desk);
      if (list[i]) flyToBeat(list[i]);
    },
    // the regional lines: every one the record holds, and the ones this tick is showing
    regionBeats: () => regionBeats.map((b) => ({
      id: b.id, kind: b.kind, tick: +b.tick.toFixed(3), seconds: +b.seconds.toFixed(2),
      clock: beatClock(b.seconds), text: b.text,
      at: { x: +b.at.x.toFixed(5), y: +b.at.y.toFixed(5), z: +b.at.z.toFixed(5) },
      lon: +frame.lonOf((b.at.x / frame.mapW) + 0.5).toFixed(5),
      lat: +frame.latOf(0.5 - (b.at.z / frame.mapD)).toFixed(5),
    })),
    beatsNow: () => beatsAt(Math.min(TICKS, Math.floor(P.tick))).map((b) => b.id),
    flyToRegionBeat(id: string) {
      const b = regionBeats.find((x) => x.id === id);
      if (b) flyToRegionBeat(b);
      return b ? { id: b.id, text: b.text } : null;
    },
    // overwatch runs on elapsed real time, so it is reported here and never inside state()
    watch: () => ({ on: watchOn, idle: +watchIdle.toFixed(2), stop: watchStop,
      leg: watchStop < 0 ? -1 : watchStop % 3, age: +watchAge.toFixed(2) }),
    setWatch(on: boolean) { setWatch(on); },
    // the directed watch runs on elapsed real time too, so it is reported beside overwatch
    directed: () => ({
      on: directed, phase: dPhase, round: dRound + 1, of: rounds[desk].length,
      left: +dwellLeft.toFixed(2), move: dMove,
      moves: pacing[desk][dRound].moves.length, handback: dHandback,
    }),
    setDirected(on: boolean) { setDirected(on); },
    /** start one round — one act, where the run is walked act by act — from its opening */
    enterRound(i: number) { enterRound(i); },
    /** the longest still stretch the directed watch holds in each act, in seconds of watching */
    quiet: () => quietStretches(),
    /** the acts the record declares, with the beats each one is cut into */
    acts: () => acts.map((act, i) => ({
      index: i + 1, id: act.actId, label: act.label, story: act.story,
      start: rounds[desk][i]?.start ?? 0, end: Math.min(TICKS, rounds[desk][i]?.end ?? TICKS),
      events: act.window.eventCount, beats: act.beats.length,
      told: act.beats.filter((b) => b.holdSeconds > 0 && b.anchor).length,
      anchors: act.anchors,
    })),
    /** the story cards standing at this moment, in the order they opened */
    cards: () => cardsAt(Math.min(TICKS, Math.floor(P.tick))).map((row) => ({
      id: cardPlace(row), beat: row.beat.beatId, clock: row.beat.startClock,
      heading: cardWords(row).heading, sentence: cardWords(row).sentence,
    })),
    /** the whole guided pass as it was derived: what each round is given and where it flies */
    plan: () => pacing[desk].map((p, i) => ({
      round: i + 1, node: rounds[desk][i].node,
      start: rounds[desk][i].start, end: Math.min(TICKS, rounds[desk][i].end),
      events: p.events, play: +p.play.toFixed(2), dwell: +p.dwell.toFixed(2),
      rate: +p.rate.toFixed(3),
      // the stretches this act crosses quickly, declared rather than hidden
      timeJumps: timeJumpsFor(i),
      jumps: timeJumpsFor(i),
      // every point in this act where something happens on screen: a camera move, or a story
      // card opening over the place a moment happened
      story: storyTicks().filter((t) =>
        t >= rounds[desk][i].start && t <= Math.min(TICKS, rounds[desk][i].end)),
      cards: cardRows.filter((row) =>
        row.tick >= rounds[desk][i].start && row.tick <= Math.min(TICKS, rounds[desk][i].end))
        .map((row) => row.tick),
      /** the longest still stretch this act holds, in seconds of watching */
      worstQuietSeconds: quietStretches()[i]?.worstSeconds ?? 0,
      moves: p.moves.map((m) => ({
        tick: m.tick, places: m.names, spread: +m.spread.toFixed(3),
        dist: +directedPose(desk, i, m).dist.toFixed(3),
        at: m.at ? { x: +m.at.x.toFixed(4), z: +m.at.z.toFixed(4) } : null,
      })),
    })),
    ghosts: () => ghosts.map((g, k) =>
      (g ? { desk: arms[k].spec.id, atTick: g.atTick, site: g.site, text: g.text } : null)),
    /**
     * The agent trace, exposed for a mechanical gate. `agentTraces` is a pure read of the baked
     * file — it opens nothing, moves nothing and returns the same value however many times it is
     * asked. `openTrace` is the one control that changes what is on screen, and it says whether
     * the moment it was given exists.
     */
    agentTraces: () => traces,
    /**
     * The four surfaces this build adds, exposed for a mechanical gate. All four are pure reads
     * of the registered contract and of the walk-through, so asking for them opens nothing and
     * moves nothing.
     */
    highlights: () => highlights?.contract ?? null,
    /** every decision row as the rail draws it, with the outcome it carries */
    decisionOutcomes: () => decisionRows.map((row) => ({
      id: row.id,
      clock: row.clock,
      title: row.title,
      decider: row.decider,
      registered: row.registered,
      chose: row.chose,
      reason: row.reason,
      unknown: row.unknown,
      verdict: row.verdict,
      passed: row.passed,
      findings: row.findings,
      strip: row.strip
        ? {
          cells: row.strip.cells,
          agreement: row.strip.agreement,
          passes: row.strip.passes,
          tries: row.strip.tries,
          agreementCaption: row.strip.agreementCaption,
          passCaption: row.strip.passCaption,
        }
        : null,
    })),
    /** every telegraphed moment: what lights on the map, where, and when */
    telegraphs: () => telegraphs.map((moment) => ({
      momentId: moment.momentId,
      tick: moment.tick,
      lead: +(telegraphLeadOf.get(moment.momentId) ?? 0).toFixed(3),
      unplaced: moment.unplaced,
      // acceptance gate 6: every destination of the chosen action that the record places gets a
      // mark, and every destination it places nowhere gets none
      chosenPlaced: moment.chosenPlaced,
      chosenUnplaced: moment.chosenUnplaced,
      chosenStacks: moment.stacks.filter((stack) => stack.chosen).length,
      stacks: moment.stacks.map((stack) => ({
        site: stack.site,
        route: stack.route !== null,
        chosen: stack.chosen,
        marks: stack.marks.map((mark) => ({
          place: mark.place, quantity: mark.quantity, unit: mark.unit,
          agreed: mark.agreed, burn: mark.burn, taken: mark.taken,
        })),
      })),
    })),
    /** the ledger, and the one control that opens it */
    ledger(on: boolean) { showLedger(on); },
    ledgerState: () => ({
      open: ledgerBox.classList.contains("on"),
      rows: el("ledgerRows").children.length,
      marked: highlights?.contract.reel.length ?? 0,
      totals: (highlights?.contract.totals ?? []).map((total) => ({
        method: total.method, passes: total.passes, tries: total.tries,
      })),
      limitation: el("ledgerLimit").textContent ?? "",
    }),
    /**
     * The decision tree, and the one control that opens it. `treeState` is a pure read of the
     * picture the record produced, so asking for it opens nothing and moves nothing.
     */
    tree(on: boolean) { showTree(on); },
    treeState: () => ({
      open: treeIsOpen(),
      available: treeAvailable,
      footer: el("treeFootText").textContent ?? "",
      ...treeReport(treeModel),
      ...(treeHandle ? treeHandle.state() : {}),
    }),
    /** how many reason lists stand open, which is how a gate proves one opened and closed */
    reasonsOpen: () => openReasons.size,
    openTrace(momentId: string, card = 0) {
      return openTraceFor(momentId, card) ? traceReport() : null;
    },
    stepTrace(delta: number) { stepTrace(delta); return traceReport(); },
    closeTrace() { showTrace(null); return traceReport(); },
    traceState: () => traceReport(),
    pause() { setPlay(false); },
    play() { setPlay(true); },
    setDesk,
    select(t: Target | null) { select(t); },
    worldOf(t: Target) { const p = targetPos(t); return { x: p.x, y: p.y, z: p.z }; },
    goTo(t: Target, dist = 0.3, seconds = 0) {
      const p = targetPos(t);
      if (seconds > 0) rig.flyTo(p.x, p.y, p.z, dist, seconds);
      else {
        const now = rig.pose();
        rig.setPose({ tx: p.x, ty: p.y, tz: p.z, yaw: now.yaw, pitch: now.pitch, dist }, true);
      }
    },
    pickAt(x: number, y: number) { return pickAt(x, y); },
    clickAt(x: number, y: number) { select(pickAt(x, y)); return selected; },
    camera: () => rig.pose(),
    setPose(p: Pose) { rig.setPose(p, true); },
    home() { rig.goHome(); },
    saveBookmark(n: number) { rig.saveBookmark(n); },
    recallBookmark(n: number) { return rig.recallBookmark(n); },
    state: () => ({
      tick: P.tick,
      seconds: +secondsAt(Math.min(TICKS, Math.floor(P.tick))).toFixed(2),
      clock: timeOfDay(secondsAt(Math.min(TICKS, Math.floor(P.tick)))),
      ms: +msMed.toFixed(2), msMax: +msWorst.toFixed(2),
      scenario: log.scenario, seed: log.seed, synthetic: log.synthetic === true,
      look: post.look, lookLabel: LOOKS[post.look].label,
      desk: arms[desk].spec.id, deskName: arms[desk].spec.name, split,
      events: events.length, moments: M, sites: sites.map((s) => s.id),
      reached: arms.map((a) => a.reached[Math.min(TICKS, Math.floor(P.tick))]),
      finalReached,
      terrainHash: terrain.hash,
      terrain: {
        dem: [terrain.demW, terrain.demH],
        minM: +terrain.minM.toFixed(2), maxM: +terrain.maxM.toFixed(2),
        meanM: +terrain.meanM.toFixed(2), noData: terrain.noData,
        bounds: [frame.west, frame.south, frame.east, frame.north],
        mapW: +frame.mapW.toFixed(4), mapD: +frame.mapD.toFixed(4),
      },
      layers: {
        hazards: hazards.length, hazardsTotal: hazardTotal,
        roads: roads.length, roadsTotal: roadTotal,
        shelters: shelters.length,
        hazardVertices: hazardLines.vertexCount, roadVertices: roadLines.vertexCount,
      },
      // the switchable full-incident layers: what each one holds and whether it is showing
      context: context.state(),
      buildings: buildings
        ? {
          placed: buildings.tiles.filter((t) => t.ok).length,
          tiles: buildings.tiles.length,
          count: buildings.buildings, vertices: buildings.vertices,
          spanM: Math.round(buildings.spanM),
          box: buildings.box,
          groundUnderCentre: +terrain.heightAtLonLat(buildings.lon, buildings.lat).toFixed(5),
          notes: buildings.tiles.map((t) => `${t.uri}: ${t.note}`),
          skipped: buildings.tiles.filter((t) => !t.ok).map((t) => `${t.uri}: ${t.note}`),
        }
        : null,
      camera: rig.pose(),
      selected,
      round: (() => {
        const ti = Math.min(TICKS, Math.floor(P.tick));
        const ri = roundAt(ti, desk);
        return {
          index: ri + 1, of: rounds[desk].length,
          node: rounds[desk][ri].node, name: rounds[desk][ri].name,
          headline: rounds[desk][ri].headline,
        };
      })(),
      rounds: rounds.map((rs, k) =>
        ({ arm: arms[k].spec.id, count: rs.length, names: rs.map((r) => r.node) })),
      speed,
      stepIndex,
      alerts: liveAlerts.map((a) => a.text),
      // the regional lines are a pure function of the tick, so they belong in the state probe
      region: {
        recorded: regionBeats.length,
        roads: regionBeats.filter((b) => b.kind === "road").length,
        quakes: regionBeats.filter((b) => b.kind === "quake").length,
        moments: regionBeats.filter((b) => b.kind === "moment").length,
        magnitudeThreshold: QUAKE_MIN_MAG,
        live: liveBeatTexts,
      },
      stations: stations.state(),
      arms: arms.map((a) => a.spec.id),
      live: arms.map((_a, k) => {
        const ev = liveEv[k];
        return ev ? { id: ev.event_id, type: ev.type, seq: ev.sequence } : null;
      }),
      chainTip: events[events.length - 1]?.event_sha256 ?? null,
      // the debrief's three beats, exactly as the pairing engine derived them at load
      episode: episode
        ? {
          id: episode.episodeId,
          sites: episode.sites,
          cause: {
            site: episode.cause.siteId,
            claimVersion: episode.cause.claimVersionId,
            a: episode.cause.a.verdict, b: episode.cause.b.verdict,
            value: episode.cause.b.claim?.value ?? episode.cause.a.claim?.value ?? null,
            competing: episode.cause.siteClaimsB.map((c) =>
              ({ value: c.value, verdict: c.verdict, sources: c.supportingObservationIds.length })),
          },
          choice: {
            shared: episode.choice.sharedSites,
            a: episode.choice.a.onlySites, b: episode.choice.b.onlySites,
            aDispatch: episode.choice.a.dispatches.map((d) => d.dispatchId),
            bDispatch: episode.choice.b.dispatches.map((d) => d.dispatchId),
          },
          consequence: {
            a: episode.consequence.a.peopleReached, b: episode.consequence.b.peopleReached,
            delta: episode.consequence.delta, unit: episode.consequence.unit,
          },
        }
        : null,
      debrief: debriefShown,
      // the real-decision surface: whether it is up and whether its baked file has been read
      real: { open: realBox.classList.contains("on"), loaded: realLoaded },
      // the agent trace: which moment it stands on and which of its cards is showing
      trace: { open: traceIsOpen(), momentId: traceOpen?.momentId ?? null, card: traceCard },
      pairing: pairingNote,
      residueHash: arms.map((a) => {
        let h = 0;
        const sum = (f: Float32Array) => {
          for (let p = 0; p < f.length; p += 7) h = (h + Math.round(f[p] * 1e4) * (p + 1)) >>> 0;
        };
        sum(a.cool); sum(a.ash);
        return h.toString(16);
      }),
    }),
  };
}

/**
 * What a viewer sees when the page cannot start. The banner used to print the failure's own
 * message, which is written for whoever is fixing it and can name a variable that means nothing
 * to anybody else. A viewer needs one sentence saying what happened and one thing to try; the
 * message that names the cause goes to the browser's own console, where the person fixing it
 * looks for it.
 */
boot().catch((error) => {
  const box = document.getElementById("boot");
  if (box) {
    box.textContent = COPY.BOOT_FAILED;
    box.style.textTransform = "none";
    box.style.letterSpacing = ".02em";
    box.style.fontSize = "13px";
    box.style.lineHeight = "1.6";
    box.style.opacity = "0.92";
    box.style.textAlign = "center";
    box.style.padding = "0 12%";
  }
  console.error(error);
});
