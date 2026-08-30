# Rescue World — how games show who decided what, and what we should copy by nine in the morning

Written 2026-08-23 by claude, for the two agents building the Space Data presentation and for
Randy.

Rescue World replays one earthquake over real Kumamoto ground. A fleet of
artificial-intelligence agents reads the incoming reports, decides where the assessment teams
go, and dispatches them. The evidence table those agents keep is grown the way a lichen grows:
two partners living joined, claims on one side and sources on the other, kept apart so that
neither one can spoil the other.

## Why this document exists

Randy watched the shipped viewer and said that the interface is cool and tells the story at a
high level, and that the agents' decision-making is basically invisible as an experience. He
asked for real-time strategy and Civilization-class interface language. A stranger should
instantly understand what the agents decided, why they decided it, how confident the system was,
and what the impact turned out to be. That includes the moments where the agents did something
exceptional and the moments where they did something bad. This document surveys the
games that already solved that problem and turns each solution into a named change to a named
element of our screen.

The five user stories in `docs/rescueworld/SPACE-DATA-STORIES.md` are the acceptance spine for
that build. Every pattern below states which story it serves. A pattern that served no story
was cut.

Three terms recur here and are defined once.

- **Telegraph.** A telegraph is a preview drawn on the map, at the place where a thing will
  happen, showing exactly what that thing will do, before it happens. The game Into the Breach
  draws an arrow onto the tile an enemy is about to hit and prints the damage number on that
  tile.
- **Agreement count.** Our honest confidence signal. Each registered decision moment was
  answered eight separate times by the same method. The agreement count is how many of those
  eight tries produced the same choice. Six of eight tries choosing the same two sites is an
  agreement count of six.
- **Consequence ledger.** An ordered list of every decision made during a run, read back at the
  end with the cost of each one attached. The game Frostpunk ends by listing the laws the
  player signed and asking whether the city was worth what was done to it.

## What Rescue World already shows, named element by element

Tomorrow's builders should not have to guess at what exists. This is the shipped surface at
commit `653960b`.

- **The briefing card** (`#brief`) opens the session with the scenario and one control labelled
  Begin.
- **The masthead** (`#mast`) names the incident, the date, the recorded event count and the
  round.
- **The report feed** on the left (`#feed`) lists arriving reports as cards.
- **The region feed** below it (`#beats`) is headed "Elsewhere in the region" and carries road
  closures and aftershocks as plain sentences with their recorded clock times.
- **The story card** (`#narrate`) carries the current round's kicker, its name, its subtitle and
  one sentence saying what the round is.
- **The decision rail** on the right (`#rail`) is headed "The decision rail". In the
  full-incident mode it lists all eleven decision moments. Each row carries the moment's title,
  its deadline clock, the office the record names as the decider, how many ways of working
  answered it, and a line saying whether the moment has passed, is next, or is still ahead. The
  six moments outside the registered experiment carry a badge saying so. Every moment with a
  walk-through carries a button that opens it.
- **The selection panel** (`#panel`) opens inside the rail when something on the map is picked.
- **The trace overlay** (`#trace`) is the five-step walk-through. It holds six cards. Card zero
  is the real recorded choice. Step one is what was known by the deadline. Step two is what the
  desk with plain written notes proposed. Step three is what the desk with an evidence table
  proposed. Step four is what the check caught. Step five is the final action with its grade.
  Each card carries badges, and the overlay carries step dots, a previous control and a next
  control.
- **The consequence caption** (`#caption`) prints the sentence saying what a moment cost.
- **The transport bar** (`#bar`) holds play and pause, speeds of one, four and sixteen times, a
  scrubber shown only in the internal build, single-event and single-round stepping, four map
  layers, a frame-cost meter and a help button.
- **The minimap** (`#mini`) is labelled "the whole ground".
- **The aftershock strip** (`#quakestrip`) runs along the frame.
- **The outcome tally** (`#outcome`) counts what each desk reached.
- **The registered result story** (`#real`) is the honest write-up of the experiment.
- **The debrief** (`#debrief`) closes the run.

The recorded data behind all of this:

- The sealed full-incident run holds 414 events across 72 hours, cut into four acts.
- Eleven of those events are decision moments, meaning a point where somebody had to decide
  something.
- Each decision moment carries twenty-four recorded model answers: three ways of working,
  answered eight separate times each.
- Five of the eleven moments sit inside the registered experiment. Five moments answered eight
  times each gives forty answers per method.
- The registered correctness result: the desk passing plain written notes produced a decision
  that passed every prewritten check in 0 of 40 tries. The desk with an evidence table did so
  in 17 of 40 tries. The same desk given one message naming its exact mistake did so in 34 of
  40 tries.
- The resource-limit result for those same three methods: 37 of 40, 33 of 40 and 34 of 40
  answers stayed inside the exercise's hard limits.
- Every failed answer carries the exact rules it broke, each with a code and a detail string.
  The viewer already renders each one twice, once in the checker's own words and once in plain
  English.
- The copy deck already holds the sentences for agreement. The function `exampleSeeds` writes
  "the same set of choices came back in six of eight tries", and `validCount` writes "of eight
  tries passed every prewritten check". Those sentences exist and are never drawn as a shape.

That last point is the headline of this whole survey. Our honest confidence signal is already
computed and already written into sentences. Nothing on screen turns it into something a
stranger reads in one second.

## How each game was checked, and how fresh the evidence is

Two research agents ran web searches on 23 August 2026, and both came back with dated sources.
Every source used is listed at the foot of this document with its publication date, and the
sharpest quotations are attributed inline. The freshest source was submitted six days before this
document was written.

The strongest evidence here is the developer's own account. Four of these games have a designer
on the record explaining the interface decision, and in three of those cases naming the mistake
they made. Matthew Davis spoke on the Into the Breach attack preview at the 2019 Game Developers
Conference. Jake Solomon explained the XCOM hit percentage in March 2016. Ed Beach said why the
next Civilization drops the score that fed the Civilization VI timeline. Marta Fijak described a
hidden probability that Frostpunk removed. Those four accounts carry more weight in this document
than any critic's reading, and each one is quoted rather than paraphrased.

Five claims below could not be sourced in this pass, and each is marked where it appears. The
Frostpunk closing summary screen, the Civilization VI behaviour where the Next Turn control
renames itself to say what is blocking it, and the exact stacking behaviour of the Civilization
VI notification column are all described from playing the games. The unreliability of the Total
War battle forecast rests on player reports rather than on a developer statement. The claim that
the visible shot spread in Phoenix Point was a deliberate answer to the XCOM complaints comes
from a player forum rather than from its designer. Treat those five as reconstructions to verify
before anything here is quoted in public. None of the five recommended patterns depends on any of
them.

The effort scale used below is fixed.

- **Small** is under two hours of one agent's work, using values the viewer already reads, with
  no new layout.
- **Medium** is two to six hours, needing either a new layout or a new value derived from the
  recorded events.
