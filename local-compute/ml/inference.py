import numpy as np
from .feature_extractor import feature_extractor
from .training_pipeline import training_pipeline

class InferencePipeline:
    def correct_measurements(self, raw_measurements: dict, confidence: float, 
                             landmark_visibility: float, body_shape: str) -> dict:
        """
        Runs the full correction inference flow:
        1. Extract Features
        2. Predict Error Deltas
        3. Correct measurements
        4. Blend using Confidence Fusion
        """
        # Ensure models are active in memory, or train on the fly if needed
        if not training_pipeline.trained_models:
            success = training_pipeline.load_models()
            if not success:
                # Train baseline RandomForest models in memory
                training_pipeline.run_training(model_type="random_forest")

        # 1. Feature Extraction
        f_vec = feature_extractor.extract_features(
            raw_measurements, confidence, landmark_visibility, body_shape
        )
        f_matrix = np.array([f_vec])

        corrected = {}
        keys = ["shoulderWidth", "chest", "waist", "hips", "sleeve", "neck"]
        
        for k in keys:
            raw_val = float(raw_measurements[k])
            
            if k in training_pipeline.trained_models:
                # 2. Predict correction offset delta
                model = training_pipeline.trained_models[k]
                predicted_delta = float(model.predict(f_matrix)[0])
                
                # 3. Apply Correction
                ml_corrected_val = raw_val + predicted_delta
                
                # 4. Confidence Fusion
                # Blend: high confidence relies more on the ML correction layer
                final_val = confidence * ml_corrected_val + (1.0 - confidence) * raw_val
                corrected[k] = round(final_val, 2)
            else:
                corrected[k] = raw_val

        # Add height unchanged
        corrected["height"] = raw_measurements.get("height", raw_measurements.get("heightCm", 175.0))
        
        return corrected

inference_pipeline = InferencePipeline()
