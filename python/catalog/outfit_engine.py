from typing import List, Dict, Any
from catalog.schema import Product, UserProfile
from catalog.ranking_engine import RankedProduct

class OutfitRecommendationEngine:
    """
    Constructs complete outfits (Top + Bottom + Accessory) based on ranked products
    and user preferences.
    """
    
    # Simple color wheel harmony rules (Mock)
    COMPATIBLE_COLORS = {
        "Black": ["White", "Grey", "Black", "Red", "Olive", "Navy"],
        "White": ["Black", "Grey", "White", "Navy", "Olive", "Red", "Blue"],
        "Navy": ["White", "Grey", "Olive"],
        "Olive": ["White", "Black", "Navy"],
        "Red": ["Black", "White", "Navy"],
        "Blue": ["White", "Grey", "Black"],
        "Grey": ["Black", "White", "Navy", "Red", "Olive", "Blue"]
    }

    @staticmethod
    def generate_outfits(user_profile: UserProfile, ranked_products: List[RankedProduct], num_outfits: int = 3) -> List[Dict[str, Any]]:
        # Separate products by category
        tops = [p for p in ranked_products if p.product.category.lower() in ["shirt", "t-shirt", "jacket"]]
        bottoms = [p for p in ranked_products if p.product.category.lower() in ["jeans", "pants", "shorts"]]
        
        outfits = []
        
        # We need at least one top and one bottom to make an outfit
        if not tops or not bottoms:
            return outfits
            
        for _ in range(num_outfits):
            # Pick a highly ranked top
            top_rp = tops.pop(0) if tops else None
            if not top_rp: break
            
            top_colors = top_rp.product.available_colors
            primary_top_color = top_colors[0] if top_colors else "Black"
            compatible = OutfitRecommendationEngine.COMPATIBLE_COLORS.get(primary_top_color, ["Black", "White"])
            
            # Find a bottom that matches the top's color and fits well
            chosen_bottom = None
            for idx, bottom_rp in enumerate(bottoms):
                bottom_colors = bottom_rp.product.available_colors
                if any(c in compatible for c in bottom_colors):
                    chosen_bottom = bottoms.pop(idx)
                    break
                    
            if not chosen_bottom:
                # Fallback to the highest ranked bottom if no color match found
                chosen_bottom = bottoms.pop(0) if bottoms else None
                
            if chosen_bottom:
                outfit_score = (top_rp.fit_score + chosen_bottom.fit_score) / 2.0
                outfits.append({
                    "outfit_name": f"{top_rp.product.fit_type.capitalize()} {top_rp.product.category} & {chosen_bottom.product.category} Combo",
                    "overall_fit_score": round(outfit_score, 2),
                    "items": [
                        {
                            "role": "Top",
                            "product_id": top_rp.product.product_id,
                            "title": top_rp.product.title,
                            "recommended_size": top_rp.recommended_size
                        },
                        {
                            "role": "Bottom",
                            "product_id": chosen_bottom.product.product_id,
                            "title": chosen_bottom.product.title,
                            "recommended_size": chosen_bottom.recommended_size
                        }
                    ],
                    "reasoning": f"Both items highly match your physical measurements and personal style. {primary_top_color} pairs excellently with the bottom's color options."
                })
                
        return outfits
