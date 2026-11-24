from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user
from core.rate_limit import limiter
from models.user import User
from models.graph import UserPreference, BrandAffinity
from models.measurement import EffectiveMeasurement
from services.conversation import ConversationEngine, ConversationResponse
from services.conversation.local_llm import ask_local_model
from services.stylist import RecommendationEngine as StylistEngine, StylistContext
from services.stylist.brand_engine import BRAND_SIZE_STEPS
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
    # UserPreference has one fit_preference column and BrandAffinity has
    # brand_id -- this used to read p.category / p.value / b.brand_name,
    # none of which exist, so chat 500'd for any user who had saved a fit
    # preference or a brand.
    pref_row = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    preferences = {"fit_preference": pref_row.fit_preference} if pref_row and pref_row.fit_preference else {}
    brand_affinity = [
        b.brand_id
        for b in db.query(BrandAffinity).filter(BrandAffinity.user_id == current_user.id).all()
        if (b.affinity_score or 0) > 0.5
    ]
    
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

        # The size in each brand we know, worked out here (not by the model).
        brand_sizes = {}
        for brand in BRAND_SIZE_STEPS:
            brand_rec = StylistEngine.get_recommendation(ctx.model_copy(update={"brand_name": brand}))
            brand_sizes[brand.title()] = brand_rec.recommended_size

        body = {
            "chest": measurements.chest_circumference,
            "waist": measurements.waist_circumference,
            "hip": measurements.hip_circumference,
            "shoulder": measurements.shoulder_width,
            "inseam": measurements.inseam,
        }
        return {
            "size": rec.recommended_size,
            "confidence": rec.confidence.overall,
            "size_up": rec.alternatives[0] if rec.alternatives else None,
            "brand_sizes": brand_sizes,
            "measurements": {k: v for k, v in body.items() if v},
        }

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
        get_product_rec=get_product_data,
        llm=ask_local_model,
    )
    
    return response
