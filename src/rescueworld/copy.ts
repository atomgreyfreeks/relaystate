/**
 * RESCUE WORLD — the strings the theater shows, and nothing else.
 *
 * Every sentence a viewer can read on `app/rescueworld.html` is written in
 * `docs/rescueworld/theater-copy.md` (the copy deck) and is reproduced here, in the deck's own
 * words, with the deck's own slots left as parameters. The rule the deck states is that builders
 * take strings from it and write none of their own; this file is where that rule is kept, so a
 * reviewer can compare one file against one document.
 *
 * Three things this file does not do. It never reads the document object model, it never fetches
 * anything, and it holds no state. Numbers arrive as arguments, already read out of the recorded
 * log by the caller, so the strings stay quotations rather than claims.
 *
 * Where the deck writes a slot in braces — `{value} simulated people waiting at {site}` — the
 * function below takes that slot as an argument and joins the sentence the deck wrote around it.
 */

// ------------------------------------------------------------------ names a stranger can read

/** The deck names the run's four target features site one through site four, in recorded order. */
const SITE_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/**
 * `site three` for site index 2. An index past the tenth site falls back to its own number.
 *
 * A recorded event that names no site at all used to be written as "this place", which points at
 * nothing a reader can find. The fallback now says which place it is: one the exercise never gave
 * a name to. It reads inside the sentences that take it — "40 simulated people waiting at a place
 * this exercise does not name".
 */
export function siteName(index: number): string {
  if (index < 0) return "a place this exercise does not name";
  return `site ${SITE_WORDS[index] ?? String(index + 1)}`;
}

/**
 * `assessment team 1` from the recorded resource identifier `assessment-team-01`. The deck writes
 * team names with digits — "Assessment team 1 to site one" — and spells sites in words, so the two
 * never read as one number.
 */
export function teamName(resourceId: string): string {
  const m = /^(.*?)-0*(\d+)$/.exec(resourceId);
  if (!m) return resourceId.replace(/-/g, " ");
  return `${m[1].replace(/-/g, " ")} ${Number(m[2])}`;
}

/** A sentence opens with a capital; the deck's card titles are the same names in sentence case. */
export const sentenceCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The deck's age rule: the current round's simulation time minus the source's own simulation
 * time, as whole hours and whole minutes with the seconds dropped. Equal times read "Just
 * arrived."
 */
