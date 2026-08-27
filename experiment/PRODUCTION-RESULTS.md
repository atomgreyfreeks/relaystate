# Kumamoto real-response graph test — frozen production results

**Status:** Production and dual audit complete under protocol v1.1. Codex
validated the full artifact set; Claude independently reproduced every
registered figure and countersigned the mixed verdict in board message 792.

**Frozen manifest:**
`d033786d42717b6aa4bcbaabc139cd813563959f57deccdc52df0d63ae8c0160`

## Result in plain English

The experiment produced a mixed result and the two registered claims must be
reported separately.

- The evidence-table claim **failed**. The evidence table raised fully valid
  decisions from 0/40 to 17/40 and cut communication failures from 40/40 to
  19/40, but its constraint-pass rate was 82.5% versus 92.5% for the plain
  graph. That 10-point drop exceeded the frozen 5-point non-inferiority
  margin, so the whole claim fails even though its other four rules pass.
- The bounded-feedback claim **passed**. One mechanical feedback call raised
  the evidence path from 17/40 to 34/40 fully valid decisions, repaired 17 of
  23 invalid initial decisions, introduced no errors into initially valid
  decisions, stayed within one call, and kept the median output-token ratio
  below the frozen ceiling.

These are communication and constraint results inside a reconstructed,
simulated exercise. They are not evidence that an AI system would improve a
real disaster response or save lives.

## Execution integrity

| Check | Result |
| --- | ---: |
| Production seeds | 51101–51108 |
| Decision slots per seed | 5 |
| Paired configurations | 40/40 certificate-valid |
| Logical outputs | 120/120 gradable |
| Physical model calls | 343 |
| Valid JSON call responses | 343/343 |
| Transport retries or recorded errors | 0 |
| Hindsight violations | 0 |
| Configurations per endpoint | 10, 10, 10, 10 |
| Explicit temperature / top-p | 0.2 / 0.95 on every call |

All result directories validate against the amended manifest. Every
certificate binds its `result.json` and `calls.jsonl`; request identifiers are
unique, request-body hashes are present, and all calls name the frozen
`Qwen/Qwen3-32B-AWQ` model. The 40 physical pass orders are balanced 20/20,
and all six logical arm orders occur six or seven times as frozen.

The two seed-51000 smoke runs remain in separate directories and are excluded
from every number in this report.

Claude's independent audit recomputed all 40 certificate and call-file hashes,
the three validity counts, communication and constraint counts, repair count,
introduced-error count, and the registered median-of-totals token ratio. It
confirmed the evidence-table `FAIL` and bounded-feedback `PASS` without a
threshold or interpretation change.

## Registered outcomes

| Outcome | Plain summary | Evidence table | Evidence + feedback |
| --- | ---: | ---: | ---: |
| Fully valid decisions | 0/40 (0.0%) | 17/40 (42.5%) | 34/40 (85.0%) |
| Communication failures | 40/40 (100.0%) | 19/40 (47.5%) | 2/40 (5.0%) |
| Constraint-pass rate | 37/40 (92.5%) | 33/40 (82.5%) | 34/40 (85.0%) |
| Mean required-unknown coverage | 0.000 | 0.971 | 1.000 |
| Hindsight violations | 0 | 0 | 0 |

### Evidence-table claim — FAIL

| Frozen rule | Observed | Pass? |
| --- | ---: | :---: |
| Complete, gradable, identity-matched set | 120/120 outputs | yes |
| Fully valid gain at least 15 points | +42.5 points | yes |
| Paired bootstrap 95% interval excludes zero | [27.5, 57.5] points | yes |
| Communication failures at most half of plain | 19 vs 40 | yes |
| Constraint-pass drop no more than 5 points | −10.0 points | **no** |

The failed non-inferiority rule is not relaxed or averaged away. Missing one
registered rule makes the registered claim fail.

### Bounded-feedback claim — PASS

| Frozen rule | Observed | Pass? |
| --- | ---: | :---: |
| Final validity does not decrease | 85.0% vs 42.5% | yes |
| Repairs at least half of invalid initials | 17/23 (73.9%) | yes |
| Introduces no error into an initially valid answer | 0 | yes |
| Uses no more than one extra call | 0 or 1 per config | yes |
| Median total output tokens at most 1.5× initial evidence | 1.435× | yes |

The evidence path used a median 1,076.5 output tokens before feedback and
1,545.0 including feedback. Seventeen configurations needed no feedback call;
23 used one.

## Where the result came from

Counts below are `(fully valid, communication failures, constraint passes)`
out of eight runs per slot.

| Slot | Plain summary | Evidence table | Evidence + feedback | Repairs / calls |
| --- | ---: | ---: | ---: | ---: |
| 1 — early fire mobilization | (0, 8, 8) | (7, 1, 8) | (8, 0, 8) | 1 / 1 |
| 2 — missing telemetry | (0, 8, 8) | (2, 6, 8) | (8, 0, 8) | 6 / 6 |
| 4 — municipal liaisons | (0, 8, 8) | (0, 8, 8) | (8, 0, 8) | 8 / 8 |
| 6 — first-night response split | (0, 8, 8) | (7, 1, 8) | (8, 0, 8) | 1 / 1 |
| 9 — additional water trucks | (0, 8, 5) | (1, 3, 1) | (2, 2, 2) | 1 / 7 |

The evidence-table constraint deficit is concentrated in slot 9. The other
four slots are 32/32 constraint-valid in both initial arms. In the water slot,
the plain graph passes 5/8 constraints and the evidence table passes 1/8.
Feedback repairs one of seven invalid initial water allocations. Those valid
failures remain part of the result; they do not justify another runner change.

## Descriptive historical overlap

Historical-choice overlap was frozen as descriptive context only. Across all
repeated slot runs, exact assignment overlap is 6 of 112 historical
assignments for the plain summaries and 90 of 112 for both evidence outputs.
This does not enter either pass rule and is not evidence that a simulated
choice was operationally better.

## Limits on the conclusion

- The same open model was tested on five reconstructed decision moments over
  eight seeds, not on the universe of disaster-response decisions.
- Slots 1 and 2 include explicit exercise assumptions because the public
  record does not expose the real internal trigger payload or a named
  missing-telemetry team.
- The feedback arm shares the evidence arm's initial answer by design. This
  isolates the one correction message but means those two initial answers are
  not independent samples.
- Historical choices and later outcomes never score. No lives-saved,
  superiority-to-responders, or real-world outcome claim is supported.
- The evidence-table claim failed under its registered conjunction despite
  a large validity gain. The feedback claim passed only its narrower question:
  whether one constrained mechanical correction can repair the same initial
  evidence answer.

## Artifact map

- `validation/freeze-manifest.json` — amended, countersigned v1.1 manifest.
- `validation/freeze-manifest-pre-amendment-1.json` — original manifest that
  continues to validate the first smoke.
- `results/smoke-51000-initial/` — excluded initial engineering smoke.
- `results/smoke-51000-amendment-1/` — excluded amended engineering smoke.
- `results/production-v1.1/production-analysis.json` — registered aggregate
  analysis.
- `results/production-v1.1/seed-*/` — all 40 raw prompts, responses, parsed
  outputs, checker findings and certificates.

Recompute the result from the repository root with:

```bash
PYTHONPATH=experiments/kumamoto-real-response/runner \
  python3 -m kumamoto_real_response.cli analyze \
  --phase production \
  --freeze experiments/kumamoto-real-response/validation/freeze-manifest.json \
  --out experiments/kumamoto-real-response/results/production-v1.1
```
