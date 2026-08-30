# How Japan's disaster-response system actually answered the 2026 Kumamoto earthquake

Written 2026-08-23; source-honesty audit corrected 2026-08-23. Every source named below was read
directly between 2026-08-22 and 2026-08-23.
All clock times are Japan Standard Time, which runs nine hours ahead of Coordinated Universal Time.

## What this document is

This is a reconstruction, from public records only, of who decided what and when after the
earthquake that struck Kumamoto Prefecture at 16:27 on 2026-07-28. It exists so that an artificial
intelligence agent system can later be run through the same decision points that real people faced,
with the same information those people actually had at the moment they decided.

The document has five parts. Part 1 sets out the chain of command as it operated for this event:
which body holds which decision, on what trigger. Part 2 is the decision timeline through the first
seventy-two hours, with the information available at each moment. Part 3 collects the places where
the record shows deciders working from incomplete, stale or conflicting information. Part 4 is a
list of ten concrete decision points that are candidates for replaying an agent system through,
and that list is the handoff to whoever encodes the scenario. Part 5 names what the public record
cannot support.

## Rules this document follows

Every factual claim carries the document it came from and the date it was checked. Where a
statement is my reasoning rather than something written in a source, the sentence begins with the
word "Inference". Where the public record cannot answer a question, the document says so and names
the gap instead of filling it.

**This is not the 2016 earthquake.** Kumamoto Prefecture was struck by a well-known pair of
earthquakes in April 2016, officially named 平成28年熊本地震. That event destroyed the town of
Mashiki and killed far more people. It is a different event with a different record, and none of
the times, unit assignments or casualty figures below come from it. Where this document mentions
2016 at all, the sentence says so, and the 2016 material is used only to describe how the system
behaves in general, never to fill a 2026 timeline slot. The 2026 event's official Japanese name is
令和8年熊本地震, which translates as the Reiwa 8 Kumamoto earthquake; the Japan Meteorological
Agency assigned that name on the evening of 2026-07-28 (Ministry of Land, Infrastructure, Transport
and Tourism situation report number 2, 2026-07-28 21:50, section 5).

## The people in office at the time

The Prime Minister was Takaichi Sanae, heading the second Takaichi cabinet. The Chief Cabinet
Secretary was Kihara Minoru. The Minister of State for Disaster Management was Akama Jirō. The
Governor of Kumamoto Prefecture was Kimura Takashi. The government's own crisis log for this event
is at `https://www.kantei.go.jp/jp/kikikanri/earthquake20260728.html`, first published 2026-07-28
and last updated 2026-08-21, checked 2026-08-23.

## The event, in one paragraph

The earthquake occurred at 16:27 on 2026-07-28 in the Kumamoto district of Kumamoto Prefecture, at
a depth first reported as 10 kilometres and later revised to 16 kilometres, with a magnitude of 7.1
on the Japan Meteorological Agency scale. Two municipalities recorded the top of the Japanese
seismic intensity scale, a shindo of 7: Uki City and Hikawa Town. Yatsushiro City, Uto City, Misato
Town, Mashiki Town, Kashima Town and the southern ward of Kumamoto City recorded 6-upper. As of
2026-08-23 the Fire and Disaster Management Agency counted 38 dead in Kumamoto Prefecture, of whom
20 were in Yatsushiro City, 7 in Kashima Town, 5 in Hikawa Town, 3 in Uki City and 1 in Kōsa Town,
with one further death probably caused by the disaster and one under investigation. Housing damage
stood at 1,629 buildings destroyed, 2,258 half destroyed and 20,320 partly damaged. At its peak the
prefecture had 506 shelters open, and at a separate peak those shelters held 9,931 people. (Cabinet
Office situation report, 2026-08-23 10:00, pages 1 to 3; Fire and Disaster Management Agency report
number 60, 2026-08-23 10:00, pages 1 to 2; both checked 2026-08-23.)

The single most important fact for everything that follows is this. The two municipalities that the
first minute of official information singled out were Uki and Hikawa, the two intensity-7 readings.
They account for 8 of the 36 deaths whose location is known. Yatsushiro City, reported one step
lower at 6-upper, accounts for 20. Kashima Town, whose seismic intensity was **not received at all**
in the bulletins that evening, accounts for 7. Three quarters of the deaths fell outside the signal
that the first allocation decisions were made on.

---

# Part 1. The chain of command, as it operated for this event

Japan's disaster response is not a single hierarchy. It is a set of parallel chains that each begin
at a different trigger and converge on the prefectural and national coordination bodies. The
governing statute is the Disaster Countermeasures Basic Act (災害対策基本法, Act No. 223 of 1961),
read here from the government legal database at `laws.e-gov.go.jp`, law identifier
`336AC0000000223`, checked 2026-08-23.

## 1.1 The Japan Meteorological Agency: the alert, and nobody's permission needed

The agency issues earthquake and tsunami information on its own authority, automatically, without
waiting for anyone. It does not order anything and it does not deploy anyone. Its output is the
trigger that every other chain reads.

For this event it issued seven bulletins about the main shock. Their publication times, taken
directly from the agency's own machine-readable feed at
`https://www.jma.go.jp/bosai/quake/data/list.json` and the linked detail documents, fetched
2026-08-23, were:

| Time published | Document type | What it added |
|---|---|---|
| 16:28:48 | 震度速報, Seismic Intensity Bulletin | Intensity by region only. Kumamoto district: 7. Amakusa and Ashikita district: 6-lower. |
| 16:29:03 | 震度速報 | Same regional picture, refined. |
| 16:30:03 | 震度速報 | Same. |
| 16:31:03 | 震度速報 | Region list widened to Saga, Ehime, Yamaguchi, Tottori, Shimane, Okayama, Hiroshima and Kōchi. |
| 16:31:48 | 震源・震度に関する情報, Hypocentre and Intensity Information | First municipality-level list. Magnitude 7.1, depth 10 kilometres, both provisional. Notes that an Earthquake Early Warning is in force and a tsunami advisory is in effect. |
| 16:35:28 | 震源・震度に関する情報, second issue | Same municipality list. |
| 20:30:23 | 顕著な地震の震源要素更新のお知らせ, Notice of Revision of Hypocentre Parameters | Depth revised from 10 to 16 kilometres, position refined to 32 degrees 37.5 minutes north, 130 degrees 40.7 minutes east. |

The tsunami advisory for the Ariake Sea and the Yatsushiro Sea was issued at 16:29 and cancelled at
18:10 (Fire and Disaster Management Agency report number 60, section 1; Cabinet Office situation
report 2026-07-29 07:00, section 1; both checked 2026-08-23).

The agency also held press conferences at its headquarters at 17:30 and again at 20:30 on
2026-07-28, and stood up its own disaster headquarters at 21:00 (Ministry of Land situation reports
1 and 2, sections 5).

**The decision the agency owns:** what to publish, and when to revise it. **Its trigger:** the
seismometer network, automatically. **What it cannot do:** order an evacuation, or ask anyone to
move.

## 1.2 Municipalities: the only body that can order people to leave

Article 60 of the Disaster Countermeasures Basic Act gives the evacuation power to the mayor of a
municipality and to nobody else. Paragraph 1 lets the mayor instruct residents of an area the mayor
judges necessary to leave for evacuation. Paragraph 3 lets the mayor instead instruct emergency
safety measures, meaning moving to high ground, taking shelter in a nearby solid building, or
moving away from windows, when leaving would itself be dangerous; this is the level-5 order,
緊急安全確保. Paragraph 4 obliges the mayor to report the order to the prefectural governor
promptly. Paragraph 6 lets the governor act in the mayor's place, but only once the municipality has
become unable to perform all or most of its business.

Article 23-2 lets a mayor set up a municipal disaster management headquarters when the municipal
disaster prevention plan provides for it. The mayor chairs it.

Sixteen headquarters in Kumamoto Prefecture published a setup time to the prefecture's own disaster
information portal. Taken from
`https://portal.bousai.pref.kumamoto.jp/data/headquarter/headquarter.json` by way of the event
open-data portal at `https://odcs.bodik.jp/kumamoto-r8/`, fetched 2026-08-23, and deduplicated:

| Time | Body |
|---|---|
| 16:27 | Kumamoto Prefecture; Yatsushiro City; Nishiki Town; Yunomae Town |
| 16:30 | Hikawa Town |
| 16:35 | Uki City; Reihoku Town |
| 16:38 | Nishihara Village |
| 16:40 | Hitoyoshi City |
| 16:55 | Mifune Town |
| 17:00 | Misato Town; Nagomi Town; Ōzu Town; Mashiki Town |
| 17:25 | Uto City |
| 18:00 | Kumamoto City |

Kashima Town and Kōsa Town, between them eight of the deaths, published no headquarters setup time
to that feed at all.

**The decision municipalities own:** evacuation orders, shelter openings, and the first damage
report upward. **Their trigger:** their own local plan, which normally keys off seismic intensity
and off what the fire service tells them. **What they cannot do:** call in the Self-Defense Forces
directly.

## 1.3 Kumamoto Prefecture: coordination, and the request for the Self-Defense Forces

Article 23 of the Basic Act lets the governor set up a prefectural disaster management
headquarters, which the governor chairs. Kumamoto Prefecture recorded its headquarters as
established at 16:27, the minute of the earthquake (Cabinet Office situation report 2026-07-29
07:00, section 6; prefecture disaster portal headquarters feed, checked 2026-08-23). Nagasaki
Prefecture did the same at the same minute and abolished its headquarters on 2026-07-31 at 00:00
(Fire and Disaster Management Agency report number 60, section 4).

Two further decisions sit with the prefecture and matter more than the headquarters itself.

The first is the request for military assistance. Article 83 paragraph 1 of the Self-Defense Forces
Act (自衛隊法, Act No. 165 of 1954, read from `laws.e-gov.go.jp` law identifier `329AC0000000165`,
checked 2026-08-23) says that a prefectural governor and other persons specified by cabinet order
may request the dispatch of units from the Minister of Defense or a person the Minister designates,
when the governor judges it necessary to protect life or property. Paragraph 2 lets the Minister or
the designee dispatch units, and adds a proviso: when the situation is especially urgent and there
is no time to wait for the request, units may be dispatched without one.

For this event the Governor of Kumamoto made the request at 17:30 on 2026-07-28, one hour and three
minutes after the earthquake. The request went not to the Minister but to the Commander of the 8th
Division of the Ground Self-Defense Force, a designated recipient, and was received at the same
moment. The activities requested were information gathering, life-saving, supply transport and
living support. The Ministry of Defense wrote it this way in its own release of 2026-07-28:

> 同日（２８日）１７３０、熊本県知事から陸上自衛隊第８師団長（北熊本・熊本）に対し、情報収集、
> 人命救助、物資輸送、生活支援等に係る災害派遣要請があり、同時刻受理。

As of 2026-08-23 the dispatch had no withdrawal date; the withdrawal column in the government's own
table reads as a dash. (Ministry of Defense Joint Staff release 2026-07-28, read from an Internet
Archive capture at
`https://web.archive.org/web/20260802000100if_/https://www.mod.go.jp/js/pdf/2026/p20260728_01.pdf`;
Cabinet Office situation report 2026-08-23 10:00, Ministry of Defense section, dispatch request
table; both checked 2026-08-23.)

There was a **second dispatch request that the national tables do not carry**. The prefecture's own
chronology, repeated in the packet for every one of its headquarters meetings, records two requests
on 2026-07-28. The version in the second meeting's packet names the receiving units:

> ○ 17時30分　陸上自衛隊第8師団への災害派遣要請
> ○ 21時00分　海上自衛隊佐世保地方隊への災害派遣要請

That is a request to the Ground Self-Defense Force 8th Division at 17:30, and a separate request to
the Maritime Self-Defense Force Sasebo District Force at 21:00. The Cabinet Office's dispatch table
lists only the first. Anyone reading the national record alone would not know the naval request
existed. (Kumamoto Prefecture disaster headquarters meeting materials,
`https://www.pref.kumamoto.jp/uploaded/attachment/315400.pdf` and
`https://www.pref.kumamoto.jp/uploaded/attachment/315507.pdf`, checked 2026-08-23.)

### The prefecture's own headquarters met eight times inside seventy-two hours

The prefecture publishes a meeting record at
`https://www.pref.kumamoto.jp/soshiki/222/274487.html`, with weather-agency material, meeting
packets, the governor's statement and verbatim minutes as separate documents for each meeting. Eight
meetings fall inside the first seventy-two hours, all in the disaster headquarters conference room
on the second floor of the prefectural disaster prevention centre:

| Meeting | Time | Note |
|---|---|---|
| 1st | 2026-07-28 20:00 | |
| 2nd | 2026-07-29 00:00 | |
| 3rd | 2026-07-29 09:30 | |
| 4th | 2026-07-29 16:00 | Municipal mayors attended, as did the Cabinet Office state minister |
| 5th | 2026-07-30 09:30 | |
| 6th | 2026-07-30 16:00 | |
| 7th | 2026-07-31 09:30 | |
| 8th | 2026-07-31 16:00 | Held jointly with the first national on-site headquarters meeting |

From the eighth meeting onward every meeting was a joint prefectural and national on-site meeting,
and from 2026-08-03 the cadence dropped to once a day at 16:00. This is the tempo an agent replay
has to match: eight decision cycles in three days, with the shortest gap being the four and a half
hours between the 20:00 and 00:00 meetings on the first night.

The second is the Disaster Relief Act. The prefecture, not the national government, decides to apply
it. Kumamoto Prefecture decided at 19:00 on 2026-07-28 to apply the Act to twenty-one
municipalities: ten cities, ten towns and one village. The Cabinet Office published the list the
same day. The cities are Kumamoto, Yatsushiro, Minamata, Yamaga, Kikuchi, Uto, Kamiamakusa, Uki,
Amakusa and Kōshi. The towns and village are Misato, Ōzu, Kikuyō, Nishihara Village, Mifune,
Kashima, Mashiki, Kōsa, Hikawa, Ashikita and Tsunagi. The legal ground cited is Article 1 paragraph
1 item 4 of the Disaster Relief Act enforcement order, which covers the case where many people are
in danger of harm to life or body. The prefecture's own papers show the decision was taken in two
pieces, twenty municipalities together and Kumamoto City separately, both effective 2026-07-28.
(Notice at `https://www.bousai.go.jp/pdf/260728.pdf`, dated 2026-07-28; the 19:00 decision time comes
from the disaster management minister's statement in the minutes of the first national headquarters
meeting at `https://www.bousai.go.jp/updates/r8kumamoto_jishin/pdf/r8kumamoto_dai1kai_giji.pdf`; the
two-piece decision from the prefecture's second and fourth meeting packets,
`https://www.pref.kumamoto.jp/uploaded/attachment/315400.pdf` and `.../315507.pdf`; all checked
2026-08-23.)

