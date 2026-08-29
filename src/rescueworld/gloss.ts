/**
 * gloss — the plain English a viewer reads in place of the recording's own words.
 *
 * Rescue World replays a sealed recording of the first seventy-two hours after an earthquake.
 * Hundreds of the sentences on screen come out of that file rather than out of the copy deck,
 * and a lot of them were written in the vocabulary of a fire service or a ministry. A viewer met
 * the decision title "Choose the first outside fire package before a public bulletin exists" and
 * could not say what it meant. It means "decide which fire crews from other prefectures to send,
 * before any public announcement exists".
 *
 * The recording's bytes cannot be edited: its hash has to keep matching the certificate the run
 * recorded, which is what makes the run reproducible. So the repair is a display gloss keyed by
 * identifier — the same pattern `REGION.roadName` in `copy.ts` already uses for Japanese road
 * names. Each table below maps the record's own identifier to the sentence the screen shows.
 * A caller looks the identifier up and falls back to the record's own words whenever the table
 * has no entry, so a missing entry degrades to the old behaviour rather than to a blank.
 *
 * Three rules hold everywhere in this file.
 *
 *   The recording is never edited. Nothing here writes to `app/public/rescueworld-log.json`, and
 *   the identifiers are read from it exactly as it wrote them.
 *
 *   Every number and every hedge survives. A gloss re-words a sentence; it never re-reports it.
 *   Where the record says eight units, the gloss says eight units.
 *
 *   Where a surface already shows a viewer where a sentence came from, the record's own wording
 *   stays available beside the gloss as the source. The gloss is what a reader understands; the
 *   record is what the run actually held.
 *
 * The method, the detectors and the ranked findings this file answers are written up in
 * `docs/rescueworld/PLAIN-TEXT-METHODS.md`. `node app/scripts/audit-plain-text.mjs` reads this
 * file, so a string glossed here is judged on the words a viewer actually reads.
 */

export type GlossTable = Record<string, string>;

/**
 * The plain sentence for one identifier, or the record's own words when this file has no entry
 * for it. Every render site in the viewer goes through this function, so a new identifier in a
 * later recording shows the record's wording instead of showing nothing at all.
 */
export function glossed(table: GlossTable, key: string, raw: string): string {
  const held = table[String(key ?? "").trim()];
  return held ?? String(raw ?? "");
}

/**
 * The plain sentence for one line of a list the record keeps per decision moment, such as the
 * assumptions or the unknowns. The record numbers those lines only by their position, so the key
 * joins the moment's identifier to that position: `slot-01-early-fire-mobilization#0`.
 */
export function glossedItem(
  table: GlossTable, key: string, index: number, raw: string,
): string {
  return glossed(table, `${String(key ?? "").trim()}#${index}`, raw);
}

/**
 * The eleven decision titles. Record path `events[].payload.decision_slot.title`, keyed by
 * `decision_slot_id`. This is the headline of every decision moment and the string a viewer
 * reads first, so it carries the whole scenario: who has to decide, about what, and by when.
 */
export const SLOT_TITLE: GlossTable = {
  "slot-01-early-fire-mobilization":
    "Outside fire crews must move before public announcements begin.",
  "slot-02-missing-telemetry-triage":
    "Kashima and Kōsa have no shaking readings.",
  "slot-03-defense-request-scope":
    "The Governor must decide whether to ask the navy for help.",
  "slot-04-first-municipal-liaisons":
    "Two officer pairs must be sent to town halls.",
  "slot-05-escalation-minute":
    "Japan must choose its national emergency level and how to call in fire crews.",
  "slot-06-first-night-response-split":
    "Five rescue units must be split between two collapsed buildings.",
  "slot-07-shelter-load-triage":
    "Only region-wide shelter totals are available.",
  "slot-08-degraded-dispatch-rescue":
    "Yatsushiro must send crews after its emergency-call system fails.",
  "slot-09-push-water-planning":
    "Extra water trucks must be allocated before towns ask.",
  "slot-10-rescue-water-turn":
    "Rescue work must continue while forces shift to water delivery.",
  "slot-11-aftershock-reprioritization":
    "After a strong aftershock, officials must choose two places to check.",
};

/**
 * Who decided, at each of the eleven moments. Record path
 * `events[].payload.decision_slot.decider`, keyed by `decision_slot_id`. Every organisation is
 * named with what it does, and the word "Modeled" is replaced by the plain admission that the
 * desk was invented for the exercise, which the record's own word hid.
 */
export const DECIDER: GlossTable = {
  "slot-01-early-fire-mobilization": "the head of Japan's national fire and disaster agency",
  "slot-02-missing-telemetry-triage":
    "a simulated prefecture team that sorts incoming reports; the public record does not"
    + " identify a real team for this decision",
  "slot-03-defense-request-scope": "the Governor of Kumamoto",
  "slot-04-first-municipal-liaisons":
    "a national government office that looks after roads and rivers across Kyushu, the"
    + " southern Japanese island where Kumamoto sits",
  "slot-05-escalation-minute":
    "Japan's Prime Minister, with the head of the national fire and disaster agency",
  "slot-06-first-night-response-split":
    "Kumamoto Prefecture's disaster office, advised by the national team that directs fire"
    + " crews sent in from other prefectures",
  "slot-07-shelter-load-triage":
    "a simulated team choosing shelter priorities for this exercise",
  "slot-08-degraded-dispatch-rescue":
    "Yatsushiro's own fire office, advised by the national team that directs crews sent in"
    + " from other prefectures",
  "slot-09-push-water-planning":
    "the national association of water utilities, working with the ministry that looks after"
    + " roads and with Japan's armed forces",
  "slot-10-rescue-water-turn": "the army's 8th Division, working with Kumamoto Prefecture",
  "slot-11-aftershock-reprioritization":
    "a simulated team choosing safety priorities for this exercise",
};

/**
 * What each decision moment asked an answer to do: how many units it may send, what it must say
 * out loud, and what it may not use. Record path `events[].payload.decision_slot.task`.
 */
export const SLOT_TASK: GlossTable = {
  "slot-01-early-fire-mobilization":
    "Send up to eight fire units to Kumamoto now. State what is still unknown about whether"
    + " crews are ready and how long they would take to arrive. Ignore information published"
    + " after 16:27.",
  "slot-02-missing-telemetry-triage":
    "Rank Kashima and Kōsa for checking. Treat each missing reading as unknown, not zero. This is"
    + " a simulated priority; the public record names no checking team.",
  "slot-03-defense-request-scope":
    "Choose the army, the navy, or both for tonight using only facts public by 21:00. State that"
    + " nobody has said why the navy is needed, where it would go, or how many people would be"
    + " sent.",
  "slot-04-first-municipal-liaisons":
    "Send exactly one officer pair to each of two towns. Use the 18:10 shaking, road, railway, and"
    + " water reports. Treat missing readings as unknown, and do not treat stopped trains as"
    + " confirmed damage.",
  "slot-05-escalation-minute":
    "Choose one national headquarters level and either request or order outside fire crews. Use"
    + " only facts public by 18:20; exclude later casualty and rescue totals.",
  "slot-06-first-night-response-split":
    "Split four incoming fire brigades from other prefectures and a response team from the"
    + " army's 8th Division between two collapsed buildings. Use the reports from each site and"
    + " the facts you have about each crew. Do not use death counts or rescue totals that came"
    + " later.",
  "slot-07-shelter-load-triage":
    "Choose exactly two prefecture-wide actions. Shelters changed from 506 sites with 9,186"
    + " people to 419 with 7,547. Do not invent town-level counts, capacity, or opening times.",
  "slot-08-degraded-dispatch-rescue":
    "Send one or two outside fire brigades to the mill. State that the record does not say when"
    + " the outage began, how the city sent crews during it, how many people were hurt, or which"
    + " crews were ready.",
  "slot-09-push-water-planning":
    "Allocate no more than 22 additional water trucks among the named towns. Treat earlier"
    + " requests as evidence of need; trucks may also go to towns that did not ask. Do not count"
    + " the 23 trucks already committed.",
  "slot-10-rescue-water-turn":
    "Choose exactly three priorities across active rescue sites and region-wide water delivery."
    + " Keep rescue work active and include the final search before the 72-hour mark. Do not"
    + " invent staffing levels.",
  "slot-11-aftershock-reprioritization":
    "After the 22:19 aftershock, prioritize exactly two safety checks. Use reports about active"
    + " rescues, isolated villages, shelters, and water delivery. Treat every unreported site as"
    + " unknown.",
};

/**
 * What the real officials did at each moment, according to the public record. Record path
 * `events[].payload.decision_slot.historical_choice.summary`.
 */
