/**
 * Divergence pairing — the one mechanism under all three run comparisons.
 *
 * Rescue World compares two recorded runs of the same disaster scenario. A run is a list of
 * recorded events (the baked log's shape). This file turns two such lists into the moments where
 * the two runs made different choices from the same information, so the ghost echoes, the in-place
 * world swap, and the debrief diff all read from one derivation instead of three.
 *
 * The pairing rule comes from codex's feasibility review (board message #564): two runs are matched
 * by scenario, by decision stage, and by the difference in their selected targets. Event
 * identifiers are never assumed to line up between runs. Inside one run, event identifiers are
 * used, because `caused_by` is that run's own record of what led to what.
 *
 * The file is a pure module. No rendering, no fetching, no clock reads, no randomness. The same
 * events in the same order always produce the same output, which is what determinism in replay
 * requires.
 *
 * Before two runs are matched their identities are checked. A scenario name can be copied, so a
 * run whose numbers were altered can still claim to be the same scenario; the recorded
 * run-identity equality keys — scenario basis, observation set, resources, decision slots — are
 * what make the check mechanical, and a disagreement is refused by name of the key.
 * `app/scripts/test-pairing.mjs` is the standalone regression test for all of it.
 *
 * Worked example, the recorded Kumamoto exercise (81 events, two arms):
 *   extractDecisions(events, "PLAIN_GRAPH")     -> one decision slot at stage RANK
 *   pairRuns(events, "PLAIN_GRAPH", events, "EVIDENCE_GRAPH", identity, identity)
 *                                               -> that slot paired with the evidence arm's slot
 *   divergences(pairing)                        -> one divergence: sites 001/003 differ
 *   divergenceEpisode(divs)                     -> one episode: cause, choice, consequence
 */

// ------------------------------------------------------------------ the recorded event, verbatim

/** A point on the ground: longitude then latitude, as the recorded geometry stores it. */
export type Position = [number, number];

export interface EventGeometry {
  type: string;
  coordinates: unknown;
}

export interface EventGraph {
  graph_id?: string | null;
  node_id?: string | null;
  edge_id?: string | null;
}

/** One recorded event, exactly as `disaster-replay.event.v1` writes it. */
export interface ReplayEvent {
  sequence: number;
  sim_time_s: number;
  type: string;
  arm: string;
  event_id: string;
  caused_by?: string[] | null;
  entity_refs?: string[] | null;
  geometry?: EventGeometry | null;
  graph?: EventGraph | null;
  payload?: Record<string, unknown> | null;
  provenance?: { classification?: string; explanation?: string; source_ids?: string[] } | null;
  actor?: { id?: string; kind?: string; role?: string } | null;
}

// ------------------------------------------------------------------ what one arm's decision holds

/**
 * One claim version and the verdict an arm stamped on it. A claim version is one reported number
 * about one site, kept whole — for example "site 001, people waiting, 60".
 */
export interface ClaimVerdict {
  eventId: string;
  sequence: number;
  simTimeS: number;
  siteId: string;
  claimVersionId: string;
  value: number | null;
  unit: string;
  /** The arm's own verdict: SUPPORTED, REJECTED, UNRESOLVED, or NOT_EVALUATED. */
  verdict: string;
  /** The verdict the run's reference comparison would give, recorded alongside. */
  comparisonVerdict: string;
  supportingObservationIds: string[];
  position: Position | null;
  causedBy: string[];
}

/** One team sent to one site, and the claim version that authorized sending it. */
export interface Dispatch {
  eventId: string;
  sequence: number;
  simTimeS: number;
  dispatchId: string;
  resourceId: string;
  siteId: string;
  authorizingClaimVersionId: string | null;
  /** The claim version named above, resolved inside this arm. Null when the arm never recorded it. */
  authorizingClaim: ClaimVerdict | null;
  position: Position | null;
  causedBy: string[];
}

/** What was found when a team arrived, in simulated people. */
export interface Outcome {
  eventId: string;
  sequence: number;
  simTimeS: number;
  siteId: string;
  peopleReached: number;
  unit: string;
  position: Position | null;
  causedBy: string[];
}

/** The gate an arm applied to its own proposal, when it recorded one. */
export interface PolicyCheck {
  eventId: string;
  sequence: number;
  simTimeS: number;
  policyId: string;
  disposition: string;
  supportedSelections: number | null;
  rejectedSelections: number | null;
  unsupportedSelections: number | null;
}

/**
 * One decision cycle of one arm: the moment that arm proposed where its scarce teams go, with
 * everything that authorized the proposal and everything that followed from it.
 */