export function ageWords(seconds: number): string {
  const d = Math.max(0, Math.floor(seconds));
  if (d < 60) return "";
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** The whole age line for a report card, in the voice the deck gives that kind of source. */
export function ageLine(verb: string, seconds: number): string {
  const age = ageWords(seconds);
  return age ? `${verb} ${age} before this point in the run.` : "Just arrived.";
}

/** `16:28` out of a recorded instant, without reading any clock. */
export function clockOf(recorded: string): string {
  const iso = /T(\d\d):(\d\d)/.exec(recorded);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const slashed = /(\d\d?):(\d\d)/.exec(recorded);
  return slashed ? `${slashed[1].padStart(2, "0")}:${slashed[2]}` : recorded;
}

// ------------------------------------------------------------------ 1. the briefing overlay

export const BRIEFING = {
  // The desk count is stated once and never contradicted. This paragraph used to say "a desk with
  // two rapid-assessment teams must decide where they go", then "two desks read the same reports"
  // one sentence later, and a first-time reader could not tell whether there was one desk or two.
  // There are two desks. Each has two teams. That is the whole premise, so it is said in that
  // order and the numbers are spelled out.
  text:
    "July 28, 2026, 16:27. A magnitude 7.1 earthquake strikes Kumamoto Prefecture. In the first"
    + " minutes eight simulated reports arrive, some exaggerated and some agreeing, while official"
    + " updates from Japan's national weather service sharpen over four hours. Two desks read"
    + " those same eight reports. Each desk has two rapid-assessment teams and has to decide where"
    + " to send them. The two desks follow different rules, and you watch both of them work.",
  /** chrome, one word */
  control: "Begin",
  honesty:
    "The ground, the earthquake and the official updates are real public records; every report"
    + " about people and every outcome is simulated exercise data.",
};

/**
 * What the frame says when the page cannot start at all. It names what failed in one sentence
 * and gives the viewer the one thing worth trying. The message that names the cause is written
 * to the browser's own console instead, because it is for whoever is fixing the page.
 */
export const BOOT_FAILED =
  "This replay could not be loaded. Please reload the page. If it still does not load, the"
  + " recorded file this page reads is not reachable from here.";

// ------------------------------------------------------------------ 2. the masthead and the chip

export const MASTHEAD = {
  name: "Kumamoto earthquake",
  /** `28 July 2026 · 81 recorded events · round 3 of 6` */
  line: (events: number, round: number, rounds: number) =>
    `28 July 2026 · ${events} recorded events · round ${round} of ${rounds}`,
  mark: "Simulated exercise on real ground.",
  angles:
    "One earthquake, eleven urgent decisions, and later AI rescue proposals built from the"
    + " reports available at each deadline. No AI proposal was carried out.",
};

export const OUTCOME = {
  /** chrome, four words */
  chip: "Open the outcome — key o",
  /**
   * The deck's verdict sentence. The reason clause is the losing desk's own recorded
   * `dispatches_on_rejected_claim_versions` metric put into plain words; where that metric is not
   * recorded above zero, the clause is dropped rather than replaced.
   */
  verdict: (hiName: string, hi: number, loName: string, lo: number, onRejected: boolean) =>
    `${hiName} reached ${hi} simulated people. ${loName} reached ${lo}`
    + `${onRejected ? ", because it sent a team on a claim no second source had confirmed" : ""}.`,
  counts: (hiName: string, hi: number, loName: string, lo: number) =>
    `${hiName} ${hi} · ${loName} ${lo}`,
  footnote:
    "Counted in simulated people. This is a labeled exercise and not a record of the real"
    + " response.",
};

// ------------------------------------------------------------------ 3. round headlines

/**
 * One headline per round of each desk, keyed by the desk's recorded arm and the graph node the
 * round opens at. `ARRIVAL` is the round the deck derives between the dispatch transition and the
 * closing transition, where the arrival events sit.
 */
export const ROUND_HEADLINES: Record<string, string> = {
  "PLAIN_GRAPH:INGEST": "The desk takes in all eight simulated reports.",
  "PLAIN_GRAPH:SUMMARIZE": "The desk keeps the largest number for each site.",
  "PLAIN_GRAPH:RANK": "The desk ranks four sites and keeps two.",
  "PLAIN_GRAPH:DISPATCH": "Both teams are sent to the two largest numbers.",
  "PLAIN_GRAPH:ARRIVAL": "Site one holds eighteen simulated people, not sixty.",
  "PLAIN_GRAPH:OBSERVE": "The desk that keeps plain written notes reached sixty simulated people.",
  "EVIDENCE_GRAPH:INGEST": "The desk takes in the same eight simulated reports.",
  "EVIDENCE_GRAPH:VERSION": "Every competing number is kept as its own version.",
  "EVIDENCE_GRAPH:CORROBORATE": "Two separate sources agree that eighteen people wait.",
  "EVIDENCE_GRAPH:GATE": "A version without a second source cannot send teams.",
  "EVIDENCE_GRAPH:RANK": "Three supported sites are ranked; the top two qualify.",
  "EVIDENCE_GRAPH:DISPATCH": "Both teams go to site two and site three.",
  "EVIDENCE_GRAPH:ARRIVAL": "Both teams find the numbers their sources agreed on.",
  "EVIDENCE_GRAPH:UPDATE": "A desk with an evidence table reached seventy-seven simulated people.",
};

/** The deck's short label for the round, used as chrome beside the headline. */
export const ROUND_LABELS: Record<string, string> = {
  INGEST: "intake",
  SUMMARIZE: "summarize",
  VERSION: "version",
  CORROBORATE: "corroborate",
  GATE: "gate",
  RANK: "rank",
  DISPATCH: "dispatch",
  ARRIVAL: "arrival",
  OBSERVE: "close",
  UPDATE: "close",
};

// ------------------------------------------------------------------ 4. report cards

/** The four source classes the deck names, which the feed never blends into one another. */
export type SourceClass = "simulated" | "official" | "road" | "layer";

export interface ReportCard {
  /** the source's plain name, leading the card */
  name: string;
  /** one complete sentence stating what this source says */
  claim: string;
  /** one complete sentence stating when the source spoke */
  age: string;
  /** chrome, at most three words */
  tag: string;
  /** the recorded identifier, in small type */
  id: string;
  klass: SourceClass;
}

interface SimulatedKind { tag: string; claim: (v: number, site: string) => string; verb: string }

/** The deck's template for each recorded `source_type`, keyed by the log's own value. */
const SIMULATED: Record<string, SimulatedKind> = {
  FIELD_REPORT: {
    tag: "Simulated field report",
    claim: (v, site) => `It reports ${v} simulated people waiting for a team at ${site}.`,
    verb: "Filed",
  },
  SIMULATED_SENSOR: {
    tag: "Simulated aerial count",
    claim: (v, site) => `Its count is ${v} simulated people waiting for a team at ${site}.`,
    verb: "Counted",
  },
  SOCIAL: {
    tag: "Simulated public post",
    claim: (v, site) => `It claims ${v} simulated people are waiting for a team at ${site}.`,
    verb: "Posted",
  },
  PHONE: {
    tag: "Simulated phone call",
    claim: (v, site) =>
      `The caller reports ${v} simulated people waiting for a team at ${site}.`,
    verb: "Called in",
  },
  WEB: {
    tag: "Simulated web page",
    claim: (v, site) => `The page states ${v} simulated people waiting for a team at ${site}.`,
    verb: "Published",
  },
};

export function simulatedReportCard(input: {
  sourceType: string; sourceLabel: string; value: number; site: string;
  ageSeconds: number; observationId: string;
}): ReportCard {
  const kind = SIMULATED[input.sourceType] ?? SIMULATED.FIELD_REPORT;
  return {
    name: input.sourceLabel,
    claim: kind.claim(input.value, input.site),
    age: ageLine(kind.verb, input.ageSeconds),
    tag: kind.tag,
    id: input.observationId,
    klass: "simulated",
  };
}

/**
 * An official agency update. Where a field is absent, null, or recorded as the unavailable
 * sentinel zero, the deck drops its clause rather than filling it in — so an update that counted
 * no stations never renders "from 0 stations".
 */
export function agencyUpdateCard(input: {
  serial: string; magnitude: string; maxIntensity: string; stationCount: number;
  reportedAt: string; reportId: string;
}): ReportCard {
  const parts: string[] = [];
  if (input.magnitude !== "") parts.push(`magnitude ${input.magnitude}`);
  if (input.maxIntensity !== "") parts.push(`maximum intensity ${input.maxIntensity}`);
  const heads = parts.length === 2 ? `${parts[0]} and ${parts[1]}` : parts[0] ?? "";
  const stations = input.stationCount > 0 ? ` from ${input.stationCount} stations` : "";
  const claim = heads ? `The agency reports ${heads}${stations}.` : "";
  return {
    name: `Japan's national weather service published update ${input.serial}`,
    claim,
    age: `Published at ${clockOf(input.reportedAt)} on 28 July 2026.`,
    tag: "Official agency update",
    id: input.reportId,
    klass: "official",
  };
}

export function roadRestrictionCard(input: {
  routeName: string; municipality: string; prefecture: string; reason: string;
  lengthKm: number | null; startedAt: string; restrictionId: string;
}): ReportCard {
  const length = input.lengthKm ? `, over ${input.lengthKm} kilometres` : "";
  return {
    name: input.routeName,
    claim: `This road is fully closed in ${input.municipality}, ${input.prefecture}, for`
      + `${length ? ` ${input.reason}${length}` : ` ${input.reason}`}.`,
    age: `Closed from ${clockOf(input.startedAt)} on 28 July 2026.`,
    tag: "Official road-closure file",
    id: input.restrictionId,
    klass: "road",
  };
}

export function roadLayerCard(input: {
  featureCount: number; snapshotAt: string; sourceId: string;
}): ReportCard {
  return {
    name: "Road closures, official snapshot",
    claim: `This file names ${input.featureCount} places where a road was shut, or was open with`
      + " a limit on how heavy a vehicle could be or how fast it could go.",
    age: `Recorded at ${clockOf(input.snapshotAt)} on 29 July 2026.`,
    tag: "Official road-closure file",
    id: input.sourceId,
    klass: "road",
  };
}

export function shelterLayerCard(input: {
  designationRecordCount: number; uniqueLocationCount: number;
  designatedShelterCount: number; earthquakeEvacuationPlaceCount: number; sourceId: string;
}): ReportCard {
  return {
    name: "Shelters and places the government named for an emergency",
    // One place can hold more than one label, which is why the two counts add up past the number
    // of places. A shelter is somewhere people sleep and are fed. An earthquake evacuation place
    // is open ground people run to while the shaking is happening.
    claim: `This file gives ${input.uniqueLocationCount} places a total of`
      + ` ${input.designationRecordCount} labels. ${input.designatedShelterCount} are shelters`
      + ` people can stay in, and ${input.earthquakeEvacuationPlaceCount} are open spaces to run`
      + " to when the ground shakes. Some places carry both labels.",
    age: "These places were named in advance and the list stands whatever happens. It does not say"
      + " whether any place was open, staffed, supplied or reachable after this earthquake.",
    tag: "Official shelter list",
    id: input.sourceId,
    klass: "layer",
  };
}

export function hazardLayerCard(input: { featureCount: number; sourceId: string }): ReportCard {
  return {
    name: "Places where a hillside gave way, and where the earth stopped",
    claim: `This file draws ${input.featureCount} shapes on the ground. Each one is a patch where`
      + " a hillside gave way, or a patch where the earth that came down piled up.",
    age: "Japan's national mapping agency read these shapes off aerial photographs.",
    tag: "Official landslide map",
    id: input.sourceId,
    klass: "layer",
  };
}

/** Shown in the feed when a round brings no new reports. */
export const FEED_EMPTY = "No new reports arrived in this stretch of the run.";

// ------------------------------------------------------------------ 5. the decision rail

export interface VerdictWords { stamp: string; reason: string }

/** The verdict stamps and the recorded reason each one stands on. */
export const VERDICTS: Record<string, VerdictWords> = {
  SUPPORTED: {
    stamp: "Supported",
    reason: "Two separate simulated sources report this same number.",
  },
  REJECTED: {
    stamp: "Rejected",
    reason: "One source reports this number and two others report a different one.",
  },
  UNRESOLVED: {
    stamp: "Unresolved",
    reason: "Only one source reports this number and nothing agrees or disagrees with it.",
  },
  NOT_EVALUATED: {
    stamp: "Not evaluated",
    reason: "This desk does not compare sources, so it stamps no verdict.",
  },
};

export const verdictWords = (verdict: string): VerdictWords =>
  VERDICTS[verdict] ?? VERDICTS.NOT_EVALUATED;

/** `18 simulated people waiting at site one` — the claim card's own line. */
export const claimLine = (value: number, site: string): string =>
  `${value} simulated people waiting at ${site}`;

/** `Assessment team 1 to site one` */
export const dispatchLine = (team: string, site: string): string =>
  `${sentenceCase(team)} to ${site}`;

export const dispatchAuthority = (value: number, site: string): string =>
  `This team was sent on the claim that ${value} simulated people are waiting at`
  + ` ${site}.`;

/** What the shared evidence comparison recorded about the authorizing claim version. */
export function dispatchStatus(comparisonVerdict: string): string {
  if (comparisonVerdict === "SUPPORTED") {
    return "That claim is supported by two separate simulated sources.";
  }
  if (comparisonVerdict === "REJECTED") {
    return "That claim is rejected by the shared evidence comparison; this desk does not check"
      + " before sending.";
  }
  return "That claim is unresolved; only one source reports it.";
}

/**
 * chrome. It stays on every dispatch card and route until the log records road paths.
 * "Illustrative" is above the reading level the rest of the page holds, and it left the drawn
 * line's status open: taken, or drawn for show. It says both plainly now.
 */
export const ILLUSTRATIVE_ROUTE = "Example route, not a recorded one";


// ------------------------------------------------------------------ 6. consequence captions

/**
 * The arrival caption, at the site, at the moment the outcome event fires. Where the authorizing
 * claim was rejected by the shared comparison the deck names the number the single post claimed;
 * otherwise it names the agreement the number stood on.
 */
export function arrivalCaption(input: {
  team: string; site: string; found: number; claimed: number; onRejectedClaim: boolean;
}): string {
  const head = `${sentenceCase(input.team)} reaches ${input.site} and finds ${input.found}`
    + " simulated people waiting";
  return input.onRejectedClaim
    ? `${head}, not the ${input.claimed} the single post claimed.`
    : `${head}, the number two separate sources reported.`;
}

/** Shown with the plain desk's site-one arrival, at the moment the shortage bites. */
export const SCARCITY =
  "Both teams are now committed, so no team is left for site three, where two sources agreed on"
  + " 35 simulated people.";

/** chrome, two words. It stays on any scar, mark or figure drawn on the ground by the exercise. */
export const SIMULATED_DAMAGE = "Simulated damage";

// ------------------------------------------------------------------ 7. the debrief

export const DEBRIEF = {
  outcome:
    "The desk that checked its evidence reached 77 simulated people. The desk that trusted the"
    + " loudest report reached 60. The difference was one unchecked claim.",
  beats: [
    {
      label: "Cause",
      text: "At site one, one simulated post claimed 60 people waiting while two other simulated"
        + " sources agreed on 18. The desk that checked its evidence supported 18 and rejected 60.",
    },
    {
      label: "Choice",
      text: "Both desks sent one team to site two. The plain desk spent its other team on site"
        + " one's rejected claim; the evidence desk sent its other team to site three.",
    },
    {
      label: "Consequence",
      text: "The plain desk reached 60 simulated people; the evidence desk reached 77. The gain"
        + " of 17 came from one claim the evidence desk refused to trust.",
    },
  ],
  /** chrome, six words */
  control: "Fly there and watch it again",
  honesty:
    "Every number here is simulated exercise data, replayed from one recorded file of 81 events.",
};

// ------------------------------------------------------------------ 8. comparison overlays

export const GHOST = {
  /** the plain form, where no desk name is on screen */
  plain: "The other desk sent its team here.",
  /** the named form, where the desk name is on screen */
  named: (otherDesk: string, team: string, site: string) =>
    `The ${otherDesk} sent ${team} to ${site} instead.`,
};

/** chrome, three words: the stamp naming the run now on screen. */
export const SWAP_STAMP: Record<string, string> = {
  PLAIN_GRAPH: "Plain desk run",
  EVIDENCE_GRAPH: "Evidence desk run",
};

/** This line accompanies every comparison surface. It is never optional and never abbreviated. */
export const ASSUMPTION =
  "This comparison is a simulated counterfactual; assumptions are listed in the menu.";

/** Shown where a comparison is asked for and only one run is loaded. */
export const NO_PAIR = "No second run is loaded, so there is nothing to compare against.";

// ------------------------------------------------------------------ 9. the help overlay

export const HELP = {
  /**
   * This page loads one of two kinds of recorded run, and the help has to describe the one that
   * is actually loaded. The default record is the whole Kumamoto incident replayed as one story;
   * the other is the two-desk rescue-assessment exercise, whose paragraphs are the three below.
   * The help used to carry the exercise's sentences on both, so a reader of the incident record
   * was told about two desks and eight reports that record does not contain.
   *
   * Every count in these sentences arrives as an argument read out of the loaded file, so no
   * sentence here can go stale against the record it describes.
   */
  incidentScenario:
    "A magnitude 7.1 earthquake struck Kumamoto at 16:27 on 28 July 2026. This replay follows"
    + " the first 72 hours of the public response over real terrain. The earthquake, mapped"
    + " landslides, road closures, shelter designations, aftershocks and public-response"
    + " milestones come from public records. The AI rescue proposals and glowing damage effects"
    + " are simulated. No AI proposal shown here was carried out.",
  incidentStory: (moments: number, decisions: number, acts: number) =>
    `The replay follows ${moments} recorded events across ${countWord(acts)} acts. At`
    + ` ${countWord(decisions)} urgent decisions, software agents later answered in three ways:`
    + " plain notes, a table that keeps each claim beside its source, and the same table after one"
    + " exact error message. Five decisions belong to the planned scored test; six provide"
    + " unscored context.",
  /**
   * How the run is driven, with the size of the file it is driven from read out of that file.
   * The sentence used to name eighty-one events on every record, including the one that holds
   * four hundred and fourteen.
   */
  driven: (events: number) =>
    `Playback reads ${events} saved events in their recorded order. Replaying the file shows the`
    + " same events. You may move the camera and inspect the evidence, but you cannot change the"
    + " recorded story. A technical check detects any later change to the file.",
  /**
   * How the run is paced. The two-desk exercise steps a graph and the two desks take a different
   * number of steps; the incident record plays one shared story, so the sentence about a second
   * desk is only true on the exercise.
   */
  paced: (twoDesks: boolean) =>
    "The run is counted in rounds. The record was written in rounds, so the playback follows them."
    + (twoDesks
      ? " Each round of the run is one move a desk makes, read straight out of the recorded log,"
        + " and the two desks make a different number of moves."
      : " The playback groups related recorded events together as one story section.")
    + " Each round gets equal screen time even when the real events were hours apart. The clock"
    + " shows when each event actually happened; no event is skipped or reordered.",
  /**
   * How many places the record names, read from the record. No place the record names is one of
   * the modelled buildings, which are a separate published city model drawn as context.
   */
  places: (sites: number) =>
    `This record names ${countWord(sites)} places. The grey buildings standing across the city are`
    + " a separate published city model, drawn here for context, and no place the record names is"
    + " one of them.",
  scenario:
    "On 28 July 2026 an earthquake struck Kumamoto Prefecture in Japan. What you watch here is a"
    + " rescue-assessment exercise, played back over that place. Five things come from real public"
    + " records. They are the ground, the landslides on the map, the roads that closed, the"
    + " shelters the government had designated and the updates published by Japan's national"
    + " weather service. Everything about people is invented for this exercise: every report of"
    + " how many are waiting, every team sent and every outcome. The damage drawn on the ground is"
    + " invented in the same way.",
  desks:
    "Two desks read exactly the same eight reports. The plain desk keeps the largest number"
    + " reported for each site and sends its two teams to the two largest numbers. The desk that"
    + " checks its evidence keeps every competing number as its own version and counts how many"
    + " separate sources agree. It will not send a team on a version that no second source"
    + " confirmed. That rule is the only thing that differs between them.",
  // The lichen used to be introduced as two partners living joined and then described as kept
  // apart, and the picture argued against itself. Joined but not mixing is the actual point, so
  // the paragraph says that in the same breath as the comparison and then drops the lichen.
  lichen:
    "The evidence table keeps each claim beside its source. Conflicting versions remain visible,"
    + " so rejecting a number cannot erase the report that produced it.",
  controls: [
    "Drag to turn the camera around what it is looking at.",
    "Roll the wheel to zoom toward whatever the pointer is over.",
    "Right-drag, or hold shift and drag, to slide across the ground.",
    "Fly with the w, a, s and d keys. Press q to rise and e to drop.",
    "Hold the pointer at the edge of the screen to scroll the camera that way.",
    "Press h to go back to the starting view.",
    "Hold control and press 1 to 9 to save the current view to that number.",
    "Press 1 to 9 to go back to the view saved on that number.",
    "Hold shift and press 1 to 7 to change the colours on screen.",
    "Click a site, a landslide zone, a road closure, a shelter or the buildings to select it;"
      + " click bare ground to clear the selection.",
    "Press tab to switch desks.",
    "Press space to play and pause; the world stays lit while it is paused.",
    "Press the comma and period keys to move back and forward one recorded event.",
    "Press the bracket keys to step back and forward one round; the run lands at the end of that"
      + " round, so the feed at the edge shows everything the round brought.",
    "Choose one times, four times or sixteen times to set how fast the run plays.",
    "Press o to show the outcome again.",
    // Registered by the deck's dated post-build copy amendment.
    "Press d to show the debrief again.",
    // Registered by the deck's second dated amendment. The second line is here because r used to
    // raise the camera, and an instruction that has stopped being true has to be corrected on the
    // same list that gave it.
    "Press r to compare the public response with the three recorded AI approaches at the five"
      + " scored decisions.",
    "The r key opens that overlay, so it no longer raises the camera. Press q to rise. Press e or"
      + " f to drop.",
    "Press 0 to return to the start of the record.",
    "Press v for the internal view, which is a tool for the people making this page.",
    // Registered by the deck's dated regional-touring amendment. The overwatch key is p because
    // v already opens the internal view.
    "Press p to let the camera tour the map. If you do nothing for twelve seconds, it visits the"
      + " current event, the latest regional event, and the full region. Press a key or drag to"
      + " take control again.",
    // Registered by the deck's dated directed-watch amendment.
    "The run is directed by default: each round plays slowly, then holds so you can read it, and"
      + " the camera goes to where that round is happening. Choosing a speed leaves the directed"
      + " watch and plays the record straight through at that speed; click the mode chip beside"
      + " the speeds to come back.",
    "Under the reports, each thin row marks a road closure, a recorded aftershock, or one of the"
      + " eleven response decisions. Five decisions include scored AI runs; six provide unscored"
      + " context. Select a row to move the camera.",
    // Registered by the deck's dated agent-trace amendment.
    "Press t to open the current AI proposal. Six short cards show its action, reports, public"
      + " context, earlier answers, and rule feedback. Use Left and Right to move.",
    "Every moment of decision in the list down the side of the screen carries its own control for"
      + " that walk-through. One that has already passed can be opened again without moving the"
      + " run.",
    // Registered by the deck's dated stranger-pass amendment. The three keys below existed and
    // were missing from this list, so a reader was told about controls that had moved on and not
    // about controls that were there.
    "Press g for the picture controls, which set the colours on screen and how much they glow."
      + " They are a tool for the people making this page, and they change nothing about the"
      + " record.",
  ],
  /**
   * The ledger's own line, kept apart from the list above because a record that holds no moment
   * of decision has no ledger, and a control list that names a key doing nothing is worse than a
   * list that is one line shorter.
   */
  ledgerControl:
    "Press l to list every deadline, the AI's final rescue proposal, the public"
    + " response, and the optional test details.",
  attribution:
    "Ground heights, landslides read off aerial photographs and shelter designations: Geospatial"
    + " Information Authority of Japan, the national mapping agency. Road closures: Ministry of"
    + " Land, Infrastructure, Transport and Tourism, Japan's national ministry for roads."
    + " Earthquake record: Japan Meteorological Agency, Japan's national weather service."
    + " City model: Project Plateau, open building data from that same ministry.",
};

// ------------------------------------------------------------------ 10. error and edge states

export const STATES = {
  emptySelection:
    "Nothing is selected. Click a site, a landslide zone, a road closure, a shelter or the"
    + " buildings to see what the run recorded about it.",
  loading: "Reading the recorded run.",
  failed: (reason: string) => `This run could not be read. ${reason}`,
  internalView:
    "The internal view is a tool for the people making this page. It puts the two desks side by"
    + " side and shows the bar that drags the playback to any point. Nothing here is part of what"
    + " a viewer is meant to see.",
};

// ------------------------------------------------------------------ 11. the real decision moments
/**
 * The overlay that plays the comparison against the reconstructed real response. Every number and
 * every verdict sentence it shows arrives as an argument, read out of
 * app/public/real-response-summary.json, which app/scripts/bake-real-response.mjs writes from the
 * frozen experiment artifacts. The strings below are the labels around those numbers.
 *
 * These labels are registered in Amendment 2 of docs/rescueworld/theater-copy.md, and rewritten in
 * classroom English by Amendment 3 of the same deck. They are written in the deck's own register:
 * plain, factual, sentence case, no verdict on the people who decided. Nothing here judges the
 * real responders, because the record is shown as recorded.
 *
 * Amendment 3 splits the surface in two. The opening now tells the whole result in words a
 * high-school class can read on the first pass, and the wording the two agents signed sits one
 * click below it, word for word, inside the panel a reader opens.
 */

/** Small counts read better as words. Anything past ten falls back to its own digits. */
const COUNT_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
];
export const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);
/** the same count where it opens a sentence, so the sentence starts with a capital */
export const countWordCap = (n: number) => sentenceCase(countWord(n));

