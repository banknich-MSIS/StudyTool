from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Attempt, AttemptAnswer, Exam as ExamModel, Question as QuestionModel, Upload
from ..schemas import ExamCreate, ExamOut, GradeItem, GradeReport, QuestionDTO, UserAnswer

router = APIRouter(tags=["exam"])


@router.post("/exams", response_model=ExamOut)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)) -> ExamOut:
    # If multiple upload IDs provided, query from all of them
    if payload.uploadIds and len(payload.uploadIds) > 1:
        # Query questions from multiple uploads
        query = db.query(QuestionModel).filter(QuestionModel.upload_id.in_(payload.uploadIds))
    else:
        # Single upload (either from uploadId or first of uploadIds)
        upload_id = payload.uploadId
        upload = db.get(Upload, upload_id)
        if upload is None:
            raise HTTPException(status_code=404, detail="Upload not found")
        query = db.query(QuestionModel).filter(QuestionModel.upload_id == upload_id)
    
    if payload.questionTypes:
        query = query.filter(QuestionModel.qtype.in_(payload.questionTypes))
    
    # Count available questions
    available_count = query.count()
    if payload.count > available_count:
        raise HTTPException(
            status_code=400, 
            detail=f"Requested {payload.count} questions but only {available_count} are available"
        )
    
    questions = query.limit(payload.count).all()

    question_ids = [q.id for q in questions]
    # Use the primary upload ID (or first one if multiple)
    primary_upload_id = payload.uploadId if not payload.uploadIds else payload.uploadIds[0]
    exam = ExamModel(upload_id=primary_upload_id, settings=payload.model_dump(), question_ids=question_ids)
    db.add(exam)
    db.commit()
    db.refresh(exam)

    dto = [
        QuestionDTO.model_validate({
            "id": q.id,
            "stem": q.stem,
            "type": q.qtype,
            "options": (q.options or {}).get("list"),
            "concepts": q.concept_ids or [],
        })
        for q in questions
    ]
    return ExamOut(examId=exam.id, questions=dto)


@router.get("/exams/{exam_id}", response_model=ExamOut)
def get_exam(exam_id: int, db: Session = Depends(get_db)) -> ExamOut:
    exam = db.get(ExamModel, exam_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    questions = (
        db.query(QuestionModel).filter(QuestionModel.id.in_(exam.question_ids)).all()
    )
    dto = [
        QuestionDTO.model_validate({
            "id": q.id,
            "stem": q.stem,
            "type": q.qtype,
            "options": (q.options or {}).get("list"),
            "concepts": q.concept_ids or [],
        })
        for q in questions
    ]
    return ExamOut(examId=exam.id, questions=dto)


@router.get("/exams/{exam_id}/preview")
def preview_exam_answers(exam_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get exam questions with correct answers for preview (does not create attempt)"""
    exam = db.get(ExamModel, exam_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    questions = (
        db.query(QuestionModel).filter(QuestionModel.id.in_(exam.question_ids)).all()
    )
    
    preview_data = []
    for q in questions:
        preview_data.append({
            "questionId": q.id,
            "correctAnswer": (q.answer or {}).get("value")
        })
    
    return {"answers": preview_data}


@router.post("/exams/{exam_id}/grade", response_model=GradeReport)
def grade_exam(
    exam_id: int, answers: List[UserAnswer], db: Session = Depends(get_db)
) -> GradeReport:
    exam = db.get(ExamModel, exam_id)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = {q.id: q for q in db.query(QuestionModel).filter(QuestionModel.id.in_(exam.question_ids)).all()}
    answers_by_qid: Dict[int, Any] = {a.questionId: a.response for a in answers}

    per_items: List[GradeItem] = []
    correct_count = 0
    for qid in exam.question_ids:
        q = questions.get(qid)
        if q is None:
            continue
        user_resp = answers_by_qid.get(qid)
        correct_answer = (q.answer or {}).get("value")
        is_correct = _check_correct(q.qtype, user_resp, correct_answer)
        per_items.append(
            GradeItem(
                questionId=qid,
                correct=is_correct,
                correctAnswer=correct_answer,
                userAnswer=user_resp,
            )
        )
        if is_correct:
            correct_count += 1

    score_pct = (correct_count / max(1, len(exam.question_ids))) * 100.0
    
    # Create attempt record
    attempt = Attempt(
        exam_id=exam_id,
        finished_at=datetime.utcnow(),
        score_pct=score_pct
    )
    db.add(attempt)
    db.flush()
    
    # Save individual answers
    for item in per_items:
        answer_record = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=item.questionId,
            response={"value": item.userAnswer},
            correct=item.correct
        )
        db.add(answer_record)
    
    db.commit()
    
    return GradeReport(
        scorePct=round(score_pct, 2), 
        perQuestion=per_items,
        attemptId=attempt.id
    )


def _normalize_text(value: Any) -> str:
    return "" if value is None else str(value).strip().lower()


def _check_correct(qtype: str, user: Any, answer: Any) -> bool:
    if qtype in ("mcq", "truefalse", "short", "cloze"):
        return _normalize_text(user) == _normalize_text(answer)
    if qtype == "multi":
        try:
            user_set = { _normalize_text(v) for v in (user or []) }
            ans_set = { _normalize_text(v) for v in (answer or []) }
            return user_set == ans_set
        except Exception:
            return False
    return False


@router.post("/attempts/{attempt_id}/questions/{question_id}/override")
def override_question_grade(
    attempt_id: int,
    question_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Override the grade for a specific question in an attempt"""
    attempt = db.get(Attempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Find the answer record
    answer_record = (
        db.query(AttemptAnswer)
        .filter(
            AttemptAnswer.attempt_id == attempt_id,
            AttemptAnswer.question_id == question_id
        )
        .first()
    )
    
    if answer_record is None:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Toggle the correct status
    answer_record.correct = not answer_record.correct
    
    # Recalculate overall score
    all_answers = (
        db.query(AttemptAnswer)
        .filter(AttemptAnswer.attempt_id == attempt_id)
        .all()
    )
    
    correct_count = sum(1 for ans in all_answers if ans.correct)
    total_count = len(all_answers)
    new_score_pct = (correct_count / max(1, total_count)) * 100.0
    
    attempt.score_pct = new_score_pct
    
    db.commit()
    
    return {
        "success": True,
        "new_status": answer_record.correct,
        "new_score_pct": round(new_score_pct, 2)
    }


