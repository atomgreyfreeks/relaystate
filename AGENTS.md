# Instructions for AI coding agents

## Scope comes first

This repository is only the current Rescue World handoff. Treat the live 72-hour viewer, its
sealed replay, and the current Rescue World documents as authoritative. Do not import or revive
the historical six-candidate gallery or any older AURAWORLD experiment unless the human owner
explicitly requests a named historical artifact.

If a short name could refer to old or current work, resolve it against this repository and the
current user message. Ask one short question if it remains ambiguous. Recency outranks a matching
old phrase.

## Start here

Before editing, read in this order:

1. `README.md`
2. `docs/rescueworld/README-YUKI.md`
3. `docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md`
4. `docs/rescueworld/YUKI-HANDOFF-2026-08-28.md`
5. `docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html`
6. `docs/rescueworld/SPEC-2.md`
7. `product/disaster-replay/README.md`

Run `npm ci` and `npm run verify` before claiming the package works. For any visible change, run
`npm run test:browser` and inspect both screenshots it reports.

## Non-negotiable truth boundaries

- `public/rescueworld-log.json` is a baked view of a sealed 414-event record. The viewer reads it;
  the render loop never reruns agent logic.
- Real public-response events, simulated stand-in agent decisions, and analysis written later are
  three different kinds of information. Never blend them.
- The continuous exercise contains 32 complete 72-hour runs and 352 checked decision moments.
- The paper-mill confirmation remained unresolved in all 32 complete runs.
- The focused action-card result uses eight saved histories in which the earlier paper-mill
  assignment was valid. It is a test of one handoff, not another full 72-hour campaign.
- Qwen3-32B completed the exact follow-up on the first attempt in 8/8 histories; full safety was
  8/8; false completions were 0.
- Qwen3.5-122B completed the exact follow-up on the first attempt in 8/8 histories; full safety was
  7/8; false completions were 0. The remaining case kept the unsupported task open but missed an
  assignment-count and supporting-report rule.
- Both tested models are from the Qwen family. Do not claim independence across unrelated model
  families.
- These experiments measure modeled decisions, operational continuity, traceability, and
  rule-following. They do not measure real dispatches, people reached, or lives saved.
- The older `0/40 → 17/40 → 34/40` benchmark is research history. It explains how the project
  developed but is not the final Rescue World finding.

## Writing for the submission

- Assume the reader has never heard of AI orchestration.
- Introduce the ordinary-language term **action card** before **decision receipt**.
- Explain the complete human problem and outcome before implementation details.
- Describe the technique on its own terms: a decision that creates future work becomes a clear
  action card and returns when the follow-up becomes possible.
- Treat the 3D world and graphs as tools for explanation and inspection, not as the finding.

## Security boundary

This handoff intentionally contains no VPN credentials, GPU credentials, private server address,
remote launch script, or private run-preparation endpoint. Do not add any of them. Never commit
tokens, passwords, `.env` files, or user-specific private paths.

## Change protocol

1. State the exact user-facing outcome before editing.
2. Identify which sealed data or written contract supports every new claim.
3. Make the smallest change that produces the requested outcome without weakening the package.
4. Run `npm run verify`.
5. For visible work, run `npm run test:browser` and inspect the hub and simulation screenshots.
6. Report what changed, what was verified, and what remains uncertain.

Do not rewrite failing tests or thresholds to make a change pass. Do not alter source data,
certificates, hashes, or result labels without a new, explicit experiment and audit.
