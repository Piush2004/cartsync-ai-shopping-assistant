from .brand_normalizer import brand_normalizer
from .size_chart_parser import size_chart_parser
from .measurement_matcher import measurement_matcher
from .fit_classifier import fit_classifier
from .confidence_engine import recommendation_confidence_engine

class RecommendationEngine:
    def recommend(self, user_measurements: dict, raw_size_chart: dict, profile_metadata: dict = None) -> dict:
        """
        Executes the recommendation workflow.
        """
        if not user_measurements or not raw_size_chart:
            return {
                "recommendedSize": "N/A",
                "alternativeSizes": [],
                "fitClassification": "Regular Fit",
                "confidence": 0.0,
                "reasoning": "Missing user measurements or size chart data.",
                "measurementDifferences": {}
            }

        # Step 1: Normalize size chart keys
        normalized_chart = brand_normalizer.normalize_chart_keys(raw_size_chart)
        
        # Step 2: Parse size chart values into ranges
        parsed_chart = size_chart_parser.parse_size_chart(normalized_chart)
        
        # Step 3: Match user measurements to size ranges
        matches = measurement_matcher.match_sizes(user_measurements, parsed_chart)
        
        if not matches:
            return {
                "recommendedSize": "N/A",
                "alternativeSizes": [],
                "fitClassification": "Regular Fit",
                "confidence": 0.0,
                "reasoning": "No matching sizes found in size chart.",
                "measurementDifferences": {}
            }
            
        # Step 4: Determine recommended size (highest fit score)
        sorted_sizes = sorted(matches.items(), key=lambda item: item[1]["fit_score"], reverse=True)
        recommended_size, match_details = sorted_sizes[0]
        
        # Step 5: Classify fit category
        fit_class = fit_classifier.classify_fit(match_details["differences"])
        
        # Step 6: Identify alternative sizes (fit score > 0.75)
        alternatives = [
            size_label for size_label, info in sorted_sizes[1:]
            if info["fit_score"] >= 0.75
        ]
        
        # Step 7: Calculate overall recommendation confidence
        if not profile_metadata:
            profile_metadata = {}
        matched_keys = list(match_details["differences"].keys())
        confidence = recommendation_confidence_engine.calculate_confidence(
            profile_metadata,
            parsed_chart,
            matched_keys
        )
        
        # Step 8: Build user-friendly reasoning string
        reasoning_list = []
        for key, diff in match_details["differences"].items():
            if diff == 0.0:
                continue
            direction = "larger" if diff > 0 else "smaller"
            reasoning_list.append(f"{key} is {abs(round(diff, 1))}cm {direction}")
            
        if reasoning_list:
            reasoning = f"Recommended size {recommended_size} because: " + ", ".join(reasoning_list) + "."
        else:
            reasoning = f"Recommended size {recommended_size} fits all primary body dimensions perfectly."

        return {
            "recommendedSize": recommended_size,
            "alternativeSizes": alternatives,
            "fitClassification": fit_class,
            "confidence": confidence,
            "reasoning": reasoning,
            "measurementDifferences": {
                k: round(v, 1) for k, v in match_details["differences"].items()
            }
        }

recommendation_engine = RecommendationEngine()
