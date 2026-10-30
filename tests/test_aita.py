"""
Tests for the Aita MCP layer.

Run from the repository root:

    python -m pytest tests/ -v

The tests that matter most are in TestAnswerKeyIsolation. Everything else here
is ordinary correctness; those are the ones that show the safety property the
client asked for actually holds.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src" / "backend"))

from aita.corpus import (  # noqa: E402
    canonical_unit,
    chunk_item,
    criterion_band,
    load_corpus,
    parse_mapping,
    segment_for_speech,
)
from aita.guardrails import (  # noqa: E402
    AnswerKeyAccessError,
    Grounding,
    MarkingDecision,
    answer_key_policy,
    assess_grounding,
    authorise_answer_key,
    check_tone,
    detect_assessment_request,
)
from aita.retrieval import BM25Retriever, tokenize  # noqa: E402

DATA = ROOT / "data"


@pytest.fixture(scope="session")
def corpus():
    return load_corpus(DATA)


@pytest.fixture(scope="session")
def retriever(corpus):
    return BM25Retriever(corpus)


# ==========================================================================
# Corpus - the audit findings, enforced
# ==========================================================================


class TestCorpus:
    def test_composite_key_is_unique(self, corpus):
        """(unit, sequence, type). Sequence alone collides 128 times."""
        assert len(corpus.items) == 1091
        keys = {i.item_id for i in corpus.items.values()}
        assert len(keys) == 1091

    def test_slide_and_document_share_a_sequence(self, corpus):
        """The collision the composite key exists to survive."""
        same_sequence = [
            i for i in corpus.items.values()
            if i.source_unit_code == "DEMO101" and i.sequence == 5
        ]
        assert len(same_sequence) == 2
        assert {i.type for i in same_sequence} == {"ELEMENT", "SLIDE"}

    def test_white_card_units_merge(self, corpus):
        assert canonical_unit("DEMO101") == "DEMO101"
        unit = corpus.unit("DEMO101")
        assert unit.code == "DEMO101"
        assert unit.is_merged
        assert len(corpus.units) == 8  # 9 rows in units.csv, 8 real units

    def test_merge_repairs_every_dangling_criterion_reference(self, corpus):
        """
        The finding that makes the merge mandatory rather than tidy.

        Unmerged, 81 demo course question-to-criterion references point at
        criteria that do not exist under that spelling. This asserts the
        loaded corpus has none.
        """
        dangling = [
            (q.question_id, ref.raw)
            for q in corpus.questions.values()
            for ref in q.mapping
            if ref.number is not None
            and corpus.criterion(q.unit_code, ref.number) is None
        ]
        assert dangling == []

    def test_content_chars_is_not_trusted(self, corpus):
        """We never read contentChars; text length comes from the text."""
        source = (ROOT / "src" / "backend" / "aita" / "corpus.py").read_text()
        assert "contentChars" not in re.sub(r"#.*|\"\"\".*?\"\"\"", "", source, flags=re.S)

    def test_mapping_grammar(self):
        assert parse_mapping("1.1")[0].number == 101
        assert parse_mapping("k2")[0].number == 10101
        assert parse_mapping("s1")[0].number == 10000
        assert parse_mapping("1.1, k2")[1].kind == "knowledge"

    def test_unresolvable_tokens_are_kept_not_guessed(self):
        """fN and friends stay unresolved rather than being invented."""
        for token in ("f3", "C101", "1.1b", "2"):
            ref = parse_mapping(token)[0]
            assert ref.number is None
            assert ref.kind == "unresolved"
            assert ref.raw == token

    def test_criterion_bands(self):
        assert criterion_band(100) == "element"
        assert criterion_band(101) == "criterion"
        assert criterion_band(10000) == "performance_evidence"
        assert criterion_band(10101) == "knowledge_evidence"
        assert criterion_band(20000) == "assessment_conditions"
        assert criterion_band(30100) == "foundation_skills"

    def test_chunker_handles_the_long_tail(self, corpus):
        """The largest source item is 39,485 characters, about 48 minutes."""
        longest = max(corpus.items.values(), key=lambda i: len(i.text))
        assert len(longest.text) > 39_000
        chunks = chunk_item(longest)
        assert len(chunks) > 20
        assert all(len(c.text) <= 1600 for c in chunks)

    def test_no_chunk_is_empty(self, corpus):
        assert all(c.text.strip() for c in corpus.teaching_chunks)

    def test_slides_produce_no_chunks(self, corpus):
        """453 slides have no text layer; they must not become empty chunks."""
        slide_ids = {i.item_id for i in corpus.items.values() if i.type == "SLIDE"}
        assert slide_ids
        assert not {c.item_id for c in corpus.teaching_chunks} & slide_ids

    def test_speech_segments_are_reasonable_spoken_lengths(self, corpus):
        item = max(corpus.items.values(), key=lambda i: len(i.text))
        segments = segment_for_speech(item.text)
        assert all(len(s) <= 1200 for s in segments)
        assert "".join(segments.copy()).replace(" ", "")[:200]  # non-empty


# ==========================================================================
# Answer-key isolation - the safety property
# ==========================================================================


class TestAnswerKeyIsolation:
    """
    The client's constraint: model answers "are provided so Aita can explain -
    not so anyone can publish answer keys."

    Enforced structurally rather than by prompt instruction, so these tests
    assert on structure.
    """

    def test_model_answers_are_not_in_the_retrieval_corpus(self, corpus):
        """No chunk anywhere derives from an assessment question."""
        question_ids = set(corpus.questions)
        assert question_ids
        assert not {c.item_id for c in corpus.teaching_chunks} & question_ids

    def test_every_model_answer_is_an_index_not_prose(self, corpus):
        """
        Establishes where the risk actually lives.

        All 482 model answers are numeric - "1,3", "2", "3,6,1,5,2,4". Median
        length one character, longest seventeen. There is no prose marking
        guide in this package at all, so the leak vector is not the answer
        field; it is resolving those indices against the option list.
        """
        answers = [q.model_answer for q in corpus.questions.values()]
        prose = [a for a in answers if not a.replace(",", "").strip().isdigit() and a]
        assert len(prose) <= 1, f"prose model answers appeared: {prose[:3]}"
        assert max(len(a) for a in answers) < 20

    def test_the_incorrect_path_never_identifies_the_correct_option(self, corpus, retriever):
        """
        The enforceable property, stated precisely.

        We cannot stop the *content* of a correct answer appearing in the
        prompt, and should not try: the delivery material teaches the answers,
        that is what delivery material is. A passage about estimating will
        contain the phrase "the rule of two method" whether or not that is the
        marked option.

        What we can guarantee is that nothing in the prompt *identifies* which
        option is correct. No marking-guide line, and no enumerated option list
        for the learner to map an index onto. Attribution is the thing being
        withheld, not vocabulary.
        """
        from aita.prompts import marked_answer_prompt

        candidates = [
            q for q in corpus.questions.values()
            if q.options and len(q.options) >= 3 and q.model_answer
        ]
        assert len(candidates) > 50

        for question in candidates[:40]:
            result = retriever.search(question.question, unit_code=question.unit_code, limit=3)
            prompt = marked_answer_prompt(
                question,
                marked_correct=False,
                student_response="",
                criteria=[],
                result=result,
                include_model_answer=False,
            )
            # The exact template line that discloses the key. Checking for the
            # bare phrase "marking guide" would match the incorrect-path
            # prompt's own instruction *not* to disclose one.
            assert "gives the correct answer as" not in prompt, question.question_id
            assert question.resolved_model_answer not in prompt.split("Course material:")[0]
            # No enumerated options: an index like "1,3" is only a key if the
            # learner can see which text is option 1 and which is option 3.
            for position, option in enumerate(question.options, start=1):
                assert f"{position}. {option}" not in prompt, question.question_id

    def test_the_correct_path_resolves_the_answer_into_words(self, corpus, retriever):
        """When the learner already got it right, the answer is spelled out."""
        from aita.prompts import marked_answer_prompt

        question = next(
            q for q in corpus.questions.values()
            if q.question_type == "Multiple choice" and q.options and q.model_answer == "1,3"
        )
        result = retriever.search(question.question, unit_code=question.unit_code, limit=3)
        prompt = marked_answer_prompt(
            question,
            marked_correct=True,
            student_response="",
            criteria=[],
            result=result,
            include_model_answer=True,
        )
        assert question.resolved_model_answer in prompt
        assert question.resolved_model_answer != question.model_answer  # actually resolved

    def test_asking_for_the_answer_is_caught(self):
        for phrasing in (
            "what's the answer to question 4",
            "just tell me the answer",
            "what are the correct answers",
            "is my answer right?",
            "did I pass",
            "mark my work",
            "am I competent yet",
        ):
            assert detect_assessment_request(phrasing), phrasing

    def test_ordinary_questions_are_not_caught(self):
        for phrasing in (
            "what are the different types of hazard",
            "why do I need a hard hat",
            "what was that thing about the ladder angle",
            "can you explain exclusion zones",
        ):
            assert not detect_assessment_request(phrasing), phrasing

    def test_no_marking_decision_means_no_access(self):
        with pytest.raises(AnswerKeyAccessError):
            authorise_answer_key("some:question:id", None)

    def test_marking_decision_must_match_the_question(self):
        decision = MarkingDecision("unit:a1:s1:q1", True, "assessor:jane")
        with pytest.raises(AnswerKeyAccessError):
            authorise_answer_key("unit:a1:s1:q9", decision)

    def test_marking_decision_requires_a_named_human(self):
        with pytest.raises(AnswerKeyAccessError):
            MarkingDecision("unit:a1:s1:q1", True, "   ")

    def test_model_answer_withheld_when_learner_got_it_wrong(self):
        wrong = MarkingDecision("q", marked_correct=False, marked_by="assessor:jane")
        right = MarkingDecision("q", marked_correct=True, marked_by="assessor:jane")
        assert answer_key_policy(wrong) is False
        assert answer_key_policy(right) is True
        # ...and the policy is overridable by the client, not by us.
        assert answer_key_policy(wrong, reveal_when_incorrect=True) is True


# ==========================================================================
# Grounding and abstention
# ==========================================================================


class TestGrounding:
    IN_SCOPE = [
        "what are the different types of hazard",
        "what does a blue triangle sign mean",
        "how do I report an incident",
        "what PPE do I need on site",
        "what was that thing about the ladder angle",
    ]
    OUT_OF_SCOPE = [
        "who won the world cup",
        "what's the capital of France",
        "how much does public liability insurance cost",
    ]

    # Questions that are out of scope but which lexical retrieval scores as
    # answerable, because every word in them is common in WHS material.
    # Recorded rather than hidden: this is the ceiling on BM25 and the concrete
    # case for hybrid retrieval. When vector search lands, delete the xfail and
    # these should pass.
    KNOWN_LEXICAL_FAILURES = [
        "what time does the site open",
        "can I bring my dog to work",
        "what is the minimum wage for an apprentice",
    ]

    def test_in_scope_questions_are_answerable(self, retriever):
        for question in self.IN_SCOPE:
            result = retriever.search(question, unit_code="DEMO101")
            verdict = assess_grounding(result)
            assert verdict.may_answer, f"{question!r} -> {verdict.coverage:.2f}"

    def test_out_of_scope_questions_abstain(self, retriever):
        for question in self.OUT_OF_SCOPE:
            result = retriever.search(question, unit_code="DEMO101")
            verdict = assess_grounding(result)
            assert verdict.decision is Grounding.ABSTAIN, f"{question!r} -> {verdict.coverage:.2f}"

    @pytest.mark.xfail(reason="BM25 cannot separate these; needs hybrid retrieval", strict=True)
    @pytest.mark.parametrize("question", KNOWN_LEXICAL_FAILURES)
    def test_known_lexical_retrieval_ceiling(self, retriever, question):
        result = retriever.search(question, unit_code="DEMO101")
        assert assess_grounding(result).decision is Grounding.ABSTAIN

    def test_empty_question_abstains(self, retriever):
        verdict = assess_grounding(retriever.search("um, uh", unit_code="DEMO101"))
        assert verdict.decision is Grounding.ABSTAIN

    def test_spoken_filler_is_stripped(self):
        assert tokenize("what was that thing about the ladder angle", spoken=True) == ["ladder", "angle"]
        assert tokenize("um can you tell me about PPE", spoken=True) == ["ppe"]

    def test_unit_codes_survive_tokenising(self):
        """The lexical half of retrieval exists for exactly this."""
        assert "demo101" in tokenize("what is in DEMO101")

    def test_playback_position_biases_results(self, retriever):
        far = retriever.search("hazard", unit_code="DEMO101", near_sequence=1, limit=3)
        near = retriever.search("hazard", unit_code="DEMO101", near_sequence=40, limit=3)
        assert [h.chunk.chunk_id for h in far.hits] != [h.chunk.chunk_id for h in near.hits]


# ==========================================================================
# Tone
# ==========================================================================


class TestTone:
    def test_condescension_is_flagged(self):
        assert check_tone("Obviously you just need to wear a hard hat.")
        assert check_tone("As I already explained, hazards must be reported.")
        assert check_tone("This is basic safety knowledge.")
        assert check_tone("You should know this by now.")

    def test_plain_explanation_is_clean(self):
        assert check_tone(
            "A hard hat protects you from anything falling from above. On most "
            "sites you need one from the moment you walk through the gate."
        ) == []


# ==========================================================================
# The MCP tool surface
# ==========================================================================


class TestToolSurface:
    @pytest.fixture(scope="class")
    def tools(self):
        import asyncio

        from aita import server

        return {t.name: t for t in asyncio.run(server.mcp.list_tools())}

    def test_expected_tools_are_exposed(self, tools):
        assert set(tools) == {
            "list_units",
            "get_unit_outline",
            "get_material",
            "search_material",
            "explain_concept",
            "explain_marked_answer",
        }

    def test_nothing_on_the_surface_can_mark(self, tools):
        """
        The strongest form of "Aita never marks": no tool does.

        If someone later adds one, this test fails and the conversation happens
        before the code ships rather than after.
        """
        # "unit of competency" is the domain's own term for a subject and is
        # unavoidable; what must not appear is Aita doing the deciding.
        forbidden = re.compile(
            r"\b(mark|grade|score|assess|judge)s?\b|\bdecide[sd]?\s+competen", re.I
        )
        for name, tool in tools.items():
            assert not forbidden.search(name), f"tool {name!r} sounds like it marks"
            first_line = (tool.description or "").strip().splitlines()[0]
            assert not forbidden.search(first_line), f"tool {name!r}: {first_line!r}"

    def test_every_tool_is_documented(self, tools):
        for name, tool in tools.items():
            assert tool.description and len(tool.description) > 80, name

    @staticmethod
    def _schema(tool):
        """mcp 1.x calls it inputSchema; 2.x renamed it to input_schema."""
        return getattr(tool, "inputSchema", None) or tool.input_schema

    def test_explain_marked_answer_demands_an_assessor(self, tools):
        schema = self._schema(tools["explain_marked_answer"])
        assert "marked_by" in schema["required"]
        assert "marked_correct" in schema["required"]
