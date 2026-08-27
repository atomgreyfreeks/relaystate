/**
 * RESCUE WORLD — the instruments that stand on the ground.
 *
 * Every place the log names gets a small instrument lying flat on the landscape at its own
 * coordinate: a dial ring with a tick rule, four reticle marks, a needle, and the place's
 * name written under it. One number is on each dial and it is read straight out of the
 * event log. Which number that is depends on what the log actually holds: the count of
 * simulated people a desk reached at that place, where the log records that count; the verdict
 * written on that place's claim, shown as a discrete needle position; or, where the log records
 * neither, the number of moments recorded at that place. The words under the name say which of
 * the three it is, and a dial never carries words for a count the log does not hold.
 *
 * The drawing is the component language of the Halo Forge engine, ported from the copy at
 * board/public/dome.html. That engine paints each layer of a component as white line work
 * into a canvas, keeps only the coverage, and lets the shader colour it; the four painters
 * here — ring, tick rule, reticle marks, and text — are the smallest set that still reads as
 * the same instrument. The face of every dial is painted once at load. The parts that move,
 * the needle and the filled arc, are drawn by the fragment shader from two numbers, so a
 * value that changes never costs a repaint.
 *
 * One instrument is five flat plates stacked in the air above its own coordinate, in the way
 * the Halo Forge engine builds a component out of layers held apart by a separation setting.
 * From the ground up: the base plate with the rim, the tick rule, the needle plane, the dial
 * ring with the four framing marks, and the place's name highest of all. The gaps are a
 * fraction of the plate's own width, so an instrument on a wide plate stands as tall as it is
 * broad and the oblique camera sees a stack rather than a decal.
 *
 * The tick rule turns, and the dial ring turns back against it, the whole time the page is
 * open. That turn is the engine's idle drift: a lazy continuous spin whose speed and direction
 * come from a hash of the place's own name, so no two instruments on the map tick alike and
 * the same place turns the same way on both desks. The turn runs on elapsed real time, not on
 * the playback tick, exactly as the scanning pulse and the bracket reveals do, so the
 * instruments stay alive while the run is paused. Nothing the turn touches is ever read back:
 * every number an instrument DISPLAYS still comes from the playback tick alone, and
 * `state()` never sees a rotation.
 *
 * The pulse is the dome adapter's pulse, ported from the same file: a fast rise over the
 * first 0.22 of the window and a quadratic fall back to rest over the remaining 0.78. The
 * window here is one second of playback, so the rise takes 0.22 seconds, exactly as it does
 * on the globe. The dome drives that pulse from the wall clock, because its traffic arrives
 * live. This page cannot: it is a replay, and the same step must always draw the same
 * picture. So the pulse here is a function of the playback tick alone — the distance from
 * the current tick back to the last event recorded at that place — and scrubbing to a tick
 * twice puts every needle and every pulse in the same position both times.
 *
 * Cost: one shared plane, one draw per instrument, no allocation once the page is running.
 */
import * as THREE from "three";

// ------------------------------------------------------------------ the face, in canvas pixels
const SIZE = 256;        // one painted plate, per side
const DC = SIZE / 2;     // the dial's centre on every turning plate, so it spins about itself
const CY = 104;          // where the dial's centre sits on the plate that carries the writing
const U = 100;           // canvas pixels in one dial unit — the outer ring sits at 1.0
const NAME_Y = 226;      // the place's name, and the words for what the dial counts
const CAP_Y = 247;

// the dial's outer ring, in texture coordinates, for the shader
const R_UV = U / SIZE;
// the writing plate is painted with the dial centre high on it, so the two lines of type have
// room underneath. This is how far that plate has to sit back for its dial centre to land on
// the same point as every other plate's.
const NAME_SHIFT = 0.5 - (1 - CY / SIZE);

// the gauge opening: it starts at the lower left, runs over the top, and ends at the lower
// right. These are canvas degrees; the shader is given the same sweep in its own convention.
const SWEEP_ROT = 135;
const SWEEP_SPAN = 270;

const PULSE_S = 1.0;     // one pulse lasts this many seconds of playback
const ATTACK = 0.22;     // the share of it spent rising — 0.22 s of a 1 s pulse
const SETTLE = 0.22;     // how far the needle walks toward a new reading each tick

// ---- the stack. Each plate floats this many plate-widths above the ground the instrument
//      stands on, so a wide instrument stands proportionally taller than a narrow one.
const LIFT = {
  base: 0.000,           // the base plate, lying on the terrain
  scrim: 0.232,          // the dark card the writing is printed on
  rule: 0.082,           // the tick rule, floating over it
  needle: 0.140,         // the needle plane, between the two turning plates
  ring: 0.196,           // the dial ring with the four framing marks
  name: 0.240,           // the place's name, highest of all
} as const;

