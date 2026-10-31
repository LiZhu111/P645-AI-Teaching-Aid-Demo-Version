# Six-Week Sprint Plan

The Phase 1 plan below is designed for a six-week MVP build. The goal is to create a working prototype that demonstrates Aita's core learning flow:

```text
Select material -> Read aloud -> Ask question -> Retrieve content -> AI answer
```

## Priority Standard

| Priority | Meaning |
|---|---|
| Must Have | Required for the MVP demo. |
| Should Have | Important, but can be simplified if time is limited. |
| Could Have | Useful if time allows. |
| Future Work | Not required for this stage; document for later development. |

## Team Areas

| Area | Focus |
|---|---|
| Data / Retrieval | Data loading, cleaning, chunking, keyword/vector search, retrieval testing |
| MCP / AI | MCP tools or API flow, prompts, RAG answer flow, guardrails, assessment explanation |
| Frontend / Voice | Web interface, material browser, read-aloud controls, text Q&A, voice input |
| UX / Docs / Evidence | User stories, wireframes, user flows, sprint evidence, technical documentation, demo script |

## Phase 1: Six-Week MVP Plan

| Week | Sprint Goal | Must Have Tasks | Should / Could Tasks | Deliverables |
|---|---|---|---|---|
| Week 1 | Project understanding and planning | Review client materials; confirm MVP scope; confirm first unit; assign roles; create Agile board; draft initial user stories | Prepare client questions; identify project risks | MVP scope, team roles, user stories, Agile board |
| Week 2 | UX design and data preparation | Create user flow; create wireframes; review data files; filter White Card unit; define data format for frontend and AI | Draft architecture diagram; draft prompt rules | User flow, wireframes, data notes, architecture draft |
| Week 3 | App skeleton and data loading | Set up frontend skeleton; set up backend/API or MCP skeleton; load JSONL/CSV data; display unit and material list | Draft database/data design; prepare sample API responses | Running app skeleton, data loader, material browser |
| Week 4 | Read-aloud and basic retrieval | Add read-aloud button; add stop/pause controls; chunk material; implement basic keyword search; define prompt template | Add source reference display; start retrieval test questions | Read-aloud demo, searchable chunks, basic search, prompt draft |
| Week 5 | Q&A, voice, and assessment explanation | Connect search to AI answer flow; add question input; display grounded answer; add voice input; add guardrails for unsupported answers and no marking; create assessment feedback explanation demo | Improve response wording for low-literacy learners; add simple progress tracking if time allows | Text Q&A demo, voice question demo, grounded answer flow, assessment explanation demo |
| Week 6 | Testing, polish, and final delivery | Test full demo flow; fix bugs; update README/docs; complete technical specification; prepare final demo script | UI polish; document future work such as OCR, vector search, and mobile support | Final MVP, test notes, final documentation, demo script |

## Phase 2: Six-Week Database and Production Readiness Plan

Phase 2 starts by closing any Phase 1 acceptance actions carried over from this semester. Production database and learner-data implementation must not begin until the Phase 1 MVP gate is complete and the partner has confirmed the meaning of GAR, the system boundary, data ownership, and privacy requirements. If the carry-over or partner decisions take longer than Week 1, the team should re-plan the remaining work rather than bypass these gates.

