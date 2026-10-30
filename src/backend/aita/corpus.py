"""
Loading the the demo project course data into memory.

Everything the audit found is enforced here rather than left to callers:

  * items are keyed on (unit_code, sequence, type) - `sequence` alone collides
    between slides and document content 128 times (DATA_AUDIT.md, Finding 1);
  * the two demo course spellings fold onto one canonical unit, so the 81
    question-to-criterion references that dangle otherwise all resolve
    (Finding 3);
  * `contentChars` from the index is ignored entirely (Finding 2);
  * assessment model answers are loaded into a **separate store** that the
    retrieval corpus cannot see (see `Corpus.teaching_chunks` vs
    `Corpus.questions`).

That last one is a security boundary, not a tidiness preference. If model
answers reach the search index, a learner asking "what's the answer to question
four" retrieves the marking guide. Keeping them in a different structure means
no prompt change or retrieval bug can leak them - the tool that reads them
requires a human marking decision as an argument.
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Iterator, Literal

# --------------------------------------------------------------------------
# Unit code aliasing
# --------------------------------------------------------------------------

# DEMO101 and DEMO101 are the same unit under two spellings, a real code
# change in the national register that the demonstration data carries on both
# sides. Merging is mandatory: see DATA_AUDIT.md Finding 3.
UNIT_ALIASES: dict[str, str] = {}


def canonical_unit(code: str) -> str:
    """Fold an alias onto its canonical unit code."""
    return UNIT_ALIASES.get(code.strip().upper(), code.strip().upper())


def aliases_of(canonical: str) -> list[str]:
    """Every spelling that maps onto this canonical code, including itself."""
    return [canonical] + [a for a, c in UNIT_ALIASES.items() if c == canonical]


# --------------------------------------------------------------------------
# Criterion numbering
# --------------------------------------------------------------------------

CriterionBand = Literal[
    "element",
    "criterion",
    "performance_evidence",
    "knowledge_evidence",
    "assessment_conditions",
    "foundation_skills",
]


def criterion_band(number: int) -> CriterionBand:
    """
    Criterion numbers are structured, not sequential.

        100          element 1 heading
        101, 102     its performance criteria
        10000-10099  performance evidence - the skills a learner demonstrates
        10100+       knowledge evidence - what a learner must know
        20000+       assessment conditions
        30000+       foundation skills from training.gov.au

    "The things a learner must be able to do" means number < 10000.
    """
    if number < 10000:
        return "element" if number % 100 == 0 else "criterion"
    if number < 10100:
        return "performance_evidence"
    if number < 20000:
        return "knowledge_evidence"
    if number < 30000:
        return "assessment_conditions"
    return "foundation_skills"


# --------------------------------------------------------------------------
# Records
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class MaterialItem:
    """One item of delivery material in the demo dataset."""

    unit_code: str          # canonical - use this for lookups
    source_unit_code: str   # as filed, preserved so we can explain the merge
    sequence: int
    type: str               # PC | ELEMENT | SLIDE | OTHER
    pc_number: int | None
    pc_variant: str
    title: str
    text: str               # empty for SLIDE rows, which carry no text layer
    database_id: str | None = None

    @property
    def item_id(self) -> str:
        # Includes `type` because (unit, sequence) is ambiguous - Finding 1.
        return f"{self.source_unit_code}:{self.type}:{self.sequence}"

    @property
    def has_text(self) -> bool:
        return bool(self.text.strip())


@dataclass(frozen=True)
class Chunk:
    """A retrievable slice of one material item."""

    chunk_id: str
    item_id: str
    unit_code: str
    sequence: int
    ordinal: int            # position of this chunk within its item
    title: str
    pc_number: int | None
    text: str

    def citation(self) -> str:
        """Human-readable provenance, spoken or logged alongside an answer."""
        where = f"{self.unit_code} - {self.title}".strip(" -")
        if self.pc_number is not None and criterion_band(self.pc_number) == "criterion":
            element, criterion = divmod(self.pc_number, 100)
            return f"{where} (criterion {element}.{criterion})"
        return where


@dataclass(frozen=True)
class Criterion:
    unit_code: str
    source_unit_code: str
    number: int
    text: str
    band: CriterionBand

    @property
    def label(self) -> str:
        if self.band in ("element", "criterion"):
            element, criterion = divmod(self.number, 100)
            return f"{element}.{criterion}" if criterion else f"element {element}"
        return str(self.number)


@dataclass(frozen=True)
class MappingRef:
    """One token from an assessment question's `mapping` field."""

    raw: str
    number: int | None      # resolved criterion number, None if unresolvable
    kind: Literal["criterion", "knowledge", "skills", "unresolved"]


