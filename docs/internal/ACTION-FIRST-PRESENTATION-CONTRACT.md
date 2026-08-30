# Rescue World action-first presentation contract

Status: normative product-wide override, 2026-08-26

This contract applies to the live replay, decision tree, decision ledger, act
cards, story panel, map telegraph, walk-through and debrief. It records the process owner’s
product ruling after the method-first decision-tree preview made the central
failure visible:

> Rescue World is a disaster simulation. Its primary story is what the AI
> agents decide to do in the disaster.

This contract extends the narrative principles in
`docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md` and overrides any Rescue World
template that places experiment mechanics ahead of the simulated action.

## The question every primary surface answers

A viewer who pauses on any decision must be able to answer, without opening a
research panel:

1. What is happening?
2. What action did the AI propose?
3. Who or what is being sent or prioritized?
4. How many?
5. Where?
6. Why?
7. What important fact is still unknown?

The product has failed if the viewer can name the orchestration method or pass
count but cannot answer those seven questions.

## Required information order

Every decision surface uses this order:

1. **Situation** — the operational problem, place and deadline.
2. **AI action** — unit or capability, quantity, destination and timing.
3. **Operational reason** — the reports that supported the action.
4. **Unknowns** — the missing facts the action kept unresolved.
5. **Recorded check** — one plain sentence saying whether the action obeyed the
   exercise's prewritten rules, or naming the first rule it missed.
6. **Public record** — what real responders were recorded doing, explicitly
   separated from the simulated proposal.
7. **Experiment evidence** — method identity, seeds, agreement, aggregate
   counts and full checker findings, available only through a secondary
   disclosure.

Method names, graph names, seed numbers, agreement counts and `N of 8` results
never appear above or instead of the AI action. A score is evidence about an
action; it is not the action.

## Action language

Write actions as subject, verb, quantity and destination:

> The AI sends one roads-ministry officer pair to Uki City and one pair to
> Hikawa Town.

> The AI assigns four water trucks to Yatsushiro City and four to Kumamoto
> City.

> The AI keeps one rescue priority at Aeon Mall, one at the Yatsushiro paper
> mill and one on region-wide drinking-water delivery.

Do not lead with:

- “The desk that wrote plain notes.”
- “The evidence-table method.”
- “The corrected graph.”
- “Seven of eight recorded answers passed.”
- “The agents selected the common assignment set.”

Those statements may appear only inside **How this action was tested**, after
the concrete action and its reason are already visible.

Raw resource, place, observation and unknown identifiers never reach the
screen. Every label comes from the sealed scenario's readable dictionaries or
the existing plain-language gloss.

## Surface rules

### Live world and map telegraph

The terrain, destination and route are the primary visual explanation. Before a
deadline, the world may preview proposed destinations. After the deadline, the
chosen recorded AI action becomes the strongest mark and its concise action
sentence remains readable. Method disagreement is a secondary visual mode; it
does not own the default map legend or headline.

A destination receives a mark only where the sealed record supplies a usable
location. An unlocated assignment remains written in the panel and never gains
an invented map point.

### Act card and story panel

A decision beat leads with the situation and then the AI action. The next line
states the operational reason or most important unknown. Method count and
testing language move behind the decision's evidence disclosure. Non-decision
beats continue to say what happened in the public record.

### Decision rail and ledger

Each decision row leads with the concrete AI action. The row may carry one
short verdict underneath. Method comparisons, eight-cell strips and aggregate
counts remain collapsed by default under **How this action was tested**.

### Decision tree

The chronological spine represents eleven decision moments. Branches from the
selected moment represent concrete assignments or destinations, with a maximum
of four visible at once. They do not represent orchestration methods. The
secondary experiment-evidence view may reveal the methods and their recorded
tries without replacing the action layer.

### Three-dimensional decision-run tree

The exhibition may also reuse the process owner’s existing three-dimensional agent-run
tree. That component is an exact-reuse surface, not a visual redesign. Its
reference is `docs/rescueworld/reference/agent-run-tree-component.html`,
SHA-256
`20cce45ce4accc1232ef4e0a0b9163768e7890e206900b71bde711002b499053`.
Its canvas composition, geometry, camera, lighting, animation, layout,
typography, controls and interactions remain unchanged. Only its deterministic
data seam and the audience-facing words that describe that data may change.

