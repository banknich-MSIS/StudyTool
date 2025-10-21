# Local Exam Builder - Backend (FastAPI)

This is the local API that powers uploads, concept extraction, question generation, and grading.

## Prerequisites (Windows)

- Python 3.11+
- PowerShell

## Setup

```bash
# From the project root
cd server

# Create venv
python -m venv .venv
. .venv/Scripts/Activate.ps1

# Install dependencies
pip install -r requirements.txt

# (Optional, for spaCy small English model)
python -m spacy download en_core_web_sm
```

## Run the API

```bash
uvicorn server.main:app --reload
```

- API will run at `http://127.0.0.1:8000`
- CORS is enabled for Vite dev server `http://127.0.0.1:5173`

## Endpoints (summary)

- POST `/api/upload/csv` → multipart CSV with columns `question,type,options,answer,concepts`
- POST `/api/upload/text` → `.txt` file; extracts concepts (KeyBERT/YAKE fallback) and auto-generates questions
- GET `/api/concepts/{uploadId}` → list concepts for an upload
- POST `/api/exams` → create an exam from filters; returns questions
- GET `/api/exams/{examId}` → fetch exam questions
- POST `/api/exams/{examId}/grade` → grade answers

## CSV Schema

- `question`: string (required)
- `type`: `mcq|multi|short|truefalse|cloze` (inferred if missing)
- `options`: pipe `|` separated values for mcq/multi
- `answer`: string (mcq/short/cloze/truefalse) or pipe-list (multi)
- `concepts`: comma separated concept names (optional)

## Notes

- SQLite db file: `exam.db` (created in project root)
- Everything runs locally, no API keys needed
- YAKE fallback is used if KeyBERT/sentence-transformers aren’t available
