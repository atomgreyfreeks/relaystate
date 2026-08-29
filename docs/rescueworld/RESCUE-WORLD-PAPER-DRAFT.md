# Rescue World

## Action Cards for a Known Stateful LLM Decision Dependency

**Working paper — first complete draft, 28 August 2026**

**Authors:** [Randy / AURA WORLD authors to finalize]

**Artifact:** [Rescue World](../../rescueworld.html)

**Evidence package:** [portable receipt-fork bundle](evidence/receipt-fork/README.md)

> **Draft status.** This manuscript reports a completed exploratory mechanism demonstration suited to a workshop, case-study, or demo submission. The decisive experiment repeatedly samples one same-cutoff dependency through eight verified source wrappers from one modeled incident. The two tested models are from the same Qwen lineage. The study does not measure real emergency outcomes, delayed memory, persistent obligations, or automatic dependency discovery.

## Abstract

Stateful AI workflows can schedule two linked model calls yet omit the first call's output from the dependent call's input. The receiving model then cannot directly execute the source relation, even though the orchestration layer can verify it outside the prompt.

We study this failure in **Rescue World**, a stateful earthquake-response exercise built from 414 hash-linked events that combine public sources with labeled exercise assumptions across 72 hours. One open-weight model faced eleven connected decisions in each complete campaign. Earlier validated actions changed the resources and options available at subsequent moments. Across four orchestration methods, eight runs each, all 32 campaigns failed the same paper-mill confirmation. That diagnostic handoff involved two sibling calls at the same 20:00 cutoff inside one atomic decision tier: one proposed a collapse-site assignment and the other could confirm only a group named in that exact provisional proposal. Not every campaign created an eligible proposal.

We evaluate an **action card**, serialized as a decision receipt. For this known dependency, the model-visible card contained the exact provisional assignment, observation identifiers allowed by the current decision packet, current required unknowns, an authority-and-eligibility statement, and a required `CONFIRM` or `DECLINE` response. We selected eight verified source wrappers containing an eligible proposal, representing seven unique campaign seeds but one repeated model-facing card and task. With an empty receipt, the common exact-and-valid action endpoint was met in 0/8 samples. With the full card, Qwen3-32B met it immediately in 8/8 samples; Qwen3.5-122B repeated 8/8. A shared empty-receipt unknown-preservation check passed in 8/8 and 7/8 samples respectively, with zero false resolutions.

The result supports a narrow but useful claim: for this mechanically known same-tier dependency, the complete answer-bearing card made the source assignment executable by the receiving model. It does not establish delayed delivery, persistent obligation storage, automatic trigger discovery, action-card-specific causation, or which component of the bundle caused the effect. We position Rescue World as a hash-verified case-study evaluation at the intersection of dependent-call orchestration, LLM memory-to-action research, commitment-based workflow, and traceable state validation.

## Plain-language summary

Imagine one AI step assigns a crew to a location and a linked step must confirm that same crew. The receiving AI sees the confirmation task, but not the exact assignment chosen by the first step. An action card places the assignment, allowed current report identifiers, required unanswered questions, and the confirm-or-decline response directly into the receiving task.

That is what our focused test evaluated. The receiving AI completed the exact rule-passing follow-up in every sample when it received the full card, using two Qwen models. With an empty card field, it did not complete that follow-up in any sample.

The present result demonstrates that one source relation became executable when its complete action-card bundle was added to the receiving prompt. Turning that prompt transformation into a source-bound, persistent, evidence-versioned workflow across hours or days remains a design hypothesis and next experiment.

## 1. Introduction

AI workflows increasingly split work across model calls, tools, sessions, and changing state. When call B depends on a precise output from call A, the orchestration layer must decide whether and how that output enters B's model-visible task. A complete external record does not help B if the needed relation is omitted from its prompt.

This distinction matters. A log can record what A produced. A dependency handoff must tell B which exact part of A constrains B's valid action. A future obligation system would additionally preserve and reactivate that relation across elapsed time, but the experiment reported here tests only the handoff.

Rescue World was built to make connected decision failures observable. It replays the first 72 hours of a reconstructed Kumamoto earthquake record and inserts eleven AI decision moments. Each run sees only information available by the corresponding historical deadline. Validated actions persist. Resources cannot silently duplicate, teleport, or reset. A proposal can therefore fail even when it sounds reasonable in isolation, because it conflicts with the run's state or with a linked proposal.

The continuous exercise revealed one unusually clean failure. At a collapse-site decision, one sibling call could place response groups across two locations. A linked sibling call at the same 20:00 cutoff could confirm only a group named in that exact provisional proposal for the paper mill. None of 32 complete campaigns produced a valid confirmation. Some campaigns had never created an eligible placement. Others had, but the confirmation still selected a different group or failed the evidence rules. The state validator prevented an invalid update, so the simulated state remained internally consistent while the handoff remained unresolved.

This led to our central research question:

> **When one validated AI proposal is known to constrain a linked receiving decision, can a compact action card make the required follow-up executable?**

We tested the question with a matched focused intervention. Eight verified source wrappers contained an eligible paper-mill assignment in the provisional sibling proposal. For each wrapper, the control decision received an empty receipt array. The treatment received one canonical model-visible card carrying the exact assignment, current allowed observation identifiers and required unknowns, authority-and-eligibility text, and a mandatory confirm-or-decline disposition. The validator, decision packet, model settings, request seed, endpoint, response schema, and bounded correction policy were matched within each pair. All eight treatment prompts presented the same card content and task; they are repeated stochastic executions, not eight distinct dependency instances.

The contribution is the integrated mechanism and its inspectable test, not the general idea that events can create obligations. Commitment protocols and declarative workflow systems have formalized pending responsibilities for decades [7, 8]. Recent agent-memory research also studies when stored state should influence later action [1–6, 9, 10, 13, 14]. Our contribution is more specific:

1. **An action-card pattern for a known LLM decision dependency.** The tested card joined an exact provisional assignment with current allowed observation identifiers, current required unknowns, authority-and-eligibility text, and a required disposition.
2. **A stateful testbed for causally connected decisions.** Rescue World links eleven decisions through carried resources and validated state inside a 414-event, 72-hour replay.
3. **A focused paired demonstration.** Across eight eligible source wrappers for one model-facing case, the full action-card bundle produced the exact valid follow-up in 8/8 repeated samples for each of two Qwen models, while the empty-receipt condition produced 0/8.
4. **An inspectable artifact.** The interface exposes the available reports, AI proposal, validation result, state transition, agent network, and focused receipt result without treating modeled demand as real people or real dispatch.

The remainder of the paper explains the design path from growth intelligence to obligation routing, situates the mechanism in prior work, describes the continuous campaign and focused experiment, reports the results, and states the limits and next tests required for a broader claim.

