/**
 * RESCUE WORLD — the agent trace.
 *
 * At each of the eleven moments in the record when somebody had to decide something, this module
 * builds one walk-through a high-school student can follow. It answers five questions in order,
 * and it puts the recorded real choice in front of all five.
 *
 *   the real choice   what the responders actually did, as the public record has it
 *   step one          what was known by that moment's deadline
 *   step two          what the desk with plain written notes proposed
 *   step three        what the desk with an evidence table did with the same reports
 *   step four         what the check caught, in the check's own words, and the one correction
 *   step five         the final simulated action, with the grade it earned
 *
 * Where every sentence comes from. The five steps are read out of the sealed decision event: each
 * moment carries twenty-four recorded model choices, and each choice holds the assignments it
 * made, the reports it cited, how it weighed each one, the unknowns it named, its own written
 * reason, and the checker's verdict with every rule it broke. The real choice, the reports that
 * were visible by the deadline, the unknowns the moment required and the readable label behind
 * each identifier come from the scenario definition the bake carries beside the events under
 * `decision_context`. Nothing in this file computes a number of its own: it reads recorded
 * values, adds recorded quantities, and joins the copy deck's sentences around them.
 *
 * Why the check's message is quoted rather than reconstructed. The experiment's own checker
 * returns its feedback as one line per broken rule, written `CODE: detail`
 * (`experiments/kumamoto-real-response/runner/kumamoto_real_response/scoring.py`, function
 * `feedback_messages`). The rules it broke are recorded on the evidence-table answer inside the
 * sealed event, so the same lines are rebuilt here from sealed data and match the message the
 * desk actually received in all one hundred and twenty-eight recorded runs.
 *
 * Determinism: no clock, no random source, no document object model. The same baked file always
 * produces the same traces in the same order, so `window.__HERO.agentTraces()` is a pure read.
 */
import * as COPY from "./copy";
import * as GLOSS from "./gloss";

// ------------------------------------------------------------------ what the baked file holds

export interface RawAssignment { resource_id?: string; target_id?: string; quantity?: number }
export interface RawFactor { observation_id?: string; role?: string }
export interface RawViolation { code?: string; detail?: string }
export interface RawChoice {
  config_id?: string;
  seed?: number;
  graph_id?: string;
  certificate_hash?: string;
  decision?: {
    assignments?: RawAssignment[];
    used_observation_ids?: string[];
    acknowledged_unknown_ids?: string[];
    decision_factors?: RawFactor[];
    short_reason?: string;
  };
  score?: {
    fully_valid?: boolean;
    constraint_pass?: boolean;
    violations?: RawViolation[];
  };
}
export interface RawSlot {
  decision_slot_id?: string;
  reconstruction_slot_number?: number;
  title?: string;
  decider?: string;
  cutoff_at?: string;
  task?: string;
  assumptions?: string[];
  historical_choice?: {
    summary?: string;
    assignments?: RawAssignment[];
    source_ids?: string[];
    unknowns?: string[];
  };
}
export interface RawContextSlot {
  known_observations?: {
    observation_id?: string; plain_text?: string; caveat?: string;
  }[];
  required_unknowns?: { unknown_id?: string; plain_text?: string }[];
  action_contract?: { maximum_total_quantity?: number };
}
export interface RawContext {
  source?: { path?: string; sha256?: string };
  target_labels?: Record<string, { label?: string; kind?: string }>;
  resource_labels?: Record<string, { label?: string; kind?: string; capacity?: number }>;
  slots?: Record<string, RawContextSlot>;
}
export interface RawDecisionEvent {
  event_id?: string;
  sequence?: number;
  payload?: {
    decision_slot?: RawSlot;
    registered_five_slot_experiment?: { choices?: RawChoice[]; manifest_hash?: string } | null;
    full_incident_demonstration?: { choices?: RawChoice[]; manifest_hash?: string } | null;
  };
}

// ------------------------------------------------------------------ what one trace holds

/** one report that existed by the deadline, in the record's own plain words */
export interface TraceFact { id: string; sentence: string; caveat: string }
/** one thing nobody knew at the deadline, in the record's own plain words */
export interface TraceUnknown { id: string; sentence: string }
/** how one desk counted one report while it was deciding */
export interface TraceFactor {
  id: string; sentence: string; role: string; state: string;
  /** false where the desk weighed something this moment's own list of reports does not hold */
  known: boolean;
}
/** one line of a plan: how many of one unit go to one place */
export interface TraceAssignment {
  quantity: number; targetId: string; targetLabel: string;
  resourceId: string; resourceLabel: string;
  /** true where the answer wrote a name in machine form that the exercise does not carry */
  targetIsCode: boolean; resourceIsCode: boolean;
}

