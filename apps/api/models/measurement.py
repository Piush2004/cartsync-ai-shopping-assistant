from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class MeasurementProfile(Base):
    """
    Immutable raw biometric measurements generated from the scanning pipeline.
    """
    __tablename__ = "measurement_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    source_type = Column(String) # e.g. 'iphone_lidar', 'web_camera', 'manual'
    raw_data = Column(JSON) # Stores raw landmarks/meshes (highly sensitive)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class EffectiveMeasurement(Base):
    """
    Derived, mutable measurements after applying the user's calibration preferences.
    This is what the Knowledge Graph and Stylist read.
    """
    __tablename__ = "effective_measurements"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    chest_circumference = Column(Float)
    waist_circumference = Column(Float)
    hip_circumference = Column(Float)
    inseam = Column(Float)
    shoulder_width = Column(Float)
    arm_length = Column(Float)
    torso_length = Column(Float)

    confidence_score = Column(Float) # 0.0 to 1.0

    # Provenance: where this measurement came from and how it was derived.
    # source_type mirrors MeasurementProfile.source_type ('manual', 'camera',
    # ...) so the UI/API can show "estimated from your camera scan" vs "you
    # entered this" without guessing from which fields happen to be null.
    source_type = Column(String, default="manual")
    model_version = Column(String, nullable=True)       # e.g. "mediapipe-pose-landmarker-full-1"
    algorithm_version = Column(String, nullable=True)    # e.g. "geometric-v1"
    calibration_method = Column(String, nullable=True)   # e.g. "user_height"
    # Per-factor confidence breakdown (pose/image_quality/calibration/geometry/
    # front_side_consistency/overall), see lib/cv/confidence. Null for manual entry.
    confidence_breakdown = Column(JSON, nullable=True)

    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
