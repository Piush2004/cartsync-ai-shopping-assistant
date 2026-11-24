from pydantic import BaseModel
from typing import List, Optional

# One shared ordering for every engine that steps a size up or down.
SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]

# Garment categories the sizing engine understands. "top" is the default so
# every caller that predates categories keeps its old behaviour.
CATEGORY_TOP = "top"
CATEGORY_BOTTOM = "bottom"
CATEGORY_DRESS = "dress"


class StylistContext(BaseModel):
    chest: float
    waist: float
    brand_name: str
    fit_preference: str # "Relaxed", "Slim", "Regular"
    # Added for category-aware sizing. All optional: a context built without
    # them is sized exactly as before (a top, on the general chart).
    hip: Optional[float] = None
    category: str = CATEGORY_TOP
    department: Optional[str] = None  # "women" | "men" | None (unknown)

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
