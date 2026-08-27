# Rescue World — the Death Stranding map-screen reference

Written 2026-08-23 by claude, at Randy's directive: "look at screenshots from the UI in
death stranding's map screens, also death stranding 2 ... we are going for those vibes big
time." Death Stranding's map screens are now the declared aesthetic north star for Rescue
World, the 3D disaster-operations world specified in `SPEC.md` beside this file.

## Why this document exists, and how it differs from the one next to it

`UX-REFERENCES.md`, written 2026-08-22, surveyed the disaster-operations field — professional
software, open-source crisis platforms, incident-command trainers, and the settled real-time
strategy conventions — and answered the question "what has the field already solved, so we do
not reinvent it?" It is a behaviour survey. This document answers a different question: "what
does the north star actually look like, in numbers a builder can type into a shader?"

So this document does not repeat that one. It adds three things that one does not have.
First, measured visual specification: geometry, colour values sampled from the pixels,
stroke weights, easing, and motion, for every element. Second, the one thing the operations
field has no answer for — how a world reveals information to a person without a chart, which
is exactly what Death Stranding's terrain scan does. Third, an adaptation section that maps
each element onto named files and named functions in our build.

Where the two documents overlap, `UX-REFERENCES.md` governs behaviour and this one governs
appearance. Where either conflicts with the covenant in `CLAUDE.md` or the colour laws in
`app/src/design/system.ts`, our laws win and the conflict is named in section 12 below rather
than quietly resolved.

## The two games, dated

**Death Stranding.** Developed by Kojima Productions on the Decima engine, released
2019-11-08 on PlayStation 4. The Director's Cut reached Windows on 2022-03-30 and is on the
Steam store as application 1850570.

**Death Stranding 2: On the Beach.** Same studio, same engine. Released on PlayStation 5 on
2025-06-26, and ported to Windows by Nixxes Software on 2026-03-19, on the Steam store as
application 3280350. The Windows port is five months old as this is written, so the sequel
counts as current coverage rather than history.

## How these sources were checked

This session's web-search budget was already spent before the work began, so nothing here
comes from a search-result summary. Everything below was looked at directly.

Twenty-one full-resolution Death Stranding screenshots, each 1920 by 1080 pixels, were
downloaded from the Interface In Game catalogue and examined one at a time. Twenty screenshots
of the sequel were pulled from the Steam store's own application-details endpoint for
application 3280350 and examined as a contact sheet, then individually where they carried
interface. Two video walkthroughs were downloaded and decoded into still frames with the
`ffmpeg` command-line tool at two and three frames per second, and the frames were examined: a
nineteen-second capture of the terrain scanner, and an eighty-second capture of the sequel's
route-plotting screen. Colour values quoted below were sampled from those pixels with a short
Python script, not recalled or estimated.

**What a colour value here means.** Every hexadecimal value below is the colour as it appears
on screen *after* the game's own bloom, chromatic split and grade. It is a rendering target,
not a source constant from Kojima Productions. Read them as "make it come out looking like
this", the same way a colourist reads a reference frame.

**What could not be reached, stated plainly.** Three sites answered automated requests with a
bot challenge and could not be read: `gameuidatabase.com` returned a Cloudflare verification
page, the Death Stranding wiki on Fandom returned the same, and two search engines returned
bot checks. Completing a bot challenge is not something this agent does, so those sources are
cited below as "a person's browser loads it, this session's did not". The Interface In Game
catalogue rejected plain fetches with the code 403, meaning forbidden, but loaded normally in a
real browser, which is how its contents were read. The game user interface database at
`gameuidatabase.com` does catalogue both games and remains worth a person's time; this
document simply cannot vouch for its current contents.

---

# 1. The terrain: how elevation reads

## 1.1 The finding that reframes everything: the contours are in the world, not on the map

The single most important thing found in this survey is that Death Stranding's famous
luminous topographic linework is **not** a map-screen treatment. It is the odradek terrain
scan, drawn onto the real three-dimensional world geometry while the player is standing in
it. The map screen itself is a satellite-imagery and shaded-relief composite, and it carries
no contour lines at all.

That matters for us more than any styling detail. Rescue World does not have a separate map
screen — the world *is* the map, seen obliquely with a free camera. So the thing Randy is
pointing at is the in-world scan, and it lands on our terrain shader, not on a menu.

**See it.** <https://www.youtube.com/watch?v=kkkiMqq4kac> — "Death Stranding Terrain Scanner",
nineteen seconds, uploaded 2019-11-08 by Turtle Hermit WaspInatoR. The scan fires at about
five seconds in. Downloaded and decoded to frames 2026-08-23.

**What it looks like, precisely.** Contour lines — true lines of equal elevation, closed and
nested — are drawn directly onto the terrain surface. They wrap the geometry, so they bend
over a boulder and run around a gully exactly as a paper contour map's lines would, but seen
in perspective from a person standing on the ground. The line colour sampled off the frame is
`#a0dcff`, a pale sky-cyan, with the brightest cores blowing out toward white under bloom. At
a 960-pixel-wide frame the lines measure between one and two pixels, with a soft glow halo
roughly three pixels wider on each side. They are additive: they brighten what is behind them
and never occlude it.

**Slope reads for free, and this is the mechanism worth stealing.** Because the lines are
iso-elevation, their spacing on screen *is* the slope. On the vertical rock face in the
middle of the frame they crowd into a dense parallel bundle, almost solid light. On the flat
grass in the foreground no line appears at all, because the ground does not rise far enough
between one contour interval and the next. Nobody drew a slope shader. The steepness is a
consequence of the contour spacing, and a person reads "that is a cliff" from the density
without being told.

**The scanned ground is darkened.** Inside the scanned band the terrain is visibly dimmed and
desaturated relative to the unscanned foreground: the unscanned grass samples around `#4c5421`
while the scanned cliff face reads around `#46535b`. The scan does not add light to a lit
world; it dims the world and then draws light on it. That is why the linework reads as
information rather than decoration.

## 1.2 The map screen's terrain: hillshade, not contour

**What it is.** Death Stranding's own map screen renders elevation as a shaded relief over
satellite imagery, seen at an adjustable tilt.

**See it.** <https://interfaceingame.com/screenshots/death-stranding-map-2/> — the Map and
Information screen with the player's context menu open. Examined at full resolution
2026-08-23.

**What it looks like.** A desaturated green and brown satellite composite, overlaid with a
fine regular dot-matrix dither that is visible at full resolution as a screen texture across
the whole surface. Height reads only through the imagery's own light and shadow. The far edge
of the map fades into black rather than ending at a border. Multiple diagonal streaks of
red-and-cyan channel separation run across the frame, brightest near the corners — a
deliberate chromatic split that says "this is a projection, not a picture".

The sequel keeps the shaded relief and drops the photography. Its map is a pale khaki
hillshade with light from the upper left, so ridges are bright on their north-west faces and
shadowed on the south-east, with the high ground shifting toward a cool blue-violet. Terrain
tan samples around `#716555`. It reads like a good paper relief map that someone lit from a
window.

## 1.3 The continental map: quantized elevation

**What it is.** Death Stranding's whole-country map draws the United States as a stepped blue
elevation ramp with a network-coverage mosaic laid over it.

**See it.** <https://interfaceingame.com/screenshots/death-stranding-chiral-network-coverage/>
— the best single image in this document. Examined at full resolution 2026-08-23.