| Week | Sprint Goal | Must Have Tasks | Should / Could Tasks | Deliverables |
|---|---|---|---|---|
| Week 1 | Close Phase 1 and confirm Phase 2 scope | Resolve carried-over Phase 1 checks: frontend test and lint issues; obtain model access or an approved scope exception; settle image-only slide and data-mapping decisions; rerun the Must Have matrix and current-branch checks; record team/partner review. After the Phase 1 gate is cleared, confirm GAR meaning, system boundary, database scope, data ownership, and privacy rules (DB-01 and DB-02). | Draft the Phase 2 backlog and identify external dependencies. | Phase 1 acceptance record; partner-approved Phase 2 scope, glossary, ownership and privacy decisions, and prioritised backlog. |
| Week 2 | Complete production data design | Design and review the MySQL-compatible relational schema, ERD, DDL, tenant boundaries, indexes, and learner-progress model (DB-03). Confirm migration, authentication, and MCP data-access contracts. | Prepare a retrieval-index upgrade design if the approved scope requires it (DB-06). | Reviewed ERD and DDL; agreed data and service contracts. |
| Week 3 | Build and validate the data foundation | Implement a repeatable import and validation pipeline (DB-04); implement supported criterion and assessment mappings; record unresolved mappings and protect model answers from public material search (DB-05). | Profile import performance and document data-quality improvements. | Rebuildable seeded database; import audit and mapping validation results. |
| Week 4 | Connect production data and approved AI services | Move the MCP tools onto the approved data-access layer while preserving their contracts (DB-07); configure approved model and speech services, secret handling, and basic observability (DB-08). | Add a lexical or hybrid retrieval index if approved by the scope decision. | Database-backed MCP flow; configured services; integration evidence and operational notes. |
| Week 5 | Add secure accounts and persistent learner progress | Replace prototype authentication and browser-only progress with the approved authenticated service (DB-09); implement loading, permission, unavailable, and stale-data states (DB-10). Support learner-owned progress and cross-device resume while enforcing tenant boundaries. | Refine recovery and accessibility flows based on evaluation feedback. | Authentication and progress flow; permission/error-state evidence; updated frontend integration. |
| Week 6 | Evaluate, document, and prepare handover | Run end-to-end, tenant-isolation, performance, migration, backup, and recovery checks (DB-11 and DB-12); complete the technical specification (DB-13); review results with the team and client and agree handover actions. | Prioritise follow-up improvements for a later release. | Evaluation results; reviewed technical specification; client-agreed handover and outstanding-work record. |

The six-week schedule is a planning target, not a commitment to implement an unapproved database scope. Weeks 2–6 depend on the Week 1 acceptance and partner-decision gate, confirmed model access or an approved exception, and available team capacity.

### Phase 2 Milestones

| Milestone | Deadline | Success Criteria |
|---|---|---|
| P2-M1: Phase 1 Gate and Scope Confirmed | End of Week 1 | Phase 1 carry-over actions are closed or have an approved exception; the partner has confirmed GAR meaning, system boundary, data scope, ownership, and privacy rules. |
| P2-M2: Data Design Approved | End of Week 2 | ERD, relational schema, DDL, tenant boundaries, and service contracts are reviewed against the approved scope. |
| P2-M3: Data Foundation Validated | End of Week 3 | Import can rebuild the seeded database; validation and mapping results are recorded; model answers are protected from public material search. |
| P2-M4: Production Services Integrated | End of Week 4 | MCP tools use the approved data layer; approved model/speech configuration and integration checks are documented. |
| P2-M5: Secure Learner Workflow Ready | End of Week 5 | Authentication and learner-owned progress work across sessions/devices, with permission and error states handled. |
| P2-M6: Evaluation and Handover Complete | End of Week 6 | Tenant-isolation, end-to-end, performance, migration, backup, and recovery checks are recorded; the technical specification and client-agreed handover are reviewed. |

### Phase 2 Detailed Task Table

