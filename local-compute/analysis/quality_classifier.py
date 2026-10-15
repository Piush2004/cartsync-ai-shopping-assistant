class QualityClassifier:
    def classify_measurement_quality(self, abs_error: float, pct_error: float) -> str:
        """
        Maps absolute and percentage error rates to standard quality tiers:
        - Excellent: < 1.0 cm or < 1.5%
        - Good: < 2.0 cm or < 3.0%
        - Acceptable: < 3.0 cm or < 5.0%
        - Poor: >= 3.0 cm or >= 5.0%
        """
        if abs_error < 1.0 or pct_error < 1.5:
            return "Excellent"
        elif abs_error < 2.0 or pct_error < 3.0:
            return "Good"
        elif abs_error < 3.0 or pct_error < 5.0:
            return "Acceptable"
        else:
            return "Poor"

quality_classifier = QualityClassifier()