export const REAL = {
  /** the overlay's own name, in the help list and across its head */
  title: "How did public actions and later AI rescue proposals compare?",
  /**
   * The earthquake this experiment was run on, as the record states it: the minute the shaking
   * began, the magnitude, the agency's own intensity reading and the length of the response in
   * hours. The surface names the incident whichever recorded run is playing behind it, so where
   * the run on screen carries no opening beat of its own these values stand in for it.
   */
  incident: { magnitude: "7.1", intensity: "7", clock: "16:27", hours: 72 },
  /**
   * The line that hands a reader on to the six-step walk-through after the worked example. The
   * story on this surface follows one moment all the way through; the walk-through does the same
   * for any moment a reader picks.
   */
  traceHandoff:
    "Open any decision below to see the final recorded AI proposal first, followed by the reports it"
    + " used, the public response, its earlier proposals, and the exact rule feedback.",
  /** the heading over the moment-by-moment cards that close the surface */
  slotsHead: "Every urgent decision, with public action and AI proposals side by side",
  /** what those cards are, so they are read as the detail behind the story and not as the story */
  slotsLead: (tries: number) =>
    "Each card starts with the rescue action an AI proposed. It also shows the deadline, the"
    + ` responsible office, the public response, and results from ${countWord(tries)} tries.`,
  /** the control that opens the wording the two agents signed */
  exactLabel: "Open the exact plan written before the runs",
  /** what the reader finds inside that panel */
  exactNote:
    "The two paragraphs below are copied word for word from the plan we wrote and agreed to"
    + " before any run started. The two after them are the limits this exercise set for itself,"
    + " also written down in advance.",
  /** the label over the reconstructed record of the moment */
  realLabel: "This is what the real responders did",
  /** what the public record itself leaves open at that moment */
  openLabel: "What the record does not say",
  /** the label under a decision slot's clock */
  cutoffLabel: "Deadline",
  /** who held the decision, as the reconstruction names the office */
  deciderLabel: "Decided by",
  /**
   * The sentence that leads each moment, built from that moment's own record. The first half names
   * what the real responders sent and where; the second half is the two desks' counts side by side.
   */
  studentChoice: (quantities: string, first: string, more: number) =>
    `The public record names ${first}${more > 0 ? ` and ${countWord(more)} more units` : ""}.`
    + ` Destination totals: ${quantities}.`,
  studentNoChoice: "The public record does not name a choice for this decision.",
  /**
   * One plan, said as two lines: what was sent, then how many of them went where.
   *
   * The things are named first and the counts point back at them, because the other order left a
   * bare number sitting after a place name — "Kashima Town 1" — and a reader could not tell
   * whether the 1 was a count, a rank or a position on a list. "1 of them went to Kashima Town"
   * can only be a count. The two halves are two lines rather than one because they are two ideas.
   */
  planFirstPlace: (quantity: number, place: string) => `${quantity} of them went to ${place}`,
  /** every later place on that line, where "of them went" has already been said */
  planNextPlace: (quantity: number, place: string) => `${quantity} to ${place}`,
  /** how the line of places ends when more were named than it has room for */
  planMorePlaces: (more: number) => `and ${more} more`,
  /** how the list of things ends when more were named than the line has room for */
  planMoreThings: (more: number) => `and ${more} more`,
  studentDesks: (table: number, plain: number, tries: number) =>
    `Source-linked AI proposals passed every prewritten rule in ${table} of ${tries} tries.`
    + ` Plain-note proposals passed in ${plain} of ${tries}.`,
  /** one line under each desk's name, so a card can be read on its own */
  deskNote: {
    plain_summary: "The AI summarized the reports in plain notes, then proposed an action.",
    evidence_table: "The AI kept each claim beside its source before proposing an action.",
    evidence_feedback:
      "The AI used the same source table, received one exact error message, and answered again.",
  } as Record<string, string>,
  /**
   * The label beside the count of a moment's runs that came out clean, and the stamp on the one
   * example run shown under a desk. Both use the settled wording and no other: a run either
   * passed every prewritten check or it did not pass every prewritten check. The surface used to
   * carry a second vocabulary of broken rules beside the first, which asked a reader to work out
   * that two different sentences named one thing.
   */
  validCount: (of: number) => `of ${of} tries passed every prewritten check`,
  /** the stamp on the one example assignment shown under an arm */
  exampleValid: "This run passed every prewritten check.",
  exampleInvalid: "This run did not pass every prewritten check.",
  /** how many of the eight runs produced exactly the example shown */
  exampleSeeds: (n: number, of: number) =>
    `the same set of choices came back in ${n} of ${of} tries`,
  /** a desk that named units or places the slot's own eligible list does not carry */
  unlisted: (n: number) =>
    `${n} of these names were not on the list of units and places this decision allowed.`,
  /** the standing line on the whole surface; it is never optional and never abbreviated */
  assumption:
    "These AI rescue proposals were generated after the earthquake from information available"
    + " at each deadline. They were never carried out. This comparison does not simulate what"
    + " happened next, prove that AI would save lives, or grade the real responders.",
  /** where every number on the surface came from */
  source: (configurations: number, hash: string) =>
    `These numbers come from ${configurations} result files. Each file has a saved checksum, and`
    + " the build recalculates every count before displaying it. The file list was fixed before"
    + ` the runs. Result-set ID: ${hash.slice(0, 16)}.`,
  loading: "Reading the recorded experiment.",
  failed: (reason: string) => `The recorded experiment could not be read. ${reason}`,
  /** the line at the foot of the frame while there is more of this surface below the window */
  scrollCue: "Scroll down to read the rest of this page.",
};

/**
 * The modeled shelter-occupancy layer. It states that it is modeled every time it appears, in the
 * switch's own line and in the note it writes the first time it is asked for.
 */
export const OCCUPANCY = {
  button: "occupancy",
  under: "These are model estimates, not observed counts for individual shelters.",
  // Three technical nouns used to stand in one line here. The switch says what the numbers are
  // and where they came from, in the order a reader needs them.
  label: "modeled shelter use · estimated from prefecture totals, not measured per shelter",
};

// ------------------------------------------------------------------ 12. the rest of the region
/**
 * The exercise happens at four sites in one corner of the map, but the recorded region goes on
 * living around them: roads close at recorded minutes, the earthquake sequence keeps shaking the
 * ground, and the five real decision moments run out of time one after another. These are the
 * lines those recorded times write into the feed under the reports.
 *
 * Each line is a whole sentence, each carries the recorded clock time it happened at, and each
 * one is a place the camera can be sent to. Nothing here is computed by this page: the route
 * names, the magnitudes, the titles and the times all arrive as arguments read from the
 * delivered files.
 *
 * These strings are new and are flagged for registration in docs/rescueworld/theater-copy.md.
 */
export const REGION = {
  /** the heading over the regional lines, so they are never read as exercise reports */
  head: "This happened elsewhere in the region",
  /**
   * A road's name in English, worked out from the name the ministry's own file carries.
   *
   * Japan writes a road's class into its name, and the classes are a short fixed list: 県道 is a
   * road the prefecture maintains, 国道 is a national one, 主要地方道 is a main local road, and
   * 市道, 町道 and 村道 belong to a city, a town and a village. Expressways carry a route code at
   * the front, so E10九州中央自動車道 is expressway E10. Reading `県道142号上椎葉湯前線` off the
   * screen, an English-reading viewer gets nothing; reading "Prefectural route 142" they get the
   * class and the number, which is what the closure is about.
   *
   * Nothing is translated beyond the class and the number. The place names inside a route name
   * are left exactly as the file wrote them, and the whole original name is kept after the
   * English one, so anyone who reads Japanese still has the record's own words.
   */
  roadName(routeName: string, roadKind = ""): string {
    const name = String(routeName ?? "").trim();
    if (!name) return name;
    // the file writes some route numbers with the wide digits Japanese typesetting uses
    const plain = name.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xFF10));
    const kind = String(roadKind ?? "");
    const rules: [RegExp, (n: string) => string][] = [
      [/^(E\d+)/, (n) => `Expressway ${n}`],
      [/^県道(\d+)号/, (n) => `Prefectural route ${n}`],
      [/^国道(\d+)号/, (n) => `National route ${n}`],
      [/^(主要地方道)/, () => "A main road that runs between towns"],
      [/^(市道)/, () => "A street the city keeps up"],
      [/^(町道)/, () => "A street the town keeps up"],
      [/^(村道)/, () => "A road the village keeps up"],
    ];
    for (const [pattern, gloss] of rules) {
      const hit = pattern.exec(plain);
      if (hit) return `${gloss(hit[1])} (${name})`;
    }
    // A national road the state maintains carries only its number, so the class that names it
    // is on the road's kind rather than in its name, and an expressway may carry no code at all.
    const bare = /^(\d+)号/.exec(plain);
    if (bare && kind.includes("国道")) return `National route ${bare[1]} (${name})`;
    if (kind.includes("高速道路") || /自動車道/.test(plain)) return `An expressway (${name})`;
    return name;
  },
  /**
   * What kind of road it is, in English. The ministry's file names the class in Japanese, and
   * the list is closed: these five are every value the delivered file carries. The original word
   * is kept after the English one, exactly as the route names are.
   */
  roadKind(kind: string): string {
    const held: Record<string, string> = {
      "高速道路": "an expressway",
      "直轄国道": "a national road the state maintains",
      "補助国道": "a national road the prefecture keeps up",
      "都道府県道": "a road the prefecture keeps up",
      "市区町村道": "a road the city or town keeps up",
    };
    const word = held[String(kind ?? "").trim()];
    return word ? `${word} (${kind})` : String(kind ?? "");
  },
  /** a recorded road closure whose recorded start minute has just passed */
  road: (routeName: string, roadKind = "") =>
    `A road closes: ${REGION.roadName(routeName, roadKind)}.`,
  roadTip:
    "The Ministry of Land, Infrastructure, Transport and Tourism recorded this closure with the"
    + " minute it began. The line enters the feed at that minute, and clicking it sends the camera"
    + " to the closed road's first recorded position.",
  /** one earthquake in the recorded sequence, at or above the threshold named in the tooltip */
  quake: (magnitude: string) => `Aftershock, magnitude ${magnitude}.`,
  quakeTip: (threshold: string, shown: number) =>
    "Japan's national weather service recorded every shock in this sequence. This feed names only"
    + ` the shocks of magnitude ${threshold} and above that fall inside the time this run covers`
    + ` and on this map, which is ${shown} of them. The smaller ones are still drawn on the ground`
    + " with the other aftershocks.",
  /** one of the five real decision moments, at the minute its recorded deadline runs out */
  moment: (title: string) => `A real decision falls due: ${title}. Press r.`,
  momentTip:
    "This is the recorded deadline of one of the five real decisions, and the camera goes to the"
    + " places that moment was allowed to choose between. Only the moments whose deadline falls"
    + " inside this run's window appear here; press r for all five.",
  /** what a line states about its own recorded time */
  stamp: (clock: string) => `Recorded at ${clock}.`,
  /** when one recorded minute brings more lines than the feed shows at once */
  more: (n: number) => `${n} more entered the record in the same stretch.`,
};