- **Large** is more than a day of work, or work needing data the recorded events do not carry.

## Into the Breach shows every enemy attack before it happens, on the tile it will hit

Into the Breach shipped on 27 February 2018 from Subset Games, the two-person studio that made
Faster Than Light. It is a turn-based tactics game on an eight-by-eight grid. Matthew Davis
presented its postmortem at the 2019 Game Developers Conference, and three rules sit on one slide
of that deck: all enemy attacks shown, no hit or miss chance, and completely deterministic during
the player's turn. Justin Ma put the same rule in one sentence to Shacknews on 20 February 2017:
"At the beginning of every turn, you know exactly what the enemy's going to do." Davis added the
detail that the rule arrived through iteration rather than as a founding pillar, because early
versions telegraphed only some enemies.

The drawing vocabulary is small, and it is worth copying exactly. A red diagonal-hatch fill marks
every tile an enemy will hit next turn, and a threatened building takes the same fill. A red
arrow sits on the enemy showing its attack direction. A yellow dot marks the specific target. A
melee enemy's approach-and-strike path is a yellow curved arrow. A vertical widget on the right
edge, headed with the words "active unit" set in capitals, stacks portrait tiles in the order the
units will act, so a player reads the resolution order rather than inferring it.

Two consequences of that vocabulary matter more to us than the vocabulary itself. First, the
interface constrained the content rather than the other way round. Davis states that the
requirement to show every enemy's target and attack type forced the weapon roster down to three
categories, and that enemy attacks were restricted to the four compass directions because
arbitrary patterns broke the overlay's legibility on one screen. Second, Subset Games named its
own mistakes on stage. The power-grid fail state, which showed a segmented meter reading "grid
defense 15%", is called out on a slide as having inserted randomness into a design the studio had
sold as deterministic, and as having annoyed players. A slide headed "Puzzle-Game Difficulty"
names the deeper risk, which is that too hard becomes unsolvable and that the too-hard threshold
is a cliff. A game that removes luck also removes the thing a confused player blames, so every
failure lands on the player, and the design has to earn that.

The reason for all of it is one sentence Davis gave Game Developer on 23 February 2018: "We
wanted to make something where every death felt like your own fault." He added the rule that
follows from it, which is our rule too: "It's important to me that when you fail at a goal, it's
very clear how or why you failed."

**How this maps onto our surface.** Our eleven decision moments are the exact equivalent of an
enemy attack: a thing about to happen at a known clock time, at a known place, with a known
consequence. Right now the decision rail says a moment is "next" and says nothing about what is
about to be decided. The change is to telegraph the moment on the map before it resolves. As
the playhead approaches a decision moment's deadline, the map draws every site that moment
could send teams to, as an outlined marker at its real coordinate, with the number of teams
each candidate choice would send printed on it. Two ghost sets are drawn together and keyed by
colour: the sites the desk with plain written notes chose, and the sites the desk with an
evidence table chose. Where the two agree, the marker is drawn once and labelled as agreed.
Where they disagree, both are drawn, and the disagreement is the picture. Then the deadline
passes, the chosen dispatch resolves, the rejected ghost fades, and the consequence caption
prints the sentence that already exists. A viewer who watches one moment learns the grammar and
reads every later moment for free. The claim cards already in the rail carry the Supported and
Rejected stamps explaining why one ghost was chosen, so the map telegraph and the rail
explanation are two views of one recorded fact. This serves story one, the thirty-second
decision, and story four, the impact of a choice.

Two of the postmortem's harder lessons apply to us directly. The first is the vocabulary cap.
Subset Games cut its weapon roster to three kinds because the preview had to stay readable, so
our telegraph should carry at most three marks and no more: the site, the number of teams, and
which desk wanted it. Anything a fourth mark would say belongs in the rail. The second is the
warning about removing luck. Our replay has no randomness a viewer can blame either, so a viewer
who does not understand a moment has nowhere to put the confusion except on themselves or on us.
That is the argument for the plain sentence under every telegraph, and it is why the copy work
matters as much as the drawing.

**What it would take to build.** Medium. The site coordinates, the per-method assignments and
the quantities are all read already by `app/src/rescueworld/trace.ts` into `TraceAssignment`
rows, and the map already knows how to draw a marker at a site and fly the camera to it. The
new work is the ghost material, the colour key, the fade on resolution, and the timing hook
that fires the telegraph a fixed number of ticks before a decision moment's recorded deadline.

## The XCOM shot percentage is the field's most famous lesson in dishonest confidence

XCOM: Enemy Unknown shipped in October 2012 and XCOM 2 in February 2016, both from Firaxis. Both
put a single whole-number hit chance on the targeting interface. That number is the most
discussed element in the whole genre, and its designer explained exactly why on the record.

Jake Solomon told Game Developer on 1 March 2016 how players read it: "If you see an 85 percent
chance to hit, you're not looking at that as a 15 percent chance of missing. You see an 85
percent chance, and you think, 'That's close to a hundred; that basically should not miss.'" He
then confirmed what the game does about that reading, in the same interview: "That 85 percent
isn't actually 85 percent. Behind the scenes, we wanted to match the player's psychological
feeling about that number." On the lower difficulty settings the true hit rate behind a displayed
eighty-five per cent sits nearer ninety-five. His stated reason was that "we don't want the
players missing multiple 85 percent shots, because then the game starts to feel punitive". He
also named the cost of the trick in one line, which is the line worth remembering: "If you shave
off the lows, a lot of the time you're shaving off the highs."

Two things followed. Players who learned the displayed number was adjusted stopped trusting any
number in the interface, and the complaint about missing a ninety-five per cent shot outlived
the game by a decade. Solomon himself described replaying XCOM after building another game and
being "unbelievably frustrated" when he missed shots, in an interview published 6 July 2022.
Firaxis then removed the mechanic entirely from Marvel's Midnight Suns in 2022, and the studio's
own 2024 conference talk on that game states the premise in its description: heroes "certainly
don't miss 95% chance-to-hit shots", because card-based resolution replaced the hit roll. The
practice has not died elsewhere. PC Gamer reported on 11 March 2026 that the game Dispatch
automatically succeeds on anything displayed above a seventy-six per cent chance, and framed it
by reference to XCOM, which shows XCOM is still the case the whole field argues from.

Two other responses in the genre are worth naming with their evidence weight attached. Gears
Tactics, from Splash Damage in 2020, is often cited as a reply to this discourse, but its
developers' published interviews discuss turn pacing rather than hit chance, so no design intent
about probability can be claimed for it. Phoenix Point, from Snapshot Games in 2019, replaced the
single figure with a visible spread of where shots will actually land, and players describe that
as a direct answer to the XCOM complaints, though no statement from its designer was found to
confirm the intent.

