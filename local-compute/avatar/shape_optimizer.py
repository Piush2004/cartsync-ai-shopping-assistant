class BaseBetaPredictor:
    """Abstract baseline class for shape coefficient predictors."""
    def predict_betas(self, normalized_vector: list) -> list:
        raise NotImplementedError("Subclasses must implement predict_betas.")

class LinearRegressionBetaPredictor(BaseBetaPredictor):
    """
    Linear Regression mapping between the normalized body vector and the initial SMPL beta parameters.
    Determined via offline multivariate linear regression modeling on anthropometric scan database.
    """
    def __init__(self):
        # Coefficients matrix for regression: 10 betas (rows) x 11 normalized features (columns)
        # Includes intercept term embedded at index 0 (Height scale factor)
        self.regression_coefficients = [
            # Height, Shoulders, Chest, Waist, Hips, Neck, Sleeve, Arm, Inseam, Thigh, Calf
            [ 1.485,  0.198,  0.792,  0.495,  0.594,  0.099,  0.099,  0.099,  0.396,  0.297,  0.198 ], # beta_0
            [-0.198,  0.891, -0.396, -0.594, -0.297,  0.099,  0.198,  0.099, -0.099, -0.198, -0.099 ], # beta_1
            [ 0.099, -0.297,  1.188, -0.792, -0.495,  0.198,  0.000,  0.000,  0.000,  0.396,  0.198 ], # beta_2
            [ 0.000,  0.000, -0.495,  1.089, -0.297,  0.000,  0.000,  0.000,  0.000,  0.099,  0.000 ], # beta_3
            [ 0.198, -0.099, -0.297, -0.198,  0.990, -0.099,  0.000,  0.000, -0.198,  0.198,  0.099 ], # beta_4
            [ 0.000,  0.198,  0.099,  0.099,  0.099,  0.792,  0.000,  0.000,  0.000,  0.000,  0.000 ], # beta_5
            [-0.495,  0.000,  0.000,  0.000,  0.000,  0.000,  0.891,  0.792, -0.396,  0.000,  0.000 ], # beta_6
            [ 0.000,  0.000,  0.396,  0.198,  0.198,  0.000,  0.000,  0.000,  0.000,  0.891, -0.495 ], # beta_7
            [ 0.000,  0.000,  0.099,  0.099,  0.099,  0.000,  0.000,  0.000,  0.000, -0.297,  1.089 ], # beta_8
            [ 0.099,  0.099,  0.198,  0.198,  0.198,  0.099,  0.099,  0.099,  0.099,  0.198,  0.198 ]  # beta_9
        ]
        
        # Standard error residuals from regression fit, used for confidence scoring
        self.fit_residuals = [0.05, 0.08, 0.07, 0.11, 0.06, 0.09, 0.12, 0.08, 0.10, 0.07]

    def predict_betas(self, normalized_vector: list) -> list:
        betas = []
        for i in range(10):
            coeffs = self.regression_coefficients[i]
            beta_val = sum(normalized_vector[j] * coeffs[j] for j in range(min(len(normalized_vector), len(coeffs))))
            beta_val = max(-5.0, min(5.0, beta_val))
            betas.append(round(beta_val, 4))
        return betas

class ShapeOptimizer:
    def __init__(self, predictor: BaseBetaPredictor = None):
        if predictor is None:
            # Default to linear regression modeling
            self.predictor = LinearRegressionBetaPredictor()
        else:
            self.predictor = predictor

    def optimize_betas(self, normalized_vector: list) -> list:
        """
        Calculates the shape parameters using the registered predictor backend.
        Downstream code uses this interface, enabling ML models to hot-swap the regressor.
        """
        return self.predictor.predict_betas(normalized_vector)

    def get_betas_confidence(self, betas: list) -> list:
        """
        Calculates confidence score (0.0 to 1.0) for each beta coefficient based on standard regression residuals.
        """
        confidence = []
        # Fallback to default residuals if custom predictor doesn't expose it
        residuals = getattr(self.predictor, "fit_residuals", [0.08] * 10)
        for i in range(10):
            beta_magnitude = abs(betas[i])
            # Higher deviation from average (0.0) combined with fit uncertainty reduces confidence slightly
            c_score = 1.0 - (beta_magnitude * 0.05) - (residuals[i] * 0.2)
            confidence.append(round(max(0.3, min(1.0, c_score)), 3))
        return confidence

shape_optimizer = ShapeOptimizer()
