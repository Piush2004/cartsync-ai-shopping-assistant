from .measurement_validator import measurement_validator
from .body_mapping import body_mapping
from .shape_optimizer import shape_optimizer
from .calibration_engine import calibration_engine
from .body_shape import body_shape_classifier

class CalibrationReportGenerator:
    ALGORITHM_VERSION = "2.4.2"
    MEASUREMENT_VERSION = "2.1.3"
    CALIBRATION_VERSION = "1.2.0"
    BETA_MODEL_VERSION = "SMPL-v1.0-neutral"
    PROVIDER_COMPATIBILITY = "SMPL-v1.0"

    def generate_calibration_report(self, input_measurements: dict, max_iterations: int = 15, 
                                   beta_min: float = -3.5, beta_max: float = 3.5) -> dict:
        """
        Coordinates the entire calibration pipeline:
        1. Validates inputs.
        2. Normalizes body dimensions.
        3. Classifies Body Shape.
        4. Projects initial shape betas.
        5. Refines betas via optimization loop and maps quality labels.
        6. Constructs and returns the final report payload.
        """
        # Step 1: Validate measurements
        is_valid, warnings, error_msg = measurement_validator.validate_measurements(input_measurements)
        if not is_valid:
            return {
                "status": "FAILED",
                "error": error_msg,
                "warnings": warnings,
                "qualityScore": 0.0
            }

        # Step 2: Normalize body vector
        norm_vector = body_mapping.map_to_normalized_vector(input_measurements)
        
        # Step 3: Classify Body Shape
        shape_name, shape_confidence = body_shape_classifier.classify_shape(input_measurements)
        
        # Step 4: Set up initial shape coefficients via Linear Regression
        initial_betas = shape_optimizer.optimize_betas(norm_vector)
        
        # Step 5: Calibrate and clamp betas within configured ranges
        calibration_results = calibration_engine.calibrate(
            input_measurements, initial_betas, norm_vector,
            max_iterations=max_iterations, beta_min=beta_min, beta_max=beta_max
        )
        
        calibrated_betas = calibration_results["betas"]
        per_meas_errors = calibration_results["perMeasurementErrors"]
        overall_err = calibration_results["overallError"]
        history = calibration_results["history"]
        quality = calibration_results["quality"]
        engine_metadata = calibration_results["metadata"]

        # Step 6: Get confidence values for every optimized beta parameter
        betas_confidence = shape_optimizer.get_betas_confidence(calibrated_betas)

        # Step 7: Calculate overall quality score (0-100)
        # Excellent: error < 1.0cm -> Score > 90
        # Very Good: error < 2.0cm -> Score > 80
        # Acceptable: error < 3.0cm -> Score > 70
        # Needs Recalibration: error >= 3.0cm -> Score < 70
        base_score = 100.0 - (overall_err * 6.0)
        base_score -= len(warnings) * 4.0
        quality_score = max(0.0, min(100.0, base_score))

        # Overall Reliability Metadata (Step 3)
        reliability = {
            "quality": quality,
            "confidence": round(quality_score / 100.0, 3),
            "overallError": overall_err
        }

        # Return payload
        return {
            "status": "SUCCESS",
            "bodyShapeClassification": {
                "shape": shape_name,
                "confidence": shape_confidence
            },
            "normalizedBodyVector": [round(v, 4) for v in norm_vector],
            "optimizedShapeParameters": {
                "betas": calibrated_betas,
                "betasConfidence": betas_confidence,
                "gender": input_measurements.get("gender", "neutral")
            },
            "reliability": reliability,
            "perMeasurementErrors": per_meas_errors,
            "calibrationHistory": history,
            "qualityScore": round(quality_score, 1),
            "warnings": warnings,
            "calibrationMetadata": {
                "iterations": engine_metadata["iterations"],
                "converged": engine_metadata["converged"],
                "runtimeMs": engine_metadata["runtimeMs"],
                "optimizer": engine_metadata["optimizer"],
                "measurementVersion": self.MEASUREMENT_VERSION,
                "calibrationVersion": self.CALIBRATION_VERSION,
                "betaModelVersion": self.BETA_MODEL_VERSION,
                "algorithmVersion": self.ALGORITHM_VERSION,
                "providerCompatibility": self.PROVIDER_COMPATIBILITY
            }
        }

report_generator = CalibrationReportGenerator()
