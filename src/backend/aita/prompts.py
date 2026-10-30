"""
Prompt construction.

Prompts live in one file, as named constants, for a reason that matters for the
report: they are part of the system's behaviour and they need to be reviewable,
diffable and testable. A prompt buried inline in a tool is a prompt nobody
audits.

Two principles run through all of them:

  * The model is given retrieved material and told to work only from it. It is
    never given the whole corpus, never given assessment model answers unless
    the guardrail authorised it, and never asked to recall anything from its own
    training about construction safety. If the passage does not say it, Aita
    does not say it.

  * Every instruction about tone is concrete. "Be friendly" does nothing.
    "Answer the question that was asked before adding anything else" changes
    output. the demonstration requirements is the specification here, and it is unusually
    clear about what good sounds like.
"""

from __future__ import annotations

from .corpus import AssessmentQuestion, Criterion
from .guardrails import Grounding, GroundingVerdict
from .retrieval import RetrievalResult

# --------------------------------------------------------------------------
# System prompt
# --------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are Aita, a study companion for learners doing Workshop Safety Basics \
in Australia. You are talking to a student who is preparing for assessment, and \
your answers are read aloud to them.

WHAT YOU ARE FOR
Explain the course material so the learner understands it. That is the whole job.

WHAT YOU NEVER DO
- You never mark, grade, score or judge an answer. A qualified human assessor \
does that, always. If asked whether an answer was right, say plainly that their \
assessor decides that, and offer to work through the topic instead.
- You never state anything the provided material does not say. You have no other \
source. If the material does not cover it, say so.
- You never repeat an assessment model answer unless it appears in your context.

HOW YOU TALK
- Plain spoken English, short sentences. Your words are heard, not read.
- Answer the question that was asked, first. Add context after, if it helps.
- Never imply the learner should already have known something. No "obviously", \
no "simply", no "as I said". Many of these learners were taught by experience \
that asking questions gets them mocked. One impatient sentence undoes a lot.
- If they say they do not understand, explain it a different way - an example, a \
site scenario, a comparison. Do not repeat the same explanation louder.
- No headings, bullets, or markdown. It is being spoken.
- Around 120 words unless they asked for more.

CITING
You are given passages from their course material. Work only from those. Where it \
helps the learner find it again, mention where it comes from in ordinary speech - \
"this is in the part about controlling hazards" - not as a reference."""


# --------------------------------------------------------------------------
# Context blocks
# --------------------------------------------------------------------------


def format_passages(result: RetrievalResult, *, limit: int | None = None) -> str:
    """Render retrieved chunks as the model's only source of truth."""
    hits = result.hits[:limit] if limit else result.hits
    if not hits:
        return "(no course material was found for this question)"
    blocks = []
    for index, hit in enumerate(hits, start=1):
        blocks.append(
            f"[passage {index}] from: {hit.chunk.citation()}\n{hit.chunk.text.strip()}"
        )
    return "\n\n".join(blocks)


_GROUNDING_INSTRUCTION = {
    Grounding.ANSWER: (
        "The passages cover this question. Explain it using them."
    ),
    Grounding.HEDGE: (
        "The passages cover only PART of this question. Explain the part they do "
        "cover, then say plainly which bit their material does not go into. Do "
        "not fill the gap from your own knowledge. It is fine to suggest they "
        "ask their trainer about the rest."
    ),
    Grounding.ABSTAIN: (
        "The passages do NOT answer this question. Say so directly and without "
        "apology - it is a fair question, the material just does not go there. "
        "Tell them what their material does cover nearby, and suggest asking "
        "their trainer. Do not guess, and do not answer from general knowledge."
    ),
}


def explain_concept_prompt(
    question: str,
    result: RetrievalResult,
    verdict: GroundingVerdict,
) -> str:
    """The user-turn prompt for a general 'help me understand this' question."""
    return f"""\
The learner asked, out loud: "{question.strip()}"

{_GROUNDING_INSTRUCTION[verdict.decision]}

Course material:

{format_passages(result)}"""


# --------------------------------------------------------------------------
# Assessment feedback - success criteria 4 and 5
# --------------------------------------------------------------------------

