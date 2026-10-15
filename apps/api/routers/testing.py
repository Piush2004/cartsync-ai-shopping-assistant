from typing import List
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from models.user import User
from models.testing import TestSessionFeedback
from schemas.testing import TestSessionFeedbackCreate, TestSessionFeedbackResponse

router = APIRouter()


@router.post("/feedback", response_model=TestSessionFeedbackResponse)
def submit_feedback(
    payload: TestSessionFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback = TestSessionFeedback(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/feedback", response_model=List[TestSessionFeedbackResponse])
def list_my_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(TestSessionFeedback)
        .filter(TestSessionFeedback.user_id == current_user.id)
        .order_by(TestSessionFeedback.created_at.desc())
        .all()
    )
