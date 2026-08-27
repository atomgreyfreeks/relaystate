# Gold Standard for Presenting Experiment Findings

This document is the canonical example for explaining AURAWORLD experiment results.
Future reports, summaries, classroom materials, and presentations should match this
standard before introducing charts, architecture diagrams, or specialist vocabulary.

## Required storytelling order

1. Begin with the human problem and the question we were trying to answer.
2. Explain the experiment through one concrete, understandable example.
3. Say what the baseline system did and why it could fail.
4. Walk through what each test taught us, including failed ideas.
5. Describe the change that produced the final result in ordinary language.
6. Give the exact measured result and translate the number into a familiar scale.
7. State the finding precisely; do not expand it into a broader claim than the data supports.
8. Name specific real-world jobs where the finding could be useful.
9. Compare the technique with current standard practice: what is common, what is combined differently, and what has not been shown to be novel.
10. End with the important limitation and the exact next experiment.

The reader should never need the source report to understand the story. Terms must be
defined before they are used, numbers must be interpreted, and every chart must support
a sentence that already makes sense on its own.

---

## Gold-standard example 1: the complete story

We wanted to know whether a team of AI agents could work better by borrowing ideas from natural intelligence. A normal AI workflow is like a factory assembly line: Agent 1 completes its step, sends a written message to Agent 2, and the process follows the same arrows every time. Our “growth intelligence” idea was that the workflow should behave more like a living team: notice uncertainty, revisit neglected possibilities, change who examines what, and keep competing explanations alive until evidence settles the question.

To test this, we gave teams of AI agents computer problems to diagnose. Imagine an online store suddenly stops working. There are three possible causes: a gateway setting changed, an inventory system broke, or a security certificate expired. Several AI “scouts” examine different clues. Other agents review the possible causes. A final agent must name the real cause, recommend the correct repair, and identify the evidence proving it. We deliberately included difficult situations where most scouts confidently supported the wrong answer, where the scouts disagreed, and where none of the proposed answers was valid.

Our first tests seemed to show that growth-style workflows were better. Changing the agents’ job titles barely helped: scores increased by only about 3 points, and the result was uncertain. Changing how information moved between agents helped much more: the score increased by about 16 points. This gave us our first important finding: **the communication structure mattered more than giving the agents fancy specialist roles.**

But the next test exposed a problem. When we created a “smarter” router that reacted to disagreement by sending more agent reports around, performance did not improve. It actually became slightly worse. The agents received several confident paragraphs that contradicted one another, but they had no reliable way to determine which statements were facts. This taught us that **sending more opinions around is not the same as improving intelligence. A complicated graph can simply distribute confusion more efficiently.**

That failure led to the most important change. Instead of letting agents send one another open-ended essays, we required each reviewer to complete something like an evidence card. For every possible cause, the reviewer had to report one of three exact states:

- **Supported:** an independent check confirms this cause.
- **Rejected:** an independent check disproves this cause.
- **Unresolved:** the available evidence cannot decide.

Ordinary computer code then checked those cards and attached the exact evidence and repair instructions. The final AI agent received a clean table of verified facts instead of a pile of competing paragraphs.

That version produced the clearest result. On 120 new computer mysteries, the ordinary guarded workflow scored **65.98 out of 100**. The evidence-state workflow scored **96.52 out of 100**—an improvement of **30.54 points on a 100-point scale**. It also selected the exact correct answer in **all 120 cases**. In the hardest situations, where different agents supported different answers, it improved by **27.81 points** and passed every safety check we had defined.

So the real finding is not simply “growth intelligence works.” The more precise finding is:

> **AI teams became dramatically more reliable when agents stopped exchanging persuasive stories and started exchanging small, clearly defined, verifiable evidence states.**

In real-world terms, imagine a hospital team, an IT support group, or investigators working on a case. If everyone sends long messages saying what they think happened, the loudest or most repeated opinion can win—even when it is wrong. If each person must instead mark every possibility as confirmed, disproved, or still uncertain, and attach the evidence, the team can make a much safer decision.

This suggests that one powerful use of growth intelligence in agent graphs is **managing uncertainty and disagreement**. The graph should not merely decide which agent speaks next. It should protect minority possibilities, demand independent checks, track what has actually been proven, and prevent an attractive guess from quietly turning into a “fact.”

However, we have not yet proven that the improvement came entirely from the evidence-state idea. The winning system combined two changes: structured evidence states and ordinary code that checked and attached exact information. We also tested synthetic computer mysteries using one model. The honest next experiment is therefore to separate those ingredients and test them on messier, more realistic work.

But the signal is strong enough to continue. We began by asking, **“Can growth-inspired routing make AI teams smarter?”** What we learned was more useful:

> **The biggest opportunity may not be making AI agents think more. It may be teaching them how to communicate what they know, what they do not know, and what the evidence actually proves.**

---

## Gold-standard example 2: why the finding matters

This matters because most AI-agent failures happen when one agent’s confident guess gets passed through the workflow until everyone treats it like a fact. Our experiment found a specific way to interrupt that failure: require every agent to label each possibility as **supported, rejected, or unresolved**, attach the evidence, and let ordinary code verify the handoff before another agent acts on it. On our 120 test cases, that changed the score from **65.98 to 96.52 out of 100** and produced the exact correct answer every time. Moving forward, this could be especially useful for **IT incident response**, where agents must identify the cause of an outage before changing a production system; **customer-support escalation**, where claims must be separated from verified account facts; **research and fact-checking**, where conflicting sources must remain unresolved until corroborated; and **compliance or document review**, where every conclusion must point to an exact supporting passage. The practical product is not merely another chatbot—it is a reusable reliability layer for agent systems that prevents guesses from becoming actions, preserves disagreement when the evidence is incomplete, and gives humans a clear record of why the system reached its decision.

---

## Gold-standard example 3: comparison with current practice

No—not in the exact form we tested. Common agent systems use managers, specialist handoffs, shared conversation histories, graph routing, structured JSON, and output guardrails. Those are standard building blocks supported by frameworks such as [OpenAI’s Agents SDK](https://openai.github.io/openai-agents-python/multi_agent/), [LangGraph](https://langchain-ai.github.io/langgraph/agents/tools/), and [AutoGen](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/framework/message-and-communication.html). What is **not** yet a common packaged pattern is requiring agents to maintain an explicit evidence status—**supported, rejected, or unresolved—for every competing possibility**, validating that status with ordinary code, attaching exact source evidence, and routing decisions from that verified state instead of from conversational prose.

So the honest positioning is: **we did not invent structured outputs, validation, or graph routing; we discovered a potentially valuable way to combine them.** I would call it an **evidence-state orchestration pattern**: the workflow routes verified states rather than opinions. Current frameworks make it straightforward to implement—[Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) can enforce the message format, while graph state and deterministic code can validate and route it—but it is not one of the usual default patterns like manager–worker, group chat, or specialist handoffs. That makes it worth pursuing as a specific design contribution, although we should not claim it is academically novel until we conduct a proper literature and prior-art review.

---

## Short acceptance test for future reports

Before publishing an experiment summary, ask someone who has never seen the project to answer these questions using only the summary:

- What real problem were we trying to solve?
- What exactly did the agents have to do?
- What was the normal workflow?
- What did we change?
- What failed along the way, and what did that teach us?
- What exact result did the final test produce?
- Why does that result matter outside the experiment?
- What have we not proven yet?
- What should we test next?

If the reader cannot answer all nine, the report is not finished.