/**
 * Overwatch: the camera tour. It is off until a reader asks for it, and it gives the controls
 * back the instant a key is pressed or the ground is dragged.
 */
export const WATCH = {
  label: "Overwatch",
  key: "p",
  on: "on",
  off: "off",
  tip:
    "Overwatch tours the camera on its own. Turn it on, take your hands off the controls for"
    + " twelve seconds, and the camera goes to three things in turn. It shows the place the run is"
    + " working, the last thing the region recorded, and then the whole ground. Any key or any drag"
    + " gives you the camera back at once.",
};

/**
 * The directed watch: the default way the run plays after Begin. A round plays at a readable
 * pace, holds long enough to read its headline and its newest report cards, and then starts the
 * next one on its own, with the camera going to the place each round is happening. Choosing one
 * of the named speeds leaves it and free-runs the record instead.
 */
export const DIRECTED = {
  label: "directed",
  // The chip that says which of the two ways the record is playing. "free run" read as a run that
  // costs nothing, or a run with no rules, to somebody meeting it cold.
  free: "you set the speed",
  key: "]",
  /** the countdown that rides the hold, in small type under the round's headline */
  hold: (seconds: number) => `the run moves on in ${seconds} seconds`,
  tip:
    "Directed is the guided watch. Each round plays slowly enough to read, then holds so you can"
    + " read the headline and the newest reports, and the camera goes to where that round is"
    + " happening. The countdown says when the next round starts and the ] key starts it now."
    + " Space pauses everything. Choosing a speed leaves the directed watch and plays the record"
    + " straight through at that speed; click here to come back.",
};

// ---------------------------------------------- 11. the full incident, played as one world
/**
 * The strings for a run that is one recorded story rather than two desks. NEW IN THIS BUILD
 * AND NOT YET REGISTERED IN docs/rescueworld/theater-copy.md — they are listed for the deck's
 * next amendment.
 *
 * The rule that shapes every one of them: this record holds no count of people reached, so
 * nothing here states one. What the readouts state instead is what the record does hold — the
 * moments it witnessed, the decision moments that fell due, and the tremors the agency
 * recorded. Every number is a slot filled from the log at load and never written here.
 */
export const INCIDENT = {
  /** chrome, four words */
  chip: "Open the incident — key o",
  /** the masthead's counter, where the run is walked act by act */
  mastLine: (events: number, act: number, acts: number) =>
    `28 July 2026 · ${events} recorded moments · act ${act} of ${acts}`,
  /**
   * The masthead's third line. The two-desk exercise is a labeled exercise and says so; this
   * run is the public record of what happened, and says that instead.
   */
  mark: "Public records of the response, replayed over the real ground.",
  /**
   * The sentence the outcome opens with while the run is playing. It states the scale of the
   * record and the question it holds. It states no result: a rate taken from a run that is
   * still playing is a partial rate, and the story template keeps those off the screen until
   * the debrief.
   */
  verdict: (hours: number, acts: number, decisions: number) =>
    `This replay covers the first ${hours} hours after the Kumamoto earthquake in ${acts} acts.`
    + ` It includes ${decisions} urgent response decisions. Software agents later proposed an`
    + " action for each decision, using only information available by its deadline.",
  /**
   * The three readings the outcome shows while the run plays: how far through the record the
   * viewer is, how many moments of decision have passed, and how many tremors have arrived.
   * Each label carries the number's own denominator. Chrome.
   */
  countLabels: {
    events: (total: number) => `of the ${total} moments this record holds`,
    decisions: (total: number) => `of the ${total} urgent response decisions`,
    aftershocks: (total: number) => `of the ${total} tremors the record holds`,
    /** what a graded count counts, so the big number under it is never a bare number */
    tries: (runs: number, way: string) => `of ${runs} AI proposals using ${way}`,
  },
  footnote:
    "These numbers show playback progress. The record does not measure how many people an AI"
    + " plan would reach. AI proposals receive rule-following scores only after playback ends.",
  /**
   * The three ways of deciding that were run against every moment of decision. The names are
   * the ones the registered experiment already uses on the r surface. Chrome, four words each.
   */
  ways: {
    plain_summary: "plain notes",
    evidence_table: "sources attached",
    evidence_feedback: "corrected once",
  } as Record<string, string>,
  /**
   * One card per way of deciding in the debrief. The two sentences are the aggregate line and
   * the constraint line, in the wording both agents settled on.
   */
  gradedCard: (valid: number, runs: number) =>
    `${valid} of ${runs} AI proposals met every rule written before the test.`,
  constraintCard: (constraint: number, runs: number) =>
    `${constraint} of ${runs} stayed within the hard limits this exercise set on how much could`
    + " be sent.",
  /** what passing every check means, stated once under the numbers */
  definition:
    "An AI proposal meets every rule only if it uses information available by the deadline,"
    + " chooses allowed units and destinations, stays within resource limits, and names every"
    + " required unknown.",
  /**
   * The three badges a single recorded choice or a single moment of decision can wear. The
   * third is for the six moments that sit outside the registered experiment.
   */
  badge: {
    passed: "met every rule written before the test",
    failed: (rule: string) => `missed a rule — ${rule}`,
    descriptive: "context only — no scored AI result",
  },
  /**
   * The line under that third badge, wherever it is drawn.
   *
   * The badge's own words are fixed: the story template sets them, and `main.ts` decides the
   * badge's colour by comparing against that exact string. Standing alone the badge left
   * "registered result" open to two readings, the result written down in advance or the result
   * filed afterwards, so this line says which one it is and what follows from it.
   */
  descriptiveWhy:
    "This AI proposal is shown for context. No scored eight-run comparison was recorded for this"
    + " decision.",
  /** what the wider, ungraded set of choices shows, stated as the description it is */
  descriptive: (runs: number, plain: number, table: number, corrected: number) =>
    `Six extra decisions were tested later, bringing each AI approach to ${runs} runs. Across`
    + ` all eleven decisions, the three approaches produced ${plain}, ${table}, and ${corrected}`
    + " proposals that met every rule. These extra runs provide context only. They do not count"
    + " toward the result from the five decisions chosen before the test.",
  /**
   * The finding sentence the debrief opens with: one sentence, the registered result, stated
   * as what it measures. It compares the three ways of deciding against each other and against
   * nothing else. The people who responded in July 2026 are never in this sentence.
   */
  debriefOutcome: (runs: number, plain: number, table: number, corrected: number) =>
    `In this simulated exercise, decisions that passed every prewritten check went from ${plain}`
    + ` of ${runs} tries with plain written notes to ${table} of ${runs} with an evidence table.`
    + ` Adding one short message naming the mistake took it to ${corrected} of ${runs}.`,
  /** the same opening where a run carries no graded choices: the scale of what was watched */
  debriefScale: (hours: number, events: number, decisions: number) =>
    `This replay covers ${hours} hours after the earthquake: ${events} saved events and`
    + ` ${decisions} urgent response decisions. Each decision shows what was publicly known by`
    + " its deadline.",
  /** the constraint line under the counts, which states the second measure with its own total */
  constraints: (runs: number, plain: number, table: number, corrected: number) =>
    `Plain-note proposals stayed within the limits on what they could send in ${plain} of ${runs}`
    + ` tries. Source-linked proposals did so in ${table} of ${runs} tries. After one error`
    + ` message, ${corrected} of ${runs} proposals stayed within those limits.`,
  /**
   * The debrief, told in the order `docs/method/FINDINGS-STORYTELLING-GOLD-STANDARD.md` sets: the
   * human question first, then one concrete example, then what each way of deciding actually
   * did, then what was counted and what the counts mean, then what it is good for, what it does
   * not show, and the exact next test. No number appears before a sentence a stranger can read.
   */
  story: {
    /**
     * Step zero: the incident itself, before anything else on the page. A reader who has never
     * heard of this earthquake gets the date, the place, the size of the shaking and the length
     * of the response in the first paragraph, and every later sentence rests on it.
     */
    scene: (magnitude: string, intensity: string, clock: string, hours: number) =>
      `At ${clock} on 28 July 2026 an earthquake of magnitude ${magnitude} struck Kumamoto`
      + " Prefecture in southern Japan. Japan's national weather service recorded the shaking at"
      + ` ${intensity} on its own intensity scale, which runs from 0 to 7. For the next`
      + ` ${hours} hours, which is three full days and nights, fire crews, town halls,`
      + " prefectural offices and national agencies had to decide who to send where.",
    /**
     * The clause the debrief adds to the scene, because the debrief rises at the end of a run
     * and can say what the page has just played. The surface the r key opens can be asked for
     * at any minute of a run, so it carries the scene without this clause.
     */
    replayed: (events: number) =>
      `This page has just replayed ${events} saved events from that response.`,
    /** step one: the human question, before any number */
    question:
      "During a disaster, officials must send help while reports are incomplete and sometimes"
      + " contradictory. This test asked two questions. Does linking every claim to its source"
      + " help an AI follow rescue rules? Does one exact message naming a broken rule help even"
      + " more? The AI could use only information available by each decision's deadline.",
    /** the heading over the job the agents were given. Chrome. */
    jobHead: "What the agents had to decide, and by when",
    /**
     * Step two: the job itself. It names how many moments were scored, says that each one has a
     * clock deadline taken from the record, and states the one rule that makes the exercise fair
     * — nothing published after the deadline was allowed into the answer.
     */
    job: (moments: number, tries: number) =>
      `The experiment scored ${countWord(moments)} decisions rebuilt from public records. For two`
      + " decisions, the record omitted facts the test needed: an internal alert and which team"
      + " could investigate two missing shaking readings. The screen clearly labels those added"
      + " facts as assumptions for this exercise. At each deadline, an AI proposed a rescue"
      + ` action using only the information and assumptions shown on screen. Each approach`
      + ` answered every decision ${tries} times.`,
    /** the heading over the list of scored moments. Chrome. */
    momentsHead: (moments: number) =>
      `The ${countWord(moments)} moments, and the minute each one was due`,
    /** one scored moment, said as the record states it */
    momentLine: (clock: string, title: string) =>
      `By ${clock}: ${title}`,
    /** the heading over the one moment followed all the way through. Chrome. */
    workedHead: "One of those moments, worked through all three ways of deciding",
    /**
     * Step three: the same concrete moment carried through every method, so a reader sees one
     * decision go wrong and get put right rather than three abstract descriptions. Every number
     * in these sentences is read from the recorded run.
     */
    workedMoment: (clock: string, decider: string, limit: number, unit: string) =>
      `By ${clock} on day two, ${decider} had to allocate up to ${limit} additional ${unit} among`
      + " towns with water outages, including towns that had not yet asked.",
    workedPlain: (total: number, unit: string) =>
      `Using plain notes, the AI proposed ${total} ${unit}. The answer missed at least one rule.`,
    workedTable: (total: number, unit: string, limit: number) =>
      "Using the source-linked table, the AI listed its facts and unknowns but proposed"
      + ` ${total} ${unit} against a limit of ${limit}. That answer failed the resource-limit rule.`,
    /** what the check is, said once, before its own sentence is quoted */
    workedCheckLead:
      "Fixed code—not a language model—checked whether the answer followed limits written before"
      + " the run and named the exact broken rule.",
    /** the one message that went back, and what the second answer did with it */
    workedFix:
      "The same AI answered once more using the same reports and no new facts.",
    workedPassed: (total: number, unit: string) =>
      `The revised AI proposal included ${total} ${unit} and passed every prewritten rule.`,
    /** the public record's own side of the same moment, read before any grade is stated */
    workedRecordLead: "Here is what the real responders did about the same decision.",
    /** step three, the heading over the three method cards */
    methodsHead: "The three ways the agents were asked to work",
    /**
     * What the ordinary way of working is, stated before the three cards, so a reader knows
     * which of the three is the one most agent systems already use.
     */
    normalWork:
      "In the baseline approach, the AI summarizes reports in plain notes and decides from that"
      + " summary. The other approaches add source links, then one exact error message.",
    /** step four: what one attempt was, in plain words, before any count of them */
    tryLine: (moments: number, tries: number) =>
      `One try means one AI answered one decision once. Each approach answered all ${moments}`
      + ` decisions ${Math.max(1, Math.round(tries / Math.max(1, moments)))} times, for ${tries}`
      + " tries in total. The team wrote every rule for passing before the test began and did not"
      + " change any later.",
    /** step five: the heading over the three counts */
    resultHead: "How many tries produced an answer that passed every check",
    /**
     * Step six: the counts turned into a scale a person already has. A share is written as
     * roughly one in so many, because that is how a classroom reads a proportion.
     */
    translate: (runs: number, plain: number, table: number, corrected: number) => {
      return `Plain notes passed ${plain} of ${runs} tries. Linking every claim to its source`
        + ` raised that to ${table}. Giving the AI one exact message naming its mistake raised it`
        + ` to ${corrected}.`;
    },
    /**
     * Step seven: what the correction message actually did, stated as a repair rather than as a
     * score. The three numbers are the record's own; the arithmetic between them is stated so a
     * reader can check it.
     */
    repair: (runs: number, table: number, corrected: number) =>
      `The source-linked approach failed ${runs - table} of ${runs} tries. After receiving one`
      + ` message naming its mistake, the AI fixed ${corrected - table} of those failed answers.`
      + ` All ${table} answers that had already passed still passed.`,
    /**
     * The sentence that stands beside the zero so nobody reads it as forty reckless plans. The
     * plain-notes desk mostly sent the right quantity of units; what it missed every time was
     * the written part of the job, and a try passes only when it clears every check.
     */
    zeroMeans: (runs: number, plainLimit: number) =>
      `Plain-note plans stayed within the limits on how much help they could send in ${plainLimit}`
      + ` of ${runs} tries. But every answer failed to say where its facts came from or what was`
      + " still unknown. An answer had to meet every rule, so"
      + ` 0 of ${runs} passed overall.`,
    /** the heading over what the run shows and what it does not show. Chrome. */
    provesHead: "What this shows, and what it does not show",
    /** what the finding actually proves, stated once, in ordinary words */
    proves:
      "Linking each claim to its source made it easier to trace why the AI proposed each rescue"
      + " action. Returning one exact message naming a broken rule made the proposals much more"
      + " likely to follow every rule written before the test.",
    /**
     * What failed on the way, at the same size as what passed. The registered claim was mixed:
     * four of its five parts held and one did not, and the one that did not is stated here with
     * the two counts a reader can compare.
     */
    whatFailed: (runs: number, plainLimit: number, tableLimit: number) =>
      "The evidence-table claim failed even though four of its five tests passed. It raised"
      + ` complete rule-following from 0 of ${runs} tries to 17 of ${runs}. But answers stayed`
      + ` within resource limits in only ${tableLimit} of ${runs} tries, down from ${plainLimit}`
      + ` of ${runs}. That 10-point drop exceeded the 5-point limit set before the runs, so the`
      + " whole claim failed. The narrower one-error-message claim passed all five tests.",
    /** what this record cannot say, because it holds no count of it */
    noReach:
      "The experiment did not run any AI proposal forward to see who it would reach. Its three"
      + " scores show only whether the AI named its sources and followed the written rules.",
    /** the wider set of runs, described rather than counted as a result */
    wider: (runs: number, plain: number, table: number, corrected: number) =>
      `The team ran each approach ${runs} times across all eleven decisions. Only 40 tries from`
      + " the five planned decisions count toward the result above. The other 48 tries cover six"
      + " additional decisions whose rules were written later, so they provide context only."
      + ` Across all ${runs} tries, ${plain}, ${table}, and ${corrected} proposals passed every`
      + " rule.",
    /** the heading over the closing pair: where this could be used, and the exact next run */
    useHead: "Where this could be useful, and what we test next",
  },
  /** step eight of the storytelling order: two or three real jobs this could be useful in */
  use:
    "This pattern could help people who send emergency crews, hand a hospital case to the next"
    + " shift, or make any decision from incomplete reports. It keeps every claim linked to its"
    + " source, tests the proposal against fixed rules, and tells the AI exactly what to fix.",
  /** the closing honesty line: one file, and how many events it holds */
  honesty: (events: number) =>
    `Every number here came from one recorded file of ${events} events. Each line in that file`
    + " carries a short fingerprint of the line before it, so changing any line would break every"
    + " line after it and show up at once.",
  /** shown where the debrief would list the two desks' beats and this record holds one story */
  noBeats:
    "This record is one story, so there is no second run to compare it against. The recorded"
    + " ways of deciding at each moment of decision are on the screen the r key opens.",
  /**
   * The opening announcement, in the middle of the screen, before the first act plays.
   *
   * Three short lines and the begin control, and nothing else. The card used to carry a full
   * paragraph naming the prefecture, the country and the weather agency's own intensity scale,
   * then a second sentence about counting from that minute, then the story of act one, then a
   * paragraph about the ribbon. Every one of those is already on the same frame: the brief the
   * viewer has just read says "At 16:27 on 28 July 2026 a magnitude 7.1 earthquake struck
   * Kumamoto Prefecture in Japan", the story panel at the right carries act one word for word,
   * and the ribbon carries its own label. A tired viewer arriving met a wall of copy saying the
   * same things three times.
   */
  opening: {
    label: "The earthquake",
    line: (magnitude: string) => `A magnitude ${magnitude} earthquake struck Kumamoto.`,
    clock: (clock: string) => `${clock} Japan time.`,
  },
  /** the label over the ribbon that carries the whole run. Chrome, six words. */
  ribbon: "Seventy-two hours run left to right.",
  /** the act title card, raised as each act opens. Chrome, four words. */
  act: {
    of: (index: number, total: number) => `Act ${index} of ${total}`,
  },
  /**
   * The line under the act's own headline on the transport: which moment of the act the run is
   * on, the wall clock it happened at, and how far into the three days that is. Chrome, and
   * every number says what it counts.
   */
  face: (beat: string, clock: string, hour: number, hours: number,
    moment: number, moments: number) =>
    `${beat ? `${beat} · ` : ""}${clock} · hour ${hour} of ${hours} · moment ${moment}`
    + ` of ${moments}`,
  /**
   * The panel that carries the unfolding account while the world plays. It stands in the
   * right-hand column directly over the decision rail, and the sentence saying what is happening
   * at this minute is the largest and brightest thing any running panel holds. The act's own line
   * stands under it as context, and the clock stands under that as chrome.
   */
  narrate: {
    /** which act the run is in, over the sentence. Chrome, six words. */
    kicker: (index: number, total: number, label: string) =>
      `Act ${index} of ${total} · ${label}`,
    /** the label over the act's own line. Chrome, five words. */
    aboutLabel: "What this act is about",
  },
  /**
   * The two kinds of moment the record batches by the hour. The record counts them and gives
   * them no headline of their own, so the face says what the count counts.
   */
  batched: {
    aftershocks: (n: number) =>
      `${n} tremors were recorded in this hour`,
    roads: (n: number) =>
      `${n} road closures entered the record in this hour`,
    sources: (n: number) =>
      `${n} source files were read into the record`,
  },
  /**
   * The briefing a stranger reads before pressing Begin, for the run that replays the whole
   * incident. It follows the order the storytelling standard sets: the human problem first,
   * then the question, then what is about to be shown.
   */
  briefing: {
    text:
      "At 16:27 on 28 July 2026 a magnitude 7.1 earthquake struck Kumamoto Prefecture in Japan."
      + " For the next three days, fire crews, town halls, prefectural offices and national"
      + " agencies had to decide who to send where while information was incomplete. This replay"
      + " asks a narrower question the public record can answer: what information was public when"
      + " each decision was due? You are about to watch those three days unfold over the real"
      + " ground.",
    honesty:
      "The ground, the earthquake, the aftershocks, the roads that closed and the official updates"
      + " are real public records. The choices shown at each moment of decision were made"
      + " afterwards by computer models, and are labeled as such wherever they appear.",
  },
  /**
   * The two sentences the debrief ends on, in the order the storytelling standard asks for:
   * what this replay does not show, and the experiment that would show it.
   */
  /** the standing limitation, visible wherever a grade is shown */
  limitation:
    "The displayed rules check only what the AI proposed during this exercise. They do not grade"
    + " real responders or show whether a different action would have saved more lives.",
  nextExperiment:
    "This build does not measure what happened after an AI proposal. A future test must run each"
    + " proposal inside a separate model of disaster outcomes. Experts must validate that model"
    + " with evidence beyond this one recorded response before anyone compares how many people"
    + " different proposals might reach.",
  /**
   * The decision rail, for the run that replays the whole incident. The record holds no claim
   * cards and no dispatch cards, so the rail lists the moments of decision themselves and says
   * where the run has got to among them. An empty outlined panel never stands on screen.
   */
  rail: {
    lead: (total: number) =>
      `${total} urgent response decisions appear in this three-day record. Each one shows its`
      + " deadline and the exact rescue action later proposed by the AI.",
    /** chrome, four words */
    passed: "already passed",
    /** chrome, three words */
    next: "coming next",
    /** chrome, four words */
    ahead: "still ahead",
    decider: (decider: string) => `Responsible office: ${decider}.`,
    ways: (ways: string) =>
      `${sentenceCase(ways)} AI approaches also answered this decision for comparison.`,
    note: "Open a decision to see the situation, the AI's proposed action, its evidence and"
      + " unknowns, and what responders did that day. Press R for the scored test results.",
  },
  /** the story card that hangs over the place a recorded moment happened */
  card: {
    /** the clock a card wears, in small type over its sentence. Chrome. */
    stamp: (clock: string) => `Recorded at ${clock}`,
    /** what a card says about a moment when somebody had to decide something */
    decision: (decider: string, clock: string, ways: string) =>
      `Decision deadline: ${clock}. Responsible office: ${decider}. ${sentenceCase(ways)} AI`
      + " approaches answered the same decision later.",
    /** what a card says about one of the weather service's updates on the first earthquake */
    bulletin: (clock: string) =>
      `Japan's national weather service published an update at ${clock} on that first earthquake.`,
    /** what a card says about the moment the record opens on */
    opening: (magnitude: string, clock: string) =>
      `That first earthquake, of magnitude ${magnitude}, struck at ${clock} Japan time.`,
  },
};

