# Integration 

## Integrated reading path (2026-10-19)

The integration branch now connects the Next.js frontend to SQLite through the
Python MCP server. See `src/frontend/README.md` for setup and validation commands.
`aita.sqlite_corpus` reads a database snapshot and supplies the existing BM25,
speech segmentation and grounding logic. It preserves MCP material IDs and exposes
an explicit `database_id` mapping; the browser keeps its existing local progress.
Source links open exact materials. Database progress and real assessment-attempt
authorisation are not connected in this phase. The historical design notes below
remain relevant to future persistence integration.

## Status and evidence (original database delivery)

Implemented and tested against the supplied `main` repository snapshot: source import, SQLite schema, stable material/question IDs, White Card alias grouping, Python data-access methods, learner progress storage and human-marked attempt fields. The supplied archive has no `src/backend` or `src/frontend` implementation. Compatibility with Ryan's actual MCP signatures, Li's saved local progress, and a deployed API remains unverified.

No external network services, AI models or accounts are required to run the database tests.

## Material identity

A source material is identified by this ordered tuple:

```text
(source unitCode, integer sequence, type, integer pcNumber or null, integer pcVariant)
```

`material_id` is `mat_` followed by the complete SHA-256 digest of this tuple serialised as UTF-8 JSON using Python `json.dumps(values, ensure_ascii=False, sort_keys=True)`. This includes Python's default separators with spaces. Use `material_key()` and `stable_id()` from the importer as the reference implementation. Prefer passing the generated ID unchanged between services instead of regenerating it in another language.

IDs are stable across reimport and input row ordering while these source identity fields remain unchanged. Changes to an identity field create a different ID. Title and text edits preserve identity. A migration is required if source identity changes after progress exists.

Do not use sequence by itself, or `(unitCode, sequence)` by itself. Different material types share sequence numbers. Do not normalise the source unit code before generating an ID: both White Card variants can have the same sequence and type.

`unit_alias` groups `CPCWHS1001` into logical unit `CPCCWHS1001` for material listing, search and enrolment. The source tables preserve both records, including their separate criterion text. This avoids silently overwriting different syllabus releases. The alias grouping supports study access; it is not a claim that the historical qualification releases are equivalent for certification. Selecting a regulatory version remains a team/client decision.

The catalogue merges index, HTML and text by the complete tuple. All 1,091 HTML records match the index. Only 630 have supplied plain text. Read-aloud and text retrieval use `readable_material`. Image-only slides remain in the catalogue without fabricated text or OCR.

## Question and criterion identity

A question ID uses `q_` and a hash of `(source unitCode, assessmentNumber, section, questionNum)`. All 657 records are retained, including 175 structural rows. `learner_question` and `list_questions()` return only the 482 actual questions with no model-answer column.

Question options remain ordered JSON. Original mappings and evidence remain in their original columns and in `source_record`.

Dotted tokens such as `1.1` resolve to criterion number `101`, using element × 100 + item. A source-unit match takes priority. If it is missing, a match in the other White Card source code can resolve the relationship. This resolves 81 question references across the alias boundary without deleting either source unit.

`material_criterion_map` applies the same exact-first/alias-fallback policy to material `pc_number` links. Some records, especially slides, have no `pc_number`; they remain unit-level material. Another 18 White Card items use heading numbers 500, 600, 700, 800 or 900 that have no matching criterion in either code. These records remain intact and appear in `unresolved_material_criterion`. They are not forced onto an unrelated syllabus criterion.

The importer retains 700 `k`/`s` mapping references without assigning criterion numbers. The brief explains the meaning of knowledge/performance evidence but does not provide an unambiguous mapping rule for every shorthand token and nested evidence numbering. Confirm this rule with Ryan or the client before extending the resolver. Another 24 irregular references, including `1.1b`, `c1` and `f1`, also remain unresolved. `question_criterion_map.reference` preserves every nonblank token for audit. Null targets mean unresolved, not irrelevant. The count of mappings is a count of question-reference pairs, not distinct shorthand codes.

## Progress contract

