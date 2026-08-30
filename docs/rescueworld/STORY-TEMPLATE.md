# Rescue World — the story template

Status: normative, written 2026-08-23 by claude on the process owner’s directive: "a
repeatable pattern so we can always get easy to understand stories about the
outcomes of future agent run simulations and scores." Countersigned 2026-08-23 by
codex after the reach metrics, decision scores, act fallback and unplaced official
updates were independently checked against both sealed runs. It is bound by
`docs/rescueworld/SPEC-2.md` and adds nothing that conflicts with it.

Amended 2026-08-23, after that countersign, with the process owner’s positioning ruling and
the grade wording agreed with codex on the board in messages 1063, 1066 and 1068.
The amendment adds the positioning rule to the requirements, fixes the exact words
every grade is said in, and adds three honest-labelling rules. It awaits codex's
re-review as an amendment.

## The thing this document is about

On 28 July 2026 at twenty-seven minutes past four in the afternoon, an earthquake
of magnitude 7.1 shook Kumamoto Prefecture in southern Japan. Over the three days
that followed, fire agencies, defence units, prefectural offices and town halls
made a long chain of choices while the information in front of them was still
incomplete. Rescue World holds those three days as one file of 414 numbered
events and plays them back inside a 3D world that a person can watch.

A recorded run is a file of events. A story is what a person carries away after
watching that file play. This document fixes the shape between the two, so that
every run becomes the same kind of story: the real historical response, the run
our fleet of artificial-intelligence agents produced, and any future method's run
that somebody records next year. The shape is fixed so a viewer learns it once
and then understands every later run without being taught again.

The test this document is written against is the one in `docs/rescueworld/SPEC-2.md`
section 2: a person who watched the run once can retell what happened, what the
desk decided, and why the outcome differed.

## Three words this document uses in a special way

**A beat** is one readable moment of the run: a small group of recorded events
that share a place, a clock time and a single thing worth saying about them. For
example, in the seventy-two-hour Kumamoto run, the eighteen aftershocks recorded
between six and seven on the first evening are one beat, and the choice of the
first outside fire package is another beat on its own.

**The copy deck** is the file that holds every string of text a viewer can read,
so that interface builders take words from it and write none of their own. The
Rescue World copy deck is `docs/rescueworld/theater-copy.md`, and it is where the
briefing paragraph, the outcome sentences and the closing lines already live.

**A scored run** is a recorded run whose events carry graded results, such as how
many simulated people a method reached or how many of its decisions passed every
check the exercise wrote in advance. The frozen Kumamoto experiment in
`experiments/kumamoto-real-response/PRODUCTION-RESULTS.md` is a scored run,
because each of its forty paired decisions carries a validity result and a
constraint result.

These three words also have entries in `GLOSSARY.md` at the repository root.

## Two documents govern the words, at two different levels

Both of these bind every story built from this template, and they govern
different things.

`docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md`, written by codex on
2026-08-19, governs the **narrative structure**: what the story says, in what
order it says it, and when the story is finished. Its required storytelling order
and its nine-question acceptance test are reproduced in this template and apply
to played stories exactly as they apply to written reports.

`docs/COPY-CONTRACT.md` governs the **sentences**: how each individual string is
written. Its ten rules are checkable, and `app/scripts/copy-lint.mjs` checks three
of them mechanically. Every beat card, decision card, outcome line and debrief
sentence produced under this template obeys it.

Where the two are read together: the gold standard decides that the debrief must
give the exact measured result on a familiar scale, and the copy contract decides
that the sentence carrying that result says what the number counts.

### The positioning rule: this is a decision-making information tool

the process owner’s ruling of 2026-08-23, agreed with codex on the board in messages 1063,
1066 and 1068, governs every sentence that carries a score.

Rescue World is a tool that helps a person decide, by showing what each decision
rested on. Its grades measure two things and nothing else: whether a decision can
be traced to information that existed at that moment, and whether it obeyed the
exercise's written resource rules. A grade is never presented as the agents being
better or worse than the people who responded to the real earthquake.

The word "confidence" is allowed in positioning prose, where it describes what a
viewer builds by seeing the evidence behind a decision. It never appears as the
label of a grade, on a badge, or beside a number. Grades are deterministic
outcomes of a checker that was written before the run, and calling them confidence
would claim a calibration the checker does not have.

Comparing our own three methods against one another stays a real finding, because
that comparison is our own experiment. Comparing any method against the real
responders is not a finding, and no sentence performs it.

These are the copy contract's rules restated for the person writing beat cards
and decision cards. The full list of ten lives in `docs/COPY-CONTRACT.md`.

1. **Every string is a complete sentence.** Single-word controls and short labels
   of four words or fewer are the only exceptions.
2. **One idea per sentence.** A card that reports two things becomes two
   sentences.
3. **Every noun carries its context.** A card that says "the team arrived" fails.
   A card that says "the second rapid-assessment team arrived at site three"
   passes.
4. **The concrete scenario comes before any striking phrase.** The first text a
   viewer reads names the place, the people and what the two sides do. A memorable
   phrase may follow that, and may never replace it.
5. **No project-internal words reach the screen.** Rule 5 of the copy contract
   lists sixteen banned words, and any writer of story text reads that list in
   full before writing. One of the banned words is "arms", so a decision method on
   screen is called something a stranger can read, such as "the desk that checked
   its evidence". Organism names in plain English are allowed on
   growth-intelligence surfaces, and each one arrives with a plain statement of
   what that rule does.