export const HISTORICAL_SUMMARY: GlossTable = {
  "slot-01-early-fire-mobilization":
    "The real 16:27 request called for one lead command team, three more command teams, three"
    + " fire brigades from other prefectures and one helicopter team.",
  "slot-02-missing-telemetry-triage":
    "No reviewed public record names an action taken because of those missing values. The gap"
    + " was still there in the 16:35 update.",
  "slot-04-first-municipal-liaisons":
    "The record shows the first two pairs went to Uki City and Hikawa Town, two officers"
    + " each. Yatsushiro City was added later.",
  "slot-05-escalation-minute":
    "Japan's Prime Minister opened a national disaster headquarters under Article 24 of"
    + " Japan's law on disasters. The national fire and disaster agency then stopped asking"
    + " other prefectures for crews and began ordering them.",
  "slot-06-first-night-response-split":
    "The meeting notes pointed the incoming crews toward Aeon Mall Kumamoto. They sent fire"
    + " brigades from Ōita and Miyazaki to Yatsushiro, and they recorded the army's 8th Division"
    + " moving to Aeon Mall. The notes never say exactly how many crews or people went to each"
    + " place.",
  "slot-07-shelter-load-triage":
    "The first-night order told towns to open shelters or move evacuees farther away when water"
    + " delivery would be slow. Public reports give only prefecture-wide totals and no matching"
    + " pair of town-level actions.",
  "slot-08-degraded-dispatch-rescue":
    "Yatsushiro's own fire headquarters worked the mill through the night with the crew sent"
    + " from Miyazaki. Crews from Kagoshima and Okayama appear at the mill in the next day's"
    + " 14:00 record.",
  "slot-09-push-water-planning":
    "The record says a national group of water utilities made about 22 additional trucks"
    + " ready for the whole region, without waiting for towns to ask. It does not say how those"
    + " trucks were divided between towns.",
  "slot-10-rescue-water-turn":
    "The recorded plan kept rescue work active, then shifted most forces to water after the"
    + " searches ended. Crews later searched Kashima once more before the 72-hour mark.",
  "slot-11-aftershock-reprioritization":
    "Work continued after the aftershock, but the public record does not name two sites checked"
    + " first.",
  "slot-03-defense-request-scope":
    "Kumamoto's Governor asked Japan's army for help at 17:30, and asked its navy at Sasebo"
    + " separately at 21:00.",
};

/**
 * What the public record does not say about the real official's choice. The record holds a list
 * per moment, so the key is the decision moment's identifier, a hash, and the position in the
 * list: `slot-01-early-fire-mobilization#0`.
 */
export const HISTORICAL_UNKNOWN: GlossTable = {
  "slot-01-early-fire-mobilization#0":
    "A Japanese law allows one prefecture to call fire crews from another. The public record"
    + " does not identify which of two clauses in that law authorized this request.",
  "slot-01-early-fire-mobilization#1":
    "The public record does not show what the automatic warning said or identify any other"
    + " crews that were available at 16:27.",
  "slot-02-missing-telemetry-triage#0":
    "The public records we reviewed identify no action taken specifically because the two"
    + " shaking readings were missing. Someone may still have acted without recording it.",
  "slot-02-missing-telemetry-triage#1":
    "The live bulletins for the earthquake never carried a shaking level for Kashima or Kōsa.",
  "slot-04-first-municipal-liaisons#0":
    "The public record does not identify what Japan's land and transport ministry considered"
    + " besides shaking levels when it chose Uki and Hikawa.",
  "slot-05-escalation-minute#0":
    "The public record does not list everything Japan's leaders saw in private, or what crews"
    + " on the road had radioed in.",
  "slot-06-first-night-response-split#0":
    "The minutes do not say where each remaining crew went, or how many people went to each"
    + " site.",
  "slot-06-first-night-response-split#1":
    "At 20:00, responders did not yet have a complete count of the dead and injured.",
  "slot-08-degraded-dispatch-rescue#0":
    "The public record does not say when Yatsushiro's emergency call system failed, how the"
    + " city handled calls during the outage, or how many responders went to each place.",
  "slot-03-defense-request-scope#0":
    "The public record does not say what prompted the 21:00 call to Japan's navy, or what"
    + " jobs it was asked to do.",
  "slot-09-push-water-planning#0":
    "The record does not say how those roughly 22 extra water trucks were split between"
    + " towns.",
  "slot-09-push-water-planning#1": "A town that never asked for water may still have needed it.",
  "slot-07-shelter-load-triage#0":
    "The public reports give only prefecture-wide shelter totals, not counts for each town or"
    + " shelter. Their clock times also refer to different things and cannot show when each"
    + " shelter actually opened.",
  "slot-11-aftershock-reprioritization#0":
    "The public record does not say which active sites were checked immediately after the"
    + " aftershock.",
  "slot-10-rescue-water-turn#0":
    "The public record does not say how many people worked each job, or whether they could"
    + " switch between rescue and water work.",
};

/**
 * What the exercise assumed in order to pose each moment. Same key shape as the unknowns above:
 * identifier, hash, position. Several of these say that something was invented for the exercise,
 * and the rewrite makes that admission plainer than the record's own word "modeled".
 */
export const ASSUMPTION: GlossTable = {
  "slot-01-early-fire-mobilization#0":
    "For this exercise, the AI could choose only from crews that the public record shows were"
    + " sent by 21:45.",
  "slot-01-early-fire-mobilization#1":
    "For this exercise, the AI could choose from a fixed list of crews. The public record does not"
    + " identify which of those crews were ready at 16:27.",
  "slot-01-early-fire-mobilization#2":
    "The AI was not told which crews were ready or how long they would take to arrive.",
  "slot-02-missing-telemetry-triage#0":
    "For this exercise, the AI ranked two towns for checking. The ranking does not assign a real"
    + " team.",
  "slot-04-first-municipal-liaisons#0":
    "Each real posting of two officers to a town counts here as one pair that cannot be"
    + " split.",
  "slot-05-escalation-minute#0":
    "The four choices represent legal ways to organize the national response. They do not"
    + " represent crews or equipment.",
  "slot-06-first-night-response-split#0":
    "For this exercise, each fire brigade and the army team must stay together. The exercise"
    + " gives no headcount for any team.",
  "slot-08-degraded-dispatch-rescue#0":
    "Each fire brigade must stay together. The exercise does not say how many people are in a"
    + " brigade.",
  "slot-03-defense-request-scope#0":
    "The exercise counts each request for military help as one choice. It does not invent the"
    + " number of crews or people that each request brought.",
  "slot-09-push-water-planning#0":
    "The report says about 22 trucks. In this exercise they count as 22 separate trucks,"
    + " handed out one at a time.",
  "slot-09-push-water-planning#1":
    "The AI had to choose which towns came first, even though the 12:00 record does not say"
    + " how the trucks were split.",
  "slot-07-shelter-load-triage#0":
    "For this exercise, the AI chose from three region-wide shelter actions. Public reports"
    + " give only prefecture-wide shelter totals, not town-level counts.",
  "slot-11-aftershock-reprioritization#0":
    "For this exercise, the AI ranked two places for checking. The ranking does not assign a"
    + " real team.",
  "slot-10-rescue-water-turn#0":
    "For this exercise, the AI ranked three jobs. A ranking does not assign responders or"
    + " trucks.",
};

/**
 * The things nobody could know at the time, which an answer had to say out loud. Record path
 * `decision_context.slots{}.required_unknowns[].plain_text`, keyed by `unknown_id`.
 */
export const REQUIRED_UNKNOWN: GlossTable = {
  "unknown-1627-internal-payload":
    "At 16:27, the available public records did not show what the automatic warning told the"
    + " head of Japan's national fire and disaster agency.",
  "unknown-1627-unit-readiness":
    "At 16:27, the available public records did not say which outside crews were ready or how long"
    + " they would take to reach Kumamoto.",
  "unknown-missing-intensity-true-values":
    "No shaking level for Kashima Town or Kōsa Town arrived in the live bulletins after the"
    + " earthquake.",
  "unknown-blank-response-actions":
    "The public records we reviewed identify no action taken specifically because the two"
    + " shaking readings were missing.",
  "unknown-liaison-reasoning":
    "The public record does not identify what Japan's land and transport ministry considered"
    + " besides shaking levels when it chose Uki and Hikawa at 18:10.",
  "unknown-national-escalation-inputs":
    "Public records do not show everything Japan's leaders knew before they raised the national"
    + " response at 18:20.",
  "unknown-moving-fire-unit-reports":
    "The public record does not say what crews already driving toward Kumamoto had reported"
    + " by 18:20.",
  "unknown-dispatch-failure-start":
    "Yatsushiro's system for sending crews to emergency calls broke. The public record does"
    + " not say when it broke, or how the city worked without it.",
  "unknown-first-night-casualty-count":
    "At 20:00, responders did not yet have a complete count of the dead and injured.",
  "unknown-fire-unit-destination-split":
    "The meeting minutes do not say how many crews or people went to each site that first"
    + " night.",
  "unknown-people-alive-by-time":
    "The later death counts do not say when each person died. The available records therefore"
    + " cannot show who was still alive when each decision was made.",
  "unknown-shelter-timestamp-meaning":
    "Shelter reports may record when officials planned an opening, when a shelter actually"
    + " opened, or when someone published the report. A timestamp alone cannot show how quickly"
    + " a town acted.",
  "unknown-defense-geographic-priority":
    "The Governor made two requests for military help. Neither one says which areas came"
    + " first, or how many people went where.",
  "unknown-maritime-request-trigger":
    "At 21:00 the Governor asked Japan's navy for help. The public record does not say what"
    + " prompted that request, or what jobs he asked it to do.",
  "unknown-shelter-municipal-load":
    "The official reports from the first night do not reliably say how many people were in"
    + " each town's shelters. They do not give a count for any single shelter either.",
  "unknown-final-search-personnel-split":
    "The public record does not say how many people worked on the last search, or how many"
    + " moved to delivering water across the region.",
  "unknown-water-need-without-request":
    "A town that had not asked for water could still have needed it badly.",
  "unknown-additional-truck-destinations":
    "The 12:00 record does not say which towns received the roughly 22 extra water trucks.",
  "unknown-aftershock-field-condition":
    "The public record does not say whether anyone checked each active site right after the"
    + " aftershock.",
  "unknown-response-personnel-interchangeability":
    "The public record does not say which responders could switch between rescue work and water"
    + " delivery.",
};

