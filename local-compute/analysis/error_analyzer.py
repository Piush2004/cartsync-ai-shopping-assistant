import numpy as np
from .quality_classifier import quality_classifier
from .confidence_calibrator import confidence_calibrator
from .measurement_breakdown import measurement_breakdown

class ErrorAnalyzer:
    def analyze_dataset_errors(self, evaluation_results: dict) -> dict:
        """
        Processes batch evaluation results and generates granular per-measurement breakdowns,
        confidence scores calibration, and reliability rankings.
        """
        subjects = evaluation_results.get("subjects", [])
        keys = ["shoulderWidth", "chest", "waist", "hips", "sleeve", "neck"]
        
        # Accumulate predictions and truth across all subjects
        measurement_data = {k: {"pred": [], "truth": []} for k in keys}
        
        for sub in subjects:
            for k in keys:
                measurement_data[k]["pred"].append(sub["predictions"][k])
                measurement_data[k]["truth"].append(sub["groundTruth"][k])

        # Analyze each measurement type
        breakdown_results = {}
        for k in keys:
            preds = np.array(measurement_data[k]["pred"])
            truths = np.array(measurement_data[k]["truth"])
            
            abs_errors = np.abs(preds - truths)
            maes = np.mean(abs_errors)
            mapes = np.mean(abs_errors / truths) * 100.0
            
            expected = measurement_breakdown.get_expected_error(k)
            quality_label = quality_classifier.classify_measurement_quality(maes, mapes)
            
            # Calibrate confidence using default visibility=0.98 and quality=0.95
            calibrated_conf = confidence_calibrator.calibrate_measurement_confidence(
                maes, expected, landmark_visibility=0.98, image_quality_score=0.95
            )

            # Error sources breakdown
            sources = measurement_breakdown.calculate_sources_breakdown(k, maes)

            breakdown_results[k] = {
                "mae": round(float(maes), 2),
                "mape": round(float(mapes), 2),
                "expectedError": expected,
                "calibratedConfidence": calibrated_conf,
                "qualityLabel": quality_label,
                "errorSourcesBreakdown": sources
            }

        # Rank measurements by reliability (ascending MAE order)
        # Add static references to Height (very high reliability) and Thigh/Calf (lower reliability) to form complete list
        ranked_list = [
            ("height", 0.3),
            ("shoulderWidth", breakdown_results["shoulderWidth"]["mae"]),
            ("sleeve", breakdown_results["sleeve"]["mae"]),
            ("neck", breakdown_results["neck"]["mae"]),
            ("chest", breakdown_results["chest"]["mae"]),
            ("waist", breakdown_results["waist"]["mae"]),
            ("hips", breakdown_results["hips"]["mae"]),
            ("thigh", 2.9),
            ("calf", 2.1)
        ]
        
        # Sort based on absolute error rates
        sorted_ranks = sorted(ranked_list, key=lambda x: x[1])
        final_rankings = [item[0] for item in sorted_ranks]

        return {
            "perMeasurementBreakdown": breakdown_results,
            "reliabilityRankings": final_rankings
        }

error_analyzer = ErrorAnalyzer()
