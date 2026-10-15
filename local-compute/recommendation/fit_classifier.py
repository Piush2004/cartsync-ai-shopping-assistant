class FitClassifier:
    def classify_fit(self, differences: dict) -> str:
        """
        Classifies the fit of the recommended size using key body metrics (chest, waist, hips).
        """
        # Focus on the most critical fitting metrics
        primary_keys = ["chest", "waist", "hips"]
        deltas = [differences[k] for k in primary_keys if k in differences]
        
        if not deltas:
            # Fallback to average of all metrics
            deltas = list(differences.values())
            
        if not deltas:
            return "Regular Fit"
            
        # Average difference across metrics
        avg_delta = sum(deltas) / len(deltas)
        
        # Positive avg_delta means user is larger than size chart (tight)
        # Negative avg_delta means user is smaller than size chart (loose)
        if avg_delta > 5.0:
            return "Too Small"
        elif avg_delta > 2.0:
            return "Tight"
        elif avg_delta > 0.0:
            return "Slim Fit"
        elif avg_delta < -6.0:
            return "Too Large"
        elif avg_delta < -3.0:
            return "Oversized"
        elif avg_delta < 0.0:
            return "Relaxed Fit"
            
        return "Regular Fit"

fit_classifier = FitClassifier()