export interface DecisionSlot {
  scenarioId: string;
  arm: string;
  graphId: string | null;
  /** The graph node the proposal was made at, for example RANK. This is the pairing stage. */
  stage: string;
  /** Which decision this is among the decisions this arm made at that stage, counting from zero. */
  stageOrdinal: number;
  /** `stage` and `stageOrdinal` joined — the key two runs are matched on. */
  stageKey: string;
  /** The recorded decision identifier, for example `plain_graph:dispatch-decision`. */
  decisionId: string;
  /** The decision identifier with its arm prefix removed, used as a fallback match. */
  decisionKey: string;
  eventId: string;
  sequence: number;
  simTimeS: number;
  /** Every graph node this arm entered up to and including the proposal, in recorded order. */
  stagePath: string[];
  /** The targets the arm proposed, in recorded order. */
  selectedTargets: string[];
  /** The same targets sorted and de-duplicated, which is what target comparison uses. */
  selectedTargetSet: string[];
  claimedPeople: number[];
  resourceLimit: number | null;
  policy: PolicyCheck | null;
  /** Every claim version this arm settled during this decision cycle. */
  claims: ClaimVerdict[];
  /** Only the claim versions that authorized this cycle's dispatches. */
  authorizingClaims: ClaimVerdict[];
  dispatches: Dispatch[];
  outcomes: Outcome[];
  /** The sum of this cycle's outcomes, in simulated people. */
  peopleReached: number;
  /** The unit the outcomes are counted in, for example `simulated_people`. */
  outcomeUnit: string;
}

// ------------------------------------------------------------------ what pairing and divergence hold

/** One decision slot of run A matched with the slot of run B that stands in the same place. */
export interface PairedSlot {
  scenarioId: string;
  stage: string;
  stageOrdinal: number;
  stageKey: string;
  /** How the two slots were matched: by stage key, or by the decision identifier fallback. */
  matchedBy: "stage" | "decision-id";
  a: DecisionSlot;
  b: DecisionSlot;
}

/**
 * What a run says it is. The recorded certificate carries these equality keys — the scenario
 * basis, the observation set, the resources and the decision slots — and two runs may only be
 * compared when every one of them agrees. A run written before the keys existed carries none,
 * and then only the scenario identifier can be checked.
 */
export interface RunIdentity {
  schemaVersion?: string;
  runId?: string;
  equalityKeys?: Record<string, string> | null;
}

/** What the pairing actually checked before it matched two runs. */
export interface IdentityCheck {
  /** `equality-keys` when both runs carried them and all agreed; `scenario-id` otherwise. */
  basis: "equality-keys" | "scenario-id";
  /** The keys compared, sorted. Empty on the scenario-identifier fallback. */
  keys: string[];
  /** One plain sentence stating what was checked and what was not. */
  note: string;
}

/** The result of matching two runs of one scenario. */
export interface PairedRuns {
  scenarioId: string;
  armA: string;
  armB: string;
  /** What was verified about the two runs' identities before they were matched. */
  identity: IdentityCheck;
  paired: PairedSlot[];
  /** Slots of run A with no counterpart in run B. */
  unpairedA: DecisionSlot[];
  /** Slots of run B with no counterpart in run A. */
  unpairedB: DecisionSlot[];
  /**
   * Every distinct recorded second in the two runs, ascending. A moment's position in this list is
   * the `tick` a divergence carries, so ticks stay stable without depending on any playback grid.
   */
  moments: number[];
}

/** One arm's side of a divergence. */
export interface DivergenceChoice {
  arm: string;
  slot: DecisionSlot;
  selectedTargets: string[];
  /** The sites only this arm chose. */
  onlySites: string[];
  dispatches: Dispatch[];
  /** The claim versions that authorized this arm's dispatches, with their verdicts. */
  evidence: ClaimVerdict[];
  outcomes: Outcome[];
  peopleReached: number;
}

/** One moment where two runs chose differently from the same information. */
export interface Divergence {
  scenarioId: string;
  stage: string;
  stageKey: string;
  /** The moment's position among all distinct recorded seconds in the pair. */
  tick: number;
  /** The earlier of the two proposals, in recorded seconds — the second the paths split. */
  simTimeS: number;
  /** Every site either arm chose here, sorted. */
  sites: string[];
  /** Sites both arms chose. */
  sharedSites: string[];
  a: DivergenceChoice;
  b: DivergenceChoice;
  outcomeDelta: {
    a: number;
    b: number;
    /** Run B's people count minus run A's. */
    delta: number;
    unit: string;
  };
}

/** Why the runs split: the earliest claim-verdict difference under the sites they chose differently. */
export interface CauseBeat {
  siteId: string;
  claimVersionId: string;
  simTimeS: number;
  tick: number;
  a: { arm: string; claim: ClaimVerdict | null; verdict: string | null };
  b: { arm: string; claim: ClaimVerdict | null; verdict: string | null };
  /** Every claim version run A recorded for that site, so the beat can show the competing numbers. */
  siteClaimsA: ClaimVerdict[];
  /** The same for run B. */
  siteClaimsB: ClaimVerdict[];
}

