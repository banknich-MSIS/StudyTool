"""
AI-powered exam generation routes using Gemini API.
"""
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from pydantic import BaseModel

from ..services import file_processor, gemini_service
from ..services.gemini_service import ExamConfig
import google.generativeai as genai
import pkg_resources
import socket
import ssl
from ..db import SessionLocal
from ..models import Upload, Question, Concept
from datetime import datetime
import json


router = APIRouter(tags=["AI Generation"])


class ValidateKeyRequest(BaseModel):
    """Request model for API key validation."""
    api_key: str


class ValidateKeyResponse(BaseModel):
    """Response model for API key validation."""
    valid: bool
    message: str


class GenerateExamResponse(BaseModel):
    """Response model for exam generation."""
    exam_id: int
    upload_id: int
    question_count: int
    stats: dict
@router.get("/ai/env-diagnostics")
async def env_diagnostics():
    """Return environment details helpful for debugging Gemini issues."""
    info = {
        "google_generativeai_version": None,
        "can_resolve_google": False,
        "can_https_googleapis": False,
    }
    try:
        info["google_generativeai_version"] = pkg_resources.get_distribution("google-generativeai").version
    except Exception:
        info["google_generativeai_version"] = "unknown"
    try:
        socket.gethostbyname("generativelanguage.googleapis.com")
        info["can_resolve_google"] = True
    except Exception:
        info["can_resolve_google"] = False
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname="generativelanguage.googleapis.com") as s:
            s.settimeout(3.0)
            s.connect(("generativelanguage.googleapis.com", 443))
            info["can_https_googleapis"] = True
    except Exception:
        info["can_https_googleapis"] = False
    return info


@router.get("/ai/models")
async def list_available_models(x_gemini_api_key: str = Header(..., alias="X-Gemini-API-Key")):
    """List available models that support generateContent for the provided key."""
    try:
        genai.configure(api_key=x_gemini_api_key)
        models = list(genai.list_models())
        result = []
        for m in models:
            try:
                methods = getattr(m, 'supported_generation_methods', []) or []
                if 'generateContent' not in methods:
                    continue
                name_raw = getattr(m, 'name', '') or ''
                plain = name_raw.split('/')[-1]
                if plain.endswith('-latest'):
                    plain = plain[:-7]
                result.append(plain)
            except Exception:
                continue
        # Prefer unique sorted output
        return {"models": sorted(set(result))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to list models: {str(e)}")

@router.post("/ai/validate-key", response_model=ValidateKeyResponse)
async def validate_gemini_key(request: ValidateKeyRequest):
    """
    Validate that a Gemini API key is valid and working.
    """
    try:
        is_valid = await gemini_service.validate_api_key(request.api_key)
        
        if is_valid:
            return ValidateKeyResponse(
                valid=True,
                message="API key is valid and working!"
            )
        else:
            return ValidateKeyResponse(
                valid=False,
                message="API key is invalid or not working"
            )
    
    except Exception as e:
        return ValidateKeyResponse(
            valid=False,
            message=f"Error validating key: {str(e)}"
        )


@router.post("/ai/generate-exam", response_model=GenerateExamResponse)
async def generate_exam_from_files(
    files: List[UploadFile] = File(...),
    question_count: int = Form(20),
    difficulty: str = Form("medium"),
    question_types: str = Form("mcq,short"),  # Comma-separated
    focus_concepts: Optional[str] = Form(None),  # Comma-separated
    x_gemini_api_key: str = Header(..., alias="X-Gemini-API-Key")
):
    """
    Generate an exam from uploaded files using Gemini API.
    
    Steps:
    1. Extract text from uploaded files
    2. Send to Gemini API with configuration
    3. Parse response
    4. Create exam in database
    5. Return exam ID ready to take
    """
    db = SessionLocal()
    
    try:
        # Step 1: Extract text from files
        content = await file_processor.process_multiple_files(files)
        
        if not content or len(content) < 100:
            raise HTTPException(
                status_code=400,
                detail="Could not extract enough content from files. Please ensure files contain text."
            )
        
        # Step 2: Build configuration
        question_types_list = [qt.strip() for qt in question_types.split(",") if qt.strip()]
        focus_concepts_list = None
        if focus_concepts:
            focus_concepts_list = [fc.strip() for fc in focus_concepts.split(",") if fc.strip()]
        
        config = ExamConfig(
            question_count=question_count,
            difficulty=difficulty,
            question_types=question_types_list,
            focus_concepts=focus_concepts_list
        )
        
        # Step 3: Generate exam with Gemini
        generated_exam = await gemini_service.generate_exam_from_content(
            content=content,
            config=config,
            api_key=x_gemini_api_key
        )
        
        # Step 4: Create upload record in database
        file_names = [f.filename for f in files]
        
        # Determine model used (service attaches _model_name on the returned object)
        used_model = getattr(generated_exam, '_model_name', 'gemini-1.5-flash')

        upload = Upload(
            filename=f"AI_Generated_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            created_at=datetime.now(),
            metadata=json.dumps({
                "source": "ai_generated",
                "gemini_model": used_model,
                "generation_timestamp": datetime.now().isoformat(),
                "original_files": file_names,
                "themes": generated_exam.metadata.themes,
                "difficulty": generated_exam.metadata.difficulty,
                "suggested_types": question_types_list,
                "recommended_count": question_count,
                "topic": generated_exam.metadata.topic
            })
        )
        
        db.add(upload)
        db.flush()  # Get upload ID
        
        # Step 5: Create questions in database
        created_questions = []
        concept_names = set()
        
        for q_data in generated_exam.questions:
            # Prepare options
            options_str = None
            if q_data.options and len(q_data.options) > 0:
                options_str = "|".join(q_data.options)
            
            # Prepare concepts
            concepts_str = ",".join(q_data.concepts) if q_data.concepts else ""
            concept_names.update(q_data.concepts)
            
            question = Question(
                upload_id=upload.id,
                question=q_data.question,
                answer=q_data.answer,
                type=q_data.type,
                options=options_str,
                concepts=concepts_str
            )
            
            db.add(question)
            created_questions.append(question)
        
        # Step 6: Create concept records
        for concept_name in concept_names:
            # Check if concept already exists for this upload
            existing = db.query(Concept).filter(
                Concept.upload_id == upload.id,
                Concept.name == concept_name
            ).first()
            
            if not existing:
                concept = Concept(
                    upload_id=upload.id,
                    name=concept_name,
                    score=0.5  # Default score
                )
                db.add(concept)
        
        db.commit()
        
        # Step 7: Prepare response
        return GenerateExamResponse(
            exam_id=upload.id,
            upload_id=upload.id,
            question_count=len(created_questions),
            stats={
                "metadata": {
                    "topic": generated_exam.metadata.topic,
                    "themes": generated_exam.metadata.themes,
                    "difficulty": generated_exam.metadata.difficulty,
                    "estimated_time_minutes": generated_exam.metadata.estimated_time_minutes
                },
                "questions_generated": len(created_questions),
                "question_types": {
                    qt: sum(1 for q in created_questions if q.type == qt)
                    for qt in question_types_list
                },
                "concepts_extracted": list(concept_names),
                "source_files": file_names
            }
        )
    
    except HTTPException:
        raise
    
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate exam: {str(e)}"
        )
    
    finally:
        db.close()


@router.get("/ai/supported-formats")
async def get_supported_formats():
    """
    Get list of supported file formats for AI generation.
    """
    return {
        "formats": file_processor.get_supported_file_types(),
        "description": "Supported file formats for exam generation"
    }

