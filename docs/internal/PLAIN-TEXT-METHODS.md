# Finding and fixing cryptic text in Rescue World

## What happened

Rescue World replays the first seventy-two hours after a magnitude 7.1 earthquake
struck Kumamoto Prefecture, Japan, on 28 July 2026. The screen shows eleven
moments where a real official had to decide something before anyone knew how bad
it was, and what a set of language models chose at each of those moments.

A reader opened the app and met this decision title:

> Choose the first outside fire package before a public bulletin exists

He could not say what it meant, and he was right that it does not say. It means:

> Decide which fire crews from other prefectures to send, before any public
> announcement exists.

The two sentences carry the same facts. The first one hides them behind a word,
"package", that means a bundle of crews and vehicles to a fire officer and means
a parcel or a software bundle to everybody else. Nothing on the screen tells a
reader which one is meant.

Every reviewer of that string had passed it, including the ones whose job was to
catch exactly this. That is the interesting part, and it is what this document is
mainly about: a reviewer who already knows what a string means cannot tell
whether the string says it. The knowledge that qualifies someone to review the
text is the same knowledge that blinds them to the defect.

This document has three parts. Part one is the method: what is known about
finding this failure, and the battery of tests built from it. Part two is the
audit pipeline, `app/scripts/audit-plain-text.mjs`, and what it found. Part three
is the ranked findings and the proposed rewrites.

Nothing in the app has been rewritten yet. This is the evidence the rewrite works
from.

---

## Part one: how to find prose that only insiders can read

### The failure has a shape

The defect is not bad grammar and it is not long words. Every string quoted in
this document is grammatical, and most of them are short. The defect is that the
words point at things the reader has never been shown.

Four mechanisms produce it, and they are separable:

1. **A noun stack.** English lets a writer put nouns in a row without saying how
   they relate. "Outside fire package" could be a package about fires, a package
   for fire crews, or a package of fire crews. The reader has to guess, and the
   screen never confirms the guess.

2. **A definite article on something never introduced.** "*The* first outside
   fire package" tells the reader that they should already know which package.
   They do not, so the sentence reads as though they missed a page. Mechanisms 1,
   3 and 4 are all named in the federal plain-language guidance. This one is not:
   I checked, and no federal rule covers definite articles on undefined
   referents. It is our own addition, and it is the mechanism that catches the
   string the reader actually complained about.

3. **A verb buried as a noun.** "Mobilization" instead of "send". A verb has to
   name who does it; the noun form does not, so the actor disappears. "Fire
   mobilization" never says who is mobilizing whom.

4. **A specialist term used as if it were ordinary.** "Posture", "slot", "arm",
   "aggregate", "liaison". Each is a normal English word carrying a field-specific
   meaning here, so a reader does not even know they have missed something.

The four are independent. A string can fail one and pass the rest. "The dawn
aggregate" has no noun stack and no buried verb, and it is still unreadable.

### Why readability scores do not find it

The obvious tool is a readability formula, such as Flesch-Kincaid Grade Level or
the Gunning Fog index. They are the wrong instrument here, and it is worth being
precise about why, because reaching for them would have hidden this whole problem.

Every one of those formulas computes its score from two inputs: how long the
sentences are, and how long or how common the words are. None of them looks at
whether the reader knows what a word refers to. So:

- "The dawn aggregate" scores as easy text. Three short words, one short
  sentence. It is unreadable.
- "Decide which fire crews from other prefectures to send, before any public
  announcement exists" is longer and scores as harder. It is the readable one.

The formulas would have ranked our repair as worse than our defect. They measure
a proxy for difficulty — length — and the defect here lives entirely in
reference, which length is blind to. This limitation is not a subtle one: these
formulas were built between the 1940s and the 1970s to grade school reading
material, by correlating length against comprehension scores on ordinary prose.
Applied to jargon-dense text they invert.

Karen Schriver put the proof in one sentence in 1990: "a passage will get the
same readability score whether its words are arranged in normal or backward
order." A measure that cannot tell a sentence from its own reverse cannot tell
you whether a reader knows what "package" means. The measured version of the same
point: when Zheng and Yu compared formula scores against fifteen lay readers in
2017, Flesch-Kincaid Grade Level agreed with the readers at 0.18 on encyclopaedia
articles, while the readers agreed strongly with one another. The disagreement is
in the formula, not in the humans.

`docs/COPY-CONTRACT.md` already keeps one length rule (rule 8, a 45-word sentence
cap) and it is worth keeping, because a 60-word sentence is genuinely hard. It is
just not the rule that catches this defect. Across the whole app, the length cap
fired **once**. The five detectors that ask whether a reader knows what a word
points at — `undefined-definite`, `noun-stack`, `which-x`, `undefined-jargon` and
`unglossed-name` — fired **1,385 times** between them.

### Why every human reviewer passed these strings

The name for this is the curse of knowledge: once you know something, you cannot
reconstruct not knowing it, and you systematically overestimate how obvious it is
to others. The classic demonstration is the tapping experiment — people asked to
tap out a well-known tune estimated that half their listeners would name it;
about one listener in forty did. The tapper hears the melody. The listener hears
knocking.

Every person who reviewed "outside fire package" heard the melody. They knew that
the eleven decision moments each offer a set of units, that the units at 16:27
were all from prefectures other than Kumamoto, and that "package" is what a fire
service calls such a set. Reading the string, they retrieved that knowledge
automatically and it felt like the string had supplied it.

This is why "have a careful person read it" failed, and would keep failing. It is
measurable how badly: when Lentz and de Jong asked writing experts to predict the
problems real readers had actually reported in a government brochure, the experts
"predicted less than 15% of the reader problems" and barely agreed with each
other. **Expert review recovers under a sixth of what readers trip on.** Our
reviewers were not careless. They were doing a task that does not work.

Two findings say the fix is not to try harder. Newton's tapping study included a
group who merely *knew which tune was about to be tapped* — they never tapped and
never listened — and they were just as overconfident as the tappers. Knowing the
answer is enough to produce the bias; being the author is not required. And Tullis
and Feder found in 2023 that experimentally reducing people's reliance on their
own knowledge did not improve their estimates of what others know.

So the only reliable defeat for the curse of knowledge is to put the question to a
reader who does not have the knowledge. That is the reasoning behind the second
half of the battery.

### The battery

Three tests, deliberately overlapping in what they cover and different in what
they can see.

**(a) Mechanical detectors.** Twelve rules, run over every visible string, listed
in Part two. They are fast, they run in continuous integration, and they never
get bored. They catch the four mechanisms above wherever they appear, including
in the hundreds of record-derived strings nobody was ever going to read by hand.

