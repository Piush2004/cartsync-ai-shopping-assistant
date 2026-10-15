class HeightCalibrationService:
    def calculate_pixels_per_cm(self, landmarks, actual_height_cm: float) -> float:
        """
        Calculates conversion factor (normalized pixels per cm)
        using the nose-to-ankle distance and actual height.
        """
        if actual_height_cm <= 0:
            raise ValueError("Invalid height value provided for calibration.")
            
        # Nose Y
        nose_y = landmarks[0].y
        # Average ankles Y
        ankles_y = (landmarks[27].y + landmarks[28].y) / 2
        
        body_height_pixels = abs(ankles_y - nose_y)
        
        # Nose-to-ankles is ~90% of total physical height. Scale by 1.1x.
        full_height_pixels = body_height_pixels * 1.1
        
        pixels_per_cm = full_height_pixels / actual_height_cm
        if pixels_per_cm <= 0:
            raise ValueError("Calculated height scaling factor is non-positive.")
            
        return pixels_per_cm

height_calibration_service = HeightCalibrationService()