| ID | Area | Task | Priority | Sprint | Owner | Status | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| P2-01 | Team / QA | Close Phase 1 carry-over and pass the MVP gate | Must Have | Week 1 | All + QA | Planned | Frontend test/lint issues are resolved or approved; model access or a scope exception is recorded; slide and mapping decisions are settled; current-branch checks and Must Have review are recorded; team/partner review is obtained. |
| DB-01 | Product / Planning | Confirm GAR definition and database scope | Must Have | Week 1 | Project Manager / Product Owner | Planned | Partner approval records the GAR definition, system boundary, data scope, ownership, privacy rules, and agreed Phase 2 backlog. This task starts after the Phase 1 MVP gate. |
| DB-02 | Product / Data | Approve production data ownership and privacy boundaries | Must Have | Week 1 | Project Manager + Data / DB | Planned | An approved data-ownership matrix covers learner profile, progress, assessment decisions, course content, model answers, audit logs, and assessor access. |
| DB-03 | Data / Database | Design the canonical relational schema | Must Have | Week 2 | Data / Database | Planned | Reviewed ERD and MySQL-compatible DDL include keys, indexes, timestamps, tenant boundaries, source identifiers, and the agreed learner-progress model. |
| DB-04 | Data / Database | Build repeatable import and validation | Must Have | Week 3 | Data / Database | Planned | Source data can be imported idempotently into a clean database; an audit reports counts, duplicates, missing joins, mapping exceptions, and rejected records. |
| DB-05 | Data / Database | Implement criterion and assessment mappings | Must Have | Week 3 | Data / Database | Planned | Supported question-to-criterion-to-material mappings are queryable; unresolved mappings are logged; model answers are excluded from public material search. |
| DB-06 | Data / Retrieval | Add retrieval-index storage and upgrade path | Should Have | Week 3 | Data / Retrieval | Planned | The approved lexical index is versioned and rebuildable; any vector/hybrid path has a documented decision and does not change MCP tool contracts. |
| DB-07 | MCP / AI | Persist MCP tool contracts over the production data layer | Must Have | Week 4 | MCP / AI + Data / DB | Planned | All six tools use the approved data-access layer with versioned schemas, tenant-aware rules, defined errors, and seeded-database integration checks. |
| DB-08 | MCP / AI | Configure approved model, speech, and observability services | Must Have | Week 4 | MCP / AI | Planned | Approved services use managed secrets; failures/latency are observable; source traceability supports development without unnecessary sensitive learner-data logging. |
| DB-09 | Frontend / Voice | Replace prototype authentication and progress storage | Must Have | Week 5 | Frontend / Voice | Planned | Secure login/logout and learner-owned progress replace mock/local-only services; access is tenant-scoped and private progress is not exposed to assessors. |
| DB-10 | Frontend / Voice | Handle production loading, permission, and error states | Must Have | Week 5 | Frontend / Voice | Planned | Database-backed views clearly handle loading, unauthorised, forbidden, unavailable, empty, and stale-data states. |
| DB-11 | QA / Security | Test database and tenant isolation | Must Have | Week 6 | QA / Security | Planned | Tests show one organisation cannot access another organisation's units, learners, progress, assessment data, or model-answer records. |
| DB-12 | QA / Operations | Verify performance, migration, backup, and recovery | Must Have | Week 6 | QA / Operations + Data / DB | Planned | Import/retrieval performance, migration and rollback, backup ownership, and restore evidence are recorded against agreed expectations. |
| DB-13 | UX / Documentation | Produce the Phase 2 technical specification and handover | Must Have | Week 6 | UX / Documentation + All | Planned | The reviewed specification includes approved scope, architecture, ERD, data flow, MCP contracts, privacy model, deployment assumptions, limitations, evaluation results, and client-agreed handover actions. |

## Phase 1 Milestones

| Milestone | Deadline | Success Criteria |
|---|---|---|
| M1: Scope Confirmed | End of Week 1 | Team agrees on MVP scope, first unit, roles, and project board. |
| M2: Design Ready | End of Week 2 | User stories, user flow, wireframes, data notes, and architecture draft are ready. |
| M3: App Skeleton Ready | End of Week 3 | App can load and display course material from the provided data. |
| M4: Core Features Ready | End of Week 4 | Read-aloud and basic retrieval are working. |
| M5: Q&A and Feedback Flow Ready | End of Week 5 | Student can ask a voice question, receive a grounded answer, and view a demo explanation for human-marked assessment feedback. |
| M6: Final MVP Ready | End of Week 6 | Prototype is tested, documented, and ready for demonstration. |

## Phase 1 Detailed Task Table

