class MeasurementBreakdown:
    def __init__(self):
        # Typical expected error margins in centimeters
        self.expected_errors = {
            "height": 0.5,
            "shoulderWidth": 1.0,
            "sleeve": 1.5,
            "chest": 2.0,
            "waist": 2.2,
            "hips": 2.5,
            "neck": 1.2,
            "thigh": 2.8,
            "calf": 2.0
        }

        # Mathematical allocation factors of error source ratios
        # Factors: Pose, Depth, Scale, Visibility, Ellipse, ImageQuality
        self.error_sources_weights = {
            "height":         {"pose": 0.30, "depth": 0.00, "scale": 0.50, "visibility": 0.15, "ellipse": 0.00, "quality": 0.05},
            "shoulderWidth":  {"pose": 0.50, "depth": 0.00, "scale": 0.30, "visibility": 0.15, "ellipse": 0.00, "quality": 0.05},
            "sleeve":         {"pose": 0.45, "depth": 0.00, "scale": 0.30, "visibility": 0.20, "ellipse": 0.00, "quality": 0.05},
            "chest":          {"pose": 0.10, "depth": 0.40, "scale": 0.20, "visibility": 0.05, "ellipse": 0.20, "quality": 0.05},
            "waist":          {"pose": 0.10, "depth": 0.40, "scale": 0.20, "visibility": 0.05, "ellipse": 0.20, "quality": 0.05},
            "hips":           {"pose": 0.10, "depth": 0.40, "scale": 0.20, "visibility": 0.05, "ellipse": 0.20, "quality": 0.05},
            "neck":           {"pose": 0.10, "depth": 0.35, "scale": 0.20, "visibility": 0.15, "ellipse": 0.15, "quality": 0.05},
            "thigh":          {"pose": 0.10, "depth": 0.40, "scale": 0.20, "visibility": 0.05, "ellipse": 0.20, "quality": 0.05},
            "calf":           {"pose": 0.10, "depth": 0.40, "scale": 0.20, "visibility": 0.05, "ellipse": 0.20, "quality": 0.05}
        }

    def get_expected_error(self, key: str) -> float:
        return self.expected_errors.get(key, 2.0)

    def calculate_sources_breakdown(self, key: str, absolute_error: float) -> dict:
        """
        Distributes the computed absolute error among various sources based 
        on established heuristics.
        """
        weights = self.error_sources_weights.get(key, {
            "pose": 0.2, "depth": 0.2, "scale": 0.2, "visibility": 0.1, "ellipse": 0.2, "quality": 0.1
        })
        
        return {
            source: round(absolute_error * w, 3)
            for source, w in weights.items()
        }

measurement_breakdown = MeasurementBreakdown()