## 2. Design lineage: from growth intelligence to obligation routing

The project began with a practical question inspired by living networks: how should an AI workflow move attention toward useful signals while preserving diversity, uncertainty, and evidence? Roots, fungal networks, and slime moulds offered design metaphors for selective growth, local sensing, and bounded reinforcement. We translated those metaphors into testable information-routing patterns rather than treating biology as proof.

The first matched benchmark compared ordinary agent graphs with several growth-informed routing tactics across 120 cases and five task families. The preregistered aggregate result was inconclusive: 69.05% for the ordinary graph and 73.13% for the growth graphs, a +4.08-point difference with a 95% interval from −1.39 to +9.48. The diagnostic results were more useful than the aggregate. Growth routing amplified a correct early gradient but also amplified a wrong one; layered planning hardened early errors; and the registered evidence-ID secondary outcome improved by 7.89 points across the benchmark [A1].

A later layer ablation separated a graph-and-routing treatment from a combined specialist-prompt-and-evidence-partition treatment. The registered graph/routing factor gained 16.19 score points, while the specialist treatment was inconclusive. That effect was concentrated in synthetic incident diagnosis, where connecting a hypothesis to evidence capable of verifying or rejecting it mattered [A2]. Those cases had clean early signals; misleading gradients, disagreement, and fallback behavior were not tested. This redirected the research toward **what information moves, where it moves, and what remains attached to it**.

The evidence-state experiment made that idea explicit. Reviewers classified each candidate as `SUPPORTED`, `REJECTED`, or `UNRESOLVED`; deterministic code checked those judgments and attached exact document fields before the final decision. On 120 synthetic incident investigations, evidence-state routing reached a 96.52 composite score, 100% exact-answer accuracy, and 76.79% evidence-ID F1, and passed its registered split-evidence and protected-condition comparisons. The result was a bundle—typed judgments, validation, deterministic compilation, and state-aware reduction—so it did not show that any one label caused the gain [A3].

We then applied the pattern to five independent reconstructed disaster-decision moments. An evidence table raised fully valid decisions from 0/40 to 17/40 but failed its registered constraint non-inferiority condition. Giving the model one bounded revision after deterministic code reported mechanical rule violations—without adding new facts or recommending an answer—raised the evidence path to 34/40 fully valid decisions and passed the narrower bounded-feedback claim [A4]. The evidence-table claim itself did not pass. This taught two lessons: evidence must survive handoffs, and mechanical violation feedback can help a model revise some malformed decisions.

Those studies still reset state between decisions. A real long-running workflow does not. The 72-hour continuous campaign therefore carried validated actions, resources, unresolved questions, and rejections through a connected exercise. That change exposed a precise handoff failure inside one atomic tier: the confirmation call never produced the validator-admissible assignment required by its sibling proposal.

That path motivates a broader design hypothesis:

> **A decision that creates future work could be compiled into an evidence-linked obligation, stored in a living ledger, activated by an explicit due condition, and resolved by the responsible decision-maker.**

We call the human-readable object an **action card**, its serialized record a **decision receipt**, and the proposed complete lifecycle **obligation routing**. The focused experiment evaluates only the receiving-step card and disposition, not that complete lifecycle.

## 3. Related work

### 3.1 Memory that affects later action

Long-context access and memory retrieval do not by themselves establish that stored information will shape the correct later action. MemGPT treats context as a hierarchy of memory tiers and uses virtual context management to move information through a limited context window [10]. Agent Workflow Memory distills reusable workflows from earlier executions and selectively provides them to later tasks [9]. SAMem retrieves fine-grained memory conditioned on the agent's current state and decision [13]. These systems address context capacity, state-conditioned retrieval, and reusable procedures, whereas our focused test presents a case-specific assignment inside a required decision contract.

Recent benchmarks sharpen the distinction between recall and action. MemoryArena evaluates interdependent multi-session tasks in which earlier interactions must guide later behavior [3]. Mem2ActBench tests whether long-term memory is used to select tools and ground their parameters rather than merely answer factual questions [4]. MAGE argues that semantic retrieval can mismatch execution-state dependencies and instead stores a hierarchical execution-state tree whose summaries are validated during maintenance [5]. Rescue World shares their memory-to-action concern but focuses on an exact exercise-eligible assignment derived from verified system state.

Among the closest recent implementation-level neighbors we found is *Remember When It Matters*, which identifies “behavioral state decay” and uses a separate memory agent to inject grounded reminders selectively when the current state makes them useful [2]. A close conceptual neighbor is Google's *Agentic Coding Needs Proactivity, Not Just Autonomy*, which proposes an “insight policy” deciding what matters next, what evidence supports it, and whether to surface it [1]. StateFlow represents LLM workflows as state machines with rule- or model-controlled transitions [14]. Our study instantiates one specific combination: a deterministic known-dependency trigger, an exact state-derived assignment, current-decision evidence and unknown requirements, a mandatory confirm-or-decline disposition, mechanical admission, and an inspectable state transition in a non-coding exercise.

### 3.2 Commitments and declarative workflow

The underlying notion of pending responsibility is established prior art. Commitment protocols model social obligations whose state changes as agents act [8]. Dynamic Condition Response graphs represent event relations including conditions and required responses, and distributed variants assign roles to events [7].

Event-sourcing systems also preserve immutable histories for replay, while observability research shows why histories may still need explicit causal and execution metadata to support diagnosis [12]. This distinction parallels our separation between a stored event record and a due operational responsibility.

Our claim is therefore not that Rescue World invented obligations. The focused study evaluates an integration pattern for stochastic LLM decision-making: project an exact verified assignment into a receiving task; join it with observation identifiers allowed by the receiving packet and its required unknowns; require an explicit model disposition; and admit the resulting action only if deterministic state and evidence rules pass. Rescue World adds a traceable environment in which the source proposal, model-visible card, response, and resulting state can be inspected together. A persistent source-time obligation lifecycle is a proposed extension, not a component evaluated here.

### 3.3 Agent orchestration and disaster evaluation

Frameworks such as AutoGen support flexible multi-agent conversations and programmable interaction patterns [11]. Rescue World uses routed scouts, reviewers, and a coordinator, but its research question is not about a particular conversation topology. It asks how a consequential decision remains actionable across time and handoffs.

DORA is among the closest disaster-agent benchmarks we found. It evaluates 515 expert-authored tasks across 45 real disaster events and 108 geospatial tools, with a focus on end-to-end geospatial reasoning and long tool trajectories [6]. Rescue World examines a known dependency inside one changing incident: when one modeled proposal constrains a linked exercise-eligible action, can an AI workflow execute that handoff? The two efforts are complementary. Neither warrants claims about real-world response effectiveness without expert validation and deployment evidence.

### 3.4 Novelty position

