from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str # "user" or "assistant"
    content: str

class Intent(BaseModel):
    category: str # "sizing", "product", "brand", "preferences", "measurement", "general"
    confidence: float

class AIContext(BaseModel):
    user_profile: Dict[str, Any]
    stylist_recommendation: Optional[Dict[str, Any]] = None
    product_recommendations: Optional[List[Dict[str, Any]]] = None
    conversation_history: List[Message]
    intent: Intent

class ConversationResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
    intent_detected: str
