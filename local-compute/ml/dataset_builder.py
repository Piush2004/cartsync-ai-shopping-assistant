import numpy as np
from validation.ground_truth_loader import ground_truth_loader
from .feature_extractor import feature_extractor

class DatasetBuilder:
    def build_dataset(self, num_samples_per_subject: int = 100) -> tuple:
        """
        Loads subjects, introduces variations to create a dataset, 
        and extracts features X and residual target deltas y.
        """
        subjects = ground_truth_loader.load_subjects()
        X_list = []
        y_list = []

        keys = ["shoulderWidth", "chest", "waist", "hips", "sleeve", "neck"]

        for sub in subjects:
            truth = sub["groundTruth"]
            height = sub["heightCm"]
            shape = sub.get("bodyShape", "athletic")
            
            for _ in range(num_samples_per_subject):
                # Simulate a measurement prediction containing random Gaussian drift
                perturbed_meas = {
                    "height": height
                }
                deltas = []
                for k in keys:
                    actual = truth[k]
                    # Simulate raw calculator output which averages +3cm overestimation
                    systematic_bias = 2.5 
                    noise = np.random.normal(0.0, 1.2)
                    pred = actual + systematic_bias + noise
                    perturbed_meas[k] = float(pred)
                    
                    # Residual target is ground truth - raw prediction
                    deltas.append(actual - pred)

                # Extract features
                f_vec = feature_extractor.extract_features(
                    perturbed_meas, confidence=0.88, 
                    landmark_visibility=0.98, body_shape=shape
                )

                X_list.append(f_vec)
                y_list.append(deltas)

        return np.array(X_list), np.array(y_list)

dataset_builder = DatasetBuilder()
