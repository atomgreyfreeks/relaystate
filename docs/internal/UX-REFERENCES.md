# Rescue World — interface references from the field

Written 2026-08-22 by claude. Every link in this document was requested on 2026-08-22 and
its response recorded; where a page's own content carries a date, that date is stated too.

## Why this document exists

Rescue World is a 3D disaster-operations world built over real Kumamoto terrain. A person
flies a free camera over the damaged ground, clicks a rescue unit or a village or a road
closure, and watches a recorded operation play out. Three things run together on screen and
each must stay visible. The first is the disaster simulation: the place, the people, the
landslides and the blocked roads. The second is the AI agent fleet: the readers that ingest
incoming reports, the desk that decides which reports to trust, and the dispatcher that
sends scarce rescue units. The third is the growth intelligence: the evidence table, grown
the way a lichen grows, as two partners that stay separate — claims on one side, sources on
the other — so that neither can quietly corrupt the other.

Before inventing interface patterns for that, we surveyed what already works. The
orchestration display — how the agent fleet and the evidence table appear on screen — stays
original, because nothing in the field does that. The base conventions of a 3D map
operations console are a solved problem, and this document records who solved them.

Every reference below gives five things: what it is in one sentence, a link whose page
actually shows the interface, the specific pattern it proves, why that pattern works, and
what Rescue World takes or refuses from it.

Stage numbers throughout refer to the build order in `SPEC.md`, the Rescue World build
specification that sits beside this file.

## How these sources were checked

This session's web-search budget was already spent, so nothing here comes from a search
result summary. Every page was fetched directly or loaded in a real browser and looked at.
Licences were read from the licence files themselves or from the GitHub licence endpoint,
not from a project's marketing copy. Where I could not see a page — two sites answered an
automated request with a bot check — that is stated in the entry rather than papered over.

Three images were downloaded and examined pixel by pixel rather than described from memory:
the SpaceData product-overview sheet, the RoboCup Rescue viewer capture, and a DEFCON
screenshot. Three sites were loaded live in a browser and screenshotted: PLATEAU VIEW 5.0,
the bosaiXview map of the 2026 Kumamoto earthquake, and the Ushahidi demo deployment.

---

# 1. Professional disaster-operations software

## 1.1 SpaceData — Disaster Information Map

**What it is.** A Japanese company's web service that stacks seven kinds of disaster
information onto a single 3D map of a real damaged area, prototyped on the same July 2026
Kumamoto earthquake that Rescue World replays.

**See it.**
<https://spacedata.jp/news/202608_disaster-information-map> — the announcement page carries
two full-width images. The second is a labelled product-overview sheet that shows the actual
web screen and the actual mobile screen side by side.

**Freshness.** Published 2026-08-12 by SpaceData. Page loaded and both images downloaded and
examined 2026-08-22.

**What the interface actually shows.** The web screen is three columns on near-black chrome.
The left column is the incident header with the incident named in Japanese, a count of
sources, two class toggles, a pair of feed tabs (posts from the social network X, and news
reports), and then a scrolling column of individual source cards with their images. The
centre column is a large oblique 3D map on satellite imagery — tilted, never top-down —
carrying coloured teardrop pins, one translucent red polygon for the satellite-estimated
building-collapse area, a second tan polygon for another estimate class, and thin red lines
for road restrictions. The Cesium ion attribution mark sits at the map's bottom-left corner.
The right column is a stack of six layer rows. Each row carries a coloured icon, the layer's
name, a live count of how many items that layer currently holds, a small status chip, and an
on and off switch. Below the switches sit an explanatory paragraph, a colour legend for the
confidence classes, a row of category filter tabs with counts, and a detail section listing
individual reports as tag chips plus a headline plus a timestamp plus a jump control.

**The pattern it proves.** Confidence classes are never mixed. SpaceData's own copy states
the rule plainly: preliminary and unconfirmed information, confirmed information, official
announcements, and satellite-derived estimates are displayed as four distinguished classes
and are deliberately not blended together, so a user can judge on the basis of how sure each
item is. Alongside that, every layer row carries a live count of its own contents.

**Why it works.** An operator's first question about any item on a disaster map is "how sure
is this?" A display that answers that question before the operator reads the item removes a
step from every decision. The live counts do the same job for volume: you learn where the
information is piling up without reading a chart.

**Rescue World adopts** the three-column shape (source feed left, world centre, layer and
detail rail right), the per-layer live counts, and above all the never-mix-confidence-classes
rule. That rule is the same discipline as our claims-versus-sources separation, and finding
it independently in a shipping commercial product is the strongest external validation in
this document.

**Rescue World rejects** the satellite-photograph basemap and the multi-hue pin palette. Our
locked register is black ground, white type, one holographic cyan, one burn orange, and
nothing else.

## 1.2 bosaiXview — the live official map of the 2026 Kumamoto earthquake

**What it is.** Japan's National Research Institute for Earth Science and Disaster Resilience
publishes an official live map of the exact earthquake Rescue World replays, with one named
section per kind of damage information.