/** what one desk did at this moment, and what the check made of it */
export interface TraceDesk {
  graphId: string;
  /** the desk's short name, as the walk-through calls it */
  name: string;
  /** one sentence saying what this desk does differently */
  what: string;
  assignments: TraceAssignment[];
  /** true where this plan divides a pool of interchangeable units and counts them */
  pool: boolean;
  /** the count noun a pooled plan is counted in, in the form this plan's own total takes */
  unit: string;
  /** the same count noun in both its forms, for a caller counting one line of the plan */
  unitWords: { one: string; many: string };
  total: number;
  limit: number | null;
  /** the one sentence that opens the plan on a desk card */
  lead: string;
  /** the same sentence where the plan is the walk-through's last card */
  finalLead: string;
  /** one complete sentence per line of the plan */
  planLines: string[];
  /** the totals line under a pooled plan */
  totalLine: string;
  /** the limit this moment set on a pooled plan */
  limitLine: string;
  factors: TraceFactor[];
  namedUnknowns: TraceUnknown[];
  missingUnknowns: TraceUnknown[];
  extraUnknownCount: number;
  /** the sentence saying how many required unknowns it named */
  unknownsLine: string;
  /** how many names in this plan the check found outside this moment's own lists */
  unlisted: number;
  reason: string;
  passed: boolean;
  withinLimits: boolean;
  /** the exact badge wording the story template fixes */
  badge: string;
  /** one plain sentence per rule the check named, in the record's own order */
  failures: string[];
  /** the rules the card has to state on their own, because no line above already says them */
  restated: string[];
  /** the checker's own lines for this answer, written CODE: detail */
  messages: string[];
  /** the same findings with every identifier replaced by the thing it names */
  findings: string[];
}

/**
 * One line of one card as the screen renders it. The kind decides how the line is set: `lead` is
 * the sentence the card opens on, `fact` is a plain statement, `caveat` is what the record
 * qualifies that statement with, `label` heads a block, `quote` is a desk's own written words,
 * `message` is the checker's own output reproduced character for character, and `note` is the
 * standing framing or limitation that closes a card.
 */
export interface TraceLine {
  kind: "lead" | "fact" | "caveat" | "label" | "quote" | "message" | "note";
  text: string;
}
export interface TraceCard {
  id: string;
  /** 0 for the real choice, then 1 to 5 for the five steps */
  step: number;
  kicker: string;
  heading: string;
  frame: string;
  badges: string[];
  lines: TraceLine[];
}

export interface AgentTrace {
  momentId: string;
  momentNumber: number;
  index: number;
  sequence: number;
  title: string;
  decider: string;
  /** the sentence naming who had to make this decision */
  deciderLine: string;
  cutoffAt: string;
  cutoffClock: string;
  /** the deadline written out as a person says it */
  cutoffWords: string;
  registered: boolean;
  /** the badge a moment outside the registered result wears, or null where it is inside it */
  descriptiveBadge: string | null;
  flagship: boolean;
  seed: number;
  seedCount: number;
  seedLabel: string;
  sourceLabel: string;
  manifestHash: string;
  certificateHash: string;
  /** the standing limitation, which stays visible wherever a grade shows */
  limitation: string;
  known: {
    task: string;
    assumptions: string[];
    facts: TraceFact[];
    unknowns: TraceUnknown[];
    lead: string;
  };
  plain: TraceDesk | null;
  table: TraceDesk | null;
  final: TraceDesk | null;
  check: {
    called: boolean;
    messages: string[];
    findings: string[];
    finding: string;
    changes: string[];
    beforeTotal: number;
    afterTotal: number;
  };
  real: {
    summary: string;
    assignments: TraceAssignment[];
    unknowns: string[];
    sourceIds: string[];
    pool: boolean;
    unit: string;
    total: number;
    /** the one sentence that opens the recorded real choice */
    lead: string;
    /** one complete sentence per line of the recorded real choice */
    planLines: string[];
    /** the record and the simulated decision set beside each other, by kind and scale only */
    comparison: string;
  };
  cards: TraceCard[];
}

// ------------------------------------------------------------------ small readers

const str = (value: unknown, fallback = ""): string =>
  (typeof value === "string" && value ? value : fallback);
const num = (value: unknown, fallback = 0): number =>
  (typeof value === "number" && isFinite(value) ? value : fallback);

/** the three recorded ways of deciding, named by the identifier each recorded choice carries */
const PLAIN = "plain_summary";
const TABLE = "evidence_table";
const FINAL = "evidence_feedback";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/**
 * A recorded deadline read as a person says it: "12:00 on 29 July 2026". The string is taken
 * apart rather than parsed into a date, so no clock and no zone rule of the reading machine can
 * reach a sentence on screen.
 */
function deadlineWords(recorded: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(recorded);
  if (!parts) return COPY.clockOf(recorded);
  const month = MONTHS[Number(parts[2]) - 1] ?? parts[2];
  return `${parts[4]}:${parts[5]} on ${Number(parts[3])} ${month} ${parts[1]}`;
}

// ------------------------------------------------------------------ reading one recorded plan

/**
 * A place as a sentence says it. The scenario names one target that is a whole region rather than
 * a town — the Kumamoto incident area — and a sentence reads "for the Kumamoto incident area"
 * where a town reads "for Uki City". The article is decided by the target's own recorded kind, so
 * no name is edited and no new place name is invented.
 */
function placeWords(label: string, kind: string): string {
  return kind === "INCIDENT_AREA" ? `the ${label}` : label;
}

/**
 * A name in the machine form an identifier takes: lower case, joined by hyphens or underscores,
 * such as `command-support-fukuoka-city`. An answer that wrote one of these wrote something the
 * exercise's own lists do not carry, and a reader is shown it as the answer's own wording rather
 * than as the name of a thing.
 */
const looksLikeCode = (value: string) => /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(value);

function readAssignments(
  rows: RawAssignment[] | undefined,
  context: RawContext,
): TraceAssignment[] {
  const targets = context.target_labels ?? {};
  const resources = context.resource_labels ?? {};
  return (rows ?? []).map((row) => {
    const targetId = str(row.target_id);
    const resourceId = str(row.resource_id);
    const target = targets[targetId];
    const resource = resources[resourceId];
    return {
      quantity: num(row.quantity),
      targetId,
      targetLabel: placeWords(
        GLOSS.plainTarget(targetId, str(target?.label, targetId)), str(target?.kind)),
      resourceId,
      resourceLabel: GLOSS.plainResource(resourceId, str(resource?.label, resourceId)),
      targetIsCode: !target && looksLikeCode(targetId),
      resourceIsCode: !resource && looksLikeCode(resourceId),
    };
  });
}

