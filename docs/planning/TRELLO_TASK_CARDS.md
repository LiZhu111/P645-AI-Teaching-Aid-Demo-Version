# Trello Task Cards and Delivery Standards

This document converts the approved user stories and the two-step delivery plan into Trello-ready cards. Card titles, descriptions, checklists, and delivery standards are written in English so they can be copied directly into the team board.

## Current Baseline

The latest `develop` branch contains the modular React/Next.js frontend MVP with mock data, browser speech input/output, authentication mock flows, responsive navigation, profile progress display, and frontend tests.

The MCP/backend and data-audit work is currently on `feature/mcp-server-and-data-audit` and is not yet merged into `develop`. That branch contains a Python MCP prototype with six tools, corpus loading, BM25 retrieval, guardrails, prompts, data-audit notes, and backend tests.

## Board Lists

Use these lists in Trello:

1. Backlog
2. Ready
3. In Progress
4. In Review
5. Blocked / Client Question
6. Done

## Card Format

Every card should contain:

- Card ID and title
- Phase: `Phase 1 MVP` or `Phase 2 GAR / Database`
- Sprint: `Week 1` to `Week 6`, or `Post-MVP`
- Priority: `Must Have`, `Should Have`, or `Future Work`
- Owner role
- Dependencies
- Related user story or requirement ID
- Scope and implementation notes
- Checklist
- Acceptance and delivery standard
- Evidence links or attached test results
- Status: `Backlog`, `Ready`, `In Progress`, `In Review`, `Blocked`, or `Done`
- Known limitations and open questions

# Phase 1 — MVP Completion

The goal of Phase 1 is a demonstrable MVP that satisfies all Must Have user stories using the supplied course data and a clearly labelled prototype integration.

## Current Phase 1 Status

This status review is based on the current `develop` baseline and the separate `feature/mcp-server-and-data-audit` branch. The frontend test suite currently passes 15 tests, and the frontend lint and production build checks pass. The frontend still uses `mock-aita-data.js`, while the MCP/data-audit implementation has not yet been merged into `develop`.

No Phase 1 card should be marked `Done` until its delivery standard and evidence requirement are satisfied.

### Ready

These cards can be started immediately using the current repository evidence:

- `PM-01` — Confirm MVP scope and acceptance matrix.
- `PM-03` — Prepare the final MVP demo script.
- `UX-01` — Produce the MVP user flow and wireframes.
- `UX-02` — Document low-literacy and voice-first content rules.
- `FE-05` — Frontend baseline verification completed on 2026-09-25; see the In Progress entry for remaining integration checks.
- `DATA-02` — Implement chunking and retrieval evaluation.
- `QA-01` — Build the MVP acceptance test matrix.

### In Progress

These cards have partial implementation or branch evidence, but their delivery standards are not yet met:

- `PM-02` — The MCP/data-audit branch exists, but the integration sequence and merge into `develop` are not complete.
- `FE-01` — The frontend still reads from mock data; the service boundary must be implemented.
- `FE-02` — Local progress storage exists, but resumable-position behaviour and learner-scoped tests are incomplete.
- `FE-03` — Text and browser voice question flows use local retrieval; MCP-backed grounded answers and complete service states are incomplete.
- `FE-04` — The assessment explanation UI uses mock feedback; the `explain_marked_answer` integration and evidence cases are incomplete.
- `FE-05` — Frontend-only responsive checks passed at 320px, 768px and 1280px (29 checks). A Profile overflow defect was fixed. Final verification still depends on FE-01, FE-03 and FE-04. [Evidence](../evidence/FE-05/README.md).
- `DATA-01` — The canonical loader and audit scripts exist on the MCP/data-audit branch, but validation evidence and integration into the delivery branch are incomplete.
- `AI-01` — The six-tool MCP prototype and backend tests exist on a separate branch, but the surface is not merged and verified from the frontend integration path.
- `AI-02` — Guardrail implementation and tests exist in prototype form, but the integrated MVP evidence is incomplete.
- `AI-03` — A context-only prototype mode exists, but the configuration path and final provider or approved demo-mode decision are incomplete.

### Blocked / Client Question

These cards require an external decision, stable integration, or final MVP evidence before completion:

- `UX-03` — Requires an approved decision about slide-only content and OCR/vision scope.
- `DATA-03` — Requires Steve's decision on the 29 unparseable mapping tokens and related data-audit exceptions.
- `QA-02` — Depends on the integrated material, answer, and assessment flows before the clean-browser journey can be accepted.
- `QA-03` — Depends on the completed integration, backend test setup, and release evidence.

### Recommended Completion Order

1. Complete `PM-01`, `UX-01`, `UX-02`, and `QA-01` so the acceptance evidence is defined.
2. Review and merge the MCP/data-audit branch through `PM-02` and `AI-01`.
3. Complete `DATA-01`, `FE-01`, `FE-03`, and `FE-04` against the agreed tool contracts.
4. Record retrieval results in `DATA-02` and close the open data decisions in `DATA-03`.
5. Finish `FE-02`, `FE-05`, `AI-02`, and `AI-03`, including responsive and failure-state evidence.
6. Run `QA-02` and `QA-03`, then complete `PM-03` and apply the MVP Gate.

## User Story Acceptance Cards

These are the primary Phase 1 Trello cards for acceptance tracking. Create one Trello card for each user story below. The existing `PM`, `UX`, `FE`, `DATA`, `AI`, and `QA` cards are implementation sub-tasks linked to these acceptance cards.

`FW-01` to `FW-03` are future work and must not be included in the Phase 1 MVP acceptance board.

### US-01 — Select a course unit

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-01`, `DATA-01`, `QA-01`, `QA-02`

**Acceptance standard:** The learner can view available units and select the White Card unit using the canonical `CPCCWHS1001 / CPCWHS1001` representation.

**Evidence required:** A clean-browser test, screenshot or recording, and a data record showing the selected unit.

### US-02 — View learning material in order

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-01`, `DATA-01`, `QA-01`, `QA-02`

**Acceptance standard:** Material is displayed for the selected unit, sorted by `sequence`, and each item has a visible title.

**Evidence required:** Ordered material test with source IDs and a UI screenshot or recording.

### US-03 — Play course material aloud

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-01`, `FE-05`, `QA-01`, `QA-02`

**Acceptance standard:** The learner can read the selected material aloud and stop playback using the consistent `Read` / `Stop` control.

**Evidence required:** Browser speech test, visible control-state evidence, and unsupported-browser fallback evidence.

### US-04 — Ask a question about the material

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-03`, `AI-01`, `QA-01`, `QA-02`

**Acceptance standard:** The learner can submit a question by text or transcribed voice input and see an answer-state response.

**Evidence required:** Submitted question, thinking state, answer state, and error-state test evidence.

### US-05 — Receive an answer grounded in course material

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-03`, `DATA-01`, `DATA-02`, `AI-01`, `AI-02`

**Acceptance standard:** The system retrieves relevant course material and displays an explanation with source context or references.

**Evidence required:** Retrieval evaluation cases with expected source IDs, returned sources, grounding decision, and answer output.

### US-06 — Receive a clear fallback when no answer is supported

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-03`, `AI-02`, `QA-01`, `QA-02`

**Acceptance standard:** Unsupported questions produce a clear fallback and do not receive an invented factual answer.

**Evidence required:** Unsupported-question test, displayed fallback, refusal metadata, and speech-output behaviour.

### US-07 — Receive simple explanations

**Priority:** Should Have
**Current status:** In Progress
**Related implementation cards:** `UX-02`, `AI-02`, `AI-03`, `QA-01`

**Acceptance standard:** Explanations use plain language, avoid unnecessary jargon, and are short enough for voice playback.

**Evidence required:** Before-and-after response examples, tone/length checks, and voice playback evidence.

### US-08 — Ask questions by voice

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-03`, `FE-05`, `AI-01`, `QA-02`

**Acceptance standard:** The learner can activate the consistent `Speak` / `Stop` control, see the listening state, receive a transcript, and submit that transcript as a question.

**Evidence required:** Voice input recording or screenshot sequence covering idle, listening, transcript, submitted, unsupported, and browser-error states.

### US-09 — Continue from the previous learning position

**Priority:** Should Have
**Current status:** In Progress
**Related implementation cards:** `FE-02`, `QA-01`, `QA-02`

**Acceptance standard:** The selected unit and material position are saved and restored after refresh or reopening the app; progress is not exposed to assessment tools.

**Evidence required:** Refresh/reopen test, stored position evidence, and a test proving the position is learner-scoped.

### US-10 — Explain why a human-marked answer was correct

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-04`, `AI-01`, `AI-02`, `QA-02`