@dataclass(frozen=True)
class AssessmentQuestion:
    """
    An assessment question and its marking guide.

    `model_answer` is the live marking guide for a national qualification. It is
    deliberately NOT reachable from the retrieval corpus. Only
    `tools.explain_marked_answer` reads it, and only when handed a human
    marking decision.
    """

    unit_code: str
    source_unit_code: str
    assessment_number: int | None
    section: int | None
    question_num: int | None
    question_type: str
    question: str
    options: list[str]
    model_answer: str
    mapping: list[MappingRef]

    @property
    def question_id(self) -> str:
        return f"{self.source_unit_code}:a{self.assessment_number}:s{self.section}:q{self.question_num}"

    @property
    def resolved_model_answer(self) -> str:
        """
        The marking guide in words rather than indices.

        Every model answer in this package is numeric - "1,3" means the first
        and third option, "2" means the second. Median length is one character;
        the longest is 17. There is no prose model answer anywhere in the 482
        questions, which is worth knowing because it moves where the risk sits.

        A raw "1,3" leaks nothing on its own. Resolving it against `options`
        produces the answer key. So this property - not the `model_answer`
        field - is the sensitive operation, and it is what the guardrail gates.

        (The demo configuration supports prose feedback for written questions
        types. Those question types are not present in this data. See
        DATA_AUDIT.md Finding 5.)
        """
        if not self.options:
            return self.model_answer
        picked: list[str] = []
        for part in self.model_answer.split(","):
            part = part.strip()
            if part.isdigit() and 1 <= int(part) <= len(self.options):
                picked.append(self.options[int(part) - 1])
        return "; ".join(picked) if picked else self.model_answer

    @property
    def is_observed(self) -> bool:
        """
        Observation/practical items are marked by an assessor watching a student
        perform a task. There is no written answer to explain, so the
        explanation flow has to behave differently. 107 of 482 questions.
        """
        return self.question_type.strip().lower().startswith("observation")


@dataclass(frozen=True)
class Unit:
    code: str                       # canonical
    source_codes: list[str]
    name: str
    release: str
    nominal_hours: int | None
    descriptor: str

    @property
    def is_merged(self) -> bool:
        return len(self.source_codes) > 1


# --------------------------------------------------------------------------
# Mapping field grammar
# --------------------------------------------------------------------------

_RE_CRITERION = re.compile(r"(\d+)\.(\d+)$")
_RE_KNOWLEDGE = re.compile(r"[kK](\d+)$")
_RE_SKILLS = re.compile(r"[sS](\d+)$")


def parse_mapping(raw: str) -> list[MappingRef]:
    """
    Parse an assessment question's `mapping` field, e.g. "1.1, k2".

        "1.1" -> criterion  101      (E.C  -> E*100 + C)
        "k2"  -> knowledge  10101    (kN   -> 10099 + N)
        "s1"  -> skills     10000    (sN   -> 9999 + N)

    Anything else is kept as an unresolved reference rather than guessed at.
    That includes the fN foundation-skill tokens: the foundation rows are
    numbered 30100, 30101, 30300, 30301, 30302, 30400 - not a contiguous run -
    and 7 distinct tokens are cited against 6 rows, so no offset recovers them.
    29 of 1,326 tokens land here. See DATA_AUDIT.md Finding 4; it is an open
    question for a reviewer, not something to invent an answer for.
    """
    refs: list[MappingRef] = []
    for token in (raw or "").split(","):
        token = token.strip()
        if not token:
            continue
        if m := _RE_CRITERION.match(token):
            refs.append(MappingRef(token, int(m.group(1)) * 100 + int(m.group(2)), "criterion"))
        elif m := _RE_KNOWLEDGE.match(token):
            refs.append(MappingRef(token, 10099 + int(m.group(1)), "knowledge"))
        elif m := _RE_SKILLS.match(token):
            refs.append(MappingRef(token, 9999 + int(m.group(1)), "skills"))
        else:
            refs.append(MappingRef(token, None, "unresolved"))
    return refs


# --------------------------------------------------------------------------
# Chunking
# --------------------------------------------------------------------------

# Retrieval chunks and narration segments are different things and want
# different sizes, so they are produced separately.
RETRIEVAL_CHUNK_CHARS = 1200
RETRIEVAL_OVERLAP_CHARS = 150

# ~150 words per minute; a 900-character segment is roughly one minute spoken.
SPEECH_SEGMENT_CHARS = 900