/**
 * A plan comes in one of two shapes, and which one it is decided by the plan itself.
 *
 * Where every line of a plan sends exactly one of a differently named unit — one battalion here,
 * one liaison pair there — the plan is told by naming its units, because "1" is not a fact worth
 * a sentence. Where a plan divides a pool of interchangeable units, the plan is told by counting
 * them, and the count noun comes from the pool's own recorded kind.
 */
function isPool(assignments: TraceAssignment[]): boolean {
  if (assignments.length === 0) return false;
  const pools = new Set(assignments.map((row) => row.resourceId));
  return assignments.some((row) => row.quantity !== 1) || pools.size !== assignments.length;
}

function unitWords(assignments: TraceAssignment[], context: RawContext) {
  const resources = context.resource_labels ?? {};
  const kinds = new Set(assignments.map((row) => str(resources[row.resourceId]?.kind)));
  if (kinds.size === 1) {
    const word = COPY.TRACE.unit[[...kinds][0]];
    if (word) return word;
  }
  return COPY.TRACE.unitFallback;
}
/** the count noun for one quantity: "1 water truck", "4 water trucks" */
const unitFor = (words: { one: string; many: string }, quantity: number) =>
  (quantity === 1 ? words.one : words.many);

const totalOf = (assignments: TraceAssignment[]): number =>
  assignments.reduce((sum, row) => sum + row.quantity, 0);

/** the places a plan reaches, counted once however many lines of the plan land on each */
const placeCount = (assignments: TraceAssignment[]): number =>
  new Set(assignments.map((row) => row.targetId)).size;

// ------------------------------------------------------------------ building one desk's card

/**
 * One plain sentence for every rule the check named on one answer, in the record's own order and
 * with each rule said once however many times it was broken. A rule this page has no wording for
 * still gets a sentence, so a new rule can never pass across the screen unmentioned.
 */
function failureSentences(violations: RawViolation[]): { code: string; sentence: string }[] {
  const said = new Set<string>();
  const out: { code: string; sentence: string }[] = [];
  for (const violation of violations) {
    const code = str(violation.code);
    if (!code || said.has(code)) continue;
    said.add(code);
    out.push({ code, sentence: COPY.TRACE.rule[code] ?? COPY.TRACE.ruleUnnamed });
  }
  return out;
}

/**
 * Rules a desk card already states in its own words, further up. A card that says "it named
 * neither of the two unknowns this moment required" and then repeats "it left out an unknown this
 * moment required it to name" asks a reader to work out that two sentences are one fact.
 */
const SAID_ALREADY = new Set([
  "MISSING_REQUIRED_UNKNOWN", "UNKNOWN_ID_OUTSIDE_SLOT",
  "INELIGIBLE_TARGET", "INELIGIBLE_RESOURCE",
  "CONSTRAINT_QUANTITY", "CONSTRAINT_RESOURCE_CAPACITY",
]);

/** the checker's own message lines for one answer, written the way its own code writes them */
const checkerMessages = (violations: RawViolation[]): string[] =>
  violations.map((violation) => `${str(violation.code)}: ${str(violation.detail)}`);

/**
 * The two shapes the checker writes under `CONSTRAINT_QUANTITY`, told apart by the words the
 * record itself uses. A floor breach reads "assignment 7 (jwwa-additional-water-truck-pool ->
 * kosa-town) quantity 0 must be at least 1"; a ceiling breach reads "quantities sum to 24,
 * exceeding maximum 22". This is a pattern matched against the record's own text and never a
 * sentence anyone reads, so it is written as a pattern. As a bare string literal it was collected
 * by `app/scripts/audit-plain-text.mjs` and put in front of a judge as the fragment "must be at
 * least", which has no reading and names nothing a viewer can meet.
 */
const QUANTITY_FLOOR = /must be at least/;

/**
 * The same findings with every identifier replaced by the thing it names.
 *
 * The checker writes a finding as a rule name and an identifier, because it is talking to code:
 * `MISSING_REQUIRED_UNKNOWN: unknown-people-alive-by-time`. Those exact lines stay on the trace
 * as recorded evidence, and this is what a reader sees instead — the same finding said in the
 * words of the thing the identifier stands for, resolved through the scenario's own labels the
 * same way a place name and a unit name are resolved everywhere else on this surface.
 *
 * An identifier that resolves to nothing is left out of the sentence rather than printed. Such
 * an identifier is one the answer invented, and its own text says nothing a reader can use.
 */
