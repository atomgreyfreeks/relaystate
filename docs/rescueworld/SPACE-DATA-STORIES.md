# The user stories for the Space Data presentation build

Written 2026-08-24 by claude from Randy's directive on the board (message
1361), before any design or code. These stories are the acceptance spine:
the presentation build is done when a stranger can live each story without
help. The save state for reverting is the git tag `save-state-space-data`.

## What this build is for

Rescue World replays the real July 2026 Kumamoto earthquake response as one
living world, with software agents making the same decisions the real
responders faced. The tool exists to help people spot opportunities, uncover
room for optimization, prepare better for disasters, and train for real
situations. Tonight's build tells that story at a high level. What it does
not yet do is make the agents' decision-making instantly visible: a viewer
has to hunt for what the agents decided, why, how sure the system is, and
what difference each decision made. The presentation build closes that gap
using the interface language of real-time strategy games and games like
Civilization, which solved exactly this problem: telling a clear story on a
map.

## The stories

### Story one: the thirty-second decision

A presenter stands in front of a room that has never seen this tool. She
clicks one decision moment on the map. Within thirty seconds, and without
speaking, the room understands: who had to decide, what the agent proposed,
why (which reports it read and which rules bound it), and what the real
responders did at that same moment. Nothing on screen needs a translator.

### Story two: the highlight reel

A viewer wants the short version: where did the agents shine, and where did
they stumble? The interface offers this directly. The exceptional moments (a
correction that repaired a broken plan; a decision that passed every check)
and the bad moments (a proposal that named six places it was not allowed to
use; a desk that never said what it did not know) are marked and reachable
without scrubbing through three days of playback. The bad moments are shown
with the same prominence as the good ones, because the tool's credibility
rests on showing both.

### Story three: honest confidence at a glance

A viewer asks the natural question: how much should I trust this decision?
The interface answers with what the data truly supports, at a glance. Every
registered decision moment was answered eight separate times, so the screen
can honestly show how strongly those eight tries agree, and how each try
came out against the prewritten checks. No invented percentage appears
anywhere. A tight cluster of agreeing tries that passed their checks reads
as strong. Scattered tries or failed checks read as weak. The display says
in one plain sentence what the signal is and is not.

### Story four: the impact of a choice

A viewer sees a decision and asks: what difference did it make? The
interface shows the decision's effect inside the simulation — what moved,
what was covered, what was left short — in the world, at the place it
happened, as it plays out. The claim boundary stays visible: impact is
simulated, the record keeps no count of people reached, and nothing on
screen compares outcomes against the real responders.

### Story five: the next run, from the cockpit

An operator finishes watching a run and wants to try something: a different
method, a different seed, a different moment emphasized. From the interface
itself, she prepares a new agent simulation run — choosing what varies —
sends it to the graphics processors, and watches results arrive back into
the same world when the run completes. For the presentation, this story may
be satisfied by a working prepare-and-queue console with an honest status
display, even if the full round trip is demonstrated with a pre-recorded
completion. What is shown must be real, and anything staged must say so on
screen.

## The rules that bind every story

- Plain language everywhere, under the copy rules in `docs/COPY-CONTRACT.md`
  and the storytelling order in
  `docs/gpu/FINDINGS-STORYTELLING-GOLD-STANDARD.md`.
- The grade wording and the standing limitation come verbatim from
  `docs/rescueworld/STORY-TEMPLATE.md`.
- The real recorded choice always renders first, with equal dignity, and no
  sentence ranks the agents against the real responders.
- The word "confidence" may describe what a viewer builds from the evidence.
  It never appears as the label of an invented number.
- Determinism is untouched: the replay stays byte-identical, and every new
  surface reads recorded data.

## The acceptance test

Sit a stranger in front of the build with no explanation. If they can
answer, from the screen alone: what did the agents do at this moment, why,
how much should I trust it, what difference did it make, and how would I
run my own — the build passes. Each story above is one of those five
questions made concrete.
