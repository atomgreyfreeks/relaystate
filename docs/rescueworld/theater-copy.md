# Rescue World — the theater copy deck

Status: draft 1, written 2026-08-23 by claude; source-audit corrections by
codex on 2026-08-23. This document holds every
string the Rescue World theater shows a viewer. Interface builders take the
strings from here and write none of their own. It is bound by
`docs/rescueworld/SPEC-2.md` (the contract and its honesty rules) and by
`docs/rescueworld/EXPERIENCE-PROPOSAL.md` (the story arc and the claim
boundaries).

Every narrative and incident-specific string below is derived from one recorded run:
`product/disaster-replay/runs/kumamoto-2026/260728/timeline.jsonl` (81
events) and its `scenario.json`. Nothing about the incident is invented. Where
an incident string carries a number, the number is quoted from those two files.
Interface instructions also carry literal keyboard ranges, grade numbers and
playback speeds defined by the viewer controls rather than by the run.

## How to read this deck

**Sites.** The run's four target features are
`gsi-2026-kumamoto-landslide-001` through `-004`. On screen they are named
site one, site two, site three and site four, in that order. There are no
invented place names anywhere in this deck. Real feature names — road
routes, municipalities, agencies — are used only where the log records them.

**Names before identifiers.** Every card leads with a name a stranger can
read. The recorded identifier follows in small type on its own line.

**Case.** This document is written in sentence case throughout. The log's own
field values and event kinds are upper case in the file; they appear here in
lower case for readability. Builders read those values from the log, never
from this deck.

**Age.** A card's age is the current round's simulation time minus that
source's own simulation time, both read from the log's `sim_time_s` field,
rendered as whole hours and whole minutes with the seconds dropped. When the
two times are equal the age line reads "Just arrived."

**Chrome fragments.** A few labels are fragments rather than sentences. Each
is at most four words and is marked "chrome" where it appears.

---

## 1. The briefing overlay

Shown once at mission start, over the high camera, before the first round.

**Briefing text** (60 words):

> July 28, 2026, 16:27. A magnitude 7.1 earthquake strikes Kumamoto
> Prefecture. In the first minutes eight simulated reports arrive, some
> exaggerated and some agreeing, while the agency's official updates sharpen
> over four hours. A desk with two rapid-assessment teams must decide where
> they go. You are watching that desk work. Two desks read the same reports
> and follow different rules.

Derivation: magnitude 7.1 and the 16:27 origin time come from the world
event's incident record. Eight simulated reports are the eight
`exercise-report` ingests. Seven official agency updates run from 16:28 to
20:30, a span of four hours. Two teams are `assessment-team-01` and
`assessment-team-02` in the scenario's resource list.

**The control label** (chrome, one word):

> Begin

**The data-honesty tag**, one line under the control:

> The ground, the earthquake and the official updates are real public
> records; every report about people and every outcome is simulated exercise
> data.

Derivation: this is the scenario's own disclosure sentence, shortened. The
full disclosure stays available in the help overlay.

---

## 2. The masthead and the outcome chip

### The masthead

Permanent, top left, for the whole run. Three lines.

> **Kumamoto earthquake**
> 28 July 2026 · 81 recorded events · round 3 of 6
> Simulated exercise on real ground.

The round line is a template: `round {n} of {total}`, where the total is 6
on the plain desk and 8 on the evidence desk. The event count is the
certificate's `event_count`, which is 81.

**The three-angle line**, carried with the masthead as required by the
project covenant. It is one sentence and it names all three angles together:

> One earthquake replayed over real Kumamoto ground; a fleet of
> artificial-intelligence agents reading the reports, deciding and
> dispatching; an evidence table grown the way a lichen grows, with claims on
> one side and sources on the other so neither can spoil the other.

### The outcome chip

**Collapsed** (chrome, four words):

> Open the outcome — key o

**Expanded.** The verdict sentence comes first; the counts come after it.

> The evidence desk reached 77 simulated people. The plain desk reached 60,
> because it sent a team on a claim no second source had confirmed.
>
> Evidence desk 77 · Plain desk 60
>
> Counted in simulated people. This is a labeled exercise and not a record of
> the real response.

Derivation: 77 is the evidence desk's `exercise_people_reached` metric; 60 is
the plain desk's. The reason clause is the plain desk's
`dispatches_on_rejected_claim_versions` metric, recorded as 1, made into
plain words.

---

## 3. Round headlines

A round is a story grouping derived from a desk's recorded events and graph
transitions; it is not a one-to-one rendering of graph nodes. The theater plays
six plain rounds and eight evidence rounds. On the plain desk, the two arrival
events and the later outcome event all carry the recorded `OBSERVE` node but
are grouped into separate arrival and close rounds. On the evidence desk, the
arrival outcome events carry `OBSERVE` and the close outcome event carries
`UPDATE`. Both desks therefore end with an arrival round followed by a closing
round in which the reducer writes the three metrics.

Each headline is one plain sentence of at most nine words. It says what that
round's own events do.

### The plain desk — six rounds

| Round | Node | Events | Headline |
| --- | --- | --- | --- |
| 1 | intake | e0042 | The desk takes in all eight simulated reports. |
| 2 | summarize | e0043, e0044–e0047 | The desk keeps the largest number for each site. |
| 3 | rank | e0048, e0049, e0050 | The desk ranks four sites and keeps two. |
| 4 | dispatch | e0051, e0052, e0053 | Both teams are sent to the two largest numbers. |
| 5 | arrival | e0054, e0055 | Site one holds eighteen simulated people, not sixty. |
| 6 | close | e0056, e0057–e0059 | The plain desk reached sixty simulated people. |

### The evidence desk — eight rounds

| Round | Node | Events | Headline |
| --- | --- | --- | --- |
| 1 | intake | e0060 | The desk takes in the same eight simulated reports. |
| 2 | version | e0061 | Every competing number is kept as its own version. |
| 3 | corroborate | e0062, e0063–e0067 | Two separate sources agree that eighteen people wait. |
| 4 | gate | e0068 | A version without a second source cannot send teams. |
| 5 | rank | e0069, e0070, e0071 | Three supported sites are ranked; the top two qualify. |
| 6 | dispatch | e0072, e0073, e0074 | Both teams go to site two and site three. |
| 7 | arrival | e0075, e0076 | Both teams find the numbers their sources agreed on. |
| 8 | close | e0077, e0078–e0080 | The evidence desk reached seventy-seven simulated people. |

---

## 4. Report cards

A report card is one card in the left feed. It has the same four parts every
time, in this order:

1. **Name line** — the source's plain name, from the log's `source_label` or
   from the source record's title.
2. **Claim sentence** — one complete sentence stating what this source says.
3. **Age line** — one complete sentence stating when the source spoke.
4. **Kind tag** (chrome, at most three words) and the recorded identifier in
   small type.

### Template by source kind

**Simulated field report** (`source_type` field report):

> {source label}
> It reports {value} simulated people waiting for assessment at {site}.
> Filed {age} before this round.
> Simulated field report · {observation identifier}

**Simulated aerial count** (`source_type` simulated sensor):

> {source label}
> Its count is {value} simulated people waiting for assessment at {site}.
> Counted {age} before this round.
> Simulated aerial count · {observation identifier}

**Simulated public post** (`source_type` social):

> {source label}
> It claims {value} simulated people are waiting for assessment at {site}.
> Posted {age} before this round.
> Simulated public post · {observation identifier}

**Simulated municipal call** (`source_type` phone):

> {source label}
> The caller reports {value} simulated people waiting for assessment at
> {site}.
> Called in {age} before this round.
> Simulated phone call · {observation identifier}

**Simulated situation page** (`source_type` web):

> {source label}
> The page states {value} simulated people waiting for assessment at {site}.
> Published {age} before this round.
> Simulated web page · {observation identifier}

**Official agency update** (source `jma-kumamoto-2026-official-updates`):

> Japan Meteorological Agency update {serial}
> The agency reports magnitude {magnitude} and maximum intensity
> {maximum intensity} from {station count} stations.
> Published at {report time} on 28 July 2026.
> Official agency update · {report identifier}

When a field is absent, null, or recorded as the unavailable sentinel zero,
its clause is dropped from the sentence rather than filled in. Several early
updates carry no magnitude and record zero stations; their claim sentence
reads: "The agency reports maximum intensity {maximum intensity}." The viewer
must never render "from 0 stations."

**Road-status ingest, one restriction** (source
`mlit-kumamoto-2026-passable-map-0729-1200`):

> {route name}
> This road is fully closed in {municipality}, {prefecture}, for {reason}.
> Closed from {start time} on 28 July 2026.
> Road-status ingest · {restriction identifier}

Where the record carries a length, one clause is added to the first sentence:
"…, over {length} kilometres."

**Road-status ingest, the whole layer**:

> Road restrictions, official snapshot
> The layer carries {feature count} road restrictions.
> Recorded at {snapshot time} on 29 July 2026.
> Road-status ingest · mlit-kumamoto-2026-passable-map-0729-1200

**Shelter-layer ingest** (source `gsi-uki-designated-shelters`):

> Designated shelters and evacuation places
> The layer lists {designation record count} designations at {unique location
> count} locations: {designated shelter count} designated shelters and
> {earthquake evacuation place count} earthquake evacuation places.
> Designation is standing public information. It does not say whether any
> place was open, staffed, supplied or reachable after this earthquake.
> Shelter-layer ingest · gsi-uki-designated-shelters

**Hazard-layer ingest** (source `gsi-kumamoto-2026-landslides`), present in
the log and included for completeness:

> Mapped landslides and deposits
> The layer carries {feature count} mapped landslide and deposit shapes.
> Read from the authority's published interpretation of aerial photographs.
> Hazard-layer ingest · gsi-kumamoto-2026-landslides

### The three worked examples

These three cards are the story's whole conflict. All three describe site
one. The ages are computed against the intake round, whose simulation time is
20,024 seconds.

**One — the loud claim** (event e0006, simulation time 60 seconds):

> simulated public post A
> It claims 60 simulated people are waiting for assessment at site one.
> Posted 5 hours 32 minutes before this round.
> Simulated public post · exercise-report-001

**Two — the first disagreement** (event e0008, simulation time 120 seconds):

> simulated field team A
> It reports 18 simulated people waiting for assessment at site one.
> Filed 5 hours 31 minutes before this round.
> Simulated field report · exercise-report-002

**Three — the second agreement** (event e0010, simulation time 180 seconds):

> simulated aerial count A
> Its count is 18 simulated people waiting for assessment at site one.
> Counted 5 hours 30 minutes before this round.
> Simulated aerial count · exercise-report-003

---

## 5. The decision rail

**The rail heading** (chrome, three words), carried verbatim from the signed
screen blueprint:

> The decision rail

### The claim-card template

> {value} simulated people waiting at {site}
> {verdict stamp}
> {reason clause}
> {claim version identifier}

The stamp is a chrome fragment. The reason clause is one complete sentence
built from the claim version's recorded supporting observations.

### The verdict stamps and their reasons

**Supported** (recorded verdict `supported`):

> Supported
> Two separate simulated sources report this same number.

**Rejected** (recorded verdict `rejected`). The card's value line is struck
through:

> Rejected
> One source reports this number and two others report a different one.

**Unresolved** (recorded verdict `unresolved`):

> Unresolved
> Only one source reports this number and nothing agrees or disagrees with
> it.

**Not evaluated** — the plain desk's rail only. The plain desk creates no
verdicts, so its claim cards carry this state instead of a stamp:

> Not evaluated
> This desk does not compare sources, so it stamps no verdict.

