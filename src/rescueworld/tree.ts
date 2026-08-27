/**
 * RESCUE WORLD — the decision tree.
 *
 * Every moment in the record when somebody had to decide something, on one luminous line, one at
 * a time. Eleven beacons stand in order along that line. Exactly one of them is open, and that
 * one says what the software agents chose to do at that minute: what they sent, how many, where
 * it went, why they chose it and what the prewritten check made of it. Up to four branches bloom
 * from the open beacon, one for each piece of that action. What the real responders were recorded
 * doing stands under its own heading, separate from the proposal. How that answer was produced
 * and tested — the three ways of working, their eight recorded tries each, and the checker's own
 * findings — opens only at the five graded moments and only when somebody asks for it.
 *
 * Three contracts govern this file and all three are in the repository.
 * `docs/rescueworld/ACTION-FIRST-PRESENTATION-CONTRACT.md` fixes what leads: the action, then the
 * reason, then the unknowns, then the check, then the public record, and experiment machinery
 * last and behind a press. `docs/rescueworld/DECISION-TREE-SPEC.md` fixes what appears when: the
 * order things open in and the rule that no level below the one a person asked for may be on
 * screen. `docs/rescueworld/DEATH-STRANDING-REFERENCE.md` fixes how it looks: the world recedes
 * behind a scrim rather than being replaced by a void, panels are corners rather than frames, a
 * section break is a row of dots, selection is a light passing across, and only the selected
 * thing explains itself.
 *
 * What this file may and may not do.
 *
 *   It reads. Every title, deadline, grade, count and recorded try below comes from the
 *   walk-throughs `trace.ts` already built out of the sealed record and from the frozen
 *   experiment's own contract file, which `highlights.ts` reads. Nothing here re-derives a
 *   grade, adds a number up across moments, or writes a sentence about an answer the record does
 *   not hold. Where the record holds nothing, the screen says so and stops.
 *
 *   It never draws a future. A recorded answer is an answer and a verdict. It never continues
 *   into the next moment, never joins two moments together and never states a consequence,
 *   because no part of this project ever simulated what the world would have become after a
 *   different choice. The closing sentence on the screen says exactly that, always.
 *
 *   It opens no walk-through of its own. The control on an open try calls back into the six-card
 *   walk-through the page already has, at the card that answer lives on.
 *
 * Determinism: no clock, no random source. `buildTree` is a pure function of the record, so the
 * same baked file always produces the same beacons in the same order, and a gate can read
 * `window.__HERO.treeState()` without moving the run. The breathing of a beacon and the sweep
 * along the line are stylesheet animations on real elapsed time, the same as the page's existing
 * bracket reveals; they touch no replay state and no gate reads them.
 */
import * as COPY from "./copy";
import * as GLOSS from "./gloss";
import { stripOf, type Highlights, type HighlightMethod } from "./highlights";
import type { AgentTrace, TraceDesk } from "./trace";

/** the three recorded ways of working, named by the identifier each recorded choice carries */
const METHODS = ["plain_summary", "evidence_table", "evidence_feedback"] as const;
/** which of the walk-through's six cards each way of working is written on */
const CARD_SUFFIX: Record<string, string> = {
  plain_summary: ":plain",
  evidence_table: ":table",
  evidence_feedback: ":final",
};
/** twelve hours, in seconds: the step the record's own length is carried up to */
const TICK_SECONDS = 12 * 3600;

/** one of the eight recorded tries of one way of working at one moment */
export interface TreeSeed {
  /** where this try stands in the recorded order, counted from one */
  order: number;
  /** the number the record itself gives this try, which is how its own answer is read back */
  seed: number;
  /** true where this try passed every prewritten check */
  passed: boolean;
  /** true where this try chose the set of choices most of the eight tries chose */
  agreed: boolean;
  /** how many rules the check named against this try */
  violations: number;
  /** the first rule it broke, in the plain wording the walk-through already uses */
  rule: string;
  /** true where the six-card walk-through follows this try and no other */
  walkthrough: boolean;
}

/** one way of working at one moment, with everything the frozen experiment recorded about it */
export interface TreeMethod {
  /** the identifier the record gives this way of working. Never shown. */
  method: string;
  /**
   * What the agent working this way actually asked for at this moment, in one sentence: what it
   * sent, how many and where. It is the walk-through's own recorded try, so the card, the ledger
   * and the walk-through all describe the same answer.
   */
  action: string;
  /** the two-or-three-word tag for the way of working, which is all a card says about it */
  tag: string;
  passes: number;
  tries: number;
  /** how many tries chose the set of choices most of them chose */
  agreement: number;
  seeds: TreeSeed[];
  /** the card of the walk-through this way of working is written on */
  card: number;
  /** the grade the walk-through's own recorded try earned, in the ledger's exact wording */
  badge: string;
  /** whether that one recorded try passed, or null where the record kept none */
  passed: boolean | null;
}

/** one piece of a recorded action: one unit and where it went, or one place and how many */
export interface TreeSpot {
  /** what the card says on its first line, in the plain words the record's own labels give it */
  label: string;
  /** the card's second line, which says where that piece of the action went */
  note: string;
  /** the place it reached, named on its own */
  place: string;
  /** the capability grouped on this card, empty when the card is grouped only by place */
  group: string;
  /** how many units the action sent there */
  quantity: number;
  /** one complete sentence for every line of the plan that landed there */
  lines: string[];
}

/** why one recorded answer chose what it chose, read off that answer and nothing else */
export interface TreeWhy {
  /** the reports it weighed that this moment made available, in its own order */
  reports: string[];
  /** how many reports it weighed that this moment never made available */
  outside: number;
  /** which of the unknowns this moment required it named */
  unknowns: string;
  /** the answer's own written reason, word for word, with this page's brackets around jargon */
  reason: string;
  /** true where a bracket was added, so the line explaining brackets is only printed then */
  bracketed: boolean;
}