**See it.**
Index of every product with its date: <https://www.bosai.go.jp/info/saigai/2026/20260729.html>
The live map itself:
<https://bosai.maps.arcgis.com/apps/instant/portfolio/index.html?appid=49fe2d60166748bfbaa0bc2f4188098a>

**Freshness.** The listed products carry dates from 2026-07-29 through 2026-08-07. The map
was loaded in a browser and screenshotted 2026-08-22, and it is live.

**What the interface actually shows.** A dark left rail holds about sixteen named sections:
typhoon track with estimated seismic intensity, living-support status, heat information,
disaster volunteer centre openings, road conditions, application of disaster-related laws,
residential damage, water supply, aerial photography, satellite imagery, estimated seismic
intensity distribution, liquefaction probability, slope-failure probability, building damage
estimate, disaster debris estimate, and slope failure and sediment distribution. Exactly one
section is open at a time, and the open one is marked with a lighter background and a
coloured left edge. The title bar names the incident. A legend panel floats over the map, and
every legend entry names both the issuing authority — the Geospatial Information Authority of
Japan — and the acquisition date of the photography that entry was interpreted from. Map
controls are a vertical stack in the map's top-left corner: camera home, zoom in, zoom out,
print, and a north-up compass. A section pager sits at the top right.

**The pattern it proves.** Provenance on every entry, and one section open at a time.

**Why it works.** A map used for a decision that will be audited afterwards must say where
each layer came from and when it was captured, at the point of reading, not in a footnote.
And opening one section at a time keeps the map to one readable story rather than a
sixteen-layer pileup.

**Rescue World adopts** the source-and-capture-date line on every layer and every evidence
entry, the incident named permanently in the masthead, and the camera home control stacked
with zoom in a fixed screen corner.

**Rescue World rejects** the light topographic basemap and the sixteen-deep layer rail. Our
register is black ground, and our covenant says one knob.

## 1.3 Esri ArcGIS Dashboards and the Emergency Management Operations solution

**What it is.** The commercial default for emergency-management displays: a grid of counters,
gauges, lists and a map that all filter one another.

**See it.**
<https://www.esri.com/en-us/arcgis/products/arcgis-dashboards/overview> — this page carries
images of four dashboard categories and links four live example dashboards you can open and
click.
Solution reference: <https://doc.arcgis.com/en/arcgis-solutions/latest/reference/introduction-to-emergency-management-operations.htm>

**Freshness.** Product page current, checked 2026-08-22. The Emergency Management Operations
solution's documented version is 2.3, dated March 2025. It packages a Community Lifelines
Editor, an Emergency Information Manager, an Incident Status Dashboard, a Public Message
Editor and a public hub site.

**The pattern it proves.** Cross-filtering. Clicking any element — a map feature, a list row,
a category bar — re-scopes every other element on the screen at once.

**Why it works.** One click restates the operator's question everywhere, so nobody has to
type the same filter into five panels.

**Rescue World adopts** the cross-filter behaviour and nothing else. Selecting a unit, a
village or a road closure must re-scope the evidence panel, the alert feed and the site
instruments together, in one action.

**This reference conflicts with our register and the register wins.** The dashboard form
itself — charts, gauges, counters and legends as the primary image — is exactly what our
covenant forbids. Telemetry in Rescue World is chrome at the frame edge and never the
subject. We take the interaction and refuse the form.

## 1.4 SIP4D — Japan's disaster-information sharing backbone

**What it is.** The national plumbing that moves disaster information between response
organizations so they share one situational picture. The Cabinet Office's comprehensive
disaster information system launched in 2024 and now carries the operational core, built on
technology developed through SIP4D.

**See it.** <https://www.sip4d.jp/> — the page carries system diagrams and one example map of
evacuation-centre information integrated across several prefectures. Its most recent notice
is dated 2026-07-14; checked 2026-08-22.

**Honest limitation.** This is thin as a visual reference. SIP4D is infrastructure, and its
public pages show architecture diagrams rather than an operator's screen. The live operator
surface for the 2026 Kumamoto event is the bosaiXview map in section 1.2, which is where to
look instead.

**The pattern it proves.** Not an interface pattern but a naming one: every shared product
carries the name of the organization that produced it, all the way through.

**Rescue World adopts** organization-level attribution on every layer, matching the
source-and-date rule taken from bosaiXview.

---

# 2. Open-source disaster and crisis platforms

## 2.1 Project PLATEAU VIEW 5.0

**What it is.** Japan's national open 3D city model, with its own open-source browser viewer
for flying over the model and layering data onto it.

**See it.**
Live viewer, no account needed: <https://plateauview.mlit.go.jp/>
Source: <https://github.com/Project-PLATEAU/PLATEAU-VIEW-5.0>
Project and use-case gallery: <https://www.mlit.go.jp/plateau/> and <https://www.mlit.go.jp/plateau/use-case/>