**Acceptance standard:** Given a human-provided correct status, Aita explains the related concept using delivery material and assessment mapping without creating the mark.

**Evidence required:** Correct-feedback demo case with assessor status, source material, explanation, and no competency decision by Aita.

### US-11 — Explain why a human-marked answer was incorrect

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-04`, `AI-01`, `AI-02`, `QA-02`

**Acceptance standard:** Given a human-provided incorrect status, Aita identifies related learning material and provides supplementary explanation without deciding competency.

**Evidence required:** Incorrect-feedback demo case with assessor status, related sources, explanation, and assessment-boundary evidence.

### US-12 — Protect model answers

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `FE-04`, `AI-02`, `QA-01`, `QA-02`

**Acceptance standard:** Model answers are not browseable through the learning interface; explanations occur only through the controlled human-marked feedback flow.

**Evidence required:** Negative access test, answer-key isolation test, and screenshots showing the controlled feedback entry point.

### US-13 — Maintain clear project documentation

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `PM-01`, `PM-02`, `UX-01`, `UX-02`, `UX-03`, `QA-03`

**Acceptance standard:** README and planning documents explain project goal, scope, data, architecture, user stories, limitations, development plan, and current integration decisions.

**Evidence required:** Reviewed README, user-story mapping, architecture or flow evidence, limitation record, and linked test results.

### US-14 — Use a clean shared data-loading structure

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `DATA-01`, `FE-01`, `DATA-02`, `QA-01`

**Acceptance standard:** The loader exposes unit, sequence, title, text, criterion, source metadata, aliases, and validation results in a format shared by frontend and AI flows.

**Evidence required:** Loader self-test, validation report, rejected-row and unresolved-join report, and frontend contract test.

### US-15 — Use clear MCP-first tool definitions

**Priority:** Must Have
**Current status:** In Progress
**Related implementation cards:** `PM-02`, `AI-01`, `AI-02`, `AI-03`

**Acceptance standard:** Fetch, search, explain, and marked-feedback tools have documented inputs and outputs; any API fallback is explicitly labelled; the basic flow is independently testable.

**Evidence required:** MCP self-test, tool contract document, backend tests, and frontend integration test without importing backend internals.

### US-16 — Use a repeatable demo script

**Priority:** Should Have
**Current status:** Ready
**Related implementation cards:** `PM-03`, `QA-02`, `UX-03`

**Acceptance standard:** The demo names the selected unit, material section, example question, expected grounded answer, assessment boundary, and known limitations.

**Evidence required:** Five-to-eight-minute script, test data references, expected outputs, and final run-through record.

## Project Manager / Product Owner

### PM-01 — Confirm MVP scope and acceptance matrix

**Related requirements:** US-01 to US-12, R-MCP-1 to R-MCP-5

**Description:** Confirm that the first release supports the White Card unit, learning material, read-aloud, text and voice questions, grounded answers, human-marked feedback explanation, progress resume, and no-marking boundaries.

**Checklist:**

- Map every Must Have user story to a demo step.
- Record the owner and dependency for every story.
- Confirm that Aita never marks answers or decides competency.
- Confirm the treatment of unreadable slide-only content.
- Confirm whether observation/practical assessment feedback is in MVP scope.
- Record unanswered questions for Steve and the tutor.

**Delivery standard:** A reviewed acceptance matrix exists, every Must Have story has an owner, and no Must Have story is left without a test or documented scope decision.

### PM-02 — Integrate the MCP/data-audit branch into the delivery plan

**Related requirements:** R-MCP-1, R-MCP-2, US-05, US-10, US-11

**Description:** Review `feature/mcp-server-and-data-audit`, identify conflicts with the frontend MVP, and create the integration sequence into `develop`.

**Checklist:**

- Review the six MCP tools and their contracts.
- Confirm Python MCP prototype setup instructions.
- Identify frontend mock functions to replace.
- Create a merge or integration PR into `develop`.
- Record any dependency or environment blockers.

**Delivery standard:** The team can run the MCP self-test and the frontend integration plan identifies the exact replacement boundary for mock retrieval and answers.

### PM-03 — Prepare the final MVP demo script

**Related requirements:** US-01 to US-12, US-16

**Description:** Write a repeatable demo covering material selection, read-aloud, voice question, grounded answer, unsupported question, and correct/incorrect human-marked feedback.

**Delivery standard:** A five-to-eight-minute script names the test data, expected outputs, source references, safety boundary, and known limitations.

## UX / Documentation Lead

### UX-01 — Produce the MVP user flow and wireframes

**Related requirements:** US-01, US-02, US-03, US-04, US-08, US-10, US-11

**Description:** Document the navigation flow from Home to Learn, Ask Aita, Assessment, and Profile, including text and voice interaction states.

**Checklist:**

- Show logged-out and logged-in states.
- Show mobile navigation and narrow-screen layout.
- Show `Speak / Stop` and `Read / Stop` state changes.
- Show listening, thinking, answer, unsupported, and error states.
- Show source reference placement.

**Delivery standard:** Wireframes or a storyboard cover every MVP route and show what the learner sees before, during, and after each core action.

### UX-02 — Document low-literacy and voice-first content rules

**Related requirements:** US-07, US-08, R-CON-3, R-CON-5

**Description:** Define plain-language, short-response, respectful, and audio-friendly response rules.

**Delivery standard:** The document includes examples of a grounded answer, an unsupported answer, a clarification request, and an assessment boundary response.

### UX-03 — Document the slide/OCR scope decision

**Related requirements:** README data challenge, US-02, US-03

**Description:** Decide whether slide-only content is out of scope for the MVP, covered by OCR/vision sampling, or handled through a documented fallback.

**Delivery standard:** The decision is approved by the team and recorded with the affected item count, learner impact, workaround, and future-work recommendation.

## Frontend / Voice Developer

### FE-01 — Replace frontend mock data with MCP material calls

**Related requirements:** US-01, US-02, US-03, R-MCP-1

**Description:** Replace `mock-aita-data.js` material reads with MCP or the explicitly labelled prototype API boundary.

**Checklist:**

- Fetch available units.
- Fetch the selected unit outline in sequence order.
- Fetch material by item ID or sequence.
- Preserve speech segments and next/previous metadata.
- Show loading, empty, and service-error states.

**Delivery standard:** The Learn page displays real records from the agreed service and no longer depends on hardcoded course material for the main flow.

### FE-02 — Implement resumable material progress

**Related requirements:** US-09, R-CON-6

**Phase:** Phase 1 MVP
**Sprint:** Week 5
**Priority:** Should Have
**Owner:** Frontend / Voice Developer
**Dependencies:** FE-01

**Description:** Store the learner's selected unit, item, and speech segment position using local storage for MVP, without exposing progress to assessors.

**Progress (2026-09-25):** Learner-and-unit-scoped local progress now stores the selected material and speech paragraph segment. Read resumes from the saved paragraph and exposes the saved position in the reader. Tests cover new learners, account isolation, duplicate visits, reload and segment persistence. Full completion remains dependent on the agreed FE-01 data contract.

**Delivery standard:** Refreshing or reopening the app returns the learner to the last saved position, and tests confirm progress is learner-scoped and not sent to assessment tools.

### FE-03 — Connect text and voice questions to grounded answers

**Related requirements:** US-04, US-05, US-06, US-08

**Description:** Send typed or transcribed questions to `explain_concept` and display answer, grounding status, source references, and fallback messages.

**Frontend progress (2026-09-25):** The Ask Aita panel now submits typed questions through a labelled `Ask Aita` form button, prevents browser navigation, and preserves the existing thinking, empty-question and safe-fallback states. Real `explain_concept` service integration remains outstanding.

**Checklist:**

- Preserve the transcript as the submitted question.
- Show an explicit thinking state.
- Render grounded sources.
- Render unsupported and refused-assessment responses.
- Handle timeout, network, no-model, and malformed-response states.
- Keep answer speech output separate from question speech input.

**Speech-control progress (2026-09-25):** Shared Read/Speak arbitration, navigation/content cleanup and stale-callback protection implemented. 23 unit tests and 10 simulated-speech browser checks passed. [Interaction rules and evidence](../evidence/speech/README.md). Real-device audio verification and service integration remain outstanding.

**Delivery standard:** A learner can ask a spoken question and receive a grounded answer or a safe fallback; every answer state is covered by a UI test or an evidence record.

### FE-04 — Connect human-marked assessment feedback

**Related requirements:** US-10, US-11, US-12

**Description:** Connect the Assessment page to `explain_marked_answer` using an assessor-provided result. Aita must explain feedback and must not create the mark.

**Frontend progress (2026-09-25):** The assessment UI now separates the assessor decision, Aita explanation, source reference and no-marking boundary. Correct and Incorrect demo cases have distinct explanations and are covered by a browser regression check. Real `explain_marked_answer` integration remains outstanding.

**Delivery standard:** Correct and incorrect demo cases show different explanations, source material, the assessor decision, and no browseable model-answer key.

### FE-05 — Browser and mobile responsive verification

**Related requirements:** US-01 to US-08, FW-03

**Phase:** Phase 1 MVP
**Sprint:** Week 6
**Priority:** Should Have
**Owner:** Frontend / Voice Developer + QA / Tester
**Dependencies:** FE-01, FE-03, FE-04

**Description:** Verify desktop, tablet, and narrow mobile layouts for navigation, voice buttons, text areas, answer panels, source references, and profile content.

**Delivery standard:** Screenshots or test evidence exist for at least 320px, 768px, and 1280px widths; no horizontal overflow or overlapping controls is present.

**Progress (2026-09-25):** Frontend baseline complete: 29 Edge viewport checks passed and long-email Profile overflow was fixed. [Report and screenshots](../evidence/FE-05/README.md). Status: In Progress until integration dependencies and final verification are complete.

## Data / RAG Developer

### DATA-01 — Build the canonical course-data loader

**Related requirements:** US-01, US-02, US-05, R-MCP-2

**Description:** Load and normalise units, material index, readable text, criteria, and assessment mappings from the supplied files.

**Checklist:**

- Use `(unitCode, sequence, type)` as the material join key.
- Merge `CPCCWHS1001` and `CPCWHS1001` under a canonical unit with source aliases.
- Compute text length from actual text rather than `contentChars`.
- Filter structural assessment rows for question retrieval.
- Preserve source metadata and original identifiers.

**Delivery standard:** Import validation reports row counts, rejected rows, duplicate keys, unresolved joins, aliases, and mapping coverage. The White Card merge resolves all known 81 split references.

### DATA-02 — Implement chunking and retrieval evaluation

**Related requirements:** US-05, US-06, US-08, SP-16, SP-17, SP-24

**Description:** Chunk long readable content and evaluate BM25 retrieval using spoken-style questions.

**Delivery standard:** At least 10–15 questions are stored with expected source IDs, returned hits, grounding decision, and pass/fail result. Long-item tests include the 39,485-character case.

### DATA-03 — Resolve data-audit exceptions with Steve

**Related requirements:** DATA_AUDIT findings, US-05, US-10, US-11

**Description:** Obtain decisions for the 29 unparseable mapping tokens, content length discrepancy, missing text/image-only items, and assessment question-type mismatch.

**Delivery standard:** Each exception has an owner decision, evidence, implementation treatment, and report wording. No unknown mapping is silently guessed.

## MCP / AI Developer

### AI-01 — Merge and verify the six-tool MCP surface

**Related requirements:** US-01 to US-06, US-10, US-11, US-15, R-MCP-1, R-MCP-3

**Description:** Bring the MCP prototype into the integration branch and verify `list_units`, `get_unit_outline`, `get_material`, `search_material`, `explain_concept`, and `explain_marked_answer`.

**Delivery standard:** MCP self-test passes, the tool surface is documented, and the frontend can call the agreed tool contract without importing backend internals.

### AI-02 — Complete grounding, abstention, and answer-key guardrails

**Related requirements:** US-05, US-06, US-10, US-11, US-12, R-CON-1 to R-CON-5

**Description:** Verify retrieval thresholds, unsupported fallback, assessment deflection, tone checks, and human-marked answer-key gating.

**Delivery standard:** Automated tests prove that unsupported questions abstain, Aita cannot mark competency, incorrect feedback does not expose the model answer, and all responses carry source or refusal metadata.

### AI-03 — Connect a model provider or document context-only mode

**Related requirements:** US-05, US-07, R-MCP-4

**Description:** Connect the agreed model endpoint or keep the NullProvider as a clearly labelled demo mode.

**Delivery standard:** The system has a documented configuration path, timeout/error handling, prompt/source logging suitable for development, and no credentials committed to Git.

## QA / Tester

### QA-01 — Build the MVP acceptance test matrix

**Related requirements:** US-01 to US-12

**Description:** Turn the user-story acceptance criteria into manual and automated test cases.

**Delivery standard:** Every Must Have story has a test ID, setup data, steps, expected result, actual result, and evidence link.

### QA-02 — Test the full learner journey

**Related requirements:** SP-25, US-01 to US-12

**Description:** Test unit selection, ordered content, read-aloud, voice question, grounded answer, unsupported answer, correct feedback, incorrect feedback, progress resume, login, logout, and responsive navigation.

**Delivery standard:** The main demo flow passes from a clean browser session on Chrome or Edge, and all known failures are recorded rather than hidden.

### QA-03 — Regression and release gate

**Related requirements:** Git workflow, final delivery

**Description:** Run the frontend lint/test/build checks and backend test/self-test checks before merging to `develop`.

**Delivery standard:** `npm run lint`, `npm test`, `npm run build`, and `python -m pytest tests/ -v` pass, or exceptions are approved and documented.

# Phase 2 — GAR / Database and Production Data Foundation

Phase 2 should start after the Phase 1 MVP acceptance gate. The current README specifies a MySQL, multi-tenant partner platform and an MCP integration boundary, but it does not define the term “GAR” or a final GAR schema.

**Phase 2 entry rule:** `DB-01 — Confirm the GAR definition and database scope` is the first Phase 2 card and the prerequisite for every other GAR/database card. `DB-02` through `DB-13` must remain `Blocked` or `Backlog` until `DB-01` is marked `Done`. No production GAR schema, database integration, progress persistence, reporting integration, or tenant implementation should be started before that decision is approved.

This dependency does not block Phase 1. The team can continue the MVP using local files, mock data, the MCP prototype, and learner-owned local progress while GAR scope is being clarified.

## Project Manager / Product Owner

### DB-01 — Confirm the GAR definition and database scope

**Related requirements:** README database section, CLIENT_BRIEF database section, US-13, US-15

**Phase:** Phase 2 GAR / Database
**Priority:** Must Have
**Owner:** Project Manager / Product Owner
**Dependencies:** Phase 1 MVP Gate complete; Steve and tutor available for clarification
**Initial status:** Ready

**Description:** Confirm whether GAR means a specific data store, governance/reporting layer, or another partner term, and agree which data belongs in the Aita database versus the existing Student Management platform.

**Delivery standard:** Steve/tutor approval is recorded with a glossary definition, system boundary, ownership, privacy rules, and an agreed Phase 2 backlog.

**Blocks:** DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09, DB-10, DB-11, DB-12, and DB-13.

### DB-02 — Approve production data ownership and privacy boundaries

**Related requirements:** R-CON-6, multi-tenant client brief

**Delivery standard:** The team has a signed-off data ownership matrix covering learner profile, progress, assessment decisions, course content, model answers, audit logs, and assessor access.

## Data / Database Developer

### DB-03 — Design the canonical relational schema

**Description:** Design the MySQL-compatible schema for tenants, units, materials, chunks, criteria, mappings, assessment questions, media references, learners, and learner progress.

**Delivery standard:** ERD and SQL DDL include primary keys, foreign keys, indexes, timestamps, tenant boundaries, source identifiers, and the composite material key `(unit_code, sequence, type)`.

### DB-04 — Build the repeatable import and validation pipeline

**Description:** Import the supplied CSV/JSONL data into the approved schema with idempotent loading and audit output.

**Delivery standard:** A clean database can be rebuilt from source files; import runs are repeatable; validation reports counts, duplicates, missing joins, mapping exceptions, and rejected records.

### DB-05 — Implement criterion and assessment many-to-many mappings

**Related requirements:** US-05, US-10, US-11

**Delivery standard:** Every supported mapping is queryable from question to criterion to teaching material, unresolved mappings are logged, and model answers are inaccessible through public material search.

### DB-06 — Add retrieval index storage and upgrade path

**Description:** Store lexical chunks and prepare the schema/API boundary for vector embeddings or pgvector/Chroma if approved.

**Delivery standard:** The retrieval interface can switch from BM25 to hybrid search without changing MCP tool names or frontend contracts; index rebuild and versioning are documented.

## MCP / AI Developer

### DB-07 — Persist the MCP tool contracts over the production data layer

**Description:** Replace in-memory corpus loading with repository/data-access services while keeping the six-tool MCP boundary stable.

**Delivery standard:** Each tool has versioned input/output schemas, tenant-aware access rules, error responses, and integration tests against a seeded database.

### DB-08 — Implement production model, speech, and observability configuration

**Description:** Connect approved model and speech services without exposing credentials or changing guardrails.

**Delivery standard:** Secrets use environment/secret management, latency and failure metrics exist, prompts and source IDs are traceable for development, and sensitive learner content is not logged unnecessarily.

## Frontend / Voice Developer

### DB-09 — Replace mock authentication and progress storage

**Description:** Replace localStorage mock login/profile/progress with the approved authenticated service boundary.

**Delivery standard:** Sessions are secure, logout invalidates access, profile data is tenant-scoped, progress is learner-owned, and no assessment tool can report private learning behaviour to an assessor.

### DB-10 — Handle production loading, permissions, and offline/error states

**Delivery standard:** The UI distinguishes loading, unauthorised, forbidden, unavailable, empty, and stale-data states on every database-backed page.

## QA / Security Tester

### DB-11 — Database and tenant-isolation testing

**Delivery standard:** Tests prove that one training organisation cannot read another organisation's units, learners, progress, assessment data, or model-answer records.

### DB-12 — Performance, migration, backup, and recovery verification

**Delivery standard:** The team records import time, retrieval latency, expected concurrent use, migration rollback steps, backup ownership, and restore evidence.

## UX / Documentation Lead

### DB-13 — Produce the Phase 2 technical specification

**Delivery standard:** Documentation contains the approved glossary, architecture diagram, ERD, data flow, MCP contracts, privacy model, limitations, deployment assumptions, and future-work decisions.

## Phase 2 Dependency Order

Use the following dependency rules when creating the Trello cards:

```text
DB-01 Confirm GAR definition and scope
  -> DB-02 Approve data ownership and privacy boundaries
  -> DB-03 Design canonical relational schema