6. **No stacks of abstract nouns.** Three abstract nouns in a row is a defect.
   Rewrite as subject, verb, object.
7. **No contrast constructions.** The forms "not X, but Y" and "X does not do A.
   It does B." are banned everywhere.
8. **No sentence over 45 words.**
9. **Every number states what it counts.** A card never shows a bare 77. It shows
   77 simulated people reached for assessment.
10. **Headers read like sentences a newspaper would print.**

The acceptance bar for each sentence is the classroom test: read the sentence
alone, out of order, and if a capable stranger would ask "which one?" about any
noun, or would need to read it twice, the sentence fails and gets rewritten.

## The story order, expressed as parts of a played run

The gold standard's required storytelling order is written for reports. A played
story satisfies it in the following places, and a story missing any row is
unfinished.

| Required step | Where the played story does it |
| --- | --- |
| 1. Begin with the human problem and the question. | The opening card, then the first act. |
| 2. Explain through one concrete, understandable example. | The beats, each one at a named place on the map at a stated clock time. |
| 3. Say what the baseline did and why it could fail. | The first decision beat, which states what the ordinary method chose and what it could not check. |
| 4. Walk through what each test taught, including failures. | The beats that record a failure, kept in the running order and never trimmed. |
| 5. Describe the change that produced the result in ordinary language. | The decision beats' own sentences, in the words of the record. |
| 6. Give the exact measured result on a familiar scale. | The outcome display during play, then the debrief's numbers. |
| 7. State the finding precisely without expanding it. | The debrief's first sentence, which is one sentence long. |
| 8. Name specific real jobs where the finding could be useful. | The debrief's use card, one sentence naming two or three jobs. |
| 9. Compare with current standard practice. | The comparison story, played as moments where the two runs chose differently. |
| 10. End with the limitation and the exact next experiment. | The debrief's last two cards, in that order. |

## Part one: the opening card names the place, the date and the event

Every run opens on one card, held over a high camera, before anything moves. The
card carries four things and nothing else.

1. **One sentence naming the place, the date, the clock time and the triggering
   event.** It is written for someone who has never heard of the place. Example
   from the seventy-two-hour Kumamoto run: "On 28 July 2026 at 16:27, an
   earthquake of magnitude 7.1 struck Kumamoto Prefecture in southern Japan, and
   the Japan Meteorological Agency recorded its strongest shaking as 7 on that
   agency's intensity scale."
2. **Two to four sentences of situation**: who has to decide something, what they
   have, and what they do not know yet. This is the human problem and the
   question, which is step one of the required storytelling order.
3. **One data-honesty line** stating which parts are real public records and which
   parts are simulated. The line is never abbreviated and never moved into a menu.
4. **One control, labelled "Begin".**

Everything on this card is read out of the run itself. The magnitude, the
intensity reading, the clock and the map position come from the first recorded
event, which the event files name `WORLD_INITIALIZED`. The function `openingBeat`
in `app/src/rescueworld/acts.ts` already extracts exactly this, plus the series of
official revisions to the main shock and the aftershocks that arrived while those
revisions were still being issued.

The opening card never states a result. A viewer who has not watched the run yet
is told the question, and is never told the answer.

## Part two: the run divides into named acts, or else into its own recorded rounds

An act is a named chapter of the run, the same way a play has acts. A run whose
scenario declares acts divides into at least three and at most five. Fewer than
three gives a viewer no sense of the run changing shape over time. More than five
gives a viewer more chapter names than a person remembers.

Each act carries exactly two pieces of text:

- **A title of one to four words** that a viewer can hold in memory. "Hour one".
  "The first night". "Day two: the water crisis". "The turn".
- **One story sentence** saying what changes during that act. It is a complete
  sentence and it says what the act's own events do.

Acts are declared in the run's scenario file, and the viewer never invents one.
The scenario declares, for each act, an identifier, a label, a start clock, an end
clock and a story sentence. The function `deriveActs` in
`app/src/rescueworld/acts.ts` reads that declaration and refuses to run when the
scenario declares no acts.

Every event lands in exactly one act by two rules, applied in order. First, the
event's own story tag names an act, and the record's own answer wins. Second, when
the tag names no declared act, the event's wall clock places it inside the act
window whose start and end contain it. An event that neither rule can place stops
the run with an error, because an event silently dropped from the running order is
an event the story never tells.

### What happens when a scenario declares no acts

Some recorded runs declare no acts at all. The preserved two-desk exercise at
`product/disaster-replay/runs/kumamoto-2026/260728/` is one of them: its scenario
file declares decision slots, resources and metrics, and it declares no acts.

The code refuses rather than inventing a chapter. `deriveActs` stops with the
error "the scenario manifest declares no acts". The viewer in
`app/src/rescueworld/main.ts` catches that refusal, and walks such a run round by
round instead of act by act, using the round grouping the run's own events already
carry in their story tags. The opening card is skipped for a run in that form,
because the opening beat is read only where acts exist.

A round is the run's own recorded grouping of events, named by each event rather
than by the scenario file. The preserved two-desk exercise plays six rounds on the
plain desk and eight rounds on the desk that checked its evidence.

