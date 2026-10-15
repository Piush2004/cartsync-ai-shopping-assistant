class RecommendationConfidenceEngine:
    def calculate_confidence(self, profile_metadata: dict, size_chart: dict, matched_keys: list) -> float:
        """
        Calculates recommendation confidence (0.0 to 1.0) combining:
        - Profile confidence score
        - Size chart completeness (presence of chest, waist, hips)
        - Matches completeness count
        """
        # 1. Profile Confidence (default to 0.85 if missing)
        profile_conf = profile_metadata.get("confidence", profile_metadata.get("confidenceScore", 0.85))
        
        # 2. Size Chart Quality
        # Check if critical dimensions exist in the size chart
        critical_keys = ["chest", "waist", "hips"]
        # Find first size label to check its keys
        first_size_keys = []
        if size_chart:
            first_size_keys = list(next(iter(size_chart.values())).keys())
            
        critical_present = sum(1 for k in critical_keys if k in first_size_keys)
        chart_quality = 0.5 + (0.5 * (critical_present / len(critical_keys))) if critical_keys else 1.0
        
        # 3. Match Completeness
        # More matches = higher confidence
        match_count = len(matched_keys)
        match_completeness = min(1.0, match_count / 8.0)  # expect at least 8 matched landmarks
        
        # Weighted blend
        confidence = (profile_conf * 0.5) + (chart_quality * 0.3) + (match_completeness * 0.2)
        
        return round(max(0.1, min(1.0, confidence)), 2)

recommendation_confidence_engine = RecommendationConfidenceEngine()