What they miss: meaning. A detector cannot tell that "package" means crews here.
It can only say that "package" is on a list of words we decided need defining. A
new cryptic word nobody has thought of yet passes silently.

**(b) The zero-context paraphrase test.** Take one string. Show it to a judge with
no project context — no file name, no neighbouring text, no explanation of what
Rescue World is. Ask them to say what it means in their own words. Compare their
answer against the true meaning.

A string whose honest paraphrase misses the intended meaning is cryptic. That is
the definition, and it needs no further argument: the string's whole job is to
convey that meaning to someone who does not already hold it.

This is the test that defeats the curse of knowledge, because it removes the
knowledge from the judge rather than asking the judge to ignore it. Asking a
full-context reviewer to "imagine you know nothing" does not work; that is
precisely the imaginative act the curse of knowledge prevents.

The same move is standard practice elsewhere under other names, and the method is
older than this project by decades. The United States federal plain-language
guidance carries a page specifying it: six to nine interviews, "ask the
participant to tell you in his or her own words what that section means", and "do
not correct the participant". Medicine calls it teach-back and adds the rule that
matters most for scoring: the patient must use their own words, because "if they
parrot your words back to you, they may not have understood". Usability testing
calls it a naive-user protocol. The common element is that comprehension is
measured by what the reader produces, never by asking whether they understood.

The federal guidance also records a failure with the same shape as ours. Readers
of a letter about veterans' benefits each read "service-connected disability"
differently: one thought it meant injured at work, one injured in the military but
off duty, one injured in combat. Then the part that should worry anyone who ships
text: "When each reader was asked a general question about understanding the
letter, they all said that it was clear. Yet several would have done something
other than what [the agency] wanted because they had a different definition."

Confident comprehension, divergent referents, wrong action. That is "outside fire
package", written up by a government thirty years before we shipped it.

`app/scripts/audit-plain-text.mjs --blind` prints the sheet for this test: each
flagged string alone, numbered, with a blank line for the paraphrase and nothing
else on the page.

What it misses: coverage. Judging is slow, so it runs over the worst strings
rather than all 1,176. It also cannot catch a string that is individually clear
and wrong in context.

**(c) The outsider question test.** From `docs/COPY-CONTRACT.md`: read each
sentence alone, and ask whether a technically capable stranger would ask "which
X?" about any noun. "Which package?" "Which posture?" "Which slot?" "Which
picture?"

This one sits between the other two. It is sharper than a mechanical rule because
a person applies it and can catch a word no list anticipated. It is cheaper than
a paraphrase because it asks a yes-or-no question about each noun rather than
demanding a full restatement. It is partly mechanized here as the `which-x`
detector, working from a list of container nouns — words like "package", "slot",
"unit", "moment", "picture" that stand in for a thing the writer could have
named.

### How the three fit together

| | Catches | Blind to |
|---|---|---|
| Mechanical detectors | Every occurrence, everywhere, repeatably | Whether a flagged string is actually unclear, and any cryptic word not on a list |
| Zero-context paraphrase | Real comprehension failure, including words nobody suspected | Anything not selected for judging; slow |
| Outsider question | Unnamed referents, applied by judgement | Failures that are not about a noun (buried verbs, stacked relations) |

The detectors decide *what to look at*. The paraphrase test decides *whether it is
actually broken*. The outsider question is the rule a writer keeps in their head
while fixing it.

Used alone, each one fails in a predictable way. Detectors alone produce a large
list with no sense of which entries matter — 65% of this app's strings fail at
least one detector, which is not an actionable instruction. The paraphrase test
alone cannot be run over 1,176 strings. The outsider question alone is what we
already had, and it is what missed the fire package.

### Sources

Checked 2026-08-24. Where a claim could not be verified against a primary source
it is marked, and this document then does not lean on it.

**Plain language, United States federal.** The Plain Writing Act of 2010, Public
Law 111-274, enacted 13 October 2010, defines plain writing only as writing that
is "clear, concise, well-organized". The operational rules live in the Federal
Plain Language Guidelines.

One citation warning. **plainlanguage.gov no longer serves those guidelines.**
Checked today: the domain returns a redirect to `digital.gov/guides/plain-language`,
and every deep link collapses to that one landing page. The source repository
`github.com/GSA/plainlanguage.gov` is archived and read-only as of December 2025.
The surviving guide on digital.gov keeps the hidden-verb and active-voice material
and **drops** the noun-string, definitions and abbreviation rules this document
relies on. So the guidelines are cited here from the archived repository files,
which are dated, versioned and released under Creative Commons Zero. I could not
verify any account of *why* the site was retired, and make no claim about it.

Two rules are quoted directly because the detectors implement them:

- Noun strings, from `_pages/guidelines/words/avoid-noun-strings.md`:
  "Readability suffers when three words that are ordinarily separate nouns follow
  in succession. Once you get past three, the string becomes unbearable." And the
  reason, which is exactly the failure this document is about: "many users will
  think they've found the noun when they're still reading adjectives, and will
  become confused." **Three is where the `noun-stack` detector fires, and that
  threshold is theirs, not ours.**
- Hidden verbs, from `words/avoid-hidden-verbs.md`: "A hidden verb (or
  nominalization) is a verb converted into a noun." It names the giveaway shape —
  a nominalization "placed between the words 'the' and 'of'" — and the light verbs
  that host one: *achieve, effect, give, have, make, reach, take*. Both shapes are
  implemented as the `buried-verb-frame` detector.

Two things this document does **not** get to claim from that source:

- **There is no federal rule about definite articles on undefined referents.** I
  checked all fifty guideline files; the word "article" appears normatively once,
  and only about adding prepositions to break up noun strings. The
  `undefined-definite` detector — the one that catches the fire package — is our
  own contribution, and is presented as such.
- **There is no numeric sentence-length rule in the guidelines.** Their advice is
  qualitative: "Express only one idea in each sentence." The commonly repeated
  "average 20 words" figure is not in the *Plain English Handbook* of the
  Securities and Exchange Commission (SEC) either. The 45-word cap in
  `docs/COPY-CONTRACT.md` is ours. For comparison, the Microsoft style for the
  `vale` linter uses 30 words and LanguageTool defaults to 40.

