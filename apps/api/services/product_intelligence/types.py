from pydantic import BaseModel
from typing import List, Optional, Dict
from services.stylist import StylistRecommendation

class Product(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    fit_type: str # "Relaxed", "Slim", "Regular"
    image_url: Optional[str] = None

class ScoredProduct(BaseModel):
    product: Product
    recommended_size: str
    fit_score: float
    confidence: float
    reason: List[str]

class ProductIntelligenceRequest(BaseModel):
    preferences: Dict[str, str] # e.g. {"fit_preference": "Relaxed"}
    stylist_recommendation: StylistRecommendation # We assume we got a generic size recommendation first
    brand_affinity: List[str]

class ProductIntelligenceResponse(BaseModel):
    products: List[ScoredProduct]
