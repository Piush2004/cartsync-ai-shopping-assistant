class RecommendationService:
    def __init__(self, predictor_model=None):
        """
        Public entrypoint for the sizing recommendation service.
        Future ML models (e.g. XGBoost, LightGBM) can be hot-swapped by passing
        a custom predictor_model instance conforming to this predict interface.
        """
        self.predictor_model = predictor_model

    def get_recommendation(self, user_measurements: dict, raw_size_chart: dict, profile_metadata: dict = None) -> dict:
        """
        Computes sizing recommendations for a user given a brand's sizing configuration.
        """
        if self.predictor_model is not None:
            # Delegation to Machine Learning Model Predictor
            return self.predictor_model.predict(user_measurements, raw_size_chart, profile_metadata)
            
        # Default rule-based recommendation engine execution
        from .recommendation_engine import recommendation_engine
        return recommendation_engine.recommend(user_measurements, raw_size_chart, profile_metadata)

recommendation_service = RecommendationService()
