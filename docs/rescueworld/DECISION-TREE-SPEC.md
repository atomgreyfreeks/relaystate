# Rescue World decision tree

Status: agreed build contract, 2026-08-26

## The one-sentence contract

Use the visual grammar of a game skill tree to show what the artificial-
intelligence agents proposed doing during the disaster, while never drawing an
invented future.

The surface is titled **The decision tree** and keeps this qualifier visible:

> This is a map of recorded decisions and recorded model answers. Its branches
> are not possible futures.

## The product story: actions first

Rescue World is a disaster-simulation product, not an experiment dashboard.
The first question every selected moment answers is:

> What did the AI agents decide to do here?

The answer is written in operational disaster-response terms: which unit or
capability, how many, where it goes, when it acts and why that action was
chosen. For example:

> Send one pair of roads-ministry officers to Uki City and one pair to Hikawa
> Town. Both towns reported the strongest shaking, and only two pairs were
> available.

The visible hierarchy is therefore:

1. **Situation** — what was happening and what decision was due.
2. **AI action** — the concrete deployment, priority or coordination action.
3. **Operational reason** — the reports and unresolved facts that shaped it.
4. **Recorded check** — one plain verdict on whether the action obeyed the
   exercise's rules.
5. **Experiment evidence** — method identity, seed counts, agreement cells and
   checker detail, revealed only after a deliberate secondary disclosure.

Never lead with an experimental mechanism such as “the desk that wrote plain
notes,” “the evidence-table method,” a seed number or an `N of 8` count. Those
phrases explain how an answer was produced or tested; they do not say what the
agents did in the disaster. Where method identity is visible, it is the
smallest, quietest tag and follows the action and verdict.

Branches coming off a selected decision represent concrete proposed actions or
destinations, not orchestration methods. A branch label names the unit,
quantity and destination. If a selected action has more destinations than the
surface can legibly show, draw at most four and state how many more are
available in the detail panel. The complete action stays reachable without
shrinking text.

Selecting an action highlights its recorded destination on the live terrain
and shows its route where the record supplies a location. The world is the
primary reading surface; the panel explains the action on that world. A place
with no recorded coordinate receives a written location only, never an
invented point.

## What the tree means

The main spine is the real 72-hour public-record chronology. It has eleven
decision junctions in time order. Selecting a junction opens the final recorded
AI proposal from the full-incident demonstration: its concrete assignments,
operational reason, reports and acknowledged unknowns. The recorded real
response remains clearly available as a separate comparison and is never
presented as an AI action.

All eleven decisions may show their recorded simulated action. Only the five
decisions inside the frozen registered experiment receive the secondary
experiment-evidence view. Each registered junction then has three methods and
eight recorded tries per method:

```text
5 registered decisions × 3 methods × 8 seeds = 120 recorded answers
```

The other six junctions still show the situation and concrete AI action,
followed by:

> This moment was replayed for explanation, but it was outside the frozen
> registered result. No registered result count is shown here.

A model answer never connects to the next decision. These are independent
answers to frozen decision snapshots, not one coherent alternate 72-hour
response.

## Cognitive-load contract

The first implementation preview failed this contract. It expanded five dense
decision cards, repeated the same method explanations, used small low-contrast
type and asked a viewer to read, compare and navigate at the same time. The
shorter hover-tooltip revision also failed: it still exposed eleven marks plus
fifteen equal-weight branches, split chronology into two rows, crushed early
events on a proportional scale and had no persistent selection.

The tree discloses one level at a time:

0. **Orientation** — one stable eleven-node chronology, its purpose, current
   position and one compact legend.
1. **Selected moment** — exactly one situation and one concrete final recorded
   AI action. This is the default open state.
2. **Selected assignment** — one branch or panel row explains one unit,
   quantity and destination and highlights it on the world.
3. **Why this action** — reports used, unknowns named and one operational
   reason, without experimental terminology.
4. **How this was tested** — one deliberate secondary disclosure reveals the
   three method tags for a registered decision.
5. **Selected recorded try** — one method reveals its eight seed cells, and one
   selected cell reveals one compact evidence drawer.

All eleven decisions remain on one chronological spine. Registered and
descriptive decisions may use different node treatments, but they must not be
split above and below the spine. Non-selected decisions show no paragraph
copy. Only the selected decision can expose action branches. Method controls
remain inside the secondary evidence view, and only one method can expose
seeds.

The spine uses equal visual spacing so early decisions do not collapse into one
knot. Every node keeps its exact recorded time, and the selected state says
`Moment N of 11`; the screen must not imply that equal spacing represents equal
elapsed time.

These are product acceptance budgets, not claims of a universal human word
limit:

- initial state: at most 140 visible words;
- authored node locator: two to four words, never algorithmic ellipsis;
- purpose or instruction: one sentence and at most 18 words;
- selected task: at most 25 words;
- public-record summary and unknowns: at most two chunks and 50 words total;
- collapsed method result: at most 20 words, including its `N of 8` count;
- no text block exceeds 45 words or four rendered lines;
- each sentence or bullet carries one idea;
- boilerplate and legends appear once, never once per decision or method.

A lower total at-rest word budget is welcome, but it may not remove the nouns
that explain what a number counts or turn complete meaning into abbreviations.

The selected area exposes at most five primary actions. The eleven-node spine
is one navigation group, not eleven equal-weight calls to action. The current
selection remains visible so a viewer never has to remember which transient
card supplied the detail on screen.

At 1920×1080, reading copy is at least 18 CSS pixels, uses at least 1.5 line
height, stays at or below 80 characters per line and meets 4.5:1 contrast.
Regular text weight is the minimum. Node labels are at least 14 pixels,
nonessential metadata at least 12 pixels, and primary exhibition copy should
target the Xbox 26-pixel game-UI recommendation. Text can resize to 200 percent
without losing content or function. The default state requires no horizontal
panning.

Status is expressed with text and shape as well as cyan or ember. Keyboard
focus and persistent selection are obvious and visually different. Targets are
at least 24×24 CSS pixels; primary interactive targets are at least 44×44.

Hover may preview or emphasize an item. Click, tap, `Enter` or `Space` must open
the same detail persistently, with an exposed expanded/collapsed state. Nothing
essential exists only while a pointer remains over an item.

## Form factor and art direction

The research above governs how information is disclosed. It does **not** call
for a generic document, dashboard or wall of rectangular cards. The rejected
preview looked unrelated to the main Rescue World experience and therefore
failed even after its copy became shorter.

The decision tree is an instrument inside Rescue World:

- the live rendered world remains visibly present as the surface's backdrop;
- one luminous chronological spine sits across the lower portion of the world;
- its eleven decisions are glyph nodes, not article cards;
- selecting a node lets up to four compact action branches bloom from that
  node and only that node, each naming a unit, quantity and destination;
- one translucent instrument panel explains the persistent selection;
- a secondary evidence disclosure reuses that panel for methods, seeds and the
  selected recorded answer;
- closing the instrument returns to the same world and replay state.

The default screen must read first as the existing Rescue World canvas with a
new decision instrument on it, not as a separate website placed over the
canvas. Do not use a full-screen opaque backplate, multi-column card grid,
spreadsheet table, or prose attached to every node.

The selected-detail panel follows the existing right-rail language: black glass,
fine neutral rules, white corner brackets, bone text, cyan signal and ember
failure. It is one panel, no wider than `min(420px, 32vw)`. The spine remains
visible while the panel is open and occupies no more than the lower quarter of
the viewport. At least 60 percent of the viewport keeps the world readable and
free of opaque panels.

Each node has a minimum 44-pixel hit target around a compact luminous mark.
Registered and descriptive nodes have different text/symbol treatments as well
as colour. Non-selected nodes stay quiet. The selected path alone receives the
bright connector, bracket treatment and restrained Halo Forge glow. No green
or unrelated palette enters the screen; use the current Rescue World `SIG`,
`BURN`, ink and neutral tokens.

Branch motion explains hierarchy rather than decorating it: the concrete
action branches draw once from the selected node, in roughly 200–350
milliseconds, and stop. A branch never grows forward into another decision,
pulses forever, or obscures the world. Halation, grain and chromatic split
remain subject to the current readability caps so the instrument never blooms
into white glare.

## Screen structure

The overlay should restructure and extend the existing `L`-key decision ledger
rather than introduce a separate competing surface.

The chronological trunk shows all eleven decisions as compact nodes. Each node
includes:

- the deadline;
- its ordinal, authored two-to-four-word locator and registered/descriptive
  status in text or an accessible name;
- a neutral connector to the selected decision detail.

Only the selected node reveals its complete plain-English title. The other ten
remain compact.

The selected decision detail appears in this order:

1. the situation, deadline and named decision owner;
2. **AI ACTION**, leading with assignments proposed: unit, quantity and
   destination;
3. the operational reason, reports used and unknowns named;
4. the public record, clearly separated from the simulated action;
5. one plain recorded-check verdict;
6. a secondary **How this action was tested** disclosure;
7. only after that disclosure, the method tag, eight seed cells, checker
   findings and standing limitation.

The simulated action is always identified as an AI proposal rather than a real
dispatch. The public record remains reachable beside it, but research mechanics
may not displace the action from the top of the selected detail.

