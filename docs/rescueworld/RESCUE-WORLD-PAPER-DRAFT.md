# Rescue World: Compiling Verified Decision Dependencies into Executable LLM Context

**A traceable case study of stateful agent handoffs**

**Working paper — revised draft, 29 August 2026**

**Authors:** To be finalized before submission

**Artifact:** [Rescue World](../../rescueworld.html)

**Evidence package:** [portable receipt-fork bundle](evidence/receipt-fork/README.md)

> **Draft status.** This manuscript reports an exploratory mechanism demonstration suited to a workshop, case-study, artifact, or demo submission. The decisive experiment repeats one identical, same-cutoff dependency through eight verified source wrappers representing seven unique source seeds. The two tested models are from the same Qwen lineage. The study does not establish delayed memory, persistent obligations, automatic dependency discovery, or superiority over fact-matched history, retrieval, or summary controls.

> **Integrity boundary.** In this paper, an **accepted** artifact passed the frozen integrity, schema, provenance, chain, and replay checks required for its experiment; “accepted” does not mean that an AI proposal was judged operationally correct. **Hash-verified** means that artifact identity, ordering, and tamper evidence were checked. It does not establish that the underlying public sources, exercise assumptions, demand model, or operational interpretation are true or expert-validated.

## Abstract

Stateful LLM workflows can preserve a dependency in verified orchestration state while omitting it from the model call that must act on it. A log may therefore remain complete while the receiving model lacks executable context. We study this boundary in **Rescue World**, a 72-hour earthquake-response exercise containing 414 hash-linked public-source and labeled-assumption events and eleven connected decision moments per campaign.

Across 32 complete campaigns, none completed one paper-mill confirmation handoff end to end. The source and receiving calls were siblings at the same 20:00 cutoff: one proposed a collapse-site assignment, and the other could confirm only a group named in that exact provisional proposal. Not every campaign created an eligible source assignment. We therefore selected eight verified source wrappers that did, representing seven unique campaign seeds but one identical model-facing assignment and receiving task.

For each wrapper, we reran the receiving decision under two matched conditions. The control received an empty `decision_receipts` array and did not receive the source assignment elsewhere. The treatment received an **action card** containing the exact verified assignment, currently allowed observation identifiers, current required unknowns, an authority-and-eligibility statement, and a mandatory `CONFIRM` or `DECLINE` disposition. The same validators, model settings, request seed, endpoint, response schema, and bounded-correction policy applied within each pair. Qwen3-32B produced the exact state-admissible action in 0/8 control executions and 8/8 treatment executions; Qwen3.5-122B-A10B repeated the 0/8 and 8/8 pattern. Every treatment success occurred on the first response.

These results establish a narrow systems mechanism: one known verified dependency became executable when the complete answer-bearing state projection was compiled into the receiving model's current decision contract. Because this transition had one mechanically determined answer, code could have executed it directly; the experiment tests faithful consumption by an existing LLM-mediated stage, not LLM necessity. The results do not establish that the action-card representation outperforms ordinary history, retrieval, a token-matched summary, or prose containing the same assignment. They also do not test delayed persistence, automatic dependency discovery, distinct obligation contents, or real emergency outcomes. Rescue World contributes an inspectable case study of the boundary between verified workflow state, model-visible context, model disposition, and deterministic state admission.

## Plain-language summary

Imagine one AI step assigns a crew to a location and a linked step must confirm that same crew. The software record contains the assignment, but the receiving AI is not shown it. The dependency exists in the workflow while remaining unusable to the model responsible for the next action.

Our action card puts the exact assignment into the receiving task, explicitly links the observations that may support it, copies the unanswered questions that must remain open, and requires a clear response. In one repeated dependency, two Qwen models completed the exact rule-passing follow-up in every treatment execution. With an empty card field and no source assignment elsewhere in the prompt, neither completed it.

This demonstrates that the complete answer-bearing bundle made the dependency executable. It does not yet show that cards work better than another way of presenting the same facts. Fact-matched representation controls and active cards that should be declined are the decisive next experiments.

## 1. Introduction

AI workflows increasingly divide work across model calls, tools, sessions, and changing state. This creates two different kinds of state:

- **workflow state:** what the orchestration system has stored and validated; and
- **model-executable context:** what the current model call can see, interpret, and act upon.

The two are not automatically equivalent. When call B depends on a precise output from call A, a complete external log does not help B if the relevant relation never enters B's task. We call the transformation between these layers **dependency compilation**:

```text
verified workflow state
        ↓
known decision dependency
        ↓
model-visible action contract
        ↓
model disposition
        ↓
deterministic state admission
```

The action card is the model-visible intermediate representation in this pipeline. It is not merely a reminder: it joins a verified assignment to the current decision's evidence constraints, unresolved questions, and required disposition. A future system could persist and reactivate such records across elapsed time, but the experiment reported here tests only one same-cutoff handoff.

Rescue World was built to make connected decision failures observable. It replays the first 72 hours of a reconstructed Kumamoto earthquake record and inserts eleven AI decision moments. Each run sees only information available by the corresponding historical deadline. Validated actions persist. Resources cannot silently duplicate, teleport, or reset. A proposal can therefore fail even when it sounds reasonable in isolation, because it conflicts with the run's state or with a linked proposal.

