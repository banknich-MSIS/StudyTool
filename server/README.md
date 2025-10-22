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

## AI-Powered Exam Generation (NEW!)

### Quick Setup (2 minutes)

1. **Get a free Gemini API key:**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key (starts with "AIza...")

2. **Configure in app:**

   - Open the app at `http://127.0.0.1:5173`
   - Go to Settings page
   - Paste your API key
   - Click "Save & Validate"

3. **Generate exams instantly:**
   - Click "AI Exam Creator" in navigation
   - Upload study files (PDF, PowerPoint, Word, images)
   - Configure exam settings (question count, difficulty, types)
   - Click "Generate Exam with AI"
   - Done! Take your exam immediately.

### Supported File Formats

- **Documents:** PDF (.pdf), Word (.docx, .doc), PowerPoint (.pptx, .ppt)
- **Images:** PNG, JPG, JPEG (with OCR)
- **Text:** Plain text (.txt), Markdown (.md)

### Free Tier Limits

**More than enough for students:**

- 1 million tokens per day (~100-150 exams)
- 60 requests per hour
- Files up to 20MB each
- **No credit card required!**

### How It Works

1. You upload study materials to the local app
2. Backend extracts text from files locally
3. Sends extracted content + your settings to Gemini API (using YOUR key)
4. Gemini returns structured exam questions in JSON
5. Backend saves questions to local SQLite database
6. You take the exam immediately - no CSV needed!

**Privacy:** Files are processed locally. Only extracted text (not files) is sent to Gemini API.

### New API Endpoints

- `POST /api/ai/validate-key` → Validate Gemini API key
- `POST /api/ai/generate-exam` → Generate exam from uploaded files
- `GET /api/ai/supported-formats` → List supported file formats

## Notes

- SQLite db file: `exam.db` (created in project root)
- Core features run locally, Gemini API is optional (CSV upload still works)
- YAKE fallback is used if KeyBERT/sentence-transformers aren't available
- Each user provides their own free Gemini API key (zero backend costs!)