/**
 * The reports a decision moment made available. Record path
 * `decision_context.slots{}.known_observations[].plain_text`, keyed by `observation_id`. These
 * are the evidence a reader weighs, so every number and every hedge survives the rewrite.
 */
export const OBSERVATION: GlossTable = {
  // The record says "isolated by slope failure", which is what an engineer calls a hillside
  // coming down across the only road out.
  "obs-0729-1400-yamato-isolated":
    "A hillside came down and cut off a district called Memaru, in Yamato Town, from every road."
    + " Four households, six people. They could still be reached on foot, and their water and"
    + " power were working.",
  "obs-0729-0620-shelter-aggregate":
    "Across the whole prefecture, 506 shelters were open and held 9,186 people. The count"
    + " does not say how many people were in each shelter.",
  "obs-0729-1310-shelter-aggregate":
    "Across the whole prefecture, the number of open shelters fell to 419, holding 7,547"
    + " people. The count does not say how many people were in each shelter.",
  "obs-163148-uki-intensity":
    "Uki City reported shaking at level 7, the top of Japan's national shaking scale.",
  "obs-163148-hikawa-intensity":
    "Hikawa Town reported shaking at level 7, the top of Japan's national shaking scale.",
  "obs-163148-yatsushiro-intensity":
    "Yatsushiro City reported shaking at level 6-upper, just below the top of Japan's"
    + " national shaking scale.",
  "obs-163148-uto-intensity":
    "Uto City reported shaking at level 6-upper, just below the top of Japan's national"
    + " shaking scale.",
  "obs-163148-misato-intensity":
    "Misato Town reported shaking at level 6-upper, just below the top of Japan's national"
    + " shaking scale.",
  "obs-163148-mashiki-intensity":
    "Mashiki Town reported shaking at level 6-upper, just below the top of Japan's national"
    + " shaking scale.",
  "obs-1643-police-helicopter-feed":
    "Japan's national police agency had started sending live helicopter video from Kumamoto,"
    + " and national decision-makers could watch it.",
  "obs-2030-depth-revised":
    "Japan's national weather agency changed the depth of the first earthquake from 10 to 16"
    + " kilometres.",
  "obs-163148-kosa-missing":
    "Japan's national weather agency said Kōsa Town should have felt shaking at level 5-lower"
    + " or stronger. No reading arrived from the town.",
  "obs-1810-helicopter-survey":
    "Japan's land and transport ministry had its Harukaze helicopter flying a survey from"
    + " 18:00 to 18:40.",
  "obs-0729-2219-aftershock":
    "An aftershock shook Uki, Kamiamakusa and Amakusa at level 5-lower on Japan's national"
    + " shaking scale, while rescue, shelter and water work carried on.",
  "obs-0729-1200-water-trucks-committed":
    "Five water trucks from the ministry and eighteen from Japan's national water association"
    + " had already been matched to requests.",
  "obs-0730-0630-shelter-occupant-peak":
    "Across the whole prefecture, the number of people in shelters reached its recorded high"
    + " of 9,931, spread across 419 shelters.",
  "obs-1903-uki-aftershock":
    "An aftershock at 19:03 shook Uki City at level 5-lower on Japan's national shaking"
    + " scale.",
  "obs-1627-internal-trigger-assumed":
    "An automatic alert inside Japan's national fire and disaster agency carried at least a"
    + " warning of severe shaking across the region. What that alert actually said is not"
    + " public.",
  "obs-0729-0700-three-active-rescues":
    "Three rescues were still running: a mill chimney in Yatsushiro, a shopping centre in"
    + " Kashima and two buckled houses in Hikawa.",
  "obs-1810-yatsushiro-port":
    "Japan's land and transport ministry said the ground behind a quay at Yatsushiro Port may"
    + " have moved.",
  "obs-2000-aeon-collapse":
    "A collapse was reported at Aeon Mall Kumamoto in Kashima Town. People at the meeting"
    + " believed it was the site with the worst damage.",
  "obs-163148-kashima-missing":
    "Japan's national weather agency said Kashima Town should have felt shaking at level"
    + " 5-lower or stronger. No reading arrived from the town.",
  "obs-1810-rail-suspension":
    "All Kyushu Shinkansen bullet trains had stopped, along with 17 ordinary train lines. The"
    + " same report said no damage to railway equipment had been confirmed at that time.",
  "obs-163148-magnitude":
    "Japan's national weather agency reported an early magnitude of 7.1, a number it might"
    + " still change.",
  "obs-0729-0930-site-rescue-counts":
    "Eight people had been rescued at a shopping centre in Kashima, and four of eleven at a"
    + " paper mill in Yatsushiro. Work went on in Hikawa and Yatsushiro.",
  "obs-163148-depth":
    "Japan's national weather agency reported an early depth of 10 kilometres, a number it"
    + " might still change.",
  "obs-0729-1600-water-eight-municipalities":
    "Japan's army, its navy and its coast guard brought water to eight towns and cities: Uki"
    + " and Yatsushiro, Hikawa and Kashima, Uto and Nishihara, Mifune and Kamiamakusa.",
  "obs-2000-yatsushiro-dispatch-restored":
    "Yatsushiro's system for sending out fire crews was recorded working again at 20:00. The"
    + " public record does not say when it had failed.",
  "obs-1810-hotlines":
    "Japan's land and transport ministry had opened direct phone lines to 36 towns and cities"
    + " across the prefectures that were hit.",
  "obs-1820-kosa-network-down":
    "A national check of whether town halls could still work found the network in Kōsa Town"
    + " was down.",
  "obs-2000-yatsushiro-chimney-collapse":
    "Reports came in that a factory chimney had collapsed in Yatsushiro City.",
  "obs-1810-water-problems":
    "Water-system problems were reported in Hikawa and Nishihara, in Mifune and Ashikita, and"
    + " in Minamata.",
  "obs-0730-0930-water-shift-stated":
    "Japan's army said that once life-saving work ended, most of its effort would move to"
    + " water supply and similar help.",
  "obs-1820-no-published-casualty-count":
    "No count of the dead and hurt had been published when the national government and its"
    + " fire agency moved up a level.",
  "obs-2000-fire-fleet-inbound":
    "149 emergency teams of firefighters and 535 people were on their way from Fukuoka and"
    + " Saga, and from Ōita and Miyazaki.",
  "obs-2000-ground-force-moving-aeon":
    "Japan's army was moving its 8th Division to Aeon Mall Kumamoto, expected to arrive"
    + " around 21:00.",
  "obs-2000-power-outage": "About 47,000 households in Kumamoto had no power at 20:00.",
  "obs-1820-misato-town-hall-degraded":
    "Misato Town Hall was running on emergency power. Staff could not enter the building, so"
    + " they could not confirm conditions inside.",
  "obs-2000-no-published-casualty-count":
    "No full national count of the dead and hurt was public for this decision about where to"
    + " send crews.",
  "obs-0730-0630-water-peak-available":
    "Reported water outages had risen to about 108,100 households.",
  "obs-163528-missing-repeat":
    "The 16:35 update again showed no shaking reading for Kashima Town or Kōsa Town.",
  "obs-1730-ground-sdf-request":
    "Kumamoto's Governor asked Japan's army to send troops for disaster relief: to gather"
    + " information, save lives, carry supplies and support daily living.",
  // The record says "battalions", which reads as army units in a line where nothing else says
  // otherwise. Everywhere else this page calls the same thing a fire brigade sent from a
  // prefecture, and RESOURCE_LABEL above uses those exact words.
  "obs-0729-1400-rescue-reassignment":
    "Fire brigades sent from Kagoshima and Okayama were working at Yatsushiro, while fire"
    + " brigades sent from Fukuoka and Saga were working at Kashima.",
};

/**
 * What a report does not establish. Record path
 * `decision_context.slots{}.known_observations[].caveat`, keyed by `observation_id`.
 */