The continuous exercise revealed one unusually clean failure. At a collapse-site decision, one sibling call could place response groups across two locations. A linked sibling call at the same 20:00 cutoff could confirm only a group named in that exact provisional proposal for the paper mill. None of 32 complete campaigns produced a valid confirmation. Some campaigns had never created an eligible placement. Others had, but the confirmation still selected a different group or failed the evidence rules. The state validator prevented an invalid update, so the simulated state remained internally consistent while the handoff remained unresolved.

This led to our central research question:

> **Can a known dependency in verified workflow state be compiled into model-visible context that produces the exact mechanically admissible receiving action?**

We tested the question with a paired empty-versus-full comparison. Eight verified source wrappers contained an eligible paper-mill assignment in the provisional sibling proposal. For each wrapper, the control decision received an empty receipt array. The treatment received one canonical model-visible card carrying the exact assignment, current allowed observation identifiers and required unknowns, authority-and-eligibility text, and a mandatory confirm-or-decline disposition. The validator, base decision packet, model settings, request seed, endpoint, response schema, and bounded correction policy were matched within each pair, but the facts and token counts were not: the control lacked the source assignment. All eight treatment prompts presented the same card content and task; they are repeated stochastic executions, not eight distinct dependency instances.

The contribution is the integrated mechanism and its inspectable test, not the general idea that events can create obligations or that model context can be state-conditioned. Commitment protocols and declarative workflow systems have formalized pending responsibilities for decades [7, 8]. Recent agent-memory and state-machine research studies when stored state should influence later action [1–6, 9, 10, 13, 14]. Our contribution is more specific:

1. **A state-to-context compilation pattern for a known LLM decision dependency.** The tested action card joined an exact verified assignment with current allowed observation identifiers, current required unknowns, authority-and-eligibility text, and a required disposition.
2. **A focused, mechanically scored demonstration.** Across eight repeated executions of one model-facing dependency, the full bundle produced the exact validator-admissible follow-up in 8/8 executions for each of two Qwen models, while the absent-assignment control produced 0/8.
3. **An inspectable stateful artifact.** Rescue World links eleven decisions through carried resources and deterministic admission inside a 414-event, 72-hour replay, exposing the source proposal, receiving context, model output, validation result, and state consequence.

The remainder of the paper summarizes the design lineage, situates the mechanism in prior work, describes the observed failure and focused experiment, reports the result, and specifies the fact-matched and active-decline tests required for a broader claim.

## 2. Design lineage in brief

The project began with a practical question inspired by living networks: how should an AI workflow direct attention toward useful signals while preserving uncertainty and evidence? We translated ideas such as selective growth, local sensing, and bounded reinforcement into testable information-routing patterns rather than treating biology as proof. The registered aggregate result of the first growth-routing benchmark was inconclusive, but its diagnostics showed that routing could amplify both correct and incorrect early gradients [A1].

Subsequent experiments shifted the focus from network shape to information integrity. Typed evidence judgments, deterministic validation, and bounded rule feedback showed useful effects in synthetic investigations and five independent disaster-decision moments, while several broader registered claims failed [A2–A4]. The durable lesson was narrower: the workflow must control what evidence and uncertainty reach the decision-maker, and code should prevent malformed outputs from silently changing state. Detailed benchmark designs, numbers, and failed claims are retained in the internal reports rather than repeated here.

Those studies reset state between decisions. The 72-hour campaign instead carried admitted actions, resources, unresolved questions, and rejections through one connected exercise. It exposed the paper's central failure: verified workflow state and model-visible executable context had diverged at a known dependency. The focused experiment evaluates only a receiver-time projection and disposition for that dependency. A persistent source-time ledger—creating, updating, activating, superseding, and closing obligations across elapsed time—remains the broader research program, not a result of this study.

## 3. Related work

### 3.1 Memory that affects later action

Long-context access and memory retrieval do not by themselves establish that stored information will shape the correct later action. MemGPT treats context as a hierarchy of memory tiers and uses virtual context management to move information through a limited context window [10]. Agent Workflow Memory distills reusable workflows from earlier executions and selectively provides them to later tasks [9]. SAMem retrieves fine-grained memory conditioned on the agent's current state and decision [13]. These systems address context capacity, state-conditioned retrieval, and reusable procedures, whereas our focused test presents a case-specific assignment inside a required decision contract.

Recent benchmarks sharpen the distinction between recall and action. MemoryArena evaluates interdependent multi-session tasks in which earlier interactions must guide later behavior [3]. Mem2ActBench tests whether long-term memory is used to select tools and ground their parameters rather than merely answer factual questions [4]. MAGE argues that semantic retrieval can mismatch execution-state dependencies and instead stores a hierarchical execution-state tree whose summaries are validated during maintenance [5]. Rescue World shares their memory-to-action concern but focuses on an exact exercise-eligible assignment derived from verified system state.