function plainMessages(
  violations: RawViolation[],
  context: RawContext,
  slotContext: RawContextSlot,
  total: number,
  limit: number | null,
): string[] {
  const targets = context.target_labels ?? {};
  const resources = context.resource_labels ?? {};
  const unknownText = (id: string) => GLOSS.plainUnknown(id, str((slotContext.required_unknowns ?? [])
    .find((row) => str(row.unknown_id) === id)?.plain_text));
  const observationText = (id: string) => GLOSS.plainObservation(id, str((slotContext.known_observations ?? [])
    .find((row) => str(row.observation_id) === id)?.plain_text));
  const said = COPY.TRACE.said;

  return violations.map((violation) => {
    const code = str(violation.code);
    const detail = str(violation.detail);
    if (code === "CONSTRAINT_QUANTITY") {
      return QUANTITY_FLOOR.test(detail)
        ? said.quantityFloor
        : said.quantity(total, limit ?? total);
    }
    if (code === "CONSTRAINT_RESOURCE_CAPACITY") {
      const parts = /^(\S+) quantity (\d+) exceeds capacity (\d+)$/.exec(detail);
      if (!parts) return said.quantity(total, limit ?? total);
      const pool = GLOSS.plainResource(parts[1], str(resources[parts[1]]?.label,
        COPY.TRACE.unitFallback.many));
      return said.capacity(Number(parts[2]), Number(parts[3]), pool);
    }
    if (code === "INELIGIBLE_TARGET") {
      const target = targets[detail];
      return said.ineligibleTarget(target
        ? placeWords(GLOSS.plainTarget(detail, str(target.label, detail)), str(target.kind))
        : detail);
    }
    if (code === "INELIGIBLE_RESOURCE") {
      return said.ineligibleResource(GLOSS.plainResource(detail, str(resources[detail]?.label, detail)));
    }
    if (code === "MISSING_REQUIRED_UNKNOWN") {
      const text = unknownText(detail);
      return text ? said.missingUnknown(text) : said.missingUnknownPlain;
    }
    if (code === "UNKNOWN_ID_OUTSIDE_SLOT") return said.unknownOutside;
    if (code === "CUTOFF_INVALID_OBSERVATION" || code === "HINDSIGHT_OBSERVATION") {
      const text = observationText(detail);
      return code === "HINDSIGHT_OBSERVATION"
        ? said.hindsight
        : text ? said.cutoffObservation(text) : said.cutoffObservationPlain;
    }
    if (code === "CUTOFF_INVALID_FACTOR") {
      const text = observationText(detail);
      return text ? said.cutoffFactor(text) : said.cutoffFactorPlain;
    }
    if (code === "NO_SUPPORTING_OBSERVATION") return said.noSupport;
    if (code === "FACTOR_SET_MISMATCH") return said.factorMismatch;
    if (code === "CONSTRAINT_RESOURCE_REUSE") return said.reuse;
    if (code === "CONSTRAINT_ASSIGNMENT_COUNT") {
      const parts = /received (\d+) assignments/.exec(detail);
      return parts ? said.assignmentCount(Number(parts[1])) : said.assignmentCountPlain;
    }
    if (code === "DUPLICATE_OBSERVATION") return said.duplicateObservation;
    if (code === "DUPLICATE_FACTOR") return said.duplicateFactor;
    if (code === "DUPLICATE_UNKNOWN") return said.duplicateUnknown;
    if (code === "HINDSIGHT_FACTOR" || code === "HINDSIGHT_FINGERPRINT") return said.hindsight;
    if (code === "UNGRADABLE") return said.ungradable;
    return said.other(COPY.TRACE.rule[code] ?? COPY.TRACE.ruleUnnamed);
  });
}

/** how many names in one plan the check found outside this moment's own lists */
const unlistedCount = (violations: RawViolation[]): number =>
  violations.filter((violation) =>
    str(violation.code) === "INELIGIBLE_TARGET"
    || str(violation.code) === "INELIGIBLE_RESOURCE").length;