/** What the runs did differently: the dispatch difference. */
export interface ChoiceBeat {
  simTimeS: number;
  tick: number;
  /** Sites both runs sent a team to. */
  sharedSites: string[];
  a: { arm: string; onlySites: string[]; dispatches: Dispatch[] };
  b: { arm: string; onlySites: string[]; dispatches: Dispatch[] };
}

/** What it cost or gained: the outcome delta. */
export interface ConsequenceBeat {
  a: { arm: string; peopleReached: number; outcomes: Outcome[] };
  b: { arm: string; peopleReached: number; outcomes: Outcome[] };
  /** Run B's people count minus run A's. */
  delta: number;
  unit: string;
}

/** Related divergence moments told as one story: cause, choice, consequence. */
export interface DivergenceEpisode {
  episodeId: string;
  scenarioId: string;
  armA: string;
  armB: string;
  divergences: Divergence[];
  /** Every site involved in the episode, sorted. */
  sites: string[];
  tick: number;
  simTimeS: number;
  cause: CauseBeat;
  choice: ChoiceBeat;
  consequence: ConsequenceBeat;
}

// ------------------------------------------------------------------ small readers over loose data

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const readString = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.length > 0 ? v : fallback;

const readNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const readStringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

const readNumberList = (v: unknown): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && Number.isFinite(x)) : [];

/** Longitude and latitude, only when the geometry really is a point with two finite numbers. */
function readPosition(geometry: EventGeometry | null | undefined): Position | null {
  if (!geometry || geometry.type !== "Point") return null;
  const c = geometry.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const lon = readNumber(c[0]);
  const lat = readNumber(c[1]);
  return lon === null || lat === null ? null : [lon, lat];
}

const payloadOf = (e: ReplayEvent): Record<string, unknown> =>
  isRecord(e.payload) ? e.payload : {};

/** Recorded order: by recorded second, then by sequence. Never by array position. */
function sortedEvents(events: readonly ReplayEvent[]): ReplayEvent[] {
  return events.slice().sort((x, y) => x.sim_time_s - y.sim_time_s || x.sequence - y.sequence);
}

const uniqueSorted = (values: readonly string[]): string[] =>
  Array.from(new Set(values)).sort();

const setsEqual = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Members of `a` that are not in `b`, sorted. */
const without = (a: readonly string[], b: readonly string[]): string[] => {
  const drop = new Set(b);
  return a.filter((v) => !drop.has(v)).sort();
};

/** Members present in both, sorted. */
const shared = (a: readonly string[], b: readonly string[]): string[] => {
  const keep = new Set(b);
  return a.filter((v) => keep.has(v)).sort();
};

/**
 * The scenario a list of events belongs to. Read from the world-opening event when it names one,
 * otherwise from the prefix every event identifier carries (`<scenario>:<event>`). Returns an empty
 * string when neither is readable.
 */
export function scenarioIdOf(events: readonly ReplayEvent[]): string {
  for (const e of events) {
    if (e.type !== "WORLD_INITIALIZED") continue;
    const refs = readStringList(e.entity_refs);
    if (refs.length > 0) return refs[0];
  }
  for (const e of events) {
    const id = readString(e.event_id);
    const cut = id.lastIndexOf(":");
    if (cut > 0) return id.slice(0, cut);
  }
  return "";
}

// ------------------------------------------------------------------ 1. the decision slots of one arm

/**
 * The decision slots of one arm.
 *
 * A decision slot is one cycle of that arm's graph: the proposal of where the scarce teams go, the
 * claim versions the arm settled on the way there, the gate it applied, the dispatches it issued,
 * and the outcomes those dispatches produced. Events are attached to a cycle by that run's own
 * `caused_by` links, and by recorded order where a link is missing.
 */