export const OBSERVATION_CAVEAT: GlossTable = {
  // The record wrote this one as an order to whoever was reading it — "Do not substitute later
  // municipal death totals" — and on screen it read as an instruction aimed at the viewer. Said
  // as a statement about the record, it says the same thing to the person actually reading it.
  "obs-2000-no-published-casualty-count":
    "Each town published its own count of the dead later on. Those counts belong to a time after"
    + " this decision, so they are not used in place of the count that was still unknown.",
  "obs-1627-internal-trigger-assumed":
    "No archived copy of the alert was found. For this exercise only, the AI is told that"
    + " Kumamoto's fire agency received an internal alert. The added alert contains only enough"
    + " detail to explain why crews were sent at 16:27.",
  "obs-163528-missing-repeat":
    "This shows the gap in readings was still there. It does not say how hard those towns"
    + " actually shook.",
  "obs-1810-rail-suspension": "Stopping the trains does not prove the railway was damaged.",
  "obs-163148-magnitude": "When this decision had to be made, that number could still change.",
  "obs-163148-depth":
    "It changed to 16 kilometres at 20:30:23. No decision made before that time may use the"
    + " later figure.",
  "obs-2000-yatsushiro-dispatch-restored":
    "Saying the system failed at the minute of the earthquake would be a guess.",
  "obs-1810-water-problems": "The report did not yet list any water outage in Yatsushiro.",
  "obs-163148-kashima-missing":
    "A missing reading is not the same as no shaking, and must not be ranked as weak shaking.",
  "obs-2000-fire-fleet-inbound":
    "The meeting minutes do not say how many teams went to each place.",
  "obs-2000-ground-force-moving-aeon":
    "The meeting minutes do not say how many soldiers were on the move.",
  "obs-0729-1200-water-trucks-committed":
    "These 23 trucks are already promised. They are not part of the 22 extra trucks this"
    + " decision is about.",
  // "Municipality-level bulletin." is a bare compound with no verb, and a reader could not tell
  // whether the bulletin came from towns, was about towns, or broke its numbers down by town.
  // The record puts the same caveat on all six town readings, so all six say the same sentence,
  // written out at each key because a shared name is not a string this file's readers can see.
  "obs-163148-uki-intensity":
    "This reading comes from the bulletin that gives a number for each town, not from an alert"
    + " covering a whole region.",
  "obs-163148-hikawa-intensity":
    "This reading comes from the bulletin that gives a number for each town, not from an alert"
    + " covering a whole region.",
  "obs-163148-yatsushiro-intensity":
    "This reading comes from the bulletin that gives a number for each town, not from an alert"
    + " covering a whole region.",
  "obs-163148-uto-intensity":
    "This reading comes from the bulletin that gives a number for each town, not from an alert"
    + " covering a whole region.",
  "obs-163148-misato-intensity":
    "This reading comes from the bulletin that gives a number for each town, not from an alert"
    + " covering a whole region.",
  "obs-163148-mashiki-intensity":
    "This reading comes from the bulletin that gives a number for each town, not from an alert"
    + " covering a whole region.",
  // "Contemporaneous" is above the reading level the rest of the page holds, and it carries the
  // whole point of the caveat. Both collapse reports carry it.
  "obs-2000-aeon-collapse":
    "This was reported while it was happening. It is not a full count of the dead and hurt.",
  "obs-2000-yatsushiro-chimney-collapse":
    "This was reported while it was happening. It is not a full count of the dead and hurt.",
};

/**
 * The units and the courses of action a moment could choose between. Record path
 * `decision_context.resource_labels{}.label`, keyed by the resource identifier.
 */
export const RESOURCE_LABEL: GlossTable = {
  "fdma-integrated-command-fukuoka-city": "A combined command team sent from Fukuoka City",
  "fdma-command-okayama-city": "A command team sent from Okayama City",
  "fdma-command-hiroshima-city": "A command team sent from Hiroshima City",
  "fdma-command-kitakyushu-city": "A command team sent from Kitakyushu City",
  "fdma-battalion-fukuoka": "A fire brigade sent from Fukuoka Prefecture",
  "fdma-battalion-oita": "A fire brigade sent from Ōita Prefecture",
  "fdma-battalion-miyazaki": "A fire brigade sent from Miyazaki Prefecture",
  "fdma-air-fukuoka-city": "A helicopter crew sent from Fukuoka City",
  "fdma-battalion-saga": "A fire brigade sent from Saga Prefecture",
  "fdma-battalion-okayama": "A fire brigade sent from Okayama Prefecture",
  "fdma-battalion-hiroshima": "A fire brigade sent from Hiroshima Prefecture",
  "fdma-battalion-yamaguchi": "A fire brigade sent from Yamaguchi Prefecture",
  "fdma-battalion-kagoshima": "A fire brigade sent from Kagoshima Prefecture",
  // "First town to send someone to check" read as though the town did the sending. The town is
  // where the checker goes, so the label names it as the destination.
  "modeled-verification-priority-01": "First town for someone to go and check",
  "modeled-verification-priority-02": "Second town for someone to go and check",
  "mlit-municipal-liaison-pair-01": "First pair of roads-ministry officers sent into a town hall",
  "mlit-municipal-liaison-pair-02":
    "Second pair of roads-ministry officers sent into a town hall",
  "gsdf-8th-division-response": "A response team sent by the army's 8th Division",
  "jwwa-additional-water-truck-pool": "Extra trucks that can carry drinking water",
  "defense-request-gsdf-8th-division": "Ask the army's 8th Division for help",
  "defense-request-msdf-sasebo": "Ask the navy at Sasebo for help",
  "modeled-national-extreme-hq-posture": "Open the highest level of national emergency command",
  "modeled-national-emergency-hq-posture":
    "Open the second-highest level of national emergency command",
  "modeled-fdma-request-posture": "Keep asking other prefectures to send fire crews",
  "modeled-fdma-instruction-posture":
    "Order other prefectures to send fire crews instead of asking",
  "modeled-shelter-monitoring-action":
    "Watch how full the shelters are across the whole prefecture",
  "modeled-wide-area-evacuation-action": "Move evacuated people out across a wider area",
  "modeled-shelter-water-priority-action": "Give the shelters first call on drinking water",
  "modeled-aftershock-priority-01": "First place to re-check after the aftershock",
  "modeled-aftershock-priority-02": "Second place to re-check after the aftershock",
  "modeled-mission-priority-01": "First job the division commits to protecting",
  "modeled-mission-priority-02": "Second job the division commits to protecting",
  "modeled-mission-priority-03": "Third job the division commits to protecting",
};

/**
 * The places a moment could choose between. Record path
 * `decision_context.target_labels{}.label`, keyed by the target identifier. Only the three
 * labels that named a thing without saying what it is are here; the fourteen town names and
 * `kosa-town` are proper names, and a proper name is left exactly as the record wrote it.
 */
export const TARGET_LABEL: GlossTable = {
  "kumamoto-incident-area": "area around Kumamoto hit by the earthquake",
  "aeon-mall-kumamoto": "Aeon Mall in Kumamoto",
  "nippon-paper-yatsushiro": "Nippon Paper's mill in Yatsushiro",
};

/**
 * The narration line under the clock. Record path `events[].payload.story.round_label`, keyed by
 * `round_id`. Each one is a short sentence a newspaper would print.
 */
export const ROUND_LABEL: GlossTable = {
  "round-01-shock-and-trigger":
    "An automatic alert arrives before anything is announced in public",
  "continuous-hour-one": "Hour one: reports keep arriving from across the region",
  "round-02-first-public-picture": "The first public account of the damage arrives",
  "round-03-two-silent-towns": "Two towns stay silent",
  "round-04-eyes-and-local-response": "The first observers reach some towns and not others",
  "round-05-local-network-forms": "Nearby fire departments start working as one",
  "continuous-first-night": "The first night: reports keep arriving from across the region",
  "round-06-outside-help": "Kumamoto asks other prefectures for help",
  "round-07-infrastructure-picture":
    "Road closures and water outages change which towns receive help first",
  "round-08-escalation": "The government switches to stronger emergency powers",
  "round-09-first-night-posture":
    "Agencies assign overnight rescue, shelter and water duties",
  "round-10-two-rescue-fronts": "Rescue crews work two collapsed buildings at once",
  "round-11-second-defense-request": "Kumamoto asks the armed forces for help a second time",
  "round-12-night-coordination": "Through the night, the agencies agree who does what",
  "round-13-midnight-picture": "What was known at midnight",
  "round-14-dawn-aggregate":
    "At dawn, figures covering the damage across the whole region arrive",
  "round-15-first-full-picture": "The first full account of the damage arrives",
  "continuous-day-two": "Day two: reports keep arriving as drinking water runs short",
  "round-16-rescue-counts": "The first counts of people rescued arrive",
  "round-17-water-without-requests": "Water trucks set out before towns ask for them",
  "round-18-response-reassigned": "Officials move crews to new jobs",
  "round-19-heat-and-water": "Hot weather makes it harder to keep people supplied with water",
  "round-20-day-two-close": "Day two ends with rescue work and water delivery still active",
  "round-21-the-peak": "Rescue forces reach their highest recorded staffing level",
  "continuous-the-turn": "Reports keep arriving as crews shift from rescue to water delivery",
  "round-22-centre-of-gravity": "Most of the effort shifts from rescue to water",
  "round-23-on-site-headquarters": "National officials set up an office in Kumamoto",
  "round-24-water-network-expands": "Water trucks begin serving more towns",
  "round-25-seventy-two-hour-day": "Crews make one final search before the 72-hour mark",
  "round-26-final-search": "Before 72 hours pass, crews search Kashima once more",
  "round-27-the-turn": "Most of the effort has moved to delivering water",
};

/**
 * The name of one named stretch of the seventy-two hours. Record path `acts[].label`, keyed by
 * `act_id`.
 */
