from typing import List, Tuple
from catalog.schema import Product

class ProductSimilarityEngine:
    @staticmethod
    def get_similar_products(target: Product, catalog: List[Product], top_n: int = 5) -> List[Tuple[Product, float]]:
        scores = []
        
        for p in catalog:
            if p.product_id == target.product_id:
                continue
                
            score = 0.0
            
            # Category match (Critical)
            if p.category == target.category:
                score += 40.0
            else:
                # If they aren't the same category, they usually aren't "similar products" (they might be outfit compatible, but not similar)
                continue
                
            # Brand match
            if p.brand == target.brand:
                score += 15.0
                
            # Fit match
            if p.fit_type == target.fit_type:
                score += 15.0
                
            # Material match
            if p.material == target.material:
                score += 10.0
                
            # Price similarity (within 20%)
            price_diff = abs(p.price - target.price)
            if price_diff / max(target.price, 1) <= 0.2:
                score += 10.0
                
            # Tags intersection
            shared_tags = set(target.tags).intersection(set(p.tags))
            score += len(shared_tags) * 2.0
            
            # Color intersection
            shared_colors = set(target.available_colors).intersection(set(p.available_colors))
            score += len(shared_colors) * 3.0
            
            scores.append((p, min(100.0, score)))
            
        # Sort descending by score
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]