A still-live alternative with legal force is SEC Rule 421, title 17 of the Code of
Federal Regulations, section 230.421, adopted January 1998. It requires "short
sentences", "definite, concrete, everyday words", active voice and "no legal
jargon"; and at 421(b)(3) it forbids "frequent reliance on glossaries or defined
terms as the primary means of explaining information". Its note names as a defect
"vague 'boilerplate' explanations that are imprecise and readily subject to
different interpretations".

**Readability formulas and their limits.** The formulas take only surface
quantities as input — words per sentence, syllables or characters per word, and
membership of one fixed easy-word list. None has any input that could represent
whether a reader knows a referent, which is why they cannot detect this defect.

- Bruce, Rubin and Starr, "Why Readability Formulas Fail", *IEEE Transactions on
  Professional Communication* PC-24, 1981: the formulas "can account only
  indirectly for other factors that make a particular text difficult, such as …
  background knowledge required". They also record a study of naval cadets where
  Flesch Reading Ease correlated with actual understanding at **−0.65** — a strong
  correlation in the wrong direction — and warn that writing to a formula
  magnifies its errors.
- Schriver, Technical Report 41, 1990, has the one-line proof: "a passage will get
  the same readability score whether its words are arranged in normal or backward
  order."
- Zheng and Yu, *Journal of Medical Internet Research* 19(3):e59, 2017, measured
  the agreement between formulas and fifteen lay readers: Flesch-Kincaid Grade
  Level correlated **0.18** on encyclopaedia articles and **0.30** on medical
  notes, while the readers agreed strongly with each other. Their conclusion is
  that those formulas "were not appropriate to assess the readability" of the
  text.
- Jiang and Xu, "MedReadMe", arXiv:2405.02144, 2024, is the direct evidence for
  the repair: adding a single feature counting jargon spans "can significantly
  improve" existing readability formulas. The missing variable is jargon, named
  and measured.

I looked for, and did **not** find, a study measuring nominalization rate in
model-written versus human-written text, or a paper arguing that readability
formulas are invalid for evaluating model output. Neither is claimed here.

**The curse of knowledge.** Camerer, Loewenstein and Weber, *Journal of Political
Economy* 97(5), 1989, named and measured it: expertise "seem[s] more widely shared
than it is, making it difficult for people to convey their expertise to others".
Feedback did not reduce the bias in their experiments.

The tapping study is Elizabeth Newton's Stanford dissertation, *The Rocky Road
from Actions to Intentions*, 1990. (The title it is usually cited under,
"Overconfidence in the communication of intent", comes from a 2003 magazine
article and is not on the dissertation.) Tappers predicted about 50% of listeners
would name the tune; **3 of 120 did, or 2.5%**. Two details matter for our design
and are rarely quoted: listeners estimating other listeners gave 3%, so the bias
belongs only to whoever knows; and people who merely *knew which tune was coming*,
without tapping, also estimated 50%. **Knowing the answer is enough to produce the
bias — you do not have to be the author.** That is why author self-review cannot
fix this, and why the judge has to be someone else.

