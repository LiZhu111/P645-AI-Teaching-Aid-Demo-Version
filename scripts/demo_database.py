"""Read-only demo. Run from the project root with python -m scripts.demo_database."""
from database.repository import AitaRepository

repo=AitaRepository()
try:
    units=repo.list_units()
    print('Logical units:',len(units))
    items=repo.list_materials('DEMO101')
    print('Readable demo course items:',len(items))
    for r in items[:5]: print(r['material_id'],r['source_unit_code'],r['sequence'],r['title'])
    print('Search results for hazard:',len(repo.search_material('DEMO101','hazard')))
    questions=repo.list_questions('DEMO101')
    print('demo course questions:',len(questions))
    print('Learner question fields:',list(questions[0]))
finally:
    repo.close()
