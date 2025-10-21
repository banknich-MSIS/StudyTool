from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


# Association table for many-to-many relationship between uploads and classes
upload_classes = Table(
    "upload_classes",
    Base.metadata,
    mapped_column("upload_id", ForeignKey("uploads.id"), primary_key=True),
    mapped_column("class_id", ForeignKey("classes.id"), primary_key=True),
)


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(16), nullable=False)  # csv | text
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    concepts: Mapped[List["Concept"]] = relationship(
        back_populates="upload", cascade="all, delete-orphan"
    )
    questions: Mapped[List["Question"]] = relationship(
        back_populates="upload", cascade="all, delete-orphan"
    )
    exams: Mapped[List["Exam"]] = relationship(
        back_populates="upload", cascade="all, delete-orphan"
    )
    classes: Mapped[List["Class"]] = relationship(
        secondary=upload_classes, back_populates="uploads"
    )


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("uploads.id"), index=True)
    name: Mapped[str] = mapped_column(String(256), index=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)

    upload: Mapped[Upload] = relationship(back_populates="concepts")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("uploads.id"), index=True)
    stem: Mapped[str] = mapped_column(Text, nullable=False)
    qtype: Mapped[str] = mapped_column(String(16), nullable=False)  # mcq|multi|short|truefalse|cloze
    options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # list[str]
    answer: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    concept_ids: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)

    upload: Mapped[Upload] = relationship(back_populates="questions")


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("uploads.id"), index=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    question_ids: Mapped[List[int]] = mapped_column(JSON)

    upload: Mapped[Upload] = relationship(back_populates="exams")
    attempts: Mapped[List["Attempt"]] = relationship(
        back_populates="exam", cascade="all, delete-orphan"
    )


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"), index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    score_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    exam: Mapped[Exam] = relationship(back_populates="attempts")
    answers: Mapped[List["AttemptAnswer"]] = relationship(
        back_populates="attempt", cascade="all, delete-orphan"
    )


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), index=True)
    response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    attempt: Mapped[Attempt] = relationship(back_populates="answers")


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    uploads: Mapped[List[Upload]] = relationship(
        secondary=upload_classes, back_populates="classes"
    )