// ------------------------------------------------------------------ 15. the agent trace
/**
 * The five-step walk-through of one moment of decision, with the recorded real choice standing in
 * front of all five. Registered as amendment 9 in `docs/rescueworld/theater-copy.md`.
 *
 * Two rules shape every string here. The real recorded choice is read first and is never set up
 * to lose, so its card carries the same weight as the five that follow it and no sentence on any
 * of them says a real responder erred. And every grade is said in the exact words the story
 * template fixes, which live in `INCIDENT.badge`, `INCIDENT.definition` and `INCIDENT.limitation`
 * above, so this block writes no substitute of its own.
 */
export const TRACE = {
  /** the surface's own name, in the help list and across its head. Chrome, five words. */
  title: "How an AI built a rescue proposal",
  /** the control that opens it from a moment of decision. Chrome, six words. */
  open: "Open this AI rescue proposal",
  /** chrome, one to three words each */
  close: "close — esc",
  next: "next card",
  back: "card before",
  /** where the reader stands in the walk-through. Chrome. */
  place: (card: number, of: number) => `Card ${card} of ${of}`,
  /** how a reader moves through the cards. Chrome. */
  hint: "Click the card or press the right arrow for the next one.",
  /**
   * The two framing labels. One says a card holds the public record of what was done; the other
   * says a card holds what a software agent wrote afterwards. Chrome, six words each.
   */
  frameReal: "public response recorded that day",
  frameSituation: "This card shows the disaster situation at the deadline.",
  frameModel: "This AI proposal was generated later.",
  frameTest: "This card explains how one AI proposal was tested.",
  /** the one sentence that separates the two framings, on the card a reader opens on */
  realFraming:
    "This card shows what the public record says responders did—or says when no matching action"
    + " was found. Every AI proposal in this story was generated later and was never carried"
    + " out.",
  /** the heading over each of the six cards */
  head: {
    situation: "What was happening at this deadline?",
    real: "What does the public record say responders did?",
    known: "Which reports were available, and what remained unknown?",
    check: "Did this AI proposal follow the rules?",
    final: "What rescue action did the AI finally propose?",
    testing: "How this AI proposal was tested",
  },
  /** the kicker over a step card. Chrome, four words. */
  step: (n: number, of: number) => `Step ${n} of ${of}`,
  /** the kicker over the card that holds the record, which is read before the five. Chrome. */
  realKicker: "Public-response context",
  /** the line at the foot of the frame while there is more of this card below the window */
  scrollCue: "Scroll down to read the rest of this card.",
  /** the moment's own deadline, written out in full under its title */
  deadline: (words: string) => `Decision deadline: ${words}.`,
  /** who the record says had to make it */
  decider: (decider: string) => `Responsible office: ${decider}.`,
  /** which recorded run of this decision the walk-through follows */
  seedLine: (seed: number, of: number) =>
    `This walkthrough follows recorded try ${seed}. It is one of ${of} tries for this decision;`
    + " the other tries sometimes chose different details.",
  /** what the decision asked for, quoted from the exercise's own instruction */
  taskLine: (task: string) => `The AI was asked: ${task}`,
  testingLead:
    "The same decision was answered three ways so the team could measure which working habits"
    + " made AI proposals easier to trace and more likely to follow the written rules.",
  testingPlain: "First answer: plain notes",
  testingTable: "Second answer: every claim linked to its source",
  testingRevision: "Final answer: the AI changed its proposal after one exact rule message",
  testingResult: (verdict: string) => `Result: ${verdict}`,
  /** the labels over the blocks inside a card. Chrome, a short phrase each. */
  openLabel: "Unanswered questions in the public record",
  reportsLabel: "Reports available at the deadline",
  unknownsLabel: "Required unknowns",
  weighedLabel: "How the AI used each report",
  planLabel: "The AI proposed these units and destinations.",
  finalLabel: "The AI revised these units and destinations.",
  messageLabel: "Rule violations found",
  changeLabel: "What the AI changed after feedback",
  /**
   * The sentence under this label is the language model's own writing, saved word for word when
   * the run was recorded. The label has to say so, because nothing else on the card does. A
   * reader who met the old label, "What the computer wrote as its own reason", could still take
   * the sentence for the page's own summary of the answer, so the label now says that the words
   * are the machine's and that they are quoted rather than retold.
   */
  reasonLabel: "AI's recorded reason, quoted verbatim",
  /**
   * The two lines under that quotation.
   *
   * The first is printed under every quotation. It says the words are the record's and points
   * back at the plan listed above, because some of these answers describe their own plan wrongly.
   * One of them says three fire brigades went to one site and one to the other, and then calls a
   * fourth brigade the one that went to the second site, so a reader counting crews gets four or
   * five and cannot tell which. What that answer actually asked for is in the plan lines directly
   * above, unit by unit and place by place, straight out of the record.
   *
   * The second is printed only where a bracket was actually added, and says whose words the
   * brackets are.
   */
  reasonFrame:
    "The itemized list above shows what the AI proposed. The quoted paragraph below shows why the"
    + " AI said it made those choices. If they disagree, use the itemized list.",
  reasonBrackets:
    "[Brackets] expand terms used by the AI.",
  compareLabel: "Compare the AI proposal with the public response.",
  /** the opening line of the card that lists what was known */
  knownLead: (facts: number, when: string) =>
    `By ${when}, ${countWord(facts)} ${facts === 1 ? "report was" : "reports were"} available to`
    + " the AI. Later reports were excluded.",
  /** the opening line where a decision's own file holds no report of its own */
  knownNone:
    "No reports were available to the AI for this decision. It received only its instructions"
    + " and a list of facts it had to mark as unknown.",
  /** the opening line over the unknowns a decision required a decider to name */
  unknownsLead: (n: number) =>
    `At this deadline, ${countWord(n)} required ${n === 1 ? "fact was" : "facts were"} still`
    + " unknown.",
  /** what each of the three desks is, said in ordinary words on its own card */
  desk: {
    plain_summary: "This AI proposed an action from a plain-note summary.",
    evidence_table: "This AI linked each claim to its source before proposing an action.",
    evidence_feedback: "This AI received one rule-violation message, then revised its proposal.",
  } as Record<string, string>,
  /** the name a desk goes by across the walk-through. Chrome, a short sentence-less phrase. */
  deskName: {
    plain_summary: "The AI used plain notes",
    evidence_table: "The AI linked each claim to its source",
    evidence_feedback: "The AI revised once after feedback.",
  } as Record<string, string>,
  /**
   * A plan, said one line at a time. A moment that hands out a divisible pool of units counts
   * them; a moment that hands out named units names each one. Both forms say what the number
   * counts, and neither runs past a line a person can read in one breath.
   */
  planCount: (total: number, unit: string, places: string) =>
    `The AI proposed ${total} ${unit} ${places}.`,
  planNamed: (units: number) =>
    `The AI proposed ${countWord(units)} named units and destinations.`,
  planNone: "The AI proposed no action.",
  planPartCount: (quantity: number, unit: string, place: string) =>
    `Proposed: ${quantity} ${unit} to ${place}.`,
  planPartNamed: (unit: string, place: string) =>
    `Proposed: ${unit} to ${place}.`,
  /**
   * The same line where the answer wrote a name the exercise does not carry, in the machine form
   * an identifier takes. The name is shown as the answer's own wording rather than as a fact, so
   * a reader sees what the desk actually wrote without being asked to read a code.
   */
  // A name the answer made up rather than picked off the list it was given. The old wording,
  // "which is the answer's own wording", left a reader guessing whether the phrase was invented
  // or merely quoted, so these say invented.
  planPartWroteUnit: (unit: string, place: string) =>
    `The AI proposed ${unit} for ${place}, but this decision did not allow ${unit}.`,
  planPartWrotePlace: (unit: string, place: string) =>
    `The AI proposed ${unit} for ${place}, but ${place} was not an available destination.`,
  planPartWroteBoth: (unit: string, place: string) =>
    `The AI proposed ${unit} for ${place}, but this decision allowed neither what the AI chose`
    + " nor where it sent it.",
  /** the same two forms, for the choice the public record holds */
  realCount: (total: number, unit: string, places: string) =>
    `The record names ${total} ${unit} ${places}.`,
  realNamed: (units: number) =>
    `The record names ${countWord(units)} units and where each one went.`,
  realNone: "The public record names no choice of units for this decision.",
  realPartCount: (quantity: number, unit: string, place: string) =>
    `The record names ${quantity} ${unit} for ${place}.`,
  realPartNamed: (unit: string, place: string) =>
    `The record names ${unit} for ${place}.`,
  /** the same two forms again, for the answer the walk-through ends on */
  finalCount: (total: number, unit: string, places: string) =>
    `The corrected AI proposal includes ${total} ${unit} ${places}.`,
  finalNamed: (units: number) =>
    `The corrected AI proposal names ${countWord(units)} units and a destination for each.`,
  /** how many places a plan reaches, as a clause the count lines above end on. Chrome. */
  places: (n: number) =>
    (n === 1 ? "that all go to one place" : `that go to ${countWord(n)} places`),
  /**
   * The count noun a divisible pool of units is counted in, keyed by the pool's own recorded
   * kind, in both its one and its many form. A pool whose kind is not listed here is counted in
   * units, which is the word this whole surface already uses for a thing a moment can send.
   */
  unit: {
    DIVISIBLE_WATER_TRUCK_POOL: { one: "water truck", many: "water trucks" },
  } as Record<string, { one: string; many: string }>,
  /** what a pool with no plain count noun of its own is counted in. Chrome, one word. */
  unitFallback: { one: "unit", many: "units" },
  /** the totals under a plan, and the limit this decision set on them */
  totalLine: (total: number, unit: string) =>
    `Total proposed: ${total} ${unit}.`,
  limitLine: (limit: number) => `Maximum allowed: ${limit}.`,
  /** how each report was counted, said in ordinary words */
  factorLead: (n: number) =>
    (n === 1
      ? "The AI used one report in forming this proposal."
      : `The AI used ${countWord(n)} reports in forming this proposal.`),
  factorState: {
    SUPPORTS: "The AI treated this report as support.",
    CONTRADICTS: "The AI treated this report as evidence against the proposal.",
    UNKNOWN: "The AI treated this report as unresolved.",
  } as Record<string, string>,
  /** which of the required unknowns a desk named */
  unknownsNamed: (named: number, of: number) =>
    `The AI acknowledged ${countWord(named)} of ${countWord(of)} required unknowns.`,
  unknownsNone: (of: number) =>
    (of === 1
      ? "The AI omitted the required unknown."
      : of === 2
        ? "The AI omitted both required unknowns."
        : `The AI omitted all ${countWord(of)} required unknowns.`),
  unknownsAll: (of: number) =>
    (of === 1
      ? "The AI acknowledged the required unknown."
      : of === 2
        ? "The AI acknowledged both required unknowns."
        : `The AI acknowledged all ${countWord(of)} required unknowns.`),
  /** an unknown a desk named that this decision never asked for */
  unknownsExtra: (n: number) =>
    (n === 1
      ? "The AI also named one unknown this decision did not require."
      : `The AI also named ${countWord(n)} unknowns this decision did not require.`),
  /** how many of the names in a plan are outside this decision's own lists */
  unlisted: (n: number) =>
    (n === 1
      ? "The AI proposal names something to send or somewhere to send it that this decision did"
        + " not allow."
      : `The AI proposal names ${countWord(n)} unavailable units or destinations.`),
  /**
   * What the check found, one sentence per rule it named. The checker writes its findings as a
   * rule name and an identifier — `MISSING_REQUIRED_UNKNOWN: unknown-people-alive-by-time` — and
   * those exact lines stay in the recorded evidence this page reads. What a reader sees is the
   * same finding with every identifier replaced by the thing it names, in ordinary words.
   */
  said: {
    quantity: (total: number, limit: number) =>
      `The AI proposed ${total}; the limit was ${limit}.`,
    quantityFloor:
      "The AI tried to send only part of a crew or response team, but this decision required"
      + " every team to stay together.",
    capacity: (asked: number, held: number, pool: string) =>
      `The AI requested ${asked} from ${pool}, but only ${held} were available.`,
    ineligibleTarget: (place: string) =>
      `${place} was not an available destination.`,
    ineligibleResource: (unit: string) =>
      `${unit} was not one of the choices this decision allowed.`,
    missingUnknown: (text: string) =>
      `The AI omitted a required unknown: ${text}`,
    missingUnknownPlain:
      "The AI omitted a required unknown.",
    unknownOutside:
      "The AI named an unknown this decision did not require.",
    // Every answer does two separate things with a report: it lists the report as one it read,
    // and it says what that report meant for its plan. The page used to call those two acts
    // "citing" and "weighing" without ever saying how they differ, and one whole finding is about
    // the difference. Both acts are now spelled out wherever either one is named.
    cutoffObservation: (text: string) =>
      `The AI cited a report that was unavailable at the deadline. ${text}`,
    cutoffObservationPlain:
      "The AI cited a report that was unavailable at the deadline.",
    cutoffFactor: (text: string) =>
      `The AI used a report that was unavailable at the deadline. ${text}`,
    cutoffFactorPlain:
      "The AI used a report that was unavailable at the deadline.",
    noSupport: "The AI cited no report supporting its proposal.",
    factorMismatch:
      "The reports the AI said it read do not match the reports it used to justify the proposal.",
    reuse: "The AI assigned the same limited group of resources twice.",
    assignmentCount: (lines: number) =>
      `The AI proposed ${lines} destinations; this decision allowed a different number.`,
    assignmentCountPlain: "The AI proposed a different number of destinations than allowed.",
    duplicateObservation: "The AI cited one report twice.",
    duplicateFactor: "The AI evaluated one report twice.",
    duplicateUnknown: "The AI named one unknown twice.",
    hindsight: "The AI used information published after the deadline.",
    ungradable:
      "The AI returned a proposal the rule checker could not read.",
    /** any rule this list has no sentence of its own for, said through its own plain wording */
    other: (rule: string) => `The AI proposal broke one rule: ${rule}.`,
  },
  /** what the check is, before its own findings are stated */
  checkWhat:
    "A computer program used rules written before the run to check the AI proposal.",
  /** the check found nothing to correct */
  checkClean:
    "The rule check found no broken rule, so the AI kept its first proposal.",
  /** what the message means, in ordinary words */
  checkQuantity: (total: number, limit: number) =>
    `In plain words: the quantities in that answer add up to ${total}, and this decision allowed`
    + ` ${limit}.`,
  checkRules: (rules: number) =>
    (rules === 1
      ? "In plain words: the check named one broken rule in that answer."
      : `In plain words: the check named ${countWord(rules)} broken rules in that answer.`),
  /** the second answer, and the one rule it worked under */
  checkAgain:
    "The AI received one message naming the broken rule, then revised its proposal using the same"
    + " reports.",
  /** one line of what the second answer moved */
  changeMoved: (place: string, from: number, to: number) =>
    `The AI changed ${place} from ${from} to ${to} units.`,
  changeAdded: (place: string, unit: string) => `The AI added ${unit} for ${place}.`,
  changeRelocated: (unit: string, from: string, to: string) =>
    `The AI moved ${unit} from ${from} to ${to}.`,
  changeDropped: (place: string, unit: string) => `The AI removed ${unit} from ${place}.`,
  changeTotals: (from: number, to: number, unit: string) =>
    `The proposed total changed from ${from} ${unit} to ${to} ${unit}.`,
  changeNone: "The revised proposal kept the same units and destinations.",
  /** what a second answer changed where it moved no unit at all */
  changeWeighed: (report: string, state: string) =>
    `The AI changed how it used one report: ${report} ${state}`,
  changeNamedUnknown: (unknown: string) =>
    `The AI acknowledged one more required unknown: ${unknown}`,
  changeDroppedUnknown: (unknown: string) =>
    `The AI stopped naming this unknown: ${unknown}`,
  /** the comparison at the foot of the last card: kind and scale, and nothing more */
  compareSame: (real: number, model: number, unit: string) =>
    `Responders sent ${real} ${unit}; the AI proposed ${model} ${unit}.`,
  compareNamed: (real: number, model: number) =>
    `The public record names ${countWord(real)} units. The AI proposed ${countWord(model)}.`,
  compareDifferent:
    "Responders and the AI chose different kinds of action, so their quantities are not"
    + " comparable. This does not show which action was better.",
  compareNone:
    "The public record names no choice of units for this decision, so there is nothing here to set"
    + " the simulated decision beside.",
  compareClaim:
    "These two lines compare only what each side proposed and how much. They do not say which"
    + " choice was better.",
  /** where every word on this surface came from */
  source: (events: number) =>
    `Source: the recorded run's ${events} saved events and the file used to verify its AI`
    + " decisions.",
  /** the plain sentence behind each rule the check can name */
  rule: {
    CONSTRAINT_QUANTITY: "sent more than allowed",
    CONSTRAINT_RESOURCE_CAPACITY: "requested more units than were available",
    CONSTRAINT_RESOURCE_REUSE: "asked to use the same limited supply twice",
    CONSTRAINT_ASSIGNMENT_COUNT: "named the wrong number of destinations",
    INELIGIBLE_TARGET: "named an unavailable destination",
    INELIGIBLE_RESOURCE: "invented a resource that this decision did not allow",
    CUTOFF_INVALID_OBSERVATION: "cited a report unavailable at the deadline",
    CUTOFF_INVALID_FACTOR: "used a report unavailable at the deadline",
    MISSING_REQUIRED_UNKNOWN: "did not name a required unknown",
    UNKNOWN_ID_OUTSIDE_SLOT: "named an unknown this decision did not require",
    NO_SUPPORTING_OBSERVATION: "cited no report supporting the proposal",
    FACTOR_SET_MISMATCH:
      "listed one set of reports but used a different set to justify the proposal",
    DUPLICATE_OBSERVATION: "cited one report twice",
    DUPLICATE_FACTOR: "evaluated one report twice",
    DUPLICATE_UNKNOWN: "named one unknown twice",
    HINDSIGHT_OBSERVATION: "used information published later",
    HINDSIGHT_FACTOR: "relied on information published later",
    HINDSIGHT_FINGERPRINT: "repeated information published later",
    UNGRADABLE: "returned a proposal the checker could not read",
  } as Record<string, string>,
  /**
   * The same two rules where one answer broke them more than once. A badge reading "it named a
   * place that is not on the list of places this decision allowed" standing over a body line
   * saying six of the names were outside the list gives a reader two accounts of one thing, so
   * the badge counts them when there is more than one.
   */
  ruleCounted: {
    INELIGIBLE_TARGET: (n: number) =>
      `named ${countWord(n)} unavailable destinations`,
    INELIGIBLE_RESOURCE: (n: number) =>
      `named ${countWord(n)} unavailable units`,
  } as Record<string, (n: number) => string>,
  /** a rule the check named that this list has no plain wording for */
  ruleUnnamed: "the check named a rule this page has no plain wording for",
};

