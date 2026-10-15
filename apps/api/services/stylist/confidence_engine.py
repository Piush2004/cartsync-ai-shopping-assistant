from .types import StylistContext, ConfidenceBreakdown

class ConfidenceEngine:
    @staticmethod
    def calculate(ctx: StylistContext) -> ConfidenceBreakdown:
        # Dummy confidence model based on available data
        measurement_conf = 0.98 if ctx.chest > 0 else 0.50
        brand_conf = 0.88 if ctx.brand_name.lower() in ["nike", "zara", "uniqlo"] else 0.70
        pref_conf = 0.91 if ctx.fit_preference else 0.60
        
        overall = (measurement_conf * 0.5) + (brand_conf * 0.3) + (pref_conf * 0.2)
        
        return ConfidenceBreakdown(
            overall=round(overall, 2),
            measurement=measurement_conf,
            brand=brand_conf,
            preference=pref_conf
        )
