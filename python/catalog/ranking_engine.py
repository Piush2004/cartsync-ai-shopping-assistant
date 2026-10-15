from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from catalog.schema import Product
from pipeline.context import PipelineContext

class RankedProduct(BaseModel):
    product: Product
    recommended_size: Optional[str]
    fit_score: int
    fit_category: str
    confidence: float
    reasons: List[str]

class ProductRankingEngine:
    @staticmethod
    def rank_products(products: List[Product], context: PipelineContext) -> List[RankedProduct]:
        ranked_results = []
        
        sizing_data = context.size_recommendations or {}
        user_fit_preference = context.fit_preference
        
        for p in products:
            reasons = []
            fit_score = 0
            
            # 1. Base Sizing Score
            brand_sizes = sizing_data.get(p.brand, {})
            cat_size_info = brand_sizes.get(p.category.lower())
            
            if not cat_size_info:
                # We don't have sizing data for this brand/category combination
                recommended_size = None
                confidence = 0.5
                fit_score = 50
                reasons.append("Sizing chart unavailable for this brand/category. Relying on standard estimation.")
            else:
                recommended_size = cat_size_info.get("size")
                confidence = cat_size_info.get("recommendationScore", 0.5)
                fit_score = int(confidence * 100)
                
                matched_dims = cat_size_info.get("matchedMeasurements", [])
                if matched_dims:
                    reasons.append(f"Measurements ({', '.join(matched_dims)}) are a strong match for size {recommended_size}.")
                    
                warnings = cat_size_info.get("fitWarnings", [])
                for w in warnings:
                    fit_score -= 15 # Penalize for discrepancies
                    reasons.append(w)
                    
            # 2. Fit Preference Alignment
            # Penalize or boost based on the product's natural fit vs the user's desired fit
            product_fit = p.fit_type.lower()
            if product_fit == user_fit_preference:
                fit_score += 10
                reasons.append(f"The product's {product_fit} fit perfectly matches your preference.")
            elif user_fit_preference == "slim" and product_fit in ["oversized", "relaxed"]:
                fit_score -= 15
                reasons.append(f"Warning: This product has an {product_fit} cut, but you prefer slim.")
            elif user_fit_preference == "oversized" and product_fit == "slim":
                fit_score -= 15
                reasons.append(f"Warning: This product has a {product_fit} cut, but you prefer oversized.")
                
            # 3. Inventory Checks
            if recommended_size:
                stock = p.inventory.get(recommended_size, 0)
                if stock <= 0:
                    fit_score -= 50
                    reasons.append(f"Unfortunately, your recommended size ({recommended_size}) is out of stock.")
                elif stock <= 3:
                    reasons.append(f"Low stock: Only {stock} left in your recommended size.")
            
            # Normalize fit_score
            fit_score = max(0, min(100, fit_score))
            
            # Determine Fit Category
            if fit_score >= 90:
                fit_cat = "Excellent"
            elif fit_score >= 75:
                fit_cat = "Good"
            elif fit_score >= 50:
                fit_cat = "Fair"
            else:
                fit_cat = "Poor"
                
            ranked_results.append(RankedProduct(
                product=p,
                recommended_size=recommended_size,
                fit_score=fit_score,
                fit_category=fit_cat,
                confidence=round(confidence, 2),
                reasons=reasons
            ))
            
        # Sort by fit_score descending
        ranked_results.sort(key=lambda x: x.fit_score, reverse=True)
        return ranked_results