**Freshness.** The viewer was loaded in a browser and screenshotted 2026-08-22 and it works.
The version 5.0 repository was last pushed 2026-03-24. The use-case gallery carries several
disaster-prevention entries.

**What the interface actually shows.** The 3D city fills the whole window: white and grey
untextured buildings on a light basemap, seen obliquely. A single thin row of icon tools runs
across the top for pan, select, pedestrian view, place object, inspect by identifier, style,
filter sliders, sun and shadow, story, sketch and measure, and fly-to. Exactly one tool is
highlighted at a time, and the highlight colour is cyan. The top right holds locate, share,
reset, zoom out, zoom in and settings. A search field on the left prints its own keyboard
shortcut inside it, reading "Ctrl + K", and beneath it the layer list is collapsed to a
single row showing only a count of items. Attribution sits at the bottom left.

**The patterns it proves.** A world that occupies the entire window with controls reduced to
one thin row of small marks. Exactly one active tool, marked in a single accent colour.
Keyboard shortcuts printed inside the control they operate. A layer list collapsed by default
to a count.

**Why it works.** The world is the subject and the controls know it. Printing the shortcut
inside the control teaches the keyboard without a help screen and without a tutorial anyone
has to sit through.

**Rescue World adopts** all four: full-bleed world, one thin tool row, exactly one active
tool carrying the signal colour, and printed keyboard shortcuts. The single-active-tool
convention happens to match our signal law exactly — one operative thing per frame.

**Rescue World rejects** the light basemap. Register wins.

**Licence.** Apache License 2.0, stated in the repository's own README file and confirmed at
the GitHub licence endpoint. The earlier PLATEAU VIEW 1.1, a Terria Map package, is also
Apache License 2.0. Both are permissive and compatible with the MIT proposal in section 8 of
`SPEC.md`. Reading, adapting and shipping with attribution is allowed.

## 2.2 RoboCup Rescue Simulation

**What it is.** The long-running open competition in which teams write ambulance, fire brigade
and police agents that rescue civilians in an earthquake-damaged city, and a separate viewer
replays the recorded run. This is the closest existing thing to AI agents running a disaster
response on a map, which is exactly why its display faults are the ones worth designing
against.

**See it.**
The viewer, captured mid-run: <https://rescuesim.robocup.org/wp-content/uploads/2017/12/rsrss.jpg>
The competition page that image sits on: <https://rescuesim.robocup.org/competitions/agent-simulation-competition/>
Server source: <https://github.com/roborescue/rcrs-server>
Manual, including the log-viewer section: <https://roborescue.github.io/rcrs-server/rcrs-server/index.html>

**Freshness.** The platform is alive: the server repository was last pushed 2026-07-26, and
the league's most recent call for participation is the 2025 competition. The manual is
version 1.6, dated 6 February 2023. The viewer imagery published on the league site dates to
2017, and the web viewer repository has not been pushed since 2022. Checked 2026-08-22.

**What the display does well.** The world is the display. Extruded city blocks stand on a dark
ground, fires burn with visible smoke plumes, and agents are coloured dots moving over the
terrain. Telemetry sits in the four corners of the frame and never in the middle: team name
top-left, simulation time and speed-up factor bottom-left, score bottom-right. A single score
stays on screen at all times. And architecturally, the simulator is separate from a log
viewer that replays a recorded log file after the fact. The manual documents a `logViewer`
task as a distinct tool run against `rescue.log`. That is precisely the separation our
covenant demands, and it is useful to be able to say the field already works this way.

**What the display does badly, and this is the more valuable half.** The score reads
`Score: 96.385290` — a raw floating-point number with no unit, no stated direction, and no
statement of what it counts, so a stranger watching learns nothing from it. There is no
legend, so the green, red and blue dots are unreadable without the rulebook. Nothing is
clickable, so a viewer can never ask an agent why it went where it went. There is no scrub,
no camera bookmark, no camera reset, and the window is small and fixed.

**Rescue World adopts** the log-viewer separation, which is already our first non-negotiable
and now has field precedent, and corner telemetry.

**Rescue World rejects** the raw float score outright. Our register says the outcome is stated
first, in words a stranger reads once. The Rescue World banner says what happened and to whom,
in a sentence, and only then gives the number.

**Licence.** The Berkeley Software Distribution 3-Clause licence covers the server, the agent
development framework and the sample agent repositories, confirmed at the GitHub licence
endpoint. It is permissive and compatible with the MIT proposal.

## 2.3 Sahana Eden

**What it is.** A humanitarian and emergency-management web application kit, first deployed
for public use after the 2010 Haiti earthquake and used in the 2011 Japan earthquake and
tsunami among others.

**See it.** <https://sahanafoundation.org/products/eden/> — the Sahana Software Foundation's
own page, with a linked brochure.

**Freshness, stated plainly.** The repository still receives commits, the most recent push
being 2026-08-20, but the Foundation files Eden under "Legacy" in its own site navigation.
Its current products are a multi-hazard early warning tool, an incident management tool, a
relief and rehabilitation tool, and a tool that publishes standard alerting messages onto a
map. Checked 2026-08-22.

