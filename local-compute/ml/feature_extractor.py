import numpy as np

class FeatureExtractor:
    def extract_features(self, measurements: dict, confidence: float, 
                         landmark_visibility: float, body_shape: str) -> np.ndarray:
        """
        Extracts 1D vector of geometric measurements, body ratios, 
        posture angles, and depth metadata.
        """
        # 1. Base Geometry features
        height = float(measurements.get("height", measurements.get("heightCm", 175.0)))
        shoulders = float(measurements.get("shoulderWidth", measurements.get("shoulderWidthCm", 42.0)))
        chest = float(measurements.get("chest", measurements.get("chestCm", 95.0)))
        waist = float(measurements.get("waist", measurements.get("waistCm", 80.0)))
        hips = float(measurements.get("hips", measurements.get("hipsCm", 98.0)))
        sleeve = float(measurements.get("sleeve", measurements.get("sleeveCm", 60.0)))
        neck = float(measurements.get("neck", measurements.get("neckCm", 38.0)))

        # 2. Body Ratios
        waist_hip_ratio = waist / max(hips, 1.0)
        chest_waist_ratio = chest / max(waist, 1.0)
        shoulder_height_ratio = shoulders / max(height, 1.0)

        # 3. Encoded Body Shape
        shape_map = {"athletic": 1, "slender": 2, "robust": 3}
        shape_code = shape_map.get(body_shape.lower(), 0)

        # 4. Standard Pose Slope Angles (mocked posture variance)
        posture_angle = 1.2 # Radian offset of shoulders line

        # 5. Pack everything into a unified float array (13 features)
        feature_vector = [
            height, shoulders, chest, waist, hips, sleeve, neck,
            waist_hip_ratio, chest_waist_ratio, shoulder_height_ratio,
            float(confidence), float(landmark_visibility), float(shape_code)
        ]

        return np.array(feature_vector, dtype=np.float32)

feature_extractor = FeatureExtractor()