function buildDesk(
  choice: RawChoice | undefined,
  context: RawContext,
  slotContext: RawContextSlot,
  facts: TraceFact[],
  required: TraceUnknown[],
): TraceDesk | null {
  if (!choice) return null;
  const graphId = str(choice.graph_id);
  const decision = choice.decision ?? {};
  const assignments = readAssignments(decision.assignments, context);
  const total = totalOf(assignments);
  const pool = isPool(assignments);
  const words = unitWords(assignments, context);
  const unit = unitFor(words, total);
  const limit = typeof slotContext.action_contract?.maximum_total_quantity === "number"
    ? slotContext.action_contract.maximum_total_quantity
    : null;

  const planLines = assignments.map((row) => {
    if (pool) {
      return row.targetIsCode
        ? COPY.TRACE.planPartWrotePlace(
          `${row.quantity} ${unitFor(words, row.quantity)}`, row.targetLabel)
        : COPY.TRACE.planPartCount(row.quantity, unitFor(words, row.quantity), row.targetLabel);
    }
    if (row.resourceIsCode && row.targetIsCode) {
      return COPY.TRACE.planPartWroteBoth(row.resourceLabel, row.targetLabel);
    }
    if (row.resourceIsCode) {
      return COPY.TRACE.planPartWroteUnit(row.resourceLabel, row.targetLabel);
    }
    if (row.targetIsCode) {
      return COPY.TRACE.planPartWrotePlace(row.resourceLabel, row.targetLabel);
    }
    return COPY.TRACE.planPartNamed(row.resourceLabel, row.targetLabel);
  });

  const factSentence = new Map(facts.map((fact) => [fact.id, fact.sentence]));
  const factors: TraceFactor[] = (decision.decision_factors ?? []).map((row) => {
    const id = str(row.observation_id);
    const role = str(row.role, "UNKNOWN");
    return {
      id,
      sentence: str(factSentence.get(id), id),
      role,
      state: COPY.TRACE.factorState[role] ?? COPY.TRACE.factorState.UNKNOWN,
      known: factSentence.has(id),
    };
  });

  const acknowledged = decision.acknowledged_unknown_ids ?? [];
  const namedUnknowns = required.filter((unknown) => acknowledged.includes(unknown.id));
  const missingUnknowns = required.filter((unknown) => !acknowledged.includes(unknown.id));
  const extraUnknownCount = acknowledged
    .filter((id) => !required.some((unknown) => unknown.id === id)).length;
  const unknownsLine = required.length === 0
    ? ""
    : namedUnknowns.length === 0
      ? COPY.TRACE.unknownsNone(required.length)
      : namedUnknowns.length === required.length
        ? COPY.TRACE.unknownsAll(required.length)
        : COPY.TRACE.unknownsNamed(namedUnknowns.length, required.length);

  const violations = choice.score?.violations ?? [];
  const rules = failureSentences(violations);
  const failures = rules.map((row) => row.sentence);
  const restated = rules.slice(1)
    .filter((row) => !SAID_ALREADY.has(row.code)).map((row) => row.sentence);
  const passed = choice.score?.fully_valid === true;
  // The badge names the rule the check found first. Where one answer broke that same rule
  // several times — the water moment's plain-notes answer named six places outside the list —
  // the badge says how many, so it and the line in the card's body agree on one number.
  const firstRule = rules[0];
  const firstRuleCount = firstRule
    ? violations.filter((violation) => str(violation.code) === firstRule.code).length
    : 0;
  const countedRule = firstRule && firstRuleCount > 1
    ? COPY.TRACE.ruleCounted[firstRule.code]?.(firstRuleCount)
    : undefined;

  return {
    graphId,
    name: str(COPY.TRACE.deskName[graphId], graphId),
    what: str(COPY.TRACE.desk[graphId]),
    assignments,
    pool,
    unit,
    unitWords: words,
    total,
    limit,
    lead: assignments.length === 0
      ? COPY.TRACE.planNone
      : pool
        ? COPY.TRACE.planCount(total, unit, COPY.TRACE.places(placeCount(assignments)))
        : COPY.TRACE.planNamed(assignments.length),
    finalLead: assignments.length === 0
      ? COPY.TRACE.planNone
      : pool
        ? COPY.TRACE.finalCount(total, unit, COPY.TRACE.places(placeCount(assignments)))
        : COPY.TRACE.finalNamed(assignments.length),
    planLines,
    totalLine: pool && assignments.length > 0 ? COPY.TRACE.totalLine(total, unit) : "",
    limitLine: pool && limit !== null ? COPY.TRACE.limitLine(limit) : "",
    factors,
    namedUnknowns,
    missingUnknowns,
    extraUnknownCount,
    unknownsLine,
    unlisted: unlistedCount(violations),
    reason: str(decision.short_reason),
    passed,
    withinLimits: choice.score?.constraint_pass === true,
    badge: passed
      ? COPY.INCIDENT.badge.passed
      : COPY.INCIDENT.badge.failed(countedRule ?? failures[0] ?? COPY.TRACE.ruleUnnamed),
    failures,
    restated,
    messages: checkerMessages(violations),
    findings: plainMessages(violations, context, slotContext, total, limit),
  };
}

// ------------------------------------------------------------------ what the correction changed

/**
 * What the second answer moved, worked out by comparing the two recorded plans place by place.
 * The places are walked in the first answer's own order and then in the second's, so the same two
 * plans always produce the same sentences in the same order.
 */
function changeSentences(before: TraceDesk | null, after: TraceDesk | null): string[] {
  if (!before || !after) return [];
  const key = (row: TraceAssignment) => (after.pool ? row.targetId : `${row.resourceId}`);
  const beforeBy = new Map(before.assignments.map((row) => [key(row), row]));
  const afterBy = new Map(after.assignments.map((row) => [key(row), row]));
  const order: string[] = [];
  for (const row of before.assignments) if (!order.includes(key(row))) order.push(key(row));
  for (const row of after.assignments) if (!order.includes(key(row))) order.push(key(row));
  const out: string[] = [];
  for (const id of order) {
    const was = beforeBy.get(id);
    const now = afterBy.get(id);
    const place = str(was?.targetLabel, str(now?.targetLabel, id));
    if (was && now && was.quantity !== now.quantity) {
      out.push(COPY.TRACE.changeMoved(place, was.quantity, now.quantity));
    } else if (was && now && was.targetId !== now.targetId) {
      out.push(COPY.TRACE.changeRelocated(was.resourceLabel, was.targetLabel, now.targetLabel));
    } else if (was && !now) {
      out.push(COPY.TRACE.changeDropped(was.targetLabel, was.resourceLabel));
    } else if (!was && now) {
      out.push(COPY.TRACE.changeAdded(now.targetLabel, now.resourceLabel));
    }
  }
  if (after.pool && before.total !== after.total) {
    out.push(COPY.TRACE.changeTotals(before.total, after.total, after.unit));
  }
  // A correction can leave every unit exactly where it was and still change the answer: the
  // desk can weigh a report differently, or name an unknown it had left out. Those changes are
  // what the check asked for at several of these moments, so the card states them too.
  const beforeRole = new Map(before.factors.map((row) => [row.id, row]));
  for (const factor of after.factors) {
    const was = beforeRole.get(factor.id);
    if (was && was.role !== factor.role) {
      out.push(COPY.TRACE.changeWeighed(factor.sentence, factor.state));
    }
  }
  const beforeNamed = new Set(before.namedUnknowns.map((row) => row.id));
  for (const unknown of after.namedUnknowns) {
    if (!beforeNamed.has(unknown.id)) {
      out.push(COPY.TRACE.changeNamedUnknown(unknown.sentence));
    }
  }
  const afterNamed = new Set(after.namedUnknowns.map((row) => row.id));
  for (const unknown of before.namedUnknowns) {
    if (!afterNamed.has(unknown.id)) {
      out.push(COPY.TRACE.changeDroppedUnknown(unknown.sentence));
    }
  }
  if (out.length === 0) return [COPY.TRACE.changeNone];
  return out;
}

