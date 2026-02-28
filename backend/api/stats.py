from fastapi import APIRouter
from backend.models.schemas import UserStats, WeakArea
from backend.core import db
from typing import List

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/{user_id}", response_model=UserStats)
async def get_stats(user_id: str):
    return db.get_stats(user_id)

@router.get("/weak-areas/{user_id}", response_model=List[WeakArea])
async def get_weak_areas(user_id: str):
    return db.get_weak_areas(user_id=user_id)
