# Week 1 Sprint Plan

## Sprint Goal

The goal for Week 1 is to align the team on the project scope, confirm the MVP direction with the client/tutor, set up the Agile workflow, and prepare enough planning and technical understanding to start implementation in Week 2.

Core Week 1 outcome:

```text
Understand the brief -> confirm MVP scope -> assign roles -> create user stories -> prepare client questions -> set up project workflow
```

## Week 1 Role-Based Task Table

| Role | Task ID | Task | Priority | Owner | Status | Deliverable | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| Team / PM | W1-01 | Review the client brief and current README | Must Have | All | To Do | Shared project understanding | Each member has read the README and noted unclear points. |
| Team / PM | W1-02 | Confirm the first MVP unit | Must Have | All | To Do | MVP unit decision | Team agrees whether to start with `CPCCWHS1001 / CPCWHS1001`. |
| Team / PM | W1-03 | Confirm team roles and responsibilities | Must Have | All | To Do | Role allocation | Each member has a primary role and understands support responsibilities. |
| Team / PM | W1-04 | Set up Agile workflow | Must Have | PM / UX Docs | To Do | GitHub Projects or Trello board | Board has columns: Backlog, To Do, In Progress, In Review, Done, Blocked. |
| Team / PM | W1-05 | Prepare questions for the first client meeting | Must Have | All | To Do | Client question list | Questions cover MVP scope, MCP, voice input, assessment feedback, data, OCR/slides, and success criteria. |
| Data / Retrieval | W1-06 | Review key data files | Must Have | Data Lead | To Do | Data notes | Notes explain the purpose of `delivery_material_text.jsonl`, `delivery_material_index.csv`, `assessment_questions.jsonl`, and `performance_criteria.csv`. |
| Data / Retrieval | W1-07 | Identify White Card data records | Must Have | Data Lead | To Do | White Card data check | Team knows how `CPCCWHS1001` and `CPCWHS1001` appear in the data and why they should be handled together. |
| Data / Retrieval | W1-08 | Draft initial data structure for the MVP | Should Have | Data Lead | To Do | Draft data shape | Proposed structure includes unit code, sequence, title, text, criterion, and source metadata. |
| Data / Retrieval | W1-09 | Identify data risks | Should Have | Data Lead | To Do | Data risk list | Risks include long text, missing text, image-only slides, and spoken-question retrieval difficulty. |
| Data / Retrieval | W1-10 | Draft ERD/UML for the MVP data structure | Must Have | Data Lead | To Do | ERD/UML draft | Diagram shows core entities such as Unit, MaterialItem, MaterialChunk, PerformanceCriterion, AssessmentQuestion, and AssessmentMapping. |
| Data / Retrieval | W1-11 | Draft the data flow diagram data-side steps | Should Have | Data Lead + MCP / AI | To Do | Data flow notes | Flow explains how course data moves from files/database into retrieval and AI context. |
| MCP / AI | W1-12 | Review MCP and AI requirements in the client brief | Must Have | MCP / AI Lead | To Do | MCP requirement notes | Notes explain MCP-first direction and any questions needing client confirmation. |
| MCP / AI | W1-13 | Draft initial MCP tool list | Must Have | MCP / AI Lead | To Do | Tool list draft | Draft includes fetch units, fetch material, search material, read passage, handle spoken question, explain concept, and explain feedback. |
| MCP / AI | W1-14 | Draft AI guardrail rules | Must Have | MCP / AI Lead | To Do | Guardrail notes | Rules include grounded answers, no auto-marking, fallback for unsupported questions, and plain-language responses. |
| MCP / AI | W1-15 | Draft first prompt direction | Should Have | MCP / AI Lead | To Do | Prompt notes | Prompt direction explains how Aita should use retrieved material and respond in low-literacy-friendly language. |
| MCP / AI | W1-16 | Draft MCP/AI flow diagram | Should Have | MCP / AI Lead + Data Lead | To Do | MCP/AI flow draft | Diagram shows voice/text question, retrieval, prompt construction, grounded answer, and no-marking boundary. |
| Frontend / Voice | W1-17 | Review expected frontend screens | Must Have | Frontend Lead | To Do | Screen list | Screen list includes unit selection, material list, content viewer, read-aloud controls, question input, and answer display. |
| Frontend / Voice | W1-18 | Test browser text-to-speech feasibility | Should Have | Frontend Lead | To Do | TTS feasibility note | A short local test confirms whether browser TTS can read sample course text. |
| Frontend / Voice | W1-19 | Draft simple frontend component breakdown | Should Have | Frontend Lead | To Do | Component list | Component list includes unit selector, material card/list, audio controls, question box, answer panel, and source display. |
| Frontend / Voice | W1-20 | Identify voice input options | Should Have | Frontend Lead | To Do | Voice option notes | Notes compare browser speech recognition, Whisper, or partner-provided STT as possible MVP options. |
| Frontend / Voice | W1-21 | Create low-fidelity frontend storyboard or clickable mockup | Must Have | Frontend Lead + UX / Docs | To Do | Storyboard or Figma draft | Visual flow shows student selecting material, using read-aloud, asking a voice question, and receiving an answer. |
| UX / Docs / Evidence | W1-22 | Draft initial user stories | Must Have | UX / Docs Lead + All | To Do | User stories draft | Core stories cover read-aloud, voice question, grounded answer, assessment explanation, and no-marking boundary. |
| UX / Docs / Evidence | W1-23 | Draft acceptance criteria | Must Have | UX / Docs Lead | To Do | Acceptance criteria | Each Must Have user story has clear completion criteria. |
| UX / Docs / Evidence | W1-24 | Draft low-literacy UX principles | Should Have | UX / Docs Lead | To Do | UX notes | Notes explain simple language, no judgement, short voice responses, and clear controls. |
| UX / Docs / Evidence | W1-25 | Record meeting notes and project decisions | Must Have | UX / Docs Lead | To Do | Meeting notes | Tutor/client meeting notes and decisions are saved in the planning folder or team workspace. |
| UX / Docs / Evidence | W1-26 | Prepare sprint evidence for assessment | Should Have | UX / Docs Lead | To Do | Sprint evidence notes | Evidence includes role allocation, board screenshot/link, user stories, meeting notes, and client questions. |
| UX / Docs / Evidence | W1-27 | Convert sprint plan into Trello cards | Must Have | UX / Docs Lead | To Do | Trello board cards | Trello cards reflect Week 1 tasks, owners, priorities, and acceptance criteria. |
| UX / Docs / Evidence | W1-28 | Prepare group section for next tutor meeting assignment | Must Have | UX / Docs Lead + All | To Do | Assignment contribution draft | Group section summarises past progress, current sprint plan, role allocation, and questions for tutor/client. |

