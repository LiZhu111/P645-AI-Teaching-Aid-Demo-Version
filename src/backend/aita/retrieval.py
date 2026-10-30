"""
Retrieval over the teaching corpus.

This is deliberately the simplest thing that works: BM25 over the text, no
dependencies, no embeddings, no service to stand up. It exists so the MCP tools
return real course content today instead of waiting on the data/RAG workstream,
and so the rest of the system has a real interface to build against.

It is meant to be replaced. `Retriever` is the contract; whoever owns retrieval
swaps in hybrid lexical + vector search behind it without any tool changing.
When they do, keep two properties, because the guardrails depend on them:

  1. `SearchHit.coverage` - what fraction of the learner's content words the hit
     actually contains. Abstention keys off this rather than raw relevance
     score, because BM25 and cosine similarity are both unbounded and neither
     means "this answers the question". Coverage does, roughly, and it is
     explainable to a marker.
  2. Retrieval indexes teaching content ONLY. Assessment model answers live in
     a separate store and must never enter any index. See corpus.py.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Protocol

from .corpus import Chunk, Corpus, canonical_unit

# --------------------------------------------------------------------------
# Tokenising
# --------------------------------------------------------------------------

# Unit and criterion codes are meaningful tokens and must survive intact -
# "DEMO101" must not become "demo" + "101". This is exactly what pure
# vector search is bad at and why the eventual hybrid retriever needs a lexical
# half: ask an embedding index for DEMO101 and it happily returns
# DEMO202 content, because those documents really are similar.
_RE_TOKEN = re.compile(r"[A-Za-z]+\d+[A-Za-z0-9]*|\d+\.\d+|[A-Za-z]{2,}|\d+")

_STOPWORDS = frozenset("""
a an and are as at be been but by can could did do does for from had has have
he her him his how i if in into is it its me my not of on or our out she should
so than that the their them then there these they this to was we were what when
where which who why will with would you your
""".split())

# Spoken questions arrive wrapped in filler. "What was that thing about the
# ladder angle" carries two content words. Stripping the wrapper before scoring
# materially improves recall and, more importantly, makes the coverage figure
# honest - otherwise "what/was/that/thing/about" dilute it.
_RE_SPOKEN_FILLER = re.compile(
    r"^\s*(um+|uh+|ok(ay)?|so|hey|hi|please|sorry)\b[,\s]*"
    r"|^\s*(can|could|would)\s+you\s+(please\s+)?"
    r"|^\s*(what|whats|what's)\s+(was|is)\s+(that|the)\s+thing\s+(about|with)\s*"
    r"|^\s*(tell|remind)\s+me\s+(again\s+)?(about\s+)?"
    r"|^\s*i\s+(dont|don't|didnt|didn't)\s+(get|understand)\s*",
    re.IGNORECASE,
)

_SUFFIXES = ("ing", "edly", "ies", "es", "ed", "s")


def _stem(token: str) -> str:
    """
    Crude suffix stripping. Not linguistics - just enough that "hazards"
    matches "hazard" and "reporting" matches "report".
    """
    if any(ch.isdigit() for ch in token):
        return token  # never mangle unit codes or criterion numbers
    for suffix in _SUFFIXES:
        if len(token) > len(suffix) + 3 and token.endswith(suffix):
            if suffix == "ies":
                return token[: -len(suffix)] + "y"
            return token[: -len(suffix)]
    return token


def tokenize(text: str, *, spoken: bool = False) -> list[str]:
    if spoken:
        previous = None
        while previous != text:
            previous = text
            text = _RE_SPOKEN_FILLER.sub("", text, count=1)
    tokens = [t.lower() for t in _RE_TOKEN.findall(text)]
    return [_stem(t) for t in tokens if t not in _STOPWORDS and len(t) > 1]


# --------------------------------------------------------------------------
# Results
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class SearchHit:
    chunk: Chunk
    score: float          # BM25; unbounded, comparable only within one query
    coverage: float       # 0..1 share of the query's *information* found here

    def as_dict(self) -> dict:
        return {
            "chunk_id": self.chunk.chunk_id,
            "item_id": self.chunk.item_id,
            "unit_code": self.chunk.unit_code,
            "title": self.chunk.title,
            "citation": self.chunk.citation(),
            "sequence": self.chunk.sequence,
            "text": self.chunk.text,
            "score": round(self.score, 3),
            "coverage": round(self.coverage, 3),
        }


@dataclass(frozen=True)
class RetrievalResult:
    query: str
    query_terms: list[str]
    hits: list[SearchHit]

    # Share of the query's information covered by the retrieved set as a whole.
    # A question can legitimately be answered by two passages that each carry
    # half of it, so abstention looks at the union as well as the best hit.
    union_coverage: float = 0.0

    # Query terms that appear nowhere in the corpus at all. These are the
    # strongest out-of-scope signal there is: if a learner asks about
    # "excavator" and the word does not occur in their material, no amount of
    # relevance ranking makes an answer grounded.
    unknown_terms: list[str] = field(default_factory=list)

    @property
    def best_coverage(self) -> float:
        return max((h.coverage for h in self.hits), default=0.0)


class Retriever(Protocol):
    """The contract. Swap the implementation, keep this shape."""

    def search(
        self,
        query: str,
        *,
        unit_code: str | None = None,
        limit: int = 6,
        near_sequence: int | None = None,
    ) -> RetrievalResult: ...


# --------------------------------------------------------------------------
# BM25
# --------------------------------------------------------------------------

_TERM_CACHE: dict[str, set[str]] = {}


def _chunk_terms(chunk: Chunk) -> set[str]:
    cached = _TERM_CACHE.get(chunk.chunk_id)
    if cached is None:
        cached = set(tokenize(f"{chunk.title} {chunk.text}"))
        _TERM_CACHE[chunk.chunk_id] = cached
    return cached


class BM25Retriever:
    """
    Okapi BM25 over the teaching chunks.

    Fast enough to build at server start (about 1,200 chunks) and to query in
    well under a millisecond, which matters: in a voice product the whole
    retrieve-generate-speak round trip is one latency budget, and two seconds
    that would be fine in text reads as a stall in conversation.
    """

    K1 = 1.5
    B = 0.75

    def __init__(self, corpus: Corpus, *, title_weight: int = 3) -> None:
        self.corpus = corpus
        self.chunks = list(corpus.teaching_chunks)
        self._doc_terms: list[Counter[str]] = []
        self._doc_len: list[int] = []
        document_frequency: Counter[str] = Counter()

        for chunk in self.chunks:
            # Titles carry the criterion name and are short, so repeating them
            # is a cheap way to weight them without a separate field index.
            tokens = tokenize(f"{(chunk.title + ' ') * title_weight}{chunk.text}")
            counts = Counter(tokens)
            self._doc_terms.append(counts)
            self._doc_len.append(len(tokens))
            document_frequency.update(counts.keys())

        total = len(self.chunks)
        self._avg_len = (sum(self._doc_len) / total) if total else 0.0
        self._idf = {
            term: math.log(1 + (total - freq + 0.5) / (freq + 0.5))
            for term, freq in document_frequency.items()
        }
        # A term the corpus has never seen is maximally informative and
        # maximally absent. Giving it the ceiling IDF is what makes an
        # out-of-scope question score near zero coverage instead of riding on
        # its filler words.
        self._max_idf = math.log(1 + (total + 0.5) / 0.5) if total else 1.0

    def _idf_of(self, term: str) -> float:
        return self._idf.get(term, self._max_idf)

    def search(
        self,
        query: str,
        *,
        unit_code: str | None = None,
        limit: int = 6,
        near_sequence: int | None = None,
    ) -> RetrievalResult:
        terms = tokenize(query, spoken=True)
        if not terms:
            return RetrievalResult(query=query, query_terms=[], hits=[])

        canon = canonical_unit(unit_code) if unit_code else None
        unique_terms = set(terms)

        # Coverage is weighted by inverse document frequency, not by raw term
        # count. Plain word counting says "do I need a licence to drive an
        # excavator" is 75% covered, because `need` and `drive` appear
        # everywhere; weighting by information content says it is barely
        # covered at all, which is the truth.
        total_weight = sum(self._idf_of(t) for t in unique_terms) or 1.0
        scored: list[tuple[float, float, Chunk]] = []

        for position, chunk in enumerate(self.chunks):
            # Metadata filtering alongside ranking. Trivial here; in a
            # standalone vector store it is a fight, which is the real argument
            # for keeping vectors in Postgres next to the rest of the data.
            if canon and chunk.unit_code != canon:
                continue

            counts = self._doc_terms[position]
            length = self._doc_len[position]
            score = 0.0
            for term in terms:
                frequency = counts.get(term)
                if not frequency:
                    continue
                denominator = frequency + self.K1 * (
                    1 - self.B + self.B * length / (self._avg_len or 1)
                )
                score += self._idf.get(term, 0.0) * frequency * (self.K1 + 1) / denominator

            if score <= 0:
                continue

            # "Context is where you are up to." If the learner is 20 minutes
            # into a unit and asks "why does that matter?", the answer depends
            # on what was just read. A mild proximity boost, not a hard filter -
            # the answer may legitimately live earlier in the unit.
            if near_sequence is not None:
                distance = abs(chunk.sequence - near_sequence)
                score *= 1.0 + 0.35 / (1.0 + distance)

            present = unique_terms & _chunk_terms(chunk)
            covered_weight = sum(self._idf_of(t) for t in present)
            scored.append((score, covered_weight / total_weight, chunk))

        scored.sort(key=lambda row: row[0], reverse=True)
        hits = [SearchHit(chunk=c, score=s, coverage=cov) for s, cov, c in scored[:limit]]

        union_present = {t for h in hits for t in unique_terms & _chunk_terms(h.chunk)}
        union_coverage = sum(self._idf_of(t) for t in union_present) / total_weight
        unknown = sorted(t for t in unique_terms if t not in self._idf)

        return RetrievalResult(
            query=query,
            query_terms=terms,
            hits=hits,
            union_coverage=union_coverage,
            unknown_terms=unknown,
        )
