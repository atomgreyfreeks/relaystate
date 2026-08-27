/**
 * RESCUE WORLD — the full-incident context layers.
 *
 * Three more files of real public data can be switched on over the same ground. None of them is
 * part of the recorded run: the two desks never read them, no outcome in the log depends on
 * them, and nothing here writes to the run's state. They are context — what else was true about
 * this place while the exercise played — and every one of them is off until a reader asks for it.
 *
 *   1. Aftershocks. The Japan Meteorological Agency's regional earthquake sequence: 570 events
 *      starting with the 28 July main shock. An event whose recorded origin time falls inside
 *      this run's own window pulses once on the ground at its epicentre, at the playback tick
 *      that time works out to. Most of the sequence happens after the run ends, and the layer
 *      says so rather than compressing a month into six hours.
 *   2. Population. The 2020 census on a 500 metre mesh, drawn as a dim blue field on the ground.
 *      The field is built once into a small picture when the layer is first switched on, so a
 *      frame costs one extra surface and no arithmetic.
 *   3. Designated shelters. The 92 designation records at their 56 locations, drawn as small
 *      house marks. A house is not a site glow: the shape is the whole point, because a
 *      designated shelter is not an event and the world must never suggest it was one.
 *   4. Modeled occupancy, a mode of layer three. A ring around each house mark, sized by a
 *      modeled share of the Cabinet Office's prefecture-wide shelter aggregate. It is modeled
 *      arithmetic over two published totals, never an observed per-shelter headcount, and it
 *      says so in its switch, in its note and in this file. See THE MODELED SHELTER-OCCUPANCY
 *      LAYER below for the whole derivation.
 *
 * DETERMINISM. Every value drawn here is a function of the playback tick and of static file
 * data. There is no clock, no random source, and no state that survives a rewind. Switching a
 * layer changes what is drawn and nothing else — no tick, no camera, no desk, no metric.
 *
 * HONESTY. Each layer states its own classification, its provider, and the file's own disclosure
 * sentence the first time it is switched on, and each states how much of its record actually
 * falls on this map and inside this run.
 */
import * as THREE from "three";
import type { Frame, Terrain } from "./terrain";
import type { ShelterFeature } from "./layers";

/** how far above the ground the drawn context sits, in world units */
const LIFT = 0.0045;
/**
 * How bright each layer is allowed to be. Context is never the subject: the reports, the sites,
 * the dispatches and the burn marks the simulation leaves must keep the eye, so every one of
 * these numbers was set by looking at the assembled frame and turning it down until the story
 * read first. The census field is the quietest of the three because it covers the most ground.
 */
const GAIN = { quake: 0.62, population: 0.52, shelter: 0.55 };

/**
 * THE MODELED SHELTER-OCCUPANCY LAYER — the whole derivation, in one place.
 *
 * No agency published a headcount for any single shelter. What the Cabinet Office published are
 * prefecture-wide totals, quoted in docs/rescueworld/REAL-RESPONSE-RECONSTRUCTION.md section 1
 * and section 3.8:
 *
 *   peakPeople    9,931 people in shelters, the highest figure recorded for the whole event.
 *                 Cabinet Office situation report of 2026-07-30 06:30, across 419 shelters.
 *   peakShelters  506 shelters open, the highest shelter count of the whole event.
 *                 Cabinet Office situation report of 2026-07-29 06:20, holding 9,186 people.
 *
 * Those two peaks come from two different reports and never held at the same minute. Spreading
 * the larger headcount over the larger shelter count gives 9,931 / 506 = 19.6 people per shelter,
 * which is lower than either report's own per-shelter figure and is chosen for exactly that
 * reason. That average, times the number of designated shelters standing on this map, is the
 * total this layer has to give away.
 *
 * Each shelter's share is the census population near it. Every 500 metre census cell whose centre
 * lies within nearMetres of a shelter contributes its counted people to that shelter's weight, and
 * the shelter receives the total in proportion to its weight against the sum of all weights on
 * this map. A shelter with no counted people inside that radius receives nothing.
 *
 * ringPower and ringGrowth are drawing choices and change no modeled number. The square root
 * spreads the ring sizes so two shelters can be told apart, the same choice the census field
 * makes with its own brightness; ringGrowth is how much wider the largest ring sits than the
 * house mark inside it.
 *
 * Determinism: every value is a function of two committed files and the five numbers below. There
 * is no clock, no random source, and no dependence on the playback tick, the camera or the desk.
 */