/** one moment of decision: one beacon on the line, and everything that opens under it */
export interface TreeJunction {
  momentId: string;
  /** the number this moment carries in the record */
  number: number;
  /** where it stands along the line, left to right, counted from zero */
  order: number;
  /** how far into the recorded seventy-two hours it happened, from zero to one */
  at: number;
  /** its deadline as a clock reading, for the face of the beacon */
  clock: string;
  /** its deadline written out as a person says it */
  when: string;
  /** the two-to-four-word handle this screen gives the moment */
  locator: string;
  /** the moment itself, in the plain words the rail and the ledger already use */
  title: string;
  /** what the responders actually did, as the public record has it */
  real: string;
  /** true where this moment belongs to the frozen registered experiment */
  registered: boolean;
  /**
   * What the software agents finally proposed at this moment, in one sentence. It is read off the
   * last recorded answer of the run this record holds for this moment — the frozen registered
   * experiment's own final answer at the five moments inside it, and the replayed demonstration's
   * final answer at the other six.
   */
  action: string;
  /** the pieces of that action, in the plan's own order */
  spots: TreeSpot[];
  /** true where each of those pieces is one unit rather than one place */
  byUnit: boolean;
  /** true where this moment's answer chooses where to look first rather than what to send */
  checkFirst: boolean;
  /** what the prewritten check made of that one answer, in one sentence */
  verdict: string;
  /** why that answer chose what it chose */
  why: TreeWhy | null;
  /** the three ways of working, or nothing where the experiment graded no answer here */
  methods: TreeMethod[];
}

export interface TreeModel {
  junctions: TreeJunction[];
  /** how long the record is, in hours, read from the record */
  hours: number;
  /** the standing limitation, shown wherever a graded result is */
  limitation: string;
}

/**
 * The record's length in seconds, read from the record itself: its last recorded second, carried
 * up to the next whole twelve hours. The full incident's last recorded second is exactly
 * seventy-two hours, so the line covers exactly the seventy-two hours the record covers.
 */
export function windowSecondsOf(lastRecordedSecond: number): number {
  const held = Math.max(TICK_SECONDS, lastRecordedSecond);
  return Math.ceil(held / TICK_SECONDS) * TICK_SECONDS;
}

/** the eight recorded tries of one way of working, read from the frozen contract and nowhere else */
function seedsOf(counts: HighlightMethod, walkSeed: number): TreeSeed[] {
  // `stripOf` already decides which tries belong to the largest group that chose the same set of
  // places, by the rule written down in `highlights.ts`. This reads that decision rather than
  // making a second one, so these cells and the ledger's cells can never disagree.
  const strip = stripOf(counts);
  return strip.cells.map((cell, at) => {
    const outcome = counts.outcomes[at];
    const code = outcome?.first_violation_code ?? null;
    return {
      order: at + 1,
      seed: cell.seed,
      passed: cell.passed,
      agreed: cell.agreed,
      violations: outcome?.violation_count ?? 0,
      rule: code ? COPY.TRACE.rule[code] ?? COPY.TRACE.ruleUnnamed : "",
      walkthrough: cell.seed === walkSeed,
    };
  });
}

/**
 * What one recorded answer asked for, in one sentence: what it sent, how many and where.
 *
 * Every part of the sentence is read off the recorded answer. The places are the plan's own
 * places in the plan's own order, with the quantities landing on one place added together. The
 * word the units are counted in comes from the kind the record gives them, and a plan that mixes
 * kinds or names units this moment never offered is counted in units, because no one word is
 * true of all of them. A moment whose answer chooses where to look first rather than what to
 * send says that instead, because nothing is sent at that moment.
 *
 * Where a plan reaches more than four places or names more than four units, the sentence names
 * the first four and says exactly how many remain. The full list stays one level further in.
 */
export function actionOf(desk: TraceDesk | null): string {
  if (!desk || desk.assignments.length === 0) return COPY.TREE.actionNone;
  const MAX_VISIBLE = 4;
  const join = (items: string[]) => {
    if (items.length < 2) return items[0] ?? "";
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  };
  // A moment that picks a course of action sends nothing anywhere, so its sentence names what was
  // chosen. Where a choice lands on one named place rather than on the whole earthquake area, the
  // place is named with it.
  if (COPY.TREE.chooseKinds.includes(desk.kind)) {
    // A decision that covers the whole earthquake area has one place and naming it after every
    // choice says nothing. A decision that puts its choices on named places has to name them,
    // and a choice that reads "first place to re-check" is only half a sentence without one.
    const wholeArea = desk.assignments
      .every((row) => row.targetKind === COPY.TREE.wholeAreaKind);
    const items = desk.assignments.map((row) =>
      (wholeArea ? row.resourceLabel
        : COPY.TREE.pickedAt(row.resourceLabel, row.targetLabel)));
    const shown = items.slice(0, MAX_VISIBLE);
    if (items.length > MAX_VISIBLE) {
      shown.push(COPY.TREE.actionMoreUnits(items.length - MAX_VISIBLE));
    }
    return COPY.TREE.actionPicked(shown);
  }
  // A mixed plan is grouped by capability and destination. The earlier version repeated eight
  // full resource names here, which made the most important sentence the hardest one to read.
  // Origins and individual resource names remain in the branch drawer and walkthrough.
  if (!desk.kind) {
    const groups: { target: string; kind: string; label: string; quantity: number }[] = [];
    for (const row of desk.assignments) {
      const known = COPY.TREE.actionUnit[row.resourceKind];
      const kind = row.resourceKind || row.resourceId;
      const held = groups.find((group) => group.target === row.targetLabel && group.kind === kind);
      if (held) held.quantity += row.quantity;
      else groups.push({
        target: row.targetLabel,
        kind,
        label: known?.one ?? row.resourceLabel,
        quantity: row.quantity,
      });
    }
    const sayGroup = (group: typeof groups[number]) => {
      const known = COPY.TREE.actionUnit[group.kind];
      return `${COPY.countWord(group.quantity)} ${group.quantity === 1
        ? (known?.one ?? group.label) : (known?.many ?? group.label)}`;
    };
    const targets = [...new Set(groups.map((group) => group.target))];
    if (targets.length === 1) {
      return COPY.TREE.actionGrouped(desk.total, targets[0], join(groups.map(sayGroup)));
    }
    const items = targets.map((target) => COPY.TREE.pickedAt(
      join(groups.filter((group) => group.target === target).map(sayGroup)), target));
    const shown = items.slice(0, MAX_VISIBLE);
    if (items.length > MAX_VISIBLE) {
      shown.push(COPY.TREE.actionMorePlaces(items.length - MAX_VISIBLE));
    }
    return COPY.TREE.actionPicked(shown);
  }
  const words = COPY.TREE.actionUnit[desk.kind] ?? COPY.TRACE.unitFallback;
  const places: { label: string; quantity: number }[] = [];
  for (const row of desk.assignments) {
    const held = places.find((place) => place.label === row.targetLabel);
    if (held) held.quantity += row.quantity;
    else places.push({ label: row.targetLabel, quantity: row.quantity });
  }
  const said = (quantity: number) =>
    `${COPY.countWord(quantity)} ${quantity === 1 ? words.one : words.many}`;
  const [first, second] = places;
  if (desk.kind === COPY.TREE.checkFirstKind) {
    if (places.length === 1) return COPY.TREE.checkOne(first.label);
    if (places.length === 2) return COPY.TREE.checkTwo(first.label, second.label);
    const shown = places.slice(0, MAX_VISIBLE);
    const words = join(shown.map((place) => place.label));
    return places.length > MAX_VISIBLE
      ? COPY.TREE.checkManyMore(words, places.length - MAX_VISIBLE)
      : COPY.TREE.checkMany(words);
  }
  if (places.length === 1) return COPY.TREE.actionOne(said(desk.total), first.label);
  if (places.length === 2) {
    return first.quantity === second.quantity
      ? COPY.TREE.actionEach(said(first.quantity), first.label, second.label)
      : COPY.TREE.actionSplit(
        said(first.quantity), first.label, said(second.quantity), second.label);
  }
  const items = places.map((place) => `${said(place.quantity)} to ${place.label}`);
  const shown = items.slice(0, MAX_VISIBLE);
  if (items.length > MAX_VISIBLE) {
    shown.push(COPY.TREE.actionMorePlaces(items.length - MAX_VISIBLE));
  }
  return COPY.TREE.actionPicked(shown);
}

