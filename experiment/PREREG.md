# Kumamoto real-response graph test — pre-registration

Status: **AMENDED AFTER THE EXCLUDED SMOKE; PRODUCTION HAS NOT STARTED.** The original protocol was
frozen before model inference and independently countersigned by Claude on the shared board in
message 729. Amendment 1 below is limited to a diagnostic-message defect found by live seed 51000;
Claude independently confirmed the defect and approved that exact repair in messages 766 and 767.

This document freezes the question, inputs, graph arms, model, sampling plan, measurements and
decision rules before an open model sees any of the five tasks. A one-seed live smoke test may run
only after the protocol and runner are hash-bound and countersigned. Smoke data are engineering
evidence only and never enter the reported experiment.

## The question in plain English

We reconstructed five decisions that real responders faced during the 2026 Kumamoto earthquake.
At each moment, the model receives only information that was public by that clock time. We ask the
same open model to make the same decision through three orchestration graphs:

1. a normal graph in which specialist agents pass prose summaries to a coordinator;
2. an evidence graph that carries observations, sources, times and unknowns in typed rows; and
3. that same evidence graph with one tightly constrained correction loop.

We are testing communication between agents, not whether AI would have saved more people. The
central question is whether the evidence-preserving handoff produces more decisions that can be
traced to the information available at the time and obey the resource rules. The feedback question
is narrower: when the checker finds a specific mechanical mistake, can one bounded return message
repair it without adding facts or changing the task?

## Frozen world and source boundary

The only world definition is
`product/disaster-replay/scenarios/kumamoto-2026-real-response/scenario.json`, scenario ID
`kumamoto-2026-real-response-five-slot-v1`. The freeze manifest will bind its full-file hash and the
four identity hashes printed by `verify-real-response-scenario.mjs`.

The five frozen decision slots are:

| Slot | Clock cutoff (JST) | Decision |
| --- | --- | --- |
| 1 | 2026-07-28 16:27:59 | choose an initial outside-fire-service package before a public bulletin |
| 2 | 2026-07-28 16:35:28 | assign two modeled verification priorities while two town readings are missing |
| 4 | 2026-07-28 18:10:00 | assign two municipal liaison pairs |
| 6 | 2026-07-28 20:00:00 | allocate five response groups across two reported collapse sites |
| 9 | 2026-07-29 12:00:00 | divide up to 22 additional water trucks |

Slots 1 and 2 contain explicit reconstructed exercise assumptions because the public record does
not expose the real internal trigger payload or a named missing-telemetry team. Those assumptions
remain visible in every arm and are limitations, not discovered facts.

For a slot, the agent-visible input is built only from its registered:

- task, cutoff and action contract;
- visible observations;
- eligible resources and targets; and
- required unresolved questions.

The serializer removes historical choices, later outcomes, forbidden-observation bodies, observed
mobilization times, and availability notes that reveal what responders later did. It also asserts
that every visible observation's `available_at` is at or before the slot cutoff. The real historical
choice is loaded only after inference for descriptive comparison.

## Matched specialist roles

Every logical run uses the same three specialist roles and one coordinator. Each role receives the
same underlying fields across graph arms:

- **incident reader:** the registered visible observations, including observation ID, public time,
  classification, source IDs, signal family, fact code, value, unit, caveat and plain-language text;
- **resource reader:** the task, eligible resources as ID/label/kind/capacity, eligible targets as
  ID/label/kind, and the action contract; and
- **uncertainty reader:** the visible observations plus the registered unresolved questions and
  declared exercise assumptions.

The coordinator receives the task and output schema in all arms, but receives the substantive case
through the three reader handoffs. This deliberately tests whether a graph passes important state
between agents. Raw prompts differ only where needed to request the arm's registered handoff form.
The same model, revision, temperature, seed, slot input, reader roles and call budget apply to the
matched prose and evidence passes.

## The three graph arms

### A. Normal summary graph

Each specialist returns an ordinary prose briefing. A fourth model call asks the coordinator to
make the decision from those three briefings. There is no compiler and no correction loop. Readers
may mention exact identifiers and times, but code does not restore anything they omit. Logical call
budget: four.