// ---- the idle turn, in the Halo Forge engine's own terms
const SPIN_DPS = 24;     // the tick rule's turn at the middle rate, degrees of arc per second
const SPIN_SPREAD = 0.55; // how far either side of that rate one place's hash can put it
const DRIFT_MIN = 0.30;  // the dial ring turns back against the rule at this share of its rate
const DRIFT_MAX = 0.58;
const LIVE_SPIN = 0.85;  // how much faster the rule turns at the top of a pulse
const SPIN_EASE = 3.5;   // how quickly the rule takes up that faster rate, and gives it back
const STACK_SPREAD = 0.16; // how far one place's hash can raise or lower its own stack

const D2R = Math.PI / 180;
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const num = (v: unknown, d = 0) => (typeof v === "number" && isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" && v ? v : d);

/**
 * A number between 0 and 1 from a piece of text, the same one every time. This is the Halo
 * Forge engine's own hash, ported: it is what gives each layer of a component its own turn
 * rate there, and here it gives each place its own. Feeding it the place's name means the
 * instrument for one place turns at the same rate on both desks, and two different places
 * never turn in step.
 */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

// ------------------------------------------------------------------ what this file is given
/** the fields of one recorded event that an instrument reads */
export interface StationEvent {
  event_id: string;
  sim_time_s: number;
  type: string;
  arm: string;
  payload?: Record<string, unknown>;
}

export interface StationInput {
  events: StationEvent[];              // the whole log, in recorded order
  armIds: string[];                    // one id per desk
  ticks: number;                       // the playback grid
  rate: number;                        // ticks per second of playback
  tickOf: (e: StationEvent) => number;
  evPlace: Map<string, number>;        // event id → the place it was recorded at
  placeLabel: string[];                // per place, the name the log gave it
  wx: Float32Array;                    // per place, where it stands in the world
  wz: Float32Array;
  gy: Float32Array;                    // per place, the height of the ground under it
  np: number;
  anisotropy: number;                  // what the renderer can give a plate seen edge-on
  bone: readonly [number, number, number];   // a place at rest
  signal: readonly [number, number, number]; // the one thing happening now
  burn: readonly [number, number, number];   // a team spent and unrecoverable
}

/** one instrument's reading, as a verifier sees it */
export interface StationReading {
  arm: string;
  site: string;
  reads: string;
  number: number;
  word: string;
  dial: number;
  pulse: number;
  live: boolean;
}

// ------------------------------------------------------------------ the painters, ported
/** every painter draws in white; only the coverage is kept, and the shader colours it */
const W = (a: number) => `rgba(255,255,255,${clamp(a)})`;

/** a circle, or an arc of one, at one radius */
function ring(c: CanvasRenderingContext2D, r: number, w: number, a: number,
  rot = 0, span = 360) {
  c.lineWidth = Math.max(0.75, w * U);
  c.strokeStyle = W(a);
  c.beginPath();
  c.arc(0, 0, r * U, rot * D2R, (rot + span) * D2R);
  c.stroke();
}

/** a rule of ticks around an arc, every `major` one of them longer */
function ticks(c: CanvasRenderingContext2D, r: number, len: number, majorLen: number,
  w: number, a: number, count: number, major: number, rot: number, span: number) {
  c.strokeStyle = W(a);
  c.lineWidth = Math.max(0.75, w * U);
  const full = Math.abs(span - 360) < 0.5;
  for (let i = 0; i < count; i++) {
    const t = full ? i / count : i / Math.max(1, count - 1);
    const ang = (rot + t * span) * D2R;
    const isMaj = major >= 1 && i % major === 0;
    const r0 = r * U;
    const r1 = r0 - (isMaj ? majorLen : len) * U;   // the rule grows inward
    c.beginPath();
    c.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
    c.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
    c.stroke();
  }
}

/** the four marks that frame an instrument in this language */
function reticle(c: CanvasRenderingContext2D, r: number, len: number, w: number,
  a: number, count: number, rot: number) {
  c.strokeStyle = W(a);
  c.lineWidth = Math.max(0.75, w * U);
  for (let i = 0; i < count; i++) {
    const ang = (rot + (i * 360) / count) * D2R;
    const r0 = (r - len) * U, r1 = r * U;
    c.beginPath();
    c.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
    c.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
    c.stroke();
    const tx = -Math.sin(ang), ty = Math.cos(ang);
    const h = len * 0.42 * U;
    c.beginPath();
    c.moveTo(Math.cos(ang) * r0 - tx * h, Math.sin(ang) * r0 - ty * h);
    c.lineTo(Math.cos(ang) * r0 + tx * h, Math.sin(ang) * r0 + ty * h);
    c.stroke();
  }
}

/**
 * One line of the house label voice: uppercase, letter-spaced, centred. The spacing is drawn
 * letter by letter rather than set as a canvas property, because the property is recent and a
 * face that silently loses its tracking stops being the same design language.
 */
function label(c: CanvasRenderingContext2D, text: string, y: number, px: number,
  track: number, a: number, maxW: number) {
  const chars = Array.from(text);
  if (!chars.length) return;
  let size = px;
  c.font = `700 ${size}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
  let total = chars.reduce((s, ch) => s + c.measureText(ch).width + track, 0) - track;
  if (total > maxW) {
    size = Math.max(9, size * (maxW / total));
    c.font = `700 ${size}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
    total = chars.reduce((s, ch) => s + c.measureText(ch).width + track, 0) - track;
  }
  c.fillStyle = W(a);
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  let x = -total / 2;
  for (const ch of chars) {
    c.fillText(ch, x, y);
    x += c.measureText(ch).width + track;
  }
}

