# Glossary

Coined terms that recur across documents in this repository, each with a plain definition
and a concrete example.

**MLIT** — The initials of Japan's Ministry of Land, Infrastructure, Transport and Tourism,
the national department responsible for roads, rivers and public works. The Kumamoto
recording uses the initials in its own field values, so they appear in quoted record text.
Example: the decider string `Kyushu Regional Development Bureau, MLIT` in
`app/public/rescueworld-log.json` names that ministry's regional roads and rivers office,
and `docs/rescueworld/PLAIN-TEXT-METHODS.md` proposes showing it on screen as "the national
government's roads and rivers office for the Kyushu region".

**tombstone** — A small saved record, a few bytes, that a summarizing system writes at the
moment it discards a connection between a conclusion and one of its sources. Example: in
The Bridge experiment (`docs/trust/the-bridge/`), the pyramid that wrote tombstones replayed
them after damage and restored 100 percent of its broken evidence trails; the pyramid that
recorded nothing restored nothing.

**coverage ratio** — The share of a territory that a fleet of agents can actually read in
one cycle, given its reading budget. Example: in the fleet experiments
(`docs/two-shapes/fleet-shapes/`), reinforcement-style attention allocation helped at a 75
percent coverage ratio and collapsed to 12 of 24 towns at a 50 percent coverage ratio.

**walkable** — Describes a conclusion that can be traced, link by surviving link, down to at
least one raw observation. A claim that is still displayed but has no surviving path to
evidence is unwalkable, and the people governed by it are counted as living under an
unauditable claim. Example: in The Bridge, 82 percent of claims stayed walkable in the
spread-out wiring after headline damage, against 60 percent in the strongest-support wiring.

**BUILD.md** — The scoreboard and journal file at the repository root. It holds the table
of experiments and their readiness, the open questions for the competition organizers, and
one dated journal entry per work cycle. Example: the 2026-08-24 entry records the
presentable-package cycle, including the false-alert parser defect that cross-audit caught
after a screenshot review missed it.

**GUIDE.html** — The existing single-experiment plain-language guide page at
`app/public/guide/GUIDE.html`, served at `/guide/GUIDE.html`. Example: its five canvas
figures are the aesthetic reference for every later guide page.

**GUIDE_DATA** — The JavaScript constant defined by `app/public/guide/guide-data.js`. It
holds settlement positions, populations, and per-tick run data extracted from the logged
experiment runs. Example: the twin-worlds figure in GUIDE.html reads
`GUIDE_DATA.world.pos` to place its 64 settlement dots.

**WHAT-HAPPENED.md** — The plain-language explanation file inside each experiment folder
under `docs/`, written for a reader with no project context. Example:
`docs/trust/the-boat/WHAT-HAPPENED.md` explains the storm-rescue experiment in ordinary
words.

**RESULTS.md** — The per-experiment results file recording every pre-registered prediction
with an honest verdict. Example: `docs/two-shapes/fleet-shapes/v2/RESULTS.md` records
which fleet organizations read which towns across five rounds.

**BUILD.md** — The build journal at the repository root: a scoreboard of passing criteria
and one dated entry per work cycle. Example: the 2026-08-05 entry records the Trust
Series verification.

**CONTRACT.md** — A build contract file that every builder agent reads in full before
writing code; it fixes file interfaces, design rules, and pass-or-fail quality gates.
Example: `docs/growth-guide/CONTRACT.md` governs the figures of the comprehensive growth
guide.

**agent board** — The local message board in `board/` where the two coding agents
(Claude Code and Codex) and the process owner exchange messages, served as a dashboard at
`http://localhost:4747`. Example: Codex posts
`node board/say.mjs codex --kind status "tests passing"` and the line appears on the
dashboard in under a second.

**evidence binding** — The attachment of exact source identifiers and a permitted
action to an agent's claim, verified by ordinary code before another agent acts on
it; a claim whose identifier is missing, mismatched, or unsupported is a binding
failure. Example: in `experiments/evidence-compiler-isolation`, rebuilding bindings
in code recovered the damaged-handoff score from 48.63 to 96.52 out of 100.

