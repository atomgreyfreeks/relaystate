# Rescue World handoff for Yuki

Date: 28 August 2026
Purpose: understand the project quickly, work with your own AI tools, and prepare the Japanese translation.

## The sixty-second explanation

**What were we trying to learn?**

How can an AI workflow execute one decision when that decision depends on the exact choice made in
another step?

**What problem did we find?**

In a connected 72-hour exercise, every complete campaign failed one paper-mill confirmation. The
confirmation had to use the exact response group selected by a linked source proposal, but it never
produced a rule-passing match.

**What did we build?**

An action card for that known handoff: a short record placed directly into the receiving task.

**What does the action card contain?**

The verified source assignment, reports allowed for the receiving decision, questions that decision
must still acknowledge, an eligibility statement, and a required confirm-or-decline response.

**When did this focused test happen?**

The source and receiving decisions had the same 20:00 cutoff in one paired decision tier. The test
did not wait hours or days. Software constructed the card for the receiving step, the AI had to
confirm or decline it, and the same frozen rules checked the answer.

**Did it work?**

Yes, for this focused handoff. Qwen3-32B completed the exact required follow-up in all eight repeated
samples, and every answer passed the complete rule check on its first attempt. Qwen3.5-122B repeated
the exact result in all eight samples on its first attempt.

**What did we learn?**

The complete action-card bundle made one verified source assignment explicit and executable in its
known receiving task. The test does not yet tell us whether the effect came from the exact assignment,
the compact format, the evidence links, or the required response.

**Why is that useful?**

It gives us a concrete pattern to test next in long-running systems: create a persistent card at the
source decision, keep it current, and activate it when a genuinely later step depends on it.

**What is Rescue World?**

Rescue World is the tool that lets a person inspect the whole chain: what happened, what the AI knew, what it proposed, which action card returned, whether the answer passed the rules, and what remained unanswered.

## The whole story, from the beginning

### 1. Growth intelligence gave us the starting idea

Roots, fungi and slime moulds do not examine everything equally. They direct growth and attention toward pressure, uncertainty and useful signals.

We tested whether AI work could use similar rules:

- keep several possible explanations visible;
- keep the evidence attached to each idea;
- keep unanswered questions open;
- revisit the parts that can still change the next action;
- repair one failed step without restarting the entire task.

Earlier benchmarks showed that these rules could help AI roles share evidence and make checked decisions. In one test, the roles had to combine conflicting reports into one recommendation; the workflow scored 96.52 out of 100 and led the final AI to the required place in all 120 cases. In an earthquake-rule test, 34 of 40 answers passed every rule after the AI was shown the exact rule it had broken and tried once more.

### 2. We applied those lessons to a changing emergency

Rescue World replays 414 public-record events from the first 72 hours after an earthquake in Kumamoto. The AI faced eleven connected decisions about fire response, missing status reports, collapsed buildings, municipal coordination, shelters, aftershocks and water delivery.

We completed 32 full seventy-two-hour simulation runs containing 352 checked decision moments. An action changed the simulation only after it passed the evidence, resource and timing rules. An accepted assignment then changed what remained possible later.

This let us observe where connected AI decisions broke across a three-day exercise. The successful
focused fix was tested only on the same-cutoff paper-mill handoff, not across the full three days.

### 3. The long simulation exposed one exact failure

At one moment, the AI had to assign response groups across two collapsed buildings. A paired sibling
call at the same 20:00 cutoff asked it to confirm one group from that exact provisional proposal for
a paper mill.

The confirmation remained unresolved in all 32 complete runs. We then isolated eight accepted
post-source wrappers in which the paper-mill assignment was valid. They represented seven unique
source seeds, but all produced the same model-facing card and task. The focused fork therefore ran
eight stochastic samples of one known handoff, not eight different responsibilities.

This gave us a precise test: what happens when the receiving prompt contains the complete card versus
an empty card field? The empty-card prompt did not contain the source assignment elsewhere, so this
test does not yet separate action-card structure from simple access to the answer-bearing fact.

### 4. We turned the source assignment into an action card

