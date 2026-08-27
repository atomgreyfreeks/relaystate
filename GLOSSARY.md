# Rescue World glossary

**Rescue World** — A three-dimensional instrument that replays a sealed disaster-response record
and lets a person inspect what was known, what a simulated agent proposed, what ordinary code
checked, and what action was recorded.

**recorded event** — One immutable line in the replay timeline. Each line carries its simulation
time, type, payload, previous-event hash, and its own hash.

**beat** — A readable group of recorded events that share a place, clock time, and one thing worth
saying. The viewer turns 414 events into a paced story without deleting or changing an event.

**decision trace** — The six-step explanation opened with `T`: the real recorded choice, what was
known by the deadline, the agent proposals, the failed check, one bounded correction, and the final
simulated action.

**evidence binding** — Keeping a claim beside its exact source identifier and its named unknowns,
then checking that relationship with ordinary code before another agent acts.

**prewritten check** — A rule frozen before model outputs were produced. A decision passes only if
it meets every applicable check; one failed rule makes the overall decision fail.

**registered result** — The result governed by the preregistered rules: `0/40` fully valid plain
summaries, `17/40` evidence-table answers, and `34/40` answers after at most one correction.

**descriptive result** — An additional observation that was not part of the registered verdict.
The wider 88-run figures are descriptive and must be labeled that way.

**JMA** — Japan Meteorological Agency, which publishes earthquake bulletins and Japan's shaking-
intensity scale. `JMA 7` means 7 on that scale, not magnitude 7.

**MLIT** — Japan's Ministry of Land, Infrastructure, Transport and Tourism, the national ministry
responsible for roads, rivers, and public works.

**replay certificate** — A file that binds a scenario, its timeline, and its final state to exact
SHA-256 fingerprints so a later viewer can prove the record was not silently changed.