Among the closest recent implementation-level neighbors we found is *Remember When It Matters*, which identifies “behavioral state decay” and uses a separate memory agent to inject grounded reminders selectively when the current state makes them useful [2]. A close conceptual neighbor is Google's *Agentic Coding Needs Proactivity, Not Just Autonomy*, which proposes an “insight policy” deciding what matters next, what evidence supports it, and whether to surface it [1]. StateFlow represents LLM workflows as state machines with rule- or model-controlled transitions [14]. Our study instantiates one specific combination: a deterministic known-dependency routing rule, an exact state-derived assignment, current-decision evidence and unknown requirements, a mandatory confirm-or-decline disposition, mechanical admission, and an inspectable state transition in a non-coding exercise.

### 3.2 Commitments and declarative workflow

The underlying notion of pending responsibility is established prior art. Commitment protocols model social obligations whose state changes as agents act [8]. Dynamic Condition Response graphs represent event relations including conditions and required responses, and distributed variants assign roles to events [7].

Event-sourcing systems also preserve immutable histories for replay, while observability research shows why histories may still need explicit causal and execution metadata to support diagnosis [12]. This distinction parallels our separation between a stored event record and a due operational responsibility.

Our claim is therefore not that Rescue World invented obligations. The focused study evaluates an integration pattern for stochastic LLM decision-making: project an exact verified assignment into a receiving task; join it with observation identifiers allowed by the receiving packet and its required unknowns; require an explicit model disposition; and admit the resulting action only if deterministic state and evidence rules pass. Rescue World adds a traceable environment in which the source proposal, model-visible card, response, and resulting state can be inspected together. A persistent source-time obligation lifecycle is a proposed extension, not a component evaluated here.

### 3.3 Agent orchestration and disaster evaluation

Frameworks such as AutoGen support flexible multi-agent conversations and programmable interaction patterns [11]. Rescue World uses routed scouts, reviewers, and a coordinator, but its research question is not about a particular conversation topology. It asks how an exact workflow dependency crosses linked model calls—and, in future work, how such dependencies might persist across time.

DORA is among the closest disaster-agent benchmarks we found. It evaluates 515 expert-authored tasks across 45 real disaster events and 108 geospatial tools, with a focus on end-to-end geospatial reasoning and long tool trajectories [6]. Rescue World examines a known dependency inside one changing incident: when one modeled proposal constrains a linked exercise-eligible action, can an AI workflow execute that handoff? The two efforts are complementary. Neither warrants claims about real-world response effectiveness without expert validation and deployment evidence.

### 3.4 Novelty position

The defensible contribution is a **traceable case-study demonstration of one receiver-time state projection under deterministic admission rules**. We do not claim priority over event obligations, proactive reminders, execution-state memory, state-driven workflows, replayable histories, or disaster-agent benchmarks. We also do not claim a universal memory solution, action-card-specific causal effect, or tested persistent obligation lifecycle.

**Table 1. Position relative to representative system classes.**

| System class | Already established | Rescue World instantiation evaluated here | Current boundary |
|---|---|---|---|
| Declarative response workflows [7] | Conditions, required responses, pending work, and role distribution | Projects one known workflow dependency into an LLM-visible decision packet and validates the response with domain rules | No persistent response lifecycle, delayed activation, conflicts, or concurrency tested |
| Commitment protocols [8] | Explicit obligations and commitment-state evolution | Binds one eligible assignment to a receiving-model disposition and an inspectable state-admission trace | No new commitment semantics, ownership model, or autonomous trigger discovery |
| State-driven LLM workflows [14] | Rule- or model-controlled workflow states and transitions | Tests one exact data-level dependency crossing two model calls with field-level output admission | Not a new state-machine framework or a comparison against StateFlow |
| State-aware agent memory [13] | Retrieval of fine-grained experiential memory for the current state | Deterministically projects authoritative workflow state rather than retrieving experiential memory | No retrieval, delay, long-horizon memory, or SAMem comparison tested |

The present evidence therefore supports an evaluated integration pattern: deterministic code can project one known eligible assignment and its current constraints into an LLM decision packet, then mechanically check whether the proposed action may change state. “Compile” denotes this frozen schema-to-prompt serialization; it does not imply a general-purpose compiler, a learned dependency detector, or a proof of semantic equivalence.

## 4. Rescue World

### 4.1 A continuous incident rather than isolated questions

Rescue World reconstructs the first 72 hours after a modeled 2026 Kumamoto earthquake as 414 hash-linked events. The source layer combines public records with clearly labeled exercise assumptions. Eleven AI decision moments cover fire mobilization, missing telemetry, municipal liaisons, escalation posture, collapse-site assignments, dispatch confirmation, defense coordination, water priorities, shelter actions, aftershock checks, and a final rescue-to-water mission shift.

At each decision, the model receives only information available by that cutoff, its own validated earlier state, and the exercise assumptions disclosed for that moment. It does not receive the historical response as an answer key, later public reports, future modeled demand, or another method's state. The public record appears only as a separately labeled comparator.

Every proposal passes through deterministic checks. These verify the response shape, resource and destination eligibility, quantity, visible evidence identifiers, required unknowns, current commitments, capacity, and decision-specific rules. A valid proposal changes the modeled state atomically. An invalid proposal remains visible in the audit record but changes nothing.

### 4.2 The continuous campaign