### B. Evidence-table graph

Each specialist returns typed claim rows. Deterministic code checks identifiers against the frozen
input, binds each retained observation to its registered source and time, preserves unresolved
questions separately, and marks an expected row as omitted if a reader failed to carry it. It never
adds an observation, assigns meaning with a language model, looks at the historical choice, or sees
later outcomes. A fourth model call asks the coordinator to decide from the compiled table. A
mechanical checker records violations but does not alter the answer. Logical call budget: four.

### C. Evidence table plus one constrained feedback loop

This arm reuses the exact readers, compiled table and initial coordinator answer from arm B. If and
only if the mechanical checker finds a registered violation, the same coordinator receives the
unchanged table, its original answer and a list of those violations for one revision call. No new
evidence, preference, recommended destination or historical answer may be added. If the first answer
passes, no call occurs and the initial answer is also the final answer. Logical call budget: four or
five; maximum one revision.

Sharing B's initial answer with C is intentional. It makes the feedback comparison exact: the only
new cause is the one bounded error message, not a different random sample.

## Common decision output

Every coordinator must return one JSON object with:

```json
{
  "assignments": [
    {"resource_id": "...", "target_id": "...", "quantity": 1}
  ],
  "used_observation_ids": ["..."],
  "acknowledged_unknown_ids": ["..."],
  "decision_factors": [
    {"observation_id": "...", "role": "SUPPORTS"}
  ],
  "short_reason": "..."
}
```

`role` is one of `SUPPORTS`, `CONTRADICTS` or `UNKNOWN`. The response schema is identical across
arms. It enforces JSON shape but does not enumerate valid scenario IDs; those are judged after the
answer so orchestration failures remain observable.

There are no retries in the registered experiment. A malformed or missing response is preserved as
an ungradable attempt. Transport-level request failure may be retried once with the identical body,
API seed and request ID; both attempts are logged and a changed body invalidates the run.

## Mechanical scoring

Code, not another language model, scores the registered outcomes. A decision is **fully valid** only
if every condition below passes:

1. the response is gradable JSON with the common schema;
2. assignment count, quantities, total capacity and resource-reuse rules satisfy the slot contract;
3. every resource and target ID is eligible for that slot;
4. at least one supporting observation is named;
5. every used observation and decision-factor ID is visible at the slot cutoff;
6. the decision-factor IDs and used-observation IDs match, without duplicate factors;
7. every registered required unknown is acknowledged; and
8. no forbidden observation ID or frozen hindsight fingerprint appears.

A **communication failure** is a gradable decision that fails any of conditions 3 through 8. A
**constraint failure** is a gradable decision that fails condition 2. An ungradable attempt is
reported separately and can never count as valid.

The primary outcomes are:

- fully valid decision rate; and
- communication failure rate.

Secondary outcomes are required-unknown coverage, unsupported or cutoff-invalid ID count,
constraint-pass rate, hindsight violations, model calls, input/output tokens and wall time. For the
feedback arm we also report initial-to-final repair rate, introduced-error rate and extra-call rate.

Historical-choice overlap is descriptive context only. It is not success, does not enter a pass
rule, and cannot establish that simulated decisions were better. Later deaths, damage, rescues and
service totals never score an earlier decision. We will not report “lives saved,” claim that real
responders were wrong, or turn an allocation difference into a real-world outcome claim.

## Model, sampling and execution

- Model: `Qwen/Qwen3-32B-AWQ`
- Revision: `0499c3ac83fdef8810b907a23894ba91e95eddd8`
- Serving: local vLLM OpenAI-compatible endpoint on the assigned GPU server
- Temperature: `0.2`
- Top-p: `0.95`, sent explicitly in every request and recorded in the freeze manifest
- Production sampling seeds: `51101` through `51108`
- Live smoke seed: `51000`, excluded from all reported outcomes
- Slots per production seed: five
- Paired decisions per arm: 40