The defensible contribution is a **hash-verified case-study demonstration of one action-card handoff under deterministic admission rules**. We do not claim priority over event obligations, proactive reminders, execution-state memory, state-driven workflows, replayable histories, or disaster-agent benchmarks. We also do not claim a universal memory solution, action-card-specific causal effect, or tested persistent obligation lifecycle. The present evidence supports a narrow mechanism demonstration for one known same-tier dependency.

## 4. Rescue World

### 4.1 A continuous incident rather than isolated questions

Rescue World reconstructs the first 72 hours after a modeled 2026 Kumamoto earthquake as 414 hash-linked events. The source layer combines public records with clearly labeled exercise assumptions. Eleven AI decision moments cover fire mobilization, missing telemetry, municipal liaisons, escalation posture, collapse-site assignments, dispatch confirmation, defense coordination, water priorities, shelter actions, aftershock checks, and a final rescue-to-water mission shift.

At each decision, the model receives only information available by that cutoff, its own validated earlier state, and the exercise assumptions disclosed for that moment. It does not receive the historical response as an answer key, later public reports, future modeled demand, or another method's state. The public record appears only as a separately labeled comparator.

Every proposal passes through deterministic checks. These verify the response shape, resource and destination eligibility, quantity, visible evidence identifiers, required unknowns, current commitments, capacity, and decision-specific rules. A valid proposal changes the modeled state atomically. An invalid proposal remains visible in the audit record but changes nothing.

### 4.2 The continuous campaign

The accepted campaign reported here is the artifact directory `kumamoto-continuous-production-v1.accepted`, not the separate accepted growth campaign on the same seeds. It used Qwen3-32B-AWQ at a pinned model revision, temperature 0.2, and top-p 0.95. Four stateful orchestration methods each completed eight seeded campaigns. Every campaign contained eleven decisions, producing 32 chains and 352 certified decision-cell artifacts. Many cells contain proposals that were rejected by the frozen rules; 158 proposals were admitted and changed state. All 352 cell artifacts and all 32 state chains passed the artifact-acceptance checks. The excluded engineering smoke run was not pooled with the results.

The methods were:

- **Fixed coverage:** three scouts and three reviewers divided eligible targets in a fixed order before one coordinator decided.
- **Guarded routing:** the same full coverage, with an existing review path allowed to revisit a leading need only after independent source-bound agreement.
- **Evidence state:** reviewers emitted supported, rejected, or unresolved judgments tied to report identifiers before coordination.
- **Evidence and correction:** evidence state plus at most one coordinator revision containing only deterministic rule violations.

The campaign's impact model contains 49 modeled demand units, 34 urgent. One urgent demand unit left open for one hour creates one urgent unmet demand-hour. These are exercise units for operational coverage, delay, and waste. They are not people, actual households served, lives saved, or real dispatches.

Table 1 reports the descriptive campaign means. The accepted analysis explicitly labels these results `DESCRIPTIVE_ONLY_NO_REGISTERED_CLAIMS`; no p-values or confidence intervals were produced.

**Table 1. Descriptive outcomes across eight complete campaigns per method.**

| Method | Rule-passing decisions that changed state / 11 | Modeled demand covered / 49 | Urgent units open / 34 | Projected urgent unmet demand-hours | Modeled waste |
|---|---:|---:|---:|---:|---:|
| Fixed coverage | 1.9 | 5.0 | 31.3 | 1,628.9 | 1.0 |
| Guarded routing | 6.6 | 33.3 | 3.8 | 257.6 | 1.5 |
| Evidence state | 5.3 | 29.8 | 7.3 | 411.9 | 0.0 |
| Evidence and correction | 6.0 | 32.0 | 5.0 | 342.3 | 0.0 |

The continuous runner carried validated state across the 72-hour exercise, and the model produced actions at later water, shelter, aftershock, and mission-shift decisions. The campaign also exposed the shared handoff failure described next.

## 5. Failure diagnosis: a known assignment was absent from the receiving task

At 20:00, the collapse-site decision could assign five modeled response groups across Aeon Mall Kumamoto and the Nippon Paper Yatsushiro mill. A linked confirmation asked which groups from that exact provisional proposal could be confirmed for the mill after a dispatch system returned. The confirmation was a refinement: it could select only a group named at that target in the sibling proposal.

In the original continuous campaign, these two model calls belonged to one atomic decision tier. Both had the same `2026-07-28T20:00:00+09:00` cutoff and were answered from the same pre-tier state. The confirmation was bound to the exact provisional collapse-site proposal before the pair was committed. The focused experiment later selected verified accepted post-assignment prefixes and reran only the confirmation from those saved bytes. It did not test a delay, a shift change, or context growth between source and receiving decisions.

All 32 complete campaigns failed the confirmation. This aggregate statement needs an important qualification. A campaign could fail for two different reasons:

1. the collapse-site proposal was invalid, leaving no eligible assignment to confirm; or
2. an eligible assignment existed, but the follow-up selected a different group or failed the evidence rules.

The 32-run observation therefore does **not** show that all 32 model calls forgot an available exercise-eligible assignment. It shows that the end-to-end handoff was unresolved in every complete campaign.

For a focused mechanism test, we selected the eight saved histories that contained a mechanically verified source assignment eligible for the confirmation. These were eight prefixes but only seven unique source campaign seeds; seed 51204 contributed two accepted histories. The experimental plan bound each prefix to its source decision, validator result, exact resource-target-quantity tuple, state checkpoint, and refinement contract.

All eight prefixes produced the same model-facing task and the same card: one Miyazaki battalion assigned to the Nippon Paper Yatsushiro mill, with the same two observation identifiers, three required unknowns, and receipt identifier. The eight samples therefore measure repeated stochastic execution of one obligation content, not eight distinct responsibilities.

This selection isolated the narrow question: when the exercise-eligible source assignment definitely exists, what happens if its complete action-card bundle is present in the receiving model's prompt?

## 6. The tested action card

### 6.1 Human-readable idea

The tested action card says, in effect:

> The accepted source action assigned **this resource** in **this quantity** to **this place**. **These reports are visible for the current decision, and these questions are required now.** The current refinement permits this assignment. **Confirm or decline it.**

The card is not a free-form summary of the whole history. Code constructed it at the receiving step by joining one accepted source assignment to selected observations and required unknowns from the current decision packet. It did not copy the source decision's complete evidence set or unknown set.

### 6.2 Implemented model-visible record

The card delivered to the model in the focused fork can be represented as:

\[
c = (id, a, E_r, U_r, p, g)
\]

where:

- \(id\) is the receipt identifier derived from the card body;
- \(a=(resource, target, quantity)\) is the exact assignment;
- \(E_r\) is a set of observation identifiers visible to the receiving decision, selected by a frozen target-or-resource-status rule;
- \(U_r\) is the receiving decision's required unknown set;
- \(p\) is a code-written statement that the source assignment was accepted and remains eligible for this refinement; and
- \(g\) is the instruction to confirm or decline the card now.

