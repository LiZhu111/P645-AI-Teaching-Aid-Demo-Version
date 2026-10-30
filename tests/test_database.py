import csv
import json
from pathlib import Path
import shutil
import sqlite3
import tempfile
import unittest

from database.import_data import import_data, ROOT, read_sources, material_key, stable_id
from database.repository import AitaRepository

class DatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.db=Path(self.temp.name)/'test.db'
        self.report=import_data(self.db)
        self.repo=AitaRepository(self.db)
    def tearDown(self):
        self.repo.close()
        self.temp.cleanup()
    def test_import_counts_and_integrity(self):
        for key,expected in {'unit':1,'qualification':1,'performance_criterion':2,'learning_material':4,'readable_material':4,'assessment_question':1,'real_questions':1,'foundation_framework':0,'source_record':17}.items():
            self.assertEqual(self.report[key],expected,key)
        self.assertEqual(self.report['integrity_check'],'ok')
        self.assertEqual(self.report['foreign_key_errors'],[])
    def test_text_html_identity_no_slide_collision(self):
        src=read_sources(ROOT/'data')
        for r in src['delivery_material_text.jsonl']:
            mid=stable_id('mat_',material_key(r))
            self.assertEqual(self.repo.get_material(mid)['content_text'],r['text'])
        con=self.repo.con
        self.assertEqual(con.execute('SELECT count(*) FROM learning_material WHERE content_html IS NOT NULL').fetchone()[0],4)
        collisions=con.execute('SELECT unit_code,sequence FROM learning_material GROUP BY unit_code,sequence HAVING count(*)>1').fetchall()
        self.assertEqual(collisions,[])
    def test_demo_unit_material_listing(self):
        a=self.repo.list_materials('DEMO101',False)
        b=self.repo.list_materials('DEMO101',False)
        self.assertEqual(a,b)
        self.assertEqual({r['source_unit_code'] for r in a},{'DEMO101'})
        self.assertEqual(len(self.repo.list_units()),1)
        self.assertEqual(self.report['mapping_resolution']['exact'],1)
    def test_reimport_preserves_ids_and_progress(self):
        self.repo.enrol('learner-a','DEMO101')
        mid=self.repo.list_materials('DEMO101')[0]['material_id']
        self.repo.save_progress('learner-a','DEMO101',mid,10)
        before=self.repo.list_materials('DEMO101',False)
        self.assertEqual(import_data(self.db),self.report)
        self.assertEqual(self.repo.list_materials('DEMO101',False),before)
        self.assertEqual(self.repo.get_progress('learner-a','DEMO101')[0]['last_position'],10)
    def test_import_rolls_back_bad_foreign_key(self):
        d=Path(self.temp.name)/'data';shutil.copytree(ROOT/'data',d)
        f=d/'performance_criteria.csv'
        with f.open() as stream:
            rows=list(csv.DictReader(stream))
        rows[0]['unitCode']='INVALID'
        with f.open('w',newline='') as out:
            w=csv.DictWriter(out,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
        with self.assertRaises(sqlite3.IntegrityError): import_data(self.db,d)
        self.assertEqual(self.repo.con.execute('SELECT count(*) FROM performance_criterion').fetchone()[0],2)
        payload=self.repo.con.execute("SELECT payload_json FROM source_record WHERE source_file='performance_criteria.csv' AND row_number=1").fetchone()[0]
        self.assertNotEqual(json.loads(payload)['unitCode'],'INVALID')
    def test_progress_isolation_and_constraints(self):
        self.repo.enrol('a','DEMO101');self.repo.enrol('b','DEMO101')
        mid=self.repo.list_materials('DEMO101')[0]['material_id']
        self.repo.save_progress('a','DEMO101',mid,12)
        self.assertEqual(self.repo.get_progress('b','DEMO101'),[])
        with self.assertRaises(ValueError): self.repo.save_progress('a','DEMO101',mid,-1)
        with self.assertRaises(ValueError): self.repo.save_progress('a','DEMO101',mid,10**9)
        other='UNKNOWN101:PC:1'
        with self.assertRaises(ValueError): self.repo.save_progress('a','DEMO101',other)
        eid=self.repo.enrol('a','DEMO101')
        with self.assertRaises(sqlite3.IntegrityError):
            self.repo.con.execute('INSERT INTO material_progress(enrolment_id,material_id) VALUES(?,?)',(eid,other))
    def test_public_questions_exclude_answers_and_structure(self):
        questions=self.repo.list_questions('DEMO101')
        self.assertTrue(questions)
        for q in questions:
            self.assertNotIn('model_answer',q)
            self.assertNotIn('source_json',q)
            self.assertIsNotNone(q['question_text'])
    def test_feedback_requires_marked_attempt_and_matching_student(self):
        with self.assertRaises(PermissionError): self.repo.marked_feedback_context('a','missing')
        self.repo.enrol('a','DEMO101')
        qid=self.repo.list_questions('DEMO101')[0]['question_id']
        with self.repo.con:
            self.repo.con.execute("INSERT INTO assessment_attempt VALUES(?,?,?,?,?,?,?,?,?)",('attempt','a',qid,'answer','correct','human-1','Good','2026-10-18T00:00:00Z','2026-10-17T00:00:00Z'))
        self.assertEqual(self.repo.marked_feedback_context('a','attempt')['assessor_id'],'human-1')
        with self.assertRaises(PermissionError): self.repo.marked_feedback_context('b','attempt')
        with self.assertRaises(sqlite3.IntegrityError):
            self.repo.con.execute("INSERT INTO assessment_attempt VALUES(?,?,?,?,?,?,?,?,?)",('bad','a',qid,'answer','correct','','','now','now'))
    def test_search_literal_and_unit_scoped(self):
        self.assertEqual(self.repo.search_material('DEMO101',"' OR 1=1 --"),[])
        self.assertEqual(self.repo.search_material('DEMO101',' '),[])
        rows=self.repo.search_material('DEMO101','hazard')
        self.assertTrue(rows)
        self.assertTrue(all(r['source_unit_code'] == 'DEMO101' for r in rows))
    def test_material_criterion_relationships(self):
        con=self.repo.con
        self.assertEqual(con.execute("SELECT count(*) FROM learning_material WHERE pc_number IS NOT NULL").fetchone()[0],
                         con.execute("SELECT count(*) FROM material_criterion_map").fetchone()[0] +
                         con.execute("SELECT count(*) FROM unresolved_material_criterion").fetchone()[0])
        self.assertEqual(self.report["unresolved_material_criteria"],0)

    def test_assessment_evidence_mapping_is_retained(self):
        rows=self.repo.con.execute("SELECT reference,criterion_number FROM question_criterion_map WHERE resolution='unresolved_evidence'").fetchall()
        self.assertEqual(len(rows),0)

if __name__=='__main__': unittest.main()
