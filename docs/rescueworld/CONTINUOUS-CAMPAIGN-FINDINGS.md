# What the AI teams changed during the 72-hour Kumamoto exercise

## The short version

We finally ran the experiment we had not run before: the same AI team stayed with the incident from the first earthquake alert through all eleven decisions in the first 72 hours. Its earlier choices carried forward, so a crew used at one moment could not silently reappear somewhere else later. We repeated the complete campaign eight times for each of four orchestration methods. That produced 352 scored decision moments in 32 complete chains. Every artifact, chain, endpoint assignment and result hash passed independent verification.

The strongest overall method was **guarded growth**. Compared with fixed coverage, it reduced projected urgent unmet demand-hours by an average of **84%**, and it did better in all eight matched runs. Evidence state with one bounded correction reduced them by **79%**; evidence state without correction reduced them by **75%**. These are modeled workload results inside this exercise, not lives saved or proof that a real responder should have acted differently.

The most important finding is more specific than “guarded growth won.” The fixed method handled the first collapse decision better, but then failed to adapt to water shortages, shelter load, the aftershock and the final rescue-to-water shift. The structured methods adapted to those later changes extremely well, but all four methods failed the same dispatch-confirmation handoff at the paper mill. A useful general orchestrator therefore needs both abilities: broad situational adaptation and an exact, checkable handoff from one decision to the next.

## What happened in the exercise

A magnitude 7.1 earthquake struck Kumamoto Prefecture at 16:27 on 28 July 2026. The AI teams later replayed eleven decisions from the first 72 hours in their real chronological order:

1. choose an initial outside-fire package;
2. react to missing shaking readings in Kashima and Kōsa;
3. send the first municipal liaison pairs;
4. choose the national and fire-mobilization posture;
5. split response groups between Aeon Mall Kumamoto and the Yatsushiro paper mill;
6. confirm which already-assigned groups could reach the paper mill after its dispatch system returned;
7. choose the scope of the Self-Defense Force request;
8. distribute 22 modeled water-priority units among eight municipalities;
9. choose two prefecture-wide shelter actions;
10. choose two safety checks after the 22:19 aftershock; and
11. preserve two rescue priorities while shifting one priority to regional water work.

At every moment, an AI could see only reports public by that deadline, its own earlier admitted actions, and any clearly labeled exercise assumptions. It could not see the historical answer, later reports, another method's state or future demand rows. Fixed code checked every proposal. A proposal changed the modeled situation only if its resources, destinations, quantities, report links, unknowns and carried state all passed. A rejected proposal stayed in the record but changed nothing.

## What the four methods were

- **Fixed coverage** divided every eligible place across three scouts and three reviewers in a fixed order, then sent their ordinary written judgments to one coordinator. This was a serious stateful control, not a deliberately weak single-agent baseline.
- **Guarded growth** began with the same full coverage. It gave one leading need extra attention only if all three scouts independently chose it, none marked a required fact unknown, and their evidence traced to at least three distinct public sources.
- **Evidence state** kept the same coverage and call budget, but every need had to be labeled supported, rejected or unresolved beside exact report identifiers before the coordinator acted.
- **Evidence and feedback** added at most one revision. Fixed code named the exact broken rule, and the coordinator could answer again using the same evidence. It received no new facts or suggested action.

All four methods carried their own resource and decision state through the complete 72-hour campaign.

## How impact was measured

The frozen exercise model contains **49 modeled demand units**, including **34 urgent units**. They represent operational work such as verifying two missing readings, covering collapse sites, allocating 22 water-priority units, checking two places after an aftershock and keeping rescue active during the shift to water work. They do not represent people, households actually supplied or real vehicle capacity.

One urgent demand unit left open for one hour creates one **urgent unmet demand-hour**. Lower is better. We also measured how many modeled demand units were covered, how many urgent units were still open at the 72-hour close, waste, resource conflicts and whether a method responded at its first opportunity to five important changes in the incident.

The historical public response appears only as a separately labeled comparator. It is not an answer key or a score for real responders.

## The main numbers

The table reports the mean across eight matched production runs. “Admitted decisions” means the proposal passed the frozen rules and changed that method's modeled state; it does not mean anyone was dispatched in the real earthquake.

| Method | Admitted decisions, out of 11 | Modeled demand covered, out of 49 | Urgent units still open, out of 34 | Projected urgent unmet demand-hours | Reduction from fixed coverage | Modeled waste units | Named changes answered at first opportunity, out of 5 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Fixed coverage | 1.9 | 5.0 | 31.3 | 1,628.9 | — | 1.0 | 0.8 |
| Guarded growth | 6.6 | 33.3 | 3.8 | 257.6 | 84% | 1.5 | 4.4 |
| Evidence state | 5.3 | 29.8 | 7.3 | 411.9 | 75% | 0.0 | 3.3 |
| Evidence and feedback | 6.0 | 32.0 | 5.0 | 342.3 | 79% | 0.0 | 4.0 |

