"""
The Aita MCP server.

the demonstration requirements is explicit about the architecture: "for this project, the MCP
server is the one in control of integration. You build against MCP; you do not
need to touch the platform internals." So this is the boundary. Everything the
assistant can do, it does through a tool defined here, and there is nothing else
it can reach.

That constraint is the safety story. Note what is NOT in the tool list: nothing
marks an answer, nothing records a grade, nothing writes learner behaviour
anywhere it could be reported to an assessor, and nothing returns an assessment
model answer without a human marking decision passed in as an argument. The
guarantee is structural. You can read the tool list and see the whole surface.

Run it:

    python -m aita.server                      # stdio, for an MCP client
    python -m aita.server --selftest           # exercise the tools, no client

Configuration:

    AITA_DATA_DIR         path to the data/ folder (default: ../../data)
    AITA_MODEL_BASE_URL   OpenAI-compatible endpoint; unset = context-only mode
    AITA_MODEL_NAME       model name at that endpoint
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

try:
    # mcp >= 2.0 renamed FastMCP to MCPServer. The decorator API we use is
    # unchanged, so one import shim covers both and nobody on the team has to
    # care which version pip happened to give them.
    from mcp.server.mcpserver import MCPServer as _MCPServer
except ModuleNotFoundError:  # mcp 1.x
    from mcp.server.fastmcp import FastMCP as _MCPServer

from .corpus import (
    Corpus,
    canonical_unit,
    criterion_band,
    load_corpus,
    segment_for_speech,
)
from .guardrails import (
    AnswerKeyAccessError,
    Grounding,
    GroundingThresholds,
    MarkingDecision,
    answer_key_policy,
    assess_grounding,
    authorise_answer_key,
    check_tone,
    detect_assessment_request,
)
from .llm import ModelUnavailable, provider_from_env
from .prompts import (
    ASSESSMENT_DEFLECTION,
    SYSTEM_PROMPT,
    abstention_response,
    explain_concept_prompt,
    marked_answer_prompt,
)
from .retrieval import BM25Retriever

# --------------------------------------------------------------------------
# Wiring
# --------------------------------------------------------------------------

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "data"
DATA_DIR = Path(os.environ.get("AITA_DATA_DIR", DEFAULT_DATA_DIR))

mcp = _MCPServer(
    "aita",
    instructions=(
        "Aita helps learners study for Workshop Safety Basics. It reads "
        "course material aloud and explains it. It does not mark work and does "
        "not decide competency - a human assessor does that. Every explanation "
        "is grounded in the learner's own course material; when the material "
        "does not cover something, Aita says so rather than guessing."
    ),
)

# Explicit configuration fails closed instead of silently falling back to stale files.
DATABASE_PATH = os.environ.get("AITA_DATABASE_PATH")
if DATABASE_PATH:
    from .sqlite_corpus import load_sqlite_corpus
    corpus: Corpus = load_sqlite_corpus(DATABASE_PATH)
else:
    corpus: Corpus = load_corpus(DATA_DIR)
retriever = BM25Retriever(corpus)
model = provider_from_env()
thresholds = GroundingThresholds()


def _generate(system: str, user: str) -> tuple[str | None, str | None]:
    """Returns (answer, error). Never raises - a tool result explains instead."""
    if not model.available:
        return None, "no_model_configured"
    try:
        return model.complete(system, user), None
    except ModelUnavailable as error:
        return None, str(error)


# --------------------------------------------------------------------------
# Tools
# --------------------------------------------------------------------------


@mcp.tool()
def list_units() -> list[dict[str, Any]]:
    """
    List the units of competency available to study.

    Note DEMO101: the demonstration data files it under two spellings and this
    server merges them, which is why `source_codes` can hold two entries. The
    merge is not cosmetic - unmerged, 81 of that unit's assessment questions
    reference criteria that appear not to exist.
    """
    out = []
    for unit in sorted(corpus.units.values(), key=lambda u: u.code):
        items = corpus.items_for_unit(unit.code)
        words = sum(len(i.text.split()) for i in items)
        out.append(
            {
                "unit_code": unit.code,
                "name": unit.name,
                "source_codes": unit.source_codes,
                "merged_from_aliases": unit.is_merged,
                "nominal_hours": unit.nominal_hours,
                "readable_items": len(items),
                "approx_narration_minutes": round(words / 150),
            }
        )
    return out


@mcp.tool()
def get_unit_outline(unit_code: str) -> dict[str, Any]:
    """
    What a learner is about to learn in this unit, in their own order.

    Returns the performance criteria - the statements of what the unit teaches -
    plus the reading order. Telling a learner the shape of what is coming before
    they start is cheap and helps retention, and the criteria give us that list
    for free.

    Args:
        unit_code: Unit code, e.g. DEMO101. Aliases are accepted.
    """
    unit = corpus.unit(unit_code)
    if unit is None:
        return {"error": f"Unknown unit {unit_code!r}.", "known_units": sorted(corpus.units)}

    criteria = corpus.criteria.get(unit.code, {})
    syllabus = [
        {"label": c.label, "number": c.number, "text": c.text, "band": c.band}
        for c in sorted(criteria.values(), key=lambda c: c.number)
        if c.band in ("element", "criterion")
    ]
    reading_order = [
        {
            "item_id": item.item_id,
            "database_id": item.database_id,
            "source_unit_code": item.source_unit_code,
            "sequence": item.sequence,
            "title": item.title,
            "approx_seconds": round(len(item.text.split()) / 150 * 60),
        }
        for item in corpus.items_for_unit(unit.code)
    ]
    return {
        "unit_code": unit.code,
        "name": unit.name,
        "descriptor": unit.descriptor,
        "syllabus": syllabus,
        "reading_order": reading_order,
    }


@mcp.tool()
def get_material(unit_code: str, sequence: int | None = None, item_id: str | None = None) -> dict[str, Any]:
    """
    Fetch one item of course material, ready to be read aloud.

    The text comes back both whole and split into speech segments. Segments are
    sentence-terminated and roughly a minute each, so the player can pause
    between them and resume where the learner left off - across a merged unit
    that is over four hours of narration, so resuming is a requirement, not a
    nicety.

    Args:
        unit_code: Unit code, e.g. DEMO101.
        sequence: Position in the unit's teaching order. Omit for the first item.
        item_id: Exact item id from get_unit_outline, if you have it.
    """
    items = corpus.items_for_unit(unit_code)
    if not items:
        return {"error": f"No readable material for {unit_code!r}."}

    if item_id:
        item = next((i for i in items if (i.item_id == item_id or i.database_id == item_id)), None)
    elif sequence is not None:
        item = next((i for i in items if i.sequence == sequence), None)
    else:
        item = items[0]

    if item is None:
        return {"error": "No item matched.", "available": [i.item_id for i in items[:20]]}

    position = items.index(item)
    segments = segment_for_speech(item.text)
    return {
        "item_id": item.item_id,
        "database_id": item.database_id,
        "source_unit_code": item.source_unit_code,
        "unit_code": item.unit_code,
        "sequence": item.sequence,
        "title": item.title,
        "text": item.text,
        "speech_segments": segments,
        "approx_seconds": round(len(item.text.split()) / 150 * 60),
        "position": position + 1,
        "of": len(items),
        "next_item_id": items[position + 1].item_id if position + 1 < len(items) else None,
        "previous_item_id": items[position - 1].item_id if position else None,
    }


@mcp.tool()
def search_material(
    query: str,
    unit_code: str | None = None,
    limit: int = 6,
    near_sequence: int | None = None,
) -> dict[str, Any]:
    """
    Search the course material. Teaching content only - never assessment answers.

    Args:
        query: What the learner asked, in their words. Spoken phrasing is fine.
        unit_code: Restrict to one unit. Strongly recommended.
        limit: Maximum passages to return.
        near_sequence: Where the learner is up to. Nearby material is favoured,
            because "why does that matter?" depends on what was just read.
    """
    result = retriever.search(query, unit_code=unit_code, limit=limit, near_sequence=near_sequence)
    verdict = assess_grounding(result, thresholds)
    return {
        "query": query,
        "search_terms": result.query_terms,
        "coverage": round(result.union_coverage, 3),
        "grounding": verdict.decision.value,
        "words_not_in_any_material": result.unknown_terms,
        "results": [hit.as_dict() for hit in result.hits],
    }


@mcp.tool()
def explain_concept(
    question: str,
    unit_code: str | None = None,
    near_sequence: int | None = None,
) -> dict[str, Any]:
    """
    Explain something a learner asked about, using only their course material.

    This is the main teaching tool. It retrieves first, decides whether the
    material can support an answer at all, and only then generates. If the
    material does not cover the question it returns a spoken refusal rather than
    an answer - a confident wrong answer read aloud sounds exactly like a
    confident right one, so the decision to speak is made on evidence, before
    any model sees the question.

    Args:
        question: The learner's question, as spoken.
        unit_code: The unit they are studying.
        near_sequence: Where they are up to in that unit.
    """
    # The learner is allowed to ask "is my answer right?" - they just don't get
    # an answer to it from Aita. Deflect warmly and move on.
    if detect_assessment_request(question):
        return {
            "answer": ASSESSMENT_DEFLECTION,
            "grounding": "refused_assessment",
            "reason": "Aita does not mark work or judge competency.",
            "sources": [],
        }

    result = retriever.search(question, unit_code=unit_code, limit=5, near_sequence=near_sequence)
    verdict = assess_grounding(result, thresholds)

    if verdict.decision is Grounding.ABSTAIN:
        nearby = []
        for hit in result.hits[:3]:
            if hit.chunk.title and hit.chunk.title not in nearby:
                nearby.append(hit.chunk.title)
        if not nearby and unit_code:
            nearby = [
                c.text for c in sorted(
                    corpus.criteria.get(canonical_unit(unit_code), {}).values(),
                    key=lambda c: c.number,
                )[:3]
                if criterion_band(c.number) == "criterion"
            ]
        return {
            "answer": abstention_response(verdict, nearby),
            "grounding": verdict.decision.value,
            "coverage": round(verdict.coverage, 3),
            "reason": verdict.reason,
            "words_not_in_any_material": list(verdict.unknown_terms),
            "sources": [],
        }

    prompt = explain_concept_prompt(question, result, verdict)
    answer, error = _generate(SYSTEM_PROMPT, prompt)

    return {
        "answer": answer,
        "model_error": error,
        "grounding": verdict.decision.value,
        "coverage": round(verdict.coverage, 3),
        "reason": verdict.reason,
        "tone_warnings": check_tone(answer or ""),
        "sources": [hit.chunk.citation() for hit in result.hits],
        "source_materials": [
            {"item_id": hit.chunk.item_id, "unit_code": hit.chunk.unit_code,
             "title": hit.chunk.title, "citation": hit.chunk.citation()}
            for hit in result.hits
        ],
        # Returned so the retrieval and prompting layer stays inspectable with
        # no model attached, and so evaluation can assert on exactly what the
        # model was given rather than only on what it said.
        "system_prompt": SYSTEM_PROMPT,
        "prompt": prompt,
    }


@mcp.tool()
def explain_marked_answer(
    question_id: str,
    marked_correct: bool,
    marked_by: str,
    student_response: str = "",
) -> dict[str, Any]:
    """
    Explain an assessment answer that a human assessor has ALREADY marked.

    This is the only tool that can reach the assessment marking guide, and it
    cannot do so without a marking decision that a human made. Aita never
    produces that decision - the platform passes on a real assessor's recorded
    judgement. Calling this does not mark anything; the marking already
    happened.

    When the answer was marked incorrect, the model answer is deliberately NOT
    put into the prompt. The learner is likely to re-sit the question, and
    handing over the marking guide would turn "explain why I was wrong" into an
    answer key. Instead the explanation teaches the underlying concept from the
    delivery material and points the learner back to it.

    Args:
        question_id: From the assessment question record.
        marked_correct: The assessor's decision. Not Aita's.
        marked_by: Identifier of the human assessor who marked it. Required.
        student_response: What the learner answered, if recorded.
    """
    question = corpus.questions.get(question_id)
    if question is None:
        return {"error": f"Unknown question {question_id!r}."}

    try:
        decision = authorise_answer_key(
            question_id,
            MarkingDecision(
                question_id=question_id,
                marked_correct=marked_correct,
                marked_by=marked_by,
                student_response=student_response,
            ),
        )
    except AnswerKeyAccessError as error:
        return {"error": str(error), "grounding": "refused_answer_key"}

    include_key = answer_key_policy(decision)

    # Retrieve the teaching material for what this question was testing, using
    # the criterion text rather than the question text - the question is written
    # in assessment language, the material in teaching language.
    criteria = []
    for ref in question.mapping:
        if ref.number is None:
            continue
        criterion = corpus.criterion(question.unit_code, ref.number)
        if criterion:
            criteria.append(criterion)

    search_text = " ".join([question.question] + [c.text for c in criteria])
    result = retriever.search(search_text, unit_code=question.unit_code, limit=5)

    prompt = marked_answer_prompt(
        question,
        marked_correct=decision.marked_correct,
        student_response=decision.student_response,
        criteria=criteria,
        result=result,
        include_model_answer=include_key,
    )
    answer, error = _generate(SYSTEM_PROMPT, prompt)

    return {
        "question_id": question_id,
        "question_type": question.question_type,
        "assessor_observed": question.is_observed,
        "marked_correct": decision.marked_correct,
        "marked_by": decision.marked_by,
        "model_answer_in_prompt": include_key,
        "tested_criteria": [f"{c.label} {c.text}" for c in criteria],
        "unresolved_mapping_tokens": [r.raw for r in question.mapping if r.number is None],
        "answer": answer,
        "model_error": error,
        "tone_warnings": check_tone(answer or ""),
        "sources": [hit.chunk.citation() for hit in result.hits],
        "source_materials": [
            {"item_id": hit.chunk.item_id, "unit_code": hit.chunk.unit_code,
             "title": hit.chunk.title, "citation": hit.chunk.citation()}
            for hit in result.hits
        ],
        "prompt": prompt,
    }


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------


def _selftest() -> int:
    """Exercise every tool without an MCP client. Used by tests and by hand."""
    print(f"data      : {DATA_DIR}")
    print(f"corpus    : {len(corpus.units)} units, {len(corpus.items)} items, "
          f"{len(corpus.teaching_chunks)} chunks, {len(corpus.questions)} questions")
    print(f"model     : {model.name} (available={model.available})")
    print()

    print("list_units()")
    for row in list_units():
        flag = "  [merged]" if row["merged_from_aliases"] else ""
        print(f"  {row['unit_code']:<12} {row['approx_narration_minutes']:>4} min  "
              f"{row['readable_items']:>3} items  {row['name'][:44]}{flag}")

    print("\nget_material('DEMO101')")
    material = get_material("DEMO101")
    print(f"  {material['title'][:60]}")
    print(f"  {material['position']}/{material['of']}, ~{material['approx_seconds']}s, "
          f"{len(material['speech_segments'])} speech segments")

    print("\nexplain_concept(...) across a spread of questions")
    probes = [
        ("what are the different types of hazard", "in scope"),
        ("what does a blue triangle sign mean", "in scope"),
        ("who won the world cup", "out of scope"),
        ("is my answer right", "assessment request"),
    ]
    for question, label in probes:
        out = explain_concept(question, unit_code="DEMO101")
        print(f"  [{out['grounding']:<9}] {label:<19} cov={out.get('coverage', '-')}  {question!r}")

    print("\nexplain_marked_answer(...) - the answer-key gate")
    question_id = next(
        q.question_id for q in corpus.questions_for_unit("DEMO101")
        if q.question_type == "Multiple choice" and q.model_answer
    )
    for correct in (True, False):
        out = explain_marked_answer(question_id, marked_correct=correct, marked_by="assessor:demo")
        leaked = out["model_answer_in_prompt"]
        print(f"  marked_correct={str(correct):<5} model answer in prompt: {leaked}")
    try:
        MarkingDecision(question_id=question_id, marked_correct=True, marked_by="")
    except AnswerKeyAccessError as error:
        print(f"  unsigned marking decision refused: {error}")

    print("\nOK")
    return 0


def main() -> None:
    if "--selftest" in sys.argv:
        raise SystemExit(_selftest())
    mcp.run()


if __name__ == "__main__":
    main()
