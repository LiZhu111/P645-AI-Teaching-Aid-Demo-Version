# Data Audit — what's actually in `data/`

Before anyone writes a loader, read this. Six things in the client's data package
will silently break code written against the obvious assumptions. Four of them are
in the client's own README as *no warning at all*, and one of them is the difference
between success criteria 4 and 5 working or not working.

Everything here is checkable. Run it yourself:

```bash
python scripts/verify_data.py
```

It re-derives every claim below from the raw files and exits non-zero if anything
has changed. If the client ships new data, run it again before trusting this doc.

---

## Provenance — who wrote what in this repo

Worth being clear about, because it decides which documents are authoritative and
which are one teammate's reading. Taken from `git log`, not from guesswork:

| path | author | status |
|---|---|---|
| `data/**` | Training Professionals | **partner data, unmodified since import** |
| `docs/brief/CLIENT_BRIEF.md` | Steve Harding, Training Professionals | **the partner's own words — authoritative** |
| `docs/brief/P645_Project_Details_EN.pdf` | QUT / partner | the original project proposal |
| `README.md` | our team (Li) | a summary of the brief, not a client document |
| `docs/planning/DATA_NOTES.md` | our team (Li) | internal notes |
| `docs/planning/TEAM_START_GUIDE.md` | our team (Li) | internal notes |

**The data is clean.** Every file under `data/` is byte-identical to the initial
import once carriage returns are ignored. Git reports all of them as modified on a
Windows checkout, but that is CRLF line endings, not edits — the 2-byte `.gitkeep`
files show as modified too, which is the giveaway, and `git diff --ignore-cr-at-eol`
comes back empty. Every finding below was re-verified against the files extracted
directly from the first commit.

*(If the constant "modified" noise gets annoying, a `.gitattributes` with
`* text=auto eol=lf` fixes it — but agree it as a team first, since it rewrites line
endings across the whole repo.)*

**Read `CLIENT_BRIEF.md` directly.** Our `README.md` is a fair summary but drops
three things the partner leads with: the foreword about why the project exists
(low-literacy learners who have been taught to stop asking questions), the 453
image-only slides that the partner calls "the problem at the centre of the build",
and the skills/knowledge coverage map in their section 5 — a deliverable they said
outright they would genuinely use.

---

## Background, in one paragraph

An Australian qualification (`CPC10120 Certificate I in Construction`) is made of
**units of competency** — the eight subjects. Each unit breaks into **performance
criteria**, which are the numbered statements of what a learner has to be able to
do: "1.1 Review plans and specifications", "2.3 Apply safe manual handling", and so
on. The teaching content — the pages a student reads — is filed against those
criterion numbers. So is every assessment question. That chain (unit → criterion →
material) is what lets Aita say *"this comes from criterion 1.1"* instead of just
sounding confident, and it is why the joins between these files matter so much.

Three files carry the load:

| file | what it is |
|---|---|
| `delivery_material_text.jsonl` | 630 rows of readable teaching content — the stuff we read aloud |
| `delivery_material_index.csv` | 1,091 rows cataloguing every item, including 453 slides that have no text |
| `assessment_questions.jsonl` | 482 real questions with model answers, plus 175 structural rows |

---

## Finding 1 — The join key is `(unitCode, sequence, type)`, not `(unitCode, sequence)`

**This is the one that will cost someone a day.**

The obvious way to connect the text file to the index is on unit code plus
sequence number. That is wrong, and it fails *silently* — you get rows back, they're
just the wrong rows.

Slides are numbered in their own parallel sequence, starting again at 1. So within a
single unit there is a document item 5 *and* a slide 5, and they are unrelated:

```
CPCWHS1001, sequence 5, type=ELEMENT  ->  "2 - Identify construction hazards and risk control measures"
CPCWHS1001, sequence 5, type=SLIDE    ->  "1.1 Basic roles, responsibilities and rights of duty holders"
```