For each seed, the same API seed is used for corresponding specialist and coordinator roles. The
logical result order cycles through all six permutations of the three arm labels. The two physical
initial passes alternate prose/evidence order by paired cell; feedback is derived from the shared
evidence pass and therefore has no separate initial-pass order. A paired cell's arms run on the same
endpoint; cells may be distributed across four endpoints. The prose pass needs 160 model
calls. The shared evidence pass needs another 160. Feedback adds zero to 40 calls, for 320 to 360
physical calls total.

The smoke run executes all three arms on all five slots for seed 51000. It tests redaction, endpoint
identity, schemas, logging, scoring and the one-loop ceiling. Its outcomes must not be used to change
thresholds. A genuine implementation defect may be repaired only through a dated amendment, new
hashes and a new independent countersign before production inference.

## Frozen decision rules

The experiment supports the evidence-table claim only if all of the following hold across the 40
paired decisions:

1. all 120 logical arm outputs are gradable and all matched identity checks pass;
2. evidence-table fully-valid rate exceeds normal-summary rate by at least 15 percentage points;
3. a 10,000-repetition paired bootstrap 95% interval for that validity-rate difference excludes
   zero;
4. evidence-table communication failures are no more than half the normal-summary failures; and
5. evidence-table constraint-pass rate is no more than 5 percentage points below normal-summary.

If the normal graph produces fewer than four communication failures, the factor-of-two claim is
underpowered and cannot pass, even if every other condition succeeds.

The experiment supports the bounded-feedback claim only if:

1. final feedback fully-valid rate is at least the evidence-table initial rate;
2. the loop repairs at least half of mechanically invalid initial evidence decisions;
3. it introduces zero new violations into initially valid answers;
4. it uses no more than one extra call and no new evidence in every case; and
5. its median total output tokens are no more than 1.5 times the evidence-table median.

If fewer than four initial evidence answers are mechanically invalid, the repair-rate claim is
underpowered rather than passed. Missing a threshold is a failed registered claim, not a reason to
change the rubric.

## Identity, audit and release rules

Every result record must include the scenario, observation, resource, decision-slot, protocol,
runner, prompt-template and model-revision hashes; endpoint identity; slot; arm; seed; role; request
body hash; raw prompt; raw response; parsed output; timing; tokens; checker findings; and parent
evidence-run ID for feedback. Cross-arm scenario/input hashes must match exactly.

The freeze manifest is generated only after tests pass. Claude and Codex must independently verify
the source boundary, redaction, identity hashes, scores and result counts. No measured number enters
the product or exhibition until both audits pass. A null, underpowered or negative result is kept and
reported with the same prominence as a success.

## Amendment 1 — 2026-08-23, after excluded smoke and before production

The excluded seed-51000 smoke completed five certificate-valid configurations with no transport,
schema, redaction, identity or hindsight failure. It also exposed one implementation defect in the
bounded-feedback mechanism. In slot 9, an otherwise legal 22-truck allocation included one row with
quantity zero. The checker correctly rejected that row under `CONSTRAINT_QUANTITY`, but the emitted
detail said only `quantities sum to 22`. A total of 22 is permitted, so the feedback call was told a
true constraint failure using a description of something legal and repeated the unchanged answer.

Claude independently reproduced this finding from the artifact and scorer in board messages 766 and
767. The authorized repair is exactly this:

- a zero or negative quantity retains the same `CONSTRAINT_QUANTITY` code and invalid outcome, but
  its detail names the offending assignment, its value and the requirement that quantity be at
  least 1;
- a total above the registered maximum retains the same code and reports both the sum and maximum;
- the scoring boundary, response schema, prompts, graph arms, model, sampling settings, seeds, arm
  rotation, source boundary, thresholds and decision rules do not change.

The original smoke remains immutable engineering evidence in `results/smoke-51000-initial/`. The
pre-amendment manifest remains beside the amended manifest so its certificates remain independently
checkable. Production remains forbidden until the amended runner has new hashes, Claude has
countersigned those exact hashes, and seed 51000 has completed one clean amended smoke.
