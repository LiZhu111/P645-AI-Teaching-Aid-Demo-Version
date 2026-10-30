"""Verify the database feeds the existing reading, progress and retrieval contracts."""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src/backend'))
from database.import_data import import_data
from aita.corpus import load_corpus
from aita.sqlite_corpus import load_sqlite_corpus
from aita.retrieval import BM25Retriever


@pytest.fixture(scope='module')
def database_corpus(tmp_path_factory):
    path = tmp_path_factory.mktemp('course') / 'aita.db'
    import_data(path)
    return load_sqlite_corpus(path)


def test_all_materials_preserve_existing_progress_ids_and_text(database_corpus):
    original = load_corpus(ROOT / 'data')
    assert database_corpus.items.keys() == original.items.keys()
    assert len(database_corpus.units) == 8
    for code in original.units:
        assert [i.item_id for i in database_corpus.items_for_unit(code)] == [i.item_id for i in original.items_for_unit(code)]
    for key, item in database_corpus.items.items():
        assert item.text == original.items[key].text
        assert item.database_id.startswith('mat_')
    assert len({i.database_id for i in database_corpus.items.values()}) == 1091
    assert len(database_corpus.items_for_unit('DEMO101')) == 166


def test_database_text_drives_reading_and_search(tmp_path):
    import sqlite3
    path = tmp_path / 'course.db'
    import_data(path)
    with sqlite3.connect(path) as con:
        con.execute("UPDATE learning_material SET content_text='Distinctive zirconium scaffold demonstration.' WHERE unit_code='DEMO101' AND sequence=1 AND material_type='ELEMENT'")
        # Choose a guaranteed readable row independently of the supplied fixture's first type.
        row = con.execute("SELECT material_id FROM learning_material WHERE content_text IS NOT NULL LIMIT 1").fetchone()
        con.execute("UPDATE learning_material SET content_text='Distinctive zirconium scaffold demonstration.' WHERE material_id=?", row)
    corpus = load_sqlite_corpus(path)
    item = next(i for i in corpus.items.values() if i.database_id == row[0])
    assert item.text == 'Distinctive zirconium scaffold demonstration.'
    hits = BM25Retriever(corpus).search('zirconium', unit_code=item.unit_code).hits
    assert any(hit.chunk.item_id == item.item_id for hit in hits)


def test_sqlite_mcp_materials_and_source_links(database_corpus, monkeypatch):
    from aita import server
    monkeypatch.setattr(server, 'corpus', database_corpus)
    monkeypatch.setattr(server, 'retriever', BM25Retriever(database_corpus))
    monkeypatch.setattr(server, '_generate', lambda *args: (None, 'no_model_configured'))
    outline = server.get_unit_outline('DEMO101')
    first = outline['reading_order'][0]
    item = server.get_material('DEMO101', item_id=first['database_id'])
    assert item['item_id'] == first['item_id']
    assert item['speech_segments']
    result = server.explain_concept('What are the different types of hazard?', unit_code='DEMO101')
    assert result['source_materials']
    for source in result['source_materials']:
        assert server.get_material(source['unit_code'], item_id=source['item_id'])['text']
    assert 'error' in server.get_material('UNKNOWN101', item_id=first['database_id'])


def test_missing_database_does_not_fall_back_or_create_file(tmp_path):
    path = tmp_path / 'missing.db'
    with pytest.raises(FileNotFoundError):
        load_sqlite_corpus(path)
    assert not path.exists()