export function extractDecisions(events: readonly ReplayEvent[], arm: string): DecisionSlot[] {
  const scenarioId = scenarioIdOf(events);
  const ordered = sortedEvents(events).filter((e) => e.arm === arm);

  const decisions = ordered.filter((e) => e.type === "DECISION_PROPOSED");
  if (decisions.length === 0) return [];

  const transitions = ordered.filter((e) => e.type === "GRAPH_TRANSITION");
  const claimEvents = ordered.filter((e) => e.type === "CLAIM_STATE_CHANGED");
  const policyEvents = ordered.filter((e) => e.type === "POLICY_EVALUATED");
  const dispatchEvents = ordered.filter((e) => e.type === "RESOURCE_DISPATCHED");
  const outcomeEvents = ordered.filter((e) => e.type === "OUTCOME_OBSERVED");

  const claims = claimEvents.map(readClaim);
  /** Every claim version this arm recorded, latest wins, so a dispatch can name its evidence. */
  const claimByVersion = new Map<string, ClaimVerdict>();
  for (const c of claims) if (c.claimVersionId) claimByVersion.set(c.claimVersionId, c);

  const stageCount = new Map<string, number>();
  const slots: DecisionSlot[] = [];

  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const p = payloadOf(d);
    const next = decisions[i + 1];
    const windowStart = i === 0 ? -Infinity : decisions[i - 1].sequence;
    const windowEnd = next ? next.sequence : Infinity;

    // The stage: the node the proposal was made at, or the last node this arm entered before it.
    let stage = readString(d.graph?.node_id);
    let graphId = readString(d.graph?.graph_id) || null;
    const stagePath: string[] = [];
    for (const t of transitions) {
      if (t.sequence > d.sequence) break;
      const node = readString(t.graph?.node_id) || readString(payloadOf(t)["node_id"]);
      if (node) stagePath.push(node);
      if (!graphId) graphId = readString(t.graph?.graph_id) || null;
    }
    if (!stage && stagePath.length > 0) stage = stagePath[stagePath.length - 1];
    if (!stage) stage = "DECISION";

    const stageOrdinal = stageCount.get(stage) ?? 0;
    stageCount.set(stage, stageOrdinal + 1);

    const decisionId = readString(p["decision_id"]);
    const selectedTargets = readStringList(p["selected_targets"]);

    // The gate this arm applied to this proposal.
    const policyEvent = policyEvents.find((e) => readStringList(e.caused_by).includes(d.event_id));
    const policy = policyEvent ? readPolicy(policyEvent) : null;

    // The dispatches this proposal authorized. The run's own causal link first; recorded order
    // inside this cycle's window as the fallback.
    let cycleDispatchEvents = dispatchEvents.filter((e) =>
      readStringList(e.caused_by).includes(d.event_id));
    if (cycleDispatchEvents.length === 0) {
      cycleDispatchEvents = dispatchEvents.filter((e) =>
        e.sequence > d.sequence && e.sequence < windowEnd);
    }
    const dispatches = cycleDispatchEvents.map((e) => readDispatch(e, claimByVersion));

    // The outcomes those dispatches produced, by the same rule.
    const dispatchIds = new Set(dispatches.map((x) => x.eventId));
    const bySite = new Map<string, Dispatch>();
    for (const x of dispatches) bySite.set(x.siteId, x);
    const outcomes: Outcome[] = [];
    for (const e of outcomeEvents) {
      const linked = readStringList(e.caused_by).some((id) => dispatchIds.has(id));
      const o = readOutcome(e);
      const byWindow = !linked
        && e.sequence > d.sequence && e.sequence < windowEnd
        && bySite.has(o.siteId);
      if (linked || byWindow) outcomes.push(o);
    }

    // The claim versions this arm settled during this cycle.
    const cycleClaims = claims.filter((c) =>
      c.sequence > windowStart && c.sequence <= d.sequence);
    const authorizingIds = new Set(
      dispatches.map((x) => x.authorizingClaimVersionId).filter((x): x is string => !!x));
    const authorizingClaims = claims.filter((c) => authorizingIds.has(c.claimVersionId));

    const peopleReached = outcomes.reduce((sum, o) => sum + o.peopleReached, 0);
    const outcomeUnit = outcomes.length > 0 ? outcomes[0].unit : "";

    slots.push({
      scenarioId,
      arm,
      graphId,
      stage,
      stageOrdinal,
      stageKey: `${stage}#${stageOrdinal}`,
      decisionId,
      decisionKey: normalizeDecisionId(decisionId, arm),
      eventId: d.event_id,
      sequence: d.sequence,
      simTimeS: d.sim_time_s,
      stagePath,
      selectedTargets,
      selectedTargetSet: uniqueSorted(selectedTargets),
      claimedPeople: readNumberList(p["claimed_people"]),
      resourceLimit: readNumber(p["resource_limit"]),
      policy,
      claims: cycleClaims,
      authorizingClaims,
      dispatches,
      outcomes,
      peopleReached,
      outcomeUnit,
    });
  }

  return slots;
}

function readClaim(e: ReplayEvent): ClaimVerdict {
  const p = payloadOf(e);
  return {
    eventId: e.event_id,
    sequence: e.sequence,
    simTimeS: e.sim_time_s,
    siteId: readString(p["target_feature_id"]),
    claimVersionId: readString(p["claim_version_id"]),
    value: readNumber(p["value"]),
    unit: readString(p["unit"]),
    verdict: readString(p["verdict"], "NOT_EVALUATED"),
    comparisonVerdict: readString(p["comparison_verdict"], "NOT_EVALUATED"),
    supportingObservationIds: readStringList(p["supporting_observation_ids"]),
    position: readPosition(e.geometry),
    causedBy: readStringList(e.caused_by),
  };
}

