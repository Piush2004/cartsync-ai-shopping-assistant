from .types import StylistContext, ConfidenceBreakdown
from typing import List

class ExplanationEngine:
    @staticmethod
    def generate(ctx: StylistContext, recommended_size: str, alternatives: List[str]) -> List[str]:
        reasons = []
        reasons.append(f"Based on your {int(ctx.chest)} cm chest, your base size is generally a match for this.")
        
        if ctx.brand_name.lower() == "zara":
            reasons.append("Zara runs small, so we sized up for a better fit.")
            
        if ctx.fit_preference.lower() in ["relaxed", "oversized"]:
            reasons.append(f"Since you prefer a {ctx.fit_preference.lower()} fit, {recommended_size} is the best match.")
        elif ctx.fit_preference.lower() == "slim":
            reasons.append(f"Since you prefer a slim fit, {recommended_size} will give you that tailored look.")
            
        if alternatives:
            reasons.append(f"If you want a looser fit, {alternatives[0]} would work as well.")
            
        return reasons
