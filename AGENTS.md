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
2. `docs/rescueworld/SPEC-2.md`
3. `docs/rescueworld/STORY-TEMPLATE.md`
4. `product/disaster-replay/README.md`
5. `experiment/PRODUCTION-RESULTS.md`

Run `npm ci` and `npm run verify` before claiming the package works. For any visible change, run
`npm run test:browser` and inspect both screenshots it reports.

## Non-negotiable truth boundaries

- `public/rescueworld-log.json` is a baked view of a sealed 414-event record. The viewer reads it;
  the render loop never reruns agent logic.
- Real public-response events, simulated stand-in agent decisions, and analysis written later are
  three different kinds of information. Never blend them.
- A decision “passed every prewritten check” only when it met every rule frozen before the run.
- The registered result is `0/40 → 17/40 → 34/40`. The evidence-table claim failed one registered
  rule; the bounded-feedback claim passed its narrower rules.
- The experiment measures traceability, communication, and rule-following inside a reconstruction.
  It does not prove better real-world judgment, superiority to responders, or lives saved.
- The descriptive 88-run figures are context only and must never replace the registered result.

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
