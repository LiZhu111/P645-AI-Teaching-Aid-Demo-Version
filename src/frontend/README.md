# Study Companion Demo UI

The Next.js interface demonstrates a dialogue-led learning flow, speech input and playback where supported by the browser, source navigation, local progress, and synthetic feedback cases. The browser calls `/api/aita`, which starts the local Python MCP service.

Prepare the synthetic SQLite database from the repository root using `python -m database.import_data`, then run `npm install` and `npm run dev` from this directory. The local database is generated from fictional files in the repository's `data/` folder. No customer service or model endpoint is configured.

Learner accounts and reading progress are demonstration-only browser storage.
