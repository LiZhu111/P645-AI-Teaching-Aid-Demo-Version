# Six-Week Sprint Plan

This plan is designed for a six-week MVP build. The goal is to create a working prototype that demonstrates Aita's core learning flow:

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

## Six-Week Plan

| Week | Sprint Goal | Must Have Tasks | Should / Could Tasks | Deliverables |
|---|---|---|---|---|
| Week 1 | Project understanding and planning | Review client materials; confirm MVP scope; confirm first unit; assign roles; create Agile board; draft initial user stories | Prepare client questions; identify project risks | MVP scope, team roles, user stories, Agile board |
| Week 2 | UX design and data preparation | Create user flow; create wireframes; review data files; filter White Card unit; define data format for frontend and AI | Draft architecture diagram; draft prompt rules | User flow, wireframes, data notes, architecture draft |
| Week 3 | App skeleton and data loading | Set up frontend skeleton; set up backend/API or MCP skeleton; load JSONL/CSV data; display unit and material list | Draft database/data design; prepare sample API responses | Running app skeleton, data loader, material browser |
| Week 4 | Read-aloud and basic retrieval | Add read-aloud button; add stop/pause controls; chunk material; implement basic keyword search; define prompt template | Add source reference display; start retrieval test questions | Read-aloud demo, searchable chunks, basic search, prompt draft |
| Week 5 | Q&A, voice, and assessment explanation | Connect search to AI answer flow; add question input; display grounded answer; add voice input; add guardrails for unsupported answers and no marking; create assessment feedback explanation demo | Improve response wording for low-literacy learners; add simple progress tracking if time allows | Text Q&A demo, voice question demo, grounded answer flow, assessment explanation demo |
| Week 6 | Testing, polish, and final delivery | Test full demo flow; fix bugs; update README/docs; complete technical specification; prepare final demo script | UI polish; document future work such as OCR, vector search, and mobile support | Final MVP, test notes, final documentation, demo script |

## Milestones

| Milestone | Deadline | Success Criteria |
|---|---|---|
| M1: Scope Confirmed | End of Week 1 | Team agrees on MVP scope, first unit, roles, and project board. |
| M2: Design Ready | End of Week 2 | User stories, user flow, wireframes, data notes, and architecture draft are ready. |
| M3: App Skeleton Ready | End of Week 3 | App can load and display course material from the provided data. |
| M4: Core Features Ready | End of Week 4 | Read-aloud and basic retrieval are working. |
| M5: Q&A and Feedback Flow Ready | End of Week 5 | Student can ask a voice question, receive a grounded answer, and view a demo explanation for human-marked assessment feedback. |
| M6: Final MVP Ready | End of Week 6 | Prototype is tested, documented, and ready for demonstration. |

## Detailed Task Table

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