**Honest limitation.** I did not find a current image-bearing screenshot gallery for the Eden
interface, which is itself a signal about the project's state.

**The pattern it proves.** Not a visual pattern but a vocabulary. The Eden domain model — the
organization, the facility, the shelter with a capacity, the request and its fulfilment, and
the person — is the settled naming of this field, and worth reading before we finalise our own
entity names in `scenario.json`.

**Rescue World adopts** vocabulary only. Its screens are 2010-era forms and tables and there
is nothing visual to take.

**Licence.** MIT. I read the LICENSE file directly, and its first line reads "This software is
distributed under the MIT License", copyright 2009 to 2025, Sahana Software Foundation.
GitHub's own classifier reports "Other" for this repository, so anyone checking the badge
alone would get the wrong answer. It is permissive and compatible with the MIT proposal.

## 2.4 Ushahidi

**What it is.** The crowdsourced crisis-reporting platform born from Kenya's 2008
post-election violence, still the reference for turning public reports into a map.

**See it.** <https://demo.ushahidi.io/> — a live demo deployment. Loaded in a browser and
screenshotted 2026-08-22.

**Freshness.** The platform repository was last pushed 2026-08-10.

**What the interface actually shows.** A left navigation rail lists named views: Map view,
Data view, Activity, Collections. A top bar holds a keyword search, a Filters control and a
Share control, and stays put across every view. The map surface fills the rest.

**The pattern it proves.** One body of reports, several interchangeable named views, and one
persistent filter and search that survives moving between them.

**Why it works.** An operator moves between the question "where" and the question "what"
constantly, and losing the filter on every switch is the fastest way to make a tool
unusable.

**Rescue World adopts** the principle that the current selection and filter survive a view
change. Switching from the world to the evidence table must not clear what is selected.

**Rescue World rejects** the code, for a legal reason stated below, and the 2D form-first
look.

**Licence, and this one matters.** The GNU Affero General Public License, version 3 or later.
I read the licence file text directly, and GitHub's classifier again reports only "Other".
The Affero licence is copyleft with a network clause: running a modified version as a public
web service obliges you to publish your source. Do not import Ushahidi code into Rescue World.
Reading it for ideas is fine and carries no obligation.

## 2.5 CesiumJS, and what it tells us about the incumbent look

**What it is.** The open-source 3D globe library that the SpaceData Disaster Information Map
is built on. The Cesium ion attribution mark is visible in the bottom-left corner of their
product screenshot, and PLATEAU VIEW carries the same mark.

**See it.** <https://cesium.com/platform/cesiumjs/> and the runnable examples at
<https://sandcastle.cesium.com/>

**Freshness.** The CesiumJS repository was last pushed 2026-08-21. Checked 2026-08-22.

**Why it belongs here.** Two of the three most relevant professional references in this
document are the same engine underneath. That tells us what the incumbent look of a 3D
disaster map is — a textured globe with photographic imagery, pins, and translucent polygons
— and lets Rescue World differ from it on purpose rather than by accident.

**Rescue World adopts** nothing. Our instrument is vanilla three.js reading a baked local
event log with no remote fetch at runtime, and the Cesium globe assumes streamed tiles.

**Licence.** Apache License 2.0 and free for commercial use. Note the separation the Cesium
site itself draws: CesiumJS the library is free and open, while Cesium ion is a separate paid
hosted service for streaming tiles, and the attribution mark in those screenshots belongs to
ion rather than to the library. TerriaJS, the framework behind PLATEAU VIEW 1.1, is also
Apache License 2.0 and was last pushed 2026-08-21.

---

# 3. Incident-command training simulators

## 3.1 XVR On Scene

**What it is.** A virtual-reality incident-training platform used by fire and rescue, police,
ambulance and transport services, in which an instructor drives an evolving incident while
trainees make decisions inside it. The vendor is XVR (a brand name; the three letters do not
stand for anything), a company now in its twenty-fifth year.

**See it.** <https://www.xvrsim.com/en/solutions/xvr-on-scene/> — loaded in a browser
2026-08-22. The site carries 72 images and its front page states it is celebrating 25 years.

**The pattern it proves.** The exercise-controller station: a second surface from which one
person escalates, de-escalates or redirects the scenario in real time, while the trainee sees
only the world. The product's own copy describes this as dynamic scenario progression with the
instructor in full control before, during and after the exercise.

**Why it works.** It separates the person inhabiting the world from the person shaping the
run, so the world itself never has to stop and explain what is happening or why.

**Rescue World adopts** the two-surface split. The viewer inhabits the world, the transport
bar shapes the run, and they are visually distinct and never interleaved.

**Rescue World rejects, and this is the important refusal.** The instructor here can change
history mid-exercise. Rescue World's cannot. Underneath everything, the world is a
deterministic replay of a recorded timeline, and the person gets freedom of viewpoint and
freedom of interrogation, never freedom of history. We also reject the photoreal fidelity
strategy: our register is a holographic line drawing on black, and photorealism is not a goal
we are trying and failing to reach.

