import numpy as np

class EvaluationMetrics:
    # 1. Measurement Engine Metrics
    @staticmethod
    def calculate_mape(y_true: list, y_pred: list) -> float:
        """Mean Absolute Percentage Error (MAPE)"""
        true, pred = np.array(y_true), np.array(y_pred)
        return float(np.mean(np.abs((true - pred) / true)) * 100.0)

    @staticmethod
    def calculate_rmse(y_true: list, y_pred: list) -> float:
        """Root Mean Squared Error (RMSE)"""
        true, pred = np.array(y_true), np.array(y_pred)
        return float(np.sqrt(np.mean((true - pred) ** 2)))

    # 2. Calibration Engine Metrics
    @staticmethod
    def calculate_alignment_error(input_vector: list, virtual_vector: list) -> list:
        """Computes error difference vector between inputs and virtual mesh coordinates"""
        return (np.array(input_vector) - np.array(virtual_vector)).tolist()

    # 3. SMPL Mesh Metrics
    @staticmethod
    def calculate_chamfer_distance(source_vertices: list, target_vertices: list) -> float:
        """Placeholder for Chamfer Distance (vertex-to-vertex surface error)"""
        return 0.0

    # 4. Recommendation Engine Metrics
    @staticmethod
    def calculate_f1_score(precision: float, recall: float) -> float:
        """F1 Sizing Match Accuracy"""
        if precision + recall == 0:
            return 0.0
        return 2.0 * (precision * recall) / (precision + recall)

    # 5. VTON Generation Metrics
    @staticmethod
    def calculate_psnr(image_true: np.ndarray, image_pred: np.ndarray) -> float:
        """Peak Signal-to-Noise Ratio (PSNR) for Virtual Try-On image similarity"""
        mse = np.mean((image_true - image_pred) ** 2)
        if mse == 0:
            return 100.0
        return float(20 * np.log10(255.0 / np.sqrt(mse)))

    @staticmethod
    def calculate_ssim(image_true: np.ndarray, image_pred: np.ndarray) -> float:
        """Structural Similarity Index (SSIM) placeholder"""
        return 1.0

    # 6. LLM Text Metrics
    @staticmethod
    def calculate_bleu(reference: str, candidate: str) -> float:
        """BLEU score placeholder for chat styling outputs"""
        return 0.0


class RegressionComparator:
    @staticmethod
    def compare_runs(baseline_report: dict, target_report: dict) -> dict:
        """
        Compares two benchmark reports and returns metric delta evaluations:
        - Improved
        - Regressed
        - Unchanged
        """
        comparison = {}
        base_metrics = baseline_report.get("metrics", {})
        target_metrics = target_report.get("metrics", {})
        
        # Lower error is better
        lower_better = ["RMSE", "MAPE", "overallError", "overallDeviation"]
        
        # Higher score is better
        higher_better = ["Precision", "Recall", "F1", "PSNR", "SSIM", "BLEU", "qualityScore"]

        for metric in set(list(base_metrics.keys()) + list(target_metrics.keys())):
            if metric not in base_metrics or metric not in target_metrics:
                comparison[metric] = "Unchanged"
                continue
                
            v_base = base_metrics[metric]
            v_target = target_metrics[metric]
            
            if v_base == v_target:
                comparison[metric] = "Unchanged"
            elif metric in lower_better:
                comparison[metric] = "Improved" if v_target < v_base else "Regressed"
            elif metric in higher_better:
                comparison[metric] = "Improved" if v_target > v_base else "Regressed"
            else:
                # Default case
                comparison[metric] = "Unchanged"
                
        return comparison