export const ACT_LABEL: GlossTable = {
  "act-1-hour-one": "Hour one",
  "act-2-first-night": "The first night begins",
  "act-3-day-two": "Day two brings a water crisis",
  "act-4-the-turn": "Most crews shift from rescue to water delivery",
};

/**
 * What happened during one stretch of the seventy-two hours. Record path `acts[].story`.
 */
export const ACT_STORY: GlossTable = {
  "act-1-hour-one":
    "An automatic alert covering the whole region arrives before anyone knows what was"
    + " destroyed. No shaking readings arrive from two towns, so planners must treat their"
    + " conditions as unknown.",
  "act-2-first-night":
    "Fire crews, the armed forces and government officers each work from different reports."
    + " Two collapsed buildings and a failed system for taking emergency calls shape the night.",
  "act-3-day-two":
    "Damage figures covering the whole region arrive. Crews are moved, shelters fill, and"
    + " water trucks start going out before towns ask for them.",
  "act-4-the-turn":
    "Rescue work continues while most effort shifts to drinking-water delivery. Crews search"
    + " once more before the 72-hour mark.",
};

/**
 * The line the feed prints when a recorded moment arrives. Record path
 * `events[].payload.headline`, keyed by `milestone_id`.
 */
export const MILESTONE_HEADLINE: GlossTable = {
  "headquarters-open-1627":
    "Five town and prefecture governments opened emergency headquarters in the same minute as"
    + " the earthquake.",
  "shelter-stamps-1627":
    "At 16:27, the records add eighteen shelters; they do not reveal when each one opened.",
  "national-offices-1628":
    "Four national response offices opened while shaking readings still covered only whole"
    + " regions.",
  "tsunami-advisory-1629":
    "Japan's national weather agency issues a tsunami advisory for the Ariake and Yatsushiro"
    + " seas.",
  "prime-minister-instruction-1629":
    "Japan's Prime Minister orders three things: find the damage, save lives, tell people"
    + " quickly.",
  "support-email-1632":
    "Japan's Ministry of Internal Affairs, which supports local governments, tells Kumamoto to request help"
    + " immediately.",
  "kashima-kosa-intensity-gap-163528":
    "Japan's final bulletin for individual towns still has no shaking reading for Kashima or"
    + " Kōsa.",
  "police-video-1643":
    "A police helicopter sends the first live video into Japan's national crisis centre.",
  "defense-recon-1644":
    "Military planes begin looking at the damage from the air before the Governor asks for"
    + " help.",
  "kashima-shelter-stamp-1650":
    "Kashima's first shelter is recorded while its shaking reading is still missing.",
  "local-headquarters-and-shelters-1700":
    "Four more towns open emergency headquarters while more shelters are recorded.",
  "saga-fire-request-1708":
    "Kumamoto asks Saga for fire crews in the same minute as a strong aftershock.",
  "power-outage-peak-1709": "Power cuts reach about 48,530 homes, their highest recorded point.",
  "uto-hq-and-press-1725":
    "Uto opens its headquarters as the first national news briefing begins.",
  "ground-sdf-request-1730": "Kumamoto's Governor formally asks Japan's army for help.",
  "national-route-3-hikawa-close-1745":
    "National Route 3 closes at Hikawa where the quake left steps in the road.",
  "mlit-report-and-liaisons-1810":
    "Japan sends officer pairs to Uki and Hikawa after reviewing its first roads-and-railways"
    + " report.",
  "national-escalation-1820":
    "Japan sets up its top national disaster headquarters and turns fire requests into"
    + " orders.",
  "prefecture-helicopter-1825":
    "Kumamoto sends its own disaster helicopter to look at the damage.",
  "road-closure-batch-1900":
    "At 19:00, the record says travel was limited on thirteen roads. Not all of those limits"
    + " began at that time.",
  "disaster-relief-act-1900":
    "Kumamoto applies Japan's Disaster Relief Act to twenty-one towns and cities.",
  "national-hq-meeting-1945":
    "Japan's top national disaster headquarters holds its first meeting.",
  "prefecture-hq-meeting-1-2000":
    "Kumamoto splits the arriving crews between Kashima and Yatsushiro.",
  // The record's own word was "recovered", which in disaster reporting usually means bodies. The
  // source it is transcribed from — the minutes of the second prefectural meeting, written up at
  // docs/rescueworld/REAL-RESPONSE-RECONSTRUCTION.md line 914 — records all four as alive and
  // injured. The headline says which it was.
  "prefecture-hq-meeting-2-0000":
    "Four people are brought out alive at Kashima and ten are still missing.",
  "yatsushiro-dispatch-restored-2000": "Yatsushiro's system for sending fire crews works again.",
  "fire-instructions-2015-2028":
    "Japan orders in air support and fire crews from four more prefectures.",
  "naval-request-2100": "Kumamoto's Governor also asks Japan's navy for help.",
  "jma-hq-and-fire-air-2145":
    "Japan's national weather agency opens its headquarters and Saga is ordered to send"
    + " aircraft.",
  "yatsushiro-liaison-added-2150": "Yatsushiro also gets officers posted into its town hall.",
  "prime-minister-governor-call-2200":
    "Japan's Prime Minister and Kumamoto's Governor confirm they are working together.",
  "shelter-day-one-aggregate":
    "Records list 502 shelters opening on day one; timestamps are filing times, not exact"
    + " opening times.",
  "patient-transfer-0207": "An army helicopter carries eight civilians to hospital overnight.",
  "road-snapshot-0500": "The 05:00 road snapshot is published two hours later.",
  "dmat-0600": "Thirty teams of disaster doctors are now working in Kumamoto.",
  "shelter-aggregate-0620": "Shelters reach their highest count: 506 sites holding 9,186 people.",
  "cabinet-report-1-0700":
    "The first national count shows three deaths and three rescues still under way.",
  "first-visible-rescue-assignments-0700":
    "Officials assign one outside fire crew to each of three rescue sites.",
  "government-survey-1150": "A national survey team reaches Kashima to see the damage.",
  "shelter-aggregate-1310": "Shelter numbers fall to 419 sites and 7,547 people.",
  "national-hq-meeting-2-1330":
    "The response grows to 4,600 troops, 2,000 police and 1,410 firefighters.",
  "cabinet-report-2-1400": "Deaths reach eight and the crews working each rescue site change.",
  "air-conditioners-1520": "About 300 air conditioners arrive for shelters in the heat.",
  "prefecture-hq-meeting-4-1600":
    "Mayors hear the first count of deaths at each site, and where water goes in eight towns.",
  "sdf-day-two-posture": "Japan's army reaches about 4,600 people and 29 aircraft in Kumamoto.",
  "rescue-water-turn-0930":
    "Japan's army says water supply takes over once the search for survivors ends.",
  "heat-message-1224": "Stopping heat stroke becomes an official job for the response.",
  "cabinet-report-4-0730": "399 shelters hold 9,637 people.",
  "final-kashima-search":
    "Soldiers, police and firefighters go through Kashima once more before seventy-two hours"
    + " are up.",
  "seventy-two-hour-mark":
    "Seventy-two hours after the earthquake, rescue and water work are both still running.",
  "fdma-fire-mobilization-1627":
    "Fire crews from other prefectures start moving before anything is announced in public.",
  "municipal-function-check-1820":
    "Staff cannot enter Misato Town Hall, and Kōsa Town has lost its phone and data links.",
  "water-supply-begins-0630":
    "Japan's army starts handing out water at Yatsushiro City Hall.",
  "water-push-1200":
    "Water utilities across Japan prepare 22 additional trucks for Kumamoto.",
  "routes-3-57-access-secured":
    "Officials confirm National Routes 3 and 57 are passable again.",
  "shelter-occupant-peak-0630":
    "The number of people sleeping in shelters reaches its highest recorded figure, 9,931.",
  "rescue-tally-1200": "Crews have now pulled 98 people out and carried 620 more to safety.",
  "kumamoto-city-hq-1800":
    "Kumamoto City is the last town or city recorded opening an emergency headquarters.",
  "on-site-hq-decision-1330":
    "The national headquarters decides to open an office inside Kumamoto itself.",
  "prefecture-hq-meeting-7-0930": "Kumamoto Prefecture holds its seventh emergency meeting.",
};

/**
 * The sentence under a feed line. Record path `events[].payload.detail`, keyed by
 * `milestone_id`.
 */