_RE_PARAGRAPH = re.compile(r"\n\s*\n")
_RE_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def _paragraphs(text: str) -> list[str]:
    return [p.strip() for p in _RE_PARAGRAPH.split(text) if p.strip()]


def _pack(pieces: Iterable[str], target: int, overlap: int = 0) -> list[str]:
    """Greedily pack pieces into blocks of roughly `target` characters."""
    blocks: list[str] = []
    current: list[str] = []
    size = 0
    for piece in pieces:
        if current and size + len(piece) > target:
            blocks.append("\n\n".join(current))
            if overlap and blocks[-1]:
                tail = blocks[-1][-overlap:]
                current, size = [tail], len(tail)
            else:
                current, size = [], 0
        current.append(piece)
        size += len(piece) + 2
    if current:
        blocks.append("\n\n".join(current))
    return [b for b in blocks if b.strip()]


def _split_oversized(piece: str, target: int) -> list[str]:
    """
    A single paragraph longer than the target is split on sentences, and if a
    single "sentence" is still oversized, on whitespace.

    The fallback earns its place: some source paragraphs are bulleted lists
    flattened into one unpunctuated run, so sentence splitting alone leaves
    blocks well over target.
    """
    if len(piece) <= target:
        return [piece]
    out: list[str] = []
    for block in _pack(_RE_SENTENCE_END.split(piece), target):
        if len(block) <= target * 1.25:
            out.append(block)
        else:
            out.extend(_pack(block.split(" "), target))
    return out


def chunk_item(item: MaterialItem) -> list[Chunk]:
    """
    Split one item into retrieval chunks.

    The median item is 695 characters and needs no splitting. The tail very much
    does: 26 items exceed 8,000 characters and the largest is 39,485 - about 48
    minutes spoken. Splitting happens on paragraph boundaries first and sentence
    boundaries only when a single paragraph is itself oversized, because where
    you split changes whether narration sounds like a person or a machine.
    """
    if not item.has_text:
        return []
    pieces: list[str] = []
    for paragraph in _paragraphs(item.text):
        pieces.extend(_split_oversized(paragraph, RETRIEVAL_CHUNK_CHARS))
    blocks = _pack(pieces, RETRIEVAL_CHUNK_CHARS, RETRIEVAL_OVERLAP_CHARS)
    return [
        Chunk(
            chunk_id=f"{item.item_id}#{ordinal}",
            item_id=item.item_id,
            unit_code=item.unit_code,
            sequence=item.sequence,
            ordinal=ordinal,
            title=item.title,
            pc_number=item.pc_number,
            text=block,
        )
        for ordinal, block in enumerate(blocks)
    ]


def segment_for_speech(text: str, target: int = SPEECH_SEGMENT_CHARS) -> list[str]:
    """
    Split text into segments suitable for reading aloud.

    Separate from `chunk_item` on purpose. Retrieval wants overlapping chunks
    sized for a model's context; narration wants clean, non-overlapping,
    sentence-terminated segments a learner can pause between and resume from.
    """
    pieces: list[str] = []
    for paragraph in _paragraphs(text):
        pieces.extend(_split_oversized(paragraph, target))
    return _pack(pieces, target, overlap=0)


# --------------------------------------------------------------------------
# Corpus
# --------------------------------------------------------------------------


@dataclass
class Corpus:
    """Everything loaded from `data/`, with the two stores kept apart."""

    units: dict[str, Unit] = field(default_factory=dict)
    items: dict[str, MaterialItem] = field(default_factory=dict)
    criteria: dict[str, dict[int, Criterion]] = field(default_factory=dict)

    # Teaching content. This is the ONLY thing the retriever indexes.
    teaching_chunks: list[Chunk] = field(default_factory=list)

    # Assessment questions including model answers. Never indexed, never
    # searched, only reachable through explain_marked_answer.
    questions: dict[str, AssessmentQuestion] = field(default_factory=dict)

    # ---- lookups -------------------------------------------------------

    def unit(self, code: str) -> Unit | None:
        return self.units.get(canonical_unit(code))

    def items_for_unit(self, code: str, *, readable_only: bool = True) -> list[MaterialItem]:
        """Items in the unit's intended teaching order."""
        canon = canonical_unit(code)
        found = [i for i in self.items.values() if i.unit_code == canon]
        if readable_only:
            found = [i for i in found if i.has_text]
        # Sort by source spelling first so a merged unit reads as two coherent
        # runs rather than interleaving two independent sequence spaces.
        return sorted(found, key=lambda i: (i.source_unit_code, i.sequence))

    def chunks_for_unit(self, code: str) -> list[Chunk]:
        canon = canonical_unit(code)
        return [c for c in self.teaching_chunks if c.unit_code == canon]

    def criterion(self, unit_code: str, number: int) -> Criterion | None:
        return self.criteria.get(canonical_unit(unit_code), {}).get(number)

    def questions_for_unit(self, code: str) -> list[AssessmentQuestion]:
        canon = canonical_unit(code)
        return [q for q in self.questions.values() if q.unit_code == canon]


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------