## 3.2 The Advanced Disaster Management Simulator, from Environmental Tectonics Corporation

**What it is.** An incident-command trainer in which an incident commander explores a scene
while a separate exercise-control operator executes the events.

**See it.** <http://www.etcsimulation.com/> — the site's own caption on its mission image
reads "Incident Commander exploring the scene with Exercise Control executing the commands".
Checked 2026-08-22. Note that <https://www.trainingfordisastermanagement.com/> now redirects
here.

**Honest limitation.** The public site carries only a handful of embedded images and no
screenshot gallery, so this is a weak visual source. It is included because it independently
confirms the same commander-plus-controller division of labour that section 3.1 proves, from
a different vendor with a different lineage.

## 3.3 Emergency Call — The Firefighting Simulation 3, and Emergency 20

**What it is.** The current consumer dispatch simulators, in which the player takes emergency
calls and assigns units on a map under time pressure.

**See it.**
<https://store.steampowered.com/app/3447070/> — released 5 August 2026, 11 screenshots on the
store page.
<https://store.steampowered.com/app/735280/> — Emergency 20, released 31 October 2017, with 10
screenshots; the classic of the long-running German series.
Both checked through the Steam store interface on 2026-08-22.

**The pattern it proves.** The dispatcher's two-panel shape: the incident on one side, the
roster of available units with each unit's current status on the other, and the map between
them.

**Rescue World adopts** a unit roster whose entries state status in words — idle, en route,
on scene — rather than by colour alone. Our register only has one signal colour to spend, so
status has to be carried by language.

---

# 4. Games with proven command-console interface language

## 4.1 DEFCON

**What it is.** DEFCON (a 2006 strategy game about nuclear war) puts its entire interface into
a single glowing vector world map on near-black ground.

**See it.**
<https://www.introversion.co.uk/defcon/> — the developer's own page, five screenshots.
<https://store.steampowered.com/app/1520/DEFCON/> — seven screenshots.
Released 29 September 2006. One screenshot was downloaded and examined 2026-08-22.

**What the screenshot actually shows.** Near-black ground. Coastlines drawn as thin luminous
strokes. Missile trajectories as long thin arcs in two colours. Detonations as blown-out white
bloom. Radiation glyphs marking strike sites. And the part that matters: the event text is
written on the map, at the place it happened, in small type, reading "launch detected" and
"san francisco hit, 1.8m dead". There is no side panel in the frame at all.

**The pattern it proves.** In-world event labels. The alert is not in a feed at the edge; it
is at the coordinate.

**Why it works.** The eye never leaves the world, and the label and the thing it describes
cannot drift out of sync, because they are the same object.

**Rescue World adopts** in-world event labels for dispatches and outcomes, pinned to the
event's coordinate, set in our label voice of uppercase tracked type at nine or ten pixels.
It also adopts bloom on impact, for which the Halo Forge post-processing chain is already the
mechanism, and the habit of naming the human cost next to the place rather than in a tally
somewhere else.

**Rescue World rejects** the overlap behaviour. In the screenshot examined, several labels
collide into an unreadable stack when events fire close together. Rescue World needs a
declutter rule: at most one in-world label per site, the older one fades, and the alert feed
at the frame edge holds the overflow.

**Register conflict.** The ground here is deep blue and the arcs run red and green. Ours is
black, white, one cyan and one burn. Register wins.

## 4.2 Frostpunk and Frostpunk 2

**What it is.** A city-survival game in which a settlement freezes and every choice costs
somebody something specific.

**See it.**
<https://interfaceingame.com/games/frostpunk/> — a catalogued gallery of individual Frostpunk
interface screenshots, each on its own page.
<https://store.steampowered.com/app/323190/> — 16 screenshots, released 24 April 2018.
<https://store.steampowered.com/app/1601580/> — Frostpunk 2, 24 screenshots, released 20
September 2024.
Checked 2026-08-22.

**The pattern it proves.** Scarcity stated as a countdown to a named consequence, not as a
bar. The game tells you how many hours of coal remain and what stops when they run out.

**Why it works.** A bar at thirty percent means nothing to a person who has not learned the
scale. "Four hours of coal, then the generator stops" means something on first reading.

**Rescue World adopts** this for its scarce-resource decision, which is the centre of the
demonstration slice. Every scarce quantity is stated as a time to a consequence, in words, at
the frame edge.

**Rescue World rejects** the warm orange-on-blue palette and the heavy ornamental frames. Our
burn colour is earned only by a process that irreversibly consumes something it cannot
recover, and our frame is a hairline.

## 4.3 911 Operator and 112 Operator

**What it is.** Dispatch games in which calls arrive faster than units come free and the
player chooses who waits.

