class MeasurementValidator:
    def validate_measurements(self, measurements: dict) -> tuple:
        """
        Validates the body dimensions to reject anatomically impossible combinations.
        Returns: (is_valid: bool, warnings: list, error_message: str)
        """
        warnings = []
        
        # Required keys mapping (handling both Cm suffix and legacy names)
        height = float(measurements.get("heightCm", measurements.get("height", 0.0)))
        chest = float(measurements.get("chestCm", measurements.get("chest", 0.0)))
        waist = float(measurements.get("waistCm", measurements.get("waist", 0.0)))
        hips = float(measurements.get("hipsCm", measurements.get("hips", 0.0)))
        shoulders = float(measurements.get("shoulderWidthCm", measurements.get("shoulderWidth", 0.0)))
        inseam = float(measurements.get("inseamCm", measurements.get("inseam", 0.0)))
        sleeve = float(measurements.get("sleeveCm", measurements.get("sleeve", 0.0)))
        arm = float(measurements.get("armLengthCm", sleeve))  # Fallback to sleeve if arm missing
        neck = float(measurements.get("neckCm", measurements.get("neck", 0.0)))
        thigh = float(measurements.get("thighCm", hips * 0.55))
        calf = float(measurements.get("calfCm", hips * 0.38))

        if height < 100.0 or height > 250.0:
            return False, [], f"Anatomical anomaly: Height ({height}cm) is outside human bounds (100-250cm)."
            
        if chest < 40.0 or chest > 200.0:
            return False, [], f"Anatomical anomaly: Chest ({chest}cm) is outside human bounds (40-200cm)."

        # Ratio-based anatomical validations
        # 1. Inseam must be less than height
        if inseam >= height * 0.60:
            return False, [], f"Anatomical anomaly: Inseam ({inseam}cm) exceeds 60% of total height ({height}cm)."
            
        # 2. Arm length must be less than height
        if arm >= height * 0.55:
            return False, [], f"Anatomical anomaly: Arm length ({arm}cm) exceeds 55% of total height ({height}cm)."
            
        # 3. Shoulder width check
        if shoulders >= height * 0.45 or shoulders <= height * 0.15:
            warnings.append(f"Shoulder width ({shoulders}cm) is unusual for height ({height}cm).")

        # 4. Waist check relative to hips
        if waist > hips * 1.4:
            warnings.append(f"Waist circumference ({waist}cm) is exceptionally large relative to hips ({hips}cm).")
            
        return True, warnings, ""

measurement_validator = MeasurementValidator()