| ID | Area | Task | Priority | Sprint | Owner | Status | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SP-01 | Team | Confirm MVP scope and first unit | Must Have | Week 1 | All | To Do | Team agrees whether to start with `CPCCWHS1001 / CPCWHS1001`. |
| SP-02 | Team | Confirm roles and responsibilities | Must Have | Week 1 | All | To Do | Each team member has a primary area and support responsibilities. |
| SP-03 | UX / Docs | Create Agile board | Must Have | Week 1 | UX / Docs | To Do | GitHub Projects or Trello board exists with agreed columns. |
| SP-04 | UX / Docs | Draft user stories | Must Have | Week 1 | UX / Docs + All | To Do | Initial user stories are documented and reviewed by team. |
| SP-05 | UX / Docs | Prepare client meeting questions | Should Have | Week 1 | UX / Docs + All | To Do | Questions cover scope, priorities, MCP, voice, data, and success criteria. |
| SP-06 | UX / Docs | Create user flow diagram | Must Have | Week 2 | UX / Docs | To Do | Diagram shows select material, read aloud, ask question, retrieve, answer. |
| SP-07 | UX / Docs | Create low-fidelity wireframes | Must Have | Week 2 | UX / Docs | To Do | Wireframes cover main MVP screens. |
| SP-08 | Data / Retrieval | Review key data file fields | Must Have | Week 2 | Data | To Do | Field notes exist for text material, index, criteria, and assessment questions. |
| SP-09 | Data / Retrieval | Filter White Card material | Must Have | Week 2 | Data | To Do | Data subset includes `CPCCWHS1001` and `CPCWHS1001`. |
| SP-10 | MCP / AI | Define MCP-first tool contract | Must Have | Week 2 | MCP / AI | To Do | Fetch, search, read, voice-question, and explain tool inputs/outputs are documented; any API fallback is labelled clearly. |
| SP-11 | Frontend / Voice | Set up frontend skeleton | Must Have | Week 3 | Frontend | To Do | App can run locally and show a basic page. |
| SP-12 | MCP / AI | Set up MCP server skeleton or clearly labelled API fallback | Must Have | Week 3 | MCP / AI | To Do | Basic service/tool structure exists and aligns with the MCP-first design. |
| SP-13 | Data / Retrieval | Build data loader | Must Have | Week 3 | Data | To Do | Loader can read JSONL/CSV and return ordered material. |
| SP-14 | Frontend / Voice | Display unit and material list | Must Have | Week 3 | Frontend | To Do | User can see unit/material list in the UI. |
| SP-15 | Frontend / Voice | Add read-aloud controls | Must Have | Week 4 | Frontend | To Do | User can play and stop selected material audio. |
| SP-16 | Data / Retrieval | Chunk course material | Must Have | Week 4 | Data | To Do | Long material is split into smaller searchable chunks with source metadata. |
| SP-17 | Data / Retrieval | Implement keyword search | Must Have | Week 4 | Data | To Do | Search returns relevant chunks with source metadata. |
| SP-18 | MCP / AI | Write initial prompt template | Must Have | Week 4 | MCP / AI | To Do | Prompt instructs Aita to answer from provided material only. |
| SP-19 | MCP / AI | Add no-marking and fallback rules | Must Have | Week 4 | MCP / AI | To Do | Aita does not mark answers and can handle unsupported questions. |
| SP-20 | Frontend / Voice | Add question input and answer display | Must Have | Week 5 | Frontend | To Do | User can submit a question and see an answer. |
| SP-21 | MCP / AI | Connect retrieval to AI answer flow | Must Have | Week 5 | MCP / AI + Data | To Do | Retrieved context is used to produce a grounded answer. |
| SP-22 | Frontend / Voice | Add voice input prototype | Must Have | Week 5 | Frontend | To Do | User can use browser speech input or an agreed speech-to-text fallback to submit a spoken question. |
| SP-23 | MCP / AI | Build assessment explanation demo | Must Have | Week 5 | MCP / AI | To Do | Demo explains a human-marked correct/incorrect answer without grading. |
| SP-24 | Testing | Prepare retrieval test questions | Should Have | Week 5 | QA + All | To Do | At least 10 spoken-style questions are documented. |
| SP-25 | Testing | Test full MVP flow | Must Have | Week 6 | All | To Do | Main demo flow works from material selection to read-aloud, voice question, grounded answer, and assessment explanation. |
| SP-26 | UX / Docs | Complete technical documentation | Must Have | Week 6 | UX / Docs + All | To Do | Docs describe architecture, data flow, limitations, and future work. |
| SP-27 | UX / Docs | Prepare demo script | Must Have | Week 6 | UX / Docs | To Do | Demo script includes selected unit, sample question, and expected flow. |
| SP-28 | Team | Final review and polish | Must Have | Week 6 | All | To Do | Team reviews prototype, fixes major issues, and confirms final deliverables. |
| SP-29 | Frontend / Voice | Add resumable progress design or simple local progress tracking | Should Have | Week 5 | Frontend + UX / Docs | To Do | Student can return to the last selected unit/material item, or the design explains how resumable progress will work. |

## Board Columns

Use these columns in GitHub Projects or Trello:

```text
Backlog
To Do
In Progress
In Review
Done
Blocked
```

## Scope Control

Must Have features should be completed first. Should Have and Could Have features should only be started after the core flow is working.

Suggested future work:

- OCR or vision support for slide images.
- Full vector search.
- Production MCP integration if the first prototype uses a normal API fallback.
- Full assessment feedback workflow.
- User authentication.
- Mobile app support.
