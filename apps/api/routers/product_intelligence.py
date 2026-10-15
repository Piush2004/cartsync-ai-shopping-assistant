from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user
from core.rate_limit import limiter
from models.user import User
from models.measurement import EffectiveMeasurement
from models.graph import UserPreference, BrandAffinity
from services.stylist import RecommendationEngine as StylistEngine, StylistContext
from services.product_intelligence import ProductRecommendationEngine, ProductIntelligenceRequest, ProductIntelligenceResponse

router = APIRouter()

@router.get("/recommendations", response_model=ProductIntelligenceResponse)
@limiter.limit("30/minute")
def get_product_recommendations(
    request: Request,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Gather Context
    measurements = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
    if not measurements:
        raise HTTPException(status_code=400, detail="Missing effective measurements")

    preferences_records = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()
    preferences = {p.category: p.value for p in preferences_records}

    brand_affinity_records = db.query(BrandAffinity).filter(BrandAffinity.user_id == current_user.id).all()
    brand_affinity = [b.brand_name for b in brand_affinity_records if b.affinity_score > 0.5]

    # 2. Call Stylist for base sizing logic (we assume a generic brand for a baseline size)
    # In a real scenario, the stylist might compute a size per product, but here we do it broadly.
    stylist_ctx = StylistContext(
        chest=measurements.chest_circumference or 0.0,
        waist=measurements.waist_circumference or 0.0,
        brand_name="Generic", # or calculate per product
        fit_preference=preferences.get("fit_preference", "Regular")
    )
    stylist_rec = StylistEngine.get_recommendation(stylist_ctx)

    # 3. Request Product Intelligence
    pi_request = ProductIntelligenceRequest(
        preferences=preferences,
        stylist_recommendation=stylist_rec,
        brand_affinity=brand_affinity
    )
    
    response = ProductRecommendationEngine.get_recommendations(pi_request)
    
    # Optional: Filter by category if requested
    if category:
        response.products = [p for p in response.products if p.product.category.lower() == category.lower()]
        
    return response