function readDispatch(e: ReplayEvent, claims: Map<string, ClaimVerdict>): Dispatch {
  const p = payloadOf(e);
  const authorizing = readString(p["authorizing_claim_version_id"]) || null;
  return {
    eventId: e.event_id,
    sequence: e.sequence,
    simTimeS: e.sim_time_s,
    dispatchId: readString(p["dispatch_id"]),
    resourceId: readString(p["resource_id"]),
    siteId: readString(p["target_feature_id"]),
    authorizingClaimVersionId: authorizing,
    authorizingClaim: authorizing ? claims.get(authorizing) ?? null : null,
    position: readPosition(e.geometry),
    causedBy: readStringList(e.caused_by),
  };
}

function readOutcome(e: ReplayEvent): Outcome {
  const p = payloadOf(e);
  return {
    eventId: e.event_id,
    sequence: e.sequence,
    simTimeS: e.sim_time_s,
    siteId: readString(p["target_feature_id"]),
    peopleReached: readNumber(p["exercise_people_reached"]) ?? 0,
    unit: readString(p["unit"]),
    position: readPosition(e.geometry),
    causedBy: readStringList(e.caused_by),
  };
}

function readPolicy(e: ReplayEvent): PolicyCheck {
  const p = payloadOf(e);
  return {
    eventId: e.event_id,
    sequence: e.sequence,
    simTimeS: e.sim_time_s,
    policyId: readString(p["policy_id"]),
    disposition: readString(p["disposition"]),
    supportedSelections: readNumber(p["supported_selections"]),
    rejectedSelections: readNumber(p["rejected_selections"]),
    unsupportedSelections: readNumber(p["unsupported_selections"]),
  };
}

/**
 * A decision identifier without its arm prefix. `plain_graph:dispatch-decision` and
 * `evidence_graph:dispatch-decision` both become `dispatch-decision`, which lets two runs match
 * even when their graphs name the deciding node differently.
 */
function normalizeDecisionId(decisionId: string, arm: string): string {
  if (!decisionId) return "";
  const cut = decisionId.lastIndexOf(":");
  const tail = cut >= 0 ? decisionId.slice(cut + 1) : decisionId;
  const armPrefix = arm.toLowerCase();
  return tail.startsWith(armPrefix) ? tail.slice(armPrefix.length).replace(/^[-_:]/, "") : tail;
}

// ------------------------------------------------------------------ 2. matching two runs

/**
 * Check that two runs are the same problem before their choices are compared.
 *
 * A scenario identifier is a name, and a name can be copied. A run whose people counts were
 * altered can still call itself the same scenario, and comparing it against the original would
 * read as a decision difference when it is really a data difference. The equality keys are what
 * make the check mechanical: two runs must agree on the scenario basis, the observation set, the
 * resources and the decision slots, and the first key that disagrees is named in the refusal.
 *
 * Where a run carries no keys — a log written before they existed — this returns the
 * scenario-identifier fallback and says so, rather than pretending a check happened.
 */
function checkIdentity(
  a: RunIdentity | null | undefined,
  b: RunIdentity | null | undefined,
  armA: string,
  armB: string,
): IdentityCheck {
  const keysA = a?.equalityKeys ?? null;
  const keysB = b?.equalityKeys ?? null;
  const carried = (k: Record<string, string> | null) => !!k && Object.keys(k).length > 0;

  if (!carried(keysA) || !carried(keysB)) {
    return {
      basis: "scenario-id",
      keys: [],
      note: "A run normally records a short fingerprint of each file it was built from, and two"
        + " runs can be compared when their fingerprints match. Neither of these runs recorded"
        + " any, so only their scenario names were checked. Nobody has checked whether they used"
        + " the same reports, the same resources and the same decisions.",
    };
  }

  const names = uniqueSorted([...Object.keys(keysA!), ...Object.keys(keysB!)]);
  for (const name of names) {
    const va = keysA![name];
    const vb = keysB![name];
    if (typeof va === "string" && va.length > 0 && va === vb) continue;
    throw new Error(
      `Cannot pair these runs: their run identities disagree on "${name}". The run for arm `
      + `"${armA}" records ${va ? `"${va}"` : "no value"} and the run for arm "${armB}" records `
      + `${vb ? `"${vb}"` : "no value"}. Two runs can only be compared when they were built from `
      + "the same scenario basis, the same observations, the same resources and the same decision"
      + " slots.",
    );
  }

  return {
    basis: "equality-keys",
    keys: names,
    note: `Each run records a short fingerprint of every file it was built from. These two agree`
      + ` on all ${names.length} of them: ${names.join(", ")}.`,
  };
}

