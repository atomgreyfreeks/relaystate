# Rescue World — partner handoff

This private package contains the current Rescue World build: a three-dimensional replay of the
first 72 hours after the July 2026 Kumamoto earthquake, plus the recorded agent-decision exercise,
the public-data replay contract, the audited aggregate result, and the two current presentations.

It does **not** contain the old six-candidate gallery, VPN credentials, GPU credentials, remote
launch scripts, or private run controls. The browser viewer is complete and reads the same sealed
414-event file as the exhibition build. The private run-preparation control was intentionally
removed from this handoff; no simulation event, result, source asset, or presentation was changed.

## Start in three commands

You need Node.js 20 or newer.

```bash
npm ci
npm run verify
npm run dev
```

Then open <http://localhost:5184>. The first page is the partner hub. Its largest button opens the
simulation at <http://localhost:5184/rescueworld.html>.

If another computer is on the same trusted local network, use the host computer's LAN address with
port `5184`, for example `http://192.168.1.20:5184`. Do not expose the development server directly
to the public internet.

## The fastest review

1. Open the hub and read “What was built.”
2. Open **Rescue World**, choose **Begin**, and let the opening act play.
3. Press `B` for the visual map of all eleven decisions and choose one moment.
4. Press `T` to walk through that moment's six-step agent trace.
5. Press `R` for the experiment in complete sentences; press `L` for the full decision list.
6. Return to the hub and open **How this project grew**, then **Submission briefing**.

The result is specific. Plain written notes produced `0/40` decisions that passed every prewritten
check. An evidence table produced `17/40`. The same table plus one bounded correction produced
`34/40`. The evidence-table claim failed its registered resource-limit rule: it was allowed to
reduce the share of answers that stayed inside the exercise's hard limits by no more than five
percentage points, but that share fell by ten. The bounded-feedback claim passed. These are
traceability and rule-following results inside a reconstructed simulation. They do not prove better
real-world judgment or lives saved.

## Instructions for an AI coding harness

Read these files in order before changing anything:

1. [`AGENTS.md`](AGENTS.md) — scope, truth boundaries, and the change protocol.
2. [`README.md`](README.md) — how to run and review the package.
3. [`docs/rescueworld/SPEC-2.md`](docs/rescueworld/SPEC-2.md) — current viewer contract.
4. [`docs/rescueworld/STORY-TEMPLATE.md`](docs/rescueworld/STORY-TEMPLATE.md) — fixed story and grade wording.
5. [`product/disaster-replay/README.md`](product/disaster-replay/README.md) — replay and data contract.
6. [`experiment/PRODUCTION-RESULTS.md`](experiment/PRODUCTION-RESULTS.md) — registered findings and limits.

Then run:

```bash
npm ci
npm run verify
npm run test:browser
```

`npm run test:browser` uses an installed Chrome browser. If Chrome is in a nonstandard location,
set `RESCUE_CHROME` to its executable path. The test starts its own local server, opens the hub and
the viewer, checks the opening interaction and decision ledger, saves screenshots under `/tmp`, and
closes everything it started.

On some systems, `npm ci` says it skipped the optional `fsevents` install script. That helper is not
needed by this package; continue to `npm run verify`. Treat any other installation error as a real
failure rather than assuming it is harmless.

## Package map

- `index.html` — the human partner hub.
- `rescueworld.html` — the live exhibition viewer.
- `src/rescueworld/` — the Three.js log-driven viewer.
- `src/rescueworld-art-director/` — presentation-only grade and burn-color controls.
- `public/rescueworld-log.json` — the baked 414-event viewer record.
- `public/rescueworld-assets/` — terrain and official context layers used by that record.
- `public/docs/` — browser-ready guide and presentations.
- `docs/rescueworld/` — design, evidence, copy, and reconstruction documents.
- `product/disaster-replay/` — schemas, importers, sealed timelines, certificates, and verifiers.
- `experiment/` — preregistration, runner source, frozen manifest, aggregate result, and report.
- `scripts/` — package, data, and browser gates.

## Working safely

- The viewer is a log consumer. Do not run agent logic inside its render loop.
- Keep recorded public facts, simulated agent decisions, and later analysis visibly separate.
- Never rewrite the sealed timeline to make a presentation claim easier.
- Do not report the descriptive 88-run figures as the registered result.
- Do not add credentials, `.env` files, VPN notes, private server addresses, or remote launch commands.
- After any change, run `npm run verify`; after a visible change, also run `npm run test:browser`.

The public-data sources and attribution are listed in
[`product/disaster-replay/DATA-SOURCES.md`](product/disaster-replay/DATA-SOURCES.md). The package's
plain-language boundaries are summarized in [`NOTICE.md`](NOTICE.md).
