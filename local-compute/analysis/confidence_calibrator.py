class ConfidenceCalibrator:
    def calibrate_measurement_confidence(self, abs_error: float, expected_error: float, 
                                         landmark_visibility: float, image_quality_score: float) -> float:
        """
        Calibrates confidence dynamically so it correlates with actual error.
        Formula:
          base = landmark_visibility * image_quality_score
          penalty = (abs_error / max(expected_error, 0.1)) * 0.25
          calibrated_confidence = max(0.0, min(1.0, base - penalty))
        """
        base = float(landmark_visibility * image_quality_score)
        
        # Penalize if error exceeds expected margins
        penalty = (abs_error / max(expected_error, 0.1)) * 0.25
        
        calibrated = max(0.0, min(1.0, base - penalty))
        return round(calibrated, 3)

confidence_calibrator = ConfidenceCalibrator()