**How this maps onto our surface.** We must never print a percentage, and this is the game that
explains why in language a judge accepts immediately. What we have instead is better than a
percentage and honest. Each registered moment was answered eight separate times, and the count
of tries producing the same choice is a measured fact rather than a model's opinion of itself.
So the display is eight marks, drawn as a short strip of eight cells on every moment row in the
decision rail and on the badge line of every trace card. A cell is filled where that try
produced the choice shown and hollow where it did not, and a second colour marks the tries that
failed the prewritten check. Under the strip goes the sentence the copy deck already writes:
"the same set of choices came back in six of eight tries". Where a moment sits outside the
registered experiment, the strip is drawn in outline only and the existing badge saying so
stays. A viewer reads the shape before the sentence, and the shape resists being misread as a
promise, because it is visibly a count of things that happened. The registered result of 0 of
40, 17 of 40 and 34 of 40 becomes three strips of forty cells in the results story, which is a
picture of an experiment rather than a claim about the world. This serves story three, honest
confidence at a glance.

**What it would take to build.** Small. The eight recorded answers per method per moment are
parsed already; `buildTraces` collects the seed list and picks one seed to display, and the
copy functions `exampleSeeds` and `validCount` exist already. The work is a small strip
renderer and a pass that counts identical assignment sets across the eight seeds.

## Civilization surfaces what just happened through a stack of notifications and a timeline of moments

Civilization V shipped in September 2010 and Civilization VI in October 2016, both from Firaxis.
Three of their patterns bear directly on us.

The first is the notification stack. Civilization VI keeps a column of small icons down the right
edge of the screen, one for each thing needing the player's attention and each thing that just
happened. Hovering an icon reveals one sentence, and clicking it flies the camera to the place it
concerns. Items persist until they are resolved rather than scrolling away. The second pattern is
stronger and is the one most worth stealing. The Next Turn button renames itself to say what is
blocking it, so with research unset it reads "Choose Research" and with a unit awaiting orders it
reads "Unit Needs Orders". The most prominent control on the screen doubles as the status line
for what the simulation is waiting on. Both of these are described here from playing the game,
because no dated source for the exact stacking and dismissal behaviour was reachable this
session.

The third pattern is the Timeline, added in the Rise and Fall expansion in February 2018, and it
is well sourced. Anton Strenger of Firaxis told PCGamesN on 28 November 2017 that the expansion
carries "over 100 historic moments" that appear on the timeline with a unique illustration, while
smaller moments are logged without custom artwork. Two rules in the trigger table are worth
copying. Significance is relative to the era, so clearing a barbarian camp counts as a Historic
Moment in the Ancient Era and not in the Modern Era. Being the first player in the world to reach
a given moment scores higher than reaching it later. Those moments feed Era Score, which decides
whether a civilization's next era is a Golden Age or a Dark Age, so the ribbon is both the record
of what happened and the reason it mattered. Strenger also stated the honesty rule the team held
itself to, and we should hold it too. The thresholds "are not rubber bands that will artificially
skew play", and the system was added "in a transparent and fair way".

Now the part that should slow us down, because it comes from the person who built it. Ed Beach,
the creative director, explained to TheSixthAxis on 30 August 2024 why the next Civilization
drops Era Score altogether. His words: "You can just get an overload of too many little numbers
and trackers and progress bars to fill up, and I don't think that's a fun game." He judged that
Era Score in Civilization VI "made players chase mini objectives almost to a level that was
distracting from their strategic vision as an empire". A ribbon of moments that also keeps score
pulled attention away from the thing the game was about.

Civilization VI also carries the genre's best-known legibility criticism, and the sharpest
version of it is specific rather than general. Writing on 24 October 2016, the critic at Scientific Gamer found the problem to be absent
information rather than buried information. The judgement: "Civ
VI barely has any [tooltips], and the ones it does have are so low-information that they might as
well not exist at all." The named cases are exact. Amenity tooltips show no breakdown of what is
contributing. Yield tooltips do not say which buildings or adjacencies produced the number. The
district placement screen offers no numeric preview before the player commits. Policy cards show
no net change to output before they are enacted. Reviews of the same interface disagreed sharply,
with one calling the layout remarkably uncluttered and another calling the diplomacy screens a
hot mess. The pattern across them is that the top-level summary read well, while every question
of the form "why is this number what it is" read badly.


**How this maps onto our surface.** Three changes fall straight out. First, the decision rail
becomes the notification stack. Every one of the eleven moment rows carries, at all times and
without hovering, four things: the office that decided, the choice that was made in plain
words, the agreement strip out of eight, and the check verdict as a word. Today the row carries
the title, the clock, the decider, a count of ways of working, and a passed-or-ahead line, and
it carries no outcome at all. That absence is precisely the process owner’s complaint, and this is the
smallest change that closes it. Second, the play control in our transport bar adopts the
renaming behaviour: approaching a decision moment it reads "Next: the water decision, 22:40",
and while a moment resolves it names what is being decided. Third, we build the Civilization VI
timeline as a horizontal ribbon under the transport bar, running the full 72 hours, with the
four acts marked as bands and each of the eleven decision moments marked as a notch. A passed
moment's notch is coloured by its check verdict, and clicking a notch flies the camera and opens
that moment's trace. The internal-only scrubber already computes the playhead position across
the run, so the ribbon has a working coordinate system on day one. The rail change serves
story one and story two, the highlight reel. The ribbon serves story two.

Ed Beach's warning applies to our ribbon and should be written into the build brief. Our ribbon
records what happened and it must never total anything. No points, no era score, no progress bar
that fills. The moment a viewer starts reading the ribbon as a score, the agents stop being the
subject and the score becomes the subject, which is the failure Beach named in his own game. The
Scientific Gamer criticism applies to us in the other direction and is the reason pattern three
exists. A number with no visible breakdown is worse than no number, so any grade we print must
open the reasons that produced it.

**What it would take to build.** The rail rows are Small, because every value sits already in
`decisionRows` inside `app/src/rescueworld/main.ts` and in the parsed traces. The renaming play
button is Small. The timeline ribbon is Medium, because it needs a new element, act bands read
from `app/src/rescueworld/acts.ts`, and notch placement from each decision event's recorded
tick.

## The StarCraft II observer makes an invisible strategy readable in three seconds

StarCraft II shipped in July 2010, and Blizzard and the broadcast community refined its observer
interface over the following decade. That interface is the best worked example in existence of
making an unseen decision process readable to an audience with ten seconds of attention.

The shipped observer view is documented in a viewer guide published on 9 November 2019. The
production tab in the top left shows everything each player currently has building or
researching, which doubles as a readout of that player's build order. Supply is split into worker
supply and army supply rather than shown as one number, and the guide names the exact read a
caster makes from it: a player who stops making workers before reaching about sixty-five of them
is preparing to attack. Minerals are drawn in blue and gas in green, each with the banked total
beside the income rate, so an audience sees both what a player has and what a player is earning.