## Week 1 Daily Focus

| Day | Focus | Expected Output |
|---|---|---|
| Day 1 | Team alignment | Everyone reviews README and client brief; unclear points are listed. |
| Day 2 | Role allocation and client questions | Roles are agreed; client meeting question list is ready. |
| Day 3 | User stories and Agile board | Initial user stories, Trello cards, and project board are created. |
| Day 4 | Technical and visual preparation | Data, MCP/AI, and Frontend leads draft technical notes, storyboard, ERD/UML, and flow diagrams. |
| Day 5 | Review and lock Week 2 readiness | Team reviews Week 1 outputs and confirms what starts in Week 2. |

## Week 1 Must-Have Outputs

- Confirmed MVP scope and first target unit.
- Confirmed team role allocation.
- Agile board created in GitHub Projects or Trello.
- Initial user stories and acceptance criteria drafted.
- Low-fidelity storyboard or wireframe draft created.
- Trello task cards created from the sprint plan.
- Client meeting questions prepared.
- Data files reviewed at a high level.
- Initial ERD/UML or data structure diagram drafted.
- Data flow and MCP/AI flow drafts started.
- MCP-first architecture questions identified.
- Frontend/voice feasibility notes started.

## Week 1 Visual and Documentation Artefacts

| Artefact | Primary Owner | Support | Purpose |
|---|---|---|---|
| User flow / storyboard | Frontend / Voice + UX / Docs | All | Show the student journey from selecting material to receiving a grounded answer. |
| Low-fidelity wireframes or Figma mockup | Frontend / Voice + UX / Docs | All | Show the expected MVP screens before implementation. |
| ERD / UML data structure diagram | Data / Retrieval | MCP / AI | Show core entities such as Unit, MaterialItem, MaterialChunk, PerformanceCriterion, AssessmentQuestion, and AssessmentMapping. |
| Data flow diagram | Data / Retrieval + MCP / AI | Frontend / Voice | Show how course data moves into retrieval, prompt context, and AI answers. |
| MCP / AI flow diagram | MCP / AI | Data / Retrieval | Show the MCP tools, RAG flow, prompt construction, and no-marking boundary. |
| Trello task cards | UX / Docs / Evidence | All | Turn the sprint plan into trackable tasks with owner, priority, and acceptance criteria. |
| Tutor meeting assignment group section | UX / Docs / Evidence | All | Summarise team progress, role allocation, sprint plan, and questions for tutor/client. |

## Week 1 Client Questions to Prepare

- Should the MVP start with `CPCCWHS1001 / CPCWHS1001`?
- Is a standalone prototype acceptable first, or must we implement MCP from the start?
- What level of voice input is expected for the first demo?
- Is browser speech-to-text acceptable if partner AI pool access is not ready?
- How should assessment feedback explanation be demonstrated safely?
- Are image-only slides/OCR required in the first prototype, or can they be documented as future work?
- What would make the final prototype successful from the client's perspective?

## Definition of Done for Week 1

Week 1 is complete when:

- The team can explain the project goal in one sentence.
- Everyone has an agreed role.
- The MVP scope is documented or ready to confirm with the client.
- The Agile board exists and has initial tasks.
- User stories and acceptance criteria have a first draft.
- Trello cards have been created or are ready to create from the task table.
- The storyboard/wireframe, ERD/UML, and flow diagrams have first drafts or assigned owners.
- The team has a clear list of client questions.
- Week 2 tasks can start without waiting for basic project understanding.