/**
 * Match the decision slots of two runs of the same scenario.
 *
 * The two runs may be two arms of one recorded log, or two separately loaded logs. Either way the
 * scenario is read from the events themselves and the runs are refused if the scenarios differ —
 * two different disasters have no shared decision points to compare. Where the runs carry
 * run-identity equality keys, those are verified too, and a run that copied the scenario name but
 * changed the numbers is refused by name of the key that disagreed.
 *
 * Slots are matched by decision stage, which is the graph node the proposal was made at plus which
 * proposal it was at that node. Where a stage match is impossible — two graphs that name the same
 * decision differently — the decision identifier with its arm prefix removed is the fallback.
 * Event identifiers are never matched across runs.
 */
export function pairRuns(
  eventsA: readonly ReplayEvent[],
  armA: string,
  eventsB: readonly ReplayEvent[],
  armB: string,
  identityA?: RunIdentity | null,
  identityB?: RunIdentity | null,
): PairedRuns {
  const scenarioA = scenarioIdOf(eventsA);
  const scenarioB = scenarioIdOf(eventsB);

  if (!scenarioA || !scenarioB) {
    throw new Error(
      "Cannot pair these runs: the scenario could not be read from "
      + `${!scenarioA ? `the events for arm "${armA}"` : `the events for arm "${armB}"`}. `
      + "A run must carry a world-opening event or scenario-prefixed event identifiers.",
    );
  }
  if (scenarioA !== scenarioB) {
    throw new Error(
      `Cannot pair these runs: they are from different scenarios, "${scenarioA}" and `
      + `"${scenarioB}". Runs can only be compared inside one scenario.`,
    );
  }

  const identity = checkIdentity(identityA, identityB, armA, armB);

  const slotsA = extractDecisions(eventsA, armA);
  const slotsB = extractDecisions(eventsB, armB);

  const paired: PairedSlot[] = [];
  const takenB = new Set<number>();

  // First pass: the same stage, the same time round at that stage.
  const remainingA: DecisionSlot[] = [];
  for (const a of slotsA) {
    const j = slotsB.findIndex((b, k) => !takenB.has(k) && b.stageKey === a.stageKey);
    if (j < 0) { remainingA.push(a); continue; }
    takenB.add(j);
    paired.push({
      scenarioId: scenarioA,
      stage: a.stage,
      stageOrdinal: a.stageOrdinal,
      stageKey: a.stageKey,
      matchedBy: "stage",
      a,
      b: slotsB[j],
    });
  }

  // Second pass: same decision, differently named stage.
  const unpairedA: DecisionSlot[] = [];
  for (const a of remainingA) {
    const j = a.decisionKey
      ? slotsB.findIndex((b, k) => !takenB.has(k) && b.decisionKey === a.decisionKey)
      : -1;
    if (j < 0) { unpairedA.push(a); continue; }
    takenB.add(j);
    paired.push({
      scenarioId: scenarioA,
      stage: a.stage,
      stageOrdinal: a.stageOrdinal,
      stageKey: a.stageKey,
      matchedBy: "decision-id",
      a,
      b: slotsB[j],
    });
  }

  paired.sort((x, y) =>
    Math.min(x.a.simTimeS, x.b.simTimeS) - Math.min(y.a.simTimeS, y.b.simTimeS)
    || x.a.sequence - y.a.sequence
    || (x.stageKey < y.stageKey ? -1 : x.stageKey > y.stageKey ? 1 : 0));

  const unpairedB = slotsB.filter((_, k) => !takenB.has(k));

  const moments = Array.from(new Set([
    ...eventsA.map((e) => e.sim_time_s),
    ...eventsB.map((e) => e.sim_time_s),
  ])).sort((x, y) => x - y);

  return { scenarioId: scenarioA, armA, armB, identity, paired, unpairedA, unpairedB, moments };
}

// ------------------------------------------------------------------ 3. the divergence moments

/**
 * The paired slots where the two runs chose different targets. Each one carries the moment, the
 * sites involved, both choices with the evidence that authorized them, both sets of outcomes, and
 * the difference in people reached.
 */