A custom observer interface built at the Massachusetts Institute of Technology Game Lab and
published on 21 October 2013 goes further, and its stated reason is the transferable part. Its
top row holds the score, the player names, a graph of the resource lead, an icon for each side's
newest unit and an economy panel. Its right column holds research timers, with an upgrade panel
that appears only when a research has under thirty seconds left and then labels the result as
denied, cancelled or completed. Its bottom row holds the production tab, a graph of workers lost
sampled every thirty seconds, a graph of the trade in units lost, a three-minute resource
advantage graph and a graph of resources still in the ground. The design rationale given is that
related numbers are clustered into one zone so that casters "can freely use that space to
illustrate any topic in their commentary without worrying that viewer attention might be
distracted elsewhere on screen".

Beside the interface sits the human craft, and a community reference for the competitive observer
interface sets it down as a short list of rules. Keep the production tab open by default. Move
the camera smoothly and never in jerks. Do not box-select while on camera, because it clutters
the selection panel a viewer is reading. Above all, pan across to nearby action rather than
jumping there by clicking the minimap, because panning preserves the viewer's sense of where
things are in relation to each other. A good observer also moves the camera to where a fight is
about to start rather than to where one just ended, so an audience watches a decision happen
instead of reading its aftermath.

Modern broadcast overlays have added model-driven win probability, and the way Riot Games shipped
it is the honest version. A developer diary published on 9 October 2023 describes the League of
Legends win probability graph: minutes along the horizontal axis, win share on the vertical axis,
split above and below a centre line, with icons marking the objective events that caused each
swing. The model is trained on professional matches since early 2020. The rule that matters is
editorial rather than technical, and the diary states it plainly. The graph is shown after key
plays or after the match, to show how particular events contributed to the swings, rather than
running continuously in the corner. A model's output is presented tied to the event that caused
it, and at a moment chosen by a human.


**How this maps onto our surface.** The production tab becomes a standing strip saying what
each desk is working on right now: which reports it has taken in, which claims it is weighing,
and which decision moment it is approaching, with the deadline counting down. Our recorded
events carry all of this, in the ingest events, the claim state changes and the decision
deadlines, and the rail renders claim cards with their Supported and Rejected stamps already.
The army value graph becomes our accumulated-outcome line: one line per desk plotted across the
72 hours, showing simulated people reached for assessment, drawn as a small strip beside the
outcome tally rather than as a chart in the middle of the screen. The camera lesson is the
cheapest of all, and the machinery exists: `deriveActs` computes a camera anchor for every beat,
so the directed watch should arrive at a decision moment's site before its deadline rather than
after its dispatch. The win-probability warning is a rule for us rather than a feature. Any
number we draw that came out of a model gets a different colour and a one-word label from any
number that was counted, and the two never share a row. The desk strip serves story one. The
outcome line serves story four.

**What it would take to build.** The standing desk strip is Medium, because it needs a new
element and a per-tick read of what each desk has taken in. The accumulated-outcome line is
Small, because the outcome tally counts people reached per desk per tick already. The camera
lead-in is Small and is a change to the existing beat timing.

## Frostpunk turns a run of decisions into a ledger and reads it back at the end

Frostpunk shipped on 24 April 2018 from 11 bit studios, and Frostpunk 2 on 20 September 2024.
The first game's Book of Laws is a tree of permanent decisions, and its mechanics are documented
in an analysis published on 21 May 2018. A law can be signed once every twenty-four hours of
game time. Each law is one half of a binary pair, such as child labour set against mandatory
education, and choosing one branch locks the other out for the rest of the run with no undo.
Signing a law produces a short narrated reaction from the colony, printed beside two named
meters, Hope and Discontent, which visibly move. That analysis also names the weakness: the
top-down camera keeps every consequence at a statistical distance, with no street-level view of
the people affected, which blunts the weight the numbers are meant to carry.

The game director, Jakub Stokalski, described the intent in an article published on 13 December
2018. The Book of Laws is built to surface value conflicts rather than to present a menu of
numbers, operating on "unobvious values such as honesty vs. lies", and deliberately withholding a
correct answer. He describes four nested feedback loops behind the choices, and the last of them
only fires after the session ends, when a player asks themselves "Did I really do that?" That
delayed loop is the argument for a closing ledger, from the person who built one.

The most useful thing 11 bit studios has published, for our purposes, is a failure they fixed.
Reported on 20 July 2021 from a talk by the designer Marta Fijak, an early build of Frostpunk
gave amputee citizens a fifty per cent chance of dying by suicide. The probability was hidden
from the player entirely, and it existed to put pressure on resource management. Fijak's verdict:
"It worked mechanically. It was engaging. But this was not a worldview I held." The fix was to
delete the hidden roll and replace it with a visible choice in the book of laws, between
producing prosthetics and providing care, which the player could act on directly. A hidden number
driving an outcome was replaced by a visible decision with a stated cost.

Frostpunk 2 rebuilt the whole apparatus around a council. An interview with Stokalski published
on 20 September 2024 describes the Zeitgeist system, where opposed values are carried by named
factions, so that one faction favours expansion while another favours order, and a decision is
pulled in conflicting directions by groups with stated agendas. Votes tally on screen in real
time as they arrive, and Stokalski compares the presentation to a dice roll being revealed in
Baldur's Gate 3, so that an outcome feels watched rather than merely computed. Laws can now be
repealed, which is a deliberate move against the player going numb, because factions keep
re-arguing old decisions instead of letting them go cold. A guide updated on 18 September 2024
gives the numbers: one hundred delegate votes are shared among the factions, fifty-one carry a
law, and each faction's delegates lean toward laws matching its interests, so a player can read
likely support before proposing anything. Two levers change the count. Negotiation trades a
concession, such as a research direction or a building type, for votes. Pressure coerces
delegates and damages standing with every faction at once rather than only the one pressured.
Broken promises are recorded and degrade that faction's relations from then on.

The first game's closing summary, which asks whether the city was worth what was done to it and
lists the laws the player signed, is described here from playing the game. No dated source for
that screen was reachable in this session.


**How this maps onto our surface.** Our debrief becomes the consequence ledger. Today the
debrief closes the run with the result and a set of beats. The change is to list all eleven
decision moments as an ordered ledger in clock order, each row carrying what was decided, the
agreement count out of eight, the check verdict, and the sentence naming the consequence. The
rows the presentation needs most are the ones Randy asked for by name: the moments where the
agents did something exceptional and the moments where they did something bad. Both sit in the
data already as verdicts, because an answer either passed every prewritten check or it named
the exact rules it broke. The ledger marks the best row and the worst row and says in one
sentence what each one was. Clicking a row flies the camera back and opens that moment's trace
overlay, which is machinery we have. The Frostpunk ending is the model for our closing
sentence. The ledger should end with the registered result stated as the count it is, which is
0 of 40, 17 of 40 and 34 of 40 answers passing every prewritten check. Beside it stands the
standing sentence saying that this is a simulated what-if rather than evidence that artificial
intelligence would improve a real rescue. This serves story two, the highlight reel, and it is
the surface
that names the bad moments with the same prominence as the good ones.

