from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ProductMeasurements(BaseModel):
    # Optional detailed physical dimensions if known (e.g. inseam length of this exact pair of jeans)
    chest_circumference: Optional[float] = None
    waist_circumference: Optional[float] = None
    inseam: Optional[float] = None
    shoulder_width: Optional[float] = None
    sleeve_length: Optional[float] = None

class Product(BaseModel):
    product_id: str
    sku: str
    brand: str
    category: str  # e.g. "shirt", "jeans"
    gender: str    # e.g. "Men", "Women", "Unisex"
    title: str
    description: str
    images: List[str]
    available_colors: List[str]
    available_sizes: List[str]
    price: float
    currency: str = "USD"
    inventory: Dict[str, int] # e.g. {"M": 14, "L": 0}
    tags: List[str]
    material: str
    fit_type: str  # e.g. "slim", "regular", "oversized"
    stretch: str   # e.g. "none", "low", "high"
    season: str
    occasion: str
    measurements: Optional[ProductMeasurements] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UserPreferences(BaseModel):
    favorite_brands: List[str] = Field(default_factory=list)
    favorite_colors: List[str] = Field(default_factory=list)
    price_range: Dict[str, float] = Field(default_factory=lambda: {"min": 0.0, "max": 999.0})
    fit_preference: str = "regular"
    preferred_materials: List[str] = Field(default_factory=list)

class UserProfile(BaseModel):
    user_id: str
    preferences: UserPreferences
    saved_measurements: Optional[Dict[str, Any]] = None
    saved_size_recommendations: Optional[Dict[str, Any]] = None
    last_measured_at: Optional[str] = None
    scan_history: List[Dict[str, Any]] = Field(default_factory=list)

class RecommendationFeedback(BaseModel):
    feedback_id: str
    user_id: str
    product_id: str
    recommended_size: str
    user_purchased: bool
    user_returned: bool
    fit_feedback: str  # "Perfect", "Too Tight", "Too Loose"
    timestamp: str
