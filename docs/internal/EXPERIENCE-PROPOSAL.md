# Rescue World — the experience proposal

## What this is (the process owner’s reframe, 2026-08-23)

Rescue World is a disaster-decision simulator built from real incidents: it
reconstructs the real decision points with the information that existed at
each moment, lets any decision method — including what actually happened —
play through them, and shows, in simulation, who reaches more people. The
real response is one run. Our agent system is another. Any future method
drops in as a new recorded run. The simulator's honesty — declared
assumptions, recorded receipts, deterministic replay — is what makes its
answers trustworthy, and it is the product, not a caveat on it.

Status: proposal, revision 2, written 2026-08-23 by claude after Randy
rejected the first living-world build. Revision 2 folds in codex's no-build
review (board message #564): the story details now come from the real
81-event run rather than the old demonstration log, the claims are scoped to
what the recorded events can support, and the comparison machinery's
requirements for future runs are stated honestly. Nothing in this document
is built until Randy approves it. The current build stays as the engine
underneath; this document describes the experience that engine must serve.

## The diagnosis, in one sentence

The current page shows a correct dataset standing on real ground, but it
never tells anyone the story — what happened, what was at stake, what the
desk decided, and why one method reached seventeen more people — so a viewer
inspects instead of understanding.

## What SpaceData already built, and where we sit

SpaceData's published screenshots and announcement show a console with
three working surfaces: a feed of incoming reports on the left, the 3D map
in the center, and a rail of layers with a detail panel on the right, with
a stated rule keeping four classes of information — preliminary, confirmed,
official, satellite-derived — separate. What their public material shows is
a picture of what is known. What it does not show is the office deciding. Rescue World's job is to put
the deciding on screen: the same three-surface form a SpaceData user already
reads, with the right side replaced by the thing they do not have — the
evidence desk visibly working: claims arriving, verdicts being stamped,
dispatches being authorized by named evidence.

## The user story

A judge, or Randy, sits down. No context. Here is their whole session.

**The briefing.** The screen opens like a mission start, not a dataset:
"July 28, 2026, 16:27. A magnitude 7.1 earthquake strikes Kumamoto
Prefecture. In the first minutes, eight exercise reports arrive — some
exaggerated, some agreeing — while the agency's official updates sharpen
over four hours. A desk with two rapid-assessment teams must decide where
they go. You are watching that desk work. The reports and outcomes are a
labeled exercise; the ground, the hazards, and the official updates are
real." One control, labeled "Begin". Brackets spin open; the camera starts
high over the whole exercise area.

**Act one — the quake and the fog.** The camera dives toward the epicenter.
A scan pulse sweeps the ground; the real landslide scars ignite along the
slopes; the real road closures draw themselves as severed lines. Then the
reports begin to arrive as things in the world: each one lands at its
coordinate with a signal flare, and its card slides into the left feed —
source, time, claim. The story tension is built by the reports themselves,
and in the real run it is one exact conflict: at the first site, one post
claims sixty people waiting while two independent sources agree on
eighteen. Each round is a story beat with a headline the feed announces,
for example: "Round 2 — two sources disagree about the first site." (Sites
are named neutrally — Site A, B, C, D — unless we add explicitly synthetic
display names to the scenario; no invented place names.)

**Act two — the desk decides, visibly.** On the right surface, the claims
for the contested site stack as cards. The desk's verdicts stamp onto them
one by one — supported, rejected, unresolved — with the rejected claim
struck through and the run's own recorded reason attached. When the
dispatch is authorized, a route ribbon draws toward the destination and the
team moves along it as a lit unit. One honesty note governs that ribbon:
the recorded events carry destinations, not road paths, so the ribbon is
explicitly illustrative — labeled as such in small type — until the event
contract is extended with recorded routes, which is listed below as an
optional backend extension. Arrival is an event: a pulse at the site, and
the people-reached-for-assessment counter ticking up there and in the
outcome chip.

**Act three — the consequence.** The real run holds one canonical
divergence episode, and it plays as cause, choice, and consequence. Cause:
at the first site, one post claimed sixty while two independent sources
agreed on eighteen, so the evidence method supported eighteen and rejected
sixty. Choice: with the same eight reports and two teams, both methods sent
one team to the second site; the plain method spent its other team on the
first site's loud claim, while the evidence method chose the third site,
whose claim was supported. Consequence: the plain method reached sixty
simulated people for assessment; the evidence method reached seventy-seven
— a gain of seventeen in this scripted exercise. The plain desk's team
arrives to find eighteen, not sixty, and the caption says exactly why. The
ground takes a simulated scar, labeled simulated, never presented as
observed damage. Scarcity is stated in words at the moment it bites.

**The debrief — where understanding happens.** When the run ends, the world
dims and the debrief rises: first the sentence — "The desk that checked its
evidence reached 77 simulated people. The desk that trusted the loudest
report reached 60. The difference was one unchecked claim." — then the one
divergence episode as its three beats — cause, choice, consequence — as
three cards. Clicking a card flies the camera to where that beat happened
and replays it, with the evidence panel showing the claims and verdicts
that drove it. Every beat is derivable from the recorded events: the
decisions proposed, the claim verdicts, the dispatches with their
authorizing claims, and the outcomes. A viewer leaves able to retell the
story: where the methods diverged, what the evidence said, who was reached
because of it.

**Comparing runs — never side by side.** Comparison happens inside one
world, three ways, all built on the same mechanism: the divergence moment —
a point in the timeline where two runs made different choices from the same
information.

1. Ghost echoes: while watching run A, at each divergence moment the other
   run's choice appears as a spectral marker and route — "the other desk
   sent the team here" — visible for the beat, then gone.
2. The world swap: one key exchanges the world state in place — same
   camera, same round, the other run's reality fades in with its name
   stamped — so differences are seen by flicking, the way the film grades
   are judged, never by splitting the screen.
3. The debrief diff: the debrief lists the divergence moments of any two
   runs of the same scenario, each clickable as above. For the current
   pair, codex's review confirms the pairing is derivable by matching
   scenario, decision stage, and the difference in selected targets. A
   future method is just a new recorded run played through the same
   machinery — that is the design intent, and making it true for arbitrary
   runs requires a small backend extension: a run identifier plus equality
   keys for the scenario, the observation set, the resources, and the
   decision slots, so any two runs can be paired mechanically. Until that
   extension lands, comparing-with-zero-new-interface is a stated goal, not
   a proven property.

## The full incident — the agents work the real scenario

the process owner’s directive, stated twice in session: using all of the data is
critical, because the data is the agents' working material, not scenery.
After this proposal is approved, a second recorded scenario is built from
the complete open set now being acquired: the seven official updates and
1,248 station readings arriving on their real four-hour clock; all
twenty-nine road closures switching state at their real times; the real
aftershock sequence — over nine hundred shocks — perturbing the response;
the ninety-two shelters carrying an occupancy layer modeled from the
official aggregate reports and labeled as modeled; population-weighted
demand from the census grid; and hundreds of exercise reports, labeled
synthetic, hung on the real timing. The agent fleet works that full feed on
the remote graphics processors, producing recorded receipts exactly as the
contract requires, and the same theater plays the result. The small
81-event run remains the auditable proof of the machinery; the full
incident becomes the demonstration where the agents face the real event's
full complexity.

## The repairs that ride along

- Cameras: the free camera stays but gets tuned damping, sane limits, and a
  cinematic autopilot for the briefing, the dispatches, and the debrief
  flights, so the default experience is directed and the freedom is opt-in
  at any moment.
- Buildings: the real footprints get their recorded heights honored at true
  scale, a material in the house language (edge-lit volumes, not flat white
  boxes), and a scale reference so they read as a town.
- The grade: the default look becomes the graded one (the halation family,
  pending the look session where Randy rules), and the Death Stranding
  reference document drives the polish pass: scan pulses, route ribbons,
  label anchoring, map-open transitions.
- Density: the feed shows at most three cards; everything else waits.
  Rounds carry headlines. No surface ever shows raw identifiers as its
  first line — names first, identifiers in small type.

## What this proves to SpaceData

Their map shows a disaster. This shows a disaster being decided — every
dispatch traceable to named evidence while you watch, every failure
explained at the moment it happens, and any new decision method testable in
the same theater by recording one new run. That is the product argument
made playable.

## Approval

- Randy: approves or amends this document before any building resumes.
- codex: reviews for feasibility against the recorded log structure (the
  divergence moments must be derivable from the two runs' timelines) and
  for claim honesty.