The model-visible card did not contain an owner field, explicit lifecycle state, source cutoff, source-cell certificate, parent-state hash, or executable trigger expression. The surrounding experimental plan and case provenance separately bound the saved prefix, source certificate, state, request, response, and validator result. Because the eight card bodies were identical, their receipt identifiers were also identical; the receipt identifier alone did not bind a particular history.

**Table 2. Action-card fields and their purpose.**

| Field | Plain meaning | Produced by | Checked by |
|---|---|---|---|
| Exact assignment | What the accepted source action assigned | Verified saved prefix | State and refinement validator |
| Current observations | Which report identifiers the receiving answer may cite | Receiving decision packet + frozen selection rule | Cutoff and evidence validator |
| Current required unknowns | Which unanswered items the receiving answer must acknowledge | Receiving decision packet | Required-unknown validator |
| Authority and eligibility text | Why this exact assignment may be confirmed in the exercise | Deterministic code | State and refinement validator |
| Required disposition | What the receiving model must do | Receipt contract | Receipt validator |
| Experimental source binding | Which saved prefix produced the assignment | Plan and case provenance, outside the model-visible card | Replay verifier |

### 6.3 Tested flow and proposed lifecycle

The focused fork implemented this short flow:

```text
verified accepted source prefix
        │
        ▼
construct receiving-time card from source assignment + current packet
        │
        ▼
model returns assignment and receipt disposition
        │
        ▼
mechanically validate receipt, evidence, unknowns, and current state
```

It did not create an obligation at source time, persist an `ACTIVE` record through a ledger, wait for a later cutoff, or continue the campaign after closing the record. The fuller lifecycle below is a proposed architecture motivated by the result, not an evaluated component:

| Lifecycle capability | Implemented in the focused fork? | Exact boundary |
|---|---|---|
| Verify a source assignment | Yes | Loaded from an accepted post-source prefix and replay-checked outside the card |
| Construct a receiving-time card | Yes | One frozen code path joined the assignment to the current packet |
| Require `CONFIRM` or `DECLINE` | Yes | Treatment receipt contract only |
| Validate the response against current state | Yes | Same refinement admission engine as the continuous campaign |
| Create a card at source time | No | Card was constructed at the receiver |
| Carry a card through elapsed time or context growth | No | Source and receiver shared one cutoff |
| Bind the model-visible card to a unique source instance | No | Experimental provenance did; the identical receipt body did not |
| Update, supersede, cancel, reassign, or expire a card | No | Proposed lifecycle only |
| Test an active card that should be declined | No | The separate unknown check used an empty receipt list |
| Continue a campaign after disposition | No | Focused fork stopped after the receiving decision |

```text
validated decision
        │
        ▼
compile a validated future responsibility
        │
        ▼
store an ACTIVE obligation in the ledger
        │
        ▼  deterministic due condition becomes true
deliver the action card to the responsible decision-maker
        │
        ▼
CONFIRM exact assignment or DECLINE it
        │
        ▼
mechanically validate evidence, eligibility, and current state
        │
        ├── valid: update state and close the obligation
        └── invalid: change nothing and keep the failure visible
```

In the present experiment, deterministic code already knew the source-to-refinement relation. We therefore test **execution of one known same-tier dependency when the full bundle is present**, not automatic discovery, delayed activation, or persistent ledger behavior.

## 7. Focused matched experiment

### 7.1 Research questions

- **RQ1 — Executability:** Does the full action-card bundle produce the exact validator-admissible confirmation when an eligible source assignment exists?
- **RQ2 — Empty-receipt unknown preservation:** In a separate task with no active card, does the model keep one specified missing report open without inventing evidence or falsely resolving it?
- **RQ3 — Same-lineage robustness:** Does the observed result repeat with Qwen3.5-122B-A10B under a separately verified deployment?

### 7.2 Conditions

Each of the eight positive histories produced a matched pair:

- **Empty-receipt control:** `decision_receipts: []`; the output had to contain no receipt disposition.
- **Full-receipt treatment:** one canonical receipt constructed from the verified source assignment and current decision packet; the output had to `CONFIRM` or `DECLINE` it.

Both conditions received the same decision packet, system instructions, output schema, model settings, validator, continuous-state admission engine, and one bounded correction policy. Within each pair they used the same physical endpoint and request seed. Pair order was counterbalanced. The intervention added receipt content, so the prompts were not token-matched.

If the first answer violated the contract, the model could receive one correction containing only deterministic violation codes. The correction provided no new facts and no suggested assignment. There was no third call. Immediate success and correction-rescued success were recorded separately.

### 7.3 Common action outcome and treatment receipt outcome

The common action outcome applied to both arms and required all of the following:

1. exact match to the verified source resource, target, and quantity;
2. evidence identifiers that were real and visible at the decision cutoff;
3. acknowledgment of every required unresolved question;
4. a fully valid ordinary decision score; and
5. admission by the same continuous-state refinement engine used in the 72-hour campaign.

The treatment also had a receipt-contract outcome: it had to return disposition `CONFIRM` for the supplied receipt and bind that disposition to the same exact assignment. The empty-receipt control was required to return no receipt disposition, so this treatment-only contract was not part of the common action comparison.

A plausible sentence, a partial match, a different group at the same place, or a valid-looking answer rejected by carried state did not count.

### 7.4 Empty-receipt unknown-preservation outcome

Each saved history also contributed one shared check at an escalation decision. No action card was active. The specified missing moving-unit report had to remain acknowledged as unknown. The model could not invent a report identifier or falsely claim that the missing information had been resolved. This tests ordinary behavior when the receipt list is empty; it does not test rejection of a stale, forged, or unsafe active card.

The empty-receipt check additionally required the ordinary decision and evidence rules to pass. This distinction matters for the Qwen3.5 result: its one failed check kept the unsupported question open and invented no evidence, but returned no assignments or observation identifiers, violating the frozen assignment-count and required-observation rules.

### 7.5 Models and execution

The first focused run used `Qwen/Qwen3-32B-AWQ`, revision `0499c3ac83fdef8810b907a23894ba91e95eddd8`, with temperature 0.2 and top-p 0.95. It completed 32 logical and 32 physical experiment calls against a frozen maximum of 48 logical calls.

The second run used `Qwen/Qwen3.5-122B-A10B-GPTQ-Int4`, revision `30cd92cba9707a9aba09d1e490ed4b66b78e9606`, with the same sampling settings. It ran on one eight-GPU tensor-parallel endpoint and completed 33 logical and 33 physical experiment calls, plus two excluded readiness-canary calls. A strict excluded canary and live server receipt bound the served model, revision, process, runtime, and endpoint before production. This is a robustness check within the Qwen lineage, not an independent model-family replication.