The Frostpunk 2 council maps onto something we do not have yet, and it is the model for story
five, the next run from the cockpit. A screen that prepares a simulation run before it goes to
the graphics processors is exactly the Frostpunk 2 law screen. The options are listed, each
option states its expected effect before it is committed, and the run is launched from the same
screen that shows what was chosen.

**What it would take to build.** The eleven-row ledger is Medium, because the rows are composed
of values we parse already while the debrief needs a new section and new layout. Marking the
best row and the worst row is Small once the ledger exists, because the check verdict
distinguishes them already. The run launcher is Large, and it is out of scope for a nine
o'clock deadline unless the first five patterns land early.

## Total War forecasts a battle badly, and Crusader Kings 3 explains a decision well

These two cases are best read as a matched pair, because one shows the failure and the other
shows the fix.

The Total War series has shown a pre-battle forecast since Shogun: Total War in 2000, and the
modern form is a balance-of-power bar with a verbal label above it, reading from Decisive Victory
down through Close to Valiant Defeat. Players report consistently that it cannot be relied on.
Forum posts describe a displayed eighty per cent against twenty per cent that turns into a much
harder manual battle. Others describe the prediction as a rough measure of expected casualties
rather than a true chance of winning. Others again note that on the easier settings the result is
inflated in the player's favour. Every one of those is a player report rather than a developer
statement, and no
statement from Creative Assembly acknowledging the display's inaccuracy was found in this pass,
so the unreliability is reported here as a widespread player experience.

What Creative Assembly has said publicly is about the machinery underneath. Miguel
Lopez-Bachiller and James Kwan presented "Predicting Combat Outcomes in Total War" at the 2025
Artificial Intelligence and Games Conference, with the recording published on 22 April 2026. The team trained a model on data generated by running battles automatically inside the game, in
order to predict the result of one unit fighting another. That model feeds two things: the
predicted result the player sees, and the battle intelligence deciding when a unit should attack
or withdraw. The talk description names the difficulties the team ran into as part of its content.
So the honest summary is that the forecast is a learned prediction the studio is still improving,
and that players have learned to distrust the single bar it is displayed as. A single figure with
no visible breakdown will be wrong in public, and after that it is furniture.

Crusader Kings 3 shipped on 1 September 2020 from Paradox Development Studio and takes the
opposite approach. Every number describing what a character thinks is accompanied, inside the
same tooltip, by the itemised list that produced it. The published breakdown of the opinion system names the buckets that sum into the single
displayed figure. There is a general opinion, an attraction opinion drawn from preference and
physical traits, and a shared dynasty opinion. There is a virtues and sins opinion that varies by
faith, and a hostility opinion between faiths. There is a relations opinion carrying friendship,
love and conflict, and a tyranny opinion earned by unjust acts. Rather than
invent example values here, the point is the structure: a reader sees the named reasons and their
individual contributions, and the total is their sum.

The clearest statement of intent comes from the series designer Henrik Fåhraeus, speaking in
January 2013 about the immediate predecessor whose opinion system this one inherits. He described
opinion as "one single value summed up from a number of clear reasons why someone would like or
dislike you", built from named modifiers, including personality clashes where a lustful character
distrusts a chaste one. His stated design goal is the sentence worth keeping. Outcomes should be "expected (reasonable)
random outcomes" rather than opaque rolls, with every modifier visible in a tooltip so a player
can act on the reasons shown. His own example is placating a duke by granting him more land. Paradox published a developer diary on the intelligence behind acceptance decisions in
August 2022, describing the addition of more interactive modifiers to acceptance, though only its
summary could be read this session rather than the full text.


**How this maps onto our surface.** We hold the raw material for a Crusader Kings 3 breakdown
and we render it already. Step three of every trace card lists how the desk with an evidence
table weighed each report, with a state word beside each one, and step four reproduces the
checker's own lines beside their plain-English versions. What is missing is that these sit four
cards deep inside an overlay a viewer must choose to open. The change is to promote the
breakdown to the badge. Every verdict badge, wherever it appears, on a rail row, on a trace
card or on a ledger row, opens the itemised list beneath it in place, showing each rule the
check named as its own line. The Total War lesson is the guard rail. We must never draw a single
strength bar comparing our desks to the real responders, and the covenant forbids ranking the
agents against them already. The real recorded choice renders first with equal weight, as card
zero of every trace, and it stays first. This serves story one, the thirty-second decision.

**What it would take to build.** Small. The itemised failure sentences are computed already per
answer in `buildDesk` as the `failures`, `messages` and `findings` arrays, and the plain
versions are resolved already through the scenario labels. The work is a disclosure control on
the badge and a small list renderer.

## Interfaces built for artificial-intelligence agents in 2025 and 2026 show mechanism where they should show decisions

This is the one section where fresh, dated sources were fetched today, so it is written with its
citations inline.

The tools that visualise language-model agents converged on one shape between 2023 and 2026.
Langfuse's documentation describes a run as nested observations, each carrying latency, the
exact input and output text, the token cost and the retrieval context, with the parent-and-child
relationships preserved end to end. Braintrust describes a trace as one end-to-end execution
holding one or more timed spans. Arize announced native support for the shared naming
conventions that the OpenTelemetry project publishes for generative artificial intelligence on
11 August 2026, which points at the whole field settling on one span schema. Two vendors have
started moving away from the generic span tree, and their direction is the interesting part.
Weights and Biases Weave now describes its product as treating sessions, turns, steps, tools and
sub-agents as first-class concepts rather than as ordinary code spans. The LangSmith
documentation splits a trace into three stacked views. A Messages view shows reasoning, tool
calls and sub-agent activity as one block per turn. A Turns view shows one card per turn. A
Details view holds the timing, the token counts and the errors. Both redesigns move toward
showing a decision rather than a call stack.

Two dated criticisms of the whole category matter to us. Hamel Husain's Evals FAQ, published 28
May 2025 and updated 18 July 2026, argues that a team building its own trace viewer shaped
around its own domain iterates roughly ten times faster than a team using an off-the-shelf
tool. His reason is that a custom viewer renders the domain's own data properly, showing an
email as an email rather than as raw structured text. His sharper point is that every major tool
handles traces, metrics and annotation well and falls short on pattern discovery, so grouping
similar failures into a taxonomy is still done by hand. The second criticism comes from a case
study Arize published in August 2026 describing how Uber monitors agents in production. Uber
leads its dashboard with a behavioural signal rather than with traces. A voice-booking agent
whose average session length jumped from four or five turns to as many as twenty was the sign of
confusion, and that sign fired before any evaluator caught the failure. The alert then points
back down into the underlying trace. The reading order is the lesson. The anomaly comes first
and the individual trace comes second.