**See it.**
<https://interfaceingame.com/games/911-operator/> — catalogued gallery. Individual screens
worth opening are <https://interfaceingame.com/screenshots/911-operator-new-incident/>,
<https://interfaceingame.com/screenshots/911-operator-units/> and
<https://interfaceingame.com/screenshots/911-operator-situation-report/>.
<https://store.steampowered.com/app/503560/> — 15 screenshots, released 24 February 2017.
<https://store.steampowered.com/app/793460/> — 112 Operator, 9 screenshots, released 23 April
2020.
Checked 2026-08-22.

**The pattern it proves.** The incident card. A new incident opens a small card that states,
in this order: what happened, where it happened, who is nearest and free, and what can be
sent. Then it waits for the decision.

**Why it works.** It is the decision, laid out as the decision, at the moment of the decision,
with nothing else competing for the eye.

**Rescue World adopts** this card shape for dispatch events, with one addition that is ours
rather than borrowed: our card also carries the evidence line that authorized the dispatch,
because our claim is about evidence discipline rather than about speed.

**Rescue World rejects** the constant unread-count badges and the colour-coded urgency dots.
Two signal subjects in one frame is a bug you can see without reading anything.

## 4.4 Cities: Skylines — Natural Disasters

**What it is.** An expansion that drops earthquakes, tsunamis and meteors on a city the player
built, with warning systems, evacuation and a visible aftermath.

**See it.**
<https://store.steampowered.com/app/515191/> — 10 screenshots, released 29 November 2016.
<https://interfaceingame.com/games/cities-skylines/> — catalogued interface gallery for the
base game.
Checked 2026-08-22.

**The pattern it proves.** The warning phase and the aftermath overlay as a matched pair.
Before impact there is a named warning with a countdown and an evacuation control. After
impact there is a damage overlay that can be switched on over the same ground.

**Why it works.** The same ground seen before and after is the clearest possible proof that
something happened, and it needs no explanation.

**Rescue World adopts** the before-and-after pair. A person should be able to hold one moment
and see the same ground at two times, which our residue rule already requires: two frames of
the same run must be distinguishable by residue alone with the bodies masked out.

**Rescue World rejects** its information overlays, which are heat maps running across many
hues. Ours is one five-stop ramp from black through shadow and mid to cyan and white.

## 4.5 The standard real-time-strategy conventions, named precisely

These are the largest single block of "do not reinvent" in this document. They were settled by
thirty years of players acting under time pressure, and every one of them removes a step
between wanting to look at something and looking at it.

**See them.** StarCraft II is the reference implementation:
<https://interfaceingame.com/games/starcraft-ii/> — a catalogued gallery. The screens named
"fight", "army", "unit" and "construction" show the complete heads-up display. The same
conventions in other shapes appear at
<https://interfaceingame.com/games/company-of-heroes-2/> and
<https://interfaceingame.com/games/anno-1800/>. All checked 2026-08-22.

A second catalogue, <https://www.gameuidatabase.com/>, is the field's other standard reference
and is worth a person's time. Stated honestly: it answered my automated request with a bot
check, so I could not verify its current contents myself, though a person's browser loads it
normally.

The seven conventions, each named exactly:

1. **The mini-map in a fixed screen corner.** Always the same corner, showing the whole world
   at once, with the camera's current view drawn on it as a rectangle. Clicking anywhere on it
   moves the camera there.
2. **Click-select and drag-select.** Clicking one thing selects that thing. Dragging a
   rectangle selects everything inside it. Double-clicking selects every unit of that kind
   currently on screen.
3. **The unit information panel that answers the selection.** It occupies the same place
   always, it is empty when nothing is selected, and it fills the moment something is. The eye
   learns one location for the answer and stops searching.
4. **The alert ticker at the frame edge with click-to-jump.** Entries are clickable and move
   the camera to the event. Each entry stays readable for a fixed interval and then leaves on
   its own.
5. **Game-speed controls with an explicit pause that does not hide the world.** Pause and
   plan: the person can look, click and read while the run is not advancing.
6. **Camera bookmarks on the number keys.** Control plus a number saves the current camera to
   that number, the number alone returns to it, and pressing the number twice returns and
   centres.
7. **Edge scroll.** Pushing the pointer to the window edge pans the camera in that direction,
   at a rate that eases in rather than starting at full speed.

**Rescue World adopts all seven**, unchanged in behaviour and restyled to our register.

**Rescue World rejects** the command card, meaning the grid of ability buttons that issues
orders to the selected unit. The Rescue World person does not command anything; the AI agents
do. Our panel answers questions and does not take orders. Adding a command card would break
the whole premise of the piece.

---

# 5. Digital-twin disaster demonstrations

## 5.1 Earth-2

**What it is.** Earth-2 is the weather and climate simulation platform from NVIDIA (a company
that makes graphics processors), with a rendering layer built on its Omniverse and OpenUSD
technology.

**See it, in motion.**
"Earth-2 Goes Down to Street Level" — <https://www.youtube.com/watch?v=ALigJ5xguMw>
"Interactive Visualization of High-Resolution, Global-Scale Climate Data in the Cloud" —
<https://www.youtube.com/watch?v=8cQoYcbUG_M>
Platform page: <https://www.nvidia.com/en-us/high-performance-computing/earth-2/>

