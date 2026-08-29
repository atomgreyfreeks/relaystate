# Rescue World submission package — start here

This is the index for Yuki and any AI tools helping with the hackathon submission. It points to
the final story, the working product, the visual explanations, and the accepted experiment data.

## Start in this order

1. [Yuki's Rescue World one-sheet](YUKI-RESCUE-WORLD-ONE-SHEET.md) — how to open the product,
   what to click, the one-minute explanation, and the exact numbers.
2. [Full handoff](YUKI-HANDOFF-2026-08-28.md) — the complete narrative from growth intelligence
   to the action-card finding, translation guidance, evidence paths, and claim boundaries.
3. [Emergence presentation](emergence-presentation.html) — the full high-level story.
4. [Submission presentation](submission-presentation.html) — the shorter presentation version.
5. [Orchestration process map](ORCHESTRATION-PROCESS-MAP.html) — the mechanism and checks in
   beginner-friendly language.

## Open the working product

The presentations above can be opened directly as files. Rescue World must be served over HTTP
because it loads neighboring code and data.

From the repository root:

```bash
npm ci
npm run dev
```

Then open:

- **Full 72-hour world:** <http://127.0.0.1:5184/rescueworld.html>
- **Plain-English outcomes and accepted action-card result:**
  <http://127.0.0.1:5184/impact-view.html>
- **Color-coded AI decision network:** <http://127.0.0.1:5184/decision-network.html>

## Accepted experiment data

The portable evidence bundle is in [evidence/receipt-fork](evidence/receipt-fork/README.md).
It contains exact copies of the accepted plan and analysis for both model runs plus an acceptance
manifest that binds their file hashes, embedded hashes, model IDs, revisions, and claim scope.

- Qwen3-32B: 8/8 exact first-try follow-ups; safety 8/8; zero false completions.
- Qwen3.5-122B: 8/8 exact first-try follow-ups; full safety 7/8; zero false completions.
- Public viewer data: `public/receipt-fork-data.json`.

Verify the entire portable chain from the repository root:

```bash
node scripts/bake-receipt-fork.mjs --check
```

## What is ready to use in the submission

- A high-school-level explanation of the project and finding.
- A short deck and a full deck.
- A plain process map explaining how the action card works.
- The interactive 72-hour Rescue World.
- A plain-English impact view carrying both accepted model results.
- A color-coded network showing the work behind each AI proposal.
- Portable accepted analyses and plans for both model runs.
- A one-command evidence check that works on a clean checkout.
- Clear limitations and translation guidance.

## The central finding

When an AI makes a decision that creates work for later, the system should make a short action
card containing the exact decision, its supporting evidence, the questions still open, and the
required next step. When that next step becomes possible, the system delivers the card directly
to the person or AI handling it and requires a clear resolution.

In the focused Rescue World test, both Qwen models completed the exact required follow-up in all
eight saved histories on the first attempt.

## Claim boundary

This is a modeled exercise, not a real dispatch system. The focused result covers one follow-up,
eight saved histories, one incident, and two models from the same Qwen family. It does not measure
people reached, lives saved, or real-world emergency outcomes.

## Guidance for Yuki's AI tools

- Read this file, the one-sheet, and the full handoff before rewriting anything.
- Preserve the exact counts, model IDs, revisions, file names, and hashes.
- Introduce **action card** before the technical term **decision receipt**.
- Explain every term as if the reader has never heard of AI orchestration.
- Put the human problem and the outcome before implementation details.
- Keep the claim boundary visible in Japanese and English.
- Do not describe the visualizations as the finding; they are tools for explaining and inspecting
  the finding.