export function divergences(pairing: PairedRuns): Divergence[] {
  const out: Divergence[] = [];

  for (const slot of pairing.paired) {
    const { a, b } = slot;
    if (setsEqual(a.selectedTargetSet, b.selectedTargetSet)) continue;

    const onlyA = without(a.selectedTargetSet, b.selectedTargetSet);
    const onlyB = without(b.selectedTargetSet, a.selectedTargetSet);
    const both = shared(a.selectedTargetSet, b.selectedTargetSet);
    const simTimeS = Math.min(a.simTimeS, b.simTimeS);

    out.push({
      scenarioId: slot.scenarioId,
      stage: slot.stage,
      stageKey: slot.stageKey,
      tick: tickOf(pairing.moments, simTimeS),
      simTimeS,
      sites: uniqueSorted([...a.selectedTargetSet, ...b.selectedTargetSet]),
      sharedSites: both,
      a: choiceOf(a, onlyA),
      b: choiceOf(b, onlyB),
      outcomeDelta: {
        a: a.peopleReached,
        b: b.peopleReached,
        delta: b.peopleReached - a.peopleReached,
        unit: a.outcomeUnit || b.outcomeUnit,
      },
    });
  }

  return out;
}

function choiceOf(slot: DecisionSlot, onlySites: string[]): DivergenceChoice {
  return {
    arm: slot.arm,
    slot,
    selectedTargets: slot.selectedTargets,
    onlySites,
    dispatches: slot.dispatches,
    evidence: slot.authorizingClaims,
    outcomes: slot.outcomes,
    peopleReached: slot.peopleReached,
  };
}

/** Where a recorded second sits among all the recorded seconds of the pair. */
function tickOf(moments: readonly number[], simTimeS: number): number {
  const i = moments.indexOf(simTimeS);
  return i < 0 ? 0 : i;
}

// ------------------------------------------------------------------ 4. the episodes

/**
 * Group divergence moments into episodes and derive each episode's three beats.
 *
 * Two divergence moments belong to the same episode when they touch a site in common, directly or
 * through another moment in the group. Each episode is told as:
 *
 *   cause       — the earliest claim-verdict difference under the sites the runs chose differently
 *   choice      — the dispatch difference: who went where
 *   consequence — the outcome difference in people reached
 *
 * The name is singular because an episode is what the debrief shows; the return is a list because a
 * longer run can hold more than one.
 */
export function divergenceEpisode(divs: readonly Divergence[]): DivergenceEpisode[] {
  if (divs.length === 0) return [];

  const ordered = divs.slice().sort((x, y) =>
    x.tick - y.tick
    || x.simTimeS - y.simTimeS
    || (x.stageKey < y.stageKey ? -1 : x.stageKey > y.stageKey ? 1 : 0));

  // Group by shared sites, following the chain.
  const groups: Divergence[][] = [];
  const groupSites: Set<string>[] = [];
  for (const d of ordered) {
    let landed = -1;
    for (let g = 0; g < groups.length; g++) {
      if (d.sites.some((s) => groupSites[g].has(s))) { landed = g; break; }
    }
    if (landed < 0) {
      groups.push([d]);
      groupSites.push(new Set(d.sites));
      continue;
    }
    groups[landed].push(d);
    for (const s of d.sites) groupSites[landed].add(s);
    // A later moment can join two groups that were separate until now.
    for (let g = groups.length - 1; g > landed; g--) {
      if (![...groupSites[g]].some((s) => groupSites[landed].has(s))) continue;
      groups[landed].push(...groups[g]);
      for (const s of groupSites[g]) groupSites[landed].add(s);
      groups.splice(g, 1);
      groupSites.splice(g, 1);
    }
  }

  return groups.map((group, index) => {
    const members = group.slice().sort((x, y) => x.tick - y.tick || x.simTimeS - y.simTimeS);
    const first = members[0];
    const sites = uniqueSorted(members.flatMap((d) => d.sites));

    const peopleA = members.reduce((sum, d) => sum + d.outcomeDelta.a, 0);
    const peopleB = members.reduce((sum, d) => sum + d.outcomeDelta.b, 0);
    const unit = members.find((d) => d.outcomeDelta.unit)?.outcomeDelta.unit ?? "";

    return {
      episodeId: `${first.scenarioId}:episode-${index + 1}`,
      scenarioId: first.scenarioId,
      armA: first.a.arm,
      armB: first.b.arm,
      divergences: members,
      sites,
      tick: first.tick,
      simTimeS: first.simTimeS,
      cause: causeBeat(members),
      choice: choiceBeat(members, first),
      consequence: {
        a: { arm: first.a.arm, peopleReached: peopleA, outcomes: members.flatMap((d) => d.a.outcomes) },
        b: { arm: first.b.arm, peopleReached: peopleB, outcomes: members.flatMap((d) => d.b.outcomes) },
        delta: peopleB - peopleA,
        unit,
      },
    };
  });
}

/**
 * The cause beat: the earliest claim version whose verdict differs between the two runs, looking
 * only at the sites the runs chose differently. Sites both runs chose are excluded, because a claim
 * both runs acted on the same way did not feed the split.
 */
