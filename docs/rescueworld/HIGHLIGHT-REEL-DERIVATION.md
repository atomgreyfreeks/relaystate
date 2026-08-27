# The highlight reel uses the registered checks and invents no score

This document records the rule agreed by Claude and Codex on the team board in
messages 1379 and 1381. The implementation source is
`app/scripts/derive-rescueworld-highlights.mjs`, and its generated contract is
`app/public/rescueworld-highlights.json`.

## What enters the reel

The sealed Rescue World replay holds eleven moments when a decision had to be
made. Five of those moments belong to the frozen registered experiment. Each of
three methods answered each registered moment eight times. The other six moments
are useful descriptive replays, and they stay outside this reel because their
results were not part of the registered claim.

The reel uses three literal classifications:

- **Exceptional:** One method produced a decision that passed every prewritten
  check in all eight registered tries at that moment.
- **Perfect repair:** All eight first answers missed a check, and one bounded
  correction message put all eight right without breaking an answer that had
  already passed.
- **Persistent problem:** The strongest of the three methods still failed most
  tries at that moment.

These classifications do not combine the checks into points, weights or a new
ranking. The raw count out of eight always travels with the classification.

## Which moments qualify

The evidence table with one correction passed all eight tries at four moments:
the first outside fire package, missing-intensity verification, the first two
municipal liaison pairs, and the first-night response split. Those four moments
qualify as exceptional.

The municipal-liaison moment also qualifies as a perfect repair. The initial
evidence table passed zero of eight tries. The same eight tries passed after one
mechanical correction message, and no initially passing answer was broken.

The additional-water-truck moment qualifies as a persistent problem. The plain
notes passed zero of eight tries, the evidence table passed one of eight, and the
evidence table with one correction passed two of eight. The strongest method
therefore still failed six of its eight tries.

## The one example that tells the whole change

The reel's explorable example is the additional-water-truck moment with seed
51104. The plain notes proposed exactly 22 trucks, but the plan named six place
labels that were outside the moment's allowed list and named neither required
unknown. The evidence table used the allowed identifiers, but its quantities
added up to 24 trucks when only 22 were available. One correction message reduced
the plan to 22 trucks, and the corrected answer passed every prewritten check.

This example shows why a plan can look reasonable and still fail. It also shows
what the bounded feedback message can repair. The wider water result remains on
screen beside it: only two of eight corrected water plans passed every check.

## What the shared data contract exposes

For every registered moment and every method, the generated contract carries:

- the number of tries and the number that passed every prewritten check;
- the number that stayed within the resource limits;
- the number with a communication failure;
- how many tries named every required unknown and how many named none;
- the result, broken-rule count and first broken rule for each seed;
- how many distinct assignment sets appeared and how often the most common set
  returned; and
- any exceptional, perfect-repair or persistent-problem classification.

The highlight reel and the eight-try evidence display must read this same
contract. Their counts can therefore never drift apart. The contract also carries
the standing limitation required by `docs/rescueworld/STORY-TEMPLATE.md`: these
checks measure traceability and rule-following inside the exercise. They do not
grade the real responders or prove that an agent's judgment was better.

Rebuild the contract from the repository root with:

```bash
node app/scripts/derive-rescueworld-highlights.mjs
node app/scripts/derive-rescueworld-highlights.mjs --check
```