// ------------------------------------------------------------------ 16. the decision outcomes
/**
 * What a viewer reads about a decision without touching anything: who decided, what the agents
 * chose, how far the eight recorded tries agreed, and whether the answer passed every prewritten
 * check. Registered as amendment 12 in `docs/rescueworld/theater-copy.md`.
 *
 * Three rules shape every string here. No percentage is written anywhere, because the honest
 * thing this record holds is a count of eight recorded tries. Every grade is said in the exact
 * words `INCIDENT.badge`, `INCIDENT.definition` and `INCIDENT.limitation` already fix above, so
 * nothing here writes a substitute. And a moment outside the frozen experiment never carries a
 * count at all, because a count on such a moment would read as part of a result it is not in.
 */
export const OUTCOMES = {
  /** the label over the eight cells beside a choice. Four words. */
  stripLabel: "How did the eight AI proposals vary?",
  /**
   * The label a moment outside the frozen experiment wears over its own eight cells. The cells
   * there are empty, so a label promising a count of agreeing tries and a row of cells carrying
   * none say two different things at once. This says the same thing the cells do.
   */
  stripLabelNone: "No scored AI runs for this decision",
  /**
   * What the five cell states mean, written where the cells first appear and again in the ledger.
   * A reader is never asked to hover for it, because a person showing this in front of a room
   * never hovers. The two colours are named as colours, because that is what a viewer sees.
   */
  stripLegend:
    "Filled cells repeat the most common proposal; outlined cells differ. Blue met every rule;"
    + " orange broke at least one. Dim outlines mark unscored decisions.",
  /**
   * What a grade is about, said next to the grade wherever the eight cells stand beside it. The
   * grade reads one answer and the cells read eight tries, and a reader who takes the grade as a
   * verdict on all eight has read the surface wrong.
   */
  badgeScope:
    "One badge states whether this AI proposal passed. Eight cells show what happened across all"
    + " eight tries.",
  /**
   * The eight cells said in words, for a reader who cannot see them. The contract writes both
   * of these sentences itself, and this joins them in the order the cells are read.
   */
  stripReading: (agreement: string, pass: string) => `${agreement} ${pass}`,
  /** the eight outlined cells a moment outside the frozen experiment carries instead */
  stripDescriptive:
    "This unscored AI replay has no eight-run comparison.",
  /**
   * What a reader should do where the eight tries scattered. The sentence states the count it
   * is about, so the advice and the number a reader can see are the same fact.
   */
  weakAgreement: (agreement: number, tries: number) =>
    `Only ${agreement} of ${tries} AI runs proposed the same plan. Inspect the deadline reports`
    + " before treating it as representative.",
  /** the control that opens the itemized list under a grade. Four words. */
  reasonOpen: "Show rule violations",
  /** the same control once the list is open. Three words. */
  reasonClose: "Hide the rules this proposal broke",
  /** the line where a check found nothing to name */
  reasonNone: "This AI proposal broke no stated rule.",
  /**
   * The map telegraph. As a deadline comes up, every place the recorded answers proposed lights
   * on the ground before the moment resolves, so a viewer sees what is about to be decided
   * rather than only what was decided.
   */
  telegraph: {
    underConsideration: "The AI considered sending help here before the deadline.",
    chosen: "The AI proposed sending help here.",
    notChosen: "The AI considered this place but did not include it in the proposal.",
    /** the label over the ghost stack. Four words. */
    label: "Where the AI proposed sending help",
    /** the deadline this telegraph is counting down to */
    due: (clock: string) => `This decision is due at ${clock}.`,
    /** one candidate place, with the count the answer put on it */
    place: (place: string, quantity: number, unit: string) =>
      `${place}: ${quantity} ${unit}`,
    /** a candidate place a recorded answer named without a quantity of its own */
    placePlain: (place: string) => place,
    /** which desk asked for this place, said in the desk's own name */
    wanted: (desk: string) => `proposed by ${desk}`,
    /** where every shown answer named the same place */
    agreed: "All three AI approaches proposed this destination.",
    /**
     * Names an answer wrote that the record does not put anywhere on this map. The plain-notes
     * desk wrote place labels the exercise's own list does not carry, so those names have no
     * coordinate to stand at, and the count of them stands here instead of a marker.
     */
    unplaced: (n: number) =>
      (n === 1
        ? "One more place an answer named has no recorded position on this map."
        : `${countWordCap(n)} more places the answers named have no recorded position on this`
          + " map."),
    /**
     * More places stand at this one recorded position than the map shows at once. The telegraph
     * carries four at most so it stays readable over the ground, and the rest are counted here.
     * Every one of them is listed in the walk-through this decision opens.
     */
    more: (n: number) =>
      (n === 1
        ? "One more place stands at this same recorded position."
        : `${countWordCap(n)} more places stand at this same recorded position.`),
    /** the sentence that prints when the deadline passes and the chosen dispatch draws */
    resolved: (sentence: string) => sentence,
    /**
     * One decision can propose places at more than one recorded position, and each position gets
     * its own panel. Where the window is too narrow to stand them clear of each other, the panels
     * that have no room are dropped and counted here rather than drawn over one another. Every
     * place they carry is listed in full in the walk-through this decision opens.
     */
    crowded: (n: number) =>
      (n === 1
        ? "One more set of places these answers named stands somewhere else on this map. The map"
          + " here is too narrow to show that panel without it overlapping the one on screen, so"
          + " it is left out. Open the walk-through to read every place in full."
        : `${countWordCap(n)} more sets of places these answers named stand elsewhere on this map.`
          + " The map here is too narrow to show those panels without them overlapping the one on"
          + " screen, so they are left out. Open the walk-through to read every place in full."),
    /** what the ghost outlines are, stated once so a hollow mark is never read as a real unit */
    what:
      "Hollow marks show proposed destinations before the deadline. No real team moved because"
      + " of these AI proposals.",
  },
  /**
   * The ledger the run closes on: all eleven moments of decision, each with what was chosen, how
   * far the tries agreed, the grade, and the record set beside it. It lists moments and totals
   * nothing, because a total across eleven moments would be a score this experiment never made.
   */
  ledger: {
    /** the surface's own name across its head. Eight words. */
    title: "AI agents proposed rescue actions at eleven points during the first 72 hours.",
    /** the control that opens it from the closing panel. Five words. */
    open: "Open every AI rescue decision",
    /** chrome, three words */
    close: "close — esc",
    /** the opening sentence, which says what the list is before any count appears */
    lead: (moments: number) =>
      `This page lists all ${moments} urgent response decisions. Each row starts with what the AI`
      + " proposed and what responders did. Open the test details to compare repeated runs and"
      + " the rules they met.",
    /** the sentence that says which rows carry counts and which do not */
    scope: (registered: number, descriptive: number) =>
      `${countWordCap(registered)} decisions have scored AI runs. The other`
      + ` ${countWord(descriptive)} show one unscored AI proposal for context.`,
    /** the label over the two moments the contract singles out. Seven words. */
    markedHead: "AI proposals that changed most",
    /** the label over the closing counts. Five words. */
    countHead: "Rule-check totals for scored AI proposals",
    /** the label on a row that carries a classification from the contract */
    marked: {
      exceptional: "All eight AI proposals met every rule",
      perfect_repair: "One error message led all eight revisions to pass",
      persistent_problem: "Most revised AI proposals still broke a rule",
    } as Record<string, string>,
    /** the control on each row. Six words. */
    row: "Open this AI decision story",
    /** the line at the foot while there is more of the ledger below the window */
    scrollCue: "Scroll down to read the remaining decisions.",
    /**
     * The ledger opens on a key at any hour, so the line across its head has to say which of the
     * two things is true. `OUTCOMES.ended` is kept for a run that has actually finished; this is
     * what a reader who opened it at hour two sees instead.
     */
    playing: (moments: number) =>
      `The run is still playing. This page shows all ${countWord(moments)} decisions in the`
      + " record, including the ones the run has not reached yet.",
    /**
     * A recorded run other than the one the highlight file was derived from. That file names the
     * run it belongs to, and printing its counts under a different record would put one run's
     * numbers under another run's name. So the counts, the marked moments and the source line
     * all go, and this sentence stands in their place.
     */
    noHighlights:
      "This recorded run has no verified score file. You can still read every decision, but"
      + " the page cannot show how often the eight tries chose the same proposal or which"
      + " decisions were scored.",
    /** where the ledger's own numbers came from */
    source: (file: string) =>
      `Score source: ${file}. The build regenerates and checks these counts against the recorded`
      + " run.",
  },
  /** the run has reached its end and the ledger is waiting. Six words. */
  ended: "The 72-hour response replay is complete.",
};