The eight prefixes were:

| Prefix | Source campaign seed | Source history |
|---|---:|---|
| 51201-GUARDED_GROWTH | 51201 | Guarded-routing campaign |
| 51203-FIXED_COVERAGE | 51203 | Fixed-coverage campaign |
| 51204-FIXED_COVERAGE | 51204 | Fixed-coverage campaign |
| 51204-GUARDED_GROWTH | 51204 | Guarded-routing campaign |
| 51205-FIXED_COVERAGE | 51205 | Fixed-coverage campaign |
| 51206-FIXED_COVERAGE | 51206 | Fixed-coverage campaign |
| 51207-FIXED_COVERAGE | 51207 | Fixed-coverage campaign |
| 51208-FIXED_COVERAGE | 51208 | Fixed-coverage campaign |

Because source seed 51204 appears twice, these are eight paired histories but seven unique source seeds. Focused inference request seeds were deterministically derived and paired within each source history. We report counts and matched differences without an ordinary eight-independent-sample significance test. More importantly, all eight initial treatment payloads and all eight empty-receipt unknown-preservation payloads were byte-identical within each task; model-facing obligation diversity was one.

## 8. Results

### 8.1 Primary result

The full action-card treatment produced the exact validator-admissible confirmation in every repeated sample for both models. The empty-receipt condition produced none. Every treatment success also satisfied the treatment-only `CONFIRM` contract.

**Table 3. Focused matched action-card results for one repeated model-facing obligation.**

| Model | Empty receipt: common exact + valid action | Full card: common exact + valid action | Full card: matching `CONFIRM` | Full-card successes on first answer | Rescued by correction | Empty-receipt check passed | False resolutions |
|---|---:|---:|---:|---:|---:|---:|---:|
| Qwen3-32B | 0/8 | **8/8** | 8/8 | 8/8 | 0 | 8/8 | 0 |
| Qwen3.5-122B | 0/8 | **8/8** | 8/8 | 8/8 | 0 | 7/8 | 0 |

For Qwen3-32B, every empty-receipt positive sample used its allowed correction and still failed the primary outcome. Every full-card sample succeeded on the first answer. The matched difference was therefore +8 successful repeated samples out of eight.

Qwen3.5-122B repeated the same primary pattern: 0/8 for the empty-receipt condition and 8/8 for the full card, all on the first answer. The run used one additional call in the safety set, for 33 experiment calls in total rather than 32.

The result is exact rather than interpretive. Every counted treatment answer named the Miyazaki battalion, Nippon Paper Yatsushiro mill, and quantity one carried by the verified source assignment; confirmed the supplied receipt; cited only allowed current-decision observations; acknowledged the current required unknowns; passed the ordinary decision score; and was accepted by the continuous-state refinement engine.

### 8.2 Empty-receipt unknown-preservation result

Qwen3-32B passed all eight complete empty-receipt checks. Qwen3.5-122B passed seven. Across both models, the specified unsupported moving-unit question remained open in every case and there were zero false resolutions.

The remaining Qwen3.5 case is informative. After one correction it returned no assignment and no supporting observation. It therefore failed the frozen assignment-count and supporting-observation rules. It did **not** invent evidence, and it did **not** claim that the missing report had been resolved. We report 7/8 for the complete safety contract rather than converting honest non-resolution into a full pass.

### 8.3 What changed—and what did not

The focused fork did not rerun the preceding incident or continue the treatment to the 72-hour close. It therefore provides no new estimate of demand coverage, urgent unmet demand-hours, or waste. Those measures belong only to the separate continuous campaign.

The focused result isolates a specific prompt-and-contract surface: an empty receipt array versus one complete answer-bearing action card. It does not isolate the card's ingredients from one another. Exact assignment, current evidence links, current unknown requirements, authority and eligibility text, receiving-step placement, and mandatory disposition changed together.

## 9. Interpretation

### 9.1 The result concerns model-visible access, not proven forgetting

We cannot infer from model outputs that the LLM internally “forgot” the source assignment. The assignment remained present in the saved state and audit record, but the empty-receipt control prompt did not contain it. The observable comparison is therefore direct: the receiving model got either no receipt or the complete answer-bearing receipt bundle.

The experiment shows that the model could execute the exact source-to-refinement relation when that relation was made explicit in its current task. It does not show that the model would fail to retrieve the assignment from a prompt that contained it as ordinary history, because that control has not yet been run.

The focused experiment therefore supports a narrower statement: when the full card was present, the exact validator-admissible action appeared; when the card field was empty, it did not. Ordinary-history, summary, and retrieval controls are necessary before attributing the effect specifically to obligation semantics.

### 9.2 Why the action card worked remains an ablation question

The action card is short, structured, answer-bearing, linked to current evidence requirements, presented at a known dependent step, and mandatory to resolve. The surrounding experiment binds it to verified state. Any one of those properties—or their interaction—could explain the result. The present experiment tests the full bundle. It cannot identify one component as the cause.

The safest interpretation is functional:

> The complete action-card bundle made one verified source assignment explicit and executable in its known receiving task.

Determining whether timing, exact identifiers, evidence links, brevity, or mandatory disposition carries most of the effect requires the ablations in Section 12.

### 9.3 Who decides when an obligation is due?

Deterministic code did so in this experiment. The scenario already defined the relationship between the collapse-site assignment and its dispatch confirmation. Code verified the source action, checked current eligibility, and constructed the card for the linked decision at the same cutoff.

This design avoids asking an LLM to both discover the dependency and satisfy it in the same measurement. It also limits the conclusion. We demonstrate repeatable execution of **this one case after its dependency is known**. We do not demonstrate automatic discovery of future responsibilities.

A broader architecture could split the work:

1. the model proposes a typed future obligation while making a decision;
2. code validates its references, owner, trigger, and current-state effects;
3. a deterministic or independently checked monitor activates it;
4. the responsible model interprets and disposes it; and
5. high-risk, ambiguous, or conflicting cases escalate to a human.

### 9.4 Proposed systems generalization

The focused result motivates a fuller mechanism we call **obligation routing**:

- identify a consequential validated decision and its dependent work;
- preserve the exact action, source evidence, ownership, and lifecycle state in a canonical record;
- version its unresolved questions as evidence changes;
- recognize a known point at which follow-up becomes required;
- place that obligation in the current decision context; and
- require a disposition that is checked against current state.

Only the first experiment-specific projection and receiving-step disposition were tested here. Source-time creation, persistent storage, delayed activation, changing evidence, ownership, and lifecycle transitions remain proposed work.

## 10. Rescue World as an inspectable artifact

The experiment produces more information than a single score can communicate. Rescue World turns the state chain into an inspectable story for a non-specialist. Its primary explanatory sequence is:

