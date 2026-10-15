from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .measurement import EffectiveMeasurementResponse

class BrandAffinityResponse(BaseModel):
    brand_id: str
    affinity_score: float
    size_offset: float

    class Config:
        from_attributes = True

class UserPreferenceResponse(BaseModel):
    fit_preference: Optional[str]
    price_sensitivity: Optional[float]
    style_dna: Optional[list]

    class Config:
        from_attributes = True

class KnowledgeGraphResponse(BaseModel):
    user_id: str
    effective_measurements: Optional[EffectiveMeasurementResponse]
    brand_affinity: List[BrandAffinityResponse]
    preferences: Optional[UserPreferenceResponse]
    raw_measurements: Optional[dict] = None
    calibration_offsets: Optional[dict] = None
    profile_confidence: float = 0.0
    graph_version: str = "v1.0.0"
    last_updated: Optional[datetime] = None