const OCCUPANCY = {
  peakPeople: 9931,
  peakShelters: 506,
  nearMetres: 1500,
  ringPower: 0.5,
  ringGrowth: 0.7,
};
/** metres per degree of latitude, the same figure the census field uses for its cell width */
const METRES_PER_DEGREE = 110540;

// ------------------------------------------------------------------ what the files say
export interface QuakeEvent {
  id: string;
  lon: number;
  lat: number;
  magnitude: number | null;
  depthM: number | null;
  originMs: number;
  originTime: string;
  area: string;
  maxIntensity: string;
}
export interface PopulationCell {
  lon: number;
  lat: number;
  people: number;
}

interface RawQuakeFile {
  classification?: string;
  disclosure?: string;
  event_count?: number;
  first_origin_time?: string;
  last_origin_time?: string;
  events?: {
    event_id?: string;
    origin_time?: string;
    area_name_english?: string;
    magnitude?: number | null;
    maximum_intensity?: string;
    hypocenter?: { latitude?: number; longitude?: number; depth_m?: number };
  }[];
}
interface RawPopulationFile {
  classification?: string;
  disclosure?: string;
  provider?: string;
  census_date?: string;
  cell_count?: number;
  population_total?: number;
  cells?: [number, number, number | null][];
}
interface RawShelterFile {
  classification?: string;
  disclosure?: string;
  designation_record_count?: number;
  unique_location_count?: number;
  source?: { provider?: string; frozen_on?: string };
}

const numOr = (v: unknown, d: number | null = null) =>
  (typeof v === "number" && isFinite(v) ? v : d);
const text = (v: unknown, d = "") => (typeof v === "string" && v ? v : d);

/** every earthquake in the file that carries a hypocentre, in the file's own order */
export function readQuakes(raw: RawQuakeFile): QuakeEvent[] {
  const out: QuakeEvent[] = [];
  for (const e of raw.events ?? []) {
    const lat = numOr(e.hypocenter?.latitude);
    const lon = numOr(e.hypocenter?.longitude);
    const originTime = text(e.origin_time);
    const originMs = Date.parse(originTime);
    if (lat === null || lon === null || !isFinite(originMs)) continue;
    out.push({
      id: text(e.event_id, `quake-${out.length}`),
      lon, lat,
      magnitude: numOr(e.magnitude),
      depthM: numOr(e.hypocenter?.depth_m),
      originMs, originTime,
      area: text(e.area_name_english),
      maxIntensity: text(e.maximum_intensity),
    });
  }
  return out;
}

/** every census cell in the file that carries a counted population */
export function readPopulation(raw: RawPopulationFile): PopulationCell[] {
  const out: PopulationCell[] = [];
  for (const row of raw.cells ?? []) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const lon = numOr(row[0]), lat = numOr(row[1]), people = numOr(row[2]);
    if (lon === null || lat === null || people === null || people <= 0) continue;
    out.push({ lon, lat, people });
  }
  return out;
}

// ------------------------------------------------------------------ the aftershock pulses
/**
 * One draw call for the whole sequence. Each epicentre carries the tick its own record fires
 * at; the shader turns the distance from that tick into a ring that opens and fades, and leaves
 * a faint mark behind so the ground keeps a record of what has already shaken it.
 */
const QUAKE_V = `
  attribute float aTick; attribute float aMag;
  uniform float uTick; uniform float uPix; uniform float uGain;
  varying float vPulse; varying float vRest; varying float vGrow;
  void main(){
    float age = uTick - aTick;
    float fired = step(0.0, age);
    vPulse = fired * exp(-age / 6.5) * uGain;
    vRest = fired * (1.0 - exp(-max(age, 0.0) / 3.0)) * 0.13 * uGain;
    vGrow = 1.0 - exp(-max(age, 0.0) / 3.4);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float world = 0.020 + 0.016 * aMag;
    gl_PointSize = clamp(world * (1.0 + 2.6 * vGrow) * uPix / max(0.02, -mv.z), 2.0, 190.0);
    gl_Position = projectionMatrix * mv;
  }`;
