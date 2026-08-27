/**
 * RESCUE WORLD — the observed layers that lie on the ground.
 *
 * Three files of real public observations are delivered beside the baked run and drawn here,
 * each at its own recorded coordinates, draped over the elevation-tile surface:
 *
 *   - 35 landslide and deposition polygons, interpreted by the Geospatial Information
 *     Authority of Japan from aerial photographs flown between 2026-07-29 and 2026-08-03;
 *   - 29 road restrictions from the Ministry of Land, Infrastructure, Transport and Tourism's
 *     passable-road snapshot of 2026-07-29 12:00 Japan time;
 *   - 92 designation records for 56 officially designated shelter locations, from the
 *     Geospatial Information Authority's evacuation-site data.
 *
 * These are OBSERVED layers and they are drawn in the cold register — hairline outlines and
 * quiet points — so that nothing simulated can be mistaken for one of them. The simulated
 * damage in `main.ts` is burn-coloured, diffuse, and never a hairline, which is how a reader
 * tells the two apart without reading a word.
 *
 * A feature appears on the ground at the moment the run's own log first names it, so the world
 * fills in as the reports arrive rather than being complete before anything has happened. That
 * moment is a playback tick handed in by `main.ts`; nothing here reads a clock.
 */
import * as THREE from "three";
import type { Frame, Terrain } from "./terrain";

const LIFT = 0.0065;      // world units the drawn lines sit above the ground they follow

export interface HazardFeature {
  id: string;
  rings: [number, number][][];
  centroid: [number, number];
  /** the widest span of the polygon, in metres */
  spanM: number;
  props: Record<string, unknown>;
}
export interface RoadFeature {
  id: string;
  line: [number, number][];
  mid: [number, number];
  props: Record<string, unknown>;
}
export interface ShelterFeature {
  id: string;
  at: [number, number];
  props: Record<string, unknown>;
}

interface RawFeature {
  id?: string;
  properties?: Record<string, unknown>;
  geometry?: { type?: string; coordinates?: unknown };
}
interface RawCollection {
  features?: RawFeature[];
  name?: string;
  source?: Record<string, unknown>;
  classification?: string;
  disclosure?: string;
}

/** every [longitude, latitude] pair inside one GeoJSON coordinate value, at any depth */
function positions(value: unknown, out: [number, number][] = []): [number, number][] {
  if (!Array.isArray(value)) return out;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    out.push([value[0] as number, value[1] as number]);
    return out;
  }
  for (const child of value) positions(child, out);
  return out;
}
/** the rings of a Polygon or MultiPolygon, each as a list of positions */
function ringsOf(value: unknown, depth = 0, out: [number, number][][] = []): [number, number][][] {
  if (!Array.isArray(value) || value.length === 0) return out;
  if (Array.isArray(value[0]) && typeof (value[0] as unknown[])[0] === "number") {
    out.push(positions(value));
    return out;
  }
  for (const child of value) ringsOf(child, depth + 1, out);
  return out;
}

const METRES_PER_DEGREE_LAT = 110540;

export function readHazards(raw: RawCollection, frame: Frame): HazardFeature[] {
  const out: HazardFeature[] = [];
  for (const f of raw.features ?? []) {
    const rings = ringsOf(f.geometry?.coordinates).filter((r) => r.length > 2);
    if (!rings.length) continue;
    const all = rings.flat();
    if (!all.some(([lon, lat]) => frame.inside(lon, lat))) continue;
    let sx = 0, sy = 0;
    let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
    for (const [lon, lat] of all) {
      sx += lon; sy += lat;
      w = Math.min(w, lon); e = Math.max(e, lon);
      s = Math.min(s, lat); n = Math.max(n, lat);
    }
    const centroid: [number, number] = [sx / all.length, sy / all.length];
    const spanM = Math.max((e - w) * METRES_PER_DEGREE_LAT * frame.kx,
      (n - s) * METRES_PER_DEGREE_LAT);
    out.push({
      id: String(f.id ?? `hazard-${out.length}`),
      rings, centroid, spanM, props: f.properties ?? {},
    });
  }
  return out;
}

export function readRoads(raw: RawCollection, frame: Frame): RoadFeature[] {
  const out: RoadFeature[] = [];
  for (const f of raw.features ?? []) {
    const line = positions(f.geometry?.coordinates);
    if (line.length < 2) continue;
    if (!line.some(([lon, lat]) => frame.inside(lon, lat))) continue;
    out.push({
      id: String(f.id ?? `road-${out.length}`),
      line, mid: line[Math.floor(line.length / 2)], props: f.properties ?? {},
    });
  }
  return out;
}