Same key, completely different content. This happens **128 times across 256 rows**.

Add `type` and the problem disappears entirely: the triple is unique across all
1,091 index rows and all 630 text rows, and every single text row then joins to
exactly one index row.

**What to do:** make `(unitCode, sequence, type)` the composite primary key in the
schema. Never join on unit + sequence alone. Also ignore the `version` column — it
is the string `"unknown"` on all 1,091 rows and carries no information.

---

## Finding 2 — `contentChars` is not the length of the content

There's a `contentChars` column in the index that looks like it tells you how long
an item is. It doesn't, and it isn't close:

- It matches the length of `text` on **0 of 630 rows**.
- It matches the length of the shipped HTML on **49 of 1,091 rows**.
- Median overstatement: **52×**. Worst case: **4,705×**.

The clearest example: an item titled *"End of Section 2"* — sixteen characters of
actual text — is recorded as **75,281** `contentChars`.

The likely explanation is that the figure was computed from the original HTML while
images were still embedded as base64 blobs, before the client rewrote every image
reference to a local `media/` path. It's a stale number, not a lie, but it's useless
either way.

**What to do:** compute `len(text)` yourself. Anyone sizing chunks, estimating
narration time, or picking "short items to start with" from `contentChars` will be
wrong by one to three orders of magnitude. Worth reporting back to Steve — he asked
to hear about data problems.

---

## Finding 3 — The White Card unit is split across two codes, and the merge is not optional

The client README mentions that `CPCCWHS1001` and `CPCWHS1001` are two spellings of
the same unit and says to merge them. It undersells how badly they're split. The two
halves are split in *opposite directions*:

| | criteria | questions | slides | readable items |
|---|---|---|---|---|
| `CPCCWHS1001` | 8 | 105 | 0 | 55 |
| `CPCWHS1001` | 18 | 3 | 93 | 111 |

The **questions** are filed under one spelling. The **criteria those questions
point at** are defined under the other.

So if you load `CPCCWHS1001` on its own — which is exactly what "let's start with the
White Card, it's the simplest unit" leads you to do — then 81 question-to-criterion
references point at criteria that appear not to exist:

```
criterion 103  cited by 22 questions  "Construction safe work practices are identified and explained."
criterion 204  cited by 21 questions  "Measures for controlling hazards are identified."
criterion 202  cited by  9 questions  "Construction hazards are identified and discussed."
criterion 403  cited by  7 questions  "Types and purpose of fire safety equipment are identified..."
    ... 6 more, 81 references in total
```

Merge the two spellings and **all 81 resolve. Zero dangling references.** The other
seven units are completely unaffected — this is a White Card problem only.

We sanity-checked that the merge is semantically right, not just numerically
convenient. A question reading *"It is your responsibility to make sure the toilet
facilities are clean and hygienic"* maps to `1.3`, which under the other spelling is
*"Construction safe work practices are identified and explained."* That fits.

**What to do:** the schema needs a canonical unit with both codes as aliases — not a
find-and-replace on import. Two reasons: we lose the ability to explain the
discrepancy in the report if we erase it, and Steve explicitly wants data problems
reported rather than quietly patched.

**Why this matters more than it looks:** success criteria 4 and 5 — explain why a
human marked an answer right or wrong — run entirely on the question→criterion
mapping. Unmerged, those two criteria are broken for 81 of the White Card's
references, and they'd break in a way that looks like our code is buggy rather than
the data being split.

---

## Finding 4 — How the `mapping` field works, and where it runs out

Every assessment question carries a `mapping` string like `"1.1, k2"`. It's the field
that connects a question to what it was testing, and it's what success criteria 4
and 5 run on. The grammar:

| token | means | formula |
|---|---|---|
| `1.1` | performance criterion — element 1, criterion 1 | `E.C` → `E×100 + C`, so `1.1` → `101` |
| `k2` | knowledge item 2 | `kN` → `10099 + N`, so `k2` → `10101` |
| `s1` | skills / performance evidence 1 | `sN` → `9999 + N`, so `s1` → `10000` |

