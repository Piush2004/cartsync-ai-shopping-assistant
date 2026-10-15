import numpy as np

class MLMetrics:
    def compare_performances(self, raw_predictions: list, ml_predictions: list, 
                             ground_truths: list) -> dict:
        """
        Evaluates and compares the errors between baseline geometry predictions
        and ML-corrected predictions.
        """
        raw = np.array(raw_predictions, dtype=float)
        ml = np.array(ml_predictions, dtype=float)
        truth = np.array(ground_truths, dtype=float)

        # 1. Baseline Geometry Metrics
        raw_mae = np.mean(np.abs(raw - truth))
        raw_rmse = np.sqrt(np.mean((raw - truth) ** 2))
        raw_mape = np.mean(np.abs(raw - truth) / truth) * 100.0

        # 2. Geometry + ML Metrics
        ml_mae = np.mean(np.abs(ml - truth))
        ml_rmse = np.sqrt(np.mean((ml - truth) ** 2))
        ml_mape = np.mean(np.abs(ml - truth) / truth) * 100.0

        # 3. Improvement Rates
        mae_imp = ((raw_mae - ml_mae) / raw_mae) * 100.0 if raw_mae > 0 else 0.0
        rmse_imp = ((raw_rmse - ml_rmse) / raw_rmse) * 100.0 if raw_rmse > 0 else 0.0
        mape_imp = ((raw_mape - ml_mape) / raw_mape) * 100.0 if raw_mape > 0 else 0.0

        return {
            "geometryOnly": {
                "mae": round(float(raw_mae), 3),
                "rmse": round(float(raw_rmse), 3),
                "mape": round(float(raw_mape), 3)
            },
            "geometryWithML": {
                "mae": round(float(ml_mae), 3),
                "rmse": round(float(ml_rmse), 3),
                "mape": round(float(ml_mape), 3)
            },
            "improvements": {
                "maePercent": round(float(mae_imp), 2),
                "rmsePercent": round(float(rmse_imp), 2),
                "mapePercent": round(float(mape_imp), 2)
            }
        }

ml_metrics = MLMetrics()