Anthropic published a description of its multi-agent research system on 13 June 2025 setting out
an orchestrator-and-workers pattern, and stated the core difficulty plainly: agents make dynamic
decisions and are non-deterministic between runs even with identical prompts, which makes
debugging harder. It is worth noting what Anthropic's own agent experiments actually shipped as
visualisation. The Project Vend write-up of 27 June 2025 described a Claude instance running a real
vending business. Its only picture was a plain line chart of net value over time. The agent's
own note-taking, which was the thing actually driving its decisions, was never drawn at all.

The freshest piece of human-computer interaction research on exactly our question is AgentGUI,
submitted 28 July 2026, a locally hosted interface for watching and interrupting long-running
concurrent agent sessions, built around trajectory visualisations rather than span waterfalls.
Its user study reported that people identified the relevant part of a trace 38 per cent faster
than with a baseline viewer, and that steering an agent away from drift raised task completion
by 34 percentage points for small models. A view built around the path an agent took beats a
view built around its calls, and that result is measured rather than asserted.

Two shipped products show honest confidence without a fabricated percentage. Devin version 2.1,
released 15 May 2025 by Cognition, shows a green, yellow or red indicator for the agent's own
confidence that it can finish a task, before it starts, which is a continuous estimate collapsed
into three states a person reads instantly. The evaluation group Model Evaluation and Threat
Research published a task-length measurement on 19 March 2025 that plots the length of task a
model can finish at fifty per cent reliability. Its ninety-five per cent band is computed by
resampling across task families, tasks and attempts, so the band is derived rather than drawn
for decoration.

**The literature on sampled agreement, and where it cuts against us.** The self-consistency
method published by Wang and colleagues in 2022 samples the same question many times and takes
the majority answer, and the share of samples that agree is a usable confidence signal. Three
2026 papers sharpen that. A study of reranking models submitted 2 June 2026 found that sampled
self-consistency is competitive with the best available methods and well calibrated, while a
model's directly stated confidence is severely overconfident. A study submitted 19 March 2026
found that combining sampled agreement with stated confidence beats either alone by up to twelve
points on a standard measure of how well a confidence score separates right answers from wrong
ones. Against that, a paper submitted 11 August 2026 titled "When Self-Consistency Backfires"
found that on a hard science benchmark majority voting actually reduced accuracy for small
models, because a model can agree with itself confidently and be wrong. A related paper
submitted 18 March 2026 named the same trap from the training side, where optimising for
self-consistency collapses the variety of a model's outputs and reinforces its systematic
errors.

That last finding is the most important sentence in this section for our honesty rules.
Agreement across our eight tries measures how stable a method is. Whether the answer is right is
a separate question. Our design holds the correct pairing already, because the deterministic
checker is an independent judgement of correctness, so the two signals must always be drawn
together and never merged into one score.

**A second honesty guard, from a dated Anthropic result.** The paper "Reasoning models don't say
what they think", published 3 April 2025, tested whether a model mentions a hint it was actually
given. Claude 3.7 Sonnet mentioned it in its visible reasoning 25 per cent of the time, and
DeepSeek's reasoning model did so 39 per cent of the time. On prompts involving unauthorised
behaviour those rates fell to 41 per cent and 19 per cent. Unfaithful reasoning ran longer than
faithful reasoning, so the extra words were not compression. This bears directly on our trace
card. Step three of every trace quotes each desk's own written reason already, under a label
naming it as the desk's own words. That label must stay, because a written reason is evidence of
what a desk said and it is no proof of why the desk chose what it chose. The load-bearing
explanation on our screen is the recorded list of which reports the desk weighed and how,
together with the checker's findings, because those are recorded inputs and mechanical outputs
rather than a story a model told about itself.

**How this maps onto our surface.** Three things. First, a negative instruction: we should build
no span waterfall, no call tree and no token-cost panel anywhere in the presentation build,
because every hour spent on one is an hour not spent on the map. Our five-step trace card is the
better artefact already, because its steps are named after decisions rather than after calls,
and the two vendors redesigning their products in 2026 are moving toward the shape we have.
Second, we take the Uber reading order, so the decision rail leads with the outcome of each
moment and the trace overlay is the drill-down beneath it. Third, the agreement strip in the
XCOM section is our confidence display, and it is always drawn beside the checker verdict rather
than blended with it. One sentence in the help panel should say that the count comes from eight
separate recorded tries, and that agreement measures how stable a method is rather than whether
it was right. This serves story three, honest confidence at a glance.

**What it would take to build.** Small, and much of it is a decision to build nothing. The new
help-panel sentence and the pairing rule that keeps the strip beside the verdict are copy work
rather than engineering.

## Two fields outside games have already settled how to show uncertainty honestly

Weather forecasting and clinical decision support both had to solve our exact problem, and both
produced results dated inside the last two years.

The National Hurricane Center's cone of uncertainty is the most-seen uncertainty display in the
world. Its own explanation page, current for the 2026 season, states the rule that makes the
cone honest. The cone is drawn at the width where two-thirds of the agency's historical forecast
track errors, measured over the previous five years, fall inside it. The shape is a record of how
wrong this agency has been before, rather than a claim about this storm. That is the same kind
of claim our agreement strip makes, because eight recorded tries is a record of what happened
rather than a prediction. The cone's well-known reading failures could not be sourced to a fresh
critique in this session's research, so they are named here as a known risk rather than as a
cited finding.

The freshest source found in the whole research pass is a framework called ActionCue, submitted
17 August 2026, which binds specific uncertainty conditions to specific human responses and
demonstrates the idea across healthcare, credit assessment and disaster forecasting. Its
argument is that showing a number is not enough, and that the display must say what a person
should do when the number is low. A study submitted 1 February 2026 compared two-state and
continuous uncertainty displays for clinical predictions and produced design guidance for that
setting, and a study submitted 22 August 2024 tested which probabilistic chart shapes people
read correctly in time-series forecasts.

**How this maps onto our surface.** One change, and it is a copy change rather than an
engineering one. Where a moment's agreement count is low, or where the checker rejected most of
the eight tries, the row should say what that means for a person, in a sentence, rather than
leaving a reader to interpret a short strip. The sentence should say that the method gave
different answers at this moment, so a human coordinator should read the reports at this moment
themselves. That single sentence turns our confidence display into the thing ActionCue argues
for, and it is exactly the product argument Rescue World is making to Space Data.

**What it would take to build.** Small. It is one conditional sentence in the copy deck, chosen
by a threshold on the agreement count and the checker verdict, both of which are counted from
recorded data.

## The five patterns worth building before nine in the morning

Ranked by how much understanding each buys per hour of work.

1. **Give every row in the decision rail its outcome.** Each of the eleven moment rows carries
   the office that decided, the choice in plain words, the agreement strip out of eight, and the
   check verdict as a word, all visible without hovering. This is the direct answer to the process owner’s
   complaint that the decision-making is invisible, and every value is parsed already. Serves
   stories one and two. Effort: Small.