// ------------------------------------------------------------------ 17. the decision tree
/**
 * The decision tree: every moment of decision in the record, on one line, one at a time.
 *
 * What the screen is. Eleven marks stand in a row, one for each moment in the record when
 * somebody had to decide something, in the order they happened. Exactly one of them is chosen at
 * any time, and that one says what the software agents chose to do at that minute: what they
 * sent, how many, where it went, why, and what the prewritten check made of it. What the real
 * responders were recorded doing stands under its own heading below it. At the five moments the
 * frozen experiment graded, one deliberate press then shows how the three ways of working
 * answered, one press more shows one of them as eight recorded tries, and one press more opens
 * one of those tries.
 *
 * Why the action leads. An earlier build of this screen opened on the way of working — "the desk
 * that wrote plain notes" — and a reader met laboratory vocabulary where the subject is an
 * earthquake response. `docs/rescueworld/ACTION-FIRST-PRESENTATION-CONTRACT.md` fixes the order
 * for every surface of this product: situation, action, reason, unknowns, check, public record,
 * and the experiment's own machinery last and behind a deliberate press.
 *
 * Why it is built to open one level at a time. Two earlier builds of this screen put everything
 * on screen at once — eleven cards, fifteen branches and the same counting sentence over and
 * over — and could not be read. The contract that replaced them is
 * `docs/rescueworld/DECISION-TREE-SPEC.md`, and it fixes both the order of disclosure and the
 * number of words each part may spend.
 *
 * The one rule the whole surface exists under. Everything here is a recorded answer and the
 * verdict checks written before the run gave it. Nothing here says what the world would have
 * become if a different answer had been carried out, because nothing in this project ever
 * simulated that. The closing sentence below says so on screen at all times.
 */
