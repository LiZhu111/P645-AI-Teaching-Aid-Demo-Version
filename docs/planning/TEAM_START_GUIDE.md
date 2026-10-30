# Team Start Guide

## What We Are Building

Aita is a voice-first AI study companion for entry-level construction learners.

It should help students:

- Listen to course material.
- Ask questions in natural spoken language.
- Get explanations based on the provided training content.
- Understand human-marked assessment feedback.

It should not:

- Mark student answers.
- Decide competency.
- Report private learning behaviour to assessors.
- Invent answers outside the provided material.

## First Team Meeting Agenda

1. Read `README.md` and `docs/brief/CLIENT_BRIEF.md`.
2. Agree on the MVP unit: recommended `CPCCWHS1001` plus `CPCWHS1001`.
3. Choose the technical stack.
4. Assign roles.
5. Create initial GitHub issues.
6. Define the first demo scenario.

## Suggested Initial GitHub Issues

1. Create data loader for `delivery_material_text.jsonl`.
2. Merge `CPCCWHS1001` and `CPCWHS1001` material for White Card.
3. Build material chunking strategy.
4. Implement basic retrieval.
5. Create answer-generation prompt.
6. Build frontend material browser.
7. Add read-aloud button.
8. Add text question input.
9. Add browser speech-to-text prototype.
10. Create 10 spoken-style evaluation questions.
11. Create one assessment explanation demo.
12. Document known limitations around slides and OCR.

## Definition of Done for MVP

- A user can select the White Card unit.
- A user can play at least one course section aloud.
- A user can ask a question and receive a grounded explanation.
- The answer includes a source reference internally or visibly.
- The system refuses or qualifies unsupported answers.
- The team can demonstrate one correct-answer explanation and one incorrect-answer explanation after human marking.

## Known Risks

- Many slide images have no text layer.
- Some content items are very long and need chunking.
- Spoken questions may not contain exact keywords.
- Voice latency can make the product feel broken.
- Model answers must be protected from becoming a public answer key.