For this focused handoff, software made a short card containing:

1. the exact verified source assignment;
2. the exact resource, destination and quantity;
3. reports visible and allowed for the receiving decision;
4. questions the receiving decision must acknowledge;
5. an authority-and-eligibility statement; and
6. a confirm-or-decline instruction.

The card appeared directly in the receiving AI's work. That AI had to return one answer:
**confirm** or **decline**. Software then checked the resource, evidence, place, quantity and current
state.

The source assignment became a clear model input and a response contract. The experiment did not
test creating the card at source time, storing it through a long operation, or activating it after
an elapsed delay.

### 5. Two models completed the exact follow-up

We tested eight accepted source wrappers of the paper-mill handoff where the assignment was valid.
All eight presented the same card and receiving task.

| Result | Qwen3-32B | Qwen3.5-122B |
|---|---:|---:|
| Exact follow-up completed | 8 / 8 | 8 / 8 |
| Passed the complete rule check on the first attempt | 8 / 8 | 8 / 8 |
| Needed a correction | 0 / 8 | 0 / 8 |
| Complete empty-card unknown checks passed | 8 / 8 | 7 / 8 |
| False claims that an unsupported task was complete | 0 | 0 |

The one Qwen3.5 check miss kept the unsupported question open and invented nothing, but it failed the complete check because it gave the wrong number of assignments and no allowed report identifier.

These are successful exploratory results. They show that the complete answer-bearing card bundle
produced the exact follow-up with two Qwen models on this repeated task. The test did not isolate
which card ingredient caused the result. Both models are from the same model family, so this is not
yet evidence of independence across unrelated model families.

## What this result means for AI orchestration

AI orchestration means deciding which AI role receives which information, when it receives it and
how separate work is combined. The focused experiment tested one additional model-visible object:
an exact source assignment joined to current reports, current unknowns, and a required disposition.

For the known paper-mill dependency, deterministic code selected the receiving step and constructed
the card. A fuller orchestration system could create such cards when decisions are made, persist
them, update them as evidence changes, and deliver them at later steps. That full lifecycle is the
research direction; it was not evaluated by this same-cutoff fork.

## Why this finding matters

A future action-card system could help with important tasks that unfold over hours, days or months,
where work passes between people, AI roles and software. A decision made early may not matter until
much later, after hundreds of messages and new events. That delayed lifecycle is the next research
step, not a result of the focused fork.

Such a system could preserve the relationship between an original decision and its future
consequence. It could say:

- this resource was assigned here;
- these reports supported the assignment;
- these questions remained open;
- this later step depends on that assignment;
- now is the moment to confirm, change or decline it.

That makes the system easier to operate and easier to audit. A person can see what work was created, who or what received it, when it became due and how it was resolved.

## How Rescue World explains it to a person

The plain-English story must always come first:

1. **Situation:** What changed? What was still unknown?
2. **Proposal:** What exactly did the AI suggest, how much and where?
3. **Rule check:** Did the simulation accept it? Why or why not?
4. **Effect:** What changed inside the simulation? What remained open?
5. **Action card:** Which verified source assignment appeared in the focused receiving task?

The 3D environment and network graphs are visual aids for this story. They should never replace the explanation.

Model–Move–Mesh gives the reader three questions:

- **Model:** What did the AI believe from the reports available then?
- **Move:** What exact action did it propose?
- **Mesh:** Did the source assignment, allowed current reports and current unanswered questions reach
  this decision together?

## The two sentences to preserve in translation

> In our focused test, the receiving AI executed one known source assignment when software presented
> the exact assignment, current evidence requirements, current unknowns, and a required response as
> one action card. The next research step is to create, store, update, and activate these cards across
> genuinely long-running work.

## Translation guidance

