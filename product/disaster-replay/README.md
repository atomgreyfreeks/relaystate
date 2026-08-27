# Disaster Replay backend contract

**A real map shows where the disaster happened. This replay shows, step by step, why each AI agent
believed a report, rejected it, waited, or sent a scarce resource.**

This is the local backend slice for the game-like 3D demonstration. It uses the official 2026
Kumamoto earthquake facts, seven successive official JMA report updates, 1,248 geolocated shaking
readings, 35 real landslide/deposition polygons from GSI, and 29 real road restrictions from MLIT's timestamped Passable Map. On top of that real
world it places eight explicitly synthetic reports and asks a simple exercise question: with only
two rapid-assessment teams, which two of four reported sites should receive them first?

The world, reports, resource limit, scoring truth, and deterministic agent policies are identical
between the two arms. Only the graph changes:

- The plain graph keeps the largest number reported for each site and sends teams to the top two.
- The evidence graph keeps competing claim versions separate, compares independent sources,
  rejects or holds weak versions, and ranks only supported current claims.

In this tiny scripted exercise, the plain graph reaches 60 simulated people and sends one team on
a claim version the evidence compiler later rejects. The evidence graph reaches 77 simulated
people, sends zero teams on rejected or unsupported versions, and cites two agreeing sources for
both dispatches. Those numbers demonstrate the contract and visualization; they are **not** a new
benchmark result, model result, or measurement of real emergency response.

## The handoff to the 3D renderer

The canonical run is written as four immutable files under
`runs/kumamoto-2026/260728/`:

1. `scenario.json` freezes the incident, public sources, agents, resources, graphs, and metric definitions.
2. `timeline.jsonl` supplies 81 hash-linked events, including seven successive real JMA updates,
   all 23 restrictions with a reported start minute in the frozen MLIT snapshot, and eight clearly synthetic reports. The other six
   restrictions remain visible in the source layer without invented event times.
3. `final-state.json` is the pure reducer's end state for both arms.
4. `certificate.json` hashes the scenario, normalized source layers, canonical timeline, terminal
   event, and final states. Its `run_identity` also binds the two arms to the same scenario basis,
   observation set, resources, and decision slots.

The renderer also receives six normalized real-world assets in `data/`: the seven-update JMA
feed with 1,248 station readings, the 35 GSI observed
hazard polygons, the 29 MLIT observed road restrictions, 92 official shelter/evacuation designation
records at 56 unique locations, a 612×917 GSI ground-elevation cut, and a nine-tile PLATEAU LOD1
building cut around the epicenter.
The single JSON file in `samples/` packages the same run for convenient inspection; it is not a
second source of truth.

Each event has a simulation time, arm, actor, map geometry, graph node/edge, causal event IDs,
source classification, input classification, payload, previous-event hash, and its own hash.
Timestamped road events also retain their raw start field, normalized minute, and snapshot basis.
The renderer reads the log;
it never runs the agent logic. That makes pause, rewind, side-by-side comparison, and exact replay
straightforward.

## Matched-run identity

The certificate names one run per arm:

- `kumamoto-2026-evidence-routing-exercise:260728:plain-graph:v1`
- `kumamoto-2026-evidence-routing-exercise:260728:evidence-graph:v1`

Both descriptors share four canonical SHA-256 equality keys: `scenario_basis_sha256`,
`observation_set_sha256`, `resources_sha256`, and `decision_slots_sha256`. Each hash is computed
over a domain-separated `disaster-replay.equality-key.v1` wrapper. Object keys are recursively
sorted, while unordered policy sets are sorted by their stable IDs. Presentation text, agent and
graph descriptions, run IDs, generated output, and the certificate itself do not enter the matched
policy basis. Run IDs, equality digests, and certificates are generated from frozen inputs; they are
never written back into those inputs.

The canonical scenario declares the `initial-assessment-allocation` decision slot: reports visible
through simulation second 480, the two eligible assessment teams, the four eligible landslide
targets, and a selection limit of two. Every arm must record exactly one decision for that slot.
The verifier recomputes all four hashes and rejects missing or duplicate run descriptors, unknown
slot references, over-selection, and ineligible dispatch targets or resources. Schemas leave the new
fields optional so older replay documents remain readable, but the canonical verifier requires them.
Because event IDs are local replay facts rather than globally unique run IDs, an event's identity
across matched runs is the pair `(run_id, event_id)`.

The generic event vocabulary is:

`WORLD_INITIALIZED → SOURCE_INGESTED → CLAIM_STATE_CHANGED → GRAPH_TRANSITION → DECISION_PROPOSED → POLICY_EVALUATED → RESOURCE_DISPATCHED → OUTCOME_OBSERVED → METRIC_UPDATED`

It is deliberately not earthquake-specific. Another domain can provide a new manifest, geometry,
observations, resources, and metric definitions while keeping the same event and replay contract.

## Build and verify

From the repository root:

```bash
node product/disaster-replay/scripts/import-public-data.mjs
node product/disaster-replay/scripts/import-jma-feed.mjs
node product/disaster-replay/scripts/import-shelters.mjs
node product/disaster-replay/scripts/import-terrain.mjs
node product/disaster-replay/scripts/import-plateau-focus.mjs /path/to/official-uki-archive.zip
node product/disaster-replay/scripts/build-replay.mjs
node --test product/disaster-replay/tests/run-identity.test.mjs
node product/disaster-replay/scripts/verify.mjs
```

The importers require `curl`, `unzip`, and ImageMagick. They pin the official source hashes or retain
every fetched tile hash. The build itself is offline after the normalized assets are present. The verifier rebuilds the sample from local inputs,
checks the event hash chain and causal ordering, checks provenance boundaries, verifies the final
state hashes and matched-run identity, and confirms the treatment dispatches cite supported claim versions.

See [DATA-SOURCES.md](DATA-SOURCES.md) for exact public sources, access status, attribution, and the
line between observed data and the synthetic exercise.

## What the GPU does later

The local slice uses deterministic stub policies, because the world and replay contract must work
before model inference is added. A GPU run may replace recorded agent proposals or classifications,
but it must write the model outputs into this same log. Replaying a recorded GPU log is deterministic;
rerunning the model is a new generation and must receive a new run ID.