/**
 * The pieces of one recorded action, one per branch card.
 *
 * A plan comes in shapes and the cards follow the shape. Where the plan sends one of each
 * differently named unit, or picks a course of action, a card is one of those and where it went.
 * Where it divides a pool of interchangeable units, a card is one place and how many went there.
 * A plan that names units this moment never offered has no unit name a reader can trust, so it is
 * grouped by place too.
 *
 * The lines under a card are the plan's own sentences for that card, so opening one says exactly
 * what the record holds and nothing more.
 */
function spotsOf(desk: TraceDesk | null): TreeSpot[] {
  if (!desk) return [];
  const checkFirst = desk.kind === COPY.TREE.checkFirstKind;
  const byUnit = byUnitOf(desk);
  const words = COPY.TREE.actionUnit[desk.kind] ?? COPY.TRACE.unitFallback;
  const out: TreeSpot[] = [];
  desk.assignments.forEach((row, at) => {
    const line = desk.planLines[at] ?? "";
    // Mixed plans get one branch per capability at each destination: “4 fire brigades,” not
    // four nearly identical cards. The drawer still names every brigade and its origin.
    const mixedGroup = !desk.kind && !row.resourceIsCode;
    const groupLabel = mixedGroup
      ? (COPY.TREE.actionUnit[row.resourceKind]?.one ?? row.resourceLabel) : "";
    const held = mixedGroup
      ? out.find((spot) => spot.place === row.targetLabel && spot.group === row.resourceKind)
      : byUnit ? undefined : out.find((spot) => spot.place === row.targetLabel);
    if (held) {
      held.quantity += row.quantity;
      if (line) held.lines.push(line);
    } else {
      out.push({
        label: mixedGroup ? groupLabel : byUnit ? row.resourceLabel : "",
        note: byUnit ? COPY.TREE.spotTo(row.targetLabel) : "",
        place: row.targetLabel,
        group: mixedGroup ? row.resourceKind : "",
        quantity: row.quantity,
        lines: line ? [line] : [],
      });
    }
  });
  // a card grouped by place can only be named once its own quantity is known
  for (const spot of out) {
    if (spot.group) {
      const known = COPY.TREE.actionUnit[spot.group];
      spot.label = `${COPY.countWord(spot.quantity)} ${spot.quantity === 1
        ? (known?.one ?? spot.label) : (known?.many ?? spot.label)}`;
      continue;
    }
    if (spot.label) continue;
    if (checkFirst) {
      spot.label = spot.place;
      spot.note = COPY.TREE.spotCheck;
      continue;
    }
    spot.label = COPY.TREE.spot(
      `${COPY.countWord(spot.quantity)} ${spot.quantity === 1 ? words.one : words.many}`);
    spot.note = COPY.TREE.spotTo(spot.place);
  }
  return out;
}

/** true where a plan's cards are one thing each rather than one place each */
function byUnitOf(desk: TraceDesk | null): boolean {
  if (!desk) return false;
  return desk.kind !== COPY.TREE.checkFirstKind && !desk.pool
    && !desk.assignments.some((row) => row.resourceIsCode);
}

/**
 * Why one recorded answer chose what it chose, read off that answer alone.
 *
 * The reports are the ones it wrote a weighing for, said in the record's own plain words. A
 * report it weighed that this moment never made available has no wording a reader can look up —
 * its identifier stands for nothing on this screen — so those are counted rather than named.
 * The last line is the answer's own written reason, kept word for word.
 */
function whyOf(desk: TraceDesk | null): TreeWhy | null {
  if (!desk) return null;
  const known = desk.factors.filter((factor) => factor.known);
  const reason = desk.reason ? GLOSS.plainQuoted(desk.reason) : "";
  return {
    reports: known.map((factor) => `${factor.sentence} ${factor.state}`),
    outside: desk.factors.length - known.length,
    unknowns: desk.unknownsLine,
    reason,
    bracketed: reason !== desk.reason,
  };
}