// ------------------------------------------------------------------ the six cards

const cap = (sentence: string) => `${COPY.sentenceCase(sentence)}.`;

function realCard(trace: AgentTrace): TraceCard {
  const lines: TraceLine[] = [{ kind: "lead", text: trace.real.summary }];
  if (trace.real.lead && trace.real.planLines.length !== 1) {
    lines.push({ kind: "fact", text: trace.real.lead });
  }
  for (const line of trace.real.planLines) lines.push({ kind: "fact", text: line });
  if (trace.real.unknowns.length > 0) {
    lines.push({ kind: "label", text: COPY.TRACE.openLabel });
    for (const unknown of trace.real.unknowns) lines.push({ kind: "fact", text: unknown });
  }
  lines.push({ kind: "note", text: COPY.TRACE.realFraming });
  return {
    id: `${trace.momentId}:real`,
    step: 0,
    kicker: COPY.TRACE.realKicker,
    heading: COPY.TRACE.head.real,
    frame: COPY.TRACE.frameReal,
    badges: [],
    lines,
  };
}

function knownCard(trace: AgentTrace): TraceCard {
  const lines: TraceLine[] = [{ kind: "lead", text: trace.known.lead }];
  if (trace.known.facts.length > 0) {
    lines.push({ kind: "label", text: COPY.TRACE.reportsLabel });
    for (const fact of trace.known.facts) {
      lines.push({ kind: "fact", text: fact.sentence });
      if (fact.caveat) lines.push({ kind: "caveat", text: fact.caveat });
    }
  }
  if (trace.known.unknowns.length > 0) {
    lines.push({ kind: "label", text: COPY.TRACE.unknownsLabel });
    lines.push({ kind: "caveat", text: COPY.TRACE.unknownsLead(trace.known.unknowns.length) });
    for (const unknown of trace.known.unknowns) {
      lines.push({ kind: "fact", text: unknown.sentence });
    }
  }
  if (trace.known.task) lines.push({ kind: "note", text: COPY.TRACE.taskLine(trace.known.task) });
  for (const assumption of trace.known.assumptions) {
    lines.push({ kind: "note", text: assumption });
  }
  return {
    id: `${trace.momentId}:known`,
    step: 1,
    kicker: COPY.TRACE.step(1, 5),
    heading: COPY.TRACE.head.known,
    frame: COPY.TRACE.frameModel,
    badges: [],
    lines,
  };
}

/**
 * One desk's card. The order puts the answer and its size at the top, so a reader who never
 * scrolls still learns what this desk proposed and whether it stayed inside the moment's limit.
 * The working — how it weighed each report, where every unit went, and its own written reason —
 * follows underneath.
 */
function deskCard(
  trace: AgentTrace, desk: TraceDesk, step: number, heading: string, id: string,
): TraceCard {
  // The opening sentence of a plan already carries its total, so the total is not said twice.
  // What it does not carry is the limit this moment set, and that is the line that decides
  // whether the answer holds, so it stands directly under it.
  const lines: TraceLine[] = [{ kind: "lead", text: desk.what }];
  lines.push({ kind: "fact", text: desk.lead });
  if (desk.limitLine) lines.push({ kind: "fact", text: desk.limitLine });
  // Where a plan is the right size and still did not hold, the reason stands here rather than
  // far below the working. A reader who sees "It proposed 22 water trucks" over "This moment
  // allowed 22" and then a failing badge otherwise has to guess why 22 was not 22.
  if (desk.unlisted > 0) lines.push({ kind: "fact", text: COPY.TRACE.unlisted(desk.unlisted) });
  if (step === 3 && desk.factors.length > 0) {
    lines.push({ kind: "label", text: COPY.TRACE.weighedLabel });
    lines.push({ kind: "caveat", text: COPY.TRACE.factorLead(desk.factors.length) });
    for (const factor of desk.factors) {
      lines.push({ kind: "fact", text: factor.sentence });
      lines.push({ kind: "caveat", text: factor.state });
    }
  }
  if (desk.planLines.length > 0) {
    lines.push({ kind: "label", text: COPY.TRACE.planLabel });
    for (const line of desk.planLines) lines.push({ kind: "fact", text: line });
  }
  if (desk.unknownsLine) lines.push({ kind: "fact", text: desk.unknownsLine });
  if (desk.extraUnknownCount > 0) {
    lines.push({ kind: "fact", text: COPY.TRACE.unknownsExtra(desk.extraUnknownCount) });
  }
  if (desk.reason) {
    // The quotation carries the record's own bytes. `plainQuoted` adds nothing but square
    // brackets. `COPY.TRACE.reasonFrame` under it says the words are the record's and points
    // back at the plan lines above, which are the one place a reader can read what this answer
    // actually asked for when the answer's own sentence miscounts its crews.
    // `COPY.TRACE.reasonBrackets` says the brackets are this page's. Where this answer used none
    // of the jargon that table covers, no bracket is added and the line explaining brackets would
    // point at nothing, so it is only printed where one exists.
    const quoted = GLOSS.plainQuoted(desk.reason);
    lines.push({ kind: "label", text: COPY.TRACE.reasonLabel });
    lines.push({ kind: "quote", text: quoted });
    lines.push({ kind: "caveat", text: COPY.TRACE.reasonFrame });
    if (quoted !== desk.reason) lines.push({ kind: "caveat", text: COPY.TRACE.reasonBrackets });
  }
  for (const failure of desk.restated) lines.push({ kind: "caveat", text: cap(failure) });
  return {
    id: `${trace.momentId}:${id}`,
    step,
    kicker: COPY.TRACE.step(step, 5),
    heading,
    frame: COPY.TRACE.frameModel,
    badges: [desk.badge],
    lines,
  };
}

