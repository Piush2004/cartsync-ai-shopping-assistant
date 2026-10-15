import math
import time

class CalibrationEngine:
    def __init__(self):
        # Reconstruction matrix maps 10 betas back to the 11 normalized body ratios.
        self.reconstruction_matrix = [
            # 11 rows representing each body dimension, 10 columns representing each beta coefficient
            [ 0.485, -0.099,  0.099,  0.000,  0.099,  0.000, -0.198,  0.000,  0.000,  0.000], # Height
            [ 0.099,  0.792, -0.198,  0.000, -0.099,  0.099,  0.000,  0.000,  0.000,  0.000], # Shoulders
            [ 0.396, -0.297,  0.792, -0.198, -0.099,  0.000,  0.000,  0.198,  0.000,  0.099], # Chest
            [ 0.297, -0.396, -0.495,  0.792, -0.099,  0.000,  0.000,  0.099,  0.000,  0.099], # Waist
            [ 0.396, -0.198, -0.297, -0.099,  0.792,  0.000,  0.000,  0.198,  0.000,  0.099], # Hips
            [ 0.099,  0.099,  0.099,  0.000, -0.099,  0.792,  0.000,  0.000,  0.000,  0.000], # Neck
            [ 0.099,  0.099,  0.000,  0.000,  0.000,  0.000,  0.792,  0.000,  0.000,  0.000], # Sleeve
            [ 0.099,  0.099,  0.000,  0.000,  0.000,  0.000,  0.693,  0.000,  0.000,  0.000], # Arm
            [ 0.297, -0.099,  0.000,  0.000, -0.099,  0.000, -0.297,  0.000,  0.000,  0.000], # Inseam
            [ 0.198, -0.099,  0.297,  0.099,  0.099,  0.000,  0.000,  0.792, -0.099,  0.099], # Thigh
            [ 0.099, -0.099,  0.099,  0.000,  0.099,  0.000,  0.000, -0.297,  0.792,  0.099]  # Calf
        ]

    def _betas_to_ratios(self, betas: list) -> list:
        """Helper to project shape coefficients back to normalized body ratios."""
        ratios = []
        for i in range(11):
            row = self.reconstruction_matrix[i]
            ratio_val = sum(betas[j] * row[j] for j in range(min(len(betas), len(row))))
            ratios.append(ratio_val)
        return ratios

    def evaluate_quality_level(self, overall_error: float) -> str:
        """
        Maps overall calibration error to semantic quality levels.
        """
        if overall_error < 1.0:
            return "Excellent"
        elif overall_error < 2.0:
            return "Very Good"
        elif overall_error < 3.0:
            return "Acceptable"
        else:
            return "Needs Recalibration"

    def calibrate(self, input_measurements: dict, initial_betas: list, normalized_vector: list, 
                  max_iterations: int = 15, beta_min: float = -3.5, beta_max: float = 3.5) -> dict:
        """
        Runs calibration loop to adjust betas until difference between input measurements
        and virtual measurements from projected betas is minimized.
        Clamps final betas to configurable limits before optimization completes.
        """
        start_time = time.perf_counter()
        height = float(input_measurements.get("heightCm", input_measurements.get("height", 175.0)))
        keys = ["height", "shoulderWidth", "chest", "waist", "hips", "neck", "sleeve", "arm", "inseam", "thigh", "calf"]
        
        current_betas = list(initial_betas)
        history = []
        overall_error = 999.0
        converged = False
        iteration_count = 0

        # Input dimensions mapped to index list
        input_cm = [
            height,
            float(input_measurements.get("shoulderWidthCm", input_measurements.get("shoulderWidth", 42.0))),
            float(input_measurements.get("chestCm", input_measurements.get("chest", 95.0))),
            float(input_measurements.get("waistCm", input_measurements.get("waist", 80.0))),
            float(input_measurements.get("hipsCm", input_measurements.get("hips", 98.0))),
            float(input_measurements.get("neckCm", input_measurements.get("neck", 38.0))),
            float(input_measurements.get("sleeveCm", input_measurements.get("sleeve", 60.0))),
            float(input_measurements.get("armLengthCm", input_measurements.get("sleeve", 60.0))),
            float(input_measurements.get("inseamCm", input_measurements.get("inseam", 80.0))),
            float(input_measurements.get("thighCm", 54.0)),
            float(input_measurements.get("calfCm", 37.0))
        ]

        # Optimization loop
        for iteration in range(1, max_iterations + 1):
            iter_start = time.perf_counter()
            iteration_count = iteration
            
            # Generate virtual dimensions in centimeters
            virtual_ratios = self._betas_to_ratios(current_betas)
            virtual_cm = [r * height for r in virtual_ratios]
            
            # Compute independent error vector
            per_measurement_errors = {}
            squared_sum = 0.0
            for idx, key in enumerate(keys):
                diff = input_cm[idx] - virtual_cm[idx]
                per_measurement_errors[key] = round(diff, 3)
                squared_sum += diff ** 2
                
                # Feedback loop update (gradient descent)
                for b_idx in range(10):
                    grad = diff / height * self.reconstruction_matrix[idx][b_idx] * 0.12
                    current_betas[b_idx] = max(beta_min, min(beta_max, current_betas[b_idx] + grad))
                    
            overall_error = math.sqrt(squared_sum / len(keys))
            iter_runtime = (time.perf_counter() - iter_start) * 1000.0  # in milliseconds
            
            # Log step history
            history.append({
                "iteration": iteration,
                "overallError": round(overall_error, 4),
                "perMeasurementErrors": dict(per_measurement_errors),
                "runtimeMs": round(iter_runtime, 2)
            })
            
            # Stopping check (Excellent threshold condition < 1.0cm)
            if overall_error < 1.0:
                converged = True
                break

        # Final clamping prior to completion
        clamped_betas = [max(beta_min, min(beta_max, round(b, 4))) for b in current_betas]
        total_runtime_ms = (time.perf_counter() - start_time) * 1000.0
        
        quality = self.evaluate_quality_level(overall_error)
        
        return {
            "betas": clamped_betas,
            "perMeasurementErrors": per_measurement_errors,
            "overallError": round(overall_error, 4),
            "history": history,
            "quality": quality,
            "metadata": {
                "iterations": iteration_count,
                "converged": converged,
                "runtimeMs": round(total_runtime_ms, 2),
                "optimizer": "GradientDescentRegressor"
            }
        }

calibration_engine = CalibrationEngine()
