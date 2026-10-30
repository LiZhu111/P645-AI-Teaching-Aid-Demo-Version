"""Python service adapter. The calling backend MUST authenticate and authorise users."""
import json
from pathlib import Path
import sqlite3
from uuid import uuid4

DEFAULT_DB = Path(__file__).with_name('aita.db')

class AitaRepository:
    def __init__(self, path=DEFAULT_DB):
        path=Path(path)
        if not path.is_file(): raise FileNotFoundError('Run python -m database.import_data first')
        self.con=sqlite3.connect(path)
        self.con.row_factory=sqlite3.Row
        self.con.execute('PRAGMA foreign_keys=ON')

    def close(self):
        self.con.close()

    def _rows(self,sql,args=()):
        return [dict(r) for r in self.con.execute(sql,args)]

    def _canonical(self,code):
        r=self.con.execute('SELECT canonical_unit_code FROM unit_alias WHERE source_unit_code=?',(code,)).fetchone()
        if r is None: raise ValueError('Unknown unit')
        return r[0]

    def list_units(self):
        """8 logical units; both demo course source codes remain available as aliases."""
        rows=self._rows('''SELECT u.unit_code,u.name FROM unit u JOIN unit_alias a
          ON u.unit_code=a.source_unit_code WHERE a.canonical_unit_code=u.unit_code ORDER BY u.unit_code''')
        for r in rows:
            r['source_codes']=[a[0] for a in self.con.execute('SELECT source_unit_code FROM unit_alias WHERE canonical_unit_code=? ORDER BY source_unit_code',(r['unit_code'],))]
        return rows

    def list_materials(self,unit_code,readable_only=True):
        table='readable_material' if readable_only else 'learning_material'
        return self._rows(f'''SELECT m.material_id,m.unit_code AS source_unit_code,m.sequence,
          m.material_type,m.pc_number,m.pc_variant,m.title,
          length(coalesce(m.content_text,'')) AS text_length
          FROM {table} m JOIN unit_alias a ON m.unit_code=a.source_unit_code
          WHERE a.canonical_unit_code=? ORDER BY m.sequence,m.material_type,m.unit_code,m.material_id''',(self._canonical(unit_code),))

    def get_material(self,material_id):
        r=self.con.execute('''SELECT material_id,unit_code AS source_unit_code,sequence,material_type,
            pc_number,pc_variant,title,content_text FROM learning_material WHERE material_id=?''',(material_id,)).fetchone()
        if r is None: raise KeyError(material_id)
        return dict(r)

    def search_material(self,unit_code,query,limit=5):
        """Literal keyword substring search only. Results do not imply answer correctness."""
        if not query.strip(): return []
        if type(limit) is not int or not 1<=limit<=50: raise ValueError('limit must be 1..50')
        return self._rows('''SELECT m.material_id,m.unit_code AS source_unit_code,m.title,m.content_text
          FROM readable_material m WHERE m.canonical_unit_code=?
          AND (instr(lower(m.content_text),lower(?))>0 OR instr(lower(m.title),lower(?))>0)
          ORDER BY m.sequence,m.material_type,m.unit_code,m.material_id LIMIT ?''',
          (self._canonical(unit_code),query.strip(),query.strip(),limit))

    def enrol(self,student_id,unit_code,display_name=None):
        if not isinstance(student_id,str) or not student_id.strip(): raise ValueError('student_id required')
        code=self._canonical(unit_code)
        with self.con:
            self.con.execute('INSERT INTO student(student_id,display_name) VALUES(?,?) ON CONFLICT(student_id) DO NOTHING',(student_id,display_name))
            self.con.execute('INSERT INTO unit_enrolment(enrolment_id,student_id,unit_code) VALUES(?,?,?) ON CONFLICT(student_id,unit_code) DO NOTHING',(str(uuid4()),student_id,code))
        return self.con.execute('SELECT enrolment_id FROM unit_enrolment WHERE student_id=? AND unit_code=?',(student_id,code)).fetchone()[0]

    def save_progress(self,student_id,unit_code,material_id,last_position=0,completed=False,position_kind='text_character'):
        # student_id must come from verified backend identity, never an untrusted request field.
        if type(last_position) is not int or last_position<0: raise ValueError('Position must be a nonnegative integer')
        if type(completed) is not bool: raise ValueError('completed must be boolean')
        if position_kind not in ('text_character','audio_millisecond'): raise ValueError('Unknown position unit')
        material=self.get_material(material_id)
        if self._canonical(material['source_unit_code'])!=self._canonical(unit_code): raise ValueError('Wrong unit')
        if position_kind=='text_character' and last_position>len(material['content_text'] or ''): raise ValueError('Position exceeds text length')
        r=self.con.execute('SELECT enrolment_id FROM unit_enrolment WHERE student_id=? AND unit_code=?',(student_id,self._canonical(unit_code))).fetchone()
        if r is None: raise ValueError('Learner is not enrolled')
        with self.con:
            self.con.execute('''INSERT INTO material_progress(enrolment_id,material_id,last_position,position_kind,completed)
              VALUES(?,?,?,?,?) ON CONFLICT(enrolment_id,material_id) DO UPDATE SET last_position=excluded.last_position,
              position_kind=excluded.position_kind,completed=excluded.completed,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')''',
              (r[0],material_id,last_position,position_kind,int(completed)))

    def get_progress(self,student_id,unit_code):
        return self._rows('''SELECT p.material_id,p.last_position,p.position_kind,p.completed,p.updated_at
          FROM material_progress p JOIN unit_enrolment e USING(enrolment_id)
          WHERE e.student_id=? AND e.unit_code=? ORDER BY p.material_id''',(student_id,self._canonical(unit_code)))

    def list_questions(self,unit_code):
        # Explicit projection prevents model answers and raw source records leaking into learner responses.
        return self._rows('''SELECT q.* FROM learner_question q JOIN unit_alias a ON q.unit_code=a.source_unit_code
          WHERE a.canonical_unit_code=? ORDER BY q.unit_code,q.assessment_number,q.section_number,q.question_number''',(self._canonical(unit_code),))

    def marked_feedback_context(self,student_id,attempt_id):
        """Server-internal only: model answer after a recorded human decision for this learner.

        Backend must verify assessor identity when writing attempts. This method is not an API route.
        """
        r=self.con.execute('''SELECT a.attempt_id,a.student_answer,a.human_marked_status,
          a.assessor_id,a.assessor_feedback,q.question_id,q.question_text,q.model_answer,q.mapping_raw
          FROM assessment_attempt a JOIN assessment_question q USING(question_id)
          WHERE a.attempt_id=? AND a.student_id=? AND q.structural=0''',(attempt_id,student_id)).fetchone()
        if r is None: raise PermissionError('No human-marked attempt for this learner')
        return dict(r)