There is one explicitly approved layout exception, shared by the Rescue World
tree and the board task tree: the existing timeline element—its tick row, time
labels and playhead—moves upward to overlay the bottom edge of the
three-dimensional canvas. This leaves the text band beneath the canvas clear
for the selected action sentence, status and controls. The two trees use the
same offset. No other renderer, camera, lighting, control or layout change is
allowed under this exception.

There is one additional board-tree-only color exception. For task nodes whose
source names an owner, the board task tree may use one small color difference
to distinguish Claude work, Codex work and GPU-host work. Claude retains the
component's existing blue; Codex and the GPU host receive two other cool hues
in the same brightness family. A one-line legend names the three owners.
Failure red, stopped/dim treatment, selection, focus and every other state color
override the owner hue and remain unchanged. This exception changes no
geometry, light, camera, motion, control, layout or Rescue World node. Rescue
World has no agent-owner encoding and remains exact apart from the shared
timeline-overlay exception above.

There is a second board-tree-only exception, for the camera. The process owner asked for it
on 2026-08-27, in his own words: he wanted to zoom in on the board's task tree
and look around it. The board task tree therefore adds a wheel zoom, a pan and a
reset to the component's own left-drag turning. The mouse wheel and a two-finger
trackpad scroll move the camera nearer or further, easing toward the distance
asked for rather than jumping to it, between a quarter of the component's own
distance and the widest view its own camera-distance dial already reached. A
shift-drag, a right-button drag, a middle-button drag, or two fingers on a touch
screen, slide the point the camera looks at, inside a box around the tree's own
nodes, so the tree cannot be lost off screen. A double-click on empty ground and
the R key ease the camera back to the view the component opens on: turn 0.42,
elevation 0.24, full distance, and the looked-at point (0, 1.95, 0). The idle
turning wobble runs as before until the viewer zooms or pans, and then holds
still until a reset, so a view the viewer framed stays framed. Inside the
landing page's stage the tree does not take the camera until someone clicks or
double-clicks into it; until then the wheel is left alone and the page around
the frame keeps its own scrolling. While the tree holds the camera it draws one
thin line in the component's existing accent colour around its own edge, and the
Escape key, a click outside the frame, or the pointer leaving the frame gives
the camera back. On the tree's own page at `/tree` the camera is held from the
first frame and no click is needed. A click without movement still selects a
node in both modes, a drag still selects nothing, and hovering still marks a
node. One line in the text band says what the camera does, in the band's own
style, and it is drawn whole or not at all.

This camera exception touches five places in `board/public/tree.html` and
nothing else. The stage's own style rule is at lines 67 to 68. The words the
page says about the camera sit with its other words in `SCENARIO_WORDS`, at
lines 151 to 161. The hint line is drawn inside `drawHud`, at lines 1321 to
1329. All the camera code is one block between the component's own `onButton`
function and its own pointer handlers, at lines 1473 to 1717. Three lines inside
`frame`, at lines 1844 to 1848, place the camera each frame. The component's own
turning handlers, geometry, lighting, materials, motion, layout, typography and
node states are unchanged, and `app/public/decision-run-tree.html` and
`app/public/impact-view.html` are untouched, so the Rescue World tree keeps the
exact-reuse rule apart from the shared timeline overlay. The gate
`app/scripts/verify-board-tree.mjs` drives this camera with the browser's own
mouse and keyboard, on the tree's own page and inside the landing page.

The root is the recorded earthquake. Eleven chronological public-response
nodes form the real-history spine. An AI proposal branches from the decision
moment it answered and terminates there. It never connects to the next public
decision and never implies an alternate future, because the project did not
simulate what happened after choosing it.

