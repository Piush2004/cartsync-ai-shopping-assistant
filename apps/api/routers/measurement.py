from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from core.deps import get_current_user
from core.rate_limit import limiter
from models.user import User
from models.measurement import MeasurementProfile, EffectiveMeasurement
from schemas.measurement import MeasurementUpload, EffectiveMeasurementResponse
import uuid

router = APIRouter()

@router.post("/extract", response_model=EffectiveMeasurementResponse)
@limiter.limit("10/minute")
def extract_measurements(
    request: Request,
    upload: MeasurementUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Save Raw Biometrics
    profile = MeasurementProfile(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        source_type=upload.source_type,
        raw_data=upload.raw_data
    )
    db.add(profile)

    # 2. Build Effective Measurements from exactly what the client sent.
    # A field the client omits stays None -- it must NOT be defaulted to a
    # plausible-looking constant (this endpoint used to fabricate chest/waist
    # with random jitter and hip/inseam/shoulder with fixed numbers whenever
    # they were missing, which silently invented body measurements the user
    # never provided and no algorithm ever computed).
    raw = upload.raw_data

    # 3. Confidence: for camera-derived measurements, use the caller's real,
    # computed confidence_breakdown (see apps/web/src/lib/cv/confidence) --
    # never invent one here. For manual entry there is no algorithm to be
    # "confident" about; the user directly stated the value, so it's treated
    # as fully trusted (1.0), not a fabricated AI-style score.
    if upload.source_type == "camera" and upload.confidence_breakdown:
        confidence_score = upload.confidence_breakdown["overall"]
    else:
        confidence_score = 1.0

    effective = EffectiveMeasurement(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        chest_circumference=raw.get("chest"),
        waist_circumference=raw.get("waist"),
        hip_circumference=raw.get("hip"),
        inseam=raw.get("inseam"),
        shoulder_width=raw.get("shoulder"),
        arm_length=raw.get("arm_length"),
        torso_length=raw.get("torso_length"),
        confidence_score=confidence_score,
        source_type=upload.source_type,
        model_version=upload.model_version,
        algorithm_version=upload.algorithm_version,
        calibration_method=upload.calibration_method,
        confidence_breakdown=upload.confidence_breakdown,
    )

    # Upsert logic: if user already has an effective measurement, replace it
    existing = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
    if existing:
        db.delete(existing)

    db.add(effective)
    db.commit()
    db.refresh(effective)

    return effective

@router.get("/history")
def get_measurement_history(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    profiles = db.query(MeasurementProfile).filter(MeasurementProfile.user_id == current_user.id).order_by(MeasurementProfile.created_at.desc()).all()
    return profiles
