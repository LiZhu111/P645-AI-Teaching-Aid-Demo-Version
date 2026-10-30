# Study Companion Demo

This package demonstrates a dialogue-led learning interface with text and voice input, read-aloud, source-linked answers, local reading progress, and synthetic post-review feedback examples.

All runnable learning and assessment content is fictional demonstration material. The original customer brief, proposal, and course/assessment source files are excluded. Project code, planning documents, frontend files, scripts, and tests are retained. No model credentials or real learner records are included.

## Run locally

Requirements: Node.js 20.9 or newer and Python 3.11 or newer.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r src/backend/requirements.txt
.venv\Scripts\python.exe -m database.import_data
cd src/frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The local MCP service reads a generated SQLite database built from the synthetic files in `data/`. No external model endpoint is configured; answer generation is shown in context-only mode.

This is a prototype demonstration. Authentication and cross-device progress are not production services.
