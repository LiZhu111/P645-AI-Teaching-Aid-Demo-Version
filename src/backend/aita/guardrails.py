"""
Guardrails.

Each safety boundary used by this demonstration is enforced in code, not only as a
sentence in a system prompt. A prompt is a request; a guard is a fact. When
someone asks in the final presentation "what stops it doing X", the answer
should be a function, not a paragraph.

The five rules, and where each is actually enforced:

  1. Aita never marks and never decides competency.
     -> There is no tool that marks. `detect_assessment_request` also catches
        the learner asking "is my answer right?" so the assistant deflects
        instead of quietly obliging.

  2. Answers must be grounded in the provided material.
     -> `assess_grounding` gates every explanation on retrieval coverage, and
        the prompt is built only from retrieved text (see prompts.py).

  3. If the material does not support an answer, say so clearly.
     -> Same function. ABSTAIN and HEDGE are separate outcomes because "I can't
        help with that" and "here is the part we do cover" are different
        answers, and a learner deserves the second one where it is true.

  4. Model answers must not become a public answer key.
     -> `authorise_answer_key` requires a human marking decision to exist
        before any model answer is read at all, and `answer_key_policy` keeps
        the model answer out of the prompt entirely when a student got the
        question wrong. Reasoning below.

  5. Never make a learner feel stupid.
     -> Prompt rules in prompts.py, plus `check_tone` as a cheap output lint.
        Read the demonstration requirements: these learners were taught by experience to stop
        asking. One impatient answer re-teaches that lesson.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum

from .retrieval import RetrievalResult

# --------------------------------------------------------------------------
# Grounding and abstention
# --------------------------------------------------------------------------


class Grounding(str, Enum):
    ANSWER = "answer"    # enough material to explain properly
    HEDGE = "hedge"      # partial - answer what is covered, name what is not
    ABSTAIN = "abstain"  # not in the material; say so and offer what is


@dataclass(frozen=True)
class GroundingThresholds:
    """
    Tuned against the spoken-style question set in tests/. These numbers are
    not sacred - they are a starting point that someone should re-tune once
    the evaluation set is bigger, and re-tune again after retrieval is
    upgraded to hybrid search.
    """

    answer_at: float = 0.60
    hedge_at: float = 0.35
    min_hits: int = 1


@dataclass(frozen=True)
class GroundingVerdict:
    decision: Grounding
    coverage: float
    reason: str
    unknown_terms: tuple[str, ...] = ()

    @property
    def may_answer(self) -> bool:
        return self.decision is not Grounding.ABSTAIN


def assess_grounding(
    result: RetrievalResult,
    thresholds: GroundingThresholds | None = None,
) -> GroundingVerdict:
    """
    Decide whether the retrieved material can support an answer at all.

    This runs BEFORE generation, not after. Asking a model to judge whether its
    own answer was grounded is asking the wrong entity: the check has to sit
    where the evidence is. A confident wrong answer read aloud in a calm voice
    sounds exactly like a confident right one, so the decision to speak has to
    be made on retrieval evidence.
    """
    thresholds = thresholds or GroundingThresholds()
    coverage = result.union_coverage
    unknown = tuple(result.unknown_terms)

    if not result.query_terms:
        return GroundingVerdict(
            Grounding.ABSTAIN, 0.0,
            "The question had no content words to search on.", unknown,
        )
    if len(result.hits) < thresholds.min_hits:
        return GroundingVerdict(
            Grounding.ABSTAIN, coverage,
            "Nothing in the course material matched this question.", unknown,
        )
    if coverage >= thresholds.answer_at:
        return GroundingVerdict(
            Grounding.ANSWER, coverage,
            "The material covers this.", unknown,
        )
    if coverage >= thresholds.hedge_at:
        return GroundingVerdict(
            Grounding.HEDGE, coverage,
            "The material covers part of this but not all of it.", unknown,
        )
    return GroundingVerdict(
        Grounding.ABSTAIN, coverage,
        "This is not covered in the course material.", unknown,
    )


# --------------------------------------------------------------------------
# Rule 1 - never assess
# --------------------------------------------------------------------------

_ASSESSMENT_REQUESTS = (
    re.compile(r"\b(is|was)\s+(my|that|this)\s+answer\s+(right|correct|wrong)\b", re.I),
    re.compile(r"\b(did|have)\s+i\s+(pass|fail|get\s+it\s+right)\b", re.I),
    re.compile(r"\b(mark|grade|score|assess)\s+(my|this|me)\b", re.I),
    re.compile(r"\bam\s+i\s+(competent|ready|good\s+enough)\b", re.I),
    re.compile(r"\bwhat\s+(mark|grade|score)\s+(did|would)\s+i\b", re.I),
    re.compile(r"\b(tell|give)\s+me\s+the\s+answer\b", re.I),
    re.compile(r"\bwhat('?s| is| are)\s+the\s+(right|correct)\s+answers?\b", re.I),
    re.compile(r"\bthe\s+answers?\s+(to|for)\s+(question|q)\b", re.I),
    re.compile(r"\bwhich\s+(one|option)\s+is\s+(right|correct)\b", re.I),
)


def detect_assessment_request(text: str) -> bool:
    """
    True when the learner is asking Aita to judge them or hand over an answer.

    Not a refusal trigger - a redirection trigger. The learner is not doing
    anything wrong by asking, and treating the question as a violation would be
    exactly the response the foreword warns about. The assistant acknowledges
    it, explains that a human assessor decides, and offers to work through the
    concept instead.
    """
    return any(pattern.search(text or "") for pattern in _ASSESSMENT_REQUESTS)


# --------------------------------------------------------------------------
# Rule 4 - the answer key
# --------------------------------------------------------------------------


class AnswerKeyAccessError(PermissionError):
    """Raised when something tries to read a model answer without authority."""


@dataclass(frozen=True)
class MarkingDecision:
    """
    A marking decision that a human assessor has already made.

    This is the key to the answer key. It has to be supplied by the caller -
    which in production is the Student Management platform, passing on a real
    assessor's recorded judgement. It cannot be inferred, defaulted, or
    produced by Aita, because the moment Aita can produce one it is marking.
    """

    question_id: str
    marked_correct: bool
    marked_by: str              # assessor identifier from the platform
    student_response: str = ""  # what the learner actually put, if recorded

    def __post_init__(self) -> None:
        if not self.marked_by.strip():
            raise AnswerKeyAccessError(
                "A marking decision needs an assessor. Aita does not mark."
            )


def authorise_answer_key(question_id: str, decision: MarkingDecision | None) -> MarkingDecision:
    """
    Gate on reading a model answer. Call this before touching `model_answer`.

    Two conditions: a marking decision must exist, and it must be for this
    question. Without both, no model answer is read at all - which is what
    makes "what's the answer to question four" structurally impossible rather
    than merely discouraged.
    """
    if decision is None:
        raise AnswerKeyAccessError(
            "Model answers are only available to explain a question a human has "
            "already marked. No marking decision was supplied."
        )
    if decision.question_id != question_id:
        raise AnswerKeyAccessError(
            f"Marking decision is for {decision.question_id}, not {question_id}."
        )
    return decision


def answer_key_policy(decision: MarkingDecision, *, reveal_when_incorrect: bool = False) -> bool:
    """
    Whether the model answer may go into the prompt for this explanation.

    Default: yes when the learner already got it right, no when they got it
    wrong.

    That asymmetry is deliberate and it is the most arguable design decision in
    this module, so here is the reasoning. When a learner has answered
    correctly, they already know the answer - explaining why it is right adds
    understanding and leaks nothing. When they answered incorrectly, they will
    very likely re-sit that question. Handing over the marking guide converts
    "explain why I was wrong" into an answer key with extra steps, which is the
    precise failure the the demo requirements avoid.

    You can still explain a wrong answer well without it: name what the
    criterion required, teach the concept from the delivery material, and send
    the learner back to the passage. That is better teaching anyway - it
    rebuilds the understanding instead of patching the one question.

    `reveal_when_incorrect=True` exists so the behaviour is a demonstration policy
    can overrule, not a decision we buried. Flip it only if a qualified reviewer approves.
    """
    return decision.marked_correct or reveal_when_incorrect


# --------------------------------------------------------------------------
# Rule 5 - tone
# --------------------------------------------------------------------------

_TONE_PROBLEMS = (
    (re.compile(r"\b(obviously|clearly|simply|just|of course|as you (should |)know)\b", re.I),
     "condescending qualifier - implies the learner should already have known this"),
    (re.compile(r"\b(as (i|we) (already |)(said|mentioned|explained))\b", re.I),
     "impatient backreference - re-teaches the learner that asking twice is a failing"),
    (re.compile(r"\b(basic|elementary|straightforward|trivial|easy)\b", re.I),
     "calls the material easy - if the learner is asking, it is not easy for them"),
    (re.compile(r"\b(you (should|ought to|need to) (have |)(know|understand|remember))\b", re.I),
     "tells the learner what they should already have known"),
)


def check_tone(text: str) -> list[str]:
    """
    Cheap lint over a generated answer. Returns a list of problems found.

    Not a filter - a signal. Use it in evaluation to score the tone
    requirement, and in development to catch a prompt that has drifted. Blocking
    on it at runtime would be worse than the problem: a learner waiting on a
    voice answer would rather have a slightly stiff sentence than silence.

    This makes the foreword requirement measurable, which is the point. "Never
    make a question feel stupid" is not a testable statement; "zero condescending
    qualifiers across the evaluation set" is.
    """
    return [reason for pattern, reason in _TONE_PROBLEMS if pattern.search(text or "")]
