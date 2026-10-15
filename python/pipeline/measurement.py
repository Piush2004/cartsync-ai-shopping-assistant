import os
import glob
import yaml
import time
import numpy as np
from typing import Dict, Any, List, Optional, Callable

from pipeline.context import PipelineContext
from utils.logger import logger

class FormulaRegistry:
    _registry: Dict[str, Callable] = {}
    
    @classmethod
    def register(cls, name: str):
        def decorator(func):
            cls._registry[name] = func
            return func
        return decorator
        
    @classmethod
    def get(cls, name: str) -> Optional[Callable]:
        return cls._registry.get(name)

@FormulaRegistry.register("euclidean_distance")
def euclidean_distance(lms: List[Dict[str, Any]], depth_scale: float = 1.0) -> float:
    if len(lms) != 2: return 0.0
    return float(np.sqrt(
        (lms[0]["metric_x"] - lms[1]["metric_x"])**2 + 
        (lms[0]["metric_y"] - lms[1]["metric_y"])**2 +
        ((lms[0]["metric_z"] - lms[1]["metric_z"]) * depth_scale)**2
    ))

@FormulaRegistry.register("vertical_distance")
def vertical_distance(lms: List[Dict[str, Any]], **kwargs) -> float:
    if len(lms) != 2: return 0.0
    return float(abs(lms[0]["metric_y"] - lms[1]["metric_y"]))

@FormulaRegistry.register("piecewise_euclidean")
def piecewise_euclidean(lms: List[Dict[str, Any]], depth_scale: float = 1.0) -> float:
    total = 0.0
    for i in range(len(lms)-1):
        total += euclidean_distance([lms[i], lms[i+1]], depth_scale)
    return total

@FormulaRegistry.register("elliptical_estimation")
def elliptical_estimation(lms: List[Dict[str, Any]], depth_scale: float = 1.0) -> float:
    if len(lms) != 2: return 0.0
    
    # Major axis (width from front camera)
    width = euclidean_distance(lms, 0.0) # ignore Z for frontal width
    a = width / 2.0
    
    # Minor axis (depth). Using heuristic 0.75 * width for waist/hip typically, but we should use actual depth maps
    # Future version: major axis -> front width, minor axis -> side thickness
    b = a * 0.75 
    
    # Ramanujan
    h = ((a - b)**2) / ((a + b)**2)
    perimeter = np.pi * (a + b) * (1 + (3 * h) / (10 + np.sqrt(4 - 3 * h)))
    return float(perimeter)
    
@FormulaRegistry.register("chest_elliptical_estimation")
def chest_elliptical_estimation(lms: List[Dict[str, Any]], depth_scale: float = 1.0) -> float:
    if len(lms) != 4: return 0.0
    
    # Interpolate Chest points (roughly 25% down from shoulder to hip)
    l_chest_x = lms[0]["metric_x"] + 0.25 * (lms[2]["metric_x"] - lms[0]["metric_x"])
    r_chest_x = lms[1]["metric_x"] + 0.25 * (lms[3]["metric_x"] - lms[1]["metric_x"])
    
    width = abs(l_chest_x - r_chest_x)
    a = width / 2.0
    b = a * 0.65 # chest is usually flatter than waist
    
    h = ((a - b)**2) / ((a + b)**2)
    perimeter = np.pi * (a + b) * (1 + (3 * h) / (10 + np.sqrt(4 - 3 * h)))
    return float(perimeter)


class MeasurementStage:
    PIPELINE_VERSION = "4.4E"
    MODEL_VERSION = "1.0.1"

    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            if not context.refined_skeleton:
                logger.warning("MeasurementStage skipped, no refined skeleton.", job_id=context.job_id)
                return
                
            defs_path = os.path.join(os.path.dirname(__file__), "..", "measurement_definitions")
            definitions = MeasurementStage._load_definitions(defs_path)
            
            front_lm = context.refined_skeleton.get("front", [])
            lm_map = {lm["name"]: lm for lm in front_lm}
            
            measurements = {}
            
            for d in definitions:
                name = d.get("measurement", "unknown")
                measurements[name] = MeasurementStage._compute_measurement(d, lm_map, context.quality_assessment)
                
            context.measurements = measurements

            duration = (time.time() - start_time) * 1000
            context.metrics["measurementTime"] = duration
            context.log("measurement", duration, "success")

        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("measurement", duration, "failed", error=str(e))
            raise

    @staticmethod
    def _load_definitions(path: str) -> List[Dict]:
        definitions = []
        if not os.path.exists(path):
            return definitions
            
        for f in glob.glob(os.path.join(path, "*.yaml")):
            with open(f, 'r') as file:
                try:
                    definitions.append(yaml.safe_load(file))
                except Exception as e:
                    logger.error(f"Failed to load yaml {f}: {e}")
        return definitions

    @staticmethod
    def _compute_measurement(definition: Dict, lm_map: Dict[str, Any], qa: Dict[str, Any]) -> Dict[str, Any]:
        required_names = definition.get("required_landmarks", [])
        formula_name = definition.get("formula", "")
        is_estimated = definition.get("estimated", False)
        min_quality = definition.get("minimum_quality", 0.0)
        category = definition.get("category", "unknown")
        
        # Extract inputs
        inputs = []
        confidence_scores = []
        for n in required_names:
            if n in lm_map:
                inputs.append(lm_map[n])
                confidence_scores.append(lm_map[n]["quality"])
                
        if len(inputs) != len(required_names):
            return {
                "value": None,
                "status": "missing_landmarks",
                "derivedFrom": required_names,
                "category": category,
                "pipelineVersion": MeasurementStage.PIPELINE_VERSION,
                "anthropometryModel": MeasurementStage.MODEL_VERSION
            }
            
        confidence = sum(confidence_scores) / len(confidence_scores)
        
        if confidence < min_quality:
            return {
                "value": None,
                "status": "insufficient_quality",
                "confidence": round(confidence, 3),
                "derivedFrom": required_names,
                "category": category,
                "pipelineVersion": MeasurementStage.PIPELINE_VERSION,
                "anthropometryModel": MeasurementStage.MODEL_VERSION
            }
        
        # Apply formula
        value = None
        func = FormulaRegistry.get(formula_name)
        if func:
            value = func(inputs)
            
        if value is None or value <= 0.0:
            return {
                "value": None,
                "status": "formula_error",
                "confidence": round(confidence, 3),
                "derivedFrom": required_names,
                "category": category,
                "pipelineVersion": MeasurementStage.PIPELINE_VERSION,
                "anthropometryModel": MeasurementStage.MODEL_VERSION
            }
            
        # Calculate statistical uncertainty (sum of variances)
        # We approximate sigma^2 for each component
        calib_score = qa.get("overallQuality", 0.9)
        
        # Base variance models (heuristics that can be replaced by real statistical models)
        var_pose = (1.0 - confidence)**2 * 10.0 # higher variance for bad pose
        var_calib = (1.0 - calib_score)**2 * 5.0 # calibration error
        var_model = 2.0 if is_estimated else 0.5 # model error (circumference vs skeletal)
        
        sigma_total_sq = var_pose + var_calib + var_model
        uncertainty = np.sqrt(sigma_total_sq)
            
        return {
            "value": round(value, 2),
            "uncertainty": round(float(uncertainty), 2),
            "status": "success",
            "method": formula_name,
            "estimated": is_estimated,
            "confidence": round(confidence, 3),
            "category": category,
            "derivedFrom": required_names,
            "pipelineVersion": MeasurementStage.PIPELINE_VERSION,
            "anthropometryModel": MeasurementStage.MODEL_VERSION
        }