const QUAKE_F = `
  precision highp float;
  uniform vec3 uColor;
  varying float vPulse; varying float vRest; varying float vGrow;
  void main(){
    float r = min(1.0, length(gl_PointCoord - 0.5) * 2.0);
    float ring = exp(-pow((r - mix(0.30, 0.80, vGrow)) * 9.0, 2.0)) * vPulse;
    float core = pow(1.0 - r, 3.2) * vRest;
    float a = ring + core;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(uColor * a, a);
  }`;

// ------------------------------------------------------------------ the census glow field
/**
 * A second surface over the ground, at a coarser grid than the ground itself because a soft
 * field needs no elevation detail. It is additive and dim, so the contour lines keep the
 * reading and the field sits under them the way a shadow sits under a drawing.
 */
const FIELD_V = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const FIELD_F = `
  precision highp float;
  uniform sampler2D uField; uniform vec3 uColor; uniform float uGain;
  varying vec2 vUv;
  void main(){
    float v = texture2D(uField, vUv).r * uGain;
    if (v <= 0.002) discard;
    gl_FragColor = vec4(uColor * v, v);
  }`;

// ------------------------------------------------------------------ the shelter house marks
/**
 * The house mark, and the modeled occupancy ring around it. With the occupancy mode off, uOcc is
 * zero: vGrow is one, the ring term is zero, and every line below is the house exactly as it was
 * drawn before the ring existed. With the mode on, the sprite grows by the shelter's own modeled
 * share and the house is drawn in the grown sprite's coordinates, so the house keeps its size on
 * screen and only the ring moves outward.
 */
const HOUSE_V = `
  attribute float aOcc;
  uniform float uPix; uniform float uGain; uniform float uOcc;
  varying float vA; varying float vGrow; varying float vRing;
  void main(){
    vA = uGain;
    vRing = aOcc * uOcc;
    vGrow = 1.0 + ${OCCUPANCY.ringGrowth.toFixed(2)} * vRing;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(0.026 * uPix / max(0.02, -mv.z), 9.0, 26.0) * vGrow;
    gl_Position = projectionMatrix * mv;
  }`;
const HOUSE_F = `
  precision highp float;
  uniform vec3 uColor;
  varying float vA; varying float vGrow; varying float vRing;
  float seg(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }
  void main(){
    vec2 s = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) * 2.0 - 1.0;
    vec2 p = s * vGrow;
    float d = seg(p, vec2(-0.52, -0.78), vec2(0.52, -0.78));
    d = min(d, seg(p, vec2(-0.52, -0.78), vec2(-0.52, 0.10)));
    d = min(d, seg(p, vec2(0.52, -0.78), vec2(0.52, 0.10)));
    d = min(d, seg(p, vec2(-0.72, 0.10), vec2(0.0, 0.80)));
    d = min(d, seg(p, vec2(0.72, 0.10), vec2(0.0, 0.80)));
    d = min(d, seg(p, vec2(-0.72, 0.10), vec2(0.72, 0.10)));
    float a = (smoothstep(0.16, 0.0, d) + exp(-d * 4.5) * 0.16) * vA;
    float r = length(s);
    a += exp(-pow((r - 0.84) * 12.0 * vGrow, 2.0)) * vRing * vA * 0.85;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(uColor * a, a);
  }`;

// ------------------------------------------------------------------ mounting the three layers
export interface ContextMountOptions {
  scene: THREE.Scene;
  frame: Frame;
  terrain: Terrain;
  /** the deduplicated shelter locations the world already knows about */
  shelters: ShelterFeature[];
  /** the shelter file itself, for the counts and the disclosure sentence it carries */
  shelterFile: unknown;
  /** the delivered files this page may fetch, or nothing where the bake delivered none */
  urls: { aftershocks: string | null; population: string | null };
  /** milliseconds since the epoch at the run's first recorded moment */
  startMs: number;
  /** the recorded seconds of each moment in the log, and the playback tick each one sits at */
  moments: number[];
  anchors: number[];
  /** the highest playback tick the transport can reach */
  ticks: number;
  /** the palette this page is allowed to draw in */
  bone: readonly [number, number, number];
  /** hands a point material to the page's own resize handler, which keeps its pixel scale */
  registerPoints(material: THREE.ShaderMaterial): void;
}