## Result-cell meanings

The initial action view contains no seed cells, agreement count or method
comparison. One plain verdict may say that the shown action passed every
prewritten check or name the first rule it missed. It may not substitute a
score for the action itself.

Only the secondary experiment-evidence view reuses the existing eight-cell
semantics. They express two separate facts:

- cyan means that recorded answer passed every prewritten check;
- ember means that recorded answer missed at least one prewritten check;
- filled means the answer belongs to the most common recorded choice set;
- hollow means it does not.

Those meanings remain in one compact legend inside that secondary view. Never
call a percentage or an agreement count “confidence.”

Each collapsed method result inside that secondary view says:

- its short plain-English method tag, subordinate to the action;
- `N of 8 recorded answers passed every prewritten check`.

The expanded method detail may also say `The most common set of choices
appeared in N of 8 recorded answers`. That second count does not repeat in all
three collapsed controls.

## Interaction

- `B` and a visible **Open the decision tree** control open the surface; `L`
  continues to open the existing ledger.
- `Escape` or `B` closes it.
- `Up` and `Down` move between decisions.
- `Right` drills from the selected moment into its action, explanation and—if
  deliberately opened—experiment evidence; `Left` returns one disclosure
  level.
- `Enter` or `Space` persistently selects or toggles the focused item.
- `1` through `8` select a recorded seed only while one method is expanded.
- **Go to this moment in the world** closes the tree, seeks to the deadline,
  flies to the recorded location and stays paused.
- **Open the full decision walkthrough** opens the existing six-step trace for
  the selected decision and seed.
- Filters: **All 11 decisions** and **Only the 5 registered decisions**.

Opening pauses playback. Closing restores the prior playback state unless the
viewer explicitly chose **Go to this moment in the world**. When opened, select
the latest decision whose deadline has passed at the current playhead; before
the first decision, select the first one.

Mouse and keyboard behavior must be equivalent. Nothing essential can live
only on hover. Selection persists after the pointer moves away.

## Visual rules

- black surface and the existing bracket-reveal animation;
- bone/white for the public record, chronology, neutral connectors and ungraded
  information;
- cyan `#7df9ff` for an answer that passed every prewritten check;
- ember `#ff9d5c` for an answer that missed a prewritten check;
- dim grey for moments outside the registered experiment;
- white corner brackets, not another status colour, for the current selection;
- equal type size, padding and visual dignity for public-record and model cards.

All eleven nodes remain in chronological order on one spine. Do not create one
row for registered moments and another for descriptive moments. Do not render
method branches on the world-facing action layer. Only the selected decision
may reveal action branches. The three method controls exist only inside the
secondary evidence disclosure for a registered decision.

Colour belongs to recorded checker results, never to implied good or bad
futures. Do not add rankings, “best path,” unlock effects, progress levels or
animated branches extending into the future. Raw identifiers never reach the
screen. Every number says what it counts.

## Authoritative data

- `public/rescueworld-log.json` — 414 events, eleven
  `DECISION_PROPOSED` events, decision context, public record and recorded model
  answers.
- `public/rescueworld-highlights.json` — registered membership, method
  counts, seed outcomes and agreement groups.
- `src/rescueworld/trace.ts` — existing plain-language labels and answer
  translations.
- `src/rescueworld/highlights.ts` — existing eight-cell semantics.

Registered event IDs:

- `kumamoto-2026-full-incident:e0009`
- `kumamoto-2026-full-incident:e0024`
- `kumamoto-2026-full-incident:e0071`
- `kumamoto-2026-full-incident:e0128`
- `kumamoto-2026-full-incident:e0271`

The current log SHA-256 is
`2af92212b6abe4f06df3e6341bfc25fad63ed4c071f6cd7399b67dce1683f19e`.
Registered membership and aggregates come from the highlight contract only
after that contract's source hash matches the loaded log.

## Honesty boundary

The 120 model answers are independent responses to five frozen decision
snapshots. Therefore:

- clicking a model answer inspects it; it never executes it;
- no model answer displays deaths prevented, people reached, downstream
  conditions or other counterfactual consequences;
- historical overlap is descriptive and never a success score;
- public responders never receive a checker grade;
- an empty historical assignment means the reviewed public source published no
  matching assignment, not that nobody acted;
- the six descriptive moments contribute nothing to registered totals;
- the interface never claims that the model improved the real response.

Keep the existing standing limitation visible at every registered result:

> These checks measure traceability and rule-following inside the exercise.
> They do not grade the real responders or prove that an agent's judgment was
> better.

## Verification gates

1. Exactly 414 events, eleven chronological junctions, five registered
   junctions, three methods, eight seeds and 120 registered answer cells.
