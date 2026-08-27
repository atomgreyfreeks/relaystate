/**
 * RESCUE WORLD — the registered highlight contract, read and nothing more.
 *
 * Five of the eleven decision moments belong to the frozen registered experiment. Each of three
 * methods answered each of those five moments eight times, which is one hundred and twenty
 * recorded answers. `app/scripts/derive-rescueworld-highlights.mjs` reads the sealed run and
 * writes every one of those counts into `app/public/rescueworld-highlights.json`. The rules it
 * follows are written down in `docs/rescueworld/HIGHLIGHT-REEL-DERIVATION.md`.
 *
 * This module reads that file and computes nothing of its own. Every count a viewer sees comes
 * from the contract, so the screen and the generator can never drift apart. The one thing this
 * file does derive is the order of eight cells in a strip, and that order is the recorded seed
 * order with each cell's two states read straight off the recorded answer for that seed.
 *
 * Determinism: no clock, no random source, no document object model. The same contract file
 * always produces the same rows in the same order.
 */

// ------------------------------------------------------------------ what the contract holds

import * as GLOSS from "./gloss";

export interface HighlightOutcome {
  seed: number;
  passed_every_prewritten_check: boolean;
  stayed_within_resource_limits: boolean;
  communication_failure: boolean;
  required_unknown_coverage: number;
  violation_count: number;
  first_violation_code: string | null;
}
export interface HighlightChoiceGroup {
  count: number;
  representative_seed: number;
  seeds: number[];
}
export interface HighlightClassification {
  kind: "exceptional" | "perfect_repair" | "persistent_problem";
  caption: string;
}
export interface HighlightMethod {
  method: string;
  label: string;
  tries: number;
  passes: number;
  constraint_passes: number;
  communication_failures: number;
  tries_naming_every_required_unknown: number;
  tries_naming_no_required_unknown: number;
  distinct_choice_sets: number;
  largest_same_choice_count: number;
  pass_caption: string;
  agreement_caption: string;
  classifications: HighlightClassification[];
  choice_groups: HighlightChoiceGroup[];
  outcomes: HighlightOutcome[];
}
export interface HighlightMoment {
  event_id: string;
  sim_time_s: number;
  slot_id: string;
  title: string;
  task: string;
  cutoff_at: string;
  methods: HighlightMethod[];
}
export interface HighlightTotal {
  method: string;
  label: string;
  tries: number;
  passes: number;
  constraint_passes: number;
  pass_caption: string;
}
export interface HighlightReelRow {
  slot_id: string;
  method: string;
  kind: "exceptional" | "perfect_repair" | "persistent_problem";
  caption: string;
}
export interface HighlightContract {
  schema_version: string;
  /**
   * The recorded run every count below was derived from, named by the file it was read out of.
   * The page loads whichever log its address asks for, and this is how it tells whether the
   * highlight file it fetched belongs to the record on screen. Where the two disagree, the
   * counts are left off rather than printed under a run they were never taken from.
   */
  source: { file: string; sha256: string };
  scope: { registered_moments: number; methods: number; tries_per_method_per_moment: number };
  wording: {
    definition: string;
    standing_limitation: string;
    exceptional: string;
    perfect_repair: string;
    persistent_problem: string;
  };
  totals: HighlightTotal[];
  honesty_signal: { tries: number; caption: string };
  reel: HighlightReelRow[];
  moments: HighlightMoment[];
}

// ------------------------------------------------------------------ one cell of a strip

/**
 * One of the eight recorded tries, as one cell of the strip beside a choice.
 *
 * A cell says two separate things about the same recorded try, and it never merges them. Whether
 * the try produced the choice the screen is showing is the fill: a filled cell belongs to the
 * largest group of tries that chose the same set of places, an outlined cell chose something
 * else. Whether the try passed every prewritten check is the colour.
 */
export interface StripCell {
  seed: number;
  /** true where this try produced the same set of choices as the shown one */
  agreed: boolean;
  /** true where this try passed every prewritten check */
  passed: boolean;
}

/** everything one strip needs, all of it read from the contract */
export interface StripReading {
  cells: StripCell[];
  /** how many of the eight tries produced the same set of choices */
  agreement: number;
  /** how many of the eight tries passed every prewritten check */
  passes: number;
  tries: number;
  /** the contract's own sentence about how far the tries agreed */
  agreementCaption: string;
  /** the contract's own sentence about how many tries passed every check */
  passCaption: string;
}

/**
 * The eight cells for one method at one moment, in the recorded seed order.
 *
 * The largest group of tries that chose the same set of places is the group the contract already
 * counted, and its own seed list decides which cells are filled. Where two groups are the same
 * size the contract lists them in seed order and the first is taken, so the same contract always
 * draws the same eight cells.
 */
export function stripOf(method: HighlightMethod): StripReading {
  const largest = method.choice_groups.reduce<HighlightChoiceGroup | null>(
    (best, group) => (best === null || group.count > best.count ? group : best), null);
  const agreedSeeds = new Set(largest?.seeds ?? []);
  return {
    cells: method.outcomes.map((outcome) => ({
      seed: outcome.seed,
      agreed: agreedSeeds.has(outcome.seed),
      passed: outcome.passed_every_prewritten_check === true,
    })),
    agreement: method.largest_same_choice_count,
    passes: method.passes,
    tries: method.tries,
    // Both sentences come out of the derived file, which names the three ways of working the way
    // the recording does. `gloss.ts` holds the plain English shown in their place.
    agreementCaption: GLOSS.glossed(
      GLOSS.STRIP_CAPTION, `agreement_caption:${method.agreement_caption}`,
      method.agreement_caption),
    passCaption: GLOSS.glossed(
      GLOSS.STRIP_CAPTION, `pass_caption:${method.pass_caption}`, method.pass_caption),
  };
}

// ------------------------------------------------------------------ reading the whole contract

export interface Highlights {
  contract: HighlightContract;
  /** the record for one moment, by the identifier the run gives that moment */
  moment(slotId: string): HighlightMoment | null;
  /** the record for one method at one moment */
  method(slotId: string, method: string): HighlightMethod | null;
  /** every classification the contract gives one moment, across all three methods */
  classificationsFor(slotId: string): HighlightClassification[];
  /** the whole-experiment count for one method, which is where 0, 17 and 34 come from */
  total(method: string): HighlightTotal | null;
}

export function readHighlights(contract: HighlightContract): Highlights {
  const byMoment = new Map(contract.moments.map((moment) => [moment.slot_id, moment]));
  const momentOf = (slotId: string) => byMoment.get(slotId) ?? null;
  return {
    contract,
    moment: momentOf,
    method(slotId, method) {
      return momentOf(slotId)?.methods.find((row) => row.method === method) ?? null;
    },
    classificationsFor(slotId) {
      const moment = momentOf(slotId);
      if (!moment) return [];
      return moment.methods.flatMap((row) => row.classifications);
    },
    total(method) {
      return contract.totals.find((row) => row.method === method) ?? null;
    },
  };
}

/**
 * The contract as the page serves it. A run that carries no registered experiment — the two-desk
 * routing exercise, or the short demonstration — is served the same file and simply finds no
 * moment of its own in it, so nothing here has to know which run is playing.
 */
export async function loadHighlights(url: string): Promise<Highlights | null> {
  try {
    const answer = await fetch(url);
    if (!answer.ok) return null;
    const contract = await answer.json() as HighlightContract;
    if (!Array.isArray(contract.moments) || !Array.isArray(contract.totals)) return null;
    return readHighlights(contract);
  } catch {
    return null;
  }
}
