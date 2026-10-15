from .types import StylistContext, StylistRecommendation
from .sizing_engine import SizingEngine
from .brand_engine import BrandEngine
from .preference_engine import PreferenceEngine
from .confidence_engine import ConfidenceEngine
from .explanation_engine import ExplanationEngine

class RecommendationEngine:
    @staticmethod
    def get_recommendation(ctx: StylistContext) -> StylistRecommendation:
        # 1. Base Size
        base_size = SizingEngine.calculate_base_size(ctx)
        
        # 2. Brand Adjustment
        brand_size = BrandEngine.adjust_for_brand(ctx, base_size)
        
        # 3. Preference Adjustment
        final_size = PreferenceEngine.adjust_for_preference(ctx, brand_size)
        
        # 4. Confidence Calculation
        confidence = ConfidenceEngine.calculate(ctx)
        
        # Alternatives logic
        sizes = ["XS", "S", "M", "L", "XL"]
        alternatives = []
        if final_size in sizes:
            idx = sizes.index(final_size)
            if idx < len(sizes) - 1:
                alternatives.append(sizes[idx + 1])
        
        # 5. Explanation
        reasons = ExplanationEngine.generate(ctx, final_size, alternatives)
        
        return StylistRecommendation(
            recommended_size=final_size,
            fit=ctx.fit_preference,
            confidence=confidence,
            reasoning=reasons,
            alternatives=alternatives
        )