Each of the five scored decisions carries the three recorded approaches and
all eight sealed tries, for 120 graded proposals in total. Each of the six
context decisions carries its one recorded demonstration proposal, for six
additional ungraded proposals. One view shows one sealed try across the five
scored decisions together with the six context proposals: fifteen graded
proposal nodes and six context nodes. **New run** advances deterministically
through the eight recorded tries and wraps after the eighth. **Replay** repeats
the current recorded try. **Pause** stops and resumes the current deterministic
reveal. None of those controls creates, samples or grades a new answer.

Root and public-response nodes are observations, so they never receive a pass
or miss state. A scored AI proposal may show pass or miss only after its action
sentence is readable. A context proposal says that it was not graded and never
borrows the appearance or wording of a pass. Persistent counters report
orientation, such as eleven decision moments, eleven public-response records,
twenty-one proposals in the current view and recorded try one through eight.
Aggregate pass and miss totals do not lead the surface or appear above the
selected action.

The focused readout follows the same action-first order as every other Rescue
World surface: complete action, plain state sentence, public-or-AI identity,
approach and grade. It uses honest count nouns such as officer pairs, fire
brigades or water trucks. It omits a count where the record names no sent
resource, never prints “zero units,” never exposes raw identifiers and never
calls a later AI proposal an action that real responders carried out.

The tree is the persistent overview. The six-card walk-through and ledger
remain the details-on-demand surfaces for reports, unknowns, checker evidence,
methods and aggregate results. The tree does not duplicate those panels or put
research mechanics ahead of the disaster action.

The adapter reads the sealed log and highlight contract through the same
`trace.ts`, `tree.ts`, `highlights.ts` and `copy.ts` modules as the main viewer.
It verifies both the named source file and its SHA-256 before producing data.
Its checked-in output is deterministic, has a `--check` mode and contains no
random sampling, live clock or newly derived grade.

#### The dense decision network page

The process owner set this target on 2026-08-27 and Codex approved the plan the same day.
The audience and truth contract for the page is
`docs/rescueworld/DENSE-DECISION-NETWORK-CONTRACT.md`, which is the authority on
its node classes, its method-specific edges, its model-call provenance and its
words. The page is `app/public/decision-network.html`, its data is baked by
`app/scripts/bake-decision-network.mjs` into
`app/public/decision-network-data.json`, and
`app/scripts/verify-decision-network.mjs` gates both.

One view is one seed and one method of the accepted continuous production run.
It draws the earthquake and eleven disaster decisions, and at every decision the
same seven agents — three scouts, three reviewers and one coordinator — beside
the rule checks and the state change around them. Every node points at a
recorded model call, rule check or state change in the accepted run, and every
model call also names its own request in that cell's `calls.jsonl`.

The page reuses the checksum-bound reference component. Four regions differ from
it, and nothing else does:

1. **The shared timeline overlay**, in `drawTimeline`: the single line
   `const y  = H - BOT - 26;`, the same offset the impact view uses. The eleven
   decision anchors that stand on that line, and the hour marks under it, are
   written inside this same region.
2. **The class tints and the isolated path**, in `paintStates`: a node takes the
   colour of its own kind from the always-visible key, exactly as the board task
   tree takes an owner's tint. A decision the replay has not reached yet keeps
   its kind's colour at a lower brightness, so the key decodes the whole network
   at rest. Failure red, the two dim states, selection and focus are untouched
   and still win. Selecting a node lights the work of its own decision and the
   state carried either side of it, and the rest of the network dims and stays
   where it is.
3. **The second edge style**, in `paintStates`: what one agent passed to the next
   keeps the component's own thin lit line, and what the run carried from one
   decision into the next is drawn solid and brighter, end to end.
4. **The method control**, in the control strip and its handler: a fourth button
   beside Pause, Replay and Next run, in the same markup and the same style,
   cycling fixed coverage, guarded growth, evidence state and evidence feedback
   and wrapping, while the seed stands. The seed control in that same region is
   labelled **Next run**, never **New run**, because it replays a recorded run
   and creates nothing.

Everything else on the page is the component's deterministic data seam and the
words that describe that data. Colour never acts alone: every kind of node also
carries its own small shape, drawn over its gem and beside its line in the key,
so the network survives a grayscale print. No phrase beside a node, and no line
of the limitation, is ever written across the key, and the run itself stands
clear of the key's column at both frame sizes.

