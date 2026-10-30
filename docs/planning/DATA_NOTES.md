# Data Notes

## Curated Data

The `data/` folder contains the files the team should use first:

- `assessment_questions.jsonl`
- `delivery_material_html.jsonl`
- `delivery_material_index.csv`
- `delivery_material_text.jsonl`
- `foundation_framework.csv`
- `performance_criteria.csv`
- `qualification.csv`
- `units.csv`

## Start Here

Use `delivery_material_text.jsonl` for the first prototype.

Each row contains fields such as:

- `unitCode`
- `sequence`
- `type`
- `pcNumber`
- `pcVariant`
- `title`
- `text`

This is enough to build:

- read-aloud material selection
- ordered playback
- search
- retrieval-augmented explanations

## Important Gotchas

- `CPCCWHS1001` and `CPCWHS1001` should be treated together for White Card material.
- `delivery_material_index.csv` includes slides and placeholders that may not appear in `delivery_material_text.jsonl`.
- Many slide resources have no text layer.
- `assessment_questions.jsonl` includes structural rows. Filter `structural: true` out for question work.
- Use `mapping` in `assessment_questions.jsonl` to connect questions back to criteria and knowledge evidence.

## Media Assets

Large media folders are intentionally ignored by Git in this repository.

For the first MVP, use written material as the core learning spine. Add image/OCR support only after the text-based retrieval flow works.
