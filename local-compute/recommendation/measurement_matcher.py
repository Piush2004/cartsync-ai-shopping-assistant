class MeasurementMatcher:
    def __init__(self, weights: dict = None):
        self.weights = {
            "chest": 1.0,
            "waist": 0.9,
            "hips": 0.9,
            "shoulderWidth": 0.7,
            "sleeve": 0.6,
            "inseam": 0.7,
            "neck": 0.5,
            "thigh": 0.6,
            "calf": 0.4,
            "height": 0.3
        }
        if weights:
            self.weights.update(weights)

    def calculate_differences(self, user_measurements: dict, size_ranges: dict) -> dict:
        """
        Calculates the differences between user measurements and a size's ranges.
        Difference is:
        - 0 if inside the [min, max] range.
        - positive if user is larger than max (user_measurement - max).
        - negative if user is smaller than min (user_measurement - min).
        """
        diffs = {}
        for key, range_tuple in size_ranges.items():
            if key not in user_measurements:
                continue
            
            user_val = float(user_measurements[key])
            min_val, max_val = range_tuple
            
            # If size range is single value, min_val == max_val
            if user_val > max_val:
                diffs[key] = user_val - max_val
            elif user_val < min_val:
                diffs[key] = user_val - min_val
            else:
                diffs[key] = 0.0
        return diffs

    def calculate_fit_score(self, diffs: dict) -> float:
        """
        Computes a normalized fit score (0.0 to 1.0) using weighted squared deviations.
        """
        weighted_sum = 0.0
        weight_total = 0.0
        
        for key, diff in diffs.items():
            weight = self.weights.get(key, 0.5)
            # Squared error penalizes larger deviations
            weighted_sum += weight * (diff ** 2)
            weight_total += weight
            
        if weight_total == 0.0:
            return 0.0
            
        mean_deviation = (weighted_sum / weight_total) ** 0.5
        # Normalize score where 0 deviation -> 1.0, and decays smoothly
        fit_score = 1.0 / (1.0 + 0.04 * mean_deviation)
        return round(fit_score, 3)

    def match_sizes(self, user_measurements: dict, parsed_size_chart: dict) -> dict:
        """
        Matches user measurements against all sizes in the size chart.
        Returns:
        {
            "S": {"fit_score": 0.85, "differences": {"chest": 2.0, "waist": 0.0}},
            "M": {"fit_score": 0.98, "differences": {"chest": 0.0, "waist": 0.0}}
        }
        """
        matches = {}
        for size_label, ranges in parsed_size_chart.items():
            diffs = self.calculate_differences(user_measurements, ranges)
            score = self.calculate_fit_score(diffs)
            matches[size_label] = {
                "fit_score": score,
                "differences": diffs
            }
        return matches

measurement_matcher = MeasurementMatcher()
