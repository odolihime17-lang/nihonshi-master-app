from pydantic import BaseModel, Field
from typing import List, Optional

class QuizQuestion(BaseModel):
    question: Optional[str] = None
    statement_a: Optional[str] = None
    statement_b: Optional[str] = None
    choices: List[str]
    answer_index: int
    explanation: str
    era: str
    field: str
    answer: Optional[str] = None  # For "一問一答"

class QuizRequest(BaseModel):
    user_id: str = "takumi"
    era: str
    field: str
    quiz_type: str = "4択問題"
    pdf_ids: List[int] = []

class QuizSubmit(BaseModel):
    user_id: str = "takumi"
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    era: str
    field: str

class PDFInfo(BaseModel):
    id: int
    file_name: str
    char_count: int
    created_at: str

class DriveUploadRequest(BaseModel):
    user_id: str = "takumi"
    url: str

class StatsEra(BaseModel):
    era: str
    total: int
    correct: int
    accuracy: float

class UserStats(BaseModel):
    total: int
    correct: int
    accuracy: float
    by_era: List[StatsEra]

class WeakArea(BaseModel):
    era: str
    field: str
    total: int
    wrong: int
    error_rate: float
