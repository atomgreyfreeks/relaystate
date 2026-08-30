# Rescue World — build specification

Status: draft 7, written 2026-08-23 by claude. Draft 5 expanded frontend
item 6 to the process owner’s full-game-control directive from board message #464: a
free-flying camera, interactive panels answering the selection, and a
single-world mode to inhabit. Draft 6 made the single-desk world the
default view, confined the side-by-side comparison screen to internal use
per the process owner’s ruling in board messages #475 and #476, and added the
building-attribution boundary from board message #482. Draft 7 folds in
the process owner’s session directive of 2026-08-23: this is a labeled simulation, so
simulated damage is shown fully and vividly — the boundary is attribution,
not restraint. Draft 2 folded in the process owner’s
binding aesthetic directive (board message #406): the Halo Forge
post-processing chain is used as code, the Halo Forge component generator
supplies the 3D instruments standing on the terrain, and Halo Forge's design
language — already approved by Randy — is the visual authority. Draft 3
folds in codex's three review amendments (board message #410): the
real-versus-synthetic boundary is stated in section 2, the real observed
layers gate the first end-to-end slice, and the event-type list and geometry
rules in section 3 are made exact. It becomes binding when codex countersigns
on the agent board and Randy has read it. No build work starts on an unsigned
section.

## The scenario, in plain words

On July 28, 2026 an earthquake struck Kumamoto Prefecture in Japan. The Japan
Meteorological Agency's event record lists it at magnitude 7.1 on their scale;
the United States Geological Survey lists the same event at moment magnitude
6.8 on a different scale, and both numbers are current. Sixteen days later the
Japanese company SpaceData announced a web service that merges social-media
reports and satellite damage estimates onto one 3D map, so a government office
can see a disaster within an hour and decide what to do.

We are building the room where that decision gets made — as a piece of
software anyone can watch. A 3D terrain shows the damaged area. AI agents read
the incoming reports, argue about which ones to trust, and send scarce rescue
resources. A person can play, pause, and step through the whole operation like
a game replay, click any decision, and see the exact evidence that authorized
it. Three things run together on screen and each must stay visible: the
disaster simulation (the place, the people, the damage), the AI agent fleet
(the readers and the desk that decides), and the growth intelligence (the
evidence table grown like a lichen — two partners, claims on one side and
sources on the other, kept separate so neither can corrupt the other).

The whole piece is a replay of recorded computation. Nothing on screen is
generated live, and the same seed always produces the same run, byte for byte.

"Rescue World" is this piece's working name: one directory of backend truth
(`product/disaster-replay/`) plus one rendering instrument
(`app/src/rescueworld/`). An instrument, in this repository, is a standalone
vanilla three.js page that renders purely from a baked event log and never
runs agent logic in its render loop; `app/src/mapworld/` is an existing
example.

## 1. What already exists and gets reused

A full survey of this machine ran on 2026-08-23. Its findings bind this spec:

- Skeleton: `app/src/mapworld/main.ts` is a working two-arm rescue replay
  over a territory: tick loop with a 100 ms delta clamp, play, pause and
  scrub with deterministic rewind, residue fields that never clear,
  split-viewport dual rendering, and a `window.__HERO` verification handle
  whose `residueHash` value proves the world remembers. Rescue World's
  instrument is a clone of this file, not a new architecture.
- Terrain: `app/src/scenes/the-strata/index.tsx` already contains a
  holographic contour terrain shader reading a packed data texture — red is
  elevation, green is passability, blue is population density. That channel
  layout is exactly the disaster schema: green becomes blocked roads, blue
  becomes affected population.
- Look: the Halo Forge engine (`liveref/media/components/halo-forge.html`)
  carries the process owner’s approved post-processing chain — bloom, chromatic split,
  scanlines, film grain, vignette, seven named looks — in about 250 lines of
  dependency-free WebGL (`initPost`, `resizePost`, `postCompose`, the grade
  shader). Per the process owner’s directive, that chain is ported into the instrument
  as code and used as the final pass over every frame, so Rescue World is
  graded by the same program that grades the globe.
- Components: Halo Forge also contains a component generation system — the
  instrument stations, dials, panels, and labels it builds procedurally and
  drives through `window.setDial` and `window.HALO.library`, already adapted
  once in `board/public/dome.html` where stations are generated from real
  board data. Per the process owner’s directive, Rescue World reuses that generator: its
  components stand horizontally on the terrain at world sites — villages,
  shelters, rescue units — and their dials are driven by the event log.
- Design language: Halo Forge's design language, as it appears on the process owner’s
  ideometry reference canvas, is the visual authority — Randy has already
  approved it, so nothing visual is invented that it does not cover. The
  colour-usage laws in `app/src/design/system.ts` (one signal thing per
  frame; burn colour only for irreversible loss) continue to apply as usage
  rules within that language.
- Schemas: `product/evidence-desk/schemas/event-input.schema.json` (source
  observations) and `decision-envelope.schema.json` (policy and action
  snapshots) are reused as they stand. `audit-export.schema.json` is not
  reused — its outcome fields are specific to the boat experiment.
- Orchestration semantics: the plan-node, tool-receipt, scheduler,
  confirmation-scope, and terminal-invariant semantics from
  `experiments/general-orchestration-transfer/src/general_eccg/turn_graph.py`
  are reused. Its hashing helper is reused only after sets are banned or
  deterministically sorted.

## 2. The demonstration slice (build this first, whole)

One incident. Six to ten real, timestamped source observations. Three typed
agent roles (reader, desk, dispatcher). One scarce-resource decision. One
simulated effect on the world. Three metrics. Everything else in this spec
grows outward from this slice only after it runs end to end.

The boundary between real and synthetic is fixed here. The incident itself,
the hazard geometry, and the road restrictions are real public observations:
as of 2026-08-23 the acquired set holds 35 landslide polygons from the
Geospatial Information Authority of Japan and the Ministry of Land,
Infrastructure, Transport and Tourism's passable-road snapshot of
2026-07-29 12:00, carrying 29 real road restrictions. The rescue reports,
people counts, dispatches, and world effects are synthetic exercise data,
labeled synthetic everywhere they appear. The slice counts as done only when
a baked run over the real observed layers is on screen; synthetic terrain is
allowed only for the isolated skeleton stage, and the PLATEAU building
models may arrive later.

## 3. The shared contract between backend and renderer

The backend (codex's lane) produces four files per run under
`product/disaster-replay/runs/<scenario>/<seed>/`:

- `scenario.json` — the immutable scenario manifest: terrain reference,
  entities, agent roster, policy arm definitions, seed.
- `timeline.jsonl` — one append-only, ordered event log; each line carries a
  sequence number, simulation time, event type, actor, an `arm` field
  (baseline or treatment), entity ids, source and evidence references, a
  hash of the previous line (a hash chain), and a small payload.
- `final-state.json` — the derived end state, for cross-checking.
- `certificate.json` — hashes over the inputs, the timeline, and the final
  state, so a re-run can be compared byte for byte.

Event types: a world-initialized opening event plus eight domain types. The
normative names, field shapes, and required fields live in
`product/disaster-replay/schemas/replay-event.schema.json`, and the
implemented names are the contract: WORLD_INITIALIZED, SOURCE_INGESTED,
GRAPH_TRANSITION, CLAIM_STATE_CHANGED, DECISION_PROPOSED, POLICY_EVALUATED,
RESOURCE_DISPATCHED, OUTCOME_OBSERVED, METRIC_UPDATED. The `arm` field takes
the value PLAIN_GRAPH for the baseline side, EVIDENCE_GRAPH for the
treatment side, or the word "shared" in capitals for an event that applies
to both sides. Time is `sim_time_s` and location is a GeoJSON-style
`geometry` object. Where this document's prose and the schema file disagree,
the schema file wins. Geometry rules: dispatch events, outcome events, and
any event that changes the world always carry coordinates — the renderer
sites permanent residue from them. An observation that ingests a whole
source layer carries geometry only when it locates a specific feature,
because a layer-wide ingest has no single truthful coordinate.

A receipt is the saved record of one language-model call: its exact input,
its exact output, and both their hashes. The remote GPUs produce only typed
proposal and review receipts. All admission, scheduling, world effects,
scoring, and replay run in local deterministic code. Exact replay means
replaying recorded receipts — never rerunning inference.

A bake script under `app/scripts/` copies one run into
`app/public/rescueworld-log.json`. The instrument fetches that baked file and
nothing else. Baseline and treatment arms live in the single log and render
side by side, exactly as mapworld does today.

## 4. The frontend plan (claude's lane)

New instrument: `app/rescueworld.html` plus `app/src/rescueworld/main.ts`,
cloned from mapworld. In build order:

1. Skeleton replaying a hand-written twenty-event log: loop, residue,
   `window.__HERO.seek()`, frame-cost meter.
2. Terrain: the strata shader over a synthetic heightfield, clearly labeled
   synthetic on screen. This synthetic stage is allowed only for the
   isolated skeleton; the slice gate in section 2 requires the real layers.
3. The grade: port the Halo Forge post chain as code (`initPost`,
   `resizePost`, `postCompose`, the grade shader, the seven looks) and run
   it as the final pass; judge by flicking between two looks on the same
   frame.
4. Swap in the first real baked run from the backend, including the real
   landslide polygons and road restrictions — this on-screen run is the
   section 2 slice gate.
5. Halo Forge components on the ground: port the component generator and the
   dome adapter's station pattern, stand the generated instruments
   horizontally on the terrain at villages, shelters, and rescue units, and
   drive their dials from the event log with the dome's eased pulses.
6. Full game control of the world, per the process owner’s directive in board message
   #464: complete camera and heads-up-display control of the terrain, just
   like a video game — a living virtual environment, never playback-only.
   The camera flies free: orbit, pan, zoom, keyboard flight with the W, A, S
   and D keys, edge scroll, and a clamp so it never passes through the
   terrain. Clicking any unit, village, or road closure selects it, and the
   heads-up panels are interactive — the evidence display answers the
   current selection. The full-window single-desk world is the default view
   at load, with a key to switch desks, so a person inhabits the environment
   from the first frame. The side-by-side comparison screen is an internal
   instrument for building and verification only; Randy ruled in board
   messages #475 and #476 that nothing about it is used in the final
   output. Time is presented the way a real-time-strategy game presents it,
   per the process owner’s session directive of 2026-08-23: a round counter as the
   primary time display (the exercise is round-based underneath), a
   step-one-round key and a step-one-event key, play at a few named speeds,
   and a pause that never hides the world — no video-style scrub bar on the
   face. The alert feed narrates what each round brought. Deterministic
   rewind and scrubbing remain as internal capabilities for verification
   and film capture only. Underneath everything the world remains a
   deterministic replay of the recorded timeline: freedom of viewpoint and
   interrogation, not freedom of history — and because a new method can be
   recorded as a new run, the same turn-stepped world becomes the stage for
   simulating future strategies.
7. The communication display: agent-graph activity, claim verdicts, and the
   evidence behind the selected decision, drawn as screen-anchored chrome in
   the existing house style (hairline frame, corner brackets, telemetry at
   the frame edge — never charts as the subject).
8. Only after all of that: the PLATEAU building models and the optional
   shield dome over the terrain. (The real hazard and road layers arrive
   earlier, at step 4, per the slice gate.)

Performance budget: 8 ms of simulation-and-render work per frame at
device-pixel ratio 2, per the budget constant in `app/src/design/system.ts`.
Every stage is verified in a real browser — painted pixels sampled, two
frames compared over time, interactions drilled, milliseconds read off the
meter — before it counts as done, by the agent who did not build it.

## 5. The data plan

Stage 1 ships with synthetic terrain and a synthetic report stream, both
labeled as synthetic in the on-screen copy and in the scenario manifest.
Stage 2 replaces terrain with real elevation data baked offline into a
committed asset — the runtime never fetches remote data. The inventory of
usable public sources (Japan's national elevation models, the Project
PLATEAU open 3D city models, the Japan Meteorological Agency event records,
satellite damage imagery, population grids, and the honest answer on report
streams) lives in `docs/research/DISASTER-DATA-SOURCES-2026-08-23.md`; codex
verifies that survey and owns acquisition and normalization. Codex has
already located an official open 3D city asset for Uki City, inside Kumamoto
Prefecture, that includes shelter locations and emergency-route layers — the
leading candidate for the real scenario. Every dataset's license is recorded
before its first byte enters the repository.

## 6. What we will not claim

- The general orchestration graph is not presented as validated agent
  behavior; the external review handoff records its V5 through V7 holdout
  results as no-go. It runs here as infrastructure, and the claims we make
  are about the evidence discipline, which is what our experiments
  certified.
- No claim of superiority over real human emergency operations. The measured
  comparisons are against AI baselines in controlled simulation.
- Synthetic inputs are always labeled synthetic, on screen and in the files.
- Simulated damage is shown fully and vividly — fire, flooding, collapse,
  burned ground — because the whole world is labeled a simulation and the
  demonstration must be as effective as possible (the process owner’s directive,
  2026-08-23). The boundary is attribution, not restraint: the simulation
  may damage anything on screen, including the real building models, but
  no visual ever claims to show the real recorded condition of a specific
  real building in the real event, and the layers built from real
  observations (the landslide zones, the road closures) stay visually
  distinguishable from simulated effects. The exercise's rescue sites sit
  farther north than the epicentral building cut, and the display never
  implies those particular buildings were the real rescue sites (codex's
  attribution point, board message #482).
- Metrics for any new headline claim are registered in writing before the
  run that produces them, as every experiment in this repository has done.

## 7. Lanes, reservations, and verification

- codex: `product/disaster-replay/**` (held), the backend of section 3, data
  acquisition and normalization of section 5.
- claude: `app/src/rescueworld/**`, `app/rescueworld.html`, the bake script,
  and this document.
- Files are claimed through `board/reserve.mjs` before editing. Every
  milestone is verified by the agent who did not build it before it counts.
  The board carries one status line per milestone, and the phone status page
  is updated at each one.

## 8. License

This repository has no license file, and the covenant demands it be safe to
publish. Proposal: the MIT license (a short, permissive open-source license)
for our code, with third-party data governed by each dataset's own recorded
license. Randy decides; nothing blocks on it except the actual publishing
step.

## Signatures

- claude: signed, draft 7, 2026-08-23.
- Randy: the aesthetic directive of section 1 (Halo Forge post chain,
  components, and design language) is his, stated on the board as message
  #406; he reads the full document before the first build commit.
- codex: signed, draft 7, 2026-08-23 (board messages #468 draft 3, #496
  drafts 6 and 7, #503 draft 7 restated; every amendment round was re-signed
  on the board).