#### The combined impact view

The process owner set this target on 2026-08-27, after looking at the impact view and at the
dense decision network side by side. The two are one page now. The page is
`app/public/impact-view.html`, its numbers are baked by
`app/scripts/bake-impact-view.mjs` into `app/public/impact-view-data.json`, the
agent work inside each decision is read from
`app/public/decision-network-data.json`, and
`app/scripts/verify-impact-view.mjs` gates all of it.

Plain-English findings are the primary product of this page. The graphs are
visual aids that support those sentences, so the page opens on what the run
found and every picture on it answers one sentence a reader has just read.

**The outcome story.** Across the top of the frame the page carries, in reading
text, one paragraph of what the run found, the limits beside it, one sentence
for each of the four methods, and one bottom line about what a disaster-response
tool has to remember. Every number in the paragraph is read off the eight
production seeds by the bake and none of them is typed: the middle coverage of
each method, the total number of modeled demand units the run measured against,
and the count of decisions the evidence-and-feedback method admitted on every
seed. Each claim the paragraph makes beyond a number is checked before the bake
writes it — that guarded growth added no agents, that the two evidence methods
wasted nothing, and that every one of the thirty-two chains failed the same
confirmation at the paper mill without a single capacity or double-booking
break anywhere in the run. Choosing a method's sentence selects that method's
trajectory. The details control turns the four sentences into the exact readings
across the seeds and adds the paper-mill readings that ground the bottom line.

**The five trajectories.** The macro backbone is unchanged: one earthquake and
eleven decisions on each of the four methods, with the public record beside them
as context. The trajectory a viewer stands on keeps its own brightness and the
others stand back at 35 percent, the public record fainter still. At most one
thing pulses on screen at a time.

**The agent work inside one decision.** Selecting one decision draws the ten or
eleven steps the accepted run recorded inside it — three scouts, three
reviewers, the routing gate or the compiled evidence or the team handoff, the
coordinator's proposal, any recorded correction, the admission outcome and the
modeled change — laid out left to right in the order the method ran them, on
their own band inboard of the trajectory, in the colours and shapes of the
dense page's key. Every other decision keeps its work folded under one small
marker. Choosing a step lights its own path through that decision. The counters,
the headline and the trajectories themselves never move. A new growth campaign's
branches may only be drawn from its own accepted receipts, through the named
hook `GROWTH_RECEIPTS`, which stands empty.

**The readout.** At 1600×900 the picked step's whole detail is drawn in its own
column at the right, under the story; at 1280×720 it is in the band under the
picture. The key stays on screen at both sizes. Nothing the picture draws ever
falls behind the story, the key, the counters, the readout column or the
controls: the camera's aim and the run's own spread are read from the frame
each cycle, so the picture stands in the room the words leave it.

The page reuses the same checksum-bound reference component, with the same four
regions differing from it and nothing else:

1. **The shared timeline overlay**, in `drawTimeline`: the single line
   `const y  = H - BOT - 26;`, the same offset the dense network page uses.
2. **The class tints and the lit path**, in `paintStates`: an agent step takes
   the colour of its own kind from the always-visible key, a trajectory that is
   not the picked one stands back, and choosing a step lights its own path while
   the rest of the picture keeps its colour and stands back.
3. **The second edge style**, in `paintStates`: what one agent passed to the
   next keeps the component's own thin lit line, and what a decision carried
   either side of it is drawn solid and brighter, end to end.
4. **The control-strip additions**: two more buttons beside Pause, Replay and
   Next run, in the same markup and the same style — **Full network**, which
   opens the whole network of the run on screen in its own page, and
   **Details**, which turns the story's four sentences into the exact readings.
   The seed control in that same region is labelled **Next run**, never **New
   run**.

Everything else on the page is the component's deterministic data seam and the
words that describe that data.

### Six-card walk-through

The first card names the situation. The second card shows the final recorded AI
action in full. The third card explains the reports and unknowns behind it. The
fourth card shows what real responders were recorded doing. The fifth card gives
the one-sentence recorded check. The sixth card, **How this action was tested**,
contains the baseline method, evidence-table method, correction, seeds and full
checker detail.

