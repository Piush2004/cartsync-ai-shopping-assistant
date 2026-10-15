from .types import Product, ProductIntelligenceRequest

class CompatibilityEngine:
    @staticmethod
    def resolve_size(product: Product, req: ProductIntelligenceRequest) -> str:
        # In the future, this checks if the product actually comes in the recommended size,
        # or maps a numeric size (e.g. 32) to an alpha size (M) based on the brand.
        # For now, it passes through the Stylist's recommendation.
        return req.stylist_recommendation.recommended_size
