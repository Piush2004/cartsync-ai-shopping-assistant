from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TestSessionFeedbackCreate(BaseModel):
    capture_easy: Optional[bool] = None
    instructions_clear: Optional[bool] = None
    photo_accepted: Optional[bool] = None
    measurements_believable: Optional[bool] = None
    measurement_that_seemed_wrong: Optional[str] = None
    recommended_size_correct: Optional[bool] = None
    product_recommendations_relevant: Optional[bool] = None
    stylist_understood_question: Optional[bool] = None
    confusing_notes: Optional[str] = None
    general_notes: Optional[str] = None


class TestSessionFeedbackResponse(TestSessionFeedbackCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
