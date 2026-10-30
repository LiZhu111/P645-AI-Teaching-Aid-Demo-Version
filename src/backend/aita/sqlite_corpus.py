"""Read a SQLite snapshot using the existing MCP identity and retrieval contracts."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .corpus import Corpus, _build_corpus


def load_sqlite_corpus(path: str | Path) -> Corpus:
    path = Path(path).resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Course database missing: {path}. Run python -m database.import_data first.")
    con = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
    con.row_factory = sqlite3.Row
    try:
        if con.execute('SELECT version FROM schema_version').fetchall()[0][0] != 1:
            raise ValueError('Unsupported course database schema')
        records = {
            'units.csv': [dict(code=r['unit_code'], name=r['name'], release=r['release'] or '',
                               nominalHours=r['nominal_hours'], unitDescriptor=r['unit_descriptor'] or '')
                          for r in con.execute('SELECT * FROM unit ORDER BY unit_code')],
            'performance_criteria.csv': [dict(unitCode=r['unit_code'], criterionNumber=r['criterion_number'],
                                              criterionText=r['criterion_text'])
                for r in con.execute('SELECT * FROM performance_criterion ORDER BY unit_code, criterion_number')],
            'assessment_questions.jsonl': [dict(unitCode=r['unit_code'], assessmentNumber=r['assessment_number'],
                section=r['section_number'], questionNum=r['question_number'], questionType=r['question_type'],
                question=r['question_text'], options=json.loads(r['options_json']), modelAnswer=r['model_answer'],
                mapping=r['mapping_raw'], structural=bool(r['structural']))
                for r in con.execute('SELECT * FROM assessment_question ORDER BY unit_code, assessment_number, section_number, question_number')],
            'delivery_material_index.csv': [], 'delivery_material_text.jsonl': [],
        }
        for row in con.execute('SELECT * FROM learning_material ORDER BY unit_code, sequence, material_type'):
            record = dict(unitCode=row['unit_code'], sequence=row['sequence'], type=row['material_type'],
                          pcNumber=row['pc_number'], pcVariant=str(row['pc_variant']), title=row['title'],
                          database_id=row['material_id'], text=row['content_text'] or '')
            records['delivery_material_index.csv'].append(record)
            records['delivery_material_text.jsonl'].append(record)
        return _build_corpus(records)
    finally:
        con.close()