**evidence desk** — The product concept built from evidence binding: a checkpoint
program between a data fleet and a human coordinator that holds every claim as
supported, rejected, or unresolved with its exact source, and blocks aid actions
that lack a supported binding. Example: the coordinator's screen described in
`docs/gpu/EVIDENCE-BINDING-FOR-DISASTER-FLEETS.md` section 3 holds a queued aid
order because its need figure is four rounds old.

**instrument** — A standalone vanilla three.js page in `app/` that renders purely
from a baked event log and never runs agent logic in its render loop. Example:
`app/src/mapworld/main.ts` replays `/mapworld-log.json` tick for tick, and
scrubbing backwards rebuilds the world from tick zero so the replay stays
deterministic.

**receipt** — The saved record of one language-model call: its exact input, its
exact output, and hashes of both, so a run can be replayed by reading the record
instead of calling the model again. Example: in the Rescue World contract
(`docs/rescueworld/SPEC.md` section 3), the remote GPUs produce only proposal and
review receipts, and replay means reading them back, never rerunning inference.

**Rescue World** — The 3D disaster-replay piece specified in
`docs/rescueworld/SPEC.md`: a backend that records an AI rescue operation as one
hash-chained timeline, plus an instrument that lets a person step through the
operation on holographic terrain like a game replay. Example: clicking a dispatch
decision in Rescue World shows the exact claims and sources that authorized it.

**upper-case document names** — Several repository documents carry upper-case
file names that read as abbreviations: SPEC is short for specification
(docs/rescueworld/SPEC.md and docs/rescueworld/SPEC-2.md), the
REAL-RESPONSE-RECONSTRUCTION file reconstructs the real July 2026 Kumamoto
response (docs/rescueworld/REAL-RESPONSE-RECONSTRUCTION.md), and the
DEATH-STRANDING-REFERENCE file records the visual-language study of the video
game Death Stranding (docs/rescueworld/DEATH-STRANDING-REFERENCE.md). Example:
the Rescue World build contract lives at docs/rescueworld/SPEC-2.md.

**SPEC** — Short for specification in this repository's file names. Example:
the Rescue World build contract is docs/rescueworld/SPEC-2.md.

**DEATH-STRANDING-REFERENCE** — The file name of the visual-language study of
the video game Death Stranding. Example: docs/rescueworld/DEATH-STRANDING-REFERENCE.md
carries the terrain-scan and route-ribbon directives.

**REAL-RESPONSE-RECONSTRUCTION** — The file name of the reconstruction of the
real July 2026 Kumamoto response. Example:
docs/rescueworld/REAL-RESPONSE-RECONSTRUCTION.md lists the sourced decision
slots.

**DEATH** — Appears in this glossary as the first word of the file name
DEATH-STRANDING-REFERENCE.md, named for the video game Death Stranding; see
that entry. Example: docs/rescueworld/DEATH-STRANDING-REFERENCE.md.

**REAL** — Appears in this glossary as the first word of the file name
REAL-RESPONSE-RECONSTRUCTION.md, the reconstruction of the real July 2026
response; see that entry. Example:
docs/rescueworld/REAL-RESPONSE-RECONSTRUCTION.md.

**beat** — One readable moment of a recorded run: a small group of events that
share a place, a clock time and a single thing worth saying about them. Example:
in the sealed seventy-two-hour Kumamoto run, the eighteen aftershocks recorded
between six and seven on the first evening form one beat, and the choice of the
first outside fire package forms another beat on its own; `deriveActs` in
`app/src/rescueworld/acts.ts` cuts that run's 414 events into 161 beats.

**copy deck** — The one file that holds every string of text a viewer can read on
a screen, so that interface builders take words from it and write none of their
own. Example: `docs/rescueworld/theater-copy.md` is the Rescue World copy deck,
and it holds the briefing paragraph, the outcome sentences and the closing lines
that the theater displays.

**scored run** — A recorded run whose events carry graded results, such as how
many simulated people a method reached or how many of its decisions passed every
check the exercise wrote in advance. Example: the frozen experiment in
`experiments/kumamoto-real-response/PRODUCTION-RESULTS.md` is a scored run,
because each of its forty paired decisions carries a validity result and a
constraint result.

**JMA** — Short for the Japan Meteorological Agency, the national agency that
publishes Japan's earthquake bulletins and its shaking-intensity scale. Example:
the sealed Kumamoto run records the earthquake's strongest shaking as `JMA 7`,
meaning 7 on that agency's intensity scale.