_CORRECT_PROMPT = """\
The learner answered an assessment question and a human assessor marked it \
CORRECT. Your job is to explain why it is right, so the understanding sticks \
rather than the mark just being banked.

Do not congratulate at length. Explain the reasoning: what the question was \
getting at, and why that answer is the one that fits.

Question: {question}
{options}
The marking guide gives the correct answer as: {model_answer}
{student_line}
What this question was testing: {criteria}

Course material:

{passages}"""


_INCORRECT_PROMPT = """\
The learner answered an assessment question and a human assessor marked it \
INCORRECT. Your job is to rebuild the understanding, not to hand over the answer.

You have deliberately NOT been given the marking guide for this one. Do not try \
to state or hint at what the correct answer was, and do not guess it. Instead:
explain what this question was actually testing, teach that concept from the \
course material below, and point the learner back to where it is covered so they \
can go over it themselves.

Be matter-of-fact about the mark. Getting it wrong is how anyone finds out what \
they have not understood yet - say something to that effect once, briefly, \
without making a speech of it.

Question: {question}
{student_line}
What this question was testing: {criteria}

Course material:

{passages}"""


def _format_criteria(criteria: list[Criterion]) -> str:
    if not criteria:
        return "(not recorded for this question)"
    return "; ".join(f"{c.label} {c.text}" for c in criteria)


def _format_options(question: AssessmentQuestion) -> str:
    if not question.options:
        return ""
    listed = "\n".join(f"  {i}. {opt}" for i, opt in enumerate(question.options, start=1))
    return f"Options as shown to the learner:\n{listed}\n"


def marked_answer_prompt(
    question: AssessmentQuestion,
    *,
    marked_correct: bool,
    student_response: str,
    criteria: list[Criterion],
    result: RetrievalResult,
    include_model_answer: bool,
) -> str:
    """
    Build the explanation prompt for a human-marked answer.

    `include_model_answer` comes from `guardrails.answer_key_policy` and is the
    whole ballgame: when the learner got it wrong, the model answer is not in
    this prompt at all. Not redacted, not "please don't mention it" - absent.
    A model cannot leak what it was never given.
    """
    student_line = (
        f"What the learner answered: {student_response.strip()}\n"
        if student_response.strip()
        else ""
    )
    common = {
        "question": question.question.strip(),
        "options": _format_options(question),
        "student_line": student_line,
        "criteria": _format_criteria(criteria),
        "passages": format_passages(result),
    }
    if marked_correct and include_model_answer:
        # `resolved_model_answer`, not `model_answer`: the raw field is "1,3",
        # which tells the model nothing. Resolving it against the options is
        # the operation the guardrail exists to gate, so it happens here, once,
        # behind the check - and never on the incorrect path.
        return _CORRECT_PROMPT.format(
            model_answer=question.resolved_model_answer, **common
        )
    # Note what is absent: no model answer, and no option list either. With
    # numeric model answers the options ARE most of the key - a learner who
    # re-sits a multiple-choice question and has been read the option list
    # alongside "what this was testing" is most of the way there.
    common.pop("options", None)
    return _INCORRECT_PROMPT.format(**common)


# --------------------------------------------------------------------------
# Canned responses - no model call needed
# --------------------------------------------------------------------------

ASSESSMENT_DEFLECTION = (
    "I can't tell you whether an answer is right or wrong - that's your "
    "assessor's call, not mine. What I can do is go through the topic with you "
    "so you can work it out yourself. Want me to do that?"
)


def abstention_response(verdict: GroundingVerdict, nearby: list[str]) -> str:
    """
    A spoken abstention that does not need a model call.

    Worth having as a plain string: it is faster, it cannot hallucinate, and it
    says the same thing every time, which is what you want from the sentence
    that admits a limit. `nearby` is what the unit does cover, so the learner
    gets a direction rather than a door in the face.
    """
    opening = "That's not something your course material covers, so I don't want to guess at it."
    if nearby:
        topics = ", ".join(nearby[:3])
        return (
            f"{opening} What it does go into around there is {topics}. "
            "Want me to take you through any of that? Otherwise it's a good one for your trainer."
        )
    return f"{opening} That's a good one to put to your trainer."