Derivation: the plain desk's summarize transition records "Keep the largest
reported number for each site; no claim versions or evidence verdicts are
created." Its four claim-state events carry the verdict value `not
evaluated`.

### The three worked claim cards

From the evidence desk's corroborate round.

**Supported** (event e0063, supporting `exercise-report-002` and
`exercise-report-003`):

> 18 simulated people waiting at site one
> Supported
> Two separate simulated sources report this same number.
> gsi-2026-kumamoto-landslide-001:people_waiting:18

**Rejected** (event e0064, supporting `exercise-report-001` only):

> ~~60 simulated people waiting at site one~~
> Rejected
> One source reports this number and two others report a different one.
> gsi-2026-kumamoto-landslide-001:people_waiting:60

**Unresolved** (event e0067, supporting `exercise-report-008` only):

> 28 simulated people waiting at site four
> Unresolved
> Only one source reports this number and nothing agrees or disagrees with
> it.
> gsi-2026-kumamoto-landslide-004:people_waiting:28

### The dispatch-card template

> {team name} to {site}
> This dispatch is authorized by the claim that {value} simulated people are
> waiting at {site}.
> {authorizing-claim status sentence}
> {dispatch identifier} · {authorizing claim version identifier}
> Illustrative route

The last line is chrome. It stays on every dispatch card and on every route
ribbon until the event contract carries recorded road paths, because the
recorded events carry destinations and no route geometry.

The status sentence states what the shared evidence comparison recorded for
the authorizing claim version, in plain words. It has three forms:

- "That claim is supported by two separate simulated sources."
- "That claim is rejected by the shared evidence comparison; this desk does
  not check before sending."
- "That claim is unresolved; only one source reports it."

### The four worked dispatch cards

**Plain desk, first team** (event e0052):

> Assessment team 1 to site one
> This dispatch is authorized by the claim that 60 simulated people are
> waiting at site one.
> That claim is rejected by the shared evidence comparison; this desk does
> not check before sending.
> plain_graph:dispatch-1 · gsi-2026-kumamoto-landslide-001:people_waiting:60
> Illustrative route

**Plain desk, second team** (event e0053):

> Assessment team 2 to site two
> This dispatch is authorized by the claim that 42 simulated people are
> waiting at site two.
> That claim is supported by two separate simulated sources.
> plain_graph:dispatch-2 · gsi-2026-kumamoto-landslide-002:people_waiting:42
> Illustrative route

**Evidence desk, first team** (event e0073):

> Assessment team 1 to site two
> This dispatch is authorized by the claim that 42 simulated people are
> waiting at site two.
> That claim is supported by two separate simulated sources.
> evidence_graph:dispatch-1 ·
> gsi-2026-kumamoto-landslide-002:people_waiting:42
> Illustrative route

**Evidence desk, second team** (event e0074):

> Assessment team 2 to site three
> This dispatch is authorized by the claim that 35 simulated people are
> waiting at site three.
> That claim is supported by two separate simulated sources.
> evidence_graph:dispatch-2 ·
> gsi-2026-kumamoto-landslide-003:people_waiting:35
> Illustrative route

---

## 6. Consequence captions

An arrival caption appears at the site, at the moment the outcome event
fires. Each is one or two complete sentences.

**Plain desk, site one** (event e0054, recorded outcome 18 simulated people):

> Assessment team 1 reaches site one and finds 18 simulated people waiting,
> not the 60 the single post claimed.

**Plain desk, site two** (event e0055, recorded outcome 42):

> Assessment team 2 reaches site two and finds 42 simulated people waiting,
> the number two separate sources reported.

**Evidence desk, site two** (event e0075, recorded outcome 42):

> Assessment team 1 reaches site two and finds 42 simulated people waiting,
> the number two separate sources reported.

**Evidence desk, site three** (event e0076, recorded outcome 35):

> Assessment team 2 reaches site three and finds 35 simulated people waiting,
> the number two separate sources reported.

**The scarcity line**, shown with the plain desk's site-one arrival, at the
moment the shortage bites:

> Both teams are now committed, so no team is left for site three, where two
> sources agreed on 35 simulated people.

**The simulated-damage stamp** (chrome, two words). It stays on any scar,
mark or figure drawn on the ground by the exercise:

> Simulated damage

---

## 7. The debrief

The world dims and the debrief rises. The outcome sentence comes first, then
the three beat cards.

**The outcome sentence**:

> The desk that checked its evidence reached 77 simulated people. The desk
> that trusted the loudest report reached 60. The difference was one
> unchecked claim.

**Beat one — cause** (26 words):

> At site one, one simulated post claimed 60 people waiting while two other
> simulated sources agreed on 18. The evidence desk supported 18 and rejected
> 60.

**Beat two — choice** (30 words):

> Both desks sent one team to site two. The plain desk spent its other team
> on site one's rejected claim; the evidence desk sent its other team to site
> three.

**Beat three — consequence** (26 words):

> The plain desk reached 60 simulated people; the evidence desk reached 77.
> The gain of 17 came from one claim the evidence desk refused to trust.

**The beat-card control** (chrome, four words):

> Fly there and replay

**The debrief honesty line**, standing under the three cards:

> Every number here is simulated exercise data, replayed from one recorded
> file of 81 events.

---

## 8. Comparison overlays

### The ghost echo

Shown for one beat at a moment where the two desks chose differently, then
gone.

**Template**:

> The other desk sent its team here.

**The named form**, used where the desk name is on screen:

> The {other desk name} sent {team name} to {site} instead.

**The two worked instances**, both derived from the two dispatch decisions
(events e0049 and e0070), which select different second targets from the same
eight reports:

- Watching the plain desk, at its second dispatch: "The evidence desk sent
  assessment team 2 to site three instead."
- Watching the evidence desk, at its first dispatch: "The plain desk sent
  assessment team 1 to site one instead."

### The world swap

One key exchanges the world in place. Same camera, same round. The stamp
names the run now on screen (chrome, three words):

> Plain desk run

> Evidence desk run

### The standing assumption line

This line accompanies every comparison surface: the ghost echo, the world
swap and the debrief list of moments where the desks chose differently. It is
never optional and never abbreviated:

> This comparison is a simulated counterfactual; assumptions are listed in
> the menu.

---

## 9. The help overlay

### The explanation, in three paragraphs

**One — the scenario**:

> On 28 July 2026 an earthquake struck Kumamoto Prefecture in Japan. This
> page is a rescue-assessment exercise played back over that place. The
> ground, the mapped landslides, the road closures, the designated shelters
> and the official agency updates are real public records. Every report about
> people, every dispatch and every outcome is simulated exercise data, and
> the damage drawn on the ground is a simulation.

**Two — the two desk rules**:

> Two desks read exactly the same eight reports. The plain desk keeps the
> largest number reported for each site and sends its two teams to the two
> largest numbers. The evidence desk keeps every competing number as its own
> version, counts how many separate sources agree, and will not send a team
> on a version that no second source confirmed. That rule is the only thing
> that differs between them.

**Three — the lichen table**:

> The desk's evidence table is grown the way a lichen grows: two partners
> living joined, claims on one side and sources on the other, kept apart so
> that neither one can spoil the other. A claim never rewrites its own
> sources, and a source never edits a claim. That is why a rejected number
> stays on the record with its one source still attached to it.

### The data boundary and playback explanation

These four paragraphs predate this deck and remain on the help surface. This
amendment adopts them verbatim, so they are governed by the same copy contract
as the rest of the theater.

**The real-world layers**:

> The ground is real. It is built from the Geospatial Information Authority
> of Japan's published elevation tiles, decoded by the rule their own metadata
> states. The landslide zones are that authority's interpretation of aerial
> photographs flown between 29 July and 3 August 2026. The road closures are
> the Ministry of Land, Infrastructure, Transport and Tourism's passable-road
> snapshot of 29 July 2026 at 12:00 Japan time. The shelters are officially
> designated locations, which says nothing about whether any of them was open,
> safe, staffed or reachable after the earthquake. The buildings are Japan's
> open 3D city model of Uki City, standing where the model says they stand, as
> context from before the earthquake.

**The simulated exercise boundary**:

> Everything about people is invented. Every report, every count of people
> waiting, every dispatch and every outcome is synthetic exercise data, and
> the damage drawn on the ground is a simulation of what such an earthquake
> does. No mark on this page claims to show the real condition of a real
> building, and no real building here is ever drawn damaged or marked as a
> rescue site. The exercise's four sites sit far north of the mapped city
> block.

**The sealed replay**:

> Nothing is generated while you watch. The page reads one recorded file of
> 81 events, each one carrying the hash of the line before it, and every mark
> on screen is read out of that file. Playing the run twice draws the same
> pixels. You have freedom of viewpoint and freedom of interrogation; you
> cannot change what happened.

**The round clock**:

> The run is counted in rounds rather than in seconds, because that is how it
> is shaped: each round is one step the desk takes, read out of the recorded
> graph transitions in the log itself, and the two desks take a different
> number of steps. The recorded second and the time of day sit under the round
> for anyone who wants them. The reports arrive in bursts hours apart, so each
> recorded moment is given the same share of the playback rather than being
> laid on a straight line; no moment is skipped or reordered.

**The terrain-scale template**, filled from the loaded elevation tiles and
map bounds rather than from authored incident numbers:

> The ground is drawn {vertical exaggeration} times taller than life, so that
> hills of a few hundred metres read across a window {width} kilometres wide
> and {depth} kilometres deep. The elevation tiles in this cut run from
> {minimum elevation} to {maximum elevation} metres above sea level, and the
> {no-data pixel count} picture elements they record no elevation for — the
> sea, and ground outside the survey — are drawn dark rather than flat.

The help surface's structural chrome is also fixed here: `What you are looking
at`, `What is real and what is invented`, `How it is driven`, `The controls`,
`Attribution`, and `close — esc`.

### The controls

Each control is one plain sentence.

> Drag to turn the camera around what it is looking at.
> Roll the wheel to zoom toward whatever the pointer is over.
> Right-drag, or hold shift and drag, to slide across the ground.
> Fly with the w, a, s and d keys; use q and e for height.
> Hold the pointer at the edge of the frame to scroll the camera that way.
> Press h for the home view.
> Hold control and press 1 to 9 to save the current view to that number.
> Press 1 to 9 to go back to the view saved on that number.
> Hold shift and press 1 to 7 to change the grade.
> Click a site, a landslide zone, a road closure, a shelter or the buildings
> to select it; click bare ground to clear the selection.
> Press tab to switch desks.
> Press space to play and pause; the world stays lit while it is paused.
> Press the comma and period keys to step back and forward one recorded
> event.
> Press the bracket keys to step back and forward one round; the run lands at
> the end of that round, so the feed at the edge shows everything the round
> brought.
> Choose one times, four times or sixteen times to set how fast the run
> plays.
> Press o to show the outcome again.
> Press d to show the debrief again.
> Press r for the real decision moments, where the reconstructed real response
> is set beside the three desks that worked the same five moments.
> Since r opens that surface, the camera takes its height from q and e, and
> from f for down.
> Press 0 to return to the first moment.
> Press v for the internal view, which is a building tool.

### The attribution line

> Elevation, landslide interpretation and shelter designations: Geospatial
> Information Authority of Japan. Road restrictions: Ministry of Land,
> Infrastructure, Transport and Tourism, Japan. Earthquake record: Japan
> Meteorological Agency. City model: Project Plateau, Ministry of Land,
> Infrastructure, Transport and Tourism.

---

## 10. Error and edge states

**Empty selection panel**:

> Nothing is selected. Click a site, a landslide zone, a road closure, a
> shelter or the buildings to see what the run recorded about it.

**Data loading**:

> Reading the recorded run.

**Data could not be read**:

> This run could not be read. {reason}

**Internal-view warning**, shown across the top of the frame the whole time
the internal view is open:

> The internal view is a building tool. It puts the two desks side by side
> and exposes the raw seek bar, and it is not part of the finished piece.

**A round with no report cards**, shown in the feed:

> No new reports arrived in this round.

**A comparison with no paired run loaded**:

> No second run is loaded, so there is nothing to compare against.

---

## Strings the builders must not write themselves

Every string a viewer can read comes from this deck. That covers the briefing
and its control, the masthead and its three lines, the outcome chip in both
forms, all fourteen round headlines, every report card, every claim card and
dispatch card, every arrival caption, the debrief sentence and its three
beats, every comparison overlay and its standing assumption line, the help
overlay, and every error and edge state listed above.

A builder who finds a surface with no string for it does not invent one. The
missing string is added to this deck first, derived from the recorded events
the same way every string here is, and the surface then reads it from here.
Changes to wording are edits to this document, and the interface follows.
Three rules govern any such edit: no invented place names, every number
quoted from the log or the scenario, and no sentence claiming that anyone was
rescued or that any real responder erred.

## Amendment 1 — 2026-08-23, post-build copy audit

An independent conductor pass found three categories of viewer text that were
already on screen but not yet registered here: the blueprint's decision-rail
heading, the implemented `d`-key debrief control, and the legacy help prose.
This amendment adopts those exact strings and the terrain-scale template. It
changes no viewer text, incident claim, interaction or simulation state.

## Amendment 2 — 2026-08-23, final response-surface audit

An independent final cross-verification found two additions that landed after
the first amendment: the real-decision surface and the modeled
shelter-occupancy switch. This amendment adopts their exact labels and templates. It
also corrects the legacy control sentence that still assigned the `r` key to
camera height after `r` had become the real-decision control. The controls
above now carry the corrected sentence and the two new `r`-surface sentences
verbatim. No incident claim, measurement or simulation state changes here.

### The real decision moments

The verdict sentences, historical choices and open questions on this surface
come from the certificate-checked real-response summary rather than from
authored interface copy. The deck owns the labels and templates around that
record.

**Surface title**:

> The real decision moments

**Lead**:

> Five moments from the real response of 28 July 2026, each one reconstructed
> from public records with only the information that existed at that minute.
> Three desks worked every moment, eight times each, on the same reconstruction.

**The historical-choice label**:

> What the real responders did

**The record-gap label**:

> The record does not settle

**The two decision labels**:

> Decision cutoff

> Decided by

**A desk's validity count**, with both numbers read from the baked summary:

> In {valid runs} of {total runs} tries, this method produced a decision that
> passed every prewritten check.

**The example-assignment stamps**:

> passed every prewritten check

> did not pass every prewritten check — {named rule}

**The repeated-assignment count**:

> the same assignment came back in {number} of {total runs} runs

**The ineligible-name disclosure**:

> {number} of these names are not on this moment's list of eligible units and
> places.

**The standing assumption line**:

> This is a simulated counterfactual; the assumptions are listed in the menu,
> and nothing here is a claim about what really happened after the decision.

**The source line**, with the count and manifest-hash prefix read from the
baked summary:

> Read from {certificate-checked configurations} certificate-checked result
> files under frozen manifest {first 16 characters of manifest hash}, and
> checked line for line against the signed report.

**Loading**:

> Reading the recorded experiment.

**Data could not be read**:

> The recorded experiment could not be read. {reason}

### The modeled shelter-occupancy switch

The switch states the model boundary in its own name, its subordinate line and
the note shown when it is first opened.

**Button**:

> occupancy

**Subordinate line**:

> modeled, not observed

**Layer note**:

> occupancy · modeled from official aggregate reports — not observed
> per-shelter data

## Amendment 3 — 2026-08-23, classroom-language pass on the real decision moments

The owner read the real-decision surface as a stranger would and found that it
opened with the wording of the scientific report rather than with what had
happened. This amendment rewrites the surface's own labels and adds a plain
opening, so a high-school class with no background can read the top of the
screen once and know the result. Nothing about the incident, the experiment or
the recorded numbers changes. No number is typed into a string: every count
below arrives from `app/public/real-response-summary.json`.

Three rules govern this amendment. The wording the two agents signed is kept
word for word and moves one click down, into a panel the reader opens, rather
than being edited or dropped. Every technical word on the surface is either
replaced with a plain one or explained where it first appears. The strings the
certificate-checked summary carries — the moment titles, the task lines, the
record of what the real responders did, the two verdict sentences and the two
limits paragraphs — are shown as recorded and are never rewritten here.

The strings this amendment replaces are the Amendment 2 lead, historical-gap
label, decision-clock label, validity count, example stamps, repeated-choice
count, ineligible-name disclosure, standing assumption line and source line.
The Amendment 2 versions of those nine strings are retired.

### The opening, in classroom English

**Lead**, with the three counts read from the baked summary:

> These are {moments} real decisions from the earthquake response of 28 July
> 2026 in Kumamoto, Japan. Each one is rebuilt from public records, using only
> what was known by that moment's deadline. Then {desks} desks of
> artificial-intelligence agents — AI for short — worked all {moments}
> moments, {tries} times each.

**What happened**, with every count read from the baked summary:

> We took {moments} real decisions from that night and gave every one of them
> to {desks} desks of AI agents, {tries} tries each, which is {runs} tries per
> desk. In {plain} of {runs} tries, passing plain written notes along produced
> a decision that passed every prewritten check. In {table} of {runs} tries, an
> evidence table with every claim written beside the source that backs it did
> so. In {corrected} of {runs} tries, that same table plus one automatic
> message naming the exact mistake did so.

**What passing every check means**. This paragraph is the plain definition of
the summary's `fully_valid` field and carries no numbers:

> Passing every check means it used only allowed units and places, stayed
> within resource limits, cited information available by the deadline, named
> required unknowns, and used nothing learned later.

**The honest verdict**. This paragraph states the mixed result in plain words.
It carries no numbers, because the counts of registered rules live in the
signed report rather than in the baked summary:

> We wrote down the tests each idea had to pass before any of this was run. The
> evidence table failed. It passed every test but one: it broke the limits on
> how much it could send more often than the plain-notes desk did, and one
> failed test fails the whole claim. The one automatic correction message
> passed every test it was given, so that claim holds.

### The exact registered wording, one click down

The two verdict sentences registered in Amendment 2 stay word for word. They
move, with the summary's own honesty and disclosure sentences, into a panel the
reader opens. The panel is closed when the surface opens.

**The control that opens it**:

> Open the exact wording we registered before the runs

**The note inside it, above the four registered paragraphs**:

> The two paragraphs below are copied word for word from the report both agents
> signed. The two after them are the limits this exercise registered before it
> ran.

### The sentence that leads each moment

Each of the five cards opens with one sentence built from that card's own
record: what the real responders sent and where, then the two desks' counts
side by side. The names, quantities and counts are read from the baked summary.

**With a recorded choice**:

> The real people in charge sent {quantity} to {place}[ and {quantity} to
> {place}]: {first thing sent}[ and {number} more].

**Where the public record carries no choice**, which is true of the missing
shake-reading moment:

> The public record does not name a choice at this moment.

**The two desks, in every card**:

> The AI desk that checked its evidence broke no rule in {table} of {tries}
> tries; the desk that passed plain notes did that in {plain} of {tries}.

### One line under each desk's name

So that a card can be read on its own, each of the three desk boxes carries one
line naming what that desk did differently. The lines are keyed to the arm
identifiers the baked summary carries.

> It passed plain written notes from one step to the next.

> It passed a table with every claim written beside its source.

> It had that same table and one message naming its exact mistake.

### The labels, rewritten in plain words

**The record-gap label**, replacing "The record does not settle":

> What the record does not say

**The decision-clock label**, replacing "Decision cutoff":

> Deadline

**A desk's count**, replacing "of {total runs} runs fully valid":

> of {total runs} tries with no broken rule

(Amendment 6 replaces this line in turn. The count now reads "In {valid} of
{total runs} tries, this method produced a decision that passed every
prewritten check.")

**The example stamps**, replacing "this example passed every rule" and "this
example broke at least one rule":

> this run broke no rule

> this run broke at least one rule

(Amendment 6 replaces both stamps in turn, with the three badges it registers.)

**The repeated-choice count**, replacing "the same assignment came back in
{number} of {total runs} runs":

> the same set of choices came back in {number} of {total runs} tries

**The ineligible-name disclosure**, replacing "eligible" with "allowed":

> {number} of these names are not on this moment's list of allowed units and
> places.

**The standing assumption line**. It replaces the Amendment 2 line, which
used the words "simulated counterfactual" without explaining them, and it now
carries the whole honest boundary on its own, because the summary's honesty and
disclosure sentences have moved into the panel:

> Everything the AI desks did here is a what-if we simulated: it asks what
> could have been chosen with only what was known at that minute. It is not a
> record of what happened next. It is not evidence that artificial intelligence
> would improve a real rescue or save lives, and it does not say the real
> responders were wrong. The full list of what is real and what is invented is
> in the help menu.

**The source line**. It replaces the Amendment 2 line, which used the words
"configurations" and "manifest" without explaining them:

> Every number on this page was read from {result files} result files, each one
> checked against its own signed certificate. The exact list of files was
> frozen before the runs and is named by the code {first 16 characters of
> manifest hash}. The numbers were then checked line by line against the signed
> report.

### What this amendment leaves alone

The surface title, the historical-choice label, the "Decided by" label, the
loading line and the could-not-be-read line keep their Amendment 2 wording. The
help overlay, the briefing, the debrief and the occupancy switch are untouched.
The wording inside the baked summary is untouched, so the moment titles still
carry the record's own terms, including "no received intensity" for a town
whose shake reading never arrived.

## Amendment 4 — 2026-08-23, regional feed and overwatch

The exercise works four sites in one corner of the map, while the delivered
record covers the surrounding region. This amendment adopts the exact interface
copy for a second feed under the reports and for the optional camera tour. It
changes no incident claim, recorded value, interaction or simulation state.

The route names, magnitudes, decision titles, clock times and counts below are
slots. Their values are read from the delivered regional files at the current
playback tick. Every regional line is separate from the exercise's report feed,
and selecting one sends the camera to its recorded place.

### The regional feed

**Heading**:

> Elsewhere in the region

**A recorded road closure**:

> A road closes: {route name}.

**The road-closure explanation**:

> The Ministry of Land, Infrastructure, Transport and Tourism recorded this
> closure with the minute it began. The line enters the feed at that minute,
> and clicking it sends the camera to the closed road's first recorded
> position.

**A recorded earthquake at or above the stated threshold**:

> Aftershock, magnitude {magnitude}.

**The earthquake explanation**, with the threshold and count read from the
recorded sequence:

> The Japan Meteorological Agency's recorded earthquake sequence. This feed
> names only the shocks of magnitude {threshold} and above that fall inside
> this run's window and on this map, which is {number} of them. The smaller
> ones are still drawn by the aftershock layer.

**A recorded decision deadline**:

> A real decision moment passes: {title}. Press r.

**The decision-deadline explanation**:

> This is the recorded deadline of one of the five real decisions, and the
> camera goes to the places that moment was allowed to choose between. Only
> the moments whose deadline falls inside this run's window appear here; press
> r for all five.

**The time under every regional line**:

> Recorded at {clock time}.

**The overflow line**, when one stretch of the record holds more entries than
the surface can show:

> {number} more entered the record in the same stretch.

### The overwatch camera tour

The overwatch switch is off until the reader asks for it. After twelve seconds
with no camera input, it tours the place the run is working, the latest regional
event and the whole ground. Any key, drag or wheel movement returns control to
the reader immediately.

**Switch label**:

> Overwatch

**Key label**:

> p

**Switch states**:

> on

> off

**Switch explanation**:

> Overwatch is the camera tour. Turn it on, take your hands off the controls
> for twelve seconds, and the camera visits the place the run is working, the
> last thing the region recorded, and the whole ground in turn. Any key or any
> drag takes the camera straight back.

### The two help lines

> Press p for overwatch, the camera tour: with your hands off the controls for
> twelve seconds the camera visits the place the run is working, the last thing
> the region recorded, and the whole ground in turn, and any key or drag takes
> it straight back.

> The lines under the reports are the rest of the region: a road closing at its
> recorded minute, an earthquake in the recorded sequence, or one of the five
> real decision moments running out of time. Click one to send the camera to
> it.

## Amendment 5 — 2026-08-23, the directed watch

Randy watched the default playback and found it unreadable: the whole
compressed record free-ran in a couple of minutes, the rounds blurred past,
the camera stayed where the opening flight left it, and the debrief arrived
whatever the viewer was doing. The round-stepped model already existed and the
default never used it. This amendment adopts the copy for the directed watch,
which is now the default after Begin: each round plays at a readable pace,
holds long enough to read its headline and its newest report cards, and then
starts the next round on its own, while the camera goes to where that round is
happening. Choosing one of the named speeds leaves the directed watch and
free-runs the record instead.

This amendment changes no incident claim, no recorded value and no simulation
state. It adds six strings and changes nothing already registered. The number
in the countdown is a slot: it is the seconds left on the current hold, and the
hold's own length is derived from how many events the round carries.

### The mode chip

**The chip while the run is directed**:

> directed

**The chip after a speed has been chosen**:

> free run

**The chip explanation**:

> Directed is the guided watch. Each round plays slowly enough to read, then
> holds so you can read the headline and the newest reports, and the camera
> goes to where that round is happening. The countdown says when the next
> round starts and the ] key starts it now. Space pauses everything. Choosing
> a speed leaves the directed watch and free-runs the record; click here to
> come back.

### The hold between rounds

**The countdown**, with the seconds read from the hold the run is in:

> next round in {number} s

**The key beside it**, the same round-stepping key the transport already
names:

> ]

### The help line

> The run is directed by default: each round plays slowly, then holds so you
> can read it, and the camera goes to where that round is happening. Choosing
> a speed leaves the directed watch and free-runs the record; click the mode
> chip beside the speeds to come back.

## Amendment 6 — 2026-08-23, the full incident played as one world

The seventy-two-hour Kumamoto incident is now the run the viewer opens on, and
it is one recorded story rather than two desks. This amendment adopts the
strings that run needs, and corrects two phrasings this deck already carried.

**The two corrections.** The phrase "completely right" is withdrawn as the
display wording for a graded decision, and so is "fully valid" as a phrase a
viewer reads. Both overstate what the check measures. The wording both agents
settled on is used instead, in section 9 above and everywhere else a grade
appears: the aggregate line reads "In {valid} of {runs} tries, this method
produced a decision that passed every prewritten check"; the definition reads
"Passing every check means it used only allowed units and places, stayed within
resource limits, cited information available by the deadline, named required
unknowns, and used nothing learned later"; and a single choice wears one of
three badges — "passed every prewritten check", "did not pass every prewritten
check — {named rule}", or "descriptive only — outside the registered result".
The debrief's opening sentence carries the words "In the simulation" as its
opener, which the countersigned story template requires.

**The positioning this amendment fixes in writing.** Rescue World is a
decision-making information tool. A grade says whether a decision traces to the
information available at its own moment and obeyed the resource rules of that
moment. No sentence ranks a method against the people who responded in July
2026: the real response is a run, never a benchmark. Comparing our own three
methods against each other is the finding, and every impact sentence stays
inside the simulation and names its units.

**The strings this amendment adds**, all of them held in
`app/src/rescueworld/copy.ts` under `INCIDENT` and all of them derived from the
sealed run rather than written here:

- the briefing for the full incident, which states the human problem and the
  question before anything else;
- the opening card: the magnitude, the agency's own intensity reading and the
  origin clock, closing on the line that names the ribbon above it — "{shocks}
  more tremors were recorded before the agency published its last revision of
  the main shock at {clock}. The ribbon above marks the story's moments, and the
  shaded stretches are quiet clock time crossed quickly.";
- the ribbon's own label, four words of chrome: "The seventy-two hours";
- the act cards: "Act {n} of {total}" over each act's own label and story line,
  both copied from the scenario manifest;
- the story card that hangs over a place: the record's own headline, its own
  description sentence beneath, and the clock it was recorded at;
- the decision rail for a run with no claim cards: one row per moment of
  decision, with its clock, the office the record names, how many recorded ways
  of deciding were run against it, and whether it has passed;
- the outcome while the run plays: how far through the record the viewer is,
  how many moments of decision have passed and how many tremors have arrived,
  each with its own total, and no grade of any kind;
- the debrief: the finding sentence, the three graded cards, the definition,
  the descriptive-only line, the use card, the limitation, the next experiment,
  the three-angle line and the honesty line, in the order the story template
  fixes.

No incident claim, no recorded value and no simulation state changes here.

## Amendment 7 — 2026-08-23, the eyes-on inspection repairs

An inspection of the running viewer at 1600 by 900 found four sentences on
screen that this deck had not registered and one that was not true. This
amendment registers the new ones and retires the untrue one.

**The map plate caption is withdrawn where the record holds no such count.**
Every place on the map carries a small instrument with the place's name and, in
smaller type under it, the words for what its dial counts. Those words read
"people reached" on every plate of the seventy-two-hour incident, and that
record holds no count of people reached anywhere in its four hundred and
fourteen lines. The dial was showing zero and the words were promising a number
nobody wrote down. Three captions are registered in its place, and a plate may
only wear the one whose number was read out of the log it is playing:

- "simulated people reached", for a run that records that count, which the
  two-desk routing exercise does;
- "claim verdict", for a place whose claim the log gives a verdict to;
- "moments recorded here", for a place where the log records neither, which is
  every place of the full incident.

The plate's name line drops a trailing group of four or six digits, because in
this record those digits are the minute the first thing there happened —
`fdma-fire-mobilization-1627` is the mobilization at 16:27 — and a bare number
printed over a caption reads as a quantity the dial is counting.

**Japanese road names now carry an English gloss.** Japan writes a road's class
into its name, and a line reading "A road closes: 県道142号上椎葉湯前線" gives an
English-reading viewer nothing at all. The class and the number are stated in
English first and the record's own name is kept after it, in brackets, so a
reader of Japanese still has the file's own words. The glosses are a closed
list, one per class the delivered file uses: "Prefectural route {n}",
"National route {n}", "Expressway {code}", "An expressway" where the file gives
no code, "A main local road", "A city road", "A town road" and "A village
road". The road's kind is glossed the same way where a panel states it: "an
expressway", "a national road the state maintains", "a national road the
prefecture maintains", "a prefectural road", "a municipal road".

**One vocabulary for a grade, on every surface.** The real-decision surface
carried two ways of saying the same thing: the badge wording Amendment 6
registered, and a second set of rows reading "this run broke no rule" and "this
run broke at least one rule". The second set is retired. The stamp under a desk
now reads "This run passed every prewritten check." or "This run did not pass
every prewritten check.", and the label beside the count reads "of {n} tries
passed every prewritten check".

**One new line of chrome.** The real-decision surface is about three windows of
writing long, and a reader who cannot see a scrollbar reads the first window
and stops. While there is more below the fold the foot of the frame carries
"Scroll for the rest of this page", and the line goes when the reader reaches
the end.

No incident claim, no recorded value and no simulation state changes here.

## Amendment 8 — 2026-08-23, the story a stranger reads

Randy watched the build and named two failures of communication rather than of
rendering. This amendment registers what both repairs say.

**The account of what is happening moves to the head of the right-hand
column.** The sentence that says what the world is doing right now sat at the
foot of the frame, in small grey type beside the transport buttons, where a
viewer watching the map never looked at it. It now heads the right-hand column
directly above the decision rail, in the largest type any running panel carries,
so the eye that follows the unfolding account stays in one place for the whole
run. No wording changes: the act's own label, the act's own story line and the
clock line are the strings this deck already carries. The line that says how far
through the record the run has got now wraps instead of being cut off, which is
what it was doing at the foot of the frame.

**The debrief is told as a story rather than posted as a result.** It followed
none of the order `docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md` sets: it
opened on a sentence made of three counts, never said what the agents were
trying to do, never said in ordinary words what the three ways of working
differed in, never said what one try was, and never turned a count into a share
a person already has a feel for. The order is now the standard's own, and these
strings are registered for it:

1. The human question, before any number. "When a disaster is still happening,
   the hardest part is not caring enough. It is deciding who to send where while
   the reports are still thin, still contradictory, and still arriving. This
   replay asked one question about that: does the way a decision is written down
   change whether it holds up?"
2. One concrete moment out of the record, naming the office that owned it and
   the minute it was due, so the question stops being abstract.
3. The heading "The three ways the agents were asked to work", over the three
   cards. Each card now carries, under its name, the one sentence saying what
   that way of working actually did differently, which this deck already
   registered for the real-decision surface.
4. What one try was, and that the checks were written down before anything ran.
5. The heading "How many tries produced an answer that passed every check", over
   the three counts.
6. The counts turned into a share: about 43 in every hundred, and about 85 in
   every hundred, which is roughly five tries in every six.
7. What the correction repaired, stated as arithmetic a reader can check: the
   table alone got 23 of the 40 wrong, one message naming the exact mistake
   turned 17 of those 23 into answers that passed, and every one of the 17 that
   already passed still passed.
8. The wider set of runs, which now stands after the result it is not part of
   rather than before it, and says in plain words why it is a description and
   not a result: the checks for the other six moments were written after those
   runs rather than before them.

**The real-decision surface opens the same way.** Three paragraphs are added
before the counts: the finding in plain words before any number, who the agents
are and what they were being asked to decide, and what the three ways of working
differ in. One paragraph is added after the counts, saying what each step
between them means. The registered wording, the three badges, the definition of
passing every check and the standing limitation are unchanged and stay where
they are.

**Vocabulary.** The words bounded, registered, descriptive, configuration and
evidence-table do not appear on either surface without an ordinary-language
explanation beside them; where a plain sentence could replace one, it has.

**One correction.** The line under a moment of decision in the rail began with a
lower-case number word, so it read as a fragment rather than as a sentence. It
now opens with a capital: "Three recorded ways of deciding were run against this
moment."

No incident claim, no recorded value and no simulation state changes here.

## Amendment 9 — 2026-08-23, the agent trace

Randy's ruling opened this one: "it's essential we figure out a way to highlight
what an agent simulation run looks like and be able to compare it to real life,
in a simple way even a high school kid can understand. Right now the agent
simulation and decision making is basically invisible." Codex made it a release
blocker on the board in message 1148 and set the five steps in message 1149. The
water-planning moment was named the worked example in message 1152.

This amendment registers a new surface, the agent trace, and every string on it.
It changes no incident claim, no recorded value and no simulation state. Every
number it puts on screen is read from the sealed 414-event file or from the
scenario file that defines the eleven decision moments, whose fingerprint the
run's own certificate records.

### What the surface is

At each of the eleven moments when somebody had to decide something, the trace
walks six cards in the right-hand column, one at a time, with the world still
standing beside them. It opens from a control on that moment's row in the
decision rail, or with the t key. During the directed watch the water-planning
moment opens its own trace when the run reaches it, and the run holds until a
viewer closes it.

The six cards, in reading order:

1. **What the real responders did.** The public record of the choice made at
   that minute, in the record's own words, with the record's own open questions
   under it. It is read first and it is set at the same size, in the same place
   and with the same weight as the five that follow it, which is honest-labelling
   rule 10 of `docs/rescueworld/STORY-TEMPLATE.md`.
2. **Step 1 — what was known by the deadline.** Every report that existed by
   that moment's cutoff, each with the caveat the record attaches to it, then the
   unknowns the moment required a decider to name, then the job itself.
3. **Step 2 — what the desk with plain written notes proposed.** Its plan, the
   limit this moment set, which unknowns it named, its own written reason, and
   the badge the check gave it.
4. **Step 3 — what the desk with an evidence table did.** The same, plus how it
   counted each report: as supporting its plan, as arguing against it, or left
   unresolved.
5. **Step 4 — what the check caught, and the one correction.** What the check
   found, one sentence per rule it named, then what the second answer moved.
6. **Step 5 — the final simulated action.** The final plan with its badge, then
   the public record set beside it by kind and by scale and by nothing else.

### The two framing labels

Every card wears one of two labels, so a reader always knows which of the two
kinds of thing they are reading.

- **"public record of the response"**, on card one only.
- **"later computer simulation"**, on cards two to six.

One sentence on card one states the boundary in full: "Everything on this card
comes from the public record of what the responders did. The five cards after it
were produced by computer models long afterwards, using only what had been
written down by this same deadline."

### What the grades are said in

Nothing new. The three badges, the definition of passing every check and the
standing limitation are the wordings already fixed in part six of
`docs/rescueworld/STORY-TEMPLATE.md` and already registered in this deck. The
trace shows the passed badge and the failed badge on the desk cards, adds the
descriptive-only badge on the last card of the six moments outside the registered
result, and pins the standing limitation to the foot of the frame on every card
that carries a grade, so it can never be scrolled away from the grade it
qualifies. The word "confidence" appears nowhere on the surface.

### No identifier reaches a card

Codex's independent gate over all sixty-six rendered cards found one line that
broke this rule, and this amendment closes it and the class it belongs to.

The checker talks to code, so it writes a finding as a rule name and an
identifier: `MISSING_REQUIRED_UNKNOWN: unknown-people-alive-by-time`. Those exact
lines stay in the recorded evidence the page reads and stay available to a
mechanical gate under `trace.check.messages`. What a reader sees is the same
finding with the identifier replaced by the thing it names, resolved through the
scenario's own labels the same way every place name and unit name on this surface
is resolved. The worked example is the aftershock moment: "The answer left out one
thing this moment required it to say. Later deaths are not broken down by cause or
time, so people alive at a decision cutoff are unknown." A closed list of
sentences covers every rule the checker can name, and an identifier that resolves
to nothing is left out of the sentence rather than printed.

One further case belongs to the same class. A desk can write a name the exercise
does not carry, in the machine form an identifier takes, and the early fire
moment's plain-notes desk did exactly that eight times. Such a name is shown as
the answer's own wording rather than as the name of a thing: "The plan names a
unit the answer wrote as command-support-fukuoka-city, for the Kumamoto incident
area." The card then says how many of those names fell outside this moment's own
lists, which is the finding the reader is there for.

### The comparison, and what it is allowed to say

The last card sets the record and the simulated decision beside each other in one
sentence, and only where both draw on the same pool of units. Where they name
different kinds of action, the card says so and compares nothing. One sentence
closes the comparison every time: "That comparison is about the kind of action
and its scale. It says nothing about which choice was better, and it is no
evidence that either one was."

### The strings this amendment registers

They live in `app/src/rescueworld/copy.ts` under `TRACE`, in the deck's own form:
the surface's name and its controls; the six headings; the framing labels and the
framing sentence; the block labels; the opening lines for what was known and for
the unknowns; one sentence saying what each of the three desks does differently;
the two forms a plan is said in, counted where a moment divides a pool of
interchangeable units and named where it hands out distinct units; the totals and
limit lines; how each report was counted; which unknowns were named; how many
names fell outside a moment's own lists; what the check is and what its message
means; what a second answer changed; the comparison lines; and one plain sentence
for each of the nineteen rules the checker can name.

Three rules govern them, the same three that govern every other string in this
deck: no invented place names, every number quoted from the record, and no
sentence claiming that anyone was rescued or that any real responder erred.

### Two corrections to strings already here

**The decision rail's closing line** named only the r key. It now names the trace
first, because the trace is the thing a reader on that panel wants: "Open the
agent trace on any moment above to see what the agents knew, what each desk
proposed and what the real responders did. Press r for the registered experiment
and the exact wording of its findings."

**The help list** gains two lines: the t key and what the six cards hold, and the
fact that every moment in the rail carries its own control for the same
walk-through.

## Amendment 10 — 2026-08-23, one story panel and a result screen a stranger can read

Randy watched the build again and named two release blockers, both about what a
person can read rather than about what the page renders. This amendment registers
the strings both repairs need.

### The unfolding account is one panel, and it is the most readable thing on the page

The panel over the decision rail carried the act's own line as its largest type
and put the moment the run had actually reached into a line of small
letter-spaced capitals underneath it. At the same time the arriving reports at
the upper left carried the same story a second time, in small grey type, in the
corner of the frame a viewer watching the map never looks at. A viewer therefore
had two places to look and neither of them was the one that told them what was
happening at that minute.

The panel now reads in a fixed order. Which act the run is in, as one line of
chrome. Then the sentence saying what is happening at this minute, at seventeen
pixels, which is the largest and brightest type any running panel carries. Then
the clock, the hour of the three days and the moment of the record. Then what the
whole act is about, under its own label.

Two strings are new and both are chrome. `INCIDENT.narrate.kicker` writes "Act 3
of 4 · Day two: the water crisis". `INCIDENT.narrate.aboutLabel` reads "What this
act is about". The sentence in the panel is the record's own beat wording, which
this deck already carries, with a full stop added so it is a complete sentence.
The clock line is `INCIDENT.face` with its beat slot left empty, because the beat
now stands above it at reading size instead of being repeated inside it.

The arriving reports at the upper left are a locator now. Each line carries the
report's own headline and the minute it was published, and the class of source it
came from. The report's claim sentence and the file identifier the record gave it
are both gone from the screen. The identifier was a machine string printed at a
viewer, and the claim sentence was the second telling of a story that is now told
once. Every claim sentence stays available to a verifier through the run's own
state probe. The four classes of source are still never blended into one another,
which is the published rule this region has always carried.

### The result screen opens on the earthquake and ends on the next test

The debrief opened on the human question, which is abstract, and reached its
three counts before it had said where the earthquake was. It named one decision
moment as its concrete example and then described three methods in the general.
It never said what the ordinary way of working is, never said in one place what
had failed on the way, and never said what the zero at the head of its counts
does and does not mean.

It is now told in this order, and every count stands underneath a sentence that
already makes sense without it.

1. **The incident.** `INCIDENT.story.scene` gives the minute, the date, the
   place, the magnitude, the agency's own intensity reading, the length of the
   response in hours and in days, and how many recorded moments have just played.
2. **The question**, `INCIDENT.story.question`, rewritten so it no longer opens
   on a contrast statement.
3. **The job and its deadlines.** `INCIDENT.story.jobHead` heads it,
   `INCIDENT.story.job` states it, and `INCIDENT.story.momentsHead` heads a list
   built from `INCIDENT.story.momentLine`: one line per scored moment, carrying
   the minute it fell due and what had to be decided, with the office the record
   names underneath it.
4. **What passing a check means**, `INCIDENT.definition`, moved above the first
   badge a reader meets rather than left under the three method cards.
5. **One moment, worked all the way through.** `INCIDENT.story.workedHead` heads
   it. The public record's own choice is read first and is set at the same size
   as the three answers after it, under `INCIDENT.story.workedRecordLead`. Then
   `INCIDENT.story.workedPlain`, `INCIDENT.story.workedTable`,
   `INCIDENT.story.workedCheckLead`, `INCIDENT.story.workedFix` and
   `INCIDENT.story.workedPassed` carry the same water-planning moment through the
   plain-notes desk, the evidence-table desk, the check, the one correction and
   the answer that passed. Every number in them is read from the recorded run:
   twenty-four water trucks proposed against a limit of twenty-two, the checker's
   own sentence saying exactly that, two towns reduced by one truck each, and a
   final plan of twenty-two that passed every prewritten check. The badge each
   answer earned stands under its sentence in the exact words this deck already
   fixes. `TRACE.compareClaim` closes it, so the record and the simulated
   decision are never read as a ranking.
6. **The three ways in general**, with `INCIDENT.story.normalWork` naming the
   plain-notes desk as the baseline this exercise tested, then the three cards
   this deck already carries, then `INCIDENT.story.tryLine`.
7. **The counts.** `INCIDENT.story.resultHead`, then zero, seventeen and
   thirty-four, each one now labelled with what it counts and how many tries it
   is out of through `INCIDENT.countLabels.tries`. Then
   `INCIDENT.story.zeroMeans`, which is new and which exists so the zero is never
   read as forty reckless plans: the plain-notes desk stayed inside the hard
   limits on how much could be sent in thirty-seven of its forty tries, and what
   it missed every time was the written part of the job. Then
   `INCIDENT.story.translate` and `INCIDENT.story.repair`, unchanged.
8. **What this shows and what it does not show.** `INCIDENT.story.provesHead`
   heads it. `INCIDENT.story.proves` states the finding.
   `INCIDENT.story.whatFailed` states both failures at the same size, including
   the registered claim that failed. `INCIDENT.limitation` follows, word for
   word. `INCIDENT.story.noReach` says that this record keeps no count of how
   many people anyone reached, so no such claim is made anywhere.
   `INCIDENT.story.wider` closes it with the descriptive runs.
9. **Where this could be useful, and the next test**, under
   `INCIDENT.story.useHead`, carrying `INCIDENT.use` and
   `INCIDENT.nextExperiment` unchanged, then the three angles and the honesty
   line.

`INCIDENT.story.example` is retired. The first fire-package moment it named was
replaced by the water-planning moment, which is the one the record follows all
the way through a mistake and its repair.

### The rule these two repairs share

A surface tells its story once, in the place a viewer is already looking, at a
size they can read from the back of a room. A second telling in smaller type
somewhere else in the frame is a defect even when every sentence in it is true.

### Three repairs the final inspection named, registered here

**The incident panel stands in front of the aftershock ribbon.** Both open across
the same band at the top of the frame, and the panel was drawn at half strength,
so the two sets of writing showed through one another and neither could be read.
The panel is on solid ground now and stands in front, so whichever one is open is
the one being read. No wording changes.

**The plain-notes card says why an answer of the right size still failed.** Its
first two sentences at the water-planning moment are "It proposed 22 water trucks
across six places" and "This moment allowed 22", which a first-time reader cannot
square with a failing badge. The line that gives the reason — "Six of the names in
that plan are not on this moment's list of allowed units and places" — now stands
directly under those two sentences instead of far below the working. Both desk
cards are built the same way, so the same rule holds wherever a plan is the right
size and still did not hold.

**A badge counts the names it is about.** The badge named the rule the check found
first, in the singular, over a body line saying six names were outside the list.
`TRACE.ruleCounted` gives the two ineligible-name rules a counted form, used
wherever one answer broke the same rule more than once: "did not pass every
prewritten check — it named six places that are not on this moment's list of
allowed places". The badge's shape is unchanged and is still the story template's
own.

## Amendment 11 — the run-preparation console says exactly what is real

The run-preparation console is the surface registered in
`docs/rescueworld/RUN-LAUNCHER-DESIGN.md`. It uses these sentences and no
substitute wording.

**The heading:**

> Run these decision moments again on the graphics processors.

**The opening:**

> On 28 July 2026 an earthquake struck Kumamoto Prefecture in Japan. Software
> agents worked five of the decisions the real responders faced that day. This
> panel prepares those same decisions for another run and keeps the new answers
> separate from the published result.

**The fixed settings:**

> The model, the words the agents receive, the five moments, each deadline, all
> three methods and every prewritten check stay fixed.

**The standing boundary:**

> A run prepared here repeats work that has already been done and checked. Its
> answers stay separate until both agents have checked them, and they change none
> of the numbers on the results page.

**The recorded-completion label:**

> This is a recorded completion. This rehearsal finished on 23 August 2026 and
> is being replayed. Nothing is running on the graphics processors now.

The console calls a new production run an operator replication. It never calls
that later run a registered try, because repeating one of the written-down seed
numbers does not put a new answer into the frozen result.

## Amendment 12 — 2026-08-24, the decision outcomes a viewer reads without touching anything

This amendment registers every string on the five surfaces built for the Space
Data presentation: the decision rail rows that carry their own outcome, the
eight-cell agreement strip, the reason list that opens under any grade, the map
telegraph, and the decision ledger the run closes on. The design was agreed by
Claude and Codex on the team board in messages 1402 and 1403, and its evidence is
`docs/rescueworld/GAME-UX-RESEARCH.md`. The strings live in `OUTCOMES` in
`app/src/rescueworld/copy.ts`.

### What binds every string here

Three rules, all from the research document's own refusal list.

**No percentage appears anywhere**, including any figure a model states about its
own confidence. What this record honestly holds is a count of eight recorded
tries at each registered moment, and the strip shows that count as eight cells a
person can point at.

**Every grade is said in the words the story template already fixes.** The three
badges in `INCIDENT.badge`, the definition line in `INCIDENT.definition` and the
standing limitation in `INCIDENT.limitation` are used word for word. This
amendment writes no substitute grade wording of its own.

**A moment outside the frozen experiment never carries a count.** The six
descriptive moments get eight outlined cells, the sentence
`OUTCOMES.stripDescriptive`, and the badge "descriptive only — outside the
registered result". A filled count on one of those rows would be read as part of
a registered result it is not in.

### The strings this amendment registers

**The agreement strip.** `OUTCOMES.stripLabel` heads it. `OUTCOMES.stripReading`
joins the two sentences the registered contract writes for itself — one about how
far the eight tries agreed, one about how many passed every prewritten check — and
that joined sentence is both the visible caption and the strip's accessible text.
`OUTCOMES.stripDescriptive` replaces both on a descriptive moment.
`OUTCOMES.weakAgreement` is the extra sentence a scattered moment carries, and it
states the count it is about so the advice and the cells a reader can see are one
fact: "Only 2 of the 8 tries chose the same set of places here, so read this
moment's own reports before you rely on it."

**The reason list.** `OUTCOMES.reasonOpen` and `OUTCOMES.reasonClose` are the
control's two labels. `TRACE.messageLabel` heads the list itself, because the
list is the same translation of the checker's output the walk-through already
carries, read from the same recorded answer. `OUTCOMES.reasonNone` is what a
clean answer says.

**The map telegraph.** `OUTCOMES.telegraph.label` heads a stack of proposed
places. `OUTCOMES.telegraph.due` states the deadline the stack is counting down
to. `OUTCOMES.telegraph.place` writes one proposal as its place and its count.
`OUTCOMES.telegraph.wanted` and `OUTCOMES.telegraph.agreed` say which way of
deciding wanted it. `OUTCOMES.telegraph.what` says once, on every stack, that a
hollow mark is a proposal and that no team has moved to it.
`OUTCOMES.telegraph.unplaced` counts the places an answer named that the record
puts nowhere on this ground, and `OUTCOMES.telegraph.more` counts the places at
one position the stack does not draw. Both exist so a place is never given an
invented position and never quietly dropped.

**The decision ledger.** `OUTCOMES.ledger.title` names it and
`OUTCOMES.ledger.open` is the one control that reaches it from the closing panel.
`OUTCOMES.ledger.lead` says what the list is before any count appears.
`OUTCOMES.ledger.scope` says which rows carry counts and which do not.
`OUTCOMES.ledger.markedHead` heads the moments the contract singles out, and
`OUTCOMES.ledger.marked` gives each of the contract's three classifications a
plain label. `OUTCOMES.ledger.countHead` heads the closing counts, which are the
frozen experiment's own zero, seventeen and thirty-four out of forty tries, each
labelled through `INCIDENT.countLabels.tries`. `INCIDENT.limitation` closes it
word for word. `OUTCOMES.ledger.source` names the one file every count was read
from. `OUTCOMES.ended` is the line at the top saying the three days have played.

### The rule about totals, written down so it is not lost

The ledger lists moments and totals nothing across them. It never sums, averages
or ranks the eleven rows. The only counts on it are the frozen experiment's own
three, and those are read from
`app/public/rescueworld-highlights.json` rather than added up on screen. This
follows the Civilization lesson recorded in the research document: Ed Beach
removed the score from the next game's timeline because it made players chase the
number instead of watching what they had actually done.

### The rule about hidden numbers, written down for the same reason

Nothing invisible drives anything visible here. The one place a value changes the
picture is the weak-agreement sentence, and that sentence prints the count that
triggered it. This follows the Frostpunk lesson in the same document: when 11 bit
studios found a hidden fifty per cent death roll driving its simulation, it
deleted the roll and replaced it with a visible choice carrying a stated cost.

## Amendment 13 — 2026-08-24, the repairs a stranger's read-through asked for

A reader who had never seen this page before was walked through it and wrote down
every place the page told them something untrue, told them nothing, or hid one
sentence under another. This amendment registers the sentences written to answer
those notes. All of them live in `OUTCOMES` and `HELP` in
`app/src/rescueworld/copy.ts`.

### What binds every string here

**A sentence about the record says what this record holds.** Three different
recorded runs can be loaded into this page, and a count written into the page
rather than read from the loaded file is true of one of them. Every count in the
help overlay is now a slot filled at load from the file that is actually open.
The help paragraph that said "one recorded file of 81 events" said it over a
record of 414.

**A surface never prints a number taken from a different run.** The highlight
file names the recorded run it was derived from. Where the loaded log is a
different one, the counts, the marked moments, the standing limitation and the
source line are all left off, and `OUTCOMES.ledger.noHighlights` says so.

**A label and the thing under it agree.** Eight empty cells under a label
promising a count of agreeing tries said two things at once, so a row with no
counts wears `OUTCOMES.stripLabelNone` instead.

### The strings

**The cell legend.** `OUTCOMES.stripLegend` says what the five states of an
agreement cell mean, in three plain sentences, and it stands where the cells
first appear in the decision rail and again in the ledger. The two colours are
named as the colours a viewer sees, which are blue and orange. It is never a
hover: a person demonstrating this in front of a room does not hover.

**What a grade is about.** `OUTCOMES.badgeScope` stands next to a grade wherever
the eight cells stand beside it. The grade reads the one answer shown and the
cells read all eight recorded tries, and the water moment stood a blue "passed
every prewritten check" badge directly under six orange cells with no sentence
separating the two readings.

**The label on a row with no counts.** `OUTCOMES.stripLabelNone` replaces
`OUTCOMES.stripLabel` on the six moments that carry no count of agreeing tries.

**The ledger opens at any hour.** `OUTCOMES.ledger.playing` is the line across
the head of the ledger while the run is still playing, and it states how many
moments the list holds. `OUTCOMES.ended` is kept word for word and now prints
only once the run has actually reached its last tick. The ledger announced that
the three days had finished playing when it was opened at hour two.

**A record with no highlight file.** `OUTCOMES.ledger.noHighlights` is what the
ledger says in place of counts it does not have. On a record that also holds no
moment of decision the ledger is not reachable at all: neither the l key, nor the
control in the closing panel, nor the line in the control list exists there.

**A decision that proposes places at two positions.**
`OUTCOMES.telegraph.crowded` counts a proposal panel this window is too narrow to
stand clear of the others. Two panels for one decision used to land on the same
stretch of ground and clip each other's heading and rows. They are now placed one
after another and each is kept clear of the ones already standing; a panel with
nowhere clear is dropped whole and counted in this one line, rather than shrunk.
At 1600 by 900 every recorded decision fits and this line does not appear.

**The help overlay describes the record that is loaded.**
`HELP.incidentScenario` and `HELP.incidentStory` are the two opening paragraphs
for the run that replays the whole incident, in place of `HELP.scenario` and
`HELP.desks`, which describe the two-desk exercise and are still used there.
`HELP.driven` states the size of the recorded file it is reading. `HELP.paced`
states how the run is counted, with the sentence about a second desk only on the
record that has one. `HELP.places` counts the places the record names.
`HELP.ledgerControl` is the ledger's own line in the control list, and it appears
only on a record that has a ledger.

**Two controls added to the control list.** The g key opens the picture controls
and the n key opens the run-preparation console. Both existed and neither was
named, so a reader was told about controls that had moved on and not about
controls that were there.

### The rule about counts of the same thing, written down so it is not lost

One record states one total of its own recorded moments. The masthead prints 414
and the help overlay prints 414, because both read `events.length` from the same
loaded file. An earlier draft of `HELP.incidentStory` read the count of distinct
recorded seconds instead and printed 368, which put two different totals of
"recorded moments" on two surfaces of one page.

## Amendment 14 — 2026-08-24, the one-desk record stops describing two desks

**One sentence trimmed.** The help overlay's pacing paragraph on a one-story
record read "Each round is one stretch of the recorded story, read out of the
log itself, and both desks watch the same one." The full-incident record has
one shared story and no second desk, so the clause about both desks is gone
and the sentence ends at "the log itself." The two-desk exercise keeps its own
unchanged pacing sentence.

**One control line made conditional.** "Press tab to switch desks." appears in
the help overlay's control list only on a record that carries two desks. On the
one-story incident record the tab key does nothing, and the help must not
offer a control that does nothing.

## Amendment 15 — 2026-08-24, the plain-text audit repairs in the run console and the map layers

`node app/scripts/audit-plain-text.mjs` flagged 34 written strings across six
viewer sources. Every one of them is rewritten below. The audit now reports one
finding in these six files, and that one is kept on purpose; it is named at the
end.

### `app/src/rescueworld-console/contract.ts`

**Two decision titles say what the decision was.** "Choose the first outside fire
package before a public bulletin exists" is now "Choose which fire crews from
other prefectures to send, before any public bulletin exists". A reader had no
way to know that a "package" is a set of crews and vehicles sent together.
"Place the first two municipal liaison pairs using the complete 18:10 picture" is
now "Choose which two towns get the first pairs of officers who carry messages,
using everything known by 18:10", because a "liaison" is an officer who carries
messages between two organisations and the screen never said so.

**Four refusal messages name the choice a person has.** "Choose rehearsal or
operator replication." is now "Choose either a rehearsal or a repeat of the eight
recorded tries." "Choose one of the five registered decision moments." is now
"Choose one of the five decisions this experiment recorded." "A rehearsal always
uses the excluded practice number 51000." is now "A rehearsal always uses try
number 51000, which is left out of every reported result."

**The sentence describing a request carries its own verb.** The two fragments
"all five decision moments" and "the excluded rehearsal try 51000" were headings
with nothing happening in them. They are now "runs all five recorded decisions"
and "the practice try 51000, which no reported result uses", and the sentence
around them reads "This request runs all five recorded decisions with the
practice try 51000, which no reported result uses."

### `app/src/rescueworld-console/index.ts`

**The panel's five paragraphs.** The heading is "Run the same five decisions
again on the graphics processors." The opening paragraph introduces the machines
once, as "a bank of graphics processors", so every later sentence that says "the
graphics processors" points at something the reader has met. "the published
result" became "the result already published", "the words the agents receive"
became "the words each agent is given", and "the numbers on the results page"
became "the numbers this page already shows".

**The replay paragraph drops the word "completion".** It now reads "This
rehearsal ran on 23 August 2026, and the panel is replaying what it saved.
Nothing is running on the graphics processors, and nothing is waiting to run."

**Six status and error sentences.** "The development server refused the request."
is now "The page that starts a new run did not answer." "The recorded completion
file is missing." and "The recorded completion could not be read." are now "Its
saved file is missing from this machine." and "Its saved file could not be read."
"The recorded completion was refused." is now "The recorded rehearsal did not
load." "Clipboard permission was denied. The exact command is selected for manual
copy." is now "The browser would not copy. The exact command is selected, ready
to copy by hand."

**One count label.** The third method's label was "table and correction", a
heading with no verb built on a buried one. It is now "corrected table", which
reads under its number as "corrected table passed every check", beside "plain
notes" and "evidence table".

**One dropdown line follows its sentence.** The rehearsal seed option read "The
excluded rehearsal try 51000" while the sentence beside it now says "the practice
try 51000". The option reads "The practice try 51000".

### `app/src/rescueworld/context.ts`

**Two agencies say what they do.** "Statistics Bureau of Japan, e-Stat" is now
"Statistics Bureau of Japan, which issues the national census through its e-Stat
website". "Geospatial Information Authority of Japan" is now "Geospatial
Information Authority of Japan, which draws Japan's official maps".

**The shelter layer says what it does not know.** "designated shelters · status
unknown in event" is now "official shelters · this recording does not say whether
they were open".

**Two source descriptions.** "an observed public record" is now "a public record
of what was seen" and "an observed public census record" is now "a public census
record of what was counted".

**The population note explains its own brightness.** "Brightness is the square
root of a cell's count, at its strongest on the fullest cell on this map." is now
"A cell's glow rises with its count and rises slowly: a cell holding a hundred
times as many people glows only ten times as bright. The cell holding the most
people is the brightest one on this map." The arithmetic is unchanged; the
sentence now shows it with a number a reader can follow.

**The shelter note names who acted.** "N designation records at M locations" is
now "Officials named M places as shelters, listing them N times in all". The house
mark sentence reads "A house mark shows a place that was named before the
earthquake and never something that happened during it."

**The occupancy note is three sentences instead of two.** It reads "Across the
whole prefecture, 183,882 people were in shelters at the worst hour, and 855
shelters stood open at a different hour. Those two published totals give 215.1
people for each shelter." then "That average, spread across the N shelters marked
on this map, comes to M modeled people. Each shelter's share follows how many
people the census counted within 3.0 kilometres of it." The words "in proportion
to the census population" are gone; the arithmetic behind the numbers is
unchanged.

### `app/src/rescueworld/acts.ts`

**Three beat names say what a reader is looking at.** A record that names no
decision showed "A decision moment"; it now shows "A decision was recorded here".
A record that names no milestone showed "A recorded moment"; it now shows "An
event was recorded here". "Official update at 18:10" is now "An official update
went out at 18:10".

### `app/src/rescueworld/pairing.ts`

**Two sentences about whether two runs can be compared.** "These runs carry no
run-identity equality keys, so only their scenario identifier was checked." is now
"These runs carry no fingerprint of what they were built from, so only their
scenario name was checked. Nobody has checked whether they used the same reports,
the same resources and the same decisions." The agreement sentence now reads
"These runs agree on all N fingerprints of what they were built from: ...".

### `app/src/rescueworld/stations.ts`

**One dial caption.** "moments recorded here" is now "moments the log counts
here", which says who is counting.

### The one finding kept on purpose

`app/src/rescueworld-console/index.ts` line 228 reads "The recorded completion
arrived with its five results, each one unchanged since it was written." The
audit calls "completion" a verb dressed as a noun, and it is right.
`app/scripts/verify-rescueworld-run-console.mjs` asserts that the replay status
carries the words "recorded completion", so the phrase stays in exactly one place
and every other use of it is gone.

## Amendment 16 — 2026-08-24, the page's own labels and the display gloss for the recording

A reader opened Rescue World and could not read it. The decision title "Choose
the first outside fire package before a public bulletin exists" means "decide
which fire crews from other prefectures to send, before any public announcement
exists", and nothing on the screen said so. `app/scripts/audit-plain-text.mjs`
found 767 strings a viewer can see that fail at least one plain-language rule,
and 492 of them come out of the sealed recording rather than out of any copy
file. The method is written up in `docs/rescueworld/PLAIN-TEXT-METHODS.md`.

**A display gloss, never an edit to the recording.** `app/src/rescueworld/gloss.ts`
holds twenty-one tables from the recording's own identifiers to the sentences a
viewer reads. The recording's bytes are untouched; its hash still matches the
certificate the run recorded. Every lookup falls back to the recording's own
words when a table has no entry. 451 strings now reach the screen glossed.

**The decision titles.** All eleven are rewritten to say the scenario. "Choose
the first outside fire package before a public bulletin exists" is now "Decide
which fire crews from other prefectures to send, before anyone has announced
anything in public." "The dawn aggregate" is now "At dawn, figures covering the
damage across the whole region arrive."

**Who decided.** Every organisation is named with what it does. "Commissioner,
Fire and Disaster Management Agency" is now "the head of Japan's national fire
and disaster agency". "Kyushu Regional Development Bureau, MLIT" is now "a
national government office that looks after roads and rivers across Kyushu, the
southern Japanese island where Kumamoto sits". The word "Modeled", which marked a
desk invented for the exercise and read as noise, now says so: "a stand-in
prefecture desk that sorts incoming reports, invented for this exercise because
the public record names no real one".

**The three switches for real map data.** Their faces and their tooltips said
what the agencies call the data. "designated shelters · status unknown in event"
is now "official shelters · nobody says if they opened", and its tooltip states
in full sentences that being named as a shelter says nothing about whether the
place opened, was safe, had staff, or could be reached. "population · 2020 census
grid" is now "who lives here · counted in 2020". "occupancy · modeled, not
observed" is now "how full shelters got · worked out, not measured".

**The panel that describes whatever a reader clicks.** "a step in the road
surface from the earthquake" is now "the earthquake left a step in the road". "A
landslide or deposition polygon" is now "one patch where the land slipped or
where the slipped earth came to rest". "The restriction is recorded as beginning
…" is now "The road closed …". "the elevation tiles" is now "tiles of ground
height". Every agency in the panel is named with its job.

**The heading over the decisions** reads "The decisions, in order" rather than
"The decision rail". "Rail" is a word for a part of this build, not a word for
anything in the world a viewer is watching.

**The help overlay** keeps every fact and splits its two long paragraphs into
single-idea sentences. The paragraph about the ground now names what each agency
did rather than naming the agency alone.

**One sentence supplies its own article.** The worked example reads "By 12:00 the
… had to plan", so the name it is handed arrives without one. `gloss.withoutArticle`
does that at the single call site, and every other surface prints the name as
`gloss.ts` writes it.

**Two sentences deliberately left as they are.** The standing limitation, which
says these checks "do not grade the real responders", and the two sentences
beside every eight-try strip are asserted word for word by gate scripts. The
strip sentences are the frozen highlight contract's own, and a display gloss
would break the proof that the viewer did not reword them. Both are recorded as
explained passes in the audit, with the gate line that pins them.

## Amendment 17 — 2026-08-24, the copy deck rewritten against the plain-text audit

`node app/scripts/audit-plain-text.mjs` flagged 187 written strings in
`app/src/rescueworld/copy.ts`, more than any other file. 181 of them are
rewritten here. The six that remain are gate-asserted or agreed wording and are
recorded in the audit's own explained-passes list; they are named at the end.

Every change is in one file, `app/src/rescueworld/copy.ts`. The four failures
being removed are the ones `docs/COPY-CONTRACT.md` names: a stack of nouns with
nothing saying how they relate, a definite article on something the screen never
introduced, a verb buried inside a noun, and a specialist term used as if it were
ordinary.

### The words that were replaced everywhere

**"This moment" is now "this decision".** Roughly forty-five sentences across the
agent trace, the decision outcomes and the ledger pointed at "this moment" and
left a reader asking which moment. "It named all three unknowns this moment
required" is now "It named all three unknowns this decision required". "This
moment allowed 22" is now "This decision allowed 22".

**"This moment's list of allowed units and places" is now "the list of units and
places this decision allowed".** The old phrase pointed at a list the screen had
never shown. The new one says whose list it is and what is on it, and the same
repair runs through every rule sentence the checker can print.

**"Ingest" is gone from the report-card tags.** "Road-status ingest",
"Shelter-layer ingest" and "Hazard-layer ingest" are now "Official road-closure
file", "Official shelter list" and "Official landslide map". Nothing on the
screen ever said that "ingest" meant a desk taking a file in.

**"The layer" is gone from the report cards.** "The layer carries … road
restrictions" is now "This file names … road closures and limits". "The layer
lists … designations at … locations" is now "This file names … designations at …
places". A viewer had met no layer.

**"The rail" is gone.** "Every moment of decision in the rail" is now "Every
moment of decision in the list down the side of the screen".

**"The Japan Meteorological Agency" is now "Japan's national weather service" in
body copy.** The formal name and its plain-words explanation stay together once,
in the help overlay's source list: "Earthquake record: Japan Meteorological
Agency, Japan's national weather service." The other two agencies are named the
same way there — the Geospatial Information Authority of Japan is "the national
mapping agency", and the Ministry of Land, Infrastructure, Transport and Tourism
is "Japan's national ministry for roads".

**"Correction" as a noun is gone except where the frozen result uses it as a
method name.** "One correction message went back carrying that sentence" is now
"That one sentence went back to the desk". "Adding the correction message passed
34 of 40" is now "Adding one message that named the mistake passed 34 of 40".

**"Simulation" as a noun is gone.** "the damage drawn on the ground is a
simulation" is now "so is the damage drawn on the ground", after a sentence that
says everything about people is invented. "In the simulation, decisions that
passed every prewritten check went from …" is now "In this simulated exercise,
decisions that passed …".

**"Assessment" is gone from the eight simulated reports.** "18 simulated people
waiting for assessment at site one" is now "18 simulated people waiting for a
team at site one".

### The label the reader most needed

**`COPY.TRACE.reasonLabel` now says who wrote the sentence under it.** It read
"Why it said it chose that". The sentence beneath it is prose the language model
wrote itself while the run was recorded, and nothing on the card said so. It now
reads **"What the computer wrote as its own reason"**. The audit's own
explained-passes entry for those 173 model-written sentences points at this
label as the thing that keeps them honest, so the label had to carry the claim.

### The names of the screens

- The agent trace overlay is now **"How one decision was made"**, and the control
  that opens it, on the trace panel and on every ledger row, is **"See how this
  decision was made"**. "The agent trace" named a part of the build.
- The real-response overlay is now **"The real decisions, and what the desks
  chose"**, and the help line matches it: "Press r for the real decisions, where
  what the responders actually did is set beside the three desks that worked the
  same five moments."
- The closing list is now **"The decision ledger holds every moment of
  decision"**, and the help line defines the word where it first appears: "Press
  l for the decision ledger, which is the closing list of every moment of
  decision."
- The label over the whole-run ribbon was "The seventy-two hours" and is now
  **"Seventy-two hours run left to right."**

### The two framing labels on a trace card

"public record of the response" and "later computer simulation" are now **"this
comes from the public record"** and **"a software agent wrote this later"**. Both
now say what the card is rather than naming a category, and the second keeps the
words `verify-rescueworld-agent-traces.mjs:105` asserts on every step card.

### The card headings

- "What the real responders did" is now "This is what the real responders did".
- "What the desk with an evidence table did" is now "What the desk with an
  evidence table wrote down".
- "What the check caught, and the one correction" is now "What the check caught,
  and the one message it sent back".
- "The final simulated action" is now "The simulated action it finally chose".
- "Before the five steps" is now "Read this before the five steps".
- "The things nobody knew yet" is now "What nobody knew yet".
- "What it proposed" is now "What it asked for".
- "The record and the simulation, side by side" is now "Set the record beside the
  simulated decision".
- "Places under consideration" is now "Places these answers named".
- "The moments worth naming" is now "These moments stand out from the rest".
- The three desk names, "The plain-notes desk", "The evidence-table desk" and
  "The evidence-table desk, corrected", are now "The desk that wrote plain
  notes", "The desk that kept an evidence table" and "The same desk, after one
  message named its mistake".
- Every "Scroll for the rest of …" is now "Scroll down to read the rest of …".

### The help overlay

**The two scenario paragraphs now list what is real one item at a time.** "The
ground, the mapped landslides, the road closures, the designated shelters, the
earthquake sequence and the official agency updates are real public records"
became six things named in two sentences: "They are the ground, the landslides on
the map, the roads that closed and the shelters the government had designated.
They also include the tremors recorded by Japan's national weather service and
the updates that service published."

**How the run is paced no longer mentions a graph.** "Each round is one step a
desk takes, read out of the recorded graph transitions in the log itself" is now
"Each round of the run is one move a desk makes, read straight out of the
recorded log". The sentence "counted in rounds rather than in seconds" is now
"counted in rounds, because that is the shape the record has", which drops a
contrast construction rule 7 bans.

**The control list.** "Press h for the home view" is now "Press h to go back to
the starting view". "Press 0 to return to the first moment" is now "Press 0 to
return to the start of the record". "Hold the pointer at the edge of the frame"
is now "at the edge of the screen". "Press t for the agent trace at the moment of
decision the run has reached" is now "Press t to see how the decision the run has
reached was made". Overwatch's two descriptions, in the control list and in its
own tooltip, are split into single-idea sentences.

**The evidence-table paragraph.** "The desk's evidence table is grown the way a
lichen grows: two partners living joined, claims on one side and sources on the
other" ran 34 words before its first full stop. It is now three sentences, and
the lichen is explained before it is used as a comparison.

### The rest of the deck

- "This dispatch is authorized by the claim that 60 simulated people are waiting"
  is now "This team was sent on the claim that 60 simulated people are waiting".
- The four Japanese road classes are named with what somebody does for them: "A
  city road" is now "A street the city keeps up", "a prefectural road" is now "a
  road the prefecture keeps up", and "A main local road" is now "A main road that
  runs between towns". The record's own Japanese name still follows in brackets.
- "Designation is standing public information" is now "These places were named in
  advance and the list stands whatever happens."
- "Read from the authority's published interpretation of aerial photographs" is
  now "Japan's national mapping agency read these shapes off aerial
  photographs."
- The three counters under the outcome now say what they count against: "of 414
  moments played" is now "of the 414 moments this record holds", and "of 11
  decision moments" is now "of the 11 moments when somebody had to decide".
- "next round in 5 s" is now "the run moves on in 5 seconds".
- "modeled, not observed" under the occupancy switch is now "These numbers come
  from a model, and nobody counted them."
- "The interesting part is what that last step repaired. The table alone got 23
  of the 40 tries wrong" is now "The interesting part is what that last change
  repaired. The evidence table on its own got 23 of the 40 tries wrong."
- "so nobody could move the goalposts afterwards" is now "so nobody could change
  the rules later on".
- Seventeen sentences that ran past thirty words were split. None of the
  numbers, the counts or the denominators changed.

### The six strings left exactly as they are

Each one is a sentence a gate script or the story template pins word for word.
All six are recorded in the audit's explained-passes list with the gate line that
holds them, and the audit now reports PASS with no failing string.

1. `HELP.controls`, "Press g for the picture controls, which set the grade and
   the glow." — `verify-rescueworld-space-data.mjs:220` asserts the phrase.
2. `HELP.controls`, "Press n for the run-preparation console, …" — asserted at
   `:221`. Its second clause was repaired: "the exact configuration" is now "the
   exact settings".
3. `REAL.traceHandoff` — must contain "correction" between "check" and "real
   responders" for `verify-rescueworld-result-story.mjs:129`. Its four other
   faults were repaired.
4. `INCIDENT.ways.evidence_feedback`, "table and a correction" — the frozen
   result is reported as 34 of 40 tries with it, asserted at `:117`.
5. `INCIDENT.badge.descriptive`, "descriptive only — outside the registered
   result" — agreed badge wording, and `main.ts:2127` picks the badge colour by
   comparing against this exact string.
6. `INCIDENT.use` — must contain "emergency dispatch" and "hospital handover" for
   `verify-rescueworld-result-story.mjs:125`. Its noun stack was repaired: "an
   emergency dispatch desk" is now "in emergency dispatch".

`npm --prefix app run build` passes. `node app/scripts/audit-plain-text.mjs`
reports 0 written strings failing, down from 187 in this file.

## Amendment 18 — 2026-08-24, the strings a blind judge could not read

A judge with no knowledge of this project read all 1,245 strings the plain-text
audit lists, one at a time, with no file name and no surrounding text, and wrote
what each one meant to them. 1,031 came back with the right meaning. 169 came
back fuzzy and 45 came back with no reading at all. This amendment answers that
sheet. Every change below names the judge's own misreading, because the test of
a repair is that the misreading is no longer available.

The judge's own summary is the shape of the work: the page's own writing was
mostly clear, and almost every failure sat in a string the page did not write —
a class name that leaked into the listing, a checker's rule code, or a sentence
the software wrote for itself and the page pasted on unchanged.

### Strings that reach no screen: 25 of them, now left out of the listing

Fourteen are class names. `tbadge fail`, `strip empty`, `rarm lit`, `beat flat`,
`badge ok`, `tgnote tgwhat` and eight more are written onto an element's class
attribute in `app/src/rescueworld/main.ts` and never into a text node. Eleven
more are the checker's own rule codes, such as
`MISSING_REQUIRED_UNKNOWN: unknown-1627-internal-payload`. `trace.ts:387` keeps
those for `verify-rescueworld-agent-traces.mjs:131` to assert against; every
surface draws `check.findings` instead, which `trace.ts:402` builds as one plain
sentence per rule. Neither kind is a string a viewer can meet. Many of them, but
not provably all, were among the 45 the judge could not read.

Both kinds are now left out of the audit's listing, each under a reason recorded
in `EXCLUDED_REASONS` in `app/scripts/audit-plain-text.mjs` and printed at the
foot of every listing, so the sheet a judge reads is every string a viewer can
meet and nothing else. A class name is recognised from the source: the statement
assigns it to `className` or `classList`, or the function that returns it is
named for the class it names. Nothing else is excluded: `node
app/scripts/audit-plain-text.mjs` prints 14 under `css-class-name` and 11 under
`checker-code-never-drawn`, 25 rows in all, and those two reasons are the whole
list.

### About 130 quoted machine sentences: framed and glossed, never rewritten

The remaining wall was the recorded answers' own written reasons. These are
evidence: the trace panel shows a viewer what the software actually wrote at the
moment it decided, and a reworded quotation proves nothing. So not one word of
them changes. Two things were added around them.

**The label over the quotation.** It read "What the computer wrote as its own
reason", which a reader could still take for the page's own summary. It now
reads **"Quoted word for word from what this software wrote"**. Under the
quotation stands a new line, `COPY.TRACE.reasonFrame`: "The sentence above is
copied from the recorded answer without a word changed. Anything inside [square
brackets] was added by this page to say what one of its own terms means." That
line prints only where a bracket was actually added.

**The brackets themselves.** `QUOTED_JARGON` in `app/src/rescueworld/gloss.ts`
holds 67 terms and the plain words for each. `plainQuoted` inserts the plain
words in square brackets after the first use of each term in a quotation,
longest term first so "JMA intensity" is explained whole before "JMA" can claim
its first three letters. `main.ts` draws each bracketed run in its own span, in
the signal colour, so a reader sees at a glance which words are ours. Checked
against all 178 recorded answers: nothing is deleted, no bracket nests inside
another, and the text with the brackets removed is byte-identical to the record.

The terms the judge named as stoppers, and what the brackets now say:

| the machine's word | the plain words beside it |
|---|---|
| action contract | the written rules for what this decision may use |
| internal payload | the exact content of the internal alert |
| posture | the readiness level |
| telemetry gap | a reading that never arrived |
| liaison pairs | officers sent in twos to carry messages into a town hall |
| modeled verification-priority slots | invented places on the list of which towns to check first |
| eligible resources | the units this decision was allowed to use |
| GSDF / GSF | Japan's army |
| MSDF | Japan's navy |
| SDF | Japan's self-defence forces |
| MLIT | Japan's ministry for roads and transport |
| JMA | Japan's weather agency |
| JMA intensity | Japan's shaking scale, which runs from 0 to 7 |
| ERT | an emergency rescue team |

The full table is in `gloss.ts`. The audit runs the same pass over the same
table, so the listing now judges the quotation a viewer reads rather than the
record's bare sentence.

### The page's own voice

**The opening scenario said one desk and then two desks.** It read "A desk with
two rapid-assessment teams must decide where they go" and, one sentence later,
"Two desks read the same reports and follow different rules". The judge could
not tell how many desks there were, which is the whole premise. It now reads:
"Two desks read those same eight reports. Each desk has two rapid-assessment
teams and has to decide where to send them. The two desks follow different
rules, and you watch both of them work."

**The lichen argued against itself.** The paragraph introduced a lichen as two
partners living joined and then said the two partners are kept apart. Joined
without mixing is the actual point, so it is now the explicit point: "A lichen
works the same way. Two partners live joined together for good and neither one
turns into the other."

**Three words carried more confusion than their frequency suggested.** "Grade"
is now "the colours on screen". "Building tool" is now "a tool for the people
making this page". "Seeks through the run" is now "drags the playback to any
point", and the mode chip "free run" is now "you set the speed".

**Every number in an assembled label is anchored.** A plan line read "Kashima
Town 1, Kōsa Town 1 — First town to send someone to check, Second town to send
someone to check", and the judge could not tell whether the 1s were counts,
ranks or positions on a list. The line is now two lines, the things first and
the counts pointing back at them: "First town to send someone to check, Second
town to send someone to check" over "1 of them went to Kashima Town, 1 to Kōsa
Town". Nine label strings change shape; no number and no name changes.

**Two raw file paths were shown to viewers who cannot open them.** "this page
follows an honesty rule written in docs/rescueworld/SPEC.md, section 6" is now
"this page marks every invented thing as invented, wherever it draws one", and
"docs/rescueworld/SPEC.md tells the scenario in plain words" is now "the two
agencies measure the same shaking on two different scales", which is what that
source line was actually pointing at.

**The rest of the judge's fuzzy list**, in one line each:

- "This file names 88 road closures and limits" now says what the limits are on:
  how heavy a vehicle could be or how fast it could go.
- The shelter card now says one place can carry both labels, which is why the two
  counts add up past the number of places.
- "Landslides and deposits that were mapped" is now "Places where a hillside gave
  way, and where the earth stopped".
- "because that is the shape the record has" is now "The record was written in
  rounds, so the playback follows them."
- "The reports arrive in bursts hours apart, so each recorded event gets the same
  share of the playback" now says why: at real speed most of it would be empty
  waiting.
- "not one of them is one of the modelled buildings" now introduces the buildings
  before pointing at them.
- "each line carrying the hash of the line before it" is now a fingerprint, with
  what it proves.
- The weather-service sentence no longer splits its verb from its object across a
  timestamp.
- "which is the answer's own wording" is now "It made that name up; no such unit
  was on its list."
- "bore on its plan" is now "meant for its plan".
- "an unknown that is not among this decision's own" is now "an unknown of its
  own, which this decision had not asked for".
- "asked for less than one of the units it named" is now "asked for part of a
  single thing, and nothing on the list can be sent in parts".
- The page used "weighed" and "cited" as two distinct acts and never said how
  they differ. Both are now spelled out wherever either is named: listing a
  report it had read, and saying what a report meant for its plan.
- "did not come back in the shape this decision asked for" is now "came back in a
  form the check could not read, so no rule could be tested against it".
- "whose fingerprint the run's own certificate records" is now three short
  sentences naming the two files and what the fingerprint proves.
- "wanted by" is now "asked for by".
- "too narrow to draw it clear of the one shown" now says the panel overlaps and
  is left out, and where to read it in full.
- "no highlight file of its own" now says what that companion file holds.
- "the world opens" is now "the run begins"; "team found" is now "what the team
  found"; "the desk closes its receipts" is now "the desk writes down what its
  teams found".
- "Tiles of ground height in this cut" is now "Across the stretch of ground on
  screen, a national survey recorded heights".
- "reading at 412 recorded seconds" is now "at second 412 of the recording".
- "click its instrument" is now "Click the panel standing over it".
- "tidied but never made more exact" now says what was tidied and what was left.
- "Official passable-road snapshot" is now "One official record of which roads
  could be driven, as they stood at one recorded minute."
- "an observed public list of standing designations" is now "a public list of
  places named in advance, which stays in force whatever happens".
- "this layer's delivered file could not be read" is now "the map file behind it
  could not be read".
- Both run-pairing notes now say what a fingerprint is before relying on it.
- "graphics processors" is now "graphics cards", and the console now says why a
  decision would run on them: a language model runs on that hardware.
- "two high-risk towns have no received intensity" is now "two towns most likely
  to be badly hit have sent no shaking reading at all".
- "the known first-night response" is now "the crews known to be available that
  first night".
- "The last recorded forty-configuration run" is now "The last recorded run
  covered forty setups".
- "Do not substitute later municipal death totals", which read as an order aimed
  at the viewer, is now a statement about the record.
- "recorded isolated by slope failure" is now "A hillside came down and cut off a
  district called Memaru, in Yamato Town, from every road."
- "Both towns are still listed as not received" is now "still shown with no
  shaking reading received".
- "They stand for attention, and no real team is named" is now "Each one marks a
  town as somewhere to look at first, and names no real team to go and look."

### The one gate line that moved with the copy

`verify-rescueworld-run-console.mjs:59` asserted `/graphics processors/` on the
console heading. What that gate proves is that the heading names the hardware a
prepared run would go to, so nobody reads the panel as something that runs in the
browser. It now accepts `/graphics (processors|cards)/`, and the reason is
written above the line.

### Gates

`npm --prefix app run build` passes. `node app/scripts/copy-lint.mjs` is clean.
`node app/scripts/audit-plain-text.mjs` reports 0 failing strings, 196 explained
passes and 25 strings left out with a reason. All nine
`app/scripts/verify-rescueworld-*.mjs` gates pass with `CHROME` unset. The full
incident, the two-desk exercise and the short demonstration each boot twice and
replay to the same state and the same words at four points of the run.

## Amendment 19 — 2026-08-24, the last thirty-seven strings a cold reader stumbled on

A second judge with no knowledge of this project read all 1,228 strings the
plain-text audit lists and marked 1,191 clear, 34 fuzzy and 3 unreadable. They
also answered the question the wave was for: yes, a high-school class can follow
the page end to end without an adult translating, with three named exceptions.
This amendment closes those 37 and the three exceptions.

The judge's own words are the test of each repair. A repair counts only where
the misreading they wrote down is no longer available.

### The three that stopped the reader dead

**A bare comparison fragment, "must be at least".** The judge could not produce
even a shape for it, and they were right: it is not a sentence, and no viewer
meets it. `trace.ts` compared the checker's own failure text against those words
to tell a floor breach ("quantity 0 must be at least 1") from a ceiling breach
("quantities sum to 24, exceeding maximum 22"). Written as a quoted string it was
collected as viewer copy and put in front of a judge. It is now the pattern
`QUANTITY_FLOOR`, with the two record shapes it tells apart written above it.
Nothing on screen changes, and the fragment is gone from the listing.

**A machine quote whose own arithmetic contradicts itself.** One recorded answer
wrote that three fire brigades went to Aeon Mall and one to Yatsushiro, and then
called a fourth brigade the one that went to Yatsushiro. Counting crews gives
four or five and the reader cannot tell which. The quote is evidence and not one
word of it changes. What changed is the frame under it. `COPY.TRACE.reasonFrame`
used to print only where a square bracket had been added; it now prints under
every quotation and says: "The sentence above is copied from the recorded answer
without a word changed, mistakes included. The plan listed above it is what that
answer actually asked for, naming each thing it chose and where each one goes.
Where the two disagree, the plan is what the record holds." The plan it points at
is already there, directly above the quotation, one line per unit and place,
read out of the record: a response team from the army's 8th Division and fire
brigades from Fukuoka and Saga to Aeon Mall, a fire brigade from Ōita and one
from Miyazaki to the Yatsushiro mill. The sentence about the brackets is now a
second line, `COPY.TRACE.reasonBrackets`, still printed only where a bracket
exists.

**A raw identifier with its hyphens dropped.** One answer wrote "unknown people
alive by time", which does not parse as English, while the answer two quotations
later wrote `unknown-people-alive-by-time` and got its plain words. The matcher
keyed on the hyphenated spelling only. `QUOTED_JARGON` now holds the spaced
spelling as well, and "unknown field condition" beside it for the same reason.
Both now read the same wherever they appear.

### Terms glossed in most quotations and bare in one or two

`QUOTED_JARGON` grew from 67 terms to 83. Every term below was already plain in
its sibling quotations and bare in the ones the judge named.

| the machine's word | the plain words beside it |
|---|---|
| reconstructed automatic trigger | the alert this exercise worked out the warning system must have raised |
| observed real units | the crews the record shows were really sent |
| incident dynamics | how the emergency was unfolding |
| incident evolution | how the emergency would go on unfolding |
| ongoing dynamics | how the situation keeps changing |
| maritime trigger | whatever prompted the request to Japan's navy |
| coordination status | how well the organisations there were working together |
| overlapping intensity | the same shaking level as another town |
| quay deformation | the ground behind a dock wall moving |
| limited impact | little damage reported there |
| functioning utilities | working water and power |
| unknown field condition | nobody knows what shape the site was in |
| unknown people alive by time | nobody knows who was still alive when the choice was made |
| personnel interchangeability | workers being able to switch from one job to another |
| decision context | the picture this decision was made from |
| instruction posture | ordering other prefectures to send fire crews instead of asking |

**One of those replaces a gloss that was wrong.** "Instruction posture" used to
fall through to the shorter entry "posture", which says "the readiness level".
That contradicts the phrase. An instruction posture is a way of summoning crews,
not a level of readiness, and the insertion pushed the reader toward the wrong
meaning. It now reads "instruction posture [ordering other prefectures to send
fire crews instead of asking]", the same words `RESOURCE_LABEL` already uses for
the same thing.

Checked again across all 178 recorded answers after the change: 174 carry at
least one bracket, no bracket nests inside another, and every quotation with its
brackets stripped is byte-identical to the record.

### The page's own voice

**"this place" pointed at nothing.** It was the fallback name for a recorded
event that names no site. It now reads "a place this exercise does not name",
which is what it is, and reads inside the sentences that take it: "40 simulated
people waiting at a place this exercise does not name".

**"Illustrative route"** is now **"Example route, not a recorded one"**. The old
word was above the level the rest of the page holds and left the drawn line's
status open — taken, or drawn for show.

**The descriptive-only badge now carries its meaning beside it.** The badge's own
words are fixed by the story template and compared character for character in
`main.ts`, so they do not change. Under it, wherever it is drawn, stands a new
line: "That badge means the numbers beside it sit outside the result this
experiment wrote down before it ran. They are shown to say what happened, and
nothing is concluded from them." It has its own class, `descwhy`, because
`badgescope` marks the note about what a grade covers and
`verify-rescueworld-space-data.mjs:94` counts one of those per graded moment.

**"A recorded outcome model" is now spelled out.** The closing sentence read
"by running the same moments through a recorded outcome model", and a reader
could not tell whether that meant a saved simulation, a formula or a second
model. It now reads: "The same moments would be run again against a model of what
happens after each choice, built out of the recorded events themselves."

**A garden-path comma.** "It wrote down what the one report it had meant for its
plan" reads more easily as a report intended for the plan, which is wrong. It is
now "It had one report, and it wrote down what that report meant for its plan."

**The claim-version chip is anchored.** "claim version {id}" stood as a bare
compound. It now reads "version {id} of that claim", pointing back at the claim
named in the line directly above it.

**The occupancy layer switch reads like its twin.** The map-layer line held three
technical nouns — "occupancy", "aggregate reports", "per-shelter data". The same
layer's switch in the copy deck had already been rewritten. Both now read: "how
full the shelters are · worked out from the region's published totals, because
nobody published a count for each shelter".

**The two verification-priority slots say which way the checking goes.** "First
town to send someone to check" reads as though the town does the sending. Both
labels now read "First town for someone to go and check" and "Second town for
someone to go and check", in `RESOURCE_LABEL` and in `SUMMARY_LABEL`, so the
assembled line on the real-decision page moves with them.

### The opening card said the same thing three times

Randy's screenshot caught it and Codex named the fix. The card that rises in the
middle of the screen as the run opens carried five blocks: the label "The
earthquake", the magnitude sentence, the origin clock, the story of act one, and
a sentence about the ribbon. The story of act one was already on the story panel
at the right of the same frame, word for word. The sentence about the ribbon sat
directly under the ribbon it describes, which carries its own label. A viewer
arriving at the page met the same words three times over, as a wall of copy.

The opening card now carries three short lines and the begin control, and
nothing else:

> THE EARTHQUAKE
> A magnitude 7.1 earthquake struck Kumamoto.
> 16:27 Japan time.

`showActCard` sets the story and the note to empty strings for the opening only,
and hides both paragraphs so they leave no gap. The other two lines were
shortened in the copy deck, for the opening state only. The title used to read
"A magnitude 7.1 earthquake struck Kumamoto Prefecture in Japan, and Japan's
national weather service recorded the shaking at 7 on its own intensity scale,
which runs from 0 to 7", and the clock line used to read "It began at 16:27
Japan time, and everything that follows is counted from that minute." Both are
already said before the card rises: the brief the viewer has just read opens "At
16:27 on 28 July 2026 a magnitude 7.1 earthquake struck Kumamoto Prefecture in
Japan", and the debrief still states the weather agency's own intensity reading
in full. No recorded number leaves the page. `INCIDENT.opening.timeline`, the
paragraph about the ribbon, is deleted rather than left unread.

Later act cards keep their story exactly as they were, because nothing else on
the frame carries it at the moment they rise. Checked on a real load at 1600 by
900: the opening reads as one calm card of three lines, act two, act three and
act four each still carry their own sentence, and no sentence appears twice on
any frame.

### Four record sentences that needed a display gloss

The recording is never edited. These four are glossed by identifier, and the
gloss is written at every identifier that carries the same sentence, so a reader
never meets the glossed form once and the bare form again.

- **"Municipality-level bulletin."** — a bare compound with no verb, and the
  reader could not tell whether the bulletin came from towns, was about towns, or
  broke its numbers down by town. Now: "This reading comes from the bulletin that
  gives a number for each town, not from an alert covering a whole region." The
  record puts it on six town readings; all six carry it.
- **"A contemporaneous incident report, not a complete casualty count."** — the
  hard word carried the whole caveat. Now: "This was reported while it was
  happening. It is not a full count of the dead and hurt." Two reports carry it.
- **"Kagoshima and Okayama battalions were working Yatsushiro, while Fukuoka and
  Saga battalions were working Kashima."** — nothing in the line separates fire
  crews from army units. Now: "Fire brigades sent from Kagoshima and Okayama were
  working at Yatsushiro, while fire brigades sent from Fukuoka and Saga were
  working at Kashima", using the same words `RESOURCE_LABEL` uses.
- **"Four people are recovered at Kashima and ten remain unaccounted for."** — in
  disaster reporting "recovered" usually means bodies, and here it does not. The
  minutes of the second prefectural meeting, transcribed at
  `docs/rescueworld/REAL-RESPONSE-RECONSTRUCTION.md` line 914, record all four as
  alive: three moderately injured and one slightly. The headline now reads "Four
  people are brought out alive at Kashima and ten are still missing." No number
  changes.

### The four the judge marked fuzzy that this wave does not close

Four of the 34 are not fixable by a gloss, and none of them is a term. Each is a
recorded answer whose own sentence is ambiguous or wrong, and the quotation is
evidence.

- S0906 reads "the assumption of worst-case readiness and proximity", which can
  mean the worst about both, or the worst about readiness and then the nearest.
- S0918 lists "eight eligible fire battalions" where the eight were command
  teams, brigades and a helicopter crew.
- S1088 miscounts its own crews, which the new frame under every quotation now
  answers by pointing at the plan.
- S1327 names four things for three priorities.

The frame under every quotation is what a reader has instead: the words are the
software's, the plan above them is the record's, and where the two disagree the
plan is what the record holds.

### The one gate line that moved with the copy

`verify-rescueworld-result-story.mjs` asserted
`/next step.*score reach.*recorded outcome model/` on the closing sentence. What
that gate proves is that the page ends by naming the next experiment: score
reach, by replaying the moments against a model of what each choice leads to.
The page now spells that model out instead of naming it, so the gate matches
`/next step.*score reach.*model of what happens after each choice/` and proves
the same three things. The reason is written above the line.

### Gates

`npm --prefix app run build` passes. `node app/scripts/copy-lint.mjs` is clean.
`node app/scripts/audit-plain-text.mjs` reports 1,227 strings a viewer can see,
0 failing strings, 196 explained passes and 25 strings left out with a reason —
14 class names and 11 checker codes, the same two reasons and the same rows as
before this wave. All nine
`app/scripts/verify-rescueworld-*.mjs` gates pass with `CHROME` unset. The full
incident, the two-desk exercise and the short demonstration each boot twice and
replay to the same state and the same words at four points of the run, and the
probe was run three times over with the same hashes each time.
