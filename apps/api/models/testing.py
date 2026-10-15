from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class TestSessionFeedback(Base):
    """
    Structured feedback from a real-user test session (see master brief
    Phase 22/24's 10-step protocol). Intentionally simple -- booleans and a
    couple of free-text fields, not a generic survey framework.
    """
    __tablename__ = "test_session_feedback"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    capture_easy = Column(Boolean, nullable=True)
    instructions_clear = Column(Boolean, nullable=True)
    photo_accepted = Column(Boolean, nullable=True)
    measurements_believable = Column(Boolean, nullable=True)
    measurement_that_seemed_wrong = Column(String, nullable=True)
    recommended_size_correct = Column(Boolean, nullable=True)
    product_recommendations_relevant = Column(Boolean, nullable=True)
    stylist_understood_question = Column(Boolean, nullable=True)
    confusing_notes = Column(Text, nullable=True)
    general_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
