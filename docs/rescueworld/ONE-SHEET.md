# Rescue World: one-sheet guide

## What this is

Rescue World replays the first 72 hours after a Kumamoto earthquake and shows eleven moments when
an AI had to make a response proposal. It lets a person see the situation, the AI's proposal, the
reports it used, the questions that were still unanswered, and whether the proposal passed the
exercise's rules.

The key finding is simple: when an early decision creates work for later, the system makes a short
action card. When that later step becomes possible, the exact card is placed in front of the AI
handling it. In the focused test, both Qwen models completed the required follow-up in all eight
saved histories on their first attempt.

## Open it

From the repository root:

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5184/rescueworld.html`.

## The fastest useful tour

1. Read the opening card and press **Begin**.
2. Set the replay to **16×** if you need to move quickly.
3. Read the large panel on the right. It explains what is happening now.
4. Open a decision in the list below it. Read the proposed action first: what, how much, and where.
5. Press **T** to see how that proposal was built from reports and unanswered questions.
6. Press **B** to see all eleven decisions on one map.
7. Open `http://127.0.0.1:5184/impact-view.html` for the plain-English outcome and action-card result.
8. Open `http://127.0.0.1:5184/decision-network.html` to see the AI work behind one proposal.
9. Press **Esc** whenever a panel covers the world.

## What the three main pages answer

- **Rescue World:** What happened, what did the AI propose, and what was known at that moment?
- **Impact view:** What remained unresolved across the simulation, and what happened in the
  focused action-card test?
- **Decision network:** Which AI steps gathered information, checked it, and produced the proposal?

On the network page, every color names a different kind of work. Click a node to isolate the path
that produced it. Use **Method**, **Next run**, and **Growth run** to move through the recorded
views. The colors and shapes are a reading aid; the sentence beside the selected node is the main
explanation.

## The one-minute explanation to give another person

“We studied how an AI can keep making connected decisions during a long, changing situation. None
of the 32 full simulation runs completed one required paper-mill confirmation. We selected eight
saved histories where a valid paper-mill assignment existed and tested that handoff directly. We
turned the assignment into a short action card containing the resource, place, evidence, open
questions, and required next step. The system delivered the card when the follow-up became
possible. Qwen3-32B and Qwen3.5-122B each completed the exact follow-up in all eight saved test
histories on the first attempt. Rescue World lets a person inspect that whole chain.”

## The numbers to keep exact

- Full continuous exercise: **32 complete 72-hour runs**, **352 checked decision moments**.
- Shared handoff gap: **0 of 32** completed the paper-mill confirmation.
- Focused action-card test: **8 saved histories** with a valid earlier assignment.
- Qwen3-32B: **8/8** exact first-try follow-ups; **8/8** full safety checks; **0** false completions.
- Qwen3.5-122B: **8/8** exact first-try follow-ups; **7/8** full safety checks; **0** false completions.
- The remaining Qwen3.5 safety case kept the unsupported task open but missed an assignment-count
  and supporting-report rule.

## What not to claim

This is a modeled exercise, not a real dispatch system. It does not measure people reached, lives
saved, or whether the real emergency response would have improved. The focused result tests one
follow-up, eight saved histories, one incident, and two models from the same Qwen family.

## If something looks wrong

- Press **H** to return the camera home.
- Press **Space** to pause or resume.
- Press **?** for the built-in help.
- Press **Esc** to close the top panel.
- Verify the packaged evidence from the repository root with:

```bash
node scripts/bake-receipt-fork.mjs --check
```
