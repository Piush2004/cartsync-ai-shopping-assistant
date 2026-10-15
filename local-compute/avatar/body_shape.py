class BodyShapeClassifier:
    def classify_shape(self, measurements: dict) -> tuple:
        """
        Classifies body shape based on bust/chest, waist, and hip ratios.
        Returns: (shape_name: str, confidence: float)
        """
        chest = float(measurements.get("chestCm", measurements.get("chest", 95.0)))
        waist = float(measurements.get("waistCm", measurements.get("waist", 80.0)))
        hips = float(measurements.get("hipsCm", measurements.get("hips", 98.0)))
        shoulders = float(measurements.get("shoulderWidthCm", measurements.get("shoulderWidth", 42.0)))

        # Simple classification heuristics based on standard anthropometric ratios
        waist_hip_ratio = waist / hips
        waist_chest_ratio = waist / chest
        chest_hip_ratio = chest / hips
        shoulder_hip_ratio = shoulders / (hips * 0.45) # estimated shoulder width ratio

        if waist_hip_ratio < 0.75 and waist_chest_ratio < 0.75:
            # Hourglass (small waist relative to chest and hips)
            diff_chest_hips = abs(chest - hips) / hips
            if diff_chest_hips < 0.08:
                return "Hourglass", round(0.95 - diff_chest_hips, 2)
            else:
                return "Pear", round(0.85 + diff_chest_hips, 2)
                
        if hips / chest >= 1.08:
            # Pear (hips significantly larger than chest)
            return "Pear", round(min(0.98, 0.80 + (hips / chest - 1.08)), 2)
            
        if chest / hips >= 1.08 or shoulder_hip_ratio >= 1.10:
            # Inverted Triangle (chest or shoulders significantly larger than hips)
            return "Inverted Triangle", 0.90
            
        if waist > chest and waist > hips:
            # Oval / Apple (waist larger than both chest and hips)
            return "Oval", 0.88
            
        if abs(chest - hips) / hips < 0.05 and waist_hip_ratio >= 0.80:
            # Rectangle (minimal curves, chest and hips balanced, waist is not small)
            return "Rectangle", 0.92
            
        if chest < hips and waist_hip_ratio >= 0.75:
            # Triangle
            return "Triangle", 0.85

        # Fallback default
        return "Rectangle", 0.70

body_shape_classifier = BodyShapeClassifier()
