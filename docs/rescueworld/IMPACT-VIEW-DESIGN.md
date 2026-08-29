# The impact view: how each orchestration method changed the modeled outcomes

Status: design agreed with Codex on 2026-08-27 (its six corrections folded in).
Builds after the continuous campaign has run; nothing here changes the
visualizer.

## What Randy asked for

After the new GPU runs, a picture that compresses "which orchestration method
changed the modeled disaster outcomes, and by how much" into something a person
understands at a glance — drawn in the same visualizer as the other trees, not
a chart.

## What the picture shows

The same canvas run tree, reused exactly, with its data seam pointed at the
continuous campaign's analysis output (the sealed per-slot results, checkpoints,
and the impact engine's counts from `experiments/kumamoto-continuous-campaign/`).

- Root: the earthquake at 16:27 on 28 July 2026.
- One branch per orchestration method, in the protocol's order: fixed coverage,
  guarded growth, evidence state, evidence feedback.
- Each branch has ten chronological tiers, not eleven: decision slots 6 and 8
  form one atomic 20:00 tier holding two records, because the protocol runs
  and admits them together.
- A fifth branch for the public record, run through the same impact engine, is
  labeled "what the record shows — not a score" wherever it appears. It is a
  comparator, never the benchmark of success.
- Node state is playback only (pending, running, done). A proposal the
  campaign's deterministic admission gate did not admit does not prune or stop
  the branch: its node is labeled "not admitted; the campaign continued from
  the prior state," and the later decisions continue along the branch.
- The gem tag on each node is the method's action at that moment in plain
  words (who was sent where, how many), from the same action-sentence logic the
  ledger uses. The verbs distinguish three things: what the method proposed,
  what the admission gate admitted, and what the public record shows was done.

## One view is one seed

Production runs eight seeds, 51201 through 51208. One view is one matched
seed across all four methods; the New run control cycles through the eight
seeds in order. Actions are never averaged into an invented chain. A separate
aggregate summary may show the paired mean, median, and range of the impact
counts across seeds, clearly labeled as an aggregate. The smoke seed 51002
never enters this view.

## The compression, in the four counters and the readout

The four sidebar counters carry scenario impact for the selected branch, read
from the impact engine's output and never computed in the page: urgent unmet
demand-hours so far; modeled demand coverage so far (at the end of the run,
the 72-hour coverage); urgent demand units still open; and waste units.
Admissions, model calls, and tokens stay in the detail readout, not the
counters.

Each counter is one field of `impact_engine.impact_view`, in that order:

| Counter on screen | Field |
| --- | --- |
| urgent unmet demand-hours so far | `urgent_unmet_demand_hours_so_far` |
| modeled demand coverage so far | `modeled_demand_coverage_so_far` |
| urgent demand units still open | `urgent_demand_units_still_open` |
| waste units | `waste_units` |

The first counter is the hours urgent demand has actually waited by the moment
on screen. The engine also carries `urgent_unmet_demand_hours_projected_72h`,
the same demand carried to the 72-hour close as though nothing served it after
this moment. That projected number is the registered primary outcome and the
one the aggregate pairs; the counter beside the picture is always the so-far
number.

The headline line states the method effect as the selected method against the
fixed-coverage control on the primary measure, for this seed: "Guarded growth,
seed 51203: 14 urgent demand-hours unmet by hour 40, against 22 under fixed
coverage." The public record's count for the same measure appears beside it,
labeled "the record shows 31 — not a score."

The bottom readout for a selected node shows the proposed action, whether the
admission gate admitted it, the impact change at that moment (which demands it
served, which it left open, what it wasted), and "Full detail: the campaign's
result file for this slot" as the evidence pointer. Each of those is a field of
the same node: `actions` (each with `subject`, `verb`, `quantity`,
`destination`, `sentence` and `supporting_observation_ids`), `admitted` with
`admission_note`, `impact_delta`, `served_demand_ids`, `open_demand_ids`,
`waste_units_at_this_moment`, and `evidence_pointer`. The node's `gem_tag` is
the first action's sentence. The paired seed summary is
`aggregate_across_seeds`, with one `paired_differences` row per seed and the
`mean_difference`, `median_difference` and `range_difference` beside it.

## What stays honest

- Every number comes from the frozen demand registry and the sealed run; the
  page computes nothing.
- The persistent limitation line reads: "The AI proposals never changed the
  real event stream. Every impact shown is modeled demand coverage, delay, or
  waste, computed from the sealed record."
- The picture never says people served or lives saved; the protocol forbids it.
- Methods are compared on the primary measure only in the headline; the
  secondary measures stay in the readout.

## Build order

1. The campaign's analysis output lands with its schema documented in the
   tier's README.
2. A bake script under `app/scripts/` reads that output through the tier's own
   loaders and writes `app/public/impact-view-data.json`, one entry per seed
   and method, with a check mode bound to the campaign certificate hash.
3. `app/public/impact-view.html` is a byte-for-byte copy of the canvas
   component except inside the data seam, with the one approved exception
   (the timeline overlay; the owner tints are board-only and do not apply).
4. Codex audits wording, truth, and rendering identity, then cold-reads it.
