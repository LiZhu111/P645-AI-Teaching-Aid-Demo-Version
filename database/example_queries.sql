-- Fictional demonstration lessons, in reading order.
SELECT material_id, title
FROM readable_material
WHERE canonical_unit_code = 'DEMO101'
ORDER BY sequence;

-- Synthetic assessment examples; use only after a simulated human review.
SELECT question_id, question_text
FROM learner_question
WHERE unit_code = 'DEMO101';
