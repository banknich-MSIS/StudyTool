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
from ..models import Upload, Question, Concept, Exam
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

@router.post("/ai/test-key")
async def test_api_key_detailed(request: ValidateKeyRequest):
    """
    Detailed diagnostics for API key - shows available models and tests them.
    Returns comprehensive information about what models are accessible and working.
    """
    import google.generativeai as genai
    from google.api_core import exceptions as google_exceptions
    
    results = {
        "api_key_provided": bool(request.api_key),
        "configured": False,
        "models_listed": [],
        "models_tested": {},
        "working_model": None,
        "errors": []
    }
    
    try:
        # Configure the API
        genai.configure(api_key=request.api_key)
        results["configured"] = True
        
        # List all models
        try:
            models = list(genai.list_models())
            results["models_listed"] = [str(model.name) for model in models]
        except Exception as e:
            results["errors"].append(f"Failed to list models: {str(e)}")
            models = []
        
        # Test content generation with different model name formats
        model_formats_to_test = [
            'models/gemini-2.5-flash',
            'gemini-2.5-flash',
            'models/gemini-2.5-pro',
            'gemini-2.5-pro',
            'models/gemini-2.0-flash',
            'gemini-2.0-flash',
        ]
        
        for model_name in model_formats_to_test:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    "Say 'OK'",
                    generation_config=genai.GenerationConfig(
                        max_output_tokens=10,
                    )
                )
                results["models_tested"][model_name] = {
                    "status": "success",
                    "response": getattr(response, 'text', None) or "No text in response"
                }
                if results["working_model"] is None:
                    results["working_model"] = model_name
                    break  # Found a working model, stop testing
            except google_exceptions.NotFound as e:
                results["models_tested"][model_name] = {
                    "status": "not_found",
                    "error": str(e)
                }
            except google_exceptions.PermissionDenied as e:
                results["models_tested"][model_name] = {
                    "status": "permission_denied",
                    "error": str(e)
                }
            except Exception as e:
                results["models_tested"][model_name] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return results
        
    except Exception as e:
        results["errors"].append(f"Configuration failed: {str(e)}")
        return results


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
    exam_name: Optional[str] = Form(None),  # Optional exam name
    exam_mode: Optional[str] = Form("exam"),  # exam or practice
    class_id: Optional[int] = Form(None),  # Optional class assignment
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
        used_model = getattr(generated_exam, '_model_name', 'gemini-2.5-flash')

        # Count existing AI-generated uploads and increment
        ai_upload_count = db.query(Upload).filter(Upload.file_type == "ai_generated").count()
        filename = f"AI Generated Quiz {ai_upload_count + 1}"

        upload = Upload(
            filename=filename,
            file_type="ai_generated",
            created_at=datetime.now()
        )
        
        db.add(upload)
        db.flush()  # Get upload ID
        
        # Step 5: Create concept records first and build mapping
        concept_names = set()
        for q_data in generated_exam.questions:
            if q_data.concepts:
                concept_names.update(q_data.concepts)
        
        # Create concept records and build name-to-ID mapping
        concept_map = {}  # name -> Concept object
        for concept_name in concept_names:
            concept = Concept(
                upload_id=upload.id,
                name=concept_name,
                score=1.0  # Default score
            )
            db.add(concept)
            concept_map[concept_name] = concept
        
        db.flush()  # Get concept IDs
        
        # Step 6: Create questions in database
        created_questions = []
        
        for q_data in generated_exam.questions:
            # Prepare options as JSON dict
            options_dict = None
            if q_data.options and len(q_data.options) > 0:
                options_dict = {"list": q_data.options}
            
            # Prepare answer as JSON dict
            answer_dict = None
            if q_data.answer:
                # Convert answer to appropriate format based on question type
                # For multi-select, parse comma-separated answers into list
                if q_data.type == 'multi':
                    # Check if already a list (from JSON parsing) or string to split
                    if isinstance(q_data.answer, str):
                        answer_list = [a.strip() for a in q_data.answer.split(",") if a.strip()]
                        answer_dict = {"value": answer_list}
                    elif isinstance(q_data.answer, list):
                        answer_dict = {"value": q_data.answer}
                    else:
                        answer_dict = {"value": str(q_data.answer)}
                elif q_data.type == 'cloze':
                    # For cloze questions, parse multiple answers
                    if isinstance(q_data.answer, str):
                        answer_list = [a.strip() for a in q_data.answer.split(",") if a.strip()]
                        answer_dict = {"value": answer_list}
                    elif isinstance(q_data.answer, list):
                        answer_dict = {"value": q_data.answer}
                    else:
                        answer_dict = {"value": [str(q_data.answer)]}
                else:
                    # For MCQ, short answer, true/false: single answer as string
                    answer_dict = {"value": str(q_data.answer)}
            
            # Prepare concept IDs
            concept_ids = [concept_map[name].id for name in (q_data.concepts or []) if name in concept_map]
            
            question = Question(
                upload_id=upload.id,
                stem=q_data.question,
                qtype=q_data.type,
                options=options_dict,
                answer=answer_dict,
                concept_ids=concept_ids if concept_ids else None
            )
            
            db.add(question)
            created_questions.append(question)
        
        # Step 7: Create exam record
        question_ids = [q.id for q in created_questions]
        exam_settings = {
            "question_count": question_count,
            "difficulty": difficulty,
            "question_types": question_types_list,
            "exam_name": exam_name,
            "exam_mode": exam_mode,
        }
        
        exam = Exam(
            upload_id=upload.id,
            settings=exam_settings,
            question_ids=question_ids
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        # Assign to class if specified
        if class_id:
            from ..models import upload_classes
            try:
                db.execute(
                    upload_classes.insert().values(upload_id=upload.id, class_id=class_id)
                )
                db.commit()
            except Exception as e:
                # Class assignment failed, but don't fail the whole request
                print(f"Warning: Could not assign to class: {e}")
        
        # Step 8: Prepare response
        return GenerateExamResponse(
            exam_id=exam.id,
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
                    qt: sum(1 for q in created_questions if q.qtype == qt)
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