The artifact-accepted campaign reported here is the directory `kumamoto-continuous-production-v1.accepted`, not the separate accepted growth campaign on the same seeds. It used Qwen3-32B-AWQ at a pinned model revision, temperature 0.2, and top-p 0.95. Four stateful orchestration methods each completed eight seeded campaigns. Every campaign contained eleven decisions, producing 32 chains and 352 certified decision-cell artifacts. Many cells contain proposals that were rejected by the frozen rules; 158 proposals were admitted and changed state. All 352 cell artifacts and all 32 state chains passed the artifact-acceptance checks. The excluded engineering smoke run was not pooled with the results.

Three terms remain distinct throughout the paper:

- an **artifact-accepted campaign** passed the experiment's completeness, integrity, provenance, chain, and replay gates; this does not mean every proposal passed;
- an **admitted action** passed the frozen simulator rules and changed modeled state; and
- an **eligible source wrapper** is a certified saved prefix containing a source assignment that satisfies the focused refinement contract.

The four methods varied how scouts, reviewers, typed evidence, and one bounded correction were routed before coordination. Those descriptive method outcomes belong to the continuous-campaign report [A5, A6]; they are not the causal comparison in this paper. What matters here is that the runner carried validated state across all eleven decisions and exposed the shared handoff failure described next. The campaign's modeled impact units remain exercise constructs, not people, real dispatches, or real outcomes.

## 5. Failure diagnosis: a known assignment was absent from the receiving task

At 20:00, the collapse-site decision could assign five modeled response groups across Aeon Mall Kumamoto and the Nippon Paper Yatsushiro mill. A linked confirmation asked which groups from that exact provisional proposal could be confirmed for the mill after a dispatch system returned. The confirmation was a refinement: it could select only a group named at that target in the sibling proposal.

In the original continuous campaign, these two model calls belonged to one atomic decision tier. Both had the same `2026-07-28T20:00:00+09:00` cutoff and were answered from the same pre-tier state. The confirmation was bound to the exact provisional collapse-site proposal before the pair was committed. The focused experiment later selected artifact-accepted post-assignment prefixes containing an admitted source action and reran only the confirmation model call from those saved bytes; admission replayed the saved source proposal before evaluating the confirmation. It did not test a delay, a shift change, or context growth between source and receiving decisions.

All 32 complete campaigns failed the confirmation. This aggregate statement needs an important qualification. A campaign could fail for two different reasons:

1. the collapse-site proposal was invalid, leaving no eligible assignment to confirm; or
2. an eligible assignment existed, but the follow-up selected a different group or failed the evidence rules.

The 32-run observation therefore does **not** show that all 32 model calls forgot an available exercise-eligible assignment. It shows that the end-to-end handoff was unresolved in every complete campaign.

For a focused mechanism test, we selected the eight saved histories that contained a mechanically verified source assignment eligible for the confirmation. These were eight wrappers but only seven unique source campaign seeds; seed 51204 contributed two artifact-accepted wrappers. The experimental plan bound each wrapper to its source decision, validator result, exact resource-target-quantity tuple, state checkpoint, and refinement contract.

All eight wrappers produced the same model-facing task and the same card: one Miyazaki battalion assigned to the Nippon Paper Yatsushiro mill, with the same two observation identifiers, three required unknowns, and receipt identifier. The eight executions therefore measure repeated stochastic behavior for one dependency content, not eight distinct responsibilities.

This selection isolated the narrow question: when the exercise-eligible source assignment definitely exists, what happens if its complete action-card bundle is present in the receiving model's prompt?

## 6. The state-to-context compiler and action card

### 6.1 Human-readable idea

The tested action card says, in effect:

> The admitted source action assigned **this resource** in **this quantity** to **this place**. **These reports are visible for the current decision, and these questions are required now.** The current refinement permits this assignment. **Confirm or decline it.**

The card is not a free-form summary of the whole history. Code constructed it at the receiving step by joining one verified eligible source assignment to selected observations and required unknowns from the current decision packet. It did not copy the source decision's complete evidence set or unknown set.

### 6.2 Implemented model-visible record

The implemented compiler is a deterministic serialization:

```text
decision_receipt = compile(
    verified_source_state,
    receiving_decision_packet,
    known_dependency
)
```

The resulting decision receipt is the model-visible intermediate representation. Its human-readable presentation is the **action card**. The serialized fields are:

- `receipt_id`, derived from the card body;
- `assignment`, containing the exact resource, target, and quantity;
- `allowed_observation_ids`, selected from observations visible to the receiving decision by a frozen target-or-resource-status rule;
- `required_unknown_ids`, copied from the receiving decision's required unknown set;
- `authority_and_eligibility`, stating that the source assignment was admitted and remains eligible for this refinement; and
- `required_disposition`, instructing the model to confirm or decline the card now.

The model-visible card did not contain an owner field, explicit lifecycle state, source cutoff, source-cell certificate, parent-state hash, or executable trigger expression. The surrounding experimental plan and case provenance separately bound the saved prefix, source certificate, state, request, response, and validator result. Because the eight card bodies were identical, their receipt identifiers were also identical; the receipt identifier alone did not bind a particular history.

**Table 2. Action-card fields and their purpose.**