The walk-through may teach the experiment, but only after it has taught the
disaster decision.

### Debrief and findings

The debrief may compare methods because it explains the experiment's finding.
It still begins with one concrete disaster decision and the actions the methods
proposed before giving aggregate scores. It follows the full findings gold
standard and ends with the limitation and next experiment.

## Cognitive-load rules

- One selected decision at a time.
- One concrete action summary at initial rest.
- At most four visible assignments; the rest use one complete “and N more”
  sentence with a deliberate detail control.
- At most five primary actions on one screen.
- No method comparison, seed strip or aggregate count in the default action
  view.
- Reading text is at least 18 CSS pixels at 1600×900 and at least 16 pixels at
  1280×720; node labels are at least 14 pixels.
- Primary targets are at least 44×44 CSS pixels.
- Status uses text and shape as well as colour.
- Click, tap, Enter and Space create the same persistent selection. Hover may
  emphasize but never holds essential content.
- No horizontal scrolling at 1280×720 or larger.

## Truth boundary

The shown actions are recorded model proposals from the sealed run. They are
not claims that real dispatches occurred, that the AI improved the historical
response, or that a proposed action saved people. The public record remains
separately labeled.

The checker proves only that an answer followed the exercise's written resource,
evidence, deadline and unknown-handling rules. It does not prove that the
action was tactically best.

The five registered decisions contribute 120 scored answers. The other six
decisions contain full simulated actions from the full-incident demonstration,
but their results stay descriptive until a separate registered scoring run is
performed.

## Acceptance gates

1. A cold reader can identify the selected AI action, units, quantities,
   destinations and reason without opening a secondary disclosure.
2. The default screen contains no method name, seed number, agreement count or
   `N of 8` result above the action.
3. Every selected action matches the sealed choice's assignments and short
   reason exactly after plain-language translation.
4. Every report and unknown shown beside an action belongs to that same sealed
   choice and decision deadline.
5. All eleven decisions expose their full-incident simulated action. Exactly
   five expose registered experiment evidence and exactly six state that they
   are outside the registered result.
6. A located assignment highlights the same recorded destination on the world;
   an unlocated assignment creates no point.
7. Public-response copy and simulated-action copy are visibly and verbally
   distinct.
8. Experiment evidence remains reachable and exact, but opening it never adds
   more than three method controls, eight seed cells from one method and one
   selected answer drawer.
9. The default hierarchy passes at 1600×900 and 1280×720 with readable text,
   reachable controls and no horizontal overflow.
10. The main replay, tree, ledger, story panel, act cards and walk-through all
    pass the same seven-question cold-reader test at the top of this contract.
11. The three-dimensional tree's presentation and interaction code match the
    checksum-bound reference except for the approved timeline-overlay hunk, the
    board-tree-only owner-color hunk and the board-tree-only camera hunk defined
    above; only its deterministic data seam and scenario vocabulary otherwise
    differ.
12. The tree contains one incident root, eleven chronological public-response
    spine nodes and terminal AI-proposal branches. No AI branch reaches the
    next decision or represents a simulated future.
13. **New run** cycles the eight sealed tries in a stable order, **Replay**
    repeats the selected try and **Pause** resumes it without changing any
    proposal, verdict or timestamp.
14. Across the eight recorded views, exactly 120 scored proposals are present:
    five decisions by three approaches by eight tries. Exactly six additional
    proposals are labeled context only and ungraded.
15. Root and public-response nodes never receive pass or miss styling. Every
    scored or context node states that it is a later AI proposal, and its full
    action precedes its approach and grade.
16. The adapter rejects a mismatched log filename or SHA-256, reproduces its
    committed JSON byte for byte in `--check` mode and contains no random,
    current-date or current-clock input.
17. At 1600×900 and 1280×720, the exact-reuse tree remains readable and
    operable with pointer and keyboard; Pause, Replay and New run work; and the
    page produces no console or asset errors.
18. A cold reader can retell what the selected public responder or AI proposal
    does before naming its approach, try number or result.
