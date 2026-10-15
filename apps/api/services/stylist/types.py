from pydantic import BaseModel
from typing import List, Optional

class StylistContext(BaseModel):
    chest: float
    waist: float
    brand_name: str
    fit_preference: str # "Relaxed", "Slim", "Regular"

class ConfidenceBreakdown(BaseModel):
    overall: float
    measurement: float
    brand: float
    preference: float

class StylistRecommendation(BaseModel):
    recommended_size: str
    fit: str
    confidence: ConfidenceBreakdown
    reasoning: List[str]
    alternatives: List[str]
