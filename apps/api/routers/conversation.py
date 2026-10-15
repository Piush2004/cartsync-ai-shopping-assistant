from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user
from core.rate_limit import limiter
from models.user import User
from models.graph import UserPreference, BrandAffinity
from models.measurement import EffectiveMeasurement
from services.conversation import ConversationEngine, ConversationResponse
from services.stylist import RecommendationEngine as StylistEngine, StylistContext
from services.product_intelligence import ProductRecommendationEngine, ProductIntelligenceRequest

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

@router.post("/chat", response_model=ConversationResponse)
@limiter.limit("20/minute")
def chat_with_stylist(
    request: Request,
    request_body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user data (basic)
    preferences = {p.category: p.value for p in db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()}
    brand_affinity = [b.brand_name for b in db.query(BrandAffinity).filter(BrandAffinity.user_id == current_user.id).all() if b.affinity_score > 0.5]
    
    user_profile = {
        "preferred_fit": preferences.get("fit_preference", "Regular"),
        "favorite_brands": brand_affinity
    }
    
    # Define lazy getters for the engines so we only invoke them if the Tool Router decides we need them.
    def _build_stylist_context(measurements):
        return StylistContext(
            chest=measurements.chest_circumference or 0.0,
            waist=measurements.waist_circumference or 0.0,
            brand_name="Generic",
            fit_preference=preferences.get("fit_preference", "Regular")
        )

    def get_stylist_data():
        measurements = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
        if not measurements:
            return None
        ctx = _build_stylist_context(measurements)
        rec = StylistEngine.get_recommendation(ctx)
        return {"size": rec.recommended_size, "confidence": rec.confidence.overall}

    def get_product_data():
        measurements = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
        if not measurements:
            return []
        ctx = _build_stylist_context(measurements)
        rec = StylistEngine.get_recommendation(ctx)
        pi_req = ProductIntelligenceRequest(preferences=preferences, stylist_recommendation=rec, brand_affinity=brand_affinity)
        res = ProductRecommendationEngine.get_recommendations(pi_req)
        return [{"name": p.product.name, "score": int(p.fit_score * 100), "size": p.recommended_size} for p in res.products[:3]]

    # Process through Conversation Engine
    response = ConversationEngine.process_message(
        question=request_body.question,
        history=[],
        user_profile=user_profile,
        get_stylist_rec=get_stylist_data,
        get_product_rec=get_product_data
    )
    
    return response