2. The highlight source hash matches the loaded log before a registered count
   renders.
3. Six excluded decisions render zero registered cells and the explicit
   exclusion sentence.
4. Every answer cell matches its recorded method, seed, assignments and checker
   result.
5. No model answer connects visually or structurally to another decision.
6. No raw identifier, percentage, invented score, “optimal,” “best,” or graded
   “confidence” appears.
7. Every selected moment leads with a complete action in disaster-response
   terms: unit or capability, quantity, destination and operational reason.
   The public record is separately labeled, and the limitation remains visible
   with registered results.
8. Initial open renders exactly eleven decision nodes, one persistent selected
   moment, its final recorded AI action, zero method nodes, zero seed cells and
   zero answer drawers.
9. Decision DOM order and keyboard order match ascending recorded time. All
    nodes stay on one monotonically ordered spine; registered status never
    moves a decision into another row.
10. Opening **How this action was tested** on a registered moment renders
    exactly three subordinate method controls. Selecting one method renders
    exactly eight seed cells; selecting another replaces those eight.
    Selecting one seed renders exactly one answer drawer.
11. Selecting an excluded decision still renders its final recorded simulated
    action, but renders zero method and seed cells and the exact exclusion
    sentence.
12. Pointer leave and blur never clear a persistent selection. Click/tap,
    `Enter` and `Space` expose the same detail; `B`, Escape, Up/Down, Left/Right
    and `1`–`8` follow the interaction contract. Exactly one focus indicator is
    visible and focused content remains onscreen after every action.
13. Opening and closing without seeking leaves replay state byte-identical;
    close, seek and trace handoff all work.
14. At 1920×1080 and 1600×900 body copy is at least 18 CSS pixels, line length
    is at most 80 characters, line height is at least 1.5, normal-text contrast
    is at least 4.5:1 and the default state needs no horizontal panning.
15. At 1280×720 the chronology, selected moment, close control and scroll cue
    remain visible with no horizontal overflow; disclosure panels may scroll
    vertically and reading copy remains at least 16 CSS pixels.
16. Copy respects the 140/18/25/50/20-word budgets, no block exceeds four
    rendered lines, no label is clipped or algorithmically ellipsized, every
    number names what it counts and boilerplate appears once.
17. Selection and keyboard focus are separately visible, every interactive
    target is at least 24×24 CSS pixels, primary targets are at least 44×44 and
    status never depends on colour alone.
18. The world canvas remains visible behind the instrument, at least 60 percent
    of the viewport is free of opaque panels, and the one detail panel is no
    wider than `min(420px, 32vw)`.
19. The default surface contains eleven glyph nodes and one instrument panel,
    not eleven content cards. Only the selected node may draw up to four
    concrete action branches, and the spine remains visible at every disclosure
    level.
20. Visual status uses existing Rescue World signal, burn, ink and neutral
    tokens; the selected path alone glows, branch motion stops within 350
    milliseconds and the existing readability caps prevent bloom over text.
21. Manually inspect one passing seed, one failed seed, the municipal-liaison
    repair, the persistent water failure and one excluded decision.
22. Run the existing highlight derivation, trace, copy, production build and
    full-incident viewer gates.
23. At initial rest and after selecting any moment, no method name, seed number
    or `N of 8` count appears above the concrete AI action. A cold reader can
    answer “who goes where, in what quantity, and why?” without opening the
    experiment-evidence disclosure.
24. Selecting a located action highlights the same recorded destination on the
    live terrain; an unlocated action creates no invented point.

## Interaction-design sources

- Apple Human Interface Guidelines, disclosure controls:
  <https://developer.apple.com/design/human-interface-guidelines/disclosure-controls>
- Ben Shneiderman, “The Eyes Have It,” overview first and details on demand:
  <https://drum.lib.umd.edu/items/155a868e-fb83-4115-9899-9187ea8c0498>
- W3C cognitive accessibility guidance, including avoiding too much content and
  limiting main choices:
  <https://www.w3.org/TR/coga-usable/>
- Xbox Accessibility Guidelines 101, 112, 113 and 114 for text, predictable
  navigation, focus and UI context:
  <https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101>
  <https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112>
  <https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/113>
  <https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/114>
- WCAG 2.2 guidance for contrast, resizing, hover/focus content and target size:
  <https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum>
  <https://www.w3.org/WAI/WCAG22/Understanding/resize-text>
  <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus>
  <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum>

## Deliberately missing claims

The record does not contain counterfactual outcomes, a continuous alternate
policy from one junction to the next, registered results for six decisions,
calibrated probability, complete private reasoning from responders, or
people-reached/lives-saved outcomes. The interface must not imply any of those
things.