**What it looks like.** The landmass is filled with a *discrete* hypsometric ramp: deep navy
at sea level, mid blue across the plains, and near-white on the Rockies, in visible bands
rather than a smooth gradient. Lakes and no-data holes are pure black blobs with hard edges.
The coastline is a hairline in a brighter cyan; its brightest pixels sample `#b9f4f9`. Laid
over the eastern half is a mosaic of translucent square tiles about twenty-six pixels on a
side at that scale, each slightly lighter than the ground it covers, growing outward from the
connected cities in an irregular blocky frontier. Two connected cities burn as four-point star
flares blown out to white, each throwing a long horizontal anamorphic streak clear across the
frame.

**Why the quantization works.** A banded ramp gives the eye countable steps. A smooth gradient
gives it a wash. The `RAMP` constant in `app/src/design/system.ts` is already five discrete
stops for the same reason.

## 1.4 Water and impassable ground

**What it is.** The sequel marks a river as a band of water with a warning casing along both
banks, so "you cannot cross here" is drawn as an edge rather than stated in a legend.

**See it.** <https://www.youtube.com/watch?v=aqj4eqwO2YM> — "Death Stranding 2 Plot a Route",
one minute twenty seconds, uploaded 2025-06-24 by Ditech Gaming. The river runs down the
centre of every frame. Downloaded and decoded 2026-08-23.

**What it looks like.** The water body is a pale slate-blue band roughly twenty pixels wide at
a 960-pixel frame, sampling around `#94add5` in its lighter passages and `#b7c6dd` where it
catches light. Along each bank runs a three to four pixel stroke of muted brick red, sampling
`#ba3a3b` to `#c24146` — deliberately *not* a saturated alarm red. The stroke carries a soft
outward glow. So water is cool and quiet in the middle and warm and firm at its edge, and the
edge is the information: the red is the boundary you cannot walk over, not the water itself.

Unmapped ground is handled with equal directness: areas outside network coverage are drawn as
hard-edged near-black polygons and rectangles, sampling `#20202a`, forming a jagged tiled
frontier at the limit of what has been surveyed. Absence of data is drawn as absence of map.

## 1.5 The tilt is a named control, not a camera accident

In Death Stranding's map, the on-screen control legend lists four operations by name: "Zoom
Out/Zoom In", "Scroll", "Center on Sam", and **"Tilt Map"**. In the sequel the bottom prompt
row reads "Reset Orientation", "Center on Sam", "Switch Map Info", "Zoom", "Back".

**See it.** <https://interfaceingame.com/screenshots/death-stranding-map-2/> for the first
legend; the route video above for the second.

Two things follow. The oblique view is the default and the top-down view is not offered at
all — every map frame in every screenshot examined is tilted. And the tilt is presented as a
thing a person does on purpose, with its own name and its own key.

---

# 2. The palette and materials

## 2.1 What the register actually is

Across the twenty-one Death Stranding screenshots examined, the palette holds to a small,
strict set, and the discipline is in how little is spent rather than in the hues chosen.

| Role | Sampled value | Where it appears |
| --- | --- | --- |
| Ground | `#000000` to `#20202a` | the void behind every hologram, and unmapped map tiles |
| Structure and type | white through `#b9f4f9` | coastlines, linework, all primary type |
| Signal | `#29bdfe` to `#4cc4ff` | every interactive glyph, every selected row, every active tool |
| Scan light | `#a0dcff` trailing, `#5c80d8` at the wave front | the odradek terrain scan |
| Alarm | `#f90627` | the word "Offline" only, at roughly nine pixels |
| Revealed hazard | `#de0d23` to `#ef143e` | markers the scan uncovers |
| Warm readout | `#dddd28` | the carried-weight number, and nothing else |

**How much colour is allowed at once.** In the map screens, exactly two: the cyan of the
interface and the muted natural colour of the terrain beneath it. Warm colour appears only as
a single small element per frame — the word "Offline" at nine pixels, or one number in the
vitals cluster. In the whole-country map, warm colour is absent entirely.

The clearest statement of the rule is the holographic table map:
<https://interfaceingame.com/screenshots/death-stranding-world-map/>. A projection lying flat
on a table in a dark room, the map body a spring green sampling `#3ddd9f`, the node rings and
their labels in white, and exactly one further colour — an orange-red used only on the rings
whose label reads "Connection Refused", each struck through with a diagonal cross. Three
colours. The third one means refusal and nothing else.

## 2.2 The materials

Four material behaviours recur and each is implementable.

**Everything luminous is additive.** Linework, glyphs, scan contours and route ribbons all
brighten what is behind them. Nothing in the interface layer writes an opaque pixel over the
world. This is why a marker on a dark cliff and the same marker on bright water both read.

**The coastline is the brightest thing on the map.** On the table hologram the landmass edge
is a thick blown-out stroke with a wide bloom halo, several times brighter than the fill
inside it. The boundary carries the light; the interior is a wash.

**Everything is dithered or striated.** Full-resolution examination shows a regular dot-matrix
screen across the map surface, horizontal raster striations across the table projection, and
a vertical comb fringe at the projection's near edge. The image is never clean. It is always a
sampled, reconstructed thing.

**Depth of field separates the projection from the room.** In the network-coverage screen the
real geometry behind the hologram — beams and structure — is blurred to a smear while the map
itself is sharp. The hologram floats in a soft void.

---

# 3. The route-plotting interaction

## 3.1 Laying a path

**What it is.** In the sequel the player enters a plotting mode from the map, drops markers on
the terrain, and the game draws a path between them and then reports what the path will cost.

**See it.** <https://www.youtube.com/watch?v=aqj4eqwO2YM> — the whole eighty seconds is this
interaction, plotting from a marker labelled D2. Also
<https://www.youtube.com/watch?v=yIwTyA22js8>, "How to use the Marker System in the Death
Stranding Map", two minutes thirty-nine, uploaded 2019-11-08 by Abyx Gaming, for the first
game's version.

**The mode is announced in the masthead.** Under the location name sits a single line with a
button glyph and the words "Plot a route", at roughly twelve pixels. The mode is stated where
the screen's identity is stated, not in a toolbar.

**The path's rendering.** The drawn route is a chain of **white tapered ribbon segments** lying
on the terrain — each segment thicker in its middle and tapering to a point at both ends, like
a brush stroke, semi-transparent, with visible gaps between segments. It is emphatically not a
constant-width polyline. Two properties follow: the taper gives the path direction and rhythm
without arrowheads, and the gaps let the ground read through so the route never hides the
terrain it crosses.

**Waypoint markers.** Each dropped point is a small glyph with a two-character label beside it
in tracked capitals — "D1", "D2", "01", "02" — set at roughly eleven pixels with light tick
marks framing it. The labels are short enough to never need a background plate.

**Distance rides the path.** A distance readout hangs off the route on a thin leader line, set
in a dark charcoal pennant whose right edge is angled to a point. The number is tabular and
white at about twenty pixels; the unit follows at a smaller size after a space: "687 m". At
higher zoom the readout drops its plate entirely and floats as a large semi-transparent
numeral straight on the terrain: "137 m".

**Commands attach to the selection, not to a toolbar.** Selecting a marker opens a saturated
cyan-blue bar with rounded ends carrying the marker's name in white sentence case at about
twenty-six pixels, with a small hazard-class icon at the bar's left end. Directly beneath it a
dark charcoal bar with a pointed left end carries the available commands, each prefixed by its
button glyph: "Remove Marker", "Draw Route". While drawing, that row becomes "Add Marker",
"End Route Here", "Undo". The verbs change with the mode; the position never does.

## 3.2 The gradient and hazard warning along a plotted route