def _read_csv(path: Path) -> Iterator[dict[str, str]]:
    with open(path, encoding="utf-8-sig", newline="") as fh:
        yield from csv.DictReader(fh)


def _read_jsonl(path: Path) -> Iterator[dict]:
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                yield json.loads(line)


def _int_or_none(value) -> int | None:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def load_corpus(data_dir: str | Path) -> Corpus:
    """Load the whole package. Roughly 100 ms; call once at server start."""
    data = Path(data_dir)
    return _build_corpus({
        name: list(_read_csv(data / name) if name.endswith('.csv') else _read_jsonl(data / name))
        for name in ('units.csv', 'delivery_material_index.csv', 'delivery_material_text.jsonl',
                     'performance_criteria.csv', 'assessment_questions.jsonl')
    })


def _build_corpus(records: dict[str, list[dict]]) -> Corpus:
    corpus = Corpus()

    # -- units ---------------------------------------------------------
    merged: dict[str, list[dict[str, str]]] = {}
    for row in records["units.csv"]:
        merged.setdefault(canonical_unit(row["code"]), []).append(row)
    for canon, rows in merged.items():
        primary = next((r for r in rows if canonical_unit(r["code"]) == r["code"].strip()), rows[0])
        corpus.units[canon] = Unit(
            code=canon,
            source_codes=sorted(r["code"].strip() for r in rows),
            name=primary.get("name", "").strip(),
            release=primary.get("release", "").strip(),
            nominal_hours=_int_or_none(primary.get("nominalHours")),
            descriptor=primary.get("unitDescriptor", "").strip(),
        )

    # -- material ------------------------------------------------------
    # The index carries every item including the 453 text-less slides; the text
    # file carries only the 630 readable ones. Join on the composite key.
    text_by_key = {
        (row["unitCode"], int(row["sequence"]), row["type"]): row.get("text") or ""
        for row in records["delivery_material_text.jsonl"]
    }
    for row in records["delivery_material_index.csv"]:
        key = (row["unitCode"], int(row["sequence"]), row["type"])
        item = MaterialItem(
            unit_code=canonical_unit(row["unitCode"]),
            source_unit_code=row["unitCode"].strip(),
            sequence=int(row["sequence"]),
            type=row["type"].strip(),
            pc_number=_int_or_none(row.get("pcNumber")),
            pc_variant=(row.get("pcVariant") or "").strip(),
            title=(row.get("title") or "").strip(),
            text=text_by_key.get(key, ""),
            database_id=row.get("database_id"),
        )
        if item.item_id in corpus.items:
            raise ValueError(f"Ambiguous legacy material identity: {item.item_id}")
        corpus.items[item.item_id] = item

    for item in corpus.items.values():
        corpus.teaching_chunks.extend(chunk_item(item))

    # -- criteria ------------------------------------------------------
    for row in records["performance_criteria.csv"]:
        number = _int_or_none(row["criterionNumber"])
        if number is None:
            continue
        canon = canonical_unit(row["unitCode"])
        criterion = Criterion(
            unit_code=canon,
            source_unit_code=row["unitCode"].strip(),
            number=number,
            text=(row.get("criterionText") or "").strip(),
            band=criterion_band(number),
        )
        # Merging the two demo course spellings means both contribute criteria.
        # Where both define the same number the texts agree, so first wins.
        corpus.criteria.setdefault(canon, {}).setdefault(number, criterion)

    # -- assessment questions -----------------------------------------
    for row in records["assessment_questions.jsonl"]:
        if row.get("structural"):
            continue  # section headers and instruction blocks, not questions
        question = AssessmentQuestion(
            unit_code=canonical_unit(row["unitCode"]),
            source_unit_code=row["unitCode"].strip(),
            assessment_number=_int_or_none(row.get("assessmentNumber")),
            section=_int_or_none(row.get("section")),
            question_num=_int_or_none(row.get("questionNum")),
            question_type=(row.get("questionType") or "").strip(),
            question=(row.get("question") or "").strip(),
            options=list(row.get("options") or []),
            model_answer=(row.get("modelAnswer") or "").strip(),
            mapping=parse_mapping(row.get("mapping") or ""),
        )
        corpus.questions[question.question_id] = question

    return corpus