| Field | Plain meaning | Produced by | Checked by |
|---|---|---|---|
| Exact assignment | What the admitted source action assigned | Verified saved prefix | State and refinement validator |
| Current observations | Which report identifiers the receiving answer may cite | Receiving decision packet + frozen selection rule | Cutoff and evidence validator |
| Current required unknowns | Which unanswered items the receiving answer must acknowledge | Receiving decision packet | Required-unknown validator |
| Authority and eligibility text | Why this exact assignment may be confirmed in the exercise | Deterministic code | State and refinement validator |
| Required disposition | What the receiving model must do | Receipt contract | Receipt validator |
| Experimental source binding | Which saved prefix produced the assignment | Plan and case provenance, outside the model-visible card | Replay verifier |

### 6.3 Implemented compiler flow and proposed lifecycle

The focused fork implemented this short flow:

```text
verified eligible source wrapper
        │
        ▼
deterministically serialize source assignment + current packet constraints
        │
        ▼
model returns assignment and receipt disposition
        │
        ▼
mechanically validate receipt, evidence, unknowns, and current state
```

It did not create an obligation at source time, persist an `ACTIVE` record through a ledger, wait for a later cutoff, or continue the campaign after closing the record. The fuller lifecycle below is a proposed architecture motivated by the result, not an evaluated component:

**Table 3. Tested capabilities and proposed lifecycle boundaries.**

| Lifecycle capability | Implemented in the focused fork? | Exact boundary |
|---|---|---|
| Verify a source assignment | Yes | Loaded from an artifact-accepted post-source prefix containing an admitted action and replay-checked outside the card |
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

### 6.4 Why involve an LLM?

For this exact confirmation case, an LLM was not necessary. Once code had deterministically selected and verified the card's exact exercise-eligible assignment, a program could have copied that assignment directly into the next state. The experiment instead asked whether an existing LLM-mediated workflow stage could faithfully consume a known dependency, bind it to current observation and unknown requirements, return the required disposition and structured decision, and pass the ordinary state validator.

That is a narrower role than autonomous planning. In a broader system, deterministic software should own verified facts, dependency rules, resource constraints, lifecycle state, and final admission. An LLM is useful only where semantic judgment remains—for example, interpreting unstructured reports, comparing several currently admissible actions, explaining uncertainty, or choosing to decline or escalate when the evidence changes. If a transition has exactly one mechanically determined answer, a production system should bypass the model.

The present experiment exercised only valid cards whose required disposition was `CONFIRM`. It did not show that the LLM could reject a stale or contradicted card, nor that model judgment improved a transition that code could already complete. Active `DECLINE` cases and dependencies with multiple admissible actions are therefore necessary to demonstrate a substantive decision-making role for the model.

## 7. Focused paired experiment

### 7.1 Research questions

- **RQ1 — Executability:** Does the full action-card bundle produce the exact validator-admissible confirmation when an eligible source assignment exists?
- **RQ2 — Empty-receipt unknown preservation:** In a separate task with no active card, does the model keep one specified missing report open without inventing evidence or falsely resolving it?
- **RQ3 — Same-lineage robustness:** Does the observed result repeat with Qwen3.5-122B-A10B under a separately verified deployment?

### 7.2 Conditions

Each of the eight eligible source wrappers produced a paired comparison:

- **Empty-receipt control:** `decision_receipts: []`; the output had to contain no receipt disposition.
- **Full-receipt treatment:** one canonical receipt constructed from the verified source assignment and current decision packet; the output had to `CONFIRM` or `DECLINE` it.

Both conditions received the same decision packet, system instructions, output schema, model settings, validator, continuous-state admission engine, and one bounded correction policy. Within each pair they used the same physical endpoint and request seed. Pair order was counterbalanced. The intervention added receipt content, so the prompts were not token-matched.

The comparison was paired on its execution surfaces but was **not fact-matched**: the empty-receipt control lacked the exact source assignment, while the treatment received that assignment together with the rest of the action-card bundle. Table 4 makes the changed surface explicit.

**Table 4. Model-visible comparison before inference.**

| Model-visible element | Empty receipt | Full action card |
|---|---|---|
| Same verified source wrapper and base decision packet | Yes | Yes |
| Exact source assignment | No | Yes |
| Receipt-selected current observation identifiers | No | Yes |
| Receipt copy of current required unknowns | No | Yes |
| Authority-and-eligibility statement | No | Yes |
| Receipt disposition | Must be absent | Must be `CONFIRM` or `DECLINE` |
| Fact matched | No | No |
| Token matched | No | No |

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

The eight wrappers were:

**Table 5. Verified source wrappers used for repeated executions.**

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

Because source seed 51204 appears twice, these are eight paired executions associated with eight verified source wrappers but seven unique source seeds. Focused inference request seeds were deterministically derived and paired within each wrapper. We report counts and paired differences without treating the repetitions as eight independent cases drawn from a task population. More importantly, all eight initial treatment payloads and all eight empty-receipt unknown-preservation payloads were byte-identical within each task; model-facing dependency diversity was one.

## 8. Results

### 8.1 Primary result

The full action-card treatment produced the exact validator-admissible confirmation in every repeated execution for both models. The empty-receipt condition produced none. Every treatment success also satisfied the treatment-only `CONFIRM` contract.

**Table 6. Focused paired action-card results for one repeated model-facing dependency.**

