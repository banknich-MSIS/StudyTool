from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Exam as ExamModel, Question as QuestionModel, Upload
from ..schemas import ExamCreate, ExamOut, GradeItem, GradeReport, QuestionDTO, UserAnswer

router = APIRouter(tags=["exam"])


@router.post("/exams", response_model=ExamOut)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)) -> ExamOut:
    upload = db.get(Upload, payload.uploadId)
    if upload is None:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Very simple selection for now: filter by types and limit count
    query = db.query(QuestionModel).filter(QuestionModel.upload_id == upload.id)
    if payload.questionTypes:
        query = query.filter(QuestionModel.qtype.in_(payload.questionTypes))
    questions = query.limit(payload.count).all()

    question_ids = [q.id for q in questions]
    exam = ExamModel(upload_id=upload.id, settings=payload.model_dump(), question_ids=question_ids)
    db.add(exam)
    db.commit()
    db.refresh(exam)

    dto = [
        QuestionDTO(
            id=q.id,
            stem=q.stem,
            qtype=q.qtype,
            options=(q.options or {}).get("list"),
            concepts=q.concept_ids or [],
        )
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
        QuestionDTO(
            id=q.id,
            stem=q.stem,
            qtype=q.qtype,
            options=(q.options or {}).get("list"),
            concepts=q.concept_ids or [],
        )
        for q in questions
    ]
    return ExamOut(examId=exam.id, questions=dto)


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
    return GradeReport(scorePct=round(score_pct, 2), perQuestion=per_items)


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


