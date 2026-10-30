# User Stories

This document captures the initial user stories for Project Aita. These stories should be reviewed by the team, tutor, and Industry Partner before development begins.

## Priority Standard

| Priority | Meaning |
|---|---|
| Must Have | Required for the MVP demo. Without this, Aita cannot show its core value. |
| Should Have | Important, but can be simplified if time is limited. |
| Could Have | Useful if the team has extra time. |
| Future Work | Out of scope for the first prototype, but worth documenting. |

## Core MVP User Stories

| ID | User Story | Priority | Acceptance Criteria | Notes |
|---|---|---|---|---|
| US-01 | As a student, I want to select a course unit so that I can choose what I want to study. | Must Have | Student can view available units; student can select the White Card unit for the MVP. | Start with `CPCCWHS1001 / CPCWHS1001`. |
| US-02 | As a student, I want to view the learning material in order so that I can follow the intended course sequence. | Must Have | Material is shown by unit; material is sorted by `sequence`; each item shows a title. | Use `delivery_material_text.jsonl`. |
| US-03 | As a student, I want to play course material aloud so that I can learn without reading long text. | Must Have | Student can click a read-aloud button; selected text is read aloud; student can stop playback. | Browser TTS is acceptable for MVP. |
| US-04 | As a student, I want to ask a question about the material so that I can understand difficult concepts. | Must Have | Student can enter a question; question is sent to the answer flow; an answer is displayed. | Text input first, voice input later. |
| US-05 | As a student, I want Aita to answer using the provided course material so that I can trust the response. | Must Have | System retrieves relevant material; answer is based on retrieved content; answer includes source context or reference. | Core RAG requirement. |
| US-06 | As a student, I want Aita to say when it cannot find an answer so that I am not misled. | Must Have | Unsupported questions return a clear fallback response; Aita does not invent unsupported facts. | Important guardrail. |
| US-07 | As a student, I want simple explanations so that I can understand the material even if I struggle with long written text. | Should Have | Answers use plain language; answers avoid unnecessary jargon; answers are short enough for voice playback. | Low-literacy UX principle. |
| US-08 | As a student, I want to ask questions by voice so that I can use Aita hands-free. | Must Have | Student can activate voice input; speech is converted to text; converted text can be submitted as a question. | Text Q&A can be built first, but voice input is part of the client success criteria. |
| US-09 | As a student, I want to continue from where I stopped so that I do not lose my learning position. | Should Have | System stores current unit and material item; student can see last selected item. | Can be local storage or a documented resumable-position design for MVP. |

## Assessment Feedback User Stories

| ID | User Story | Priority | Acceptance Criteria | Notes |
|---|---|---|---|---|
| US-10 | As a student, I want Aita to explain why my human-marked answer was correct so that I can understand the concept better. | Must Have | Human-marked status is provided; Aita explains the reason using delivery material and assessment mapping; Aita does not mark the answer itself. | Use `assessment_questions.jsonl`; demo-level implementation is acceptable for MVP. |
| US-11 | As a student, I want Aita to explain why my human-marked answer was incorrect so that I know what to revise. | Must Have | Human-marked status is provided; Aita identifies related material; Aita gives supplementary explanation; Aita does not decide competency. | Demo-level implementation is acceptable for MVP. |
| US-12 | As an assessor, I want model answers to be protected so that Aita does not become an answer-key tool. | Must Have | Model answers are not exposed directly as a browseable feature; assessment explanations only occur in a controlled feedback flow. | Product boundary from brief. |

## Team and Admin User Stories

| ID | User Story | Priority | Acceptance Criteria | Notes |
|---|---|---|---|---|
| US-13 | As a team member, I want clear project documentation so that I can understand the project scope and contribute effectively. | Must Have | README explains goal, scope, data, architecture, and development plan. | Already started. |
| US-14 | As a developer, I want a clean data loading structure so that frontend and AI work can use the same material format. | Must Have | Data loader returns unit, sequence, title, text, criterion, and source metadata. | Owned by Data/Retrieval. |
| US-15 | As a developer, I want clear MCP-first tool definitions so that frontend, retrieval, and AI components can integrate cleanly. | Must Have | MCP tool names, inputs, and outputs are documented; any normal API fallback is clearly labelled as a prototype decision; at least basic fetch/search/explain flow exists. | Owned by MCP/AI. |
| US-16 | As a team member, I want a demo script so that the final prototype presentation is clear and repeatable. | Should Have | Demo has a chosen unit, material section, example question, expected answer flow, and known limitations. | Owned by UX/Docs. |

## Future Work User Stories

| ID | User Story | Priority | Acceptance Criteria | Notes |
|---|---|---|---|---|
| FW-01 | As a student, I want Aita to describe image-only slides so that I can understand visual course material through audio. | Future Work | Slide images are processed by OCR or vision; descriptions are linked to source slides. | Complex; document as future work unless client prioritises it. |
| FW-02 | As a student, I want better semantic search so that spoken questions with unclear wording still find the right material. | Future Work | Vector search improves retrieval for spoken-style questions. | Basic retrieval is required for MVP; full vector search can remain future work if time is limited. |
| FW-03 | As a student, I want mobile-friendly voice interaction so that I can use Aita while travelling or away from a desk. | Future Work | Prototype works well on mobile viewport; future mobile app recommendations are documented. | Mention in final report. |

## Review Questions

- Do these stories match the Industry Partner's expectations?
- Should the MVP cover one unit well or multiple units at a basic level?
- Is voice input required in the first demo, or is text Q&A plus read-aloud acceptable?
- How should assessment explanation be demonstrated without exposing model answers?