Call `enrol(student_id, unit_code)` first. The adapter stores enrolments under the normal unit. Each progress row is uniquely identified by `(enrolment_id, material_id)`.

| Field | Meaning |
|---|---|
| `student_id` | Opaque learner identifier supplied by the authenticated backend |
| `material_id` | Stable source ID returned by the content methods |
| `last_position` | Nonnegative integer, interpreted with `position_kind` |
| `position_kind` | `text_character` or `audio_millisecond` |
| `completed` | Explicit boolean for finished study content, never competency |
| `updated_at` | Database-generated UTC timestamp |

For `text_character`, offsets use Python Unicode code points. JavaScript string indexing uses UTF-16 code units, so convert offsets for text containing characters outside the BMP, or agree a different shared convention before integration. A narration offset must not be treated as audio time without an explicit conversion. Character offsets can become inaccurate if course text changes.

The adapter validates text length, enrolled unit and material identity. Database triggers reject inserting or updating progress for an unrelated unit. Backend code should not directly alter source unit identities or enrolment unit codes after progress exists. Use the adapter's standard enrolment methods.



## Proposed connection to the MCP layer

These are data-access capabilities, not verified replacements for Ryan's tools:

| Backend capability | Database adapter |
|---|---|
| Unit selection | `list_units()` |
| Unit outline/material catalogue | `list_materials(unit_code)` |
| Fetch material | `get_material(material_id)` |
| Basic material lookup | `search_material(unit_code, query)` |
| Persist progress | `enrol()`, `save_progress()`, `get_progress()` |
| Explain a concept | Ryan's existing generation and grounding logic, using retrieved course text |
| Explain marked feedback | Backend-authorised access to `marked_feedback_context(student_id, attempt_id)` |

The adapter uses `sqlite3` from Python's standard library. If Ryan's backend is Node.js, implement equivalent SQL access in that backend or expose the Python methods through an authenticated internal service. Do not run a separate Python process per request as a production integration strategy. No HTTP server is included because the real backend contracts are absent.

## Human marking and data access

`assessment_attempt` requires a human marking status (`correct` or `incorrect`), an assessor ID and marking time. Structural rows cannot receive attempts. The database does not grade answers.

`marked_feedback_context()` requires an existing marked attempt belonging to the supplied learner. It returns the model answer only for internal explanation generation. The backend must verify that the assessor is real and authorised when creating the attempt, and that the caller may access the learner. Database constraints cannot prove who a person is. There is deliberately no public mark-submission route in this package.

Keep raw question banks, `source_record`, model answers and the `.db` file server-side. Views and adapter projections reduce accidental exposure; they do not provide SQLite user permissions. Do not use `SELECT *` on protected source tables when constructing frontend responses. Do not expose progress or chat records to assessors without the client's agreed privacy rules.

## Data preservation and future tables

All source fields, including original date strings, qualification packaging rules and extra question fields, remain available in `source_record.payload_json`. Frequently used fields also have typed normalised columns. A missing normalised column is not a loss of the original field.

`foundation_framework` is an addition to the draft ERD so the eighth reference file has a queryable table. Chat session, message and source-citation tables implement the proposed relationships but have no chat service or retention workflow in this package.

The schema uses SQLite `TEXT` identifiers instead of draft numeric IDs to support stable deterministic material keys. Qualification membership derives from each unit's `isCoreOf`; it is not a complete representation of every elective in the qualification description. All course files are imported for review, while the UI can filter to White Card for the MVP.

## Decisions needed before merging

- Confirm SQLite as the local MVP store, or adapt schema/imports to the team's agreed database.
- Confirm the generated material IDs and create an explicit mapping from any IDs already used by Ryan/Li. Sequence-only progress cannot be migrated safely without disambiguation.
- Confirm which White Card source versions should appear and how to label duplicate/overlapping content.
- Resolve evidence shorthand and irregular assessment references with the existing backend conventions.
- Agree learner authentication, assessor authorisation, progress semantics and any HTTP/API payloads.
- Run the connected learner workflow, cross-user access tests and safe-feedback tests in the actual integration branch.