**COPY-CONTRACT.md** — The binding rules file at `docs/COPY-CONTRACT.md` for all visible
text in every artifact: complete sentences, one idea per sentence, no project-internal
vocabulary on screen. Example: the rule that bans the word "arms" from any rendered card
comes from this file.

**FINDINGS-STORYTELLING-GOLD-STANDARD.md** — The narrative-structure standard at
`docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md`, written by Codex: a required
storytelling order and a nine-question stranger test for any findings story. Example: the
Rescue World debrief opens on the human problem before any number because this file
requires it.

**STORY-TEMPLATE.md** — The countersigned template at `docs/rescueworld/STORY-TEMPLATE.md`
that turns any recorded simulation run into the same five-part played story and fixes the
grade wording. Example: the badge sentence "passed every prewritten check" is normative in
this file.

**XCOM** — The title of the Firaxis turn-based tactics game series, written in capitals by its
publisher, and short for the fictional Extraterrestrial Combat unit the player commands. Example:
`docs/rescueworld/GAME-UX-RESEARCH.md` studies how the 2012 game XCOM: Enemy Unknown displays a
single shot-hit percentage, and why that display lost its players' trust.

**GAME-UX-RESEARCH.md** — The survey at `docs/rescueworld/GAME-UX-RESEARCH.md` of how games show
who decided what, why, with what confidence, and with what effect, turned into changes to the
Rescue World screen. Example: it takes the attack preview from the game Into the Breach and turns
it into ghost markers drawn on the Kumamoto map before each decision deadline passes.

**SPACE-DATA-STORIES.md** — The user-story spine at `docs/rescueworld/SPACE-DATA-STORIES.md`
for the Space Data presentation build: five stories a stranger must be able to live without
help. Example: story one requires a viewer to understand one agent decision within thirty
seconds of clicking it.

**SHA-256** — A standard one-way fingerprint function, short for Secure Hash Algorithm with a
256-bit output, that turns any file or object into a 64-character string. Any change to the
input changes the string. Example: each configuration of the Kumamoto agent run stores the
SHA-256 of its own `result.json` in `certificate.json`, and
`app/scripts/bake-real-response.mjs` refuses to write anything if the file no longer matches.

**run request** — A small file that the Rescue World run panel writes, naming which of the
frozen configurations should be executed and which frozen protocol they belong to. Writing one
starts nothing by itself. Example: choosing the water-truck decision and all eight tries writes
`product/disaster-replay/run-requests/2026-08-23-slot-09-all-seeds.json`, holding the phase, the
shard selection and the frozen manifest hash.

**operator run** — A run of the Kumamoto agent experiment started from the Rescue World
interface rather than from the preregistered production procedure. It carries real certificates
and real answers, and it has not been through the two-agent audit that
`experiments/kumamoto-real-response/PREREG.md` requires before any number reaches the
exhibition. Example: eight fresh answers to the water-truck decision started by an operator are
an operator run, and none of their counts may change the published result.

**recorded completion** — The replay of a run that already finished, shown so a room can watch
the arrival step without waiting for real work, and labelled as a replay on screen the whole
time it plays. Example: the five-configuration run in
`experiments/kumamoto-real-response/results/smoke-51000-amendment-1/` finished on 23 August 2026
and is the run the panel replays as a recorded completion.

**RUN-LAUNCHER-DESIGN.md** — The design at `docs/rescueworld/RUN-LAUNCHER-DESIGN.md` for the
Rescue World panel that prepares a new agent run, sends it toward the graphics processors and
brings the answers back. Example: it names the five settings a new run may honestly change and
the six that the frozen protocol forbids changing.

**REPO** — The constant in `board/server.mjs` that holds the absolute path of this repository's
root directory, one level above the `board/` directory. Example: `path.relative(REPO, full)` turns a
watched file's absolute path into the repository-relative path shown on the board.

**DATA** — The constant in `app/scripts/verify-impact-view.mjs` that holds the path of the committed impact view data file, `app/public/impact-view-data.json`. Example: the gate reads DATA unless a `--data` path is given.


**HERE** — The constant in the scripts under `app/scripts/` that holds the directory the running script lives in. Example: `resolve(HERE, "bake-impact-view.mjs")` finds the bake script beside the gate.