// ------------------------------------------------------------------ reading one place's number
type Kind = "reached" | "verdict" | "reports";
/**
 * What the caption under a place's name promises the dial is counting. A caption is only ever
 * used when the log actually holds that quantity: the two-desk exercise records how many
 * simulated people a desk reached, so its dials say so in those words, and a record that holds
 * no such count never carries the words. The third caption counts lines in the log at that
 * place and says exactly that.
 */
const READS: Record<Kind, string> = {
  reached: "simulated people reached",
  verdict: "claim verdict",
  reports: "moments the log counts here",
};

/**
 * The log's own id for a place, in plain words: `demo-site-north` becomes `NORTH`.
 *
 * A trailing group of digits in an identifier is the minute the first thing there was recorded
 * — `fdma-fire-mobilization-1627` is the 16:27 mobilization — and a bare number printed above
 * a caption reads as a quantity the dial is counting, which it is not. So a trailing run of
 * digits is dropped, and so is a bare file serial such as
 * `20260728163103_20260728162718_VXSE51_0`, which says nothing to a reader.
 */
function plainName(id: string): string {
  let s = String(id ?? "");
  s = s.replace(/^(demo|exercise|synthetic|test)[-_]/i, "");
  s = s.replace(/(^|[-_])site[-_]/i, "$1");
  // a file serial: two long date stamps and a bulletin code, joined by underscores
  if (/^\d{8,}[-_]/.test(s)) s = s.replace(/^[\d_]+/, "").replace(/_\d+$/, "");
  s = s.replace(/[-_:]+/g, " ").trim();
  // the recorded minute, and any further minute, at the end of the name. Four digits are a
  // clock time and six are a clock time with its second; three digits are left alone, because a
  // road number is three digits and is part of the name.
  s = s.replace(/(\s+\d{4}(\d{2})?)+$/, "").trim();
  return (s || "place").toUpperCase();
}

/** one instrument: everything it will ever show, worked out once from the log */
interface Dial {
  place: number;
  kind: Kind;
  name: string;
  raw: Float32Array;      // per tick, the honest number behind the needle
  word: string[];         // per tick, the verdict word, where the dial carries one
  target: Float32Array;   // per tick, where the needle belongs, 0 to 1
  eased: Float32Array;    // per tick, where the needle actually is
  lastEv: Int32Array;     // per tick, the tick of the last event recorded here
  mats: THREE.ShaderMaterial[];   // the five plates' materials, brightened together
  value: THREE.ShaderMaterial;    // the needle plane, the only one that carries a reading
  col: THREE.Vector3;             // one colour object, shared by all five materials
  rule: THREE.Object3D;   // the tick rule, the plate that turns
  ring: THREE.Object3D;   // the dial ring, the plate that turns back against it
  rest: number;           // the rule's turn at rest, degrees per second, signed
  drift: number;          // the ring's turn as a share of the rule's, always the other way
  spin: number;           // the rule's turn right now, easing between rest and live
  angle: number;          // how far the rule has turned, radians
  gain: number;           // the pulse this instrument read at the last playback tick
}

// ------------------------------------------------------------------ the shader
const STATION_V = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

/**
 * A painted plate: the line work and nothing else. `uAmp` is the whole instrument's brightness,
 * which is where the pulse lands, and `uCol` is its colour: white at rest, and the one signal
 * colour only on the instrument the current step is about. A plate that turns does it by
 * turning its own quad, so a turning plate costs no shader work and no repaint.
 */
const PLATE_F = `
  precision highp float;
  uniform sampler2D uFace;
  uniform float uAmp;
  uniform vec3 uCol;
  varying vec2 vUv;
  void main(){
    float a = clamp(texture2D(uFace, vUv).a * 0.92 * uAmp, 0.0, 1.0);
    if (a <= 0.004) discard;
    gl_FragColor = vec4(uCol * a, a);
  }`;