DB-02 + DB-03
  -> DB-04 Build import and validation pipeline
  -> DB-05 Implement criteria and assessment mappings
  -> DB-06 Add retrieval index storage and upgrade path
  -> DB-07 Persist MCP tool contracts over production data
  -> DB-08 Configure model, speech, and observability
  -> DB-09 Replace mock authentication and progress storage
  -> DB-10 Add production loading and permission states

DB-04 + DB-05 + DB-06 + DB-07 + DB-08 + DB-09 + DB-10
  -> DB-11 Test database and tenant isolation
  -> DB-12 Verify performance, migration, backup, and recovery

DB-11 + DB-12
  -> DB-13 Produce the Phase 2 technical specification
```

DB-02 and DB-03 may be prepared as draft cards before DB-01 is complete, but implementation and approval are blocked until DB-01 defines the system boundary. DB-11 and DB-12 must be completed before the Phase 2 gate.

# Phase Gates

## MVP Gate — Before claiming Phase 1 complete

- All Must Have user stories have passing evidence or an approved scope exception.
- The frontend no longer relies on mock data for the demo integration path.
- MCP self-test and backend tests pass.
- At least 10–15 spoken-style retrieval evaluations are recorded.
- Correct and incorrect assessment explanations preserve the no-marking boundary.
- Responsive evidence covers desktop, tablet, and narrow mobile widths.
- README, user stories, architecture, limitations, and demo script are updated.

## Database / GAR Gate — Before claiming Phase 2 complete

- GAR terminology and ownership are approved by Steve/tutor.
- ERD and DDL are reviewed.
- Import is repeatable and validation results are stored.
- Tenant and learner privacy tests pass.
- MCP contracts remain stable across the data-layer change.
- Retrieval index rebuild and rollback are documented.
- Production secrets, backups, migrations, and observability are documented.
