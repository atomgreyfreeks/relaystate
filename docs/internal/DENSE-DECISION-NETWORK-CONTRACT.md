# Rescue World dense decision network

Status: audience and truth contract for the accepted continuous production run.

## The promise

Rescue World must show the network of AI work that produced a rescue proposal, not only one thin line per orchestration method. A viewer should be able to see the agents fan out over reports, compare judgments, converge on a proposal, receive a rule check, change or preserve the modeled state, and carry that state into the next disaster decision.

The first frame is a dense overview. It is not a wall of prose. Color, shape, edge style and position explain the network at a glance; selecting one node reveals its complete sentence and the exact path it belongs to.

The accepted production artifacts preserve enough real structure to draw this honestly. Across eight seeds and four methods they contain 2,510 model calls, 352 decision cells and 32 complete eleven-decision chains. No node may be invented to make the picture look richer.

## What one view contains

One view shows one production seed and one method. It contains ten chronological tiers holding eleven disaster decisions because the two 20:00 decisions share one parent state.

At each decision the default seven-agent team appears as seven distinct nodes:

- three scouts;
- three reviewers; and
- one coordinator.

The decision also contains nodes for the team handoff, any deterministic routing or evidence check, the proposal outcome and modeled state:

- one team-handoff node for fixed coverage and guarded routing, or one checked-evidence node for the two evidence methods;
- one routing-gate node in guarded routing, saying whether a target was duplicated across the existing reviewers and explicitly that no agent was added;
- one coordinator-proposal node;
- one correction node when the recorded method made a correction call;
- one admitted-action or rejected-proposal node; and
- one modeled-change node.

That produces roughly 100 to 130 artifact-backed nodes per seed-and-method view. The public record is available as a separately labeled context path, never as the correct answer or a score.

The existing production run does **not** contain dynamically spawned agents. Every method starts each decision with the same three scouts, three reviewers and one coordinator. Guarded growth may send one target to all three existing reviewers after source-bound agreement; it never adds an eighth agent. The fixed seven-node shape must remain visible in this view. A later dynamic-growth run may add nodes only when its growth record contains actual additional model calls.

## Always-visible key

The key stays at the frame edge and never covers the network or selected readout.

| Color | Shape | Audience label | What the node means |
| --- | --- | --- | --- |
| Cyan | small diamond | SCOUT FINDING | What one scout found in the reports available by the deadline. |
| Violet | faceted block | REVIEWER JUDGMENT | What one reviewer concluded from its assigned targets. |
| Gray | open block | TEAM HANDOFF | The ordinary written notes that fixed coverage or guarded routing handed to the coordinator. This is not called checked evidence. |
| White | ring or clear prism | CHECKED EVIDENCE | The rows that survived the deterministic evidence validator. |
| Pale green | forked marker | ROUTING GATE | Whether guarded routing duplicated one target across the same three reviewers. It says “no agents added.” |
| Amber | square or warm crystal | AI PROPOSAL | The coordinator's proposed operational action before admission. |
| Magenta | split marker | ONE CORRECTION | The one recorded revision after fixed code named a broken rule. It appears only when the call occurred. |
| Signal blue | solid crystal | ADMITTED ACTION | The proposal passed the frozen rules and changed the exercise state. It does not mean a real team moved. |
| Burn red | crossed crystal | REJECTED PROPOSAL | The proposal failed at least one frozen rule and changed no exercise state. It does not mean the AI chose to do nothing. |
| Teal | pulse or halo | MODELED CHANGE | The modeled demand served, wasted or left open after admission and time advance. It is never people served or lives saved. |

Color never acts alone. Every class also has a distinct shape and a text label for viewers who cannot distinguish the hues.

## Edges

- A thin lit line means information moved from one agent or validation step to the next.
- A brighter solid line means an admitted action or modeled state was carried into the next decision.
- A red terminal stub means a proposal stopped at the admission gate. The later incident path still continues from the unchanged prior state.
- A dotted comparison line may connect the public record to the matching decision moment, but it never joins the agent's carried state.

Edges may not imply a message or dependency the artifacts do not record. In particular, three scout calls may fan into reviewer packets according to the frozen method graph; their visual edges must be reconstructed from that graph and the exact seed, method, decision and call roles—not guessed from semantic similarity.

## Visible words

Page title:

> How the AI team reached each rescue proposal

Subtitle:

> One accepted production run. Every node is backed by a recorded model call, rule check, or state change.

The selected readout always uses complete sentences in this order:

1. the disaster decision and deadline;
2. what this scout, reviewer, coordinator or checker actually said or did;
3. the node class and its place in the method;
4. whether the proposal changed the modeled state and the exact plain-language rule when it did not; and
5. the immediate modeled change, separated from demand that opened merely because time passed.

Method names, seed numbers, hashes, call counts and evidence IDs are secondary details. They may appear after the action or behind a details control. Raw resource, target, demand and observation IDs never appear as the primary sentence.

## Controls

- **Pause** stops animation without changing selection.
- **Replay** restarts the current seed-and-method network.
- **Method** cycles fixed coverage, guarded growth, evidence state and evidence with feedback while keeping the seed fixed.
- **Next run** cycles seeds 51201 through 51208 while keeping the method fixed.

The control must not be labeled “New run”; it replays an accepted recorded run and does not generate anything.

Pointer selection, arrow-key navigation, camera orbit and the existing component controls remain. Selecting a node emphasizes its complete information path while leaving the surrounding network dimly visible for orientation.

## Production sources

Every visible element traces to accepted artifacts under:

`experiments/kumamoto-continuous-campaign/results/kumamoto-continuous-production-v1.accepted`

For each cell:

- `calls.jsonl` proves every scout, reviewer, coordinator and correction model call, its role, exact request, parsed response, endpoint, seed, tokens and latency;
- `result.json` holds the scout outputs, reviewer outputs, kept and refused evidence rows, compiled evidence state, initial decision, correction flag and violations, final decision and score;
- `certificate.json` binds the cell to its request and result;
- the tier checkpoint binds the admission outcome, pre/post state and modeled impact; and
- the chain certificate binds all eleven decisions in order.

The baked view records the SHA-256 of its source analysis, campaign certificate, freeze manifest and every cell artifact used for the selected seed. A build fails if a referenced file, role, call, response, decision, admission outcome or state transition cannot be reproduced.

## Browser and truth gates

The implementation is not complete until a real browser proves all of the following at 1600×900 and 1280×720:

1. One seed and method display all ten tiers, all eleven decision outcomes and every recorded internal model call for that view.
2. Fixed, guarded and evidence-state views contain exactly seven base agent nodes at every decision; evidence with feedback contains a correction node if and only if `correction_called` is true.
3. Fixed and guarded views use TEAM HANDOFF, never CHECKED EVIDENCE. Evidence views use CHECKED EVIDENCE. Guarded views contain exactly one ROUTING GATE per decision, bound to the recorded `growth_gate` and `annex`.
4. The node total and role counts reproduce `calls.jsonl`; every model-call node points to its exact `calls.jsonl` request ID and role as well as the copied result field. No floating visual node lacks an artifact pointer.
5. Fixed and guarded information edges show both scout and reviewer material entering their handoff; evidence-method edges show reviewer outputs entering checked evidence and do not make a scout bypass review.
6. The always-visible key contains every rendered class and no class absent from the renderer.
7. Admitted actions match the tier checkpoint, rejected proposals change no state, and later decisions remain visible after rejection.
8. Information-flow and carried-state edges are visually distinct and match the frozen method graph and checkpoint ancestry.
9. The first frame is dense but readable: the network owns most of the picture, the key and controls do not overlap it, and no persistent prose paragraph covers the graph.
10. Selecting a scout, reviewer, handoff, routing gate, checked evidence, proposal, correction, rejection and admitted action produces a complete plain-language readout with at least 16-pixel body text at 1280×720 and 18 pixels at 1600×900.
11. Color-blind meaning survives a grayscale screenshot because every class also differs by shape or explicit label.
12. Method and Next run cycle deterministically and wrap; Replay returns to the same artifact-backed state; Pause holds it.
13. No raw machine ID, machine name, credential, endpoint, people-served claim, lives-saved claim, real-dispatch implication or public-record-as-score wording appears.
14. The browser console is clean, all controls remain inside the viewport, and two frames differ while playing but not while paused.

## Impact-view boundary

The separate production impact view remains a comparison of method-level decision paths. Its header must say:

> This picture compares each method's decision path. Open a decision to see the agents working inside that method.

Its method explanations are:

- Fixed coverage: “Three scouts and three reviewers divide the available places once; one coordinator proposes the action.”
- Guarded growth: “The same fixed seven-agent team lets all three reviewers recheck one need after three-source agreement; it does not add agents.”
- Evidence state: “The same seven-agent team marks each need supported, rejected or unresolved beside exact reports.”
- Evidence and feedback: “The evidence team may revise once after fixed code names a broken rule; it receives no new facts.”
- Public record: “The public record is context, not a correct answer or score.”

This boundary remains until a separately accepted dynamic-growth campaign records real additional agent calls.
