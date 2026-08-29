# Rescue World — Yuki submission handoff

This private repository contains the current Rescue World product, the two presentations, the
plain-language process map, and portable copies of the accepted experiment evidence.

If you are Yuki—or an AI helping Yuki—start with
[`docs/rescueworld/README-YUKI.md`](docs/rescueworld/README-YUKI.md). It is the index for the
submission package and explains what to open, what the project found, which numbers are safe to
use, and where every result came from.

## The project in one minute

We studied how an AI can keep making connected decisions during a long, changing situation.
Rescue World replays the first 72 hours after a Kumamoto earthquake and shows eleven moments when
an AI had to propose a response.

The full exercise exposed one clear problem. An earlier decision assigned a response group to a
paper mill. A later decision needed to confirm that exact assignment. The confirmation remained
unresolved in all 32 complete runs because the earlier decision was buried in the growing history.

The final technique makes an **action card** whenever a decision creates work for later. The card
records the exact decision, supporting reports, unanswered questions, and required next step.
When that next step becomes possible, the system puts the card directly in front of the AI handling
it and requires a clear confirmation or decline.

We tested eight saved histories in which the earlier assignment was valid:

- Qwen3-32B completed the exact follow-up on the first attempt in **8 of 8** histories. All **8 of
  8** safety checks passed, with **0** false completions.
- Qwen3.5-122B completed the exact follow-up on the first attempt in **8 of 8** histories. **7 of
  8** full safety checks passed, with **0** false completions. The remaining safety case kept the
  unsupported task open but missed an assignment-count and supporting-report rule.

This is a focused result inside a modeled exercise. It does not measure real dispatches, people
reached, lives saved, or real-world emergency outcomes.

## Start in three commands

You need Node.js 20 or newer.

```bash
npm ci
npm run verify
npm run dev
```

Then open <http://127.0.0.1:5184>.

## Fastest useful review

1. Read [`docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md`](docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md).
2. Open <http://127.0.0.1:5184/rescueworld.html> for the full 72-hour world.
3. Press `T` to inspect how one AI proposal was built.
4. Press `B` to see the eleven decision moments.
5. Open <http://127.0.0.1:5184/impact-view.html> for the plain-English outcomes and accepted
   action-card result.
6. Open <http://127.0.0.1:5184/decision-network.html> for the color-coded AI decision network.
7. Read the full story in
   [`docs/rescueworld/emergence-presentation.html`](docs/rescueworld/emergence-presentation.html)
   and the shorter version in
   [`docs/rescueworld/submission-presentation.html`](docs/rescueworld/submission-presentation.html).

## Verify the accepted action-card evidence

The tracked evidence bundle contains the exact accepted analyses and plans for both model runs.

```bash
node scripts/bake-receipt-fork.mjs --check
```

The command verifies the file hashes, embedded analysis identities, model IDs, model revisions,
accepted counts, and the public data used by the viewer.

## Package map

- `docs/rescueworld/README-YUKI.md` — start-here index for Yuki and his AI tools.
- `docs/rescueworld/YUKI-HANDOFF-2026-08-28.md` — full narrative, translation guidance, and claims.
- `docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md` — one-page product and presentation guide.
- `docs/rescueworld/evidence/receipt-fork/` — portable accepted analyses, plans, and manifest.
- `rescueworld.html` — full interactive Rescue World.
- `public/impact-view.html` — plain-English simulation outcomes and focused result.
- `public/decision-network.html` — color-coded network behind each proposal.
- `public/decision-run-tree.html` — run-tree view of the recorded decision paths.
- `src/rescueworld/` — Three.js viewer implementation.
- `product/disaster-replay/` — sealed replay data, schemas, certificates, and verifiers.
- `experiment/` — the earlier registered benchmark package preserved as research history.

## Instructions for an AI coding harness

Read these files before rewriting submission material:

1. `README.md`
2. `docs/rescueworld/README-YUKI.md`
3. `docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md`
4. `docs/rescueworld/YUKI-HANDOFF-2026-08-28.md`
5. `docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html`

Preserve the exact result counts, model identities, evidence hashes, and claim boundary. Introduce
the ordinary-language term **action card** before the technical term **decision receipt**. Explain
the human problem and result before implementation details. Treat the visualizations as tools for
inspection and explanation, not as the finding itself.

## Working safely

- Keep public records, simulated AI proposals, and later analysis visibly separate.
- Never rewrite the sealed timeline to make a presentation claim easier.
- Do not add credentials, `.env` files, VPN notes, private server addresses, or remote launch
  commands.
- After any change, run `npm run verify`; after a visible change, also run `npm run test:browser`.