export interface ContextLayers {
  /** called once a frame with the playback tick; costs three uniform writes when idle */
  update(tick: number): void;
  /** everything a verifier needs to see that the layers are what they say they are */
  state(): Record<string, unknown>;
}

interface LayerCopy {
  id: string;
  button: string;
  label: string;
  provider: string;
}
const COPY: Record<"quake" | "pop" | "shelter" | "occ", LayerCopy> = {
  quake: {
    id: "layerQuake",
    button: "aftershocks",
    label: "aftershocks · a weather agency recorded these",
    provider: "Japan Meteorological Agency, which is Japan's national weather service",
  },
  pop: {
    id: "layerPop",
    button: "who lives here",
    label: "who lives here · counted in 2020",
    provider: "Statistics Bureau of Japan, which issues the national census through its e-Stat website",
  },
  shelter: {
    id: "layerShelter",
    button: "designated shelters",
    label: "official shelters · this recording does not say whether they were open",
    provider: "Geospatial Information Authority of Japan, which draws Japan's official maps",
  },
  occ: {
    id: "layerOccupancy",
    button: "occupancy",
    // The same layer's switch in the copy deck already says this in plain words, at
    // `COPY.OCCUPANCY.label`. This line held three technical nouns instead — "occupancy",
    // "aggregate reports", "per-shelter data" — so it now reads exactly as its twin does.
    label: "how full the shelters are · worked out from the region's published totals, because"
      + " nobody published a count for each shelter",
    provider: "Cabinet Office of Japan, situation reports",
  },
};

/** plain words for a classification code, so the line reads as a sentence rather than a stamp */
const CLASS_WORDS: Record<string, string> = {
  OBSERVED_PUBLIC: "a public record of what was seen",
  OBSERVED_PUBLIC_CENSUS: "a public census record of what was counted",
  OBSERVED_PUBLIC_STATIC_DESIGNATION:
    "a public list of places named in advance, which stays in force whatever happens",
};
const classWords = (code: string) =>
  CLASS_WORDS[code] ?? (code ? code.replace(/_/g, " ").toLowerCase() : "a public record of what was seen");

const groups = (n: number) => n.toLocaleString("en-US");