Those three cover **1,297 of the 1,326 tokens**, and after the Finding 3 merge every
one of them resolves to a real row in `performance_criteria.csv`.

The remaining **29 tokens across 16 forms don't parse**, and we couldn't work them
out from the data:

- `f1`–`f7` (7 uses) — foundation skills. The rows exist but are numbered `30100,
  30101, 30300, 30301, 30302, 30400`, which isn't a contiguous run, and there are
  **7 distinct tokens for 6 rows**. No offset recovers this.
- `2`, `3` (14 uses) — bare numbers with no element/criterion separator.
- `c1`, `c2`, `C101`–`C103` (5 uses), `1.1b`, `1.1c` (3 uses) — unknown forms.

Two questions have no `mapping` at all.

**What to do:** parse the three known forms, and log-and-skip anything else rather
than crashing or guessing. Put the unparsed list in front of Steve — 29 tokens out
of 1,326 is a 2% gap and it's a legitimate finding to report, not something we should
invent an answer for.

---

## Finding 5 — The question types aren't what the README says

The client README lists *Short answer* and *Image-based* question types. Neither
exists in the data. What's actually there:

| type | count | |
|---|---|---|
| True/False | 218 | machine-checkable |
| Multiple choice | 150 | machine-checkable |
| Observation/practical | 107 | **assessor watches the student do it** |
| Correct order | 7 | machine-checkable |

**Why it matters:** 107 questions — 22% — aren't written answers at all. An assessor
watches a student perform a task on site and marks it. "Explain why this was marked
incorrect" means something different for *"demonstrate safe manual handling"* than
for a true/false question, and the explanation has no student text to work from —
only the criterion and the material.

**What to do:** pick our demo cases for success criteria 4 and 5 from the 375
machine-checkable questions. Handle observation/practical as a separate, more
cautious flow, or scope it out explicitly and say so.

---

## Finding 6 — Narration budget and the long tail

| | |
|---|---|
| readable items | 630 |
| total words | 155,614 (~17.3 hours at 150 wpm) |
| median item | 695 chars, roughly 45 seconds spoken |
| longest item | **39,485 chars — about 48 minutes** (`CPCCCM2005`, sequence 3) |
| items over 8,000 chars | 26 |
| **White Card, merged** | **166 items, 38,986 words, ~4h 20m** |

The client README says 176,337 words; a whitespace count gives 155,614, about 12%
lower. Not important, but don't quote their figure as ours.

The median item is already a sensible spoken chunk. The tail is not — test the
chunker against the 39,485-character item, not the median, and remember that *where*
you split changes whether the narration sounds like a person or a machine.

**Also:** `media/` is in `.gitignore` and isn't in this repo. The 453 slide images
are not here. Any OCR or vision work on slides is blocked until someone brings the
full 397 MB archive down separately — worth knowing before anyone plans that work.

---

## What this changes in `docs/planning/DATA_NOTES.md`

The existing notes are right in spirit but under-specify two things that matter:

- "Treat `CPCCWHS1001` and `CPCWHS1001` together" — true, but it reads like tidiness.
  It's load-bearing for success criteria 4 and 5. See Finding 3.
- The listed row fields imply `unitCode` + `sequence` identifies an item. It doesn't.
  See Finding 1.

---

## Questions for Steve

1. The 29 unparseable `mapping` tokens — particularly `f1`–`f7`, and the bare `2`/`3`.
2. `contentChars` in the index looks like it predates the image-path rewrite. Is
   there a corrected figure, or should we just compute our own?
3. The White Card's criteria and questions are split across the two spellings. Is
   that expected from the national register change, or did something go wrong in the
   export?
4. The README lists *Short answer* and *Image-based* question types that aren't in
   the data. Was a portion of the question bank held back?
