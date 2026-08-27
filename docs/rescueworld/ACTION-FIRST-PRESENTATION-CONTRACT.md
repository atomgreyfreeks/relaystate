# Rescue World action-first presentation contract

Status: normative product-wide override, 2026-08-26

This contract applies to the live replay, decision tree, decision ledger, act
cards, story panel, map telegraph, walk-through and debrief. It records Randy's
product ruling after the method-first decision-tree preview made the central
failure visible:

> Rescue World is a disaster simulation. Its primary story is what the AI
> agents decide to do in the disaster.

This contract extends the narrative principles in
`docs/method/FINDINGS-STORYTELLING-GOLD-STANDARD.md` and overrides any Rescue World
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
