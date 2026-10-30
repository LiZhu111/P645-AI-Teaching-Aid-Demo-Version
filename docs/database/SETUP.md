# Aita Database Setup

This document describes the SQLite database implementation for Project Aita.

The database imports the eight supplied course data files and supports learning-material access, question mappings and learner progress. It follows the draft ERD, with additional tables for source preservation, unit aliases and foundation framework data.

## Implementation status

- SQL schema and repeatable data importer implemented.
- Python data-access methods and local demonstration implemented.
- All eight source files imported and checked.
- 11 automated database tests passed against the supplied data snapshot.
- Backend/MCP and frontend integration remain to be completed and tested against the team's current branches.

SQLite is the local MVP database. The industry partner's MySQL platform is separate. This implementation does not connect to or change that platform.

## Repository structure

Paths below are relative to the repository root:

```text
data/
  qualification.csv
  units.csv
  performance_criteria.csv
  delivery_material_index.csv
  delivery_material_text.jsonl
  delivery_material_html.jsonl
  assessment_questions.jsonl
  foundation_framework.csv
database/
  __init__.py
  schema.sql
  import_data.py
  repository.py
  example_queries.sql
scripts/
  demo_database.py
tests/
  test_database.py
docs/database/
  SETUP.md
  INTEGRATION.md
  IMPORT_REPORT.json
  TEST_RESULTS.md
```

`database/aita.db` is generated locally and should not be committed. The source data already present in `data/` can be reused.

## Requirements

- Python 3.10 or newer.
- Python's built-in SQLite library with JSON support.
- No third-party Python packages are required for the database component.

## Setup on Windows

Open the **repository root** in VS Code, then select **Terminal > New Terminal**. Run all commands from the root, not from `docs/database/`.

### 1. Create and populate the database

```powershell
py -3 -m database.import_data
```

This creates `database/aita.db` from the source files in `data/`. It prints record counts, mapping-resolution counts and integrity checks.

A successful import reports `integrity_check: "ok"` and `foreign_key_errors: []`. Unresolved source mappings are recorded separately for review.

### 2. Run the read-only demonstration

```powershell
py -3 -m scripts.demo_database
```

The demonstration lists logical units, White Card materials, sample material IDs and basic search results. It does not create learner records.

### 3. Run the tests

```powershell
py -3 -m unittest discover -s tests -v
```

The supplied implementation contains 11 tests. A successful run ends with `Ran 11 tests` and `OK`. Tests use temporary databases and do not modify the local application database.

If the Windows Python launcher is unavailable, replace `py -3` with `python`. On macOS/Linux, use `python3`.

### Optional: choose database and data locations

```powershell
py -3 -m database.import_data --db database/aita.db --data data
```

The repository adapter defaults to `database/aita.db`. If using another location, pass it explicitly when constructing `AitaRepository`.

## Inspect the database

Open `database/aita.db` in DB Browser for SQLite or an SQLite extension in VS Code. Browse the tables or run the examples in `database/example_queries.sql`.

The schema uses SQLite syntax. It requires adaptation before use with MySQL or SQL Server.

## Imported source snapshot

| Item | Count |
|---|---:|
| Qualification | 1 |
| Source unit codes | 9 |
| Logical units after White Card grouping | 8 |
| Criterion, evidence and condition records | 485 |
| Learning-material catalogue records | 1,091 |
| Readable material records | 630 |
| Material records without supplied plain text | 461 |
| Assessment records | 657 |
| Actual assessment questions | 482 |
| Structural assessment records | 175 |
| Foundation framework records | 105 |
| Preserved original source rows | 4,069 |

These counts describe the supplied snapshot. They may change when the source dataset changes, at which point the snapshot-specific tests and report should be reviewed.

## Database design decisions

### Material IDs

Materials use stable deterministic IDs based on the complete source identity:

```text
unitCode + sequence + type + pcNumber + pcVariant
```

Unit code and sequence alone are insufficient because slides and other content can share a sequence. The importer joins the index, text and HTML using the complete identity. See [INTEGRATION.md](INTEGRATION.md) for the exact ID-generation contract.

### White Card aliases

`CPCCWHS1001` and `CPCWHS1001` are grouped for study access through `unit_alias`. Both original codes and their separate source content remain intact. The snapshot contains 166 readable White Card materials and 108 actual White Card questions.

### Assessment records

Structural headings and instructions remain stored but are excluded from the learner question view. Learner-facing methods omit model answers. Assessment-attempt records require a human marking decision and assessor identifier. Aita does not grade answers or decide competency.

### Learner progress

Progress links an enrolment to a stable material ID. It records the last position, position type, completion flag and update time. Completion refers to studying content, not competency. Character offsets and audio milliseconds are explicitly distinguished.

Student, enrolment, progress, assessment-attempt and chat tables initially contain no learner activity. Backend authentication and authorisation must be implemented before connecting real users.

## Reimport behaviour

Rerun the import command to update source content. Reimport preserves learner records and stable material IDs when source identity fields remain unchanged.

It does not delete old content rows when records disappear from the source files. This avoids silently breaking saved progress. A future migration must define content retirement and versioning. Original source snapshots in `source_record` update to the latest imported files.

Schema version 1 uses `CREATE TABLE IF NOT EXISTS`. Future changes to existing columns require explicit migrations. Do not delete a database containing learner progress merely to update its schema.

## Remaining integration work

- Confirm SQLite as the agreed local MVP store.
- Align generated material IDs with IDs already used by the frontend and Ryan's backend.
- Connect the data-access methods to the actual MCP/backend implementation.
- Agree authenticated learner identities, assessor permissions and progress-position conventions.
- Confirm which White Card source versions should appear in the interface.
- Resolve 700 knowledge/performance-evidence mapping references and 24 irregular assessment references retained by the importer.
- Review 18 material records whose criterion heading numbers are absent from the supplied criterion table.
- Test the connected learner workflow, safe feedback and cross-user access in the integration branch.

See [INTEGRATION.md](INTEGRATION.md) for the detailed handover and [IMPORT_REPORT.json](IMPORT_REPORT.json) for the measured import results.

## Access and content handling

Keep the database, raw question banks and model answers server-side. SQLite views are convenient projections, not access-control boundaries. The backend must verify learner access and the identity of human assessors.

The repository adapter's keyword search demonstrates data access. It does not replace the existing AI retrieval, generation or grounding checks. Stored HTML must be sanitised before rendering. Referenced media files are not included in the supplied source archive.

## Git guidance

Commit the SQL schema, Python source files, tests and documentation. Keep existing source data if unchanged. Add these rules to the repository's existing `.gitignore`:

```gitignore
*.db
*.db-journal
*.db-wal
*.db-shm
__pycache__/
*.pyc
```

If any of these generated files are already tracked, `.gitignore` alone will not untrack them. Review tracked files before committing.

Suggested commit message:

```text
Add SQLite database schema, importer, progress storage and setup documentation
```
