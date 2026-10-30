#!/usr/bin/env python3
"""
verify_data.py - checks the P645 data package for the problems documented in
docs/planning/DATA_AUDIT.md.

Run it yourself. Don't take anyone's word for the findings:

    python scripts/verify_data.py

Exits 0 if the data matches what the audit says, 1 if something has changed
(which would mean the client shipped new data and the audit needs revisiting).
No dependencies beyond the Python standard library.
"""

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

DATA = Path(__file__).resolve().parent.parent / "data"

# The two spellings of the demo course unit. See Finding 3.
WHITECARD = ("DEMO101", "DEMO101")
CANONICAL = "DEMO101"

failures = []


def check(label, condition, detail=""):
    mark = "PASS" if condition else "FAIL"
    print(f"  [{mark}] {label}")
    if detail:
        print(f"         {detail}")
    if not condition:
        failures.append(label)


def load_jsonl(name):
    with open(DATA / name, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def load_csv(name):
    with open(DATA / name, encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def canon(unit_code):
    """Fold both demo course spellings onto one canonical code."""
    return CANONICAL if unit_code in WHITECARD else unit_code


def resolve(token):
    """
    Turn a mapping token into a criterionNumber.

      "1.1" -> 101     element 1, criterion 1            (E.C -> E*100 + C)
      "k2"  -> 10101   knowledge item 2                  (kN  -> 10099 + N)
      "s1"  -> 10000   skills / performance evidence 1   (sN  -> 9999 + N)

    Returns None for tokens this grammar does not cover, which includes the
    "fN" foundation-skill tokens: the foundation rows are numbered 30100,
    30101, 30300, 30301, 30302, 30400 - not a contiguous run - so no offset
    recovers them, and 7 distinct fN tokens are cited against only 6 rows.
    See Finding 4; this is a question for the client, not a bug to fix.
    """
    token = token.strip()
    if not token:
        return None
    m = re.fullmatch(r"(\d+)\.(\d+)", token)
    if m:
        return int(m.group(1)) * 100 + int(m.group(2))
    m = re.fullmatch(r"[kK](\d+)", token)
    if m:
        return 10099 + int(m.group(1))
    m = re.fullmatch(r"[sS](\d+)", token)
    if m:
        return 9999 + int(m.group(1))
    return None


# ---------------------------------------------------------------------------

index = load_csv("delivery_material_index.csv")
text = load_jsonl("delivery_material_text.jsonl")
criteria = load_csv("performance_criteria.csv")
questions = load_jsonl("assessment_questions.jsonl")
real_questions = [q for q in questions if not q.get("structural")]

print()
print("=" * 72)
print("FINDING 1  The join key needs `type`. (unitCode, sequence) is ambiguous.")
print("=" * 72)

by_pair = defaultdict(list)
for row in index:
    by_pair[(row["unitCode"], row["sequence"])].append(row)
collisions = {k: v for k, v in by_pair.items() if len(v) > 1}

check(
    "(unitCode, sequence) collides",
    len(collisions) == 128,
    f"{len(collisions)} colliding pairs, {sum(len(v) for v in collisions.values())} rows affected",
)
check(
    "every collision is a SLIDE against a non-SLIDE row",
    all(sorted(r["type"] == "SLIDE" for r in v) == [False, True] for v in collisions.values()),
    "slides carry their own sequence numbering, parallel to the document's",
)

triple = lambda r: (r["unitCode"], str(r["sequence"]), r["type"])
check(
    "(unitCode, sequence, type) is unique in the index",
    len({triple(r) for r in index}) == len(index),
    f"{len({triple(r) for r in index})} unique keys / {len(index)} rows",
)
check(
    "(unitCode, sequence, type) is unique in the text file",
    len({triple(r) for r in text}) == len(text),
    f"{len({triple(r) for r in text})} unique keys / {len(text)} rows",
)

index_keys = {triple(r) for r in index}
check(
    "every text row joins to exactly one index row on the triple",
    all(triple(r) in index_keys for r in text),
    f"{sum(1 for r in text if triple(r) in index_keys)} / {len(text)} matched",
)

if collisions:
    example = ("DEMO101", "5")
    if example in by_pair:
        print("\n         Worked example - DEMO101 sequence 5 is two different things:")
        for row in by_pair[example]:
            print(f"           type={row['type']:<8} {row['title'][:56]!r}")

print()
print("=" * 72)
print("FINDING 2  `contentChars` does not measure the text. Do not use it.")
print("=" * 72)

index_by_key = {triple(r): r for r in index}
pairs = [(int(index_by_key[triple(r)]["contentChars"]), len(r["text"])) for r in text]
exact = sum(1 for cc, actual in pairs if cc == actual)
within5 = sum(1 for cc, actual in pairs if actual and abs(cc - actual) <= actual * 0.05)
ratios = sorted(cc / actual for cc, actual in pairs if actual)

check(
    "contentChars never equals the length of `text`",
    exact == 0,
    f"exact matches: {exact}/{len(pairs)}; within 5%: {within5}/{len(pairs)}",
)
check(
    "contentChars overstates text length by a large factor",
    median(ratios) > 10,
    f"ratio contentChars/len(text): min {ratios[0]:.2f}, median {median(ratios):.1f}, max {ratios[-1]:.0f}",
)

html_path = DATA / "delivery_material_html.jsonl"
if html_path.exists():
    html = load_jsonl("delivery_material_html.jsonl")
    matched = sum(
        1
        for r in html
        if triple(r) in index_by_key
        and len(r.get("contentHtml") or "") == int(index_by_key[triple(r)]["contentChars"])
    )
    check(
        "contentChars does not match the shipped HTML either",
        matched < len(html) * 0.1,
        f"{matched}/{len(html)} rows match - the figure predates the image externalisation",
    )

print()
print("=" * 72)
print("FINDING 3  The demo course unit is split across two codes. Merge is mandatory.")
print("=" * 72)

crit_by_unit = defaultdict(dict)
for row in criteria:
    number = int(row["criterionNumber"])
    if number < 10000:
        crit_by_unit[row["unitCode"]][number] = row["criterionText"]

a_crit = sorted(crit_by_unit[WHITECARD[0]])
b_crit = sorted(crit_by_unit[WHITECARD[1]])
a_q = sum(1 for q in real_questions if q["unitCode"] == WHITECARD[0])
b_q = sum(1 for q in real_questions if q["unitCode"] == WHITECARD[1])
slides = Counter(r["unitCode"] for r in index if r["type"] == "SLIDE")

print(f"         {WHITECARD[0]:<12} {len(a_crit):>3} criteria  {a_q:>3} questions  {slides[WHITECARD[0]]:>3} slides")
print(f"         {WHITECARD[1]:<12} {len(b_crit):>3} criteria  {b_q:>3} questions  {slides[WHITECARD[1]]:>3} slides")

check(
    "the criteria and the questions sit under opposite spellings",
    len(b_crit) > len(a_crit) and a_q > b_q,
    "criteria are richer under DEMO101; the questions are filed under DEMO101",
)

# Count question -> criterion references that dangle, unmerged vs merged.
have_split = defaultdict(set)
have_merged = defaultdict(set)
for row in criteria:
    number = int(row["criterionNumber"])
    have_split[row["unitCode"]].add(number)
    have_merged[canon(row["unitCode"])].add(number)


def count_dangling(have, key):
    found = dangling = 0
    per_unit = Counter()
    for q in real_questions:
        for token in (q.get("mapping") or "").split(","):
            number = resolve(token)
            if number is None:
                continue
            if number in have[key(q["unitCode"])]:
                found += 1
            else:
                dangling += 1
                per_unit[q["unitCode"]] += 1
    return found, dangling, per_unit


split_found, split_dangling, split_per_unit = count_dangling(have_split, lambda u: u)
merged_found, merged_dangling, _ = count_dangling(have_merged, canon)

print()
print(f"         unmerged: {split_found} references resolve, {split_dangling} dangle  {dict(split_per_unit)}")
print(f"         merged:   {merged_found} references resolve, {merged_dangling} dangle")

check(
    "unmerged, 81 question-to-criterion references point at nothing",
    split_dangling == 81 and set(split_per_unit) == {WHITECARD[0]},
    "all of them are demo course questions",
)
check(
    "merging the two spellings repairs every one of them",
    merged_dangling == 0,
    f"{merged_found}/{merged_found} references resolve after the merge",
)
check(
    "the merge changes nothing for the other seven units",
    all(u in WHITECARD for u in split_per_unit),
    "only the demo course is affected; no other unit gains or loses references",
)

only_b = set(crit_by_unit[WHITECARD[1]]) - set(crit_by_unit[WHITECARD[0]])
cited = Counter()
for q in real_questions:
    if q["unitCode"] != WHITECARD[0]:
        continue
    for token in (q.get("mapping") or "").split(","):
        number = resolve(token)
        if number in only_b:
            cited[number] += 1
if cited:
    print("\n         Criteria cited by DEMO101 questions but only defined under DEMO101:")
    for number, count in sorted(cited.items()):
        print(f"           {number}  cited {count:>2}x  {crit_by_unit[WHITECARD[1]][number][:52]!r}")

print()
print("=" * 72)
print("FINDING 4  The mapping grammar, and the tokens it cannot parse.")
print("=" * 72)

unparsed = Counter()
for q in real_questions:
    for token in (q.get("mapping") or "").split(","):
        token = token.strip()
        if token and resolve(token) is None:
            unparsed[token] += 1

check(
    "a small tail of mapping tokens falls outside the documented grammar",
    0 < sum(unparsed.values()) < 60,
    f"{sum(unparsed.values())} tokens across {len(unparsed)} distinct forms: "
    + ", ".join(sorted(unparsed)),
)

foundation_rows = sorted(
    int(r["criterionNumber"]) for r in criteria
    if r["unitCode"] == WHITECARD[0] and int(r["criterionNumber"]) >= 30000
)
f_tokens = {
    t.strip()
    for q in real_questions
    for t in (q.get("mapping") or "").split(",")
    if re.fullmatch(r"[fF]\d+", t.strip())
}
check(
    "the fN foundation-skill tokens cannot be resolved from the data",
    len(f_tokens) > len(foundation_rows),
    f"{len(f_tokens)} distinct tokens ({', '.join(sorted(f_tokens))}) against "
    f"{len(foundation_rows)} rows numbered {foundation_rows} - not a contiguous run",
)
check(
    "questions missing a mapping entirely",
    sum(1 for q in real_questions if not q.get("mapping")) == 2,
    f"{sum(1 for q in real_questions if not q.get('mapping'))} of {len(real_questions)}",
)

print()
print("=" * 72)
print("FINDING 5  Question types differ from the client README.")
print("=" * 72)

types = Counter(q["questionType"] for q in real_questions)
for name, count in types.most_common():
    print(f"         {name:<24} {count:>4}")
check(
    "no 'Short answer' or 'Image-based' questions exist, despite the README listing them",
    "Short answer" not in types and "Image-based" not in types,
    "every question is machine-checkable or assessor-observed; none are free text",
)
observed = types.get("Observation/practical", 0)
check(
    "a large block of questions are assessor-observed, not written answers",
    observed > 100,
    f"{observed} Observation/practical items - success criteria 4 and 5 behave differently for these",
)

print()
print("=" * 72)
print("FINDING 6  Narration budget and the long tail.")
print("=" * 72)

words = sum(len(r["text"].split()) for r in text)
lengths = sorted(len(r["text"]) for r in text)
longest = max(text, key=lambda r: len(r["text"]))
wc_text = [r for r in text if r["unitCode"] in WHITECARD]
wc_words = sum(len(r["text"].split()) for r in wc_text)

print(f"         readable items          {len(text)}")
print(f"         total words             {words:,}   (~{words / 150 / 60:.1f} h at 150 wpm)")
print(f"         median item             {median(lengths):.0f} chars")
print(f"         longest item            {len(longest['text']):,} chars  "
      f"({longest['unitCode']} seq {longest['sequence']})")
print(f"         items over 8,000 chars  {sum(1 for n in lengths if n > 8000)}")
print()
print(f"         demo course (merged)     {len(wc_text)} items, {wc_words:,} words, ~{wc_words // 150} min")

check(
    "the client README's word count is optimistic",
    abs(words - 176337) > 5000,
    f"README says 176,337; whitespace-split count is {words:,} ({(176337 - words) / 176337:.0%} lower)",
)
check(
    "the long tail needs a chunker, not a naive splitter",
    len(longest["text"]) > 30000,
    f"longest item is {len(longest['text']):,} chars, roughly 48 minutes spoken",
)

if not (DATA.parent / "media").exists():
    print()
    print("         NOTE  media/ is absent (it is in .gitignore). The 453 slide images")
    print("               are not in this repo, so any OCR or vision work is blocked")
    print("               until someone brings the full archive down separately.")

print()
print("=" * 72)
if failures:
    print(f"{len(failures)} check(s) did not match the audit:")
    for name in failures:
        print(f"  - {name}")
    print("\nThe data may have changed since the audit was written. Re-read it before trusting it.")
    sys.exit(1)

print("All checks match docs/planning/DATA_AUDIT.md.")
sys.exit(0)
