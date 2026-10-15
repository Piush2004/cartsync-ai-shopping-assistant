from .types import AIContext

class PromptBuilder:
    SYSTEM_TEMPLATE = """You are CartSync AI Stylist.
Only explain deterministic recommendations.
Never invent measurements.
Never invent products.
Never override recommendations.

User Context:
Preferred Fit: {preferred_fit}
Favorite Brands: {favorite_brands}

Stylist Recommendation:
Size: {size}
Confidence: {confidence}

Product Intelligence:
{products}
"""
    @staticmethod
    def build_prompt(context: AIContext, current_question: str) -> str:
        # We extract safe values
        pref_fit = context.user_profile.get("preferred_fit", "None")
        brands = ", ".join(context.user_profile.get("favorite_brands", []))
        
        size = context.stylist_recommendation.get("size", "N/A") if context.stylist_recommendation else "N/A"
        conf = context.stylist_recommendation.get("confidence", "N/A") if context.stylist_recommendation else "N/A"
        
        prods = "None"
        if context.product_recommendations:
            prod_strings = []
            for p in context.product_recommendations:
                prod_strings.append(f"{p.get('name')} (Score: {p.get('score')}%) - Size: {p.get('size')}")
            prods = "\n".join(prod_strings)
            
        system_prompt = PromptBuilder.SYSTEM_TEMPLATE.format(
            preferred_fit=pref_fit,
            favorite_brands=brands,
            size=size,
            confidence=conf,
            products=prods
        )
        
        return f"{system_prompt}\n\nUser Question: {current_question}"