| Model | Empty receipt: common exact + valid action | Full card: common exact + valid action | Full card: matching `CONFIRM` | Full-card successes on first answer | Rescued by correction | Empty-receipt check passed | False resolutions |
|---|---:|---:|---:|---:|---:|---:|---:|
| Qwen3-32B | 0/8 | **8/8** | 8/8 | 8/8 | 0 | 8/8 | 0 |
| Qwen3.5-122B | 0/8 | **8/8** | 8/8 | 8/8 | 0 | 7/8 | 0 |

For Qwen3-32B, every empty-receipt positive execution used its allowed correction and still failed the primary outcome. Every full-card execution succeeded on the first answer. The paired difference was therefore +8 successful executions out of eight.

Qwen3.5-122B repeated the same primary pattern: 0/8 for the empty-receipt condition and 8/8 for the full card, all on the first answer. The run used one additional call in the empty-receipt unknown-preservation set, for 33 experiment calls in total rather than 32.

The result is exact rather than interpretive. Every counted treatment answer named the Miyazaki battalion, Nippon Paper Yatsushiro mill, and quantity one carried by the verified source assignment; confirmed the supplied receipt; cited only allowed current-decision observations; acknowledged the current required unknowns; passed the ordinary decision score; and was admitted by the continuous-state refinement engine.

### 8.2 Empty-receipt unknown-preservation result

Qwen3-32B passed all eight complete empty-receipt checks. Qwen3.5-122B passed seven. Across both models, the specified unsupported moving-unit question remained open in every case and there were zero false resolutions.

The remaining Qwen3.5 case is informative. After one correction it returned no assignment and no supporting observation. It therefore failed the frozen assignment-count and supporting-observation rules. It did **not** invent evidence, and it did **not** claim that the missing report had been resolved. We report 7/8 for the complete empty-receipt check rather than converting honest non-resolution into a full pass.

### 8.3 What changed—and what did not

The focused fork did not rerun the preceding incident or continue the treatment to the 72-hour close. It therefore provides no new estimate of demand coverage, urgent unmet demand-hours, or waste. Those measures belong only to the separate continuous campaign.

The focused result compares two prompt-and-contract surfaces: an empty receipt array versus one complete answer-bearing action card. It does not isolate the card's ingredients from one another. The exact assignment and fact access, receipt-level selection of allowed evidence, receipt-level copies of current unknown requirements, authority-and-eligibility text, and mandatory disposition changed together. Both arms otherwise retained the same base decision packet.

## 9. What the result means

### 9.1 Model-visible access, not proven forgetting or card-specific causation

We cannot infer that the LLM internally “forgot” the source assignment. The assignment remained in saved state, but the empty-receipt prompt did not contain it. Likewise, the action card changed fact access, structure, receipt-level evidence selection, receipt-level copies of current unknown requirements, authority text, and disposition together. The experiment therefore cannot attribute the result to card format or obligation semantics.

The safest interpretation is functional:

> For one known same-cutoff dependency, deterministic code projected a verified eligible source assignment and current constraints into the receiving task, and the LLM returned an action admitted by the ordinary state rules.

Fact-matched history, prose, summary, and component controls are required before making a representation claim. Delayed timing and persistence require a separate longitudinal study.

### 9.2 Who selects the receiving call?

Deterministic code did so in this experiment. The scenario already defined the relationship between the collapse-site assignment and its dispatch confirmation. Code verified the source action, checked current eligibility, and constructed the card for the linked decision at the same cutoff.

This design avoids asking an LLM to both discover the dependency and satisfy it in the same measurement. It also limits the conclusion. We demonstrate repeatable execution of **this one case after its dependency is known**. We do not demonstrate automatic discovery of future responsibilities.

A broader architecture could split the work:

1. the model proposes a typed future obligation while making a decision;
2. code validates its references, owner, trigger, and current-state effects;
3. a deterministic or independently checked monitor activates it;
4. the responsible model interprets and disposes it; and
5. high-risk, ambiguous, or conflicting cases escalate to a human.

Only the experiment-specific projection and receiving-step disposition were tested here. Source-time creation, persistence, delayed activation, changing evidence, ownership, and lifecycle transitions remain proposed work.

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

The 3D replay, decision network, run tree, impact view, and presentation materials are visual aids for these questions. They do not create the empirical result. Their contribution is traceability: a reviewer can see where the information came from, what the model proposed, why code admitted or rejected it, and how outputs differed between empty- and full-receipt executions. We did not run a human comprehension or audit-performance study.

The public record remains separate and explicitly labeled as not a score. Rescue World does not grade real responders, estimate lives saved, or claim that an AI proposal was operationally superior.

## 11. Threats to validity

### 11.1 Internal validity

**Bundled intervention.** The treatment combines exact assignment content, compact structure, evidence identifiers, open questions, authority and eligibility text, receiving-step delivery, and mandatory `CONFIRM`/`DECLINE`. No component ablation has been run.

**Answer-bearing state projection.** The card deliberately contains the exact exercise-eligible source assignment. The experiment therefore measures whether the model can execute a supplied state-to-action bundle, not independent reasoning, search, or retrieval.

**Absent-fact control.** The empty-receipt control did not receive the source assignment elsewhere in its model-visible input. The experiment does not isolate action-card semantics from simple access to the answer-bearing fact.