So this part's rule reads in full. A run divides into three to five named acts
when its scenario declares them. A run whose scenario declares none is told round
by round, using the same beat rules, the same card rules and the same debrief. The
act form is preferred, because a title a person remembers is easier to hold than a
round number.

Giving acts to a run that has none is a change to that run's scenario file, and a
sealed run's scenario file is hashed into its certificate under `scenario_sha256`.
Acts are therefore declared when a run is recorded, and a sealed scenario is left
alone afterwards.

## Part three: beats are the moments that earn a card

A beat is one readable moment of an act. Beats are cut by three rules, and the
rules exist so that a viewer sees every important thing once and is never buried
by things that arrive continuously.

1. **A decision moment is always a beat of its own.** It is never grouped with
   anything else, because a decision is the point of the whole piece.
2. **A named single thing that happened is a beat of its own.** The record calls
   these milestones, and each one carries its own plain-English headline.
3. **Anything arriving as a steady drizzle is grouped by the clock hour it
   happened in.** One hour of aftershocks is one beat, however many tremors it
   held. One hour of road closures is one beat, however many roads closed.

Grouping happens inside an act, after events have been placed into acts. An hour
that straddles an act boundary therefore becomes two beats, one on each side of
the boundary, and a card never carries a count that crosses a chapter break. In
the seventy-two-hour Kumamoto run the hour from 17:00 straddles the boundary that
way, and it becomes a beat of 8 aftershocks in hour one and a beat of 9
aftershocks in the first night.

### Which recorded event types earn a card

The event vocabulary is fixed by `product/disaster-replay/schemas/replay-event.schema.json`.
The left column below holds the exact type names as they appear inside the event
files. Those exact names never appear on screen.

| Recorded type | Story treatment |
| --- | --- |
| `WORLD_INITIALIZED` | The opening card. Always exactly one. |
| `SOURCE_INGESTED` carrying an official report identifier | An official-update card of its own. |
| `SOURCE_INGESTED` with no report identifier | Silent as an individual event; all of them share one data-loading beat with a counted label. |
| `DECISION_PROPOSED` | A decision card of its own, always. |
| `CLAIM_STATE_CHANGED` | A card only when the verdict changes a decision that follows it; otherwise it appears inside the following decision card as evidence. |
| `RESOURCE_DISPATCHED` | A card of its own, with the route drawn and marked illustrative until recorded routes exist in the event contract. |
| `OUTCOME_OBSERVED` carrying a named headline | A card of its own. |
| `OUTCOME_OBSERVED` carrying an earthquake record | Grouped by clock hour. |
| `OUTCOME_OBSERVED` carrying a road restriction | Grouped by clock hour. |
| `METRIC_UPDATED` | Never a card. It updates the outcome display during play and feeds the debrief. |
| `POLICY_EVALUATED` and `GRAPH_TRANSITION` | Silent. They group other events into rounds and say nothing on their own. |

### What is specific to this scenario, and the rule that generalizes it

`app/src/rescueworld/acts.ts` decides a beat's kind by looking for fields the
Kumamoto scenario happens to use: a milestone identifier, a road-restriction
identifier, an official report identifier, and an earthquake record. Those field
names are specific to this incident's data. The general rule underneath them is
this one, and a new run applies it by declaring, for each of its event types,
which of three boxes the type falls into.

- **A named moment**, which becomes one card. The record supplies its headline.
- **A drizzle**, which is grouped by clock hour into one counted beat.
- **Silent**, which is drawn in the world and appears in no card.

A new scenario that introduces a new event field states its box in the scenario
file, and the beat-cutting code reads that declaration rather than growing another
special case.

### What a beat card must say

A beat card is one sentence, plus supporting lines that are never folded into that
sentence. The sentence answers three questions.

- **Who acted.** A named body, agency, desk, team or place. Never "a source" and
  never "the system".
- **Where it happened.** A named place, or a numbered site on the map, or the
  honest phrase "across the region" when the record carries no place.
- **What happened, or what was decided.** In the words of the record, in plain
  English.

Worked sentence from the seventy-two-hour Kumamoto run, taken from the record's
own headline: "Five local and prefectural headquarters stand up in the earthquake
minute."

Supporting lines sit under the sentence, each on its own line, and each is left
out only where the record carries nothing to put there:

- the clock time, written as a time and never buried inside the sentence;
- the recorded identifier, in small type, always after the readable name;
- the label saying whether this is a real public record, a modelled figure or
  simulated exercise data.

For a grouped beat, the code produces a short counting label such as "17
aftershocks". That label is a fragment, so it serves as a label and never as the
sentence on a card. The sentence comes from the copy deck and reads, for example:
"Between 17:00 and 18:00 the region recorded 17 aftershocks."

### Which events stay silent

Silence is a decision the template makes on purpose, because a card for every
event is the same as no cards at all.

- Individual aftershocks and individual road closures stay silent as individuals.
  They shake and they draw themselves in the world, and their hour speaks for
  them.
- Data-file loads stay silent as individuals, and the group of them shares one
  counted beat.
- Round grouping and rule evaluation stay silent entirely.

### An event with no map position still earns its card

Whether an event earns a card and where the camera looks are two separate
questions. `deriveActs` gives every official update a beat of its own, whether or
not that update carries a map position, so an official update is never silent.