/**
 * The card under the writing. It carries no line work and takes no colour: it paints black at
 * the coverage its own plate was painted with, so the writing above it has a ground to stand on
 * however bright the simulated damage behind the instrument becomes.
 */
const SCRIM_F = `
  precision highp float;
  uniform sampler2D uFace;
  varying vec2 vUv;
  void main(){
    float a = texture2D(uFace, vUv).a;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
  }`;

/**
 * The needle plane. Nothing on it is painted: the needle, the groove and the fill are drawn
 * here from `uValue`, so a dial whose reading changes never costs a repaint. This plate never
 * turns — the reading has to stay where the tick rule says it is.
 */
const NEEDLE_F = `
  precision highp float;
  uniform float uValue;
  uniform float uAmp;
  uniform vec3 uCol;
  varying vec2 vUv;
  const float RADIUS = ${R_UV.toFixed(6)};
  const float HALF = 2.35619449;      // half the gauge sweep, in radians
  const float SPAN = 4.71238898;      // the whole sweep
  void main(){
    vec2 q = (vUv - 0.5) / RADIUS;
    float r = length(q);
    float phi = atan(q.x, q.y);                       // 0 at the top, growing to the right
    float g = clamp((phi + HALF) / SPAN, 0.0, 1.0);   // where this pixel sits on the dial
    float open = 1.0 - smoothstep(HALF - 0.02, HALF + 0.02, abs(phi));
    // the groove the value fills, and the fill itself
    float band = smoothstep(0.640, 0.656, r) * (1.0 - smoothstep(0.762, 0.778, r)) * open;
    float fill = band * (1.0 - smoothstep(0.0, 0.004, g - uValue));
    // the needle: one radial stroke standing at the value
    float arc = abs(g - uValue) * SPAN * max(r, 0.10);
    float reach = smoothstep(0.115, 0.150, r) * (1.0 - smoothstep(0.900, 0.935, r));
    float needle = (1.0 - smoothstep(0.018, 0.044, arc)) * reach * open;
    float hub = (1.0 - smoothstep(0.050, 0.072, r)) * 0.32;
    float ink = band * 0.16 + fill * 0.55 + needle * 0.95 + hub;
    float a = clamp(ink * uAmp, 0.0, 1.0);
    if (a <= 0.004) discard;
    gl_FragColor = vec4(uCol * a, a);
  }`;

// ------------------------------------------------------------------ the set
export interface StationSet {
  /** how many instruments stand on each desk's ground */
  count: number;
  /** put this desk's instruments into a scene, or into a group inside one */
  addTo(parent: THREE.Object3D, arm: number): void;
  /** place every needle and every pulse for one desk at one playback tick */
  update(arm: number, tt: number, liveSite: number, liveFade: number, spent: boolean): void;
  /**
   * Turn every instrument in the ground plane so its writing faces the camera. The instruments
   * still lie flat on the landscape; they only spin about the vertical, the way a name
   * printed on a map turns to stay the right way up when the map is turned.
   */
  faceYaw(yaw: number): void;
  /**
   * Carry the idle turn forward to this many seconds of elapsed real time. The tick rule and
   * the dial ring turn; nothing a verifier reads moves. Call it once a frame, whether the run
   * is playing or held: an instrument that stops turning when the run is paused looks broken.
   */
  idleSpin(seconds: number): void;
  /** what every instrument is showing right now */
  state(): StationReading[];
  /**
   * Where every instrument's two turning plates stand right now, in degrees, and the rate each
   * one turns at rest. This is deliberately kept out of `state()`: the turn runs on elapsed
   * real time, so it is the one thing about an instrument that two runs of the same tick are
   * allowed to disagree on. A verifier reads it to confirm the plates move and that no two
   * places move in step.
   */
  turns(): { arm: string; site: string; rule: number; ring: number; rest: number }[];
}

