"""Repeatable spoken-style retrieval evaluation; expected source IDs fixed before running."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src/backend'))
from aita.server import search_material, explain_concept

CASES = [
    ('What does duty of care mean for me?', ['DEMO101:PC:3', 'DEMO101:PC:124', 'DEMO101:OTHER:55', 'DEMO101:OTHER:56']),
    ('Can you explain personal protective equipment?', ['DEMO101:PC:8', 'DEMO101:PC:139', 'DEMO101:PC:140']),
    ('How do I report hazards and injuries?', ['DEMO101:PC:14', 'DEMO101:PC:177', 'DEMO101:PC:178']),
    ('How do I get first aid at work?', ['DEMO101:PC:17', 'DEMO101:PC:196', 'DEMO101:PC:197']),
    ('What are the different fire extinguishers for?', ['DEMO101:PC:18', 'DEMO101:PC:198', 'DEMO101:PC:199', 'DEMO101:PC:200', 'DEMO101:PC:201', 'DEMO101:PC:202']),
    ('What do the safety signs mean?', ['DEMO101:PC:13', 'DEMO101:PC:173', 'DEMO101:PC:174', 'DEMO101:PC:175', 'DEMO101:PC:176']),
    ('What should I do in an emergency?', ['DEMO101:PC:16', 'DEMO101:ELEMENT:15', 'DEMO101:ELEMENT:4']),
    ('Why is housekeeping important on site?', ['DEMO101:PC:33', 'DEMO101:OTHER:51', 'DEMO101:ELEMENT:113']),
    ('Can I drink alcohol at work?', ['DEMO101:PC:30', 'DEMO101:PC:4', 'DEMO101:OTHER:57']),
    ('Where should we store materials and equipment?', ['DEMO101:PC:34', 'DEMO101:PC:35']),
    ('What can we do about bullying and harassment?', ['DEMO101:PC:36']),
    ('How does risk management work?', ['DEMO101:PC:6', 'DEMO101:PC:131', 'DEMO101:PC:48']),
    ('Who won the world cup?', []),
    ('How do I bake a chocolate cake?', []),
    ('Is my answer right?', []),
]
rows = []
for question, expected in CASES:
    result = search_material(question, unit_code='DEMO101', limit=6)
    actual = [hit['item_id'] for hit in result['results']]
    decision = result['grounding']
    if question == 'Is my answer right?':
        decision = explain_concept(question, unit_code='DEMO101')['grounding']
    passed = bool(set(expected) & set(actual)) and decision != 'abstain' if expected else decision in ('abstain', 'refused_assessment')
    rows.append(dict(question=question, expected_source_ids=expected, returned_hits=result['results'], grounding=decision, passed=passed))
target = ROOT / 'docs/evidence/phase1'
target.mkdir(parents=True, exist_ok=True)
(target / 'retrieval.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding='utf-8')
for row in rows:
    print(('PASS' if row['passed'] else 'FAIL'), row['question'])
print(f'{sum(row["passed"] for row in rows)}/{len(rows)} passed. Failures remain visible in retrieval.json.')
