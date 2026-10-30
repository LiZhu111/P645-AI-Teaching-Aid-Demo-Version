# MCP and AI requirements review

What the client actually asked for on the MCP and AI side, where each
requirement comes from, and what the first cut of the server does about it.

Sources, in order of authority:

1. `docs/brief/CLIENT_BRIEF.md` — Steve Harding, Training Professionals. The
   partner's own words. This governs.
2. `docs/brief/P645_Project_Details_EN.pdf` — the QUT project proposal. Older,
   and superseded on several points (see "Scope changes" below).
3. `README.md` — our own summary. Useful, not authoritative.

Requirement IDs are used by the tests and by the code comments so a claim in
this document can be traced to something that runs.

---

## Scope changes since the original proposal

The PDF and the client brief disagree, and the team should be able to say why in
the final report rather than being asked about it.

| | Proposal (PDF) | Client brief | Taken as |
|---|---|---|---|
| Grading | "assisting with marking and grading of assessments"; asks for a grading reliability write-up | "Aita never marks anything and never decides whether anyone is competent" | **Brief wins.** Grading is out. |
| Scope of assistant | Student Q&A, learning support, marking, onboarding | Voice-first study companion for CPC10120 | **Brief wins.** |
| Platform integration | Integrate into existing Student Management platform | "the MCP server is the one in control of integration… you do not need to touch the platform internals" | **Brief wins.** We build to MCP only. |
| MCP | "secure MCP server exposing a controlled set of tools" | Same, and stronger | **Unchanged, and central.** |

The grading reversal is the significant one. It removes the hardest and riskiest
part of the original proposal, and the report should say so plainly rather than
quietly shipping something narrower than what was approved. Worth confirming out
loud with both the tutor and Steve.

---

## The requirements

### MCP architecture

**R-MCP-1 — Aita is its own MCP tool suite, not one monolithic assistant.**
*Source: brief §1, "Aita should be its own MCP tool suite: the capabilities it
needs… exposed as separate tools on the MCP server."*
Implemented. Six tools in `src/backend/aita/server.py`, each independently
callable and testable.

**R-MCP-2 — MCP is the integration boundary. We do not touch platform internals.**
*Source: brief §1, "the MCP server is the one in control of integration."*
Implemented, and it is why our backend language is a free choice: the partner
runs MySQL, an in-house ORM moving to Drizzle, Node/Express and Next.js, and
none of that is visible across an MCP boundary. We use Python because the
retrieval and speech ecosystem lives there.

**R-MCP-3 — The tool surface is the security boundary; it must be auditable.**
*Source: PDF, "expose a controlled set of tools to the AI, so the assistant can
only act through approved, auditable interfaces rather than having open-ended
access."*
Implemented structurally. The whole surface is six tools and you can read it in
one screen. `tests/test_aita.py::TestToolSurface` asserts that the set is exactly
what we expect, so adding a seventh tool fails the build and forces a
conversation.

**R-MCP-4 — Model calls sit behind the server, not in front of it.**
*Source: brief §1, "The AI pool sits behind that same server with automatic load
balancing, so tools that need a model call one without caring which card serves
it."*
Implemented. `llm.py` exposes one `ModelProvider` interface. Nothing above it
knows which model answers.

### The five prototype success criteria

**R-SC-1 — A student can have an item read out to them.**
`get_material` returns each item both whole and split into sentence-terminated
speech segments of about a minute, plus next/previous item ids. The merged White
Card unit is roughly 4 hours 20 minutes of narration, so resumable position is a
requirement rather than a nicety — the segment structure is what makes that
possible. Text-to-speech itself is the frontend's job.

**R-SC-2 — A student can ask a question verbally.**
Out of scope for this layer. `explain_concept` takes text; speech-to-text
happens at the edge. What this layer does contribute is handling *spoken
phrasing*: `retrieval.tokenize(spoken=True)` strips the filler that wraps a
spoken question, so "what was that thing about the ladder angle" reduces to
`["ladder", "angle"]`.

**R-SC-3 — Aita explains a concept using the provided material.**
`explain_concept`. Retrieves, decides whether the material supports an answer,
then generates from retrieved passages only.

**R-SC-4 — Explain why a human-marked *correct* answer is correct.**
`explain_marked_answer(marked_correct=True)`. The marking guide is resolved into
words and included in the prompt.

