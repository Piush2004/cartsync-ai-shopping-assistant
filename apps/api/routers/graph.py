from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from core.deps import get_current_user
from models.user import User
from models.graph import BrandAffinity, UserPreference
from models.measurement import EffectiveMeasurement, MeasurementProfile
from schemas.graph import KnowledgeGraphResponse

router = APIRouter()

@router.get("/me", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    measurements = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
    raw_measurements_profile = db.query(MeasurementProfile).filter(MeasurementProfile.user_id == current_user.id).order_by(MeasurementProfile.created_at.desc()).first()
    affinities = db.query(BrandAffinity).filter(BrandAffinity.user_id == current_user.id).all()
    preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()

    # Calculate profile confidence based on available data
    completed_items = 0
    if measurements: completed_items += 1
    if affinities: completed_items += 1
    if preferences and (preferences.fit_preference or preferences.style_dna): completed_items += 1
    profile_confidence = (completed_items / 3.0) * 100.0 if completed_items > 0 else 0.0

    calibration_offsets = {aff.brand_id: aff.size_offset for aff in affinities if aff.size_offset != 0.0}

    last_updated_dates = [x.last_updated for x in [measurements, preferences] + affinities if x and hasattr(x, 'last_updated')]
    latest_update = max(last_updated_dates) if last_updated_dates else None

    return {
        "user_id": current_user.id,
        "effective_measurements": measurements,
        "brand_affinity": affinities,
        "preferences": preferences,
        "raw_measurements": raw_measurements_profile.raw_data if raw_measurements_profile else None,
        "calibration_offsets": calibration_offsets,
        "profile_confidence": profile_confidence,
        "graph_version": "v1.1.0",
        "last_updated": latest_update
    }
