from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Class as ClassModel, Upload
from ..schemas import ClassCreate, ClassOut, ClassSummary, ClassUpdate

router = APIRouter(tags=["classes"])


@router.post("/classes", response_model=ClassOut)
def create_class(payload: ClassCreate, db: Session = Depends(get_db)) -> ClassOut:
    """Create a new class"""
    new_class = ClassModel(
        name=payload.name,
        description=payload.description,
        color=payload.color
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class


@router.get("/classes", response_model=List[ClassSummary])
def get_all_classes(db: Session = Depends(get_db)) -> List[ClassSummary]:
    """Get all classes with upload counts"""
    classes = db.query(ClassModel).order_by(ClassModel.created_at.desc()).all()
    
    result = []
    for cls in classes:
        result.append(
            ClassSummary(
                id=cls.id,
                name=cls.name,
                description=cls.description,
                color=cls.color,
                created_at=cls.created_at,
                upload_count=len(cls.uploads)
            )
        )
    
    return result


@router.get("/classes/{class_id}", response_model=ClassOut)
def get_class(class_id: int, db: Session = Depends(get_db)) -> ClassOut:
    """Get a specific class by ID"""
    cls = db.get(ClassModel, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls


@router.put("/classes/{class_id}", response_model=ClassOut)
def update_class(
    class_id: int,
    payload: ClassUpdate,
    db: Session = Depends(get_db)
) -> ClassOut:
    """Update a class"""
    cls = db.get(ClassModel, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if payload.name is not None:
        cls.name = payload.name
    if payload.description is not None:
        cls.description = payload.description
    if payload.color is not None:
        cls.color = payload.color
    
    db.commit()
    db.refresh(cls)
    return cls


@router.delete("/classes/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Delete a class"""
    cls = db.get(ClassModel, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(cls)
    db.commit()
    
    return {"success": True}


@router.post("/uploads/{upload_id}/classes/{class_id}")
def assign_upload_to_class(
    upload_id: int,
    class_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Assign a CSV upload to a class"""
    upload = db.get(Upload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    cls = db.get(ClassModel, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if already assigned
    if cls not in upload.classes:
        upload.classes.append(cls)
        db.commit()
    
    return {"success": True}


@router.delete("/uploads/{upload_id}/classes/{class_id}")
def remove_upload_from_class(
    upload_id: int,
    class_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Remove a CSV upload from a class"""
    upload = db.get(Upload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    cls = db.get(ClassModel, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Remove if assigned
    if cls in upload.classes:
        upload.classes.remove(cls)
        db.commit()
    
    return {"success": True}