**Same-cutoff fork.** The source and receiving decisions shared one 20:00 cutoff in the original atomic tier. The focused fork began from an artifact-accepted post-source prefix containing an admitted action but introduced no elapsed incident time, context growth, or shift change. It is not a test of delayed resurfacing.

**Repeated model-facing input.** All eight positive treatment prompts carried the same card and task; all eight empty-receipt checks also shared one prompt. The histories establish eight verified source wrappers across seven unique source seeds, but obligation-content diversity is one.

**Receiver-time observation construction.** The card copied the exact source assignment but selected allowed observation identifiers and required unknowns from the receiving packet. The target-or-resource-status heuristic did not mechanically prove that every selected observation supported the assignment, and the card did not preserve the source decision's full evidence or unknown set.

**Post-diagnostic design.** We designed the focused test after observing the 0/32 handoff failure. The eight histories were conditionally selected because they contained a valid eligible source assignment. This is an exploratory mechanism study, not a preregistered population estimate.

The final card design also followed five excluded bounded-probe runs, one excluded direct-memory run, and one excluded indexed-memory campaign. Those iterations shaped the intervention and were not pooled as evidence for its effect.

**Non-independent prefixes.** The eight histories contain seven unique seeds because seed 51204 contributes two source trajectories.

**Prompt length and facts.** The conditions are paired on the base task but are neither fact-matched nor token-matched; the treatment necessarily includes the action card and its answer-bearing assignment.

**Stochastic execution.** Sampling settings and request seeds were pinned and endpoint order was counterbalanced, but GPU inference is not assumed to be mathematically deterministic.

### 11.2 Construct validity

**One operational dependency.** The primary outcome measures one exact assignment-confirmation handoff. It does not cover plans, preferences, diagnoses, or open-ended obligations.

**Known receiving call.** Code already knew which linked same-cutoff call should receive the card. The study does not measure trigger discovery, delayed activation, missed triggers, or false triggers.

**One empty-receipt check.** The separate check concerns one missing-report pattern and a frozen set of ordinary decision rules. It does not test an active invalid, stale, forged, superseded, or conflicting card.

**Mechanical validity is not operational quality.** “Valid” means that an output satisfied the frozen simulator's evidence, resource, quantity, unknown, and carried-state contracts. It does not mean that the action would be correct in a real emergency.

**Author-defined domain contract.** The authors defined the scenario, dependency, eligible actions, observation selection, validator, and outcome. No emergency-management expert has yet validated that this focused dependency or its evidence mapping is operationally representative.

### 11.3 External validity

The study uses one reconstructed incident, one handoff type, one repeated model-facing obligation across eight conditionally selected histories, and two models from the same Qwen family. It includes no humans in the decision loop and no live operations. It does not test multiple simultaneous obligations, conflicts, revision, cancellation, expiry, reassignment, escalation, or obligations spanning any elapsed period.

The focused fork also does not evaluate a production obligation system's scheduling semantics, idempotency, duplicate delivery, crash recovery, concurrency, storage overhead, prompt overhead, throughput, latency scaling, or behavior as active records accumulate. Those measurements are required for a full systems claim.

### 11.4 Reproducibility and artifact limits

The repository includes a portable evidence bundle containing exact plans, internally accepted analyses, model identities, semantic hashes, and a verification manifest. The hashes establish that the tracked plan, analysis, and public-feed bytes match their recorded identities; they do not establish source truth, exercise realism, or independent replay of model inference. The complete continuous result and raw focused model-call directories are not included in Git. Consequently, a clean checkout can verify the accepted summaries and public feed but cannot independently replay every raw inference without a separate archival supplement. The receipt protocol linked in the live tree was edited after execution; the run-bound protocol bytes are at commit `58ba8b3240bf7e404442f7cadec3421ebdf64369` with SHA-256 `58125098adfb7163330220621f1f694c3959a75a37f161fcb403d2707fa340ad`.

For publication, the artifact should include every permissible raw request, response, validation trace, receipt, state projection, server receipt, and collection command, or deposit those materials in a durable external archive.

## 12. The decisive next experiment

The present control omitted both the card representation and its answer-bearing facts. The next controlled study must hold fact access constant. Using fresh preregistered dependencies, every unique dependency should appear in every condition with counterbalanced order, identical semantic fields, matched total input length, the same base packet, model settings, validator, and correction policy. The arms should compare:

1. the exact assignment and supporting fields embedded in an ordinary history excerpt;
2. the same complete facts in token-matched free-form prose;
3. the same complete facts in a token-matched structured summary;
4. an assignment-only structured record;
5. the full structured record without mandatory disposition; and
6. the full action card.

The preregistered primary contrasts should compare the full card against the ordinary-history, free-form-prose, and structured-summary arms. Those contrasts distinguish an effect of fact access from an effect of action-card representation. The remaining arms separate the assignment, structure, and forced disposition. Timing should be tested in a separate longitudinal experiment that actually creates a record at source time, persists it across elapsed decisions and context growth, and activates it later; the current same-cutoff fork cannot supply that baseline.