function checkCard(trace: AgentTrace): TraceCard {
  const lines: TraceLine[] = [{ kind: "lead", text: COPY.TRACE.checkWhat }];
  if (trace.check.called) {
    lines.push({ kind: "label", text: COPY.TRACE.messageLabel });
    for (const finding of trace.check.findings) {
      lines.push({ kind: "message", text: finding });
    }
    lines.push({ kind: "fact", text: COPY.TRACE.checkAgain });
    lines.push({ kind: "label", text: COPY.TRACE.changeLabel });
    for (const change of trace.check.changes) lines.push({ kind: "fact", text: change });
  } else {
    lines.push({ kind: "fact", text: COPY.TRACE.checkClean });
  }
  return {
    id: `${trace.momentId}:check`,
    step: 4,
    kicker: COPY.TRACE.step(4, 5),
    heading: COPY.TRACE.head.check,
    frame: COPY.TRACE.frameModel,
    badges: [],
    lines,
  };
}

/**
 * The card the walk-through ends on. The order is deliberate: the final action and its grade, then
 * the record set beside it, and only then the plan place by place. The comparison is the thing a
 * reader came for, so it stands above the fold rather than under a list of eight lines.
 */
function finalCard(trace: AgentTrace, desk: TraceDesk): TraceCard {
  const lines: TraceLine[] = [];
  lines.push({ kind: "lead", text: desk.finalLead });
  if (desk.limitLine) lines.push({ kind: "fact", text: desk.limitLine });
  if (desk.unknownsLine) lines.push({ kind: "fact", text: desk.unknownsLine });
  for (const failure of desk.restated) lines.push({ kind: "caveat", text: cap(failure) });
  lines.push({ kind: "caveat", text: COPY.INCIDENT.definition });
  lines.push({ kind: "label", text: COPY.TRACE.compareLabel });
  lines.push({ kind: "fact", text: trace.real.summary });
  lines.push({ kind: "fact", text: trace.real.comparison });
  lines.push({ kind: "caveat", text: COPY.TRACE.compareClaim });
  if (desk.planLines.length > 1) {
    lines.push({ kind: "label", text: COPY.TRACE.finalLabel });
    for (const line of desk.planLines) lines.push({ kind: "fact", text: line });
  }
  const badges = [desk.badge];
  if (trace.descriptiveBadge) badges.push(trace.descriptiveBadge);
  return {
    id: `${trace.momentId}:final`,
    step: 5,
    kicker: COPY.TRACE.step(5, 5),
    heading: COPY.TRACE.head.final,
    frame: COPY.TRACE.frameModel,
    badges,
    lines,
  };
}

// ------------------------------------------------------------------ building every trace

export interface TraceOptions {
  /** which of the recorded runs of each moment the walk-through follows */
  seed: number;
  /** the moment the directed watch stops at and opens by itself */
  flagshipMomentId: string;
  /** how many events the recorded file holds, for the line saying where the words came from */
  eventCount: number;
}

/**
 * Every moment of decision in the record, in the order the record holds them. A moment whose file
 * carries no recorded model choice for the chosen run still produces a walk-through: the real
 * choice and what was known are read from the record all the same, and the steps with nothing
 * behind them are left out rather than filled in.
 */
