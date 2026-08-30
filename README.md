# Rescue World

**When one AI decision constrains a later one, does that decision actually reach the step that needs it?**

We replayed the first 72 hours after a modelled 2026 Kumamoto earthquake as a connected exercise —
414 hash-linked events, eleven AI decision moments, state carried the whole way through — and ran it
to completion 32 times. Every one of those 32 runs failed the same handoff.

This repository contains the working software, the interactive explanations, the accepted evidence,
and the working paper.

---

## Start here

| If you have | Open |
|---|---|
| **2 minutes** | [One sheet](docs/rescueworld/ONE-SHEET.md) — what it is, the exact numbers, what not to claim |
| **10 minutes** | [Start here](docs/rescueworld/START-HERE.md) — the index to everything below |
| **30 minutes** | [Full narrative](docs/rescueworld/FULL-NARRATIVE.md) — the whole story, plainly written |
| **You review research** | [Working paper](docs/rescueworld/RESCUE-WORLD-PAPER-DRAFT.md) — methods, results, threats to validity, claim boundary |

```bash
npm ci
npm run verify      # rebuilds every published number from the sealed record
npm run dev         # then open http://127.0.0.1:5184
```

Node 20 or newer.

---

## Things you can open and click

Run `npm run dev`, then:

| | What it shows |
|---|---|
| `/rescueworld.html` | **The 72-hour world.** Real Kumamoto terrain from Japan's Geospatial Information Authority, 414 recorded events, eleven decision moments you can inspect one by one. `B` for all decisions, `T` for the evidence behind one, `H` to reset the camera. |
| `/decision-network.html` | **The work behind one proposal.** Every dot is one recorded model call, rule check, or state change — nothing added for looks. |
| `/decision-network-ja.html` | The same network with Japanese labels, opening on the growth run. |
| `/impact-view.html` | Plain-English outcomes across the campaign, and the accepted handover result. |
| `/decision-run-tree.html` | The recorded decision paths as a tree, including the handover runs. |
| `/relaystate-layer.html` | **The mechanism, side by side.** The identical lattice run twice — once without the handover record, once with it. Same wiring, same agents, same model. |
| [Orchestration process map](docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html) | How one decision becomes the next action, in beginner language, with the quality-control process drawn out. |
| [Emergence presentation](docs/rescueworld/emergence-presentation.html) · [Submission presentation](docs/rescueworld/submission-presentation.html) | The long and short versions of the story. These open directly, no server needed. |

---

## What we found

The exercise exposed one clean failure. At 20:00 a decision assigned response groups across two
collapse sites. A linked decision at the **same cutoff** could confirm only a group named in that
exact proposal. **None of the 32 complete campaigns produced a valid confirmation.** The state
validator correctly refused every bad answer, so nothing was ever double-assigned — but the work
was simply never finished, and nothing errored.

We then took the eight saved histories where a valid earlier assignment existed and re-ran only the
receiving decision, twice: once with an empty record field, once with a **handover record** carrying
the exact assignment, the evidence it may cite, the questions it must leave open, and a required
confirm-or-decline answer.

| | Empty record | Handover record |
|---|---:|---:|
| Qwen3-32B | 0 / 8 | **8 / 8**, first attempt |
| Qwen3.5-122B | 0 / 8 | **8 / 8**, first attempt |

Zero false completions in either run.

---

## What this does **not** show

Stated plainly, because the result is narrow and the paper says so throughout:

- The two decisions shared **one cutoff**. This is not a test of memory across elapsed time.
- All eight runs used the **same record content** — eight repeated samples of one handoff, not eight independent cases.
- The control had **no access to the fact at all**, so this cannot separate "the record format helped" from "we supplied the answer."
- Both models are **Qwen family**. This is not cross-family replication.
- The modelled units are exercise constructs. **Not people, not dispatches, not lives saved.**

The next experiments — fact-matched controls, active declines, delayed persistence — are specified
in §12 of the paper.

---

## Verifying the evidence yourself

```bash
node scripts/bake-receipt-fork.mjs --check
```

Checks the file hashes, the embedded analysis identities, model IDs and revisions, the accepted
counts, and the public data the viewers read. The portable bundle is in
`docs/rescueworld/evidence/receipt-fork/`.

---

## Layout

```
rescueworld.html            the 72-hour viewer
public/                     the other viewers and their baked data
src/rescueworld/            viewer implementation
docs/rescueworld/           reader documents, presentations, evidence bundle
docs/internal/              build-time specs and copy decks (not needed to read the project)
product/disaster-replay/    sealed replay data, schemas, certificates, verifiers
experiment/                 the earlier registered benchmark, kept as research history
scripts/                    the verification commands
```

## Data and attribution

Terrain, road restrictions, shelters and building models are real public data from Japan's
Geospatial Information Authority, MLIT, Project PLATEAU, JMA and e-Stat. Every AI decision in the
record is explicitly simulated and labelled as such. See [`NOTICE.md`](NOTICE.md) and
[`product/disaster-replay/DATA-SOURCES.md`](product/disaster-replay/DATA-SOURCES.md).

Working notes for anyone editing this repository are in [`AGENTS.md`](AGENTS.md).