export function mountContextLayers(opts: ContextMountOptions): ContextLayers {
  const { scene, frame, terrain, shelters, urls, startMs, moments, anchors, ticks, bone } = opts;
  const M = moments.length;
  const lastSecond = M > 0 ? moments[M - 1] : 0;

  /** the playback tick a recorded second sits at — the transport's own mapping, run backwards */
  function tickOfSeconds(sec: number) {
    if (M === 0) return 0;
    if (sec <= moments[0]) return anchors[0];
    for (let i = 1; i < M; i++) {
      if (sec <= moments[i]) {
        const gap = Math.max(1e-9, moments[i] - moments[i - 1]);
        return anchors[i - 1] + (anchors[i] - anchors[i - 1]) * (sec - moments[i - 1]) / gap;
      }
    }
    return anchors[M - 1];
  }

  // ---- the controls, and the one line each layer states the first time it is asked for
  const el = (id: string) => document.getElementById(id);
  const note = el("layerNote");
  let noteTimer = 0;
  function showNote(lines: string[]) {
    if (!note) return;
    note.textContent = "";
    for (const line of lines) {
      const row = document.createElement("p");
      row.textContent = line;
      note.append(row);
    }
    note.classList.add("on");
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => note.classList.remove("on"), 11000) as unknown as number;
  }

  // ---- layer one: the recorded earthquake sequence
  let quakes: QuakeEvent[] = [];
  let quakeFile: RawQuakeFile = {};
  let quakePoints: THREE.Points | null = null;
  let quakeMat: THREE.ShaderMaterial | null = null;
  let quakeDrawn = 0, quakeOnMap = 0, quakeInWindow = 0;

  function buildQuakes() {
    const shown: { x: number; y: number; z: number; tick: number; mag: number }[] = [];
    for (const q of quakes) {
      const onMap = frame.inside(q.lon, q.lat);
      const seconds = (q.originMs - startMs) / 1000;
      const inWindow = seconds >= 0 && seconds <= lastSecond;
      if (onMap) quakeOnMap++;
      if (inWindow) quakeInWindow++;
      if (!onMap || !inWindow) continue;
      shown.push({
        x: frame.x(q.lon),
        y: terrain.heightAtLonLat(q.lon, q.lat) + LIFT,
        z: frame.z(q.lat),
        tick: tickOfSeconds(seconds),
        mag: q.magnitude ?? 2.0,
      });
    }
    quakeDrawn = shown.length;
    const pos = new Float32Array(shown.length * 3);
    const tick = new Float32Array(shown.length);
    const mag = new Float32Array(shown.length);
    shown.forEach((s, i) => {
      pos[i * 3] = s.x; pos[i * 3 + 1] = s.y; pos[i * 3 + 2] = s.z;
      tick[i] = s.tick; mag[i] = s.mag;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aTick", new THREE.BufferAttribute(tick, 1));
    geo.setAttribute("aMag", new THREE.BufferAttribute(mag, 1));
    quakeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTick: { value: 0 }, uPix: { value: 400 }, uGain: { value: GAIN.quake },
        uColor: { value: new THREE.Vector3(bone[0], bone[1], bone[2]) },
      },
      vertexShader: QUAKE_V, fragmentShader: QUAKE_F,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    opts.registerPoints(quakeMat);
    quakePoints = new THREE.Points(geo, quakeMat);
    quakePoints.frustumCulled = false;
    quakePoints.renderOrder = 2;
    scene.add(quakePoints);
  }

  function quakeNote() {
    const first = text(quakeFile.first_origin_time).slice(0, 16).replace("T", " ");
    const last = text(quakeFile.last_origin_time).slice(0, 16).replace("T", " ");
    return [
      `${COPY.quake.label} — ${classWords(text(quakeFile.classification))},`
      + ` ${COPY.quake.provider}.`,
      text(quakeFile.disclosure),
      `${groups(quakes.length)} recorded events, ${first} to ${last} Japan time.`
      + ` ${groups(quakeDrawn)} of them fall inside this run's window and on this map;`
      + " the rest happen after the run ends or off its edge, and are not drawn.",
    ].filter((s) => s.length > 0);
  }

  // ---- layer two: the census population field
  let cells: PopulationCell[] = [];
  let popFile: RawPopulationFile = {};
  let popMesh: THREE.Mesh | null = null;
  let popMat: THREE.ShaderMaterial | null = null;
  let popCellsOnMap = 0, popPeopleOnMap = 0, popPeopleAll = 0, popBrightest = 0;

  /** the census counts, splatted once into a small picture in the ground's own coordinates */
  function buildPopulation() {
    const TX = 256;
    const TZ = Math.max(32, Math.round(TX * frame.mapD / frame.mapW));
    const field = new Float32Array(TX * TZ);
    // one census cell is 500 metres across; this is that width in picture elements
    const cellTexels = Math.max(1.2, 500 * frame.scale / 110540 / frame.mapW * TX);
    const radius = Math.ceil(cellTexels * 1.25);
    const sigma2 = 2 * (cellTexels * 0.46) * (cellTexels * 0.46);
    for (const c of cells) {
      popPeopleAll += c.people;
      if (!frame.inside(c.lon, c.lat)) continue;
      popCellsOnMap++;
      popPeopleOnMap += c.people;
      // the square root keeps a city from washing out a village: brightness rises with the
      // count but a place with a hundred times the people is ten times as bright, not a hundred
      const weight = Math.sqrt(c.people);
      const cx = frame.u(c.lon) * TX - 0.5;
      const cy = frame.v(c.lat) * TZ - 0.5;
      const xa = Math.max(0, Math.floor(cx - radius)), xb = Math.min(TX - 1, Math.ceil(cx + radius));
      const ya = Math.max(0, Math.floor(cy - radius)), yb = Math.min(TZ - 1, Math.ceil(cy + radius));
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) continue;
        field[y * TX + x] += weight * Math.exp(-d2 / sigma2);
      }
    }
    for (let i = 0; i < field.length; i++) if (field[i] > popBrightest) popBrightest = field[i];
    const data = new Uint8Array(TX * TZ);
    const norm = popBrightest > 0 ? 255 / popBrightest : 0;
    for (let i = 0; i < field.length; i++) data[i] = Math.min(255, Math.round(field[i] * norm));
    const tex = new THREE.DataTexture(data, TX, TZ, THREE.RedFormat);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    // a coarse copy of the ground: a soft field needs the shape of the hills, not their detail
    const geo = new THREE.PlaneGeometry(frame.mapW, frame.mapD, 176, 176);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const uvs = geo.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, terrain.heightAt(uvs.getX(i), uvs.getY(i)) + LIFT * 0.5);
    }
    pos.needsUpdate = true;
    geo.deleteAttribute("normal");
    geo.computeBoundingSphere();
    popMat = new THREE.ShaderMaterial({
      uniforms: {
        uField: { value: tex }, uGain: { value: GAIN.population },
        uColor: { value: new THREE.Vector3(0.20, 0.40, 0.92) },
      },
      vertexShader: FIELD_V, fragmentShader: FIELD_F,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    popMesh = new THREE.Mesh(geo, popMat);
    popMesh.rotation.x = -Math.PI / 2;
    popMesh.renderOrder = 1;
    popMesh.frustumCulled = false;
    scene.add(popMesh);
  }

  function popNote() {
    return [
      `${COPY.pop.label} — ${classWords(text(popFile.classification))},`
      + ` ${text(popFile.provider, COPY.pop.provider)}, counted ${text(popFile.census_date)}.`,
      text(popFile.disclosure),
      `${groups(popCellsOnMap)} of ${groups(cells.length)} counted cells lie on this map,`
      + ` holding ${groups(popPeopleOnMap)} of ${groups(popPeopleAll)} counted people.`
      + " A cell's glow rises with its count and rises slowly: a cell holding a hundred times"
      + " as many people glows only ten times as bright."
      + " The cell holding the most people is the brightest one on this map.",
    ].filter((s) => s.length > 0);
  }

  // ---- layer three: the designated shelters, as houses
  const shelterFile = (opts.shelterFile ?? {}) as RawShelterFile;
  let housePoints: THREE.Points | null = null;
  let houseMat: THREE.ShaderMaterial | null = null;

  let houseOcc: THREE.BufferAttribute | null = null;

  function buildHouses() {
    const pos = new Float32Array(shelters.length * 3);
    shelters.forEach((s, i) => {
      pos[i * 3] = frame.x(s.at[0]);
      pos[i * 3 + 1] = terrain.heightAtLonLat(s.at[0], s.at[1]) + LIFT * 2.2;
      pos[i * 3 + 2] = frame.z(s.at[1]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    // every house carries its own modeled share, zero until the occupancy mode works it out
    houseOcc = new THREE.BufferAttribute(new Float32Array(shelters.length), 1);
    geo.setAttribute("aOcc", houseOcc);
    houseMat = new THREE.ShaderMaterial({
      uniforms: {
        uPix: { value: 400 }, uGain: { value: GAIN.shelter }, uOcc: { value: 0 },
        uColor: { value: new THREE.Vector3(bone[0], bone[1], bone[2]) },
      },
      vertexShader: HOUSE_V, fragmentShader: HOUSE_F,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    opts.registerPoints(houseMat);
    housePoints = new THREE.Points(geo, houseMat);
    housePoints.frustumCulled = false;
    housePoints.renderOrder = 3;
    scene.add(housePoints);
  }

  function houseNote() {
    const designations = numOr(shelterFile.designation_record_count, shelters.length) ?? 0;
    const locations = numOr(shelterFile.unique_location_count, shelters.length) ?? 0;
    return [
      `${COPY.shelter.label} — ${classWords(text(shelterFile.classification))},`
      + ` ${text(shelterFile.source?.provider, COPY.shelter.provider)},`
      + ` frozen ${text(shelterFile.source?.frozen_on, "2026-08-23")}.`,
      text(shelterFile.disclosure),
      `Officials named ${groups(locations)} places as shelters, listing them ${groups(designations)}`
      + ` times in all, and ${groups(shelters.length)} of those places sit on this map.`
      + " A house mark shows a place that was named before the earthquake"
      + " and never something that happened during it.",
    ].filter((s) => s.length > 0);
  }

  // ---- layer four: the modeled occupancy ring, a mode of layer three
  // The arithmetic and its sources are stated in full at THE MODELED SHELTER-OCCUPANCY LAYER
  // at the top of this file. Nothing below invents a number; it shares two published totals out.
  let occShare: number[] = [];
  let occPeople: number[] = [];
  let occModeledTotal = 0, occLargest = 0, occWithPeople = 0;

  function buildOccupancy() {
    const perShelter = OCCUPANCY.peakPeople / OCCUPANCY.peakShelters;
    occModeledTotal = perShelter * shelters.length;
    const weight = new Float64Array(shelters.length);
    // the census cells near each shelter, in metres on the ground rather than in degrees
    const latSpan = OCCUPANCY.nearMetres / METRES_PER_DEGREE;
    for (const c of cells) {
      for (let i = 0; i < shelters.length; i++) {
        const at = shelters[i].at;
        const dLat = c.lat - at[1];
        if (dLat > latSpan || dLat < -latSpan) continue;
        const dLon = (c.lon - at[0]) * Math.cos(at[1] * Math.PI / 180);
        const north = dLat * METRES_PER_DEGREE;
        const east = dLon * METRES_PER_DEGREE;
        if (north * north + east * east > OCCUPANCY.nearMetres * OCCUPANCY.nearMetres) continue;
        weight[i] += c.people;
      }
    }
    let sum = 0;
    for (let i = 0; i < weight.length; i++) sum += weight[i];
    occPeople = new Array(shelters.length).fill(0);
    occShare = new Array(shelters.length).fill(0);
    occLargest = 0;
    occWithPeople = 0;
    if (sum > 0) {
      for (let i = 0; i < weight.length; i++) {
        occPeople[i] = occModeledTotal * weight[i] / sum;
        if (weight[i] > 0) occWithPeople++;
        if (occPeople[i] > occLargest) occLargest = occPeople[i];
      }
    }
    for (let i = 0; i < occPeople.length; i++) {
      occShare[i] = occLargest > 0 ? Math.pow(occPeople[i] / occLargest, OCCUPANCY.ringPower) : 0;
    }
    if (houseOcc) {
      for (let i = 0; i < occShare.length; i++) houseOcc.setX(i, occShare[i]);
      houseOcc.needsUpdate = true;
    }
  }

  const round = (n: number) => Math.round(n).toLocaleString("en-US");

  function occNote() {
    const perShelter = OCCUPANCY.peakPeople / OCCUPANCY.peakShelters;
    return [
      `${COPY.occ.label} — ${COPY.occ.provider}.`,
      `Across the whole prefecture, ${groups(OCCUPANCY.peakPeople)} people were in shelters at the`
      + ` worst hour, and ${groups(OCCUPANCY.peakShelters)} shelters stood open at a different hour.`
      + ` Those two published totals give ${perShelter.toFixed(1)} people for each shelter.`,
      `That average, spread across the ${groups(shelters.length)} shelters marked on this map,`
      + ` comes to ${round(occModeledTotal)} modeled people. Each shelter's share follows how many`
      + ` people the census counted within ${(OCCUPANCY.nearMetres / 1000).toFixed(1)} kilometres`
      + " of it.",
      "No agency published a headcount for any single shelter. A ring is a share of an aggregate"
      + " and is never a count of who was there.",
    ];
  }

  // ---- the switches
  type Which = "quake" | "pop" | "shelter" | "occ";
  const on = { quake: false, pop: false, shelter: false, occ: false };
  const ready = { quake: false, pop: false, shelter: false, occ: false };
  const busy = { quake: false, pop: false, shelter: false, occ: false };
  const buttons = new Map<Which, HTMLButtonElement>();
  const NOTES: Record<Which, () => string[]> = {
    quake: quakeNote, pop: popNote, shelter: houseNote, occ: occNote,
  };

  async function loadJson(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return response.json();
  }

  /** the census file, read once whether the field asked for it or the occupancy ring did */
  async function ensureCells() {
    if (cells.length > 0) return;
    if (!urls.population) throw new Error("the bake delivered no population grid");
    popFile = await loadJson(urls.population) as RawPopulationFile;
    cells = readPopulation(popFile);
  }

  /** the switch shows what the layer is doing, whoever asked for it */
  function press(which: Which, next: boolean) {
    on[which] = next;
    const button = buttons.get(which);
    if (!button) return;
    button.classList.toggle("on", next);
    button.setAttribute("aria-pressed", String(next));
  }

  function wire(which: Which, prepare: () => Promise<void>, clicked?: () => void) {
    const button = el(COPY[which].id) as HTMLButtonElement | null;
    if (!button) return;
    buttons.set(which, button);
    button.addEventListener("click", () => {
      press(which, !on[which]);
      if (clicked) clicked();
      if (!on[which] || ready[which] || busy[which]) return;
      busy[which] = true;
      prepare().then(() => {
        busy[which] = false;
        ready[which] = true;
        if (on[which]) showNote(NOTES[which]());
      }).catch((error: Error) => {
        busy[which] = false;
        press(which, false);
        showNote([`${COPY[which].label} — the map file behind it could not be read.`,
          error.message]);
      });
    });
    if (which === "quake" && !urls.aftershocks) button.disabled = true;
    if ((which === "pop" || which === "occ") && !urls.population) button.disabled = true;
  }

  wire("quake", async () => {
    if (!urls.aftershocks) throw new Error("the bake delivered no aftershock sequence");
    quakeFile = await loadJson(urls.aftershocks) as RawQuakeFile;
    quakes = readQuakes(quakeFile);
    buildQuakes();
  });
  wire("pop", async () => {
    await ensureCells();
    buildPopulation();
  });
  wire("shelter", async () => { buildHouses(); }, () => {
    // the ring lives on the house mark, so putting the houses away puts the ring away with them
    if (!on.shelter && on.occ) press("occ", false);
  });
  wire("occ", async () => {
    await ensureCells();
    if (!housePoints) buildHouses();
    buildOccupancy();
  }, () => {
    // a ring with no house to sit on is nothing to look at, so asking for one asks for both
    if (on.occ && !on.shelter) {
      press("shelter", true);
      if (!ready.shelter && !busy.shelter) { buildHouses(); ready.shelter = true; }
    }
  });

  // ---- the frame
  // A layer that is off is a hidden object and a zero uniform; a layer that was never asked for
  // does not exist at all. Nothing here allocates, reads a clock, or touches the run's state.
  return {
    update(tick: number) {
      if (quakePoints && quakeMat) {
        quakePoints.visible = on.quake;
        if (on.quake) quakeMat.uniforms.uTick.value = tick;
      }
      if (popMesh) popMesh.visible = on.pop;
      if (housePoints) housePoints.visible = on.shelter;
      if (houseMat) houseMat.uniforms.uOcc.value = on.occ && ready.occ ? 1 : 0;
    },
    state() {
      return {
        aftershocks: {
          on: on.quake, ready: ready.quake,
          recorded: quakes.length, onMap: quakeOnMap,
          inWindow: quakeInWindow, drawn: quakeDrawn,
          firstOrigin: text(quakeFile.first_origin_time),
          lastOrigin: text(quakeFile.last_origin_time),
          classification: text(quakeFile.classification),
        },
        population: {
          on: on.pop, ready: ready.pop,
          cells: cells.length, cellsOnMap: popCellsOnMap,
          people: popPeopleAll, peopleOnMap: popPeopleOnMap,
          classification: text(popFile.classification),
        },
        shelters: {
          on: on.shelter, ready: ready.shelter,
          designations: numOr(shelterFile.designation_record_count, 0),
          locations: numOr(shelterFile.unique_location_count, 0),
          drawn: housePoints ? shelters.length : 0,
          classification: text(shelterFile.classification),
        },
        // the modeled occupancy ring: arithmetic over two published prefecture-wide totals,
        // never an observed per-shelter headcount. classification says so in one word.
        occupancy: {
          on: on.occ, ready: ready.occ,
          classification: "MODELED_FROM_OFFICIAL_AGGREGATE",
          peakPeople: OCCUPANCY.peakPeople,
          peakShelters: OCCUPANCY.peakShelters,
          nearMetres: OCCUPANCY.nearMetres,
          perShelter: +(OCCUPANCY.peakPeople / OCCUPANCY.peakShelters).toFixed(4),
          modeledTotal: +occModeledTotal.toFixed(4),
          largest: +occLargest.toFixed(4),
          withPeopleNear: occWithPeople,
          shares: occShare.map((v) => +v.toFixed(6)),
          people: occPeople.map((v) => +v.toFixed(4)),
        },
        ticks,
      };
    },
  };
}
