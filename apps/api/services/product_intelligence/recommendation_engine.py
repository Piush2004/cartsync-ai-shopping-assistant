from typing import List
from .types import ProductIntelligenceRequest, ProductIntelligenceResponse, ScoredProduct
from .catalog_engine import CatalogEngine
from .filtering_engine import FilteringEngine
from .scoring_engine import ScoringEngine
from .compatibility_engine import CompatibilityEngine
from .explanation_engine import ExplanationEngine
from .ranking_engine import RankingEngine

class ProductRecommendationEngine:
    @staticmethod
    def get_recommendations(req: ProductIntelligenceRequest) -> ProductIntelligenceResponse:
        # 1. Fetch Catalog
        all_products = CatalogEngine.get_all_products()
        
        # 2. Filter
        filtered_products = FilteringEngine.filter(all_products, req)
        
        scored_products = []
        for product in filtered_products:
            # 3. Score
            score = ScoringEngine.calculate_score(product, req)
            
            # 4. Compatibility (Size Resolution)
            final_size = CompatibilityEngine.resolve_size(product, req)
            
            # 5. Explanation
            reasons = ExplanationEngine.generate(product, req, score)
            
            # Construct Scored Product
            scored = ScoredProduct(
                product=product,
                recommended_size=final_size,
                fit_score=score,
                confidence=req.stylist_recommendation.confidence.overall,
                reason=reasons
            )
            scored_products.append(scored)
            
        # 6. Rank
        ranked = RankingEngine.rank(scored_products)
        
        return ProductIntelligenceResponse(products=ranked)
