# Local MCP demo service

The service exposes separate tools for listing the demo unit, reading its outline and materials, searching lesson text, explaining a question from retrieved lesson content, and presenting synthetic feedback after a simulated human review. It does not make real assessment decisions.

## Run

From the repository root, prepare the database with `python -m database.import_data`. Then start the frontend from `src/frontend` with `npm run dev`; its local Node route starts this MCP service over stdio.

The content lives in `data/` and is fictional sample material. Without model environment variables, answer actions remain in context-only demonstration mode. Do not add customer credentials or source materials to this package.