In the seventy-two-hour Kumamoto run, eight events carry no map position. Four of
them load a data file and share one beat. The other four are the earliest agency
bulletins, ingested at 16:28, 16:29, 16:30 and 16:31 before the earthquake's exact
position was published, and each of those four gets a card of its own. Five beats
therefore end up with no camera anchor: the shared data-loading beat and those
four bulletin beats. The camera holds where it already is while such a card shows.

The derivation reports how many events carried no position, so that count is
checked rather than assumed.

## Part four: a decision moment shows what was known, what was chosen, and what else was possible

A decision card is the most important surface in the whole story, so its contents
are fixed. It has four parts, in this order.

1. **What was known at that clock time.** The observations available before the
   cutoff, named in plain words, and the unknowns stated as unknowns. The
   seventy-two-hour Kumamoto run records these explicitly, and a decision card
   that omits the unknowns is a defect.
2. **Who was deciding.** The decider's title in plain words, for example
   "Commissioner of the Fire and Disaster Management Agency".
3. **What was chosen.** The assignments in plain words, with readable names first
   and recorded identifiers in small type after them.
4. **What else was possible.** The other choices recorded for this moment, and,
   where the record holds one, the real historical choice marked plainly as the
   real choice.

Two further lines stand on every decision card.

- **The cutoff clock**, stating the moment after which no information was allowed
  into the decision.
- **The declared assumptions** for that moment, quoted from the scenario file.

One rule governs the whole card: no fact from later in the timeline may appear on
it. A decision card showing something the decider could not have known is a
hindsight failure, and the recorded runs already count hindsight violations so
this can be checked rather than trusted.

## Part five: the closing debrief states the outcome in sentences a stranger can repeat

When the run ends, the world dims and the debrief rises. Its order is fixed,
because the order is what makes the story land.

1. **The finding sentence.** One sentence. It states what was found, precisely,
   without expanding it into a broader claim than the recorded run supports. The
   worked example from the two-desk exercise reads: "In the simulation, the desk
   that checked its evidence reached 77 simulated people. The desk that trusted
   the loudest report reached 60. The difference was one unchecked claim." Both
   desks are ours, so this comparison is a finding.
2. **The numbers.** Each one states what it counts. Each one carries its
   denominator where it has one. Every grade among them is said in the exact
   words fixed in part six.
3. **The beat cards.** Three cards where a comparison exists, in the order cause,
   choice, consequence. Where no comparison exists, three to five cards naming the
   run's own turning points. Every card can be clicked to fly the camera to where
   that beat happened and replay it.
4. **The use card.** One sentence naming two or three real jobs where the finding
   could be useful. This is step eight of the required storytelling order.
5. **The limitation card.** One sentence stating what the run has not shown.
6. **The next-experiment card.** One sentence naming the exact next experiment.
7. **The three-angle line.** One sentence carrying all three angles together, as
   the project covenant requires.
8. **The honesty line.** One sentence stating that every number came from one
   recorded file, and naming how many events that file holds.

## Part six: where every score appears when a run carries scores

This is the part that did not exist before this document. A run that carries
outcomes and scores puts each number in exactly one of three places, and a number
in the wrong place either misleads a viewer or gets lost.

### The four kinds of number a run can carry

| Kind | What it counts | Where it lives in the recorded run | Example from a real recorded run |
| --- | --- | --- | --- |
| Reach | Simulated people a method reached for assessment. | Its own `METRIC_UPDATED` event. | 77 simulated people reached by the desk that checked its evidence; 60 by the desk that did not. |
| Check | Decisions that passed every prewritten check for their moment. | A `fully_valid` field on each recorded choice held inside a `DECISION_PROPOSED` event. | 0 of 40 for the plain summary method, 17 of 40 for the evidence-table method, 34 of 40 after one correction message. |
| Limit | Decisions that stayed within the exercise's hard resource limits. | A `constraint_pass` field on the same recorded choice, beside a `violations` list naming each rule broken. | 37 of 40, 33 of 40 and 34 of 40 for the same three methods. |
| Repair | First answers that missed a check, and that one correction message put right. | Computed by comparing the first and the final recorded choice of one configuration. | 17 of 23 repaired, with no already-passing answer broken. |

The names in the first column are this document's internal names for the four
kinds. What a viewer reads is fixed separately, by the wording rules below.

Reach lives in one kind of event and the other three live inside another, so a run
can carry either kind on its own. Neither of the two recorded runs in the
repository today carries both. The 81-event two-desk exercise holds 6 metric
events and no decision score of any kind. The sealed 414-event run holds no metric
event and 384 recorded choices that each carry validity and constraint fields.

Before writing any story, read the run and answer two questions separately: does
this run carry a reach metric, and does this run carry decision scores? The
answers decide which of the rules below apply, and assuming one answer from the
other is the mistake this section exists to prevent.

### Every grade is said in these exact words

Codex proposed this wording on the board in message 1066 and it was adopted
verbatim in message 1068. These sentences are normative. A builder shows a grade
using them, and writes no substitute of their own.

**The aggregate line**, for one method over many tries:

> In 34 of 40 tries, this method produced a decision that passed every prewritten
> check.

**The definition line**, which stands wherever the aggregate line first appears,
so a viewer knows what passing means before reading any number:

> Passing every check means it used only allowed units and places, stayed within
> resource limits, cited information available by the deadline, named required
> unknowns, and used nothing learned later.

**The three badges**, one of which sits on every recorded choice:

> passed every prewritten check

> did not pass every prewritten check — [named rule]

> descriptive only — outside the registered result

The third badge belongs on any choice outside the registered result, such as the
six decision moments of the sealed run that carry no registered claim.

**The resource-limit line:**

> 34 of 40 stayed within the exercise's hard resource limits.

**The standing limitation**, which stays visible wherever any grade shows:

> These checks measure traceability and rule-following inside the exercise. They
> do not grade the real responders or prove that an agent's judgment was better.

**An impact sentence** always opens inside the simulation and carries its unit:
"In the simulation, this choice reaches 77 simulated people." The assumptions
behind that number stay on screen with it.

**The phrase "completely right" is banned** as a description of a decision that
passed every check, on every surface and in every document. Passing the checks
means the five things the definition line lists, and it carries no claim about
whether the decision was wise.

Two strings already in the copy deck need the matching amendment before the next
build ships. The debrief outcome sentence takes the "In the simulation" opener
required of every impact sentence. Any surface still carrying "completely right"
takes the badge wording instead. Those edits belong to
`docs/rescueworld/theater-copy.md` and to the runtime copy, and this template
records the requirement rather than making the change.

### During play, the outcome display carries reach, and the decision beats carry their own results

The outcome display sits at the edge of the screen and is closed by default,
showing a short label of four words. Where the run carries a reach metric, opening
the display shows three things in this order: the verdict sentence, then the reach
counts, then the honesty line. The worked example already in the copy deck opens
with the sentence and puts the numbers under it.

Where the run carries no reach metric, the outcome display shows the run's scale
instead: how many recorded events have played so far, out of how many, and how
many decision moments have passed. It shows no rate and no invented count.

Check rates, limit rates and repair rates stay off the screen during play. A rate
computed from a run that is still playing is a partial rate, and a partial rate
presented as a result misleads a viewer. One exception is allowed, because it is a
fact about one beat rather than a running total: a decision beat may carry one of
the three badges for that single choice, naming the rule where a check was missed.
The standing limitation stays visible wherever such a badge shows.

### At the end, the debrief carries every kind the run actually holds

The debrief states the numbers in this order, leaving out only the kinds the run
does not carry.

1. The headline number inside the finding sentence, with what it counts.
2. The reach counts for every method, where the run carries a reach metric, each
   opening inside the simulation.
3. The definition line, then the aggregate line for every method, each with its
   denominator.
4. The resource-limit line for every method, each with its denominator.
5. The repair count, with how many first answers had missed a check.
6. Every registered rule that failed, named, at the same size as the rules that
   passed.
7. The standing limitation, which is the first sentence of the limitation card
   whenever the debrief showed any grade.

A score the run carries is never left out of the debrief. Decision scores are held
inside decision events rather than in metric events, so they are easy to miss when
a writer looks only at the metric stream. Missing them hides the findings the
graphics processors produced, which is the one thing the debrief exists to
deliver.

### In a comparison, the moment card carries the one number that changed

When two runs are compared, each moment where they chose differently gets a card,
and that card carries exactly one number: the number that differed because of that
choice. Loading the whole score table onto a moment card destroys the moment. The
full table belongs in the debrief.

### The honest-labelling rules, restated as template requirements

These are `docs/rescueworld/SPEC-2.md` section 5 and the experience proposal's
claim boundaries, restated as things a story must do.

1. **A comparison against the real response is always presented as a simulated
   counterfactual, with its assumptions listed on screen at that moment.** The
   standing assumption line accompanies every comparison surface, and is never
   optional and never abbreviated.
2. **The real response is a run, and never a benchmark.** It is rendered with the
   same care as any other run. No visual and no sentence may set it up to lose,
   and no sentence ranks any agent method against the people who responded to the
   real earthquake.
3. **No sentence claims the real responders erred.** The only permitted claim form
   is: with this information, this method chose differently, and in the simulation
   that choice reaches more people.
4. **No lives-saved claim, ever.** Reach counts are simulated people reached for
   assessment. The word "saved" appears nowhere in any story string.
5. **No claim of predictive power about future disasters.**
6. **Every number is quoted from the recorded file or the scenario file.** Every
   simulated figure carries the simulated stamp, and every modelled layer carries
   the modelled label, wherever it appears.
7. **A registered claim that failed is reported as failed, at the same size as one
   that passed.** The frozen Kumamoto experiment produced a mixed result, and both
   halves get told.
8. **Numbers that were never registered as claims carry the words "descriptive
   only" and never enter the finding sentence.** Historical-overlap counts are the
   standing example: they describe how often a method's choice matched the real
   choice, and they are no evidence that either choice was better.
9. **A grade is said in the exact words fixed above, and it measures traceability
   and rule-following inside the exercise.** The phrase "completely right" is
   banned. The word "confidence" never labels a grade, a badge or a number.
10. **Where a real choice and an agent choice appear on the same surface, the real
    choice comes first and carries equal visual weight.** The standing limitation
    stays visible on that surface. A side-by-side presentation of the two is
    allowed only under those three conditions, and this is the one place the
    never-side-by-side rule for comparing two runs does not reach, because it
    governs two runs of our own rather than the record beside a method.