- Translate for meaning, not word-for-word technical similarity.
- Introduce “action card” before the technical term “decision receipt.”
- Explain “AI team” as several AI roles sharing one task.
- Explain “AI orchestration” as the rules controlling who receives what information and when.
- Translate “accepted by the simulation's rules” instead of using the unexplained word “admitted.”
- Translate “saved, unchanged version of the situation” instead of “frozen legal history.”
- Keep model names, model revisions, file names, IDs and hashes unchanged.
- Keep the boundary visible: these are modeled decisions inside one earthquake exercise, not claims about real dispatches, people reached or lives saved.
- Do not describe the second model as an unrelated model family. Both models are from the Qwen lineage.

## What Yuki should open first

1. `docs/rescueworld/README-YUKI.md` — the index for Yuki and any AI tools helping with the submission.
2. `docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md` — the one-page “open this, click this, explain this” guide.
3. `docs/rescueworld/RESCUE-WORLD-PAPER-DRAFT.md` — the full research draft with exact methods, evidence, limits, and next experiments.
4. `docs/rescueworld/emergence-presentation.html` — the complete story from growth intelligence to the finding and product.
5. `docs/rescueworld/submission-presentation.html` — the shorter presentation version.
6. `docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html` — the beginner explanation plus the exact process and quality checks.
7. `public/impact-view.html` — the accepted simulation and action-card results.
8. `public/decision-network.html` — the expandable network behind each proposal.
9. `rescueworld.html` — the full emergency viewer.

The three HTML presentations can be opened directly from the repository. The Rescue World pages
must be served over HTTP because they load data and code from neighboring files. From the
repository root, run:

```bash
npm ci
npm run dev
```

Then open:

- `http://127.0.0.1:5184/rescueworld.html`
- `http://127.0.0.1:5184/impact-view.html`
- `http://127.0.0.1:5184/decision-network.html`

## Evidence files

### Qwen3-32B action-card result

- Model: `Qwen/Qwen3-32B-AWQ`
- Revision: `0499c3ac83fdef8810b907a23894ba91e95eddd8`
- Portable analysis: `docs/rescueworld/evidence/receipt-fork/receipt-fork-20260828-v1/receipt-fork-analysis.json`
- Portable plan: `docs/rescueworld/evidence/receipt-fork/receipt-fork-20260828-v1/receipt-fork-plan.json`
- Embedded analysis SHA-256: `e178ea9e498c8af2e7a3b3b48ccb8b6f6e377c47fcca86cadba6931540ce7544`
- Result: complete and provenance-valid; 8/8 exact first-attempt confirmations; safety 8/8; zero false resolutions.

### Qwen3.5-122B replication

- Model: `Qwen/Qwen3.5-122B-A10B-GPTQ-Int4`
- Revision: `30cd92cba9707a9aba09d1e490ed4b66b78e9606`
- Portable analysis: `docs/rescueworld/evidence/receipt-fork/qwen35-receipt-production-v2/qwen35-receipt-fork-analysis.json`
- Portable plan: `docs/rescueworld/evidence/receipt-fork/qwen35-receipt-production-v2/qwen35-receipt-plan.json`
- Embedded analysis SHA-256: `79b3519371feb063f6e0fb64582ceb9d38bf817965f3035ce4d6095b69a4fb16`
- Result: complete and provenance-valid; 8/8 exact first-attempt confirmations; safety 7/8; zero false resolutions.

### Product data

- `docs/rescueworld/evidence/receipt-fork/acceptance-manifest.json` binds the two portable analyses and plans to their accepted file hashes, semantic hashes, model revisions and focused-finding boundary.
- `public/receipt-fork-data.json` contains the compact checked data used by the public viewer.
- `node scripts/bake-receipt-fork.mjs --check` verifies, on a clean checkout, that the portable evidence bundle is intact and the public data matches both accepted analyses.

## Evidence boundary

The result covers one same-cutoff follow-up, one repeated model-facing card across eight selected
source histories and seven unique source seeds, one earthquake exercise, and two models from the
same Qwen family. The empty-card control did not contain the source assignment elsewhere. It is a
useful exploratory mechanism result, not a test of delayed memory, a component ablation, or a
general proof of real-world operational effectiveness. The next scientific steps are fact-matched
controls, genuinely delayed and varied obligations, another incident, and unrelated model families.