**ROOT** — The constant in the scripts under `app/scripts/` that holds the absolute path of the repository root. Example: `path.relative(ROOT, analysisFile)` records an analysis path relative to the repository.


**SAMPLE** — The constant in `app/scripts/bake-impact-view.mjs` that holds the path of the fake-backend sample analysis, `app/public/impact-view-sample-analysis.json`. Example: the bake reads SAMPLE when no analysis path is given.


**DYNAMIC-GROWTH-DESIGN.md** — The design at `docs/gpu/DYNAMIC-GROWTH-DESIGN.md` for the follow-up
campaign in which the AI team adds scouts or reviewers during a decision under an explicit budget.
Example: it fixes the three triggers that may add an agent and the order in which they are funded.

**commitment ledger** — A structured table carried forward in an AI team's state with one row
per admitted action: the resource, the place, the need it serves, the report ids that
supported it, the decision that admitted it, and the later decision at which it must be
confirmed or released. Example: in `docs/research/ORCHESTRATION-REDESIGN-MEMO-2026-08-28.md`,
the row "crew A, Nippon Paper Yatsushiro mill, structural search, reports obs-0729-0620 and
obs-0729-1310, admitted at decision 6, confirm by decision 10".

**due cue** — The line, placed first in a coordinator's packet at a later decision, that lists
the commitment-ledger rows whose confirmation is due at that decision. Example: "Due now:
confirm or release crew A at the Yatsushiro mill (admitted at decision 6)".

**read-back** — The step in a handoff where the receiving party restates the carried
commitments in its own words before it may act, so that the record's survival is certified by
the receiver rather than assumed by the sender. Example: the clinical I-PASS handoff bundle
ends with "synthesis by receiver", and the proposed Kumamoto rule refuses a later proposal
whose restatement does not match the ledger row.

**I-PASS** — The name of a clinical shift-handoff bundle (Pediatrics, 2012; outcome trial in
the New England Journal of Medicine, 2014) whose letters stand for illness severity, patient
summary, action list, situation awareness with contingency planning, and synthesis by the
receiver. Example: `docs/research/BOUNDED-PROBING-WORKFLOWS-2026-08-28.md` borrows its
receiver synthesis as the read-back rule for the Kumamoto AI team.

**NASA** — The National Aeronautics and Space Administration, the United States space agency,
used as the publisher's name on its technical handbooks. Example: NASA technical handbook
1002, the Fault Management Handbook (draft 2, April 2012), cited in
`docs/research/BOUNDED-PROBING-WORKFLOWS-2026-08-28.md`.

**MITRE** — The MITRE Corporation, a United States not-for-profit that runs federally funded
research centres and publishes technical reports on cyber defence. Example: its March 2019
report on hypothesis-driven threat hunting, cited in
`docs/research/BOUNDED-PROBING-WORKFLOWS-2026-08-28.md`.

**PASS** — The second part of the handoff bundle name I-PASS (see that entry); it is not a
separate term. Example: "the I-PASS handoff bundle" in the research memos.

**GPU** — A graphics processing unit, the chip that runs the language model. Example: the
Rescue World campaigns run on four Qwen endpoints on one GPU host.

**AI** — Artificial intelligence; on these pages, the language-model agents that act as scouts,
reviewers and coordinators. Example: "the AI team makes eleven decisions" in
`docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html`.

**ISO** — The International Organization for Standardization, whose 9001 standard describes
quality-management processes; the process document borrows its layout (document control,
scope, numbered activities, records). Example: the header of
`docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html`.

**JSON** — JavaScript Object Notation, the plain-text data format the runners write. Example:
`result.json` holds every agent's rows for one decision.

**HTML** — HyperText Markup Language, the format of a web page. Example: every page under
`app/public/` and the process document.

**SVG** — Scalable Vector Graphics, drawings written as text inside a page. Example: the two
process maps in `docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html` are inline drawings.

**ID** — An identifier, the exact machine name of a record such as a report or a resource.
Example: `fdma-battalion-miyazaki` is the resource identifier of the Miyazaki battalion.

**RW** — The prefix of Rescue World document numbers. Example: document number RW-PROC-001 is
the orchestration process description.
