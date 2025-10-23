"""
Gemini API integration service for AI-powered exam generation.
Handles API configuration, prompt building, and response parsing.
"""
import json
import re
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import google.generativeai as genai


class ExamConfig(BaseModel):
    """Configuration for exam generation."""
    question_count: int
    difficulty: str
    question_types: List[str]
    focus_concepts: Optional[List[str]] = None


class QuestionData(BaseModel):
    """Structure for a single question."""
    question: str
    answer: str
    type: str
    options: Optional[List[str]] = None
    concepts: List[str] = []
    explanation: Optional[str] = None


class ExamMetadata(BaseModel):
    """Metadata about the generated exam."""
    topic: str
    themes: List[str]
    difficulty: str
    estimated_time_minutes: int


class GeneratedExam(BaseModel):
    """Complete exam structure from Gemini."""
    metadata: ExamMetadata
    questions: List[QuestionData]


# Prompt template for exam generation (matches GEMINI_PROMPT.md structure)
EXAM_GENERATION_PROMPT = """
You are an AI exam generator that transforms study materials into structured question sets.
Your purpose is to process academic materials and produce well-formatted questions suitable for practice exams.

Study Material:
{content}

Requirements:
- Generate exactly {question_count} questions
- Difficulty level: {difficulty}
- Question types to include: {question_types}
{focus_concepts_section}

QUESTION TYPE DEFINITIONS:
- mcq: Multiple choice with exactly ONE correct answer (provide 4 options)
- multi: Multiple choice where user selects ALL correct answers (can be 1 or more, provide 4+ options)
- short: Short text answer (single word or phrase)
- truefalse: True or False question
- cloze: Fill-in-the-blank question with one or more blanks

QUESTION DIFFICULTY GUIDELINES:
- Easy: Focus on definitions, basic concepts, direct recall. Use straightforward language and obvious distractors.
- Medium: Require application of concepts, comparison, analysis. Use scenarios and require understanding beyond memorization.
- Hard: Multi-step reasoning, edge cases, synthesis of multiple concepts. Use subtle distractors and complex scenarios.

IMPORTANT RULES:
1. For MCQ questions, provide exactly 4 options with the correct answer as ONE of them
2. For MCQ, wrong options must be plausible (common misconceptions, similar concepts, not obviously wrong)
3. Avoid obviously incorrect distractors (unrelated terms, nonsensical combinations, wrong units)
4. For multi-select, provide 4+ options where 1 or more are correct
5. For short answer, truefalse, and cloze questions, set options to null or empty array
6. Each question should have 1-3 relevant concept tags
7. Ensure high quality questions that test real understanding
8. Distribute questions evenly across selected {question_types} types
9. Vary difficulty within the {difficulty} level
10. DO NOT include citation markers, references, or metadata in questions
11. Questions should be clean text without [cite:XX] or similar annotations

CRITICAL: Return ONLY valid JSON in this exact format (no markdown code blocks, just pure JSON):
{{
  "metadata": {{
    "topic": "main topic extracted from material",
    "themes": ["theme1", "theme2", "theme3"],
    "difficulty": "{difficulty}",
    "estimated_time_minutes": <number based on question count and types>
  }},
  "questions": [
    {{
      "question": "clear, specific question text",
      "answer": "correct answer",
      "type": "mcq|multi|short|truefalse|cloze",
      "options": ["option1", "option2", "option3", "option4"],
      "concepts": ["concept1", "concept2"],
      "explanation": "brief explanation of correct answer"
    }}
  ]
}}

ANSWER FIELD FORMATTING:
- mcq: Single answer matching one option exactly (e.g., "Option text")
- multi: Array with all correct options (e.g., ["Option A", "Option C"])
- short: Simple text (e.g., "mitochondria")
- truefalse: "True" or "False"
- cloze: Array with answers for each blank in order (e.g., ["answer1", "answer2"])

QUALITY CHECKLIST:
✓ Questions test understanding, not just memorization
✓ MCQ distractors are plausible and educational
✓ Questions are clear and unambiguous
✓ Answers are definitively correct
✓ Concepts accurately tagged
✓ No citation markers or annotations
✓ Even distribution across question types
✓ Appropriate difficulty level throughout
"""


