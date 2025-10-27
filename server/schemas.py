from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


QuestionType = Literal["mcq", "multi", "short", "truefalse", "cloze"]


class UploadOut(BaseModel):
    id: int
    filename: str
    file_type: str

    model_config = dict(from_attributes=True)


class UploadSummary(BaseModel):
    id: int
    filename: str
    created_at: datetime
    question_count: int
    themes: List[str] = []
    exam_count: int
    file_type: str
    class_tags: List[str] = []
    question_type_counts: Optional[Dict[str, int]] = None


class ConceptOut(BaseModel):
    id: int
    name: str
    score: float

    model_config = dict(from_attributes=True)


class QuestionDTO(BaseModel):
    id: int
    stem: str
    type: QuestionType
    options: Optional[List[str]] = Field(default=None)
    concepts: List[int] = Field(default_factory=list)

    model_config = dict(
        from_attributes=True, 
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "stem": "What is 2+2?",
                "type": "mcq",
                "options": ["2", "3", "4", "5"],
                "concepts": [1, 2]
            }
        }
    )


class QuestionReview(BaseModel):
    question: QuestionDTO
    user_answer: Any
    correct_answer: Any
    is_correct: bool


class ExamCreate(BaseModel):
    uploadId: int
    uploadIds: Optional[List[int]] = None  # For combined exams
    includeConceptIds: List[int] = []
    questionTypes: List[QuestionType] = ["mcq", "short"]
    count: int = 10


class ExamOut(BaseModel):
    examId: int
    questions: List[QuestionDTO]


class UserAnswer(BaseModel):
    questionId: int
    response: Any


class GradeItem(BaseModel):
    questionId: int
    correct: bool
    correctAnswer: Any | None = None
    userAnswer: Any | None = None


class GradeReport(BaseModel):
    scorePct: float
    perQuestion: List[GradeItem]
    attemptId: Optional[int] = None  # New field for attempt tracking


class AttemptSummary(BaseModel):
    id: int
    exam_id: int
    upload_filename: str
    score_pct: float
    finished_at: datetime
    question_count: int
    correct_count: int


class AttemptDetail(BaseModel):
    id: int
    exam_id: int
    score_pct: float
    finished_at: datetime
    questions: List[QuestionReview]


class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#007bff"


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class ClassOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime

    model_config = dict(from_attributes=True)


class ClassSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime
    upload_count: int