2. **Draw the agreement strip out of eight everywhere a choice appears.** Eight cells, filled
   for the tries that produced the shown choice, with a second colour for the tries that failed
   the check, under the sentence the copy deck writes already. The strip is always drawn beside
   the checker verdict and never merged with it, because agreement measures how stable a method
   is while the checker measures whether an answer was right. Where agreement is low, one extra
   sentence says what a person should do about it, which is to read that moment's reports
   themselves. This is our confidence display, and it stands in for the percentage we are
   forbidden to invent. Serves story three. Effort: Small.
3. **Open the reason breakdown from the verdict badge, in place.** Clicking any verdict shows
   the itemised list of what the check found, in the check's own words and in plain English,
   both computed already. This is the Crusader Kings 3 pattern, and it turns a grade into an
   explanation. Serves story one. Effort: Small.
4. **Telegraph each decision moment on the map before it resolves.** Ghost markers at the
   candidate sites, keyed by which desk chose them, with the team counts printed on them, fading
   when the dispatch resolves. This is the Into the Breach pattern, and it makes the map the
   place where deciding happens. Serves stories one and four. Effort: Medium.
5. **Close the run with a consequence ledger of all eleven moments.** Each row carries the
   choice, the agreement count, the verdict and the consequence sentence. The best moment and
   the worst moment are marked and named, and every row is clickable back into its trace. This
   is the Frostpunk ending, and it is what a judge remembers. Serves story two. Effort: Medium.

The Civilization VI timeline ribbon ranks sixth and should be built if the first five land
early, because it gives the run a spine a viewer can scrub and click.

The run launcher from story five ranks seventh for tomorrow, and it needs one paragraph of its
own, because The process owner asked for it by name. The full round trip to the graphics processors and back
is Large and will not land by nine. What can land is the Frostpunk 2 half of it, which is the
screen that prepares the run. It lists the method to vary, the seed count and the moment to
emphasise, with each option stating what it changes before it is committed. It ends in one
control that queues the run and one honest status line. Story five permits exactly this, allowing
a working prepare-and-queue
console with a real status display even where the completion shown is pre-recorded, provided
anything staged says so on screen. Build the preparation screen only after the first five
patterns are green, and label the queue state truthfully.

## What the presentation build should actually be

Build one continuous screen where the decision is always the subject. The decision rail on the
right stops being a list of moments and becomes a list of decisions with outcomes. For each of
the eleven moments a viewer reads who decided, what was chosen, how many of the eight tries
agreed, and whether it passed every prewritten check. All four are readable without hovering and
colour-keyed, so the good moments and the bad moments are distinguishable from across a room. As
the playhead approaches each deadline, the map telegraphs the moment the way Into the Breach
telegraphs an attack. The candidate sites light up at their real coordinates with the team
counts printed on them, keyed by which desk wanted them, and the camera arrives before the
deadline rather than after the dispatch. When the deadline passes, the chosen dispatch draws its
route, the rejected ghost fades, and the consequence caption prints the sentence that exists
already. Every verdict badge anywhere on the screen opens its own reason list in place, so any
grade is one click from the rules that produced it. The real recorded choice stays first and
equal at every moment, as card zero of every trace, and no bar ever ranks the agents against
the real responders. The run ends on a consequence ledger of all eleven moments, with the
exceptional moment and the bad moment named in plain sentences. It closes on the registered
result stated as the count it is, which is 0 of 40, 17 of 40 and 34 of 40 answers passing every
prewritten check, beside the standing sentence that this is a simulated what-if rather than
evidence about real rescues. No percentage is invented anywhere, because eight recorded tries
and a count of how many agreed is a stronger claim than a number nobody can check.

## What we should refuse to build

- Any invented percentage, including a confidence figure a model states about itself.
- A span waterfall, a call tree or a token-cost panel, because they show mechanism to an
  audience that needs a decision.
- Any bar, score or ranking that puts the agents above the real responders.
- Any number that exists only on hover, because a judge watching a demonstration never hovers.
- A model's output drawn in the same colour and weight as a counted fact. Where we ever draw one,
  follow the Riot Games rule and show it tied to the event that caused it, at a moment a person
  chose, rather than running it continuously.
- Any hidden number that drives something visible on screen. This is the Frostpunk lesson: when
  11 bit studios found a hidden fifty per cent death roll driving its simulation, it deleted the
  roll and replaced it with a visible choice carrying a stated cost.
- Any total, score or progress bar on the timeline ribbon. Ed Beach removed exactly that from the
  next Civilization because it made players chase the score instead of watching their own empire.

## Sources

These are the game sources, each fetched on 23 August 2026 and each carrying its own publication
date.

- Matthew Davis, "Into the Breach Design Postmortem", Game Developers Conference, March 2019.
  Slide deck at media.gdcvault.com; the recording at gdcvault.com/play/1025772 needs a login.
  Source of the three stated rules, the drawing vocabulary, the three-attack-type cap, the
  compass-direction restriction and the power-grid mistake.
- David Craddock, "Into the Breach preview", Shacknews, 20 February 2017. Source of the Justin Ma
  quotation and of the detail that the preview rule arrived through iteration.
  https://www.shacknews.com/article/99108/
- Joel Couture, "Road to the IGF: Subset Games' Into the Breach", Game Developer, 23 February
  2018. Source of "every death felt like your own fault".
  https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-
- Rock Paper Shotgun, "Into the Breach preview: tactics", 27 November 2017. Independent
  confirmation that the game carries no dice rolls.
- "Jake Solomon explains the careful use of randomness in XCOM 2", Game Developer, 1 March 2016.
  Source of every Solomon quotation about the displayed hit percentage.
  https://www.gamedeveloper.com/design/jake-solomon-explains-the-careful-use-of-randomness-in-i-xcom-2-i-
- Ana Kessler, 80.lv, 6 July 2022. Source of Solomon on his own frustration when replaying XCOM.
  https://80.lv/articles/firaxis-director-shared-that-he-was-frustrated-when-he-missed-shots-in-xcom
- Joe Weinhoffer, "From Soldiers to Superheroes: Designing Combat for Marvel's Midnight Suns",
  Game Developers Conference 2024. Source of the ninety-five per cent line in its description.
  https://www.gdcvault.com/play/1034622/
- PC Gamer, 11 March 2026, on the game Dispatch guaranteeing success above a displayed seventy-six
  per cent, framed by reference to XCOM.
- Richard Scott-Jones, PCGamesN, 31 March 2020, interviewing the Gears Tactics developers. Cited
  above only to record that they discussed pacing rather than hit chance.
- Anton Strenger interview, PCGamesN, 28 November 2017. Source of the count of historic moments
  and of the transparency claim. https://www.pcgamesn.com/civilization-vi/civ-6-rise-and-fall-anton-strenger-interview
- Civilopedia entry on Historic Moments, mirroring the game's own text. Source of the
  era-relative trigger rule and the first-in-the-world bonus.
  https://www.civilopedia.net/en-US/rise-and-fall/concepts/pride_moments_1
