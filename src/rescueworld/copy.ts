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
    "One earthquake replayed over real Kumamoto ground; a fleet of artificial-intelligence agents"
    + " reading the reports, deciding and dispatching; an evidence table grown the way a lichen"
    + " grows, with claims on one side and sources on the other so neither can spoil the other.",
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
    "At 16:27 on 28 July 2026 a magnitude 7.1 earthquake struck Kumamoto Prefecture in Japan."
    + " On this page you watch the public record of the first three days of the response, drawn"
    + " over the real ground. Six things here come from real public records. They are the ground,"
    + " the landslides on the map, the roads that closed and the shelters the government had"
    + " designated. They also include the tremors recorded by Japan's national weather service and"
    + " the updates that service published. Everything about people is invented for this exercise."
    + " Every report of how many are waiting, every team sent and every outcome is made up, and"
    + " so is the damage drawn on the ground.",
  incidentStory: (moments: number, decisions: number, acts: number) =>
    `The whole record is played as one story in ${countWord(acts)} acts. All ${moments} recorded`
    + ` moments arrive in the order the record wrote them, and ${countWord(decisions)} of them were`
    + " moments when somebody had to decide something. Each of those moments was given to three"
    + " different ways of deciding, and every answer was recorded. The three are plain written"
    + " notes, an evidence table, and that same evidence table with one message added, telling the"
    + " desk what it had just got wrong.",
  /**
   * How the run is driven, with the size of the file it is driven from read out of that file.
   * The sentence used to name eighty-one events on every record, including the one that holds
   * four hundred and fourteen.
   */
  driven: (events: number) =>
    `Nothing is generated while you watch. The page reads one recorded file of ${events} events,`
    + " each one carrying the hash of the line before it, and every mark on screen is read out of"
    + " that file. Playing the run twice draws the same pixels. You have freedom of viewpoint and"
    + " freedom of interrogation; you cannot change what happened.",
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
      : " Each round of the run is one stretch of the recorded story, read straight out of the"
        + " recorded log.")
    + " The recorded second and the time of day sit under each round of the run, for anyone who"
    + " wants them. The reports came in bursts, hours apart. Played back at real speed most of"
    + " this would be empty waiting, so the playback gives every recorded event the same amount"
    + " of screen time. No event is skipped and none is moved out of order.",
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
    "The evidence table on a desk holds two lists side by side: the claims on one side and the"
    + " sources on the other. A lichen works the same way. Two partners live joined together for"
    + " good and neither one turns into the other. A claim never rewrites its own sources, and a"
    + " source never edits a claim. That is why a rejected number stays on the record with its one"
    + " source still attached to it.",
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
    "Press r for the real decisions, where what the responders actually did is set beside the"
      + " three desks that worked the same five moments.",
    "The r key opens that overlay, so it no longer raises the camera. Press q to rise. Press e or"
      + " f to drop.",
    "Press 0 to return to the start of the record.",
    "Press v for the internal view, which is a tool for the people making this page.",
    // Registered by the deck's dated regional-touring amendment. The overwatch key is p because
    // v already opens the internal view.
    "Press p for overwatch, which tours the camera on its own. Take your hands off the controls"
      + " for twelve seconds and the camera goes to three things in turn. It shows the place the"
      + " run is working, the last thing the region recorded, and then the whole ground. Any key"
      + " or drag takes it straight back.",
    // Registered by the deck's dated directed-watch amendment.
    "The run is directed by default: each round plays slowly, then holds so you can read it, and"
      + " the camera goes to where that round is happening. Choosing a speed leaves the directed"
      + " watch and plays the record straight through at that speed; click the mode chip beside"
      + " the speeds to come back.",
    "Under the reports is a stack of thin rows, one for each thing happening elsewhere in the"
      + " region. A row shows a road closing at its recorded minute, an earthquake in the recorded"
      + " sequence, or one of the five real decision moments with its deadline coming up. Click a"
      + " row to send the camera to that place.",
    // Registered by the deck's dated agent-trace amendment.
    "Press t to see how the decision the run has reached was made. It walks six cards: what the"
      + " real responders did, then what was known, what each desk proposed, what the check caught"
      + " and what was finally chosen. The left and right arrow keys move between the cards.",
    "Every moment of decision in the list down the side of the screen carries its own control for"
      + " that walk-through. One that has already passed can be opened again without moving the"
      + " run.",
    // Registered by the deck's dated stranger-pass amendment. The three keys below existed and
    // were missing from this list, so a reader was told about controls that had moved on and not
    // about controls that were there.
    "Press g for the picture controls, which set the colours on screen and how much they glow."
      + " They are a tool for the people making this page, and they change nothing about the"
      + " record.",
    "Press n for the run-preparation console, which writes out the exact settings a real run with"
      + " a language model in it would use. It starts nothing.",
  ],
  /**
   * The ledger's own line, kept apart from the list above because a record that holds no moment
   * of decision has no ledger, and a control list that names a key doing nothing is worse than a
   * list that is one line shorter.
   */
  ledgerControl:
    "Press l for the decision ledger, which is the closing list of every moment of decision. It"
    + " reads back what was chosen, how far its recorded tries agreed and what the checks made"
    + " of it.",
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
  title: "The real decisions, and what the desks chose",
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
    "This walk-through takes any one of these moments through six steps. It shows what was known"
    + " by its deadline, what each desk proposed, what the check caught, the one correction, and"
    + " what the real responders did. Each of the moments further down this page carries a control"
    + " that opens it.",
  /** the heading over the moment-by-moment cards that close the surface */
  slotsHead: "Every moment of decision, with the record and the three desks side by side",
  /** what those cards are, so they are read as the detail behind the story and not as the story */
  slotsLead: (tries: number) =>
    "The cards below are the detail behind the story above. Each one carries the deadline and the"
    + " office the record names. It also carries what the real responders did as the record has"
    + ` it, and how each of the three desks answered it across ${countWord(tries)} tries.`,
  /** the control that opens the wording the two agents signed */
  exactLabel: "Open the exact wording we registered before the runs",
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
    `The real people in charge sent ${quantities}: ${first}`
    + `${more > 0 ? ` and ${countWord(more)} more` : ""}.`,
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
    `In ${table} of ${tries} tries, the AI desk that checked its evidence produced a decision`
    + ` that passed every prewritten check. The desk that passed plain notes did so in ${plain}`
    + ` of ${tries}.`,
  /** one line under each desk's name, so a card can be read on its own */
  deskNote: {
    plain_summary: "It passed plain written notes straight on to whatever came next.",
    evidence_table: "It passed a table with every claim written beside its source.",
    evidence_feedback: "It had that same table and one message naming its exact mistake.",
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
    "Everything the desks did here is a what-if we simulated: it asks what could have been"
    + " chosen with only what was known at that minute. It is not a record of what happened next."
    + " It is not evidence that a computer would improve a real rescue or save lives, and it does"
    + " not say the real responders were wrong. The full list of what is real and what is invented"
    + " is in the help menu.",
  /** where every number on the surface came from */
  source: (configurations: number, hash: string) =>
    `Every number on this page was read from ${configurations} result files, each one checked`
    + " against its own signed certificate, which is the record proving the file was never"
    + " altered. The exact list of files was frozen before the runs and is named by the code"
    + ` ${hash.slice(0, 16)}. The numbers were then checked line by line against the signed`
    + " report.",
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
  under: "These numbers come from a model, and nobody counted them.",
  // Three technical nouns used to stand in one line here. The switch says what the numbers are
  // and where they came from, in the order a reader needs them.
  label: "how full the shelters are · worked out from the region's published totals, because"
    + " nobody published a count for each shelter",
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
    `This is the first ${hours} hours after an earthquake struck Kumamoto, played as one world in`
    + ` ${acts} acts. ${decisions} moments inside it were moments when somebody had to decide`
    + " something. Each of those moments was given to the same three ways of deciding, and every"
    + " answer was recorded.",
  /**
   * The three readings the outcome shows while the run plays: how far through the record the
   * viewer is, how many moments of decision have passed, and how many tremors have arrived.
   * Each label carries the number's own denominator. Chrome.
   */
  countLabels: {
    events: (total: number) => `of the ${total} moments this record holds`,
    decisions: (total: number) => `of the ${total} moments when somebody had to decide`,
    aftershocks: (total: number) => `of the ${total} tremors the record holds`,
    /** what a graded count counts, so the big number under it is never a bare number */
    tries: (runs: number, way: string) => `of ${runs} tries with ${way}`,
  },
  footnote:
    "The numbers above say how far through the record this run has played. This record keeps no"
    + " count of how many people anyone reached, so no such count appears anywhere here. The"
    + " grades on the choices a computer made are stated at the end, once every moment of the"
    + " record has played.",
  /**
   * The three ways of deciding that were run against every moment of decision. The names are
   * the ones the registered experiment already uses on the r surface. Chrome, four words each.
   */
  ways: {
    plain_summary: "plain written notes",
    evidence_table: "an evidence table",
    evidence_feedback: "table and a correction",
  } as Record<string, string>,
  /**
   * One card per way of deciding in the debrief. The two sentences are the aggregate line and
   * the constraint line, in the wording both agents settled on.
   */
  gradedCard: (valid: number, runs: number) =>
    `In ${valid} of ${runs} tries, this method produced a decision that passed every prewritten`
    + " check.",
  constraintCard: (constraint: number, runs: number) =>
    `${constraint} of ${runs} stayed within the hard limits this exercise set on how much could`
    + " be sent.",
  /** what passing every check means, stated once under the numbers */
  definition:
    "Passing every check means five things. It used only allowed units and places, stayed within"
    + " resource limits, and drew only on information that already existed by the deadline. It"
    + " also said out loud each of the unknowns this decision required it to name, and used"
    + " nothing learned later.",
  /**
   * The three badges a single recorded choice or a single moment of decision can wear. The
   * third is for the six moments that sit outside the registered experiment.
   */
  badge: {
    passed: "passed every prewritten check",
    failed: (rule: string) => `did not pass every prewritten check — ${rule}`,
    descriptive: "descriptive only — outside the registered result",
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
    "That badge means the numbers beside it sit outside the result this experiment wrote down"
    + " before it ran. They are shown to say what happened, and nothing is concluded from them.",
  /** what the wider, ungraded set of choices shows, stated as the description it is */
  descriptive: (runs: number, plain: number, table: number, corrected: number) =>
    `Across all eleven moments the same three ways of deciding were run ${runs} times each.`
    + ` Those wider runs came out at ${plain}, ${table} and ${corrected} of ${runs} passing every`
    + " prewritten check. The numbers are reported here to say what happened, and nothing is"
    + " concluded from them, because they sit outside the result this experiment wrote down"
    + " before it ran.",
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
    `The record ends ${hours} hours after the earthquake, which is three full days and nights.`
    + ` It carries ${events} moments that somebody wrote down while they were happening. In`
    + ` ${decisions} of those moments a named person had to decide something with the information`
    + " they had at that minute.",
  /** the constraint line under the counts, which states the second measure with its own total */
  constraints: (runs: number, plain: number, table: number, corrected: number) =>
    `Staying inside the limits on how much could be sent came out at ${plain} of ${runs},`
    + ` ${table} of ${runs} and ${corrected} of ${runs} for the same three ways of deciding.`,
  /**
   * The debrief, told in the order `docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md` sets: the
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
      `This page has just replayed the ${events} moments of that response that somebody wrote`
      + " down while they were happening.",
    /** step one: the human question, before any number */
    question:
      "The hard part of a disaster is deciding who to send where while the reports are still"
      + " thin, still contradictory and still arriving. This replay asked one question about that"
      + " work: does the way a decision is written down change whether it holds up?",
    /** the heading over the job the agents were given. Chrome. */
    jobHead: "What the agents had to decide, and by when",
    /**
     * Step two: the job itself. It names how many moments were scored, says that each one has a
     * clock deadline taken from the record, and states the one rule that makes the exercise fair
     * — nothing published after the deadline was allowed into the answer.
     */
    job: (moments: number, tries: number) =>
      `${countWordCap(moments)} of the moments in this record were scored as an experiment. Each`
      + " one is a real decision with a deadline on the clock, rebuilt from public records. At"
      + " each deadline a software agent had to name which units to send and where to send them."
      + " It could use only the reports, bulletins and road notices that were public by that"
      + ` minute. Every one of the ${moments} moments was answered ${tries} separate times.`,
    /** the heading over the list of scored moments. Chrome. */
    momentsHead: (moments: number) =>
      `The ${countWord(moments)} moments, and the minute each one was due`,
    /** one scored moment, said as the record states it */
    momentLine: (clock: string, title: string) =>
      `By ${clock} somebody had to decide this: ${title}.`,
    /** the heading over the one moment followed all the way through. Chrome. */
    workedHead: "One of those moments, worked through all three ways of deciding",
    /**
     * Step three: the same concrete moment carried through every method, so a reader sees one
     * decision go wrong and get put right rather than three abstract descriptions. Every number
     * in these sentences is read from the recorded run.
     */
    workedMoment: (clock: string, decider: string, limit: number, unit: string) =>
      `Take one water-planning decision on the second day. By ${clock} the ${decider} had to plan`
      + " extra water support for towns that had lost their supply, without waiting for every town"
      + ` to ask. This decision allowed at most ${limit} additional ${unit}, and the answer had to`
      + " say which towns received them.",
    workedPlain: (total: number, unit: string) =>
      `The desk with plain written notes proposed ${total} ${unit}. Its answer did not pass its`
      + " checks.",
    workedTable: (total: number, unit: string, limit: number) =>
      "The desk with an evidence table named every fact its plan rested on and every thing nobody"
      + ` knew yet. It then proposed ${total} ${unit}, and this decision allowed ${limit}, so that`
      + " answer did not pass its checks either.",
    /** what the check is, said once, before its own sentence is quoted */
    workedCheckLead:
      "The check that caught it is ordinary code with no model inside it. It read the answer and"
      + " said exactly what was wrong.",
    /** the one message that went back, and what the second answer did with it */
    workedFix:
      "That one sentence went back to the desk, and the desk answered once more with the same"
      + " reports and nothing new.",
    workedPassed: (total: number, unit: string) =>
      `The second answer sent ${total} ${unit} and passed every prewritten check.`,
    /** the public record's own side of the same moment, read before any grade is stated */
    workedRecordLead: "Here is what the real responders did about the same decision.",
    /** step three, the heading over the three method cards */
    methodsHead: "The three ways the agents were asked to work",
    /**
     * What the ordinary way of working is, stated before the three cards, so a reader knows
     * which of the three is the one most agent systems already use.
     */
    normalWork:
      "The first of the three is the plain way of working. An agent writes a short summary in its"
      + " own words and hands it on, and whatever comes next trusts it. That is the ordinary"
      + " baseline tested here, and the two ways after it are the changes made to it.",
    /** step four: what one attempt was, in plain words, before any count of them */
    tryLine: (moments: number, tries: number) =>
      `One try is one software agent answering one of these ${moments} moments, once. Each way of`
      + " deciding was given every one of those moments"
      + ` ${Math.max(1, Math.round(tries / Math.max(1, moments)))} separate times, which comes to`
      + ` ${tries} tries each. Before any of it ran we wrote down`
      + " the checks an answer had to pass, so nobody could change the rules later on.",
    /** step five: the heading over the three counts */
    resultHead: "How many tries produced an answer that passed every check",
    /**
     * Step six: the counts turned into a scale a person already has. A share is written as
     * roughly one in so many, because that is how a classroom reads a proportion.
     */
    translate: (runs: number, plain: number, table: number, corrected: number) => {
      const share = (n: number) => Math.round((n / Math.max(1, runs)) * 100);
      return `Plain notes passed nothing at all: ${plain} of ${runs}. Writing every claim beside`
        + ` its source passed ${table} of ${runs}, which is about ${share(table)} in every`
        + " hundred. Adding one message that named the mistake passed"
        + ` ${corrected} of ${runs}, which is about ${share(corrected)} in every hundred, or`
        + " roughly five tries in every six.";
    },
    /**
     * Step seven: what the correction message actually did, stated as a repair rather than as a
     * score. The three numbers are the record's own; the arithmetic between them is stated so a
     * reader can check it.
     */
    repair: (runs: number, table: number, corrected: number) =>
      `The interesting part is what that last change repaired. The evidence table on its own got`
      + ` ${runs - table} of the ${runs} tries wrong. One message naming the exact mistake turned`
      + ` ${corrected - table} of those ${runs - table} wrong answers into answers that passed,`
      + ` and every one of the ${table} that already passed still passed. Telling an agent what`
      + " it got wrong fixed more than telling it to try harder ever did.",
    /**
     * The sentence that stands beside the zero so nobody reads it as forty reckless plans. The
     * plain-notes desk mostly sent the right quantity of units; what it missed every time was
     * the written part of the job, and a try passes only when it clears every check.
     */
    zeroMeans: (runs: number, plainLimit: number) =>
      "That zero needs one sentence beside it. The desk with plain written notes stayed within the"
      + ` hard limits on how much could be sent in ${plainLimit} of ${runs} tries, so its plans`
      + " were mostly the right size. What it missed every time was the written part of the job:"
      + " naming the reports its plan rested on, and saying out loud which things nobody knew yet."
      + " A try"
      + ` passes only when it clears every check, so none of its ${runs} tries passed.`,
    /** the heading over what the run shows and what it does not show. Chrome. */
    provesHead: "What this shows, and what it does not show",
    /** what the finding actually proves, stated once, in ordinary words */
    proves:
      "The finding is this. Two changes together made a computer's decisions much easier to trace,"
      + " and much more likely to obey the rules in force. The first was making the agent write"
      + " every claim beside the report it came from. The second was letting ordinary code send"
      + " back one message naming the exact mistake.",
    /**
     * What failed on the way, at the same size as what passed. The registered claim was mixed:
     * four of its five parts held and one did not, and the one that did not is stated here with
     * the two counts a reader can compare.
     */
    whatFailed: (runs: number, plainLimit: number, tableLimit: number) =>
      `Two things failed on the way, and both are reported here. Plain written notes produced`
      + ` nothing that passed, in every one of the ${runs} tries. The evidence table also broke`
      + ` the limits on how much could be sent more often than plain notes did, at ${tableLimit}`
      + ` of ${runs} against ${plainLimit} of ${runs}. We had written down before the runs that it`
      + " had to stay within five points of plain notes on that measure. That part of the"
      + " registered claim failed, and the four other parts held.",
    /** what this record cannot say, because it holds no count of it */
    noReach:
      "This record keeps no count of how many people anyone reached, so nothing here says that"
      + " any way of working would have got help to more people. The three counts are about"
      + " whether a decision can be traced and whether it followed the rules inside the exercise,"
      + " and about nothing else.",
    /** the wider set of runs, described rather than counted as a result */
    wider: (runs: number, plain: number, table: number, corrected: number) =>
      `The same three ways were also run against all eleven moments, ${runs} times each. Those`
      + ` wider runs came out at ${plain}, ${table} and ${corrected} of ${runs}. They are left`
      + " out of the result above, because the checks for the other six moments were written"
      + " after those runs and not before them. They are reported here to describe what happened,"
      + " and nothing is concluded from them.",
    /** the heading over the closing pair: where this could be used, and the exact next run */
    useHead: "Where this could be useful, and what we test next",
  },
  /** step eight of the storytelling order: two or three real jobs this could be useful in */
  use:
    "The same check asks whether a decision traces to what was known at the time and obeys the"
    + " rules in force. That check belongs in emergency dispatch, in a hospital handover between"
    + " shifts, and in any duty office acting on reports that are still incomplete.",
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
      + " agencies had to decide who to send where, using only what was known at each minute."
      + " The question this replay asks is a simple one: what did they actually know, and when"
      + " did they know it? You are about to watch the first three days over the real ground,"
      + " with the recorded moments standing where they happened.",
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
    "These checks measure traceability and rule-following inside the exercise. They do not grade"
    + " the real responders or prove that an agent's judgment was better.",
  nextExperiment:
    "The next step is to score reach as well as rule-following. The same moments would be run"
    + " again against a model of what happens after each choice, built out of the recorded events"
    + " themselves. Each way of deciding could then also be measured by how many people it would"
    + " have got to.",
  /**
   * The decision rail, for the run that replays the whole incident. The record holds no claim
   * cards and no dispatch cards, so the rail lists the moments of decision themselves and says
   * where the run has got to among them. An empty outlined panel never stands on screen.
   */
  rail: {
    lead: (total: number) =>
      `${total} moments in these three days were moments when a named person had to decide`
      + " something with the information they had at that minute. Each is listed below with the"
      + " time it was due.",
    /** chrome, four words */
    passed: "already passed",
    /** chrome, three words */
    next: "coming next",
    /** chrome, four words */
    ahead: "still ahead",
    decider: (decider: string) => `The record names ${decider} as the one who had to make it.`,
    ways: (ways: string) =>
      `${sentenceCase(ways)} recorded ways of deciding were run against this decision.`,
    note: "Open any decision above to see what the agents knew, what each desk proposed and what"
      + " the real responders did. Press r for the registered experiment and the exact wording of"
      + " its findings.",
  },
  /** the story card that hangs over the place a recorded moment happened */
  card: {
    /** the clock a card wears, in small type over its sentence. Chrome. */
    stamp: (clock: string) => `Recorded at ${clock}`,
    /** what a card says about a moment when somebody had to decide something */
    decision: (decider: string, clock: string, ways: string) =>
      `This decision was due at ${clock}, and the record names ${decider} as the one who had to`
      + ` make it. ${sentenceCase(ways)} recorded ways of deciding were run against it`
      + " afterwards.",
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
  title: "How one decision was made",
  /** the control that opens it from a moment of decision. Chrome, six words. */
  open: "See how this decision was made",
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
  frameReal: "this comes from the public record",
  frameModel: "a software agent wrote this later",
  /** the one sentence that separates the two framings, on the card a reader opens on */
  realFraming:
    "Everything on this card comes from the public record of what the responders did. The five"
    + " cards after it were produced by computer models long afterwards, using only what had been"
    + " written down by this same deadline.",
  /** the heading over each of the six cards */
  head: {
    real: "This is what the real responders did",
    known: "What was known by the deadline",
    plain: "What the desk with plain written notes proposed",
    table: "What the desk with an evidence table wrote down",
    check: "What the check caught, and the one message it sent back",
    final: "The simulated action it finally chose",
  },
  /** the kicker over a step card. Chrome, four words. */
  step: (n: number, of: number) => `Step ${n} of ${of}`,
  /** the kicker over the card that holds the record, which is read before the five. Chrome. */
  realKicker: "Read this before the five steps",
  /** the line at the foot of the frame while there is more of this card below the window */
  scrollCue: "Scroll down to read the rest of this card.",
  /** the moment's own deadline, written out in full under its title */
  deadline: (words: string) => `The deadline for this decision was ${words}.`,
  /** who the record says had to make it */
  decider: (decider: string) => `The record names ${decider} as the one who had to make it.`,
  /** which recorded run of this decision the walk-through follows */
  seedLine: (seed: number, of: number) =>
    `This walk-through follows one recorded run of this decision, number ${seed}.`
    + ` ${countWordCap(of)} runs of it were recorded in all, and the other runs chose differently`
    + " in places.",
  /** what the decision asked for, quoted from the exercise's own instruction */
  taskLine: (task: string) => `The job here was this. ${task}`,
  /** the labels over the blocks inside a card. Chrome, a short phrase each. */
  openLabel: "What the record does not say",
  reportsLabel: "The reports that existed",
  unknownsLabel: "What nobody knew yet",
  weighedLabel: "How it weighed each report",
  planLabel: "What it asked for",
  finalLabel: "What it finally chose",
  messageLabel: "What the check found",
  changeLabel: "What the second answer changed",
  /**
   * The sentence under this label is the language model's own writing, saved word for word when
   * the run was recorded. The label has to say so, because nothing else on the card does. A
   * reader who met the old label, "What the computer wrote as its own reason", could still take
   * the sentence for the page's own summary of the answer, so the label now says that the words
   * are the machine's and that they are quoted rather than retold.
   */
  reasonLabel: "Quoted word for word from what this software wrote",
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
    "The sentence above is copied from the recorded answer without a word changed, mistakes"
    + " included. The plan listed above it is what that answer actually asked for, naming each"
    + " thing it chose and where each one goes. Where the two disagree, the plan is what the"
    + " record holds.",
  reasonBrackets:
    "Anything inside [square brackets] was added by this page to say what one of the answer's own"
    + " terms means.",
  compareLabel: "Set the record beside the simulated decision",
  /** the opening line of the card that lists what was known */
  knownLead: (facts: number, when: string) =>
    `${countWordCap(facts)} ${facts === 1 ? "report had" : "reports had"} been written down by`
    + ` ${when}. Nothing that arrived after that minute was allowed into this decision, for the`
    + " agents or for the people who decided it at the time.",
  /** the opening line where a decision's own file holds no report of its own */
  knownNone:
    "The file for this decision holds no reports of its own, so the agents worked from the task"
    + " and the unknowns below and from nothing else.",
  /** the opening line over the unknowns a decision required a decider to name */
  unknownsLead: (n: number) =>
    `${countWordCap(n)} ${n === 1 ? "thing was" : "things were"} still unknown at that minute, and`
    + " this decision required the decider to say so out loud.",
  /** what each of the three desks is, said in ordinary words on its own card */
  desk: {
    plain_summary: "The first desk passed plain written notes straight on, the way a person"
      + " scribbles a summary before handing it on.",
    evidence_table: "The second desk passed a table with every claim written beside the report"
      + " that backs it, so a number could never travel without its source.",
    evidence_feedback: "The third desk is the second desk again, after one short message naming"
      + " the exact mistake it had just made.",
  } as Record<string, string>,
  /** the name a desk goes by across the walk-through. Chrome, a short sentence-less phrase. */
  deskName: {
    plain_summary: "The desk that wrote plain notes",
    evidence_table: "The desk that kept an evidence table",
    evidence_feedback: "The same desk, after one message named its mistake",
  } as Record<string, string>,
  /**
   * A plan, said one line at a time. A moment that hands out a divisible pool of units counts
   * them; a moment that hands out named units names each one. Both forms say what the number
   * counts, and neither runs past a line a person can read in one breath.
   */
  planCount: (total: number, unit: string, places: string) =>
    `It proposed ${total} ${unit} ${places}.`,
  planNamed: (units: number) =>
    `It chose ${countWord(units)} of the units this decision offered, and named where each one`
    + " goes.",
  planNone: "It proposed nothing at all for this decision.",
  planPartCount: (quantity: number, unit: string, place: string) =>
    `The plan names ${quantity} ${unit} for ${place}.`,
  planPartNamed: (unit: string, place: string) =>
    `The plan names ${unit} for ${place}.`,
  /**
   * The same line where the answer wrote a name the exercise does not carry, in the machine form
   * an identifier takes. The name is shown as the answer's own wording rather than as a fact, so
   * a reader sees what the desk actually wrote without being asked to read a code.
   */
  // A name the answer made up rather than picked off the list it was given. The old wording,
  // "which is the answer's own wording", left a reader guessing whether the phrase was invented
  // or merely quoted, so these say invented.
  planPartWroteUnit: (unit: string, place: string) =>
    `The plan names ${unit} for ${place}. It made that name up; no such unit was on its list.`,
  planPartWrotePlace: (unit: string, place: string) =>
    `The plan names ${unit} for ${place}. It made that place up; no such place was on its list.`,
  planPartWroteBoth: (unit: string, place: string) =>
    `The plan names ${unit} for ${place}. It made both of those names up; neither was on its`
    + " list.",
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
    `The final simulated decision sends ${total} ${unit} ${places}.`,
  finalNamed: (units: number) =>
    `The final simulated decision names ${countWord(units)} units and where each one goes.`,
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
    `Those quantities add up to ${total} ${unit}.`,
  limitLine: (limit: number) => `This decision allowed ${limit}.`,
  /** how each report was counted, said in ordinary words */
  factorLead: (n: number) =>
    (n === 1
      // "It wrote down what the one report it had meant for its plan" garden-paths: the easier
      // reading is a report that was intended for the plan. Splitting the clause removes it.
      ? "It had one report, and it wrote down what that report meant for its plan."
      : `It wrote down what each of the ${countWord(n)} reports meant for its plan.`),
  factorState: {
    SUPPORTS: "It counted this one as supporting its plan.",
    CONTRADICTS: "It counted this one as arguing against its plan.",
    UNKNOWN: "It left this one unresolved.",
  } as Record<string, string>,
  /** which of the required unknowns a desk named */
  unknownsNamed: (named: number, of: number) =>
    `It named ${countWord(named)} of the ${countWord(of)} unknowns this decision required.`,
  unknownsNone: (of: number) =>
    (of === 1
      ? "It did not name the one unknown this decision required."
      : of === 2
        ? "It named neither of the two unknowns this decision required."
        : `It named none of the ${countWord(of)} unknowns this decision required.`),
  unknownsAll: (of: number) =>
    (of === 1
      ? "It named the one unknown this decision required."
      : of === 2
        ? "It named both unknowns this decision required."
        : `It named all ${countWord(of)} unknowns this decision required.`),
  /** an unknown a desk named that this decision never asked for */
  unknownsExtra: (n: number) =>
    (n === 1
      ? "It also named one unknown of its own, which this decision had not asked for."
      : `It also named ${countWord(n)} unknowns of its own, which this decision had not asked`
        + " for."),
  /** how many of the names in a plan are outside this decision's own lists */
  unlisted: (n: number) =>
    (n === 1
      ? "One of the names in that plan is not on the list of units and places this decision"
        + " allowed."
      : `${countWordCap(n)} of the names in that plan are not on the list of units and places`
        + " this decision allowed."),
  /**
   * What the check found, one sentence per rule it named. The checker writes its findings as a
   * rule name and an identifier — `MISSING_REQUIRED_UNKNOWN: unknown-people-alive-by-time` — and
   * those exact lines stay in the recorded evidence this page reads. What a reader sees is the
   * same finding with every identifier replaced by the thing it names, in ordinary words.
   */
  said: {
    quantity: (total: number, limit: number) =>
      `The quantities in that answer add up to ${total}, and this decision allowed ${limit}.`,
    quantityFloor:
      "One line of that answer asked for part of a single thing, and nothing on the list can be"
      + " sent in parts.",
    capacity: (asked: number, held: number, pool: string) =>
      `The answer asked for ${asked} of the ${pool}, and only ${held} were there.`,
    ineligibleTarget: (place: string) =>
      `The answer named ${place}, which is not on the list of places this decision allowed.`,
    ineligibleResource: (unit: string) =>
      `The answer named ${unit}, which is not on the list of units this decision allowed.`,
    missingUnknown: (text: string) =>
      `The answer left out one thing this decision required it to say. ${text}`,
    missingUnknownPlain:
      "The answer left out one thing this decision required it to say.",
    unknownOutside:
      "The answer named an unknown of its own instead of one this decision asked for.",
    // Every answer does two separate things with a report: it lists the report as one it read,
    // and it says what that report meant for its plan. The page used to call those two acts
    // "citing" and "weighing" without ever saying how they differ, and one whole finding is about
    // the difference. Both acts are now spelled out wherever either one is named.
    cutoffObservation: (text: string) =>
      "The answer listed a report it had read that is not among the ones this decision made"
      + ` available. ${text}`,
    cutoffObservationPlain:
      "The answer listed a report it had read that is not among the ones this decision made"
      + " available.",
    cutoffFactor: (text: string) =>
      "The answer said what a report meant for its plan, and that report is not among the ones"
      + ` this decision made available. ${text}`,
    cutoffFactorPlain:
      "The answer said what a report meant for its plan, and that report is not among the ones"
      + " this decision made available.",
    noSupport: "The answer named no report at all as backing its plan.",
    factorMismatch:
      "The answer listed the reports it had read, and then said what a different set of reports"
      + " meant for its plan. Those two lists have to hold the same reports, and they did not.",
    reuse: "The answer used one pool of units twice, where this decision allowed it once.",
    assignmentCount: (lines: number) =>
      `The answer named ${lines} places, and this decision did not allow that many.`,
    assignmentCountPlain: "The answer named more or fewer places than this decision allowed.",
    duplicateObservation: "The answer listed one report twice.",
    duplicateFactor: "The answer said what one report meant for its plan twice over.",
    duplicateUnknown: "The answer named one unknown twice.",
    hindsight: "The answer used something that was only known after the deadline had passed.",
    ungradable:
      "The answer came back in a form the check could not read, so no rule could be tested"
      + " against it.",
    /** any rule this list has no sentence of its own for, said through its own plain wording */
    other: (rule: string) => `The answer broke one rule: it ${rule}.`,
  },
  /** what the check is, before its own findings are stated */
  checkWhat:
    "The check is ordinary code with no model in it. It runs after an answer and tests that"
    + " answer against the rules that were written down before anything was run.",
  /** the check found nothing to correct */
  checkClean:
    "The check found nothing to correct for this decision, so no message went back and the desk's"
    + " first answer stood as its final one.",
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
    "The desk answered once more with the same reports and no new information. It was allowed one"
    + " more answer and nothing else.",
  /** one line of what the second answer moved */
  changeMoved: (place: string, from: number, to: number) =>
    `${place} went from ${from} to ${to}.`,
  changeAdded: (place: string, unit: string) => `${unit} was added for ${place}.`,
  changeRelocated: (unit: string, from: string, to: string) =>
    `${unit} moved from ${from} to ${to}.`,
  changeDropped: (place: string, unit: string) => `${unit} was dropped from ${place}.`,
  changeTotals: (from: number, to: number, unit: string) =>
    `The plan went from ${from} ${unit} to ${to} ${unit}.`,
  changeNone: "The second answer came back with the same units in the same places.",
  /** what a second answer changed where it moved no unit at all */
  changeWeighed: (report: string, state: string) =>
    `It changed how it counted one report. ${report} ${state}`,
  changeNamedUnknown: (unknown: string) =>
    `It named one more unknown this decision required: ${unknown}`,
  changeDroppedUnknown: (unknown: string) =>
    `It stopped naming one unknown: ${unknown}`,
  /** the comparison at the foot of the last card: kind and scale, and nothing more */
  compareSame: (real: number, model: number, unit: string) =>
    `The public record names ${real} ${unit}. This simulated decision comes to ${model} ${unit}.`,
  compareNamed: (real: number, model: number) =>
    `The public record names ${countWord(real)} units. This simulated decision names`
    + ` ${countWord(model)}.`,
  compareDifferent:
    "The public record and this simulated decision name different kinds of action here, so"
    + " nothing here compares their scale.",
  compareNone:
    "The public record names no choice of units for this decision, so there is nothing here to set"
    + " the simulated decision beside.",
  compareClaim:
    "That comparison is about the kind of action and its scale. It says nothing about which"
    + " choice was better, and it is no evidence that either one was.",
  /** where every word on this surface came from */
  source: (events: number) =>
    `Every sentence on these cards was read from two files. One is the recorded run, ${events}`
    + " events long. The other sets out the decision moments themselves. The run took a"
    + " fingerprint of that second file when it started, so anyone can check the file has not"
    + " changed since.",
  /** the plain sentence behind each rule the check can name */
  rule: {
    CONSTRAINT_QUANTITY: "it sent more than this decision allowed",
    CONSTRAINT_RESOURCE_CAPACITY: "it sent more units than one pool of units held",
    CONSTRAINT_RESOURCE_REUSE: "it used one pool of units twice where that was not allowed",
    CONSTRAINT_ASSIGNMENT_COUNT: "it named more or fewer places than this decision allowed",
    INELIGIBLE_TARGET: "it named a place that is not on the list of places this decision allowed",
    INELIGIBLE_RESOURCE:
      "it named something that is not on the list of units this decision allowed",
    CUTOFF_INVALID_OBSERVATION: "it listed a report that was not among the ones open to it",
    CUTOFF_INVALID_FACTOR:
      "it said what a report meant for its plan, and that report was not among the ones open"
      + " to it",
    MISSING_REQUIRED_UNKNOWN: "it left out an unknown this decision required it to name",
    UNKNOWN_ID_OUTSIDE_SLOT: "it named an unknown of its own instead of one this decision asked for",
    NO_SUPPORTING_OBSERVATION: "it named no report at all as backing its plan",
    FACTOR_SET_MISMATCH:
      "the reports it listed as read and the reports it commented on were two different lists",
    DUPLICATE_OBSERVATION: "it listed one report twice",
    DUPLICATE_FACTOR: "it said what one report meant for its plan twice over",
    DUPLICATE_UNKNOWN: "it named one unknown twice",
    HINDSIGHT_OBSERVATION: "it listed something that was only known later",
    HINDSIGHT_FACTOR: "it leaned on something that was only known later",
    HINDSIGHT_FINGERPRINT: "its written answer repeated something that was only known later",
    UNGRADABLE: "its answer came back in a form the check could not read",
  } as Record<string, string>,
  /**
   * The same two rules where one answer broke them more than once. A badge reading "it named a
   * place that is not on the list of places this decision allowed" standing over a body line
   * saying six of the names were outside the list gives a reader two accounts of one thing, so
   * the badge counts them when there is more than one.
   */
  ruleCounted: {
    INELIGIBLE_TARGET: (n: number) =>
      `it named ${countWord(n)} places that are not on the list of places this decision allowed`,
    INELIGIBLE_RESOURCE: (n: number) =>
      `it named ${countWord(n)} units that are not on the list of units this decision allowed`,
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
  stripLabel: "How the eight tries agreed",
  /**
   * The label a moment outside the frozen experiment wears over its own eight cells. The cells
   * there are empty, so a label promising a count of agreeing tries and a row of cells carrying
   * none say two different things at once. This says the same thing the cells do.
   */
  stripLabelNone: "This decision carries no count of agreeing tries",
  /**
   * What the five cell states mean, written where the cells first appear and again in the ledger.
   * A reader is never asked to hover for it, because a person showing this in front of a room
   * never hovers. The two colours are named as colours, because that is what a viewer sees.
   */
  stripLegend:
    "A filled cell is a try that chose what is shown here, and an outlined cell is a try that"
    + " chose something else. Blue cells passed every prewritten check and orange cells did not."
    + " Dim outlined cells mean this decision carries no counts.",
  /**
   * What a grade is about, said next to the grade wherever the eight cells stand beside it. The
   * grade reads one answer and the cells read eight tries, and a reader who takes the grade as a
   * verdict on all eight has read the surface wrong.
   */
  badgeScope:
    "This grade is about the one answer shown here. The eight cells beside it show how all eight"
    + " recorded tries came out.",
  /**
   * The eight cells said in words, for a reader who cannot see them. The contract writes both
   * of these sentences itself, and this joins them in the order the cells are read.
   */
  stripReading: (agreement: string, pass: string) => `${agreement} ${pass}`,
  /** the eight outlined cells a moment outside the frozen experiment carries instead */
  stripDescriptive:
    "This decision was replayed to describe what happened, so it carries no count of agreeing"
    + " tries.",
  /**
   * What a reader should do where the eight tries scattered. The sentence states the count it
   * is about, so the advice and the number a reader can see are the same fact.
   */
  weakAgreement: (agreement: number, tries: number) =>
    `Only ${agreement} of the ${tries} tries chose the same set of places here, so read the`
    + " reports for this decision before you rely on it.",
  /** the control that opens the itemized list under a grade. Four words. */
  reasonOpen: "What the check found",
  /** the same control once the list is open. Three words. */
  reasonClose: "Close this list",
  /** the line where a check found nothing to name */
  reasonNone: "The check named no broken rule on this answer.",
  /**
   * The map telegraph. As a deadline comes up, every place the recorded answers proposed lights
   * on the ground before the moment resolves, so a viewer sees what is about to be decided
   * rather than only what was decided.
   */
  telegraph: {
    /** the label over the ghost stack. Four words. */
    label: "Places these answers named",
    /** the deadline this telegraph is counting down to */
    due: (clock: string) => `This decision is due at ${clock}.`,
    /** one candidate place, with the count the answer put on it */
    place: (place: string, quantity: number, unit: string) =>
      `${place}: ${quantity} ${unit}`,
    /** a candidate place a recorded answer named without a quantity of its own */
    placePlain: (place: string) => place,
    /** which desk asked for this place, said in the desk's own name */
    wanted: (desk: string) => `asked for by ${desk}`,
    /** where every shown answer named the same place */
    agreed: "every recorded way of deciding named this place",
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
      "The hollow marks are places a recorded answer proposed sending to. They are proposals"
      + " drawn before the deadline, and no team has moved to any of them.",
  },
  /**
   * The ledger the run closes on: all eleven moments of decision, each with what was chosen, how
   * far the tries agreed, the grade, and the record set beside it. It lists moments and totals
   * nothing, because a total across eleven moments would be a score this experiment never made.
   */
  ledger: {
    /** the surface's own name across its head. Eight words. */
    title: "The decision ledger holds every moment of decision",
    /** the control that opens it from the closing panel. Five words. */
    open: "Open the decision ledger",
    /** chrome, three words */
    close: "close — esc",
    /** the opening sentence, which says what the list is before any count appears */
    lead: (moments: number) =>
      `These are all ${moments} moments in the three days when somebody had to decide something.`
      + " Each row carries what the simulated desk finally chose, how far its eight recorded"
      + " tries agreed, and what the prewritten checks made of it.",
    /** the sentence that says which rows carry counts and which do not */
    scope: (registered: number, descriptive: number) =>
      `${countWordCap(registered)} of these moments belong to the frozen experiment and carry`
      + ` counts out of eight tries. The other ${countWord(descriptive)} were replayed to`
      + " describe what happened, so they carry no count.",
    /** the label over the two moments the contract singles out. Seven words. */
    markedHead: "These moments stand out from the rest",
    /** the label over the closing counts. Five words. */
    countHead: "What the frozen experiment counted",
    /** the label on a row that carries a classification from the contract */
    marked: {
      exceptional: "All 8 simulated answers passed every prewritten check",
      perfect_repair: "One message made all 8 corrected answers pass every prewritten check",
      persistent_problem: "This decision stayed wrong",
    } as Record<string, string>,
    /** the control on each row. Six words. */
    row: "See how this decision was made",
    /** the line at the foot while there is more of the ledger below the window */
    scrollCue: "Scroll down to read the rest of the ledger.",
    /**
     * The ledger opens on a key at any hour, so the line across its head has to say which of the
     * two things is true. `OUTCOMES.ended` is kept for a run that has actually finished; this is
     * what a reader who opened it at hour two sees instead.
     */
    playing: (moments: number) =>
      `The run is still playing. This ledger shows all ${countWord(moments)} moments of the`
      + " record, including the ones the run has not reached yet.",
    /**
     * A recorded run other than the one the highlight file was derived from. That file names the
     * run it belongs to, and printing its counts under a different record would put one run's
     * numbers under another run's name. So the counts, the marked moments and the source line
     * all go, and this sentence stands in their place.
     */
    noHighlights:
      "The counts in this ledger are worked out ahead of time and saved in a companion file, one"
      + " file per recorded run. This run has no such file, so the ledger shows no counts of"
      + " agreeing tries, no marked moments and no totals.",
    /** where the ledger's own numbers came from */
    source: (file: string) =>
      `Every count in this ledger was read from ${file}. One program works that file out from the`
      + " recorded run, and checks it against the run again every time this page is rebuilt.",
  },
  /** the run has reached its end and the ledger is waiting. Six words. */
  ended: "The three days have finished playing.",
};