This is the strongest single idea in either game for our purposes, and it is worth describing
in full because it is directly implementable.

**What it is.** As soon as a route exists, a panel appears reporting what the route will cost
in distance, in time, and in danger, with a cross-section of the ground it crosses.

**See it.** The same route video at roughly thirty-three to forty seconds.

**What it looks like.** The panel is roughly four hundred and seventy by two hundred and ten
pixels at a 960-wide frame, sitting at the lower right, over the map, semi-transparent.

Its header is split into two unequal strips. The left, narrower strip is tinted blue and reads
"Distance". The right, wider strip is tinted **red** and reads "Risk Level". The header itself
carries the judgement: the risk half of the panel is a red field before a single number is
read.

Under the blue half: the distance in large light-weight numerals — "167 m", at roughly fifty
pixels, generously letter-spaced, in a pale grey-white — with the estimated walking time
directly beneath it in small tabular type, "00:01:04". Distance and time are one stacked
statement, not two rows.

Under the red half: the risk level as a small number of narrow vertical bars, roughly fourteen
pixels wide and ninety tall, filled in a yellow-olive, standing against the red ground. Two
filled bars means two units of risk. Because the ground is already red, an empty gauge still
reads as "this is the danger column".

At the panel's top right: hazard chips, each a small red circular icon followed by a count,
"×1". The kinds of danger and how many of each, in the smallest possible form.

Below all of it: the **elevation profile**. A horizontal band with a faint baseline, vertical
gridlines at 500 and 1000 with tiny boxed distance labels sitting *above* the line rather than
below it, and a thin white polyline showing the terrain's cross-section from start to
destination. Waypoints appear on the polyline as small square nodes with their two-character
labels in tiny boxed capitals hanging beneath. And where the route crosses something dangerous,
a **vertical red stripe** about six pixels wide runs the full height of the profile band, with
the matching hazard icon sitting directly above it at the same horizontal position. The
profile answers "where along the way", and the stripe and the icon share a horizontal position
so the eye connects them without a legend.

**The copy that accompanies it.** Centred at the bottom of the screen, in plain sentence-case
white: "When you plot a route on the map, you'll see what hazards you may run into along the
way." Then: "You can face these challenges head on or try to find a way around them." Then:
"How you get to your destination is up to you, but think it over before getting undertaken."
Three sentences, one at a time, no panel, no box.

---

# 4. The scan pulse

## 4.1 What the wave looks like

**What it is.** The odradek scan is an expanding ground-following ring that reveals the
terrain's shape and everything sitting on it, then fades.

**See it.** <https://www.youtube.com/watch?v=kkkiMqq4kac> — the terrain scanner capture. The
wave front is clearly visible in the frames at about five and five-and-a-half seconds.

**The wave front itself.** At the leading edge the effect is a band of bright faceted
blue light hugging the ground, roughly two to four metres wide in world terms, reading like
shattered ice or a crystalline crust following every bump of the terrain. Its colour samples
`#5c80d8` — a deeper, more saturated periwinkle than the contour lines it leaves behind.

**What it leaves behind.** Behind the front the crust dissolves into the pale contour lines
described in section 1.1, sampling `#a0dcff`. So the effect has two distinct colours in two
distinct roles: a deeper blue at the moving edge, a paler near-white in the persistent lines.
The edge is the event; the lines are the record.

**How revealed information fades.** The contour lines persist for several seconds across the
whole scanned ring and then dim away, brightest nearest the wave front and progressively
fainter the longer ago the front passed. The area right at the player's feet carries no lines
at all in the later frames, because the front has already moved outward past it and its
contours have decayed.

**Markers ride the terrain and appear when the front reaches them.** In the wave-front frame, a
cluster of saturated crimson markers, sampling `#de0d23` through `#ef143e`, sits exactly at
the current radius — they are being uncovered as the front sweeps over them, not before.
Marker glyphs sit on the ground surface, follow its slope, and hold their world position as
the camera moves. Structures get a thin ring glyph with a small icon beside it. There is no
marker anywhere that is not attached to a point of ground.

**The cost of the scan is shown, minimally.** At the lower left, a single word — "Recharging"
— with a thin depleting hairline bar beneath it, perhaps sixty pixels long, at low opacity.
That is the entire cooldown display.

## 4.2 The mechanism, from a published recreation

A developer reproduced the effect in the Unity game engine and published both a breakdown and
the shader.

**See it.** <https://www.youtube.com/watch?v=wrs4g4hj9HY> — "I Tried Re-creating Death
Stranding Terrain Scan", eighteen minutes forty-six, uploaded 2024-11-28 by Game Dev Buddies.
Code: <https://github.com/GameDevBuddies/Death-Stranding-Terrain-Scan>, created 2024-11-28,
last pushed 2025-01-07.

**Licence, and it matters.** That repository carries **no licence file**, and the code-hosting
service's licence endpoint returns nothing for it. Under default copyright that means the code
may be read but must not be copied into this repository. Read it for the technique; write our
own shader.

**The technique, from the video's own chapter list.** Reconstruct world position from the depth
buffer; run a Sobel edge operator for outlines; derive the scan lines from world-space height;
add an edge gradient at the wave front; darken the scanned ground; mask a dark circle at the
centre so the area immediately around the origin stays clear; soften the outer edge; animate
the radius outward over time. Every one of those steps has a direct equivalent in our terrain
shader, and section 11 spends them.

---

# 5. The typography and labels

## 5.1 Three voices, kept strictly separate

Every screen examined uses exactly three type voices and never lets them blur.

**The title voice.** Screen titles — "Chiral Network Coverage", "Cargo Management", "Delivery
Preparation", "Map/Information", "Results", "Ring Terminal" — are set in a light-weight
display face with true small capitals: the first letter of each word at full cap height, the
remaining letters as smaller capitals. Letter-spacing runs roughly five to eight percent of
the size. Size is roughly thirty-four pixels on a 1400-pixel-wide frame. Colour is a pale
cyan-white. This face appears **only** in screen titles and in menu item names, and never in
running text.

**The world voice.** Labels attached to points in the world — site names, distances, waypoint
codes, the words Pacific Ocean and Atlantic Ocean, the ghosted watermark reading Bridges
Geosurveillance System — are set in tracked capitals at roughly eleven pixels, letter-spaced
wide, often at low opacity. They are small, dry, and technical.

**The reading voice.** Everything a person actually reads as language — item descriptions,
tutorial copy, subtitles, command names, section headings — is set in an ordinary humanist
sans, **sentence case**, regular weight, at roughly nineteen pixels. "Check and adjust cargo."
"Deliver morphine to the Bridges isolation ward." "You can face these challenges head on or
try to find a way around them."

The discipline is that the third voice is never traded for the second. Death Stranding does
not set its prose in tracked capitals to look technical. Capitals are for labels; sentences
are for sentences.

## 5.2 How labels anchor to world points

**See it.** <https://interfaceingame.com/screenshots/death-stranding-world-map/> and
<https://interfaceingame.com/screenshots/death-stranding-binocular/>.

Labels are billboarded — always facing the viewer — but scale with distance, so a near label
is visibly larger than a far one, and the map's depth reads through the type. On the table
hologram the labels sit *inside* the top of their ring rather than beside it, overlapping the
ring's stroke. There is no leader line and no background plate; the label simply sits at its
place. When two labels collide, they collide — nothing reflows, nothing declutters. That is
the same fault `UX-REFERENCES.md` recorded in the nuclear-war strategy game surveyed in its
section 4.1, and our declutter rule stands.

## 5.3 The data readouts