export const MILESTONE_DETAIL: GlossTable = {
  "fdma-fire-mobilization-1627":
    "Japan's national fire and disaster agency opened its headquarters in the same minute as"
    + " the earthquake. It asked for eight outside teams: command staff, fire crews and"
    + " aircraft.",
  "shelter-stamps-1627":
    "Thirteen of them are in Yatsushiro and the rest are other community buildings. The"
    + " shared 16:27 stamp is a filing time. The records do not give the exact minute each"
    + " shelter opened.",
  "national-offices-1628":
    "Japan's Prime Minister's office, its national police, its Cabinet Office and its digital"
    + " agency all opened response teams in the same minute.",
  "tsunami-advisory-1629":
    "This is the second alert covering a whole region. Towns still have no published shaking"
    + " numbers of their own.",
  "prime-minister-instruction-1629":
    "Japan's Prime Minister gives only one numbered order in the whole earthquake. At that"
    + " point the only public facts are one region-wide bulletin and a tsunami advisory.",
  "support-email-1632":
    "Forty-four seconds after the first bulletin naming single towns, an email goes out from"
    + " Japan's ministry for local government to Kumamoto.",
  "uki-reihoku-headquarters-1635":
    "Uki opens its headquarters just over three minutes after a bulletin first gives the town"
    + " a shaking level of seven.",
  "kashima-kosa-intensity-gap-163528":
    "Both towns are still shown with no shaking reading received. No later bulletin for single"
    + " towns arrives for the first earthquake, so the replay leaves both readings blank.",
  "police-video-1643":
    "A national police helicopter starts sending live pictures from Kumamoto at 16:43.",
  "defense-recon-1644":
    "Japan's national defense ministry starts flying over the damage. That is forty-six"
    + " minutes before Kumamoto formally asks for the army.",
  "kashima-shelter-stamp-1650":
    "The 16:50 stamp records when the entry was filed, not when the shelter opened. It cannot"
    + " show when the mayor made the decision.",
  "local-headquarters-and-shelters-1700":
    "Misato, Nagomi, Ōzu and Mashiki open headquarters. Kumamoto City, Tamana and Misato open"
    + " their first shelters.",
  "saga-fire-request-1708":
    "Saga's prefectural fire brigade sends the crews. An aftershock in the same minute"
    + " reaches level five lower across the south of the region.",
  "power-outage-peak-1709":
    "No later reading has more homes cut off. It comes forty-two minutes after the"
    + " earthquake.",
  "uto-hq-and-press-1725":
    "Uto opens its headquarters at 17:25. In the same minute, Japan's Chief Cabinet Secretary"
    + " gives the first national briefing on the earthquake.",
  "ground-sdf-request-1730":
    "The army is asked to gather information, save lives, carry supplies and support daily"
    + " living. Two towns still have no shaking reading.",
  "national-route-3-hikawa-close-1745":
    "Only four road closures in Kumamoto carry an exact minute; the rest are rounded. This is"
    + " one of the four.",
  "kumamoto-city-hq-1800":
    "Kumamoto City is the largest city in the prefecture. It opens its disaster headquarters"
    + " at 18:00, ninety-three minutes after the earthquake.",
  "mlit-report-and-liaisons-1810":
    "The report names damage on five expressway routes, on Kyushu's railway for bullet"
    + " trains, on seventeen other railway lines and at the airport. It also names five towns"
    + " with water problems, and sends the first two pairs of officers to the two towns that"
    + " shook hardest.",
  "national-escalation-1820":
    "Japan's Prime Minister sets up the top national headquarters for the emergency. Japan's"
    + " national fire and disaster agency stops asking other prefectures for crews and starts"
    + " ordering them in.",
  "municipal-function-check-1820":
    "Misato runs its town hall on backup power and staff cannot go inside. Kōsa's network is"
    + " down. The other towns with hard shaking were checked and report no problem doing their"
    + " work.",
  "road-closure-batch-1900":
    "These closures are on national and prefectural roads in Yatsushiro and Uki, Yamato and"
    + " Mifune, Kōsa and Misato. The one clock time shows when the records were typed in."
    + " Thirteen roads did not all close at the same minute.",
  "national-hq-meeting-1945":
    "The meeting agrees an eight-point plan of action and counts about 3,600 troops on the"
    + " ground.",
  "prefecture-hq-meeting-1-2000":
    "Officials mobilized 149 teams with 535 responders in total. The record does not say how"
    + " many went to Kashima shopping centre. Fire brigades from Ōita and Miyazaki went to"
    + " Yatsushiro, and army forces moved toward Kashima. The record gives no headcount for each"
    + " site.",
  "yatsushiro-dispatch-restored-2000":
    "The public record does not say when the system failed, or how crews worked while it was"
    + " down. The replay does not invent a length for the outage.",
  "fire-instructions-2015-2028":
    "At 20:15 Japan orders in air crews from Miyazaki, Kitakyushu and Nagasaki. At 20:28 it"
    + " orders in fire crews from Okayama and Hiroshima, Yamaguchi and Kagoshima.",
  "naval-request-2100":
    "The request goes to Sasebo, where Japan's navy has a base. It never appears in the"
    + " national table of forces sent.",
  "jma-hq-and-fire-air-2145":
    "Japan's national weather agency opens its headquarters at 21:00. At 21:45 Saga gets the"
    + " last order of the night to send aircraft.",
  "prime-minister-governor-call-2200":
    "They agree that the national government and Kumamoto will keep working closely together.",
  "shelter-day-one-aggregate":
    "Of those, 19 are stamped in the 16:00 hour, 146 in the 17:00 hour, 200 in the 18:00"
    + " hour, 96 in the 19:00 hour and 41 later. These stamps record filing times, not when each"
    + " mayor decided to open a shelter.",
  "prefecture-hq-meeting-2-0000":
    "The prefecture's second meeting notes that rescue is under way. It gives a first order"
    + " for the night: where water stays off, move people to shelters or further away.",
  "patient-transfer-0207":
    "An army helicopter from the 8th Aviation Squadron makes the first flight of the night"
    + " carrying a patient.",
  "road-snapshot-0500":
    "Twenty-nine closures are drawn as shapes on the map. Twenty-three of them carry a start"
    + " minute; the other six have no clock at all.",
  "dmat-0600": "Eighteen teams work at headquarters and twelve work out in the field.",
  "shelter-aggregate-0620":
    "Nothing later in the record has more shelters open. The number is for the whole"
    + " prefecture, and the record does not name the shelters.",
  "cabinet-report-1-0700":
    "The report names a chimney at Yatsushiro, a shop building at Kashima and houses at"
    + " Hikawa. It counts orders to leave home for the whole prefecture, with no times for"
    + " single towns.",
  "prefecture-hq-meeting-3-0930":
    "This meeting is the first to count rescues site by site. Work goes on at Hikawa and"
    + " Yatsushiro.",
  "government-survey-1150":
    "A national survey team reaches Kumamoto Prefecture headquarters at 13:00.",
  "water-push-1200":
    "Five ministry trucks and eighteen from water companies are already promised to towns"
    + " that asked. The twenty-two new trucks are told to go without waiting to be asked.",
  "shelter-aggregate-1310":
    "At midday the figure is for the whole prefecture. The record does not say how many"
    + " people were at each shelter.",
  "national-hq-meeting-2-1330":
    "The second national meeting also advances a scheduled transfer of national funds to"
    + " local councils.",
  "air-conditioners-1520":
    "A military plane brings them to Kumamoto Airport. They go on to Uki and Misato,"
    + " Yatsushiro and Mifune, and Uto, against a forecast of 35 degrees.",
  "prefecture-hq-meeting-4-1600":
    "The meeting keeps two kinds of number apart: totals for the whole prefecture, and counts"
    + " at each site. Army, navy and Coast Guard water teams work in eight named towns.",
  "routes-3-57-access-secured":
    "The source gives the day but no clock for either road. The replay puts this at the end"
    + " of the day and says so on screen. It does not invent a reopening time.",
  "sdf-day-two-posture":
    "Four of the navy's five ships reach Yatsushiro Port. About 170 people work at Kashima"
    + " and 30 to 40 at a mill in Yatsushiro.",
  "shelter-occupant-peak-0630":
    "These 9,931 people are spread across 419 shelters. The largest number of open shelters,"
    + " 506, happened at a different time.",
  "rescue-water-turn-0930":
    "Outside fire crews have made twenty-two rescues and three jobs are still running. Once"
    + " the search for survivors ends, most of the effort will move to water supply.",
  "heat-message-1224":
    "Japan's national fire and disaster agency starts warning people through social media and"
    + " leaflets.",
  "on-site-hq-decision-1330":
    "The new national field headquarters opens in Kumamoto Prefecture's offices 30 minutes"
    + " later.",
  "prefecture-hq-meeting-6-1600":
    "The last rescue at Yatsushiro needs heavy machines that cannot reach the spot. Japan's"
    + " new national team has moved into the same centre the prefecture uses.",
  "day-three-defense-posture":
    "Japan's army is now about 5,100 people here. Teams are still searching at Kashima,"
    + " Yatsushiro and Hikawa.",
  "cabinet-report-4-0730":
    "More people are told to leave home, and fifty-six teams of disaster doctors are working."
    + " Every number here is a total for the whole prefecture.",
  "final-kashima-search":
    "Soldiers, police and firefighters work through the site during the day. The source gives"
    + " no clock, so noon is only where the replay puts it on screen.",
  "water-sites-41":
    "Water support expands to 41 sites while crews conduct the final Kashima search. The"
    + " public record does not give a complete staffing breakdown.",
  "joint-headquarters-1600":
    "This is the first meeting for the national team and the eighth for the prefecture. From"
    + " now on they meet together.",
  "seventy-two-hour-mark":
    "The replay stops exactly seventy-two hours after the earthquake. People going home,"
    + " official disaster labels and the long rebuild all fall outside it.",
  "disaster-relief-act-1900":
    "Kumamoto Prefecture applies that law to ten cities, ten towns and one village.",
  "rescue-tally-1200":
    "Local fire departments and outside fire crews report 98 people rescued and 620 moved to"
    + " safety across the region since the earthquake.",
  "water-supply-begins-0630":
    "About ten soldiers begin distributing water at Yatsushiro City Hall with three trailers."
    + " Later that day, the town opens seven more places where people can collect water.",
  "prefecture-hq-meeting-7-0930":
    "This is the last morning meeting Kumamoto Prefecture holds on its own, before the"
    + " national team joins it.",
};