**Freshness.** The platform page carries a 2026 copyright and references a developer
conference held in Washington, D.C. in 2025. All three video identifiers were resolved and
confirmed live 2026-08-22.

**What makes this family read as credible.** The camera moves continuously from planet scale
to street scale without a cut, and the data keeps resolving as it descends. Continuity of
scale is the credibility signal: it demonstrates that the same model is being read at every
zoom level, rather than that three separate renders were stitched together.

**What makes this family read as hollow.** A static beauty render with a fake heads-up display
drawn on top of it. No interaction. Numbers on screen that do not change when the view
changes. Any of those three, and an engineer stops believing within seconds.

**Rescue World adopts** one uninterrupted camera move from the whole terrain down to a single
rescue unit, with the same data resolving throughout, as the opening seconds of the piece.
That is a direct answer to our covenant's bar: a judge with the sound off sees the chain bend
in five seconds.

**Rescue World rejects** volumetric cloud and particle spectacle for its own sake. Our budget
is 8 milliseconds of simulation and render per frame at device-pixel ratio 2, and every
effect has to pay for itself against that.

## 5.2 Project PLATEAU as the credible digital twin

This is a cross-reference to section 2.1. PLATEAU reads as credible for two reasons worth
naming separately from its interface. First, clicking a building returns the real municipal
record behind it, so the model is not decorative. Second, the model and the viewer are both
published under open licences that anyone can check, so the claim is inspectable rather than
asserted. The Rescue World equivalent of the second is the hash chain in `timeline.jsonl` and
the `certificate.json` file that lets a re-run be compared byte for byte.

---

# 6. Where the field conflicts with our locked register

In each case below the field does one thing and our register does another. The register wins,
and the reason is recorded so nobody re-litigates it later.

- **Charts and gauges as the subject.** Esri dashboards make counters and gauges the primary
  image. Our covenant says everything is somebody, and telemetry is chrome at the frame edge.
  We take the cross-filter interaction and refuse the form.
- **Light or photographic basemaps.** SpaceData, bosaiXview and PLATEAU VIEW all sit on
  satellite imagery or a light topographic map. Our ground is true black and the world is a lit
  object in a void.
- **Multi-hue marker palettes.** SpaceData uses at least four pin colours, and Cities: Skylines
  runs heat maps across many hues. Our whole register is white, grey, one cyan and one burn,
  and the burn is earned only by irreversible loss.
- **Raw numeric scores.** RoboCup Rescue puts a six-decimal float on screen as its outcome.
  Ours states the outcome first, as a sentence a stranger reads once, and only then gives the
  number.
- **A scenario the operator can rewrite mid-run.** The instructor in section 3.1 escalates and
  redirects live. Our determinism is absolute: same seed, same configuration, byte-identical
  event log, forever. The person gets freedom of viewpoint, not freedom of history.
- **Copyleft code.** Ushahidi is Affero-licensed. This is a legal conflict rather than an
  aesthetic one, and the answer is simply not to import its code.

---

# 7. The adoption list, mapped to our build stages

This is the operative section. Each line names the pattern, the stage it lands in, and the
reference it comes from. The stage names match the build order in section 4 of `SPEC.md`.

## Camera and flight — build item 6

| Adopt | From |
| --- | --- |
| Edge scroll: pointer at the window edge pans the camera, easing in rather than starting at full speed | real-time-strategy convention (4.5) |
| Camera bookmarks: Control plus a number saves, the number recalls, pressing twice centres | real-time-strategy convention (4.5) |
| A camera home control stacked with zoom in one fixed screen corner | bosaiXview (1.2), PLATEAU VIEW (2.1) |
| Exactly one active camera tool at a time, marked in signal cyan | PLATEAU VIEW (2.1) |
| Keyboard shortcuts printed inside the control that uses them | PLATEAU VIEW (2.1) |
| One uninterrupted camera move from the whole terrain to a single unit as the opening | Earth-2 (5.1) |
| Oblique camera by default, never top-down | SpaceData (1.1) |

## Selection and inspection — build items 6 and 7

| Adopt | From |
| --- | --- |
| Click-select one, drag a rectangle for many, double-click for all of a kind | real-time-strategy convention (4.5) |
| One information panel in one fixed place, empty when nothing is selected | real-time-strategy convention (4.5) |
| Selecting re-scopes every other surface at once, in one action | Esri cross-filter (1.3), without the dashboard |
| The selection and filter survive a view change | Ushahidi (2.4) |
| Every evidence line names its source and the time that source was captured | bosaiXview (1.2), SIP4D (1.4) |
| Confidence classes never mixed: preliminary, confirmed, official and estimated stay separate and labelled | SpaceData (1.1) |
| The dispatch card states what happened, where, who is nearest and free, and what can be sent, plus the evidence that authorized it | 911 Operator (4.3), with our own addition |
| Unit status stated in words, not by colour alone | Emergency Call (3.3) |

