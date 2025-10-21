from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Concept, Upload
from ..schemas import ConceptOut

router = APIRouter(tags=["concepts"])


@router.get("/concepts/{upload_id}", response_model=List[ConceptOut])
def list_concepts(upload_id: int, db: Session = Depends(get_db)) -> List[ConceptOut]:
    upload = db.get(Upload, upload_id)
    if upload is None:
        raise HTTPException(status_code=404, detail="Upload not found")
    concepts = (
        db.query(Concept)
        .filter(Concept.upload_id == upload_id)
        .order_by(Concept.score.desc())
        .all()
    )
    return concepts


