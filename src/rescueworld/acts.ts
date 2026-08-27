/**
 * RESCUE WORLD — the acts of the seventy-two hours.
 *
 * The sealed Kumamoto full-incident run is one flat stream of 414 events covering three days.
 * A person cannot watch a flat stream. The run's own manifest already cuts those three days
 * into four acts — hour one, the first night, day two, and the turn — and every event carries
 * a story tag naming the act it belongs to. This module reads both and hands the viewer a
 * running order: four acts, each act cut into beats, each beat carrying one place on the map
 * for the camera to look at.
 *
 * A beat is one readable moment of an act. The cut follows three rules:
 *
 *   1. A decision moment is always its own beat. There are eleven of them and each one is the
 *      point of the whole piece, so none is ever folded in with anything else.
 *   2. A milestone is its own beat. A milestone is a single recorded thing that happened, such
 *      as "Five local and prefectural headquarters stand up in the earthquake minute". Each
 *      one carries its own plain-English headline, and that headline becomes the beat's label.
 *   3. Aftershocks and road closures arrive in a constant drizzle — three hundred aftershocks
 *      and twenty-three closures — so they are batched by the clock hour they happened in.
 *      One hour of shaking is one beat, however many tremors it held.
 *
 * A camera anchor is the single longitude and latitude a beat points the camera at. It is the
 * mean of every map position the beat's events carry. Two kinds of position are left out of
 * that mean:
 *
 *   - The eight source ingests that carry no map position at all. Four of them load a data
 *     file and four are early agency bulletins published before the hypocentre was known.
 *     They are events about the record, not about a place, so they contribute no anchor. The
 *     cross-agent audit of this run named these eight; this module counts them so the count
 *     can be checked rather than assumed.
 *   - Any position outside the terrain the viewer actually delivers. The caller passes the
 *     terrain bounds; a position outside them would aim the camera off the edge of the ground.
 *
 * Where the record names its own display position for a shape — a road closure is a line
 * hundreds of points long and the record carries the one point it wants drawn — that point is
 * used instead of the line's vertices.
 *
 * Nothing here is invented. Every label, clock, magnitude and coordinate is copied out of the
 * sealed run. The module holds no clock and no random source: the same run always yields the
 * same acts, the same beats and the same anchors, and no three.js object is built here.
 */

// ---------------------------------------------------------------- what the record looks like

/** the story tag every event in the sealed run carries */
import * as GLOSS from "./gloss";

export interface StoryTag {
  act_id?: string;
  act_label?: string;
  camera?: string;
  hold_seconds?: number;
  real_clock?: string;
  round_id?: string;
  round_label?: string;
  story_priority?: string;
  time_precision?: string;
}

/** one act as the run's scenario manifest declares it */
export interface ScenarioAct {
  act_id: string;
  label?: string;
  starts_at?: string;
  ends_at?: string;
  story?: string;
}