## Alert feed and time control — build item 6, the transport bar

| Adopt | From |
| --- | --- |
| Alert entries at the frame edge, clickable, camera jumps to the event, entry expires on its own | real-time-strategy convention (4.5) |
| Event labels also written in the world at the event's coordinate | DEFCON (4.1) |
| Declutter rule: at most one in-world label per site, oldest fades, feed holds the overflow | our correction to DEFCON (4.1) |
| Explicit pause that does not hide the world, so a person can pause and plan | real-time-strategy convention (4.5) |
| Speed control with named steps, plus a step-one-event key | real-time-strategy convention (4.5), our determinism rule |
| The run's shaping controls live on a surface separate from the world | XVR On Scene (3.1), minus its ability to change history |
| Per-layer live counts of how many items each stream currently holds | SpaceData (1.1) |

## Mini-map and orientation — new work implied by build item 6

| Adopt | From |
| --- | --- |
| A mini-map in one fixed corner showing the whole terrain, with the camera's view drawn on it as a rectangle, clickable to move | real-time-strategy convention (4.5) |
| A north indicator adjacent to the zoom stack | bosaiXview (1.2) |
| A scale bar at the frame edge | the SpaceData key art (1.1) |
| The incident named permanently in the masthead | bosaiXview (1.2) |
| A layer list collapsed by default to a count, expanding on demand | PLATEAU VIEW (2.1) |
| One layer section open at a time rather than many at once | bosaiXview (1.2) |

## The outcome banner — build item 7, and our register

| Adopt | From |
| --- | --- |
| The outcome is a sentence before it is a number: what happened, to whom, how many | our register; the RoboCup score line is the counter-example (2.2) |
| Scarce resources stated as time to a named consequence, in words | Frostpunk (4.2) |
| The same ground shown before and after, so the residue is the proof | Cities: Skylines (4.4), our residue rule |
| Burn colour appears only on the irreversible loss | our register |
| Human cost named next to the place it happened, not in a separate tally | DEFCON (4.1) |

---

# 8. Licence findings for the open-source packages

Every entry below was read from the project's own licence file or from the GitHub licence
endpoint on 2026-08-22, not from marketing copy. Two projects are worth flagging because
GitHub's automatic classifier reports "Other" for them, and a person checking only the badge
would get the wrong answer.

| Project | Licence | Last push | Verdict for Rescue World |
| --- | --- | --- | --- |
| Project PLATEAU VIEW 5.0 | Apache License 2.0 | 2026-03-24 | Safe to read, adapt and ship with attribution. Compatible with the MIT proposal in section 8 of the build specification. |
| PLATEAU VIEW 1.1, a Terria Map package | Apache License 2.0 | earlier generation | Same. |
| TerriaJS | Apache License 2.0 | 2026-08-21 | Safe; not planned for use. |
| RoboCup Rescue server | Berkeley Software Distribution 3-Clause | 2026-07-26 | Safe to read and adapt. Its log-viewer architecture is the precedent we cite. |
| Sahana Eden | **MIT** — GitHub's classifier says "Other", while the LICENSE file itself says MIT, copyright 2009 to 2025, Sahana Software Foundation | 2026-08-20, but the Foundation files it under "Legacy" | Safe. Take vocabulary, not interface. |
| Ushahidi Platform | **GNU Affero General Public License, version 3 or later** — GitHub's classifier says "Other", while the licence file names the Affero licence | 2026-08-10 | **Do not import code.** Copyleft with a network clause: running a modified version as a public service would oblige us to publish source. Reading for ideas carries no obligation. |
| CesiumJS | Apache License 2.0, free for commercial use | 2026-08-21 | Safe but not planned for use. Note that Cesium ion, the hosted tile service whose mark appears in the SpaceData and PLATEAU screenshots, is a separate paid product. |

Everything in sections 3 and 4 is commercial software and none of it is borrowable as code.
The interface conventions themselves are not copyrightable, which is precisely why naming them
exactly, as section 4.5 does, is the useful form of this work.

---

# 9. What this survey did not settle

Three things stayed open and are recorded here rather than guessed at.

The first is how the agent fleet's own activity should be drawn. Nothing in the field displays
a set of AI agents arguing about which reports to trust, so the communication display in
section 4 item 7 of the build specification has no reference to borrow from and remains
original work.

The second is how to draw the evidence table, the lichen with claims on one side and sources
on the other. The closest thing found is the SpaceData rule that confidence classes are never
mixed, which validates the principle but not any particular drawing of it.

The third is the mini-map itself. Every real-time-strategy game has one and it is
unambiguously worth having, but our covenant says no chart, axis, gauge, legend or node-link
diagram as the primary image, and a mini-map sits close to that line. The resolution proposed
here is that the mini-map is chrome at the frame edge, drawn as terrain rather than as an
abstract plan, and small enough that it can never become the subject. That proposal needs
the process owner’s ruling before it is built.