1. **Situation:** what reports were available and what remained unknown;
2. **Proposal:** what the AI wanted to assign, in what quantity, and where;
3. **Rule result:** whether the proposal passed, and the specific reason if it did not;
4. **State consequence:** what changed—or did not change—in the modeled run; and
5. **Linked responsibility:** which verified source assignment appeared in the focused action card.

The interface uses three questions, summarized as **Model, Move, Mesh**:

- **Model:** What picture of the situation did the AI build from the reports available then?
- **Move:** What exact action did it propose, and did that action enter the modeled state?
- **Mesh:** Did the source assignment, current evidence requirements, and current unknowns remain connected through the handoff?

The 3D replay, decision network, run tree, impact view, and presentation materials are visual aids for these questions. They do not create the empirical result. Their contribution is traceability: a reviewer can see where the information came from, what the model proposed, why code accepted or rejected it, and how the action card changed the receiving decision. We did not run a human comprehension or audit-performance study.

The public record remains separate and explicitly labeled as not a score. Rescue World does not grade real responders, estimate lives saved, or claim that an AI proposal was operationally superior.

## 11. Threats to validity

### 11.1 Internal validity

**Bundled intervention.** The treatment combines exact assignment content, compact structure, evidence identifiers, open questions, authority and eligibility text, receiving-step delivery, and mandatory `CONFIRM`/`DECLINE`. No component ablation has been run.

**Answer-bearing state projection.** The card deliberately contains the exact exercise-eligible source assignment. The experiment therefore measures whether the model can execute a supplied state-to-action bundle, not independent reasoning, search, or retrieval.

**Absent-fact control.** The empty-receipt control did not receive the source assignment elsewhere in its model-visible input. The experiment does not isolate action-card semantics from simple access to the answer-bearing fact.

**Same-cutoff fork.** The source and receiving decisions shared one 20:00 cutoff in the original atomic tier. The focused fork began from an accepted post-source prefix but introduced no elapsed incident time, context growth, or shift change. It is not a test of delayed resurfacing.

**Repeated model-facing input.** All eight positive treatment prompts carried the same card and task; all eight empty-receipt checks also shared one prompt. The histories establish eight verified source wrappers across seven unique source seeds, but obligation-content diversity is one.

**Receiver-time observation construction.** The card copied the exact source assignment but selected allowed observation identifiers and required unknowns from the receiving packet. The target-or-resource-status heuristic did not mechanically prove that every selected observation supported the assignment, and the card did not preserve the source decision's full evidence or unknown set.

**Post-diagnostic design.** We designed the focused test after observing the 0/32 handoff failure. The eight histories were conditionally selected because they contained a valid eligible source assignment. This is an exploratory mechanism study, not a preregistered population estimate.

The final card design also followed five excluded bounded-probe runs, one excluded direct-memory run, and one excluded indexed-memory campaign. Those iterations shaped the intervention and were not pooled as evidence for its effect.

**Non-independent prefixes.** The eight histories contain seven unique seeds because seed 51204 contributes two source trajectories.

**Prompt length.** The control and treatment are structurally matched but not token-matched; the treatment necessarily includes the action card.

**Stochastic execution.** Sampling settings and request seeds were pinned and endpoint order was counterbalanced, but GPU inference is not assumed to be mathematically deterministic.

### 11.2 Construct validity

**One operational dependency.** The primary outcome measures one exact assignment-confirmation handoff. It does not cover plans, preferences, diagnoses, or open-ended obligations.

**Known trigger.** Code already knew when the card was due. The study does not measure trigger discovery, missed triggers, or false triggers.

**One empty-receipt check.** The separate check concerns one missing-report pattern and a frozen set of ordinary decision rules. It does not test an active invalid, stale, forged, superseded, or conflicting card.

**Mechanical validity is not operational quality.** “Valid” means that an output satisfied the frozen simulator's evidence, resource, quantity, unknown, and carried-state contracts. It does not mean that the action would be correct in a real emergency.

**Author-defined domain contract.** The authors defined the scenario, dependency, eligible actions, observation selection, validator, and outcome. No emergency-management expert has yet validated that this focused dependency or its evidence mapping is operationally representative.

### 11.3 External validity

The study uses one reconstructed incident, one handoff type, one repeated model-facing obligation across eight conditionally selected histories, and two models from the same Qwen family. It includes no humans in the decision loop and no live operations. It does not test multiple simultaneous obligations, conflicts, revision, cancellation, expiry, reassignment, escalation, or obligations spanning any elapsed period.

The focused fork also does not evaluate a production obligation system's scheduling semantics, idempotency, duplicate delivery, crash recovery, concurrency, storage overhead, prompt overhead, throughput, latency scaling, or behavior as active records accumulate. Those measurements are required for a full systems claim.

### 11.4 Reproducibility and artifact limits

The repository includes a portable evidence bundle containing exact plans, accepted analyses, model identities, semantic hashes, and a verification manifest. The complete continuous result and raw focused model-call directories are not included in Git. Consequently, a clean checkout can verify the accepted summaries and public feed but cannot independently replay every raw inference without a separate archival supplement. The receipt protocol linked in the live tree was edited after execution; the run-bound protocol bytes are at commit `58ba8b3240bf7e404442f7cadec3421ebdf64369` with SHA-256 `58125098adfb7163330220621f1f694c3959a75a37f161fcb403d2707fa340ad`.

For publication, the artifact should include every permissible raw request, response, validation trace, receipt, state projection, server receipt, and collection command, or deposit those materials in a durable external archive.

## 12. Necessary ablations

The next controlled experiment should keep the source histories, model settings, validator, and decision packet fixed while comparing:

1. the full action card;
2. the same facts presented as an ordinary history excerpt;
3. the same facts in a token-matched free-form summary;
4. assignment and evidence without a due obligation;
5. a due obligation without evidence links;
6. the full card without mandatory `CONFIRM` or `DECLINE`;
7. the full card delivered early or always visible rather than only when due; and
8. an assignment-only card.

These arms would distinguish answer access from structure, timing, evidence linkage, and forced disposition. Additional safety arms should supply invalid, stale, superseded, and forged active cards that the model must decline. The experiment should use fresh, preregistered histories with many distinct obligation contents rather than reuse the eight discovery prefixes.

## 13. Generalizing the mechanism

A long-running obligation ledger needs more than `ACTIVE`, `CONFIRMED`, and `DECLINED`. At minimum it should support:

- `BLOCKED` when required evidence is still missing;
- `SUPERSEDED` when a newer validated decision replaces the old one;
- `CANCELLED` when an authorized actor closes it;
- `DISPUTED` when evidence or ownership conflicts;
- `EXPIRED` when the due window closes; and
- `ESCALATED` when the model cannot safely resolve it.

