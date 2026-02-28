from fastapi import APIRouter, HTTPException
from backend.models.schemas import QuizRequest, QuizSubmit, QuizQuestion
from backend.core import db, quiz_generator
from typing import List

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.post("/generate", response_model=List[QuizQuestion])
async def generate_quiz(request: QuizRequest):
    pdf_text = ""
    if request.pdf_ids:
        texts = []
        for pid in request.pdf_ids:
            t = db.get_pdf_text(pid)
            if t:
                texts.append(t)
        pdf_text = "\n".join(texts)
    
    weak_areas = db.get_weak_areas(user_id=request.user_id)
    wrong_questions = db.get_recent_wrong_questions(user_id=request.user_id)
    
    try:
        questions = quiz_generator.generate_quiz(
            pdf_text=pdf_text,
            era=request.era,
            field=request.field,
            quiz_type=request.quiz_type,
            weak_areas=weak_areas,
            wrong_questions=wrong_questions
        )
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
async def submit_result(result: QuizSubmit):
    db.save_result(
        question=result.question_text,
        user_answer=result.user_answer,
        correct_answer=result.correct_answer,
        is_correct=result.is_correct,
        era=result.era,
        field=result.field,
        user_id=result.user_id
    )
    return {"status": "success"}
