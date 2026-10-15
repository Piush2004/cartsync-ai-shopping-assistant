from .types import Product, ProductIntelligenceRequest

class ScoringEngine:
    @staticmethod
    def calculate_score(product: Product, req: ProductIntelligenceRequest) -> float:
        score = 0.0
        
        # 1. Fit Preference Match (Weight: 40%)
        pref_fit = req.preferences.get("fit_preference", "").lower()
        prod_fit = product.fit_type.lower()
        if pref_fit == prod_fit:
            score += 0.40
        elif pref_fit == "regular" or prod_fit == "regular":
            score += 0.20 # partial match
            
        # 2. Brand Affinity Match (Weight: 30%)
        if product.brand in req.brand_affinity:
            score += 0.30
            
        # 3. Base Stylist Confidence (Weight: 30%)
        stylist_conf = req.stylist_recommendation.confidence.overall
        score += (0.30 * stylist_conf)
        
        return min(round(score, 2), 0.99)