It also needs explicit priority, ownership, dependencies, evidence versions, conflict rules, and human escalation. Multiple cards may become due together. New evidence may invalidate an earlier commitment. Two earlier decisions may demand incompatible uses of one resource. A mature system must resolve these conditions before it can serve as a general operating layer for long-running AI work.

The next research program should therefore test:

1. stale or invalid cards that should be declined;
2. new evidence that reverses the earlier decision;
3. conflicting cards and simultaneous deadlines;
4. cancellation, replacement, reassignment, and escalation;
5. AI-proposed triggers checked by code;
6. false-trigger and missed-trigger rates;
7. a complete 72-hour campaign with obligations active throughout;
8. an unrelated model family;
9. a second incident and a non-disaster workflow; and
10. performance as both historical state and active obligations grow.

Candidate domains include hospital transfers, security incidents, maintenance programs, financial approvals, research operations, and supply-chain coordination—any setting where a decision creates follow-up work whose evidence and ownership must survive time and handoffs.

## 14. Claim boundary

**Table 4. What the current evidence supports and does not support.**

| Supported by this study | Not established by this study |
|---|---|
| All 32 accepted continuous campaigns failed the paper-mill confirmation. | All 32 had an exercise-eligible source assignment available. |
| Eight selected source wrappers contained a valid eligible source assignment. | The eight wrappers are eight independent incidents, seeds, tasks, or card contents. |
| The full action-card bundle produced an exact valid follow-up in 8/8 repeated samples for each tested model. | One particular card field caused the result. |
| Empty-receipt controls produced 0/8 exact valid follow-ups for each model. | The result generalizes to all agents, tasks, incidents, or models. |
| The unsupported question remained open in all empty-receipt checks; false resolutions were zero. | The action-card mechanism safely rejects invalid, stale, forged, or conflicting active cards. |
| Deterministic code successfully constructed a card for a known same-tier dependency. | The system automatically discovers, stores, or later activates obligations. |
| The focused fork tested one same-cutoff dependency from accepted post-source prefixes. | The result demonstrates an obligation persisting across time, sessions, shifts, or context growth. |
| Rescue World can display and trace the accepted modeled decisions and state changes. | The system improved a real response, served real people, or saved lives. |

## 15. Ethical and operational boundary

Rescue World is an exercise and research artifact. Its decisions are modeled proposals generated after the historical deadlines, not actions taken during the earthquake. Modeled demand units are analytical constructs, not people, households, vehicles, or responder capacity. The historical response is not an answer key, and the system does not grade real responders.

An obligation-routing system deployed in a high-stakes environment could create new risks: stale obligations may be surfaced with unwarranted authority; erroneous source decisions may be amplified; mandatory dispositions may encourage premature closure; and code-defined triggers may omit context that human experts consider essential. Deployment would require expert-designed authority rules, auditable overrides, conservative failure states, privacy controls, and human responsibility for consequential decisions.

## 16. Conclusion

Rescue World began as an investigation into how growth-inspired information routing could preserve useful signals, uncertainty, and evidence. Benchmark results showed that routing and state structure could materially affect source-sensitive decisions, while the continuous earthquake exercise exposed a more precise handoff failure: a linked confirmation never produced the exact validator-admissible assignment required by its sibling proposal.

The focused action card addresses that seam by placing the exact verified source assignment, selected allowed observation identifiers, current required unknowns, authority-and-eligibility text, and an explicit disposition contract in the receiving task, then validating the result against current state.

Across eight repeated samples of one exercise-eligible handoff, the full action-card bundle produced the exact valid follow-up in every case for Qwen3-32B and Qwen3.5-122B; empty-receipt controls produced none. This is a useful exploratory mechanism result for this task. It is not a general proof about memory, delayed obligation routing, autonomous trigger discovery, disaster performance, or the card's individual components.

The broader research direction is to test whether long-running AI systems can turn consequential decisions into explicit, evidence-linked obligations that remain visible until they are validly completed, revised, declined, or escalated. The present study supplies one narrow starting point for that program.

## Artifact and evidence map

- Continuous campaign protocol (full laboratory workspace: `experiments/kumamoto-continuous-campaign/CONTINUOUS-PROTOCOL.md`)
- [Continuous campaign findings](CONTINUOUS-CAMPAIGN-FINDINGS.md)
- Current post-run receipt protocol (full laboratory workspace: `experiments/kumamoto-bounded-probe-pilot/RECEIPT-DISPOSITION-PROTOCOL.md`); run-bound bytes are at commit `58ba8b3240bf7e404442f7cadec3421ebdf64369`, SHA-256 `58125098adfb7163330220621f1f694c3959a75a37f161fcb403d2707fa340ad`
- [Portable focused evidence](evidence/receipt-fork/README.md)
- [Acceptance manifest](evidence/receipt-fork/acceptance-manifest.json)
- [Yuki handoff](YUKI-HANDOFF-2026-08-28.md)
- [Rescue World one-sheet](YUKI-RESCUE-WORLD-ONE-SHEET.md)
- [Orchestration process map](ORCHESTRATION-PROCESS-MAP.html)

### Accepted artifact identities

- Continuous campaign analysis SHA-256: `db550832dbb19c3b94d15a343f7c6aedc1db458a9390e1a83169bffa7d7e6371`
- Continuous campaign canonical certificate hash: `ade0de9f45b3c5c05f381c725de49e4e50fffba3f3529a56d80832ee6e61aad8`
- Qwen3-32B focused analysis SHA-256: `e00a3f01a3e21f2a20f4ca816d61823c3012cc55802b69745d30078840d7f8bb`
- Qwen3.5-122B focused analysis SHA-256: `33bcdffecb0fa70109ddaaad388ab7b57f9776537f09007ce4f76abfc59385ae`

## References