export const TREE = {
  /** the surface's own name, across its head. Three words. */
  title: "AI rescue decision map",
  /** the control that closes it. Chrome, three words. */
  close: "close \u2014 esc",
  /** why the screen exists, in one sentence. The contract allows eighteen words; this is ten. */
  purpose: "The map follows eleven decisions made during Kumamoto's first 72 hours.",
  /** the standing qualifier, agreed with the other agent and kept in view the whole time */
  qualifier:
    "These are recorded AI rescue proposals, not actions taken or possible futures.",
  /** how to read the two colours, said once at the top of the screen and nowhere else */
  legend: "Blue passed every check. Orange missed one.",
  /**
   * What the row of marks is and is not. The marks are spaced evenly so the seven moments of the
   * first evening do not collapse into one knot, and evenly spaced marks would otherwise be read
   * as evenly spaced hours, so the screen says which it is.
   */
  spineNote: "Beacons follow decision order; each shows its actual deadline.",
  /** the whole row, named for a reader using a screen reader. Chrome. */
  spineLabel: "The page lists eleven decisions from the earthquake response in time order.",
  /** one mark, named for a reader using a screen reader. Chrome. */
  markLabel: (n: number, of: number, clock: string, locator: string, _registered: boolean) =>
    `Decision ${n} of ${of}. ${clock}. ${locator}.`,
  /** where the reader is standing, over the one moment that is open. Chrome, four words. */
  place: (n: number, of: number) => `Decision ${n} of ${of}`,
  /** the moment's own deadline, said as compactly as a deadline can be said. Chrome. */
  when: (words: string) => `Deadline ${words}`,
  /** the label over the sentence saying what the responders actually did. Three words. */
  realLabel: "What does the public record say responders did?",
  /** the label over the action the software agents proposed at this moment. Five words. */
  actionLabel: "What rescue action did the AI finally propose?",
  /**
   * The one thing a reader has to know about that action before anything else: it was never
   * carried out. The agents answered a frozen snapshot of this moment long after the earthquake,
   * and no unit named here moved because of them.
   */
  actionFrame:
    "This AI proposal was generated later and was never carried out.",
  /** the label over the places one action reached */
  spotLabel: "Proposed destinations",
  /** how many went to one place, on a branch card. Chrome, two or three words. */
  spot: (count: string) => count,
  /** where a branch card's units went, on the card's second line */
  spotTo: (place: string) => `to ${place}`,
  /** what a branch card says where the answer chooses where to look first */
  spotCheck: "The AI marked this place as a priority.",
  /** the parts of an action past the four the row of cards holds */
  moreUnits: (n: number) =>
    (n === 1
      ? "One more thing the AI proposed sending appears below."
      : `${countWordCap(n)} more things the AI proposed sending appear below.`),
  morePlaces: (n: number) =>
    (n === 1
      ? "The AI proposal names one more destination below."
      : `The AI proposal names ${countWord(n)} more destinations below.`),
  /** the control that names the places past the four the row of cards holds. Four words. */
  rest: "Show every proposed destination",
  restOpen: "Show fewer destinations",
  /** the same control where each card is one thing sent rather than one place reached */
  restUnits: "Show everything the AI proposed sending",
  restUnitsOpen: "Show fewer proposed items",
  /** the label over the reports one answer weighed before it chose */
  whyLabel: "Which evidence supported this AI proposal?",
  /** where the record holds no reason of any kind for the answer */
  whyNone: "The AI gave no reason for this proposal.",
  /** the control that opens the frozen experiment's evidence. Six words. */
  tested: "Compare scored AI proposals",
  testedOpen: "Hide scored AI proposals",
  /** the divider the contract fixes, between the record and the later exercise */
  divider: "Three AI approaches answered the same rescue decision.",
  /** what a moment outside the frozen experiment says when it is the one open */
  excluded:
    "This AI proposal is context only. No scored eight-run comparison was recorded for this"
    + " decision.",
  /** one way of working, collapsed: the count of its eight tries. The contract fixes the wording. */
  methodResult: (passes: number, tries: number) =>
    `${passes} of ${tries} AI proposals met every stated rule`,

  // ---------------------------------------------------------------- what an agent actually did
  /**
   * A branch card leads with the action, not with the machinery.
   *
   * The first build of these cards led with the way of working — "the desk that kept an evidence
   * table" — and a reader met a piece of laboratory vocabulary where the thing they came for is
   * an earthquake response. The card now opens on what that agent asked for at that minute: what
   * it sent, how many, and where. Every part of that sentence is read off the recorded answer.
   * The way of working shrinks to a two-or-three-word tag at the foot of the card.
   */
  /** the three ways of working, said as the plain difference between them */
  methodTag: {
    plain_summary: "notes alone",
    evidence_table: "sources attached",
    evidence_feedback: "corrected once",
  } as Record<string, string>,
  /**
   * What a moment's units are called in one short sentence, keyed by the kind the record gives
   * them. Each word here matches the record's own longer wording for those units — the pool the
   * record calls a `LIAISON_PAIR` is written out in the walk-through as "a pair of roads-ministry
   * officers sent into a town hall", and a card counting several of them says "pairs of
   * officers". A plan that mixes kinds, or that names units this moment never offered, has no one
   * word of its own and is counted in units.
   */
  actionUnit: {
    COMMAND_SUPPORT: { one: "command team", many: "command teams" },
    PREFECTURAL_FIRE_BATTALION: { one: "fire brigade", many: "fire brigades" },
    AIR_UNIT: { one: "helicopter crew", many: "helicopter crews" },
    GROUND_RESPONSE_GROUP: { one: "response team", many: "response teams" },
    LIAISON_PAIR: { one: "officer pair", many: "officer pairs" },
    DIVISIBLE_WATER_TRUCK_POOL: { one: "water truck", many: "water trucks" },
  } as Record<string, { one: string; many: string }>,
  /** the kind of answer that sends nothing anywhere: it names which place to look at first */
  checkFirstKind: "INFORMATION_PRIORITY",
  /**
   * The kinds of answer that pick a course of action rather than send a unit anywhere: what level
   * of national command to open, which armed service to ask for help, which job to protect first.
   * Nothing is sent at those moments, so the sentence names what was chosen instead of counting
   * units. The kinds themselves are the record's own, and the words each one is said in come from
   * the plain-language table the walk-through already uses.
   */
  chooseKinds: [
    "MODELED_POLICY_CHOICE", "MODELED_DECISION_CAPACITY", "DEFENSE_DISPATCH_REQUEST",
  ] as string[],
  /** the kind the record gives the whole earthquake area, as against one town or one site */
  wholeAreaKind: "INCIDENT_AREA",
  /** what the agents chose, where the choice is a course of action rather than a unit to send */
  actionPicked: (items: string[]) => `The AI proposed: ${items.join("; ")}.`,
  actionGrouped: (total: number, place: string, groups: string) =>
    `The AI proposed sending ${countWord(total)} emergency-response groups to ${place}: ${groups}.`,
  actionMoreUnits: (n: number) =>
    `the AI also proposed ${countWord(n)} more ${n === 1 ? "resource" : "resources"}`,
  actionMorePlaces: (n: number) =>
    `the AI also named ${countWord(n)} more ${n === 1 ? "destination" : "destinations"}`,
  /** one such choice, where it lands on one named place rather than on the whole area */
  pickedAt: (choice: string, place: string) => `${choice}: ${place}`,
  /**
   * What the agents chose, said as a person says it: who chose, what they chose to do, how many
   * and where. "Chose to send" rather than "sent", because no unit named here moved: these are
   * answers to a frozen copy of the moment, given long after the day itself.
   */
  actionOne: (count: string, place: string) =>
    `The AI proposed sending ${count} to ${place}.`,
  /** the same, where two places each received the same number */
  actionEach: (count: string, first: string, second: string) =>
    `The AI proposed sending ${count} each to ${first} and ${second}.`,
  /** the same, where two places received different numbers */
  actionSplit: (first: string, firstPlace: string, second: string, secondPlace: string) =>
    `The AI proposed sending ${first} to ${firstPlace} and ${second} to ${secondPlace}.`,
  /** the same, across too many places to name in one sentence */
  actionAcross: (count: string, places: number) =>
    `The AI proposed sending ${count} across ${countWord(places)} destinations.`,
  /** a moment whose answer chooses where to look first rather than what to send */
  checkOne: (place: string) => `The AI proposed checking ${place} first.`,
  checkTwo: (first: string, second: string) =>
    `The AI proposed checking ${first} and ${second} first.`,
  checkAcross: (places: number) =>
    `The AI proposed checking ${countWord(places)} places first.`,
  checkMany: (places: string) => `The AI proposed checking ${places} first.`,
  checkManyMore: (places: string, more: number) =>
    `The AI proposed checking ${places} first, plus ${countWord(more)} more`
    + ` ${more === 1 ? "place" : "places"}.`,
  /** an answer that asked for nothing at all */
  actionNone: "The AI proposed no action.",
  /** what the prewritten check made of that one answer, in the ledger's own fixed wording */
  actionVerdict: (badge: string) => `Rule result: ${badge}.`,
  /** the second count, said only where one way of working is open */
  agreement: (most: number, tries: number) =>
    `The most repeated proposal appeared in ${most} of ${tries} AI runs.`,
  /** the label over the eight cells. Chrome, five words. */
  seedsLabel: "These are eight AI rescue proposals.",
  /** one cell, named for a reader using a screen reader. Chrome. */
  seedLabel: (n: number, of: number, passed: boolean, agreed: boolean) =>
    `AI proposal ${n} of ${of}. `
    + (passed ? "Met every stated rule. " : "Broke at least one stated rule. ")
    + (agreed ? "Repeats the most common proposal." : "Differs from it."),
  /** what the fill of a cell means, said once beside the eight cells */
  seedsNote:
    "Filled cells repeat the most common proposal; outlined cells show another proposal.",
  /** the head of the one try that is open. Chrome, four words. */
  seedHead: (n: number, of: number) => `AI proposal ${n} of ${of}`,
  /** whether that try passed, in the same words the ledger and the walk-through use */
  seedPassed: "This AI proposal met every stated rule.",
  seedFailed: (rule: string) => `This AI proposal broke a stated rule: ${rule}.`,
  /** how many rules it broke, where it broke more than one */
  seedRules: (n: number) => `This AI proposal broke ${countWord(n)} stated rules.`,
  /** whether that try chose what most of the tries chose */
  seedAgreed: "This proposal matches the most repeated proposal.",
  seedApart: "This AI gave a different plan from the one repeated most often.",
  /**
   * The label over the unknowns one recorded try named. The walk-through's own label over this
   * kind of sentence, "What nobody knew yet", heads the list of things the moment itself left
   * open. This one heads what one answer said about them, which is a different fact.
   */
  unknownsLabel: "The AI acknowledged these unknowns.",
  /**
   * Reports one recorded try weighed that this moment's own list of reports does not hold. The
   * try is shown the reports the moment made available, and an answer that weighs something else
   * weighed something it was not given, which is a fact about that answer worth stating.
   */
  reportsOutside: (n: number) =>
    (n === 1
      ? "The AI weighed one report that was unavailable at this deadline."
      : `The AI weighed ${countWord(n)} reports that were unavailable at this deadline.`),
  /** which of the eight tries the six-card walk-through follows */
  seedWalk: "The six-card story follows this AI proposal.",
  seedOther: (n: number) =>
    `The six-card story follows AI proposal ${n} instead.`,
  /** where the record holds nothing for one way of working */
  notRecorded: "Not recorded.",
  /** the cue at the foot of the panel while it holds more than the frame shows. Chrome. */
  scrollCue: "Scroll for the rest of this panel",
  /**
   * The closing sentence. It is the boundary this whole screen is built inside, so it stands at
   * the foot of the frame at every size and never scrolls away. Its wording is fixed.
   */
  footer:
    "Branches show recorded AI rescue proposals. They do not show what would have happened if"
    + " anyone acted on them.",
  /** the control that reaches this screen from the closing ledger. Five words. */
  open: "Open the decision tree",
  /** the line the help list carries for the b key */
  control:
    "Press B to open all rescue decisions. Use Up or Down to choose, Right to open the AI"
    + " proposal, Left to go back, and Enter to select.",
};

/**
 * A short handle for each moment of decision, two to four words long, written for this screen.
 *
 * These are not titles. Each moment's own plain title is a whole sentence and lives in
 * `gloss.ts`, and it is shown in full the moment that mark is opened. A row of eleven whole
 * sentences cannot be read at a glance, and cutting a sentence off with three dots leaves a
 * reader holding half a thought, so each mark carries a handle a person wrote instead. Every one
 * of them names the same thing its own title names, in the title's own words where it can.
 */
export const TREE_LOCATOR: Record<string, string> = {
  "slot-01-early-fire-mobilization": "First fire crews",
  "slot-02-missing-telemetry-triage": "First towns to check",
  "slot-03-defense-request-scope": "Asking the navy",
  "slot-04-first-municipal-liaisons": "First officers sent",
  "slot-05-escalation-minute": "Raising the alarm",
  "slot-06-first-night-response-split": "Two collapsed buildings",
  "slot-07-shelter-load-triage": "Crowded shelters",
  "slot-08-degraded-dispatch-rescue": "The paper mill",
  "slot-09-push-water-planning": "Water trucks early",
  "slot-10-rescue-water-turn": "Rescue or water",
  "slot-11-aftershock-reprioritization": "After the aftershock",
};