The prefecture also requested disaster medical assistance teams from every prefecture in Kyushu on
2026-07-28 (Cabinet Office situation report 2026-07-29 07:00, medical section).

**The decisions the prefecture owns:** requesting the Self-Defense Forces; applying the Disaster
Relief Act; coordinating between municipalities; passing the aggregated picture upward. **Its
trigger:** its own plan, plus what municipalities report to it under Article 53.

## 1.4 The national government: three tiers of headquarters, and which one was used

The Basic Act defines three national headquarters, in ascending order of severity. Article 23-3
creates a Specified Disaster Management Headquarters for a disaster not severe enough to count as
an extreme one. Article 24 creates an Extreme Disaster Management Headquarters (非常災害対策本部)
when a disaster is severe and there is a special need to push forward emergency response. Article
28-2 creates an Emergency Disaster Management Headquarters (緊急災害対策本部) for a markedly
abnormal and severe disaster, and that one requires a cabinet decision.

For this event the government used the middle tier. The Extreme Disaster Management Headquarters
was established at 18:20 on 2026-07-28, one hour and fifty-three minutes after the earthquake.
Under Article 25 its head is the Prime Minister and its deputy heads are the Chief Cabinet Secretary
and the minister for disaster management. Its first meeting ran from 19:45 to 20:00 the same evening
in the fourth-floor large conference room of the Prime Minister's Office. Twelve meetings had been
held by 2026-08-21. (Cabinet Office situation report 2026-08-23 10:00, section 5(1); meeting index
and minutes at `https://www.bousai.go.jp/updates/r8kumamoto_jishin/taisakukaigi.html`; both checked
2026-08-23.)

The Chief Cabinet Secretary explained the choice of tier at 18:47 that evening:

> また、被害の詳細は不明ですが、高速道路被害や建物倒壊などの被害状況を踏まえ、災害対策基本法に
> 基づき、内閣総理大臣を本部長とする非常災害対策本部を設置しました。

In plain English: the details of the damage are unknown, but on the basis of expressway damage and
building collapse the government has set up an Extreme Disaster Management Headquarters headed by
the Prime Minister.

Before that, at 16:28, one minute after the earthquake and before any hypocentre information had
been published, the Prime Minister's Office set up its Response Office (官邸対策室) in the crisis
management centre, and convened an emergency gathering team of bureau-director-level officials from
the relevant ministries. At 16:29 the Prime Minister issued a written instruction in three points,
quoted here in full:

> １．早急に被害状況を把握すること
> ２．地方自治体とも緊密に連携し、人命第一の方針の下、政府一体となって、被災者の救命・救助等の
> 災害応急対策に全力で取り組むこと
> ３．国民に対し、避難や被害等に関する情報提供を適時的確に行うこと