function causeBeat(members: readonly Divergence[]): CauseBeat {
  const divergingSites = new Set<string>();
  for (const d of members) {
    for (const s of d.a.onlySites) divergingSites.add(s);
    for (const s of d.b.onlySites) divergingSites.add(s);
  }

  const claimsA = new Map<string, ClaimVerdict>();
  const claimsB = new Map<string, ClaimVerdict>();
  for (const d of members) {
    for (const c of d.a.slot.claims) if (!claimsA.has(c.claimVersionId)) claimsA.set(c.claimVersionId, c);
    for (const c of d.b.slot.claims) if (!claimsB.has(c.claimVersionId)) claimsB.set(c.claimVersionId, c);
  }

  type Candidate = {
    claimVersionId: string; siteId: string; simTimeS: number; sequence: number;
    a: ClaimVerdict | null; b: ClaimVerdict | null;
  };
  const candidates: Candidate[] = [];
  const versionIds = uniqueSorted([...claimsA.keys(), ...claimsB.keys()]);
  for (const id of versionIds) {
    const a = claimsA.get(id) ?? null;
    const b = claimsB.get(id) ?? null;
    const siteId = a?.siteId ?? b?.siteId ?? "";
    if (!divergingSites.has(siteId)) continue;
    const differs = !a || !b || a.verdict !== b.verdict;
    if (!differs) continue;
    const times = [a?.simTimeS, b?.simTimeS].filter((t): t is number => typeof t === "number");
    const seqs = [a?.sequence, b?.sequence].filter((s): s is number => typeof s === "number");
    candidates.push({
      claimVersionId: id,
      siteId,
      simTimeS: Math.min(...times),
      sequence: Math.min(...seqs),
      a,
      b,
    });
  }

  const first = members[0];
  if (candidates.length === 0) {
    // No verdict difference is recorded — the runs split on ranking alone. Name the site and say so
    // by leaving the claim versions empty, rather than inventing a cause.
    const siteId = [...divergingSites].sort()[0] ?? "";
    return {
      siteId,
      claimVersionId: "",
      simTimeS: first.simTimeS,
      tick: first.tick,
      a: { arm: first.a.arm, claim: null, verdict: null },
      b: { arm: first.b.arm, claim: null, verdict: null },
      siteClaimsA: siteClaims(members, "a", siteId),
      siteClaimsB: siteClaims(members, "b", siteId),
    };
  }

  candidates.sort((x, y) =>
    x.simTimeS - y.simTimeS
    || x.sequence - y.sequence
    || (x.claimVersionId < y.claimVersionId ? -1 : x.claimVersionId > y.claimVersionId ? 1 : 0));
  const pick = candidates[0];

  return {
    siteId: pick.siteId,
    claimVersionId: pick.claimVersionId,
    simTimeS: pick.simTimeS,
    tick: first.tick,
    a: { arm: first.a.arm, claim: pick.a, verdict: pick.a ? pick.a.verdict : null },
    b: { arm: first.b.arm, claim: pick.b, verdict: pick.b ? pick.b.verdict : null },
    siteClaimsA: siteClaims(members, "a", pick.siteId),
    siteClaimsB: siteClaims(members, "b", pick.siteId),
  };
}

/** Every claim version one side of the pair recorded for one site, in recorded order. */
function siteClaims(members: readonly Divergence[], side: "a" | "b", siteId: string): ClaimVerdict[] {
  const seen = new Set<string>();
  const out: ClaimVerdict[] = [];
  for (const d of members) {
    for (const c of d[side].slot.claims) {
      if (c.siteId !== siteId || seen.has(c.claimVersionId)) continue;
      seen.add(c.claimVersionId);
      out.push(c);
    }
  }
  return out;
}

/** The choice beat: which sites both runs sent a team to, and where each run's other team went. */
function choiceBeat(members: readonly Divergence[], first: Divergence): ChoiceBeat {
  const onlyA = uniqueSorted(members.flatMap((d) => d.a.onlySites));
  const onlyB = uniqueSorted(members.flatMap((d) => d.b.onlySites));
  const sharedSites = uniqueSorted(members.flatMap((d) => d.sharedSites));

  const pickDispatches = (side: "a" | "b", sites: readonly string[]): Dispatch[] => {
    const wanted = new Set(sites);
    const seen = new Set<string>();
    const out: Dispatch[] = [];
    for (const d of members) {
      for (const x of d[side].dispatches) {
        if (!wanted.has(x.siteId) || seen.has(x.eventId)) continue;
        seen.add(x.eventId);
        out.push(x);
      }
    }
    return out;
  };

  return {
    simTimeS: first.simTimeS,
    tick: first.tick,
    sharedSites,
    a: { arm: first.a.arm, onlySites: onlyA, dispatches: pickDispatches("a", onlyA) },
    b: { arm: first.b.arm, onlySites: onlyB, dispatches: pickDispatches("b", onlyB) },
  };
}