All three growth-informed methods beat fixed coverage on projected urgent unmet demand-hours in **every one of the eight paired seeds**:

- Guarded growth improved the result by 77.8% to 92.5%, averaging 84.0%.
- Evidence and feedback improved it by 77.8% to 81.2%, averaging 78.9%.
- Evidence state improved it by 71.8% to 81.2%, averaging 74.6%.

Guarded growth had the best mean and the best individual run, but evidence and feedback was the most repeatable: it ended at exactly 342.3 projected urgent unmet demand-hours and 32 of 49 modeled demand units covered in all eight seeds.

No method produced a double commitment or capacity exceedance in any production run. Evidence state and evidence with feedback produced zero modeled waste. Guarded growth averaged 1.5 waste units among 34.8 committed units; fixed coverage averaged 1.0 among only 6.0 committed units. Guarded growth therefore did slightly more absolute waste but much less waste per committed unit.

The correction method used an average of 82.8 model calls per campaign, compared with 77 for each other method. That extra compute is part of its result.

## What the agents actually proposed successfully

This table shows how many of the eight runs produced an admitted proposal at each decision.

| Disaster decision | Fixed coverage | Guarded growth | Evidence state | Evidence and feedback |
| --- | ---: | ---: | ---: | ---: |
| Initial outside-fire package | 1/8 | 0/8 | 0/8 | 0/8 |
| Check Kashima and Kōsa's missing readings | 0/8 | 7/8 | 8/8 | 8/8 |
| Send the first two liaison pairs | 0/8 | 2/8 | 0/8 | 0/8 |
| Set national and fire escalation posture | 2/8 | 0/8 | 0/8 | 0/8 |
| Split five response groups across two collapse sites | 6/8 | 4/8 | 0/8 | 0/8 |
| Confirm already-placed groups for the paper mill | 0/8 | 0/8 | 0/8 | 0/8 |
| Choose the Self-Defense Force request | 6/8 | 8/8 | 8/8 | 8/8 |
| Allocate all 22 water-priority units | 0/8 | 8/8 | 8/8 | 8/8 |
| Choose two shelter actions | 0/8 | 8/8 | 8/8 | 8/8 |
| Choose two aftershock safety checks | 0/8 | 8/8 | 8/8 | 8/8 |
| Keep two rescue priorities and one water priority | 0/8 | 8/8 | 2/8 | 8/8 |

In plain English, fixed coverage was strongest at the first concrete collapse-site split. It admitted that five-group plan in six of eight runs and covered an average of 2.75 of the five modeled rescue units. But it did not admit any water, shelter, aftershock or final mission-balance action in any seed. It covered just 10.2% of all modeled demand on average.

Guarded growth kept some of that early rescue ability—four of eight collapse splits—while also admitting the complete water plan, both shelter actions, both aftershock checks and the final rescue-water balance in every seed. That combination is why it produced the best overall impact score.

Evidence state and evidence with feedback were excellent at reacting to persistent missing telemetry, water expansion, shelter load and the aftershock. Both admitted those actions in every seed. Evidence with feedback admitted the final rescue-water balance in all eight seeds and used its correction call at that moment in six; evidence state admitted it in only two. Because the two methods carried independent histories, that difference is not an exact six-answer repair count. But neither evidence method admitted the earlier collapse-site split even once, so five modeled rescue units remained open at the end of every evidence-feedback run.

## The most important failure

At 20:00, the AI first had to place response groups at the two collapse sites. It then had to confirm one or two groups for the paper mill using only groups the first decision had already put there. Across four methods and eight seeds, **none of the 32 campaigns completed that confirmation successfully**.

When an earlier collapse split had been admitted, the later answer still named groups that were not already at the paper mill. When the earlier split had been rejected, there was nothing legal to confirm. The admission gate correctly refused every bad handoff, so no resource was duplicated and the modeled state stayed internally safe. Operationally, however, the paper-mill confirmation remained unanswered.

This is exactly the kind of problem a continuous campaign can reveal and independent one-shot tests cannot: an answer can look reasonable by itself while failing because it does not match the action chosen a few minutes earlier.

The bounded correction did not solve this. At the collapse split, its eight final answers all still lacked a valid supporting report link. At the confirmation, most answers either lacked valid evidence or named a group the prior decision had not placed at the mill. Telling the coordinator which rule it broke was not enough when the coordinator could not retrieve a better report or clearly see the exact legal handoff set.

