# Prompt rules and guardrails

Aita has five hard limits. This document says what each one is, how it is
enforced, and how you would prove it in a demo.

The organising principle: **a prompt is a request, a guard is a fact.** Anything
that must not happen is enforced in code, and the prompt only carries things that
shape quality rather than safety. If the answer to "what stops it doing that?" is
a sentence in a system prompt, it is not stopped.

Code: `src/backend/aita/guardrails.py`, `prompts.py`.
Tests: `tests/test_aita.py`.

---

## G1 — Aita never marks, and never decides competency

> "Aita never marks anything and never decides whether anyone is competent — a
> qualified human assessor owns every one of those judgements, always."

**Enforcement is the tool surface.** There is no tool that marks. The MCP server
exposes six tools and none of them accepts a student answer for judgement or
returns a verdict. A model cannot call a tool that does not exist.

`tests/test_aita.py::TestToolSurface::test_nothing_on_the_surface_can_mark` fails
the build if anyone adds one, which is the point — the conversation happens
before the code ships.

**Second layer:** learners will still ask. `detect_assessment_request` catches
"is my answer right?", "did I pass", "just tell me the answer", "mark my work"
and similar, and `explain_concept` returns a fixed deflection without calling a
model at all.

The deflection is written carefully, because this is a moment where it is easy to
do harm:

> "I can't tell you whether an answer is right or wrong — that's your assessor's
> call, not mine. What I can do is go through the topic with you so you can work
> it out yourself. Want me to do that?"

It declines the judgement, not the learner. Read the foreword: the students this
is built for have learned that asking gets them slapped down. A refusal that
reads as disapproval teaches that lesson again.

**Demo:** ask "is my answer right?" and show `grounding: refused_assessment` with
no model call in the trace.

---

## G2 — Every answer is grounded in the learner's own material

> "Answers must be grounded in the provided course material."

**Enforcement runs before generation, not after.** `assess_grounding` looks at
what retrieval actually found and decides whether an answer is possible at all.
Only then is a prompt built, and it is built from retrieved passages only — the
model never sees the corpus, and is told in the system prompt that it has no
other source.

Checking groundedness *after* generation, by asking a model whether its own
answer was supported, asks the wrong entity. The evidence is in the retrieval
result, so the decision belongs there.

**The signal is coverage, not relevance score.** BM25 scores and cosine
similarities are both unbounded and neither means "this answers the question".
Coverage — how much of the learner's question is actually present in the
retrieved text — does, roughly, and it is explainable to a marker.

Coverage is weighted by inverse document frequency rather than counting words.
This matters more than it sounds. Plain word counting scores "do I need a licence
to drive an excavator" as 75% covered, because *need* and *drive* appear
everywhere in the material. Weighting by information content scores it 0.43,
which is the truth. Terms the corpus has never seen get the ceiling weight, so an
out-of-scope question is dragged down by exactly the word that makes it out of
scope.

---

## G3 — When the material doesn't cover it, say so

> "A confident wrong answer spoken aloud sounds exactly like a confident right
> one."

**Three outcomes, not two:**

| outcome | coverage | behaviour |
|---|---|---|
| `ANSWER` | ≥ 0.60 | explain normally |
| `HEDGE` | 0.35 – 0.60 | explain the covered part, name the gap, do not fill it |
| `ABSTAIN` | < 0.35 | say it is not covered, offer nearby topics, suggest their trainer |

`HEDGE` exists because collapsing to a binary throws away the most common real
case. A learner asking a two-part question where the material covers one part
deserves the half we have, plus an honest statement about the other half — not a
blanket refusal and not a confident invention.

Abstention returns a **fixed string** with no model call. It is faster, it cannot
hallucinate, and the sentence that admits a limit should say the same thing every
time. It also names what the unit does cover nearby, so the learner gets a
direction rather than a door.

**Thresholds are a starting point, not a result.** They were set against a small
spoken-style question set and should be re-tuned when the evaluation set grows,
and again after retrieval is upgraded.

**The honest limitation.** BM25 cannot separate a genuinely out-of-scope question
from an in-scope one when every word is common in the material. "What time does
the site open" scores 1.00. Three such cases are in the test suite as `xfail`
with `strict=True`, so they are recorded as known and will flip to passing when
hybrid retrieval lands. Hiding this behind gentler test cases would have been
easy and would have made the evaluation section of the report worthless.

---

## G4 — Model answers never become an answer key

> "Treat the model answers with respect: they are the marking guide for a live
> qualification. They are provided so Aita can explain — not so anyone can
> publish answer keys."