export function buildTraces(
  events: RawDecisionEvent[],
  context: RawContext | null | undefined,
  options: TraceOptions,
): AgentTrace[] {
  const ctx: RawContext = context ?? {};
  const slots = ctx.slots ?? {};
  const traces: AgentTrace[] = [];
  let index = 0;

  for (const event of events) {
    const payload = event.payload ?? {};
    const slot = payload.decision_slot;
    if (!slot) continue;
    const momentId = str(slot.decision_slot_id, str(event.event_id));
    const slotContext = slots[momentId] ?? {};
    const registeredBlock = payload.registered_five_slot_experiment;
    const registered = Boolean(registeredBlock && (registeredBlock.choices ?? []).length > 0);
    const block = registered ? registeredBlock : payload.full_incident_demonstration;
    const choices = block?.choices ?? [];
    const seeds = [...new Set(choices.map((choice) => num(choice.seed, -1)))]
      .filter((seed) => seed >= 0).sort((a, b) => a - b);
    const seed = seeds.includes(options.seed) ? options.seed : (seeds[0] ?? options.seed);
    const mine = choices.filter((choice) => num(choice.seed, -1) === seed);
    const pick = (graph: string) => mine.find((choice) => str(choice.graph_id) === graph);

    // Every sentence below is read through `gloss.ts`, which holds the plain English shown in
    // place of the recording's own words. The recording is never edited; the lookup falls back to
    // its wording whenever the table has no entry for an identifier.
    const facts: TraceFact[] = (slotContext.known_observations ?? []).map((row) => ({
      id: str(row.observation_id),
      sentence: GLOSS.plainObservation(str(row.observation_id), str(row.plain_text)),
      caveat: row.caveat
        ? GLOSS.plainObservationCaveat(str(row.observation_id), str(row.caveat)) : "",
    })).filter((fact) => fact.sentence !== "");
    const unknowns: TraceUnknown[] = (slotContext.required_unknowns ?? []).map((row) => ({
      id: str(row.unknown_id),
      sentence: GLOSS.plainUnknown(str(row.unknown_id), str(row.plain_text)),
    })).filter((unknown) => unknown.sentence !== "");

    const plain = buildDesk(pick(PLAIN), ctx, slotContext, facts, unknowns);
    const table = buildDesk(pick(TABLE), ctx, slotContext, facts, unknowns);
    const final = buildDesk(pick(FINAL), ctx, slotContext, facts, unknowns);

    const cutoffAt = str(slot.cutoff_at);
    const historical = slot.historical_choice ?? {};
    const realAssignments = readAssignments(historical.assignments, ctx);
    const realPool = isPool(realAssignments);
    const realWords = unitWords(realAssignments, ctx);
    const realTotal = totalOf(realAssignments);
    const realUnit = unitFor(realWords, realTotal);

    // The comparison is drawn only where the record and the simulated decision draw on the same
    // pools of units. Where they name different kinds of action, the card says so and compares
    // nothing, because a number set beside a different kind of number is a false comparison.
    const realPools = new Set(realAssignments.map((row) => row.resourceId));
    const modelPools = new Set((final?.assignments ?? []).map((row) => row.resourceId));
    const sameKind = realPools.size > 0 && modelPools.size > 0
      && [...modelPools].every((pool) => realPools.has(pool));
    const comparison = realAssignments.length === 0
      ? COPY.TRACE.compareNone
      : !final || !sameKind
        ? COPY.TRACE.compareDifferent
        : realPool
          ? COPY.TRACE.compareSame(realTotal, final.total, realUnit)
          : COPY.TRACE.compareNamed(realAssignments.length, final.assignments.length);

    const trace: AgentTrace = {
      momentId,
      momentNumber: num(slot.reconstruction_slot_number, index + 1),
      index,
      sequence: num(event.sequence, index),
      title: GLOSS.plainSlotTitle(momentId, str(slot.title)),
      decider: GLOSS.plainDecider(momentId, str(slot.decider)),
      deciderLine: COPY.TRACE.decider(GLOSS.plainDecider(momentId, str(slot.decider))),
      cutoffAt,
      cutoffClock: COPY.clockOf(cutoffAt),
      cutoffWords: deadlineWords(cutoffAt),
      registered,
      descriptiveBadge: registered ? null : COPY.INCIDENT.badge.descriptive,
      flagship: momentId === options.flagshipMomentId,
      seed,
      seedCount: seeds.length,
      seedLabel: COPY.TRACE.seedLine(seed, seeds.length),
      sourceLabel: COPY.TRACE.source(options.eventCount),
      manifestHash: str(block?.manifest_hash),
      certificateHash: str(mine[0]?.certificate_hash),
      limitation: COPY.INCIDENT.limitation,
      known: {
        task: GLOSS.plainSlotTask(momentId, str(slot.task)),
        assumptions: (slot.assumptions ?? []).map((line, at) =>
          GLOSS.plainAssumption(momentId, at, str(line))),
        facts,
        unknowns,
        lead: facts.length > 0
          ? COPY.TRACE.knownLead(facts.length, deadlineWords(cutoffAt))
          : COPY.TRACE.knownNone,
      },
      plain,
      table,
      final,
      check: {
        called: (table?.messages.length ?? 0) > 0,
        messages: table?.messages ?? [],
        findings: table?.findings ?? [],
        finding: table && table.limit !== null && table.total > table.limit
          ? COPY.TRACE.checkQuantity(table.total, table.limit)
          : table && table.failures.length > 0
            ? COPY.TRACE.checkRules(table.failures.length)
            : "",
        changes: changeSentences(table, final),
        beforeTotal: table?.total ?? 0,
        afterTotal: final?.total ?? 0,
      },
      real: {
        summary: GLOSS.plainHistoricalSummary(momentId, str(historical.summary)),
        assignments: realAssignments,
        unknowns: (historical.unknowns ?? []).map((line, at) =>
          GLOSS.plainHistoricalUnknown(momentId, at, str(line))),
        sourceIds: historical.source_ids ?? [],
        pool: realPool,
        unit: realUnit,
        total: realTotal,
        lead: realAssignments.length === 0
          ? COPY.TRACE.realNone
          : realPool
            ? COPY.TRACE.realCount(realTotal, realUnit, COPY.TRACE.places(placeCount(realAssignments)))
            : COPY.TRACE.realNamed(realAssignments.length),
        planLines: realAssignments.map((row) => (realPool
          ? COPY.TRACE.realPartCount(row.quantity, unitFor(realWords, row.quantity), row.targetLabel)
          : COPY.TRACE.realPartNamed(row.resourceLabel, row.targetLabel))),
        comparison,
      },
      cards: [],
    };

    trace.cards.push(realCard(trace));
    trace.cards.push(knownCard(trace));
    if (plain) trace.cards.push(deskCard(trace, plain, 2, COPY.TRACE.head.plain, "plain"));
    if (table) trace.cards.push(deskCard(trace, table, 3, COPY.TRACE.head.table, "table"));
    trace.cards.push(checkCard(trace));
    if (final) trace.cards.push(finalCard(trace, final));

    traces.push(trace);
    index++;
  }
  return traces;
}