11. **Comparing our own methods against one another is a finding, and comparing
    any method against the real responders is not.** Plain summary against
    evidence table against the correction loop is our own experiment, and it
    carries real results.

### The two missing-number cases, which are separate

A run can be missing a reach metric, missing decision scores, or missing both.
Each absence has its own rule, and treating one absence as the other is a factual
error about the record.

**Case A: the run carries no reach metric.** The story never shows a
people-reached number, never converts anything into people, and never states a
comparison verdict about reach. In place of the reach line, the outcome display
and the debrief state the run's scale in complete sentences. They say how many
recorded events the viewer watched and over how many hours. They say how many
decision moments the run holds, and how many aftershocks, closures, official
updates and named moments it recorded.
A story that fabricates a count is a worse failure than a story that
has no count, so the missing number stays absent and the scale sentence stands in
its place.

**Case B: the run carries no decision scores.** The story shows no validity rate,
no constraint rate and no repair count, and no decision beat carries a result
badge. The decision cards still show what was known, who decided, what was chosen
and what else was possible, because those come from the scenario rather than from
a checker. The preserved two-desk exercise is in this case: it carries reach
metrics and no score field anywhere in its 81 events.

**A run in case A is not thereby in case B.** The sealed 414-event Kumamoto run
carries no metric event at all, so case A applies to it in full. It also carries
384 recorded choices, each holding a validity field, a constraint field and a list
of the rules broken, so case B does not apply to it and its debrief states those
scores. Reading its empty metric stream as an absence of scores was the mistake
that this rule exists to prevent, and it hid the findings the graphics processors
produced.

## Part seven: a second run enters the same world, and never sits beside it

Comparison happens inside one world. Splitting the screen is banned by the process owner’s
standing rulings and by the specification. `SPEC-2.md` names the moments where two
runs chose differently with a word that copy-contract rule 5 bans from screen
text, so on screen those moments are always called moments where the two runs
chose differently.

This part governs two recorded runs shown against each other. Showing the real
recorded choice beside one method's choice on a single evidence surface is a
different thing, and honest-labelling rule 10 governs it: the real choice comes
first, both carry equal visual weight, and the standing limitation stays visible.

Three mechanisms, all built on the same moments:

1. **Ghost echoes.** While watching the first run, at each moment where the runs
   chose differently, the other run's choice appears as a spectral marker and
   route for the length of that beat, then goes. Its line names the other run and
   what it did.
2. **The world swap.** One key exchanges the world state in place. Same camera,
   same clock, the other run's reality fades in with its name stamped on it. A
   viewer sees the difference by flicking between them.
3. **The debrief list.** The debrief lists every moment where the two runs chose
   differently, each one clickable to fly there and replay it.

### What the card at such a moment must say

Six things, in this order, and nothing else:

1. the clock time and the place;
2. what both runs knew at that moment, in one sentence;
3. what the first run chose;
4. what the second run chose;
5. the one number that differed, stating what it counts;
6. the standing assumption line saying the comparison is a simulated
   counterfactual whose assumptions are listed in the menu.

Pairing two runs is mechanical rather than hand-written. It needs the identity
keys required by `SPEC-2.md` section 2 item 7: a run identifier, plus equality
keys for the scenario, the observation set, the resources and the decision slots.
Until those keys exist for a pair of runs, that pair is compared by hand, and the
story says so.

## Worked example one: the seventy-two hours at Kumamoto, a run with decision scores and no reach count

The run is `product/disaster-replay/runs/kumamoto-2026-full-incident/260728-72h/`,
sealed at 414 events covering three days. It is in case A and outside case B: it
holds no metric event, so no reach count exists anywhere in it, and it holds 384
recorded choices whose validity and constraint scores its debrief must state.

**The opening card.** "On 28 July 2026 at 16:27, an earthquake of magnitude 7.1
struck Kumamoto Prefecture in southern Japan, and the Japan Meteorological Agency
recorded its strongest shaking as 7 on that agency's intensity scale." The
situation sentences that follow say that the first official bulletins carried no
magnitude at all, that two high-risk towns had no shaking value recorded for them,
and that agencies had to move units before any of that was resolved. That is the
human problem and the question, which is step one of the required order.

**The four acts, as the scenario file declares them.**

| Act | Story sentence, quoted from the scenario file | Events |
| --- | --- | ---: |
| Hour one | The regional signal arrives before the damage picture, and missing towns become part of the evidence. | 51 |
| The first night | Fire, defense and liaison chains follow different signals while two collapse sites and a failed dispatch system define the night. | 188 |
| Day two: the water crisis | The aggregate picture arrives, rescue assignments move, shelters pulse and water support changes from requests to regional push. | 109 |
| The turn | Active rescues continue as the centre of gravity turns toward water and one final search meets the seventy-two-hour boundary. | 66 |

Applying the three cutting rules to those 414 events produces 161 beats: 32 in
hour one, 48 in the first night, 40 in day two and 41 in the turn. The run holds
11 decision moments, 68 named moments, 300 aftershocks grouped into hourly beats,
23 road closures grouped the same way, 7 official updates and 4 data-file loads.

**Three sample beat sentences, all quoted from the record.**

- A named moment in hour one, at 16:27:30: "Five local and prefectural
  headquarters stand up in the earthquake minute." The supporting line names
  Kumamoto and Nagasaki prefectures, Yatsushiro City, Nishiki Town and Yunomae
  Town.
