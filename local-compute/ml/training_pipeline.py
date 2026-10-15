import os
import pickle
import numpy as np
from .dataset_builder import dataset_builder
from .correction_model import get_correction_model

class TrainingPipeline:
    def __init__(self, model_dir: str = "./models/ml"):
        self.model_dir = model_dir
        self.trained_models = {}
        os.makedirs(self.model_dir, exist_ok=True)

    def run_training(self, model_type: str = "xgboost") -> dict:
        """
        Builds the dataset, fits regression estimators for each measurement key,
        and saves output parameters.
        """
        X, y = dataset_builder.build_dataset(num_samples_per_subject=120)
        keys = ["shoulderWidth", "chest", "waist", "hips", "sleeve", "neck"]

        # Simple train-test split (80/20)
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        evals = {}

        for idx, k in enumerate(keys):
            model = get_correction_model(model_type)
            # Fit model to predict the offset delta for this specific measurement key
            model.fit(X_train, y_train[:, idx])
            
            # Save model instance
            self.trained_models[k] = model
            
            # Serialize model
            model_path = os.path.join(self.model_dir, f"{k}_corrector.pkl")
            try:
                with open(model_path, 'wb') as f:
                    pickle.dump(model, f)
            except Exception as e:
                print(f"[TrainingPipeline] Failed to save pkl: {e}")

            # Predict and evaluate test error
            preds = model.predict(X_test)
            test_mae = float(np.mean(np.abs(preds - y_test[:, idx])))
            evals[k] = {"test_mae": round(test_mae, 3)}

        return {
            "status": "SUCCESS",
            "model_type": model_type,
            "metrics": evals,
            "samples": len(X)
        }

    def load_models(self) -> bool:
        """
        Loads models from disk if available, otherwise return False.
        """
        keys = ["shoulderWidth", "chest", "waist", "hips", "sleeve", "neck"]
        loaded = True
        for k in keys:
            model_path = os.path.join(self.model_dir, f"{k}_corrector.pkl")
            if os.path.exists(model_path):
                try:
                    with open(model_path, 'rb') as f:
                        self.trained_models[k] = pickle.load(f)
                except Exception:
                    loaded = False
            else:
                loaded = False
        return loaded

training_pipeline = TrainingPipeline()