export function readShelters(raw: RawCollection, frame: Frame): ShelterFeature[] {
  const out: ShelterFeature[] = [];
  const seen = new Set<string>();
  for (const f of raw.features ?? []) {
    const p = positions(f.geometry?.coordinates)[0];
    if (!p || !frame.inside(p[0], p[1])) continue;
    // several designation records share one building; the map draws each location once
    const k = `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ id: String(f.id ?? `shelter-${out.length}`), at: p, props: f.properties ?? {} });
  }
  return out;
}

// ------------------------------------------------------------------ drawing them
/**
 * One drawn layer: line work whose every vertex knows which feature it belongs to and the
 * playback tick that feature first appears at. The whole layer is one draw call, the fade-in
 * costs nothing, and the selected feature brightens without any buffer being rewritten.
 */
export interface DrawnLines {
  object: THREE.LineSegments;
  setTick(t: number): void;
  setSelected(feature: number): void;
  vertexCount: number;
}

const LINE_V = `
  attribute float aShow; attribute float aFeat;
  uniform float uTick; uniform float uSel; uniform float uGain;
  varying float vA;
  void main(){
    float age = uTick - aShow;
    float appear = smoothstep(-0.5, 7.0, age);
    float sel = step(abs(aFeat - uSel), 0.5);
    vA = appear * uGain * (1.0 + sel * 2.2);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const LINE_F = `
  precision highp float;
  uniform vec3 uColor;
  varying float vA;
  void main(){
    if (vA <= 0.004) discard;
    gl_FragColor = vec4(uColor * vA, vA);
  }`;

function drawnLines(segments: number[][], featureOf: number[], showOf: number[],
  color: readonly [number, number, number], gain: number): DrawnLines {
  const n = segments.length;
  const pos = new Float32Array(n * 3);
  const feat = new Float32Array(n);
  const show = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = segments[i][0]; pos[i * 3 + 1] = segments[i][1]; pos[i * 3 + 2] = segments[i][2];
    feat[i] = featureOf[i]; show[i] = showOf[i];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aFeat", new THREE.BufferAttribute(feat, 1));
  geo.setAttribute("aShow", new THREE.BufferAttribute(show, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTick: { value: 0 }, uSel: { value: -1 }, uGain: { value: gain },
      uColor: { value: new THREE.Vector3(...color) },
    },
    vertexShader: LINE_V, fragmentShader: LINE_F,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  });
  const object = new THREE.LineSegments(geo, mat);
  object.frustumCulled = false;
  object.renderOrder = 2;
  return {
    object, vertexCount: n,
    setTick(t) { mat.uniforms.uTick.value = t; },
    setSelected(f) { mat.uniforms.uSel.value = f; },
  };
}

/** the landslide polygons, as closed hairline outlines lying on the ground */
export function buildHazardLines(hazards: HazardFeature[], frame: Frame, terrain: Terrain,
  showTick: (id: string) => number, color: readonly [number, number, number]): DrawnLines {
  const seg: number[][] = [], feat: number[] = [], show: number[] = [];
  hazards.forEach((hz, i) => {
    const t = showTick(hz.id);
    for (const ring of hz.rings) {
      for (let k = 0; k < ring.length; k++) {
        const a = ring[k], b = ring[(k + 1) % ring.length];
        for (const p of [a, b]) {
          seg.push([frame.x(p[0]), terrain.heightAtLonLat(p[0], p[1]) + LIFT, frame.z(p[1])]);
          feat.push(i); show.push(t);
        }
      }
    }
  });
  return drawnLines(seg, feat, show, color, 0.62);
}

/** the road restrictions, as thin lines following the roads they close */
export function buildRoadLines(roads: RoadFeature[], frame: Frame, terrain: Terrain,
  showTick: (id: string) => number, color: readonly [number, number, number]): DrawnLines {
  const seg: number[][] = [], feat: number[] = [], show: number[] = [];
  roads.forEach((rd, i) => {
    const t = showTick(rd.id);
    for (let k = 1; k < rd.line.length; k++) {
      for (const p of [rd.line[k - 1], rd.line[k]]) {
        seg.push([frame.x(p[0]), terrain.heightAtLonLat(p[0], p[1]) + LIFT, frame.z(p[1])]);
        feat.push(i); show.push(t);
      }
    }
  });
  return drawnLines(seg, feat, show, color, 0.50);
}
