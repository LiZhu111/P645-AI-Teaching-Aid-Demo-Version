"""Transactional, repeatable import of the eight supplied Aita source files."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
FILES = ('qualification.csv','units.csv','performance_criteria.csv',
         'delivery_material_index.csv','delivery_material_text.jsonl',
         'delivery_material_html.jsonl','assessment_questions.jsonl','foundation_framework.csv')
ALIASES = {'DEMO101': 'DEMO101'}

def canonical(code):
    return ALIASES.get(code, code)

def dump(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)

def stable_id(prefix, values):
    return prefix + hashlib.sha256(dump(values).encode()).hexdigest()

def material_key(r):
    return (r['unitCode'], int(r['sequence']), r['type'],
            None if r['pcNumber'] in ('', None) else int(r['pcNumber']), int(r['pcVariant']))

def read_sources(data):
    result = {}
    for name in FILES:
        with (Path(data)/name).open(encoding='utf-8-sig', newline='') as f:
            result[name] = list(csv.DictReader(f)) if name.endswith('.csv') else [json.loads(line) for line in f if line.strip()]
    return result

def import_data(db_path, data_dir=ROOT/'data'):
    """UPSERT current rows. Never truncate learner data or delete old content IDs."""
    sources = read_sources(data_dir)
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.execute('PRAGMA foreign_keys=ON')
    try:
        con.executescript((Path(__file__).with_name('schema.sql')).read_text())
        with con:
            for name, rows in sources.items():
                con.execute('DELETE FROM source_record WHERE source_file=?',(name,))
                con.executemany('INSERT INTO source_record VALUES(?,?,?)',
                                [(name,i,dump(r)) for i,r in enumerate(rows,1)])
            for r in sources['qualification.csv']:
                con.execute('INSERT INTO qualification VALUES(?,?,?,?,?,?) ON CONFLICT(qualification_code) DO UPDATE SET name=excluded.name,release=excluded.release,nominal_hours=excluded.nominal_hours,description=excluded.description,source_json=excluded.source_json',
                    (r['code'],r['name'],r['release'],int(r['nominalHours']) if r['nominalHours'] else None,r['description'],dump(r)))
            for r in sources['units.csv']:
                con.execute('INSERT INTO unit VALUES(?,?,?,?,?,?) ON CONFLICT(unit_code) DO UPDATE SET name=excluded.name,release=excluded.release,nominal_hours=excluded.nominal_hours,unit_descriptor=excluded.unit_descriptor,source_json=excluded.source_json',
                    (r['code'],r['name'],r['release'],int(r['nominalHours']) if r['nominalHours'] else None,r['unitDescriptor'],dump(r)))
            for r in sources['units.csv']:
                con.execute('INSERT INTO unit_alias VALUES(?,?) ON CONFLICT(source_unit_code) DO UPDATE SET canonical_unit_code=excluded.canonical_unit_code',(r['code'],canonical(r['code'])))
                match=re.fullmatch(r'(\S+) release (\S+)',r['isCoreOf'].strip())
                if match:
                    qualification, release=match.groups()
                    if not con.execute('SELECT 1 FROM qualification WHERE qualification_code=? AND release=?',(qualification,release)).fetchone():
                        raise ValueError('Unknown qualification/release: '+r['isCoreOf'])
                    con.execute('INSERT INTO qualification_unit VALUES(?,?,1) ON CONFLICT(qualification_code,unit_code) DO UPDATE SET is_core=1',(qualification,r['code']))
            criteria = {}
            for r in sources['performance_criteria.csv']:
                key=(r['unitCode'],int(r['criterionNumber']))
                if key in criteria: raise ValueError('Duplicate criterion: '+str(key))
                criteria[key]=r
                con.execute('INSERT INTO performance_criterion VALUES(?,?,?,?) ON CONFLICT(unit_code,criterion_number) DO UPDATE SET criterion_text=excluded.criterion_text,module_release=excluded.module_release',(*key,r['criterionText'],r['moduleRelease']))
            indexes={}
            for r in sources['delivery_material_index.csv']:
                key=material_key(r)
                if key in indexes: raise ValueError('Duplicate material key: '+str(key))
                indexes[key]=r
            variants={}
            for name, field in [('delivery_material_text.jsonl','text'),('delivery_material_html.jsonl','contentHtml')]:
                variants[field]={}
                for r in sources[name]:
                    key=material_key(r)
                    if key not in indexes: raise ValueError('Content missing index entry: '+str(key))
                    if key in variants[field]: raise ValueError('Duplicate content: '+str(key))
                    variants[field][key]=r[field]
            for key,r in indexes.items():
                con.execute('''INSERT INTO learning_material VALUES(?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(material_id) DO UPDATE SET title=excluded.title,content_text=excluded.content_text,
                  content_html=excluded.content_html,source_format=excluded.source_format,source_version=excluded.source_version''',
                  (stable_id('mat_',key),*key,r['title'],variants['text'].get(key),variants['contentHtml'].get(key),r['sourceFormat'],r['version']))
            question_keys=set()
            for r in sources['assessment_questions.jsonl']:
                key=(r['unitCode'],int(r['assessmentNumber']),int(r['section']),int(r['questionNum']))
                if key in question_keys: raise ValueError('Duplicate question: '+str(key))
                question_keys.add(key)
                if type(r['structural']) is not bool: raise ValueError('structural must be a boolean')
                qid=stable_id('q_',key)
                con.execute('''INSERT INTO assessment_question VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(question_id) DO UPDATE SET question_type=excluded.question_type,
                  structural=excluded.structural,question_text=excluded.question_text,options_json=excluded.options_json,
                  model_answer=excluded.model_answer,mapping_raw=excluded.mapping_raw,evidence_json=excluded.evidence_json''',
                  (qid,*key,r['questionType'],int(r['structural']),r['question'],dump(r.get('options',[])),r['modelAnswer'],r['mapping'],dump(r['evidence'])))
                con.execute('DELETE FROM question_criterion_map WHERE question_id=?',(qid,))
                for token in sorted(set(t.strip().lower() for t in (r['mapping'] or '').split(',') if t.strip())):
                    # Dotted performance criteria are explicit. Preserve k/s codes without guessing their offsets.
                    match=re.fullmatch(r'(\d+)\.(\d+)',token)
                    target=None
                    resolution='unresolved_evidence' if re.fullmatch(r'[ks]\d+',token) else 'unresolved_reference'
                    if match:
                        number=int(match[1])*100+int(match[2])
                        candidates=[u for u in (key[0],*sorted(ALIASES.keys()),*sorted(set(ALIASES.values())))
                                    if canonical(u)==canonical(key[0]) and (u,number) in criteria]
                        if candidates:
                            target=(candidates[0],number)
                            resolution='exact' if target[0]==key[0] else 'white_card_alias'
                    con.execute('INSERT INTO question_criterion_map VALUES(?,?,?,?,?)',(qid,token,*(target or (None,None)),resolution))
            for r in sources['foundation_framework.csv']:
                values=[r.get(k,'') for k in ['framework','skillKey','skillName','cluster','level','stageName','indicatorCode','indicatorText','taskComplexity','source']]
                fid=stable_id('ff_',values)
                con.execute('INSERT INTO foundation_framework VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(framework_id) DO NOTHING',(fid,*values))
            errors=con.execute('PRAGMA foreign_key_check').fetchall()
            if errors: raise ValueError('Foreign key errors: '+repr(errors))
        return report(con)
    finally:
        con.close()

def report(con):
    tables=('qualification','unit','qualification_unit','performance_criterion','learning_material',
            'assessment_question','question_criterion_map','foundation_framework','source_record')
    result={t:con.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in tables}
    result['readable_material']=con.execute('SELECT count(*) FROM readable_material').fetchone()[0]
    result['real_questions']=con.execute('SELECT count(*) FROM learner_question').fetchone()[0]
    result['mapping_resolution']={r[0]:r[1] for r in con.execute('SELECT resolution,count(*) FROM question_criterion_map GROUP BY resolution')}
    result['unresolved_material_criteria']=con.execute('SELECT count(*) FROM unresolved_material_criterion').fetchone()[0]
    result['integrity_check']=con.execute('PRAGMA integrity_check').fetchone()[0]
    result['foreign_key_errors']=con.execute('PRAGMA foreign_key_check').fetchall()
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db',type=Path,default=ROOT/'database/aita.db')
    parser.add_argument('--data',type=Path,default=ROOT/'data')
    args=parser.parse_args()
    print(json.dumps(import_data(args.db,args.data),indent=2))
