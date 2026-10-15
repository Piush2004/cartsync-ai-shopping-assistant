from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from core.deps import get_current_user
from models.user import User
import uuid
from models.graph import UserPreference, BrandAffinity
from models.measurement import EffectiveMeasurement
from services.stylist import RecommendationEngine, StylistContext
from typing import Optional

router = APIRouter()

@router.get("/recommendation")
def get_recommendation(brand_name: str = "Nike", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Gather Knowledge Graph Data
    eff_meas = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
    if not eff_meas or not eff_meas.chest_circumference:
        raise HTTPException(status_code=400, detail="Missing effective measurements for chest")
        
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    fit_pref = pref.fit_preference if pref and pref.fit_preference else "Regular"
    
    # Build Context
    ctx = StylistContext(
        chest=eff_meas.chest_circumference,
        waist=eff_meas.waist_circumference or 0.0,
        brand_name=brand_name,
        fit_preference=fit_pref
    )
    
    # Deterministic Engine Run
    rec = RecommendationEngine.get_recommendation(ctx)
    return rec

@router.get("/brands")
def get_brands():
    return ["Nike", "Zara", "Uniqlo", "H&M", "Levi's"]

@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []

@router.post("/preferences")
def update_preferences(fit_preference: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(id=str(uuid.uuid4()), user_id=current_user.id, fit_preference=fit_preference)
        db.add(pref)
    else:
        pref.fit_preference = fit_preference
    db.commit()
    return {"status": "success"}