/**
 * The one-line version of a moment's task, printed on the real-decision page. Path
 * `slots[].task_line` in `app/public/real-response-summary.json`.
 */
export const SUMMARY_TASK_LINE: GlossTable = {
  "slot-01-early-fire-mobilization":
    "Choose up to eight fire units to move into Kumamoto straight away.",
  "slot-02-missing-telemetry-triage":
    "Choose the two towns to check first, and say which one comes first.",
  "slot-04-first-municipal-liaisons": "Send exactly two pairs of officers into two town halls.",
  "slot-06-first-night-response-split":
    "Divide four fire brigades and one army team between two collapsed buildings.",
};

/**
 * What the real officials did, in the shorter wording the real-decision page prints. Path
 * `slots[].historical.summary`.
 */
export const SUMMARY_HISTORICAL: GlossTable = {
  "slot-01-early-fire-mobilization":
    "The real 16:27 request named one lead command team, three more command teams, three fire"
    + " brigades and one helicopter crew.",
  "slot-02-missing-telemetry-triage":
    "The reviewed public records name no action taken specifically because Kashima and Kōsa"
    + " lacked shaking readings. The 16:35 update still left both readings blank.",
  "slot-04-first-municipal-liaisons":
    "The real choice sent two officers into Uki and two into Hikawa. Yatsushiro got its own"
    + " pair later.",
  "slot-06-first-night-response-split":
    "Minutes from the meeting say incoming crews went to Aeon Mall. Fire brigades from Ōita and"
    + " Miyazaki went to Yatsushiro, and the army's 8th Division went to Aeon Mall. The minutes"
    + " do not state how many responders went to each site.",
  "slot-09-push-water-planning":
    "The real record says a national group of water utilities made about 22 additional trucks"
    + " ready and sent them without waiting for towns to ask. It never says how many went to"
    + " each town.",
};

/**
 * The sentence under one marked moment in the closing reel. Path `reel[].caption` in
 * `app/public/rescueworld-highlights.json`, keyed by the kind of moment it marks.
 */
export const REEL_CAPTION: GlossTable = {
  "exceptional":
    "AI using a source table and one message naming its mistake passed every prewritten check"
    + " in all 8 tries here.",
  "perfect_repair":
    "All 8 first answers missed at least one rule. One exact checker message led all 8 revised"
    + " answers to pass.",
  "persistent_problem":
    "Even after using sources and revising once, the AI failed most of its 8 tries here.",
};

/**
 * The two sentences beside an eight-try strip: how far the tries agreed, and how many passed
 * every prewritten check. Path `moments[].methods[].agreement_caption` and `.pass_caption`,
 * keyed by the field and the sentence, because the file repeats the same sentence at many
 * moments and each distinct sentence is one string on screen.
 */
export const STRIP_CAPTION: GlossTable = {
};

/**
 * The names in the two files derived from the recording,
 * `app/public/real-response-summary.json` and `app/public/rescueworld-highlights.json`. Those
 * files are rebuilt from the recording by `app/scripts/bake-real-response.mjs` and
 * `app/scripts/derive-rescueworld-highlights.mjs`, so they are read-only here for the same
 * reason the recording is, and the key is the exact string the file holds.
 */
export const SUMMARY_LABEL: GlossTable = {
  "Additional Japan Water Works Association truck pool":
    "Extra trucks that can carry drinking water",
  "Aeon Mall Kumamoto": "Aeon Mall in Kumamoto",
  "Fukuoka City air unit": "A helicopter crew sent from Fukuoka City",
  "Fukuoka City integrated command support unit":
    "A combined command team sent from Fukuoka City",
  "Fukuoka prefectural battalion": "A fire brigade sent from Fukuoka Prefecture",
  "Ground Self Defense Force 8th Division response group":
    "A response team sent by the army's 8th Division",
  "Ground Self-Defense Force 8th Division response group":
    "A response team sent by the army's 8th Division",
  "Hiroshima City command support unit": "A command team sent from Hiroshima City",
  "Kitakyushu City command support unit": "A command team sent from Kitakyushu City",
  "Kumamoto 2026: the first seventy-two hours as one regional event stream":
    "Kumamoto 2026: seventy-two hours after the earthquake, replayed as one stream of"
    + " recorded events",
  // The one target that is a whole region rather than a town, so it carries its article. Every
  // sentence on the real-decision surface reads "to the area the earthquake hit"; the trace
  // surface reads the same name out of `TARGET_LABEL`, where `placeWords` supplies the article
  // from the target's own recorded kind and the entry therefore carries none.
  "Kumamoto incident area": "the area around Kumamoto that the earthquake hit",
  "MLIT municipal liaison pair 1": "First pair of roads-ministry officers sent into a town hall",
  "MLIT municipal liaison pair 2": "Second pair of roads-ministry officers sent into a town hall",
  "Miyazaki prefectural battalion": "A fire brigade sent from Miyazaki Prefecture",
  "Nippon Paper Yatsushiro mill": "Nippon Paper's mill in Yatsushiro",
  "Okayama City command support unit": "A command team sent from Okayama City",
  "Saga prefectural battalion": "A fire brigade sent from Saga Prefecture",
  "The evidence desk": "AI using a source table",
  "The evidence desk with one correction":
    "AI using a source table, then revising after one error message",
  "The plain desk": "AI using plain notes",
  "Unit fukuoka city air unit": "A helicopter crew sent from Fukuoka City",
  "Unit fukuoka city command": "A command team sent from Fukuoka City",
  "Unit fukuoka prefectural fire battalion": "A fire brigade sent from Fukuoka Prefecture",
  "Unit hiroshima city command": "A command team sent from Hiroshima City",
  "Unit kitakyushu city command": "A command team sent from Kitakyushu City",
  "Unit miyazaki prefectural fire battalion": "A fire brigade sent from Miyazaki Prefecture",
  "Unit okayama city command": "A command team sent from Okayama City",
  "Unit ota prefectural fire battalion": "A fire brigade sent from Ōita Prefecture",
  "Verification priority slot 1": "First town for someone to go and check",
  "Verification priority slot 2": "Second town for someone to go and check",
  "an evidence table with one correction": "an evidence table and one chance to fix it",
  "Ōita prefectural battalion": "A fire brigade sent from Ōita Prefecture",
};

/**
 * The jargon a recorded answer used in its own written reason, and the plain words for each one.
 *
 * Every other table in this file replaces the record's sentence. This one cannot, because these
 * sentences are the evidence: the trace panel shows a viewer what the software actually wrote at
 * the moment it decided, and a reworded quotation proves nothing. So the quotation stands
 * unchanged and the plain words are added inside square brackets after it, where a reader can see
 * that the brackets are ours and the rest is the machine's.
 *
 * A blind reader who was given these sentences with no project context could follow the shape of
 * each one and then lost every specific. "Assign modeled verification-priority slots to Kashima
 * Town and Kōsa Town due to unresolved telemetry gaps" reads, with the brackets,
 * "...modeled verification-priority slots [places on the list of which towns to check first]
 * ... telemetry gaps [readings that never arrived]".
 *
 * Three rules hold here.
 *
 *   The quotation is never edited. Nothing is deleted, reordered or corrected, including the
 *   answer's own arithmetic mistakes and its one misspelling of the army's name.
 *
 *   The plain words agree with the rest of the page. Where `RESOURCE_LABEL` above already names
 *   a thing, the bracket says the same thing in the same words.
 *
 *   The longest term wins, and each term is explained once per quotation. "JMA intensity" is
 *   explained as a whole before "JMA" can match inside it, and the fourth "GSDF" in a paragraph
 *   is not explained a fourth time.
 */
