import os
import time
from PIL import Image
from services.image_validator import image_validator
from services.pose_detection import pose_detection_service
from services.measurement_calculator import measurement_calculator_service
from services.height_calibration import height_calibration_service
from services.profile_builder import profile_builder_service
from depth.depth_manager import depth_manager
from avatar.calibration_report import report_generator

class MeasurementPipeline:
    def __init__(self):
        self.version = "1.0.0"

    def run_pipeline(self, front_image_path: str, side_image_path: str, 
                     height_cm: float, uid: str, gender: str = "neutral") -> dict:
        """
        Coordinates the entire body measurement pipeline from raw images to Firestore.
        """
        pipeline_start = time.perf_counter()
        stage_timings = {}
        warnings = []
        
        # 1. Load Images
        try:
            front_img = Image.open(front_image_path)
            side_img = Image.open(side_image_path)
        except Exception as e:
            raise ValueError(f"Pipeline failed to open input images: {e}")

        # --- STAGE 1: Image Validation ---
        stage_start = time.perf_counter()
        front_val = image_validator.validate_image(front_image_path, 'front')
        side_val = image_validator.validate_image(side_image_path, 'side')
        
        warnings.extend(front_val.get("warnings", []))
        warnings.extend(side_val.get("warnings", []))
        
        if not front_val.get("valid", True):
            warnings.append(f"Front image validation alerts: {front_val.get('issues')}")
        if not side_val.get("valid", True):
            warnings.append(f"Side image validation alerts: {side_val.get('issues')}")
            
        stage_timings["imageValidation"] = round((time.perf_counter() - stage_start) * 1000.0, 2)

        # --- STAGE 2: Pose Detection (MediaPipe Pose) ---
        stage_start = time.perf_counter()
        try:
            front_landmarks = pose_detection_service.detect_landmarks(front_img, 'front')
            side_landmarks = pose_detection_service.detect_landmarks(side_img, 'side')
        except Exception as e:
            raise ValueError(f"Pose landmark extraction failed: {e}")
        stage_timings["poseDetection"] = round((time.perf_counter() - stage_start) * 1000.0, 2)

        # --- STAGE 3: Depth Map & Refiner ---
        stage_start = time.perf_counter()
        depth_res = depth_manager.process_depth(front_img)
        if depth_res.get("status") != "SUCCESS":
            warnings.append("Depth map calculation returned failure status.")
        stage_timings["depthEstimation"] = round((time.perf_counter() - stage_start) * 1000.0, 2)

        # --- STAGE 4: Measurement Calculator ---
        stage_start = time.perf_counter()
        # Calibrate height pixel conversions
        pixels_per_cm = height_calibration_service.calculate_pixels_per_cm(front_landmarks, height_cm)
        
        # Calculate raw centimeter metrics
        measurements = measurement_calculator_service.calculate_measurements(
            front_landmarks, side_landmarks, pixels_per_cm
        )
        stage_timings["measurementCalculation"] = round((time.perf_counter() - stage_start) * 1000.0, 2)

        # --- STAGE 5: Calibration Engine (Betas Optimizer) ---
        stage_start = time.perf_counter()
        # Enforce height, gender parameters inside input dictionary
        calibration_inputs = dict(measurements)
        calibration_inputs["heightCm"] = height_cm
        calibration_inputs["gender"] = gender
        
        calibration_report = report_generator.generate_calibration_report(calibration_inputs)
        if calibration_report.get("status") != "SUCCESS":
            raise RuntimeError(f"Calibration optimization failed: {calibration_report.get('error')}")
            
        stage_timings["shapeCalibration"] = round((time.perf_counter() - stage_start) * 1000.0, 2)

        # --- STAGE 6: Save Profile to Firestore ---
        stage_start = time.perf_counter()
        confidence_info = {
            "confidence": min(front_val.get("confidence", 1.0), side_val.get("confidence", 1.0)),
            "overall": "GOOD" if len(warnings) < 3 else "WARNING",
            "warnings": warnings
        }
        
        # Add calibrated betas to measurements record to include them in the final profile build
        calibrated_betas = calibration_report["optimizedShapeParameters"]["betas"]
        measurements["shapeBetas"] = calibrated_betas
        measurements["bodyShape"] = calibration_report["bodyShapeClassification"]["shape"]
        measurements["gender"] = gender
        
        profile = profile_builder_service.build_and_save_profile(
            uid, height_cm, measurements, confidence_info, front_landmarks, side_landmarks
        )
        stage_timings["profileSaves"] = round((time.perf_counter() - stage_start) * 1000.0, 2)

        total_runtime_ms = (time.perf_counter() - pipeline_start) * 1000.0

        # Return full diagnostics
        return {
            "status": "SUCCESS",
            "profile": profile,
            "metadata": {
                "totalRuntimeMs": round(total_runtime_ms, 2),
                "stageTimings": stage_timings,
                "confidence": confidence_info["confidence"],
                "warnings": warnings,
                "versions": {
                    "pipeline": self.version,
                    "mediaPipe": "2.3.0",
                    "depthAnything": depth_res["metadata"]["modelVersion"],
                    "calibration": calibration_report["calibrationMetadata"]["calibrationVersion"]
                }
            }
        }

measurement_pipeline = MeasurementPipeline()
