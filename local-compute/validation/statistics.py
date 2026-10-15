import math
import numpy as np

class StatisticsEngine:
    def calculate_metrics(self, predicted: list, ground_truth: list) -> dict:
        """
        Computes standard statistics metrics (MAE, RMSE, MAPE).
        """
        p = np.array(predicted, dtype=float)
        g = np.array(ground_truth, dtype=float)

        # 1. Absolute Errors
        abs_errors = np.abs(p - g)
        mae = float(np.mean(abs_errors))

        # 2. Root Mean Squared Error (RMSE)
        rmse = float(np.sqrt(np.mean(abs_errors ** 2)))

        # 3. Mean Absolute Percentage Error (MAPE)
        mape = float(np.mean(abs_errors / g)) * 100.0

        # 4. Percentage Error list
        pct_errors = ((p - g) / g * 100.0).tolist()

        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "mape": round(mape, 3),
            "percentageErrors": [round(val, 2) for val in pct_errors],
            "absoluteErrors": abs_errors.tolist()
        }

    def calculate_confidence_correlation(self, errors: list, confidences: list) -> float:
        """
        Calculates Pearson correlation coefficient between confidence scores
        and absolute error rates.
        """
        if len(errors) < 2:
            return 0.0
            
        x = np.array(confidences, dtype=float)
        y = np.array(errors, dtype=float)
        
        # Pearson correlation formula
        x_diff = x - np.mean(x)
        y_diff = y - np.mean(y)
        
        num = np.sum(x_diff * y_diff)
        den = np.sqrt(np.sum(x_diff ** 2) * np.sum(y_diff ** 2))
        
        if den == 0.0:
            return 0.0
            
        return float(num / den)

statistics_engine = StatisticsEngine()