export const QUOTED_JARGON: GlossTable = {
  // The written rules a moment sets for its own answer, and the parts of them the answers name.
  "action contract": "the written rules for what this decision may use",
  "maximum assignment constraints": "the limit on how many units may be sent",
  "assignment limits": "the limit on how many units may be sent",
  "two-assignment limit": "the rule allowing two at most",
  "two-unit limit": "the rule allowing two units at most",
  "eligible resources": "the units this decision was allowed to use",
  "eligible resource": "a unit this decision was allowed to use",
  "indivisible resource": "something that has to be sent whole or not at all",
  "resource reuse": "sending the same unit to two places",
  "the cutoff time": "the moment the decision had to be made by",
  "the decision cutoff": "the moment the decision had to be made by",

  // What the exercise built rather than found, and what each built thing stands for.
  "modeled verification-priority slots":
    "invented places on the list of which towns to check first",
  "verification-priority slots": "places on the list of which towns to check first",
  "modeled coordination actions": "region-wide courses of action invented for the exercise",
  "modeled mission priorities": "invented markers for which job the division protects first",
  "modeled mission priority": "an invented marker for which job the division protects first",
  "mission priorities": "markers for which job the division protects first",
  "modeled actions": "courses of action invented for the exercise",
  "modeled-shelter-monitoring-action":
    "watch how full the shelters are across the whole prefecture",
  "modeled-shelter-water-priority-action": "give the shelters first call on drinking water",
  "modeled-wide-area-evacuation-action": "move evacuated people out across a wider area",
  "unknown-aftershock-field-condition":
    "the record does not show whether each active site was checked after the aftershock",
  "unknown-people-alive-by-time":
    "the available records do not show who was still alive when the choice was made",
  // The same two identifiers again, written by an answer that dropped the hyphens. Without these
  // entries "unknown people alive by time" reaches the screen as a phrase that does not parse as
  // English, while the hyphenated form two quotations later carries its plain words.
  "unknown people alive by time":
    "the available records do not show who was still alive when the choice was made",
  "unknown field condition": "the record does not show the site's condition",
  "one token": "one of the three markers this moment hands out",

  // The alert nobody has published, and the readings that never came in.
  "internal payload": "the exact content of the internal alert",
  "internal signal": "the internal alert",
  "internal trigger": "the internal alert",
  "internal automatic trigger": "the alert the warning system raised by itself",
  "reconstructed automatic trigger":
    "the alert this exercise worked out the warning system must have raised",
  "reconstructed assumption": "an assumption created for this exercise",
  "observed real units": "the crews the record shows were really sent",
  "telemetry gaps": "readings that never arrived",
  "telemetry gap": "a reading that never arrived",
  "missing telemetry": "readings that never arrived",
  "telemetry": "readings sent in on their own",

  // The offices and forces, each spelled out the first time an answer names it.
  "JMA intensity": "Japan's shaking scale, which runs from 0 to 7",
  "JMA": "Japan's weather agency",
  "MLIT": "Japan's ministry for roads and transport",
  "GSDF": "Japan's army",
  "MSDF": "Japan's navy",
  "GSF": "Japan's army, spelled here without its middle letter",
  "SDF": "Japan's self-defence forces",
  "ERT": "an emergency rescue team",
  "FDMA": "Japan's fire and disaster agency",
  "liaison pairs": "officers sent in twos to carry messages into a town hall",
  "liaison pair": "two officers sent to carry messages into a town hall",
  "liaison": "carrying messages between two organisations",
  "request channels": "the formal ways of asking for help",
  "request channel": "the formal way of asking for help",
  "multi-modal support": "help arriving by land and by sea",
  "maritime trigger": "whatever prompted the request to Japan's navy",

  // How the response was arranged, and what breaks when a town hall cannot work.
  "national headquarters posture": "the level the national emergency command opens at",
  "fire mobilization posture": "how other prefectures are told to send fire crews",
  "instruction-based fire mobilization": "ordering other prefectures to send fire crews",
  "fire mobilization": "calling in fire crews from other prefectures",
  // "instruction posture" used to fall through to "posture" below and be glossed "the readiness
  // level", which contradicts the phrase: it is a way of summoning crews, not a level of
  // readiness. It names the same thing RESOURCE_LABEL calls
  // "Order other prefectures to send fire crews instead of asking".
  "instruction posture": "ordering other prefectures to send fire crews instead of asking",
  "posture": "the readiness level",
  "degraded municipal functions": "town halls that could no longer do their work",
  "municipal-function failures": "town halls that could no longer do their work",
  "municipal function degradation": "town halls losing the ability to do their work",
  "municipal dysfunction": "town halls unable to do their work",
  "degraded procedure": "how the staff worked while the system was broken",
  "degraded dispatch system": "the call-out system while it was broken",
  "prefecture-wide aggregate": "the total added up across the whole prefecture",
  "conditional shift": "the planned change once life-saving ends",
  "heavy damage belief": "what was believed about the heavy damage",
  "the heaviest damage believed": "the damage believed to be heaviest",
  "coordination status": "how well the organisations there were working together",
  "personnel interchangeability": "workers being able to switch from one job to another",
  "decision context": "the picture this decision was made from",

  // How the emergency itself was moving, and what each answer could see of a place.
  "incident dynamics": "how the emergency was unfolding",
  "incident evolution": "how the emergency would go on unfolding",
  "ongoing dynamics": "how the situation keeps changing",
  "overlapping intensity": "the same shaking level as another town",
  "quay deformation": "the ground behind a dock wall moving",
  "limited impact": "little damage reported there",
  "functioning utilities": "working water and power",

  // What the answer says it could not do better, and why.
  "precise optimization": "picking the best possible mix",
  "further optimization": "picking a better mix",
  "fully optimized": "the best possible",
  "optimization": "picking the best mix",
};

/**
 * The character a matched run is parked behind while the pass runs. It is the unit-separator
 * symbol, which no recorded sentence holds, so the digits of a real number — "Selected 8 eligible
 * resources" — can never be read back as a parked run.
 */
const MARK = "␟";

/**
 * One recorded answer's own reason, with the plain words added in square brackets.
 *
 * The longest term is matched first so a term inside another term cannot claim it: "JMA
 * intensity" is explained as a whole before "JMA" can match its first three letters. Every
 * occurrence is parked as it is matched, so the fourth "GSDF" in a paragraph is not explained a
 * fourth time and no bracket is ever nested inside another.
 *
 * The same pass runs in `app/scripts/audit-plain-text.mjs`, which reads this table out of this
 * file, so the audit judges the words a viewer reads and not the record's own.
 */
export function plainQuoted(raw: string): string {
  const text = String(raw ?? "");
  if (!text) return text;
  const terms = Object.keys(QUOTED_JARGON).sort((a, b) => b.length - a.length);
  const held: string[] = [];
  let out = text;
  for (const term of terms) {
    // An acronym is matched with its case kept, so "SDF" cannot claim the letters inside a word
    // and "act" in "action contract" cannot fire on the name of a law.
    const cased = /^[A-Z]{2,}$/.test(term);
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      cased ? "g" : "gi");
    let first = true;
    out = out.replace(re, (hit) => {
      const at = held.length;
      held.push(first ? `${hit} [${QUOTED_JARGON[term]}]` : hit);
      first = false;
      return `${MARK}${at}${MARK}`;
    });
  }
  return out.replace(new RegExp(`${MARK}(\\d+)${MARK}`, "g"), (_all, at) => held[Number(at)]);
}

// -------------------------------------------------------------- what the render sites call

/** the plain title of one decision moment */
export const plainSlotTitle = (id: string, raw: string) => glossed(SLOT_TITLE, id, raw);
/** who decided, said with what that person or office does */
export const plainDecider = (id: string, raw: string) => glossed(DECIDER, id, raw);
/** what the moment asked an answer to do */
export const plainSlotTask = (id: string, raw: string) => glossed(SLOT_TASK, id, raw);
/** what the real officials did, from the public record */
export const plainHistoricalSummary = (id: string, raw: string) =>
  glossed(HISTORICAL_SUMMARY, id, raw);
/** one line of what the public record does not say about the real choice */
export const plainHistoricalUnknown = (id: string, index: number, raw: string) =>
  glossedItem(HISTORICAL_UNKNOWN, id, index, raw);
/** one line of what the exercise assumed in order to pose the moment */
export const plainAssumption = (id: string, index: number, raw: string) =>
  glossedItem(ASSUMPTION, id, index, raw);
/** one thing nobody could know at the time */
export const plainUnknown = (id: string, raw: string) => glossed(REQUIRED_UNKNOWN, id, raw);
/** one report the moment made available */
export const plainObservation = (id: string, raw: string) => glossed(OBSERVATION, id, raw);
/** what that report does not establish */
export const plainObservationCaveat = (id: string, raw: string) =>
  glossed(OBSERVATION_CAVEAT, id, raw);
/** one unit or one course of action the moment could choose */
export const plainResource = (id: string, raw: string) => glossed(RESOURCE_LABEL, id, raw);
/** one place the moment could choose */
export const plainTarget = (id: string, raw: string) => glossed(TARGET_LABEL, id, raw);
/** the narration line under the clock */
export const plainRound = (id: string, raw: string) => glossed(ROUND_LABEL, id, raw);
/** the name of one stretch of the seventy-two hours */
export const plainActLabel = (id: string, raw: string) => glossed(ACT_LABEL, id, raw);
/** what happened during one stretch of the seventy-two hours */
export const plainActStory = (id: string, raw: string) => glossed(ACT_STORY, id, raw);
/** the feed line for one recorded moment */
export const plainHeadline = (id: string, raw: string) => glossed(MILESTONE_HEADLINE, id, raw);
/** the sentence under one feed line */
export const plainDetail = (id: string, raw: string) => glossed(MILESTONE_DETAIL, id, raw);
/**
 * A name in one of the two files derived from the recording. Those files carry no identifier
 * beside the name, so the name itself is the key.
 */
export const plainSummaryLabel = (raw: string) =>
  glossed(SUMMARY_LABEL, String(raw ?? "").trim(), raw);

/**
 * A name with no article in front of it, for the one sentence that supplies its own. The worked
 * example reads "By 12:00 the ... had to plan", so the name it is handed must not start with
 * "the" as well. Every other surface prints the name as this file writes it.
 */
export const withoutArticle = (name: string) =>
  String(name ?? "").replace(/^(the|a|an)\s+/i, "");