- A decision moment in hour one, at 16:27:59: "Choose the first outside fire
  package before a public bulletin exists." The decider is the Commissioner of the
  Fire and Disaster Management Agency, and the card states two unknowns: the
  report does not say which legal paragraph was used, and the readiness of the
  units that were not chosen is not public.
- A grouped beat in the first night, covering the hour from 18:00: "Between 18:00
  and 19:00 the region recorded 18 aftershocks." The short label on the running
  order reads "18 aftershocks".

**The scores this run actually carries.** Each of the 11 decision events holds 24
recorded choices, which is 264 choices in total, and each choice carries a
`fully_valid` field, a `constraint_pass` field and a `violations` list naming every
rule it broke. Five of the 11 decision events additionally hold 24 registered
choices each, which is 120 more, and those five are the frozen experiment. Across
the 264 descriptive choices, each method answered all 11 moments 8 times, giving
88 answers per method:

| Method | Passed every prewritten check | Stayed within hard resource limits |
| --- | ---: | ---: |
| Plain summary | 0 of 88 | 84 of 88 |
| Evidence table | 57 of 88 | 85 of 88 |
| Evidence table plus one correction message | 81 of 88 | 85 of 88 |

Every one of those numbers is marked descriptive only in the record itself, under
the labels `RECORDED_MODEL_COUNTERFACTUALS_DESCRIPTIVE_ONLY` and
`DESCRIPTIVE_ONLY_NO_REGISTERED_CLAIMS`, so every choice among them carries the
badge "descriptive only — outside the registered result" and none of them enters
the finding sentence.

**The debrief.** Case A applies, so the debrief states no reach count and opens on
a scale sentence: "This run replays 414 recorded events across the first
seventy-two hours after the earthquake, including 11 decision moments, 300
aftershocks and 7 official updates." Case B does not apply, so the debrief then
gives the definition line, the three aggregate lines above with their
descriptive-only badge, and the resource-limit lines, and points at the five
moments whose registered results are worked example two. The limitation card opens
on the standing limitation, then states that this run measures no method's reach
against another's and that the descriptive counts support no registered claim. The
next-experiment card names the registered five-moment comparison.

**The order check.** The opening card carries the problem and the question. The
beats are the concrete example, at named places on the map. The first decision
beat states what the record shows agencies doing and what they could not check.
The failures stay in the running order, including the failed dispatch system named
in the second act's own story sentence. The debrief gives the exact scale, gives
the decision scores the run carries, states the finding without expanding it, and
ends with the limitation and the next experiment.

## Worked example two: the registered five-moment comparison, told as a scored story

The frozen experiment in `experiments/kumamoto-real-response/PRODUCTION-RESULTS.md`
graded three decision methods across five of this incident's decision moments,
over eight seeds, producing forty paired configurations per method. Its numbers
are recorded inside the same sealed run, on the five decision events it covers,
under the frozen manifest `d033786d42717b6aa4bcbaabc139cd813563959f57deccdc52df0d63ae8c0160`.

This example is the same run as worked example one, told with a narrower subject.
Example one tells all 11 decision moments and states their descriptive counts.
Example two tells the 5 moments that carry registered claims, whose numbers can
enter a finding sentence. A future run recorded by a new method flows through this
same shape, and where it also carries a reach metric, that number goes where parts
five and six place it.

**The opening card.** Unchanged, because the incident is unchanged. One sentence
is added to the situation paragraph naming what is being compared: three ways of
handing information to a decision maker.

**The beats.** Unchanged in shape. Five of the eleven decision beats now carry
either "passed every prewritten check" or "did not pass every prewritten check",
followed by the named rule where a check was missed. The other six decision beats
carry "descriptive only — outside the registered result", and those never enter
the finding sentence.

**The moments where the methods chose differently.** Each one gets a card naming
the clock time and the place, what all three methods knew at the cutoff, what each
chose, and the single number that changed. The clearest is the water-planning
moment on the second day, where the plain summary stayed within the hard resource
limits in 5 of its 8 tries and the evidence table in 1 of 8.

**The debrief.**

1. The definition line, first, so the reader knows what passing means: "Passing
   every check means it used only allowed units and places, stayed within resource
   limits, cited information available by the deadline, named required unknowns,
   and used nothing learned later."
2. The finding sentence: "One mechanical correction message raised the number of
   decisions that passed every prewritten check from 17 of 40 to 34 of 40, and put
   right 17 of the 23 first answers that had missed a check, breaking none of the
   answers that already passed."
3. The aggregate lines: "In 0 of 40 tries, the plain summary produced a decision
   that passed every prewritten check." Then 17 of 40 for the evidence table, and
   34 of 40 for the evidence table with one correction message.
4. The resource-limit lines: 37 of 40, 33 of 40 and 34 of 40 stayed within the
   exercise's hard resource limits, for the same three methods in the same order.
5. The repair count: 17 of 23 first answers that had missed a check were put
   right, using no more than one extra call.
6. The rule that failed, at the same size as the rules that passed: the evidence
   table's resource-limit rate fell 10 points below the plain summary, and the
   registered limit was 5 points, so that registered claim failed even though its
   four other rules passed.
7. The use card, naming jobs where the finding could be useful, such as incident
   response and any review where a conclusion must point at an exact source.
