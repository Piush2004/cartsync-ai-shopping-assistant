import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.linear_model import LinearRegression

class BaseCorrectionModel:
    def fit(self, X: np.ndarray, y: np.ndarray):
        raise NotImplementedError

    def predict(self, X: np.ndarray) -> np.ndarray:
        raise NotImplementedError

class XGBoostCorrectionModel(BaseCorrectionModel):
    def __init__(self):
        try:
            import xgboost as xgb
            self.model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            self.fallback = False
        except (ImportError, Exception):
            # Fall back to RandomForest if xgboost cannot load its binary library
            print("[XGBoostModel] WARNING: Falling back to RandomForestRegressor.")
            self.model = RandomForestRegressor(n_estimators=50, max_depth=3, random_state=42)
            self.fallback = True

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

class LightGBMCorrectionModel(BaseCorrectionModel):
    def __init__(self):
        try:
            import lightgbm as lgb
            self.model = lgb.LGBMRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42, verbose=-1)
            self.fallback = False
        except (ImportError, Exception):
            print("[LightGBMModel] WARNING: Falling back to RandomForestRegressor.")
            self.model = RandomForestRegressor(n_estimators=50, max_depth=3, random_state=42)
            self.fallback = True

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

class RandomForestCorrectionModel(BaseCorrectionModel):
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, max_depth=3, random_state=42)

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

class MLPCorrectionModel(BaseCorrectionModel):
    def __init__(self):
        self.model = MLPRegressor(hidden_layer_sizes=(16, 8), max_iter=200, random_state=42)

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

def get_correction_model(model_type: str = "xgboost") -> BaseCorrectionModel:
    mapping = {
        "xgboost": XGBoostCorrectionModel,
        "lightgbm": LightGBMCorrectionModel,
        "random_forest": RandomForestCorrectionModel,
        "mlp": MLPCorrectionModel
    }
    return mapping.get(model_type.lower(), XGBoostCorrectionModel)()
