PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY CHECK(version=1));
INSERT OR IGNORE INTO schema_version VALUES(1);
CREATE TABLE IF NOT EXISTS source_record(
 source_file TEXT NOT NULL, row_number INTEGER NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 PRIMARY KEY(source_file,row_number));
CREATE TABLE IF NOT EXISTS qualification(
 qualification_code TEXT PRIMARY KEY, name TEXT NOT NULL, release TEXT,
 nominal_hours INTEGER, description TEXT, source_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS unit(
 unit_code TEXT PRIMARY KEY, name TEXT NOT NULL, release TEXT,
 nominal_hours INTEGER, unit_descriptor TEXT, source_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS unit_alias(
 source_unit_code TEXT PRIMARY KEY REFERENCES unit(unit_code),
 canonical_unit_code TEXT NOT NULL REFERENCES unit(unit_code));
CREATE TABLE IF NOT EXISTS qualification_unit(
 qualification_code TEXT NOT NULL REFERENCES qualification(qualification_code),
 unit_code TEXT NOT NULL REFERENCES unit(unit_code),is_core INTEGER NOT NULL CHECK(is_core IN(0,1)),
 PRIMARY KEY(qualification_code,unit_code));
CREATE TABLE IF NOT EXISTS performance_criterion(
 unit_code TEXT NOT NULL REFERENCES unit(unit_code), criterion_number INTEGER NOT NULL,
 criterion_text TEXT NOT NULL,module_release TEXT,
 PRIMARY KEY(unit_code,criterion_number));
CREATE TABLE IF NOT EXISTS learning_material(
 material_id TEXT PRIMARY KEY, unit_code TEXT NOT NULL REFERENCES unit(unit_code),
 sequence INTEGER NOT NULL,material_type TEXT NOT NULL,
 pc_number INTEGER,pc_variant INTEGER NOT NULL,title TEXT NOT NULL,
 content_text TEXT,content_html TEXT,source_format TEXT,source_version TEXT,
 UNIQUE(unit_code,sequence,material_type,pc_number,pc_variant));
CREATE INDEX IF NOT EXISTS material_order ON learning_material(unit_code,sequence,material_type);
CREATE TABLE IF NOT EXISTS assessment_question(
 question_id TEXT PRIMARY KEY,unit_code TEXT NOT NULL REFERENCES unit(unit_code),
 assessment_number INTEGER NOT NULL,section_number INTEGER NOT NULL,question_number INTEGER NOT NULL,
 question_type TEXT,structural INTEGER NOT NULL CHECK(structural IN(0,1)),
 question_text TEXT CHECK(structural=1 OR question_text IS NOT NULL),options_json TEXT NOT NULL CHECK(json_valid(options_json)),
 model_answer TEXT,mapping_raw TEXT,evidence_json TEXT,
 UNIQUE(unit_code,assessment_number,section_number,question_number));
CREATE TABLE IF NOT EXISTS question_criterion_map(
 question_id TEXT NOT NULL REFERENCES assessment_question(question_id),reference TEXT NOT NULL,
 unit_code TEXT,criterion_number INTEGER,resolution TEXT NOT NULL,
 PRIMARY KEY(question_id,reference),
 CHECK((unit_code IS NULL)=(criterion_number IS NULL)),
 FOREIGN KEY(unit_code,criterion_number) REFERENCES performance_criterion(unit_code,criterion_number));
CREATE TABLE IF NOT EXISTS foundation_framework(
 framework_id TEXT PRIMARY KEY,framework TEXT NOT NULL,skill_key TEXT,skill_name TEXT,
 cluster TEXT,level TEXT,stage_name TEXT,indicator_code TEXT,indicator_text TEXT,
 task_complexity TEXT,source TEXT);
CREATE TABLE IF NOT EXISTS student(
 student_id TEXT PRIMARY KEY,display_name TEXT,
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS unit_enrolment(
 enrolment_id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES student(student_id),
 unit_code TEXT NOT NULL REFERENCES unit(unit_code),status TEXT NOT NULL DEFAULT 'active'
 CHECK(status IN('active','paused','completed')),
 started_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(student_id,unit_code));
CREATE TABLE IF NOT EXISTS material_progress(
 enrolment_id TEXT NOT NULL REFERENCES unit_enrolment(enrolment_id),
 material_id TEXT NOT NULL REFERENCES learning_material(material_id),
 last_position INTEGER NOT NULL DEFAULT 0 CHECK(last_position>=0),
 position_kind TEXT NOT NULL DEFAULT 'text_character' CHECK(position_kind IN('text_character','audio_millisecond')),
 completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN(0,1)),
 updated_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(enrolment_id,material_id));
CREATE TRIGGER IF NOT EXISTS progress_unit_insert BEFORE INSERT ON material_progress
WHEN (SELECT canonical_unit_code FROM unit_alias WHERE source_unit_code=(SELECT unit_code FROM unit_enrolment WHERE enrolment_id=NEW.enrolment_id))
 != (SELECT canonical_unit_code FROM unit_alias WHERE source_unit_code=(SELECT unit_code FROM learning_material WHERE material_id=NEW.material_id))
BEGIN SELECT RAISE(ABORT,'Material does not belong to enrolled unit'); END;
CREATE TRIGGER IF NOT EXISTS progress_unit_update BEFORE UPDATE ON material_progress
WHEN (SELECT canonical_unit_code FROM unit_alias WHERE source_unit_code=(SELECT unit_code FROM unit_enrolment WHERE enrolment_id=NEW.enrolment_id))
 != (SELECT canonical_unit_code FROM unit_alias WHERE source_unit_code=(SELECT unit_code FROM learning_material WHERE material_id=NEW.material_id))
BEGIN SELECT RAISE(ABORT,'Material does not belong to enrolled unit'); END;
CREATE TABLE IF NOT EXISTS assessment_attempt(
 attempt_id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES student(student_id),
 question_id TEXT NOT NULL REFERENCES assessment_question(question_id),student_answer TEXT NOT NULL,
 human_marked_status TEXT NOT NULL CHECK(human_marked_status IN('correct','incorrect')),
 assessor_id TEXT NOT NULL CHECK(length(trim(assessor_id))>0),assessor_feedback TEXT,
 marked_at TEXT NOT NULL,attempted_at TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS attempt_question_insert BEFORE INSERT ON assessment_attempt
WHEN (SELECT structural FROM assessment_question WHERE question_id=NEW.question_id)!=0
BEGIN SELECT RAISE(ABORT,'Structural records are not assessment questions'); END;
CREATE TRIGGER IF NOT EXISTS attempt_question_update BEFORE UPDATE ON assessment_attempt
WHEN (SELECT structural FROM assessment_question WHERE question_id=NEW.question_id)!=0
BEGIN SELECT RAISE(ABORT,'Structural records are not assessment questions'); END;
CREATE TABLE IF NOT EXISTS chat_session(
 session_id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES student(student_id),
 unit_code TEXT REFERENCES unit(unit_code),started_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS chat_message(
 message_id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES chat_session(session_id),
 role TEXT NOT NULL CHECK(role IN('student','assistant')),
 message_text TEXT NOT NULL,input_mode TEXT NOT NULL CHECK(input_mode IN('text','voice')),
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS message_source(
 message_id TEXT NOT NULL REFERENCES chat_message(message_id),
 material_id TEXT NOT NULL REFERENCES learning_material(material_id),
 source_rank INTEGER NOT NULL CHECK(source_rank>0),relevance_score REAL,
 PRIMARY KEY(message_id,material_id));
CREATE VIEW IF NOT EXISTS learner_question AS
 SELECT question_id,unit_code,assessment_number,section_number,question_number,
 question_type,question_text,options_json FROM assessment_question WHERE structural=0;
CREATE VIEW IF NOT EXISTS readable_material AS
 SELECT m.*,a.canonical_unit_code FROM learning_material m JOIN unit_alias a
 ON m.unit_code=a.source_unit_code WHERE length(trim(coalesce(content_text,'')))>0;
CREATE VIEW IF NOT EXISTS material_criterion_map AS
 SELECT m.material_id,p.unit_code,p.criterion_number,
 CASE WHEN p.unit_code=m.unit_code THEN 'exact' ELSE 'white_card_alias' END AS resolution
 FROM learning_material m
 JOIN unit_alias ma ON ma.source_unit_code=m.unit_code
 JOIN performance_criterion p ON p.criterion_number=m.pc_number
 JOIN unit_alias pa ON pa.source_unit_code=p.unit_code AND pa.canonical_unit_code=ma.canonical_unit_code
 WHERE p.unit_code=m.unit_code OR NOT EXISTS(
 SELECT 1 FROM performance_criterion exact WHERE exact.unit_code=m.unit_code AND exact.criterion_number=m.pc_number);
CREATE VIEW IF NOT EXISTS unresolved_material_criterion AS
 SELECT m.material_id,m.unit_code,m.pc_number,m.title FROM learning_material m
 WHERE m.pc_number IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM material_criterion_map resolved WHERE resolved.material_id=m.material_id);
