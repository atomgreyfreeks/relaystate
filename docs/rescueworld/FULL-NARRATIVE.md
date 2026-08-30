# Rescue World handoff for Yuki

Date: 28 August 2026
Purpose: understand the project quickly, work with your own AI tools, and prepare the Japanese translation.

## The sixty-second explanation

**What were we trying to learn?**

How can an AI keep making sensible decisions during a long, changing operation?

**What problem did we find?**

Important earlier decisions became buried in the growing history. When a follow-up action became possible, the AI did not reliably use the exact earlier decision it needed.

**What did we build?**

An action card: a short record created when an important decision makes work for later.

**What does the action card contain?**

What was decided, which resource and place it concerns, why it was decided, what remains unknown, and what must happen next.

**What happens later?**

When the follow-up becomes possible, the system automatically gives that card to the AI handling the next decision. The AI must confirm or decline it. Software then checks the answer.

**Did it work?**

Yes. Qwen3-32B completed the exact required follow-up in all eight tested histories, and every answer passed the complete rule check on its first attempt. Qwen3.5-122B repeated the exact result in all eight histories on its first attempt.

**What did we learn?**

Storing history is not enough. When an AI decision will matter later, the system should turn it into a clear action card and deliver it again at the exact moment it needs follow-through.

**Why is that useful?**

The same idea can help long-running AI systems avoid losing promises, evidence, unfinished work and important follow-ups as tasks become larger and change over time.

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

This let us study a question that short benchmarks cannot show: can an AI keep its earlier decisions usable while the situation changes for three days?

### 3. The long simulation exposed one exact failure

At one moment, the AI had to assign response groups across two collapsed buildings. A paired follow-up then asked it to confirm one group already assigned to a paper mill.

The confirmation remained unresolved in all 32 complete runs. We then isolated eight saved histories in which the earlier paper-mill assignment was valid. Those eight histories gave us a fair test of whether the later AI could use that exact response group, destination, quantity and supporting reports.

This made the real problem clear: information can still exist in a history without reaching the decision that needs it.

### 4. We turned the earlier decision into an action card

When an important decision creates future work, the system now makes a short card containing:

1. the earlier decision;
2. the exact resource, destination and quantity;
3. the reports that support it;
4. the questions that remain unanswered;
5. the next action that must be completed;
6. the moment when that action becomes possible.

At that moment, the card appears directly in the work of the AI making the next decision. That AI must return one answer: **confirm** or **decline**. Software then checks the resource, evidence, place, quantity and timing.

The important earlier decision is no longer background text. It arrives as a clear piece of work that must be resolved.

### 5. Two models completed the exact follow-up

We tested eight saved, unchanged versions of the paper-mill handoff where the earlier assignment was valid.

| Result | Qwen3-32B | Qwen3.5-122B |
|---|---:|---:|
| Exact follow-up completed | 8 / 8 | 8 / 8 |
| Passed the complete rule check on the first attempt | 8 / 8 | 8 / 8 |
| Needed a correction | 0 / 8 | 0 / 8 |
| Strict safety cases passed | 8 / 8 | 7 / 8 |
| False claims that an unsupported task was complete | 0 | 0 |

The one Qwen3.5 safety miss kept the unsupported question open and invented nothing, but it failed the complete check because it gave the wrong number of assignments and no supporting report.

These are successful exploratory results. They show that the same action-card mechanism produced the exact follow-up with two Qwen models. Both models are from the same model family, so this is not yet evidence of independence across unrelated model families.

## How ordinary AI orchestration usually handles a long task

AI orchestration means deciding which AI role receives which information, when it receives it and how the separate work is combined. A typical system gives different roles parts of a task, collects their notes and passes a summary or conversation history to the next role. As the task grows, that history becomes longer. The next AI must search it and decide which old details matter now.

Our method adds timed follow-through. The system recognizes when a decision creates future work, records that work as an action card and schedules its return. When the follow-up becomes possible, the exact card goes directly to the AI handling that step. This changes memory from a history that must be searched into a clear responsibility that must be completed.

## Why this finding matters

Many important tasks unfold over hours, days or months. Work passes between people, AI roles and software systems. A decision made early may not matter until much later. By then, the original context may be buried under hundreds of messages and new events.

An action card preserves the relationship between the original decision and its future consequence. It can say:

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
5. **Action card:** Which earlier decision returned, and what follow-up was required?

The 3D environment and network graphs are visual aids for this story. They should never replace the explanation.

Model–Move–Mesh gives the reader three questions:

- **Model:** What did the AI believe from the reports available then?
- **Move:** What exact action did it propose?
- **Mesh:** Did the supporting reports, unanswered questions and earlier assignments reach this decision intact?

## The one sentence to preserve in translation

> When an AI makes a decision that will matter later, the system should create a clear action card and deliver it to the person or AI handling the next step exactly when they need it.

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

1. `docs/rescueworld/START-HERE.md` — the index for Yuki and any AI tools helping with the submission.
2. `docs/rescueworld/ONE-SHEET.md` — the one-page “open this, click this, explain this” guide.
3. `docs/rescueworld/emergence-presentation.html` — the complete story from growth intelligence to the finding and product.
4. `docs/rescueworld/submission-presentation.html` — the shorter presentation version.
5. `docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html` — the beginner explanation plus the exact process and quality checks.
6. `public/impact-view.html` — the accepted simulation and action-card results.
7. `public/decision-network.html` — the expandable network behind each proposal.
8. `rescueworld.html` — the full emergency viewer.

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

The result covers one exact follow-up, eight selected saved histories, one earthquake exercise and two models from the same Qwen family. It is a promising research result, not a general proof of real-world operational effectiveness. The next scientific step is to repeat the mechanism on another incident and unrelated model families.