**First: where the risk actually is.** Every model answer in the package is a
numeric index — `"1,3"`, `"2"`, `"3,6,1,5,2,4"`. Median length one character,
longest seventeen, and not one prose answer in 482 questions. So `"1,3"` on its
own leaks nothing. The answer key is produced by *resolving* those indices
against the option list, which is why `AssessmentQuestion.resolved_model_answer`
— not the raw field — is the operation under guard.

**Three layers:**

1. **Separation.** Assessment questions load into a different structure from
   teaching content and are never indexed. No retrieval bug and no prompt change
   can surface them, because they are not in the searchable set at all.

2. **Authorisation.** `authorise_answer_key` requires a `MarkingDecision` —
   naming a human assessor, for that specific question — before a model answer is
   read. Aita cannot construct one; the platform passes on a real assessor's
   recorded judgement. `MarkingDecision` refuses to exist without a named
   assessor, so "mark it correct and then ask why" is not a route in.

3. **Asymmetric disclosure.** Correct answers get the marking guide in the
   prompt. Incorrect answers do not.

**On layer 3, which is the arguable one.** When a learner already answered
correctly, they know the answer; explaining why it is right adds understanding
and leaks nothing. When they answered incorrectly they will very likely re-sit
that question, and handing over the marking guide turns "explain why I was wrong"
into an answer key with extra steps.

So on the incorrect path the prompt contains no marking guide **and no option
list** — with numeric answers, the enumerated options are most of the key. What
it does contain is the criterion the question was testing and the delivery
material that teaches it, which is enough to rebuild the understanding. That is
better teaching anyway: it repairs the concept rather than patching one question.

This is a policy, not a law. `answer_key_policy(..., reveal_when_incorrect=True)`
flips it in one line if Steve wants the other behaviour. It is question 3 on the
list for the client — we should not decide it for them silently.

**What is *not* claimed.** We cannot stop the correct answer's *content*
appearing in the prompt, and should not try: the delivery material teaches the
answers. A passage on estimating will contain the phrase "the rule of two method"
whether or not that is the marked option. What is withheld is **attribution** —
nothing tells the model which option is correct. The test asserts exactly that
and no more, which is the difference between a guarantee and a slogan.

**Demo:** call `explain_marked_answer` twice on the same question with
`marked_correct` true and false, and show `model_answer_in_prompt` flipping. Then
call it with an empty `marked_by` and show it refuse.

---

## G5 — Never make a learner feel stupid

> "Many who are deemed stupid have simply learnt to stop asking."

This is the requirement most likely to be treated as decoration and it is the one
the client led with. It cannot be enforced the way the others can, so it gets
handled in two places.

**In the prompt,** as concrete instructions rather than adjectives. "Be friendly"
changes nothing. These change output:

- Answer the question that was asked, first. Context after.
- Never imply the learner should already have known something. No "obviously",
  no "simply", no "as I said".
- If they say they don't understand, explain it a *different* way — an example, a
  site scenario, a comparison. Not the same explanation louder.
- Plain spoken English, short sentences, no markdown. It is being heard.

**In evaluation,** via `check_tone`, which flags condescending qualifiers,
impatient back-references, and calling the material easy. It is a signal, not a
filter — blocking a spoken answer at runtime would leave a learner waiting on
silence, which is worse than a stiff sentence.

The value is that it makes the requirement measurable. "Never make a question
feel stupid" is not testable. "Zero tone warnings across the evaluation set" is,
and it belongs in the report next to the retrieval numbers.

---

## Where the prompts live

All in `src/backend/aita/prompts.py`, as named constants, because prompts are
part of the system's behaviour and need to be reviewable and diffable. A prompt
inlined in a tool is a prompt nobody audits.

`explain_concept` and `explain_marked_answer` both return the exact
`system_prompt` and `prompt` they used. That is deliberate: evaluation can assert
on what the model was *given*, not only on what it said, and with no pool access
yet it is how the whole layer is currently tested.

---

## Summary

| | Rule | Enforced by | Test |
|---|---|---|---|
| G1 | Never marks | Tool surface; no marking tool exists | `test_nothing_on_the_surface_can_mark` |
| G2 | Grounded answers | Pre-generation coverage check | `test_in_scope_questions_are_answerable` |
| G3 | Say when unsure | Three-way verdict; fixed abstention | `test_out_of_scope_questions_abstain` |
| G4 | No answer key | Separate store, human marking decision, asymmetric disclosure | `TestAnswerKeyIsolation` |
| G5 | Never condescend | Prompt rules + `check_tone` lint | `TestTone` |