## What this tells us about general orchestration

The result supports three practical conclusions inside this exercise:

1. **Carefully guarded attention can beat rigid coverage.** Guarded growth did not abandon any place. It inspected every eligible target and added shared attention only after independent, source-bound agreement. That let it adapt to later water, shelter and aftershock demands without the early lock-in that hurt older growth-routing designs.
2. **Evidence structure makes late-stage actions dependable.** Evidence state made the telemetry, water, shelter and aftershock decisions highly repeatable and eliminated modeled waste, but evidence structure alone did not guarantee a usable answer in every moment.
3. **Error feedback needs a retrieval path.** The feedback variant was much more reliable on the final mission-balance decision, but it could not repair missing support at the collapse moment. A checker can name the problem; it cannot manufacture the missing evidence or make the coordinator notice the relevant earlier assignment.

This does not establish that guarded growth is universally best. It is an eight-seed descriptive result from one incident, one frozen demand model and one pinned open-weight model. It does establish that the full continuous runner works, that the three structured methods dominated the fixed control on this modeled impact measure in every paired run, and that the dispatch-confirmation seam is a reproducible failure worth targeting next.

## The next experiment

The accepted method called guarded growth did **not** grow the agent team. Each decision always used three scouts, three reviewers and one coordinator; the router merely let the same reviewers recheck a leading need. The next experiment must test actual bounded agent growth rather than rename that routing behavior.

The next method should start with the same seven agents and add real scout or reviewer calls for one decision when a deterministic trigger says the situation needs them:

1. add target-specific scouts when the original scouts disagree about the leading need;
2. add reviewers when one review packet would contain too many places;
3. add an evidence-retrieval scout when a required fact is marked unresolved even though a cutoff-valid report on that subject exists;
4. compile the larger team's outputs into evidence-state rows with exact report and resource identifiers;
5. before the coordinator commits, show it a short, deterministic handoff receipt listing only actions that remain legal from the prior state;
6. keep one bounded correction and the current atomic admission gate, so an invalid revision still changes nothing; and
7. cap, record and price every added call, then let those temporary agents disappear before the next decision unless a later experiment explicitly tests persistence.

This produces the dense network the exhibition needs honestly: extra nodes appear only when extra model calls actually occurred. The current accepted run can already show its real seven-agent network at every decision, but it must never draw or imply dynamic multiplication that did not happen.

The key abstraction is general: growth means adding bounded attention where measured uncertainty or workload calls for it, while the handoff receipt derives the next action's legal choices from previously admitted state and places those choices beside their evidence. That applies to hospital transfers, network incident response, warehouse scheduling, financial approvals and any agent workflow where later action must refine earlier action without duplicating resources.

Run newly frozen fixed-coverage, guarded-routing and dynamic-growth chains on the same seeds and exogenous incident feed. Compare their complete trajectories, while acknowledging that their endogenous states diverge after the first different action. Use the early fire package, collapse split and paper-mill confirmation as named stress cases. If actual growth repairs those cases without losing water, shelter and aftershock performance, repeat it on a second incident before making a general orchestration claim.

## Evidence and limits

- Production analysis: `experiments/kumamoto-continuous-campaign/results/kumamoto-continuous-production-v1.accepted/continuous-analysis.json`
- Production certificate: `experiments/kumamoto-continuous-campaign/results/kumamoto-continuous-production-v1.accepted/continuous-certificate.json`
- Acceptance record: `experiments/kumamoto-continuous-campaign/results/kumamoto-continuous-production-v1.accepted/continuous-acceptance.json`
- Frozen protocol: `experiments/kumamoto-continuous-campaign/CONTINUOUS-PROTOCOL.md`
- Frozen demand model: `experiments/kumamoto-continuous-campaign/impact-demands.json`
- Freeze-manifest SHA-256: `fb8afd9442a59e6d2a3766c2265a640d49b5997cadadbeab9edeb4434f3fe075`
- Analysis SHA-256: `db550832dbb19c3b94d15a343f7c6aedc1db458a9390e1a83169bffa7d7e6371`
- Campaign-certificate SHA-256: `ade0de9f45b3c5c05f381c725de49e4e50fffba3f3529a56d80832ee6e61aad8`

The accepted production run contains 352 of 352 valid decision artifacts and 32 of 32 valid continuous chains, each with eleven checkpoints. The excluded smoke seed is not included in any finding above. The production analysis is labeled `DESCRIPTIVE_ONLY_NO_REGISTERED_CLAIMS`; it contains no p-value, confidence interval or claim of real-world causal impact.
