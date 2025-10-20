from __future__ import annotations

from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field


QuestionType = Literal["mcq", "multi", "short", "truefalse", "cloze"]


class UploadOut(BaseModel):
    id: int
    filename: str
    file_type: str

    model_config = dict(from_attributes=True)


class ConceptOut(BaseModel):
    id: int
    name: str
    score: float

    model_config = dict(from_attributes=True)


class QuestionDTO(BaseModel):
    id: int
    stem: str
    type: QuestionType = Field(alias="qtype")
    options: Optional[List[str]] = None
    concepts: List[int] = []

    model_config = dict(from_attributes=True, populate_by_name=True)


class ExamCreate(BaseModel):
    uploadId: int
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