**See it.** <https://interfaceingame.com/screenshots/death-stranding-cargo-management/> and
<https://interfaceingame.com/screenshots/death-stranding-filter-2/>.

Three habits are worth taking exactly as they are.

**Leading zeros are dimmed, not omitted.** The weight reads "055.4 kg" with the leading zero in
dark grey and "55.4" bright. The numbers "0237" and "0691" and "03087" are treated the same
way. The field keeps a fixed width so nothing shifts as the number grows, and the eye is still
told where the number really starts.

**A null is drawn as a null, not as zero.** The "Container Damage" row, when there is no
container, reads "- - -" in dim grey, with its label greyed out too. Nothing has to be
inferred from a zero that might be a real zero.

**The change is signalled, the level is not.** On the network-coverage screen the two readouts
show "2" and "0/1560" in white, with "+1" and "+400" sitting directly *above* them in cyan at
a smaller size. The delta carries the signal colour; the level stays neutral.

## 5.4 How much text is ever on screen at once

Counted across the map screens: the title, the region name, one objective line, one control
legend of four or five rows, and the labels on visible sites. In the field, less still — the
scan frame carries a four-icon cluster at maybe fourteen pixels, one small equipment name, and
the tutorial copy. There is no compass, no minimap, no health bar, and no ammunition counter
in the walking frames.

The heaviest screen in the whole set is Cargo Management, and even there the body copy is one
paragraph of five lines and nothing else.

---

# 6. The brackets, reticles, and frames

## 6.1 The target reticle, which is the best bracket in either game

**What it is.** The sequel's aiming reticle: a broken ring with four spokes, drawn entirely in
glowing warm light.

**See it.** <https://store.steampowered.com/app/3280350/> — the seventh screenshot in the
store gallery. Downloaded from the Steam store's application-details endpoint and examined
2026-08-23.

**Anatomy, part by part.** Four cardinal spokes radiate from an empty centre: the horizontal
pair are heavy bars, the vertical pair noticeably thinner. Each spoke stops short and then
resumes as a **detached short cap** beyond a gap, so each axis reads as bar, gap, tick. At a
radius of roughly a seventh of the frame height sits a **broken ring** — four quadrant arcs of
about fifty-five degrees each, thinner than the spokes, with gaps at the cardinal axes where
the spokes pass through. At each of the four diagonals sits a small outlined **stadium shape**
— a rounded-end capsule — tilted tangentially. Tiny illegible numeric ticks ride the inside of
the arcs at roughly eight pixels: pure texture, unreadable by design.

**The centre is empty.** There is no dot and no crosshair intersection. What fills the centre
instead is a **dot-matrix halftone** of small squares laid over the locked object itself, so
the target is marked by a screen texture rather than by a mark floating in front of it.

**Colour and light.** The whole reticle is orange-red with a hotter core; the brightest pixels
sample `#ffeb0e`, fully blown to yellow-white. Everything is additive — the reticle brightens
the enemy behind it and never hides him. Nothing else in that frame is orange except diegetic
firelight.

## 6.2 The corner-bracket panel language

**See it.** <https://interfaceingame.com/screenshots/death-stranding-cargo-management/>.

Panels do not have frames. They have **corners**: small right-angle marks a few pixels long
sitting at the panel's corners, with nothing between them. The "Details" panel is headed by a
short dash, then its name in tracked capitals, then a hairline that runs from the name all the
way to the frame edge. Section breaks inside a panel are rows of tiny dots, not solid rules.

The frame's own edges carry **registration marks**: small dashes, six to ten pixels, scattered
at seemingly arbitrary positions along all four edges, plus paired ticks near the corners.
They belong to nothing. They exist to say that this image is a calibrated instrument's output.
The Bridges delivery-unit hologram —
<https://interfaceingame.com/screenshots/death-stranding-snd/> — is the purest example: a thin
bright ring, three outlined letters, and then the surrounding air dusted with small crosses on
a loose grid, short line fragments, filled squares, stacked hairline bands, and illegible
micro-text.

## 6.3 How panels open, and where Death Stranding does something kin to a spin-open reveal

Randy separately favours bracket-and-crosshair reveals that spin open. Death Stranding does
not spin its brackets. What it does instead is worth knowing, because it is arguably a
stronger idea and it is cheaper.

