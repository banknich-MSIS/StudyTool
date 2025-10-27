from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Attempt, AttemptAnswer, Exam, Question, Upload
from ..schemas import (
    AttemptDetail,
    AttemptSummary,
    QuestionDTO,
    QuestionReview,
    UploadSummary,
)

router = APIRouter(tags=["dashboard"])


@router.get("/debug/routes")
def debug_routes():
    """Debug endpoint to see all registered routes"""
    routes_info = []
    for route in router.routes:
        routes_info.append({
            "path": route.path,
            "methods": list(route.methods) if hasattr(route, 'methods') else [],
            "name": route.name
        })
    return {"routes": routes_info}


@router.get("/uploads", response_model=List[UploadSummary])
def get_all_uploads(db: Session = Depends(get_db)) -> List[UploadSummary]:
    """Return all uploaded CSVs with question counts and metadata"""
    uploads = db.query(Upload).order_by(Upload.created_at.desc()).all()
    
    result = []
    for upload in uploads:
        # Extract themes from concepts
        themes = []
        if upload.concepts:
            themes = [concept.name for concept in upload.concepts]
        
        # Parse metadata if available
        metadata = {}
        if hasattr(upload, 'metadata_json') and upload.metadata_json:
            try:
                import json
                metadata = json.loads(upload.metadata_json)
                if 'themes' in metadata:
                    themes = metadata['themes']
            except (json.JSONDecodeError, KeyError):
                pass
        
        # Get class tags
        class_tags = [cls.name for cls in upload.classes] if upload.classes else []
        
        # Calculate question type counts
        question_type_counts = {}
        for question in upload.questions:
            qtype = question.qtype
            question_type_counts[qtype] = question_type_counts.get(qtype, 0) + 1
        
        result.append(
            UploadSummary(
                id=upload.id,
                filename=upload.filename,
                created_at=upload.created_at,
                question_count=len(upload.questions),
                themes=themes,
                exam_count=len(upload.exams),
                file_type=upload.file_type,
                class_tags=class_tags,
                question_type_counts=question_type_counts if question_type_counts else None,
            )
        )
    
    return result


@router.get("/attempts/recent", response_model=List[AttemptSummary])
def get_recent_attempts(limit: int = 10, db: Session = Depends(get_db)) -> List[AttemptSummary]:
    """Return recent exam attempts with scores"""
    attempts = (
        db.query(Attempt)
        .filter(Attempt.finished_at.isnot(None))
        .order_by(Attempt.finished_at.desc())
        .limit(limit)
        .all()
    )
    
    result = []
    for attempt in attempts:
        exam = db.get(Exam, attempt.exam_id)
        if not exam:
            continue
            
        upload = db.get(Upload, exam.upload_id)
        if not upload:
            continue
        
        # Count correct answers
        correct_count = 0
        if attempt.answers:
            correct_count = sum(1 for answer in attempt.answers if answer.correct)
        
        result.append(
            AttemptSummary(
                id=attempt.id,
                exam_id=attempt.exam_id,
                upload_filename=upload.filename,
                score_pct=attempt.score_pct or 0.0,
                finished_at=attempt.finished_at or attempt.started_at,
                question_count=len(exam.question_ids),
                correct_count=correct_count,
            )
        )
    
    return result


@router.delete("/attempts/delete/{attempt_id}")
def delete_attempt(attempt_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Delete an exam attempt and its answers"""
    attempt = db.get(Attempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Delete all answers first
    db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt_id).delete()
    
    # Delete the attempt
    db.delete(attempt)
    db.commit()
    
    return {"success": True}


@router.get("/attempts/{attempt_id}", response_model=AttemptDetail)
def get_attempt_detail(attempt_id: int, db: Session = Depends(get_db)) -> AttemptDetail:
    """Return full attempt details for review"""
    attempt = db.get(Attempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    exam = db.get(Exam, attempt.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get all questions for this exam (maintain order from exam.question_ids)
    questions_query = (
        db.query(Question)
        .filter(Question.id.in_(exam.question_ids))
        .all()
    )
    
    # Create a lookup and maintain order
    question_lookup = {q.id: q for q in questions_query}
    questions = [question_lookup[qid] for qid in exam.question_ids if qid in question_lookup]
    
    # Get all answers for this attempt
    answers = (
        db.query(AttemptAnswer)
        .filter(AttemptAnswer.attempt_id == attempt_id)
        .all()
    )
    
    # Create answer lookup
    answer_lookup = {answer.question_id: answer for answer in answers}
    
    # Build question reviews
    question_reviews = []
    for question in questions:
        answer = answer_lookup.get(question.id)
        
        # Extract options from the JSON structure
        options_data = None
        if question.options and isinstance(question.options, dict):
            options_data = question.options.get("list", [])
        
        # Explicitly construct QuestionDTO with proper type
        question_dto = QuestionDTO.model_validate({
            "id": question.id,
            "stem": question.stem,
            "type": question.qtype,
            "options": options_data if options_data else None,
            "concepts": question.concept_ids if question.concept_ids else [],
        })
        
        question_reviews.append(
            QuestionReview(
                question=question_dto,
                user_answer=answer.response.get("value") if answer and answer.response else None,
                correct_answer=(question.answer or {}).get("value"),
                is_correct=answer.correct if answer else False,
            )
        )
    
    return AttemptDetail(
        id=attempt.id,
        exam_id=attempt.exam_id,
        score_pct=attempt.score_pct or 0.0,
        finished_at=attempt.finished_at or attempt.started_at,
        questions=question_reviews,
    )


@router.delete("/uploads/{upload_id}")
def delete_upload(upload_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Delete CSV and all associated data"""
    upload = db.get(Upload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Cascade deletes will handle related data
    db.delete(upload)
    db.commit()
    
    return {"success": True}


@router.patch("/uploads/{upload_id}")
def update_upload_name(upload_id: int, new_name: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Update the filename of an upload"""
    upload = db.get(Upload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    upload.filename = new_name
    db.commit()
    
    return {"success": True, "filename": new_name}


@router.get("/uploads/{upload_id}/download")
def download_csv(upload_id: int, db: Session = Depends(get_db)):
    """Download the original CSV file"""
    upload = db.get(Upload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # For now, return a placeholder response
    # In a real implementation, you'd read the actual file from storage
    from fastapi.responses import Response
    
    content = f"# Placeholder CSV download for {upload.filename}\n"
    content += "# In a real implementation, this would be the actual CSV content\n"
    
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={upload.filename}"}
    )
