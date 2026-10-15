import math

from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

# Broad but physically plausible bounds (cm) for a human body circumference/length.
# Rejecting outside this range stops obviously impossible data (negative, NaN,
# Infinity, or absurd values like 999999) from silently reaching the Knowledge Graph.
_MEASUREMENT_BOUNDS_CM = {
    "chest": (20.0, 250.0),
    "waist": (20.0, 250.0),
    "hip": (20.0, 250.0),
    "inseam": (20.0, 150.0),
    "shoulder": (10.0, 100.0),
    "arm_length": (10.0, 120.0),
    "torso_length": (10.0, 120.0),
}

_CONFIDENCE_FACTORS = {"overall", "pose", "image_quality", "calibration", "geometry", "front_side_consistency"}


class MeasurementUpload(BaseModel):
    source_type: str  # 'manual', 'camera', etc.
    raw_data: Dict[str, Any]

    # Provenance for camera-derived measurements (see apps/web/src/lib/cv).
    # All optional and unused for manual entry -- there is nothing to
    # calibrate/derive-confidence-for when the user typed the number in
    # themselves.
    model_version: Optional[str] = None
    algorithm_version: Optional[str] = None
    calibration_method: Optional[str] = None
    confidence_breakdown: Optional[Dict[str, float]] = None

    @field_validator("raw_data")
    @classmethod
    def validate_raw_data(cls, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        for key, (low, high) in _MEASUREMENT_BOUNDS_CM.items():
            if key not in raw_data:
                continue
            value = raw_data[key]
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"'{key}' must be a number, got {type(value).__name__}")
            if not math.isfinite(value):
                raise ValueError(f"'{key}' must be a finite number, got {value}")
            if not (low <= value <= high):
                raise ValueError(f"'{key}'={value} is outside the plausible range [{low}, {high}] cm")
        return raw_data

    @field_validator("confidence_breakdown")
    @classmethod
    def validate_confidence_breakdown(cls, breakdown: Optional[Dict[str, float]]) -> Optional[Dict[str, float]]:
        if breakdown is None:
            return breakdown
        if "overall" not in breakdown:
            raise ValueError("confidence_breakdown must include an 'overall' value")
        for key, value in breakdown.items():
            if key not in _CONFIDENCE_FACTORS:
                raise ValueError(f"unknown confidence factor '{key}'")
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError(f"confidence_breakdown['{key}'] must be a finite number")
            if not (0.0 <= value <= 1.0):
                raise ValueError(f"confidence_breakdown['{key}']={value} must be between 0.0 and 1.0")
        return breakdown


class EffectiveMeasurementResponse(BaseModel):
    id: str
    chest_circumference: Optional[float]
    waist_circumference: Optional[float]
    hip_circumference: Optional[float]
    inseam: Optional[float]
    shoulder_width: Optional[float]
    arm_length: Optional[float] = None
    torso_length: Optional[float] = None
    confidence_score: float
    source_type: Optional[str] = None
    model_version: Optional[str] = None
    algorithm_version: Optional[str] = None
    calibration_method: Optional[str] = None
    confidence_breakdown: Optional[Dict[str, float]] = None
    last_updated: datetime

    class Config:
        from_attributes = True