**Selection is a passing light, not a box.** On the map's menu
(<https://interfaceingame.com/screenshots/death-stranding-information/>) and on the main menu
(<https://interfaceingame.com/screenshots/death-stranding-main-menu/>), the selected item is
marked by a soft **cyan anamorphic streak** that passes horizontally through its baseline —
roughly seven hundred pixels wide, thirty pixels at its thickest, brightest at one end and
feathering to nothing at the other, additive and soft-edged. There is no highlight bar, no
border, and no box. The unselected items simply sit at about thirty percent opacity in grey.

**Only the selected item explains itself.** In that menu, "Cargo" is bright and carries a
sentence beneath it — "Check and adjust cargo." The three items below it — "Orders", "Data",
"System" — are dimmed and carry no description at all. The explanation appears for exactly one
thing at a time.

**Column dividers have terminals.** The vertical rule that separates the menu from its prompts
is a cyan hairline with a small perpendicular tick at each end. It is a measured line, not a
border.

**The selection flyout points at its parent.** In Cargo Management, the selected row is a
saturated cyan fill with a small triangular arrow protruding from its right edge, pointing at
the context menu that just opened. In the sequel, the same relationship is drawn with the
chevron-pointed left end of the command bar.

The comparison to state plainly: Death Stranding's reveal is a **light passing across** rather
than **geometry unfolding**. Our existing corner-bracket opening in `app/rescueworld.html`,
the markup with the `rv` class, is already the second thing and Randy approved it. Section 11
keeps it and adds the light.

---

# 7. The transitions

## 7.1 Map open and close

**See it.** <https://www.youtube.com/watch?v=aqj4eqwO2YM> for the sequel's open, and
<https://interfaceingame.com/screenshots/death-stranding-information/> for the first game's
menu state.

The map does not cut in. The world recedes behind heavy blur and a dark scrim while the map
resolves in front of it, and the two share the frame for the duration. In the first game the
world is never fully replaced: the map is drawn as a projection with the room's real geometry
still visible and blurred behind it.

## 7.2 Depth of field is the modality signal

In the network-coverage screen the structural geometry behind the hologram is smeared to an
unreadable blur while the map holds sharp. In Delivery Preparation the modal panel opens over
the list and the **list is dimmed to about thirty percent — not blurred**. So there are two
distinct treatments doing two distinct jobs: blur separates a projection from the room it is
projected into, and dimming separates a modal panel from the surface it sits on. They are not
interchangeable.

## 7.3 Zoom between scales

The sequel's zoom is continuous and the map's information changes with it. At the widest zoom
the ground is a low-contrast hillshade with no linework. Zooming in brings out street webbing
over settlements, then individual structure glyphs, then the fine terrain texture. Nothing
pops in as a step; density accretes as scale increases. "Switch Map Info" is a separate named
control for changing what is drawn, kept distinct from "Zoom", which changes how close you are.

## 7.4 The camera move into the map

The first game's map opens centred on the player and offers "Center on Sam" as a standing
control to return there. The sequel adds "Reset Orientation" beside it, separating "put the
camera back over me" from "point the map north again". Two different kinds of lost, two
different keys.

---

# 8. Death Stranding 2's changes

Death Stranding 2: On the Beach is the newer half of the north star and it differs from the
first game in five ways that matter to us. All five were read from the route-plotting capture
of 2025-06-24 and the Steam store gallery of the 2026-03-19 Windows release.

**One. The map lost its photograph.** The first game's map is satellite imagery. The sequel's
is a drawn shaded relief in khaki with cool high ground. It is a cartographer's map, not a
photograph with icons on it. For us this is straightforwardly better and closer to our
register, because there is no photograph to argue with.

**Two. Coverage is drawn as absence.** Unmapped ground is not greyed or hatched. It is missing
— hard-edged near-black tiles at `#20202a` with a jagged boundary. The first game drew network
coverage as *added* tiles; the sequel draws the lack of it as *removed* map.

**Three. Routes report their cost before they are walked.** The distance, time, risk level,
hazard inventory and full elevation profile described in section 3.2 have no equivalent in the
first game. This is the sequel's single biggest interface addition and the most useful idea in
this document.

**Four. The command language moved onto the selection.** Both games attach commands to the
selected object, but the sequel's are terser and mode-dependent: "Remove Marker / Draw Route"
becomes "Add Marker / End Route Here / Undo" the moment drawing starts, in the same place.

**Five. Warnings are written on the ground.** The words "Warning: Armed hostiles" appear across
the terrain itself in large blown-out pale type at very low contrast, sitting in the map plane
like a watermark over the region it describes, rather than in a feed or a panel. Hazard zones
are drawn as translucent red circles with a small icon at the top of the ring, sampling
`#8e4c4d` — again a dusty, desaturated red rather than an alarm colour.

One more observation, from the sequel's diegetic screens (the twentieth screenshot in the
Steam store gallery for application 3280350): a wall of perhaps forty low-contrast teal data
rows, each a strip of tiny numerals, with **exactly one row filled in saturated red-orange**.
A hundred quiet rows and one loud one is the whole composition. That is the density lesson of
section 9 in its purest form.

---

# 9. The cargo screens' density management

Only the transferable part is recorded here, because our evidence panel has the same problem:
a lot of true things, one of which matters right now.

**See it.** <https://interfaceingame.com/screenshots/death-stranding-cargo-management/>,
<https://interfaceingame.com/screenshots/death-stranding-delivery-preparation/> and
<https://interfaceingame.com/screenshots/death-stranding-results-2/>.

**Group rows are filled bars; item rows are not.** In the cargo list, the three group headers
— "Carried on Back", "Equipped", "Not Carried" — are solid coloured bars with an icon, the
group name, and a right-aligned count. Their children are indented rows on a translucent dark
ground with no fill. Structure is carried by fill, not by indentation alone.

**The meter is the underline.** In the map's unit summary
(<https://interfaceingame.com/screenshots/death-stranding-map-2/>), eleven attributes are
listed in two columns, and each one's value is a short horizontal bar sitting directly *under*
its own label, doubling as the label's underline. Eleven meters in the vertical space of
eleven text rows.

**The outcome is a sentence before it is a number.** The Results screen leads with "Delivery
Completed!" set larger than any number on the screen, and only then lists the criteria with
their values right-aligned. Exactly one criterion row is highlighted — the one that earned the
bonus — in a gold outlined band with a translucent gold fill and tiny dotted top and bottom
edges. And the overall rating is drawn as a long gold bar that terminates in a chevron point
aimed at a circular seal reading "Awesome". The bar literally points at its own verdict.

**The dense technical picture is warm and the interface is cool.** In Delivery Preparation the
item is drawn as an amber hairline blueprint with tiny annotations — the only warm element on
the screen, and it is a *drawing*, not a state.

---

# 10. The links, gathered

The three best single images, if only three are opened:

1. <https://interfaceingame.com/screenshots/death-stranding-chiral-network-coverage/> — the
   whole palette, the quantized elevation ramp, the coverage mosaic, the title voice, the
   delta-above-level readout, and the registration marks, in one frame.
2. <https://www.youtube.com/watch?v=kkkiMqq4kac> — the terrain scan, which is the actual
   thing Randy is pointing at.
3. <https://www.youtube.com/watch?v=aqj4eqwO2YM> — the sequel's route ribbon, water casing,
   risk panel and elevation profile.

Everything else cited: the catalogue index
<https://interfaceingame.com/games/death-stranding/>; the map screens
<https://interfaceingame.com/screenshots/death-stranding-map-2/>,
<https://interfaceingame.com/screenshots/death-stranding-map-3/>,
<https://interfaceingame.com/screenshots/death-stranding-world-map/>,
<https://interfaceingame.com/screenshots/death-stranding-world-map-2/>,
<https://interfaceingame.com/screenshots/death-stranding-filter-2/>,
<https://interfaceingame.com/screenshots/death-stranding-information/>,
<https://interfaceingame.com/screenshots/death-stranding-binocular/>; the density screens
<https://interfaceingame.com/screenshots/death-stranding-cargo-management/>,
<https://interfaceingame.com/screenshots/death-stranding-delivery-preparation/>,
<https://interfaceingame.com/screenshots/death-stranding-results-2/>; the chrome
<https://interfaceingame.com/screenshots/death-stranding-snd/>,
<https://interfaceingame.com/screenshots/death-stranding-main-menu/>; the sequel on the Steam
store <https://store.steampowered.com/app/3280350/>; the first game on Windows
<https://store.steampowered.com/app/1850570/>; the scan breakdown
<https://www.youtube.com/watch?v=wrs4g4hj9HY> and its unlicensed code
<https://github.com/GameDevBuddies/Death-Stranding-Terrain-Scan>; the sequel's marker
walkthrough <https://www.youtube.com/watch?v=K6mAnRdbbtw>, titled "Death Stranding 2 On The
Beach - How To Make All Icons Show On The Map"; the first game's marker system
<https://www.youtube.com/watch?v=yIwTyA22js8>; and the release facts
<https://en.wikipedia.org/wiki/Death_Stranding_2:_On_the_Beach>.

Not reachable from this session, and stated so rather than papered over:
<https://www.gameuidatabase.com/> and <https://deathstranding.fandom.com/wiki/Odradek>, both
of which answered with a Cloudflare bot challenge. A person's browser loads both.

---

# 11. The adaptation: what Rescue World builds

This is the operative section. Each directive names the file it lands in, the numbers to use,
and the build item from section 4 of `SPEC.md` that it belongs to.

**A caution on file state.** The file `app/src/rescueworld/main.ts` is under active edit by
more than one agent. Every directive below that touches it should be re-read against the
current file before editing, and file reservations taken through `board/reserve.mjs` as the
covenant requires.

## 11.1 The terrain shader — `app/src/rescueworld/terrain.ts` and the fragment shader `TERRAIN_F` in `main.ts`

**Directive 1 — make contours the primary read, not a whisper.** `TERRAIN_F` currently computes
`float band = abs(fract(e * 22.0) - 0.5); float contour = smoothstep(0.40, 0.5, band);` and
then spends it at `contour * 0.18` against `relief * 0.85`. That is backwards for this north
star. Death Stranding's contour lines *are* the terrain; the shading is nearly absent. Raise
the contour term to roughly `0.55` and drop the relief term to roughly `0.35`, and judge the
result against the terrain-scan frames rather than against a number.

**Directive 2 — give contour lines a constant screen width.** The current
`smoothstep(0.40, 0.5, band)` is a fixed ramp on a triangle wave with no derivative term, so
lines fatten on flat ground, vanish on steep ground, and alias at grazing angles — the exact
opposite of Death Stranding, where crowding on a cliff is the whole point. Replace it with a
screen-space-aware width:

```glsl
float bands   = 22.0;
float f       = fract(e * bands);
float tri     = abs(f - 0.5) * 2.0;              // 0 at the line, 1 between lines
float w       = fwidth(e * bands) * 1.6;          // one and a bit pixels, whatever the slope
float contour = 1.0 - smoothstep(0.0, w, tri);
```

The `fwidth` function needs either the standard-derivatives extension on the first version of
the web graphics library, or a second-version context. The renderer already runs a
second-version context for the post chain's vertex-array handling, so `fwidth` is available.
With this in place, dense line packing on a landslide scarp is automatic and is the slope
read, exactly as section 1.1 describes.

**Directive 3 — two line colours, front and record.** The scan front and the persisting lines
are different colours in the source and should be here too. Set the persistent contour tint to
the measured `#a0dcff` — which sits very close to the existing `BONE` constant at
`(0.85, 0.94, 1.0)`, so use `BONE` and spend nothing — and reserve the deeper `#5c80d8` for
the moving front in directive 6. Keep the `uTint` uniform at `(0.17, 0.42, 0.55)` for the
relief base; it is already the right family.

**Directive 4 — darken the ground the linework sits on.** Death Stranding dims the scanned
world and then draws light on it. `TERRAIN_F` already has its `uAmt` uniform at `0.82`. Drop
the base relief contribution so the unlit ground sits near `#0e1416` — the second stop of the
`RAMP` constant in `app/src/design/system.ts` — and let the contour term carry almost all the
luminance. Two frames of the same ground, one with contours and one without, must differ by
more than a tint.

**Directive 5 — draw the no-data sea as missing map, not as dark ground.** `TERRAIN_F`
currently does `col *= mix(0.14, 1.0, land)`, which fades the sea to a dim version of the land.
The sequel draws unmapped ground as hard-edged near-black tiles at `#20202a` with a jagged
boundary. Change the alpha-channel handling to a hard cut at the data mask, snapped to the
residue base plate's 32-texel graticule so the boundary is blocky rather than smooth. The sea
should read as "we have no survey here", which is exactly what the Geospatial Information
Authority tiles mean.

## 11.2 The scan pulse — new work in `main.ts`, build item 6

**Directive 6 — selection fires a ground-following ring.** This is the highest-value single
addition in this document, because our survey of the current build found that selecting a
site, a shelter or the epicentre produces **no visual change in the world at all** — only the
panel opens. Death Stranding's answer to "what did I just point at" is a wave.

Implementation, entirely inside `TERRAIN_F` with three new uniforms and no new geometry:

```glsl
uniform vec2  uScanAt;      // the selected point, in terrain uv
uniform float uScanAge;     // ticks since the selection fired; negative means no scan
uniform vec3  uScanFront;   // (0.36, 0.50, 0.85) — the measured #5c80d8
```

- The radius grows as `r = uScanAge / RATE * speed`, with `speed` tuned so the front crosses
  the whole ground rectangle, whose longest side is the exported `GROUND` value of `3.90`
  world units, in about one and a half seconds.
- Ease the growth with `ease.outQuint` from `app/src/design/system.ts` — fast out of the gate,
  settling at the edge — never linearly. The covenant already forbids linear motion.
- The front is a narrow band at the current radius, in the `uScanFront` colour, about `0.012`
  of the ground's longest side wide, with a soft outer falloff and a harder inner edge.
- Behind the front, multiply the contour term by an age-decayed gain: full brightness at the
  front, decaying with `exp(-(r - d) / 0.55)` where `d` is the fragment's distance from the
  origin, so lines fade from the inside outward and the world returns to rest.
- Mask a small dark circle at the origin — the recreation video's "dark circle" step — so the
  selected site itself is not swallowed by its own light.

The scan must be a pure function of the playback tick, exactly as `stations.ts` computes its
pulse gain from the tick value rather than from a wall clock. Seeking to the same tick twice
must produce the identical ring. This is the determinism rule, and it is not negotiable.

**Directive 7 — markers arrive when the wave reaches them.** In `layers.ts`, the vertex shader
`LINE_V` currently computes `float appear = smoothstep(-0.5, 7.0, age);` — an appearance that
depends on time only. Add a second gate on the scan radius, so a hazard polygon or a road
restriction ignites when the front crosses its centroid rather than on a schedule. Our line
geometry already carries per-feature attributes and one selection uniform, so this is one more
attribute and one more comparison. It converts an arbitrary reveal into a caused one.

## 11.3 The route ribbon — `layers.ts` and the damage field, build items 6 and 7

**Directive 8 — dispatch paths render as tapered white ribbon segments, not lines.**
`layers.ts` currently draws every observed feature through one private `drawnLines()` helper
producing a single line-segment object with additive blending — which means a one-pixel stroke
regardless of zoom, for both a landslide polygon and a road. The sequel's route is a chain of
white tapered ribbons with gaps between them. Build dispatch paths as a separate mesh of
camera-facing quads along the path, with:

- width tapering from zero at each segment's ends to about `0.006` world units at its middle,
- a gap of roughly forty percent of segment length between consecutive segments,
- colour `BONE`, additive, with depth writing off, and a render order above the terrain and
  below the station plates,
- and an alpha falloff across the ribbon's width of `pow(1.0 - abs(t), 2.0)` so the edge is
  soft and the core is bright — the same falloff shape already used in the dust fragment
  shader `DUST_F`.

The taper gives the path direction without an arrowhead, and the gaps let the damaged ground
read through the route that crosses it.

**Directive 9 — road restrictions get the water casing.** Our road restrictions are currently
drawn in signal cyan at a gain of `0.50`, identical in kind to everything else. Give them the
sequel's water treatment instead: a wider, quieter band for the road itself and a firm stroke
along each edge for the restriction. Use `BONE` for the band and hold the edge stroke in the
same `BONE` at higher gain, because our register has no third colour to spend and the sequel's
brick red would be a second signal subject. The information is the *edge*, not the fill — a
closed road is a boundary, and boundaries are drawn as boundaries.

**Directive 10 — the impassable field earns a visible edge.** `terrain.ts` stamps road
restrictions into the green channel through
`stampField(block, W, H, x, y, 0.55, 1.9)`, and `TERRAIN_F` renders it as
`col += uTint * (1.0 - p) * 0.90` — a soft glow blob. Add a gradient term so the blocked
region carries a rim: compute the passability gradient in the shader and add a thin bright
line where it falls fastest. A closed road should read as a fence, not as a smudge.

## 11.4 The selection panel — `drawPanel()` in `main.ts`, build item 7

**Directive 11 — split the panel header into a neutral half and a consequence half.** The
sequel's route panel puts "Distance" on a blue strip and "Risk Level" on a red one, so the
judgement is legible before a number is read. Our evidence panel should do the same: the left
header strip carries the neutral identity (what this is, where it is, when it was observed),
and the right strip carries the consequence. Our register forbids a red field, so the
consequence half is marked with a hairline in the burn colour along its top edge — and only
when the consequence is an irreversible loss, per the burn law. When it is not, the right half
is neutral too, and the absence of the hairline is itself the reading.

**Directive 12 — only the selected thing explains itself.** In Death Stranding's map menu, the
selected item carries a one-sentence description and the three unselected items carry nothing.
`drawPanel()` should follow: the selected claim, unit or layer gets its full evidence rows;
sibling rows collapse to name and count. This directly serves our "no walls of text" law and
costs nothing.

**Directive 13 — take the three readout habits whole.** Dim leading zeros rather than dropping
them, so the field never shifts width. Draw a missing value as `- - -` in the `C.dim` grey,
never as zero. And put the change above the level in signal cyan at a smaller size — "+3" over
"12" — which is the one place per frame the signal colour is spent on a number.

**Directive 14 — the meter is the underline.** For any evidence row carrying a magnitude —
sources agreeing, confidence, people reached — draw the value as a short hairline bar beneath
the row's own label rather than as a separate column. Eleven magnitudes in eleven text rows,
per section 9.

## 11.5 Selection feedback in the world — `select()` in `main.ts`, build item 6

**Directive 15 — selection is a light passing across, plus the brackets we already have.**
Today `select()` does four things: brightens hazard lines by a factor of 3.2, brightens roads
the same, raises building gain from 1.45 to 2.6, and calls `drawPanel()`. Add two:

- fire the scan ring of directive 6 from the selected point;
- draw a single soft anamorphic streak through the selected object's screen position — roughly
  a third of the frame width, thirty pixels at its thickest, brightest at one end and feathered
  to nothing at the other, additive, in signal cyan, decaying over about half a second with
  `ease.outExpo`.

Keep the existing corner-bracket opening in `app/rescueworld.html`, the markup with the `rv`
class, exactly as it is. Its two curves, `cubic-bezier(.16,1,.3,1)` opening and
`cubic-bezier(.65,0,.35,1)` closing, are the house gesture Randy approved, and Death Stranding
has no equivalent geometric unfold — the streak is an addition to it, not a replacement for it.

**Directive 16 — build the selection reticle from the sequel's parts.** For the currently
selected site, draw a broken ring on the ground: four quadrant arcs with gaps at the cardinal
axes, four cardinal spokes each drawn as a bar, a gap, and a detached tick, and four small
stadium outlines at the diagonals. `stations.ts` already has every painter this needs — its
`ring(c, r, w, a, rot, span)` helper takes a rotation and a span, and its
`reticle(c, r, len, w, a, count, rot)` helper already draws spokes with crossbars. Compose the
selection reticle from those, in signal cyan, at a radius scaled to the site's plate size, and
rotate it into place through the existing `faceYaw()` helper so it lies flat and stays
readable. Leave its centre empty — the site marker is already there and Death Stranding's
reticle centre is empty for exactly that reason.

## 11.6 The alert feed and in-world labels — `drawFeed()` and `bands()`, build item 6

**Directive 17 — one warning is written on the ground, the rest go to the feed.** The sequel
writes the words "Warning: Armed hostiles" across the terrain in large blown-out pale type at
very low contrast, in the map plane, over the region it describes. Adopt this for exactly one
thing at a time: the current round's most consequential event gets its words written across the
affected ground in `BONE` at roughly six percent opacity, in the world plane, sized to the
region. Everything else stays in the feed at the frame edge. This satisfies the declutter rule
already recorded in `UX-REFERENCES.md` — at most one in-world label per site — and gives the
world a voice without a panel.

**Directive 18 — three type voices, enforced.** The file `app/src/design/system.ts` already
declares a `TYPE` constant with `micro: 9`, `label: 10`, `read: 13`, `tracking: "0.18em"` and
`weightLabel: 700`. Bind them to the three voices of section 5.1 explicitly: `micro` and
`label` in tracked uppercase for anything anchored to a world point; `read` in **sentence
case** for anything a person reads as language; and the masthead in tracked capitals as the
title voice. The current round line at 11.5 pixels with `.15em` tracking is already the title
voice and should stay. Do not set prose in tracked capitals to make it look technical — that is
the single most common way this aesthetic is done badly.

## 11.7 The grade — `post.ts`, build item 3

**Directive 19 — the grade already has the two artefacts that sell it, so spend them.** Death
Stranding's map screens carry a heavy chromatic split that grows toward the frame corners, a
scanline and dither texture across the whole surface, and generous bloom on the brightest
strokes. Our ported Halo Forge chain already implements all three: its grade fragment shader
computes `c * uSplit * r2 * 0.028` for the corner-weighted split, has a scanline term, has a
mid-weighted grain, and has quarter-resolution halation buffers with a five-tap Gaussian. Pick
the entry from the `LOOKS` table that maximises split and halation while keeping contrast low —
the `halation` entry is the obvious candidate — and make it the default instead of `clean`.
Judge by flicking between two looks on the same frame, which is the method `SPEC.md` build item
3 already requires.

**Directive 20 — the boundary carries the light.** On the table hologram the coastline is the
brightest object on the map, several times brighter than the fill. In `TERRAIN_F` the only edge
treatment today is a screen-independent vignette at the ground rectangle's border. Add a
coastline term: detect the data-mask boundary and draw it as a bright `BONE` stroke at roughly
twice the brightness of any contour. The Kumamoto cut is about a third sea, so this single
change gives the whole ground a defining silhouette.

## 11.8 The route cost panel — new work, build item 7

**Directive 21 — every dispatch states its cost before it is walked.** This is the sequel's
best idea and it maps onto our demonstration slice exactly, because the slice is one
scarce-resource decision. When a dispatch event is selected, the panel shows, in this order and
in this shape:

- **distance and time stacked**, the distance in the `read` type size with the estimated
  arrival beneath it in tabular type — the sequel's "167 m / 00:01:04";
- **the obstacle count** as chips: an icon plus a multiplication sign and a number for each
  kind of thing in the way, taken from the real road restrictions and landslide polygons the
  path crosses;
- **an elevation profile** of the dispatch path: a hairline band with the terrain
  cross-section as a thin `BONE` polyline, distance gridlines with their labels above the line,
  and a vertical stripe where the path crosses a blocked or hazardous segment, with the matching
  obstacle chip sitting directly above the stripe at the same horizontal position.

The stripe is drawn in the burn colour **only if** crossing that segment consumes something the
operation cannot get back; otherwise it is `BONE` at higher gain. That is the burn law applied
without softening the warning.

Our `terrain.ts` already exports `heightAt`, `heightAtLonLat` and `metersAt`, so the profile is
a sampled walk along the dispatch path and costs nothing new. The whole panel is chrome at the
frame edge, well inside the covenant's ban on charts as the subject — this is a two-centimetre
strip attached to a selection, not the primary image.

## 11.9 The layer rail — the chrome in `main.ts`, build item 6

**Directive 22 — one group open, icons right-aligned, the instruction at the foot.** Death
Stranding's filter panel gives each layer group a sentence-case name with a hairline running
right from it, a small checkbox and the words "Show/Hide" beneath the name, and the group's
item icons right-aligned in the remaining space as thin single-weight line glyphs. The active
group is a filled bar with a chevron point on its right end. At the panel's foot sits one
instruction line: "Select Icons Displayed on Map". Adopt all of it, in signal cyan for the
active group, with our layers — landslide zones, road restrictions, shelters, city model,
exercise sites — as the groups. This also satisfies the "one section open at a time" rule
already taken from the bosaiXview map in `UX-REFERENCES.md`, and the two references agreeing
is worth recording.

## 11.10 The camera — `camera.ts`, build item 6

**Directive 23 — separate "return to me" from "point north".** The sequel offers "Center on
Sam" and "Reset Orientation" as two distinct controls. `camera.ts` today has `goHome()` at 1.25
seconds and `recallBookmark()` at 0.85. Add a yaw-only reset that eases the camera to north
over about 0.6 seconds without moving the target or the distance, bound to its own key, printed
inside the control per the convention already taken from the Project PLATEAU viewer in
`UX-REFERENCES.md`. Getting lost in rotation and getting lost in position are different
problems.

**Directive 24 — the tilt is a named control.** `camera.ts` clamps pitch between 6 and 86
degrees and reaches it only through orbit drag. Add explicit tilt keys with the pitch named on
screen, so a person can say "tilt the map" and do it, as both games let them. The oblique view
stays the default; the home pose is already at 43 degrees of pitch, which is right.

---

# 12. Where Death Stranding conflicts with our locked laws

In each case the field does one thing, our law does another, the law wins, and the reason is
recorded here so nobody re-litigates it.

**Death Stranding spends warm colour on attention; our burn law spends it only on loss.** The
sequel's target reticle is orange-red because someone is being aimed at, and its route panel
puts "Risk Level" on a red field because risk is present. The burn law in
`app/src/design/system.ts` is explicit: the burn colour "is earned only by a process that
irreversibly consumes a stock it cannot recover". A risky route is not a loss. So Rescue World
marks risk with a hairline and with words, and reserves burn for the moment something is
actually gone. Directives 11 and 21 encode this.

**Death Stranding runs three or four colours at once; we have two.** The sequel's map carries
khaki terrain, slate water, brick-red casings, white routes and cyan chrome — five. Our signal
law permits exactly one operative thing per frame in the signal colour, with white, grey and
burn as the rest of the register. Every directive above that wanted a second hue resolves to
`BONE` at a different gain instead. Where Death Stranding separates two classes by hue, we
separate them by weight, by edge, or by words.

**Death Stranding's outcome screens lead with a sentence; so do we, and this one agrees.** The
Results screen's "Delivery Completed!" set larger than any number on the page is our own rule
arriving from outside. No conflict; recorded because agreement is evidence.

**Death Stranding lets labels collide; we do not.** Section 5.2 records that overlapping world
labels simply overlap. Our declutter rule — at most one in-world label per site, the older
fades, the feed holds the overflow — stands, and directive 17 restates it.

**Death Stranding's map is a menu you enter; ours is the world you are already in.** Both games
treat the map as a mode with an open and a close. Rescue World has no map mode: the world is
the map and the camera flies free through it, per build item 6 of `SPEC.md`. So section 7's
open and close transitions are adopted only as the *treatment* — depth of field for projection,
dimming for modality — and not as a mode change. There is nothing to enter.

**The scan is a reveal in Death Stranding and an interrogation here.** Sam's scan uncovers what
he did not know. Our scan fires on selection and re-states what the recorded log already
contains. It must never appear to generate new information, because the whole piece is a replay
of recorded computation and the same seed always produces the same run. Directive 6 ties the
ring to the playback tick for exactly this reason.

**The scan recreation's code is unlicensed and must not be imported.** The repository
`GameDevBuddies/Death-Stranding-Terrain-Scan` carries no licence file. Read the technique,
write our own shader. This is the same discipline `UX-REFERENCES.md` applied to the Ushahidi
platform's copyleft licence: a legal boundary, not an aesthetic one.

---

# 13. Source freshness

| Source | Its own date | When it was read here | State |
| --- | --- | --- | --- |
| Interface In Game, Death Stranding catalogue, 21 screenshots | game released 2019-11-08; catalogue undated | 2026-08-23, in a real browser | live; plain fetches are refused with code 403 |
| Steam store application 3280350, 20 screenshots | Windows release 2026-03-19 | 2026-08-23, via the store's application-details endpoint | live; five months old |
| Steam store application 1850570, Director's Cut | 2022-03-30 | 2026-08-23 | live |
| "Death Stranding Terrain Scanner", 19 seconds | uploaded 2019-11-08 | 2026-08-23, downloaded and decoded to frames | live |
| "Death Stranding 2 Plot a Route", 1:20 | uploaded 2025-06-24 | 2026-08-23, downloaded and decoded to frames | live |
| "I Tried Re-creating Death Stranding Terrain Scan", 18:46 | uploaded 2024-11-28 | 2026-08-23, chapter list and description read | live |
| The repository `GameDevBuddies/Death-Stranding-Terrain-Scan` | created 2024-11-28, last pushed 2025-01-07 | 2026-08-23, via the code host's applications interface | live; **no licence file** |
| "How to use the Marker System in the Death Stranding Map", 2:39 | uploaded 2019-11-08 | 2026-08-23, metadata confirmed | live |
| "How To Make All Icons Show On The Map", 2:17 | uploaded 2025-06-27 | 2026-08-23, metadata confirmed | live |
| Wikipedia, Death Stranding 2: On the Beach | continuously edited | 2026-08-23 | live; release facts cross-checked against the Steam store |
| The game user interface database at `gameuidatabase.com` | — | 2026-08-23 | **not read**: Cloudflare bot challenge |
| The Death Stranding wiki on Fandom | — | 2026-08-23 | **not read**: Cloudflare bot challenge |

---

# 14. What our build already does right

Recorded so that the adaptation list above is read as an extension rather than as a rebuke.
Every item here was confirmed against the current source on 2026-08-23.

**The ground is already black and the world is already a lit object in a void.** The `C.ink`
colour is `#000000`, the terrain material is the only opaque object in the scene, and
everything else is additive with depth writing off. That is Death Stranding's material model
exactly, arrived at independently.

**The palette is already inside Death Stranding's.** Our signal cyan at `#7df9ff` sits between
the game's `#29bdfe` interface cyan and its `#b9f4f9` coastline highlight. Our `BONE` constant
at `(0.85, 0.94, 1.0)` is within a few percent of the measured contour-line colour `#a0dcff`.
We do not need to change a single colour constant to match the north star; we need to change
how much of each we spend and where.

**The corner-bracket reveal is already the house gesture.** The markup with the `rv` class,
with its four condensed brackets easing and rotating out from the box centre and then revealing
the body, is closer to Randy's stated love of spin-open reveals than anything Death Stranding
does. Keep it.

**The grade is already the right grade.** The ported Halo Forge chain has corner-weighted
chromatic split, scanlines, mid-weighted grain, quarter-resolution halation and vignette — the
four artefacts that make Death Stranding's map read as a projection rather than a picture. It
only needs a different default look.

**Motion is already eased and already deterministic.** `camera.ts` uses an in-out cubic for
every flight and interpolates distance logarithmically. `stations.ts` precomputes its needle
easing per tick so scrubbing to the same tick twice gives an identical needle, and drives its
pulse from the playback tick rather than a wall clock. `post.ts` is handed the playback tick
divided by the frame rate rather than a clock, so the grain is reproducible. Death Stranding
does not have to be deterministic; we do, and we already are.

**Telemetry is already at the frame edge.** The masthead, the camera stack, the alert feed, the
mini-map and the transport bar all sit in fixed frame positions with the world full-bleed
behind them, which is our covenant's rule, the Project PLATEAU viewer's rule, and Death
Stranding's rule at once.

**The outcome is already stated as a sentence first.** The outcome block carries a verdict line
at 13 pixels above the tally, and the round face reads "round 3 of 7 · the desk counts agreeing
sources" in plain words. That is Death Stranding's Results screen discipline, already shipped.

**The world already remembers.** The residue field in `main.ts` stamps every hazard, dispatch
and outcome into two persistent channels, replays them from tick zero on any rewind, and
tone-maps both with a Reinhard curve. Death Stranding's map does not do this. We are ahead
here, and it is the covenant's rule that put us ahead.

**The single biggest gap, stated plainly.** Selecting a site, a shelter or the epicentre
currently changes nothing in the world — only the panel opens. Directives 6, 15 and 16 exist to
close that, and closing it is the change that will most obviously move the piece toward the
north star.