1. Nghi D. Q. Bui and Georgios Evangelopoulos. 2026. “Agentic Coding Needs Proactivity, Not Just Autonomy.” Google Research, to appear. <https://research.google/pubs/agentic-coding-needs-proactivity-not-just-autonomy/>
2. Yifan Wu, Lizhu Zhang, Yuhang Zhou, Mingyi Wang, Bo Peng, Serena Li, Xiangjun Fan, and Zhuokai Zhao. 2026. “Remember When It Matters: Proactive Memory Agent for Long-Horizon Agents.” arXiv:2607.08716. <https://arxiv.org/abs/2607.08716>
3. Zexue He, Yu Wang, Churan Zhi, Yuanzhe Hu, Tzu-Ping Chen, Lang Yin, Ze Chen, Tong Arthur Wu, Siru Ouyang, Zihan Wang, Jiaxin Pei, Julian McAuley, Yejin Choi, and Alex Pentland. 2026. “MemoryArena: Benchmarking Agent Memory in Interdependent Multi-Session Agentic Tasks.” arXiv:2602.16313. <https://arxiv.org/abs/2602.16313>
4. Yiting Shen, Kun Li, Wei Zhou, and Songlin Hu. 2026. “Mem2ActBench: A Benchmark for Evaluating Long-Term Memory Utilization in Task-Oriented Autonomous Agents.” *Proceedings of ACL 2026*, 8173–8190. <https://aclanthology.org/2026.acl-long.370/>
5. Yaoqi Chen, Haibin Lai, Yuru Feng, Chuyu Han, Qianxi Zhang, Baotong Lu, Menghao Li, Xinjiang Wang, Zhirui Wang, Shusen Xu, Zengzhong Li, Zewen Jin, Hao Wu, Cheng Li, and Qi Chen. 2026. “Beyond Semantic Organization: Memory as Execution State Management for Long-Horizon Agents.” arXiv:2606.06090. <https://arxiv.org/abs/2606.06090>
6. Junjue Wang, Weihao Xuan, Heli Qi, Pengyu Dai, Kunyi Liu, Hongruixuan Chen, Zhuo Zheng, Junshi Xia, Stefano Ermon, and Naoto Yokoya. 2026. “Can LLM Agents Respond to Disasters? Benchmarking Heterogeneous Geospatial Reasoning in Emergency Operations.” arXiv:2605.11633. <https://arxiv.org/abs/2605.11633>
7. Thomas T. Hildebrandt and Raghava Rao Mukkamala. 2011. “Declarative Event-Based Workflow as Distributed Dynamic Condition Response Graphs.” *EPTCS* 69: 59–73. <https://arxiv.org/abs/1110.4161>
8. Pınar Yolum and Munindar P. Singh. 2002. “Flexible Protocol Specification and Execution: Applying Event Calculus Planning Using Commitments.” *AAMAS '02*, 527–534. <https://doi.org/10.1145/544862.544867>
9. Zora Zhiruo Wang, Jiayuan Mao, Daniel Fried, and Graham Neubig. 2025. “Agent Workflow Memory.” *Proceedings of the 42nd International Conference on Machine Learning*, PMLR 267:63897–63911. <https://proceedings.mlr.press/v267/wang25bx.html>
10. Charles Packer, Sarah Wooders, Kevin Lin, Vivian Fang, Shishir G. Patil, Ion Stoica, and Joseph E. Gonzalez. 2023. “MemGPT: Towards LLMs as Operating Systems.” arXiv:2310.08560. <https://arxiv.org/abs/2310.08560>
11. Qingyun Wu, Gagan Bansal, Jieyu Zhang, Yiran Wu, Beibin Li, Erkang Zhu, Li Jiang, Xiaoyun Zhang, Shaokun Zhang, Jiale Liu, Ahmed Hassan Awadallah, Ryen W. White, Doug Burger, and Chi Wang. 2024. “AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversations.” *Conference on Language Modeling (COLM 2024).* <https://openreview.net/forum?id=BAakY1hNKS>
12. Stanley Lima, Jaime Correia, Filipe Araújo, and Jorge Cardoso. 2021. “Improving Observability in Event Sourcing Systems.” *Journal of Systems and Software* 181:111015. <https://doi.org/10.1016/j.jss.2021.111015>
13. Tong Wang, Pei Xu, Shiyue Cao, Likun Yang, Daipeng Li, Jianbin Jiao, and Kaiqi Huang. 2026. “SAMem: State-Aware Memory as a Fine-Grained Memory for LLM Agents in Decision-Making.” *Findings of ACL 2026*, 14691–14710. <https://doi.org/10.18653/v1/2026.findings-acl.722>
14. Yiran Wu, Tianwei Yue, Shaokun Zhang, Chi Wang, and Qingyun Wu. 2024. “StateFlow: Enhancing LLM Task-Solving through State-Driven Workflows.” *Conference on Language Modeling (COLM 2024).* <https://openreview.net/forum?id=3nTbuygoop>

## Internal experimental references

- **A1.** Growth Graph Tactics — Final Report (full laboratory workspace: `experiments/growth-graph-benchmark/results/production/FINAL-REPORT.md`)
- **A2.** Growth Intelligence Layer Ablation — Final Report (full laboratory workspace: `experiments/growth-layer-ablation/results/production/FINAL-REPORT.md`)
- **A3.** Evidence-State Routing — Final Report (full laboratory workspace: `experiments/evidence-state-routing/results/production/FINAL-REPORT.md`)
- **A4.** Kumamoto real-response graph test — frozen production results (full laboratory workspace: `experiments/kumamoto-real-response/PRODUCTION-RESULTS.md`)
- **A5.** Continuous campaign protocol (full laboratory workspace: `experiments/kumamoto-continuous-campaign/CONTINUOUS-PROTOCOL.md`)
- **A6.** [Continuous campaign findings](CONTINUOUS-CAMPAIGN-FINDINGS.md)
- **A7.** Current post-run receipt-disposition protocol (full laboratory workspace: `experiments/kumamoto-bounded-probe-pilot/RECEIPT-DISPOSITION-PROTOCOL.md`); run-bound commit/hash listed in the artifact map
- **A8.** [Portable receipt evidence acceptance manifest](evidence/receipt-fork/acceptance-manifest.json)

## Figure plan for the submission version

1. **Tested flow versus proposed lifecycle:** clearly separate the receiving-time prompt transformation from the untested persistent-ledger design.
2. **72-hour timeline:** all eleven decisions, showing the collapse assignment and paper-mill confirmation at the same 20:00 cutoff inside one atomic tier.
3. **Matched fork:** identical verified source wrapper branching into empty and full receipt.
4. **Repeated-sample matrix:** eight rows, two models, control/treatment primary result, and empty-receipt check status; visually mark the two prefixes sharing seed 51204 and state that all model-facing card contents are identical.
5. **Action-card anatomy:** each implemented model-visible field, its receiver-time source, its validator, and the source-binding provenance that stayed outside the card.
6. **Rescue World inspection surface:** available reports, proposal, rule result, state consequence, and focused action card.

## Author checklist before external submission

- Finalize author names, affiliations, contribution statement, and corresponding author.
- Choose a venue and convert this Markdown draft to its required template.
- Archive permissible raw calls and validation traces in a durable supplement.
- Add final figures from the verified Rescue World surfaces.
- Do not describe an action-card-specific causal effect until fact-matched controls separate answer access, structure, timing, observation linkage, and forced disposition.
- Preserve the exact units everywhere: eight verified source wrappers, seven unique source seeds, and one repeated model-facing card/task.
- Do not present the Qwen3.5 run as cross-family replication.
- Keep modeled operational units separate from people, real dispatch, and human outcomes.
- Ask an emergency-management expert and an agent-memory researcher to review the claim boundary before submission.