/** one way of working, read off one recorded answer and the frozen experiment's own counts */
function methodOf(
  trace: AgentTrace, method: string, desk: TraceDesk | null, counts: HighlightMethod | null,
): TreeMethod {
  const suffix = CARD_SUFFIX[method] ?? "";
  const card = trace.cards.findIndex((held) => held.id.endsWith(suffix));
  return {
    method,
    // the action a card leads with is this way of working's own recorded try, and where the
    // record kept none the card says so rather than describing an answer nobody gave
    action: desk ? actionOf(desk) : COPY.TREE.notRecorded,
    tag: COPY.TREE.methodTag[method] ?? "",
    passes: counts?.passes ?? 0,
    tries: counts?.tries ?? 0,
    agreement: counts?.largest_same_choice_count ?? 0,
    seeds: counts ? seedsOf(counts, trace.seed) : [],
    card: card >= 0 ? card : 0,
    // the grade is the walk-through's own badge, so the line, the ledger and the walk-through can
    // never say three different things about one answer
    badge: desk ? desk.badge : COPY.TREE.notRecorded,
    passed: desk ? desk.passed : null,
  };
}

/**
 * The whole picture, built once out of the record.
 *
 * `secondsOf` gives the recorded second of each moment, which is what puts the beacons in order
 * and what each beacon's own recorded time is read from. A moment the record gives no second for
 * is left off the line rather than placed at a second this file made up.
 */
export function buildTree(
  traces: AgentTrace[],
  secondsOf: Map<string, number>,
  highlights: Highlights | null,
  windowSeconds: number,
): TreeModel {
  const span = Math.max(1, windowSeconds);
  const junctions: TreeJunction[] = [];
  for (const trace of traces) {
    const second = secondsOf.get(trace.momentId);
    if (second === undefined) continue;
    junctions.push({
      momentId: trace.momentId,
      number: trace.momentNumber,
      order: 0,
      at: Math.max(0, Math.min(1, second / span)),
      clock: trace.cutoffClock,
      when: trace.cutoffWords,
      locator: COPY.TREE_LOCATOR[trace.momentId] ?? trace.title,
      title: trace.title,
      real: trace.real.summary,
      registered: trace.registered,
      // What the agents proposed comes first at every moment, graded or not. It is the last
      // recorded answer of whichever run this record holds for this moment.
      action: trace.final ? actionOf(trace.final) : COPY.TREE.notRecorded,
      spots: spotsOf(trace.final),
      byUnit: byUnitOf(trace.final),
      checkFirst: trace.final?.kind === COPY.TREE.checkFirstKind,
      verdict: trace.final
        ? COPY.TREE.actionVerdict(trace.final.badge) : COPY.TREE.notRecorded,
      why: whyOf(trace.final),
      // Only the five moments inside the frozen experiment carry the evidence view. The other
      // six carry the action, the record and one sentence saying the experiment left them out.
      methods: trace.registered
        ? METHODS.map((method) => methodOf(
          trace, method,
          method === "plain_summary" ? trace.plain
            : method === "evidence_table" ? trace.table : trace.final,
          highlights?.method(trace.momentId, method) ?? null,
        ))
        : [],
    });
  }
  // one line, in recorded time order, and the beacons never leave it
  junctions.sort((a, b) => a.at - b.at);
  // A clock reading alone repeats itself across three days, so the first beacon of each new day
  // carries that day beside its time. The day is read out of the deadline the record already
  // wrote out in words, so no clock of the reading machine reaches the screen.
  let day = "";
  junctions.forEach((junction, order) => {
    junction.order = order;
    const said = /on (\d+) ([A-Za-z]+)/.exec(junction.when);
    const here = said ? `${said[1]} ${said[2].slice(0, 3)}` : "";
    if (here && here !== day) { day = here; junction.clock = `${here} ${junction.clock}`; }
  });
  return {
    junctions,
    hours: Math.round(span / 3600),
    limitation: highlights?.contract.wording.standing_limitation ?? COPY.INCIDENT.limitation,
  };
}

// ------------------------------------------------------------------ drawing it

function make(tag: string, className: string, text = ""): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function control(className: string, text = ""): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** the four corner brackets the whole page opens its containers with */
function corners(): HTMLElement {
  const rv = make("div", "rv");
  for (const at of ["tl", "tr", "bl", "br"]) rv.append(make("i", at));
  return rv;
}

/** a section break: a row of small dots, which is what this register uses instead of a rule */
function dots(): HTMLElement {
  return make("div", "tdots");
}

/** what a caller keeps hold of after the screen is drawn */
export interface TreeHandle {
  /** open the moment the run has reached, or the first one if none has passed yet */
  selectAt(reached: (momentId: string) => boolean): void;
  /**
   * Close one level of detail. True when a level was closed, so a caller can spend the first
   * escape on the detail and the next one on the whole screen.
   */
  collapse(): boolean;
  /**
   * Put the keyboard on the beacon that is open. The screen calls this the moment it opens, so
   * the arrow keys walk the line straight away rather than after a reader has hunted for the row.
   */
  focusSelected(): void;
  /**
   * Measure the branches again now the frame is on screen. A hidden frame measures zero, and the
   * screen is written before it is shown, so a caller says when the sizes are real.
   */
  shown(): void;
  /** where the screen stands, for a gate that reads it without touching it */
  state(): {
    moment: string | null; momentNumber: number; restShown: boolean; methodsShown: boolean;
    branchNodes: number; spot: number; methodNodes: number; method: string | null;
    seedCells: number; seed: number; drawers: number; nodes: number;
  };
}

/**
 * Write the whole screen into a frame.
 *
 * One moment is open at any time and nothing below it opens until it is asked for. Pointing at a
 * beacon only lifts it; opening it takes a click, a tap, enter or space, and what opens stays
 * open when the pointer goes away. The up and down keys walk the line, the right key goes one
 * level further in, the left key comes one level back out, and the number keys one to eight open
 * one of the eight recorded tries while a way of working is open.
 *
 * `reveal` is the page's own container opening — corner brackets travelling out from a crosshair
 * to the container's corners, then the writing arriving inside them. It is passed in rather than
 * written again here, so this screen opens its panels exactly the way every other surface on the
 * page opens its own.
 *
 * `deskAt` reads one recorded try back out of the record, on the press that opens it and not
 * before. Every sentence a try shows comes through it, so the screen states what the record holds
 * for that exact try and nothing else.
 */