A second required axis is **active decline**. Code should reject malformed, forged, superseded, or mechanically ineligible records before inference. To test substantive model judgment, structurally valid cards should be paired with new unstructured evidence that supports either `CONFIRM` or `DECLINE`; the scored outcome should require the correct disposition, no invalid state mutation, and an exact reason. Injected forged-card tests remain useful as defense-in-depth robustness checks, not as evidence that an LLM supplied semantic judgment. The present schema allowed `DECLINE`, but every active treatment card was valid and every successful disposition was `CONFIRM`.

Task breadth matters more than additional repetitions of the present prompt. The study should include many distinct resources, destinations, quantities, evidence patterns, unknown sets, and correct dispositions; dependencies with multiple admissible actions; at least one unrelated model family; and an ordinary deterministic baseline. If one mechanically determined answer exists, code should execute it directly rather than invoke an LLM.

## 13. Proposed longitudinal system

A long-running implementation would need explicit ownership, priority, dependency links, evidence versions, conflict rules, human escalation, and lifecycle states such as `BLOCKED`, `SUPERSEDED`, `CANCELLED`, `DISPUTED`, `EXPIRED`, and `ESCALATED`. It would also need to survive duplicate delivery, concurrency, crash recovery, reassignment, and changing evidence. None of those capabilities was evaluated in the focused fork.

The research program should therefore progress from fact-matched representation ablations, to active confirmations and declines over varied obligations, to source-time persistence across a complete campaign, and finally to conflicts, simultaneous deadlines, automatic trigger proposals checked by code, human escalation, another incident, and a non-disaster workflow. Candidate domains include hospital transfers, security incidents, maintenance programs, financial approvals, research operations, and supply-chain coordination—settings where a decision creates follow-up work whose evidence and ownership must survive time and handoffs.

## 14. Claim boundary

**Table 7. What the current evidence supports and does not support.**

| Supported by this study | Not established by this study |
|---|---|
| All 32 artifact-accepted continuous campaigns failed the paper-mill confirmation. | All 32 had an exercise-eligible source assignment available. |
| Eight selected source wrappers contained a valid eligible source assignment. | The eight wrappers are eight independent incidents, seeds, tasks, or card contents. |
| The full action-card bundle produced an exact valid follow-up in 8/8 repeated executions for each tested model. | One particular card field caused the result. |
| Empty-receipt controls that lacked the source assignment produced 0/8 exact valid follow-ups for each model. | The card is better than fact-matched history, prose, retrieval, or summary. |
| The LLM integrated the supplied assignment with the required current-decision output contract. | An LLM was necessary for this one mechanically determined confirmation. |
| The unsupported question remained open in all empty-receipt checks; false resolutions were zero. | The action-card mechanism safely rejects invalid, stale, forged, or conflicting active cards. |
| Deterministic code successfully constructed a card for a known same-tier dependency. | The system automatically discovers, stores, or later activates obligations. |
| The focused fork tested one same-cutoff dependency from artifact-accepted post-source prefixes containing admitted actions. | The result demonstrates an obligation persisting across time, sessions, shifts, or context growth. |
| Tracked plans, analyses, and public-feed artifacts match their recorded hashes. | The hashes prove source truth, exercise realism, operational correctness, or independent replay of every raw inference. |
| Rescue World can display and trace admitted modeled decisions and state changes. | The system improved a real response, served real people, or saved lives. |

## 15. Ethical and operational boundary

Rescue World is an exercise and research artifact. Its decisions are modeled proposals generated after the historical deadlines, not actions taken during the earthquake. Modeled demand units are analytical constructs, not people, households, vehicles, or responder capacity. The historical response is not an answer key, and the system does not grade real responders.

An obligation-routing system deployed in a high-stakes environment could create new risks: stale obligations may be surfaced with unwarranted authority; erroneous source decisions may be amplified; mandatory dispositions may encourage premature closure; and code-defined triggers may omit context that human experts consider essential. Deployment would require expert-designed authority rules, auditable overrides, conservative failure states, privacy controls, and human responsibility for consequential decisions.

## 16. Conclusion

Rescue World exposes a systems boundary that persistent logs do not solve by themselves: a dependency can exist in verified workflow state while remaining absent from the context of the model call responsible for acting on it. In the continuous exercise, one linked confirmation remained unresolved in all 32 complete campaigns. In the focused fork, deterministic code compiled one verified eligible assignment and current receiving constraints into an action card, and the ordinary validators controlled whether the model's response could change state.

Across eight repeated executions of one identical dependency, the complete bundle produced the exact validator-admissible follow-up in 8/8 executions for Qwen3-32B and 8/8 for Qwen3.5-122B; controls that lacked both the card and source assignment produced 0/8 for each model. This demonstrates end-to-end executability of the complete answer-bearing state projection. It does not establish that the card representation is better than fact-matched history, prose, retrieval, or summary, and it does not show that an LLM was necessary for this mechanically determined confirmation.

The strongest supported principle is therefore precise: **when an LLM step depends on a verified workflow fact, the orchestration layer can project that fact and its current constraints into the model's decision packet, then mechanically check whether the proposed action may change state.** The next experiment must compare fact-matched representations and require both valid confirmations and valid declines across many distinct dependencies. Persistent obligation routing across elapsed time remains the larger research program.

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