Pinker states the practical consequence directly (*The Sense of Style*, and "The
Source of Bad Writing", 2014): "The traditional advice—always remember the reader
over your shoulder—is not as effective as you might think… just trying harder to
put yourself in someone else's shoes doesn't make you much more accurate." His
remedy is ours: "show a draft to some people who are similar to your intended
audience and find out whether they can follow it." Tullis and Feder, *Memory &
Cognition* 51(5), 2023, add the confirming negative: experimentally reducing
people's reliance on their own knowledge did **not** improve their estimates of
what others know.

The number that explains our own failure is Lentz and de Jong, *IEEE Transactions
on Professional Communication* 40(3), 1997: experts asked to predict the problems
real readers had hit "predicted less than 15% of the reader problems… [and] showed
little mutual agreement". **Expert review recovers under a sixth of what readers
actually trip on.** Our reviewers were not careless; they were doing a task that
does not work.

**The paraphrase test is not new, and one federal example is this exact bug.** The
archived guidelines carry a whole method page,
`guidelines/test/paraphrase-testing.md`: six to nine interviews, and "ask the
participant to tell you in his or her own words what that section means… Do not
correct the participant." It also warns off the question we would otherwise have
asked: "Avoid yes or no questions."

That page documents a failure identical in shape to ours. Readers of a letter from
the Veterans Benefits Administration (VBA) each understood "service-connected
disability" differently — one thought it meant injured at work, another injured in
the military but off duty, another injured in combat. And then: "When each reader
was asked a general question about understanding the letter, they all said that it
was clear. Yet several would have done something other than what VBA wanted
because they had a different definition." Confident comprehension, divergent
referents, wrong action. That is "outside fire package".

Health literacy runs the same protocol under the name teach-back. The *Health
Literacy Universal Precautions Toolkit* of the Agency for Healthcare Research and
Quality (Tool 5, reviewed April 2024) supplies two rules this audit adopts: "'Do
you understand?' and 'Does that make sense?' are not teach-back questions.
Patients are likely to answer 'yes' whether they understand or not"; and, against
false passes, "make sure they use their own words and are not reading the material
back verbatim… If they parrot your words back to you, they may not have
understood." The same agency's 2001 review of 79 patient-safety practices ranked
"asking that patients recall and restate what they have been told" **fifth by
strength of evidence**, the only communication practice on that list.

For a pass bar with regulatory precedent, the European Commission's 2009 guideline
on medicine package leaflets requires user testing that excludes insiders
("exclude people who are directly involved with medicines such as doctors, nurses
and pharmacists"), asks participants "not to read it directly from the leaflet but
to put it into their own words", and sets the bar at **90% finding the information
and 90% of those understanding it, per question, with results not aggregated**.
It also forbids gaming: "Drafting easy or trivial questions simply with an aim of
ensuring success must not occur."

**Freshness:** every source above was checked on 2026-08-24, and the caution about
plainlanguage.gov reflects its state on that date. Every *number* about Rescue
World itself comes from this repository's own audit run, not from any outside
study, and Part two says how to reproduce it.

---

## Part two: the audit pipeline

### What it is

`app/scripts/audit-plain-text.mjs`. No dependencies, reads only, never writes.

```
node app/scripts/audit-plain-text.mjs           ranked findings, worst first
node app/scripts/audit-plain-text.mjs --json    full inventory and findings
node app/scripts/audit-plain-text.mjs --blind   the zero-context judging sheet
node app/scripts/audit-plain-text.mjs --list    the plain inventory, no verdicts
```

### What counts as a visible string

The audit that mattered was the one nobody had run: the text that reaches the
screen out of the sealed recording rather than out of the copy deck. The existing
`app/scripts/copy-lint.mjs` reads `app/src/rescueworld/copy.ts` and the page
bodies. It does not read `app/public/rescueworld-log.json`, and that is where the
fire-package title lives.

The inventory is built from five places:

1. `app/src/rescueworld/copy.ts` — the written copy deck. String literals are
   pulled out after comments are stripped, and runs joined by `+` are stitched
   back into the one sentence they were written as.
2. `app/rescueworld.html` — static text nodes, **and** `title=` and `aria-label=`
   attributes. The four layer-button tooltips had never been checked by anything,
   because `copy-lint.mjs` only walks element bodies.
3. The other viewer sources — `main.ts`, `context.ts`, `trace.ts`, `acts.ts`,
   `stations.ts`, and the run console. These hold their own private copy decks
   (`context.ts:315`, `rescueworld-console/index.ts:25`) that the copy deck never
   saw.
4. `app/public/rescueworld-log.json` — the sealed recording, at every field
   traced to a write into the page.
5. `app/public/rescueworld-highlights.json` and
   `app/public/real-response-summary.json`.

Four record fields are deliberately **not** collected, because tracing the render
path shows nothing writes them to the screen: `title` only feeds `deriveActs`
(`main.ts:1045`), `arms[].gloss` is typed at `main.ts:300` and read nowhere, and
neither `disclosure` nor `decision_context.slots{}.scoring_boundary` has any
reference in `app/src/`. Counting them would report work nobody can see.

Three record paths were found that a string audit would not have guessed:

- **Checker failure codes reach the screen raw.** `trace.ts:404` keeps each
  violation as a code followed by its detail, so the trace panel shows a viewer
  `INELIGIBLE_RESOURCE: unit-fukuoka-city-command`. Ten distinct codes render
  this way.
- **Map labels are de-slugged identifiers.** `stations.ts:228` draws
  `payload.target_feature_id` onto the canvas after replacing hyphens and
  upper-casing it.
- **Round and act banners** come from `events[].payload.story.round_label`,
  thirty-one distinct values, none of which is in any copy file.

### The detectors

| Detector | Fires on | Severity |
|---|---|---|
| `undefined-definite` | "the" or "this" on a compound noun never introduced on that surface | 5 |
| `undefined-jargon` | a term from the jargon list shown with no definition nearby | 5 |
| `noun-stack` | three or more nouns in a row (proper names excluded) | 4 |
| `unglossed-name` | an organisation named with nothing saying what it does | 4 |
| `buried-verb-frame` | "the calculation of", "make an application" — a verb wrapped in a noun | 4 |
| `hidden-verb` | a nominalization, checked against an exception list | 3 |
| `which-x` | a container noun with nothing concrete attached | 3 |
| `sentence-too-long` | over 45 words (`COPY-CONTRACT.md` rule 8) | 3 |
| `fragment-header` | a heading with no verb (rule 10) | 2 |
| `banned-vocab` | project vocabulary on screen (rule 5) | 2 |
| `contrast-construction` | "not X, but Y" (rule 7) | 2 |
| `sentence-long` | over 30 words, carrying more than one idea (rule 2) | 1 |

Four of these are implementations of published rules rather than inventions.
`noun-stack` fires at three because the federal guidance says "readability
suffers when three words that are ordinarily separate nouns follow in
succession". `buried-verb-frame` implements the two shapes that guidance names —
a nominalization sitting between "the" and "of", and a light verb hosting one.
`sentence-too-long` implements rule 8 of `docs/COPY-CONTRACT.md`. `undefined-definite`
is ours; no published rule covers it, which is worth knowing given that it is the
detector doing the most useful work here.

There is no part-of-speech tagger. The noun test is a word in none of four
curated lists — function words, adjectives, verbs, and known non-nominalizations
— which is accurate enough to act on and has no dependencies. Every list is a
judgement written down so it can be argued with; a word in the wrong list
produces a wrong finding, and the repair is to move the word.

Three precision decisions worth knowing about:

- **Proper names are not noun stacks.** "Fire and Disaster Management Agency" is
  what the organisation is called, so asking for a rewrite is asking for
  something nobody can do. Those spans are masked out of `noun-stack` and get
  `unglossed-name` instead, whose repair is a plain-words explanation beside the
  name rather than different words.
- **Hyphenated compounds skip the nominalization suffix rule.**
  "eight-municipality" ends in the same letters as a nominalization without being
  one.
- **Shader source, style rules and selectors are excluded.** A string literal in
  `main.ts` is only counted if it reads as English: no braces or angle brackets,
  and at least 15% of its tokens are ordinary grammar.

### Ranking

Findings are ranked by density, not volume: the summed severity divided by the
square root of the word count, weighted 1.6 times for titles and headings. A long
paragraph accumulates many small faults; a six-word title that leaves the reader
with nothing is the more urgent rewrite, and a title is often all a viewer reads.

### Results

```
Strings a viewer can see:      1176 distinct (1824 occurrences)
Strings failing a detector:     767  (65%)
Written copy failing:           275
Sealed-record text failing:     492  (needs a display gloss, never an edit)
```

By detector:

| Detector | Hits |
|---|---|
| `hidden-verb` | 504 |
| `noun-stack` | 497 |
| `undefined-definite` | 456 |
| `which-x` | 293 |
| `fragment-header` | 152 |
| `undefined-jargon` | 102 |
| `sentence-long` | 45 |
| `unglossed-name` | 37 |
| `banned-vocab` | 12 |
| `buried-verb-frame` | 6 |
| `contrast-construction` | 5 |
| `sentence-too-long` | 1 |

By surface, worst first: the trace panel (211), the copy deck (199), the decision
card (141), the telegraph panel (97), the other viewer sources (63), the round
banner (16), the summary (12), the page (9), the act banner (6), the map labels
(4), tooltips (4), the highlight reel (4), the masthead (1).

The shape of that table is the finding. The one rule about sentence length fired
once. The five rules about whether a reader knows what a word points at fired
1,385 times between them (456 plus 497 plus 293 plus 102 plus 37).

### The sealed-record rule

492 of the 767 failing strings live in `app/public/rescueworld-log.json` or a
file derived from it. Those bytes cannot be edited: the recording's hash has to
keep matching the certificate that recorded it, which is what makes the run
reproducible.

So the repair is a **display gloss keyed by identifier** — the pattern the app
already uses for Japanese road names at `copy.ts:770`:

```ts
roadKind(kind: string): string {
  const held: Record<string, string> = { "高速道路": "an expressway", /* … */ };
  const word = held[String(kind ?? "").trim()];
  return word ? `${word} (${kind})` : String(kind ?? "");
}
```

A lookup table maps the record's own identifier to a human label. The caller
looks the identifier up and falls back to the raw record value whenever the table
has no entry for it, so a missing entry degrades to today's behaviour rather than
to a blank. More than twenty tables in the app already work this way, including
`TAG` at `main.ts:176`, `COPY.TRACE.rule` at `copy.ts:1583`, and
`COPY.OUTCOMES.ledger.marked` at `copy.ts:1764`. The rewrite wave adds tables; it
does not touch the recording.

Every record-derived finding below therefore carries a **gloss key**: the
identifier to key the new table on.

---

## Part three: the findings

### The zero-context paraphrase results

Run over the worst strings, judging each as if I had never seen this project.
"What an outsider reads" below is the honest paraphrase, not a strawman.

| String | What an outsider reads | What it actually means | Verdict |
|---|---|---|---|
| Choose the first outside fire package before a public bulletin exists | Pick a fire-safety bundle or product before an announcement is published. Possibly about a fire that is outdoors. | Decide which fire crews from other prefectures to send into Kumamoto, before any official public announcement exists. | **Fails.** "Package" reads as a parcel; "outside fire" reads as a fire outdoors. |
| The dawn aggregate | A total of something, at dawn. No idea what is being totalled. | At dawn the first damage figures covering the whole region arrive, replacing scattered town-by-town reports. | **Fails.** Nothing survives. |
| Extreme Disaster Management Headquarters posture | A stance or attitude of an emergency office. Perhaps how it is positioned. | Open the highest of Japan's levels of national emergency command. | **Fails.** "Posture" hides that this is a choice between named legal levels. |
| Verification priority slot 1 | A numbered space for checking something. Possibly a scheduling slot. | The first town to send someone to physically check. | **Fails.** |
| Protect active rescues while turning the regional posture toward water | Guard ongoing rescues while facing the region toward water. Geographically? | Keep rescuing trapped people while moving most of the region's effort to delivering drinking water. | **Fails.** "Turning the posture toward water" is a metaphor with no referent. |
| Allocate first-night rescue support as Yatsushiro dispatch returns | Assign rescue help while a delivery comes back from Yatsushiro. | Yatsushiro's emergency call-handling system is recovering from a failure; decide which crews to send to the collapsed paper mill. | **Fails.** "Dispatch returns" reads as a shipment returning. |
| Decide whether the first-night defense request needs a maritime second channel | Decide if a defense request needs a sea route or a second radio channel. | The governor is asking the army for help; decide whether to ask the navy separately as well. | **Fails.** |
| The response changes legal gear | The reply shifts into a different legal mode. Unclear what changes. | The government switches to stronger emergency powers under a different law. | **Fails.** |
| Mission priority token 1 | A game token? A security token for a mission? | The first of three jobs the division commits to protecting. | **Fails.** |
| INELIGIBLE_RESOURCE: unit-fukuoka-city-command | A software error. Something is not allowed. | The model picked a unit this moment did not offer. | **Fails.** This is a machine's words about a machine's identifier, shown to a person. |
| Respond to the first-night shelter load using prefecture aggregates only | React to the weight or burden of shelters using regional sums. | Thousands are sleeping in evacuation shelters; you have only region-wide totals, so choose two actions covering the whole prefecture. | **Fails.** |
| Place the first two municipal liaison pairs using the complete 18:10 picture | Position two pairs of town contacts using a photograph taken at 18:10. | Send the first two pairs of government officers into two town halls, using everything known at 18:10. | **Fails.** "Picture" reads as an image. |

Twelve of twelve fail. That is the measurement: these strings do not convey their
meaning to a reader who does not already hold it.

Two strings passed the same test and are worth naming as the standard the rewrite
should hit. Both are from the written copy deck, and both were written to the
copy contract:

- "The desk keeps the largest number for each site." (`copy.ts:139`)
- "A version without a second source cannot send teams." (`copy.ts:147`)

### The ranked rewrites

Sixty-five rewrites, grouped by family. Record-derived rows name the gloss key to
build the table on. **None of these have been applied.**

#### A. The eleven decision titles

Shown on the right-hand decision list (`main.ts:3185`), the trace panel head
(`main.ts:2290`), the closing ledger (`main.ts:5019`), the debrief
(`main.ts:4834`) and the billboards. Record path
`events[].payload.decision_slot.title`. These are the highest-value strings in
the app: they are the headline of every decision moment.

| # | Gloss key | Now | Proposed |
|---|---|---|---|
| 1 | `slot-01-early-fire-mobilization` | Choose the first outside fire package before a public bulletin exists | Decide which fire crews from other prefectures to send, before any public announcement exists |
| 2 | `slot-02-missing-telemetry-triage` | Decide what to verify when two high-risk towns have no received intensity | Two towns sent no shaking measurement at all. Decide which one to check first |
| 3 | `slot-03-defense-request-scope` | Decide whether the first-night defense request needs a maritime second channel | The governor is asking the army for help. Decide whether to ask the navy separately as well |
| 4 | `slot-04-first-municipal-liaisons` | Place the first two municipal liaison pairs using the complete 18:10 picture | Send the first two pairs of government officers into two town halls, using everything known at 18:10 |
| 5 | `slot-05-escalation-minute` | Choose the national and fire escalation posture before casualty counts exist | Decide how serious to call this nationally, and whether to ask for fire crews or order them, before any injury count exists |
| 6 | `slot-06-first-night-response-split` | Split the known first-night response between two reported collapse sites | Divide tonight's rescue crews between two collapsed buildings with people trapped inside |
| 7 | `slot-07-shelter-load-triage` | Respond to the first-night shelter load using prefecture aggregates only | Thousands are sleeping in evacuation shelters and you have only region-wide totals. Choose two actions covering the whole prefecture |
| 8 | `slot-08-degraded-dispatch-rescue` | Allocate first-night rescue support as Yatsushiro dispatch returns | Yatsushiro's emergency phone system is coming back after failing. Decide which crews to send to the collapsed paper mill |
| 9 | `slot-09-push-water-planning` | Plan additional water support without waiting for every municipality to request it | Send more drinking-water trucks to towns before those towns formally ask for them |
| 10 | `slot-10-rescue-water-turn` | Protect active rescues while turning the regional posture toward water | Keep the rescues going while moving most of the region's effort to delivering drinking water |
| 11 | `slot-11-aftershock-reprioritization` | Reprioritize two safety checks after the second-night aftershock | A strong aftershock hits on the second night. Choose the two places to check for safety first |

#### B. The eleven deciders

Shown beside every decision (`main.ts:3192`, `trace.ts:908`, `main.ts:5026`).
Record path `events[].payload.decision_slot.decider`.

Two problems here. The organisations are named with nothing saying what they do,
and two of them use the initials MLIT, which the glossary expands and the screen
never does. Separately, the word "Modeled" is how the app marks a desk that was
**invented for the exercise** rather than taken from the public record, and it
reads as noise. That one is an honesty failure, not only a style failure.

| # | Gloss key | Now | Proposed |
|---|---|---|---|
| 12 | `slot-01…` | Commissioner, Fire and Disaster Management Agency | The head of Japan's national fire and disaster agency |
| 13 | `slot-02…` | Modeled prefectural information triage desk | A stand-in prefecture desk that sorts incoming reports. This desk is invented for the exercise; the public record names no real one |
| 14 | `slot-03…` | Governor of Kumamoto | Keep as written |
| 15 | `slot-04…` | Kyushu Regional Development Bureau, MLIT | The national government's roads and rivers office for the Kyushu region |
| 16 | `slot-05…` | Prime Minister and Commissioner, Fire and Disaster Management Agency | Japan's Prime Minister, with the head of the national fire and disaster agency |
| 17 | `slot-06…` | Kumamoto Prefecture disaster headquarters with Emergency Fire Response Team command support | The Kumamoto Prefecture disaster office, advised by the national team that directs fire crews sent in from other prefectures |
| 18 | `slot-07…` | Modeled prefectural shelter coordination desk | A stand-in prefecture desk that runs the evacuation shelters. This desk is invented for the exercise |
| 19 | `slot-08…` | Yatsushiro fire headquarters with Emergency Fire Response Team command support | The Yatsushiro city fire office, advised by the national team that directs crews sent in from other prefectures |
| 20 | `slot-09…` | Japan Water Works Association coordinating with MLIT and the Self-Defense Forces | The national association of water utilities, working with the government's roads ministry and the armed forces |
| 21 | `slot-10…` | Ground Self-Defense Force 8th Division with Kumamoto Prefecture | The army's 8th Division, working with Kumamoto Prefecture |
| 22 | `slot-11…` | Modeled prefectural operations triage desk | A stand-in prefecture desk that decides what gets checked first. This desk is invented for the exercise |

#### C. The sixteen invented resource labels

Shown on decision cards, trace plan lines and the telegraph panel
(`trace.ts:314`, `main.ts:5479`). Record path
`decision_context.resource_labels{}.label`. Each is a thing the model could
choose; a reader who cannot tell what the options are cannot follow the decision.

| # | Gloss key | Now | Proposed |
|---|---|---|---|
| 23 | `modeled-verification-priority-01` | Verification priority slot 1 | First town to send someone to check |
| 24 | `modeled-verification-priority-02` | Verification priority slot 2 | Second town to send someone to check |
| 25 | `mlit-municipal-liaison-pair-01` | MLIT municipal liaison pair 1 | First pair of roads-ministry officers sent into a town hall |
| 26 | `mlit-municipal-liaison-pair-02` | MLIT municipal liaison pair 2 | Second pair of roads-ministry officers sent into a town hall |
| 27 | `modeled-national-extreme-hq-posture` | Extreme Disaster Management Headquarters posture | Open the highest level of national emergency command |
| 28 | `modeled-national-emergency-hq-posture` | Emergency Disaster Management Headquarters posture | Open the second-highest level of national emergency command |
| 29 | `modeled-fdma-request-posture` | Continue fire mobilization by request | Keep asking other prefectures to send fire crews |
| 30 | `modeled-fdma-instruction-posture` | Switch fire mobilization to instruction | Order other prefectures to send fire crews instead of asking |
| 31 | `modeled-shelter-monitoring-action` | Prefecture-wide shelter load monitoring action | Watch how full the shelters are across the whole prefecture |
| 32 | `modeled-wide-area-evacuation-action` | Wide-area evacuation coordination action | Move evacuated people out across a wider area |
| 33 | `modeled-shelter-water-priority-action` | Shelter water-priority coordination action | Give the shelters first call on drinking water |
| 34 | `modeled-aftershock-priority-01` | Aftershock safety verification priority 1 | First place to re-check after the aftershock |
| 35 | `modeled-aftershock-priority-02` | Aftershock safety verification priority 2 | Second place to re-check after the aftershock |
| 36 | `modeled-mission-priority-01` | Mission priority token 1 | First job the division commits to protecting |
| 37 | `modeled-mission-priority-02` | Mission priority token 2 | Second job the division commits to protecting |
| 38 | `modeled-mission-priority-03` | Mission priority token 3 | Third job the division commits to protecting |

#### D. The ten checker failure codes

Shown in the trace panel (`trace.ts:404`, rendered at `main.ts:2325`) as a raw
code followed by its detail, and again in the reasons popover (`main.ts:2256`).
The gloss key is the violation code itself. These are the sharpest finding in the
audit: the app tells a viewer why a model's answer failed, in the checker's own
machine vocabulary.

| # | Gloss key | Now | Proposed |
|---|---|---|---|
| 39 | `INELIGIBLE_RESOURCE` | INELIGIBLE_RESOURCE: unit-fukuoka-city-command | It picked a unit this moment did not offer: the Fukuoka City command support unit |
| 40 | `INELIGIBLE_TARGET` | INELIGIBLE_TARGET: Kumamoto-incident-area | It picked a place this moment did not offer: the Kumamoto incident area |
| 41 | `CONSTRAINT_QUANTITY` | CONSTRAINT_QUANTITY: quantities sum to 25, exceeding maximum 22 | It sent 25 water trucks when only 22 existed |
| 42 | `CONSTRAINT_RESOURCE_CAPACITY` | CONSTRAINT_RESOURCE_CAPACITY: jwwa-additional-water-truck-pool quantity 25 exceeds capacity 22 | It asked for 25 water trucks from a pool that holds 22 |
| 43 | `MISSING_REQUIRED_UNKNOWN` | MISSING_REQUIRED_UNKNOWN: unknown-1627-internal-payload | It never said out loud that the agency's internal alert is not public |
| 44 | `CUTOFF_INVALID_OBSERVATION` | CUTOFF_INVALID_OBSERVATION: observation-1627-internal-trigger | It used a report that had not arrived yet when the deadline passed |
| 45 | `CUTOFF_INVALID_FACTOR` | CUTOFF_INVALID_FACTOR: observation-1627-internal-trigger | It weighed a report that had not arrived yet when the deadline passed |
| 46 | `NO_SUPPORTING_OBSERVATION` | NO_SUPPORTING_OBSERVATION: no decision factor has role SUPPORTS | It named no report that backed its own choice |
| 47 | `FACTOR_SET_MISMATCH` | FACTOR_SET_MISMATCH: decision factors and used observations differ | The reports it listed and the reports it weighed are not the same set |
| 48 | `UNKNOWN_ID_OUTSIDE_SLOT` | UNKNOWN_ID_OUTSIDE_SLOT: unknown-precise-magnitude | It named an unknown belonging to a different moment |

#### E. The worst round and act banners

Shown as the narration line (`main.ts:6328`) and the act card (`main.ts:4148`).
Record paths `events[].payload.story.round_label`, `acts[].label` and
`acts[].story`.

| # | Gloss key | Now | Proposed |
|---|---|---|---|
| 49 | `round-14-dawn-aggregate` | The dawn aggregate | At dawn, the first region-wide damage figures arrive |
| 50 | `round-09-first-night-posture` | The first-night posture locks in | The response settles into the shape it will hold all night |
| 51 | `round-13-midnight-picture` | The midnight picture | What was known at midnight |
| 52 | `round-08-escalation` | The response changes legal gear | The government switches to stronger emergency powers |
| 53 | `round-22-centre-of-gravity` | The centre of gravity turns | Most of the effort shifts from rescue to water |
| 54 | `round-12-night-coordination` | The night coordinates | Through the night, the agencies line up their plans |
| 55 | `round-25-seventy-two-hour-day` | The seventy-two-hour day | The day the seventy-two-hour survival window runs out |
| 56 | `round-05-local-network-forms` | The local network forms | Nearby fire departments start working as one |
| 57 | `round-24-water-network-expands` | The water network expands | More towns join the water-delivery run |
| 58 | `act-4-the-turn` | Active rescues continue as the centre of gravity turns toward water and one final search meets the seventy-two-hour boundary. | Rescues carry on while most of the effort shifts to delivering drinking water, and one last search runs up against the seventy-two-hour mark. |

#### F. Written copy — rewrite in place, no gloss needed

These are in source files and can simply be edited.

| # | Where | Now | Proposed |
|---|---|---|---|
| 59 | `app/rescueworld.html:1072` | The decision rail | The decisions, in order |
| 60 | `app/src/rescueworld/copy.ts:1301` | The agent trace | How the agent decided |
| 61 | `app/src/rescueworld/copy.ts:1179` | The seventy-two hours | The first seventy-two hours |
| 62 | `app/src/rescueworld/copy.ts:1385` | The evidence-table desk, corrected | The desk that checks sources, after its mistake was fixed |
| 63 | `app/src/rescueworld/context.ts:331` | designated shelters · status unknown in event | official shelters · this recording does not say whether they were open |
| 64 | `app/src/rescueworld-console/index.ts:206` | The development server refused the request. | The page that starts a new run did not answer. |
| 65 | `app/src/rescueworld/main.ts:2604` | the ministry's own field, normalized without implying second precision | the ministry's own wording, tidied but not made more precise than it was |

### What to do with the rest

The 767 failing strings are not 767 separate rewrites. They cluster:

- **492 record-derived strings** collapse into roughly eight gloss tables, keyed
  on the decision-slot identifier, the resource identifier, the target
  identifier, the round identifier, the act identifier, the milestone
  identifier, the violation code, and the configuration identifier. Families A
  to E above cover the tables that carry the most weight.
- **The 211 trace-panel strings** are dominated by the 179 that come from
  `choices[].decision.short_reason` — prose written by the models themselves at
  run time and sealed into the recording. It cannot be rewritten and should not
  be: it is evidence of what the model said. It should be *framed*. The panel
  needs a line saying these are the model's own words, so a reader does not
  mistake model prose for the app's voice.
- **The 275 written-copy strings** are mostly in the copy deck and are already
  the best-written text in the app. Most of their hits are a single
  low-severity detector on an otherwise clear sentence.

### Recommended order

1. Family A, the eleven decision titles. Highest value, smallest change, and the
   direct answer to the complaint that started this.
2. Family D, the ten failure codes. Machine output shown to a person.
3. Family C, the sixteen invented resource labels, and family B, the eleven
   deciders — including making "Modeled" say "invented for this exercise", which
   is an honesty repair.
4. Families E and F.
5. Add the trace-panel framing line for model-written prose.
6. Re-run `node app/scripts/audit-plain-text.mjs`, then re-run `--blind` over the
   new strings with a judge who has not seen this document.

The last step is the one that matters. A rewrite reviewed only by the people who
wrote it reproduces the original failure exactly.

---

## Part four: what was applied, 2026-08-24

Part three said none of the rewrites had been applied. They have been now. This
part records what was done, what it cost, and the two places where the repair had
to stop and ask.

### The result

```
node app/scripts/audit-plain-text.mjs

Strings a viewer can see:      1245 distinct
Record strings shown glossed:  463   (app/src/rescueworld/gloss.ts)
Strings failing a detector:    0
Explained passes:              204
```

767 failing strings became 0 failing and 204 explained. The inventory grew from
1176 to 1245 because the audit had been skipping any short label with no grammar
words in it. "Japan Meteorological Agency update 0" had never been checked by
anything, and the prose test now judges a short run of ordinary words as the
label it is. An explained pass is a
string a detector fires on that is right as it stands, and every one carries a
reason naming the string, the detector, and the line of code or gate that pins
it. The reasons are printed by the audit itself and are listed below.

### The gloss layer

`app/src/rescueworld/gloss.ts` holds twenty-one tables from the recording's own
identifiers to the sentences a viewer reads. Nothing writes to
`app/public/rescueworld-log.json`; its hash still matches the certificate the run
recorded. Every lookup falls back to the recording's own words when a table has
no entry, so a later recording with a new identifier degrades to today's
behaviour rather than to a blank.

| Table | Entries | Record path |
|---|---|---|
| `SLOT_TITLE` | 11 | `events[].payload.decision_slot.title` |
| `DECIDER` | 11 | `events[].payload.decision_slot.decider` |
| `SLOT_TASK` | 11 | `events[].payload.decision_slot.task` |
| `HISTORICAL_SUMMARY` | 11 | `…decision_slot.historical_choice.summary` |
| `HISTORICAL_UNKNOWN` | 15 | `…historical_choice.unknowns[]` |
| `ASSUMPTION` | 14 | `…decision_slot.assumptions[]` |
| `REQUIRED_UNKNOWN` | 20 | `decision_context.slots{}.required_unknowns[]` |
| `OBSERVATION` | 41 | `…known_observations[].plain_text` |
| `OBSERVATION_CAVEAT` | 11 | `…known_observations[].caveat` |
| `RESOURCE_LABEL` | 33 | `decision_context.resource_labels{}.label` |
| `TARGET_LABEL` | 3 | `decision_context.target_labels{}.label` |
| `ROUND_LABEL` | 31 | `events[].payload.story.round_label` |
| `ACT_LABEL`, `ACT_STORY` | 4, 4 | `acts[].label`, `acts[].story` |
| `MILESTONE_HEADLINE` | 58 | `events[].payload.headline` |
| `MILESTONE_DETAIL` | 60 | `events[].payload.detail` |
| `SUMMARY_TASK_LINE`, `SUMMARY_HISTORICAL` | 4, 5 | the derived summary file |
| `SUMMARY_LABEL` | 32 | names in both derived files |
| `REEL_CAPTION` | 3 | `reel[].caption` in the derived reel file |

`STRIP_CAPTION` is declared and empty. Its two render sites read through it, so a
plainer wording can be dropped in without touching the viewer, and the entry it
would hold is the one waiting on the board.

The eleven decision titles, the eleven deciders and the sixteen invented resource
labels were applied from the tables in part three. Seven of them moved a word or
two, because a detector was right about the reviewed proposal: "before any public
announcement exists" became "before anyone has announced anything in public",
"Yatsushiro's emergency phone system" became "Yatsushiro's system for sending
crews", and five more of the same size. Each of those deviations is listed in
amendment 16 of `docs/rescueworld/theater-copy.md`.

### The detector repairs

Running the reviewed rewrites through the detectors found the detectors wrong 38
times out of 65, and every one of those was a word in the wrong list — exactly
the failure the lexicons were written to invite an argument about. The repairs:

- **Forty-one verbs were missing**, so they counted as nouns and built stacks
  nobody wrote. "Divide tonight's rescue crews" was reported as a three-noun
  stack because `divide` was not in the verb list.
- **Twenty-nine adverbs, particles and reflexive pronouns were missing** from the
  function-word list, so they extended a noun run instead of ending it.
- **Twenty-eight compound adjectives were missing** from the adjective list:
  "region-wide", "second-highest", "stand-in", "collapsed".
- **A comma did not end a noun run.** "Uki, Yatsushiro, Hikawa" was a three-noun
  stack. It is a list of three towns.
- **A masked proper name did not end a noun run either.** The mask was dropped
  from the token list before the run was measured, so the words on either side of
  a masked name joined into one stack.
- **The tokenizer split on letters with diacritics.** "Kōsa Town" became the three
  tokens "k", "sa" and "town", and a two-word place name was reported as a
  heading with no verb. The scenario is Japanese; this mattered a lot.
- **A word doing a verb's job fired the container-noun rule.** "Water trucks set
  out" was asked "which set?".
- **A capitalised name fired the project-vocabulary rule.** "Japan's Disaster
  Relief Act" was read as this project's word for a stretch of the seventy-two
  hours.
- **The heading rule could not see a verb inside a hyphenated compound**, so
  "First place to re-check after the aftershock" was called a fragment.
- **`intensity` and `association` were reported as buried verbs** by the suffix
  rule. Neither is one.
- **Three record fields and four derived fields were being collected that nothing
  writes to the screen**, including every `historical_overlap.historical_summary`
  and every `example.resources[].label`. Counting them reported work nobody can
  see.

The audit also gained three things it needed to be a gate: `--probe` for trying
one sentence before writing it, the explained-pass list, and a non-zero exit when
any string still fails.

### The nine explained passes, and why each one stands

| Reason | Strings | Why |
|---|---|---|
| `model-written-reason` | 173 | The model wrote the sentence itself at run time and the recording sealed it. It is evidence of what the model said. The trace panel labels it as the model's own words instead. |
| `checker-code-never-on-screen` | 10 | `trace.ts` replaces every checker code with a plain sentence before anything is drawn. The raw code is kept in the trace model for the gate scripts only. |
| `contract-sentence-shown-word-for-word` | 8 | The two sentences beside an eight-try strip must be the frozen contract's own words, which `verify-rescueworld-space-data.mjs:71` and `:72` assert. A gloss would break the proof that the viewer did not reword them. |
| `gate-asserted-method-name` | 2 | "A correction" is the name of the third way of working, and the frozen result is reported as 34 of 40 tries with it. |
| `gate-asserted-control-line` | 2 | Two lines of the help overlay's control list, asserted word for word so a gate can prove the overlay still names the controls that exist. |
| `agreed-badge-wording` | 1 | One of the three badges a moment can wear. The story template fixes the wording and the page decides a badge's colour by comparing against it. |
| `agreed-standing-limitation` | 1 | The sentence pinned under every grade, asserted by two gates. |
| `gate-asserted-real-use` | 1 | The sentence naming where this kind of check would be used, asserted on "emergency dispatch" and "hospital handover". |
| `gate-asserted-run-console-phrase` | 1 | The replay status line, asserted on "recorded completion". The phrase was removed from the four other places it appeared. |
| `card-tag-names-a-kind` | 5 | A card tag, printed as a small chip naming the kind of source a card came from. Rule 10 is aimed at staccato headline writing, not at a two-word category chip, and each of these says plainly whether the source is real or invented. |

Two of these are asks rather than settled answers, and both are on the board.
`verify-rescueworld-agent-traces.mjs:137` looks for the words "municipal split"
in the water moment's open questions, and the plain rewrite says the same fact as
"how those roughly 22 extra water trucks were split between towns". And the strip
sentences would read better if `app/scripts/derive-rescueworld-highlights.mjs`
wrote them plainly at the source, which is a change to agree rather than to make.

### What has not been done

Step six of the recommended order stands: re-run `--blind` over the new strings
with a judge who has not seen this document. The rewrite was checked by the
mechanical detectors, by the outsider question applied while writing, and by
reading five surfaces in a real browser at 1600 by 900. That last check found ten
feed headlines the detectors had passed and a reader would have stopped at, among
them "Outside fire units start moving before a public bulletin exists" — the same
phrase family as the title that started all of this. It has not yet been put
to a reader who does not hold the knowledge. That is the test that matters, and
it is the one the people who did this work cannot run on themselves.
