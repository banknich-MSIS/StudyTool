from __future__ import annotations

import io
from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Concept, Question, Upload
from ..services.csv_parser import normalize_csv
from ..services.text_ingest import split_sentences
from ..services.concepts import extract_concepts
from ..services.question_gen import generate_cloze_questions, generate_mcq_from_concepts

router = APIRouter(tags=["files"])


@router.post("/upload/csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {exc}") from exc

    upload = Upload(filename=file.filename, file_type="csv")
    db.add(upload)
    db.commit()
    db.refresh(upload)

    normalized, warnings, metadata = normalize_csv(df)

    # Upsert concepts by name for this upload
    name_to_concept: dict[str, Concept] = {}
    def _get_concept_id(name: str) -> int:
        key = name.strip().lower()
        if not key:
            return 0
        if key in name_to_concept:
            return name_to_concept[key].id
        existing = (
            db.query(Concept)
            .filter(Concept.upload_id == upload.id, Concept.name == name)
            .first()
        )
        if existing is None:
            existing = Concept(upload_id=upload.id, name=name, score=1.0)
            db.add(existing)
            db.commit()
            db.refresh(existing)
        name_to_concept[key] = existing
        return existing.id

    # Insert questions
    q_count = 0
    for item in normalized:
        concept_ids: List[int] = []
        for c in item.get("concepts", []) or []:
            cid = _get_concept_id(c)
            if cid:
                concept_ids.append(cid)
        q = Question(
            upload_id=upload.id,
            stem=item["stem"],
            qtype=item["qtype"],
            options=item.get("options"),
            answer=item.get("answer"),
            concept_ids=concept_ids or None,
        )
        db.add(q)
        q_count += 1
    db.commit()

    stats = {"rows": len(df), "columns": list(df.columns), "questions": q_count, "warnings": warnings, "metadata": metadata}
    return {"uploadId": upload.id, "stats": stats}


# Text upload disabled - focusing on CSV workflow with Gemini integration
# @router.post("/upload/text")
# async def upload_text(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
# ) -> Dict[str, Any]:
#     if not (file.filename.lower().endswith(".txt") or (file.content_type or "").startswith("text")):
#         raise HTTPException(status_code=400, detail="Please upload a text (.txt) file")
#
#     content_bytes = await file.read()
#     text = content_bytes.decode("utf-8", errors="ignore")
#
#     upload = Upload(filename=file.filename, file_type="text")
#     db.add(upload)
#     db.commit()
#     db.refresh(upload)
#
#     sentences = split_sentences(text)
#     concepts_scored = extract_concepts(text, top_k=25)
#
#     # Persist concepts
#     term_to_id: dict[str, int] = {}
#     for term, score in concepts_scored:
#         c = Concept(upload_id=upload.id, name=term, score=float(score))
#         db.add(c)
#         db.flush()
#         term_to_id[term] = c.id
#     db.commit()
#
#     # Generate questions
#     cloze_q = generate_cloze_questions(sentences, concepts_scored, max_q=20)
#     mcq_q = generate_mcq_from_concepts(concepts_scored, num_options=4, max_q=20)
#     generated = cloze_q + mcq_q
#
#     q_count = 0
#     for item in generated:
#         # Map concept terms to ids when possible
#         concept_ids: List[int] = []
#         for term in item.get("concepts", []) or []:
#             cid = term_to_id.get(term)
#             if cid:
#                 concept_ids.append(cid)
#         q = Question(
#             upload_id=upload.id,
#             stem=item["stem"],
#             qtype=item["qtype"],
#             options=item.get("options"),
#             answer=item.get("answer"),
#             concept_ids=concept_ids or None,
#         )
#         db.add(q)
#         q_count += 1
#     db.commit()
#
#     stats = {"sentences": len(sentences), "concepts": len(concepts_scored), "questions": q_count}
#     return {"uploadId": upload.id, "stats": stats}


