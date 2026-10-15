class BodyMapping:
    def map_to_normalized_vector(self, measurements: dict) -> list:
        """
        Maps raw input dimensions into a normalized 11-element float vector.
        Each dimension is expressed as a ratio of the overall height.
        """
        height = float(measurements.get("heightCm", measurements.get("height", 175.0)))
        chest = float(measurements.get("chestCm", measurements.get("chest", 95.0)))
        waist = float(measurements.get("waistCm", measurements.get("waist", 80.0)))
        hips = float(measurements.get("hipsCm", measurements.get("hips", 98.0)))
        shoulders = float(measurements.get("shoulderWidthCm", measurements.get("shoulderWidth", 42.0)))
        inseam = float(measurements.get("inseamCm", measurements.get("inseam", 80.0)))
        sleeve = float(measurements.get("sleeveCm", measurements.get("sleeve", 60.0)))
        arm = float(measurements.get("armLengthCm", sleeve))
        neck = float(measurements.get("neckCm", measurements.get("neck", 38.0)))
        thigh = float(measurements.get("thighCm", hips * 0.55))
        calf = float(measurements.get("calfCm", hips * 0.38))

        # Normalized Vector: scaled as ratios relative to overall height
        vector = [
            1.0,                    # Height ratio (always 1.0)
            shoulders / height,     # Shoulders ratio
            chest / height,         # Chest ratio
            waist / height,         # Waist ratio
            hips / height,          # Hips ratio
            neck / height,          # Neck ratio
            sleeve / height,        # Sleeve ratio
            arm / height,           # Arm ratio
            inseam / height,        # Inseam ratio
            thigh / height,         # Thigh ratio
            calf / height           # Calf ratio
        ]
        return vector

body_mapping = BodyMapping()
