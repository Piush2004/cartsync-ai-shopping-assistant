from workers.base_worker import BaseWorker
from services.image_validator import image_validator as image_validation_service
from services.pose_detection import pose_detection_service
from services.height_calibration import height_calibration_service
from services.measurement_calculator import measurement_calculator_service
from services.confidence_engine import confidence_engine_service
from services.profile_builder import profile_builder_service

class MeasurementWorker(BaseWorker):
    def __init__(self):
        super().__init__("MeasurementWorker", ["MEASUREMENT"])

    def execute(self, payload: dict) -> dict:
        """
        Coordinates the measurement extraction workflow:
        1. Validate inputs
        2. Quality validations
        3. Pose landmarks detections
        4. Calibration
        5. Geometric estimations
        6. Confidence rating
        7. Save profile to Firestore
        """
        uid = payload.get("uid")
        front_image_url = payload.get("frontImageUrl")
        side_image_url = payload.get("sideImageUrl")
        height = payload.get("height")

        # 1. Validation checks on incoming payload
        if not uid:
            raise ValueError("Payload missing user identifier ('uid').")
        if not front_image_url or not side_image_url:
            raise ValueError("Payload missing image URLs ('frontImageUrl', 'sideImageUrl').")
        if height is None:
            raise ValueError("Payload missing physical height value ('height').")

        try:
            height_cm = float(height)
        except (TypeError, ValueError):
            raise ValueError(f"Invalid height value '{height}'. Must be a number.")

        print(f"[MeasurementWorker] Commencing measurement pipeline for UID: {uid}")

        # --- STEP 1: IMAGE DOWNLOAD & QUALITY VALIDATION ---
        print("[MeasurementWorker] Stage 1/7: Running image quality validations...")
        from agents.validation_agent import validation_agent
        validation_res = validation_agent.validate_inputs(payload)
        if not validation_res["valid"]:
            raise ValueError(f"Validation failed: {', '.join(validation_res['issues'])}")

        front_img = image_validation_service.download_image(front_image_url)
        front_quality = image_validation_service.validate(front_img, "Front")

        side_img = image_validation_service.download_image(side_image_url)
        side_quality = image_validation_service.validate(side_img, "Side")

        # --- STEP 2: POSE DETECTION (MEDIAPIPE) ---
        print("[MeasurementWorker] Stage 2/7: Running body landmark detection...")
        front_landmarks = pose_detection_service.detect_landmarks(front_img, expected_view='front')
        side_landmarks = pose_detection_service.detect_landmarks(side_img, expected_view='side')

        # --- STEP 3: HEIGHT CALIBRATION (MEASUREMENT FUSION ENGINE) ---
        print("[MeasurementWorker] Stage 3/7: Running scale calibration...")
        front_pixels_per_cm = height_calibration_service.calculate_pixels_per_cm(front_landmarks, height_cm)
        side_pixels_per_cm = height_calibration_service.calculate_pixels_per_cm(side_landmarks, height_cm)
        pixels_per_cm = (front_pixels_per_cm + side_pixels_per_cm) / 2
        print(f"[MeasurementWorker] Fusion calibration scale: {round(pixels_per_cm, 4)} pixels/cm")

        # --- STEP 4: MEASUREMENT CALCULATOR ---
        print("[MeasurementWorker] Stage 4/7: Estimating body measurements...")
        measurements = measurement_calculator_service.calculate_measurements(
            front_landmarks,
            side_landmarks,
            pixels_per_cm,
            height_cm
        )

        # --- STEP 5: CONFIDENCE SCORE ---
        print("[MeasurementWorker] Stage 5/7: Computing pipeline confidence score...")
        confidence_info = confidence_engine_service.calculate_confidence(
            front_landmarks,
            side_landmarks,
            front_quality,
            side_quality
        )
        
        # Merge symmetry and proportion checks warnings (Step 2 & 5)
        if "warnings" not in confidence_info:
            confidence_info["warnings"] = []
        confidence_info["warnings"].extend(measurements.get("warnings", []))

        # --- STEP 6: PROFILE BUILDER & FIRESTORE SAVE ---
        print("[MeasurementWorker] Stage 6/7: Formatting profile and writing to Firestore...")
        profile = profile_builder_service.build_and_save_profile(
            uid,
            height_cm,
            measurements,
            confidence_info,
            front_landmarks,
            side_landmarks
        )

        print(f"[MeasurementWorker] Stage 7/7: Pipeline completed successfully for UID: {uid}")
        return profile