In plain English: find out the damage quickly; work with local government as one government under a
life-first policy on rescue and emergency response; and give the public timely, accurate information
about evacuation and damage. This is the only Prime Ministerial instruction recorded for the whole
event; later direction from the Prime Minister appears as closing remarks at headquarters meetings
rather than as a numbered instruction. (Cabinet Office situation report 2026-08-23 10:00, section
5(4); Prime Minister's Office crisis log; both checked 2026-08-23.)

The first headquarters meeting adopted an eight-point implementation policy, dated 2026-07-28,
which is the closest thing the event has to a written statement of national priorities. Its points,
in plain English, are: gather information quickly and establish the damage picture; put rescue
first and spare nothing to save the missing; act ahead of events to stop the damage spreading;
secure the living environment and daily necessities of evacuees; restore electricity, gas, water,
communications and rail; give residents, the public, local government and related bodies accurate
information so they can judge and act; actively support local government with road and sea-lane
clearance and emergency repair of river, port and fishing-port facilities, and remove obstacles to
emergency measures where needed; and work across ministries on victim support. (Materials of the
first meeting at
`https://www.bousai.go.jp/updates/r8kumamoto_jishin/pdf/r8kumamoto_jishin_kaigi_1.pdf`, checked
2026-08-23.)

A Cabinet Office survey team of seven staff left for the Kumamoto prefectural office at 17:30 on
2026-07-28. A separate and more senior government survey mission, led by State Minister Tsushima of
the Cabinet Office, went to Kumamoto on 2026-07-29 and 2026-07-30. Its published itinerary put it at
the Kashima Town damage site at 11:50 and the prefectural office at 13:00 on 2026-07-29, and at
Yatsushiro City Hall at 10:30, the Yatsushiro damage sites at 11:20 and Hikawa Town Hall at 13:00 on
2026-07-30. (Cabinet Office situation report 2026-08-23 10:00, section 6(1); survey mission report
at `https://www.bousai.go.jp/pdf/260805.pdf`, dated 2026-08-05; both checked 2026-08-23.)

An on-site Extreme Disaster Management Headquarters (非常災害現地対策本部) was decided at the third
national meeting and set up at 14:00 on 2026-07-30 at the Kumamoto prefectural office, headed by
State Minister Tsushima with about 120 staff, growing to 132 by 2026-08-22. Its first meeting was at
16:00 on 2026-07-31. A separate standing body for livelihood and business recovery, the
被災者生活・生業再建支援チーム, chaired by the Deputy Chief Cabinet Secretary, met for the first time
at 17:55 on 2026-07-29 and eleven times in all by 2026-08-21. (Cabinet Office situation report
2026-08-23 10:00, sections 5(1) and 5(2); Chief Cabinet Secretary remarks of 2026-07-30 16:19 on the
Prime Minister's Office crisis log.)

Three financial and legal designations followed, all recorded with dates.

- On 2026-07-31, at the fourth headquarters meeting, the government decided to advance 61.6 billion
  yen of ordinary local allocation tax to the affected municipalities.
- On 2026-08-04 the cabinet decided to spend 24.2 billion yen from the reserve fund on push-type
  supply support, prefectural relief work and disaster restoration.
- On 2026-08-07 the cabinet decided, promulgated and brought into force in a single day both the
  government ordinance designating the event a severe disaster (激甚災害) on a nationwide basis, and
  the ordinance designating it a Specified Extreme Disaster (特定非常災害). The severe-disaster
  designation raises the state's share of restoration costs for public civil engineering works,
  farmland, and agricultural and forestry cooperative facilities, and lets small disaster bonds be
  counted into the standard financial demand. The Specified Extreme Disaster designation extends
  administrative expiry dates to 2027-01-27, excuses administrative obligations performed by
  2026-11-27, bars bankruptcy proceedings against companies until 2028-07-27, extends the period to
  accept or renounce an inheritance to 2027-03-31, and waives civil conciliation filing fees until
  2029-06-30.

(Sources: Cabinet Office severe-disaster notice at `https://www.bousai.go.jp/pdf/260807_316-1.pdf`;
Specified Extreme Disaster explanatory note at `https://www.bousai.go.jp/pdf/260807_3.pdf`; Prime
Minister's Office crisis log entries for the fourth, sixth and eighth headquarters meetings; all
checked 2026-08-23.)

**The decision the national government owns:** what tier of headquarters to stand up, and when; what
to push into the disaster area without waiting to be asked; and the financial designations. **Its
trigger:** its own judgement on the reported scale.

## 1.5 The fire service: local, national, and the mutual-aid teams

This chain is the fastest one in the whole system and the most legally interesting.

At the bottom sit the municipal and wide-area fire headquarters, who take the emergency calls and
run the first rescues. Above them sits the Fire and Disaster Management Agency, whose Commissioner
stood up the agency's own disaster headquarters at 16:27, the minute of the earthquake, under a
third-tier emergency posture. At 16:28 the agency asked every prefecture that had recorded 5-lower
or above, and separately every prefecture under the tsunami advisory, to respond appropriately and
to report damage. (Fire and Disaster Management Agency report number 60, section 7, checked
2026-08-23.)

The mutual-aid mechanism is the Emergency Fire Response Teams (緊急消防援助隊), governed by Article
44 of the Fire and Disaster Management Organization Act (消防組織法, Act No. 226 of 1947, read from
`laws.e-gov.go.jp` law identifier `322AC0000000226`, checked 2026-08-23). Three of its paragraphs
matter here.

- Paragraph 1: the Commissioner may **ask** other prefectures to take measures, when the affected
  prefecture's governor has requested it and the Commissioner judges it necessary.
- Paragraph 2: when the scale of the disaster makes it urgent and **there is no time to wait for
  that request**, the Commissioner may ask without it, notifying the affected governor promptly.
- Paragraph 5: for a large-scale disaster where a special need is recognised, the Commissioner may
  **instruct** rather than ask.

The record for this event shows both forms being used, and shows the exact moment the legal
character of the order changed. The Commissioner issued a request (求め) at 16:27, again at 17:08,
and then at 18:20 「消防庁長官から緊急消防援助隊に対して出動の指示に切り替え」, switched to an
instruction. Every later order that evening, at 20:15, 20:28 and 21:45, is recorded as an
instruction. (Fire and Disaster Management Agency report number 60, section 6(2), checked
2026-08-23.)

The 16:27 request is consistent with the paragraph 2 power to act without waiting, but the agency
report does not name the paragraph and no public record reviewed here gives the time of any separate
request from the Governor for fire mutual aid. The Governor's 17:30 Self-Defense Force request is a
different legal chain and cannot answer that question. Therefore this reconstruction does not decide
whether the 16:27 fire request used paragraph 1 or paragraph 2. The recorded switch at 18:20 to an
instruction is consistent with paragraph 5 and coincides exactly with the national Extreme Disaster
Management Headquarters standing up.

The units ordered, in order of the order:

| Time | Form | Units ordered |
|---|---|---|
| 16:27 | Request | Integrated command support unit: Fukuoka Prefecture (Fukuoka City). Command support units: Okayama Prefecture (Okayama City), Hiroshima Prefecture (Hiroshima City), Fukuoka Prefecture (Kitakyushu City). Prefectural battalions: Fukuoka, Ōita, Miyazaki. Air unit: Fukuoka Prefecture (Fukuoka City). |
| 17:08 | Request | Prefectural battalion: Saga. |
| 18:20 | Switch to instruction | — |
| 20:15 | Instruction | Air command support unit: Miyazaki. Air units: Fukuoka Prefecture (Kitakyushu City), Nagasaki. |
| 20:28 | Instruction | Prefectural battalions: Okayama, Hiroshima, Yamaguchi, Kagoshima. |
| 21:45 | Instruction | Air unit: Saga. |

By 06:00 on 2026-07-29 that amounted to nine prefectures: 340 ground units with 1,129 personnel from
eight prefectures, and three aircraft from three prefectures. (Cabinet Office situation report
2026-07-29 07:00, section 5(6), checked 2026-08-23.)

Local prefectural disaster helicopters flew on their own authority: Saga at 16:57, Nagasaki at
17:12, and Kumamoto, the affected prefecture, at 18:25, one hour and twenty-eight minutes after its
two neighbours. (Fire and Disaster Management Agency report number 60, section 5(2), checked
2026-08-23.)

**The decision the fire chain owns:** which outside fire units go, and to which municipality. **Its
trigger:** seismic intensity, read automatically at national level. Whether the 16:27 request waited
for a local request is not stated in the public record.

## 1.6 The police

The National Police Agency set up a disaster security headquarters headed by the Director-General of
its Security Bureau at 16:28, the same minute the Prime Minister's Office set up its Response
Office. At 18:20, the same minute the national Extreme Disaster Management Headquarters was
established, that police headquarters was reorganised into an Extreme Disaster Security Headquarters
headed by the Commissioner General. (Cabinet Office situation report 2026-08-23 10:00, National
Police Agency section; identical text in the 2026-07-29 07:00 report at page 24; checked
2026-08-23.)

The police also own two things nobody else does. They control traffic restrictions on their own
authority, separately from the road managers. And they run the helicopter television feed into the
Prime Minister's Office, which is how the national leadership first saw the disaster area. That feed
ran from Kumamoto between 16:43 and 18:32 on 2026-07-28, from Fukuoka between 19:09 and 20:04, and
from Kumamoto again from 06:10 on 2026-07-29. A mobile feed from Kumamoto started at 19:26.
(Cabinet Office situation report 2026-07-29 07:00, section 5(5).)

Interregional emergency rescue units deployed from 2026-07-28: 372 personnel in the security
component, drawn from eleven police forces, and 62 in the traffic component from three. The police
posture reached about 2,000 personnel by 2026-07-29, as stated by the Prime Minister at the second
headquarters meeting.

## 1.7 The Self-Defense Forces

The request side is covered above at section 1.3. On the response side, the Ministry of Defense
records that aerial reconnaissance began from 16:44 on 2026-07-28, forty-six minutes before the
Governor's request was made, building to twenty aircraft, eleven fixed-wing and nine rotary. Ground
reconnaissance ran in parallel from the 8th Reconnaissance Unit and the 4th Reconnaissance Unit. The
8th Division operated at a strength of 3,600 on the first day. Two garrisons, Beppu and Kita
Kumamoto, opened as temporary shelters and took in one and seven people respectively. (Cabinet
Office situation report 2026-08-23 10:00, Ministry of Defense section, checked 2026-08-23.)

Inference: reconnaissance beginning before the formal request is consistent with the proviso in
Article 83 paragraph 2, or with reconnaissance being treated as internal information gathering
rather than as a dispatch. The record does not state which, and I did not find a document that
resolves it.

Strength grew to about 4,600 on 2026-07-29 and to about 5,100 on 2026-07-30, and then held flat at
about 5,100 every day through 2026-08-23. Five Maritime Self-Defense Force vessels moved to
Yatsushiro Port from 2026-07-29 and four had entered the port by 2026-07-30.

## 1.8 The Japan Coast Guard

The Coast Guard acts on its own authority for maritime search, and for shore-based support once
ports are usable. On 2026-07-28 it had nine patrol vessels and one aircraft committed, issued two
navigation warnings, and reported no maritime damage. It placed five members of its Special Rescue
Team forward at the Kitakyushu base and sent liaison officers to the Kumamoto, Nagasaki and Fukuoka
prefectural offices. Two large patrol vessels were sent towards the disaster area specifically to
provide water supply, while the berths they would use were still being surveyed. (Ministry of Land
situation report 1, 2026-07-28 18:10, section 6; Cabinet Office situation report 2026-07-29 07:00,
section 5(7); checked 2026-08-23.)

From 2026-07-29 the Coast Guard ran water supply, bathing and electricity supply at Yatsushiro Port
and water supply and bathing at Misumi Port, eventually totalling 542 tonnes of water at Yatsushiro
and 2,812 bathing users. (Cabinet Office situation report 2026-08-23 10:00, Coast Guard section.)

## 1.9 The medical chain

The medical chain runs on a separate national system and its trigger is automatic. The Emergency
Medical Information System switches mode by prefecture. Kumamoto switched to disaster mode at 16:28.
Forty-eight other prefectures switched to alert mode between 16:27 and 17:03, with Hokkaido,
Kanagawa, Aomori, Chiba, Shimane, Tottori and Kumamoto all at 16:27 and Hyōgo and Kōchi last at
17:03. (Cabinet Office situation report 2026-07-29 07:00, Ministry of Health section, checked
2026-08-23.)

Disaster medical assistance teams went to automatic nationwide standby. Twelve prefectures set up
coordination headquarters for those teams on 2026-07-28: Shimane, Hyōgo, Nagasaki, Kumamoto, Saga,
Kyoto, Kagoshima, Miyazaki, Kagawa, Gunma, Fukuoka and Okinawa. Kumamoto Prefecture requested
dispatch from every Kyushu prefecture the same day. By 06:00 on 2026-07-29, 30 teams were operating
in Kumamoto, 18 on headquarters work and 12 in the field. By 06:30 on 2026-07-31 that was 56 teams
plus 19 coordination teams. Disaster psychiatric assistance teams followed the same pattern, with
seven prefectural coordination headquarters on 2026-07-28 and a nationwide standby request.
(Cabinet Office situation reports 2026-07-29 07:00 and 2026-07-31 07:30, medical sections.)

The Ministry of Health, Labour and Welfare set up an information liaison office at 16:27, upgraded
it to a disaster headquarters at 18:20, and held its first headquarters meeting at 21:15. On
2026-07-28 it asked seven prefectures to use the health, medical and welfare activity support system
for a fast response. (Cabinet Office situation report 2026-07-29 07:00, section 5(14).)

**The decision the medical chain owns:** how many teams to move and where to base them. **Its
trigger:** the intensity value, read automatically by the information system, with no request needed
to reach standby.

## 1.10 The transport ministry: roads, and the eyes on infrastructure

The Ministry of Land, Infrastructure, Transport and Tourism runs its own parallel chain, and it is
the one that produces the most granular public record of this event. Within an hour it had started
inspections on every directly managed national highway across ten road offices from Fukuoka to
Kagoshima, listed by route number. It built telephone hotlines with affected municipalities: 18
cities, 16 towns and 2 villages by 18:10, and 26 cities, 21 towns and 4 villages by 21:50. It sent
liaison officers and technical emergency control force teams. It flew its own survey helicopter,
はるかぜ号, from 18:00 to 18:40. The minister issued an instruction at 18:29 and the ministry held
its own extreme disaster headquarters meeting at 19:00. (Ministry of Land situation reports 1 and 2,
sections 3 and 4, checked 2026-08-23.)

Road closure is a decision of the road manager, which for expressways is the operating company, for
directly managed national highways is the ministry, and for prefectural roads is the prefecture. The
ministry publishes the resulting picture as a map with an embedded machine-readable layer, one per
situation report. Forty-six such maps were published for this event.

**The decision the ministry owns:** which roads close and when they reopen, where to put liaison
officers, and what to publish about it. **Its trigger:** intensity thresholds for inspection, and
inspection results for closure.

## 1.11 The education ministry: the buildings that become shelters

Schools are where most evacuees end up, so the Ministry of Education, Culture, Sports, Science and
Technology sits in the chain whether it wants to or not. It escalated three times in four hours and
twenty-three minutes on the first evening, and the ladder is worth reading because it is the same
shape as every other ministry's and it is written down precisely:

| Time | Body |
|---|---|
| 2026-07-28 16:27 | 災害情報連絡室, disaster information liaison room, headed by the counsellor for facility disaster prevention |
| 2026-07-28 18:00 | 災害応急対策本部, emergency response headquarters, headed by the Director-General of the Minister's Secretariat |
| 2026-07-28 20:10 | First meeting of that headquarters |
| 2026-07-28 20:50 | 非常災害対策本部, extreme disaster headquarters, headed by the Vice-Minister |
| 2026-07-29 09:30 | First meeting of the extreme disaster headquarters |

The ministry publishes a numbered series of its own, fifteen reports from 2026-07-28 17:00 to
2026-08-17 17:00, at `https://www.mext.go.jp/a_menu/r8kumamotojisin/index_00001.html`. The count of
schools serving as shelters in Kumamoto Prefecture ran 12 at 2026-07-29 10:00, 38 at 2026-07-29
17:00, 56 at 2026-07-30 11:00 and 56 at 2026-07-31 11:00, falling to 40 by 2026-08-13. School
closures in Kumamoto peaked at 75 on 2026-07-30. On 2026-07-29 the ministry issued a circular on
using ordinary classrooms as shelters, revised the same day to add heat-stroke prevention as a
reason.

The ministry's own decision here is about usability, and it made it by sending people. From
2026-07-29 it dispatched emergency building risk assessors to judge whether damaged school
facilities could be used, eventually 92 assessors and one structural specialist, who surveyed 187
facilities between 2026-07-29 and 2026-08-09. No report in the series states that any school
building was unusable; what the series publishes is the assessment programme, not its verdicts.
(Ministry of Education reports 1 through 5 and 14 and 15, checked 2026-08-23.)

**The decision the education ministry owns:** whether a school building may be used, and on what
terms. **Its trigger:** the intensity threshold, then a physical inspection by a qualified assessor.

## 1.12 Summary: who decides what

| Decision | Decider | Trigger | Legal basis |
|---|---|---|---|
| Issue and revise earthquake and tsunami information | Japan Meteorological Agency | Seismometer network, automatic | Meteorological Business Act |
| Order evacuation, or emergency safety measures | Municipal mayor | Municipal disaster prevention plan | Basic Act Article 60 paragraphs 1 and 3 |
| Open shelters | Municipal mayor | Municipal plan | Basic Act, relief provisions |
| Set up municipal disaster headquarters | Municipal mayor | Municipal plan | Basic Act Article 23-2 |
| Set up prefectural disaster headquarters | Governor | Prefectural plan | Basic Act Article 23 |
| Request Self-Defense Force dispatch | Governor | Governor's judgement | Self-Defense Forces Act Article 83 paragraph 1 |
| Dispatch without a request | Minister of Defense or designee | Urgency leaving no time to wait | Self-Defense Forces Act Article 83 paragraph 2 proviso |
| Move Emergency Fire Response Teams | Commissioner, Fire and Disaster Management Agency | Scale; no local request needed | Fire and Disaster Management Organization Act Article 44 paragraphs 2 and 5 |
| Apply the Disaster Relief Act | Governor | Damage thresholds | Disaster Relief Act, enforcement order Article 1 |
| Set up the national Extreme Disaster Management Headquarters | Prime Minister | Judgement on scale | Basic Act Articles 24 and 25 |
| Designate a severe disaster | Cabinet, by ordinance | Damage assessment | Severe Disaster Act |
| Close and reopen a road | The road manager for that road | Inspection result | Road Act |
| Move disaster medical teams | Prefecture requesting, home prefectures dispatching | Automatic standby on intensity | Medical framework, not the Basic Act |
| Judge whether a damaged school may be used | Ministry of Education, through emergency building risk assessors | Intensity threshold, then physical inspection | Building Standards Act assessment scheme |

---

# Part 2. The decision timeline, first seventy-two hours

Each entry gives the time, the deciding body, the decision, what information was available at that
moment, and the source. Times with seconds come from machine-readable feeds; times without come from
published situation reports and are as precise as those reports are.

## Day 1, 2026-07-28: from the shaking to the first national meeting

**16:27:15, the earthquake.** Origin time from the Japan Meteorological Agency event page
`https://www.data.jma.go.jp/eqev/data/kyoshin/jishin/2607281627_kumamoto/`. Nothing has been
published yet.

**16:27, Fire and Disaster Management Agency: stand up the national fire headquarters and start
moving outside fire units.** The Commissioner established the agency's disaster headquarters under a
third-tier emergency posture, and in the same minute issued a request to mobilise to the integrated
command support unit from Fukuoka City, command support units from Okayama City, Hiroshima City and
Kitakyushu City, prefectural battalions from Fukuoka, Ōita and Miyazaki, and an air unit from
Fukuoka City. *Information available:* the earthquake had happened; the first intensity bulletin was
still one minute and thirty-three seconds away. Inference: this order was made on the internal
automatic intensity feed, not on a published bulletin, and not on any damage report. *Source:* Fire
and Disaster Management Agency report number 60, sections 6(2) and 7.

**16:27, Kumamoto Prefecture, Nagasaki Prefecture, Yatsushiro City, Nishiki Town and Yunomae Town:
stand up disaster headquarters.** *Information available:* the shaking itself. *Source:* Cabinet
Office situation report 2026-07-29 07:00 section 6; prefecture disaster portal headquarters feed.

**16:27, Yatsushiro City: shelters recorded open.** Thirteen Yatsushiro shelters carry an opening
timestamp of exactly 16:27, along with community centres across the city and the Yoshio branch
office in Ashikita Town. Inference: a timestamp equal to the earthquake minute is a nominal value
recording "opened as part of the automatic response", not a measured opening moment. *Source:*
shelter feed `https://portal.bousai.pref.kumamoto.jp/data/shelter/shelter.json`, fetched 2026-08-23;
eighteen shelters carry that exact stamp.

**16:27, seven prefectures switch their emergency medical information system to alert mode**, and
Kumamoto's goes to disaster mode one minute later at 16:28. *Source:* Cabinet Office situation
report 2026-07-29 07:00, Ministry of Health section.

**16:28:48, Japan Meteorological Agency: publish the first intensity bulletin.** Regions only. The
Kumamoto district region reached 7; the Amakusa and Ashikita region reached 6-lower. No municipality
was named. *Information available to everyone downstream from this moment:* somewhere in a region
containing Uki, Hikawa, Yatsushiro, Uto, Misato, Mashiki, Kashima, Kōsa, Mifune, Nishihara, Ōzu,
Kōshi, Kumamoto City and eleven more, the ground shook at the top of the scale. *Source:* Japan
Meteorological Agency feed document `20260728162848_20260728162718_VXSE51_0.json`.

**16:28, Prime Minister's Office: set up the Response Office and convene the emergency gathering
team. National Police Agency: set up the disaster security headquarters under the Director-General
of the Security Bureau. Cabinet Office: set up its disaster response room. Digital Agency: set up
its disaster information liaison room.** All four in the same minute, and all four on a regional
intensity bulletin that named no municipality. *Source:* Cabinet Office situation report 2026-08-23
10:00, sections 5(3) and 6(1), and National Police Agency section; Chief Cabinet Secretary remarks
of 17:25 on the Prime Minister's Office crisis log.

**16:28, Fire and Disaster Management Agency: ask every prefecture recording 5-lower or above, and
separately every prefecture under the tsunami advisory, to respond and report.** *Source:* Fire and
Disaster Management Agency report number 60, section 7.

**16:29, Japan Meteorological Agency: issue a tsunami advisory for the Ariake Sea and the Yatsushiro
Sea.** *Source:* Fire and Disaster Management Agency report number 60, section 1.

**16:29, the Prime Minister: issue the standing instruction.** Three points: establish the damage
picture quickly; work as one government with local government under a life-first policy on rescue;
give the public timely and accurate information about evacuation and damage. *Information
available:* one regional intensity bulletin, forty-one seconds old, and a tsunami advisory issued in
the same minute. *Source:* Cabinet Office situation report 2026-08-23 10:00, section 5(4).

**16:29, Ministry of Internal Affairs and Communications: set up a disaster headquarters in the
Minister's Secretariat.** *Source:* Cabinet Office situation report 2026-07-29 07:00, section 5(9).

**16:30, Hikawa Town: stand up its disaster headquarters**, three minutes after the earthquake and
before any bulletin had named it. *Source:* prefecture headquarters feed.

**16:31:48, Japan Meteorological Agency: publish the first municipality-level picture.** Uki City
and Hikawa Town at 7. Kumamoto City's southern ward, Yatsushiro City, Uto City, Misato Town and
Mashiki Town at 6-upper. Kōshi City, Ōzu Town, Nishihara Village and Mifune Town at 6-lower.
Magnitude 7.1, depth 10 kilometres, both provisional. And two entries under the heading
「震度５弱以上未入電」, meaning "5-lower or above expected but not received": **Kashima Town and Kōsa
Town**. *Source:* Japan Meteorological Agency feed document
`20260728163148_20260728162718_VXSE5k_1.json`, fetched 2026-08-23.

**16:32, Ministry of Internal Affairs and Communications: email Kumamoto Prefecture's crisis
management department.** The staff support dispatch office told the prefecture, verbatim,
「躊躇なく応援要請をされたい」, request support without hesitation. Forty-four seconds after the first
municipality-level bulletin. *Source:* Cabinet Office situation report 2026-07-29 07:00, section
5(9).

**16:35, Uki City and Reihoku Town: stand up disaster headquarters.** Uki is one of the two
intensity-7 municipalities and stood up its headquarters three minutes and twelve seconds after the
bulletin that named it. *Source:* prefecture headquarters feed.

**16:35:28, Japan Meteorological Agency: second hypocentre and intensity report.** Identical
municipality list. Kashima Town and Kōsa Town still not received. This was the **last**
municipality-level intensity report issued for the main shock. *Source:* feed document
`20260728163528_20260728162718_VXSE5k_2.json`.

**16:38, 16:40 and 16:55, Nishihara Village, Hitoyoshi City and Mifune Town: stand up disaster
headquarters.** *Source:* prefecture headquarters feed.

**16:43, National Police Agency: begin the helicopter television feed from Kumamoto into the Prime
Minister's Office.** It ran until 18:32. This is the first moving image of the disaster area
available to national decision-makers. *Source:* Cabinet Office situation report 2026-07-29 07:00,
section 5(5).

**16:44, Ministry of Defense: begin aerial reconnaissance.** Building to twenty aircraft over the
day. Forty-six minutes before the Governor's request. *Source:* Cabinet Office situation report
2026-08-23 10:00, Ministry of Defense section.

**16:50, Kashima Town: first shelter record stamped.** The feed's first Kashima record is stamped
twenty-three minutes after the earthquake and fifteen minutes before any official intensity value
existed for the town. Because the feed mixes opening, nominal and publication timestamps, this does
not prove the mayoral decision time. *Source:* shelter feed, fetched 2026-08-23; timestamp caveat in
section 3.6.

**16:57, Saga Prefecture: fly its disaster helicopter for information gathering.** *Source:* Fire
and Disaster Management Agency report number 60, section 5(2).

**17:00, Misato Town, Nagomi Town, Ōzu Town and Mashiki Town stand up disaster headquarters;
Kumamoto City, Tamana City and Misato Town open their first shelters.** *Source:* prefecture
headquarters and shelter feeds.

**17:08, an aftershock**, maximum 5-lower in Yatsushiro City, Kamiamakusa City, Amakusa City, Misato
Town and Ashikita Town. *Source:* Fire and Disaster Management Agency report number 60, section
1(3).

**17:08, Fire and Disaster Management Agency: second mobilisation request, to the Saga prefectural
battalion.** In the same minute as the aftershock. *Source:* report number 60, section 6(2).

**17:09, the peak of the power outage**, about 48,530 households. *Source:* Cabinet Office situation
report 2026-08-23 10:00, electricity section.

**17:12, Nagasaki Prefecture: fly its disaster helicopter.** *Source:* report number 60, section
5(2).

**17:25, Uto City: stand up its disaster headquarters**, fifty-eight minutes after the earthquake.
*Source:* prefecture headquarters feed.

**17:25, the Chief Cabinet Secretary: hold the first press conference on the event**, quoting the
Prime Minister's instruction and confirming the Response Office and the emergency gathering team.
*Source:* Prime Minister's Office crisis log.

**17:30, the Governor of Kumamoto: request Self-Defense Force disaster dispatch.** To the Commander
of the 8th Division, Ground Self-Defense Force, received at the same moment. Requested activities:
information gathering, life-saving, supply transport and living support. One hour and three minutes
after the earthquake. *Information available:* the 16:35 bulletin, still the newest
municipality-level intensity data, with two towns blank; whatever municipalities had reported
directly; the prefecture's own helicopter had not yet flown. *Source:* Ministry of Defense Joint
Staff release 2026-07-28; Cabinet Office situation report 2026-08-23 10:00, Ministry of Defense
section.

**17:30, Japan Meteorological Agency: hold its first headquarters press conference. Fire and
Disaster Management Agency: send three staff to the Kumamoto prefectural office. Cabinet Office:
send a seven-person survey team to the Kumamoto prefectural office.** *Sources:* Ministry of Land
situation report 1, section 5; Fire and Disaster Management Agency report number 60, section 7;
Cabinet Office situation report 2026-08-23 10:00, section 6(1).

**17:45, road closure recorded on National Route 3 at Hikawa Town** for surface steps caused by the
earthquake, full closure. This is one of only four Kumamoto closures in the first snapshot that
carries a real, non-rounded decision time; the closure on the South Kyushu Expressway western route
at Minamata is stamped 16:27, and the Kyushu Chūō Expressway at Yamato Town and the National Route
57 northern restoration road at Aso City are both stamped 17:23. *Source:* the ministry's
road-restriction map published with situation report 3, page
`https://www.mlit.go.jp/road/content/002014124.html`, whose embedded layer is labelled
`260729_0500時点.geojson`, fetched 2026-08-23.

**18:00, Kumamoto City: stand up its disaster headquarters.** One hour and thirty-three minutes
after the earthquake, and the last of the sixteen headquarters in the published record. Kumamoto
City is the largest municipality in the prefecture. *Source:* prefecture headquarters feed.

**18:00 to 18:40, Ministry of Land: fly the survey helicopter はるかぜ号.** *Source:* Ministry of
Land situation report 1, section 3(3).

**18:10, Japan Meteorological Agency: cancel the tsunami advisory.** One hour and forty-one minutes
after issuing it. *Source:* Fire and Disaster Management Agency report number 60, section 1.

**18:10, Ministry of Land: publish situation report 1.** The first national situation report of any
kind for this event. It records five expressway routes closed across 21 sections; the whole Kyushu
Shinkansen suspended; 17 conventional rail lines suspended across nine operators; Kumamoto Airport's
runway closed until 18:30 with injuries in the terminal and two people trapped in a lift; and water
problems reported in Hikawa, Nishihara, Mifune, Ashikita and Minamata. Its liaison table shows ten
people deployed: two each to the Kumamoto, Nagasaki and Kagoshima prefectural offices, and two each
to **Uki City and Hikawa Town**. *Source:* `https://www.mlit.go.jp/common/002014075.pdf`, fetched
2026-08-23.

**18:20, the Prime Minister: establish the Extreme Disaster Management Headquarters.** One hour and
fifty-three minutes after the earthquake. *Information available:* the 16:35 bulletin as the newest
intensity picture; the police helicopter feed since 16:43; the ministry's inspection returns;
municipal reports. No published casualty figure existed yet, and the Chief Cabinet Secretary said so
in terms at 18:47. *Source:* Cabinet Office situation report 2026-08-23 10:00, section 5(1); Prime
Minister's Office crisis log.

**18:20, four simultaneous escalations keyed to that same minute.** The National Police Agency
reorganised its headquarters into an Extreme Disaster Security Headquarters under the Commissioner
General. The Ministry of Internal Affairs and Communications upgraded to an extreme disaster
headquarters under the Minister and sent three liaison officers from the Kyushu Telecommunications
Bureau to the Kumamoto prefectural office. The Ministry of Health, Labour and Welfare converted its
liaison office into a disaster headquarters, as did the Digital Agency. And the Commissioner of the
Fire and Disaster Management Agency switched the Emergency Fire Response Team orders from a request
to an instruction. *Sources:* Cabinet Office situation report 2026-07-29 07:00, sections 5(5), 5(9),
5(14) and 5(22); Fire and Disaster Management Agency report number 60, section 6(2).

**18:20, the government's snapshot of whether municipalities could still function.** The Cabinet
Office checked the thirteen Kumamoto municipalities at 6-lower or above, plus the two towns thought
to be at 5-lower or above but not received. It found that in Misato Town the town hall was running
on emergency power, staff could not enter the building, and the situation could not be confirmed;
and that in Kōsa Town the network was down. Every other municipality was reported as having no
impediment to disaster response work. *Source:* Cabinet Office situation report 2026-07-29 07:00,
section 4(1)⑨, checked 2026-08-23.

**18:25, Kumamoto Prefecture: fly its own disaster helicopter for information gathering.** One hour
and fifty-eight minutes after the earthquake, and one hour and twenty-eight minutes after Saga.
*Source:* Fire and Disaster Management Agency report number 60, section 5(2).

**18:29, the Minister of Land, Infrastructure, Transport and Tourism: issue the ministerial
instruction.** *Source:* Ministry of Land situation report 1, section 4(1).

**18:30, Uki City: first shelter record stamped.** This is two hours and three minutes after the
earthquake in one of the two intensity-7 municipalities, but it is not a verified decision time for
the reasons in section 3.6. *Source:* shelter feed.

**18:47, the Chief Cabinet Secretary: announce the Extreme Disaster Management Headquarters and the
Self-Defense Force request.** *Source:* Prime Minister's Office crisis log.

**18:50 to 19:00, the bulk of Kumamoto's road closures are recorded.** Thirteen of the eighteen
Kumamoto closures in the first published snapshot carry a timestamp of exactly 19:00, covering
National Routes 218, 219 and 266 and ten prefectural roads across Yatsushiro, Uki, Yamato, Mifune,
Kōsa and Misato. Inference: a block of thirteen closures all stamped at the same round minute is a
batch data-entry time, not thirteen simultaneous decisions. *Source:* road-restriction map layer
`260729_0500時点.geojson`, fetched 2026-08-23.

**19:00, Ministry of Land: hold its extreme disaster headquarters meeting.** *Source:* situation
report 2, section 4(2).

**19:00, Kumamoto Prefecture: apply the Disaster Relief Act to twenty-one municipalities.** Ten
cities, ten towns and one village, named in section 1.3 above. *Source:* minutes of the first
national headquarters meeting; Cabinet Office notice `https://www.bousai.go.jp/pdf/260728.pdf`.

**19:03, an aftershock**, maximum 5-lower at Uki City. *Source:* Fire and Disaster Management Agency
report number 60, section 1(4).

**Around 19:00, the Ministry of Education: escalate twice.** Its emergency response headquarters was
set up at 18:00 under the Director-General of the Minister's Secretariat, met at 20:10, and was
converted at 20:50 into an extreme disaster headquarters under the Vice-Minister. *Source:* Ministry
of Education reports 2 and 3.

**19:45 to 20:00, the national Extreme Disaster Management Headquarters: first meeting.** Three
hours and eighteen minutes after the earthquake. It adopted the eight-point implementation policy
described in section 1.4. The Prime Minister's closing remarks record the Self-Defense Force at
about 3,600 personnel. *Source:* Cabinet Office situation report 2026-08-23 10:00, section 5(1);
minutes at `https://www.bousai.go.jp/updates/r8kumamoto_jishin/pdf/r8kumamoto_dai1kai_giji.pdf`.

**20:00, Kumamoto Prefecture: hold the first meeting of its own disaster headquarters, and set the
first search priority of the event.** This is where the search-and-rescue allocation was actually
made, and the minutes say so plainly. The Emergency Fire Response Team report reads:

> 福岡県、佐賀県、大分県、宮崎県から緊急消防援助隊合計 149 隊、535 名が熊本県に向かっている。
> また、被害が大きいとみられるイオンモール熊本へ直行するよう指示している。八代地域には大分県、
> 宮崎県から向わせている。

In plain English: 149 units and 535 personnel from Fukuoka, Saga, Ōita and Miyazaki are on their way
to Kumamoto; an unspecified part of the inbound force has been instructed to go straight to the Aeon
Mall Kumamoto shopping centre, which is believed to have the heaviest damage; and the Ōita and
Miyazaki units are being sent to the Yatsushiro area. The Ground Self-Defense Force reported the 8th
Division moving on the same shopping centre with an expected arrival of about 21:00. Kyushu Electric
Power reported about 47,000
households without electricity as of 20:00. *Information available at this moment:* the 16:35
bulletin; the first incident reports from municipalities; no casualty figure had yet been published
nationally. *Source:* minutes of the first meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315985.pdf`, checked 2026-08-23.

The Aeon Mall Kumamoto shopping centre is in Kashima Town, which is one of the two municipalities
whose seismic intensity had not been received. The fire service sent an unquantified force toward
Kashima and the Ōita and Miyazaki battalions toward Yatsushiro, while the army moved on Kashima, all
on incident reports. At the same time, the transport ministry's liaison allocation followed the
intensity map to Uki and Hikawa. The chains read different signals and produced different
allocations.

**20:00, Kumamoto Prefecture's first meeting also records an explicit lesson drawn from 2016.**
Vice-Governor Kamesaki said: 「熊本地震では２日後に本震があった。余震による二次災害に十分注意
しながら現場対応をお願いしたい。」 In plain English: in the Kumamoto earthquake the main shock came
two days later, so please handle the field with full attention to secondary damage from aftershocks.
The Vice-Governor is referring to the April 2016 sequence, in which a first strong earthquake was
followed two days later by a larger one. That two-day pattern is background about 2016 and is not
part of this event's record; it is stated here only to make the quotation intelligible, and it should
be checked against a 2016 source before anyone relies on it. **This is the only place in the whole
2026 record where a decision-maker is documented reasoning from the 2016 event**, and that is why it
is quoted. *Source:* minutes of the first meeting.

**20:00, the Yatsushiro Wide-Area Administrative Affairs Association Fire Headquarters restores its
dispatch command system.** It had failed at the earthquake. That is three hours and thirty-three
minutes of degraded dispatch in the municipality that would account for 20 of the 38 deaths.
*Source:* Cabinet Office situation report 2026-07-29 14:00, section 2(2)③,
「熊本県八代広域行政事務組合消防本部において指令システムの障害発生 →７月 28 日 20 時 00 分に
復旧」, checked 2026-08-23.

**20:15 and 20:28, Fire and Disaster Management Agency: two further mobilisation instructions.** At
20:15, an air command support unit from Miyazaki and air units from Kitakyushu City and Nagasaki. At
20:28, prefectural battalions from Okayama, Hiroshima, Yamaguchi and Kagoshima, four more
prefectures, four hours after the earthquake. *Source:* report number 60, section 6(2).

**20:30, Japan Meteorological Agency: second press conference, and revise the hypocentre.** The
revision moved the depth from 10 to 16 kilometres and refined the position. Every document issued
before this moment, including the Ministry of Land's situation report 1 at 18:10, carries the
10-kilometre figure. *Sources:* Ministry of Land situation report 2, section 5; feed document
`20260728203023_20260728162718_VXSE61_0.json`.

**21:00, the Governor of Kumamoto: make a second Self-Defense Force dispatch request, this one to the
Maritime Self-Defense Force Sasebo District Force.** Three and a half hours after the first request.
The naval request does not appear in the Cabinet Office's dispatch table. *Source:* Kumamoto
Prefecture headquarters meeting materials
`https://www.pref.kumamoto.jp/uploaded/attachment/315400.pdf`.

**21:00, Japan Meteorological Agency: set up its own disaster headquarters. 21:15, Ministry of
Health: first headquarters meeting. 21:45, Fire and Disaster Management Agency: air unit instruction
to Saga. 23:00, Geospatial Information Authority: disaster headquarters meeting.** *Sources:*
Ministry of Land situation report 2, section 5; Cabinet Office situation report 2026-07-29 07:00,
sections 5(14) and the mapping agency section; Fire and Disaster Management Agency report number 60,
section 6(2).

**21:50, Ministry of Land: publish situation report 2.** Hotlines now built with 26 cities, 21 towns
and 4 villages, up from 18, 16 and 2 at 18:10. Liaison deployment has grown from ten people to
twelve, and the new pair went to **Yatsushiro City**, which now joins Uki and Hikawa on the liaison
list. *Source:* `https://www.mlit.go.jp/common/002014121.pdf`, section 3, fetched 2026-08-23.

**During 2026-07-28, clock time not recorded, Kumamoto Prefecture: request disaster medical
assistance teams from every Kyushu prefecture.** Twelve prefectures set up medical coordination
headquarters the same day and national teams went to automatic standby. *Source:* Cabinet Office
situation report 2026-07-29 07:00, medical section.

**During 2026-07-28, shelters open across the prefecture.** Of the 551 shelters that opened for this
event, 502 opened on 2026-07-28: 19 in the 16:00 hour, 146 in the 17:00 hour, 200 in the 18:00 hour,
96 in the 19:00 hour, and 41 across the four hours after that. *Source:* shelter feed, 2,124 records
of which 551 carry an opening timestamp, fetched 2026-08-23; the same 551 figure appears in the
event portal's own summary at `https://odcs.bodik.jp/kumamoto-r8/data/portal/summary.json`,
generated 2026-08-23 20:32.

**22:00, the Prime Minister telephones the Governor of Kumamoto.** The Governor reported it at the
next prefectural meeting: 「昨日２２時に高市総理からお電話をいただき、状況を共有して、国と緊密に
連携しながら対応に当たっていくことを確認しました。」 In plain English: at 22:00 yesterday I received
a telephone call from Prime Minister Takaichi, we shared the situation, and we confirmed that we
would respond in close coordination between the state and the prefecture. *Source:* Governor's
statement at the second prefectural headquarters meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315398.pdf`.

## Day 2, 2026-07-29: the first full picture, and the first shortfall

**00:00, Kumamoto Prefecture: hold the second meeting of its disaster headquarters**, four hours
after the first. The shopping centre had produced its first rescue count: four people recovered, of
whom three moderately injured and one slightly, with ten still unaccounted for. The Ground
Self-Defense Force reported rescue work under way at the shopping centre and water supply at
Yatsushiro City Hall, and named the municipalities it would cover next: Yatsushiro City, Uki City,
Kashima Town and Hikawa Town. Vice-Governor Takeuchi
set the standing instruction for the night: 「給水が届くまでは避難所に避難していただく、あるいは
広域避難を含めて、総合的に命を守る活動を連携して取り組んでほしい。」 In plain English: until water
arrives, have people take shelter, or evacuate them more widely, and work together on life-protecting
activity as a whole. *Source:* minutes of the second meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315986.pdf`.

**02:07, Ground Self-Defense Force: patient transfer by UH-60 helicopter** from the 8th Aviation
Squadron at Takayubaru, carrying eight civilians. *Source:* Cabinet Office situation report
2026-08-23 10:00, Ministry of Defense section; Ministry of Defense Joint Staff release 2026-07-29.

**05:20 and 05:22, video relay and wide-area information gathering.** Two UH-1 helicopters relaying
video, then a Maritime Self-Defense Force P-1, an SH-60, two Air Self-Defense Force T-4s and a UH-60
gathering information. *Source:* same.

**05:00, the road-restriction snapshot is taken** that will be published with the 07:00 situation
report. *Source:* layer label `260729_0500時点.geojson`.

**06:00, 30 disaster medical assistance teams operating in Kumamoto**, 18 on headquarters work and
12 in the field. *Source:* Cabinet Office situation report 2026-07-29 07:00, medical section.

**06:04, Kumamoto Prefecture: second disaster helicopter flight.** *Source:* Fire and Disaster
Management Agency report number 60, section 5(2).

**06:10, police helicopter television feed from Kumamoto resumes.** *Source:* Cabinet Office
situation report 2026-07-29 07:00, section 5(5).

**06:20, the shelter system reaches its maximum count: 506 shelters holding 9,186 people.** *Source:*
Cabinet Office situation report 2026-07-29 07:00, section 3.

**06:30, Ground Self-Defense Force: begin water supply at Yatsushiro City Hall**, about ten personnel
with three water trailers from the Western Army Artillery Regiment. Water supply then started at
five sites in Uki at 07:30, Uto at 07:32, Mifune around 07:30, Kashima Town gymnasium at 08:50, two
sites in Kumamoto City at 11:26, four in Kamiamakusa at 11:55, and two in Hikawa Town. *Source:*
Cabinet Office situation report 2026-08-23 10:00, Ministry of Defense section, entry for 2026-07-29.

**06:30, Fire and Disaster Management Agency: send nine more staff**, this time including staff of
the National Research Institute of Fire and Disaster. *Source:* report number 60, section 7.

**07:00, Cabinet Office: publish situation report 1.** The first aggregated national picture,
forty-two pages. It records three dead, six seriously and twenty-two slightly injured in Kumamoto;
eight fires, all extinguished or under control; and 47 rescue incidents of which three were still
being worked: a factory chimney collapse in Yatsushiro City, a commercial building's second floor
collapsed in Kashima Town with many people trapped, and two houses buckled in Hikawa Town. It also
records the evacuation orders in force: emergency safety measures covering 46,610 households and
92,743 people in two Kumamoto cities, and evacuation instructions covering 107,032 households and
222,250 people across three Kumamoto cities and three towns, plus one Nagasaki city. *Source:*
`https://www.bousai.go.jp/updates/r8kumamoto_jishin/status/pdf/r8kumamoto_jishin_20260729.pdf`,
fetched 2026-08-23.

**07:00, Ministry of Land: publish situation report 3**, the first to carry a damage position map
and a road-restriction map. The road map's data layer is two hours older than the report. *Sources:*
`https://www.mlit.go.jp/common/002014129.pdf` and `https://www.mlit.go.jp/road/content/002014124.html`.

**By 07:00, the rescue assignments are visible for the first time.** The chimney collapse at
Yatsushiro was being worked by the Yatsushiro Wide-Area fire headquarters together with the Miyazaki
Emergency Fire Response Team battalion; the Kashima commercial building by the Fukuoka battalion; the
Hikawa houses by the Ōita battalion. *Source:* Cabinet Office situation report 2026-07-29 07:00,
section 2(2).

**09:30, Kumamoto Prefecture: hold the third meeting of its disaster headquarters.** The first rescue
counts are read into the record: 「イオンモールについては、8 名救出。日本製紙については 11 名中 4
名を救出。氷川町、八代市で救出活動を実施中。」 In plain English: eight people rescued at the shopping
centre; four of eleven rescued at the paper mill; rescue work under way in Hikawa Town and Yatsushiro
City. The Governor stated that three lives had been lost. *Source:* minutes of the third meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315988.pdf`.

**09:30, Ministry of Education: first meeting of its extreme disaster headquarters.** *Source:*
Ministry of Education report 3.

**09:40, Hikawa Town's first shelter opening is recorded**, seventeen hours and thirteen minutes
after the earthquake, in a municipality that recorded intensity 7 and stood up its headquarters at
16:30 the previous day. See Part 3 for why this number should not be read as the moment the shelter
opened. *Source:* shelter feed.

**11:18, the Chief Cabinet Secretary: announce the government survey mission.** He distinguishes it
from the Cabinet Office survey team sent the previous evening. *Source:* Prime Minister's Office
crisis log.

**11:50 and 13:00, the government survey mission: visit the Kashima Town damage site, then the
Kumamoto prefectural office.** Led by State Minister Tsushima. *Source:* government survey mission
report `https://www.bousai.go.jp/pdf/260805.pdf`, appendix 1.

**12:00, Ministry of Land: publish the 12:00 infrastructure sheets.** Three sheets carrying that
timestamp went out with situation report 5 at 14:00: river and dam damage, water supply damage, and
the emergency water supply posture. The water sheet records that three ministry staff left for the
site on the morning of the 29th, that the Japan Water Works Association's advance survey team had
reached Kumamoto City on the 28th, that five ministry and eighteen association water trucks were
already arranged against requests from Yatsushiro City and Kōsa Town, and that the association was
arranging a further twenty-two trucks to push into the area **without waiting for requests**.
*Source:* `https://www.mlit.go.jp/common/002014163.pdf`, fetched 2026-08-23.

**13:10, shelter population falls to 7,547 across 419 shelters**, down from 9,186 at 06:20. *Source:*
Cabinet Office situation report 2026-07-29 14:00, section 3.

**13:30, the national Extreme Disaster Management Headquarters: second meeting.** The Prime Minister
records the Self-Defense Force at about 4,600, the police at about 2,000 and the fire service at
about 1,410, and asks the Minister for Internal Affairs to advance the ordinary local allocation tax
payment. *Source:* Cabinet Office situation report 2026-08-23 10:00, section 5(1); minutes at
`https://www.bousai.go.jp/updates/r8kumamoto_jishin/pdf/r8kumamoto_dai2kai_giji.pdf`.

**14:00, Cabinet Office: publish situation report 2.** Deaths now eight. The rescue assignments have
changed: the Yatsushiro chimney is now worked by the Yatsushiro fire headquarters with the
**Kagoshima and Okayama** battalions, and Kashima by the **Fukuoka and Saga** battalions. The
Miyazaki battalion no longer appears against Yatsushiro. *Source:*
`https://www.bousai.go.jp/updates/r8kumamoto_jishin/status/pdf/r8kumamoto_jishin_20260729-1400.pdf`,
section 2(2).

**14:00, one isolated community is recorded**, Memaru district in Yamato Town, four households and
six people, cut off by a slope failure, reachable on foot, utilities working. It is the only isolated
community in the record. *Source:* same report, section 4(4).

**16:00, Kumamoto Prefecture: hold the fourth meeting of its disaster headquarters, with the
municipal mayors and the Cabinet Office state minister in the room.** The agenda has a slot for
mayors' comments and one for the state minister's summing up. The 14:00 damage picture read: 80
people harmed, of whom 12 dead, 6 in cardiopulmonary arrest and 8 seriously injured; 432 shelters
open; 8,886 evacuees. The two big incident sites were reported in detail for the first time:

> 日本製紙八代工場にて、11名閉じ込め、うち7名救助し、うち2名は中等症、5名は死亡（他4名について
> は安否不明）
> イオンモール熊本にて、10名救助し、うち１名は軽症、4名は中等症、1名は心肺停止、3名は死亡、
> 1名は状態不明

In plain English: at the Nippon Paper Yatsushiro mill, eleven people trapped, seven rescued, of whom
two moderately injured and five dead, with four more unaccounted for; at the Aeon Mall Kumamoto
shopping centre, ten rescued, of whom one slightly injured, four moderately injured, one in
cardiopulmonary arrest, three dead and one of unknown condition. The meeting also allocated the water
supply across eight municipalities to the Ground Self-Defense Force water trucks, the Maritime
Self-Defense Force and the Coast Guard: Uki, Yatsushiro, Hikawa, Kashima, Uto, Nishihara, Mifune and
Kamiamakusa. *Source:* minutes and materials of the fourth meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315989.pdf` and
`https://www.pref.kumamoto.jp/uploaded/attachment/315507.pdf`.

**During 2026-07-29, Ministry of Land: set up the Kumamoto Disaster Traffic Management Study Group
and start fast-tracking oversize vehicle permits.** Also from this day: access to the disaster area
on National Routes 3 and 57 was confirmed secured, and drivers were asked to detour widely via the
East Kyushu Expressway to keep congestion out of the disaster area. *Source:* Ministry of Land
situation report 6, 2026-07-30 06:30, road section.

**15:00, Ministry of Economy: open special consultation desks and apply safety-net guarantee number
four** across the twenty-one municipalities under the Disaster Relief Act. *Source:* Cabinet Office
situation report 2026-08-23 10:00, Ministry of Economy section.

**15:20, Air Self-Defense Force: land about 300 air conditioners at Kumamoto Airport**, flown by C-2
from Iruma, then distributed by the Ground Self-Defense Force to shelters at Uki, Misato, Yatsushiro,
Mifune and Uto against the prefecture's stated needs. Kumamoto was forecast to reach 35 degrees.
*Source:* same, Ministry of Defense section.

**17:55, the livelihood and business recovery support team: first meeting.** *Source:* same, section
5(1).

**22:19, an aftershock**, maximum 5-lower at Uki City, Kamiamakusa City and Amakusa City. *Source:*
Fire and Disaster Management Agency report number 60, section 1(5).

**Self-Defense Force strength on 2026-07-29: about 4,600, with 29 aircraft.** Five Maritime
Self-Defense Force vessels moved forward towards Yatsushiro Port, four arriving the same day. About
170 personnel were working the Kashima shopping centre and about 30 to 40 the Yatsushiro paper mill.
Rescue dogs from three services moved forward to Kengun garrison. *Source:* Ministry of Defense Joint
Staff release 2026-07-29; Cabinet Office situation report 2026-08-23 10:00, Ministry of Defense
section.

## Day 3, 2026-07-30: the peak, and the on-site headquarters

**06:30, Cabinet Office: publish situation report 3.** Shelter population has risen to **9,931**, the
highest figure recorded for the whole event, across 419 shelters, fewer shelters than at the 506 peak
and holding more people. Evacuation instructions have widened to 123,262 households and 258,206
people. *Source:*
`https://www.bousai.go.jp/updates/r8kumamoto_jishin/status/pdf/r8kumamoto_jishin_20260730.pdf`,
sections 2(2) and 3.

**09:30, Kumamoto Prefecture: hold the fifth meeting, and shift the Self-Defense Force's centre of
gravity off rescue.** The Ground Self-Defense Force report reads:
「病院等に対する給水を実施。人命救助活動の終結以降の活動については、給水等に軸足を移していく。」
In plain English: water supply to hospitals and similar is under way; for activity after life-saving
operations end, the centre of gravity will move to water supply and similar. The Emergency Fire
Response Teams reported 22 people rescued so far and three rescues still running. This was said on
the morning of day three, about forty-one hours after the earthquake and about thirty-one hours
before the seventy-two-hour mark. *Source:* minutes of the fifth meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315990.pdf`.

**10:30 to 13:00, the government survey mission: Yatsushiro City Hall, the Yatsushiro damage sites,
then Hikawa Town Hall and Uki City.** *Source:* government survey mission report, appendix 1.

**12:00, the rescue tally is struck.** Local fire headquarters had rescued 73 people and transported
586; the Emergency Fire Response Teams had rescued 25, two of them by helicopter, and transported 34,
five by helicopter. Total 98 rescued and 620 transported since the earthquake. *Source:* Fire and
Disaster Management Agency report number 60, section 6(1).

**12:24, Fire and Disaster Management Agency: begin heat-stroke prevention messaging** through social
media and leaflets to prefectures and fire headquarters. *Source:* report number 60, section 7.

**13:30, the national Extreme Disaster Management Headquarters: third meeting**, which decided to
create the on-site headquarters. *Source:* Prime Minister's Office crisis log.

**14:00, the government: establish the on-site Extreme Disaster Management Headquarters** at the
Kumamoto prefectural office, headed by State Minister Tsushima with about 120 staff. Its first
meeting was at 16:00 the following day. *Source:* Cabinet Office situation report 2026-08-23 10:00,
section 5(2); Chief Cabinet Secretary remarks of 16:19.

**16:00, Kumamoto Prefecture: hold the sixth meeting, and receive the national on-site headquarters
into its own building.** The Cabinet Office disaster management staff reported:
「本日の政府非常災害対策本部にて、高市総理より災害応急対策を強力に推進するため、現地災害対策本部
を設置するとあったため、防災センター306 会議室に設置。」 In plain English: at today's national
headquarters meeting the Prime Minister said an on-site headquarters would be set up to push forward
emergency response strongly, so it has been set up in room 306 of the disaster prevention centre. The
rescue picture: ten of eleven rescued at the Nippon Paper mill, with the last requiring heavy
machinery that could not reach the site, and twelve rescued at the Aeon Mall Kumamoto shopping
centre. *Source:* minutes of the sixth meeting,
`https://www.pref.kumamoto.jp/uploaded/attachment/315992.pdf`.

**Self-Defense Force strength on 2026-07-30: about 5,100 by the Ministry of Defense count, about
5,070 by the Cabinet Office count at its 07:30 cut-off.** Four Maritime Self-Defense Force vessels
had entered Yatsushiro Port. Water supply was running at 24 sites with 32 vehicles. About 170
personnel plus Maritime Self-Defense Force rescue dogs were working the Kashima shopping centre,
about 110 the Yatsushiro paper mill, and Air Self-Defense Force rescue dogs were working Hikawa Town.
Drone operators from the Japan Unmanned Aerial Systems industry association were working alongside
the 8th Division at Kashima. *Source:* Ministry of Defense Joint Staff release 2026-07-30; Cabinet
Office situation report 2026-07-31 07:30 and 2026-08-23 10:00, Ministry of Defense sections.

## The 72-hour mark, 2026-07-31

**07:30, Cabinet Office: publish situation report 4.** 399 shelters holding 9,637 people. Evacuation
instructions have widened again, to 127,647 households and 267,285 people across four cities and four
towns; the emergency safety measures order over two cities and 92,743 people is unchanged from
2026-07-29. Eleven fires, all out. Fifty-six disaster medical teams operating, plus nineteen
coordination teams. *Source:*
`https://www.bousai.go.jp/updates/r8kumamoto_jishin/status/pdf/r8kumamoto_jishin_20260731.pdf`.

**During the day, the Self-Defense Forces: run a final thorough search of the Kashima shopping centre
against the seventy-two-hour mark.** The Minister of Defense told the fourth headquarters meeting:
「イオンモール熊本については、本日夕方に発災から 72 時間が経過することを念頭に、警察や消防と連携
し、改めて徹底した捜索を実施した。」 In plain English: bearing in mind that seventy-two hours since
the disaster would elapse that evening, a renewed and thorough search of the Kashima shopping centre
was carried out in coordination with the police and the fire service. Water supply was now running at
41 sites with 49 vehicles. *Source:* minutes of the fourth headquarters meeting, via the Prime
Minister's Office crisis log; Ministry of Defense Joint Staff release 2026-07-31.

**09:30, Kumamoto Prefecture: hold the seventh meeting of its disaster headquarters.** *Source:*
prefecture headquarters meeting index.

**16:00, the national on-site headquarters holds its first meeting, jointly with the prefecture's
eighth headquarters meeting.** From this point the two bodies met together. The recovery support team
holds its second meeting at the same hour. **17:20, the national Extreme Disaster Management
Headquarters holds its fourth meeting**, and decides to advance 61.6 billion yen of ordinary local
allocation tax. *Source:* Cabinet Office situation report 2026-08-23 10:00, section 5; Prime
Minister's Office crisis log; prefecture headquarters meeting index.

## What happened after the window, for context

The first Emergency Fire Response Team units went home at 18:00 on 2026-08-01: the Okayama and
Hiroshima command support units, the Okayama, Hiroshima and Yamaguchi battalions and the Miyazaki air
command support unit. Air units went home on 2026-08-08 and the remaining battalions on 2026-08-14.
The Prime Minister visited the area on 2026-08-03 and announced the Specified Extreme Disaster
designation the same day. The cabinet decided both the severe disaster and the Specified Extreme
Disaster ordinances on 2026-08-07. All evacuation orders had been lifted by 2026-08-23, when 68
shelters still held 2,840 people, and the Self-Defense Force posture was still about 5,100. (Fire and
Disaster Management Agency report number 60, sections 3 and 6(2); Cabinet Office situation report
2026-08-23 10:00, sections 3 and 5.)

---

# Part 3. The information gaps and friction points

Each item below is a moment where the record shows deciders working with information that was
missing, late, or inconsistent with another official channel.

## 3.1 Two municipalities had no seismic intensity at all, and one of them lost seven people

The 16:31:48 bulletin and the 16:35:28 bulletin, the only two municipality-level intensity reports
issued for the main shock, both carry the line 「震度５弱以上未入電 : 嘉島町, 甲佐町」. The phrase
means the agency expected a value of 5-lower or above from those towns and did not receive one. No
later municipality-level report was issued for this earthquake, so within the real-time bulletin
series those two towns never got a number.

The final assessed values, published later, are 6-upper for Kashima Town and 5-upper for Kōsa Town
(Cabinet Office situation report 2026-08-23 10:00, section 1). Kashima Town went on to account for
seven deaths, the second-highest of any municipality. Kōsa Town accounted for one.

The gap is traceable downstream. The Cabinet Office's municipal-function check at 18:20 lists them
separately as 「震度５弱以上と考えられるが未入電の町」, towns believed to be at 5-lower or above but
not received, and reports Kōsa's network down. The transport ministry's water-supply sheets, still on
2026-07-30, print Kōsa Town's intensity as 震度不明, intensity unknown. Neither town published a
disaster headquarters setup time to the prefectural portal. (Sources: the two Japan Meteorological
Agency feed documents named above; Cabinet Office situation report 2026-07-29 07:00 section 4(1)⑨;
Ministry of Land position-map bundles `002014126.pdf` and `002014312.pdf`; prefecture headquarters
feed. All checked 2026-08-23.)

## 3.2 Two chains read two different signals and went to two different places

The 16:31 bulletin named two municipalities at intensity 7: Uki and Hikawa. The transport ministry's
first liaison deployment, in the 18:10 situation report, went to exactly those two and nowhere else
in Kumamoto. Yatsushiro City was added only between 18:10 and 21:50. Kashima Town received no
transport ministry liaison officer at all through 2026-07-29 10:00, the last liaison table in the
first 72 hours that I read.

The fire service and the army also acted on incident reports. At 20:00 the prefecture's own
headquarters recorded 149 Emergency Fire Response Team units and 535 personnel inbound in total. It
directed an unquantified part of that fleet toward the Aeon Mall Kumamoto shopping centre in Kashima
Town and the Ōita and Miyazaki battalions toward Yatsushiro; the Ground Self-Defense Force 8th
Division was moving on Aeon. The minutes do not give the Aeon/Yatsushiro unit or personnel split.
The intensity map had no value for Kashima at all.

The death distribution followed the incident reports rather than the intensity map: Yatsushiro 20,
Kashima 7, Hikawa 5, Uki 3, Kōsa 1. The two municipalities the first-minute signal singled out
account for 8 of the 36 located deaths.

The finding is therefore not that the system ignored the damage. It is that two official chains,
reading the same event at the same moment, chose different evidence and produced incompatible
allocations, and no document in the record reconciles them. (Sources: Ministry of Land situation
reports 1, 2 and 4, section 3(2); minutes of the first Kumamoto Prefecture headquarters meeting,
2026-07-28 20:00; Fire and Disaster Management Agency report number 60, section 2(1). Checked
2026-08-23.)

## 3.3 The dispatch command system failed in the municipality with the most deaths

The Yatsushiro Wide-Area Administrative Affairs Association Fire Headquarters had a fault in its
dispatch command system, first recorded in the Cabinet Office's 2026-07-29 07:00 report as an ongoing
problem and recorded in the 14:00 report as restored at 20:00 on 2026-07-28. Inference: the fault
began at the earthquake, because the 07:00 report lists it among first-night items and gives no other
start time; on that reading the outage ran three hours and thirty-three minutes. Yatsushiro accounts
for 20 of the 38 deaths. (Sources: Cabinet Office situation reports 2026-07-29 07:00 and 2026-07-29
14:00, section 2(2)③.)

## 3.4 The road picture published to the public was hours stale

The transport ministry's road-restriction map published with situation report 3 at 07:00 on
2026-07-29 carries an embedded data layer labelled `260729_0500時点`, a 05:00 snapshot in a 07:00
document, a two-hour lag. The same pattern repeats: the map with the 2026-07-30 06:30 report is
labelled `260730_0500時点`, and the maps with the 14:00 and 16:30 reports on 2026-07-30 are both
labelled `260730_1200時点v2`, so the 16:30 publication carried a four-and-a-half-hour-old picture.

There is a second problem. The ministry's index page links the 2026-07-29 10:00 and 14:00 reports to
the same map page, `002014147.html`, and that page today serves the `260730_0500時点` layer. The map
pages are updated in place rather than archived, so the snapshot a decision-maker actually saw on the
morning of 2026-07-29 is no longer retrievable from that address. (Sources:
`https://www.mlit.go.jp/saigai/saigai_260728.html` and the linked road pages `002014124.html`,
`002014147.html`, `002014308.html`, `002014360.html`, `002014380.html`, `002014420.html`,
`002014527.html`, all fetched 2026-08-23.)

## 3.5 Most road closures carry a batch timestamp, not a decision time

In the first published snapshot, eighteen Kumamoto closures appear. Thirteen carry the identical
timestamp 2026/7/28 19:00 and one carries 18:50. Only four carry times that look like individual
decisions: 16:27 on the South Kyushu Expressway western route at Minamata, 17:23 on the Kyushu Chūō
Expressway at Yamato Town and on the National Route 57 northern restoration road at Aso City, and
17:45 on National Route 3 at Hikawa Town. Inference: the 19:00 block is when a prefectural office
entered a backlog of closures into the system, not when thirteen roads were independently closed. The
real closure moments for those thirteen are not in the public record. (Source: layer
`260729_0500時点.geojson`, fetched 2026-08-23.)

## 3.6 The shelter feed's timestamps mix three different meanings

Of the 551 shelters that opened for this event, eighteen carry an opening timestamp of exactly 16:27,
the earthquake minute, including thirteen in Yatsushiro City. One record carries 2025-05-13, more
than a year before the earthquake. Hikawa Town, which recorded intensity 7 and stood up its
headquarters at 16:30 on 2026-07-28, has a first shelter opening stamped 09:40 on 2026-07-29, yet
Kumamoto Prefecture's own report at 19:00 on 2026-07-29 shows Hikawa with nine shelters holding 209
people. Uto City's first stamp is 13:34 on 2026-07-29, and the same prefectural report shows Uto with
nine shelters holding 261 people.

Inference: the feed carries at least three kinds of value, namely a nominal "opened under the
automatic plan" stamp equal to the earthquake minute, a genuine opening time, and a publication time
recorded when the municipality got round to updating its page. A model that treats every timestamp as
a decision moment will read Hikawa as having left an intensity-7 town without shelter for seventeen
hours, which the prefecture's own numbers contradict. (Sources: shelter feed fetched 2026-08-23;
Kumamoto Prefecture situation report 1, 2026-07-29 19:00, per-municipality table,
`https://www.pref.kumamoto.jp/uploaded/life/277996_876827_misc.pdf`.)

## 3.7 Two official channels described the evacuation orders differently

For the same period, the Cabinet Office table, sourced from the Fire and Disaster Management Agency,
carried a category the prefecture's own report did not, and the prefecture carried one the Cabinet
Office did not.

The Cabinet Office at 06:30 on 2026-07-30 reported emergency safety measures at warning level 5 over
two Kumamoto cities, 46,610 households and 92,743 people, plus evacuation instructions at level 4
over four cities and three towns, 123,262 households and 258,206 people. Kumamoto Prefecture's report
at 19:00 on 2026-07-29 reported evacuation instructions over seven cities and towns, 123,262
households and 258,206 people, the same numbers, plus an elderly-evacuation advisory at level 3 over
six municipalities and 142,187 people, and no level-5 category at all.

The level-4 figures agree exactly. The remaining categories do not overlap. Neither document names
which municipalities are in which category. (Sources: Cabinet Office situation report 2026-07-30
06:30, section 2(2); Kumamoto Prefecture situation report 1, 2026-07-29 19:00.)

## 3.8 The shelter population went down and then back up

The Cabinet Office recorded 9,186 people in 506 shelters at 06:20 on 2026-07-29, then 7,547 in 419
shelters at 13:10 the same day, then 9,931 in 419 shelters at the 2026-07-30 report. The population
fell by 18 percent during the day and rose by 32 percent by the next morning. Inference: this is the
day-and-night cycle of people who leave a shelter to check a house and come back to sleep, so a
single daytime headcount understates overnight demand by roughly a third. Any planner reading the
13:10 figure to size overnight supplies would have been about 2,400 people short.

## 3.9 The depth was wrong for four hours

Every document issued between 16:31 and 20:30 carried a hypocentre depth of 10 kilometres. The
transport ministry's situation report 1 at 18:10 prints it, labelled 速報値, provisional value. The
revision to 16 kilometres came at 20:30:23. The Cabinet Office's first report, at 07:00 the next
morning, carries 16 kilometres. Depth changes the expected shaking footprint, so the shaking picture
implicit in every first-evening decision was built on a number that was later withdrawn.

## 3.10 The national fire agency's own report series is not archived

The Fire and Disaster Management Agency publishes its numbered reports for this event to a single
file path, `https://www.fdma.go.jp/disaster/info/items/20260728kumamotojishin60.pdf`. Probing the
numbers 1 through 6 at the same path on 2026-08-23 returned "not found" for every one. Only report 60
exists. So the agency's own contemporaneous first-night reporting, which is the primary source for
evacuation orders and casualty figures by municipality, cannot be recovered. What survives is the
cumulative narrative inside report 60 and whatever the Cabinet Office copied into its own series.

## 3.11 The live evacuation-order feed is now empty

The prefecture's evacuation-order feed at
`https://portal.bousai.pref.kumamoto.jp/data/evacorder/evacorder.json` returned an empty list on
2026-08-23, because every order had been lifted. The feed is a current-state feed, not a history. The
per-municipality history of who ordered what, and when, is therefore not available from the
machine-readable source and survives only in the aggregate tables of the situation reports.

## 3.12 The prefecture published evacuation-order counts once and then stopped

Kumamoto Prefecture's report 1, at 19:00 on 2026-07-29, carries a section headed 【避難情報】 with
two lines: evacuation instructions over seven municipalities, 258,206 people and 123,262 households;
and elderly-evacuation advisories over six municipalities, 142,187 people and 70,499 households.

**That section never appears again.** Reports 2 through 41 have no evacuation-information section at
all. What remains is a pointer in the appendix telling readers that a per-municipality table is
posted hourly to a corporate file-sharing account that requires a login, and to the prefecture's own
web portal. So the prefecture's public damage series carries exactly one snapshot of the evacuation
picture, from twenty-six and a half hours after the earthquake, and nothing before or after.
(Sources: Kumamoto Prefecture reports 1 through 41, index at
`https://www.pref.kumamoto.jp/soshiki/222/276831.html`, all checked 2026-08-23.)

## 3.13 The death count for Yatsushiro nearly doubled in twenty-four hours

Kumamoto Prefecture's own per-municipality tables give the Yatsushiro death count as 11 at 19:00 on
2026-07-30 and 20 at 19:00 on 2026-07-31. The figure then stayed at 20 through 2026-08-23. Over the
same day Hikawa Town carried 4 confirmed deaths and 15 unclassified, and the prefecture's
"relationship to the disaster under investigation" column fell from 9 to 2.

Inference: the second day's search results at the Nippon Paper Yatsushiro mill and elsewhere were
being reclassified from unclassified into confirmed, so the count moved for reporting reasons as much
as for discovery reasons. From 2026-08-02 the prefecture split the death column into three named
categories, which means figures published before and after that date are not directly comparable.
Anyone building a casualty curve from this series has to carry the definition change with it.
(Sources: Kumamoto Prefecture reports 2, 3, 4 and 5, checked 2026-08-23.)

## 3.14 The isolated-community section reported zero, then disappeared

All four of the prefecture's first reports state 「※現在確認されていない。」 under the heading
【孤立集落数】, meaning no isolated communities currently confirmed. The heading is dropped from
report 5 on 2026-08-02 and never returns in the remaining thirty-seven reports. Meanwhile the Cabinet
Office's report at 14:00 on 2026-07-29 does record one isolated community, the Memaru district of
Yamato Town with four households and six people. The two channels disagreed about whether the number
was zero or one, and then one of them stopped asking. (Sources: Kumamoto Prefecture reports 1 through
5; Cabinet Office situation report 2026-07-29 14:00, section 4(4).)

## 3.15 Two official sources disagree on two small numbers

The sixth national headquarters meeting on 2026-08-04 is timed at 11:30 in the Cabinet Office
situation report of 2026-08-23 and at 11:03 on the Prime Minister's Office crisis log. The
Self-Defense Force strength on 2026-07-30 is about 5,100 in the Ministry of Defense release and about
5,070 in the Cabinet Office report, which has an earlier cut-off. Both pairs are primary sources and
neither disagreement is resolved in the public record. They are small, but they establish that
cross-checking two official channels for the same fact is worth doing.

---

# Part 4. The decision-slot candidates

Ten decision points, each with its time, its decider, the information genuinely available at that
moment, the choice actually made, and why it is worth replaying an agent system through. They are
ordered by clock time.

Two further candidates did not make the list and are noted here so nobody has to rediscover them.
The first is what the Cabinet Office and the transport ministry published at 07:00 on 2026-07-29,
knowing that parts of it were already two hours stale; that is a document-production decision rather
than an allocation, and it is described as friction point 3.4. The second is the decision to keep the
prefecture's level-5 emergency safety measures order over 92,743 people unchanged from 2026-07-29 to
2026-07-31; the record gives the fact but names neither the municipalities nor the reasoning, so
there is nothing to replay against.

**Verification gate, 2026-08-23.** Codex independently checked the five candidates chosen for the
first executable run against the primary records: Slots 1, 2, 4, 6 and 9. They deliberately cover
five different information conditions — almost no public information, missing telemetry,
multi-signal liaison allocation, incident-led rescue allocation and predictive supply support.
This selection is experimental scope, not a claim that the other real decisions mattered less.
Slots 3, 5 and 10 remain useful later governance tests. Slot 7 cannot support a matched historical
decision-time comparison because the shelter timestamps mix meanings. Slot 8 can support a synthetic
communication-loss stress test, but not a matched outage-duration claim because the public record
does not give the failure's start time. Across every slot, a replay may compare evidence use,
constraints and proposed actions; it may not convert later deaths into a score for an earlier choice
or claim that a simulated alternative would have saved lives.

## Slot 1, 16:27, the Commissioner of the Fire and Disaster Management Agency: which outside fire units to move, before any bulletin exists

**Decider:** Commissioner, Fire and Disaster Management Agency. The report records a request, not
the legal paragraph used. Section 1.5 explains why the public record cannot distinguish Article 44
paragraph 1 from paragraph 2 for this request.
**Information available:** inference — an internal automatic trigger carrying at least the regional
intensity signal. The exact internal payload is not public. No bulletin or damage report had been
published, and no public record reviewed here identifies a Kumamoto fire-mutual-aid request at this
time.
**Real choice:** a fixed set, namely the Fukuoka City integrated command support unit, three command
support units, three prefectural battalions from Fukuoka, Ōita and Miyazaki, and one Fukuoka air
unit, dispatched in the same minute as the earthquake.
**Why replay it:** this is the purest case in the whole event of an allocation made with no
observations at all beyond the intensity number. Everything an agent could add here has to come from
priors and from the shape of the shaking, because there is nothing else. It is also the slot where
the cost of being wrong compounds fastest, because the units chosen at 16:27 were already committed
when the 16:31 municipality picture arrived.

## Slot 2, 16:31:48, everyone downstream: what to do about Kashima Town and Kōsa Town

**Decider:** in principle the prefecture and the national agencies reading the bulletin; in practice
no public document reviewed here identifies an action taken because of the blank.
**Information available:** the first municipality-level list, showing two towns under the heading
"expected at 5-lower or above, not received", surrounded by neighbours at 6-upper and 7.
**Real choice:** the blank was carried forward. The 16:35 reissue repeated it. The 18:20
municipal-function check noted Kōsa's network was down. No public record reviewed here attributes a
unit allocation to the blank. Neither town appears in the transport ministry's municipal liaison
tables through the 2026-07-29 10:00 table, the last such table read in the first seventy-two-hour
report set; this is a bounded search result, not proof that no unrecorded action occurred.
**Why replay it:** a missing value surrounded by high values is information, and treating it as such
is exactly what an evidence-weighted agent should do. Kashima Town went on to have the second-worst
death toll of any municipality, and a collapsed shopping centre with many people trapped. This is the
single strongest slot in the event.

## Slot 3, 17:30 and 21:00, the Governor of Kumamoto: two Self-Defense Force requests, three and a half hours apart

**Decider:** the Governor, under Article 83 paragraph 1 of the Self-Defense Forces Act.
**Information available at 17:30:** the 16:35 bulletin, fifty-five minutes old and still the newest
municipality-level intensity picture, with two towns blank; municipal reports arriving unevenly; the
prefecture's own helicopter had not yet flown and would not until 18:25.
**Information available at 21:00:** three more hours of incident reports, the shopping-centre collapse
in Kashima and the mill chimney collapse in Yatsushiro both known, and the prefecture's own first
headquarters meeting concluded an hour earlier.
**Real choice:** at 17:30, one request to the Commander of the Ground Self-Defense Force 8th
Division, naming four activities: information gathering, life-saving, supply transport and living
support. No geographic priority appears in the request as published. At 21:00, a second request to
the Maritime Self-Defense Force Sasebo District Force, which the national reporting never picked up.
**Why replay it:** the first request is unscoped in the public record, so an agent asked to write it
at 17:30 with the same inputs has to decide whether to name municipalities and which. The three and a
half hour gap to the naval request is the second half of the slot: what changed between 17:30 and
21:00, and what evidence supported adding a maritime request? Yatsushiro Port went on to carry 542
tonnes of relief water. The record gives later destinations and activity, but an earlier-request
benefit would still be a simulated counterfactual under declared timing and transport assumptions,
not an observed result.

## Slot 4, 18:10, the Ministry of Land: where to send the first liaison officers

**Decider:** Kyushu Regional Development Bureau, Ministry of Land, Infrastructure, Transport and
Tourism.
**Information available:** the 16:35 bulletin; road inspection returns from ten road offices;
hotlines built with 36 municipalities; the はるかぜ号 helicopter survey then in progress.
**Real choice:** two officers each to Uki City and Hikawa Town, the two intensity-7 municipalities,
and none to any other Kumamoto municipality. Yatsushiro was added within the next three hours and
forty minutes.
**Why replay it:** this is the clearest case of intensity being used as a direct proxy for need. The
same ministry's 18:10 report also recorded expressway closures, suspended rail service, water-system
problems and possible deformation behind a quay at Yatsushiro Port. It does not say whether the
liaison decider considered those non-intensity signals. A replay can therefore test whether combining
them would change the allocation, while the ministry's own tables provide the exact real allocation
and the later addition of Yatsushiro. It cannot claim that rail damage had already been confirmed or
that every signal pointed in one direction.

## Slot 5, 18:20, the Prime Minister and the Commissioner of the Fire and Disaster Management Agency: the escalation minute

Two escalations by two different deciders in the same minute, which is why they are one slot.

**Deciders:** the Prime Minister, choosing the Article 24 Extreme Disaster Management Headquarters
rather than the unchosen Article 28-2 Emergency Disaster Management Headquarters; and the
Commissioner of the Fire and Disaster Management Agency, switching from a request to the Article 44
paragraph 5 instruction power. As section 1.5 states, assigning the earlier request specifically to
paragraph 2 would be an inference because the agency report does not name its paragraph.
**Information available:** the 16:35 bulletin; the police helicopter feed since 16:43; two hours of
movement by Emergency Fire Response Team units already on the road; the municipal-function check
completed in this same minute, showing one town hall unenterable and one town's network down; no
published casualty figure, which the Chief Cabinet Secretary said openly at 18:47. The public record
does not show what observations, if any, the moving fire units had reported by this minute.
**Real choice:** the Prime Minister took the middle tier, an Extreme Disaster Management
Headquarters, not the top tier Emergency Disaster Management Headquarters that would have required a
cabinet decision, on the stated grounds of expressway damage and building collapse. The Commissioner
changed the legal character of the fire orders from a request to an instruction, then issued three
further instructions at 20:15, 20:28 and 21:45 bringing in four more prefectures.
**Why replay it:** the tier choice sets the legal and budgetary posture for everything after it, and
both escalations were made before a single death had been publicly counted. It is a good test of
whether an agent can size a disaster from infrastructure and telemetry signals rather than from
casualty reports that do not exist yet. The fire half can be scored precisely: does the agent commit
the Okayama, Hiroshima, Yamaguchi and Kagoshima battalions earlier than 20:28, four hours and one
minute after the earthquake, and on what evidence?

## Slot 6, 20:00 on 2026-07-28, Kumamoto Prefecture: how to split the inbound fire response

**Decider:** the prefectural disaster headquarters at its first meeting, in coordination with the
Emergency Fire Response Team command support units.
**Information available:** the 16:35 bulletin, with Kashima Town and Kōsa Town blank; incident
reports naming a collapsed shopping centre in Kashima Town and a collapsed factory chimney in
Yatsushiro City; about 47,000 households without electricity; no national casualty figure yet.
**Real choice:** direct an unquantified part of the inbound fleet toward the Aeon Mall Kumamoto
shopping centre in Kashima Town, described in the minutes as the site believed to have the heaviest
damage, while directing the Ōita and Miyazaki battalions to the Yatsushiro area. The minutes say 149
units and 535 personnel were inbound in total, but do not give the Aeon/Yatsushiro unit or personnel
split. The Ground Self-Defense Force 8th Division moved on the same shopping centre, arriving about
21:00.
**Why replay it:** this is the actual search-and-rescue allocation decision of the event, and it is
the counterpart to Slot 4. Here the prefecture followed incident reports rather than waiting for a
complete intensity map. Kashima and Yatsushiro later accounted for 27 of the 36 deaths whose
municipality is known, but that hindsight figure cannot score the first-night choice or prove that a
different allocation would have changed the outcome. What can be compared is the selected
destinations, the battalion-level split the minutes actually name, and the evidence cited for each.

## Slot 7, through the evening of 2026-07-28, thirty-eight municipalities: when to open shelters, and how many

**Decider:** each mayor, under the municipal disaster prevention plan.
**Information available:** the shaking; the intensity bulletins from 16:28; whatever the local fire
service reported.
**Recorded result:** 502 of the 551 feed records carry a 2026-07-28 date, with 200 stamped from 18:00
to 19:00. The feed stamps Kashima Town's first record at 16:50 and Uki City's at 18:30. As section
3.6 demonstrates, these fields mix nominal plan times, opening times and later publication times, so
they cannot be treated as 502 verified mayoral decision moments.
**Why defer it:** this is structurally attractive — 38 distributed deciders and an overnight peak
of 9,931 people versus a daytime count of 7,547 — but the public timestamps do not support a matched
historical timing score. A later synthetic fleet test may use the observed aggregate demand curve
while labeling every municipal opening time as modeled unless another archive verifies it.

## Slot 8, the first night of 2026-07-28, Yatsushiro: how to run rescue with the dispatch system down

**Decider:** Yatsushiro Wide-Area Administrative Affairs Association Fire Headquarters, and the
Emergency Fire Response Team command support units above it.
**Information available:** degraded. The dispatch command system was recorded as faulty and was
restored at 20:00. The public record does not give the failure's start time; treating the earthquake
minute as its start is an inference, not an observed timestamp.
**Real choice:** the Yatsushiro fire headquarters worked the chimney collapse with the Miyazaki
battalion overnight, and by 14:00 on 2026-07-29 the Kagoshima and Okayama battalions had taken it
over.
**Why replay it:** this is the one slot where the communication substrate itself failed, in the
municipality that lost the most people. It is the natural test case for whether an agent system
degrades gracefully when its own message bus is unreliable.

## Slot 9, 12:00 on 2026-07-29, the Japan Water Works Association and the transport ministry: push water without waiting for requests

**Decider:** the Japan Water Works Association, coordinating with the ministry's on-site staff and
with the Self-Defense Forces.
**Information available:** requests already received from Yatsushiro City and Kōsa Town; five
ministry and eighteen association water trucks already committed against those; and the ministry's
12:00 water sheet reporting about 84,000 households affected at maximum across five prefectures. The
later peak of about 108,100 households was not available at this cutoff and is excluded from the
agent input.
**Real choice:** arrange about twenty-two further trucks to push into the area
「被災地の要請を待たず広域的にプッシュ型で支援するよう」, meaning supporting on a push basis across a
wide area without waiting for the disaster area to ask.
**Why replay it:** this is the clearest documented moment in the event where a body decided to stop
waiting for demand signals and start predicting them. It is the positive control for the whole
evidence method: the record states the decision, states the reasoning, and gives the number of
trucks, so a replay can be scored against it directly.

## Slot 10, 09:30 on 2026-07-30 through the evening of 2026-07-31, the Self-Defense Forces and the prefecture: when to rebalance rescue and water support

**Deciders:** the 8th Division, stated at the prefecture's fifth headquarters meeting; then the 8th
Division with the police and the Yatsushiro and Kamimashiki fire services on the final day.
**Information available on the morning of 2026-07-30:** 22 people rescued by the Emergency Fire
Response Teams with three rescues still running; ten of eleven recovered at the Yatsushiro paper mill
by that afternoon, with the last requiring heavy machinery that could not reach the site; twelve
recovered at the Kashima shopping centre; about 108,100 households facing a water outage in
temperatures forecast above 35 degrees; a posture of about 5,100 personnel to split.
**Real choice:** at 09:30 on 2026-07-30, about forty-one hours in and about thirty-one hours before
the seventy-two-hour mark, the Ground Self-Defense Force stated that after life-saving operations
ended its centre of gravity would move to water supply. Water supply sites went from 24 on 2026-07-30
to 41 on 2026-07-31. Then on 2026-07-31 the same force ran one more thorough joint search of the
Kashima shopping centre with the police and fire service, explicitly framed by the Minister of
Defense against the seventy-two-hour mark elapsing that evening.
**Why replay it:** this is the only decision in the record with an explicit stated deadline attached,
and it is the sharpest trade in the whole event. The overall Self-Defense Force posture was about
5,100 people, but the public record does not establish that every person was interchangeable between
rescue and water work or give a complete personnel split. A counterfactual can compare the later
reported activities, water vehicles and water-supply sites while preserving the final search as a
hard constraint. It cannot infer an unreported personnel split, avoided deaths, or proof that a
different allocation would have changed the casualty outcome.

---

# Part 5. What the public record cannot support

These are named gaps, not omissions.

**The Earthquake Early Warning time is not in what I read.** The 16:31 and 16:35 bulletins both state
that an Earthquake Early Warning was in force for this earthquake, through comment code 0241. I did
not find a document giving the moment the warning was issued or the areas it covered. It is the true
first alert and it is missing from this reconstruction.

**Municipality-level evacuation-order times do not exist in any source I found, and the four
worst-hit municipalities publish nothing time-stamped from 2026-07-28.** The Cabinet Office, the Fire
and Disaster Management Agency and the prefecture all publish evacuation orders only as
prefecture-level totals in categories. None names which municipality issued which level, and none
gives an issue time. The prefecture's own machine-readable feed is a current-state feed and is now
empty, and the prefecture's damage series published the evacuation section exactly once.

Going to the municipalities directly does not help. Uki City publishes one time-stamped fact, that it
set up its disaster headquarters at 16:35 on 2026-07-28, and no evacuation-order time; its shelter
page gives times only for later changes, not for the shelters it opened on the first day. Yatsushiro
City's shelter list is a rolling snapshot with no opening-date column, and the three pages on its
disaster site that would carry this record are empty templates. Hikawa Town's shelter page carries no
dates or times, and its event hub page carries no chronology. Kashima Town's shelter page carries no
date or time, and the town says it distributes evacuation and shelter information by messaging app
and email, which are not archived on the web. Web archive captures of all four sites from 2026-07-28
return either challenge pages or navigation-only shells. So for the single most consequential
municipal decision in the event, namely who told whom to leave and when, the public record supports
only prefecture-level aggregates.

**The Fire and Disaster Management Agency's first-night reports are gone from the live site, though
one was recovered from a web archive.** Only report 60 survives at the agency's file path; reports 1
through 59 return "not found". Report 15, from 11:00 on 2026-07-29, was recovered through the
Internet Archive and gives the Kumamoto evacuation split as emergency safety measures over two
municipalities, 46,610 households and 92,743 people, and evacuation instructions over three cities
and three towns, 107,032 households and 222,250 people. That is the only one of the fifty-nine that
was recovered, and it still names no municipality.

**The second Self-Defense Force request is missing from the national record.** The Governor's request
to the Maritime Self-Defense Force Sasebo District Force at 21:00 on 2026-07-28 appears only in the
prefecture's own meeting materials. The Cabinet Office dispatch table lists one request, not two.
Anyone reconstructing this event from national sources alone would get it wrong.

**The historical road-restriction snapshots are not archived.** The map pages are overwritten in
place, so the picture from the morning of 2026-07-29 is no longer retrievable from the address the
ministry linked to.

**Whether the Self-Defense Force reconnaissance from 16:44 was a formal dispatch is not stated.** It
began forty-six minutes before the Governor's request. The record gives the fact and not the legal
basis.

**Deaths are reported by municipality but not by cause or by time.** The reconstruction can say that
20 people died in Yatsushiro City and 7 in Kashima Town. It cannot say how many of them were alive at
any given hour, which is the number a rescue-allocation replay would most want.

**The Ministry of Defense website could not be read directly from this session.** Every request to
`www.mod.go.jp` returned a refusal. The ministry's material quoted here comes from Internet Archive
captures of its Joint Staff press page and from the Cabinet Office reports, which reprint the
ministry's figures. A reader with direct access should re-verify the Joint Staff releases.

**One figure in circulation is wrong and should not be carried forward.** An earlier note in this
repository recorded 39 deaths. The Fire and Disaster Management Agency figure at 2026-08-23 10:00 is
38 in Kumamoto Prefecture: 36 by named municipality, one probable, one under investigation. Use 38,
with the date attached, and treat every casualty and damage figure in this document as provisional,
because the issuing agencies mark them so.

---

# Sources

All checked 2026-08-23 unless noted.

**Prime Minister's Office**
- Crisis log for this event: `https://www.kantei.go.jp/jp/kikikanri/earthquake20260728.html`,
  published 2026-07-28, last updated 2026-08-21. Carries the timestamped government response log and
  the Chief Cabinet Secretary and Prime Minister remarks quoted above. Note that this host refuses
  requests without a browser identification string.

**Cabinet Office (内閣府防災)**
- Index of 26 situation reports:
  `https://www.bousai.go.jp/updates/r8kumamoto_jishin/status/index.html`
- Reports read in full or in part: 2026-07-29 07:00, 2026-07-29 14:00, 2026-07-30 06:30, 2026-07-31
  07:30, 2026-08-01 07:00, 2026-08-02 08:00, 2026-08-23 10:00, at
  `.../status/pdf/r8kumamoto_jishin_YYYYMMDD.pdf`.
- Headquarters meeting index, with materials and minutes:
  `https://www.bousai.go.jp/updates/r8kumamoto_jishin/taisakukaigi.html`
- First meeting minutes: `.../pdf/r8kumamoto_dai1kai_giji.pdf`; first meeting materials:
  `.../pdf/r8kumamoto_jishin_kaigi_1.pdf`; second meeting minutes: `.../pdf/r8kumamoto_dai2kai_giji.pdf`
- Disaster Relief Act application notice: `https://www.bousai.go.jp/pdf/260728.pdf`
- Government survey mission report, 2026-08-05: `https://www.bousai.go.jp/pdf/260805.pdf`
- Severe disaster designation, 2026-08-07: `https://www.bousai.go.jp/pdf/260807_316-1.pdf`
- Specified Extreme Disaster explanatory note, 2026-08-07: `https://www.bousai.go.jp/pdf/260807_3.pdf`

**Japan Meteorological Agency**
- Event portal: `https://www.jma.go.jp/jma/menu/20260728_kumamoto_jishin.html`
- Event summary, 2026-08-21 12:00: `https://www.jma.go.jp/jma/menu/202607281627_jishingaiyou.pdf`
- Strong-motion event page: `https://www.data.jma.go.jp/eqev/data/kyoshin/jishin/2607281627_kumamoto/`
- Earthquake report feed: `https://www.jma.go.jp/bosai/quake/data/list.json`, and the seven
  main-shock detail documents named in section 1.1.

**Fire and Disaster Management Agency (消防庁)**
- Report number 60, 2026-08-23 10:00:
  `https://www.fdma.go.jp/disaster/info/items/20260728kumamotojishin60.pdf`
- Disaster information index: `https://www.fdma.go.jp/disaster/`

**Ministry of Land, Infrastructure, Transport and Tourism (国土交通省)**
- Index of 48 situation reports: `https://www.mlit.go.jp/saigai/saigai_260728.html`
- Reports 1 through 7 read in full, at `https://www.mlit.go.jp/common/0020140XX.pdf`.
- Position-map bundles `002014126.pdf`, `002014140.pdf`, `002014163.pdf`, `002014312.pdf`.
- Road-restriction map pages with embedded data layers: `https://www.mlit.go.jp/road/content/`
  identifiers `002014124`, `002014147`, `002014308`, `002014360`, `002014380`, `002014420`,
  `002014527`.

**Ministry of Defense**
- Joint Staff press index and daily disaster dispatch releases, read from Internet Archive captures
  at `https://web.archive.org/web/20260802000100/https://www.mod.go.jp/js/press/index.html` and
  `https://web.archive.org/web/20260821111625/https://www.mod.go.jp/js/press/index.html`.
- Release of 2026-07-28:
  `https://web.archive.org/web/20260802000100if_/https://www.mod.go.jp/js/pdf/2026/p20260728_01.pdf`

**Ministry of Education, Culture, Sports, Science and Technology (文部科学省)**
- Index of 15 situation reports: `https://www.mext.go.jp/a_menu/r8kumamotojisin/index_00001.html`
- Report 1, 2026-07-28 17:00: `https://www.mext.go.jp/content/000442485.pdf`; report 2, 2026-07-29
  10:00: `https://www.mext.go.jp/content/000442491.pdf`; report 3, 2026-07-29 17:00:
  `https://www.mext.go.jp/content/20260729-ope_dev03-000051305_3.pdf`; report 15, 2026-08-17 17:00:
  `https://www.mext.go.jp/content/20260818-ope_dev02-000051305_1.pdf`

**Kumamoto Prefecture**
- Index of 41 situation reports: `https://www.pref.kumamoto.jp/soshiki/222/276831.html`
- Report 1, 2026-07-29 19:00: `https://www.pref.kumamoto.jp/uploaded/life/277996_876827_misc.pdf`;
  reports 2, 3 and 4 at `.../277996_876828_misc.pdf`, `.../277996_876829_misc.pdf` and
  `.../277996_876830_misc.pdf`
- Disaster headquarters meeting index, with packets, governor statements and verbatim minutes:
  `https://www.pref.kumamoto.jp/soshiki/222/274487.html`. Minutes of meetings 1 through 6 at
  `https://www.pref.kumamoto.jp/uploaded/attachment/` identifiers `315985`, `315986`, `315988`,
  `315989`, `315990` and `315992`; meeting packets at `315386`, `315400` and `315507`; governor
  statements at `315387` and `315398`.
- Disaster information portal feeds:
  `https://portal.bousai.pref.kumamoto.jp/data/shelter/shelter.json`,
  `.../headquarter/headquarter.json`, `.../evacorder/evacorder.json`

**Municipal sites, checked and found to carry no time-stamped record for 2026-07-28**
- Uki City: `https://www.city.uki.kumamoto.jp/kurashi/bosaiinfo/bosai/2607030` (the one exception,
  giving the 16:35 headquarters time) and `https://www.city.uki.kumamoto.jp/toppage/important/2609102`
- Yatsushiro City: `https://www.city.yatsushiro.lg.jp/kiji00326798/index.html`
- Hikawa Town: `https://www.town.hikawa.kumamoto.jp/kiji0036789/index.html`
- Kashima Town: `https://www.town.kumamoto-kashima.lg.jp/q/aview/279/6061.html`. Note that the
  alternative host `www.town.kashima.kumamoto.jp` served an expired security certificate on
  2026-08-23.

**Event open-data portal**
- `https://odcs.bodik.jp/kumamoto-r8/` and its data files under `/data/portal/`, in particular
  `summary.json`, `shelters.geojson` and `headquarters.json`. Run by the Institute of Systems,
  Information Technologies and Nanotechnologies, polling the prefecture and 45 municipal sites every
  ten minutes. Note that its licence is not stated on the site; treat its files as a research
  reference and take any published figure from the government report that carries it.

**Statutes, from the government legal database `laws.e-gov.go.jp`**
- Disaster Countermeasures Basic Act, `336AC0000000223`, Articles 23, 23-2, 23-3, 24, 25, 28-2, 53,
  60 and 68-2.
- Self-Defense Forces Act, `329AC0000000165`, Article 83.
- Fire and Disaster Management Organization Act, `322AC0000000226`, Article 44.