def configure_gemini(api_key: str) -> None:
    """Configure Gemini API with user's API key."""
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        raise ValueError(f"Failed to configure Gemini API: {str(e)}")


def build_exam_prompt(content: str, config: ExamConfig) -> str:
    """Build the prompt for Gemini based on content and configuration."""
    
    # Build focus concepts section if provided
    focus_concepts_section = ""
    if config.focus_concepts and len(config.focus_concepts) > 0:
        concepts_list = ", ".join(config.focus_concepts)
        focus_concepts_section = f"- Focus on these concepts: {concepts_list}"
    
    # Format question types for display
    question_types_str = ", ".join(config.question_types)
    
    prompt = EXAM_GENERATION_PROMPT.format(
        content=content[:15000],  # Limit content to avoid token limits
        question_count=config.question_count,
        difficulty=config.difficulty,
        question_types=question_types_str,
        focus_concepts_section=focus_concepts_section
    )
    
    return prompt


def extract_json_from_response(response_text: str) -> str:
    """
    Extract JSON from Gemini response, handling markdown code blocks.
    """
    # Remove markdown code blocks if present
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
    if json_match:
        return json_match.group(1).strip()
    
    # Try to find JSON object directly
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    if json_match:
        return json_match.group(0).strip()
    
    return response_text.strip()


def parse_gemini_response(response_text: str) -> GeneratedExam:
    """
    Parse and validate Gemini's JSON response.
    """
    try:
        # Extract JSON from response
        json_str = extract_json_from_response(response_text)
        
        # Parse JSON
        data = json.loads(json_str)
        
        # Validate structure and create Pydantic models
        exam = GeneratedExam(**data)
        
        # Additional validation
        if len(exam.questions) == 0:
            raise ValueError("No questions generated")
        
        # Validate question types
        valid_types = {'mcq', 'short', 'truefalse', 'cloze', 'multi'}
        for q in exam.questions:
            if q.type not in valid_types:
                q.type = 'short'  # Default to short answer if invalid
            
            # Ensure MCQ questions have options
            if q.type == 'mcq' and (not q.options or len(q.options) < 2):
                raise ValueError(f"MCQ question missing valid options: {q.question}")
        
        return exam
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from Gemini response: {str(e)}\nResponse: {response_text[:500]}")
    except Exception as e:
        raise ValueError(f"Failed to validate exam structure: {str(e)}")


async def generate_exam_from_content(
    content: str,
    config: ExamConfig,
    api_key: str
) -> GeneratedExam:
    """
    Main function to generate exam from content using Gemini API.
    
    Args:
        content: Extracted text from study materials
        config: Exam configuration (question count, difficulty, types)
        api_key: User's Gemini API key
    
    Returns:
        GeneratedExam object with metadata and questions
    """
    try:
        # Configure Gemini with user's API key
        configure_gemini(api_key)
        
        # Build prompt
        prompt = build_exam_prompt(content, config)
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=8192,
            )
        )
        
        # Parse response
        exam = parse_gemini_response(response.text)
        
        return exam
        
    except Exception as e:
        raise ValueError(f"Failed to generate exam with Gemini: {str(e)}")


async def validate_api_key(api_key: str) -> bool:
    """
    Validate that the provided Gemini API key works.
    Returns True if key is valid; raises with a descriptive error otherwise.
    """
    # Configure and attempt a minimal generation
    configure_gemini(api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    response = model.generate_content(
        "Say 'OK' if you can read this.",
        generation_config=genai.GenerationConfig(
            max_output_tokens=10,
        )
    )

    # Some SDK versions don't populate response.text reliably
    text = getattr(response, 'text', None)
    if not text:
        try:
            # Attempt to pull from candidates
            candidates = getattr(response, 'candidates', []) or []
            if candidates and candidates[0].content and candidates[0].content.parts:
                part0 = candidates[0].content.parts[0]
                text = getattr(part0, 'text', None)
        except Exception:
            pass

    if not text:
        raise ValueError("Empty response from model while validating API key")

    return True

