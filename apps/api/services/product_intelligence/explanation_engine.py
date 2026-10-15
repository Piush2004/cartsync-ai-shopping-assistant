from typing import List
from .types import Product, ProductIntelligenceRequest

class ExplanationEngine:
    @staticmethod
    def generate(product: Product, req: ProductIntelligenceRequest, score: float) -> List[str]:
        reasons = []
        
        pref_fit = req.preferences.get("fit_preference", "").lower()
        if pref_fit == product.fit_type.lower():
            reasons.append(f"Perfectly matches your preference for {product.fit_type.lower()} fit.")
            
        if product.brand in req.brand_affinity:
            reasons.append(f"From your favorite brand {product.brand}.")
            
        if score > 0.90:
            reasons.append("Highly aligned with your past sizing success.")
            
        return reasons