- Ed Beach interview, TheSixthAxis, 30 August 2024. Source of every Beach quotation about Era
  Score. https://www.thesixthaxis.com/2024/08/30/interview-ed-beach-on-civilization-vii-ages-diplomacy-security-blankets/
- Ed Beach interview, CGMagazine, 5 September 2024, on the advisor system as a per-domain
  recommendation engine. https://cgmagonline.com/interviews/civilization-viis-ed-beach/
- Hentzau, "Thoughts: Civilization VI", Scientific Gamer, 24 October 2016. Source of the tooltip
  criticism and its four named cases. https://scientificgamer.com/thoughts-civilization-vi/
- Massachusetts Institute of Technology Game Lab, "Overseer Observer Mod for StarCraft 2", 21
  October 2013. Source of the panel inventory and the clustering rationale.
  https://cms.mit.edu/home/mit-overseer-observer-mod-starcraft-2/
- Cameron Carr, "StarCraft 2 Viewer Guide", Esports Vikings, 9 November 2019. Source of the
  production tab, the worker supply read and the colour coding of minerals and gas.
  https://www.esportsvikings.com/starcraft2/guides/sc2-viewer-guide
- "World Championship Series Observer Interface 3.0 hotkeys", community reference document. Source
  of the observer craft rules, including panning rather than clicking the minimap.
- John Pham, "Dev Diary: Win Probability Powered by Amazon Web Services", Riot Games, 9 October
  2023. Source of the graph's construction and of the editorial rule that it appears after key
  plays rather than continuously. https://lolesports.com/news/dev-diary-win-probability
- "AI Is Rewriting the Esports Broadcast Booth", GameIndustry.com, 22 June 2026. Source for the
  spread of win probability across titles through 2026.
- Albert van der Meer, "Frostpunk: an analysis of emotional narrative engagement", Game Developer,
  21 May 2018. Source of the Book of Laws mechanics and of the criticism about distance.
  https://www.gamedeveloper.com/design/frostpunk-an-analysis-of-emotional-narrative-engagement
- Jakub Stokalski, "Human values in game design", Game Developer, 13 December 2018. Source of the
  value-conflict framing and of the loop that fires after the session ends.
  https://www.gamedeveloper.com/design/human-values-in-game-design---an-approach-for-designing-emergent-storytelling
- Bryant Francis reporting Marta Fijak, Game Developer, 20 July 2021. Source of the hidden
  fifty per cent roll and its replacement by a visible law.
  https://www.gamedeveloper.com/design/systems-in-games-like-i-frostpunk-i-can-express-personal-ideas-even-unintentionally
- Bryant Francis interviewing Jakub Stokalski, Game Developer, 20 September 2024. Source of the
  Zeitgeist system, the live vote tally and repealable laws.
- Danielle Rose, "Frostpunk 2 factions and council", PCGamesN, updated 18 September 2024. Source
  of the hundred votes, the fifty-one majority, negotiation, pressure and broken promises.
  https://www.pcgamesn.com/frostpunk-2/council
- Miguel Lopez-Bachiller and James Kwan, "Predicting Combat Outcomes in Total War", Artificial
  Intelligence and Games Conference 2025, recording published 22 April 2026.
- Player reports on the Total War prediction bar, from Steam and Reddit discussions. Community
  reports, not developer statements, and cited as such above.
- Rowan Kaiser, "The Surprising Design of Crusader Kings II", Game Developer, 6 January 2013.
  Source of every Henrik Fåhraeus quotation.
  https://www.gamedeveloper.com/design/the-surprising-design-of-i-crusader-kings-ii-i-
- Crusader Kings 3 opinion reference, ck3.paradoxwikis.com/Opinion, mirroring the game's own data.
  Source of the named opinion categories.
- Paradox developer diary 104, on the intelligence behind acceptance decisions, around 25 August
  2022. Only its summary could be read this session; the forum text was unreachable.


The sources below were fetched on 23 August 2026 and each carries its own publication date.

- Anthropic, "How we built our multi-agent research system", published 13 June 2025.
  https://www.anthropic.com/engineering/multi-agent-research-system
- Anthropic, "Reasoning models don't say what they think", published 3 April 2025. This is the
  source of the chain-of-thought faithfulness rates quoted above.
  https://www.anthropic.com/research/reasoning-models-dont-say-think
- Anthropic, "Project Vend", published 27 June 2025.
  https://www.anthropic.com/research/project-vend-1
- Hamel Husain, "Evals FAQ", published 28 May 2025 and updated 18 July 2026.
  https://hamel.dev/blog/posts/evals-faq/
- Arize, "How Uber evaluates AI agents at production scale", published August 2026.
  https://arize.com/blog/how-uber-evaluates-ai-agents-at-production-scale/
- Arize blog, entry of 11 August 2026 announcing support for the OpenTelemetry naming
  conventions for generative artificial intelligence. https://arize.com/blog/
- LangSmith trace documentation, current at fetch.
  https://docs.langchain.com/langsmith/view-traces
- Langfuse tracing documentation, current at fetch. https://langfuse.com/docs/tracing
- Braintrust blog, posts dated between 3 June 2025 and 26 June 2026.
  https://www.braintrust.dev/blog
- Weights and Biases Weave product page, current at fetch. https://wandb.ai/site/weave/
- Cognition, Devin version 2.1 release notes, 15 May 2025, describing the green, yellow and red
  confidence indicator. https://cognition.com/blog
- Model Evaluation and Threat Research, "Measuring AI ability to complete long tasks", published
  19 March 2025. https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/
- National Hurricane Center, "About the cone of uncertainty", page current for the 2026 season
  with 2021 to 2025 error data. https://www.nhc.noaa.gov/aboutcone.shtml
- Wang and colleagues, "Self-Consistency Improves Chain of Thought Reasoning in Language
  Models", first published 2022.
- "AgentGUI: An Interface for Observing and Steering Long-Running AI Agents", submitted 28 July
  2026.
- "Visualizing Uncertainty-to-Action Composition for Human Oversight", the ActionCue framework,
  submitted 17 August 2026.
- "Can LLM Rerankers Predict Their Own Ranking Performance?", submitted 2 June 2026.
- "How Uncertainty Estimation Scales with Sampling in Reasoning Models", submitted 19 March 2026.
- "When Self-Consistency Backfires: Majority Vote Hurts the Majority of Hard Science Problems for
  Small LLMs", submitted 11 August 2026.
- "Breaking the Consensus Trap", submitted 18 March 2026.
- "Shades of Uncertainty: How AI Uncertainty Visualizations Affect Trust in Alzheimer's
  Predictions", submitted 1 February 2026.
- "Enhancing Uncertainty Communication in Time Series Predictions", submitted 22 August 2024.

Two things this research pass could not verify, named here so nobody repeats the attempt
blindly. Press coverage of how the public misreads the hurricane cone and the New York Times
election forecast needle could not be reached this session. The specific 2025 and 2026 feature
set of LangGraph Studio could not be reached either, so no claim about it appears above.
