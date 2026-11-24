from .types import CATEGORY_BOTTOM, CATEGORY_DRESS, StylistContext
from .brand_engine import BrandEngine
from typing import List

_GARMENT_WORDS = {
    CATEGORY_BOTTOM: "trousers and jeans",
    CATEGORY_DRESS: "dresses",
}


class ExplanationEngine:
    @staticmethod
    def generate(ctx: StylistContext, recommended_size: str, alternatives: List[str], basis: str = "chest") -> List[str]:
        reasons = []

        measured = {"chest": ctx.chest, "waist": ctx.waist, "hip": ctx.hip or 0}[basis]
        garment = _GARMENT_WORDS.get(ctx.category)
        if garment:
            reasons.append(f"Based on your {int(measured)} cm {basis}, this is your size for {garment}.")
        else:
            reasons.append(f"Based on your {int(ctx.chest)} cm chest, your base size is generally a match for this.")

        if ctx.brand_name.lower() == "zara":
            reasons.append("Zara runs small, so we sized up for a better fit.")

        if ctx.fit_preference.lower() in ["relaxed", "oversized"]:
            reasons.append(f"Since you prefer a {ctx.fit_preference.lower()} fit, {recommended_size} is the best match.")
        elif ctx.fit_preference.lower() == "slim":
            reasons.append(f"Since you prefer a slim fit, {recommended_size} will give you that tailored look.")

        if alternatives:
            reasons.append(f"If you want a looser fit, {alternatives[0]} would work as well.")

        # Say plainly when the size comes from the general chart rather than
        # anything known about this brand.
        if not BrandEngine.has_brand_data(ctx.brand_name):
            reasons.append("This uses a general size chart. Brands vary, so check this brand's own size chart before you buy.")

        return reasons