**R-SC-5 — Explain why a human-marked *incorrect* answer was marked that way,
and supply the knowledge the learner needs.**
`explain_marked_answer(marked_correct=False)`. The marking guide is deliberately
**not** in the prompt on this path — see `PROMPT_RULES_AND_GUARDRAILS.md` for the
reasoning, since it is the most arguable decision we have made.

Both run off the `mapping` field, which is why the White Card unit merge is a
prerequisite: unmerged, 81 of that unit's question-to-criterion references point
at criteria that do not exist. See `DATA_AUDIT.md` Finding 3.

### Hard constraints

**R-CON-1 — Aita never marks and never decides competency.**
*Source: brief, "Aita never marks anything and never decides whether anyone is
competent — a qualified human assessor owns every one of those judgements,
always."*
No tool marks. A test asserts no tool ever does.

**R-CON-2 — Answers grounded in the provided material.**
*Source: brief §6.* Enforced before generation, on retrieval evidence.

**R-CON-3 — Say when you don't know.**
*Source: brief §6, "in voice this is harder than in text: a confident wrong
answer spoken aloud sounds exactly like a confident right one."*
Three-way outcome — answer, hedge, abstain — rather than a binary. Abstention
returns a fixed spoken sentence with no model call at all.

**R-CON-4 — Model answers must not become an answer key.**
*Source: brief §7, "provided so Aita can explain — not so anyone can publish
answer keys."*
Gated on a human marking decision that Aita cannot produce.

**R-CON-5 — Never make a learner feel stupid.**
*Source: the foreword. This is a requirement, not a sentiment.*
Prompt rules plus `check_tone`, which turns it into something measurable.

**R-CON-6 — Progress belongs to the learner, not to an assessor.**
*Source: brief §5, "it becomes something else the moment it is reported to
anyone but them — so do not."*
Not yet implemented, because no tool records progress yet. Flagged here so that
whoever adds progress tracking treats it as a data-model constraint: learner-
scoped, not reportable, not visible to the platform. Adding it carelessly is the
easiest way to breach the brief.

### Latency

**R-PERF-1 — The whole round trip is one spoken-response budget.**
*Source: brief §6, "Latency is a feature… In text, two seconds is fine. In
conversation it is a stall."*
Retrieval is sub-millisecond and the index builds in ~370 ms at start. That
leaves effectively the entire budget for model generation and speech synthesis,
which is where it should go. Worth measuring end to end once the pool is
reachable.

---

## What is deliberately not built yet

**Vector search.** Retrieval is BM25 only. It is fast, dependency-free and good
enough to build against, but it fails on paraphrase — a learner asking "who do I
tell if someone gets hurt" uses none of the material's vocabulary
("report", "incident", "injury") and scores below the abstention threshold.
Three such cases are recorded as expected failures in
`tests/test_aita.py::TestGrounding::test_known_lexical_retrieval_ceiling`, so
when hybrid retrieval lands they become passing tests rather than forgotten
intentions. This is the single strongest argument for the vector half.

**Slides.** 453 of 1,091 items are images with no text layer, and 93 of them are
in the White Card unit. Nothing here reads them. The brief gives three options
(§4) and is explicit that skipping them is a fine answer *if it is a decision*.
It is currently a decision by default, which is the version Steve warned against
— the team should pick one on the record.

**Speech.** Both directions belong to the frontend/voice workstream.

**A model.** No pool access yet. Everything runs without one; tools return the
grounded context and the exact prompt that would have been sent, which is enough
to evaluate retrieval and prompting — the parts we can measure without a model
anyway.

---

## Open questions for the client

Carried forward from `DATA_AUDIT.md`, plus new ones from this review:

1. The 29 unparseable `mapping` tokens, especially `f1`–`f7`.
2. Is grading genuinely out of scope, or deferred? The approved proposal named it.
3. On success criterion 5 — do you want Aita to state the correct answer to a
   learner who got a question wrong, or to teach the concept and send them back
   to the material? We have built the second and made it a one-line policy flip.
4. 107 of 482 questions are Observation/practical, marked by an assessor
   watching someone work. There is no written answer to explain. Should criteria
   4 and 5 cover these at all?
5. Model answers are numeric indices throughout — no prose marking guide exists
   in the package. The brief describes prose answers for written question types;
   those question types are not present. Was part of the bank held back?