export function buildStations(input: StationInput): StationSet {
  const { events, armIds, ticks: TICKS, evPlace, np } = input;
  const nArms = armIds.length;
  const PULSE = Math.max(1, input.rate * PULSE_S);

  // ---- which places get an instrument. A place earns one when the log records something
  //      there beyond the world opening: a report, a verdict, a team sent, a team's finding.
  //      The incident's own coordinate is not a place where people are waiting, so no
  //      instrument stands on it.
  const has = new Uint8Array(np);
  for (const e of events) {
    const p = evPlace.get(e.event_id);
    if (p === undefined || e.type === "WORLD_INITIALIZED") continue;
    has[p] = 1;
  }
  const sites: number[] = [];
  for (let p = 0; p < np; p++) if (has[p]) sites.push(p);
  const NS = sites.length;

  /**
   * Whether this record counts the people a desk reached at all. The two-desk exercise writes
   * that count on every outcome it records; the full incident is a stream of recorded moments
   * and writes no such count anywhere in its 414 lines. A dial may only carry the words
   * "simulated people reached" when the number behind them was read out of the log, so where
   * the field is absent every dial counts the moments recorded at its own place instead.
   */
  const reachRecorded = events.some(
    (e) => typeof e.payload?.exercise_people_reached === "number");

  // ---- the verdict words this log uses, in the order it first uses them. The order is the
  //      log's own; nothing here ranks one verdict above another. Position zero is kept for
  //      a claim that has no verdict written on it yet.
  const words: string[] = [""];
  for (const e of events) {
    if (e.type !== "CLAIM_STATE_CHANGED") continue;
    const v = str(e.payload?.verdict, str(e.payload?.comparison_verdict));
    if (v && !words.includes(v)) words.push(v);
  }

  // ---- the highest count of people any desk reaches anywhere, so both desks' dials share
  //      one scale and a fuller needle always means more people
  let reachMax = 1;
  {
    const run = new Float32Array(nArms * np);
    for (const e of events) {
      if (e.type !== "OUTCOME_OBSERVED") continue;
      const p = evPlace.get(e.event_id);
      if (p === undefined) continue;
      for (let k = 0; k < nArms; k++) {
        if (e.arm !== armIds[k] && e.arm !== "SHARED") continue;
        run[k * np + p] += num(e.payload?.exercise_people_reached);
        reachMax = Math.max(reachMax, run[k * np + p]);
      }
    }
  }

  // ---- one instrument per desk per place, with every tick of its life worked out up front
  const dials: Dial[][] = [];
  const geo = new THREE.PlaneGeometry(1, 1);
  const stacks: THREE.Group[][] = [];

  // The line work is the same on every instrument except the two lines of type, so the plates
  // that carry no type are painted once and shared. Nothing about a shared plate changes when
  // an instrument lights up: the brightness and the colour live on the material, not the paint.
  const painted = new Map<string, THREE.CanvasTexture>();
  const plateOf = (key: string, paint: () => THREE.CanvasTexture) => {
    let t = painted.get(key);
    if (!t) { t = paint(); painted.set(key, t); }
    return t;
  };

  // The plate is sized so two neighbours never touch, and never grows past a size that would
  // start competing with the landscape for the eye. Over the real terrain the sites can be a
  // kilometre apart on a world that is sixty kilometres deep, so the floor is small: an
  // instrument is meant to be flown down to, not to blanket the ground it stands on.
  let near = Infinity;
  for (let i = 0; i < NS; i++) for (let j = i + 1; j < NS; j++) {
    const a = sites[i], b = sites[j];
    const dx = input.wx[a] - input.wx[b], dz = input.wz[a] - input.wz[b];
    near = Math.min(near, Math.hypot(dx, dz));
  }
  const PLATE = clamp(near === Infinity ? 0.90 : near * 0.92, 0.045, 0.90);

  for (let k = 0; k < nArms; k++) {
    const row: Dial[] = [];
    const grow: THREE.Group[] = [];
    for (let s = 0; s < NS; s++) {
      const p = sites[s];
      const mine = events.filter((e) => {
        if (evPlace.get(e.event_id) !== p) return false;
        return e.arm === armIds[k] || e.arm === "SHARED";
      });
      const kind: Kind =
        reachRecorded && mine.some((e) => e.type === "OUTCOME_OBSERVED") ? "reached"
          : mine.some((e) => e.type === "CLAIM_STATE_CHANGED") ? "verdict" : "reports";

      const raw = new Float32Array(TICKS + 1);
      const word: string[] = new Array(TICKS + 1).fill("");
      const target = new Float32Array(TICKS + 1);
      const eased = new Float32Array(TICKS + 1);
      const lastEv = new Int32Array(TICKS + 1).fill(-1);

      // what the log says, tick by tick, carried forward between the events that change it
      const at: StationEvent[][] = Array.from({ length: TICKS + 1 }, () => []);
      for (const e of mine) at[clamp(input.tickOf(e), 0, TICKS) | 0].push(e);
      let value = 0, verdict = "", seen = 0, last = -1;
      const total = Math.max(1, mine.length);
      for (let t = 0; t <= TICKS; t++) {
        for (const e of at[t]) {
          seen++;
          if (e.type === "OUTCOME_OBSERVED") value += num(e.payload?.exercise_people_reached);
          if (e.type === "CLAIM_STATE_CHANGED") {
            verdict = str(e.payload?.verdict, str(e.payload?.comparison_verdict, verdict));
          }
          last = t;
        }
        lastEv[t] = last;
        if (kind === "reached") { raw[t] = value; target[t] = clamp(value / reachMax); }
        else if (kind === "verdict") {
          raw[t] = Math.max(0, words.indexOf(verdict));
          word[t] = verdict;
          target[t] = words.length > 1 ? raw[t] / (words.length - 1) : 0;
        } else { raw[t] = seen; target[t] = clamp(seen / total); }
      }
      // the needle walks to a new reading instead of jumping to it. The walk is worked out
      // here, once, so the needle at any tick is the same number every time that tick is drawn.
      for (let t = 0; t <= TICKS; t++) {
        eased[t] = t === 0 ? target[0] : eased[t - 1] + (target[t] - eased[t - 1]) * SETTLE;
      }

      const name = plainName(input.placeLabel[p]);
      const col = new THREE.Vector3(...input.bone);
      const mats: THREE.ShaderMaterial[] = [];

      // this place's own hash decides how fast its rule turns, which way, how far the ring
      // turns back, and how tall the stack stands
      const seed = input.placeLabel[p];
      const hRate = hash01(`${seed}·rate`);
      const hDrift = hash01(`${seed}·drift`);
      const stackScale = 1 + (hash01(`${seed}·stack`) * 2 - 1) * STACK_SPREAD;
      const rest = SPIN_DPS * (hRate < 0.5 ? -1 : 1)
        * (1 + (Math.abs(hRate - 0.5) * 4 - 1) * SPIN_SPREAD);
      const drift = -(DRIFT_MIN + hDrift * (DRIFT_MAX - DRIFT_MIN));

      // the stack. The group lies flat on the terrain and turns to face the camera; every
      // plate inside it floats straight up from that ground, so the instrument keeps its
      // horizontal lie and gains its height.
      const stack = new THREE.Group();
      stack.rotation.x = -Math.PI / 2;
      stack.position.set(input.wx[p], input.gy[p] + 0.016, input.wz[p]);

      /** the dark card under the writing: the one plate that covers rather than adds */
      const card = (face: THREE.CanvasTexture, lift: number, back: number) => {
        const mat = new THREE.ShaderMaterial({
          uniforms: { uFace: { value: face } },
          vertexShader: STATION_V, fragmentShader: SCRIM_F,
          transparent: true, blending: THREE.NormalBlending,
          depthWrite: false, depthTest: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(PLATE, PLATE, 1);
        mesh.position.set(0, back * PLATE, lift * PLATE * stackScale);
        mesh.renderOrder = 2;
        mesh.frustumCulled = false;
        stack.add(mesh);
        return mesh;
      };

      /** one plate of the stack, at its own height above the ground */
      const plate = (face: THREE.CanvasTexture | null, lift: number, back = 0) => {
        const mat = new THREE.ShaderMaterial({
          uniforms: face
            ? { uFace: { value: face }, uAmp: { value: 0.42 }, uCol: { value: col } }
            : { uValue: { value: eased[0] }, uAmp: { value: 0.42 }, uCol: { value: col } },
          vertexShader: STATION_V, fragmentShader: face ? PLATE_F : NEEDLE_F,
          transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false, depthTest: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(PLATE, PLATE, 1);
        mesh.position.set(0, back * PLATE, lift * PLATE * stackScale);
        mesh.renderOrder = 1;                 // over the ground, under the places themselves
        mesh.frustumCulled = false;
        stack.add(mesh);
        mats.push(mat);
        return mesh;
      };

      const bar = words.length;
      plate(plateOf("base", () => paintBase(input.anisotropy)), LIFT.base);
      const rule = plate(
        plateOf(`rule:${kind}:${bar}`, () => paintRule(kind, bar, input.anisotropy)),
        LIFT.rule,
      );
      const needle = plate(null, LIFT.needle);
      const ring = plate(plateOf("ring", () => paintRing(input.anisotropy)), LIFT.ring);
      card(plateOf("scrim", () => paintScrim(input.anisotropy)), LIFT.scrim, NAME_SHIFT);
      const nameMesh = plate(
        plateOf(`name:${name}:${kind}`, () => paintName(name, READS[kind], input.anisotropy)),
        LIFT.name, NAME_SHIFT,
      );
      // the writing goes over every other plate on the map, its own card included
      nameMesh.renderOrder = 3;

      row.push({
        place: p, kind, name, raw, word, target, eased, lastEv,
        mats, value: needle.material as THREE.ShaderMaterial, col,
        rule, ring, rest, drift, spin: rest, angle: 0, gain: 0,
      });
      grow.push(stack);
    }
    dials.push(row);
    stacks.push(grow);
  }

  // ---- what the verifier reads. The objects are made once and their fields are written in
  //      place, so reading a frame costs nothing and drawing one allocates nothing.
  const readings: StationReading[] = [];
  for (let k = 0; k < nArms; k++) for (let s = 0; s < NS; s++) {
    readings.push({
      arm: armIds[k], site: dials[k][s].name, reads: READS[dials[k][s].kind],
      number: 0, word: "", dial: 0, pulse: 0, live: false,
    });
  }

  // the idle turn is carried forward from the last frame's elapsed time, so a frame that
  // arrives late turns exactly as far as the time that passed and no further
  let lastIdle = -1;

  return {
    count: NS,
    addTo(parent, arm) { for (const g of stacks[arm]) parent.add(g); },

    faceYaw(yaw) {
      for (const row of stacks) for (const g of row) g.rotation.z = yaw;
    },

    idleSpin(seconds) {
      const dt = lastIdle < 0 ? 0 : clamp(seconds - lastIdle, 0, 0.1);
      lastIdle = seconds;
      if (dt <= 0) return;
      for (const row of dials) for (const d of row) {
        // the rule leans into a faster turn while this place's pulse is live, and gives the
        // speed back afterwards. The pulse itself is read off the playback tick, so a paused
        // run holds a steady speed rather than freezing.
        const want = d.rest * (1 + LIVE_SPIN * d.gain);
        d.spin = want + (d.spin - want) * Math.exp(-SPIN_EASE * dt);
        d.angle += d.spin * dt * D2R;
        d.rule.rotation.z = d.angle;
        d.ring.rotation.z = d.angle * d.drift;
      }
    },

    update(arm, tt, liveSite, liveFade, spent) {
      const ti = clamp(Math.floor(tt), 0, TICKS) | 0;
      const tj = Math.min(TICKS, ti + 1);
      const f = clamp(tt - ti);
      const hot = spent ? input.burn : input.signal;
      for (let s = 0; s < dials[arm].length; s++) {
        const d = dials[arm][s];
        const v = d.eased[ti] + (d.eased[tj] - d.eased[ti]) * f;
        // the pulse, driven by the distance from this tick back to the last event here
        let gain = 0;
        if (d.lastEv[ti] >= 0) {
          const u = (tt - d.lastEv[ti]) / PULSE;
          if (u >= 0 && u < 1) {
            gain = u < ATTACK ? u / ATTACK : 1 - Math.pow((u - ATTACK) / (1 - ATTACK), 2);
          }
        }
        const live = d.place === liveSite;
        const mix = live ? clamp(liveFade) : 0;
        d.col.set(
          input.bone[0] + (hot[0] - input.bone[0]) * mix,
          input.bone[1] + (hot[1] - input.bone[1]) * mix,
          input.bone[2] + (hot[2] - input.bone[2]) * mix,
        );
        d.value.uniforms.uValue.value = v;
        const amp = 0.46 + 0.60 * gain + 0.24 * mix;
        for (const m of d.mats) m.uniforms.uAmp.value = amp;
        d.gain = gain;
        const r = readings[arm * dials[arm].length + s];
        r.number = d.raw[ti];
        r.word = d.word[ti];
        r.dial = v;
        r.pulse = gain;
        r.live = live && mix > 0;
      }
    },

    state() {
      return readings.map((r) => ({
        ...r, dial: +r.dial.toFixed(4), pulse: +r.pulse.toFixed(4),
      }));
    },

    turns() {
      const out: { arm: string; site: string; rule: number; ring: number; rest: number }[] = [];
      for (let k = 0; k < nArms; k++) for (const d of dials[k]) {
        out.push({
          arm: armIds[k], site: d.name,
          rule: +(((d.rule.rotation.z / D2R) % 360 + 360) % 360).toFixed(3),
          ring: +(((d.ring.rotation.z / D2R) % 360 + 360) % 360).toFixed(3),
          rest: +d.rest.toFixed(3),
        });
      }
      return out;
    },
  };
}

// ------------------------------------------------------------------ the painted plates
/** a fresh plate to paint on, with the dial's centre already under the brush */
function sheet(centred: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const c = canvas.getContext("2d")!;
  c.lineCap = "butt";
  if (centred) c.translate(DC, DC);
  return { canvas, c };
}

/** the painted plate, ready for the shader: only the coverage is kept */
function finish(canvas: HTMLCanvasElement, anisotropy: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.max(1, anisotropy);
  tex.needsUpdate = true;
  return tex;
}

/**
 * The base plate: the rim, and a wash low enough that the plate never becomes a lit disc.
 * This is the plate that lies on the terrain, and it holds still — a rim is a circle, and a
 * turning circle shows nothing.
 */
function paintBase(anisotropy: number): THREE.CanvasTexture {
  const { canvas, c } = sheet(true);
  const wash = c.createRadialGradient(0, 0, 0.86 * U, 0, 0, 1.02 * U);
  wash.addColorStop(0, W(0.024));
  wash.addColorStop(1, W(0));
  c.fillStyle = wash;
  c.beginPath();
  c.arc(0, 0, 1.02 * U, 0, Math.PI * 2);
  c.fill();
  ring(c, 1.0, 0.012, 0.85);                              // the rim
  return finish(canvas, anisotropy);
}

/**
 * The tick rule, the plate that turns. A dial that counts people gets a rule of ticks; a dial
 * that carries a verdict gets one tick per position it can stand in, so a needle between two of
 * them would read as a fault rather than as a number.
 *
 * Every rule also carries one long index arm and a solid block beside it, at one angle only.
 * Without those the rule is the same picture at every angle a place can turn to, and a plate
 * that looks identical however far it has turned reads as a plate that never turns. The arm and
 * the block are what a viewer sitting back from the map actually sees going round.
 */
function paintRule(kind: Kind, positions: number, anisotropy: number): THREE.CanvasTexture {
  const { canvas, c } = sheet(true);
  if (kind === "verdict") {
    const n = Math.max(2, positions);
    ticks(c, 0.98, 0.12, 0.20, 0.018, 0.92, n, 1, SWEEP_ROT, SWEEP_SPAN);
  } else {
    // fewer, heavier strokes than a watch face: at map distance a fine rule turns to a grey
    // band, and a grey band turning looks like a grey band standing still
    ticks(c, 0.98, 0.085, 0.170, 0.016, 0.88, 12, 3, SWEEP_ROT, SWEEP_SPAN);
  }
  // the index arm: one stroke from the hub out past the rule, at the sweep's own start
  const ang = SWEEP_ROT * D2R;
  c.strokeStyle = W(0.95);
  c.lineWidth = 0.030 * U;
  c.beginPath();
  c.moveTo(Math.cos(ang) * 0.12 * U, Math.sin(ang) * 0.12 * U);
  c.lineTo(Math.cos(ang) * 1.12 * U, Math.sin(ang) * 1.12 * U);
  c.stroke();
  // the block beside it, so the arm has a heavy side and a light side
  const bAng = (SWEEP_ROT + 24) * D2R;
  c.fillStyle = W(0.82);
  c.beginPath();
  c.arc(Math.cos(bAng) * 0.92 * U, Math.sin(bAng) * 0.92 * U, 0.085 * U, 0, Math.PI * 2);
  c.fill();
  return finish(canvas, anisotropy);
}

/**
 * The dial ring, the plate that turns back against the rule: the groove the needle runs in, the
 * framing marks, and the hub. Three of the four framing marks are the plain mark; the fourth is
 * doubled and carries a bar across it, so the ring has one corner a viewer can follow round.
 */
function paintRing(anisotropy: number): THREE.CanvasTexture {
  const { canvas, c } = sheet(true);
  ring(c, 0.80, 0.006, 0.34);                             // the groove the needle runs in
  ring(c, 0.60, 0.006, 0.34);
  reticle(c, 1.14, 0.16, 0.016, 0.92, 4, 45);             // the four framing marks
  // the one corner that is not like the other three
  const ang = 45 * D2R;
  c.strokeStyle = W(0.95);
  c.lineWidth = 0.026 * U;
  c.beginPath();
  c.arc(0, 0, 1.14 * U, ang - 0.30, ang + 0.30);
  c.stroke();
  c.lineWidth = 0.020 * U;
  c.beginPath();
  c.moveTo(Math.cos(ang) * 0.86 * U, Math.sin(ang) * 0.86 * U);
  c.lineTo(Math.cos(ang) * 1.30 * U, Math.sin(ang) * 1.30 * U);
  c.stroke();
  ring(c, 0.055, 0.010, 0.70);                            // the hub the needle turns on
  return finish(canvas, anisotropy);
}

/**
 * The dark card the writing stands on. The simulated damage is drawn additively and stacks up
 * to a white core at the worst places, and white letters over a white core are no letters at
 * all. This plate is the only one on an instrument that is not additive: it lays a soft black
 * card down first, so a place keeps its name whatever is burning behind it.
 */
function paintScrim(anisotropy: number): THREE.CanvasTexture {
  const { canvas, c } = sheet(false);
  const x0 = 10, x1 = SIZE - 10, y0 = NAME_Y - 26, y1 = CAP_Y + 10;
  const wash = c.createLinearGradient(0, y0, 0, y1);
  wash.addColorStop(0, "rgba(0,0,0,0)");
  wash.addColorStop(0.22, "rgba(0,0,0,0.86)");
  wash.addColorStop(0.86, "rgba(0,0,0,0.86)");
  wash.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = wash;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
  return finish(canvas, anisotropy);
}

/** the top plate: the place's name, and the words for what its dial counts */
function paintName(name: string, caption: string, anisotropy: number): THREE.CanvasTexture {
  const { canvas, c } = sheet(false);
  c.translate(SIZE / 2, 0);
  label(c, name, NAME_Y, 25, 2.8, 1.0, SIZE - 22);
  label(c, caption.toUpperCase(), CAP_Y, 15, 2.0, 0.72, SIZE - 22);
  return finish(canvas, anisotropy);
}