8. The limitation card, opening on the standing limitation: "These checks measure
   traceability and rule-following inside the exercise. They do not grade the real
   responders or prove that an agent's judgment was better." Then the scope: "One
   open model was tested on five reconstructed decision moments over eight seeds."
9. The next-experiment card, naming the exact next test, which is separating the
   two ingredients that the winning method combined.
10. The three-angle line and the honesty line.

**The order check.** The problem and the question open it. The concrete example is
the five decision moments at real places. The baseline is stated with its failure
mode: in 0 of 40 tries did the plain summary produce a decision that passed every
prewritten check, and it missed the communication check every time. The failures
stay in, including the registered claim that failed. The result is exact and
carries its denominators. The finding compares three methods of ours against one
another and ranks none of them against the real responders. It ends with the
limitation and the next experiment.

## The acceptance bar: nine questions a stranger answers from the played story alone

This test is reproduced word for word from
`docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md`. Before a story ships, a person
who has never seen the project watches the run once and answers these questions
using only what they watched.

- What real problem were we trying to solve?
- What exactly did the agents have to do?
- What was the normal workflow?
- What did we change?
- What failed along the way, and what did that teach us?
- What exact result did the final test produce?
- Why does that result matter outside the experiment?
- What have we not proven yet?
- What should we test next?

If the person cannot answer all nine, the story is not finished. A run carrying no
scores answers question six with its scale sentence, and answers question eight by
saying that no method was measured against another in this run.

## Every masthead and every debrief carries all three angles together

The project covenant requires three angles in every headline, masthead, summary
and report: the disaster simulation, the fleet of artificial-intelligence agents,
and the growth intelligence with its organism named in plain words. Two of the
three is a defect.

Applied to stories, the rule lands in two fixed places: the masthead that stands
for the whole run, and the debrief that closes it. The worked line already in the
copy deck carries all three in one sentence: "One earthquake replayed over real
Kumamoto ground; a fleet of artificial-intelligence agents reading the reports,
deciding and dispatching; an evidence table grown the way a lichen grows, with
claims on one side and sources on the other so neither can spoil the other."

A new run writes its own three-angle sentence in the same form: the incident, the
agent fleet and what it does, and the organism whose behaviour the method borrows,
with what that behaviour does in ordinary words.

## How to apply this template to a new run

An engineer with a newly recorded run follows this checklist.

**1. The scenario file declares these things.**

- A scenario identifier, and a title written as a readable phrase a person can say
  out loud.
- The incident block: the clock, the position, the magnitude and the intensity, so
  the opening card is derived rather than typed.
- The acts: three to five entries, each with an identifier, a label of one to four
  words, a start clock, an end clock and a story sentence.
- The decision slots, each with a title written as a plain instruction, the
  decider's title, the cutoff clock, the declared assumptions and the recorded
  unknowns.
- The disclosure sentence and the limitations, which become the data-honesty line
  and the debrief's limitation card.
- The data sources with their classification, so every surface can label itself
  real, modelled or simulated.

**2. What `deriveActs` produces without any hand work.**

- The act windows, each with its first and last event, its event count and its
  real clock span.
- The beat cut inside each act, following the three cutting rules.
- A plain-English label on every beat, taken from the record's own headline,
  decision title or count.
- A camera anchor for every beat and every act, computed as the mean of the map
  positions the beat's events carry, with positions outside the delivered terrain
  excluded and counted.
- A count of events that carry no map position, so that count is checked rather
  than assumed.
- The opening beat, with the series of official revisions to the main shock and
  the aftershocks that arrived before the last revision.

**3. What goes through the copy deck.**

Every string a viewer can read goes through the copy deck. That covers the opening
card and its control, the masthead and its three-angle line, the act titles and
their story sentences, and every sentence on a beat card. It also covers every
decision card, every outcome line, every comparison line with its standing
assumption line, the whole debrief, the help text, and every error state.
A builder who finds a surface with no string does not invent one. The string is
added to `docs/rescueworld/theater-copy.md` first, derived from the recorded
events, and the surface then reads it from there. Three rules govern any such
edit: no invented place names, every number quoted from the record, and no
sentence claiming that anyone was rescued or that any real responder erred.

**4. Run the three integration checks, described next.**

## What the three integration checks verify

The current implementation is `app/scripts/verify-full-incident-viewer.mjs`, which
prints one pass line per check.

**Check one: the recorded run reaches the viewer unchanged.** The delivered file
names the sealed timeline's hash, holds every sealed event, and every event is
byte-identical to the sealed one in the same order. A story told from a changed
record is no replay at all.

**Check two: the story spine is complete.** The opening event exists and carries
the incident's magnitude, intensity and position. Every event lands in a declared
act. Every decision moment has a beat of its own. The counts of decisions, named
moments, official updates and recorded choices match the sealed record exactly.

**Check three: every beat can be looked at, and every string is accounted for.**
Every event that deserves a camera has either a map position or a named target.
Every map position the story points a camera at falls inside the terrain the
viewer actually delivers. Every string on screen exists in the copy deck, and
every number on screen is traceable to the recorded file or the scenario file.

A pass on these three proves the data contract. The story's readability is a
separate question, so the nine-question acceptance test above stays the human
gate, and a full walkthrough in a real browser stays the visual gate.
