class ConfidenceEngineService:
    def calculate_confidence(self, front_landmarks, side_landmarks, front_quality: dict, side_quality: dict, calibration_dev: float = 0.0) -> dict:
        """
        Calculates a dynamic confidence score and quality info object using:
        - Pose confidence
        - Image quality (sharpness, contrast)
        - Calibration accuracy
        - Landmark visibility (detects points below 0.65 threshold)
        """
        # Critical landmarks indices: nose (0), shoulders (11,12), hips (23,24), knees (25,26), ankles (27,28)
        indices = [0, 11, 12, 23, 24, 25, 26, 27, 28]
        warnings = []

        # Landmark visibility check
        front_vis = [getattr(front_landmarks[i], 'visibility', 1.0) for i in indices]
        side_vis = [getattr(side_landmarks[i], 'visibility', 1.0) for i in indices]
        
        low_vis_front = sum(1 for v in front_vis if v < 0.65)
        low_vis_side = sum(1 for v in side_vis if v < 0.65)
        
        if low_vis_front > 0:
            warnings.append(f"Front view has {low_vis_front} low-visibility critical landmarks.")
        if low_vis_side > 0:
            warnings.append(f"Side view has {low_vis_side} low-visibility critical landmarks.")

        avg_vis = (sum(front_vis) / len(front_vis) + sum(side_vis) / len(side_vis)) / 2

        # Body alignment factor
        hip_center_x = (front_landmarks[23].x + front_landmarks[24].x) / 2
        nose_x = front_landmarks[0].x
        alignment_offset = abs(nose_x - hip_center_x)
        alignment_score = max(0.0, 1.0 - (alignment_offset * 3.0))

        # Sharpness & Quality factor
        f_sharp = front_quality.get("sharpness", 15.0)
        s_sharp = side_quality.get("sharpness", 15.0)
        sharpness_score = min(1.0, (f_sharp + s_sharp) / 35.0)

        f_contrast = front_quality.get("contrast", 50.0)
        s_contrast = side_quality.get("contrast", 50.0)
        contrast_score = min(1.0, (f_contrast + s_contrast) / 120.0)

        # Calibration accuracy (calibration deviation factor, if high deviation, penalize score)
        calibration_score = max(0.5, 1.0 - calibration_dev)

        # Dynamic combination
        score = (avg_vis * 0.4) + (alignment_score * 0.2) + (sharpness_score * 0.15) + (contrast_score * 0.1) + (calibration_score * 0.15)
        confidence = round(max(0.40, min(0.99, score)), 2)

        overall_quality = "EXCELLENT" if confidence > 0.85 else ("GOOD" if confidence > 0.70 else "POOR")
        
        return {
            "confidence": confidence,
            "overall": overall_quality,
            "warnings": warnings,
            "low_visibility_count": low_vis_front + low_vis_side
        }

confidence_engine_service = ConfidenceEngineService()