/** the fields of the scenario manifest this module reads */
export interface ReplayScenario {
  scenario_id?: string;
  title?: string;
  acts?: ScenarioAct[];
  incident?: {
    occurred_at?: string;
    magnitude?: number;
    maximum_intensity?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface ReplayGeometry {
  type?: string;
  coordinates?: unknown;
}

/** the fields of one sealed event this module reads */
export interface ReplayEvent {
  sequence: number;
  event_id?: string;
  type?: string;
  sim_time_s?: number;
  geometry?: ReplayGeometry | null;
  payload?: {
    story?: StoryTag;
    geometry?: ReplayGeometry | null;
    display_centroid?: ReplayGeometry | null;
    earthquake?: {
      event_id?: string;
      magnitude?: number | null;
      maximum_intensity?: string | null;
      origin_time?: string;
      area_name?: string;
      area_name_english?: string;
    };
    incident?: {
      occurred_at?: string;
      magnitude?: number;
      maximum_intensity?: string;
      latitude?: number;
      longitude?: number;
    };
    milestone_id?: string;
    headline?: string;
    detail?: string;
    restriction_id?: string;
    report_id?: string;
    serial?: string;
    magnitude?: string | null;
    max_intensity?: string | null;
    hypocenter_coordinate?: string | null;
    published_at_exact?: string;
    report_datetime?: string;
    artifact_path?: string;
    decision_slot?: {
      decision_slot_id?: string;
      title?: string;
      decider?: string;
      task?: string;
      cutoff_at?: string;
      reconstruction_slot_number?: number;
    };
  } | null;
}

// ---------------------------------------------------------------- what this module hands back

/** the ground rectangle the viewer delivers, in degrees */
export interface TerrainBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** the one place on the map a beat or an act points the camera at */
export interface CameraAnchor {
  longitude: number;
  latitude: number;
}

/**
 * What a beat is made of. `aftershocks` and `roads` are batched by clock hour; everything else
 * is one event per beat.
 */
export type BeatKind =
  | "opening"
  | "sources"
  | "bulletin"
  | "decision"
  | "milestone"
  | "roads"
  | "aftershocks"
  | "other";

/** how many map positions a beat or an act could and could not use */
export interface AnchorTally {
  /** positions inside the terrain bounds, which is what the anchor is the mean of */
  used: number;
  /** positions the terrain bounds put outside the delivered ground */
  outside: number;
  /** events that carry no map position at all — the eight metadata-only source ingests */
  metadataOnly: number;
}

/** one readable moment of an act */
export interface Beat {
  beatId: string;
  kind: BeatKind;
  /** plain English, taken from the record: a headline, a decision title, or a count */
  label: string;
  actId: string;
  /** the sealed sequence numbers this beat holds, in order */
  sequences: number[];
  firstSequence: number;
  lastSequence: number;
  eventCount: number;
  startSimSeconds: number;
  endSimSeconds: number;
  /** the record's own wall clock for the first and last event, Japan time */
  startClock: string;
  endClock: string;
  /** the clock hour this beat sits in, as the record writes it, e.g. 2026-07-29T01 */
  hourKey: string;
  /** the camera word the record puts on the first event, e.g. SITE, COMMAND, DECISION_SPLIT */
  camera: string;
  /** the longest hold the record asks for inside this beat, in seconds */
  holdSeconds: number;
  roundId: string;
  roundLabel: string;
  /** where the camera looks, or null when the beat carries no usable map position */
  anchor: CameraAnchor | null;
  /** the box around every usable position, so the camera knows how far back to sit */
  frame: TerrainBounds | null;
  anchors: AnchorTally;
}

/** one act of the run: a window of the stream, cut into beats */
export interface Act {
  actId: string;
  label: string;
  story: string;
  /** the clock window the scenario manifest declares for this act */
  declaredStartsAt: string;
  declaredEndsAt: string;
  /** the window the act's events actually occupy */
  window: {
    firstSequence: number;
    lastSequence: number;
    eventCount: number;
    startSimSeconds: number;
    endSimSeconds: number;
    startClock: string;
    endClock: string;
  };
  beats: Beat[];
  anchor: CameraAnchor | null;
  frame: TerrainBounds | null;
  anchors: AnchorTally;
}

/** one agency revision of the main shock, as the record ingested it */
export interface OpeningBulletin {
  sequence: number;
  reportId: string;
  serial: string;
  clock: string;
  publishedAt: string;
  /** the record writes bulletin magnitude as text, and leaves it empty until it is known */
  magnitude: string | null;
  maximumIntensity: string | null;
  hypocenterCoordinate: string | null;
}

/** one tremor on the opening timeline strip */
export interface OpeningAftershock {
  sequence: number;
  eventId: string;
  simTimeSeconds: number;
  clock: string;
  magnitude: number | null;
  maximumIntensity: string | null;
  areaName: string;
  areaNameEnglish: string;
  longitude: number | null;
  latitude: number | null;
}

/**
 * The kickoff. The main shock goes up in the centre of the screen — its magnitude, the
 * agency's intensity reading and the clock it happened on — and the tremors that followed run
 * underneath it as a timeline.
 *
 * The timeline's window is not a chosen number of hours. It ends when the agency stopped
 * revising the main shock: the last official bulletin about it in the record. Every aftershock
 * up to that moment is on the strip.
 */
export interface OpeningBeat {
  sequence: number;
  eventId: string;
  /** magnitude 7.1 in this run, read from the record, never assumed */
  magnitude: number | null;
  /** the agency's own intensity reading, e.g. JMA 7 */
  maximumIntensity: string | null;
  /** the clock the shock started on, to the millisecond the record keeps */
  originClock: string;
  longitude: number | null;
  latitude: number | null;
  actId: string;
  actLabel: string;
  roundId: string;
  roundLabel: string;
  camera: string;
  holdSeconds: number;
  /** every agency revision of the main shock, in the order the record ingested them */
  bulletins: OpeningBulletin[];
  /** the last revision's moment: where the opening timeline stops */
  windowEndsAtSimSeconds: number;
  windowEndsAtClock: string;
  aftershocks: OpeningAftershock[];
}

// ---------------------------------------------------------------- reading positions off events

const round6 = (value: number): number => Number(value.toFixed(6));

const isPosition = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length >= 2
  && typeof value[0] === "number" && typeof value[1] === "number";

/** a position can sit at any depth: a point, a line's positions, a polygon's rings */
function collectPositions(value: unknown, into: number[][]): void {
  if (!Array.isArray(value)) return;
  if (isPosition(value)) {
    into.push([value[0], value[1]]);
    return;
  }
  for (const child of value) collectPositions(child, into);
}

/**
 * Every map position one event offers. When the record names its own display position — the
 * single point it wants drawn for a road line — that point stands for the whole shape.
 */
function eventPositions(event: ReplayEvent): number[][] {
  const centroid = event.payload?.display_centroid?.coordinates;
  if (isPosition(centroid)) return [[centroid[0], centroid[1]]];
  const found: number[][] = [];
  collectPositions(event.geometry?.coordinates, found);
  if (found.length === 0) collectPositions(event.payload?.geometry?.coordinates, found);
  return found;
}

/** running totals for one beat's or one act's anchor */
interface AnchorSum {
  used: number;
  outside: number;
  metadataOnly: number;
  sumLongitude: number;
  sumLatitude: number;
  west: number;
  south: number;
  east: number;
  north: number;
}

const newAnchorSum = (): AnchorSum => ({
  used: 0,
  outside: 0,
  metadataOnly: 0,
  sumLongitude: 0,
  sumLatitude: 0,
  west: Infinity,
  south: Infinity,
  east: -Infinity,
  north: -Infinity,
});

function addEventToAnchorSum(
  sum: AnchorSum,
  event: ReplayEvent,
  bounds: TerrainBounds | undefined,
): void {
  const positions = eventPositions(event);
  if (positions.length === 0) {
    sum.metadataOnly++;
    return;
  }
  for (const [longitude, latitude] of positions) {
    if (bounds && (longitude < bounds.west || longitude > bounds.east
      || latitude < bounds.south || latitude > bounds.north)) {
      sum.outside++;
      continue;
    }
    sum.used++;
    sum.sumLongitude += longitude;
    sum.sumLatitude += latitude;
    if (longitude < sum.west) sum.west = longitude;
    if (longitude > sum.east) sum.east = longitude;
    if (latitude < sum.south) sum.south = latitude;
    if (latitude > sum.north) sum.north = latitude;
  }
}

const anchorOf = (sum: AnchorSum): CameraAnchor | null =>
  sum.used === 0 ? null : {
    longitude: round6(sum.sumLongitude / sum.used),
    latitude: round6(sum.sumLatitude / sum.used),
  };

const frameOf = (sum: AnchorSum): TerrainBounds | null =>
  sum.used === 0 ? null : {
    west: round6(sum.west),
    south: round6(sum.south),
    east: round6(sum.east),
    north: round6(sum.north),
  };

const tallyOf = (sum: AnchorSum): AnchorTally => ({
  used: sum.used,
  outside: sum.outside,
  metadataOnly: sum.metadataOnly,
});

// ---------------------------------------------------------------- cutting the stream into beats

/** the clock hour an event sits in, read straight off the record's own wall clock */
const hourKeyOf = (event: ReplayEvent): string =>
  String(event.payload?.story?.real_clock ?? "").slice(0, 13);

function beatKindOf(event: ReplayEvent): BeatKind {
  const payload = event.payload;
  if (event.type === "WORLD_INITIALIZED") return "opening";
  if (event.type === "DECISION_PROPOSED") return "decision";
  if (event.type === "SOURCE_INGESTED") return payload?.report_id ? "bulletin" : "sources";
  if (payload?.earthquake) return "aftershocks";
  if (payload?.milestone_id) return "milestone";
  if (payload?.restriction_id) return "roads";
  return "other";
}

/**
 * Which beat an event joins. A decision, a milestone, a bulletin and the opening each get a
 * beat of their own, keyed by their sequence number. Aftershocks and road closures join the
 * beat for their clock hour. The source files that load at the start share one beat.
 */
function beatKeyOf(event: ReplayEvent, kind: BeatKind): string {
  if (kind === "aftershocks" || kind === "roads") return `${kind}:${hourKeyOf(event)}`;
  if (kind === "sources") return "sources";
  return `${kind}:${event.sequence}`;
}

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/** the plain-English name a finished beat shows */
function beatLabel(kind: BeatKind, first: ReplayEvent, count: number): string {
  const story = first.payload?.story;
  switch (kind) {
    case "opening":
      return story?.round_label
        ? GLOSS.plainRound(String(story.round_id ?? ""), story.round_label)
        : `A magnitude ${first.payload?.incident?.magnitude ?? ""} main shock struck`.trim();
    case "decision":
      return first.payload?.decision_slot?.title
        ? GLOSS.plainSlotTitle(
          String(first.payload?.decision_slot?.decision_slot_id ?? ""),
          first.payload.decision_slot.title)
        : first.payload?.decision_slot?.decision_slot_id ?? "A decision was recorded here";
    case "milestone":
      return first.payload?.headline
        ? GLOSS.plainHeadline(String(first.payload?.milestone_id ?? ""), first.payload.headline)
        : first.payload?.milestone_id ?? "An event was recorded here";
    case "bulletin":
      return `An official update went out at ${String(story?.real_clock ?? "").slice(11, 16)}`;
    case "roads":
      return plural(count, "road closure", "road closures");
    case "aftershocks":
      return plural(count, "aftershock", "aftershocks");
    case "sources":
      return plural(count, "source file loads", "source files load");
    default:
      return story?.round_label
        ? GLOSS.plainRound(String(story.round_id ?? ""), story.round_label)
        : String(first.type ?? "An event");
  }
}

/** a beat while it is still being filled */
interface BeatDraft {
  beatId: string;
  kind: BeatKind;
  first: ReplayEvent;
  events: ReplayEvent[];
  sum: AnchorSum;
}

function finishBeat(draft: BeatDraft, actId: string): Beat {
  const { first, events } = draft;
  const last = events[events.length - 1];
  const story = first.payload?.story ?? {};
  let holdSeconds = 0;
  for (const event of events) {
    const hold = event.payload?.story?.hold_seconds ?? 0;
    if (hold > holdSeconds) holdSeconds = hold;
  }
  return {
    beatId: draft.beatId,
    kind: draft.kind,
    label: beatLabel(draft.kind, first, events.length),
    actId,
    sequences: events.map((event) => event.sequence),
    firstSequence: first.sequence,
    lastSequence: last.sequence,
    eventCount: events.length,
    startSimSeconds: first.sim_time_s ?? 0,
    endSimSeconds: last.sim_time_s ?? 0,
    startClock: String(story.real_clock ?? ""),
    endClock: String(last.payload?.story?.real_clock ?? ""),
    hourKey: hourKeyOf(first),
    camera: String(story.camera ?? ""),
    holdSeconds,
    roundId: String(story.round_id ?? ""),
    roundLabel: GLOSS.plainRound(String(story.round_id ?? ""), String(story.round_label ?? "")),
    anchor: anchorOf(draft.sum),
    frame: frameOf(draft.sum),
    anchors: tallyOf(draft.sum),
  };
}

// ---------------------------------------------------------------- placing events into acts

/**
 * Which act an event belongs to. The event's own story tag names it, and that is the record's
 * answer, so it wins. An event whose tag names no declared act is placed by its wall clock
 * instead, inside the act window the manifest declares. An event that neither rule can place
 * would be silently lost from the running order, so it is refused loudly instead.
 */
function actIdFor(event: ReplayEvent, declared: Map<string, ScenarioAct>): string {
  const tagged = event.payload?.story?.act_id;
  if (tagged && declared.has(tagged)) return tagged;
  const clock = event.payload?.story?.real_clock;
  if (clock) {
    for (const act of declared.values()) {
      const starts = act.starts_at ?? "";
      const ends = act.ends_at ?? "";
      if (starts && ends && clock >= starts && clock < ends) return act.act_id;
    }
  }
  throw new Error(
    `sequence ${event.sequence} names no declared act and no act window holds its clock`,
  );
}

// ---------------------------------------------------------------- the two exported readings

/**
 * The running order: the four acts the manifest declares, each with the window of events it
 * holds, the beats that window cuts into, and where the camera looks for each beat.
 *
 * Pass the terrain bounds the viewer actually delivers and any position outside them is left
 * out of the anchors and counted, so the camera can never be aimed off the edge of the ground.
 * Leave them out and every position the record carries is used.
 */
export function deriveActs(
  scenario: ReplayScenario,
  events: ReplayEvent[],
  bounds?: TerrainBounds,
): Act[] {
  const declared = new Map<string, ScenarioAct>();
  for (const act of scenario.acts ?? []) declared.set(act.act_id, act);
  if (declared.size === 0) throw new Error("the scenario manifest declares no acts");

  const drafts = new Map<string, Map<string, BeatDraft>>();
  const actEvents = new Map<string, ReplayEvent[]>();
  const actSums = new Map<string, AnchorSum>();
  for (const actId of declared.keys()) {
    drafts.set(actId, new Map());
    actEvents.set(actId, []);
    actSums.set(actId, newAnchorSum());
  }

  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  for (const event of ordered) {
    const actId = actIdFor(event, declared);
    actEvents.get(actId)!.push(event);
    addEventToAnchorSum(actSums.get(actId)!, event, bounds);

    const kind = beatKindOf(event);
    const key = beatKeyOf(event, kind);
    const beats = drafts.get(actId)!;
    let draft = beats.get(key);
    if (!draft) {
      draft = { beatId: `${actId}:${key}`, kind, first: event, events: [], sum: newAnchorSum() };
      beats.set(key, draft);
    }
    draft.events.push(event);
    addEventToAnchorSum(draft.sum, event, bounds);
  }

  const acts: Act[] = [];
  for (const declaredAct of declared.values()) {
    const held = actEvents.get(declaredAct.act_id)!;
    const first = held[0];
    const last = held[held.length - 1];
    const sum = actSums.get(declaredAct.act_id)!;
    const beats = [...drafts.get(declaredAct.act_id)!.values()]
      .sort((a, b) => a.first.sequence - b.first.sequence)
      .map((draft) => finishBeat(draft, declaredAct.act_id));
    acts.push({
      actId: declaredAct.act_id,
      label: GLOSS.plainActLabel(
        String(declaredAct.act_id ?? ""), String(declaredAct.label ?? declaredAct.act_id)),
      story: GLOSS.plainActStory(String(declaredAct.act_id ?? ""), String(declaredAct.story ?? "")),
      declaredStartsAt: String(declaredAct.starts_at ?? ""),
      declaredEndsAt: String(declaredAct.ends_at ?? ""),
      window: {
        firstSequence: first ? first.sequence : -1,
        lastSequence: last ? last.sequence : -1,
        eventCount: held.length,
        startSimSeconds: first?.sim_time_s ?? 0,
        endSimSeconds: last?.sim_time_s ?? 0,
        startClock: String(first?.payload?.story?.real_clock ?? ""),
        endClock: String(last?.payload?.story?.real_clock ?? ""),
      },
      beats,
      anchor: anchorOf(sum),
      frame: frameOf(sum),
      anchors: tallyOf(sum),
    });
  }
  return acts;
}

/**
 * The kickoff the whole replay opens on: the main shock in the centre of the screen, with the
 * tremors that followed it running underneath as a timeline.
 *
 * The magnitude, the agency intensity and the origin clock all come off the run's first event.
 * The timeline stops at the last official bulletin about the main shock, so its length is the
 * length of the agency's own revision series rather than a number chosen here.
 */
export function openingBeat(events: ReplayEvent[]): OpeningBeat {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  const world = ordered.find((event) => event.type === "WORLD_INITIALIZED");
  if (!world) throw new Error("the run carries no WORLD_INITIALIZED event to open on");

  const incident = world.payload?.incident ?? {};
  const story = world.payload?.story ?? {};
  const seed = eventPositions(world)[0];

  const bulletins: OpeningBulletin[] = ordered
    .filter((event) => event.type === "SOURCE_INGESTED" && event.payload?.report_id)
    .map((event) => {
      const payload = event.payload!;
      return {
        sequence: event.sequence,
        reportId: String(payload.report_id),
        serial: String(payload.serial ?? ""),
        clock: String(payload.story?.real_clock ?? ""),
        publishedAt: String(payload.published_at_exact ?? ""),
        magnitude: payload.magnitude ?? null,
        maximumIntensity: payload.max_intensity ?? null,
        hypocenterCoordinate: payload.hypocenter_coordinate ?? null,
      };
    });

  const lastBulletin = bulletins.length > 0
    ? ordered.find((event) => event.sequence === bulletins[bulletins.length - 1].sequence)
    : undefined;
  const windowEndsAtSimSeconds = lastBulletin?.sim_time_s ?? world.sim_time_s ?? 0;
  const windowEndsAtClock = lastBulletin
    ? String(lastBulletin.payload?.story?.real_clock ?? "")
    : String(story.real_clock ?? "");

  const aftershocks: OpeningAftershock[] = [];
  for (const event of ordered) {
    const quake = event.payload?.earthquake;
    if (!quake) continue;
    if ((event.sim_time_s ?? 0) > windowEndsAtSimSeconds) break;
    const position = eventPositions(event)[0];
    aftershocks.push({
      sequence: event.sequence,
      eventId: String(quake.event_id ?? event.event_id ?? ""),
      simTimeSeconds: event.sim_time_s ?? 0,
      clock: String(event.payload?.story?.real_clock ?? quake.origin_time ?? ""),
      magnitude: quake.magnitude ?? null,
      maximumIntensity: quake.maximum_intensity ?? null,
      areaName: String(quake.area_name ?? ""),
      areaNameEnglish: String(quake.area_name_english ?? ""),
      longitude: position ? position[0] : null,
      latitude: position ? position[1] : null,
    });
  }

  return {
    sequence: world.sequence,
    eventId: String(world.event_id ?? ""),
    magnitude: incident.magnitude ?? null,
    maximumIntensity: incident.maximum_intensity ?? null,
    originClock: String(incident.occurred_at ?? story.real_clock ?? ""),
    longitude: seed ? seed[0] : incident.longitude ?? null,
    latitude: seed ? seed[1] : incident.latitude ?? null,
    actId: String(story.act_id ?? ""),
    actLabel: GLOSS.plainActLabel(String(story.act_id ?? ""), String(story.act_label ?? "")),
    roundId: String(story.round_id ?? ""),
    roundLabel: GLOSS.plainRound(String(story.round_id ?? ""), String(story.round_label ?? "")),
    camera: String(story.camera ?? ""),
    holdSeconds: story.hold_seconds ?? 0,
    bulletins,
    windowEndsAtSimSeconds,
    windowEndsAtClock,
    aftershocks,
  };
}