export function drawTree(
  host: HTMLElement,
  model: TreeModel,
  open: (momentId: string, card: number) => void,
  reveal: (box: HTMLElement) => void,
  deskAt: (momentId: string, method: string, seed: number) => TraceDesk | null,
): TreeHandle {
  host.textContent = "";

  // ---- what is open right now. Everything on screen is drawn from these six values.
  let atMoment = 0;
  /** which of the places that moment's action reached is open, or none */
  let atSpot = -1;
  /** whether the reasons behind that action are open */
  let restShown = false;
  /** whether the frozen experiment's own evidence is open, which only a graded moment has */
  let testedShown = false;
  let atMethod = -1;
  let atSeed = -1;
  /** the most places a row of cards holds before the rest are named in the panel instead */
  const SPOT_CARDS = 4;

  const head = make("div", "thead");
  head.append(make("div", "tkicker", COPY.TREE.title));
  head.append(make("p", "tpurpose", COPY.TREE.purpose));
  head.append(make("p", "tqual", COPY.TREE.qualifier));
  host.append(head);

  /**
   * How to read the two colours, said once and only where they are drawn. Blue and orange belong
   * to the eight recorded tries and to nothing else on this screen, so the legend stands beside
   * those eight cells rather than over a screen that has none.
   */
  function legendNode(): HTMLElement {
    const legend = make("div", "tkey");
    legend.append(make("i", "tkeydot pass"));
    legend.append(make("i", "tkeydot fail"));
    legend.append(make("span", "tkeysay", COPY.TREE.legend));
    return legend;
  }

  // ---- the line: one luminous ribbon with a slow sweep along it, eleven beacons standing on it
  const spineWrap = make("div", "tspinewrap");
  const ribbon = make("div", "tribbon");
  ribbon.append(make("i", "tsweep"));
  ribbon.append(make("i", "tcap left"));
  ribbon.append(make("i", "tcap right"));
  spineWrap.append(ribbon);
  const spine = make("div", "tspine");
  // The row is one thing a reader chooses from, not eleven separate controls. Naming it that way
  // is what lets one beacon be the row's single tab stop and the arrow keys move the choice
  // inside it, which is how every list of this kind behaves.
  spine.setAttribute("role", "listbox");
  spine.setAttribute("aria-label", COPY.TREE.spineLabel);
  const beacons: HTMLButtonElement[] = [];
  /** the cell each beacon stands in, which is where its three branches bloom from */
  const blooms: HTMLElement[] = [];
  model.junctions.forEach((junction, at) => {
    const cell = make("div", "tcell");
    // the cell is where a beacon's branches bloom from and nothing a reader meets, so it is left
    // out of what a screen reader walks: the row holds beacons, and the beacon is the choice
    cell.setAttribute("role", "presentation");
    const beacon = control("tnode");
    beacon.setAttribute("role", "option");
    // one tab stop for the whole row, moved to whichever beacon is open by `draw`
    beacon.tabIndex = -1;
    beacon.setAttribute("aria-selected", "false");
    beacon.setAttribute("aria-label", COPY.TREE.markLabel(
      junction.number, model.junctions.length, junction.when, junction.locator,
      junction.registered));
    const eye = make("span", "tneye");
    // the beacons breathe out of step with one another, on a delay taken from where each one
    // stands on the line, so the row reads as a live instrument rather than a row of stamps
    eye.style.animationDelay = `${(at * 0.37).toFixed(2)}s`;
    beacon.append(eye);
    beacon.append(make("span", "tnclock", junction.clock));
    beacon.append(make("span", "tnloc", junction.locator));
    beacon.append(make("i", "tstreak"));
    beacon.addEventListener("click", () => openMoment(at));
    beacons.push(beacon);
    cell.append(beacon);
    blooms.push(cell);
    spine.append(cell);
  });
  spineWrap.append(spine);
  host.append(spineWrap);
  host.append(make("p", "tspinenote", COPY.TREE.spineNote));

  // ---- the one moment that is open. It is a container of this page's own kind: corners, and
  // the writing arriving inside them.
  const panel = make("div", "tsel");
  const panelBody = make("div", "rvbody");
  const panelMore = make("div", "tmore", COPY.TREE.scrollCue);
  panel.append(corners(), panelBody, panelMore);
  host.append(panel);
  panelBody.addEventListener("scroll", markMore, { passive: true });
  /** whether the panel holds more than its frame shows, said in words and not only in a bar */
  function markMore() {
    panel.classList.toggle("more", panelBody.scrollHeight - panelBody.clientHeight > 12);
  }

  function openMoment(at: number) {
    const same = at === atMoment;
    atMoment = at;
    if (!same) {
      atSpot = -1; restShown = false; testedShown = false; atMethod = -1; atSeed = -1;
    }
    draw(!same);
  }

  /**
   * What the record holds for the one try that is open: what it asked for, how it weighed the
   * reports it was given, which of the required unknowns it named, and every finding the check
   * wrote against it.
   *
   * All eight tries of a way of working are read the same way. Seven of them have no walk-through
   * of their own, and before this they could only say whether they passed and point at the one
   * that does — which left the record's own answer for those seven unreachable although the file
   * carries it in full.
   *
   * Every sentence is the record's, put through the same wording tables the walk-through uses.
   * Where the record holds nothing the block says so and stops. Reports the answer weighed that
   * this moment never made available are counted rather than named, because their identifiers
   * stand for nothing a reader can look up.
   */
  function recordOf(
    junction: TreeJunction, method: TreeMethod, seed: TreeSeed, body: HTMLElement,
  ) {
    const desk = deskAt(junction.momentId, method.method, seed.seed);
    if (!desk) { body.append(make("p", "tsay", COPY.TREE.notRecorded)); return; }

    body.append(make("div", "tlab", COPY.TRACE.planLabel));
    body.append(make("p", "tsay", desk.lead));
    for (const line of desk.planLines) body.append(make("p", "tsay", line));

    body.append(make("div", "tlab", COPY.TRACE.weighedLabel));
    const weighed = desk.factors.filter((factor) => factor.known);
    const outside = desk.factors.length - weighed.length;
    if (weighed.length === 0 && outside === 0) {
      body.append(make("p", "tsay", COPY.TREE.notRecorded));
    } else {
      for (const factor of weighed) {
        body.append(make("p", "tsay", `${factor.sentence} ${factor.state}`));
      }
      if (outside > 0) body.append(make("p", "tsay", COPY.TREE.reportsOutside(outside)));
    }

    body.append(make("div", "tlab", COPY.TREE.unknownsLabel));
    body.append(make("p", "tsay", desk.unknownsLine || COPY.TREE.notRecorded));
    if (desk.extraUnknownCount > 0) {
      body.append(make("p", "tsay", COPY.TRACE.unknownsExtra(desk.extraUnknownCount)));
    }

    // Each rule the check named, said once. One try of the first moment broke the same rule
    // nineteen times over, and nineteen lines saying the same thing is a wall rather than a
    // finding. How many times in all is already said above this block, in one sentence.
    if (desk.failures.length > 0) {
      body.append(make("div", "tlab", COPY.TRACE.messageLabel));
      for (const rule of desk.failures) {
        body.append(make("p", "tsay", `${COPY.sentenceCase(rule)}.`));
      }
    }
  }

  /** the eight cells of one way of working, drawn only while that one is open */
  function seedsNode(junction: TreeJunction, method: TreeMethod): HTMLElement {
    const box = make("div", "tseeds rise");
    box.append(make("div", "tlab", COPY.TREE.seedsLabel));
    const row = make("div", "tseedrow");
    method.seeds.forEach((seed, at) => {
      const cell = control(
        `tseed ${seed.passed ? "pass" : "fail"}${seed.agreed ? " agreed" : ""}`
        + (at === atSeed ? " sel" : ""));
      cell.setAttribute("aria-label",
        COPY.TREE.seedLabel(seed.order, method.seeds.length, seed.passed, seed.agreed));
      cell.setAttribute("aria-expanded", at === atSeed ? "true" : "false");
      cell.append(make("span", "tseednum", String(seed.order)));
      cell.addEventListener("click", () => { atSeed = atSeed === at ? -1 : at; draw(false); });
      row.append(cell);
    });
    box.append(row);
    box.append(legendNode());
    box.append(make("p", "tnote", COPY.TREE.seedsNote));
    box.append(make("p", "tsay", COPY.TREE.agreement(method.agreement, method.tries)));
    // one try, opened on purpose, and nothing else opened with it
    const seed = atSeed >= 0 ? method.seeds[atSeed] : undefined;
    if (seed) {
      const drawer = make("div", `tdrawer ${seed.passed ? "pass" : "fail"}`);
      const body = make("div", "rvbody");
      body.append(make("div", "tlab", COPY.TREE.seedHead(seed.order, method.seeds.length)));
      body.append(make("p", seed.passed ? "tsay pass" : "tsay fail",
        seed.passed ? COPY.TREE.seedPassed : COPY.TREE.seedFailed(seed.rule)));
      if (seed.violations > 1) {
        body.append(make("p", "tsay", COPY.TREE.seedRules(seed.violations)));
      }
      body.append(make("p", "tsay", seed.agreed ? COPY.TREE.seedAgreed : COPY.TREE.seedApart));
      recordOf(junction, method, seed, body);
      if (seed.walkthrough) {
        body.append(make("p", "tsay", COPY.TREE.seedWalk));
        const go = control("tgo", COPY.TRACE.open);
        go.addEventListener("click", () => open(junction.momentId, method.card));
        body.append(go);
      } else {
        const follows = method.seeds.find((held) => held.walkthrough);
        body.append(make("p", "tsay", COPY.TREE.seedOther(follows?.order ?? 1)));
      }
      drawer.append(corners(), body);
      box.append(drawer);
      // the drawer opens the way every container on this page opens
      requestAnimationFrame(() => reveal(drawer));
    }
    return box;
  }

  /**
   * The branches, drawn from the one selected beacon and from no other.
   *
   * A branch is a piece of the action that moment's agents proposed: one unit and where it went,
   * or one place and how many went there. It is never a way of working — how an answer was
   * produced and tested lives one deliberate press further in, under the panel's own control.
   *
   * At most four branches are drawn. Where the action reached more places than that, the panel
   * says how many more in one sentence and carries the control that names them, so the row above
   * the line stays a picture rather than a list.
   *
   * They draw once, in under a third of a second, and stop. Nothing here ever grows forward into
   * another decision, because nothing past a recorded answer was ever recorded.
   */
  function bloomNode(junction: TreeJunction, cell: HTMLElement) {
    const shown = junction.spots.slice(0, SPOT_CARDS);
    if (shown.length === 0) return;
    const box = make("div", "tbloom");
    const wire = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    wire.setAttribute("class", "tbloomline");
    wire.setAttribute("viewBox", "0 0 100 100");
    wire.setAttribute("preserveAspectRatio", "none");
    wire.setAttribute("aria-hidden", "true");
    // one wire per branch, fanning from the beacon to the foot of each card
    const stops = shown.length === 1 ? [50]
      : shown.length === 2 ? [26, 74]
        : shown.length === 3 ? [16, 50, 84] : [12, 38, 62, 88];
    for (const to of stops) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M50 100 L${to} ${to === 50 ? 8 : 22}`);
      wire.append(path);
    }
    box.append(wire);
    shown.forEach((spot, at) => {
      const branch = control(`tbranch${at === atSpot ? " sel" : ""}`);
      branch.setAttribute("aria-expanded", at === atSpot ? "true" : "false");
      branch.style.animationDelay = `${(at * 0.06).toFixed(2)}s`;
      branch.append(make("span", "tbact", spot.label));
      if (spot.note) branch.append(make("span", "tbwhere", spot.note));
      branch.addEventListener("click", (event) => {
        event.stopPropagation();
        atSpot = atSpot === at ? -1 : at;
        draw(false);
      });
      box.append(branch);
    });
    cell.append(box);
    placeBloom();
  }

  /**
   * Where the branches stand.
   *
   * They are held inside the row and clear of the panel, so a beacon near either end has them
   * slid back onto the screen rather than drawn off it, and a beacon under the panel never has
   * them drawn over the writing there.
   *
   * The screen is written once while the frame is still hidden, and a hidden frame measures zero,
   * so this runs again the moment the frame is shown. Without that second run the branches keep
   * the width they were given against a frame with no size.
   */
  function placeBloom() {
    const cell = blooms[atMoment];
    const box = cell?.querySelector(".tbloom");
    if (!(box instanceof HTMLElement)) return;
    const room = spine.getBoundingClientRect();
    if (room.width === 0) return;
    const here = cell.getBoundingClientRect();
    const wall = panel.getBoundingClientRect().left - 10;
    const limit = Math.max(240, wall - room.left);
    box.style.maxWidth = `${limit.toFixed(0)}px`;
    const width = Math.min(box.offsetWidth, limit);
    const centred = here.left + here.width / 2 - width / 2;
    const left = Math.max(room.left, Math.min(Math.min(room.right, wall) - width, centred));
    box.style.left = `${(left - here.left).toFixed(1)}px`;
  }

  /** the three ways of working, as rows inside the panel's own evidence view */
  function methodsNode(junction: TreeJunction): HTMLElement {
    const box = make("div", "tmethods rise");
    junction.methods.forEach((method, at) => {
      const row = control(`tmethod${at === atMethod ? " sel" : ""}`);
      row.setAttribute("aria-expanded", at === atMethod ? "true" : "false");
      // the row leads with what that way of working asked for, then what the check made of that
      // one answer, and the way of working itself is the quiet tag at the foot
      row.append(make("span", "tbact", method.action));
      row.append(make("span", "tbverdict", method.passed === null
        ? COPY.TREE.notRecorded : COPY.TREE.actionVerdict(method.badge)));
      row.append(make("span", "tbtag", method.tag));
      // The count is a tally across eight separate tries, and seven of eight passing is neither a
      // pass nor a failure. Blue and orange say what the check found on one recorded try, so a
      // count of tries is written in the same bone the rest of the chronology uses and the two
      // colours are left to the eight cells, where each one carries its own try's verdict.
      row.append(make("span", "tbcount", COPY.TREE.methodResult(method.passes, method.tries)));
      row.addEventListener("click", () => {
        atMethod = atMethod === at ? -1 : at;
        atSeed = -1;
        draw(false);
      });
      box.append(row);
    });
    return box;
  }

  function draw(fresh: boolean) {
    /** the block this draw brought onto the screen, which is the one scrolled into the frame */
    let opened: HTMLElement | null = null;
    const junction = model.junctions[atMoment];
    beacons.forEach((beacon, at) => {
      const here = at === atMoment;
      beacon.classList.toggle("sel", here);
      beacon.setAttribute("aria-selected", here ? "true" : "false");
      // The tab stop travels with the choice. Tab reaches the row once, wherever the reader left
      // it, and the arrow keys do the walking from there.
      beacon.tabIndex = here ? 0 : -1;
    });
    for (const cell of blooms) cell.querySelector(".tbloom")?.remove();
    panelBody.textContent = "";
    if (!junction) return;

    // which moment is open stays in the frame however far the panel is scrolled, so a reader
    // never has to remember what supplied the detail they are looking at
    const selhead = make("div", "tselhead");
    selhead.append(make("div", "tlab",
      COPY.TREE.place(junction.number, model.junctions.length)));
    selhead.append(make("div", "twhen", COPY.TREE.when(junction.when)));
    panelBody.append(selhead);
    panelBody.append(make("h3", "tseltitle", junction.title));
    panelBody.append(dots());

    // ---- 2. what the agents proposed. It leads at every moment, graded or not, because that is
    // what this whole surface is about. The branches at the beacon are the pieces of it.
    panelBody.append(make("div", "tlab", COPY.TREE.actionLabel));
    panelBody.append(make("p", "tsay", junction.action));
    panelBody.append(make("p", "tnote", COPY.TREE.actionFrame));
    bloomNode(junction, blooms[atMoment]);
    const spot = atSpot >= 0 ? junction.spots[atSpot] : undefined;
    if (spot) {
      const where = make("div", "tspot rise");
      where.append(make("div", "tlab", COPY.TREE.spotLabel));
      for (const line of spot.lines) where.append(make("p", "tsay", line));
      panelBody.append(where);
      opened = where;
    }
    // the places past the four the row above holds, named in full rather than left implied
    const rest = junction.spots.length - SPOT_CARDS;
    if (rest > 0) {
      panelBody.append(make("p", "tsay",
        junction.byUnit ? COPY.TREE.moreUnits(rest) : COPY.TREE.morePlaces(rest)));
      const more = control("tdisclose", junction.byUnit
        ? (restShown ? COPY.TREE.restUnitsOpen : COPY.TREE.restUnits)
        : (restShown ? COPY.TREE.restOpen : COPY.TREE.rest));
      more.setAttribute("aria-expanded", restShown ? "true" : "false");
      more.addEventListener("click", () => { restShown = !restShown; draw(false); });
      panelBody.append(more);
      if (restShown) {
        const list = make("div", "tspot rise");
        for (const held of junction.spots.slice(SPOT_CARDS)) {
          for (const line of held.lines) list.append(make("p", "tsay", line));
        }
        panelBody.append(list);
        opened = list;
      }
    }

    // ---- 3 and 4. why that action, and what it left unresolved
    if (junction.why) {
      panelBody.append(make("div", "tlab", COPY.TREE.whyLabel));
      if (junction.why.reports.length === 0 && !junction.why.reason) {
        panelBody.append(make("p", "tsay", COPY.TREE.whyNone));
      }
      for (const report of junction.why.reports) {
        panelBody.append(make("p", "tsay", report));
      }
      if (junction.why.outside > 0) {
        panelBody.append(make("p", "tsay", COPY.TREE.reportsOutside(junction.why.outside)));
      }
      if (junction.why.unknowns) {
        panelBody.append(make("div", "tlab", COPY.TREE.unknownsLabel));
        panelBody.append(make("p", "tsay", junction.why.unknowns));
      }
      if (junction.why.reason) {
        panelBody.append(make("div", "tlab", COPY.TRACE.reasonLabel));
        panelBody.append(make("p", "tquote", junction.why.reason));
        panelBody.append(make("p", "tnote", COPY.TRACE.reasonFrame));
        if (junction.why.bracketed) {
          panelBody.append(make("p", "tnote", COPY.TRACE.reasonBrackets));
        }
      }
    }

    // ---- 5. the one recorded rule result. The verdict belongs to the action at rest; the
    // methods, seed ids and aggregate counts that produced it remain behind the disclosure.
    panelBody.append(dots());
    panelBody.append(make("div", "tlab", COPY.TRACE.head.check));
    panelBody.append(make("p", "tsay tverdict", junction.verdict));

    // ---- 6. the public record, kept separate from the proposal and its rule result above it
    panelBody.append(dots());
    panelBody.append(make("div", "tlab", COPY.TREE.realLabel));
    panelBody.append(make("p", "tsay", junction.real));

    // ---- 7. the frozen experiment's supporting evidence, behind one deliberate press, and only at the
    // five moments the experiment graded
    if (junction.methods.length === 0) {
      panelBody.append(make("p", "tnote", COPY.TREE.excluded));
      if (fresh) requestAnimationFrame(() => reveal(panel));
      requestAnimationFrame(markMore);
      return;
    }
    const show = control("tdisclose",
      testedShown ? COPY.TREE.testedOpen : COPY.TREE.tested);
    show.setAttribute("aria-expanded", testedShown ? "true" : "false");
    show.addEventListener("click", () => {
      testedShown = !testedShown;
      if (!testedShown) { atMethod = -1; atSeed = -1; }
      draw(false);
    });
    panelBody.append(show);
    if (testedShown) {
      panelBody.append(dots());
      panelBody.append(make("div", "tdivider rise", COPY.TREE.divider));
      // the standing limitation stands wherever a graded result stands
      panelBody.append(make("p", "tnote rise", model.limitation));
      opened = methodsNode(junction);
      panelBody.append(opened);
      const method = atMethod >= 0 ? junction.methods[atMethod] : undefined;
      if (method) {
        opened = seedsNode(junction, method);
        panelBody.append(opened);
      }
    }
    if (fresh) {
      panelBody.scrollTop = 0;
      requestAnimationFrame(() => reveal(panel));
    } else {
      panel.classList.add("opening", "ready");
      // whatever just opened is brought into the frame, so a reader never has to hunt for the
      // thing their own press produced
      if (opened) requestAnimationFrame(() => opened.scrollIntoView({ block: "nearest" }));
    }
    requestAnimationFrame(markMore);
  }

  function collapse(): boolean {
    if (atSeed >= 0) { atSeed = -1; draw(false); return true; }
    if (atMethod >= 0) { atMethod = -1; draw(false); return true; }
    if (testedShown) { testedShown = false; draw(false); return true; }
    if (restShown) { restShown = false; draw(false); return true; }
    if (atSpot >= 0) { atSpot = -1; draw(false); return true; }
    return false;
  }

  // ---- the keyboard, which reaches everything the pointer reaches
  host.addEventListener("keydown", (event) => {
    const key = event.key;
    if (key === "ArrowDown" || key === "ArrowUp") {
      const step = key === "ArrowDown" ? 1 : -1;
      const next = Math.max(0, Math.min(model.junctions.length - 1, atMoment + step));
      openMoment(next);
      beacons[next]?.focus();
      event.preventDefault();
      return;
    }
    if (key === "ArrowRight") {
      // one level further in, and never more than one: the first piece of the action, then the
      // experiment's own evidence, then one way of working, then one of its eight tries
      const junction = model.junctions[atMoment];
      if (!junction) return;
      if (atSpot < 0 && junction.spots.length > 0) atSpot = 0;
      else if (junction.methods.length === 0) return;
      else if (!testedShown) testedShown = true;
      else if (atMethod < 0) atMethod = 0;
      else if (atSeed < 0) atSeed = 0;
      else return;
      draw(false);
      event.preventDefault();
      return;
    }
    if (key === "ArrowLeft") {
      if (collapse()) event.preventDefault();
      return;
    }
    const digit = "12345678".indexOf(key);
    if (digit >= 0 && atMethod >= 0) {
      const method = model.junctions[atMoment]?.methods[atMethod];
      if (method && digit < method.seeds.length) {
        atSeed = digit;
        draw(false);
        event.preventDefault();
      }
    }
  });

  draw(true);

  return {
    selectAt(reached) {
      let found = 0;
      model.junctions.forEach((junction, at) => {
        if (reached(junction.momentId)) found = at;
      });
      openMoment(found);
    },
    collapse,
    focusSelected() { beacons[atMoment]?.focus({ preventScroll: true }); },
    shown() { placeBloom(); },
    state() {
      const junction = model.junctions[atMoment] ?? null;
      const method = atMethod >= 0 ? junction?.methods[atMethod] ?? null : null;
      return {
        moment: junction?.momentId ?? null,
        momentNumber: junction?.number ?? 0,
        restShown,
        methodsShown: testedShown,
        branchNodes: host.querySelectorAll(".tbranch").length,
        spot: atSpot >= 0 ? atSpot + 1 : 0,
        methodNodes: host.querySelectorAll(".tmethod").length,
        method: method?.method ?? null,
        seedCells: host.querySelectorAll(".tseed").length,
        seed: atSeed >= 0 ? atSeed + 1 : 0,
        drawers: host.querySelectorAll(".tdrawer").length,
        nodes: beacons.length,
      };
    },
  };
}

/** what the record put on this screen, for a gate that reads it without touching it */
export function treeReport(model: TreeModel) {
  return {
    junctions: model.junctions.length,
    graded: model.junctions.filter((junction) => junction.registered).length,
    hours: model.hours,
    limitation: model.limitation,
    marks: model.junctions.map((junction) => ({
      momentId: junction.momentId,
      number: junction.number,
      at: +junction.at.toFixed(6),
      clock: junction.clock,
      locator: junction.locator,
      registered: junction.registered,
      methods: junction.methods.map((method) => ({
        method: method.method,
        passes: method.passes,
        tries: method.tries,
        agreement: method.agreement,
        badge: method.badge,
        passed: method.passed,
        card: method.card,
        seeds: method.seeds.map((seed) => ({
          order: seed.order, passed: seed.passed, agreed: seed.agreed,
          violations: seed.violations, walkthrough: seed.walkthrough,
        })),
      })),
    })),
  };
}
