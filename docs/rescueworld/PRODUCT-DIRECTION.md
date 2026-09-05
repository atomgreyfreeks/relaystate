# Product direction

How the measured result becomes a product, what is still unsolved, and the order to build it in.

## What exists today

A measurement and a repair, both at a single point in time.

- **Measurement.** Across 32 complete campaigns, a decision that created an obligation for a later
  decision never reached it. 0/32, independent of orchestration method, with no error raised and
  no misdelivery.
- **Repair.** Compiling the verified dependency into a record and delivering it outside the
  prose-compression path. 0/8 to 8/8, two models, first attempt, zero false completions.

Both were produced inside the replay harness. There is no service, no persistence, no API, and the
obligation was specified by hand rather than detected. That is the distance to a product.

## What the product is

A service that owns unfinished decisions across time, running alongside an existing multi-agent
system without replacing it. Existing models, orbital calculation, simulation and command authority
stay where they are.

```
create  ->  hold  ->  revalidate  ->  activate  ->  close
                          |                           |
                    (state changed)              escalate
```

| Stage | What it does |
|---|---|
| **create** | When a decision is admitted, record the obligations it creates: who owes what, on what evidence, by when, closed how |
| **hold** | Persist them outside any agent's context window. This is where elapsed time is handled structurally rather than by prompting |
| **revalidate** | On state change, re-check each open obligation. Evidence may be superseded; the assigned resource may be gone |
| **activate** | When the firing condition is met, compile the obligation into the receiving model's context in current state |
| **close** | Require CONFIRM, DECLINE or ESCALATE. Nothing closes silently |

## Three layers, each independently useful

### Layer 0 — Detect

> "Show me every decision my agents made that created unfinished work, and whether it ever closed."

This ships first, and it is the part that sells on its own. The failure is invisible to monitoring:
no exception, no bad output, a complete log. An operator has no way to know it is happening. A
read-only tool that reports open obligations has no integration risk, needs no change to the
decision path, and needs no GPU at run time.

The open-obligation display already exists as `public/relaystate-layer.html`.

**Blocking problem: extraction.** Today the obligation was hand-specified for one known dependency.
To detect automatically, the system must determine from an admitted decision and the current state
what obligation that decision creates. This is unsolved, and it is the first place where an LLM
does semantic work that deterministic code cannot trivially replace — which also answers the
open question in paper §6.4 from a second direction.

### Layer 1 — Carry

Deliver the compiled record at activation time. This is the mechanism already measured, at one
point, under narrow conditions.

To become a product it needs three things it does not have: persistence across intervening
decisions and context growth, revalidation against current state at delivery, and a refusal path
when the record is stale or contradicted.

### Layer 2 — Own

The longitudinal system described in paper §13: ownership, priority, dependency links, evidence
versions, conflict rules, human escalation, and lifecycle states (`BLOCKED`, `SUPERSEDED`,
`CANCELLED`, `DISPUTED`, `EXPIRED`, `ESCALATED`). Must survive duplicate delivery, concurrency,
crash recovery, reassignment and changing evidence. None of this was evaluated.

## What is unsolved

Stated plainly, in the order they block the product.

1. **Extraction.** Which obligations does an admitted decision create? Hand-specified today.
2. **Persistence.** Never tested across elapsed time. The measured fork shared one cutoff.
3. **Supersession.** Every successful disposition was `CONFIRM`. The refusal path is untested.
4. **Concurrency.** One obligation at a time. No conflict, competition or reassignment.
5. **Integration.** No API. The logic lives inside the replay harness.

## Build order

| Phase | Work | GPU | Produces |
|---|---|:---:|---|
| **1** | Lift the compiler out of the harness into a module with a defined interface (`create` / `revalidate` / `compile` / `close`). Persist obligations to a store outside any context window | no | The service skeleton, and the persistence that Phase 3 needs |
| **2** | **Extraction experiment.** Given an admitted decision and state, can a model produce the correct obligation? Score against the recorded campaign data already in the repository | yes | Layer 0's missing capability, and a research result, from one study |
| **3** | The two experiments specified in paper §12, run against the service rather than the harness: elapsed time, and active `DECLINE` with evidence that should cause refusal | yes | The evidence for the claim the name makes |
| **4** | One adapter for an existing agent framework, plus the operator view | no | Something a person outside this project can install |

Phase 2 is the highest value per unit of work. It uses campaign data that already exists, so it
needs no new campaign runs; it produces the capability Layer 0 is blocked on; and it tests whether
the model contributes judgment rather than transcription.

## The claim to hold to

The current evidence supports: this failure is real, it is method-independent, and a compiled
record repairs it at one handoff under narrow conditions.

It does not yet support: that decisions survive elapsed change. Phase 3 is what earns that.
Until then the wider claim stays in the roadmap, not in the results.
